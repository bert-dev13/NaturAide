import fs from "fs";
import path from "path";
import os from "os";
import pool from "@/lib/db";
import { ensureDockingSchema } from "@/lib/docking-schema";
import { describeStructure, type StructureHit } from "@/lib/docking-rcsb";
import {
  detectDockingEngine,
  downloadAndPrepReceptor,
  getDockingPaths,
  inspectPdbqt,
  prepareLigand,
  runVinaSimulation,
} from "@/lib/docking-service";
import { buildStage3LiteratureQuery, queryLiterature } from "@/lib/literature-service";
import {
  ensureReviewTables,
  findDefaultExpertReviewerId,
  findReviewerForArea,
} from "@/lib/expert-review-assignment";

export class DockingRequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type Settings = { exhaustiveness: number; numModes: number; seed: number; energyRange: number };
type Grid = {
  center: [number, number, number];
  size: [number, number, number];
  source: string;
  ligandLabel: string | null;
  method: string | null;
};
type Site = {
  resname: string;
  chain: string;
  seq: string;
  heavyAtoms: number;
  center: [number, number, number];
  size: [number, number, number];
};

type QueueState = {
  ligands: Set<number>;
  receptors: Set<number>;
  runs: number[];
  active: Set<number>;
  draining: boolean;
};

function queue(): QueueState {
  const g = globalThis as typeof globalThis & { __naDockQueue?: QueueState };
  if (!g.__naDockQueue) {
    g.__naDockQueue = { ligands: new Set(), receptors: new Set(), runs: [], active: new Set(), draining: false };
  }
  return g.__naDockQueue;
}

const SITE_METHOD =
  "Search box taken from the co-crystallized ligand extent, plus 8 Å padding on each side (minimum 20 Å).";

function json<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clip(value: string, max = 400_000) {
  return value.length > max ? value.slice(0, max) : value;
}

function iso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function finiteTriple(value: unknown): [number, number, number] | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const nums = value.slice(0, 3).map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return [nums[0], nums[1], nums[2]];
}

export function validateSearchBox(grid: Grid, settings: Settings): string | null {
  if (grid.center.some((n) => !Number.isFinite(n)) || grid.size.some((n) => !Number.isFinite(n) || n <= 0)) {
    return "Binding site configuration required";
  }
  if (grid.size.some((n) => n > 80)) {
    return "Each grid dimension must be between 0 and 80 Å. Enter the binding-site box rather than an arbitrary volume.";
  }
  if (!Number.isInteger(settings.exhaustiveness) || settings.exhaustiveness < 1 || settings.exhaustiveness > 32) {
    return "Exhaustiveness must be an integer from 1 to 32.";
  }
  if (!Number.isInteger(settings.numModes) || settings.numModes < 1 || settings.numModes > 20) {
    return "Number of poses must be an integer from 1 to 20.";
  }
  return null;
}

function readGrid(raw: unknown): Grid | null {
  const parsed = json<any>(raw, null);
  if (!parsed) return null;
  const center = finiteTriple(parsed.center);
  const size = finiteTriple(parsed.size);
  if (!center || !size || typeof parsed.source !== "string") return null;
  return {
    center,
    size,
    source: parsed.source,
    ligandLabel: parsed.ligandLabel ? String(parsed.ligandLabel) : null,
    method: parsed.method ? String(parsed.method) : null,
  };
}

function readSettings(raw: unknown): Settings | null {
  const parsed = json<any>(raw, null);
  if (!parsed) return null;
  const exhaustiveness = Number(parsed.exhaustiveness);
  const numModes = Number(parsed.numModes);
  if (!Number.isInteger(exhaustiveness) || !Number.isInteger(numModes)) return null;
  return {
    exhaustiveness,
    numModes,
    seed: Number.isInteger(Number(parsed.seed)) ? Number(parsed.seed) : 42,
    energyRange: Number.isFinite(Number(parsed.energyRange)) ? Number(parsed.energyRange) : 3,
  };
}

function readSites(raw: unknown): Site[] {
  const parsed = json<any[]>(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((site) => {
    const center = finiteTriple(site?.center);
    const size = finiteTriple(site?.size);
    if (!center || !size || !site?.resname) return [];
    return [{
      resname: String(site.resname),
      chain: String(site.chain || ""),
      seq: String(site.seq || ""),
      heavyAtoms: Number(site.heavyAtoms) || 0,
      center,
      size,
    }];
  });
}

function ligandPrefix(projectId: number, compoundId: number) {
  return path.join(getDockingPaths().artifactDir, `project-${projectId}`, "ligands", String(compoundId));
}

function receptorPrefix(projectId: number, pdbId: string) {
  return path.join(getDockingPaths().artifactDir, `project-${projectId}`, "receptors", pdbId.toLowerCase());
}

async function selectedCompounds(projectId: number) {
  const [rows]: any = await pool.query(
    `SELECT id, compoundName, iupacName, smiles, molecularFormula, molecularWeight, pubchemId, sourceProvenance, selectedForDocking
     FROM research_compounds WHERE projectId = ? AND selectedForDocking = 1 ORDER BY id ASC`,
    [projectId]
  );
  return rows as any[];
}

async function fetchPubChem(cid: string): Promise<{ smiles: string; formula: string | null; isomeric: boolean } | null> {
  const id = cid.replace(/\D/g, "");
  if (!id) return null;
  const urls = [
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${id}/property/IsomericSMILES,CanonicalSMILES,MolecularFormula/JSON`,
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${id}/property/SMILES,MolecularFormula/JSON`,
  ];
  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    const row = data?.PropertyTable?.Properties?.[0];
    const smiles = row?.IsomericSMILES || row?.CanonicalSMILES || row?.ConnectivitySMILES || row?.SMILES;
    if (typeof smiles === "string" && smiles.trim()) {
      return { smiles: smiles.trim(), formula: row.MolecularFormula || null, isomeric: Boolean(row.IsomericSMILES) };
    }
  }
  return null;
}

async function upsertLigandPrep(projectId: number, compoundId: number, fields: Record<string, unknown>) {
  const [existing]: any = await pool.query(
    `SELECT id FROM docking_ligand_preps WHERE projectId = ? AND compoundId = ? LIMIT 1`,
    [projectId, compoundId]
  );
  const keys = Object.keys(fields);
  if (existing.length === 0) {
    await pool.query(
      `INSERT INTO docking_ligand_preps (projectId, compoundId, ${keys.join(", ")}) VALUES (?, ?, ${keys.map(() => "?").join(", ")})`,
      [projectId, compoundId, ...keys.map((key) => fields[key])]
    );
    return;
  }
  await pool.query(
    `UPDATE docking_ligand_preps SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE projectId = ? AND compoundId = ?`,
    [...keys.map((key) => fields[key]), projectId, compoundId]
  );
}

function scheduleLigand(projectId: number, compoundId: number) {
  const state = queue();
  if (state.ligands.has(compoundId)) return;
  state.ligands.add(compoundId);
  setImmediate(() => {
    void prepareCompound(projectId, compoundId).finally(() => state.ligands.delete(compoundId));
  });
}

function scheduleReceptor(projectId: number, targetId: number) {
  const state = queue();
  if (state.receptors.has(targetId)) return;
  state.receptors.add(targetId);
  setImmediate(() => {
    void prepareTarget(projectId, targetId).finally(() => state.receptors.delete(targetId));
  });
}

export async function beginPreparation(projectId: number, opts?: { compoundId?: number; targetId?: number; force?: boolean }) {
  await ensureDockingSchema();
  const engine = await detectDockingEngine();
  if (!engine.available) return { engine };

  const compounds = await selectedCompounds(projectId);
  const [preps]: any = await pool.query(`SELECT * FROM docking_ligand_preps WHERE projectId = ?`, [projectId]);
  for (const compound of compounds) {
    if (opts?.compoundId && compound.id !== opts.compoundId) continue;
    const prep = preps.find((row: any) => row.compoundId === compound.id);
    const fileOk = prep?.pdbqtPath ? inspectPdbqt(prep.pdbqtPath, "ligand").ok : false;
    const sameStructure = prep?.smiles && compound.smiles && prep.smiles === compound.smiles;
    if (!opts?.force && prep?.status === "READY" && fileOk && (sameStructure || !compound.smiles)) continue;
    if (!opts?.force && prep?.status === "FAILED") continue;
    const hasStructure = Boolean(String(compound.smiles || "").trim() || String(compound.pubchemId || "").trim());
    if (!hasStructure) {
      await upsertLigandPrep(projectId, compound.id, {
        status: "FAILED",
        errorMessage: "No molecular structure is recorded for this compound.",
        preparedAt: null,
        pdbqtPath: null,
      });
      continue;
    }
    await upsertLigandPrep(projectId, compound.id, { status: "PREPARING", errorMessage: null });
    scheduleLigand(projectId, compound.id);
  }

  const [targets]: any = await pool.query(`SELECT * FROM docking_targets WHERE projectId = ?`, [projectId]);
  for (const target of targets) {
    if (opts?.targetId && target.id !== opts.targetId) continue;
    if (!target.pdbId) continue;
    let sourceUrl = target.sourceUrl as string | null;
    if (!sourceUrl || target.status !== "STRUCTURE_VERIFIED") {
      const hit = await describeStructure(target.pdbId);
      if (!hit) {
        await pool.query(
          `UPDATE docking_targets SET prepStatus = 'FAILED', prepError = ?, status = 'NEEDS_VERIFICATION' WHERE id = ?`,
          [`PDB ${target.pdbId} could not be retrieved from RCSB.`, target.id]
        );
        continue;
      }
      sourceUrl = hit.rcsbUrl;
      const meta = json<any>(target.structureMeta, {});
      await pool.query(
        `UPDATE docking_targets
         SET status = 'STRUCTURE_VERIFIED', sourceUrl = ?, geneOrProtein = COALESCE(geneOrProtein, ?),
             organism = COALESCE(organism, ?), structureSource = ?, structureMeta = ?
         WHERE id = ?`,
        [
          hit.rcsbUrl,
          hit.gene,
          hit.organism,
          `RCSB PDB: ${hit.title}`.slice(0, 250),
          JSON.stringify({
            ...meta,
            title: hit.title,
            description: hit.description,
            gene: hit.gene,
            organism: hit.organism,
            method: hit.method,
            resolution: hit.resolution,
            pubmedId: hit.pubmedId,
            doi: hit.doi,
          }),
          target.id,
        ]
      );
    }
    const fileOk = target.receptorPdbqtPath ? inspectPdbqt(target.receptorPdbqtPath, "receptor").ok : false;
    const repaired = !target.sourceUrl;
    if (!opts?.force && target.prepStatus === "READY" && fileOk) continue;
    if (!opts?.force && target.prepStatus === "FAILED" && !repaired) continue;
    await pool.query(
      `UPDATE docking_targets SET prepStatus = 'PREPARING', prepError = NULL WHERE id = ? AND projectId = ?`,
      [target.id, projectId]
    );
    scheduleReceptor(projectId, target.id);
  }
  return { engine };
}

async function prepareCompound(projectId: number, compoundId: number) {
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM research_compounds WHERE id = ? AND projectId = ? LIMIT 1`,
      [compoundId, projectId]
    );
    const compound = rows[0];
    if (!compound) return;
    let smiles = String(compound.smiles || "").trim();
    let formula = compound.molecularFormula || null;
    let source = smiles ? "Project compound record" : "";
    const cid = String(compound.pubchemId || "").replace(/\D/g, "");
    if (!smiles && cid) {
      const fetched = await fetchPubChem(cid);
      if (!fetched) {
        await upsertLigandPrep(projectId, compoundId, {
          status: "FAILED",
          pubchemCid: cid,
          errorMessage: "Ligand preparation failed. PubChem did not return a structure for this CID.",
        });
        return;
      }
      smiles = fetched.smiles;
      formula = formula || fetched.formula;
      source = `PubChem CID ${cid} (${fetched.isomeric ? "isomeric" : "canonical"} SMILES)`;
      await pool.query(`UPDATE research_compounds SET smiles = ? WHERE id = ? AND (smiles IS NULL OR smiles = '')`, [
        smiles,
        compoundId,
      ]);
    } else if (smiles && cid) {
      source = `Project compound record; PubChem CID ${cid}`;
    }
    if (!smiles) {
      await upsertLigandPrep(projectId, compoundId, {
        status: "FAILED",
        errorMessage: "No molecular structure is recorded for this compound.",
      });
      return;
    }
    const prepared = await prepareLigand(smiles, ligandPrefix(projectId, compoundId));
    if (!prepared.ok || !prepared.pdbqt) {
      await upsertLigandPrep(projectId, compoundId, {
        status: "FAILED",
        smiles,
        pubchemCid: cid || null,
        formula,
        structureSource: source,
        errorMessage: `Ligand preparation failed. ${prepared.error || "The structure could not be converted to PDBQT."}`,
      });
      return;
    }
    const inspection = inspectPdbqt(prepared.pdbqt, "ligand");
    if (!inspection.ok) {
      await upsertLigandPrep(projectId, compoundId, {
        status: "FAILED",
        smiles,
        structureSource: source,
        errorMessage: `Ligand preparation failed. ${inspection.error}`,
      });
      return;
    }
    await upsertLigandPrep(projectId, compoundId, {
      status: "READY",
      smiles,
      pubchemCid: cid || null,
      formula: prepared.formula || formula,
      structureSource: source,
      method: prepared.method || null,
      pdbqtPath: prepared.pdbqt,
      heavyAtoms: prepared.heavyAtoms ?? null,
      torsions: prepared.torsions ?? null,
      molecularWeight: prepared.molecularWeight ?? null,
      errorMessage: null,
      preparedAt: new Date(),
    });
  } catch (error: any) {
    await upsertLigandPrep(projectId, compoundId, {
      status: "FAILED",
      errorMessage: `Ligand preparation failed. ${error?.message || "Unexpected preparation error."}`,
    }).catch(() => undefined);
  }
}

async function writeSettings(projectId: number, settings: Settings) {
  const payload = JSON.stringify(settings);
  const [existing]: any = await pool.query(`SELECT id FROM docking_setups WHERE projectId = ? LIMIT 1`, [projectId]);
  if (existing.length) {
    await pool.query(`UPDATE docking_setups SET gridConfigJson = ?, softwareEngine = 'AutoDock Vina' WHERE projectId = ?`, [
      payload,
      projectId,
    ]);
  } else {
    await pool.query(
      `INSERT INTO docking_setups (projectId, softwareEngine, gridConfigJson, dockingParameters)
       VALUES (?, 'AutoDock Vina', ?, ?)`,
      [projectId, payload, `exhaustiveness = ${settings.exhaustiveness}, num_modes = ${settings.numModes}`]
    );
  }
}

async function writeGrid(projectId: number, targetId: number, grid: Grid) {
  await pool.query(
    `UPDATE docking_targets SET gridConfigJson = ? WHERE id = ? AND projectId = ?`,
    [JSON.stringify(grid), targetId, projectId]
  );
}

async function prepareTarget(projectId: number, targetId: number) {
  const [rows]: any = await pool.query(`SELECT * FROM docking_targets WHERE id = ? AND projectId = ? LIMIT 1`, [
    targetId,
    projectId,
  ]);
  const target = rows[0];
  if (!target?.pdbId) return;
  try {
    const prepared = await downloadAndPrepReceptor(target.pdbId, receptorPrefix(projectId, target.pdbId));
    if (!prepared.ok || !prepared.pdbqt) {
      await pool.query(
        `UPDATE docking_targets SET prepStatus = 'FAILED', prepError = ? WHERE id = ?`,
        [`Receptor preparation failed. ${prepared.error || "The PDB could not be converted to a Vina receptor."}`, targetId]
      );
      return;
    }
    const inspection = inspectPdbqt(prepared.pdbqt, "receptor");
    if (!inspection.ok) {
      await pool.query(
        `UPDATE docking_targets SET prepStatus = 'FAILED', prepError = ? WHERE id = ?`,
        [`Receptor preparation failed. ${inspection.error}`, targetId]
      );
      return;
    }
    const meta = json<any>(target.structureMeta, {});
    const nextMeta = {
      ...meta,
      title: prepared.title || meta.title || null,
      chain: prepared.chain || null,
      residues: prepared.residues || null,
      atoms: prepared.atoms || inspection.atoms,
      pdbUrl: `https://files.rcsb.org/download/${String(target.pdbId).toUpperCase()}.pdb`,
    };
    const sites = prepared.sites || [];
    await pool.query(
      `UPDATE docking_targets
       SET prepStatus = 'READY', prepError = NULL, prepMethod = ?, receptorPdbqtPath = ?, cleanPdbPath = ?,
           structureMeta = ?, detectedSites = ?, preparedAt = ?
       WHERE id = ?`,
      [
        prepared.method || null,
        prepared.pdbqt,
        prepared.cleanPdb || null,
        JSON.stringify(nextMeta),
        JSON.stringify(sites),
        new Date(),
        targetId,
      ]
    );
    const current = readGrid(target.gridConfigJson);
    const researcherSet = current?.source.startsWith("Researcher");
    if (!researcherSet && sites.length === 1) {
      const site = sites[0];
      await writeGrid(projectId, targetId, {
        center: site.center,
        size: site.size,
        source: `Co-crystallized ligand ${site.resname} ${site.chain}:${site.seq}`,
        ligandLabel: `${site.resname} ${site.chain}:${site.seq}`,
        method: SITE_METHOD,
      });
      const [setupRows]: any = await pool.query(`SELECT gridConfigJson FROM docking_setups WHERE projectId = ? LIMIT 1`, [projectId]);
      if (!readSettings(setupRows[0]?.gridConfigJson)) {
        await writeSettings(projectId, { exhaustiveness: 8, numModes: 9, seed: 42, energyRange: 3 });
      }
    }
  } catch (error: any) {
    await pool.query(`UPDATE docking_targets SET prepStatus = 'FAILED', prepError = ? WHERE id = ?`, [
      `Receptor preparation failed. ${error?.message || "Unexpected preparation error."}`,
      targetId,
    ]);
  }
}

async function reconcileRuns(projectId: number) {
  const state = queue();
  const live = new Set<number>([...state.runs, ...state.active]);
  const [rows]: any = await pool.query(
    `SELECT id FROM docking_runs
     WHERE projectId = ? AND resultProvenance = 'NATUREAIDE_VINA'
       AND jobStatus IN ('QUEUED','PREPARING','DOCKING','PROCESSING')`,
    [projectId]
  );
  for (const row of rows) {
    if (live.has(row.id)) continue;
    await pool.query(
      `UPDATE docking_runs
       SET jobStatus = 'FAILED', engineStatus = 'FAILED', bindingAffinity = NULL, posesJson = NULL,
           errorMessage = ?, completedAt = NOW(3)
       WHERE id = ?`,
      ["The docking process stopped before AutoDock Vina finished. No affinity was recorded.", row.id]
    );
  }
}

function getMaxConcurrency(): number {
  const envVal = process.env.MAX_CONCURRENT_DOCKING_JOBS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return Math.min(6, parsed);
  }
  const cpus = os.cpus()?.length || 4;
  return Math.min(3, Math.max(1, Math.floor(cpus / 3)));
}

function enqueueRun(runId: number) {
  const state = queue();
  if (!state.runs.includes(runId) && !state.active.has(runId)) state.runs.push(runId);
  setImmediate(() => {
    void drainRuns();
  });
}

async function drainRuns() {
  const state = queue();
  const maxConcurrency = getMaxConcurrency();

  while (state.runs.length > 0 && state.active.size < maxConcurrency) {
    const id = state.runs.shift()!;
    state.active.add(id);

    (async () => {
      try {
        await executeRun(id);
      } catch (err) {
        console.error(`Docking run ${id} execution error:`, err);
      } finally {
        state.active.delete(id);
        if (state.runs.length > 0) {
          void drainRuns();
        }
      }
    })();
  }
}

async function pairReady(projectId: number, compoundId: number, targetId: number) {
  const engine = await detectDockingEngine(false);
  if (!engine.available) return { ok: false as const, error: engine.error || "Docking engine unavailable" };

  const [compounds]: any = await pool.query(
    `SELECT id, compoundName FROM research_compounds WHERE id = ? AND projectId = ? LIMIT 1`,
    [compoundId, projectId]
  );
  if (!compounds.length) return { ok: false as const, error: "Compound not found in project" };

  const [preps]: any = await pool.query(
    `SELECT * FROM docking_ligand_preps WHERE projectId = ? AND compoundId = ? LIMIT 1`,
    [projectId, compoundId]
  );
  const prep = preps[0];
  const ligandFile = prep?.status === "READY" && prep?.pdbqtPath ? inspectPdbqt(prep.pdbqtPath, "ligand") : { ok: false, error: prep?.errorMessage || "Ligand preparation not ready" };
  if (!ligandFile.ok) return { ok: false as const, error: ligandFile.error || "Ligand preparation failed" };

  const [targets]: any = await pool.query(
    `SELECT * FROM docking_targets WHERE id = ? AND projectId = ? LIMIT 1`,
    [targetId, projectId]
  );
  const target = targets[0];
  if (!target) return { ok: false as const, error: "Target not found in project" };

  const receptorFile = target.prepStatus === "READY" && target.receptorPdbqtPath ? inspectPdbqt(target.receptorPdbqtPath, "receptor") : { ok: false, error: target.prepError || "Receptor preparation not ready" };
  if (!receptorFile.ok) return { ok: false as const, error: receptorFile.error || "Target receptor is not ready for Vina" };

  const [setupRows]: any = await pool.query(
    `SELECT gridConfigJson FROM docking_setups WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  const settings = readSettings(setupRows[0]?.gridConfigJson) || { exhaustiveness: 8, numModes: 9, seed: 42, energyRange: 3 };
  const grid = readGrid(target.gridConfigJson);
  if (!grid) return { ok: false as const, error: "Binding site configuration required" };

  const problem = validateSearchBox(grid, settings);
  if (problem) return { ok: false as const, error: problem };

  return {
    ok: true as const,
    ligand: { id: compoundId, compoundName: compounds[0].compoundName },
    target: { id: targetId, targetName: target.targetName, pdbId: target.pdbId },
    settings,
    grid,
  };
}

export async function requestRun(projectId: number, compoundId: number, targetId: number) {
  await ensureDockingSchema();
  const ready = await pairReady(projectId, compoundId, targetId);
  if (!ready.ok) throw new DockingRequestError(ready.error);
  const [existing]: any = await pool.query(
    `SELECT id, jobStatus FROM docking_runs
     WHERE projectId = ? AND compoundId = ? AND targetId = ? AND resultProvenance = 'NATUREAIDE_VINA'
     ORDER BY id DESC LIMIT 1`,
    [projectId, compoundId, targetId]
  );
  const active = existing[0] && ["QUEUED", "PREPARING", "DOCKING", "PROCESSING"].includes(existing[0].jobStatus);
  if (active && (queue().runs.includes(existing[0].id) || queue().active.has(existing[0].id))) {
    return { runId: existing[0].id, alreadyRunning: true };
  }

  // Preserve completed scientific runs: if latest run already finished (COMPLETED or FAILED), insert a NEW run
  let runId: number;
  if (existing[0] && !["COMPLETED", "FAILED"].includes(existing[0].jobStatus)) {
    runId = existing[0].id;
    await pool.query(
      `UPDATE docking_runs
       SET jobStatus = 'QUEUED', engineStatus = 'QUEUED', dataSource = 'VINA', bindingAffinity = NULL,
           posesJson = NULL, vinaLog = NULL, stdoutText = NULL, stderrText = NULL, exitCode = NULL,
           errorMessage = NULL, poseCount = NULL, outputPdbqtPath = NULL, logPath = NULL,
           completedAt = NULL, startedAt = NULL, vinaVersion = NULL, literatureJson = NULL
       WHERE id = ? AND projectId = ?`,
      [runId, projectId]
    );
  } else {
    const [inserted]: any = await pool.query(
      `INSERT INTO docking_runs (
         projectId, compoundId, targetId, ligandName, targetProtein, pdbId,
         dataSource, engineStatus, jobStatus, resultProvenance, units
       ) VALUES (?, ?, ?, ?, ?, ?, 'VINA', 'QUEUED', 'QUEUED', 'NATUREAIDE_VINA', 'kcal/mol')`,
      [projectId, compoundId, targetId, ready.ligand.compoundName, ready.target.targetName, ready.target.pdbId]
    );
    runId = inserted.insertId;
  }
  enqueueRun(runId);
  return { runId, alreadyRunning: false };
}

export async function requestRunAll(projectId: number) {
  const workspace = await loadDockingWorkspace(projectId);
  const started: number[] = [];
  for (const job of workspace.jobs) {
    if (!job.ready || job.active) continue;
    // Prevent duplicate runs: skip completed jobs that already have valid affinity
    if (job.status === "COMPLETED" && job.affinity != null) continue;
    const result = await requestRun(projectId, job.compoundId, job.targetId);
    started.push(result.runId);
  }
  return { started };
}

async function executeRun(runId: number) {
  const [rows]: any = await pool.query(`SELECT * FROM docking_runs WHERE id = ? LIMIT 1`, [runId]);
  const run = rows[0];
  if (!run || run.resultProvenance !== "NATUREAIDE_VINA") return;
  const projectId = run.projectId as number;
  const fail = async (message: string, extra: Record<string, unknown> = {}) => {
    await pool.query(
      `UPDATE docking_runs
       SET jobStatus = 'FAILED', engineStatus = 'FAILED', bindingAffinity = NULL, posesJson = NULL,
           errorMessage = ?, completedAt = NOW(3), exitCode = ?, stdoutText = ?, stderrText = ?, vinaLog = ?
       WHERE id = ?`,
      [
        clip(message, 4000),
        extra.exitCode ?? null,
        extra.stdout ? clip(String(extra.stdout)) : null,
        extra.stderr ? clip(String(extra.stderr)) : null,
        extra.log ? clip(String(extra.log)) : null,
        runId,
      ]
    );
  };

  try {
    await pool.query(
      `UPDATE docking_runs SET jobStatus = 'PREPARING', engineStatus = 'PREPARING', startedAt = COALESCE(startedAt, NOW(3)) WHERE id = ?`,
      [runId]
    );
    const engine = await detectDockingEngine(false);
    if (!engine.available || !engine.vinaVersion) {
      await fail(engine.error || "Docking engine unavailable. AutoDock Vina could not be found on the server.");
      return;
    }
    const ready = await pairReady(projectId, run.compoundId, run.targetId);
    if (!ready.ok) {
      await fail(ready.error);
      return;
    }
    const [prepRows]: any = await pool.query(
      `SELECT * FROM docking_ligand_preps WHERE projectId = ? AND compoundId = ? LIMIT 1`,
      [projectId, run.compoundId]
    );
    const [targetRows]: any = await pool.query(`SELECT * FROM docking_targets WHERE id = ? LIMIT 1`, [run.targetId]);
    const prep = prepRows[0];
    const target = targetRows[0];
    const ligandFile = inspectPdbqt(prep?.pdbqtPath, "ligand");
    const receptorFile = inspectPdbqt(target?.receptorPdbqtPath, "receptor");
    if (!ligandFile.ok || !receptorFile.ok) {
      await fail(ligandFile.ok ? receptorFile.error || "Receptor preparation failed" : prep?.errorMessage || "Ligand preparation failed");
      return;
    }

    const outDir = path.join(getDockingPaths().artifactDir, `project-${projectId}`, "jobs", String(runId));
    fs.mkdirSync(outDir, { recursive: true });
    const config = {
      center: { x: ready.grid.center[0], y: ready.grid.center[1], z: ready.grid.center[2] },
      size: { x: ready.grid.size[0], y: ready.grid.size[1], z: ready.grid.size[2] },
      exhaustiveness: ready.settings.exhaustiveness,
      numModes: ready.settings.numModes,
      seed: ready.settings.seed,
      energyRange: ready.settings.energyRange,
      gridSource: ready.grid.source,
      gridMethod: ready.grid.method,
      ligandPdbqt: prep.pdbqtPath,
      receptorPdbqt: target.receptorPdbqtPath,
    };
    await pool.query(
      `UPDATE docking_runs
       SET jobStatus = 'DOCKING', engineStatus = 'DOCKING', vinaVersion = ?, configJson = ?, ligandPrepJson = ?, receptorPrepJson = ?
       WHERE id = ?`,
      [
        engine.vinaVersion,
        JSON.stringify(config),
        JSON.stringify({
          smiles: prep.smiles,
          pubchemCid: prep.pubchemCid,
          structureSource: prep.structureSource,
          method: prep.method,
          pdbqt: path.basename(prep.pdbqtPath),
          preparedAt: iso(prep.preparedAt),
        }),
        JSON.stringify({
          pdbId: target.pdbId,
          sourceUrl: target.sourceUrl,
          method: target.prepMethod,
          pdbqt: path.basename(target.receptorPdbqtPath),
          preparedAt: iso(target.preparedAt),
        }),
        runId,
      ]
    );

    const executed = await runVinaSimulation({
      receptorPdbqt: target.receptorPdbqtPath,
      ligandPdbqt: prep.pdbqtPath,
      centerX: ready.grid.center[0],
      centerY: ready.grid.center[1],
      centerZ: ready.grid.center[2],
      sizeX: ready.grid.size[0],
      sizeY: ready.grid.size[1],
      sizeZ: ready.grid.size[2],
      exhaustiveness: ready.settings.exhaustiveness,
      numModes: ready.settings.numModes,
      seed: ready.settings.seed,
      energyRange: ready.settings.energyRange,
      outputPdbqtPath: path.join(outDir, "poses.pdbqt"),
      logPath: path.join(outDir, "vina.log"),
    });

    await pool.query(`UPDATE docking_runs SET jobStatus = 'PROCESSING', engineStatus = 'PROCESSING' WHERE id = ?`, [runId]);
    const version = executed.version || engine.vinaVersion;
    if (!executed.ok || executed.bestAffinity == null || executed.poses.length === 0) {
      await fail(executed.error || "AutoDock Vina did not produce a binding affinity.", {
        exitCode: executed.exitCode,
        stdout: executed.rawStdout,
        stderr: executed.rawStderr,
        log: executed.rawStdout,
      });
      await pool.query(`UPDATE docking_runs SET vinaVersion = ? WHERE id = ?`, [version, runId]);
      return;
    }

    const best = executed.poses.reduce((a, b) => (b.affinity < a.affinity ? b : a));
    await pool.query(
      `UPDATE docking_runs SET
         jobStatus = 'COMPLETED', engineStatus = 'COMPLETED', dataSource = 'VINA', resultProvenance = 'NATUREAIDE_VINA',
         bindingAffinity = ?, units = 'kcal/mol', dockingPose = ?, dockingRank = ?, poseCount = ?, posesJson = ?,
         vinaVersion = ?, vinaLog = ?, stdoutText = ?, stderrText = ?, exitCode = ?,
         outputPdbqtPath = ?, logPath = ?, resultFilePath = ?, errorMessage = NULL, completedAt = NOW(3)
       WHERE id = ?`,
      [
        String(best.affinity),
        `Mode ${best.mode}`,
        best.mode,
        executed.poses.length,
        JSON.stringify(executed.poses),
        version,
        clip(`${executed.rawStdout}\n${executed.rawStderr}`),
        clip(executed.rawStdout),
        clip(executed.rawStderr),
        executed.exitCode,
        executed.outputPdbqtPath || null,
        executed.logPath || null,
        executed.outputPdbqtPath ? path.basename(executed.outputPdbqtPath) : null,
        runId,
      ]
    );
    try {
      await pool.query(
        `DELETE FROM project_evidence_items WHERE projectId = ? AND associatedResultType = 'DOCKING' AND associatedResultId = ?`,
        [projectId, runId]
      );
      await pool.query(
        `INSERT INTO project_evidence_items (
           projectId, evidenceClass, stageKey, title, summary, targetCompound, targetBiological,
           assayOrEndpoint, numericalValue, unit, associatedResultId, associatedResultType, isVerified, verificationSource
         ) VALUES (?, 'PREDICTED', 'docking', ?, ?, ?, ?, 'binding affinity', ?, 'kcal/mol', ?, 'DOCKING', 0, ?)`,
        [
          projectId,
          `${run.ligandName} x ${run.targetProtein}`,
          "AutoDock Vina predicted binding affinity. This is not experimental validation.",
          run.ligandName,
          run.targetProtein,
          String(best.affinity),
          runId,
          `NatureAide · ${version}`,
        ]
      );
    } catch (evidenceError) {
      console.error("Docking evidence catalog update failed", evidenceError);
    }
  } catch (error: any) {
    await fail(error?.message || "Docking failed before a result could be read.");
  }
}

export async function addVerifiedTarget(projectId: number, pdbId: string) {
  await ensureDockingSchema();
  const hit = await describeStructure(pdbId);
  if (!hit) throw new DockingRequestError(`PDB ${pdbId} could not be retrieved from RCSB.`, 422);
  const [dupe]: any = await pool.query(
    `SELECT id FROM docking_targets WHERE projectId = ? AND pdbId = ? LIMIT 1`,
    [projectId, hit.pdbId]
  );
  if (dupe.length) return { targetId: dupe[0].id, created: false };
  const meta = {
    title: hit.title,
    description: hit.description,
    gene: hit.gene,
    organism: hit.organism,
    method: hit.method,
    resolution: hit.resolution,
    pubmedId: hit.pubmedId,
    doi: hit.doi,
  };
  const [inserted]: any = await pool.query(
    `INSERT INTO docking_targets (
       projectId, targetName, geneOrProtein, organism, pdbId, structureSource, sourceUrl, structureMeta, status, prepStatus
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'STRUCTURE_VERIFIED', 'PREPARING')`,
    [
      projectId,
      hit.description.slice(0, 191),
      hit.gene,
      hit.organism,
      hit.pdbId,
      `RCSB PDB: ${hit.title}`.slice(0, 250),
      hit.rcsbUrl,
      JSON.stringify(meta),
    ]
  );
  scheduleReceptor(projectId, inserted.insertId);
  return { targetId: inserted.insertId, created: true, pdbId: hit.pdbId };
}

export async function removeTarget(projectId: number, targetId: number) {
  await ensureDockingSchema();
  const [runs]: any = await pool.query(`SELECT id FROM docking_runs WHERE projectId = ? AND targetId = ?`, [projectId, targetId]);
  for (const run of runs) {
    await pool.query(
      `DELETE FROM project_evidence_items WHERE projectId = ? AND associatedResultType = 'DOCKING' AND associatedResultId = ?`,
      [projectId, run.id]
    );
  }
  await pool.query(`DELETE FROM docking_runs WHERE projectId = ? AND targetId = ?`, [projectId, targetId]);
  await pool.query(`DELETE FROM docking_targets WHERE projectId = ? AND id = ?`, [projectId, targetId]);
}

export async function saveConfiguration(
  projectId: number,
  input: { exhaustiveness: number; numModes: number; targets: Array<{ targetId: number; cx: number; cy: number; cz: number; sx: number; sy: number; sz: number }> }
) {
  await ensureDockingSchema();
  const settings: Settings = {
    exhaustiveness: Number(input.exhaustiveness),
    numModes: Number(input.numModes),
    seed: 42,
    energyRange: 3,
  };
  if (!input.targets?.length) throw new DockingRequestError("Binding site configuration required");
  const asNumber = (value: unknown) => {
    if (typeof value === "string" && value.trim() === "") return Number.NaN;
    return Number(value);
  };
  for (const target of input.targets) {
    const grid: Grid = {
      center: [asNumber(target.cx), asNumber(target.cy), asNumber(target.cz)],
      size: [asNumber(target.sx), asNumber(target.sy), asNumber(target.sz)],
      source: "Researcher-configured binding site",
      ligandLabel: null,
      method: "Coordinates entered by the researcher.",
    };
    const problem = validateSearchBox(grid, settings);
    if (problem) throw new DockingRequestError(problem);
    const [owns]: any = await pool.query(`SELECT id FROM docking_targets WHERE id = ? AND projectId = ?`, [target.targetId, projectId]);
    if (!owns.length) throw new DockingRequestError("Target not found.", 404);
    await writeGrid(projectId, target.targetId, grid);
  }
  await writeSettings(projectId, settings);
}

export async function useDetectedSite(projectId: number, targetId: number, resname: string, chain: string, seq: string) {
  await ensureDockingSchema();
  const [rows]: any = await pool.query(`SELECT detectedSites, gridConfigJson FROM docking_targets WHERE id = ? AND projectId = ?`, [
    targetId,
    projectId,
  ]);
  if (!rows.length) throw new DockingRequestError("Target not found.", 404);
  const site = readSites(rows[0].detectedSites).find((item) => item.resname === resname && item.chain === chain && item.seq === seq);
  if (!site) throw new DockingRequestError("That co-crystallized ligand is not present in the retrieved PDB.");
  const [setupRows]: any = await pool.query(`SELECT gridConfigJson FROM docking_setups WHERE projectId = ? LIMIT 1`, [projectId]);
  const settings = readSettings(setupRows[0]?.gridConfigJson) || { exhaustiveness: 8, numModes: 9, seed: 42, energyRange: 3 };
  const grid: Grid = {
    center: site.center,
    size: site.size,
    source: `Co-crystallized ligand ${site.resname} ${site.chain}:${site.seq}`,
    ligandLabel: `${site.resname} ${site.chain}:${site.seq}`,
    method: SITE_METHOD,
  };
  const problem = validateSearchBox(grid, settings);
  if (problem) throw new DockingRequestError(problem);
  await writeGrid(projectId, targetId, grid);
  await writeSettings(projectId, settings);
}

export async function importExternalResult(projectId: number, body: any) {
  await ensureDockingSchema();
  const affinity = Number(body.bindingScore);
  if (!Number.isFinite(affinity)) throw new DockingRequestError("Enter the binding affinity as a number (kcal/mol).");
  const ligandName = String(body.ligandName || "").trim();
  const targetProtein = String(body.targetProtein || "").trim();
  if (!ligandName || !targetProtein) throw new DockingRequestError("A ligand and target are required.");
  const engineName = String(body.dockingEngine || "External docking workflow").trim() || "External docking workflow";
  const [inserted]: any = await pool.query(
    `INSERT INTO docking_runs (
       projectId, targetId, compoundId, ligandName, targetProtein, pdbId,
       dockingConfig, dataSource, engineStatus, jobStatus, bindingAffinity, units,
       interactingResidues, researcherInterpretation, resultProvenance, supportingFileUrl
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'MANUAL_ENTRY', 'EXTERNALLY_GENERATED', 'COMPLETED', ?, 'kcal/mol', ?, ?, 'EXTERNALLY_GENERATED', ?)`,
    [
      projectId,
      body.targetId || null,
      body.compoundId || null,
      ligandName,
      targetProtein,
      body.pdbId || null,
      engineName,
      String(affinity),
      body.bindingResidues || null,
      body.notes || null,
      body.supportingFileUrl || null,
    ]
  );
  await pool.query(
    `INSERT INTO project_evidence_items (
       projectId, evidenceClass, stageKey, title, summary, targetCompound, targetBiological,
       assayOrEndpoint, numericalValue, unit, associatedResultId, associatedResultType, isVerified, verificationSource
     ) VALUES (?, 'PREDICTED', 'docking', ?, ?, ?, ?, 'binding affinity', ?, 'kcal/mol', ?, 'DOCKING', 0, ?)`,
    [
      projectId,
      `${ligandName} × ${targetProtein}`,
      "Externally generated docking result imported by the researcher. NatureAide did not run this calculation.",
      ligandName,
      targetProtein,
      String(affinity),
      inserted.insertId,
      "Externally Generated",
    ]
  );
  return { insertedId: inserted.insertId };
}

export async function attachSupportingResearch(projectId: number, runId: number) {
  await ensureDockingSchema();
  const [runs]: any = await pool.query(
    `SELECT * FROM docking_runs WHERE id = ? AND projectId = ? AND resultProvenance = 'NATUREAIDE_VINA' AND jobStatus = 'COMPLETED' LIMIT 1`,
    [runId, projectId]
  );
  if (!runs.length) throw new DockingRequestError("Supporting literature is available after a NatureAide Vina result completes.", 404);
  const run = runs[0];
  const [projects]: any = await pool.query(
    `SELECT researchObjective, areaOfInterest FROM research_projects WHERE id = ? LIMIT 1`,
    [projectId]
  );
  const project = projects[0] || {};
  const [targets]: any = await pool.query(`SELECT targetName, geneOrProtein FROM docking_targets WHERE id = ? LIMIT 1`, [run.targetId]);
  const targetLabel = targets[0]?.geneOrProtein || targets[0]?.targetName || run.targetProtein;
  const query = buildStage3LiteratureQuery(run.ligandName, targetLabel, project.areaOfInterest || null);
  const found = await queryLiterature(query, {
    stageKey: "docking",
    targetCompound: run.ligandName,
    targetBiological: targetLabel,
    assayOrEndpoint: project.areaOfInterest || project.researchObjective || null,
    associatedResultType: "DOCKING",
    associatedResultId: runId,
    maxResults: 6,
  });
  const items = (found.items || []).flatMap((item) => {
    const pmid = String(item.pmid || "").match(/^\d{1,9}$/)?.[0] || null;
    const doi = String(item.doi || "").match(/10\.\d{4,9}\/\S+/)?.[0]?.replace(/[.,;]+$/, "") || null;
    if (!pmid && !doi) return [];
    return [{
      pmid,
      doi,
      title: item.title,
      authors: item.authors,
      journal: item.journal,
      year: item.publicationYear,
      pubmedUrl: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null,
      doiUrl: doi ? `https://doi.org/${doi}` : null,
    }];
  });
  await pool.query(`UPDATE docking_runs SET literatureJson = ? WHERE id = ?`, [JSON.stringify(items), runId]);
  return { items, disclaimer: found ? "Supporting literature is context only. It does not experimentally validate this docking result." : "" };
}

export async function saveDockingInterpretation(projectId: number, text: string, approve?: boolean) {
  await ensureDockingSchema();
  const [existing]: any = await pool.query(`SELECT id FROM research_docking_syntheses WHERE projectId = ? LIMIT 1`, [projectId]);
  if (existing.length) {
    await pool.query(`UPDATE research_docking_syntheses SET keyFindings = ? WHERE projectId = ?`, [text.trim() || null, projectId]);
  } else {
    await pool.query(`INSERT INTO research_docking_syntheses (projectId, keyFindings, status) VALUES (?, ?, 'IN_PROGRESS')`, [
      projectId,
      text.trim() || null,
    ]);
  }
  if (typeof approve === "boolean") {
    await pool.query(`UPDATE research_docking_syntheses SET status = ? WHERE projectId = ?`, [
      approve ? "COMPLETED" : "IN_PROGRESS",
      projectId,
    ]);
  }
}

export async function completeDockingStage(projectId: number, researcherId: number) {
  const workspace = await loadDockingWorkspace(projectId);
  if (!workspace.engine.available) throw new DockingRequestError(workspace.engine.error || "Docking engine unavailable");
  if (!workspace.ligands.length) throw new DockingRequestError("No docking candidates were received from Stage 2.");
  if (workspace.ligands.some((ligand) => !ligand.preparationReady)) {
    throw new DockingRequestError("Every selected ligand must be prepared before continuing.");
  }
  if (!workspace.targets.length || workspace.targets.some((target: any) => target.status !== "READY")) {
    throw new DockingRequestError("Every selected target must have a verified structure and a prepared receptor.");
  }
  if (!workspace.configuration.configured) throw new DockingRequestError("Binding site configuration required");
  if (workspace.jobs.some((job) => job.status !== "COMPLETED" || job.affinity == null)) {
    throw new DockingRequestError("Every ligand and target combination must have a completed AutoDock Vina result.");
  }

  // Ensure interpretation is saved
  if (!workspace.interpretation.text?.trim()) {
    throw new DockingRequestError("Complete your scientific interpretation before continuing.");
  }
  if (!workspace.interpretation.approved) {
    await saveDockingInterpretation(projectId, workspace.interpretation.text.trim(), true);
  }

  // 1. Mark Stage 3 Research Complete and unlock Stage 4
  await pool.query(
    `UPDATE research_project_stages SET status = 'COMPLETED', completedAt = NOW() WHERE projectId = ? AND stageKey = 'docking'`,
    [projectId]
  );
  await pool.query(
    `UPDATE research_project_stages SET status = 'IN_PROGRESS' WHERE projectId = ? AND stageKey = 'formulation-safety' AND status <> 'COMPLETED'`,
    [projectId]
  );
  await pool.query(
    `UPDATE research_projects
     SET currentStage = CASE
           WHEN currentStage IN ('plant-literature', 'evidence', 'evidence-review', 'in-silico', 'insilico', 'docking') THEN 'formulation-safety'
           ELSE currentStage
         END,
         progressPercent = GREATEST(progressPercent, 50),
         status = 'IN_PROGRESS',
         updatedAt = NOW()
     WHERE id = ?`,
    [projectId]
  );

  // 2. Automatically queue Stage 3 Professional Review for Pharmacologist (Pharmacology)
  await ensureReviewTables();
  const defaultReviewerId = await findDefaultExpertReviewerId();

  // Find or create review_submissions
  const [existingSub]: any = await pool.query(
    `SELECT id FROM review_submissions WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
    [projectId]
  );
  let submissionId = existingSub[0]?.id;
  if (!submissionId) {
    const [subInsert]: any = await pool.query(
      `INSERT INTO review_submissions (
         projectId, versionTag, reviewRound, status, submittedAt
       ) VALUES (?, 'v1.0', 1, 'IN_PROGRESS', NOW(3))`,
      [projectId]
    );
    submissionId = subInsert.insertId;
  }

  const pharmacologyReviewerId = (await findReviewerForArea("pharmacology")) || defaultReviewerId || 1;
  await pool.query(
    `INSERT INTO review_assignments (
       projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound, assignedAt
     ) VALUES (?, ?, ?, 'pharmacology', 'PENDING', 1, NOW(3))
     ON DUPLICATE KEY UPDATE status = 'PENDING', reviewerId = VALUES(reviewerId), updatedAt = NOW(3)`,
    [projectId, submissionId, pharmacologyReviewerId]
  );

  await pool.query(
    `INSERT INTO review_area_coverage (
       submissionId, projectId, areaKey, reviewerId, status
     ) VALUES (?, ?, 'pharmacology', ?, 'PENDING')
     ON DUPLICATE KEY UPDATE status = 'PENDING', reviewerId = VALUES(reviewerId), updatedAt = NOW(3)`,
    [submissionId, projectId, pharmacologyReviewerId]
  );

  await pool.query(
    `INSERT INTO review_section_status (
       submissionId, reviewerId, sectionKey, status
     ) VALUES (?, ?, 'pharmacology', 'NOT_REVIEWED')
     ON DUPLICATE KEY UPDATE status = 'NOT_REVIEWED'`,
    [submissionId, pharmacologyReviewerId]
  );

  await pool.query(
    `INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
     VALUES (?, ?, 'STAGE_COMPLETED', 'Completed Stage 3: Molecular Docking, queued Pharmacology professional review, and unlocked Stage 4: Formulation & Safety')`,
    [projectId, researcherId]
  );

  return { success: true, redirectUrl: `/researcher/projects/${projectId}/formulation-safety` };
}

export async function submitDockingStageForReview(projectId: number, researcherId: number) {
  const workspace = await loadDockingWorkspace(projectId);
  if (!workspace.engine.available) throw new DockingRequestError(workspace.engine.error || "Docking engine unavailable");
  if (!workspace.ligands.length) throw new DockingRequestError("No docking candidates were received from Stage 2.");
  if (workspace.ligands.some((ligand) => !ligand.preparationReady)) {
    throw new DockingRequestError("Every selected ligand must be prepared before submitting for review.");
  }
  if (!workspace.targets.length || workspace.targets.some((target: any) => target.status !== "READY")) {
    throw new DockingRequestError("Every selected target must have a verified structure and a prepared receptor.");
  }
  if (!workspace.configuration.configured) throw new DockingRequestError("Binding site configuration required");
  if (workspace.jobs.some((job) => job.status !== "COMPLETED" || job.affinity == null)) {
    throw new DockingRequestError("Every ligand and target combination must have a completed AutoDock Vina result.");
  }
  if (!workspace.interpretation.approved || !workspace.interpretation.text.trim()) {
    throw new DockingRequestError("Approve your interpretation before submitting for review.");
  }

  // Update research_project_stages
  await pool.query(
    `UPDATE research_project_stages SET status = 'UNDER_REVIEW', updatedAt = NOW(3) WHERE projectId = ? AND stageKey = 'docking'`,
    [projectId]
  );

  // Update project status
  await pool.query(
    `UPDATE research_projects SET status = 'UNDER_REVIEW', currentStage = 'docking', updatedAt = NOW(3) WHERE id = ?`,
    [projectId]
  );

  // Ensure review tables and assignments
  await ensureReviewTables();
  const defaultReviewerId = await findDefaultExpertReviewerId();

  // Find or create review_submissions
  const [existingSub]: any = await pool.query(
    `SELECT id FROM review_submissions WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
    [projectId]
  );
  let submissionId = existingSub[0]?.id;
  if (!submissionId) {
    const [subInsert]: any = await pool.query(
      `INSERT INTO review_submissions (
         projectId, versionTag, reviewRound, status, submittedAt
       ) VALUES (?, 'v1.0', 1, 'UNDER_REVIEW', NOW(3))`,
      [projectId]
    );
    submissionId = subInsert.insertId;
  } else {
    await pool.query(
      `UPDATE review_submissions SET status = 'UNDER_REVIEW', updatedAt = NOW(3) WHERE id = ?`,
      [submissionId]
    );
  }

  // Assign pharmacology reviewer
  const pharmacologyReviewerId = (await findReviewerForArea("pharmacology")) || defaultReviewerId || 1;
  await pool.query(
    `INSERT INTO review_assignments (
       projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound, assignedAt
     ) VALUES (?, ?, ?, 'pharmacology', 'PENDING', 1, NOW(3))
     ON DUPLICATE KEY UPDATE status = 'PENDING', reviewerId = VALUES(reviewerId), updatedAt = NOW(3)`,
    [projectId, submissionId, pharmacologyReviewerId]
  );

  await pool.query(
    `INSERT INTO review_area_coverage (
       submissionId, projectId, areaKey, reviewerId, status
     ) VALUES (?, ?, 'pharmacology', ?, 'PENDING')
     ON DUPLICATE KEY UPDATE status = 'PENDING', reviewerId = VALUES(reviewerId), updatedAt = NOW(3)`,
    [submissionId, projectId, pharmacologyReviewerId]
  );

  await pool.query(
    `INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
     VALUES (?, ?, 'STAGE_SUBMITTED', 'Stage 3 (Molecular Docking) submitted for Pharmacologist review.')`,
    [projectId, researcherId]
  );

  return { success: true };
}

export async function loadDockingWorkspace(projectId: number) {
  await ensureDockingSchema();
  await reconcileRuns(projectId);
  const engineInfo = await detectDockingEngine();
  const [projects]: any = await pool.query(
    `SELECT rp.id, rp.title, rp.researchObjective, rp.researchQuestion, rp.areaOfInterest,
            COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') AS plantName,
            p.scientificName AS plantScientificName
     FROM research_projects rp LEFT JOIN plants p ON rp.plantId = p.id WHERE rp.id = ? LIMIT 1`,
    [projectId]
  );
  const compounds = await selectedCompounds(projectId);
  const [preps]: any = await pool.query(`SELECT * FROM docking_ligand_preps WHERE projectId = ?`, [projectId]);
  const [targets]: any = await pool.query(`SELECT * FROM docking_targets WHERE projectId = ? ORDER BY id ASC`, [projectId]);
  const [setupRows]: any = await pool.query(`SELECT * FROM docking_setups WHERE projectId = ? LIMIT 1`, [projectId]);
  const [runs]: any = await pool.query(`SELECT * FROM docking_runs WHERE projectId = ? ORDER BY id DESC`, [projectId]);
  const [synthesisRows]: any = await pool.query(`SELECT * FROM research_docking_syntheses WHERE projectId = ? LIMIT 1`, [projectId]);
  const settings = readSettings(setupRows[0]?.gridConfigJson);

  const ligands = compounds.map((compound) => {
    const prep = preps.find((row: any) => row.compoundId === compound.id);
    const file = prep?.status === "READY" ? inspectPdbqt(prep.pdbqtPath, "ligand") : { ok: false, atoms: 0, error: prep?.errorMessage };
    const hasRecordedStructure = Boolean(String(compound.smiles || "").trim() || prep?.smiles);
    const preparationReady = prep?.status === "READY" && file.ok;
    const preparing = prep?.status === "PREPARING" || queue().ligands.has(compound.id);
    let issue: string | null = null;
    if (!preparationReady && !preparing) {
      issue = prep?.errorMessage || (!hasRecordedStructure && !compound.pubchemId
        ? "No molecular structure is recorded for this compound."
        : "Ligand preparation has not completed.");
    }
    return {
      id: compound.id,
      compoundName: compound.compoundName,
      molecularFormula: prep?.formula || compound.molecularFormula || null,
      molecularWeight: compound.molecularWeight || prep?.molecularWeight || null,
      smiles: prep?.smiles || compound.smiles || null,
      pubchemId: prep?.pubchemCid || compound.pubchemId || null,
      structureReady: hasRecordedStructure,
      preparationReady,
      status: preparationReady ? "READY" : preparing ? "PREPARING" : "NOT_READY",
      issue,
      prep: prep
        ? {
            method: prep.method,
            structureSource: prep.structureSource,
            preparedAt: iso(prep.preparedAt),
            pdbqt: prep.pdbqtPath ? path.basename(prep.pdbqtPath) : null,
            heavyAtoms: prep.heavyAtoms,
            torsions: prep.torsions,
          }
        : null,
    };
  });

  const targetViews = targets.map((target: any) => {
    const meta = json<any>(target.structureMeta, {});
    const grid = readGrid(target.gridConfigJson);
    const sites = readSites(target.detectedSites);
    const file = target.prepStatus === "READY" ? inspectPdbqt(target.receptorPdbqtPath, "receptor") : { ok: false, atoms: 0, error: target.prepError };
    const pdbRetrieved = target.status === "STRUCTURE_VERIFIED" && Boolean(target.pdbId && target.sourceUrl);
    const receptorPrepared = target.prepStatus === "READY" && file.ok;
    const vinaCompatible = receptorPrepared && engineInfo.available;
    const preparing = target.prepStatus === "PREPARING" || queue().receptors.has(target.id);
    const ready = pdbRetrieved && receptorPrepared && vinaCompatible && Boolean(grid && settings && !validateSearchBox(grid, settings!));
    let issue: string | null = null;
    if (!pdbRetrieved) issue = "PDB structure was not retrieved.";
    else if (target.prepStatus === "FAILED") issue = target.prepError || "Receptor preparation failed";
    else if (!receptorPrepared && !preparing) issue = file.error || "Receptor preparation failed";
    else if (receptorPrepared && !engineInfo.available) issue = engineInfo.error || "Docking engine unavailable. AutoDock Vina could not be found on the server.";
    else if (receptorPrepared && !grid) issue = sites.length > 1
      ? "Binding site configuration required. More than one co-crystallized ligand was found; choose the site to dock."
      : "Binding site configuration required";
    return {
      id: target.id,
      targetName: target.targetName,
      geneOrProtein: target.geneOrProtein,
      organism: target.organism,
      pdbId: target.pdbId,
      sourceUrl: target.sourceUrl,
      pdbRetrieved,
      receptorPrepared,
      vinaCompatible,
      gridConfigured: Boolean(grid && settings && !validateSearchBox(grid, settings)),
      status: ready ? "READY" : preparing ? "PREPARING" : "NOT_READY",
      issue,
      grid,
      detectedSites: sites,
      details: {
        title: meta.title || target.structureSource || null,
        description: meta.description || target.targetName,
        gene: meta.gene || target.geneOrProtein || null,
        organism: meta.organism || target.organism || null,
        method: meta.method || null,
        resolution: meta.resolution || null,
        pubmedId: meta.pubmedId || null,
        doi: meta.doi || null,
        chain: meta.chain || null,
        residues: meta.residues || null,
        atoms: meta.atoms || null,
        prepMethod: target.prepMethod || null,
        preparedAt: iso(target.preparedAt),
        pdbUrl: meta.pdbUrl || (target.pdbId ? `https://files.rcsb.org/download/${target.pdbId}.pdb` : null),
        receptorFile: target.receptorPdbqtPath ? path.basename(target.receptorPdbqtPath) : null,
      },
    };
  });

  const vinaRuns = runs.filter((run: any) => run.resultProvenance === "NATUREAIDE_VINA");
  const jobs = ligands.flatMap((ligand) =>
    targetViews.map((target: any) => {
      const pairRuns = vinaRuns.filter((row: any) => row.compoundId === ligand.id && row.targetId === target.id);
      const run = pairRuns[0]; // latest run since runs are ordered by id DESC
      const status = (run?.jobStatus || "IDLE") as string;
      const active = ["QUEUED", "PREPARING", "DOCKING", "PROCESSING"].includes(status);
      const affinity = run?.bindingAffinity != null && run.bindingAffinity !== "" ? Number(run.bindingAffinity) : null;
      const ready = ligand.preparationReady && target.status === "READY" && engineInfo.available;
      let blocked: string | null = null;
      if (!engineInfo.available) blocked = engineInfo.error || "Docking engine unavailable";
      else if (!ligand.preparationReady) blocked = ligand.issue || "Ligand preparation failed";
      else if (target.status !== "READY") blocked = target.issue || "Target is not ready";
      return {
        compoundId: ligand.id,
        targetId: target.id,
        ligandName: ligand.compoundName,
        targetName: target.targetName,
        pdbId: target.pdbId,
        runId: run?.id ?? null,
        status,
        active,
        ready: ready && !active,
        blockedReason: active ? null : blocked,
        affinity: status === "COMPLETED" && Number.isFinite(affinity) ? affinity : null,
        poseCount: run?.poseCount ?? null,
        error: run?.errorMessage || null,
        record: run && status === "COMPLETED" ? serializeRun(run, target) : null,
        history: pairRuns.map((r: any) => ({
          runId: r.id,
          affinity: r.bindingAffinity ? Number(r.bindingAffinity) : null,
          status: r.jobStatus,
          poseCount: r.poseCount,
          completedAt: iso(r.completedAt),
          startedAt: iso(r.startedAt),
          vinaVersion: r.vinaVersion,
          exitCode: r.exitCode,
          isCurrent: r.id === run?.id,
        })),
      };
    })
  );

  const externalRuns = runs
    .filter((run: any) => run.resultProvenance !== "NATUREAIDE_VINA" && run.bindingAffinity)
    .map((run: any) => ({
      id: run.id,
      ligandName: run.ligandName,
      targetName: run.targetProtein,
      pdbId: run.pdbId,
      affinity: Number(run.bindingAffinity),
      engineName: run.dockingConfig || "External docking workflow",
      notes: run.researcherInterpretation || null,
      sourceUrl: run.supportingFileUrl || null,
    }))
    .filter((run: any) => Number.isFinite(run.affinity));

  const synthesis = synthesisRows[0];
  const configurationConfigured = targetViews.length > 0 && targetViews.every((target: any) => target.gridConfigured);

  // Fetch stage status & reviewer feedback for pharmacology
  let stageStatus = "IN_PROGRESS";
  let reviewStatus = "NOT_SUBMITTED";
  let latestReview: any = null;
  let feedbackItems: any[] = [];
  try {
    const [stgRows]: any = await pool.query(
      `SELECT status FROM research_project_stages WHERE projectId = ? AND stageKey = 'docking' LIMIT 1`,
      [projectId]
    );
    if (stgRows[0]?.status) stageStatus = stgRows[0].status;

    const [revRows]: any = await pool.query(
      `SELECT pr.id, pr.assessment, pr.comments, pr.submittedAt, u.name as reviewerName
       FROM professional_reviews pr
       JOIN users u ON pr.reviewerId = u.id
       WHERE pr.projectId = ? AND pr.areaKey = 'pharmacology' AND pr.status = 'SUBMITTED'
       ORDER BY pr.id DESC LIMIT 1`,
      [projectId]
    );
    if (revRows.length > 0) {
      latestReview = {
        id: revRows[0].id,
        assessment: revRows[0].assessment,
        comments: revRows[0].comments,
        reviewerName: revRows[0].reviewerName,
        submittedAt: iso(revRows[0].submittedAt),
      };
    }

    const [raRows]: any = await pool.query(
      `SELECT status FROM review_area_coverage WHERE projectId = ? AND areaKey = 'pharmacology' ORDER BY id DESC LIMIT 1`,
      [projectId]
    );
    if (raRows.length > 0 && raRows[0].status) {
      reviewStatus = raRows[0].status;
    } else if (latestReview) {
      reviewStatus = latestReview.assessment === "ACCEPTED" || latestReview.assessment === "APPROVED"
        ? "APPROVED"
        : (latestReview.assessment === "REVISION_REQUIRED" ? "REVISION_REQUIRED" : "PENDING");
    }

    const [fbRows]: any = await pool.query(
      `SELECT id, severity, comment, recommendation, status, createdAt
       FROM review_feedback
       WHERE projectId = ? AND (areaKey = 'pharmacology' OR affectedStage LIKE '%docking%')
       ORDER BY id DESC`,
      [projectId]
    );
    feedbackItems = fbRows.map((f: any) => ({
      id: f.id,
      severity: f.severity,
      comment: f.comment,
      recommendation: f.recommendation,
      status: f.status,
      createdAt: iso(f.createdAt),
    }));
  } catch (reviewQueryErr) {
    console.warn("Failed to query review status for docking workspace:", reviewQueryErr);
  }

  return {
    engine: {
      available: engineInfo.available,
      version: engineInfo.vinaVersion,
      error: engineInfo.error || null,
    },
    project: projects[0] || { id: projectId, plantName: "Unspecified Plant", plantScientificName: null },
    stageStatus,
    reviewStatus,
    review: latestReview,
    feedback: feedbackItems,
    ligands,
    targets: targetViews,
    settings,
    configuration: { configured: configurationConfigured },
    jobs,
    externalRuns,
    interpretation: {
      text: synthesis?.keyFindings || "",
      approved: synthesis?.status === "COMPLETED" && Boolean(synthesis?.keyFindings?.trim()),
    },
    counts: {
      ligands: ligands.length,
      targets: targetViews.length,
      jobs: ligands.length * targetViews.length,
    },
    busy:
      ligands.some((ligand) => ligand.status === "PREPARING") ||
      targetViews.some((target: any) => target.status === "PREPARING") ||
      jobs.some((job) => job.active),
  };
}

function serializeRun(run: any, target: { sourceUrl?: string | null; details?: any }) {
  const poses = json<any[]>(run.posesJson, []);
  const config = json<any>(run.configJson, null);
  const literature = run.literatureJson ? json<any[]>(run.literatureJson, []) : null;
  return {
    id: run.id,
    ligandName: run.ligandName,
    targetName: run.targetProtein,
    pdbId: run.pdbId,
    sourceUrl: target.sourceUrl || (run.pdbId ? `https://www.rcsb.org/structure/${run.pdbId}` : null),
    affinity: Number(run.bindingAffinity),
    poseCount: run.poseCount || poses.length,
    poses,
    version: run.vinaVersion,
    config,
    ligandPrep: json<any>(run.ligandPrepJson, null),
    receptorPrep: json<any>(run.receptorPrepJson, null),
    log: run.vinaLog || "",
    error: run.errorMessage,
    startedAt: iso(run.startedAt),
    completedAt: iso(run.completedAt),
    exitCode: run.exitCode,
    literature,
    pubmedUrl: target.details?.pubmedId ? `https://pubmed.ncbi.nlm.nih.gov/${target.details.pubmedId}/` : null,
    doiUrl: target.details?.doi ? `https://doi.org/${target.details.doi}` : null,
  };
}
