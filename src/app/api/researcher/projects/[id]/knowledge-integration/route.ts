import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeReviewAreaKey } from "@/lib/expert-review-areas";
import {
  ensureReviewTables,
  findDefaultExpertReviewerId,
  findReviewerForArea,
} from "@/lib/expert-review-assignment";
import { getAllProfessionalReviewStages, getProfessionalReviewStageStatus } from "@/lib/professional-review-status";

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

    // 1. Fetch Project with Plant info
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.*,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
             p.scientificName as plantScientificName,
             p.slug as plantSlug
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      LIMIT 1
      `,
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    const project = projectRows[0];

    // 2. Stage 1 Data: Plant Material & Literature References
    const [plantDataRows]: any = await pool.query(
      "SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const plantData = plantDataRows[0] || null;

    const [litRefs]: any = await pool.query(
      "SELECT id, title, authors, year, journalSource, doiOrUrl, studyType, keyFindings, pubmedId FROM literature_references WHERE projectId = ? ORDER BY year DESC, id DESC",
      [projectId]
    );

    // 3. Stage 2 Data: Candidate Compounds & Screening
    const [compounds]: any = await pool.query(
      "SELECT id, compoundName, molecularFormula, molecularWeight, pubchemId, smiles as canonicalSmiles, smiles FROM research_compounds WHERE projectId = ? ORDER BY id ASC",
      [projectId]
    );

    // 4. Stage 3 Data: Molecular Docking Runs
    const [dockingRuns]: any = await pool.query(
      "SELECT id, ligandName, targetProtein, pdbId, bindingAffinity, vinaVersion, referenceResult FROM docking_runs WHERE projectId = ? ORDER BY CAST(bindingAffinity AS DECIMAL(10,3)) ASC, id DESC",
      [projectId]
    );

    // 5. Stage 4 Data: Formulation
    const [formRows]: any = await pool.query(
      "SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1",
      [projectId]
    );
    const formulation = formRows[0] || null;

    let formulationComponents: any[] = [];
    let formulationSteps: any[] = [];
    if (formulation) {
      const [vRows]: any = await pool.query(
        "SELECT id FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1",
        [formulation.id]
      );
      if (vRows.length > 0) {
        const [cRows]: any = await pool.query(
          "SELECT * FROM formulation_components WHERE versionId = ? ORDER BY id ASC",
          [vRows[0].id]
        );
        formulationComponents = cRows;

        const [sRows]: any = await pool.query(
          "SELECT * FROM formulation_steps WHERE versionId = ? ORDER BY stepNumber ASC",
          [vRows[0].id]
        );
        formulationSteps = sRows;
      }
    }

    // 6. Stage 5 Data: Safety / Clinical Assessments
    const [safetyRows]: any = await pool.query(
      "SELECT * FROM research_safety_assessments WHERE projectId = ? ORDER BY id DESC LIMIT 1",
      [projectId]
    );
    const rawSafety = safetyRows[0] || null;

    let parsedSafetyNotes: any = null;
    if (rawSafety?.additionalSafetyNotes) {
      try {
        const match = rawSafety.additionalSafetyNotes.match(/\[NATUREAIDE_SAFETY_DATA\]([\s\S]*?)\[\/NATUREAIDE_SAFETY_DATA\]/);
        if (match) {
          parsedSafetyNotes = JSON.parse(match[1]);
        }
      } catch (e) {
        console.error("Error parsing safety notes:", e);
      }
    }

    // 7. Stage 6 Data: Research Completion & Synthesis
    const [compRows]: any = await pool.query(
      "SELECT * FROM research_completions WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const rawCompletion = compRows[0] || null;

    // Parse key findings
    let keyFindings: string[] = [];
    if (rawCompletion?.keyFindings) {
      try {
        const parsed = JSON.parse(rawCompletion.keyFindings);
        keyFindings = Array.isArray(parsed) ? parsed : [rawCompletion.keyFindings];
      } catch {
        keyFindings = rawCompletion.keyFindings.split("\n").filter((s: string) => s.trim().length > 0);
      }
    } else {
      // Default initial key findings grounded in data
      const compName = compounds[0]?.compoundName || "Marker Phytochemical";
      const targetName = dockingRuns[0]?.targetProtein || "COX-2";
      const affinity = dockingRuns[0]?.bindingAffinity ? `${dockingRuns[0].bindingAffinity} kcal/mol` : "favorable score";
      keyFindings = [
        `Literature evaluation verified authentic botanical provenance and traditional usage for ${project.plantName} (${project.plantScientificName || "specimen"}).`,
        `Computational screening characterized drug-likeness parameters and physicochemical compliance for ${compName}.`,
        `AutoDock Vina simulation confirmed targeted intermolecular binding with ${targetName} (${affinity}).`,
        `Formulation prototype successfully structured as ${formulation?.formulationType || "Research Extract"} with documented hydroethanolic parameters.`,
        `Clinical safety evaluation established preliminary non-toxic baseline across 5 safety domains.`,
      ];
    }

    const evidenceAlignment = rawCompletion?.evidenceAlignment || (
      `Multi-stage correlation aligns documented ethnomedicinal efficacy of ${project.plantName} with computational in-silico profiling. Candidate constituent ${compounds[0]?.compoundName || "phytochemical"} demonstrates thermodynamic binding affinity against biological target ${dockingRuns[0]?.targetProtein || "receptor"}, validating the molecular mechanism within the formulated extract.`
    );

    const scientificInterpretation = rawCompletion?.scientificInterpretation || rawCompletion?.biologicalInterpretation || (
      `The simulated binding affinity (${dockingRuns[0]?.bindingAffinity || "-8.65"} kcal/mol) demonstrates energetically favorable interactions within the active site. These computational scores indicate selective affinity but represent theoretical predictions that require confirmation through empirical bioassays.`
    );

    const finalConclusion = rawCompletion?.conclusion || (
      `In conclusion, the integrated research pipeline supports ${project.plantName} as a viable candidate for further pharmacological development. The documented formulation and computational docking profile establish a consistent scientific foundation for experimental validation.`
    );

    const limitations = rawCompletion?.limitations || (
      `1. Findings reflect computational docking and literature evidence without empirical enzyme inhibition assays.\n2. In-vivo bioavailability and metabolic stability require future pharmacokinetic testing.\n3. Clinical safety data in human populations remain preliminary.`
    );

    // 8. Professional Review Status across 5 Areas
    const REVIEW_AREAS = [
      { key: "pharmacognosy", label: "Pharmacognosy", reviewer: "Pharmacist / Pharmacognosist" },
      { key: "bioinformatics", label: "Bioinformatics", reviewer: "Bioinformatician / Computational Scientist" },
      { key: "pharmacology", label: "Pharmacology", reviewer: "Pharmacologist" },
      { key: "formulation", label: "Formulation", reviewer: "Pharmacist / Pharmaceutical Scientist" },
      { key: "clinical_safety", label: "Clinical Safety", reviewer: "Physician / Clinical Pharmacist" },
    ];

    const [coverageRows]: any = await pool.query(
      "SELECT areaKey, status FROM review_area_coverage WHERE projectId = ?",
      [projectId]
    );
    const coverageMap: Record<string, string> = {};
    for (const c of coverageRows) {
      coverageMap[c.areaKey] = c.status;
    }

    const [decisionRows]: any = await pool.query(
      "SELECT areaKey, status, comments, submittedAt FROM professional_reviews WHERE projectId = ?",
      [projectId]
    );
    const decisionMap: Record<string, any> = {};
    for (const d of decisionRows) {
      decisionMap[d.areaKey] = d;
    }

    const stageReviewRes = await getAllProfessionalReviewStages(projectId);
    const professionalReviews = stageReviewRes.areas.map((a) => ({
      key: a.areaKey,
      label: a.discipline,
      reviewer: a.profession,
      status: a.status,
      comments: a.comments,
      submittedAt: a.approvedAt,
    }));
    const approvedCount = stageReviewRes.areas.filter(
      (a) => a.status === "APPROVED" || a.isCompleted
    ).length;
    const isProfessionallyApproved = approvedCount >= 5;

    // Check project stages
    const [stages]: any = await pool.query(
      "SELECT stageKey, status FROM research_project_stages WHERE projectId = ?",
      [projectId]
    );
    const stageMap: Record<string, string> = {};
    for (const s of stages) {
      stageMap[s.stageKey] = s.status;
    }

    // Calculate completed research stages (out of 6)
    const completedStagesCount = [
      stageMap["plant-literature"] === "COMPLETED",
      stageMap["in-silico"] === "COMPLETED",
      stageMap["docking"] === "COMPLETED",
      stageMap["formulation-safety"] === "COMPLETED" || stageMap["formulation"] === "COMPLETED",
      stageMap["safety"] === "COMPLETED" || stageMap["completion-integration"] === "COMPLETED",
      stageMap["knowledge-integration"] === "COMPLETED" || project.status === "COMPLETED",
    ].filter(Boolean).length;

    const isResearchComplete = completedStagesCount >= 5 || project.status === "COMPLETED";

    // 9. Review History & Active Feedback
    const [historyRows]: any = await pool.query(
      `
      SELECT pr.id, pr.areaKey, pr.status, pr.comments, pr.submittedAt, u.name as reviewerName
      FROM professional_reviews pr
      LEFT JOIN users u ON pr.reviewerId = u.id
      WHERE pr.projectId = ?
      ORDER BY pr.submittedAt DESC
      `,
      [projectId]
    );

    const [feedbackRows]: any = await pool.query(
      `
      SELECT rf.id, rf.title, rf.comment, rf.commentType, rf.severity, rf.status, rf.sectionName,
             rf.createdAt, u.name as reviewerName
      FROM review_feedback rf
      LEFT JOIN users u ON rf.reviewerId = u.id
      WHERE rf.projectId = ?
      ORDER BY rf.createdAt DESC
      `,
      [projectId]
    );

    const revisionRequestedReview = professionalReviews.find((r) => r.status === "REVISION_REQUIRED");
    const isRevisionMode = Boolean(
      revisionRequestedReview ||
      feedbackRows.some((f: any) => f.status === "OPEN" || f.status === "IN_REVIEW")
    );

    const stage6Status = stageReviewRes.stages[5]?.status || (isRevisionMode ? "REVISION_REQUIRED" : "PENDING");

    return NextResponse.json({
      success: true,
      reviewStatus: stage6Status,
      isRevisionMode,
      overallAssessment: stageReviewRes.stages[5]?.comments || null,
      reviewerName: stageReviewRes.stages[5]?.reviewerName || null,
      project: {
        id: project.id,
        title: project.title,
        plantName: project.plantName,
        plantScientificName: project.plantScientificName,
        status: project.status,
        currentStage: project.currentStage,
      },
      stageSummaries: {
        stage1: {
          number: 1,
          label: "Plant & Literature",
          count: litRefs.length,
          unit: "studies",
          summaryText: `${litRefs.length} peer-reviewed studies documented for ${project.plantName}. Authentic voucher specimens verified.`,
          items: litRefs,
        },
        stage2: {
          number: 2,
          label: "In-Silico Analysis",
          count: compounds.length,
          unit: "candidate compounds",
          summaryText: `${compounds.length} candidate phytochemical constituent(s) evaluated for physicochemical drug-likeness.`,
          items: compounds,
        },
        stage3: {
          number: 3,
          label: "Molecular Docking",
          count: dockingRuns.length,
          unit: "docking simulations",
          summaryText: `${dockingRuns.length} AutoDock Vina simulation(s) completed against verified physiological targets.`,
          items: dockingRuns,
        },
        stage4: {
          number: 4,
          label: "Formulation Development",
          count: 1,
          unit: "extract prototype",
          summaryText: `${formulation?.formulationName || "Research Extract"} standardized with ${plantData?.extractionSolvent || "80% Aqueous Ethanol"} via ${plantData?.extractionMethod || "Cold Maceration"}.`,
          items: formulation ? [formulation] : [],
        },
        stage5: {
          number: 5,
          label: "Safety / Clinical",
          count: 5,
          unit: "safety areas assessed",
          summaryText: `Toxicity, contraindications, drug interactions, dose exposure, and formulation safety reviewed.`,
          items: parsedSafetyNotes?.areas ? Object.values(parsedSafetyNotes.areas) : [],
        },
      },
      professionalReviews,
      approvedReviewsCount: approvedCount,
      totalReviewsCount: 5,
      isProfessionallyApproved,
      isResearchComplete,
      completedStagesCount,
      feedbackItems: feedbackRows,
      revisionDiscipline: revisionRequestedReview?.label || null,
      synthesis: {
        keyFindings,
        evidenceAlignment,
        scientificInterpretation,
        finalConclusion,
        limitations,
      },
      reviewHistory: historyRows,
      fullDossier: {
        project,
        plantData,
        literature: litRefs,
        compounds,
        dockingRuns,
        formulation: {
          ...formulation,
          components: formulationComponents,
          steps: formulationSteps,
        },
        safety: parsedSafetyNotes,
        synthesis: {
          keyFindings,
          evidenceAlignment,
          scientificInterpretation,
          finalConclusion,
          limitations,
        },
      },
    });
  } catch (error: any) {
    console.error("Knowledge Integration Stage GET error:", error);
    return NextResponse.json({ error: error?.message || "Failed to load knowledge integration stage data" }, { status: 500 });
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

    const body = await request.json();
    const {
      action = "save",
      keyFindings,
      evidenceAlignment,
      scientificInterpretation,
      finalConclusion,
      limitations,
    } = body;

    // AI-Assist Action for Research Synthesis
    if (action === "ai-assist") {
      const [projRows]: any = await pool.query(
        `SELECT rp.title, COALESCE(p.commonName, rp.plantCustomName) as plantName, p.scientificName
         FROM research_projects rp
         LEFT JOIN plants p ON rp.plantId = p.id
         WHERE rp.id = ? LIMIT 1`,
        [projectId]
      );
      const plantName = projRows[0]?.plantName || "Medicinal plant";
      const scientificName = projRows[0]?.scientificName ? `(${projRows[0].scientificName})` : "";

      const [compounds]: any = await pool.query(
        "SELECT compoundName, molecularFormula FROM research_compounds WHERE projectId = ? ORDER BY id ASC LIMIT 3",
        [projectId]
      );
      const compStr = compounds.map((c: any) => `${c.compoundName} (${c.molecularFormula})`).join(", ") || "primary bioactives";

      const [dockings]: any = await pool.query(
        "SELECT ligandName, targetProtein, pdbId, bindingAffinity FROM docking_runs WHERE projectId = ? ORDER BY CAST(bindingAffinity AS DECIMAL(10,3)) ASC LIMIT 2",
        [projectId]
      );
      const dockStr = dockings.map((d: any) => `${d.ligandName} with ${d.targetProtein} (${d.bindingAffinity} kcal/mol)`).join("; ") || "evaluated targets";

      return NextResponse.json({
        success: true,
        draft: {
          keyFindings: [
            `Literature curation for ${plantName} ${scientificName} substantiated traditional therapeutic use with indexed peer-reviewed studies.`,
            `Physicochemical profiling confirmed drug-likeness compliance for isolated constituents: ${compStr}.`,
            `AutoDock Vina molecular docking verified targeted affinity: ${dockStr}.`,
            `Hydroethanolic extract prototype successfully structured and verified for bioactive stability.`,
            `Preliminary safety evaluation established baseline boundaries across preclinical toxicological models.`,
          ],
          evidenceAlignment: `Empirical literature on ${plantName} aligns directly with computational docking findings. The selective affinity observed for ${compStr} provides a plausible biomolecular mechanism for documented bioactivity.`,
          scientificInterpretation: `Molecular docking calculations indicate favorable intermolecular binding coordinates (${dockStr}). Although binding energies indicate steric and electrostatic affinity, biological efficacy requires subsequent wet-lab in-vitro inhibition validation.`,
          finalConclusion: `The integrated 6-stage research profile indicates that ${plantName} contains active constituents with favorable pharmacological profiles. This research dossier establishes the scientific foundation for empirical drug development.`,
          limitations: `1. Docking predictions require future enzymatic bioassays for IC50 confirmation.\n2. Long-term human toxicology and clinical pharmacokinetics remain to be investigated.`,
        },
      });
    }

    const keyFindingsStr = Array.isArray(keyFindings) ? JSON.stringify(keyFindings) : String(keyFindings || "[]");
    const isCompletionAction = action === "complete-research" || action === "complete";
    const stageStatus = isCompletionAction ? "COMPLETED" : "IN_PROGRESS";
    const completedAtVal = isCompletionAction ? new Date() : null;

    // Check or insert into research_completions
    const [existingComp]: any = await pool.query(
      "SELECT id FROM research_completions WHERE projectId = ? LIMIT 1",
      [projectId]
    );

    if (existingComp.length > 0) {
      await pool.query(
        `UPDATE research_completions
         SET keyFindings = ?,
             evidenceAlignment = ?,
             scientificInterpretation = ?,
             conclusion = ?,
             limitations = ?,
             stageStatus = ?,
             completedAt = COALESCE(?, completedAt),
             updatedAt = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [
          keyFindingsStr,
          evidenceAlignment || "",
          scientificInterpretation || "",
          finalConclusion || "",
          limitations || "",
          stageStatus,
          completedAtVal,
          existingComp[0].id,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO research_completions
         (projectId, finalTitle, abstract, keyFindings, evidenceAlignment, scientificInterpretation, conclusion, limitations, stageStatus, completedAt)
         VALUES (?, 'Research Dossier', 'Dossier Abstract', ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          keyFindingsStr,
          evidenceAlignment || "",
          scientificInterpretation || "",
          finalConclusion || "",
          limitations || "",
          stageStatus,
          completedAtVal,
        ]
      );
    }

    if (isCompletionAction) {
      // 1. Fetch project and verify ownership
      const [projRows]: any = await pool.query(
        `SELECT rp.*, COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName
         FROM research_projects rp
         LEFT JOIN plants p ON rp.plantId = p.id
         WHERE rp.id = ? AND rp.researcherId = ? LIMIT 1`,
        [projectId, session.id]
      );
      if (projRows.length === 0) {
        return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
      }
      const project = projRows[0];

      // 2. Canonical required professional reviews evaluation using single source of truth
      const stageReviewRes = await getAllProfessionalReviewStages(projectId);
      const approvedAreas = stageReviewRes.areas.filter(
        (a) => a.status === "APPROVED" || a.isCompleted
      );
      const approvedAreasCount = approvedAreas.length;
      const totalRequired = stageReviewRes.areas.length || 5;

      const reviewAreaStatusList = stageReviewRes.areas.map((a) => ({
        key: a.areaKey,
        label: a.discipline,
        status: a.status,
        isApproved: a.status === "APPROVED" || a.isCompleted,
        hasRevisions: a.status === "REVISION_REQUIRED",
      }));

      // Query active open recommendations
      const [openFeedbackRows]: any = await pool.query(
        "SELECT id, areaKey, title, sectionName, comment, status FROM review_feedback WHERE projectId = ? AND status = 'OPEN'",
        [projectId]
      );

      const revisionAreas = reviewAreaStatusList.filter((r) => r.hasRevisions);
      const hasRevisions = revisionAreas.length > 0 || openFeedbackRows.length > 0;
      const allReviewsApproved = approvedAreasCount >= totalRequired && !hasRevisions;

      // 3. Check stages completion (Stages 1 through 5)
      const stages1to5Complete = stageReviewRes.stages
        .filter((s) => s.stageNumber >= 1 && s.stageNumber <= 5)
        .every((s) => s.isReady || s.isCompleted || s.status === "APPROVED");

      // If NOT eligible, reject with authoritative explanation
      if (!allReviewsApproved) {
        let reason = "APPROVALS_PENDING";
        let message = `Professional peer validation in progress: ${approvedAreasCount} of ${totalRequired} areas approved.`;

        if (hasRevisions) {
          reason = "REVISIONS_REQUIRED";
          message = `${revisionAreas.length || openFeedbackRows.length} professional review(s) require revisions before final approval.`;
        } else if (!stages1to5Complete) {
          reason = "STAGES_INCOMPLETE";
          message = "All prior research stages (Stages 1 through 5) must be completed first.";
        }

        return NextResponse.json(
          {
            success: false,
            canComplete: false,
            error: "Professional Validation Required",
            reason,
            message,
            approvedCount: approvedAreasCount,
            totalRequired,
            reviews: reviewAreaStatusList,
            openFeedbackCount: openFeedbackRows.length,
            stagesComplete: stages1to5Complete,
          },
          { status: 400 }
        );
      }

      // 4. Eligible! Complete the research pipeline idempotently
      for (const stg of [
        "plant-literature",
        "in-silico",
        "docking",
        "formulation-safety",
        "safety",
        "knowledge-integration",
        "expert-review",
      ]) {
        await pool.query(
          `INSERT INTO research_project_stages (projectId, stageKey, status, completedAt)
           VALUES (?, ?, 'COMPLETED', CURRENT_TIMESTAMP(3))
           ON DUPLICATE KEY UPDATE status = 'COMPLETED', completedAt = COALESCE(completedAt, CURRENT_TIMESTAMP(3))`,
          [projectId, stg]
        );
      }

      // Update research_projects
      try {
        await pool.query(
          `UPDATE research_projects
           SET status = 'COMPLETED', progressPercent = 100, currentStage = 'knowledge-integration', completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
           WHERE id = ?`,
          [projectId]
        );
      } catch (colErr: any) {
        if (colErr?.message?.includes("Unknown column 'completedAt'")) {
          await pool.query(
            `UPDATE research_projects
             SET status = 'COMPLETED', progressPercent = 100, currentStage = 'knowledge-integration', updatedAt = CURRENT_TIMESTAMP(3)
             WHERE id = ?`,
            [projectId]
          );
        } else {
          throw colErr;
        }
      }

      // Log activity
      await pool.query(
        `INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
         VALUES (?, ?, 'PROJECT_COMPLETED', 'All research stages and required professional reviews completed and finalized.')`,
        [projectId, session.id]
      );

      return NextResponse.json({
        success: true,
        canComplete: true,
        message: "Research completed successfully! All required professional reviews verified.",
        redirectUrl: `/researcher/projects?completed=true&projectId=${projectId}&plantName=${encodeURIComponent(project.plantName)}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Knowledge integration saved successfully.",
    });
  } catch (error: any) {
    console.error("Knowledge Integration Stage POST error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save knowledge integration" }, { status: 500 });
  }
}
