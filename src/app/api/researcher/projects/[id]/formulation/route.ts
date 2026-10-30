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
             p.scientificName as plantScientificName
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

    // Candidate compounds from Stage 4 (for component source linking)
    const [compounds]: any = await pool.query(
      `SELECT id, compoundName, molecularFormula, plantSource FROM research_compounds WHERE projectId = ?`,
      [projectId]
    );

    // Plant parts and extract data from Stage 1/2
    const [plantDataRows]: any = await pool.query(
      `SELECT partsStudied as plantPartUsed, traditionalUses as traditionalPreparationNotes, specimenSource FROM research_plant_data WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    const plantData = plantDataRows[0] || null;

    // Fetch existing formulation record
    const [formulationRows]: any = await pool.query(
      `SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
      [projectId]
    );

    let formulation = formulationRows[0] || null;
    let versions: any[] = [];
    let activeVersion: any = null;
    let components: any[] = [];
    let steps: any[] = [];
    let batches: any[] = [];
    let rationale: any = null;

    if (formulation) {
      // Fetch versions
      const [vRows]: any = await pool.query(
        `SELECT * FROM formulation_versions WHERE formulationId = ? ORDER BY id DESC`,
        [formulation.id]
      );
      versions = vRows;

      // Find current version
      activeVersion = versions.find((v) => v.isCurrentVersion === 1) || versions[0] || null;

      if (activeVersion) {
        // Fetch components for this version
        const [cRows]: any = await pool.query(
          `SELECT * FROM formulation_components WHERE versionId = ? ORDER BY id ASC`,
          [activeVersion.id]
        );
        components = cRows;

        // Fetch steps for this version
        const [sRows]: any = await pool.query(
          `SELECT * FROM formulation_steps WHERE versionId = ? ORDER BY stepNumber ASC`,
          [activeVersion.id]
        );
        steps = sRows;

        // Fetch batches for this formulation/version
        const [bRows]: any = await pool.query(
          `SELECT * FROM formulation_batches WHERE formulationId = ? ORDER BY id DESC`,
          [formulation.id]
        );
        batches = bRows;

        // Fetch rationale
        const [rRows]: any = await pool.query(
          `SELECT * FROM formulation_rationales WHERE versionId = ? LIMIT 1`,
          [activeVersion.id]
        );
        rationale = rRows[0] || null;
      }
    }

    // Dynamic Checklist Calculation
    const hasFormulation = Boolean(formulation && formulation.formulationName?.trim());
    const hasPurpose = Boolean(formulation && formulation.researchPurpose?.trim());
    const hasComponents = components.length > 0;
    const hasQuantities = components.length > 0 && components.every((c) => Boolean(c.quantity?.trim() || c.concentration?.trim()));
    const hasProcedure = steps.length > 0;
    const hasVersion = Boolean(activeVersion && activeVersion.versionNumber);
    const hasRationale = Boolean(
      rationale &&
      rationale.componentSelectionRationale?.trim() &&
      rationale.literatureSupport?.trim() &&
      rationale.knownLimitations?.trim()
    );

    const checklist = {
      hasFormulation,
      hasPurpose,
      hasComponents,
      hasQuantities,
      hasProcedure,
      hasVersion,
      hasRationale,
    };

    return NextResponse.json({
      success: true,
      project,
      plantData,
      compounds,
      formulation,
      versions,
      activeVersion,
      components,
      steps,
      batches,
      rationale,
      checklist,
    });
  } catch (error) {
    console.error("Formulation GET error:", error);
    return NextResponse.json({ error: "Failed to load formulation data" }, { status: 500 });
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
      `SELECT id, title FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1`,
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    // ACTION: SAVE FORMULATION OVERVIEW
    if (action === "save-overview") {
      const formulationName = body.formulationName?.trim();
      const formulationCode = body.formulationCode?.trim() || null;
      const formulationType = (body.formulationType || body.dosageFormType || "Extract Prototype")?.trim();
      const researchPurpose = (body.researchPurpose || body.intendedUse || "Investigate phytotherapeutic candidate formulation")?.trim();
      const dosageFormType = (body.dosageFormType || body.formulationType)?.trim() || null;
      const researcherRationale = body.researcherRationale?.trim() || null;
      const notes = body.notes?.trim() || null;

      if (!formulationName || !formulationType || !researchPurpose) {
        return NextResponse.json(
          { error: "Formulation Name, Type, and Research Purpose are required." },
          { status: 400 }
        );
      }

      // Check if existing formulation exists
      const [existingForm]: any = await pool.query(
        `SELECT id, currentVersionNumber FROM research_formulations WHERE projectId = ? LIMIT 1`,
        [projectId]
      );

      let formulationId: number;
      let versionId: number;

      if (existingForm.length > 0) {
        formulationId = existingForm[0].id;
        await pool.query(
          `
          UPDATE research_formulations
          SET formulationName = ?, formulationCode = ?, formulationType = ?,
              researchPurpose = ?, dosageFormType = ?, researcherRationale = ?, notes = ?
          WHERE id = ?
          `,
          [
            formulationName.trim(),
            formulationCode?.trim() || null,
            formulationType.trim(),
            researchPurpose.trim(),
            dosageFormType?.trim() || null,
            researcherRationale?.trim() || null,
            notes?.trim() || null,
            formulationId,
          ]
        );

        // Get current version id
        const [currV]: any = await pool.query(
          `SELECT id FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1`,
          [formulationId]
        );
        versionId = currV[0]?.id;
      } else {
        const [fRes]: any = await pool.query(
          `
          INSERT INTO research_formulations (
            projectId, formulationName, formulationCode, formulationType,
            researchPurpose, dosageFormType, researcherRationale, notes,
            currentVersionNumber, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'v1.0', 'DRAFT')
          `,
          [
            projectId,
            formulationName.trim(),
            formulationCode?.trim() || null,
            formulationType.trim(),
            researchPurpose.trim(),
            dosageFormType?.trim() || null,
            researcherRationale?.trim() || null,
            notes?.trim() || null,
          ]
        );
        formulationId = fRes.insertId;

        // Create initial v1.0 version record
        const [vRes]: any = await pool.query(
          `
          INSERT INTO formulation_versions (
            formulationId, projectId, versionNumber, versionTag,
            changeSummary, createdByResearcherId, isCurrentVersion
          ) VALUES (?, ?, 'v1.0', 'Initial Formulation Prototype', 'Initial research formulation created.', ?, 1)
          `,
          [formulationId, projectId, session.id]
        );
        versionId = vRes.insertId;
      }

      return NextResponse.json({
        success: true,
        message: "Formulation overview saved.",
        formulationId,
        versionId,
      });
    }

    // ACTION: SAVE COMPONENT
    if (action === "save-component") {
      const {
        componentId,
        formulationId,
        versionId,
        componentName,
        roleInFormulation,
        sourceMaterial,
        quantity,
        unit,
        concentration,
        puritySpecification,
        sourceReference,
        notes,
      } = body;

      if (!componentName?.trim() || !roleInFormulation?.trim()) {
        return NextResponse.json(
          { error: "Component Name and Role in Formulation are required." },
          { status: 400 }
        );
      }

      if (componentId) {
        await pool.query(
          `
          UPDATE formulation_components
          SET componentName = ?, roleInFormulation = ?, sourceMaterial = ?,
              quantity = ?, unit = ?, concentration = ?, puritySpecification = ?,
              sourceReference = ?, notes = ?
          WHERE id = ? AND versionId = ?
          `,
          [
            componentName.trim(),
            roleInFormulation.trim(),
            sourceMaterial?.trim() || null,
            quantity?.trim() || null,
            unit?.trim() || null,
            concentration?.trim() || null,
            puritySpecification?.trim() || null,
            sourceReference?.trim() || null,
            notes?.trim() || null,
            componentId,
            versionId,
          ]
        );
        return NextResponse.json({ success: true, message: "Component updated." });
      } else {
        const [result]: any = await pool.query(
          `
          INSERT INTO formulation_components (
            formulationId, versionId, projectId, componentName, roleInFormulation,
            sourceMaterial, quantity, unit, concentration, puritySpecification,
            sourceReference, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            formulationId,
            versionId,
            projectId,
            componentName.trim(),
            roleInFormulation.trim(),
            sourceMaterial?.trim() || null,
            quantity?.trim() || null,
            unit?.trim() || null,
            concentration?.trim() || null,
            puritySpecification?.trim() || null,
            sourceReference?.trim() || null,
            notes?.trim() || null,
          ]
        );
        return NextResponse.json({ success: true, insertedId: result.insertId });
      }
    }

    // ACTION: DELETE COMPONENT
    if (action === "delete-component") {
      const { componentId, versionId } = body;
      await pool.query(
        `DELETE FROM formulation_components WHERE id = ? AND versionId = ?`,
        [componentId, versionId]
      );
      return NextResponse.json({ success: true });
    }

    // ACTION: SAVE EXPERIMENTAL STEP
    if (action === "save-step") {
      const {
        stepId,
        formulationId,
        versionId,
        stepNumber,
        procedureText,
        equipment,
        processingCondition,
        temperature,
        duration,
        otherParameters,
        researcherNotes,
        supportingFileUrl,
      } = body;

      if (!procedureText?.trim()) {
        return NextResponse.json({ error: "Procedure text is required." }, { status: 400 });
      }

      if (stepId) {
        await pool.query(
          `
          UPDATE formulation_steps
          SET stepNumber = ?, procedureText = ?, equipment = ?, processingCondition = ?,
              temperature = ?, duration = ?, otherParameters = ?, researcherNotes = ?,
              supportingFileUrl = ?
          WHERE id = ? AND versionId = ?
          `,
          [
            stepNumber || 1,
            procedureText.trim(),
            equipment?.trim() || null,
            processingCondition?.trim() || null,
            temperature?.trim() || null,
            duration?.trim() || null,
            otherParameters?.trim() || null,
            researcherNotes?.trim() || null,
            supportingFileUrl || null,
            stepId,
            versionId,
          ]
        );
        return NextResponse.json({ success: true, message: "Procedure step updated." });
      } else {
        const [result]: any = await pool.query(
          `
          INSERT INTO formulation_steps (
            formulationId, versionId, projectId, stepNumber, procedureText,
            equipment, processingCondition, temperature, duration, otherParameters,
            researcherNotes, supportingFileUrl
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            formulationId,
            versionId,
            projectId,
            stepNumber || 1,
            procedureText.trim(),
            equipment?.trim() || null,
            processingCondition?.trim() || null,
            temperature?.trim() || null,
            duration?.trim() || null,
            otherParameters?.trim() || null,
            researcherNotes?.trim() || null,
            supportingFileUrl || null,
          ]
        );
        return NextResponse.json({ success: true, insertedId: result.insertId });
      }
    }

    // ACTION: DELETE STEP
    if (action === "delete-step") {
      const { stepId, versionId } = body;
      await pool.query(
        `DELETE FROM formulation_steps WHERE id = ? AND versionId = ?`,
        [stepId, versionId]
      );
      return NextResponse.json({ success: true });
    }

    // ACTION: SAVE BATCH
    if (action === "save-batch") {
      const {
        batchDbId,
        formulationId,
        versionId,
        batchId,
        preparationDate,
        preparedBy,
        batchSize,
        storageConditions,
        physicalObservations,
        stabilityObservations,
        supportingFileUrl,
      } = body;

      if (!batchId?.trim()) {
        return NextResponse.json({ error: "Batch ID is required." }, { status: 400 });
      }

      if (batchDbId) {
        await pool.query(
          `
          UPDATE formulation_batches
          SET batchId = ?, preparationDate = ?, preparedBy = ?, batchSize = ?,
              storageConditions = ?, physicalObservations = ?, stabilityObservations = ?,
              supportingFileUrl = ?
          WHERE id = ? AND formulationId = ?
          `,
          [
            batchId.trim(),
            preparationDate || null,
            preparedBy?.trim() || null,
            batchSize?.trim() || null,
            storageConditions?.trim() || null,
            physicalObservations?.trim() || null,
            stabilityObservations?.trim() || null,
            supportingFileUrl || null,
            batchDbId,
            formulationId,
          ]
        );
        return NextResponse.json({ success: true, message: "Batch record updated." });
      } else {
        const [result]: any = await pool.query(
          `
          INSERT INTO formulation_batches (
            formulationId, versionId, projectId, batchId, preparationDate,
            preparedBy, batchSize, storageConditions, physicalObservations,
            stabilityObservations, supportingFileUrl
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            formulationId,
            versionId,
            projectId,
            batchId.trim(),
            preparationDate || null,
            preparedBy?.trim() || null,
            batchSize?.trim() || null,
            storageConditions?.trim() || null,
            physicalObservations?.trim() || null,
            stabilityObservations?.trim() || null,
            supportingFileUrl || null,
          ]
        );
        return NextResponse.json({ success: true, insertedId: result.insertId });
      }
    }

    // ACTION: DELETE BATCH
    if (action === "delete-batch") {
      const { batchDbId, formulationId } = body;
      await pool.query(
        `DELETE FROM formulation_batches WHERE id = ? AND formulationId = ?`,
        [batchDbId, formulationId]
      );
      return NextResponse.json({ success: true });
    }

    // ACTION: CREATE NEW VERSION (HISTORICAL PRESERVATION)
    if (action === "create-version") {
      const {
        formulationId,
        sourceVersionId,
        newVersionNumber,
        versionTag,
        changeSummary,
      } = body;

      if (!newVersionNumber?.trim()) {
        return NextResponse.json({ error: "New version number is required (e.g. v1.1, v2.0)" }, { status: 400 });
      }

      // 1. Mark existing versions as not current
      await pool.query(
        `UPDATE formulation_versions SET isCurrentVersion = 0 WHERE formulationId = ?`,
        [formulationId]
      );

      // 2. Insert new version
      const [vRes]: any = await pool.query(
        `
        INSERT INTO formulation_versions (
          formulationId, projectId, versionNumber, versionTag,
          changeSummary, createdByResearcherId, isCurrentVersion
        ) VALUES (?, ?, ?, ?, ?, ?, 1)
        `,
        [
          formulationId,
          projectId,
          newVersionNumber.trim(),
          versionTag?.trim() || null,
          changeSummary?.trim() || "Incremental formulation revision.",
          session.id,
        ]
      );
      const newVersionId = vRes.insertId;

      // 3. Update current version on formulation
      await pool.query(
        `UPDATE research_formulations SET currentVersionNumber = ? WHERE id = ?`,
        [newVersionNumber.trim(), formulationId]
      );

      // 4. Duplicate components from sourceVersionId into newVersionId to carry over baseline without altering history
      if (sourceVersionId) {
        const [sourceComps]: any = await pool.query(
          `SELECT * FROM formulation_components WHERE versionId = ?`,
          [sourceVersionId]
        );
        for (const c of sourceComps) {
          await pool.query(
            `
            INSERT INTO formulation_components (
              formulationId, versionId, projectId, componentName, roleInFormulation,
              sourceMaterial, quantity, unit, concentration, puritySpecification,
              sourceReference, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              formulationId,
              newVersionId,
              projectId,
              c.componentName,
              c.roleInFormulation,
              c.sourceMaterial,
              c.quantity,
              c.unit,
              c.concentration,
              c.puritySpecification,
              c.sourceReference,
              c.notes,
            ]
          );
        }

        // Duplicate steps
        const [sourceSteps]: any = await pool.query(
          `SELECT * FROM formulation_steps WHERE versionId = ?`,
          [sourceVersionId]
        );
        for (const s of sourceSteps) {
          await pool.query(
            `
            INSERT INTO formulation_steps (
              formulationId, versionId, projectId, stepNumber, procedureText,
              equipment, processingCondition, temperature, duration, otherParameters,
              researcherNotes, supportingFileUrl
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              formulationId,
              newVersionId,
              projectId,
              s.stepNumber,
              s.procedureText,
              s.equipment,
              s.processingCondition,
              s.temperature,
              s.duration,
              s.otherParameters,
              s.researcherNotes,
              s.supportingFileUrl,
            ]
          );
        }

        // Duplicate rationale baseline
        const [sourceRat]: any = await pool.query(
          `SELECT * FROM formulation_rationales WHERE versionId = ? LIMIT 1`,
          [sourceVersionId]
        );
        if (sourceRat.length > 0) {
          const r = sourceRat[0];
          await pool.query(
            `
            INSERT INTO formulation_rationales (
              formulationId, versionId, projectId, componentSelectionRationale,
              literatureSupport, previousStagesInfluence, knownLimitations,
              validationQuestions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              formulationId,
              newVersionId,
              projectId,
              r.componentSelectionRationale,
              r.literatureSupport,
              r.previousStagesInfluence,
              r.knownLimitations,
              r.validationQuestions,
            ]
          );
        }
      }

      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'VERSION_CREATED', ?)
        `,
        [projectId, session.id, `Created formulation version ${newVersionNumber.trim()}: ${changeSummary || "Revision"}`]
      );

      return NextResponse.json({
        success: true,
        message: `Formulation version ${newVersionNumber} created with historical data preserved.`,
        newVersionId,
      });
    }

    // ACTION: SWITCH ACTIVE VERSION
    if (action === "switch-version") {
      const { formulationId, versionId } = body;
      const [verRows]: any = await pool.query(
        `SELECT versionNumber FROM formulation_versions WHERE id = ? AND formulationId = ? LIMIT 1`,
        [versionId, formulationId]
      );
      if (verRows.length > 0) {
        await pool.query(
          `UPDATE formulation_versions SET isCurrentVersion = 0 WHERE formulationId = ?`,
          [formulationId]
        );
        await pool.query(
          `UPDATE formulation_versions SET isCurrentVersion = 1 WHERE id = ?`,
          [versionId]
        );
        await pool.query(
          `UPDATE research_formulations SET currentVersionNumber = ? WHERE id = ?`,
          [verRows[0].versionNumber, formulationId]
        );
      }
      return NextResponse.json({ success: true });
    }

    // ACTION: SAVE FORMULATION RATIONALE
    if (action === "save-rationale") {
      const {
        formulationId,
        versionId,
        componentSelectionRationale,
        literatureSupport,
        previousStagesInfluence,
        knownLimitations,
        validationQuestions,
      } = body;

      const [existing]: any = await pool.query(
        `SELECT id FROM formulation_rationales WHERE versionId = ? LIMIT 1`,
        [versionId]
      );

      if (existing.length > 0) {
        await pool.query(
          `
          UPDATE formulation_rationales
          SET componentSelectionRationale = ?, literatureSupport = ?,
              previousStagesInfluence = ?, knownLimitations = ?, validationQuestions = ?
          WHERE versionId = ?
          `,
          [
            componentSelectionRationale?.trim() || null,
            literatureSupport?.trim() || null,
            previousStagesInfluence?.trim() || null,
            knownLimitations?.trim() || null,
            validationQuestions?.trim() || null,
            versionId,
          ]
        );
      } else {
        await pool.query(
          `
          INSERT INTO formulation_rationales (
            formulationId, versionId, projectId, componentSelectionRationale,
            literatureSupport, previousStagesInfluence, knownLimitations,
            validationQuestions
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            formulationId,
            versionId,
            projectId,
            componentSelectionRationale?.trim() || null,
            literatureSupport?.trim() || null,
            previousStagesInfluence?.trim() || null,
            knownLimitations?.trim() || null,
            validationQuestions?.trim() || null,
          ]
        );
      }

      return NextResponse.json({ success: true, message: "Formulation rationale saved." });
    }

    // ACTION: COMPLETE STAGE 6
    if (action === "complete-stage") {
      // 1. Mark Stage 6 COMPLETED
      await pool.query(
        `
        UPDATE research_project_stages
        SET status = 'COMPLETED', completedAt = NOW()
        WHERE projectId = ? AND stageKey = 'formulation'
        `,
        [projectId]
      );

      // 2. Mark Stage 7 (safety) IN_PROGRESS
      await pool.query(
        `
        UPDATE research_project_stages
        SET status = 'IN_PROGRESS'
        WHERE projectId = ? AND stageKey = 'safety'
        `,
        [projectId]
      );

      // 3. Update project progress and currentStage
      await pool.query(
        `
        UPDATE research_projects
        SET currentStage = 'safety', progressPercent = GREATEST(progressPercent, 50), updatedAt = NOW()
        WHERE id = ?
        `,
        [projectId]
      );

      // 4. Update formulation status
      await pool.query(
        `UPDATE research_formulations SET status = 'COMPLETED' WHERE projectId = ?`,
        [projectId]
      );

      // 5. Activity log
      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'STAGE_COMPLETED', 'Completed Stage 6: Formulation Builder and progressed to Stage 7: Safety Assessment')
        `,
        [projectId, session.id]
      );

      return NextResponse.json({
        success: true,
        message: "Stage 6 — Formulation Builder completed! Advancing to Stage 7 Safety Assessment.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Formulation POST error:", error);
    return NextResponse.json({ error: "Failed to process formulation request" }, { status: 500 });
  }
}
