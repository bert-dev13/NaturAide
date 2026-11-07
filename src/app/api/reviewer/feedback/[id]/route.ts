import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const feedbackId = parseInt(id, 10);
    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM review_feedback WHERE id = ? AND reviewerId = ?`,
      [feedbackId, session.id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete feedback error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete finding" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const feedbackId = parseInt(id, 10);
    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [existingRows]: any = await pool.query(
      `SELECT rf.id, rf.projectId, rf.title, rf.comment, rp.researcherId, rp.title as projectTitle
       FROM review_feedback rf
       JOIN research_projects rp ON rf.projectId = rp.id
       WHERE rf.id = ? LIMIT 1`,
      [feedbackId]
    );

    if (existingRows.length === 0) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    const finding = existingRows[0];

    const body = await request.json();
    const { status, comment, recommendation } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (status && ["OPEN", "ADDRESSED", "RESOLVED"].includes(status)) {
      updates.push("status = ?");
      values.push(status);
      if (status === "RESOLVED") {
        updates.push("resolvedAt = CURRENT_TIMESTAMP(3)");
      }
    }
    if (typeof comment === "string" && comment.trim()) {
      updates.push("comment = ?");
      values.push(comment.trim());
    }
    if (typeof recommendation === "string") {
      updates.push("recommendation = ?");
      values.push(recommendation.trim());
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updatedAt = CURRENT_TIMESTAMP(3)");
    values.push(feedbackId);

    await pool.query(
      `UPDATE review_feedback SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    if (status === "RESOLVED") {
      // Check if all findings for the project are now resolved
      const [remaining]: any = await pool.query(
        `SELECT COUNT(*) as count FROM review_feedback WHERE projectId = ? AND status != 'RESOLVED'`,
        [finding.projectId]
      );

      const allResolvedForProject = (remaining[0]?.count || 0) === 0;

      if (allResolvedForProject) {
        await pool.query(
          `UPDATE research_projects SET status = 'APPROVED', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = 'REVISION_REQUIRED'`,
          [finding.projectId]
        );
      }

      // Notify the researcher
      if (finding.researcherId) {
        try {
          await pool.query(
            `INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
             VALUES (?, 'REVISION_RESOLVED', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))`,
            [
              finding.researcherId,
              `Revision Verified & Resolved · ${finding.projectTitle || "Research Project"}`,
              `Reviewer verified your response to "${finding.title || "finding"}" and marked the revision as resolved.`,
              `/researcher/revisions?projectId=${finding.projectId}`,
            ]
          );
        } catch (notifErr) {
          console.warn("Could not dispatch researcher notification for resolved revision:", notifErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Patch feedback error:", err);
    return NextResponse.json({ error: err.message || "Failed to update finding" }, { status: 500 });
  }
}

