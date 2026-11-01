import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { resolveSingleStageStatus } from "@/lib/professional-review-status";

const STAGE_NUMBERS: Record<string, number> = {
  "plant-literature": 1,
  "in-silico": 2,
  docking: 3,
  "formulation-safety": 4,
  formulation: 4,
  safety: 5,
  "expert-review": 5,
  "knowledge-integration": 6,
  "completion-integration": 6,
};

const STAGE_NAMES: Record<string, string> = {
  "plant-literature": "Plant & Literature",
  "in-silico": "In-Silico Analysis",
  docking: "Molecular Docking",
  "formulation-safety": "Formulation Development",
  formulation: "Formulation Development",
  safety: "Safety / Clinical",
  "expert-review": "Safety / Clinical",
  "knowledge-integration": "Knowledge Integration",
  "completion-integration": "Knowledge Integration",
};

const PLANT_FAMILY_MAP: Record<string, string> = {
  "Momordica charantia": "Cucurbitaceae",
  "Blumea balsamifera": "Asteraceae",
  "Vitex negundo": "Lamiaceae (Verbenaceae)",
  "Psidium guajava": "Myrtaceae",
  "Senna alata": "Fabaceae",
  "Allium sativum": "Amaryllidaceae",
  "Curcuma longa": "Zingiberaceae",
  "Peperomia pellucida": "Piperaceae",
  "Carmona retusa": "Boraginaceae",
  "Mentha cordifolia": "Lamiaceae",
  "Quisqualis indica": "Combretaceae",
  "Zingiber officinale": "Zingiberaceae",
};

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status")?.trim().toUpperCase() || "ALL";
    const q = searchParams.get("q")?.trim().toLowerCase();

    // 1. Canonical Tab Counts across all research projects in the database
    const [countRows]: any = await pool.query(
      `
      SELECT
        COUNT(CASE WHEN status != 'ARCHIVED' THEN 1 END) as allCount,
        COUNT(CASE WHEN status IN ('IN_PROGRESS', 'DRAFT') AND status != 'ARCHIVED' THEN 1 END) as activeCount,
        COUNT(CASE WHEN status IN ('UNDER_REVIEW', 'READY_FOR_REVIEW') AND status != 'ARCHIVED' THEN 1 END) as reviewCount,
        COUNT(CASE WHEN status = 'REVISION_REQUIRED' AND status != 'ARCHIVED' THEN 1 END) as revisionCount,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completedCount,
        COUNT(CASE WHEN status = 'ARCHIVED' THEN 1 END) as archivedCount
      FROM research_projects
      `
    );

    const counts = countRows[0] || {};
    const tabCounts = {
      ALL: Number(counts.allCount || 0),
      ACTIVE: Number(counts.activeCount || 0),
      UNDER_REVIEW: Number(counts.reviewCount || 0),
      REVISION: Number(counts.revisionCount || 0),
      COMPLETED: Number(counts.completedCount || 0),
      ARCHIVED: Number(counts.archivedCount || 0),
    };

    // 2. Query Canonical Projects with joined Plants and Researcher metadata
    let sql = `
      SELECT
        rp.id as projectId,
        rp.title,
        rp.shortDescription,
        rp.researchObjective,
        rp.researchQuestion,
        rp.areaOfInterest,
        rp.expectedOutcome,
        rp.status as rawStatus,
        rp.currentStage,
        rp.progressPercent,
        rp.plantId,
        rp.plantCustomName,
        rp.createdAt,
        rp.updatedAt,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        p.category as plantCategory,
        COALESCE(p.local_image_path, p.imageUrl) as plantImageUrl,
        u.id as researcherId,
        u.name as researcherName,
        u.email as researcherEmail,
        (SELECT COUNT(*) FROM review_feedback rf WHERE rf.projectId = rp.id) as feedbackCount,
        (SELECT COUNT(*) FROM research_project_stages rps WHERE rps.projectId = rp.id AND rps.status = 'COMPLETED') as completedStagesCount,
        (SELECT rs.versionTag FROM review_submissions rs WHERE rs.projectId = rp.id ORDER BY rs.id DESC LIMIT 1) as dossierVersion,
        (SELECT rs.reviewRound FROM review_submissions rs WHERE rs.projectId = rp.id ORDER BY rs.id DESC LIMIT 1) as reviewRound,
        (SELECT rs.submittedAt FROM review_submissions rs WHERE rs.projectId = rp.id ORDER BY rs.id DESC LIMIT 1) as submittedAt,
        (SELECT rs.status FROM review_submissions rs WHERE rs.projectId = rp.id ORDER BY rs.id DESC LIMIT 1) as submissionStatus
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      LEFT JOIN users u ON rp.researcherId = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by canonical status
    if (rawStatus === "ACTIVE") {
      sql += ` AND rp.status IN ('IN_PROGRESS', 'DRAFT')`;
    } else if (rawStatus === "UNDER_REVIEW") {
      sql += ` AND rp.status IN ('UNDER_REVIEW', 'READY_FOR_REVIEW')`;
    } else if (rawStatus === "REVISION" || rawStatus === "REVISION_REQUIRED" || rawStatus === "NEEDS_REVISION") {
      sql += ` AND rp.status = 'REVISION_REQUIRED'`;
    } else if (rawStatus === "COMPLETED") {
      sql += ` AND rp.status = 'COMPLETED'`;
    } else if (rawStatus === "ARCHIVED") {
      sql += ` AND rp.status = 'ARCHIVED'`;
    } else if (rawStatus === "REVIEW_READY") {
      sql += ` AND rp.status != 'ARCHIVED'`;
    } else {
      // Default: ALL non-archived projects
      sql += ` AND rp.status != 'ARCHIVED'`;
    }

    // Text search
    if (q) {
      sql += ` AND (
        rp.title LIKE ? OR
        rp.shortDescription LIKE ? OR
        rp.researchObjective LIKE ? OR
        p.commonName LIKE ? OR
        p.scientificName LIKE ? OR
        u.name LIKE ?
      )`;
      const term = `%${q}%`;
      params.push(term, term, term, term, term, term);
    }

    // Secondary sorting: deprioritize automated test projects on non-archived views
    const deprioritizeTests =
      rawStatus !== "ARCHIVED"
        ? "CASE WHEN rp.title LIKE 'Automated Verification Project%' THEN 1 ELSE 0 END ASC, "
        : "";
    sql += ` ORDER BY ${deprioritizeTests}rp.updatedAt DESC, rp.id DESC`;

    const [projectRows]: any = await pool.query(sql, params);

    // 3. Query all latest assignments to attach review statuses onto projects
    const [assignments]: any = await pool.query(
      `
      SELECT
        ra.id as assignmentId,
        ra.projectId,
        ra.submissionId,
        ra.reviewerId,
        ra.specialtyNeeded,
        ra.status as assignmentStatus,
        ra.reviewRound,
        ra.assignedAt,
        ra.completedAt
      FROM review_assignments ra
      WHERE ra.id IN (
        SELECT MAX(id)
        FROM review_assignments
        GROUP BY projectId, specialtyNeeded
      )
      `
    );

    // 3. Query supporting review records for all retrieved projects
    const projectIds = projectRows.map((p: any) => p.projectId);
    let allStages: any[] = [];
    let allCoverage: any[] = [];
    let allProfReviews: any[] = [];

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
    }

    // 4. Augment canonical projects with stage progress & professional review areas
    const detailedProjects = projectRows.map((p: any) => {
      const stageNum = STAGE_NUMBERS[p.currentStage] || 1;
      const stageName = STAGE_NAMES[p.currentStage] || "Plant & Literature";
      const projectAssignments = assignments.filter((a: any) => a.projectId === p.projectId);
      const projStages = allStages.filter((s: any) => s.projectId === p.projectId);
      const projCoverage = allCoverage.filter((c: any) => c.projectId === p.projectId);
      const projReviews = allProfReviews.filter((r: any) => r.projectId === p.projectId);

      // Resolve the 5 disciplinary review areas independently
      const resolved = [1, 2, 3, 4, 5].map((num) =>
        resolveSingleStageStatus(
          num,
          p.projectId,
          { currentStage: p.currentStage, status: p.rawStatus, updatedAt: p.updatedAt },
          projStages,
          projectAssignments,
          projCoverage,
          projReviews
        )
      );

      const areas = resolved.map((r) => ({
        key: r.areaKey,
        profession: r.profession,
        checkingArea: r.checkingArea,
        status: r.statusLabel,
        displayStatus: r.statusLabel,
        isReady: r.isReady,
        isCompleted: r.isCompleted,
        assignmentId: r.assignmentId,
        actionUrl: r.actionUrl,
      }));

      const completedCount = areas.filter((a) => a.isCompleted).length;
      const isReviewReady = areas.some((a) => a.isReady && !a.isCompleted);

      // Human-readable Project Status
      let displayStatus = "Active";
      if (p.rawStatus === "COMPLETED") {
        displayStatus = "Completed";
      } else if (p.rawStatus === "UNDER_REVIEW" || p.rawStatus === "READY_FOR_REVIEW") {
        displayStatus = "Under Review";
      } else if (p.rawStatus === "REVISION_REQUIRED") {
        displayStatus = "Revisions Needed";
      } else if (p.rawStatus === "ARCHIVED") {
        displayStatus = "Archived";
      }

      // Action button config
      let actionLabel = "Open Project →";
      if (p.rawStatus === "COMPLETED" || completedCount === 5) {
        actionLabel = "View Project →";
      } else if (displayStatus === "Under Review") {
        actionLabel = "Start Review →";
      } else if (displayStatus === "Revisions Needed") {
        actionLabel = "Review Revision →";
      }

      return {
        projectId: p.projectId,
        title: p.title,
        shortDescription: p.shortDescription,
        researchObjective: p.researchObjective,
        plantName: p.plantName,
        plantScientificName: p.plantScientificName,
        plantFamily: (p.plantScientificName && PLANT_FAMILY_MAP[p.plantScientificName]) || null,
        plantImageUrl: p.plantImageUrl,
        researcherId: p.researcherId,
        researcherName: p.researcherName || "NatureAide Researcher",
        researcherEmail: p.researcherEmail,
        currentStage: p.currentStage,
        stageNumber: stageNum,
        stageName,
        progressPercent: p.progressPercent || 0,
        rawStatus: p.rawStatus,
        displayStatus,
        reviewRound: p.reviewRound || 1,
        versionTag: p.dossierVersion || "v1.0",
        submittedAt: p.submittedAt || p.createdAt,
        updatedAt: p.updatedAt,
        totalRequiredReviews: 5,
        completedReviewsCount: completedCount,
        isReviewReady,
        requiresAttention:
          displayStatus === "Under Review" ||
          displayStatus === "Revisions Needed" ||
          areas.some((a) => a.status === "In Review" || a.status === "Needs Review"),
        attentionAreas: areas.filter(
          (a) =>
            a.status === "Needs Review" ||
            a.status === "Revision Requested" ||
            a.status === "Revision Submitted" ||
            a.status === "In Review"
        ),
        areas,
        action: {
          label: actionLabel,
          href: `/reviewer/projects/${p.projectId}`,
        },
      };
    });

    // Optional filter for "REVIEW_READY"
    let finalProjects = detailedProjects;
    if (rawStatus === "REVIEW_READY") {
      finalProjects = detailedProjects.filter((p: any) => p.isReviewReady);
    }

    return NextResponse.json({
      success: true,
      tabCounts,
      summary: {
        totalCount: tabCounts.ALL,
        needsReviewCount: tabCounts.UNDER_REVIEW,
        inProgressCount: detailedProjects.filter((p: any) => p.areas.some((a: any) => a.status === "In Review")).length,
        revisionsCount: tabCounts.REVISION,
        completedCount: tabCounts.COMPLETED,
        archivedCount: tabCounts.ARCHIVED,
      },
      projects: finalProjects,
    });
  } catch (error) {
    console.error("GET /api/reviewer/projects error:", error);
    return NextResponse.json({ error: "Failed to fetch reviewer projects" }, { status: 500 });
  }
}
