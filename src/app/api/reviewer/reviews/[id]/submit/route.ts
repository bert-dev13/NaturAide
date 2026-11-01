import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeReviewAreaKey, expertReviewAreaLabel } from "@/lib/expert-review-areas";
import { evaluateOverallApproval } from "@/lib/expert-review-assignment";

const AREA_STAGE_MAPPING: Record<
  string,
  {
    stageNumber: number;
    stageKey: string;
    stageTitle: string;
    route: string;
  }
> = {
  pharmacognosy: {
    stageNumber: 1,
    stageKey: "plant-literature",
    stageTitle: "Stage 1 · Plant & Literature Research",
    route: "plant-literature",
  },
  bioinformatics: {
    stageNumber: 2,
    stageKey: "in-silico",
    stageTitle: "Stage 2 · In-Silico Analysis",
    route: "in-silico",
  },
  pharmacology: {
    stageNumber: 3,
    stageKey: "docking",
    stageTitle: "Stage 3 · Molecular Docking",
    route: "docking",
  },
  formulation: {
    stageNumber: 4,
    stageKey: "formulation-safety",
    stageTitle: "Stage 4 · Formulation Development",
    route: "formulation-safety",
  },
  clinical_safety: {
    stageNumber: 5,
    stageKey: "safety",
    stageTitle: "Stage 5 · Safety / Clinical",
    route: "safety",
  },
};

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
    const identifier = parseInt(id, 10);
    if (isNaN(identifier)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const body = await request.json();
    const { assessment, comments, recommendations, findings, checklistData } = body;
    const checklistStr = checklistData
      ? typeof checklistData === "string"
        ? checklistData
        : JSON.stringify(checklistData)
      : null;

    if (!assessment || (assessment !== "ACCEPTABLE" && assessment !== "REVISION_REQUIRED")) {
      return NextResponse.json(
        { error: "Assessment selection ('Acceptable' or 'Revision Required') is required." },
        { status: 400 }
      );
    }

    if (!comments || comments.trim().length < 10) {
      return NextResponse.json(
        { error: "Overall professional review assessment is required (minimum 10 characters)." },
        { status: 400 }
      );
    }

    // Verify assignment and authorization
    const [assignRows]: any = await pool.query(
      `
      SELECT ra.id as assignmentId, ra.submissionId, ra.projectId, ra.specialtyNeeded, ra.reviewRound,
             rp.researcherId, rp.title as projectTitle, rp.currentStage,
             COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName
      FROM review_assignments ra
      JOIN research_projects rp ON ra.projectId = rp.id
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE (ra.id = ? OR ra.submissionId = ?) AND ra.reviewerId = ?
      LIMIT 1
      `,
      [identifier, identifier, session.id]
    );

    if (assignRows.length === 0) {
      return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 });
    }

    const {
      assignmentId,
      submissionId,
      projectId,
      specialtyNeeded,
      reviewRound,
      researcherId,
      plantName,
      currentStage,
    } = assignRows[0];

    const areaKey = normalizeReviewAreaKey(specialtyNeeded);
    const areaLabel = expertReviewAreaLabel(areaKey);

    // Stage route determination
    let stageInfo = AREA_STAGE_MAPPING[areaKey] || {
      stageNumber: 1,
      stageKey: "plant-literature",
      stageTitle: "Stage 1 · Plant & Literature Research",
      route: "plant-literature",
    };

    // If project is at Stage 6, map pharmacognosy review to Stage 6
    if (currentStage === "knowledge-integration" || currentStage === "completion-integration") {
      stageInfo = {
        stageNumber: 6,
        stageKey: "completion-integration",
        stageTitle: "Stage 6 · Knowledge Integration",
        route: "knowledge-integration",
      };
    }

    // 1. Record official consolidated professional review
    const [insRes]: any = await pool.query(
      `
      INSERT INTO professional_reviews (
        assignmentId, submissionId, projectId, reviewerId, areaKey, reviewCycle,
        assessment, comments, checklistData, status, submittedAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        assessment = VALUES(assessment),
        comments = VALUES(comments),
        checklistData = COALESCE(VALUES(checklistData), checklistData),
        status = 'SUBMITTED',
        submittedAt = CURRENT_TIMESTAMP(3),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [
        assignmentId,
        submissionId,
        projectId,
        session.id,
        areaKey,
        reviewRound || 1,
        assessment,
        comments.trim(),
        checklistStr,
      ]
    );

    const reviewId = insRes?.insertId || null;

    // 2. Persist recommendations & corrections
    const itemsToSave = Array.isArray(recommendations)
      ? recommendations
      : Array.isArray(findings)
      ? findings
      : [];

    if (assessment === "REVISION_REQUIRED" && itemsToSave.length === 0 && comments.trim().length < 20) {
      return NextResponse.json(
        { error: "Please add at least one specific recommendation or correction when requesting revisions." },
        { status: 400 }
      );
    }

    const isApproval = assessment === "ACCEPTABLE";
    const feedbackStatus = isApproval ? "RESOLVED" : "OPEN";
    const feedbackResolvedAt = isApproval ? new Date() : null;

    // Deduplicate incoming recommendations in-memory
    const uniqueItems: any[] = [];
    const seenSigs = new Set<string>();

    for (const item of itemsToSave) {
      const recComment = (item.comment || "").trim();
      if (!recComment) continue;

      const sectionName = item.section || item.sectionName || "Stage Section";
      const fieldName = item.field || item.title || sectionName;
      const sig = item.id
        ? `id:${item.id}`
        : `text:${sectionName}|${fieldName}|${recComment}`.toLowerCase();

      if (seenSigs.has(sig)) continue;
      seenSigs.add(sig);
      uniqueItems.push(item);
    }

    for (const item of uniqueItems) {
      const recComment = (item.comment || "").trim();
      if (!recComment) continue;

      const recType = item.type || item.commentType || "Correction";
      let commentType = "CORRECTION_SUGGESTED";
      let severity = "MAJOR";

      if (recType === "Recommendation" || recType === "GENERAL_COMMENT") {
        commentType = "GENERAL_COMMENT";
        severity = "MINOR";
      } else if (recType === "Scientific Concern" || recType === "SAFETY_CONCERN") {
        commentType = "SAFETY_CONCERN";
        severity = "CRITICAL";
      } else if (recType === "Clarification" || recType === "CLARIFICATION_NEEDED") {
        commentType = "CLARIFICATION_NEEDED";
        severity = "INFORMATIONAL";
      }

      const sectionName = item.section || item.sectionName || "Stage Section";
      const fieldName = item.field || item.title || sectionName;

      let feedbackId = item.id ? parseInt(String(item.id), 10) : null;
      if (!feedbackId || isNaN(feedbackId)) {
        // Idempotency: check if an existing open feedback with identical comment & section exists
        const [existing]: any = await pool.query(
          `SELECT id FROM review_feedback 
           WHERE projectId = ? AND submissionId = ? AND areaKey = ? 
             AND sectionName = ? AND comment = ? 
             AND status IN ('OPEN', 'IN_REVIEW')
           LIMIT 1`,
          [projectId, submissionId, areaKey, sectionName, recComment]
        );
        if (existing.length > 0) {
          feedbackId = existing[0].id;
        }
      }

      if (feedbackId) {
        await pool.query(
          `
          UPDATE review_feedback
          SET reviewId = COALESCE(?, reviewId),
              sectionName = ?,
              title = ?,
              commentType = ?,
              severity = ?,
              comment = ?,
              recommendation = ?,
              status = ?,
              resolvedAt = ?,
              updatedAt = CURRENT_TIMESTAMP(3)
          WHERE id = ?
          `,
          [
            reviewId,
            sectionName,
            fieldName,
            commentType,
            severity,
            recComment,
            item.recommendation || null,
            feedbackStatus,
            feedbackResolvedAt,
            feedbackId,
          ]
        );
      } else {
        await pool.query(
          `
          INSERT INTO review_feedback (
            projectId, submissionId, reviewerId, reviewRound, reviewId,
            sectionName, title, commentType, severity, reviewerName,
            comment, recommendation, referenceLink, status, resolvedAt, affectedStage, areaKey
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            projectId,
            submissionId,
            session.id,
            reviewRound || 1,
            reviewId,
            sectionName,
            fieldName,
            commentType,
            severity,
            session.name,
            recComment,
            item.recommendation || null,
            item.referenceLink || null,
            feedbackStatus,
            feedbackResolvedAt,
            stageInfo.stageTitle,
            areaKey,
          ]
        );
      }
    }

    // When approving, mark any previously open feedback for this project and area as RESOLVED
    if (isApproval) {
      await pool.query(
        `UPDATE review_feedback
         SET status = 'RESOLVED', resolvedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
         WHERE projectId = ? AND areaKey = ? AND status IN ('OPEN', 'IN_REVIEW')`,
        [projectId, areaKey]
      );
    }

    // 3. Update area and assignment status
    const newAreaStatus = assessment === "ACCEPTABLE" ? "APPROVED" : "REVISION_REQUIRED";
    const newAssignmentStatus = assessment === "ACCEPTABLE" ? "COMPLETED" : "REVISION_REQUIRED";

    await pool.query(
      `UPDATE review_assignments SET status = ?, completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [newAssignmentStatus, assignmentId]
    );

    await pool.query(
      `UPDATE review_area_coverage SET status = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE submissionId = ? AND areaKey = ?`,
      [newAreaStatus, submissionId, areaKey]
    );

    await pool.query(
      `UPDATE review_section_status SET status = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE submissionId = ? AND sectionKey = ?`,
      [assessment === "ACCEPTABLE" ? "REVIEWED" : "NEEDS_ATTENTION", submissionId, areaKey]
    );

    // 4. Update research stages and projects
    if (assessment === "REVISION_REQUIRED") {
      await pool.query(
        `UPDATE research_project_stages SET status = 'REVISION_REQUIRED', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND stageKey = ?`,
        [projectId, stageInfo.stageKey]
      );
      await pool.query(
        `UPDATE research_projects SET status = 'REVISIONS_REQUESTED', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [projectId]
      );

      // Persist notification for researcher (idempotent within 5 minutes)
      if (researcherId) {
        const count = itemsToSave.length || 1;
        const title = `Revision Requested · ${stageInfo.stageTitle}`;
        const [existingNotif]: any = await pool.query(
          `SELECT id FROM review_notifications WHERE userId = ? AND type = 'REVISION_REQUESTED' AND title = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) LIMIT 1`,
          [researcherId, title]
        );
        if (existingNotif.length === 0) {
          await pool.query(
            `
            INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
            VALUES (?, 'REVISION_REQUESTED', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))
            `,
            [
              researcherId,
              title,
              `${areaLabel} Review: Your professional reviewer requested revisions. ${count} recommendation${count > 1 ? "s" : ""} require attention.`,
              `/researcher/projects/${projectId}/revisions`,
            ]
          );
        }
      }
    } else {
      // Stage Approved
      await pool.query(
        `UPDATE research_project_stages SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND stageKey = ?`,
        [projectId, stageInfo.stageKey]
      );

      // Persist notification for researcher (idempotent within 5 minutes)
      if (researcherId) {
        const title = `Professional Review Approved · ${stageInfo.stageTitle}`;
        const [existingNotif]: any = await pool.query(
          `SELECT id FROM review_notifications WHERE userId = ? AND type = 'ACCEPTED_FOR_NEXT_STAGE' AND title = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) LIMIT 1`,
          [researcherId, title]
        );
        if (existingNotif.length === 0) {
          await pool.query(
            `
            INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
            VALUES (?, 'ACCEPTED_FOR_NEXT_STAGE', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))
            `,
            [
              researcherId,
              title,
              `Your ${stageInfo.stageTitle} professional review (${areaLabel}) has been approved.`,
              `/researcher/projects/${projectId}/${stageInfo.route}`,
            ]
          );
        }
      }
    }

    // 5. Log review activity
    await pool.query(
      `
      INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
      VALUES (?, ?, ?, 'REVIEWER', ?, ?)
      `,
      [
        projectId,
        submissionId,
        session.id,
        assessment === "ACCEPTABLE" ? "AREA_APPROVED" : "REVISION_REQUESTED",
        `Professional review completed for ${areaLabel}: ${assessment === "ACCEPTABLE" ? "Approved" : "Revision Required"}`,
      ]
    );

    // 6. Run overall project approval evaluation
    const evaluation = await evaluateOverallApproval(submissionId, projectId);

    return NextResponse.json({
      success: true,
      message: `${areaLabel} review submitted (${assessment === "ACCEPTABLE" ? "Approved" : "Revision Required"}).`,
      status: assessment === "ACCEPTABLE" ? "APPROVED" : "REVISION_REQUIRED",
      areaStatus: newAreaStatus,
      assignmentStatus: newAssignmentStatus,
      overall: evaluation,
    });
  } catch (error) {
    console.error("Submit review POST error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
