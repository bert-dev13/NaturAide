import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeReviewAreaKey, expertReviewAreaLabel } from "@/lib/expert-review-areas";
import { STAGE_REVIEW_DEFINITIONS } from "@/lib/professional-review-status";

const AREA_STAGE_INFO: Record<
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
  knowledge_integration: {
    stageNumber: 6,
    stageKey: "knowledge-integration",
    stageTitle: "Stage 6 · Knowledge Integration",
    route: "knowledge-integration",
  },
};

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

    const body = await request.json();
    const { roleKey: rawRoleKey, stageNumber: requestedStageNumber, changesSummary } = body;
    const roleKey = normalizeReviewAreaKey(rawRoleKey || "pharmacognosy");
    
    // Resolve stage definition
    let stageNumber = requestedStageNumber;
    if (!stageNumber) {
      stageNumber = AREA_STAGE_INFO[roleKey]?.stageNumber || 1;
    }
    const stageDef = STAGE_REVIEW_DEFINITIONS[stageNumber] || STAGE_REVIEW_DEFINITIONS[1];
    const stageInfo = AREA_STAGE_INFO[roleKey] || {
      stageNumber,
      stageKey: stageDef.stageKey,
      stageTitle: `Stage ${stageNumber} · ${stageDef.discipline} Research`,
      route: stageDef.stageKey,
    };

    // 1. Verify project ownership
    const [projRows]: any = await pool.query(
      `
      SELECT rp.*, COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      LIMIT 1
      `,
      [projectId, session.id]
    );

    if (projRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const project = projRows[0];

    // 2. Find active review assignment for this role
    const [assignRows]: any = await pool.query(
      `
      SELECT ra.*, u.name as reviewerName
      FROM review_assignments ra
      LEFT JOIN users u ON ra.reviewerId = u.id
      WHERE ra.projectId = ? AND (ra.specialtyNeeded = ? OR ra.specialtyNeeded = 'EXPERT_REVIEW')
      ORDER BY ra.id DESC
      LIMIT 1
      `,
      [projectId, roleKey]
    );

    let reviewerName = null;
    let reviewCycle = 1;
    let assignment = assignRows[0] || null;

    if (assignment) {
      reviewerName = assignment.reviewerName;
      // 3. Mark assignment as RESUBMITTED
      await pool.query(
        `UPDATE review_assignments SET status = 'RESUBMITTED', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [assignment.id]
      );

      // 4. Update area coverage status
      if (assignment.submissionId) {
        await pool.query(
          `UPDATE review_area_coverage SET status = 'RESUBMITTED', updatedAt = CURRENT_TIMESTAMP(3) WHERE submissionId = ? AND areaKey = ?`,
          [assignment.submissionId, roleKey]
        );

        // Mark open findings as ADDRESSED with researcher reply
        const summaryText = (changesSummary || "Revisions completed and submitted by researcher.").trim();
        await pool.query(
          `
          UPDATE review_feedback
          SET status = 'ADDRESSED',
              researcherReply = ?,
              researcherRepliedAt = CURRENT_TIMESTAMP(3),
              responseAction = 'CHANGE_MADE'
          WHERE submissionId = ? AND areaKey = ? AND status = 'OPEN'
          `,
          [summaryText, assignment.submissionId, roleKey]
        );
      }
    }

    // 5. Update professional_reviews table assessment to REVISION_RESUBMITTED
    const [revRows]: any = await pool.query(
      `
      SELECT pr.*, u.name as reviewerName
      FROM professional_reviews pr
      LEFT JOIN users u ON pr.reviewerId = u.id
      WHERE pr.projectId = ? AND pr.areaKey = ?
      ORDER BY pr.id DESC
      LIMIT 1
      `,
      [projectId, roleKey]
    );

    if (revRows.length > 0) {
      const rev = revRows[0];
      if (!reviewerName && rev.reviewerName) {
        reviewerName = rev.reviewerName;
      }
      reviewCycle = rev.reviewCycle || 1;
      await pool.query(
        `UPDATE professional_reviews SET assessment = 'REVISION_RESUBMITTED', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [rev.id]
      );
    } else {
      // If no professional_review record exists yet, insert one
      await pool.query(
        `
        INSERT INTO professional_reviews (assignmentId, submissionId, projectId, reviewerId, areaKey, reviewCycle, assessment, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 1, 'REVISION_RESUBMITTED', 'DRAFT', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        `,
        [assignment?.id || null, assignment?.submissionId || null, projectId, assignment?.reviewerId || null, roleKey]
      );
    }

    // 6. Update researcher stages and project status
    await pool.query(
      `UPDATE research_project_stages SET status = 'IN_PROGRESS', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND stageKey = ?`,
      [projectId, stageInfo.stageKey]
    );

    await pool.query(
      `UPDATE research_projects SET status = 'IN_PROGRESS', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [projectId]
    );

    // 7. Mark researcher's revision requested notifications as read
    try {
      await pool.query(
        `
        UPDATE review_notifications
        SET isRead = 1
        WHERE userId = ? AND (type = 'REVISION_REQUESTED' OR type = 'REVISION_REQUIRED') AND link LIKE ?
        `,
        [session.id, `%projectId=${projectId}%`]
      );
    } catch (e) {
      // Non-fatal
    }

    // 8. Notify assigned reviewer
    const reviewerId = assignment?.reviewerId || revRows[0]?.reviewerId;
    if (reviewerId) {
      const areaLabel = expertReviewAreaLabel(roleKey);
      await pool.query(
        `
        INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
        VALUES (?, 'RESEARCH_RESUBMITTED', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))
        `,
        [
          reviewerId,
          `Revision Resubmitted · ${stageInfo.stageTitle}`,
          `${project.plantName}: ${areaLabel} corrections have been resubmitted for scientific verification.`,
          `/reviewer/checking/${roleKey}?projectId=${projectId}${assignment?.id ? `&assignmentId=${assignment.id}` : ""}`,
        ]
      );
    }

    // 9. Log activity
    await pool.query(
      `
      INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
      VALUES (?, ?, ?, 'RESEARCHER', 'REVISION_SUBMITTED', ?)
      `,
      [
        projectId,
        assignment?.submissionId || null,
        session.id,
        `Researcher submitted revisions for ${expertReviewAreaLabel(roleKey)}.`,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Revisions successfully resubmitted to professional reviewer.",
      status: "REVISION_RESUBMITTED",
      reviewStatus: "REVISION_RESUBMITTED",
      discipline: stageDef.discipline,
      profession: stageDef.profession,
      stageNumber,
      stageTitle: stageInfo.stageTitle,
      reviewerName: reviewerName || "Professional Reviewer",
      reviewCycle,
    });
  } catch (error) {
    console.error("Resubmit revision error:", error);
    return NextResponse.json({ error: "Failed to resubmit revision" }, { status: 500 });
  }
}
