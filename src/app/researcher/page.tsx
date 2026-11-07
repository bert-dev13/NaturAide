import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { calculateV2ProjectProgress } from "@/lib/v2-progress-service";
import ResearcherDashboardClient, {
  type DashboardStats,
  type ProjectData,
} from "@/components/researcher/dashboard/ResearcherDashboardClient";

export const instant = false;

export default async function ResearcherDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/researcher");
  }

  const researcherId = session.id;
  const firstName =
    session.firstName ||
    session.name?.split(" ")[0]?.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/i, "") ||
    "Researcher";

  // 1. Fetch KPI counts from MySQL
  const [counts]: any = await pool.query(
    `
    SELECT
      COUNT(CASE WHEN status IN ('IN_PROGRESS', 'DRAFT') AND status != 'ARCHIVED' AND title NOT LIKE 'Automated Verification Project%' THEN 1 END) as activeCount,
      COUNT(CASE WHEN status IN ('UNDER_REVIEW', 'READY_FOR_REVIEW') AND status != 'ARCHIVED' THEN 1 END) as reviewCount,
      COUNT(CASE WHEN status = 'REVISION_REQUIRED' AND status != 'ARCHIVED' THEN 1 END) as revisionCount,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completedCount,
      COUNT(CASE WHEN status != 'ARCHIVED' THEN 1 END) as totalCount
    FROM research_projects
    WHERE researcherId = ?
    `,
    [researcherId]
  );

  const rawStats = counts[0] || {};
  const stats: DashboardStats = {
    activeCount: Number(rawStats.activeCount || 0),
    reviewCount: Number(rawStats.reviewCount || 0),
    revisionCount: Number(rawStats.revisionCount || 0),
    completedCount: Number(rawStats.completedCount || 0),
    totalCount: Number(rawStats.totalCount || 0),
  };

  // 2. Fetch Active Projects for "CONTINUE YOUR RESEARCH"
  // Prioritize legitimate non-automated projects that are in progress or revision
  const [activeProjectRows]: any = await pool.query(
    `
    SELECT rp.id, rp.title, rp.status, rp.currentStage, rp.progressPercent, rp.updatedAt,
           rp.shortDescription,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.researcherId = ? 
      AND rp.status IN ('IN_PROGRESS', 'DRAFT', 'REVISION_REQUIRED', 'REVISION_REQUESTED', 'UNDER_REVIEW', 'APPROVED')
      AND rp.status != 'ARCHIVED'
    ORDER BY
      CASE WHEN rp.title LIKE 'Automated Verification Project%' THEN 1 ELSE 0 END ASC,
      rp.updatedAt DESC
    LIMIT 3
    `,
    [researcherId]
  );

  // For active projects, fetch their stages map & latest review submission approval count
  const activeProjects: ProjectData[] = [];
  for (const r of activeProjectRows) {
    const [stageRows]: any = await pool.query(
      `SELECT stageKey, status FROM research_project_stages WHERE projectId = ?`,
      [r.id]
    );
    const stagesMap: Record<string, string> = {};
    for (const s of stageRows) {
      stagesMap[s.stageKey] = s.status;
    }

    let approvedCount = 0;
    let revCount = 0;
    let hasSub = false;
    try {
      const [subRows]: any = await pool.query(
        `SELECT id FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC LIMIT 1`,
        [r.id]
      );
      if (subRows && subRows.length > 0) {
        hasSub = true;
        const [covRows]: any = await pool.query(
          `SELECT status FROM review_area_coverage WHERE submissionId = ?`,
          [subRows[0].id]
        );
        for (const c of covRows || []) {
          const cst = String(c.status || "").toUpperCase();
          if (cst === "APPROVED" || cst === "COMPLETED") approvedCount++;
          else if (cst === "REVISION_REQUIRED" || cst === "REVISION_REQUESTED") revCount++;
        }
      }
    } catch {
      // Non-fatal
    }

    const stUpper = String(r.status || "").toUpperCase();
    let displayStatus = r.status;
    if (stUpper === "REVISION_REQUIRED" || stUpper === "REVISION_REQUESTED" || revCount > 0) {
      displayStatus = "Revisions Required";
    } else if (stUpper === "APPROVED" || (hasSub && approvedCount >= 3 && revCount === 0)) {
      displayStatus = "Fully Approved — Ready to Complete";
    } else if (stUpper === "UNDER_REVIEW" || stUpper === "READY_FOR_REVIEW" || hasSub) {
      displayStatus = `Under Professional Review — ${approvedCount}/3 Approved`;
    }

    // Resolve V2 section progression
    let continueRoute = `/researcher/projects/${r.id}/formulation-rd`;
    let currentSectionNum = 1;
    let currentSectionTitle = "1. Formulation R&D";
    let computedProgress = Number(r.progressPercent || 0);

    try {
      const v2Prog = await calculateV2ProjectProgress(r.id);
      const isSec1Done = v2Prog.section1.status === "COMPLETED";
      const isSec2Done = v2Prog.section2.status === "COMPLETED";
      const isSec3Done = v2Prog.section3.status === "COMPLETED";
      computedProgress = v2Prog.overallProgressPercent;

      if (stUpper === "COMPLETED") {
        continueRoute = `/researcher/projects/${r.id}/completion`;
        currentSectionNum = 4;
        currentSectionTitle = "Completed Research";
      } else if (!isSec1Done) {
        continueRoute = `/researcher/projects/${r.id}/formulation-rd`;
        currentSectionNum = 1;
        currentSectionTitle = "1. Formulation R&D";
      } else if (!isSec2Done) {
        continueRoute = `/researcher/projects/${r.id}/in-silico`;
        currentSectionNum = 2;
        currentSectionTitle = "2. In-Silico Analysis";
      } else if (!isSec3Done) {
        continueRoute = `/researcher/projects/${r.id}/submission`;
        currentSectionNum = 3;
        currentSectionTitle = "3. Paper Submission";
      } else {
        continueRoute = `/researcher/projects/${r.id}/completion`;
        currentSectionNum = 4;
        currentSectionTitle = "4. Professional Approval";
      }
    } catch {}

    activeProjects.push({
      id: r.id,
      title: r.title,
      status: displayStatus,
      currentStage: r.currentStage || "plant-literature",
      continueRoute,
      currentSectionNum,
      currentSectionTitle,
      progressPercent: computedProgress,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      plantName: r.plantName,
      plantScientificName: r.plantScientificName,
      shortDescription: r.shortDescription,
      stagesMap,
    });
  }

  // 3. Fetch Completed Projects for "Recent Research"
  const [completedProjectRows]: any = await pool.query(
    `
    SELECT rp.id, rp.title, rp.status, rp.currentStage, rp.progressPercent, rp.updatedAt,
           rp.shortDescription,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.researcherId = ? 
      AND rp.status = 'COMPLETED'
    ORDER BY rp.updatedAt DESC
    LIMIT 3
    `,
    [researcherId]
  );

  const completedProjects: ProjectData[] = (completedProjectRows || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    currentStage: r.currentStage || "completion",
    progressPercent: Number(r.progressPercent || 100),
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    plantName: r.plantName,
    plantScientificName: r.plantScientificName,
    shortDescription: r.shortDescription,
  }));

  return (
    <ResearcherDashboardClient
      firstName={firstName}
      stats={stats}
      activeProjects={activeProjects}
      completedProjects={completedProjects}
    />
  );
}
