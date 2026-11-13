import pool from "@/lib/db";
import { getProjectApprovedSteps } from "@/lib/expert-review-assignment";
import { addColumnIfNotExists } from "@/lib/migration-helpers";

let executiveSummaryEnsurePromise: Promise<void> | null = null;

/** Older migrate-only DBs created research_dossiers without executiveSummary. */
async function ensureResearchDossierExecutiveSummaryColumn(): Promise<void> {
  if (!executiveSummaryEnsurePromise) {
    executiveSummaryEnsurePromise = (async () => {
      try {
        await addColumnIfNotExists(
          pool,
          "research_dossiers",
          "executiveSummary",
          "LONGTEXT NULL"
        );
      } catch (error) {
        console.warn("Could not ensure research_dossiers.executiveSummary:", error);
        executiveSummaryEnsurePromise = null;
      }
    })();
  }
  await executiveSummaryEnsurePromise;
}

export type V2StepStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface V2ProgressStep {
  stepKey: string;
  title: string;
  completed: boolean;
  detail?: string;
  /** Binary step progress: 0 or 100 (Laboratory Results uses saved-record count). */
  progressPercent?: number;
  status?: V2StepStatus;
}

export interface V2SectionProgress {
  section1: {
    status: V2StepStatus;
    completedSteps: number;
    totalSteps: 6;
    progressPercent?: number;
    steps: V2ProgressStep[];
  };
  section2: {
    status: V2StepStatus;
    completedSteps: number;
    totalSteps: 7;
    progressPercent?: number;
    steps: V2ProgressStep[];
  };
  section3: {
    status: V2StepStatus;
    completedSteps: number;
    totalSteps: number;
    progressPercent?: number;
    steps: V2ProgressStep[];
  };
  section4: {
    status: V2StepStatus;
    completedSteps: number;
    totalSteps: number;
    progressPercent?: number;
    steps: V2ProgressStep[];
  };
  /**
   * Laboratory Results step (inside Paper Submission).
   * 0 saved → 0% NOT_STARTED; ≥1 saved → 100% COMPLETED.
   */
  laboratoryResults?: {
    count: number;
    progressPercent: number;
    status: "NOT_STARTED" | "COMPLETED";
  };
  overallStatus: string;
  overallProgressPercent: number;
  canSubmit: boolean;
  approvedSpecialtiesCount?: number;
  hasSubmittedForReview?: boolean;
  isCompleted?: boolean;
  approvedStepsBySection?: {
    section1: number[];
    section2: number[];
    section3: number[];
  };
  sectionApprovalPercent?: {
    section1: number;
    section2: number;
    section3: number;
    overall: number;
  };
}

function emptyV2Progress(progressPercent = 0): V2SectionProgress {
  return {
    section1: {
      status: "NOT_STARTED",
      completedSteps: 0,
      totalSteps: 6,
      progressPercent: 0,
      steps: [],
    },
    section2: {
      status: "NOT_STARTED",
      completedSteps: 0,
      totalSteps: 7,
      progressPercent: 0,
      steps: [],
    },
    section3: {
      status: "NOT_STARTED",
      completedSteps: 0,
      totalSteps: 3,
      progressPercent: 0,
      steps: [],
    },
    section4: {
      status: "NOT_STARTED",
      completedSteps: 0,
      totalSteps: 3,
      progressPercent: 0,
      steps: [],
    },
    laboratoryResults: { count: 0, progressPercent: 0, status: "NOT_STARTED" },
    overallStatus: "Draft",
    overallProgressPercent: progressPercent,
    canSubmit: false,
    approvedSpecialtiesCount: 0,
    hasSubmittedForReview: false,
    isCompleted: false,
    approvedStepsBySection: { section1: [], section2: [], section3: [] },
    sectionApprovalPercent: { section1: 0, section2: 0, section3: 0, overall: 0 },
  };
}

export async function calculateV2ProjectProgress(projectId: number): Promise<V2SectionProgress> {
  try {
    return await calculateV2ProjectProgressUnsafe(projectId);
  } catch (error) {
    console.warn("calculateV2ProjectProgress failed; returning draft progress:", error);
    return emptyV2Progress();
  }
}

async function calculateV2ProjectProgressUnsafe(projectId: number): Promise<V2SectionProgress> {
  // Query Section 1 data
  // Query project for plant identity
  const [projIdentityRows]: any = await pool.query(
    `SELECT rp.id, rp.title, rp.plantId, rp.plantCustomName,
            COALESCE(p.commonName, rp.plantCustomName) as plantName,
            p.scientificName as plantScientificName
     FROM research_projects rp
     LEFT JOIN plants p ON rp.plantId = p.id
     WHERE rp.id = ? LIMIT 1`,
    [projectId]
  );
  const proj = projIdentityRows[0] || null;

  // Step 1: Plant info & Specimen Authentication
  const [plantDataRows]: any = await pool.query(
    "SELECT id, commonName, scientificName, partsStudied, specimenSource, collectionLocation, voucherSpecimenNumber, extractionMethod, extractionSolvent, authenticationStatus FROM research_plant_data WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const plantData = plantDataRows[0] || null;

  const hasPlantIdentity = Boolean(
    (proj?.plantName || plantData?.commonName) &&
    (proj?.plantScientificName || plantData?.scientificName)
  );
  const hasPartsStudied = Boolean(plantData?.partsStudied && plantData.partsStudied.trim().length > 0);
  const step1_1 = Boolean(hasPlantIdentity && hasPartsStudied);

  // Step 2: Product selection
  const [prodRows]: any = await pool.query(
    "SELECT id, productType, deliveryFormat FROM research_product_selections WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const step1_2 = prodRows.length > 0 && !!prodRows[0].productType;

  // Step 3: Extraction
  const step1_3 = !!(plantData && (plantData.extractionMethod || plantData.extractionSolvent));

  // Step 4: Materials
  const [materialsRows]: any = await pool.query(
    "SELECT COUNT(*) as count FROM research_materials WHERE projectId = ?",
    [projectId]
  );
  const step1_4 = Number(materialsRows[0]?.count || 0) > 0;

  // Step 5: Formulation Development
  const [formulationRows]: any = await pool.query(
    `SELECT rf.id, (SELECT COUNT(*) FROM formulation_components fc WHERE fc.projectId = rf.projectId) as compCount
     FROM research_formulations rf WHERE rf.projectId = ? LIMIT 1`,
    [projectId]
  );
  const step1_5 = formulationRows.length > 0 && Number(formulationRows[0]?.compCount || 0) >= 2;

  // Step 6: Batch Analysis
  const [batchRows]: any = await pool.query(
    "SELECT COUNT(*) as count FROM research_batch_analyses WHERE projectId = ?",
    [projectId]
  );
  const step1_6 = Number(batchRows[0]?.count || 0) > 0;

  const sec1Steps = [
    {
      stepKey: "plant-info",
      title: "Plant Information",
      completed: step1_1,
      detail: step1_1
        ? "Botanical taxonomy and experimental plant parts verified"
        : !hasPlantIdentity
        ? "Pending plant identification"
        : "Pending experimental plant parts selection",
    },
    { stepKey: "product-selection", title: "Product Selection", completed: step1_2, detail: step1_2 ? "Target delivery format defined" : "Pending dosage format selection" },
    { stepKey: "extraction", title: "Extraction Parameters", completed: step1_3, detail: step1_3 ? "Standardized extraction method specified" : "Pending solvent & extraction params" },
    { stepKey: "materials", title: "Materials & Reagents", completed: step1_4, detail: step1_4 ? `${materialsRows[0]?.count} materials cataloged` : "Pending raw materials inventory" },
    { stepKey: "formulation-dev", title: "Formulation Development", completed: step1_5, detail: step1_5 ? "Active & excipients matrix configured" : "Pending compounding formulation" },
    { stepKey: "batch-analysis", title: "Batch Analysis", completed: step1_6, detail: step1_6 ? `${batchRows[0]?.count} QC test records recorded` : "Pending QC/pH/stability records" },
  ];

  const sec1CompletedCount = sec1Steps.filter((s) => s.completed).length;
  const sec1Status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
    sec1CompletedCount === 6 ? "COMPLETED" : sec1CompletedCount > 0 ? "IN_PROGRESS" : "NOT_STARTED";

  // Section 2: In-Silico Analysis (7 steps) — ligands come from Section 1 research_compounds
  const [compoundsRows]: any = await pool.query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN smiles IS NOT NULL AND TRIM(smiles) <> '' THEN 1 ELSE 0 END) as structureReady
     FROM research_compounds WHERE projectId = ?`,
    [projectId]
  );
  const compoundsCount = Number(compoundsRows[0]?.total || 0);
  const structureReadyCount = Number(compoundsRows[0]?.structureReady || 0);

  // Step 1: Target Protein Selection
  const [targetsRows]: any = await pool.query(
    "SELECT COUNT(*) as count FROM docking_targets WHERE projectId = ?",
    [projectId]
  );
  const targetsCount = Number(targetsRows[0]?.count || 0);
  const step2_1 = targetsCount > 0;

  // Step 2: In-Silico Screening
  const [screenRows]: any = await pool.query(
    "SELECT COUNT(*) as count FROM insilico_results WHERE projectId = ?",
    [projectId]
  );
  const step2_2 = Number(screenRows[0]?.count || 0) > 0;

  // Step 3: Molecular Docking
  const [dockingRuns]: any = await pool.query(
    "SELECT COUNT(*) as count FROM docking_runs WHERE projectId = ?",
    [projectId]
  );
  const step2_3 = Number(dockingRuns[0]?.count || 0) > 0;

  // Step 4: Binding Affinity Results
  const [affinityRuns]: any = await pool.query(
    "SELECT COUNT(*) as count FROM docking_runs WHERE projectId = ? AND bindingAffinity IS NOT NULL",
    [projectId]
  );
  const step2_4 = Number(affinityRuns[0]?.count || 0) > 0;

  // Step 5: 2D Interaction Visualization
  let step2_5 = step2_4;
  try {
    const [synth2DRows]: any = await pool.query(
      "SELECT id, importantInteractions FROM research_docking_syntheses WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    step2_5 = step2_4 && (synth2DRows.length > 0 || step2_3);
  } catch {
    step2_5 = step2_4;
  }

  // Step 6: 3D Visualization
  const step2_6 = step2_4;

  // Step 7: Results & Interpretation
  let step2_7 = false;
  try {
    const [dockSynth]: any = await pool.query(
      "SELECT id, keyFindings FROM research_docking_syntheses WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    if (dockSynth.length > 0 && !!dockSynth[0].keyFindings) {
      step2_7 = true;
    } else {
      const [synthRows]: any = await pool.query(
        "SELECT id, keyFindings FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      step2_7 = synthRows.length > 0 && !!synthRows[0].keyFindings;
    }
  } catch {
    step2_7 = step2_4;
  }

  const sec2Steps = [
    {
      stepKey: "target-protein-selection",
      title: "Target Protein Selection",
      completed: step2_1,
      detail: step2_1
        ? `${targetsCount} biological target(s) mapped · ${structureReadyCount}/${compoundsCount || 0} Section 1 ligands ready`
        : structureReadyCount > 0
          ? `Pending receptor target · ${structureReadyCount} Section 1 ligand(s) ready`
          : compoundsCount > 0
            ? "Pending receptor target · Section 1 compounds lack molecular structures"
            : "Pending receptor target · identify phytochemicals in Section 1 first",
    },
    { stepKey: "insilico-screening", title: "In-Silico Screening", completed: step2_2, detail: step2_2 ? "ADMET & Lipinski screened" : "Pending drug-likeness screen" },
    { stepKey: "molecular-docking", title: "Molecular Docking Execution", completed: step2_3, detail: step2_3 ? "AutoDock simulation executed" : "Pending docking execution" },
    { stepKey: "binding-affinity", title: "Binding Affinity Results", completed: step2_4, detail: step2_4 ? "Binding affinity (ΔG) recorded" : "Pending energy calculations" },
    { stepKey: "2d-interaction", title: "2D Interaction Visualization", completed: step2_5, detail: step2_5 ? "Key active site residues mapped" : "Pending residue contact mapping" },
    { stepKey: "3d-visualization", title: "3D Molecular Visualization", completed: step2_6, detail: step2_6 ? "3D conformation inspected" : "Pending 3D model validation" },
    { stepKey: "results-interpretation", title: "Results & Interpretation", completed: step2_7, detail: step2_7 ? "Computational synthesis complete" : "Pending in-silico conclusion" },
  ];

  const sec2CompletedCount = sec2Steps.filter((s) => s.completed).length;
  const sec2Status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
    sec2CompletedCount === 7 ? "COMPLETED" : sec2CompletedCount > 0 ? "IN_PROGRESS" : "NOT_STARTED";

  // Section 3: Research Paper Submission (3 steps)
  // Step 1: Research Summary
  let step3_1 = false;
  try {
    await ensureResearchDossierExecutiveSummaryColumn();
    const [dossierRows]: any = await pool.query(
      "SELECT * FROM research_dossiers WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const summary = dossierRows[0]?.executiveSummary;
    step3_1 = Boolean(summary && String(summary).trim().length > 0);
  } catch {
    step3_1 = false;
  }

  // Step 2: Upload Research Paper (also supports legacy structured manuscripts)
  let manuscript: any = null;
  try {
    const [manuscriptRows]: any = await pool.query(
      "SELECT * FROM research_manuscripts WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    manuscript = manuscriptRows[0] || null;
  } catch {
    manuscript = null;
  }
  const hasUploadedManuscriptFile = Boolean(
    manuscript && (manuscript.fileUrl || manuscript.fileName)
  );
  const hasLegacyManuscriptContent = Boolean(
    manuscript && manuscript.abstract && manuscript.conclusion
  );
  const step3_2 = hasUploadedManuscriptFile || hasLegacyManuscriptContent;

  // Step 3: Review & Submit
  const [projectRows]: any = await pool.query(
    "SELECT status FROM research_projects WHERE id = ? LIMIT 1",
    [projectId]
  );
  const currentDbStatus = projectRows[0]?.status || "Draft";
  // Query latest review submission & specialty approvals for Step 4
  let hasSubmittedForReview = false;
  let approvedSpecialtiesCount = 0;
  let revisionRequestedCount = 0;
  try {
    const [subRows]: any = await pool.query(
      "SELECT id, status FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC LIMIT 1",
      [projectId]
    );
    if (subRows && subRows.length > 0) {
      hasSubmittedForReview = true;
      const latestSubId = subRows[0].id;
      const [covRows]: any = await pool.query(
        "SELECT status FROM review_area_coverage WHERE submissionId = ?",
        [latestSubId]
      );
      for (const c of covRows || []) {
        const st = String(c.status || "").toUpperCase();
        if (st === "APPROVED" || st === "COMPLETED") {
          approvedSpecialtiesCount++;
        } else if (st === "REVISION_REQUIRED" || st === "REVISION_REQUESTED") {
          revisionRequestedCount++;
        }
      }
    }
  } catch {
    // Table may not exist yet
  }

  let isCompleted = currentDbStatus === "COMPLETED";
  try {
    const [compRows]: any = await pool.query(
      "SELECT isCompleted FROM research_completions WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    if (compRows?.[0]?.isCompleted) {
      isCompleted = true;
    }
  } catch {
    // Ignore if column not yet added
  }

  const step3_3 =
    hasSubmittedForReview ||
    [
      "Submitted",
      "SUBMITTED",
      "Under Professional Review",
      "Revision Required",
      "REVISION_REQUIRED",
      "REVISION_REQUESTED",
      "Resubmitted",
      "Approved",
      "APPROVED",
      "READY_FOR_REVIEW",
      "UNDER_REVIEW",
      "READY_FOR_COMPLETION",
      "COMPLETED",
    ].includes(currentDbStatus);

  // Laboratory results live inside Paper Submission (optional; not required for canSubmit)
  let labResultsCount = 0;
  try {
    const [labRows]: any = await pool.query(
      "SELECT COUNT(*) AS cnt FROM research_laboratory_results WHERE projectId = ?",
      [projectId]
    );
    labResultsCount = Number(labRows[0]?.cnt || 0);
  } catch {
    labResultsCount = 0;
  }
  // Lab step: 0 saved → 0% / NOT_STARTED; ≥1 saved → 100% / COMPLETED
  const labStepRecorded = labResultsCount > 0;
  const labProgressPercent = labStepRecorded ? 100 : 0;
  const labStepStatus: "NOT_STARTED" | "COMPLETED" = labStepRecorded
    ? "COMPLETED"
    : "NOT_STARTED";

  const sec3Steps: V2ProgressStep[] = [
    {
      stepKey: "research-summary",
      title: "Research Summary",
      completed: step3_1,
      progressPercent: step3_1 ? 100 : 0,
      status: step3_1 ? "COMPLETED" : "NOT_STARTED",
      detail: step3_1
        ? "Executive multi-stage summary compiled"
        : "Pending research summary review",
    },
    {
      stepKey: "laboratory-results",
      title: "Laboratory Results",
      completed: labStepRecorded,
      progressPercent: labProgressPercent,
      status: labStepStatus,
      detail: labStepRecorded
        ? `${labResultsCount} laboratory result${labResultsCount === 1 ? "" : "s"} saved · Complete`
        : "Not Started — optional: save at least one laboratory result",
    },
    {
      stepKey: "upload-research-paper",
      title: "Upload Research Paper",
      completed: step3_2,
      progressPercent: step3_2 ? 100 : 0,
      status: step3_2 ? "COMPLETED" : "NOT_STARTED",
      detail: hasUploadedManuscriptFile
        ? `Uploaded: ${manuscript.fileName || "Research Paper"}`
        : hasLegacyManuscriptContent
        ? "Structured manuscript preserved"
        : "Pending PDF or DOCX manuscript upload",
    },
  ];

  // Required for section COMPLETED / submit: summary + manuscript (lab optional)
  const sec3RequiredCompleted = (step3_1 ? 1 : 0) + (step3_2 ? 1 : 0);
  const sec3CompletedCount = sec3Steps.filter((s) => s.completed).length;
  const sec3Status: V2StepStatus =
    sec3RequiredCompleted === 2
      ? "COMPLETED"
      : sec3CompletedCount > 0 || step3_3
        ? "IN_PROGRESS"
        : "NOT_STARTED";
  // Section bar: 100% only when required steps are done; otherwise reflect all 3 step states
  const sec3ProgressPercent =
    sec3Status === "COMPLETED"
      ? 100
      : Math.round((sec3CompletedCount / 3) * 100);

  // Query live reviewer step approvals from review_step_approvals
  let approvedSteps = {
    section1: [] as number[],
    section2: [] as number[],
    section3: [] as number[],
  };
  try {
    approvedSteps = await getProjectApprovedSteps(projectId);
  } catch {
    // fallback if table query fails
  }

  const s1Valid = approvedSteps.section1.filter((n) => n >= 1 && n <= 6);
  const s2Valid = approvedSteps.section2.filter((n) => n >= 1 && n <= 7);
  const s3Valid = approvedSteps.section3.filter((n) => n >= 1 && n <= 3);
  const s1Pct = Math.round((s1Valid.length / 6) * 100);
  const s2Pct = Math.round((s2Valid.length / 7) * 100);
  const s3Pct = Math.round((s3Valid.length / 3) * 100);
  const totalApprovedSteps = s1Valid.length + s2Valid.length + s3Valid.length;
  // Section 1 (6) + Section 2 (7) + Section 3 (3) = 16 reviewable steps
  const overallApprovalPct = Math.round((totalApprovedSteps / 16) * 100);

  const sec1ApprovedBySteps = s1Valid.length >= 6;
  // Accept legacy 8-step approvals (≥7 or ≥8) as Section 2 complete
  const sec2ApprovedBySteps = s2Valid.length >= 7 || approvedSteps.section2.length >= 7;
  const sec3ApprovedBySteps = s3Valid.length >= 3;
  const stepBasedApprovedSpecialties =
    (sec1ApprovedBySteps ? 1 : 0) +
    (sec2ApprovedBySteps ? 1 : 0) +
    (sec3ApprovedBySteps ? 1 : 0);
  const effectiveApprovedSpecialties = Math.max(
    approvedSpecialtiesCount,
    stepBasedApprovedSpecialties
  );

  // Section 4: Professional Approval (tracks 3-specialty peer review approvals)
  const sec4Steps = [
    {
      stepKey: "formulation-review",
      title: "Formulation Science & Pharmacognosy",
      completed: effectiveApprovedSpecialties >= 1 || isCompleted || sec1ApprovedBySteps,
      detail: "Section 1 formulation & pharmacognosy approval",
    },
    {
      stepKey: "insilico-review",
      title: "Bioinformatics & In-Silico Modeling",
      completed: effectiveApprovedSpecialties >= 2 || isCompleted || sec2ApprovedBySteps,
      detail: "Section 2 molecular docking & target approval",
    },
    {
      stepKey: "clinical-review",
      title: "Clinical Pharmacology & Paper Review",
      completed: effectiveApprovedSpecialties >= 3 || isCompleted || sec3ApprovedBySteps,
      detail: "Section 3 clinical review & manuscript verification",
    },
  ];

  const sec4CompletedCount = isCompleted ? 3 : effectiveApprovedSpecialties;
  const sec4Status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
    isCompleted || effectiveApprovedSpecialties >= 3
      ? "COMPLETED"
      : step3_3
      ? "IN_PROGRESS"
      : "NOT_STARTED";

  // Total: Sec1(6) + Sec2(7) + Paper required(2) + Approval(3) = 18; lab optional bonus not required
  const totalCompleted =
    sec1CompletedCount +
    sec2CompletedCount +
    sec3RequiredCompleted +
    sec4CompletedCount;
  const overallProgressPercent = isCompleted
    ? 100
    : Math.min(99, Math.round((totalCompleted / 18) * 100));

  // Paper submission requires Sec1+Sec2+summary+manuscript (lab optional for submit)
  const canSubmit = sec1Status === "COMPLETED" && sec2Status === "COMPLETED" && step3_1 && step3_2;

  let overallStatus: V2SectionProgress["overallStatus"] = "Draft";
  if (isCompleted) {
    overallStatus = "Completed";
  } else if (
    revisionRequestedCount > 0 ||
    currentDbStatus === "Revision Required" ||
    currentDbStatus === "REVISION_REQUIRED" ||
    currentDbStatus === "REVISION_REQUESTED"
  ) {
    overallStatus = "Revisions Required";
  } else if (
    step3_3 &&
    (effectiveApprovedSpecialties >= 3 ||
      currentDbStatus === "Approved" ||
      currentDbStatus === "APPROVED" ||
      currentDbStatus === "READY_FOR_COMPLETION")
  ) {
    overallStatus = "Fully Approved — Ready to Complete";
  } else if (step3_3) {
    overallStatus = `Under Professional Review — ${effectiveApprovedSpecialties}/3 Approved`;
  } else if (canSubmit) {
    overallStatus = "Ready for Submission";
  }

  return {
    section1: {
      status: sec1Status,
      completedSteps: sec1CompletedCount,
      totalSteps: 6,
      progressPercent: Math.round((sec1CompletedCount / 6) * 100),
      steps: sec1Steps,
    },
    section2: {
      status: sec2Status,
      completedSteps: sec2CompletedCount,
      totalSteps: 7,
      progressPercent: Math.round((sec2CompletedCount / 7) * 100),
      steps: sec2Steps,
    },
    section3: {
      status: sec3Status,
      // Include lab in step count so workspace done/total reflects saved results
      completedSteps: sec3CompletedCount,
      totalSteps: 3,
      progressPercent: sec3ProgressPercent,
      steps: sec3Steps,
    },
    section4: {
      status: sec4Status,
      completedSteps: sec4CompletedCount,
      totalSteps: 3,
      progressPercent: Math.round((sec4CompletedCount / 3) * 100),
      steps: sec4Steps,
    },
    laboratoryResults: {
      count: labResultsCount,
      progressPercent: labProgressPercent,
      status: labStepStatus,
    },
    overallStatus,
    overallProgressPercent,
    canSubmit,
    approvedSpecialtiesCount: effectiveApprovedSpecialties,
    hasSubmittedForReview: step3_3,
    isCompleted,
    approvedStepsBySection: approvedSteps,
    sectionApprovalPercent: {
      section1: s1Pct,
      section2: s2Pct,
      section3: s3Pct,
      overall: overallApprovalPct,
    },
  };
}

