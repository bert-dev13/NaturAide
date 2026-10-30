import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

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
      "SELECT id, currentStage, progressPercent FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    // ACTION: COMPLETE STAGE 5 (Formulation & Safety)
    if (action === "complete-stage") {
      // 1. Verify formulation exists
      const [formRows]: any = await pool.query(
        "SELECT id, formulationName FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1",
        [projectId]
      );
      if (formRows.length === 0) {
        return NextResponse.json(
          { error: "Please configure a formulation before completing Stage 4." },
          { status: 400 }
        );
      }

      // 2. Verify safety assessment exists
      const [safeRows]: any = await pool.query(
        "SELECT id, status FROM research_safety_assessments WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      if (safeRows.length === 0) {
        return NextResponse.json(
          { error: "Please document the safety assessment before completing Stage 4." },
          { status: 400 }
        );
      }

      // 3. Mark Stage 4 COMPLETED across canonical and legacy keys
      await pool.query(
        `
        UPDATE research_project_stages
        SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
        WHERE projectId = ? AND (stageKey = 'formulation-safety' OR stageKey = 'formulation' OR stageKey = 'safety')
        `,
        [projectId]
      );

      await pool.query(
        `
        UPDATE research_project_stages
        SET status = CASE WHEN status = 'NOT_STARTED' THEN 'IN_PROGRESS' ELSE status END,
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE projectId = ? AND (stageKey = 'completion-integration' OR stageKey = 'completion')
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
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [projectId]
      );

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
    console.error("Formulation-safety POST error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
