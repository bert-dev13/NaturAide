import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { resolveSingleStageStatus } from "@/lib/professional-review-status";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewerId = session.id;

    // 1. Reviewer Profile & Credentials
    const [userRows]: any = await pool.query(
      `
      SELECT
        u.id, u.name, u.email, u.role,
        rp.specialty, rp.professionalTitle, rp.institution, rp.licenseNumber,
        rp.verificationStatus, rp.areasOfExpertise
      FROM users u
      LEFT JOIN reviewer_profiles rp ON u.id = rp.userId
      WHERE u.id = ?
      LIMIT 1
      `,
      [reviewerId]
    );

    const reviewerUser = userRows[0] || {
      id: reviewerId,
      name: session.name,
      email: session.email,
      role: "REVIEWER",
      specialty: "Pharmacognosy",
      professionalTitle: "Scientific Reviewer",
      institution: "NatureAide Review Board",
      verificationStatus: "VERIFIED",
    };

    const [assignedAreasRows]: any = await pool.query(
      `SELECT areaKey FROM professional_review_areas WHERE userId = ? ORDER BY id ASC`,
      [reviewerId]
    );
    const assignedAreas = assignedAreasRows.map((r: any) => r.areaKey);

    // 2. Global Review Platform KPI Counts
    const [projectCounts]: any = await pool.query(
      `
      SELECT
        COUNT(CASE WHEN status != 'ARCHIVED' THEN 1 END) as totalProjects,
        COUNT(CASE WHEN status IN ('UNDER_REVIEW', 'READY_FOR_REVIEW') THEN 1 END) as reviewReadyCount,
        COUNT(CASE WHEN status = 'REVISION_REQUIRED' THEN 1 END) as revisionCount,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completedCount,
        COUNT(CASE WHEN status IN ('IN_PROGRESS', 'DRAFT') THEN 1 END) as inProgressCount
      FROM research_projects
      `
    );
    const pCounts = projectCounts[0] || {};

    // Reviewer Specific Assignment Counts
    const [assignCounts]: any = await pool.query(
      `
      SELECT
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as myPendingCount,
        COUNT(CASE WHEN status = 'IN_REVIEW' THEN 1 END) as myInReviewCount,
        COUNT(CASE WHEN status = 'RESUBMITTED' THEN 1 END) as myResubmittedCount,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as myCompletedCount,
        COUNT(CASE WHEN status = 'REVISION_REQUIRED' THEN 1 END) as myRevisionCount,
        COUNT(*) as myTotalAssigned
      FROM review_assignments
      WHERE reviewerId = ?
      `,
      [reviewerId]
    );
    const aCounts = assignCounts[0] || {};

    // 3. Recent Review Activities (Audits, decisions, submissions)
    const [recentReviews]: any = await pool.query(
      `
      SELECT
        pr.id, pr.projectId, pr.areaKey, pr.status, pr.comments, pr.submittedAt,
        rp.title as projectTitle,
        COALESCE(p.commonName, rp.plantCustomName, 'Plant') as plantName,
        u.name as reviewerName
      FROM professional_reviews pr
      JOIN research_projects rp ON pr.projectId = rp.id
      LEFT JOIN plants p ON rp.plantId = p.id
      LEFT JOIN users u ON pr.reviewerId = u.id
      ORDER BY pr.submittedAt DESC, pr.id DESC
      LIMIT 8
      `
    );

    // 4. Fetch Active Research Projects with stage and review metadata
    const [projects]: any = await pool.query(
      `
      SELECT
        rp.id as projectId,
        rp.title,
        rp.shortDescription,
        rp.status as rawStatus,
        rp.currentStage,
        rp.progressPercent,
        rp.updatedAt,
        rp.createdAt,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        u.name as researcherName,
        u.email as researcherEmail,
        (SELECT COUNT(*) FROM research_project_stages rps WHERE rps.projectId = rp.id AND rps.status = 'COMPLETED') as completedStagesCount
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      LEFT JOIN users u ON rp.researcherId = u.id
      WHERE rp.status != 'ARCHIVED'
      ORDER BY rp.updatedAt DESC, rp.id DESC
      LIMIT 25
      `
    );

    // Map projects with 5 canonical discipline reviews
    const projectIds = projects.map((p: any) => p.projectId);
    let allStages: any[] = [];
    let allCoverage: any[] = [];
    let allProfReviews: any[] = [];
    let allAssignments: any[] = [];

    if (projectIds.length > 0) {
      const [stagesRows]: any = await pool.query(
        `SELECT projectId, stageKey, status, completedAt FROM research_project_stages WHERE projectId IN (?)`,
        [projectIds]
      );
      allStages = stagesRows;

      const [covRows]: any = await pool.query(
        `SELECT projectId, areaKey, status, updatedAt FROM review_area_coverage WHERE projectId IN (?)`,
        [projectIds]
      );
      allCoverage = covRows;

      const [revRows]: any = await pool.query(
        `SELECT id, projectId, areaKey, assessment, status, submittedAt FROM professional_reviews WHERE projectId IN (?)`,
        [projectIds]
      );
      allProfReviews = revRows;

      const [assRows]: any = await pool.query(
        `SELECT id, projectId, specialtyNeeded, status, completedAt FROM review_assignments WHERE projectId IN (?)`,
        [projectIds]
      );
      allAssignments = assRows;
    }

    const mappedProjects = projects.map((p: any) => {
      const projStages = allStages.filter((s: any) => s.projectId === p.projectId);
      const projCoverage = allCoverage.filter((c: any) => c.projectId === p.projectId);
      const projReviews = allProfReviews.filter((r: any) => r.projectId === p.projectId);
      const projAssignments = allAssignments.filter((a: any) => a.projectId === p.projectId);

      const resolved = [1, 2, 3, 4, 5].map((num) =>
        resolveSingleStageStatus(
          num,
          p.projectId,
          { currentStage: p.currentStage, status: p.rawStatus, updatedAt: p.updatedAt },
          projStages,
          projAssignments,
          projCoverage,
          projReviews
        )
      );

      const areas = resolved.map((r) => ({
        key: r.areaKey,
        label: r.discipline,
        status: r.status,
        statusLabel: r.statusLabel,
        isApproved: r.status === "APPROVED",
        isRevision: r.status === "REVISION_REQUIRED" || r.status === "REVISION_RESUBMITTED",
        isInReview: r.status === "IN_REVIEW",
        isPending: r.status === "NEEDS_REVIEW",
        isReady: r.isReady,
        actionUrl: r.actionUrl,
      }));

      const approvedCount = areas.filter((a) => a.isApproved).length;
      const requiresAttention =
        p.rawStatus === "UNDER_REVIEW" ||
        p.rawStatus === "REVISION_REQUIRED" ||
        areas.some((a) => a.isInReview || a.isPending || a.isRevision);

      return {
        ...p,
        completedReviewsCount: approvedCount,
        totalRequiredReviews: 5,
        requiresAttention,
        areas,
      };
    });

    const attentionQueue = mappedProjects.filter((p: any) => p.requiresAttention);

    return NextResponse.json({
      success: true,
      reviewer: {
        ...reviewerUser,
        assignedAreas: assignedAreas.length > 0 ? assignedAreas : [reviewerUser.specialty || "pharmacognosy"],
      },
      stats: {
        totalProjects: Number(pCounts.totalProjects || 0),
        needsReviewCount: Number(pCounts.reviewReadyCount || 0) + Number(aCounts.myPendingCount || 0),
        inProgressCount: Number(pCounts.inProgressCount || 0),
        revisionsCount: Number(pCounts.revisionCount || 0),
        completedCount: Number(pCounts.completedCount || 0),
        myTotalAssigned: Number(aCounts.myTotalAssigned || 0),
        myPendingCount: Number(aCounts.myPendingCount || 0) + Number(aCounts.myResubmittedCount || 0),
        myCompletedCount: Number(aCounts.myCompletedCount || 0),
      },
      priorityItems: attentionQueue.slice(0, 5),
      projects: mappedProjects,
      recentActivities: recentReviews.map((r: any) => ({
        id: r.id,
        projectId: r.projectId,
        projectTitle: r.projectTitle,
        plantName: r.plantName,
        areaKey: r.areaKey,
        status: r.status,
        comments: r.comments,
        reviewerName: r.reviewerName || "Scientific Reviewer",
        submittedAt: r.submittedAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/reviewer/dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}

