import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assertReviewerEligible } from "@/lib/reviewer-eligibility";
import { syncCoverageStatus } from "@/lib/expert-review-assignment";

const SECTION_STATUSES = ["NOT_REVIEWED", "REVIEWED", "NEEDS_ATTENTION"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ineligible = await assertReviewerEligible(session.id);
    if (ineligible) return ineligible;

    const { id } = await params;
    const identifier = parseInt(id, 10);

    // Verify reviewer assignment
    const [assign]: any = await pool.query(
      "SELECT id, submissionId, projectId FROM review_assignments WHERE (id = ? OR submissionId = ? OR projectId = ?) AND reviewerId = ? LIMIT 1",
      [identifier, identifier, identifier, session.id]
    );

    if (assign.length === 0) {
      return NextResponse.json({ error: "Review assignment not found or access denied." }, { status: 404 });
    }

    const submissionId = assign[0].submissionId;
    const body = await request.json();
    const { sectionKey, status, notes } = body;

    if (!sectionKey || !status) {
      return NextResponse.json({ error: "Section key and status are required." }, { status: 400 });
    }
    if (!SECTION_STATUSES.includes(status) || typeof sectionKey !== "string" || sectionKey.length > 50) {
      return NextResponse.json({ error: "Invalid section key or status." }, { status: 400 });
    }

    await pool.query(
      `
      INSERT INTO review_section_status (submissionId, reviewerId, sectionKey, status, notes)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        notes = VALUES(notes),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [submissionId, session.id, sectionKey, status, notes || null]
    );
    await syncCoverageStatus(submissionId, session.id, sectionKey, status);

    return NextResponse.json({
      success: true,
      message: `Section "${sectionKey}" marked as ${status}.`,
    });
  } catch (error) {
    console.error("Section status update error:", error);
    return NextResponse.json({ error: "Failed to update section status" }, { status: 500 });
  }
}
