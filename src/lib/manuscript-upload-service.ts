// src/lib/manuscript-upload-service.ts
import fs from "node:fs/promises";
import path from "node:path";
import pool from "@/lib/db";

export const MAX_MANUSCRIPT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export interface ManuscriptFileMetadata {
  id?: number;
  projectId: number;
  title: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: string | null;
  status: string;
}

let schemaEnsured = false;

export async function ensureManuscriptUploadColumns(): Promise<void> {
  if (schemaEnsured) return;
  try {
    await pool.query(
      `ALTER TABLE research_manuscripts ADD COLUMN fileName VARCHAR(255) NULL`
    );
  } catch {}
  try {
    await pool.query(
      `ALTER TABLE research_manuscripts ADD COLUMN fileSize BIGINT NULL`
    );
  } catch {}
  try {
    await pool.query(
      `ALTER TABLE research_manuscripts ADD COLUMN mimeType VARCHAR(128) NULL`
    );
  } catch {}
  try {
    await pool.query(
      `ALTER TABLE research_manuscripts ADD COLUMN uploadedAt DATETIME(3) NULL`
    );
  } catch {}
  try {
    await pool.query(
      `ALTER TABLE research_manuscripts ADD COLUMN storagePath VARCHAR(512) NULL`
    );
  } catch {}
  schemaEnsured = true;
}

export function validateManuscriptFile(
  fileName: string,
  fileSize: number,
  mimeType: string,
  buffer?: Buffer
): { valid: boolean; error?: string; normalizedMimeType?: string; extension?: ".pdf" | ".docx" } {
  const cleanName = (fileName || "").trim();
  if (!cleanName) {
    return { valid: false, error: "File name is required." };
  }

  const ext = path.extname(cleanName).toLowerCase();
  if (ext !== ".pdf" && ext !== ".docx") {
    return {
      valid: false,
      error: "Invalid file format. Only PDF (.pdf) and Microsoft Word (.docx) files are accepted.",
    };
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return { valid: false, error: "Uploaded file is empty." };
  }

  if (fileSize > MAX_MANUSCRIPT_SIZE_BYTES) {
    return {
      valid: false,
      error: "File size exceeds the 25 MB maximum limit.",
    };
  }

  // Optional magic-byte verification when buffer is provided
  if (buffer && buffer.length >= 4) {
    if (ext === ".pdf") {
      const header = buffer.subarray(0, 5).toString("ascii");
      if (header !== "%PDF-") {
        return {
          valid: false,
          error: "The uploaded file is not a valid PDF document.",
        };
      }
    } else if (ext === ".docx") {
      // DOCX is a ZIP container starting with PK\x03\x04
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
        return {
          valid: false,
          error: "The uploaded file is not a valid DOCX document.",
        };
      }
    }
  }

  const normalizedMimeType =
    ext === ".pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return {
    valid: true,
    normalizedMimeType,
    extension: ext as ".pdf" | ".docx",
  };
}

export function getManuscriptStorageDir(projectId: number): string {
  return path.join(process.cwd(), "storage", "manuscripts", `project-${projectId}`);
}

export async function saveManuscriptFile(params: {
  projectId: number;
  projectTitle?: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<ManuscriptFileMetadata> {
  await ensureManuscriptUploadColumns();

  const { projectId, projectTitle, originalName, mimeType, buffer } = params;
  const validation = validateManuscriptFile(originalName, buffer.length, mimeType, buffer);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid manuscript file.");
  }

  const dir = getManuscriptStorageDir(projectId);
  await fs.mkdir(dir, { recursive: true });

  // Remove previous stored file if one exists
  const [existingRows]: any = await pool.query(
    `SELECT * FROM research_manuscripts WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  const existing = existingRows[0] || null;
  if (existing?.storagePath) {
    try {
      await fs.unlink(existing.storagePath);
    } catch {}
  }

  const safeBase = path
    .basename(originalName, validation.extension)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80) || "manuscript";
  const storedFileName = `${Date.now()}_${safeBase}${validation.extension}`;
  const storagePath = path.join(dir, storedFileName);

  await fs.writeFile(storagePath, buffer);

  const fileUrl = `/api/researcher/projects/${projectId}/manuscript/file`;
  const title = existing?.title || `${projectTitle || `Project #${projectId}`} — Research Manuscript`;
  const nowIso = new Date().toISOString();

  if (existing) {
    await pool.query(
      `UPDATE research_manuscripts
       SET title = ?,
           fileUrl = ?,
           fileName = ?,
           fileSize = ?,
           mimeType = ?,
           storagePath = ?,
           uploadedAt = CURRENT_TIMESTAMP(3),
           status = 'UPLOADED',
           updatedAt = CURRENT_TIMESTAMP(3)
       WHERE projectId = ?`,
      [
        title,
        fileUrl,
        originalName.trim(),
        buffer.length,
        validation.normalizedMimeType,
        storagePath,
        projectId,
      ]
    );
  } else {
    await pool.query(
      `INSERT INTO research_manuscripts (
         projectId, title, abstract, introduction, materialsMethods, resultsDiscussion, conclusion,
         referencesText, fileUrl, fileName, fileSize, mimeType, storagePath, uploadedAt, status, updatedAt
       ) VALUES (?, ?, '', '', '', '', '', '', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), 'UPLOADED', CURRENT_TIMESTAMP(3))`,
      [
        projectId,
        title,
        fileUrl,
        originalName.trim(),
        buffer.length,
        validation.normalizedMimeType,
        storagePath,
      ]
    );
  }

  return {
    projectId,
    title,
    fileUrl,
    fileName: originalName.trim(),
    fileSize: buffer.length,
    mimeType: validation.normalizedMimeType!,
    uploadedAt: nowIso,
    status: "UPLOADED",
  };
}

export async function removeManuscriptFile(projectId: number): Promise<void> {
  await ensureManuscriptUploadColumns();
  const [rows]: any = await pool.query(
    `SELECT * FROM research_manuscripts WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  const existing = rows[0] || null;
  if (!existing) return;

  if (existing.storagePath) {
    try {
      await fs.unlink(existing.storagePath);
    } catch {}
  }

  await pool.query(
    `UPDATE research_manuscripts
     SET fileUrl = NULL,
         fileName = NULL,
         fileSize = NULL,
         mimeType = NULL,
         storagePath = NULL,
         uploadedAt = NULL,
         status = 'DRAFT',
         updatedAt = CURRENT_TIMESTAMP(3)
     WHERE projectId = ?`,
    [projectId]
  );
}

export async function getManuscriptRecord(projectId: number): Promise<any | null> {
  await ensureManuscriptUploadColumns();
  const [rows]: any = await pool.query(
    `SELECT * FROM research_manuscripts WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  return rows[0] || null;
}

export interface CompiledResearchOverview {
  plant: {
    commonName: string;
    scientificName: string;
    family: string;
    partsStudied: string;
    extractionMethod: string;
    extractionSolvent: string;
    extractYield: string;
  };
  formulation: {
    formulationName: string;
    dosageForm: string;
    componentsCount: number;
    ingredientsList: {
      name: string;
      concentration: string;
      role: string;
    }[];
    batchesCount: number;
    qcStatus: string;
    qcSummaryDetail: string;
  };
  screening: {
    totalCompounds: number;
    screenedCount: number;
    screeningStatus: string;
    compoundNames: string[];
    compoundSummaries: string[];
  };
  docking: {
    targetsCount: number;
    targetNames: string[];
    completedRunsCount: number;
    bestComplex: {
      ligandName: string;
      targetProtein: string;
      pdbId: string;
      bindingAffinity: number;
      affinityFormatted: string;
    } | null;
    topComplexes: {
      ligandName: string;
      targetProtein: string;
      pdbId: string;
      bindingAffinity: number;
      affinityFormatted: string;
    }[];
  };
  interpretation: {
    keyFindings: string;
    potentialLimitations: string;
  };
  compiledSummaryText: string;
}

export {
  isIncompleteResearchSummary,
  resolveResearchSummaryText,
} from "@/lib/research-summary-utils";

function formatAffinityScore(val: number): string {
  if (!Number.isFinite(val)) return "—";
  const fixed2 = val.toFixed(2);
  return fixed2.endsWith("0") ? val.toFixed(1) : fixed2;
}

export async function getSection3CompiledContext(
  projectId: number
): Promise<CompiledResearchOverview> {
  // Ensure V2 tables exist on fresh databases before compiling overview.
  const { ensureV2ResearchSchema } = await import("@/lib/v2-research-schema");
  await ensureV2ResearchSchema();

  const [projRows]: any = await pool.query(
    `SELECT rp.*,
            COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') AS plantName,
            COALESCE(p.scientificName, '') AS plantScientificName
     FROM research_projects rp
     LEFT JOIN plants p ON rp.plantId = p.id
     WHERE rp.id = ? LIMIT 1`,
    [projectId]
  );
  const proj = projRows[0] || {};

  const [plantRows]: any = await pool.query(
    `SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  const plantData = plantRows[0] || {};

  const [prodRows]: any = await pool.query(
    `SELECT * FROM research_product_selections WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
    [projectId]
  );
  const prod = prodRows[0] || {};

  const [formRows]: any = await pool.query(
    `SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
    [projectId]
  );
  const form = formRows[0] || {};

  const [compItems]: any = await pool.query(
    `SELECT * FROM formulation_components WHERE projectId = ? ORDER BY id ASC`,
    [projectId]
  );

  const [batchRows]: any = await pool.query(
    `SELECT * FROM research_batch_analyses WHERE projectId = ? ORDER BY id DESC`,
    [projectId]
  );

  const [compRows]: any = await pool.query(
    `SELECT * FROM research_compounds WHERE projectId = ? ORDER BY id ASC`,
    [projectId]
  );

  const [screenRows]: any = await pool.query(
    `SELECT * FROM insilico_results WHERE projectId = ? ORDER BY id ASC`,
    [projectId]
  );

  const [targetRows]: any = await pool.query(
    `SELECT * FROM docking_targets WHERE projectId = ? ORDER BY id ASC`,
    [projectId]
  );

  const [runRows]: any = await pool.query(
    `SELECT * FROM docking_runs
     WHERE projectId = ? AND jobStatus = 'COMPLETED' AND bindingAffinity IS NOT NULL
     ORDER BY CAST(bindingAffinity AS DECIMAL(10,3)) ASC, id DESC`,
    [projectId]
  );

  // Deduplicate completed runs by compound+target while keeping the best (most negative) affinity
  const seenPairs = new Set<string>();
  const uniqueRuns: any[] = [];
  for (const r of runRows) {
    const key = `${r.compoundId || r.ligandName}:${r.targetId || r.pdbId}`;
    if (!seenPairs.has(key)) {
      seenPairs.add(key);
      uniqueRuns.push(r);
    }
  }
  uniqueRuns.sort((a, b) => Number(a.bindingAffinity) - Number(b.bindingAffinity));

  const [synthRows]: any = await pool.query(
    `SELECT keyFindings, potentialLimitations FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  const synth = synthRows[0] || {};

  // 1. Botanical Information
  const commonName = plantData.commonName || proj.plantName || "Unspecified Plant";
  const scientificName = plantData.scientificName || proj.plantScientificName || "";
  const family = plantData.family || "";
  const partsStudied = plantData.partsStudied || "Leaves";
  const extractionMethod = plantData.extractionMethod || "Standardized Extraction";
  const extractionSolvent = plantData.extractionSolvent || "Hydroethanolic Solvent";
  const extractYield = plantData.extractYieldPercent || "";

  // 2. Formulation & Actual QC Status
  const dosageForm =
    form.dosageFormType ||
    form.formulationType ||
    prod.productType ||
    prod.deliveryFormat ||
    "Topical Hydrogel";
  const formulationName = form.formulationName || `${commonName} ${dosageForm}`;
  const ingredientsRaw: { name: string; concentration: string; role: string }[] = compItems.map((c: any) => ({
    name: c.componentName || "Ingredient",
    concentration:
      c.concentration ||
      (c.concentrationValue ? `${Number(c.concentrationValue)}% ${c.concentrationUnit || "w/w"}` : c.quantity || ""),
    role: c.roleInFormulation || c.roleOrFunction || "Excipient",
  }));
  // Deduplicate repeated formulation rows (same name) while keeping first occurrence
  const ingredientsList = Array.from(
    new Map(ingredientsRaw.map((ing) => [ing.name.trim().toLowerCase(), ing])).values()
  );
  const componentsCount = ingredientsList.length;

  // Determine accurate QC status from actual recorded batch measurements (never auto-label as Passed if simulated or unverified)
  const batchesCount = batchRows.length;
  let qcStatus = "No QC Batches Recorded";
  let qcSummaryDetail = "No batch quality control records have been entered yet.";

  if (batchesCount > 0) {
    const latestBatch = batchRows[0];
    let parsedNotes: any = null;
    if (latestBatch.notes && typeof latestBatch.notes === "string" && latestBatch.notes.trim().startsWith("{")) {
      try {
        parsedNotes = JSON.parse(latestBatch.notes);
      } catch {
        parsedNotes = null;
      }
    }

    const rawStatus = String(latestBatch.status || "").trim();
    const isSimulated =
      rawStatus.toLowerCase().includes("simulated") ||
      Boolean(parsedNotes?.report?.isSimulated) ||
      String(latestBatch.stabilityObservations || "").toLowerCase().includes("sample analysis") ||
      String(latestBatch.notes || "").toLowerCase().includes("non-empirical");
    const isPreliminary = String(latestBatch.notes || "")
      .toLowerCase()
      .includes("requires physical lab verification");

    if (isSimulated) {
      qcStatus = "Simulated (Non-Empirical Trial Data)";
      const repSummary = parsedNotes?.report?.shortSummary;
      qcSummaryDetail =
        repSummary ||
        `Batch ${latestBatch.batchNumber || "#1"} contains simulated demonstration values and requires empirical laboratory testing.`;
    } else if (isPreliminary) {
      qcStatus = "Preliminary Baseline (Pending Lab Verification)";
      qcSummaryDetail = `Batch ${latestBatch.batchNumber || "#1"} recorded pH ${latestBatch.pH || "N/A"} and viscosity ${latestBatch.viscosity || "N/A"} (${latestBatch.notes}).`;
    } else if (rawStatus) {
      qcStatus = rawStatus;
      qcSummaryDetail = `Batch ${latestBatch.batchNumber || "#1"}: Status ${rawStatus}${latestBatch.pH ? `, pH ${latestBatch.pH}` : ""}${latestBatch.viscosity ? `, Viscosity ${latestBatch.viscosity}` : ""}.`;
    } else {
      qcStatus = "Pending Evaluation";
      qcSummaryDetail = `${batchesCount} batch record(s) logged; pending empirical quality control verification.`;
    }
  }

  // 3. In-Silico Screening
  const selectedCompounds = compRows.filter((c: any) => c.selectedForDocking !== 0);
  const activeCompoundsRaw = selectedCompounds.length > 0 ? selectedCompounds : compRows;
  const activeCompounds = Array.from(
    new Map(
      activeCompoundsRaw.map((c: any) => [
        String(c.compoundName || c.id || "")
          .trim()
          .toLowerCase(),
        c,
      ])
    ).values()
  );
  const compoundNames = Array.from(
    new Set(activeCompounds.map((c: any) => c.compoundName).filter(Boolean))
  );

  // Deduplicate screening results by compound name/id
  const screenByCompound = new Map<string, any>();
  for (const s of screenRows) {
    const k = String(s.compoundName || s.compoundId || "").toLowerCase();
    if (k && !screenByCompound.has(k)) {
      screenByCompound.set(k, s);
    }
  }
  const screenedCount = screenByCompound.size;
  const screeningStatus =
    screenedCount >= activeCompounds.length && activeCompounds.length > 0
      ? `Completed (${screenedCount} of ${activeCompounds.length} Screened)`
      : screenedCount > 0
      ? `Partial (${screenedCount} of ${activeCompounds.length} Screened)`
      : "Pending Screening";

  const compoundSummaries: string[] = [];
  for (const c of activeCompounds) {
    const k = String(c.compoundName || c.id || "").toLowerCase();
    const s = screenByCompound.get(k);
    if (s?.resultSummary) {
      compoundSummaries.push(s.resultSummary);
    } else {
      compoundSummaries.push(
        `${c.compoundName}${c.molecularFormula ? ` (${c.molecularFormula})` : ""}${
          c.molecularWeight ? `, MW ${c.molecularWeight} g/mol` : ""
        }`
      );
    }
  }

  // 4. Molecular Docking — unique targets by PDB / name
  const uniqueTargets = Array.from(
    new Map(
      targetRows.map((t: any) => [
        String(t.pdbId || t.targetName || t.id || "")
          .trim()
          .toUpperCase(),
        t,
      ])
    ).values()
  );
  const targetNames = uniqueTargets
    .map((t: any) => `${t.targetName}${t.pdbId ? ` (PDB: ${t.pdbId})` : ""}`)
    .filter(Boolean);

  const topComplexes = uniqueRuns.slice(0, 5).map((r: any) => {
    const num = Number(r.bindingAffinity);
    return {
      ligandName: r.ligandName,
      targetProtein: r.targetProtein,
      pdbId: r.pdbId,
      bindingAffinity: num,
      affinityFormatted: `${formatAffinityScore(num)} kcal/mol`,
    };
  });
  const bestComplex = topComplexes[0] || null;

  // 5. Saved AI Interpretation
  const keyFindings = (synth.keyFindings || "").trim();
  const potentialLimitations = (synth.potentialLimitations || "").trim();

  // 6. Compile complete, readable Research Summary from Sections 1 and 2
  const ingredientLines =
    ingredientsList.length > 0
      ? ingredientsList
          .map((ing) => `  - ${ing.name}${ing.concentration ? ` (${ing.concentration})` : ""} — ${ing.role}`)
          .join("\n")
      : "  - No formulation ingredients recorded.";

  const screeningLines =
    compoundSummaries.length > 0
      ? compoundSummaries.map((line) => `  - ${line}`).join("\n")
      : "  - No phytochemical screening results recorded.";

  const dockingLines =
    topComplexes.length > 0
      ? topComplexes
          .map(
            (cx, i) =>
              `  ${i + 1}. ${cx.ligandName} docked to ${cx.targetProtein} (PDB: ${cx.pdbId}) — Predicted Binding Affinity: ${cx.affinityFormatted}`
          )
          .join("\n")
      : "  - No completed AutoDock Vina runs recorded.";

  const summarySections: string[] = [
    `1. Botanical & Extraction Information`,
    `Botanical Specimen: ${commonName}${scientificName ? ` (${scientificName})` : ""}${family ? `, Family ${family}` : ""}.`,
    `Plant Part Used: ${partsStudied}.`,
    `Extraction Protocol: ${extractionMethod} using ${extractionSolvent}${extractYield ? ` (Observed Yield: ${extractYield})` : ""}.`,
    ``,
    `2. Formulation Development`,
    `Product Type / Dosage Form: ${formulationName} (${dosageForm}).`,
    `Formulation Composition (${componentsCount} ingredients):`,
    ingredientLines,
    ``,
    `3. Batch Analysis & Quality Control Findings`,
    `Recorded Batches: ${batchesCount} batch record(s) — QC Status: ${qcStatus}.`,
    `${qcSummaryDetail}`,
    ``,
    `4. In-Silico Phytochemical Screening`,
    `Screening Status: ${screeningStatus}.`,
    `Selected Phytochemicals (${compoundNames.length}): ${compoundNames.join(", ") || "None"}.`,
    screeningLines,
    ``,
    `5. Molecular Docking Results (AutoDock Vina)`,
    `Completed ${uniqueRuns.length} molecular docking run(s) across ${uniqueTargets.length} target receptor(s): ${targetNames.join("; ") || "None"}.`,
    bestComplex
      ? `Best Predicted Binding Affinity: ${bestComplex.affinityFormatted} for ${bestComplex.ligandName} bound to ${bestComplex.targetProtein} (PDB: ${bestComplex.pdbId}).`
      : `Best Predicted Binding Affinity: Pending completed docking runs.`,
    `Leading Ligand–Receptor Complexes:`,
    dockingLines,
  ];

  if (keyFindings) {
    summarySections.push(``, `6. Computational Findings & Target Binding Synthesis`, keyFindings);
  }
  if (potentialLimitations) {
    summarySections.push(
      ``,
      `7. Computational Limitations & In-Vitro Verification Requirements`,
      potentialLimitations
    );
  }

  return {
    plant: {
      commonName,
      scientificName,
      family,
      partsStudied,
      extractionMethod,
      extractionSolvent,
      extractYield,
    },
    formulation: {
      formulationName,
      dosageForm,
      componentsCount,
      ingredientsList,
      batchesCount,
      qcStatus,
      qcSummaryDetail,
    },
    screening: {
      totalCompounds: activeCompounds.length,
      screenedCount,
      screeningStatus,
      compoundNames,
      compoundSummaries,
    },
    docking: {
      targetsCount: uniqueTargets.length,
      targetNames,
      completedRunsCount: uniqueRuns.length,
      bestComplex,
      topComplexes,
    },
    interpretation: {
      keyFindings,
      potentialLimitations,
    },
    compiledSummaryText: summarySections.join("\n"),
  };
}

