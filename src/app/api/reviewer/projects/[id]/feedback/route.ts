import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeReviewAreaKey, expertReviewAreaLabel } from "@/lib/expert-review-areas";
import { revisionDeepLinks } from "@/lib/revision-notification-links";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "REVIEWER" && session.role !== "RESEARCHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      feedback: rows || [],
    });
  } catch (error: any) {
    console.error("GET /api/reviewer/projects/[id]/feedback error:", error);
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
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      comment,
      recommendation,
      areaKey: rawAreaKey = "formulation",
      sectionName = "General Project Review",
      commentType = "REQUIRED_REVISION",
      severity = "MAJOR",
      submissionId: providedSubmissionId,
    } = body;

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json(
        { error: "Review comment or revision description is required." },
        { status: 400 }
      );
    }

    const areaKey = normalizeReviewAreaKey(rawAreaKey);
    const cleanTitle = (title || `${expertReviewAreaLabel(areaKey)} Review Finding`).trim();
    const cleanComment = comment.trim();
    const cleanRecommendation =
      recommendation && typeof recommendation === "string" && recommendation.trim() && recommendation.trim() !== cleanComment
        ? recommendation.trim()
        : null;

    // Resolve submissionId
    let submissionId = providedSubmissionId ? Number(providedSubmissionId) : null;
    let reviewRound = 1;
    if (!submissionId) {
      const [latestSub]: any = await pool.query(
        `SELECT id, reviewRound FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC LIMIT 1`,
        [projectId]
      );
      if (latestSub && latestSub.length > 0) {
        submissionId = Number(latestSub[0].id);
        reviewRound = Number(latestSub[0].reviewRound || 1);
      }
    }

    // Insert into review_feedback
    const [insertRes]: any = await pool.query(
      `INSERT INTO review_feedback (
        projectId, submissionId, reviewerId, reviewRound,
        areaKey, sectionName, title, commentType, severity,
        reviewerName, comment, recommendation, status, affectedStage,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
      [
        projectId,
        submissionId,
        session.id,
        reviewRound,
        areaKey,
        sectionName,
        cleanTitle,
        commentType,
        severity,
        session.name || "Scientific Reviewer",
        cleanComment,
        cleanRecommendation,
        areaKey,
      ]
    );

    const feedbackId = insertRes.insertId;

    // Retrieve project & researcher info for notification
    try {
      const [projRows]: any = await pool.query(
        `SELECT rp.title, rp.researcherId, rp.plantCustomName,
                COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName
         FROM research_projects rp
         LEFT JOIN plants p ON rp.plantId = p.id
         WHERE rp.id = ?`,
        [projectId]
      );

      if (projRows && projRows.length > 0) {
        const proj = projRows[0];
        const researcherId = proj.researcherId;

        if (researcherId && researcherId !== session.id) {
          const { researcherLink } = revisionDeepLinks(sectionName, projectId);
          await pool.query(
            `INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
             VALUES (?, 'REVISION_REQUIRED', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))`,
            [
              researcherId,
              `New Review Feedback · ${sectionName}`,
              `Reviewer noted: "${cleanTitle}". ${cleanComment.slice(0, 140)}${cleanComment.length > 140 ? "..." : ""}`,
              researcherLink,
            ]
          );

          // Update research_projects status so that it visibly reflects REVISION_REQUIRED
          if (severity === "CRITICAL" || severity === "MAJOR" || commentType === "REQUIRED_REVISION") {
            await pool.query(
              `UPDATE research_projects 
               SET status = 'REVISION_REQUIRED', updatedAt = CURRENT_TIMESTAMP(3) 
               WHERE id = ?`,
              [projectId]
            );
          }
        }
      }
    } catch (notifErr) {
      console.warn("Could not dispatch researcher notification for feedback:", notifErr);
    }

    // Activity Log
    try {
      await pool.query(
        `INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
         VALUES (?, ?, ?, 'REVIEWER', 'FEEDBACK_ADDED', ?)`,
        [
          projectId,
          submissionId,
          session.id,
          `Reviewer submitted consolidated feedback: "${cleanTitle}" for ${sectionName}.`,
        ]
      );
    } catch (logErr) {
      console.warn("Could not insert review_activity_log:", logErr);
    }

    return NextResponse.json({
      success: true,
      feedbackId,
      message: "Consolidated revision feedback recorded successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/reviewer/projects/[id]/feedback error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
