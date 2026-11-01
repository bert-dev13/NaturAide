import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeReviewAreaKey, expertReviewAreaLabel } from "@/lib/expert-review-areas";
import { evaluateOverallApproval } from "@/lib/expert-review-assignment";

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
    const { assessment, comments, findings, checklistData } = body;
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
        { error: "Professional review comments are required (minimum 10 characters)." },
        { status: 400 }
      );
    }

    // Verify assignment and authorization
    const [assignRows]: any = await pool.query(
      `
      SELECT id as assignmentId, submissionId, projectId, specialtyNeeded, reviewRound
      FROM review_assignments
      WHERE (id = ? OR submissionId = ?) AND reviewerId = ?
      LIMIT 1
      `,
      [identifier, identifier, session.id]
    );

    if (assignRows.length === 0) {
      return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 });
    }

    const { assignmentId, submissionId, projectId, specialtyNeeded, reviewRound } = assignRows[0];
    const areaKey = normalizeReviewAreaKey(specialtyNeeded);
    const areaLabel = expertReviewAreaLabel(areaKey);

    // Save or update findings if provided
    if (Array.isArray(findings)) {
      for (const f of findings) {
        if (!f.id && f.comment?.trim()) {
          await pool.query(
            `
            INSERT INTO review_feedback (
              projectId, submissionId, reviewerId, reviewRound,
              sectionName, commentType, severity, reviewerName,
              comment, recommendation, referenceLink, status, affectedStage, areaKey, title
            ) VALUES (?, ?, ?, ?, ?, 'GENERAL_COMMENT', ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?)
            `,
            [
              projectId,
              submissionId,
              session.id,
              reviewRound || 1,
              f.sectionName || "Dossier Section",
              f.severity || "MINOR",
              session.name,
              f.comment.trim(),
              f.recommendation || null,
              f.referenceLink || f.relatedEvidence || null,
              f.affectedStage || "Stage",
              areaKey,
              f.title || f.sectionName || "Review Finding",
            ]
          );
        } else if (f.id) {
          await pool.query(
            `
            UPDATE review_feedback
            SET status = ?,
                severity = ?,
                comment = ?,
                recommendation = ?,
                referenceLink = COALESCE(?, referenceLink),
                sectionName = ?,
                title = ?,
                resolvedAt = CASE WHEN ? = 'RESOLVED' THEN CURRENT_TIMESTAMP(3) ELSE resolvedAt END
            WHERE id = ?
            `,
            [
              f.status || "OPEN",
              f.severity || "MINOR",
              f.comment?.trim() || "",
              f.recommendation || null,
              f.referenceLink || f.relatedEvidence || null,
              f.sectionName || "Dossier Section",
              f.title || f.sectionName || "Review Finding",
              f.status || "OPEN",
              f.id,
            ]
          );
        }
      }
    }

    if (assessment === "REVISION_REQUIRED") {
      // Validate that at least one finding or substantive comment exists
      const [fCount]: any = await pool.query(
        "SELECT COUNT(*) as count FROM review_feedback WHERE submissionId = ? AND areaKey = ?",
        [submissionId, areaKey]
      );
      if ((fCount[0]?.count || 0) === 0 && comments.trim().length < 20) {
        return NextResponse.json(
          { error: "Please add at least one specific finding when requesting revisions." },
          { status: 400 }
        );
      }
    }

    // 1. Record official professional review
    await pool.query(
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

    // 2. Update area status
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

    // Update Stage 3 research status for pharmacology review
    if (areaKey === "pharmacology") {
      if (assessment === "ACCEPTABLE") {
        await pool.query(
          `UPDATE research_project_stages SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND stageKey = 'docking'`,
          [projectId]
        );
        await pool.query(
          `UPDATE research_project_stages SET status = CASE WHEN status = 'NOT_STARTED' THEN 'IN_PROGRESS' ELSE status END, updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND stageKey = 'formulation-safety'`,
          [projectId]
        );
        await pool.query(
          `UPDATE research_projects SET currentStage = CASE WHEN currentStage = 'docking' THEN 'formulation-safety' ELSE currentStage END, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
          [projectId]
        );
      } else {
        await pool.query(
          `UPDATE research_project_stages SET status = 'REVISION_REQUIRED', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND stageKey = 'docking'`,
          [projectId]
        );
        await pool.query(
          `UPDATE research_projects SET status = 'REVISIONS_REQUESTED', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
          [projectId]
        );
      }
    }

    // 3. Log review activity
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

    // 4. Run overall project approval evaluation
    const evaluation = await evaluateOverallApproval(submissionId, projectId);

    return NextResponse.json({
      success: true,
      message: `${areaLabel} review submitted (${assessment === "ACCEPTABLE" ? "Approved" : "Revision Required"}).`,
      areaStatus: newAreaStatus,
      overall: evaluation,
    });
  } catch (error) {
    console.error("Submit review POST error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

