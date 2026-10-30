import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { resolvePlantImage } from "@/lib/record-images";
import { WORKFLOW_STAGES } from "@/lib/workflow-stages";

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

    // Ensure researcher only accesses their own projects
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.*,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
             p.scientificName as plantScientificName,
             p.category as plantCategory,
             p.imageUrl as plantImageUrl
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
    if (project.plantImageUrl) {
      project.plantImageUrl = resolvePlantImage(project.plantImageUrl);
    }

    // Fetch all stages
    const [stages]: any = await pool.query(
      `SELECT stageKey, status, completedAt, updatedAt FROM research_project_stages WHERE projectId = ?`,
      [projectId]
    );

    // Self-heal project.currentStage if it has regressed or is out of sync with completed stages
    const stageStatusMap: Record<string, string> = {};
    for (const s of stages) stageStatusMap[s.stageKey] = s.status;

    if (stageStatusMap[project.currentStage] === "COMPLETED") {
      const activeStage =
        WORKFLOW_STAGES.find((s) => stageStatusMap[s.key] === "IN_PROGRESS" || stageStatusMap[s.key] === "UNDER_REVIEW") ||
        WORKFLOW_STAGES.find((s) => stageStatusMap[s.key] !== "COMPLETED") ||
        WORKFLOW_STAGES[WORKFLOW_STAGES.length - 1];

      if (activeStage && activeStage.key !== project.currentStage) {
        project.currentStage = activeStage.key;
        await pool.query(
          `UPDATE research_projects SET currentStage = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
          [activeStage.key, projectId]
        );
      }
    }

    // Fetch reviewer feedback if any exists
    let reviewerFeedback: any[] = [];
    try {
      const [feedbackRows]: any = await pool.query(
        `SELECT id, reviewRound, sectionName, commentType, severity, reviewerName, comment, status, researcherReply, createdAt 
         FROM review_feedback 
         WHERE projectId = ? 
         ORDER BY createdAt DESC LIMIT 10`,
        [projectId]
      );
      reviewerFeedback = feedbackRows;
    } catch {
      // Table might not have entries or review yet
      reviewerFeedback = [];
    }

    // Fetch recent activity
    const [activities]: any = await pool.query(
      `SELECT actionType, description, createdAt FROM research_activity_logs WHERE projectId = ? ORDER BY createdAt DESC LIMIT 10`,
      [projectId]
    );

    const completedStagesCount = stages.filter((s: any) => s.status === "COMPLETED").length;

    return NextResponse.json({
      success: true,
      project,
      stages,
      completedStagesCount,
      reviewerFeedback,
      activities,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(
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
    const body = await request.json();

    const { title, shortDescription, researchObjective, researchQuestion, areaOfInterest, expectedOutcome, status, currentStage, progressPercent } = body;

    // Verify ownership
    const [check]: any = await pool.query("SELECT id FROM research_projects WHERE id = ? AND researcherId = ?", [
      projectId,
      session.id,
    ]);
    if (check.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    await pool.query(
      `
      UPDATE research_projects
      SET
        title = COALESCE(?, title),
        shortDescription = COALESCE(?, shortDescription),
        researchObjective = COALESCE(?, researchObjective),
        researchQuestion = COALESCE(?, researchQuestion),
        areaOfInterest = COALESCE(?, areaOfInterest),
        expectedOutcome = COALESCE(?, expectedOutcome),
        status = COALESCE(?, status),
        currentStage = COALESCE(?, currentStage),
        progressPercent = COALESCE(?, progressPercent),
        updatedAt = CURRENT_TIMESTAMP(3)
      WHERE id = ? AND researcherId = ?
      `,
      [
        title || null,
        shortDescription || null,
        researchObjective || null,
        researchQuestion || null,
        areaOfInterest || null,
        expectedOutcome || null,
        status || null,
        currentStage || null,
        progressPercent ?? null,
        projectId,
        session.id,
      ]
    );

    if (currentStage) {
      await pool.query(
        `UPDATE research_project_stages SET status = 'IN_PROGRESS' WHERE projectId = ? AND stageKey = ? AND status = 'NOT_STARTED'`,
        [projectId, currentStage]
      );
    }

    return NextResponse.json({ success: true, message: "Project updated." });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection: any = null;
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

    // 1. Authenticate and verify researcher ownership
    const [projectRows]: any = await pool.query(
      "SELECT id, status, title FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json(
        { error: "Project not found or unauthorized to delete" },
        { status: 404 }
      );
    }

    // 2. Open dedicated connection for transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 3. Delete project-owned dependent records in foreign-key safe order
    // 3a. Review and revision records
    await connection.query(
      "DELETE FROM review_section_status WHERE submissionId IN (SELECT id FROM review_submissions WHERE projectId = ?)",
      [projectId]
    );
    await connection.query("DELETE FROM review_assignments WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM review_decisions WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM review_feedback WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM review_submissions WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM review_area_coverage WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM review_activity_logs WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM revision_change_records WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM revision_cycles WHERE projectId = ?", [projectId]);

    // 3b. Formulation records
    await connection.query(
      "DELETE FROM formulation_ingredients WHERE formulationId IN (SELECT id FROM formulations WHERE projectId = ?)",
      [projectId]
    );
    await connection.query("DELETE FROM formulation_components WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM formulation_steps WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM formulation_rationales WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM formulation_versions WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM formulation_batches WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM formulations WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_formulations WHERE projectId = ?", [projectId]);

    // 3c. In-Silico and Docking records
    await connection.query("DELETE FROM insilico_results WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_insilico_syntheses WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM docking_ligand_preps WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM docking_runs WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM docking_setups WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM docking_targets WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_docking_syntheses WHERE projectId = ?", [projectId]);

    // 3d. Safety assessments
    await connection.query("DELETE FROM safety_component_assessments WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM safety_concerns WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM safety_summaries WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM safety_assessments WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_safety_assessments WHERE projectId = ?", [projectId]);

    // 3e. Research compounds (project-specific)
    await connection.query("DELETE FROM research_compounds WHERE projectId = ?", [projectId]);

    // 3f. Evidence, literature & botanical project records
    await connection.query("DELETE FROM project_evidence_items WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_evidence_traceability WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_evidence_reviews WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM literature_references WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_literature_syntheses WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_plant_data WHERE projectId = ?", [projectId]);

    // 3g. Dossiers, final findings & completion records
    await connection.query("DELETE FROM research_dossier_stage_snapshots WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_dossier_versions WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_dossiers WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_final_findings WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_completions WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_completion_records WHERE projectId = ?", [projectId]);

    // 3h. Knowledge proposals & laboratory records
    await connection.query("DELETE FROM knowledge_integration_activity_logs WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM knowledge_integration_proposals WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM knowledge_proposals WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM laboratory_files WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM laboratory_test_results WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM laboratory_tests WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM laboratory_interpretations WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM laboratory_validations WHERE projectId = ?", [projectId]);

    // 3i. Activity logs & stages
    await connection.query("DELETE FROM research_activity_logs WHERE projectId = ?", [projectId]);
    await connection.query("DELETE FROM research_project_stages WHERE projectId = ?", [projectId]);

    // 4. Finally, delete the research project record itself
    await connection.query(
      "DELETE FROM research_projects WHERE id = ? AND researcherId = ?",
      [projectId, session.id]
    );

    // 5. Commit transaction
    await connection.commit();

    return NextResponse.json({
      success: true,
      message: `Project #${projectId} and its associated workspace records were safely deleted.`,
    });
  } catch (error: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.error("Failed to rollback transaction:", rbErr);
      }
    }
    console.error("Error deleting research project:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete project safely" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
