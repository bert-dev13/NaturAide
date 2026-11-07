import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureFormulationSchema } from "@/lib/formulation-schema";
import { getSession } from "@/lib/auth";
import {
  ensureReviewTables,
  findDefaultExpertReviewerId,
  findReviewerForArea,
} from "@/lib/expert-review-assignment";

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

    await ensureFormulationSchema();

    // Verify ownership
    const [projectRows]: any = await pool.query(
      "SELECT id, currentStage, progressPercent FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
      [projectId, session!.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    // HELPER FUNCTION: SAVE FORMULATION DATA
    async function persistFormulationData() {
      const formulationType = (body.formulationType || "Research Extract").trim();
      const dosageFormType = (body.dosageFormType || formulationType).trim();
      const plantPart = (body.plantPart || "").trim();
      const extractionSolvent = (body.extractionSolvent || "").trim();
      const extractionMethod = (body.extractionMethod || "").trim();
      const purpose = (body.purpose || "").trim();
      const notes = (body.notes || "").trim();
      const scientificRationale = (body.scientificRationale || body.researcherRationale || "").trim();
      const compatibilityConsiderations = (body.compatibilityConsiderations || "").trim();
      const safetyAndLimitations = (body.safetyAndLimitations || "").trim();
      const aiProposalJson = body.aiProposal ? JSON.stringify(body.aiProposal) : (body.aiProposalJson ? (typeof body.aiProposalJson === 'string' ? body.aiProposalJson : JSON.stringify(body.aiProposalJson)) : null);
      const formulationName = (body.formulationName || `${body.plantName || "Botanical"} Research Extract`).trim();

      // 1. Update research_plant_data (partsStudied, extractionSolvent, extractionMethod)
      const [existingPlantData]: any = await pool.query(
        "SELECT id FROM research_plant_data WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      if (existingPlantData.length > 0) {
        await pool.query(
          `UPDATE research_plant_data
           SET partsStudied = COALESCE(?, partsStudied),
               extractionSolvent = COALESCE(?, extractionSolvent),
               extractionMethod = COALESCE(?, extractionMethod),
               updatedAt = CURRENT_TIMESTAMP(3)
           WHERE projectId = ?`,
          [plantPart || null, extractionSolvent || null, extractionMethod || null, projectId]
        );
      } else {
        await pool.query(
          `INSERT INTO research_plant_data (projectId, partsStudied, extractionSolvent, extractionMethod)
           VALUES (?, ?, ?, ?)`,
          [projectId, plantPart || null, extractionSolvent || null, extractionMethod || null]
        );
      }

      // 2. Find or create research_formulations
      const [existingForm]: any = await pool.query(
        "SELECT id FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1",
        [projectId]
      );
      let formulationId: number;
      if (existingForm.length > 0) {
        formulationId = existingForm[0].id;
        await pool.query(
          `UPDATE research_formulations
           SET formulationName = ?,
               formulationType = ?,
               dosageFormType = ?,
               researchPurpose = ?,
               researcherRationale = COALESCE(?, researcherRationale),
               notes = ?,
               aiProposalJson = COALESCE(?, aiProposalJson),
               updatedAt = CURRENT_TIMESTAMP(3)
           WHERE id = ?`,
          [formulationName, formulationType, dosageFormType, purpose, scientificRationale || null, notes, aiProposalJson, formulationId]
        );
      } else {
        const [formInsert]: any = await pool.query(
          `INSERT INTO research_formulations (
             projectId, formulationName, formulationType, dosageFormType, researchPurpose, researcherRationale, notes, aiProposalJson, currentVersionNumber, status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'v1.0', 'DRAFT')`,
          [projectId, formulationName, formulationType, dosageFormType, purpose, scientificRationale || null, notes, aiProposalJson]
        );
        formulationId = formInsert.insertId;
      }

      // 3. Find or create formulation_versions
      const [existingVer]: any = await pool.query(
        "SELECT id FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1",
        [formulationId]
      );
      let versionId: number;
      if (existingVer.length > 0) {
        versionId = existingVer[0].id;
      } else {
        const [verInsert]: any = await pool.query(
          `INSERT INTO formulation_versions (
             formulationId, projectId, versionNumber, versionTag, changeSummary, createdByResearcherId, isCurrentVersion
           ) VALUES (?, ?, 'v1.0', 'Initial Formulation Prototype', 'Initial research formulation created.', ?, 1)`,
          [formulationId, projectId, session!.id]
        );
        versionId = verInsert.insertId;
      }

      // 4. Save components / composition (handles full components table or compounds)
      const inputComponents = Array.isArray(body.components) && body.components.length > 0
        ? body.components
        : (Array.isArray(body.compounds) ? body.compounds : []);

      if (inputComponents.length > 0) {
        // When comprehensive components array is passed, replace components for this version
        if (Array.isArray(body.components) && body.components.length > 0) {
          await pool.query("DELETE FROM formulation_components WHERE versionId = ?", [versionId]);
          for (const comp of body.components) {
            const compName = (comp.componentName || comp.name || "").trim();
            if (!compName) continue;
            const role = (comp.roleInFormulation || comp.role || comp.function || "Formulation Excipient").trim();
            const quantity = (comp.quantity || comp.amount || "").trim();
            const unit = (comp.unit || "% w/w").trim();
            const concentration = (comp.proposedConcentration || comp.concentration || "Concentration Requires Experimental Validation").trim();
            const notes = (comp.scientificRationale || comp.notes || "").trim();
            const sourceRef = (comp.sourceReference || comp.source || "").trim();
            const isAi = comp.isAiSuggested ? 1 : 0;
            const evidenceStatus = comp.evidenceStatus || (concentration.toLowerCase().includes("requires") ? "REQUIRES_EXPERIMENTAL_VALIDATION" : "SUPPORTED");

            await pool.query(
              `INSERT INTO formulation_components (
                 formulationId, versionId, projectId, componentName, roleInFormulation,
                 quantity, unit, concentration, notes, sourceReference, isAiSuggested, evidenceStatus
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [formulationId, versionId, projectId, compName, role, quantity || null, unit || null, concentration, notes || null, sourceRef || null, isAi, evidenceStatus]
            );
          }
        } else {
          // Legacy compounds array update
          for (const compound of body.compounds) {
            const compName = (compound.compoundName || compound.name || "").trim();
            if (!compName) continue;
            const quantity = (compound.amount || compound.quantity || "").trim();
            const unit = (compound.unit || "mg/g").trim();
            const concentration = (compound.concentration || "").trim();
            const role = (compound.preparationRole || compound.role || "Bioactive Marker Fraction").trim();
            const compNotes = (compound.notes || "").trim();

            const [existingComp]: any = await pool.query(
              "SELECT id FROM formulation_components WHERE versionId = ? AND componentName = ? LIMIT 1",
              [versionId, compName]
            );

            if (existingComp.length > 0) {
              await pool.query(
                `UPDATE formulation_components
                 SET roleInFormulation = ?,
                     quantity = ?,
                     unit = ?,
                     concentration = ?,
                     notes = ?
                 WHERE id = ?`,
                [role, quantity || null, unit || null, concentration || null, compNotes || null, existingComp[0].id]
              );
            } else {
              await pool.query(
                `INSERT INTO formulation_components (
                   formulationId, versionId, projectId, componentName, roleInFormulation,
                   quantity, unit, concentration, notes
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [formulationId, versionId, projectId, compName, role, quantity || null, unit || null, concentration || null, compNotes || null]
              );
            }
          }
        }
      }

      // 5. Save formulation_rationales if provided
      if (scientificRationale || compatibilityConsiderations || safetyAndLimitations) {
        await pool.query(
          `INSERT INTO formulation_rationales (
             formulationId, versionId, projectId, componentSelectionRationale, literatureSupport, knownLimitations
           ) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             componentSelectionRationale = COALESCE(VALUES(componentSelectionRationale), componentSelectionRationale),
             literatureSupport = COALESCE(VALUES(literatureSupport), literatureSupport),
             knownLimitations = COALESCE(VALUES(knownLimitations), knownLimitations),
             updatedAt = CURRENT_TIMESTAMP(3)`,
          [formulationId, versionId, projectId, scientificRationale || null, compatibilityConsiderations || null, safetyAndLimitations || null]
        );
      }

      // 5. Save SOP steps if provided
      if (Array.isArray(body.sopSteps) && body.sopSteps.length > 0) {
        // Clear existing steps for this version and re-insert
        await pool.query("DELETE FROM formulation_steps WHERE versionId = ?", [versionId]);
        for (let i = 0; i < body.sopSteps.length; i++) {
          const step = body.sopSteps[i];
          const text = typeof step === "string" ? step.trim() : (step.procedureText || step.text || "").trim();
          if (!text) continue;
          const equip = typeof step === "object" ? step.equipment : null;
          const duration = typeof step === "object" ? step.duration : null;
          const temp = typeof step === "object" ? step.temperature : null;

          await pool.query(
            `INSERT INTO formulation_steps (
               formulationId, versionId, projectId, stepNumber, procedureText, equipment, duration, temperature
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [formulationId, versionId, projectId, i + 1, text, equip || null, duration || null, temp || null]
          );
        }
      }

      return { formulationId, versionId };
    }

    // ACTION: SAVE DRAFT
    if (action === "save" || action === "save-draft" || action === "save-overview") {
      const result = await persistFormulationData();
      return NextResponse.json({
        success: true,
        message: "Formulation development saved successfully.",
        ...result,
      });
    }

    // ACTION: COMPLETE STAGE 4 (Formulation Development)
    if (action === "complete-stage") {
      // 1. Validate required formulation fields
      const plantPart = (body.plantPart || "").trim();
      const solvent = (body.extractionSolvent || "").trim();
      const method = (body.extractionMethod || "").trim();
      const purpose = (body.purpose || "").trim();

      if (!plantPart) {
        return NextResponse.json({ error: "Plant Part is required to complete Formulation Development." }, { status: 400 });
      }
      if (!solvent) {
        return NextResponse.json({ error: "Extraction Solvent is required to complete Formulation Development." }, { status: 400 });
      }
      if (!method) {
        return NextResponse.json({ error: "Extraction Method is required to complete Formulation Development." }, { status: 400 });
      }
      if (!purpose) {
        return NextResponse.json({ error: "Formulation Purpose is required to complete Formulation Development." }, { status: 400 });
      }

      // 2. Save formulation data
      await persistFormulationData();

      // 3. Mark Stage 4 COMPLETED across canonical and legacy keys
      await pool.query(
        `UPDATE research_project_stages
         SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
         WHERE projectId = ? AND (stageKey = 'formulation-safety' OR stageKey = 'formulation')`,
        [projectId]
      );

      // 4. Unlock Stage 5 (Safety / Clinical)
      await pool.query(
        `UPDATE research_project_stages
         SET status = 'IN_PROGRESS', updatedAt = CURRENT_TIMESTAMP(3)
         WHERE projectId = ? AND (stageKey = 'safety' OR stageKey = 'completion-integration' OR stageKey = 'completion') AND status <> 'COMPLETED'`,
        [projectId]
      );

      // 5. Update research_projects
      await pool.query(
        `UPDATE research_projects
         SET currentStage = CASE
               WHEN currentStage IN ('plant-literature', 'in-silico', 'docking', 'formulation-safety', 'formulation') THEN 'safety'
               ELSE currentStage
             END,
             progressPercent = GREATEST(progressPercent, 67),
             status = 'IN_PROGRESS',
             updatedAt = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [projectId]
      );

      // 6. Automatically queue Professional Review for Pharmacist / Pharmaceutical Scientist (Formulation)
      await ensureReviewTables();
      const defaultReviewerId = await findDefaultExpertReviewerId();

      const [existingSub]: any = await pool.query(
        "SELECT id FROM review_submissions WHERE projectId = ? ORDER BY id DESC LIMIT 1",
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

      const formulationReviewerId = (await findReviewerForArea("formulation")) || defaultReviewerId || 1;
      await pool.query(
        `INSERT INTO review_assignments (
           projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound, assignedAt
         ) VALUES (?, ?, ?, 'formulation', 'PENDING', 1, NOW(3))
         ON DUPLICATE KEY UPDATE status = 'PENDING', reviewerId = VALUES(reviewerId), updatedAt = NOW(3)`,
        [projectId, submissionId, formulationReviewerId]
      );

      await pool.query(
        `INSERT INTO review_area_coverage (
           submissionId, projectId, areaKey, reviewerId, status
         ) VALUES (?, ?, 'formulation', ?, 'PENDING')
         ON DUPLICATE KEY UPDATE status = 'PENDING', reviewerId = VALUES(reviewerId), updatedAt = NOW(3)`,
        [submissionId, projectId, formulationReviewerId]
      );

      await pool.query(
        `INSERT INTO review_section_status (
           submissionId, reviewerId, sectionKey, status
         ) VALUES (?, ?, 'formulation', 'NOT_REVIEWED')
         ON DUPLICATE KEY UPDATE status = 'NOT_REVIEWED'`,
        [submissionId, formulationReviewerId]
      );

      await pool.query(
        `INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
         VALUES (?, ?, 'STAGE_COMPLETED', 'Completed Stage 4: Formulation Development, queued Formulation professional review, and unlocked Stage 5')`,
        [projectId, session.id]
      );

      return NextResponse.json({
        success: true,
        message: "Formulation Development completed. Review queued. Moving to Stage 5.",
        redirectUrl: `/researcher/projects/${projectId}/safety`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Formulation-development POST error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process formulation development request" }, { status: 500 });
  }
}
