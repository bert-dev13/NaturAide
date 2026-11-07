import pool from "@/lib/db";
import { getProjectApprovedSteps } from "@/lib/expert-review-assignment";

export interface V2SectionProgress {
  section1: {
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    completedSteps: number;
    totalSteps: 6;
    steps: {
      stepKey: string;
      title: string;
      completed: boolean;
      detail?: string;
    }[];
  };
  section2: {
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    completedSteps: number;
    totalSteps: 8;
    steps: {
      stepKey: string;
      title: string;
      completed: boolean;
      detail?: string;
    }[];
  };
  section3: {
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    completedSteps: number;
    totalSteps: number;
    steps: {
      stepKey: string;
      title: string;
      completed: boolean;
      detail?: string;
    }[];
  };
  section4: {
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    completedSteps: number;
    totalSteps: number;
    steps: {
      stepKey: string;
      title: string;
      completed: boolean;
      detail?: string;
    }[];
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

export async function calculateV2ProjectProgress(projectId: number): Promise<V2SectionProgress> {
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

  // Section 2: In-Silico Analysis (8 steps)
  // Step 1: Phytochemical Selection
  const [compoundsRows]: any = await pool.query(
    "SELECT COUNT(*) as count FROM research_compounds WHERE projectId = ?",
    [projectId]
  );
  const compoundsCount = Number(compoundsRows[0]?.count || 0);
  const step2_1 = compoundsCount > 0;

  // Step 2: Target Protein Selection
  const [targetsRows]: any = await pool.query(
    "SELECT COUNT(*) as count FROM docking_targets WHERE projectId = ?",
    [projectId]
  );
  const targetsCount = Number(targetsRows[0]?.count || 0);
  const step2_2 = targetsCount > 0;

  // Step 3: In-Silico Screening
  const [screenRows]: any = await pool.query(
    "SELECT COUNT(*) as count FROM insilico_results WHERE projectId = ?",
    [projectId]
  );
  const step2_3 = Number(screenRows[0]?.count || 0) > 0;

  // Step 4: Molecular Docking
  const [dockingRuns]: any = await pool.query(
    "SELECT COUNT(*) as count FROM docking_runs WHERE projectId = ?",
    [projectId]
  );
  const step2_4 = Number(dockingRuns[0]?.count || 0) > 0;

  // Step 5: Binding Affinity Results
  const [affinityRuns]: any = await pool.query(
    "SELECT COUNT(*) as count FROM docking_runs WHERE projectId = ? AND bindingAffinity IS NOT NULL",
    [projectId]
  );
  const step2_5 = Number(affinityRuns[0]?.count || 0) > 0;

  // Step 6: 2D Interaction Visualization
  let step2_6 = step2_5;
  try {
    const [synth2DRows]: any = await pool.query(
      "SELECT id, importantInteractions FROM research_docking_syntheses WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    step2_6 = step2_5 && (synth2DRows.length > 0 || step2_4);
  } catch {
    step2_6 = step2_5;
  }

  // Step 7: 3D Visualization
  const step2_7 = step2_5;

  // Step 8: Results & Interpretation
  let step2_8 = false;
  try {
    const [dockSynth]: any = await pool.query(
      "SELECT id, keyFindings FROM research_docking_syntheses WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    if (dockSynth.length > 0 && !!dockSynth[0].keyFindings) {
      step2_8 = true;
    } else {
      const [synthRows]: any = await pool.query(
        "SELECT id, keyFindings FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      step2_8 = synthRows.length > 0 && !!synthRows[0].keyFindings;
    }
  } catch {
    step2_8 = step2_5;
  }

  const sec2Steps = [
    { stepKey: "phytochemical-selection", title: "Phytochemical Selection", completed: step2_1, detail: step2_1 ? `${compoundsCount} compound(s) selected` : "Pending botanical metabolites" },
    { stepKey: "target-protein-selection", title: "Target Protein Selection", completed: step2_2, detail: step2_2 ? `${targetsCount} biological target(s) mapped` : "Pending receptor target" },
    { stepKey: "insilico-screening", title: "In-Silico Screening", completed: step2_3, detail: step2_3 ? "ADMET & Lipinski screened" : "Pending drug-likeness screen" },
    { stepKey: "molecular-docking", title: "Molecular Docking", completed: step2_4, detail: step2_4 ? "AutoDock simulation executed" : "Pending docking execution" },
    { stepKey: "binding-affinity", title: "Binding Affinity Results", completed: step2_5, detail: step2_5 ? "Binding affinity (ΔG) recorded" : "Pending energy calculations" },
    { stepKey: "2d-interaction", title: "2D Protein-Ligand Interactions", completed: step2_6, detail: step2_6 ? "Key active site residues mapped" : "Pending residue contact mapping" },
    { stepKey: "3d-visualization", title: "3D Molecular Visualization", completed: step2_7, detail: step2_7 ? "3D conformation inspected" : "Pending 3D model validation" },
    { stepKey: "results-interpretation", title: "Results and Interpretation", completed: step2_8, detail: step2_8 ? "Computational synthesis complete" : "Pending in-silico conclusion" },
  ];

  const sec2CompletedCount = sec2Steps.filter((s) => s.completed).length;
  const sec2Status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
    sec2CompletedCount === 8 ? "COMPLETED" : sec2CompletedCount > 0 ? "IN_PROGRESS" : "NOT_STARTED";

  // Section 3: Research Paper Submission (3 steps)
  // Step 1: Research Summary
  const [dossierRows]: any = await pool.query(
    "SELECT id, executiveSummary FROM research_dossiers WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const step3_1 = Boolean(
    dossierRows.length > 0 &&
      dossierRows[0].executiveSummary &&
      String(dossierRows[0].executiveSummary).trim().length > 0
  );

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

  const sec3Steps = [
    {
      stepKey: "research-summary",
      title: "Research Summary",
      completed: step3_1,
      detail: step3_1
        ? "Executive multi-stage summary compiled"
        : "Pending research summary review",
    },
    {
      stepKey: "upload-research-paper",
      title: "Upload Research Paper",
      completed: step3_2,
      detail: hasUploadedManuscriptFile
        ? `Uploaded: ${manuscript.fileName || "Research Paper"}`
        : hasLegacyManuscriptContent
        ? "Structured manuscript preserved"
        : "Pending PDF or DOCX manuscript upload",
    },
  ];

  const sec3CompletedCount = sec3Steps.filter((s) => s.completed).length;
  const sec3Status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
    sec3CompletedCount === 2 ? "COMPLETED" : sec3CompletedCount > 0 ? "IN_PROGRESS" : "NOT_STARTED";

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

  const s1Pct = Math.round((approvedSteps.section1.length / 6) * 100);
  const s2Pct = Math.round((approvedSteps.section2.length / 8) * 100);
  const s3Pct = Math.round((approvedSteps.section3.length / 2) * 100);
  const totalApprovedSteps =
    approvedSteps.section1.length + approvedSteps.section2.length + approvedSteps.section3.length;
  const overallApprovalPct = Math.round((totalApprovedSteps / 16) * 100);

  const sec1ApprovedBySteps = approvedSteps.section1.length >= 6;
  const sec2ApprovedBySteps = approvedSteps.section2.length >= 8;
  const sec3ApprovedBySteps = approvedSteps.section3.length >= 2;
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

  // Total steps across Section 1 (6), Section 2 (8), Section 3 (2), and Section 4 (3) = 19
  const totalCompleted = sec1CompletedCount + sec2CompletedCount + sec3CompletedCount + sec4CompletedCount;
  const overallProgressPercent = isCompleted
    ? 100
    : Math.min(99, Math.round((totalCompleted / 19) * 100));

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
      steps: sec1Steps,
    },
    section2: {
      status: sec2Status,
      completedSteps: sec2CompletedCount,
      totalSteps: 8,
      steps: sec2Steps,
    },
    section3: {
      status: sec3Status,
      completedSteps: sec3CompletedCount,
      totalSteps: 2,
      steps: sec3Steps,
    },
    section4: {
      status: sec4Status,
      completedSteps: sec4CompletedCount,
      totalSteps: 3,
      steps: sec4Steps,
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

