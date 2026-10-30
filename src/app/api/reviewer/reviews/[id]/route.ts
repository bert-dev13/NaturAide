import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  getAreaDefinition,
  expertReviewAreaLabel,
} from "@/lib/expert-review-areas";
import { buildFullDossierSnapshot } from "@/lib/expert-review-assignment";

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
    const identifier = parseInt(id, 10);
    if (isNaN(identifier)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const requestedArea = searchParams.get("area");

    // 1. Fetch assignment with strict authorization: ra.reviewerId = session.id
    const [assignmentRows]: any = await pool.query(
      `
      SELECT
        ra.id as assignmentId,
        ra.submissionId,
        ra.projectId,
        ra.status as assignmentStatus,
        ra.specialtyNeeded,
        ra.reviewRound,
        ra.assignedAt,
        ra.startedAt,
        ra.completedAt,
        rp.title as projectTitle,
        rp.shortDescription,
        rp.researchObjective,
        rp.areaOfInterest,
        rp.researchQuestion,
        rp.expectedOutcome,
        rp.currentStage,
        rp.status as projectStatus,
        rp.progressPercent,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        p.category as plantCategory,
        u.id as researcherId,
        u.name as researcherName,
        u.email as researcherEmail,
        up.institution as researcherInstitution,
        up.department as researcherDepartment,
        rs.id as subId,
        rs.versionTag,
        rs.submittedAt,
        rs.messageToReviewers,
        rs.snapshotData,
        rs.previousSubmissionId
      FROM review_assignments ra
      JOIN research_projects rp ON ra.projectId = rp.id
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN user_profiles up ON u.id = up.userId
      LEFT JOIN plants p ON rp.plantId = p.id
      JOIN review_submissions rs ON ra.submissionId = rs.id
      WHERE (ra.id = ? OR (ra.submissionId = ? AND (? IS NULL OR ra.specialtyNeeded = ?)))
        AND ra.reviewerId = ?
      ORDER BY ra.id DESC
      LIMIT 1
      `,
      [identifier, identifier, requestedArea, requestedArea ? normalizeReviewAreaKey(requestedArea) : null, session.id]
    );

    if (assignmentRows.length === 0) {
      return NextResponse.json(
        { error: "Review assignment not found or access denied." },
        { status: 404 }
      );
    }

    const assignment = assignmentRows[0];
    const projectId = assignment.projectId;
    const submissionId = assignment.submissionId;
    const reviewArea = normalizeReviewAreaKey(assignment.specialtyNeeded);
    const areaDef = getAreaDefinition(reviewArea);

    // 2. Transition PENDING -> IN_REVIEW automatically upon opening
    if (assignment.assignmentStatus === "PENDING") {
      await pool.query(
        `UPDATE review_assignments SET status = 'IN_REVIEW', startedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [assignment.assignmentId]
      );
      await pool.query(
        `UPDATE review_area_coverage SET status = 'IN_REVIEW', updatedAt = CURRENT_TIMESTAMP(3) WHERE submissionId = ? AND areaKey = ?`,
        [submissionId, reviewArea]
      );
      assignment.assignmentStatus = "IN_REVIEW";
    }

    // 3. Load or build exact versioned dossier snapshot
    let snapshot: any = null;
    if (assignment.snapshotData) {
      try {
        snapshot = typeof assignment.snapshotData === "string" ? JSON.parse(assignment.snapshotData) : assignment.snapshotData;
      } catch (e) {
        console.error("Error parsing snapshotData:", e);
      }
    }

    // Ensure snapshot contains full stages arrays (compounds, docking, etc.)
    if (!snapshot || !snapshot.literature || !snapshot.compounds || !snapshot.dockingRuns) {
      const fullSnapshot = await buildFullDossierSnapshot(projectId);
      snapshot = { ...fullSnapshot, ...snapshot };
      await pool.query(
        "UPDATE review_submissions SET snapshotData = ? WHERE id = ?",
        [JSON.stringify(snapshot), submissionId]
      );
    }

    // 4. Fetch current draft / submitted review for this area
    const [reviewRows]: any = await pool.query(
      `SELECT * FROM professional_reviews WHERE submissionId = ? AND reviewerId = ? AND areaKey = ? LIMIT 1`,
      [submissionId, session.id, reviewArea]
    );
    const professionalReview = reviewRows[0] || null;

    // 5. Fetch findings for this area and submission
    const [findings]: any = await pool.query(
      `
      SELECT rf.*, u.name as reviewerDisplayName
      FROM review_feedback rf
      LEFT JOIN users u ON rf.reviewerId = u.id
      WHERE rf.submissionId = ?
        AND (rf.areaKey = ? OR (rf.areaKey IS NULL AND rf.reviewerId = ?))
      ORDER BY
        CASE rf.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'MAJOR' THEN 2
          WHEN 'MINOR' THEN 3
          ELSE 4
        END ASC,
        rf.id ASC
      `,
      [submissionId, reviewArea, session.id]
    );

    // 6. Fetch review cycles / rounds for this project
    const [reviewRounds]: any = await pool.query(
      `
      SELECT
        rs.id,
        rs.versionTag,
        rs.reviewRound,
        rs.status,
        rs.submittedAt,
        rs.reviewedAt,
        rs.messageToReviewers
      FROM review_submissions rs
      WHERE rs.projectId = ?
      ORDER BY rs.reviewRound ASC, rs.id ASC
      `,
      [projectId]
    );

    // 7. Fetch all 5 coverage areas for status display
    const [coverageRows]: any = await pool.query(
      `
      SELECT rac.areaKey, rac.status, rac.reviewerId, u.name as reviewerName
      FROM review_area_coverage rac
      LEFT JOIN users u ON rac.reviewerId = u.id
      WHERE rac.submissionId = ?
      `,
      [submissionId]
    );

    const coverageMap: Record<string, any> = {};
    for (const c of coverageRows) {
      coverageMap[normalizeReviewAreaKey(c.areaKey)] = c;
    }

    const allAreaStatuses = EXPERT_REVIEW_AREAS.map((a) => {
      const cov = coverageMap[a.key];
      return {
        key: a.key,
        label: a.shortLabel,
        order: a.order,
        status: cov?.status || "PENDING",
        isAssignedToMe: cov?.reviewerId === session.id,
      };
    });

    return NextResponse.json({
      success: true,
      assignment: {
        ...assignment,
        reviewArea,
        reviewAreaLabel: areaDef.shortLabel,
        reviewCycle: assignment.reviewRound || 1,
      },
      areaDefinition: areaDef,
      snapshot,
      review: professionalReview,
      findings: findings || [],
      reviewRounds: reviewRounds || [],
      allAreaStatuses,
    });
  } catch (error) {
    console.error("GET /api/reviewer/reviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to load review workspace" }, { status: 500 });
  }
}
