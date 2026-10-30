import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Project & plant
    const [projectRows]: any = await pool.query(
      `
      SELECT
        rp.*,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        p.category as plantFamily
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      `,
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    const project = projectRows[0];

    // Stages
    const [stages]: any = await pool.query(
      "SELECT stageKey, status FROM research_project_stages WHERE projectId = ?",
      [projectId]
    );
    const stageMap: Record<string, string> = {};
    for (const s of stages) {
      stageMap[s.stageKey] = s.status;
    }

    // 1. Evidence Review
    const [evReview]: any = await pool.query(
      "SELECT * FROM research_evidence_reviews WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const evidenceReview = evReview[0] || null;

    // 2. Plant Research
    const [plantDataRows]: any = await pool.query(
      "SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const plantData = plantDataRows[0] || null;

    // 3. Literature
    const [literature]: any = await pool.query(
      "SELECT * FROM literature_references WHERE projectId = ? ORDER BY year DESC, id DESC",
      [projectId]
    );

    // 4. In-Silico
    const [compounds]: any = await pool.query(
      "SELECT * FROM research_compounds WHERE projectId = ?",
      [projectId]
    );
    const [inSilico]: any = await pool.query(
      "SELECT * FROM insilico_results WHERE projectId = ? ORDER BY id DESC",
      [projectId]
    );

    // 5. Molecular Docking
    const [dockingSetups]: any = await pool.query(
      "SELECT * FROM docking_setups WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const [dockingRuns]: any = await pool.query(
      "SELECT * FROM docking_runs WHERE projectId = ? ORDER BY id DESC",
      [projectId]
    );

    // 6. Formulation (Current active version)
    const [formulationRows]: any = await pool.query(
      "SELECT * FROM research_formulations WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const formulation = formulationRows[0] || null;

    let activeFormulationVersion: any = null;
    let components: any[] = [];
    let steps: any[] = [];
    let batches: any[] = [];
    let rationale: any = null;

    if (formulation) {
      const [vRows]: any = await pool.query(
        "SELECT * FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1",
        [formulation.id]
      );
      activeFormulationVersion = vRows[0] || null;

      if (activeFormulationVersion) {
        const [cRows]: any = await pool.query(
          "SELECT * FROM formulation_components WHERE versionId = ? ORDER BY id ASC",
          [activeFormulationVersion.id]
        );
        components = cRows;

        const [sRows]: any = await pool.query(
          "SELECT * FROM formulation_steps WHERE versionId = ? ORDER BY stepNumber ASC",
          [activeFormulationVersion.id]
        );
        steps = sRows;

        const [bRows]: any = await pool.query(
          "SELECT * FROM formulation_batches WHERE versionId = ? ORDER BY id DESC",
          [activeFormulationVersion.id]
        );
        batches = bRows;

        const [rRows]: any = await pool.query(
          "SELECT * FROM formulation_rationales WHERE versionId = ? LIMIT 1",
          [activeFormulationVersion.id]
        );
        rationale = rRows[0] || null;
      }
    }

    // 7. Safety Assessment
    let safetyAssessment: any = null;
    let safetyComponentAssessments: any[] = [];
    let safetyConcerns: any[] = [];
    let safetySummary: any = null;

    if (activeFormulationVersion) {
      const [saRows]: any = await pool.query(
        "SELECT * FROM research_safety_assessments WHERE projectId = ? AND formulationVersionId = ? LIMIT 1",
        [projectId, activeFormulationVersion.id]
      );
      safetyAssessment = saRows[0] || null;
    }
    if (!safetyAssessment) {
      const [saFallback]: any = await pool.query(
        "SELECT * FROM research_safety_assessments WHERE projectId = ? ORDER BY id DESC LIMIT 1",
        [projectId]
      );
      safetyAssessment = saFallback[0] || null;
    }

    if (safetyAssessment) {
      const [scaRows]: any = await pool.query(
        "SELECT * FROM safety_component_assessments WHERE safetyAssessmentId = ?",
        [safetyAssessment.id]
      );
      safetyComponentAssessments = scaRows;

      const [scRows]: any = await pool.query(
        "SELECT * FROM safety_concerns WHERE safetyAssessmentId = ? ORDER BY FIELD(severity, 'CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'INFORMATIONAL')",
        [safetyAssessment.id]
      );
      safetyConcerns = scRows;

      const [ssRows]: any = await pool.query(
        "SELECT * FROM safety_summaries WHERE safetyAssessmentId = ? LIMIT 1",
        [safetyAssessment.id]
      );
      safetySummary = ssRows[0] || null;
    }

    // Safety Flags / Items Requiring Professional Review
    const highCriticalConcerns = safetyConcerns.filter(
      (c) => c.severity === "CRITICAL" || c.severity === "HIGH"
    );
    const escalatedComponents = safetyComponentAssessments.filter(
      (c) => c.needsProfessionalReview === 1 || c.needsProfessionalReview === true
    );
    const unresolvedQuestions: string[] = [];
    if (safetySummary?.unresolvedSafetyQuestions) {
      unresolvedQuestions.push(safetySummary.unresolvedSafetyQuestions);
    }
    if (rationale?.validationQuestions) {
      unresolvedQuestions.push(rationale.validationQuestions);
    }
    const evidenceLimitations = safetySummary?.evidenceLimitations || null;

    // Real dynamic readiness evaluation
    const missingItems: string[] = [];
    const readiness = {
      evidenceReview: stageMap["evidence-review"] === "COMPLETED" || Boolean(evidenceReview),
      plantResearch: stageMap["plant-research"] === "COMPLETED" || Boolean(plantData),
      literature: (stageMap["literature"] === "COMPLETED" || literature.length > 0) && literature.length > 0,
      inSilico: stageMap["in-silico"] === "COMPLETED" || inSilico.length > 0,
      docking: stageMap["docking"] === "COMPLETED" || dockingRuns.length > 0,
      formulation: stageMap["formulation"] === "COMPLETED" || (Boolean(activeFormulationVersion) && components.length > 0),
      safety: stageMap["safety"] === "COMPLETED" || Boolean(safetyAssessment),
      hasActiveFormulation: Boolean(activeFormulationVersion),
      safetyLinkedToFormulation: Boolean(
        safetyAssessment && activeFormulationVersion && safetyAssessment.formulationVersionId === activeFormulationVersion.id
      ),
      hasReferences: literature.length > 0 || Boolean(evidenceReview?.supportingReferences),
      hasObjective: Boolean(project.researchObjective?.trim() || project.researchQuestion?.trim()),
    };

    if (!readiness.evidenceReview) missingItems.push("Stage 1 Evidence Review not completed");
    if (!readiness.plantResearch) missingItems.push("Stage 2 Botanical Plant Research not completed");
    if (!readiness.literature) missingItems.push("Stage 3 Literature Citations missing");
    if (!readiness.inSilico) missingItems.push("Stage 4 In-Silico Analysis not recorded");
    if (!readiness.docking) missingItems.push("Stage 5 Molecular Docking not recorded");
    if (!readiness.formulation) missingItems.push("Stage 6 Formulation Builder not completed");
    if (!readiness.safety) missingItems.push("Stage 7 Safety Assessment not completed");
    if (!readiness.hasActiveFormulation) missingItems.push("No active formulation version (v1.0+) established");
    if (!readiness.safetyLinkedToFormulation) missingItems.push("Safety assessment is not linked to current formulation version");
    if (!readiness.hasObjective) missingItems.push("Project research objective or question is missing");

    const isReadyForReview = missingItems.length === 0;

    // Previous dossier submissions & versions
    const [submissions]: any = await pool.query(
      `
      SELECT
        rs.*,
        u.name as reviewerName,
        rp.specialty as reviewerSpecialty,
        rp.verificationStatus as reviewerVerificationStatus
      FROM review_submissions rs
      LEFT JOIN users u ON rs.assignedReviewerId = u.id
      LEFT JOIN reviewer_profiles rp ON u.id = rp.userId
      WHERE rs.projectId = ?
      ORDER BY rs.id DESC
      `,
      [projectId]
    );

    // Available verified reviewer specialties
    const [specialtyRows]: any = await pool.query(
      `SELECT DISTINCT rp.specialty FROM reviewer_profiles rp
       JOIN users u ON u.id = rp.userId
       WHERE rp.verificationStatus = 'VERIFIED' AND u.status = 'ACTIVE' AND u.role = 'REVIEWER'`
    );
    const availableSpecialties = specialtyRows.map((r: any) => r.specialty);
    if (!availableSpecialties.includes("PHARMACIST")) availableSpecialties.push("PHARMACIST");
    if (!availableSpecialties.includes("PHARMACOLOGIST")) availableSpecialties.push("PHARMACOLOGIST");
    if (!availableSpecialties.includes("PHYSICIAN")) availableSpecialties.push("PHYSICIAN");
    if (!availableSpecialties.includes("ETHNOBOTANIST")) availableSpecialties.push("ETHNOBOTANIST");
    if (!availableSpecialties.includes("CHEMIST")) availableSpecialties.push("CHEMIST");

    return NextResponse.json({
      success: true,
      project,
      stageMap,
      readiness,
      isReadyForReview,
      missingItems,
      dossierPreview: {
        overview: {
          title: project.title,
          researchObjective: project.researchObjective,
          researchQuestion: project.researchQuestion,
          areaOfInterest: project.areaOfInterest,
          expectedOutcome: project.expectedOutcome,
          shortDescription: project.shortDescription,
        },
        plantData,
        evidenceReview,
        literature,
        compounds,
        inSilico,
        docking: {
          setup: dockingSetups[0] || null,
          runs: dockingRuns,
        },
        formulation: {
          overview: formulation,
          version: activeFormulationVersion,
          components,
          steps,
          batches,
          rationale,
        },
        safety: {
          assessment: safetyAssessment,
          components: safetyComponentAssessments,
          concerns: safetyConcerns,
          summary: safetySummary,
        },
        safetyFlags: {
          highCriticalConcerns,
          escalatedComponents,
          unresolvedQuestions,
          evidenceLimitations,
        },
      },
      availableSpecialties,
      submissions,
      latestSubmission: submissions[0] || null,
    });
  } catch (error) {
    console.error("Stage 8 review GET error:", error);
    return NextResponse.json({ error: "Failed to load review readiness" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Verify ownership (researcher cannot review own research, must be project owner submitting)
    const [pCheck]: any = await pool.query(
      `
      SELECT
        rp.*,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      `,
      [projectId, session.id]
    );
    if (pCheck.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    const project = pCheck[0];

    const body = await request.json();
    const { messageToReviewers, preferredSpecialty } = body;

    // Check existing submissions to determine versionTag and reviewRound
    const [subCount]: any = await pool.query(
      "SELECT COUNT(*) as count FROM review_submissions WHERE projectId = ?",
      [projectId]
    );
    const count = subCount[0]?.count || 0;
    const versionTag = `v${count + 1}.0`;
    const reviewRound = count + 1;

    // Compile entire immutable snapshot of Stages 1–7
    const [evReview]: any = await pool.query(
      "SELECT * FROM research_evidence_reviews WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const [plantData]: any = await pool.query(
      "SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const [literature]: any = await pool.query(
      "SELECT * FROM literature_references WHERE projectId = ? ORDER BY year DESC",
      [projectId]
    );
    const [compounds]: any = await pool.query(
      "SELECT * FROM research_compounds WHERE projectId = ?",
      [projectId]
    );
    const [inSilico]: any = await pool.query(
      "SELECT * FROM insilico_results WHERE projectId = ? ORDER BY id DESC",
      [projectId]
    );
    const [dockingRuns]: any = await pool.query(
      "SELECT * FROM docking_runs WHERE projectId = ? ORDER BY id DESC",
      [projectId]
    );
    const [dockingSetups]: any = await pool.query(
      "SELECT * FROM docking_setups WHERE projectId = ? LIMIT 1",
      [projectId]
    );

    // Formulation active version
    const [formulationRows]: any = await pool.query(
      "SELECT * FROM research_formulations WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const formulation = formulationRows[0] || null;
    let activeVersion: any = null;
    let components: any[] = [];
    let steps: any[] = [];
    let batches: any[] = [];
    let rationale: any = null;

    if (formulation) {
      const [vRows]: any = await pool.query(
        "SELECT * FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1",
        [formulation.id]
      );
      activeVersion = vRows[0] || null;
      if (activeVersion) {
        const [cRows]: any = await pool.query(
          "SELECT * FROM formulation_components WHERE versionId = ?",
          [activeVersion.id]
        );
        components = cRows;

        const [sRows]: any = await pool.query(
          "SELECT * FROM formulation_steps WHERE versionId = ? ORDER BY stepNumber ASC",
          [activeVersion.id]
        );
        steps = sRows;

        const [bRows]: any = await pool.query(
          "SELECT * FROM formulation_batches WHERE versionId = ?",
          [activeVersion.id]
        );
        batches = bRows;

        const [rRows]: any = await pool.query(
          "SELECT * FROM formulation_rationales WHERE versionId = ? LIMIT 1",
          [activeVersion.id]
        );
        rationale = rRows[0] || null;
      }
    }

    // Safety active assessment
    let safetyAssessment: any = null;
    let safetyComponents: any[] = [];
    let safetyConcerns: any[] = [];
    let safetySummary: any = null;

    if (activeVersion) {
      const [saRows]: any = await pool.query(
        "SELECT * FROM research_safety_assessments WHERE projectId = ? AND formulationVersionId = ? LIMIT 1",
        [projectId, activeVersion.id]
      );
      safetyAssessment = saRows[0] || null;
    }
    if (!activeVersion || components.length === 0 || !safetyAssessment) {
      return NextResponse.json(
        {
          error:
            "Stage 8 readiness gate failed: An active formulation prototype with components (Stage 6) and a linked safety assessment (Stage 7) are mandatory before submitting to professional review.",
        },
        { status: 400 }
      );
    }

    if (safetyAssessment) {
      const [scaRows]: any = await pool.query(
        "SELECT * FROM safety_component_assessments WHERE safetyAssessmentId = ?",
        [safetyAssessment.id]
      );
      safetyComponents = scaRows;

      const [scRows]: any = await pool.query(
        "SELECT * FROM safety_concerns WHERE safetyAssessmentId = ?",
        [safetyAssessment.id]
      );
      safetyConcerns = scRows;

      const [ssRows]: any = await pool.query(
        "SELECT * FROM safety_summaries WHERE safetyAssessmentId = ? LIMIT 1",
        [safetyAssessment.id]
      );
      safetySummary = ssRows[0] || null;
    }

    // High / critical safety flags for rapid reviewer triage
    const highCriticalConcerns = safetyConcerns.filter(
      (c) => c.severity === "CRITICAL" || c.severity === "HIGH"
    );
    const escalatedComponents = safetyComponents.filter(
      (c) => c.needsProfessionalReview === 1 || c.needsProfessionalReview === true
    );

    const safetyFlagsSnapshot = {
      highCriticalConcernsCount: highCriticalConcerns.length,
      highCriticalConcerns,
      escalatedComponentsCount: escalatedComponents.length,
      escalatedComponents,
      unresolvedQuestions: safetySummary?.unresolvedSafetyQuestions || null,
      evidenceLimitations: safetySummary?.evidenceLimitations || null,
    };

    // Build the consolidated immutable dossier snapshot
    const immutableSnapshot = {
      project: {
        id: project.id,
        title: project.title,
        plantName: project.plantName,
        plantScientificName: project.plantScientificName,
        researchObjective: project.researchObjective,
        researchQuestion: project.researchQuestion,
        areaOfInterest: project.areaOfInterest,
        expectedOutcome: project.expectedOutcome,
        shortDescription: project.shortDescription,
      },
      evidenceReview: evReview[0] || null,
      plantData: plantData[0] || null,
      literature: literature || [],
      compounds: compounds || [],
      inSilico: inSilico || [],
      docking: dockingRuns || [],
      dockingSetup: dockingSetups[0] || null,
      // Backward-compatible formulations array for existing reviewer views + rich objects
      formulations: activeVersion
        ? [
            {
              id: activeVersion.id,
              formulationName: formulation?.formulationName || "Research Formulation Prototype",
              formulationType: formulation?.formulationType || "Extract",
              versionNumber: activeVersion.versionNumber || "1.0",
              versionTag: activeVersion.versionTag || "v1.0",
              preparationMethod: steps.map((s: any) => `${s.stepNumber}. ${s.procedureText}`).join("\n"),
              ingredients: components.map((c: any) => ({
                id: c.id,
                ingredientName: c.componentName,
                quantity: c.quantity,
                unit: c.unit,
                role: c.roleInFormulation,
              })),
              components,
              steps,
              batches,
              rationale,
            },
          ]
        : [],
      // Backward-compatible safety object + rich assessments
      safety: safetyAssessment
        ? {
            id: safetyAssessment.id,
            knownAdverseEffects: safetyAssessment.knownAdverseEffects,
            contraindications: safetyAssessment.potentialContraindications,
            drugInteractions: safetyAssessment.herbDrugInteractions,
            toxicityEvidence: safetyAssessment.toxicityEvidence,
            populationConsiderations: safetyAssessment.populationConsiderations,
            doseConcentrationConcerns: safetyAssessment.doseConcentrationConcerns,
            evidenceGaps: safetyAssessment.evidenceGaps,
            additionalSafetyNotes: safetyAssessment.additionalSafetyNotes,
            concerns: safetyConcerns,
            components: safetyComponents,
            summary: safetySummary,
          }
        : null,
      safetyFlags: safetyFlagsSnapshot,
      compiledAt: new Date().toISOString(),
      submittedBy: {
        id: session.id,
        name: session.name,
        email: session.email,
      },
    };

    const snapshotJson = JSON.stringify(immutableSnapshot);

    // 1. Ensure record in research_dossiers
    await pool.query(
      `
      INSERT INTO research_dossiers (projectId, researcherId, currentVersionTag, status)
      VALUES (?, ?, ?, 'UNDER_REVIEW')
      ON DUPLICATE KEY UPDATE
        currentVersionTag = VALUES(currentVersionTag),
        status = 'UNDER_REVIEW',
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [projectId, session.id, versionTag]
    );

    const [dossierRow]: any = await pool.query(
      "SELECT id FROM research_dossiers WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const dossierId = dossierRow[0]?.id || 1;

    // 2. Insert into research_dossier_versions
    const [verRes]: any = await pool.query(
      `
      INSERT INTO research_dossier_versions (
        dossierId, projectId, researcherId, versionTag, reviewRound,
        formulationVersionId, formulationVersionTag, submissionStatus,
        preferredSpecialty, messageToReviewers, readinessSnapshot,
        dossierSnapshot, safetyFlagsSnapshot, submissionTimestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))
      `,
      [
        dossierId,
        projectId,
        session.id,
        versionTag,
        reviewRound,
        activeVersion?.id || null,
        activeVersion?.versionTag || "v1.0",
        preferredSpecialty || "PHARMACIST",
        messageToReviewers?.trim() || null,
        JSON.stringify({ isReadyForReview: true, stageCount: 7 }),
        snapshotJson,
        JSON.stringify(safetyFlagsSnapshot),
      ]
    );
    const dossierVersionId = verRes.insertId;

    // 3. Insert stage-by-stage snapshots in research_dossier_stage_snapshots
    const stageSnapshots = [
      { key: "evidence-review", title: "Evidence Review", status: "COMPLETED", data: evReview[0] || {} },
      { key: "plant-research", title: "Plant Research", status: "COMPLETED", data: plantData[0] || {} },
      { key: "literature", title: "Literature & Evidence", status: "COMPLETED", data: literature || [] },
      { key: "in-silico", title: "In-Silico Analysis", status: "COMPLETED", data: inSilico || [] },
      { key: "docking", title: "Molecular Docking", status: "COMPLETED", data: dockingRuns || [] },
      { key: "formulation", title: "Formulation Builder", status: "COMPLETED", data: { formulation, version: activeVersion, components, steps, batches, rationale } },
      { key: "safety", title: "Safety Assessment", status: "COMPLETED", data: { safetyAssessment, components: safetyComponents, concerns: safetyConcerns, summary: safetySummary } },
    ];

    for (const ss of stageSnapshots) {
      await pool.query(
        `
        INSERT INTO research_dossier_stage_snapshots (
          dossierVersionId, projectId, stageKey, stageTitle, stageStatus, snapshotPayload
        ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [dossierVersionId, projectId, ss.key, ss.title, ss.status, JSON.stringify(ss.data)]
      );
    }

    // 4. Select a verified reviewer for assignment
    // Find reviewer matching preferred specialty, or any verified reviewer
    let assignedReviewerId: number | null = null;
    let assignedSpecialty = preferredSpecialty || "PHARMACIST";

    const [matchedReviewers]: any = await pool.query(
      `
      SELECT rp.userId, rp.specialty
      FROM reviewer_profiles rp
      JOIN users u ON rp.userId = u.id
      WHERE rp.verificationStatus = 'VERIFIED'
        AND u.status = 'ACTIVE'
        AND u.role = 'REVIEWER'
        AND u.id != ?
      ORDER BY (rp.specialty = ?) DESC, rp.id ASC
      LIMIT 1
      `,
      [session.id, assignedSpecialty]
    );

    if (matchedReviewers.length > 0) {
      assignedReviewerId = matchedReviewers[0].userId;
      assignedSpecialty = matchedReviewers[0].specialty;
    }

    // 5. Insert into review_submissions (for seamless integration with existing reviewer module)
    const [subRes]: any = await pool.query(
      `
      INSERT INTO review_submissions (
        projectId, versionTag, reviewRound, messageToReviewers,
        readinessSnapshot, snapshotData, assignedReviewerId, status, submittedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', CURRENT_TIMESTAMP(3))
      `,
      [
        projectId,
        versionTag,
        reviewRound,
        messageToReviewers?.trim() || null,
        JSON.stringify({ isReadyForReview: true }),
        snapshotJson,
        assignedReviewerId,
      ]
    );
    const submissionId = subRes.insertId;

    // Update dossier version with assigned reviewer
    if (assignedReviewerId) {
      await pool.query(
        "UPDATE research_dossier_versions SET assignedReviewerId = ? WHERE id = ?",
        [assignedReviewerId, dossierVersionId]
      );
    }

    // 6. Create review_assignments
    if (assignedReviewerId) {
      await pool.query(
        `
        INSERT INTO review_assignments (
          projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound, assignedAt
        ) VALUES (?, ?, ?, ?, 'PENDING', ?, CURRENT_TIMESTAMP(3))
        `,
        [projectId, submissionId, assignedReviewerId, assignedSpecialty, reviewRound]
      );
    }

    // 7. Log activities in review_activity_logs & research_activity_logs
    await pool.query(
      `
      INSERT INTO review_activity_logs (
        projectId, submissionId, dossierVersionId, actorId, actorRole, actionType, description
      ) VALUES (?, ?, ?, ?, 'RESEARCHER', 'DOSSIER_SUBMITTED', ?)
      `,
      [
        projectId,
        submissionId,
        dossierVersionId,
        session.id,
        `Submitted immutable Research Dossier ${versionTag} for Professional Review (${assignedSpecialty})`,
      ]
    );

    await pool.query(
      `
      INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
      VALUES (?, ?, 'DOSSIER_SUBMITTED', ?)
      `,
      [
        projectId,
        session.id,
        `Submitted Research Dossier ${versionTag} for Independent Professional Evaluation`,
      ]
    );

    // 8. Update project and stage status
    await pool.query(
      `
      UPDATE research_projects
      SET status = 'UNDER_REVIEW',
          currentStage = 'review',
          progressPercent = GREATEST(progressPercent, 67),
          updatedAt = CURRENT_TIMESTAMP(3)
      WHERE id = ?
      `,
      [projectId]
    );

    await pool.query(
      `
      UPDATE research_project_stages
      SET status = 'UNDER_REVIEW', updatedAt = CURRENT_TIMESTAMP(3)
      WHERE projectId = ? AND stageKey = 'review'
      `,
      [projectId]
    );

    return NextResponse.json({
      success: true,
      message: `Research dossier successfully compiled and submitted as ${versionTag}. An immutable snapshot has been locked for independent professional review.`,
      submissionId,
      dossierVersionId,
      versionTag,
      assignedReviewerId,
    });
  } catch (error) {
    console.error("Stage 8 review POST error:", error);
    return NextResponse.json({ error: "Failed to submit research dossier for review" }, { status: 500 });
  }
}
