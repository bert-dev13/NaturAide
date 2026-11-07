import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getOrGenerateReviewBrief } from "@/lib/review-ai-service";
import { normalizeReviewAreaKey } from "@/lib/expert-review-areas";

// GET /api/reviewer/reviews/[id]/ai-brief?specialty=...
export async function GET(
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

    // 1. Verify reviewer assignment ownership and retrieve project/submission info
    const [assignRows]: any = await pool.query(
      `
      SELECT ra.id, ra.submissionId, ra.projectId, ra.specialtyNeeded, ra.status,
             rs.versionTag, rp.title as projectTitle
      FROM review_assignments ra
      JOIN review_submissions rs ON ra.submissionId = rs.id
      JOIN research_projects rp ON ra.projectId = rp.id
      WHERE ra.id = ? AND ra.reviewerId = ?
      LIMIT 1
      `,
      [assignmentId, session.id]
    );

    if (assignRows.length === 0) {
      return NextResponse.json(
        { error: "Review assignment not found or access denied." },
        { status: 404 }
      );
    }

    const assignment = assignRows[0];
    const submissionId = assignment.submissionId;
    const projectId = assignment.projectId;

    // 2. Fetch all authorized specialties assigned to this reviewer for this submission
    const [allAssigned]: any = await pool.query(
      `SELECT specialtyNeeded FROM review_assignments WHERE submissionId = ? AND reviewerId = ?`,
      [submissionId, session.id]
    );
    const authorizedSpecialties = allAssigned.map((a: any) => normalizeReviewAreaKey(a.specialtyNeeded));

    // 3. Resolve requested specialty
    const { searchParams } = new URL(request.url);
    const querySpec = searchParams.get("specialty") || assignment.specialtyNeeded;
    const specialtyKey = querySpec === "OVERALL" ? "OVERALL" : normalizeReviewAreaKey(querySpec);

    // 4. Get or generate review brief
    const brief = await getOrGenerateReviewBrief(projectId, submissionId, specialtyKey, false);

    // 5. Fetch reviewer's checklist progress
    const [progressRows]: any = await pool.query(
      `SELECT checkedItemKeys FROM review_checklist_progress WHERE assignmentId = ? AND specialtyKey = ? LIMIT 1`,
      [assignmentId, specialtyKey]
    );

    let checkedKeys: string[] = [];
    if (progressRows.length > 0 && progressRows[0].checkedItemKeys) {
      try {
        checkedKeys = typeof progressRows[0].checkedItemKeys === "string" 
          ? JSON.parse(progressRows[0].checkedItemKeys) 
          : progressRows[0].checkedItemKeys;
      } catch {}
    }

    // Attach checked state to checklist items
    const checklistWithState = (brief.checklistItems || []).map((item) => ({
      ...item,
      checked: checkedKeys.includes(item.id),
    }));

    return NextResponse.json({
      success: true,
      brief: {
        ...brief,
        checklistItems: checklistWithState,
      },
      checkedKeys,
      authorizedSpecialties: Array.from(new Set(authorizedSpecialties)),
      defaultSpecialty: normalizeReviewAreaKey(assignment.specialtyNeeded),
      activeSpecialty: specialtyKey,
      submissionId,
      projectId,
      versionTag: assignment.versionTag || "v1.0",
    });
  } catch (error: any) {
    console.error("Error in ai-brief GET route:", error);
    return NextResponse.json({ error: error.message || "Failed to load AI review brief" }, { status: 500 });
  }
}

// POST /api/reviewer/reviews/[id]/ai-brief/regenerate
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

    const [assignRows]: any = await pool.query(
      `SELECT submissionId, projectId, specialtyNeeded FROM review_assignments WHERE id = ? AND reviewerId = ? LIMIT 1`,
      [assignmentId, session.id]
    );

    if (assignRows.length === 0) {
      return NextResponse.json({ error: "Assignment not found or unauthorized" }, { status: 404 });
    }

    const assignment = assignRows[0];
    const body = await request.json().catch(() => ({}));
    const querySpec = body.specialty || assignment.specialtyNeeded;
    const specialtyKey = querySpec === "OVERALL" ? "OVERALL" : normalizeReviewAreaKey(querySpec);

    // Force regenerate
    const brief = await getOrGenerateReviewBrief(assignment.projectId, assignment.submissionId, specialtyKey, true);

    return NextResponse.json({
      success: true,
      message: "AI review brief regenerated successfully.",
      brief,
    });
  } catch (error: any) {
    console.error("Error regenerating ai-brief:", error);
    return NextResponse.json({ error: error.message || "Failed to regenerate AI review brief" }, { status: 500 });
  }
}

