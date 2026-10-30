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

    // Verify ownership and get project info
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

    // Fetch all literature references for this project (Stage 1 references + Stage 3 additions)
    const [references]: any = await pool.query(
      `
      SELECT id, projectId, researcherId, scientificReferenceId,
             COALESCE(sourceType, 'MANUAL_ENTRY') as sourceType,
             title, authors, year, journalSource, doiOrUrl, studyType,
             plantOrCompound, keyFindings, limitations, researchNotes,
             tags, pubmedId, documentUrl, studyDesign, plantPart,
             researchMethods, experimentalModel, evidenceScope,
             relevanceToCurrentResearch, matrixCompleted, createdAt, updatedAt
      FROM literature_references
      WHERE projectId = ?
      ORDER BY id DESC
      `,
      [projectId]
    );

    // Fetch literature synthesis
    const [synthesisRows]: any = await pool.query(
      `SELECT * FROM research_literature_syntheses WHERE projectId = ? LIMIT 1`,
      [projectId]
    );

    const synthesis = synthesisRows[0] || {
      projectId,
      keyFindings: "",
      areasOfAgreement: "",
      conflictingFindings: "",
      evidenceLimitations: "",
      remainingGaps: "",
      relevanceToQuestion: "",
      status: "IN_PROGRESS",
    };

    // Calculate real dynamic counts from MySQL
    let selectedReferences = references.length;
    let humanStudies = 0;
    let laboratoryStudies = 0;
    let reviews = 0;
    let computationalStudies = 0;
    let safetyEvidence = 0;

    for (const ref of references) {
      const st = (ref.studyType || "").toLowerCase();
      const scope = (ref.evidenceScope || "").toLowerCase();
      const tags = (ref.tags || "").toLowerCase();

      if (
        st.includes("clinical") ||
        st.includes("human") ||
        st.includes("in-vivo") ||
        st.includes("patient") ||
        scope.includes("human") ||
        scope.includes("animal")
      ) {
        humanStudies++;
      }

      if (
        st.includes("in-vitro") ||
        st.includes("bioactivity") ||
        st.includes("extraction") ||
        st.includes("screening") ||
        st.includes("assay") ||
        scope.includes("laboratory") ||
        scope.includes("in-vitro")
      ) {
        laboratoryStudies++;
      }

      if (st.includes("review") || st.includes("systematic") || scope.includes("review")) {
        reviews++;
      }

      if (
        st.includes("in-silico") ||
        st.includes("docking") ||
        st.includes("computational") ||
        st.includes("admet") ||
        scope.includes("computational") ||
        scope.includes("in-silico")
      ) {
        computationalStudies++;
      }

      if (
        st.includes("safety") ||
        st.includes("toxic") ||
        tags.includes("safety") ||
        scope.includes("safety")
      ) {
        safetyEvidence++;
      }
    }

    // Dynamic checklist evaluation
    const matrixAnalyzedCount = references.filter((r: any) => r.matrixCompleted || r.studyDesign || r.researchMethods).length;
    const checklist = {
      hasLiterature: selectedReferences > 0,
      hasMatrixCompleted: matrixAnalyzedCount > 0,
      hasKeyFindings: Boolean(synthesis.keyFindings && synthesis.keyFindings.trim().length > 0),
      hasLimitations: Boolean(synthesis.evidenceLimitations && synthesis.evidenceLimitations.trim().length > 0),
      hasRemainingGaps: Boolean(synthesis.remainingGaps && synthesis.remainingGaps.trim().length > 0),
      hasRelevance: Boolean(synthesis.relevanceToQuestion && synthesis.relevanceToQuestion.trim().length > 0),
    };

    const isReadyToComplete =
      checklist.hasLiterature &&
      checklist.hasMatrixCompleted &&
      checklist.hasKeyFindings &&
      checklist.hasLimitations &&
      checklist.hasRemainingGaps &&
      checklist.hasRelevance;

    return NextResponse.json({
      success: true,
      project,
      references,
      synthesis,
      counts: {
        selectedReferences,
        humanStudies,
        laboratoryStudies,
        reviews,
        computationalStudies,
        safetyEvidence,
      },
      matrixAnalyzedCount,
      checklist,
      isReadyToComplete,
    });
  } catch (error) {
    console.error("Literature GET error:", error);
    return NextResponse.json({ error: "Failed to load literature & evidence data" }, { status: 500 });
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
    const [pCheck]: any = await pool.query(
      "SELECT id, title FROM research_projects WHERE id = ? AND researcherId = ?",
      [projectId, session.id]
    );
    if (pCheck.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const action = body.action || "save-synthesis";

    // 1. UPDATE LITERATURE MATRIX FOR A SPECIFIC REFERENCE
    if (action === "update-matrix") {
      const {
        referenceId,
        studyDesign,
        plantOrCompound,
        plantPart,
        researchMethods,
        experimentalModel,
        evidenceScope,
        keyFindings,
        limitations,
        relevanceToCurrentResearch,
        researchNotes,
      } = body;

      if (!referenceId) {
        return NextResponse.json({ error: "Reference ID is required" }, { status: 400 });
      }

      await pool.query(
        `
        UPDATE literature_references
        SET
          studyDesign = ?,
          plantOrCompound = COALESCE(?, plantOrCompound),
          plantPart = ?,
          researchMethods = ?,
          experimentalModel = ?,
          evidenceScope = ?,
          keyFindings = ?,
          limitations = ?,
          relevanceToCurrentResearch = ?,
          researchNotes = ?,
          matrixCompleted = 1,
          updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ? AND projectId = ?
        `,
        [
          studyDesign || null,
          plantOrCompound || null,
          plantPart || null,
          researchMethods || null,
          experimentalModel || null,
          evidenceScope || "Laboratory / In-Vitro",
          keyFindings || null,
          limitations || null,
          relevanceToCurrentResearch || null,
          researchNotes || null,
          referenceId,
          projectId,
        ]
      );

      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'LITERATURE_ANALYZED', ?)
        `,
        [projectId, session.id, `Completed literature matrix analysis for study #${referenceId}`]
      );

      return NextResponse.json({
        success: true,
        message: "Literature matrix analysis updated successfully.",
      });
    }

    // 2. SAVE EVIDENCE SYNTHESIS
    if (action === "save-synthesis") {
      const {
        keyFindings,
        areasOfAgreement,
        conflictingFindings,
        evidenceLimitations,
        remainingGaps,
        relevanceToQuestion,
      } = body;

      await pool.query(
        `
        INSERT INTO research_literature_syntheses (
          projectId, keyFindings, areasOfAgreement, conflictingFindings,
          evidenceLimitations, remainingGaps, relevanceToQuestion, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS')
        ON DUPLICATE KEY UPDATE
          keyFindings = VALUES(keyFindings),
          areasOfAgreement = VALUES(areasOfAgreement),
          conflictingFindings = VALUES(conflictingFindings),
          evidenceLimitations = VALUES(evidenceLimitations),
          remainingGaps = VALUES(remainingGaps),
          relevanceToQuestion = VALUES(relevanceToQuestion),
          updatedAt = CURRENT_TIMESTAMP(3)
        `,
        [
          projectId,
          keyFindings || null,
          areasOfAgreement || null,
          conflictingFindings || null,
          evidenceLimitations || null,
          remainingGaps || null,
          relevanceToQuestion || null,
        ]
      );

      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'STAGE_SAVED', 'Updated Stage 3 Literature & Evidence synthesis')
        `,
        [projectId, session.id]
      );

      return NextResponse.json({
        success: true,
        message: "Evidence synthesis saved successfully.",
      });
    }

    // 3. ADD NEW LITERATURE REFERENCE
    if (action === "add-reference") {
      const {
        title,
        authors,
        year,
        journalSource,
        doiOrUrl,
        studyType,
        plantOrCompound,
        keyFindings,
        limitations,
        researchNotes,
        sourceType,
        pubmedId,
        documentUrl,
        evidenceScope,
      } = body;

      if (!title || !title.trim()) {
        return NextResponse.json({ error: "Paper title is required" }, { status: 400 });
      }

      const validSourceTypes = ["EXTERNAL_SOURCE", "MANUAL_ENTRY", "UPLOADED_DOCUMENT", "VERIFIED_NATUREAIDE"];
      const resolvedSourceType = validSourceTypes.includes(sourceType) ? sourceType : "EXTERNAL_SOURCE";

      const [insertRes]: any = await pool.query(
        `
        INSERT INTO literature_references (
          researcherId, projectId, title, authors, year, journalSource,
          doiOrUrl, studyType, plantOrCompound, keyFindings, limitations,
          researchNotes, tags, sourceType, pubmedId, documentUrl, evidenceScope,
          matrixCompleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `,
        [
          session.id,
          projectId,
          title.trim(),
          authors?.trim() || "Unspecified Author(s)",
          year ? parseInt(year, 10) : new Date().getFullYear(),
          journalSource?.trim() || "Independent Publication",
          doiOrUrl?.trim() || null,
          studyType || "Scientific Study",
          plantOrCompound?.trim() || null,
          keyFindings?.trim() || null,
          limitations?.trim() || null,
          researchNotes?.trim() || null,
          resolvedSourceType.replace(/_/g, " "),
          resolvedSourceType,
          pubmedId?.trim() || null,
          documentUrl?.trim() || null,
          evidenceScope || "Laboratory / In-Vitro",
        ]
      );

      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'EVIDENCE_ADDED', ?)
        `,
        [projectId, session.id, `Added literature reference: "${title.trim().slice(0, 50)}..."`]
      );

      return NextResponse.json({
        success: true,
        message: "Literature reference added.",
        insertedId: insertRes.insertId,
      });
    }

    // 4. COMPLETE STAGE 3
    if (action === "complete-stage") {
      // Validate checklist
      const [refs]: any = await pool.query(
        "SELECT id, matrixCompleted, studyDesign, researchMethods FROM literature_references WHERE projectId = ?",
        [projectId]
      );

      const [synthRows]: any = await pool.query(
        "SELECT * FROM research_literature_syntheses WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      const synth = synthRows[0] || {};

      if (refs.length === 0) {
        return NextResponse.json({ error: "Please select or add at least one relevant literature reference." }, { status: 400 });
      }

      const analyzedCount = refs.filter((r: any) => r.matrixCompleted || r.studyDesign || r.researchMethods).length;
      if (analyzedCount === 0) {
        return NextResponse.json({ error: "Please complete the literature matrix analysis for at least one core study." }, { status: 400 });
      }

      if (!synth.keyFindings || !synth.keyFindings.trim()) {
        return NextResponse.json({ error: "Key findings across studies must be documented in the synthesis." }, { status: 400 });
      }
      if (!synth.evidenceLimitations || !synth.evidenceLimitations.trim()) {
        return NextResponse.json({ error: "Evidence limitations must be documented in the synthesis." }, { status: 400 });
      }
      if (!synth.remainingGaps || !synth.remainingGaps.trim()) {
        return NextResponse.json({ error: "Remaining knowledge gaps must be documented in the synthesis." }, { status: 400 });
      }
      if (!synth.relevanceToQuestion || !synth.relevanceToQuestion.trim()) {
        return NextResponse.json({ error: "Relevance to current research question must be documented in the synthesis." }, { status: 400 });
      }

      // Mark Stage 3 COMPLETED
      await pool.query(
        `
        UPDATE research_project_stages
        SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
        WHERE projectId = ? AND stageKey = 'literature'
        `,
        [projectId]
      );

      // Set Stage 4 In-Silico Analysis to IN_PROGRESS
      await pool.query(
        `
        UPDATE research_project_stages
        SET status = CASE WHEN status = 'NOT_STARTED' THEN 'IN_PROGRESS' ELSE status END,
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE projectId = ? AND stageKey = 'in-silico'
        `,
        [projectId]
      );

      // Update project currentStage to in-silico and advance progress
      await pool.query(
        `
        UPDATE research_projects
        SET currentStage = 'in-silico',
            progressPercent = GREATEST(progressPercent, 25),
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [projectId]
      );

      // Log completion activity
      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'STAGE_COMPLETED', 'Completed Stage 3: Literature & Evidence and progressed to Stage 4: In-Silico Analysis')
        `,
        [projectId, session.id]
      );

      return NextResponse.json({
        success: true,
        message: "Literature & Evidence completed. Continuing to In-Silico Analysis.",
        nextStage: "in-silico",
        redirectUrl: `/researcher/projects/${projectId}/in-silico`,
      });
    }

    return NextResponse.json({ error: "Unrecognized action" }, { status: 400 });
  } catch (error) {
    console.error("Literature POST error:", error);
    return NextResponse.json({ error: "Failed to process literature action" }, { status: 500 });
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const refId = searchParams.get("refId");

    if (!refId) {
      return NextResponse.json({ error: "Reference ID is required" }, { status: 400 });
    }

    const [delRes]: any = await pool.query(
      "DELETE FROM literature_references WHERE id = ? AND projectId = ? AND researcherId = ?",
      [refId, projectId, session.id]
    );

    if (delRes.affectedRows === 0) {
      return NextResponse.json({ error: "Reference not found or unauthorized" }, { status: 404 });
    }

    await pool.query(
      `
      INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
      VALUES (?, ?, 'EVIDENCE_REMOVED', 'Removed reference #${refId} from Stage 3 Literature')
      `,
      [projectId, session.id]
    );

    return NextResponse.json({ success: true, message: "Reference removed from literature." });
  } catch (error) {
    console.error("Literature DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete reference" }, { status: 500 });
  }
}
