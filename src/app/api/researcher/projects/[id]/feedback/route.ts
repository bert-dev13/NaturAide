import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Verify project belongs to researcher if researcher role
    if (session.role === "RESEARCHER") {
      const [projRows]: any = await pool.query(
        `SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1`,
        [projectId, session.id]
      );
      if (!projRows || projRows.length === 0) {
        return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
      }
    }

    const [rows]: any = await pool.query(
      `SELECT rf.*, 
              u.name as reviewerDisplayName,
              u.role as reviewerRole
       FROM review_feedback rf
       LEFT JOIN users u ON rf.reviewerId = u.id
       WHERE rf.projectId = ?
       ORDER BY 
         CASE WHEN rf.status = 'OPEN' THEN 1
              WHEN rf.status = 'ADDRESSED' THEN 2
              ELSE 3 END,
         rf.id DESC`,
      [projectId]
    );

    const feedback = rows || [];
    const openCount = feedback.filter((f: any) => f.status === "OPEN").length;
    const addressedCount = feedback.filter((f: any) => f.status === "ADDRESSED").length;
    const resolvedCount = feedback.filter((f: any) => f.status === "RESOLVED").length;

    return NextResponse.json({
      success: true,
      feedback,
      summary: {
        total: feedback.length,
        open: openCount,
        addressed: addressedCount,
        resolved: resolvedCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/researcher/projects/[id]/feedback error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load project feedback" },
      { status: 500 }
    );
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

    // Verify project ownership
    const [projRows]: any = await pool.query(
      `SELECT rp.id, rp.title, rp.researcherId
       FROM research_projects rp
       WHERE rp.id = ? AND rp.researcherId = ?
       LIMIT 1`,
      [projectId, session.id]
    );

    if (!projRows || projRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    const project = projRows[0];

    const body = await request.json();
    const { feedbackId, researcherReply } = body;

    if (!feedbackId) {
      return NextResponse.json({ error: "Missing feedbackId" }, { status: 400 });
    }

    const replyText = (researcherReply || "").trim();
    if (!replyText) {
      return NextResponse.json(
        { error: "Please enter your response or revision notes." },
        { status: 400 }
      );
    }

    // Fetch existing feedback row to notify the reviewer
    const [existingRows]: any = await pool.query(
      `SELECT * FROM review_feedback WHERE id = ? AND projectId = ? LIMIT 1`,
      [feedbackId, projectId]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: "Feedback item not found." }, { status: 404 });
    }
    const item = existingRows[0];

    // Update feedback item
    await pool.query(
      `UPDATE review_feedback
       SET researcherReply = ?,
           researcherRepliedAt = CURRENT_TIMESTAMP(3),
           status = 'ADDRESSED',
           updatedAt = CURRENT_TIMESTAMP(3)
       WHERE id = ? AND projectId = ?`,
      [replyText, feedbackId, projectId]
    );

    // Notify assigned or relevant reviewer(s)
    let targetReviewerIds: number[] = [];
    if (item.reviewerId) {
      targetReviewerIds.push(Number(item.reviewerId));
    }
    // Also include any assigned reviewers for this project
    const [assignedReviewers]: any = await pool.query(
      `SELECT DISTINCT reviewerId FROM review_assignments WHERE projectId = ? AND reviewerId IS NOT NULL`,
      [projectId]
    );
    for (const ar of assignedReviewers || []) {
      if (ar.reviewerId && !targetReviewerIds.includes(Number(ar.reviewerId))) {
        targetReviewerIds.push(Number(ar.reviewerId));
      }
    }
    // If still no reviewer found, notify all reviewers
    if (targetReviewerIds.length === 0) {
      const [allReviewers]: any = await pool.query(
        `SELECT id FROM users WHERE role = 'REVIEWER'`
      );
      for (const r of allReviewers || []) {
        targetReviewerIds.push(Number(r.id));
      }
    }

    for (const revId of targetReviewerIds) {
      try {
        await pool.query(
          `INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
           VALUES (?, 'REVISION_ADDRESSED', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))`,
          [
            revId,
            `Revision Resubmitted · ${project.title || "Project"}`,
            `Researcher responded to "${item.title || "Review finding"}": "${replyText.slice(0, 120)}${replyText.length > 120 ? "..." : ""}"`,
            `/reviewer/revisions?projectId=${projectId}`,
          ]
        );
      } catch (notifErr) {
        console.warn("Could not notify reviewer of addressed revision:", notifErr);
      }
    }

    // Log Activity
    try {
      await pool.query(
        `INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
         VALUES (?, ?, ?, 'RESEARCHER', 'REVISION_ADDRESSED', ?)`,
        [
          projectId,
          item.submissionId || null,
          session.id,
          `Researcher addressed revision "${item.title || "finding"}" with implementation note.`,
        ]
      );
    } catch (logErr) {
      console.warn("Could not insert review_activity_log:", logErr);
    }

    return NextResponse.json({
      success: true,
      message: "Revision note saved and reviewer notified.",
    });
  } catch (error: any) {
    console.error("POST /api/researcher/projects/[id]/feedback error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update feedback" },
      { status: 500 }
    );
  }
}

