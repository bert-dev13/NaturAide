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

    // Verify ownership
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.id, rp.title, rp.currentStage, rp.status, rp.researchObjective, rp.researchQuestion,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
             p.scientificName as plantScientificName,
             p.safetyNote as plantPrecautions
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

    // 1. Fetch active formulation and version from Stage 6
    const [formulationRows]: any = await pool.query(
      `SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
      [projectId]
    );
    const formulation = formulationRows[0] || null;

    let activeVersion: any = null;
    let components: any[] = [];

    if (formulation) {
      const [vRows]: any = await pool.query(
        `SELECT * FROM formulation_versions WHERE formulationId = ? ORDER BY isCurrentVersion DESC, id DESC LIMIT 1`,
        [formulation.id]
      );
      activeVersion = vRows[0] || null;

      if (activeVersion) {
        const [cRows]: any = await pool.query(
          `SELECT * FROM formulation_components WHERE versionId = ? ORDER BY id ASC`,
          [activeVersion.id]
        );
        components = cRows;
      }
    }

    // 2. Surface relevant evidence from earlier stages
    // Stage 1: Evidence Review
    const [stage1Rows]: any = await pool.query(
      `SELECT traditionalUses, clinicalEvidence, safetyConsiderations, contraindications, baselineEvidenceSummary FROM research_evidence_reviews WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    const stage1Evidence = stage1Rows[0] || null;

    // Stage 3: Literature studies
    const [stage3Studies]: any = await pool.query(
      `SELECT id, title, authors, journalSource as journal, year, studyType, keyFindings, COALESCE(evidenceScope, 'PRECLINICAL') as evidenceLevel FROM literature_references WHERE projectId = ? ORDER BY id DESC LIMIT 6`,
      [projectId]
    );

    // Stage 4: In-Silico Computational Toxicity & ADME
    const [stage4Toxicity]: any = await pool.query(
      `
      SELECT id, compoundName, analysisCategory, predictionType, resultSummary, detailedMetrics,
             engineTool, engineVersion, resultProvenance, createdAt
      FROM insilico_results
      WHERE projectId = ?
      ORDER BY id DESC
      `,
      [projectId]
    );

    // Stage 5: Molecular Docking highlights
    const [stage5Runs]: any = await pool.query(
      `SELECT id, ligandName, targetProtein, bindingAffinity, dockingPose, interactingResidues, resultProvenance FROM docking_runs WHERE projectId = ? ORDER BY id DESC LIMIT 4`,
      [projectId]
    );

    // 3. Fetch existing safety assessment
    const [saRows]: any = await pool.query(
      `SELECT * FROM research_safety_assessments WHERE projectId = ? LIMIT 1`,
      [projectId]
    );

    let safetyAssessment = saRows[0] || null;
    let componentAssessments: any[] = [];
    let concerns: any[] = [];
    let summary: any = null;

    if (safetyAssessment) {
      // Fetch component assessments
      const [caRows]: any = await pool.query(
        `SELECT * FROM safety_component_assessments WHERE safetyAssessmentId = ?`,
        [safetyAssessment.id]
      );
      componentAssessments = caRows;

      // Fetch structured concerns
      const [scRows]: any = await pool.query(
        `SELECT * FROM safety_concerns WHERE safetyAssessmentId = ? ORDER BY id DESC`,
        [safetyAssessment.id]
      );
      concerns = scRows;

      // Fetch summary
      const [sumRows]: any = await pool.query(
        `SELECT * FROM safety_summaries WHERE safetyAssessmentId = ? LIMIT 1`,
        [safetyAssessment.id]
      );
      summary = sumRows[0] || null;
    }

    // 4. Dynamic checklist
    const hasVersion = Boolean(activeVersion && activeVersion.versionNumber);
    const hasEvidence = Boolean(
      (stage1Evidence && (stage1Evidence.safetyConsiderations || stage1Evidence.contraindications)) ||
      stage3Studies.length > 0 ||
      stage4Toxicity.length > 0 ||
      (safetyAssessment && (safetyAssessment.knownSafetyEvidence?.trim() || safetyAssessment.toxicityEvidence?.trim()))
    );
    const hasComponentAssessment = componentAssessments.length > 0 || components.length === 0;
    const hasConcernsDocumented = concerns.length > 0 || (safetyAssessment && safetyAssessment.knownAdverseEffects?.trim().length > 0);
    const hasEvidenceGaps = Boolean(safetyAssessment && safetyAssessment.evidenceGaps?.trim().length > 0);
    const hasSummary = Boolean(
      summary &&
      summary.overallEvidenceSummary?.trim() &&
      summary.itemsRequiringReview?.trim()
    );

    const checklist = {
      hasVersion,
      hasEvidence,
      hasComponentAssessment,
      hasConcernsDocumented,
      hasEvidenceGaps,
      hasSummary,
    };

    return NextResponse.json({
      success: true,
      project,
      formulation,
      activeVersion,
      components,
      surfacedEvidence: {
        stage1: stage1Evidence,
        stage3: stage3Studies,
        stage4: stage4Toxicity,
        stage5: stage5Runs,
        plantPrecautions: project.plantPrecautions || null,
      },
      safetyAssessment,
      componentAssessments,
      concerns,
      summary,
      checklist,
    });
  } catch (error) {
    console.error("Safety GET error:", error);
    return NextResponse.json({ error: "Failed to load safety assessment data" }, { status: 500 });
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

    // Verify ownership
    const [projectRows]: any = await pool.query(
      `SELECT id, title, currentStage FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1`,
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    // Helper: Ensure safetyAssessment row exists
    const ensureSafetyAssessment = async (versionId?: number | null) => {
      const [existing]: any = await pool.query(
        `SELECT id FROM research_safety_assessments WHERE projectId = ? LIMIT 1`,
        [projectId]
      );
      if (existing.length > 0) {
        if (versionId) {
          await pool.query(
            `UPDATE research_safety_assessments SET formulationVersionId = ? WHERE id = ?`,
            [versionId, existing[0].id]
          );
        }
        return existing[0].id;
      } else {
        const [result]: any = await pool.query(
          `
          INSERT INTO research_safety_assessments (projectId, formulationVersionId, status)
          VALUES (?, ?, 'IN_PROGRESS')
          `,
          [projectId, versionId || null]
        );
        return result.insertId;
      }
    };

    // ACTION: SAVE SAFETY SECTIONS / SYNTHESIS
    if (action === "save-sections" || action === "save-synthesis") {
      const {
        versionId,
        knownSafetyEvidence,
        toxicityEvidence,
        potentialContraindications,
        herbDrugInteractions,
        populationConsiderations,
        ingredientSpecificConcerns,
        doseConcentrationConcerns,
        knownAdverseEffects,
        evidenceGaps,
        additionalSafetyNotes,
        executiveSummary,
      } = body;

      const assessmentId = await ensureSafetyAssessment(versionId);

      await pool.query(
        `
        UPDATE research_safety_assessments
        SET knownSafetyEvidence = COALESCE(?, knownSafetyEvidence), toxicityEvidence = ?, potentialContraindications = ?,
            herbDrugInteractions = ?, populationConsiderations = ?, ingredientSpecificConcerns = ?,
            doseConcentrationConcerns = ?, knownAdverseEffects = ?, evidenceGaps = ?,
            additionalSafetyNotes = ?, formulationVersionId = ?
        WHERE id = ?
        `,
        [
          knownSafetyEvidence?.trim() || executiveSummary?.trim() || null,
          toxicityEvidence?.trim() || null,
          potentialContraindications?.trim() || null,
          herbDrugInteractions?.trim() || null,
          populationConsiderations?.trim() || null,
          ingredientSpecificConcerns?.trim() || null,
          doseConcentrationConcerns?.trim() || null,
          knownAdverseEffects?.trim() || null,
          evidenceGaps?.trim() || null,
          additionalSafetyNotes?.trim() || null,
          versionId || null,
          assessmentId,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Safety assessment sections saved.",
        assessmentId,
      });
    }

    // ACTION: SAVE COMPONENT ASSESSMENT
    if (action === "save-component-assessment") {
      const {
        versionId,
        componentId,
        componentName,
        knownConcern,
        supportingEvidence,
        potentialInteraction,
        researcherAssessment,
        needsProfessionalReview,
      } = body;

      if (!componentName?.trim()) {
        return NextResponse.json({ error: "Component name is required" }, { status: 400 });
      }

      const assessmentId = await ensureSafetyAssessment(versionId);

      // Check if row already exists for this component
      const [existing]: any = await pool.query(
        `SELECT id FROM safety_component_assessments WHERE safetyAssessmentId = ? AND (componentId = ? OR componentName = ?) LIMIT 1`,
        [assessmentId, componentId || -1, componentName.trim()]
      );

      if (existing.length > 0) {
        await pool.query(
          `
          UPDATE safety_component_assessments
          SET knownConcern = ?, supportingEvidence = ?, potentialInteraction = ?,
              researcherAssessment = ?, needsProfessionalReview = ?
          WHERE id = ?
          `,
          [
            knownConcern?.trim() || null,
            supportingEvidence?.trim() || null,
            potentialInteraction?.trim() || null,
            researcherAssessment?.trim() || null,
            needsProfessionalReview ? 1 : 0,
            existing[0].id,
          ]
        );
        return NextResponse.json({ success: true, message: "Component safety assessment updated." });
      } else {
        const [result]: any = await pool.query(
          `
          INSERT INTO safety_component_assessments (
            safetyAssessmentId, projectId, componentId, componentName,
            knownConcern, supportingEvidence, potentialInteraction,
            researcherAssessment, needsProfessionalReview
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            assessmentId,
            projectId,
            componentId || null,
            componentName.trim(),
            knownConcern?.trim() || null,
            supportingEvidence?.trim() || null,
            potentialInteraction?.trim() || null,
            researcherAssessment?.trim() || null,
            needsProfessionalReview ? 1 : 0,
          ]
        );
        return NextResponse.json({ success: true, insertedId: result.insertId });
      }
    }

    // ACTION: SAVE RISK / CONCERN REGISTER ITEM
    if (action === "save-concern") {
      const {
        concernId,
        versionId,
        concernTitle,
        category,
        affectedComponent,
        evidenceOrReference,
        severity,
        evidenceStatus,
        researcherNotes,
      } = body;

      if (!concernTitle?.trim() || !category?.trim()) {
        return NextResponse.json({ error: "Concern title and category are required." }, { status: 400 });
      }

      const assessmentId = await ensureSafetyAssessment(versionId);

      if (concernId) {
        await pool.query(
          `
          UPDATE safety_concerns
          SET concernTitle = ?, category = ?, affectedComponent = ?,
              evidenceOrReference = ?, severity = ?, evidenceStatus = ?, researcherNotes = ?
          WHERE id = ? AND safetyAssessmentId = ?
          `,
          [
            concernTitle.trim(),
            category.trim(),
            affectedComponent?.trim() || null,
            evidenceOrReference?.trim() || null,
            severity || "LOW",
            evidenceStatus || "LIMITED",
            researcherNotes?.trim() || null,
            concernId,
            assessmentId,
          ]
        );
        return NextResponse.json({ success: true, message: "Concern updated." });
      } else {
        const [result]: any = await pool.query(
          `
          INSERT INTO safety_concerns (
            safetyAssessmentId, projectId, concernTitle, category,
            affectedComponent, evidenceOrReference, severity, evidenceStatus, researcherNotes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            assessmentId,
            projectId,
            concernTitle.trim(),
            category.trim(),
            affectedComponent?.trim() || null,
            evidenceOrReference?.trim() || null,
            severity || "LOW",
            evidenceStatus || "LIMITED",
            researcherNotes?.trim() || null,
          ]
        );
        return NextResponse.json({ success: true, insertedId: result.insertId });
      }
    }

    // ACTION: DELETE CONCERN
    if (action === "delete-concern") {
      const { concernId } = body;
      await pool.query(`DELETE FROM safety_concerns WHERE id = ? AND projectId = ?`, [concernId, projectId]);
      return NextResponse.json({ success: true });
    }

    // ACTION: SAVE SAFETY SUMMARY
    if (action === "save-summary") {
      const {
        versionId,
        overallEvidenceSummary,
        majorIdentifiedConcerns,
        evidenceLimitations,
        unresolvedSafetyQuestions,
        itemsRequiringReview,
        recommendedNextActions,
      } = body;

      const assessmentId = await ensureSafetyAssessment(versionId);

      const [existing]: any = await pool.query(
        `SELECT id FROM safety_summaries WHERE safetyAssessmentId = ? LIMIT 1`,
        [assessmentId]
      );

      if (existing.length > 0) {
        await pool.query(
          `
          UPDATE safety_summaries
          SET overallEvidenceSummary = ?, majorIdentifiedConcerns = ?, evidenceLimitations = ?,
              unresolvedSafetyQuestions = ?, itemsRequiringReview = ?, recommendedNextActions = ?
          WHERE safetyAssessmentId = ?
          `,
          [
            overallEvidenceSummary?.trim() || null,
            majorIdentifiedConcerns?.trim() || null,
            evidenceLimitations?.trim() || null,
            unresolvedSafetyQuestions?.trim() || null,
            itemsRequiringReview?.trim() || null,
            recommendedNextActions?.trim() || null,
            assessmentId,
          ]
        );
      } else {
        await pool.query(
          `
          INSERT INTO safety_summaries (
            safetyAssessmentId, projectId, overallEvidenceSummary, majorIdentifiedConcerns,
            evidenceLimitations, unresolvedSafetyQuestions, itemsRequiringReview,
            recommendedNextActions
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            assessmentId,
            projectId,
            overallEvidenceSummary?.trim() || null,
            majorIdentifiedConcerns?.trim() || null,
            evidenceLimitations?.trim() || null,
            unresolvedSafetyQuestions?.trim() || null,
            itemsRequiringReview?.trim() || null,
            recommendedNextActions?.trim() || null,
          ]
        );
      }

      return NextResponse.json({ success: true, message: "Safety summary saved." });
    }

    // ACTION: COMPLETE STAGE 5 (Formulation & Safety)
    if (action === "complete-stage") {
      const { versionId } = body;
      const assessmentId = await ensureSafetyAssessment(versionId);

      // 1. Mark Stage 5 COMPLETED
      await pool.query(
        `
        UPDATE research_project_stages
        SET status = 'COMPLETED', completedAt = NOW()
        WHERE projectId = ? AND (stageKey = 'formulation-safety' OR stageKey = 'safety')
        `,
        [projectId]
      );

      await pool.query(
        `
        UPDATE research_project_stages
        SET status = 'IN_PROGRESS'
        WHERE projectId = ? AND (stageKey = 'completion-integration' OR stageKey = 'completion') AND status = 'NOT_STARTED'
        `,
        [projectId]
      );

      await pool.query(
        `
        UPDATE research_projects
        SET currentStage = CASE
              WHEN currentStage IN ('plant-literature', 'evidence', 'evidence-review', 'in-silico', 'insilico', 'docking', 'formulation-safety', 'formulation', 'safety', 'laboratory') THEN 'completion-integration'
              ELSE currentStage
            END,
            progressPercent = GREATEST(progressPercent, 67),
            updatedAt = NOW()
        WHERE id = ?
        `,
        [projectId]
      );

      // 4. Update status in research_safety_assessments
      await pool.query(
        `UPDATE research_safety_assessments SET status = 'SAFETY_ASSESSMENT_DOCUMENTED' WHERE id = ?`,
        [assessmentId]
      );

      // 5. Activity log
      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'STAGE_COMPLETED', 'Completed Stage 4: Formulation & Safety and progressed to Stage 5: Research Integration')
        `,
        [projectId, session.id]
      );

      return NextResponse.json({
        success: true,
        message: "Formulation & Safety completed. Continue to Research Integration.",
        nextStage: "completion-integration",
        redirectUrl: `/researcher/projects/${projectId}/completion-integration`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Safety POST error:", error);
    return NextResponse.json({ error: "Failed to process safety assessment request" }, { status: 500 });
  }
}
