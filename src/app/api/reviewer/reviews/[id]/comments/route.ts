import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assertReviewerEligible } from "@/lib/reviewer-eligibility";
import { syncCoverageStatus } from "@/lib/expert-review-assignment";

const COMMENT_TYPES = ["GENERAL_COMMENT", "CLARIFICATION_NEEDED", "EVIDENCE_NEEDED", "CORRECTION_SUGGESTED", "SAFETY_CONCERN"];
const SEVERITIES = ["INFORMATIONAL", "MINOR", "MAJOR", "CRITICAL"];

async function readJson(request: Request): Promise<any | null> {
  try {
    const b = await request.json();
    return b && typeof b === "object" ? b : null;
  } catch {
    return null;
  }
}

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

    const [assign]: any = await pool.query(
      `
      SELECT ra.id, ra.submissionId, ra.projectId, ra.reviewRound, ra.status, rs.versionTag
      FROM review_assignments ra
      JOIN review_submissions rs ON ra.submissionId = rs.id
      WHERE (ra.id = ? OR ra.submissionId = ? OR ra.projectId = ?) AND ra.reviewerId = ?
      LIMIT 1
      `,
      [identifier, identifier, identifier, session.id]
    );

    if (assign.length === 0) {
      return NextResponse.json({ error: "Review assignment not found or access denied." }, { status: 404 });
    }
    if (assign[0].status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot add comments after review has been completed." }, { status: 400 });
    }

    const { submissionId, projectId, reviewRound, versionTag } = assign[0];
    const body = await readJson(request);
    if (!body) {
      return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
    }
    const { sectionName, commentType, severity, comment, recommendation, referenceLink } = body;

    if (typeof sectionName !== "string" || typeof comment !== "string" || !sectionName || !comment.trim()) {
      return NextResponse.json({ error: "Section name and comment text are required." }, { status: 400 });
    }
    if ((commentType && !COMMENT_TYPES.includes(commentType)) || (severity && !SEVERITIES.includes(severity))) {
      return NextResponse.json({ error: "Invalid comment type or severity." }, { status: 400 });
    }

    // Require explanation for MAJOR or CRITICAL concerns
    if ((severity === "MAJOR" || severity === "CRITICAL") && comment.trim().length < 15) {
      return NextResponse.json({
        error: "A detailed clinical explanation (at least 15 characters) is required for Major or Critical concerns.",
      }, { status: 400 });
    }

    const [cRes]: any = await pool.query(
      `
      INSERT INTO review_feedback (
        projectId, submissionId, reviewerId, reviewRound, sectionName,
        commentType, severity, reviewerName, comment, recommendation,
        referenceLink, dossierVersionTag, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
      `,
      [
        projectId,
        submissionId,
        session.id,
        reviewRound || 1,
        sectionName,
        commentType || "GENERAL_COMMENT",
        severity || "INFORMATIONAL",
        session.name,
        comment.trim(),
        recommendation?.trim() || null,
        referenceLink?.trim() || null,
        versionTag || "v1.0",
      ]
    );

    // Also mark section status as NEEDS_ATTENTION if severity is MAJOR/CRITICAL or SAFETY_CONCERN
    if (severity === "MAJOR" || severity === "CRITICAL" || commentType === "SAFETY_CONCERN") {
      await pool.query(
        `
        INSERT INTO review_section_status (submissionId, reviewerId, sectionKey, status, notes)
        VALUES (?, ?, ?, 'NEEDS_ATTENTION', 'Reviewer flagged concern')
        ON DUPLICATE KEY UPDATE status = 'NEEDS_ATTENTION', updatedAt = CURRENT_TIMESTAMP(3)
        `,
        [submissionId, session.id, sectionName]
      );
      await syncCoverageStatus(submissionId, session.id, sectionName, "NEEDS_ATTENTION");
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
      VALUES (?, ?, ?, 'REVIEWER', 'COMMENT_ADDED', ?)
      `,
      [projectId, submissionId, session.id, `Reviewer added ${severity} ${commentType} on section "${sectionName}"`]
    );

    return NextResponse.json({
      success: true,
      commentId: cRes.insertId,
      message: "Feedback comment recorded.",
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

// Edit own comment before final decision
export async function PUT(
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

    const [assign]: any = await pool.query(
      "SELECT id, submissionId, projectId, status FROM review_assignments WHERE (id = ? OR submissionId = ? OR projectId = ?) AND reviewerId = ? LIMIT 1",
      [identifier, identifier, identifier, session.id]
    );

    if (assign.length === 0) {
      return NextResponse.json({ error: "Review assignment not found or access denied." }, { status: 404 });
    }

    if (assign[0].status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot edit comments after review has been completed." }, { status: 400 });
    }

    const body = await readJson(request);
    if (!body) {
      return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
    }
    const { commentId, sectionName, commentType, severity, comment, recommendation, referenceLink } = body;

    if (!commentId || typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json({ error: "Comment ID and updated comment text are required." }, { status: 400 });
    }
    if ((commentType && !COMMENT_TYPES.includes(commentType)) || (severity && !SEVERITIES.includes(severity))) {
      return NextResponse.json({ error: "Invalid comment type or severity." }, { status: 400 });
    }

    await pool.query(
      `
      UPDATE review_feedback
      SET
        sectionName = COALESCE(?, sectionName),
        commentType = COALESCE(?, commentType),
        severity = COALESCE(?, severity),
        comment = ?,
        recommendation = ?,
        referenceLink = ?,
        updatedAt = CURRENT_TIMESTAMP(3)
      WHERE id = ? AND reviewerId = ? AND submissionId = ?
        AND status = 'OPEN' AND researcherReply IS NULL
      `,
      [
        sectionName || null,
        commentType || null,
        severity || null,
        comment.trim(),
        recommendation?.trim() || null,
        referenceLink?.trim() || null,
        commentId,
        session.id,
        assign[0].submissionId,
      ]
    );

    return NextResponse.json({ success: true, message: "Comment updated successfully." });
  } catch (error) {
    console.error("Edit comment error:", error);
    return NextResponse.json({ error: "Failed to edit comment" }, { status: 500 });
  }
}

// Delete own draft comment
export async function DELETE(
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

    const [assign]: any = await pool.query(
      "SELECT id, submissionId, projectId, status FROM review_assignments WHERE (id = ? OR submissionId = ? OR projectId = ?) AND reviewerId = ? LIMIT 1",
      [identifier, identifier, identifier, session.id]
    );

    if (assign.length === 0) {
      return NextResponse.json({ error: "Review assignment not found or access denied." }, { status: 404 });
    }

    if (assign[0].status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot delete comments after review is completed." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = parseInt(searchParams.get("commentId") || "", 10);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: "Valid comment ID is required." }, { status: 400 });
    }

    // Comments already answered by the researcher (or no longer OPEN) are part of the
    // preserved review history and cannot be deleted.
    await pool.query(
      "DELETE FROM review_feedback WHERE id = ? AND reviewerId = ? AND submissionId = ? AND status = 'OPEN' AND researcherReply IS NULL",
      [commentId, session.id, assign[0].submissionId]
    );

    return NextResponse.json({ success: true, message: "Comment deleted." });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}

// Resolve or unresolve comment
export async function PATCH(
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

    const [assign]: any = await pool.query(
      "SELECT id, submissionId, projectId FROM review_assignments WHERE (id = ? OR submissionId = ? OR projectId = ?) AND reviewerId = ? LIMIT 1",
      [identifier, identifier, identifier, session.id]
    );

    if (assign.length === 0) {
      return NextResponse.json({ error: "Review assignment not found or access denied." }, { status: 404 });
    }

    const body = await readJson(request);
    if (!body) {
      return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
    }
    const { commentId, status } = body; // 'RESOLVED' | 'OPEN'

    if (!commentId || !status) {
      return NextResponse.json({ error: "Comment ID and status required." }, { status: 400 });
    }
    if (status !== "RESOLVED" && status !== "OPEN") {
      return NextResponse.json({ error: "Status must be RESOLVED or OPEN." }, { status: 400 });
    }

    await pool.query(
      `
      UPDATE review_feedback
      SET status = ?, resolvedAt = ${status === "RESOLVED" ? "CURRENT_TIMESTAMP(3)" : "NULL"}, updatedAt = CURRENT_TIMESTAMP(3)
      WHERE id = ? AND submissionId = ? AND reviewerId = ?
      `,
      [status, commentId, assign[0].submissionId, session.id]
    );

    return NextResponse.json({ success: true, message: `Comment status updated to ${status}.` });
  } catch (error) {
    console.error("Update comment status error:", error);
    return NextResponse.json({ error: "Failed to update comment status" }, { status: 500 });
  }
}
