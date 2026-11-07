import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { askAiAboutSubmission } from "@/lib/review-ai-service";

// POST /api/reviewer/reviews/[id]/ask-ai
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const assignmentId = parseInt(id, 10);
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 });
    }

    // Verify reviewer ownership
    const [assignRows]: any = await pool.query(
      `SELECT submissionId, projectId FROM review_assignments WHERE id = ? AND reviewerId = ? LIMIT 1`,
      [assignmentId, session.id]
    );

    if (assignRows.length === 0) {
      return NextResponse.json({ error: "Assignment not found or unauthorized" }, { status: 404 });
    }

    const assignment = assignRows[0];
    const body = await request.json();
    const question = String(body.question || "").trim();

    if (!question) {
      return NextResponse.json({ error: "Please provide a question." }, { status: 400 });
    }

    if (question.length > 500) {
      return NextResponse.json({ error: "Question exceeds 500 characters limit." }, { status: 400 });
    }

    const result = await askAiAboutSubmission(assignment.submissionId, session.id, question);

    return NextResponse.json({
      success: true,
      answer: result.answer,
      citations: result.citations,
      model: result.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in ask-ai route:", error);
    return NextResponse.json({ error: error.message || "Failed to process inquiry" }, { status: 500 });
  }
}

