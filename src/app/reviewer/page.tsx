import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import ReviewerDashboardClient from "@/components/reviewer/ReviewerDashboardClient";
import {
  EXPERT_REVIEW_AREAS,
  expertReviewAreaLabel,
  normalizeReviewAreaKey,
} from "@/lib/expert-review-areas";
import {
  ensureReviewTables,
  getReviewerSpecialties,
} from "@/lib/expert-review-assignment";

export default async function ReviewerDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "REVIEWER") {
    redirect("/login");
  }

  await ensureReviewTables();

  const [profileRows]: any = await pool.query(
    "SELECT * FROM reviewer_profiles WHERE userId = ? LIMIT 1",
    [session.id]
  );
  const rawProfile = profileRows[0] || null;
  const profile = rawProfile
    ? {
        id: rawProfile.id,
        userId: rawProfile.userId,
        professionalTitle: rawProfile.professionalTitle || null,
        specialty: rawProfile.specialty || null,
        specialtiesJson: rawProfile.specialtiesJson || null,
        institution: rawProfile.institution || null,
      }
    : null;
  const assignedSpecialties = await getReviewerSpecialties(session.id);

  // Fetch Latest Review Submissions per Project from real MySQL data
  const [submissionRows]: any = await pool.query(
    `
    SELECT
      rs.id as submissionId,
      rs.projectId,
      rs.versionTag,
      rs.reviewRound,
      rs.status as submissionStatus,
      rs.isLocked,
      rs.submittedAt,
      rs.reviewedAt,
      rp.title as projectTitle,
      rp.status as projectStatus,
      rp.updatedAt as projectUpdatedAt,
      rp.researcherId,
      COALESCE(rpd.commonName, p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
      COALESCE(rpd.scientificName, p.scientificName, '') as plantScientificName,
      u.name as researcherName,
      u.email as researcherEmail
    FROM review_submissions rs
    INNER JOIN (
      SELECT projectId, MAX(id) as maxSubId
      FROM review_submissions
      GROUP BY projectId
    ) latest ON rs.id = latest.maxSubId
    JOIN research_projects rp ON rs.projectId = rp.id
    JOIN users u ON rp.researcherId = u.id
    LEFT JOIN plants p ON rp.plantId = p.id
    LEFT JOIN research_plant_data rpd ON rpd.projectId = rp.id
    WHERE rp.status != 'ARCHIVED'
    ORDER BY COALESCE(rs.submittedAt, rp.updatedAt) DESC, rs.id DESC
    `
  );

  const subIds = submissionRows.map((s: any) => s.submissionId);
  let coverageRows: any[] = [];
  let assignmentRows: any[] = [];
  if (subIds.length > 0) {
    const placeholders = subIds.map(() => "?").join(", ");
    const [covRes]: any = await pool.query(
      `SELECT * FROM review_area_coverage WHERE submissionId IN (${placeholders})`,
      subIds
    );
    coverageRows = covRes || [];

    const [assRes]: any = await pool.query(
      `SELECT * FROM review_assignments WHERE submissionId IN (${placeholders})`,
      subIds
    );
    assignmentRows = assRes || [];
  }

  const researchList = submissionRows.map((sub: any) => {
    const subCov = coverageRows.filter((c) => c.submissionId === sub.submissionId);
    const subAss = assignmentRows.filter((a) => a.submissionId === sub.submissionId);

    const allSpecialtiesStatus = EXPERT_REVIEW_AREAS.map((area) => {
      const cov = subCov.find((c) => normalizeReviewAreaKey(c.areaKey) === area.key);
      const ass = subAss.find((a) => normalizeReviewAreaKey(a.specialtyNeeded) === area.key);
      const rawStatus = String(cov?.status || ass?.status || "PENDING").toUpperCase();
      let displayStatus: "Pending" | "In Review" | "Revision Required" | "Approved" = "Pending";
      if (rawStatus === "APPROVED" || rawStatus === "COMPLETED") {
        displayStatus = "Approved";
      } else if (rawStatus === "REVISION_REQUIRED" || rawStatus === "REVISIONS_REQUESTED") {
        displayStatus = "Revision Required";
      } else if (rawStatus === "IN_REVIEW" || rawStatus === "UNDER_REVIEW") {
        displayStatus = "In Review";
      }

      const isAssignedToMe =
        assignedSpecialties.includes(area.key) ||
        Number(cov?.reviewerId) === Number(session.id) ||
        Number(ass?.reviewerId) === Number(session.id);

      return {
        areaKey: area.key,
        order: area.order,
        label: area.label,
        shortLabel: area.shortLabel,
        status: displayStatus,
        rawStatus,
        isAssignedToMe,
        assignmentId: ass?.id || null,
      };
    });

    const reviewerAssignedAreas = allSpecialtiesStatus.filter((s) =>
      assignedSpecialties.includes(s.areaKey)
    );
    const effectiveAreas =
      reviewerAssignedAreas.length > 0 ? reviewerAssignedAreas : allSpecialtiesStatus;

    const approvedCount = effectiveAreas.filter((a) => a.status === "Approved").length;
    const revisionCount = effectiveAreas.filter((a) => a.status === "Revision Required").length;
    const inReviewCount = effectiveAreas.filter((a) => a.status === "In Review").length;

    let reviewStatus: "Pending" | "In Review" | "Revision Required" | "Approved" = "Pending";
    if (effectiveAreas.length > 0 && approvedCount === effectiveAreas.length) {
      reviewStatus = "Approved";
    } else if (revisionCount > 0) {
      reviewStatus = "Revision Required";
    } else if (inReviewCount > 0 || approvedCount > 0) {
      reviewStatus = "In Review";
    } else {
      reviewStatus = "Pending";
    }

    return {
      projectId: sub.projectId,
      submissionId: sub.submissionId,
      title: sub.projectTitle,
      plantName: sub.plantName,
      plantScientificName: sub.plantScientificName,
      researcherName: sub.researcherName,
      versionTag: sub.versionTag || `v${sub.reviewRound || 1}.0`,
      reviewRound: sub.reviewRound || 1,
      assignedSpecialties: effectiveAreas.map((a) => ({
        areaKey: a.areaKey,
        label: a.label,
        status: a.status,
      })),
      allSpecialties: allSpecialtiesStatus,
      reviewStatus,
      lastUpdated:
        sub.reviewedAt || sub.submittedAt || sub.projectUpdatedAt
          ? new Date(sub.reviewedAt || sub.submittedAt || sub.projectUpdatedAt).toISOString()
          : "",
      isLocked: Boolean(sub.isLocked),
    };
  });

  const metrics = {
    assignedResearch: researchList.length,
    pendingReviews: researchList.filter(
      (r: any) => r.reviewStatus === "Pending" || r.reviewStatus === "In Review"
    ).length,
    revisionsRequested: researchList.filter(
      (r: any) => r.reviewStatus === "Revision Required"
    ).length,
    completedReviews: researchList.filter(
      (r: any) => r.reviewStatus === "Approved"
    ).length,
  };

  return (
    <ReviewerDashboardClient
      user={{
        id: session.id,
        name: session.name,
        email: session.email,
      }}
      profile={profile}
      initialAssignedSpecialties={assignedSpecialties.map((k) => ({
        areaKey: k,
        label: expertReviewAreaLabel(k),
      }))}
      metrics={metrics}
      initialResearchList={researchList}
    />
  );
}
