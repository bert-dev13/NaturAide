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

    // Verify ownership
    const [pCheck]: any = await pool.query(
      "SELECT id, title FROM research_projects WHERE id = ? AND researcherId = ?",
      [projectId, session.id]
    );
    if (pCheck.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const [rows]: any = await pool.query(
      `SELECT * FROM research_evidence_reviews WHERE projectId = ? LIMIT 1`,
      [projectId]
    );

    return NextResponse.json({
      success: true,
      evidenceReview: rows[0] || null,
    });
  } catch (error) {
    console.error("Evidence review GET error:", error);
    return NextResponse.json({ error: "Failed to load evidence review" }, { status: 500 });
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

    const [pCheck]: any = await pool.query(
      "SELECT id, title FROM research_projects WHERE id = ? AND researcherId = ?",
      [projectId, session.id]
    );
    if (pCheck.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const {
      background,
      traditionalKnowledge,
      existingEvidence,
      knownGaps,
      initialQuestion,
      objectives,
      supportingReferences,
      status, // 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    } = body;

    await pool.query(
      `
      INSERT INTO research_evidence_reviews (
        projectId, background, traditionalKnowledge, existingEvidence, knownGaps,
        initialQuestion, objectives, supportingReferences, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        background = VALUES(background),
        traditionalKnowledge = VALUES(traditionalKnowledge),
        existingEvidence = VALUES(existingEvidence),
        knownGaps = VALUES(knownGaps),
        initialQuestion = VALUES(initialQuestion),
        objectives = VALUES(objectives),
        supportingReferences = VALUES(supportingReferences),
        status = VALUES(status),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [
        projectId,
        background || null,
        traditionalKnowledge || null,
        existingEvidence || null,
        knownGaps || null,
        initialQuestion || null,
        objectives || null,
        supportingReferences || null,
        status || "IN_PROGRESS",
      ]
    );

    // Update stage status and progress
    const isCompleted = status === "COMPLETED";
    await pool.query(
      `
      UPDATE research_project_stages
      SET status = ?, completedAt = ${isCompleted ? "CURRENT_TIMESTAMP(3)" : "NULL"}, updatedAt = CURRENT_TIMESTAMP(3)
      WHERE projectId = ? AND stageKey = 'evidence-review'
      `,
      [isCompleted ? "COMPLETED" : "IN_PROGRESS", projectId]
    );

    await pool.query(
      `
      INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
      VALUES (?, ?, 'STAGE_SAVED', 'Updated Evidence Review documentation')
      `,
      [projectId, session.id]
    );

    return NextResponse.json({ success: true, message: "Evidence Review saved." });
  } catch (error) {
    console.error("Evidence review POST error:", error);
    return NextResponse.json({ error: "Failed to save evidence review" }, { status: 500 });
  }
}
