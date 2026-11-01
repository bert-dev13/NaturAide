import pool from "@/lib/db";
import { EXPERT_REVIEW_AREAS, normalizeReviewAreaKey, type ExpertReviewAreaKey } from "@/lib/expert-review-areas";

const PLANT_FAMILY_MAP: Record<string, string> = {
  "Momordica charantia": "Cucurbitaceae",
  "Blumea balsamifera": "Asteraceae",
  "Vitex negundo": "Lamiaceae (Verbenaceae)",
  "Psidium guajava": "Myrtaceae",
  "Senna alata": "Fabaceae",
  "Allium sativum": "Amaryllidaceae",
  "Curcuma longa": "Zingiberaceae",
  "Peperomia pellucida": "Piperaceae",
  "Carmona retusa": "Boraginaceae",
  "Mentha cordifolia": "Lamiaceae",
  "Quisqualis indica": "Combretaceae",
  "Zingiber officinale": "Zingiberaceae",
};

export async function ensureReviewTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS professional_review_areas (
      id INT NOT NULL AUTO_INCREMENT,
      userId INT NOT NULL,
      areaKey VARCHAR(50) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_area (userId, areaKey),
      KEY idx_user (userId)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS review_area_coverage (
      id INT NOT NULL AUTO_INCREMENT,
      submissionId INT NOT NULL,
      projectId INT NOT NULL,
      areaKey VARCHAR(50) NOT NULL,
      reviewerId INT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_submission_area (submissionId, areaKey),
      KEY idx_coverage_reviewer (reviewerId)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS professional_reviews (
      id INT NOT NULL AUTO_INCREMENT,
      assignmentId INT NULL,
      submissionId INT NOT NULL,
      projectId INT NOT NULL,
      reviewerId INT NOT NULL,
      areaKey VARCHAR(50) NOT NULL,
      reviewCycle INT NOT NULL DEFAULT 1,
      assessment ENUM('ACCEPTABLE', 'REVISION_REQUIRED') NULL,
      comments TEXT NULL,
      status ENUM('DRAFT', 'SUBMITTED') NOT NULL DEFAULT 'DRAFT',
      submittedAt DATETIME(3) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_sub_reviewer_area (submissionId, reviewerId, areaKey),
      KEY idx_assignment (assignmentId),
      KEY idx_project (projectId)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await pool.query("ALTER TABLE review_assignments MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING'");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_area_coverage MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING'");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_feedback ADD COLUMN areaKey VARCHAR(50) NULL");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_feedback ADD COLUMN title VARCHAR(191) NULL");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_feedback ADD COLUMN reviewId INT NULL");
  } catch {}
  try {
    await pool.query("ALTER TABLE professional_reviews ADD COLUMN checklistData TEXT NULL");
  } catch {}
}

export async function findDefaultExpertReviewerId(): Promise<number | null> {
  const [rows]: any = await pool.query(
    `
    SELECT u.id
    FROM users u
    JOIN reviewer_profiles rp ON rp.userId = u.id
    WHERE u.role = 'REVIEWER'
      AND u.status = 'ACTIVE'
      AND rp.verificationStatus = 'VERIFIED'
    ORDER BY u.id ASC
    LIMIT 1
    `
  );
  return rows[0]?.id ? Number(rows[0].id) : null;
}

export async function findReviewerForArea(areaKey: string): Promise<number | null> {
  const normKey = normalizeReviewAreaKey(areaKey);
  const [rows]: any = await pool.query(
    `
    SELECT u.id
    FROM users u
    JOIN reviewer_profiles rp ON rp.userId = u.id
    JOIN professional_review_areas pra ON pra.userId = u.id
    WHERE u.role = 'REVIEWER'
      AND u.status = 'ACTIVE'
      AND rp.verificationStatus = 'VERIFIED'
      AND pra.areaKey = ?
    ORDER BY u.id ASC
    LIMIT 1
    `,
    [normKey]
  );
  if (rows[0]?.id) return Number(rows[0].id);
  return findDefaultExpertReviewerId();
}

/**
 * Builds the complete finalized scientific dossier snapshot across Stages 1–5.
 * This guarantees the exact scientific dossier snapshot is frozen at submission time.
 */
export async function buildFullDossierSnapshot(projectId: number): Promise<any> {
  // 1. Completion record
  const [compRows]: any = await pool.query(
    "SELECT * FROM research_completions WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const completion = compRows[0] || null;

  // 2. Plant data and Project details
  const [pRows]: any = await pool.query(
    `SELECT rp.*,
            COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
            p.scientificName as plantScientificName,
            p.category as plantCategory,
            p.botanical_synonyms as botanicalSynonyms,
            p.local_names as plantLocalNames,
            p.plant_parts_used as plantPartsUsed,
            p.source_organization as sourceOrganization,
            p.source_verified as sourceVerified,
            p.simpleUse as traditionalUses
     FROM research_projects rp
     LEFT JOIN plants p ON rp.plantId = p.id
     WHERE rp.id = ?
     LIMIT 1`,
    [projectId]
  );
  const project = pRows[0] || null;

  const [plantDataRows]: any = await pool.query(
    "SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const plantData = plantDataRows[0] || null;

  const [stage1SynthRows]: any = await pool.query(
    "SELECT * FROM research_literature_syntheses WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const stage1Synthesis = stage1SynthRows[0] || null;

  // 3. Stage 1 Literature References
  const [litRefs]: any = await pool.query(
    "SELECT * FROM literature_references WHERE projectId = ? ORDER BY year DESC, id DESC",
    [projectId]
  );

  // 4. Stage 2 Screened Compounds
  const [compounds]: any = await pool.query(
    "SELECT * FROM research_compounds WHERE projectId = ? ORDER BY selectedForDocking DESC, id ASC",
    [projectId]
  );

  // 5. Stage 3 Molecular Docking Runs (Scoped strictly to currently active selected compounds)
  const [dockingRuns]: any = await pool.query(
    `SELECT * FROM docking_runs
     WHERE projectId = ?
       AND compoundId IN (SELECT id FROM research_compounds WHERE projectId = ? AND selectedForDocking = 1)
       AND jobStatus = 'COMPLETED'
       AND bindingAffinity IS NOT NULL
     ORDER BY CAST(bindingAffinity AS DECIMAL(10,3)) ASC, id DESC`,
    [projectId, projectId]
  );

  // 6. Stage 4 Formulations & Safety Assessments
  let formulationsList: any[] = [];
  const [rForm]: any = await pool.query(
    "SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1",
    [projectId]
  );
  if (rForm.length > 0) {
    const [vRows]: any = await pool.query(
      "SELECT * FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1",
      [rForm[0].id]
    );
    if (vRows.length > 0) {
      const [cRows]: any = await pool.query(
        "SELECT * FROM formulation_components WHERE versionId = ?",
        [vRows[0].id]
      );
      const [sRows]: any = await pool.query(
        "SELECT * FROM formulation_steps WHERE versionId = ? ORDER BY stepNumber ASC",
        [vRows[0].id]
      );
      formulationsList = [
        {
          id: vRows[0].id,
          formulationName: rForm[0].formulationName,
          formulationType: rForm[0].formulationType,
          dosageFormType: rForm[0].dosageFormType || "Oral Solution",
          versionNumber: vRows[0].versionNumber,
          versionTag: vRows[0].versionTag,
          preparationMethod: sRows.map((s: any) => `${s.stepNumber}. ${s.procedureText}`).join("\n"),
          components: cRows.map((c: any) => ({
            id: c.id,
            componentName: c.componentName,
            quantity: c.quantity,
            unit: c.unit,
            roleInFormulation: c.roleInFormulation,
            concentration: c.concentration || null,
          })),
        },
      ];
    }
  }

  const [safetyRows]: any = await pool.query(
    "SELECT * FROM research_safety_assessments WHERE projectId = ? ORDER BY id DESC LIMIT 1",
    [projectId]
  );
  const safetyRecord = safetyRows[0] || null;

  const [safetyConcerns]: any = await pool.query(
    `SELECT sc.*
     FROM safety_concerns sc
     JOIN research_safety_assessments rsa ON sc.safetyAssessmentId = rsa.id
     WHERE rsa.projectId = ?
     ORDER BY
       CASE sc.severity
         WHEN 'CRITICAL' THEN 1
         WHEN 'HIGH' THEN 2
         WHEN 'MODERATE' THEN 3
         ELSE 4
       END ASC`,
    [projectId]
  );

  let keyFindings: string[] = [];
  if (completion?.keyFindings) {
    try {
      keyFindings = typeof completion.keyFindings === "string" ? JSON.parse(completion.keyFindings) : completion.keyFindings;
    } catch {
      keyFindings = [completion.keyFindings];
    }
  }

  return {
    completionId: completion?.id || null,
    finalTitle: completion?.finalTitle || project?.title || "Research Dossier",
    abstract: completion?.abstract || project?.shortDescription || "",
    evidenceAlignment: completion?.evidenceAlignment || "",
    keyFindings: Array.isArray(keyFindings) ? keyFindings : [],
    scientificInterpretation: completion?.scientificInterpretation || completion?.biologicalInterpretation || "",
    limitations: completion?.limitations || completion?.evidenceGaps || "",
    finalConclusion: completion?.conclusion || "",
    isSynthesisApproved: Boolean(
      completion?.isSynthesisApproved ||
      (completion?.isInterpretationApproved && completion?.isConclusionApproved)
    ),
    // Botanical & Plant Data (Direct from Researcher Stage 1)
    plantName: project?.plantName || "Unspecified Plant",
    plantScientificName: project?.plantScientificName || "",
    plantFamily: plantData?.family || (project?.plantScientificName && PLANT_FAMILY_MAP[project.plantScientificName]) || "",
    plantLocalNames: plantData?.localNames || project?.plantLocalNames || "",
    plantPartsStudied: plantData?.partsStudied || project?.plantPartsUsed || "Leaves",
    botanicalSynonyms: project?.botanicalSynonyms || "",
    sourceOrganization: project?.sourceOrganization || "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceVerified: Boolean(project?.sourceVerified || project?.plantId),
    specimenSource: plantData?.specimenSource || "",
    collectionDate: plantData?.collectionDate || "",
    collectionLocation: plantData?.collectionLocation || "",
    voucherSpecimenNumber: plantData?.voucherSpecimenNumber || "",
    sampleIdentifier: plantData?.sampleIdentifier || "",
    authenticationMethod: plantData?.authenticationMethod || "Macro-morphological & Taxonomic Key",
    authenticatedBy: plantData?.authenticatedBy || "",
    selectionRationale: plantData?.selectionRationale || "",
    materialType: plantData?.materialType || "Crude Extract",
    extractionMethod: plantData?.extractionMethod || "Cold Maceration with Rotary Evaporation",
    extractionSolvent: plantData?.extractionSolvent || "80% Aqueous Ethanol",
    extractFractionName: plantData?.extractFractionName || "",
    storageHandlingNotes: plantData?.storageHandlingNotes || "",
    authenticationStatus: plantData?.authenticationStatus || "VERIFIED",
    stage1Synthesis: stage1Synthesis
      ? {
          keyFindings: stage1Synthesis.keyFindings || "",
          areasOfAgreement: stage1Synthesis.areasOfAgreement || "",
          conflictingFindings: stage1Synthesis.conflictingFindings || "",
          evidenceLimitations: stage1Synthesis.evidenceLimitations || "",
          remainingGaps: stage1Synthesis.remainingGaps || "",
          relevanceToQuestion: stage1Synthesis.relevanceToQuestion || "",
        }
      : null,
    // Comprehensive Stage Arrays (Read-Only Viewer Grounding)
    literature: litRefs || [],
    compounds: compounds || [],
    dockingRuns: dockingRuns || [],
    formulations: formulationsList,
    safetyRecord,
    safetyConcerns: safetyConcerns || [],
    stages: {
      stage1: {
        label: "Plant & Literature",
        count: litRefs.length,
        unit: "Supporting Studies",
      },
      stage2: {
        label: "In-Silico Analysis",
        count: compounds.length,
        unit: "Compounds Screened",
      },
      stage3: {
        label: "Molecular Docking",
        count: dockingRuns.length,
        unit: "Docking Runs",
      },
      stage4: {
        label: "Formulation & Safety",
        prototype: formulationsList[0]?.formulationName || "Botanical Extract",
        dosageForm: formulationsList[0]?.dosageFormType || "Oral Solution",
      },
      stage5: {
        label: "Research Integration",
        status: completion ? "Synthesis Approved" : "Complete",
      },
    },
  };
}

export async function openExpertReviewCycle(input: {
  projectId: number;
  researcherId: number;
  message?: string | null;
  previousSubmissionId?: number | null;
  snapshotData?: any;
}) {
  await ensureReviewTables();

  const [subRows]: any = await pool.query(
    "SELECT id, reviewRound FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC LIMIT 1",
    [input.projectId]
  );
  const reviewRound = subRows.length > 0 ? Number(subRows[0].reviewRound || 1) + 1 : 1;
  const previousSubmissionId = input.previousSubmissionId ?? (subRows[0]?.id || null);
  const versionTag = `v${reviewRound}.0`;

  // Ensure full rich snapshot
  let snapshotPayload = input.snapshotData;
  if (!snapshotPayload || !snapshotPayload.literature || !snapshotPayload.compounds) {
    snapshotPayload = await buildFullDossierSnapshot(input.projectId);
  }
  const snapshotJson = typeof snapshotPayload === "string" ? snapshotPayload : JSON.stringify(snapshotPayload);

  // Find a default reviewer for fallback
  const defaultReviewerId = await findDefaultExpertReviewerId();
  if (!defaultReviewerId) {
    throw new Error("No verified expert reviewer account is available in the platform.");
  }

  // 1. Create review_submission snapshot
  const [insertRes]: any = await pool.query(
    `
    INSERT INTO review_submissions (
      projectId, versionTag, reviewRound, messageToReviewers, readinessSnapshot, snapshotData,
      previousSubmissionId, assignedReviewerId, status, submittedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', CURRENT_TIMESTAMP(3))
    `,
    [
      input.projectId,
      versionTag,
      reviewRound,
      input.message?.trim() || null,
      JSON.stringify({ areas: EXPERT_REVIEW_AREAS.map((a) => a.key) }),
      snapshotJson,
      reviewRound === 1 ? null : previousSubmissionId,
      defaultReviewerId,
    ]
  );
  const submissionId = insertRes.insertId;

  // 2. Create independent assignments & coverage for all 5 professional areas
  for (const area of EXPERT_REVIEW_AREAS) {
    const reviewerId = (await findReviewerForArea(area.key)) || defaultReviewerId;

    // Create review_assignment row
    const [assignRes]: any = await pool.query(
      `
      INSERT INTO review_assignments (
        projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound, assignedAt
      ) VALUES (?, ?, ?, ?, 'PENDING', ?, CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE status = 'PENDING', reviewerId = VALUES(reviewerId), updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [input.projectId, submissionId, reviewerId, area.key, reviewRound]
    );
    const assignmentId = assignRes.insertId || null;

    // Create review_area_coverage row
    await pool.query(
      `
      INSERT INTO review_area_coverage (submissionId, projectId, areaKey, reviewerId, status)
      VALUES (?, ?, ?, ?, 'PENDING')
      ON DUPLICATE KEY UPDATE status = 'PENDING', reviewerId = VALUES(reviewerId), updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [submissionId, input.projectId, area.key, reviewerId]
    );

    // Create review_section_status row
    await pool.query(
      `
      INSERT INTO review_section_status (submissionId, reviewerId, sectionKey, status)
      VALUES (?, ?, ?, 'NOT_REVIEWED')
      ON DUPLICATE KEY UPDATE status = 'NOT_REVIEWED'
      `,
      [submissionId, reviewerId, area.key]
    );

    // Seed draft in professional_reviews
    await pool.query(
      `
      INSERT INTO professional_reviews (
        assignmentId, submissionId, projectId, reviewerId, areaKey, reviewCycle, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT')
      ON DUPLICATE KEY UPDATE status = 'DRAFT', updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [assignmentId, submissionId, input.projectId, reviewerId, area.key, reviewRound]
    );
  }

  // Update research project stages
  await pool.query(
    `
    UPDATE research_project_stages
    SET status = 'UNDER_REVIEW', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE projectId = ? AND (stageKey = 'expert-review' OR stageKey = 'review')
    `,
    [input.projectId]
  );

  await pool.query(
    `
    UPDATE research_projects
    SET status = 'UNDER_REVIEW', currentStage = 'expert-review', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
    `,
    [input.projectId]
  );

  await pool.query(
    `
    INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
    VALUES (?, ?, 'STAGE_SUBMITTED', ?)
    `,
    [
      input.projectId,
      input.researcherId,
      `Submitted the complete dossier for Stage 6 Final Professional Review (Cycle ${reviewRound})`,
    ]
  );

  return { submissionId, reviewRound, versionTag };
}

export async function syncCoverageStatus(submissionId: number, reviewerId: number, areaKey: string, status: string) {
  try {
    const normKey = normalizeReviewAreaKey(areaKey);
    await pool.query(
      `
      UPDATE review_area_coverage
      SET status = ?, updatedAt = CURRENT_TIMESTAMP(3)
      WHERE submissionId = ? AND areaKey = ? AND reviewerId = ?
      `,
      [status, submissionId, normKey, reviewerId]
    );
  } catch (err) {
    console.error("syncCoverageStatus error:", err);
  }
}

/**
 * Checks overall project approval across all 5 professional areas.
 * The research project is COMPLETED only when ALL 5 areas are independently APPROVED.
 */
export async function evaluateOverallApproval(submissionId: number, projectId: number) {
  const [coverageRows]: any = await pool.query(
    "SELECT areaKey, status FROM review_area_coverage WHERE submissionId = ?",
    [submissionId]
  );

  const approvedCount = coverageRows.filter((r: any) => r.status === "APPROVED" || r.status === "COMPLETED").length;
  const revisionCount = coverageRows.filter((r: any) => r.status === "REVISION_REQUIRED").length;
  const inReviewCount = coverageRows.filter((r: any) => r.status === "IN_REVIEW").length;

  const allApproved = coverageRows.length >= 5 && approvedCount === coverageRows.length;

  if (allApproved) {
    // 5 of 5 Approved: Final Approval achieved! Ready for researcher final completion.
    await pool.query(
      `UPDATE review_submissions SET status = 'ACCEPTED_FOR_NEXT_STAGE', reviewedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [submissionId]
    );
    await pool.query(
      `UPDATE research_dossiers SET status = 'ACCEPTED_FOR_NEXT_STAGE', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ?`,
      [projectId]
    );
    await pool.query(
      `UPDATE research_projects
       SET status = 'READY_FOR_COMPLETION', currentStage = 'knowledge-integration', updatedAt = CURRENT_TIMESTAMP(3)
       WHERE id = ? AND status != 'COMPLETED'`,
      [projectId]
    );
    const [pRows]: any = await pool.query(
      "SELECT researcherId, COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName FROM research_projects rp LEFT JOIN plants p ON rp.plantId = p.id WHERE rp.id = ? LIMIT 1",
      [projectId]
    );
    const researcherId = pRows[0]?.researcherId || 2;
    const plantName = pRows[0]?.plantName || "Botanical Research";

    // Create readiness notification (idempotent, avoid duplicates)
    const [notifExists]: any = await pool.query(
      "SELECT id FROM review_notifications WHERE userId = ? AND type = 'ACCEPTED_FOR_NEXT_STAGE' AND link LIKE ? LIMIT 1",
      [researcherId, `%/projects/${projectId}/%`]
    );

    if (notifExists.length === 0) {
      await pool.query(
        `INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
         VALUES (?, 'ACCEPTED_FOR_NEXT_STAGE', 'Research Ready for Completion', ?, ?, 0, CURRENT_TIMESTAMP(3))`,
        [
          researcherId,
          `${plantName}: All required professional reviews have been approved. Your research can now be finalized.`,
          `/researcher/projects/${projectId}/knowledge-integration#sec-dossier`,
        ]
      );
    }

    await pool.query(
      `INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
       VALUES (?, ?, 'PROJECT_APPROVED', 'All required professional review areas approved. Research ready for final completion.')`,
      [projectId, researcherId]
    );
  } else if (revisionCount > 0) {
    // At least one area requested revision
    await pool.query(
      `UPDATE review_submissions SET status = 'REVISION_REQUESTED', reviewedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [submissionId]
    );
    await pool.query(
      `UPDATE research_dossiers SET status = 'REVISION_REQUESTED', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ?`,
      [projectId]
    );
    await pool.query(
      `UPDATE research_project_stages SET status = 'REVISION_REQUESTED', updatedAt = CURRENT_TIMESTAMP(3)
       WHERE projectId = ? AND (stageKey = 'expert-review' OR stageKey = 'review')`,
      [projectId]
    );
    await pool.query(
      `UPDATE research_projects SET status = 'REVISION_REQUIRED', currentStage = 'expert-review', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [projectId]
    );
  } else if (inReviewCount > 0 || approvedCount > 0) {
    // Some in review or approved
    await pool.query(
      `UPDATE review_submissions SET status = 'UNDER_REVIEW' WHERE id = ?`,
      [submissionId]
    );
    await pool.query(
      `UPDATE research_projects SET status = 'UNDER_REVIEW', currentStage = 'expert-review', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [projectId]
    );
  }

  return {
    totalAreas: coverageRows.length,
    approvedCount,
    revisionCount,
    inReviewCount,
    allApproved,
  };
}
