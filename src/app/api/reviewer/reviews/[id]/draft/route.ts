import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeReviewAreaKey } from "@/lib/expert-review-areas";
import { assertReviewerPermissionForSpecialty } from "@/lib/expert-review-assignment";

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
    const areaKey = normalizeReviewAreaKey(body.areaKey || specialtyNeeded);

    try {
      await assertReviewerPermissionForSpecialty({
        reviewerId: session.id,
        projectId,
        submissionId,
        areaKey,
        requireUnlocked: true,
      });
    } catch (permErr: any) {
      return NextResponse.json(
        { error: permErr.message || "Permission denied" },
        { status: permErr.status || 403 }
      );
    }

    // Save draft in professional_reviews
    await pool.query(
      `
      INSERT INTO professional_reviews (
        assignmentId, submissionId, projectId, reviewerId, areaKey, reviewCycle,
        assessment, comments, checklistData, status, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        assessment = VALUES(assessment),
        comments = VALUES(comments),
        checklistData = COALESCE(VALUES(checklistData), checklistData),
        status = 'DRAFT',
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [
        assignmentId,
        submissionId,
        projectId,
        session.id,
        areaKey,
        reviewRound || 1,
        assessment || null,
        comments?.trim() || null,
        checklistStr,
      ]
    );

    // If findings are provided, sync new or updated findings
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

    return NextResponse.json({
      success: true,
      message: "Draft review saved successfully.",
    });
  } catch (error) {
    console.error("Draft review POST error:", error);
    return NextResponse.json({ error: "Failed to save draft review" }, { status: 500 });
  }
}

