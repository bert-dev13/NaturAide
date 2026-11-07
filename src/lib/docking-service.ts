import path from "path";
import fs from "fs";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface VinaPose {
  mode: number;
  affinity: number; // kcal/mol
  rmsdLb: number;
  rmsdUb: number;
}

export interface VinaExecutionResult {
  ok: boolean;
  version: string | null;
  bestAffinity: number | null;
  poses: VinaPose[];
  exitCode: number | null;
  timedOut?: boolean;
  elapsedMs?: number;
  outputPdbqtPath?: string;
  logPath?: string;
  rawStdout: string;
  rawStderr: string;
  error?: string;
}

export interface EngineInfo {
  available: boolean;
  vinaBin: string | null;
  vinaVersion: string | null;
  pythonBin: string | null;
  tools: {
    rdkit?: string | null;
    meeko?: string | null;
    gemmi?: string | null;
    openbabel?: string | null;
    obabel?: string | null;
  } | null;
  artifactDir: string;
  error?: string;
}

export function getDockingPaths() {
  const root = process.cwd();

  // Intelligent project-relative AutoDock Vina resolution
  let vinaBin = process.env.VINA_BIN?.trim();
  if (vinaBin && !path.isAbsolute(vinaBin)) {
    vinaBin = path.resolve(/*turbopackIgnore: true*/ root, vinaBin);
  }
  if (!vinaBin || !fs.existsSync(/*turbopackIgnore: true*/ vinaBin)) {
    const defaultVina = path.join(root, "tools", "vina", process.platform === "win32" ? "vina.exe" : "vina");
    if (fs.existsSync(/*turbopackIgnore: true*/ defaultVina)) {
      vinaBin = defaultVina;
    } else {
      vinaBin = vinaBin || defaultVina;
    }
  }

  // Intelligent project-relative Python resolution
  let pythonBin = process.env.DOCKING_PYTHON?.trim();
  if (pythonBin && !path.isAbsolute(pythonBin)) {
    pythonBin = path.resolve(/*turbopackIgnore: true*/ root, pythonBin);
  }
  if (!pythonBin || !fs.existsSync(/*turbopackIgnore: true*/ pythonBin)) {
    const defaultVenvPython = path.join(
      root,
      ".docking-venv",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python"
    );
    if (fs.existsSync(/*turbopackIgnore: true*/ defaultVenvPython)) {
      pythonBin = defaultVenvPython;
    } else {
      pythonBin = pythonBin || (process.platform === "win32" ? "python.exe" : "python3");
    }
  }

  let artifactDir = process.env.DOCKING_ARTIFACT_DIR?.trim();
  if (artifactDir && !path.isAbsolute(artifactDir)) {
    artifactDir = path.resolve(/*turbopackIgnore: true*/ root, artifactDir);
  }
  if (!artifactDir) {
    artifactDir = path.join(root, ".docking-artifacts");
  }

  const workerScript = path.join(root, "services", "docking", "worker.py");

  return { root, vinaBin, pythonBin, artifactDir, workerScript };
}

const ENGINE_MISS = "AutoDock Vina could not be found on the server.";

let engineCache: { at: number; info: EngineInfo } | null = null;

export function parseWorkerJson(stdout: string): any {
  const line = stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("{"))
    .pop();
  if (!line) throw new Error("Preparation worker returned no JSON result.");
  return JSON.parse(line);
}

export async function detectDockingEngine(force = false): Promise<EngineInfo> {
  if (!force && engineCache && Date.now() - engineCache.at < 30_000) return engineCache.info;
  const { vinaBin, pythonBin, artifactDir, workerScript } = getDockingPaths();

  let vinaVersion: string | null = null;
  let tools: EngineInfo["tools"] = null;
  let available = false;
  let errorMsg = "";

  try {
    const { stdout } = await execFileAsync(vinaBin, ["--version"], { timeout: 10000 });
    const line = stdout.trim().split(/\r?\n/).filter(Boolean).pop() || stdout.trim();
    const match = line.match(/AutoDock Vina\s+v?([0-9][0-9.]*)/i);
    vinaVersion = match ? `AutoDock Vina v${match[1]}` : line;
  } catch (err: any) {
    const missing = err?.code === "ENOENT" || /not found|ENOENT/i.test(String(err?.message || ""));
    errorMsg = missing ? ENGINE_MISS : `AutoDock Vina could not be executed (${err?.message || "unknown error"}).`;
  }

  try {
    const { stdout } = await execFileAsync(pythonBin, [workerScript, "tools"], { timeout: 20000 });
    const data = parseWorkerJson(stdout);
    if (data.ok) {
      tools = {
        rdkit: data.rdkit,
        meeko: data.meeko,
        gemmi: data.gemmi,
        openbabel: data.openbabel,
        obabel: data.obabel,
      };
    }
  } catch (err: any) {
    if (!errorMsg) errorMsg = `Docking preparation tools are unavailable (${err?.message || "Python worker failed"}).`;
  }

  const missingTools = [
    !tools?.rdkit ? "RDKit" : null,
    !tools?.meeko ? "Meeko" : null,
    !tools?.gemmi ? "gemmi" : null,
    !tools?.obabel ? "Open Babel" : null,
  ].filter(Boolean);

  if (vinaVersion && missingTools.length === 0) available = true;
  else if (!errorMsg) {
    errorMsg = missingTools.length
      ? `Docking preparation is incomplete. Missing: ${missingTools.join(", ")}.`
      : ENGINE_MISS;
  }

  const info: EngineInfo = {
    available,
    vinaBin: vinaVersion ? vinaBin : vinaBin,
    vinaVersion,
    pythonBin,
    tools,
    artifactDir,
    error: available ? undefined : errorMsg || ENGINE_MISS,
  };
  engineCache = { at: Date.now(), info };
  return info;
}

export async function prepareLigand(smiles: string, outputPrefix: string): Promise<{
  ok: boolean;
  pdbqt?: string;
  heavyAtoms?: number;
  formula?: string;
  molecularWeight?: number;
  torsions?: number;
  method?: string;
  error?: string;
}> {
  const { pythonBin, workerScript } = getDockingPaths();
  fs.mkdirSync(path.dirname(outputPrefix), { recursive: true });

  // Reuse existing valid prepared ligand PDBQT without regenerating (unless it contains legacy unrigidified -OH branches)
  const existingPdbqt = `${outputPrefix}.pdbqt`;
  if (fs.existsSync(existingPdbqt)) {
    const inspection = inspectPdbqt(existingPdbqt, "ligand");
    if (inspection.ok && !inspection.hasDummyHydroxylBranches) {
      return {
        ok: true,
        pdbqt: existingPdbqt,
        heavyAtoms: inspection.atoms,
        torsions: inspection.torsions,
        method: "Pre-prepared ligand structure (cached)",
      };
    }
  }

  try {
    const { stdout } = await execFileAsync(
      pythonBin,
      [workerScript, "prep-ligand", "--smiles", smiles, "--out", outputPrefix],
      { timeout: 180000, maxBuffer: 8 * 1024 * 1024 }
    );
    return parseWorkerJson(stdout);
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to prepare ligand" };
  }
}

export interface RdkitMolecularProperties {
  ok: boolean;
  molecularWeight?: number;
  exactMolecularWeight?: number;
  molecularFormula?: string;
  logP?: number;
  tpsa?: number;
  hBondDonors?: number;
  hBondAcceptors?: number;
  rotatableBonds?: number;
  aromaticRings?: number;
  heavyAtoms?: number;
  fractionCsp3?: number;
  rdkitVersion?: string;
  error?: string;
}

export async function calculateMolecularPropertiesWithRdkit(
  smiles: string
): Promise<RdkitMolecularProperties> {
  const { pythonBin, workerScript } = getDockingPaths();
  try {
    const { stdout } = await execFileAsync(
      pythonBin,
      [workerScript, "calc-props", "--smiles", smiles.trim()],
      { timeout: 30000 }
    );
    return parseWorkerJson(stdout);
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to calculate RDKit properties" };
  }
}


export async function downloadAndPrepReceptor(pdbId: string, outputPrefix: string): Promise<{
  ok: boolean;
  pdbqt?: string;
  cleanPdb?: string;
  atoms?: number;
  chain?: string;
  residues?: number;
  title?: string;
  method?: string;
  error?: string;
  sites?: Array<{
    resname: string;
    chain: string;
    seq: string;
    heavyAtoms: number;
    center: [number, number, number];
    size: [number, number, number];
  }>;
}> {
  const { pythonBin, workerScript } = getDockingPaths();
  fs.mkdirSync(path.dirname(outputPrefix), { recursive: true });

  const cleanPdbId = pdbId.trim().toUpperCase();
  const rawPdbPath = `${outputPrefix}_raw.pdb`;

  // Reuse existing valid prepared receptor PDBQT without re-downloading or re-preparing
  const existingPdbqt = `${outputPrefix}.pdbqt`;
  const existingCleanPdb = `${outputPrefix}_clean.pdb`;
  if (fs.existsSync(existingPdbqt)) {
    const inspection = inspectPdbqt(existingPdbqt, "receptor");
    if (inspection.ok) {
      let cachedSites: any[] = [];
      if (fs.existsSync(rawPdbPath)) {
        try {
          const { stdout: siteOut } = await execFileAsync(
            pythonBin,
            [workerScript, "sites", "--pdb", rawPdbPath],
            { timeout: 60000, maxBuffer: 8 * 1024 * 1024 }
          );
          const siteData = parseWorkerJson(siteOut);
          if (siteData.ok && siteData.candidates) {
            cachedSites = siteData.candidates;
          }
        } catch (siteErr) {
          console.warn("Could not extract sites from cached raw PDB:", siteErr);
        }
      }
      return {
        ok: true,
        pdbqt: existingPdbqt,
        cleanPdb: fs.existsSync(existingCleanPdb) ? existingCleanPdb : undefined,
        atoms: inspection.atoms,
        method: "Pre-prepared receptor structure (cached)",
        sites: cachedSites,
      };
    }
  }

  const looksLikePdb = (text: string) => /^(HEADER|TITLE|ATOM|HETATM|MODEL|CRYST1)/m.test(text);
  // 1. Download the official PDB if it is not already cached as a real structure
  const cached = fs.existsSync(rawPdbPath) ? fs.readFileSync(rawPdbPath, "utf8") : "";
  if (!looksLikePdb(cached)) {
    const pdbUrl = `https://files.rcsb.org/download/${cleanPdbId}.pdb`;
    const res = await fetch(pdbUrl);
    if (!res.ok) {
      return { ok: false, error: `Failed to download PDB ${cleanPdbId} from RCSB (${res.status} ${res.statusText})` };
    }
    const pdbContent = await res.text();
    if (!looksLikePdb(pdbContent)) {
      return { ok: false, error: `RCSB did not return a PDB structure for ${cleanPdbId}.` };
    }
    fs.writeFileSync(rawPdbPath, pdbContent, "utf8");
  }

  // 2. Identify candidate binding sites from co-crystallized ligands
  let detectedSites: any[] = [];
  try {
    const { stdout: siteOut } = await execFileAsync(
      pythonBin,
      [workerScript, "sites", "--pdb", rawPdbPath],
      { timeout: 60000, maxBuffer: 8 * 1024 * 1024 }
    );
    const siteData = parseWorkerJson(siteOut);
    if (siteData.ok && siteData.candidates) {
      detectedSites = siteData.candidates;
    }
  } catch (err) {
    console.warn("Could not extract co-crystallized ligand sites:", err);
  }

  // 3. Prepare receptor with worker
  try {
    const { stdout: prepOut } = await execFileAsync(
      pythonBin,
      [workerScript, "prep-receptor", "--pdb", rawPdbPath, "--out", outputPrefix],
      { timeout: 300000, maxBuffer: 8 * 1024 * 1024 }
    );
    const prepData = parseWorkerJson(prepOut);
    if (!prepData.ok) {
      return { ok: false, error: prepData.error || "Receptor preparation failed" };
    }

    return {
      ok: true,
      pdbqt: prepData.pdbqt,
      cleanPdb: prepData.cleanPdb,
      atoms: prepData.atoms,
      chain: prepData.chain,
      residues: prepData.residues,
      title: prepData.title,
      method: prepData.method,
      sites: detectedSites,
    };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to prepare receptor PDBQT" };
  }
}

const MODE_ROW = /^\s*(\d+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/;
const REMARK_RESULT = /REMARK\s+VINA\s+RESULT:\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/gi;

/** Affinities are read only from a Vina mode table or REMARK VINA RESULT lines. */
export function parseVinaLog(text: string): {
  version: string | null;
  poses: VinaPose[];
  bestAffinity: number | null;
} {
  const versionMatch = text.match(/AutoDock Vina\s+v?([0-9][0-9.]*)/i);
  const version = versionMatch ? `AutoDock Vina v${versionMatch[1]}` : null;
  const poses: VinaPose[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = MODE_ROW.exec(line);
    if (!match) continue;
    poses.push({
      mode: Number(match[1]),
      affinity: Number(match[2]),
      rmsdLb: Number(match[3]),
      rmsdUb: Number(match[4]),
    });
  }
  if (poses.length === 0) {
    let mode = 1;
    for (const match of text.matchAll(REMARK_RESULT)) {
      poses.push({
        mode,
        affinity: Number(match[1]),
        rmsdLb: Number(match[2]),
        rmsdUb: Number(match[3]),
      });
      mode += 1;
    }
  }
  const finite = poses.filter((p) => Number.isFinite(p.affinity));
  if (finite.length === 0) return { version, poses: [], bestAffinity: null };
  const best = finite.reduce((a, b) => (b.affinity < a.affinity ? b : a));
  return { version, poses: finite, bestAffinity: best.affinity };
}

export async function runVinaSimulation(params: {
  receptorPdbqt: string;
  ligandPdbqt: string;
  centerX: number;
  centerY: number;
  centerZ: number;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  exhaustiveness: number;
  numModes: number;
  seed?: number;
  energyRange?: number;
  outputPdbqtPath: string;
  logPath: string;
}): Promise<VinaExecutionResult> {
  const { vinaBin } = getDockingPaths();

  fs.mkdirSync(path.dirname(params.outputPdbqtPath), { recursive: true });
  fs.mkdirSync(path.dirname(params.logPath), { recursive: true });
  if (fs.existsSync(params.outputPdbqtPath)) fs.unlinkSync(params.outputPdbqtPath);

  const cpus = os.cpus()?.length || 4;
  // Reserve at least 2 logical cores so background docking never starves the Next.js server or database
  const availableCpus = Math.max(1, cpus - 2);
  const maxConcurrency = Math.min(2, Math.max(1, Math.floor(availableCpus / 2)));
  const cpuThreads = Math.max(1, Math.min(4, Math.floor(availableCpus / maxConcurrency)));

  const args = [
    "--receptor", params.receptorPdbqt,
    "--ligand", params.ligandPdbqt,
    "--center_x", String(params.centerX),
    "--center_y", String(params.centerY),
    "--center_z", String(params.centerZ),
    "--size_x", String(params.sizeX),
    "--size_y", String(params.sizeY),
    "--size_z", String(params.sizeZ),
    "--exhaustiveness", String(params.exhaustiveness),
    "--num_modes", String(params.numModes),
    "--energy_range", String(params.energyRange ?? 3),
    "--seed", String(params.seed ?? 42),
    "--cpu", String(cpuThreads),
    "--verbosity", "1",
    "--out", params.outputPdbqtPath,
  ];

  const header = [`$ vina ${args.join(" ")}`, ""].join("\n");
  const timeoutSec = parseInt(process.env.DOCKING_TIMEOUT_SECONDS || "180", 10);
  const timeout = timeoutSec * 1000;
  const startedAtMs = Date.now();

  const finish = (
    exitCode: number | null,
    stdout: string,
    stderr: string,
    error?: string,
    timedOut = false
  ): VinaExecutionResult => {
    const elapsedMs = Date.now() - startedAtMs;
    let poseText = "";
    if (fs.existsSync(params.outputPdbqtPath)) {
      try {
        poseText = fs.readFileSync(params.outputPdbqtPath, "utf8");
      } catch {
        poseText = "";
      }
    }
    const parsed = parseVinaLog(`${stdout}\n${stderr}\n${poseText}`);
    const fullLog = `${header}${stdout}\n${stderr}`.trim();
    try {
      fs.writeFileSync(params.logPath, error ? `${fullLog}\n\n${error}` : fullLog, "utf8");
    } catch {
      /* log path is best-effort; the DB still stores stdout/stderr */
    }
    const produced = fs.existsSync(params.outputPdbqtPath) && fs.statSync(params.outputPdbqtPath).size > 0;
    const ok = !timedOut && exitCode === 0 && produced && parsed.poses.length > 0 && parsed.bestAffinity != null;
    return {
      ok,
      version: parsed.version,
      bestAffinity: ok ? parsed.bestAffinity : null,
      poses: ok ? parsed.poses : [],
      exitCode,
      timedOut,
      elapsedMs,
      outputPdbqtPath: produced ? params.outputPdbqtPath : undefined,
      logPath: params.logPath,
      rawStdout: stdout,
      rawStderr: stderr,
      error: ok
        ? undefined
        : error ||
          (exitCode !== 0
            ? `AutoDock Vina exited with code ${exitCode}.`
            : "Vina finished without a binding-mode table in the output."),
    };
  };

  try {
    const { stdout, stderr } = await execFileAsync(vinaBin, args, {
      timeout,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    });
    return finish(0, stdout || "", stderr || "", undefined, false);
  } catch (err: any) {
    const stdout = String(err?.stdout || "");
    const stderr = String(err?.stderr || "");
    if (err?.code === "ENOENT") {
      return finish(null, stdout, stderr, ENGINE_MISS, false);
    }
    const isTimeout = Boolean(err?.killed || err?.signal === "SIGTERM" || /timed out|ETIMEDOUT/i.test(String(err?.message || "")));
    const code = typeof err?.code === "number" ? err.code : 1;
    return finish(
      code,
      stdout,
      stderr,
      isTimeout ? `AutoDock Vina timed out after ${timeoutSec}s.` : undefined,
      isTimeout
    );
  }
}

export function inspectPdbqt(
  file: string,
  kind: "ligand" | "receptor"
): { ok: boolean; atoms: number; torsions?: number; hasDummyHydroxylBranches?: boolean; error?: string } {
  if (!file || !fs.existsSync(file) || fs.statSync(file).size === 0) {
    return { ok: false, atoms: 0, error: "Prepared PDBQT file is missing." };
  }
  const text = fs.readFileSync(file, "utf8");
  const atoms = text.split(/\r?\n/).filter((line) => line.startsWith("ATOM") || line.startsWith("HETATM")).length;
  if (atoms === 0) return { ok: false, atoms: 0, error: "Prepared PDBQT contains no atoms." };
  if (kind === "receptor" && /^(ROOT|BRANCH|TORSDOF)\b/m.test(text)) {
    return { ok: false, atoms, error: "Receptor PDBQT is not a rigid Vina receptor." };
  }
  if (kind === "ligand" && !/^TORSDOF\b/m.test(text)) {
    return { ok: false, atoms, error: "Ligand PDBQT is missing rotatable-bond records." };
  }
  let torsions: number | undefined;
  const torsMatch = text.match(/^TORSDOF\s+(\d+)/m);
  if (torsMatch) {
    torsions = parseInt(torsMatch[1], 10);
  }
  const hasDummyHydroxylBranches =
    kind === "ligand" &&
    /BRANCH\s+\d+\s+\d+\r?\nATOM\s+[^\r\n]+\s+OA\s*\r?\nATOM\s+[^\r\n]+\s+HD\s*\r?\nENDBRANCH\s+\d+\s+\d+/m.test(
      text
    );
  return { ok: true, atoms, torsions, hasDummyHydroxylBranches };
}
