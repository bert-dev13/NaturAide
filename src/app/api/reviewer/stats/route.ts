import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewerId = session.id;

    // 1. Real summary counts for assigned reviews
    const [counts]: any = await pool.query(
      `
      SELECT
        COUNT(CASE WHEN ra.status = 'PENDING' THEN 1 END) as pendingCount,
        COUNT(CASE WHEN ra.status = 'IN_REVIEW' THEN 1 END) as inReviewCount,
        COUNT(CASE WHEN ra.status = 'RESUBMITTED' THEN 1 END) as resubmittedCount,
        COUNT(CASE WHEN ra.status = 'COMPLETED' THEN 1 END) as completedCount,
        COUNT(CASE WHEN ra.status = 'REVISION_REQUIRED' THEN 1 END) as revisionRequiredCount,
        COUNT(*) as totalAssigned
      FROM review_assignments ra
      WHERE ra.reviewerId = ?
      `,
      [reviewerId]
    );

    // 2. Priority Reviews (Pending or Resubmitted, oldest first)
    const [priorityReviews]: any = await pool.query(
      `
      SELECT
        ra.id as assignmentId,
        ra.submissionId,
        ra.projectId,
        ra.status,
        ra.reviewRound,
        ra.assignedAt,
        rp.title as projectTitle,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        u.name as researcherName,
        rs.versionTag
      FROM review_assignments ra
      JOIN research_projects rp ON ra.projectId = rp.id
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN plants p ON rp.plantId = p.id
      JOIN review_submissions rs ON ra.submissionId = rs.id
      WHERE ra.reviewerId = ? AND ra.status IN ('PENDING', 'RESUBMITTED', 'IN_REVIEW')
      ORDER BY FIELD(ra.status, 'RESUBMITTED', 'PENDING', 'IN_REVIEW'), ra.assignedAt ASC
      LIMIT 5
      `,
      [reviewerId]
    );

    // 3. Recently Reviewed
    const [recentlyReviewed]: any = await pool.query(
      `
      SELECT
        ra.id as assignmentId,
        ra.submissionId,
        ra.projectId,
        ra.status,
        ra.reviewRound,
        ra.updatedAt,
        rp.title as projectTitle,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        u.name as researcherName,
        rs.versionTag
      FROM review_assignments ra
      JOIN research_projects rp ON ra.projectId = rp.id
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN plants p ON rp.plantId = p.id
      JOIN review_submissions rs ON ra.submissionId = rs.id
      WHERE ra.reviewerId = ? AND ra.status IN ('IN_REVIEW', 'COMPLETED', 'REVISION_REQUIRED')
      ORDER BY ra.updatedAt DESC
      LIMIT 5
      `,
      [reviewerId]
    );

    // 4. Recent Review Activity Logs
    const [recentActivity]: any = await pool.query(
      `
      SELECT actionType, description, createdAt
      FROM research_activity_logs
      WHERE researcherId = ? OR description LIKE '%Review%'
      ORDER BY createdAt DESC
      LIMIT 6
      `,
      [reviewerId]
    );

    // 5. Reviewer Profile Info
    const [profRows]: any = await pool.query(
      `SELECT specialty, verificationStatus, professionalTitle FROM reviewer_profiles WHERE userId = ? LIMIT 1`,
      [reviewerId]
    );

    return NextResponse.json({
      success: true,
      stats: counts[0] || {
        pendingCount: 0,
        inReviewCount: 0,
        resubmittedCount: 0,
        completedCount: 0,
        revisionRequiredCount: 0,
        totalAssigned: 0,
      },
      priorityReviews,
      recentlyReviewed,
      recentActivity,
      reviewerInfo: profRows[0] || {
        specialty: null,
        verificationStatus: "PENDING_VERIFICATION",
        professionalTitle: null,
      },
    });
  } catch (error) {
    console.error("Reviewer stats GET error:", error);
    return NextResponse.json({ error: "Failed to load reviewer stats" }, { status: 500 });
  }
}
