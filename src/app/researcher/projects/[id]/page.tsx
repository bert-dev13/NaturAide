import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { calculateV2ProjectProgress } from "@/lib/v2-progress-service";
import ResearchWorkspaceClient from "@/components/researcher/workspace/ResearchWorkspaceClient";

export default async function ResearchProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) notFound();

  // Query project
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.*,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName,
           p.category as plantCategory,
           COALESCE(p.local_image_path, p.imageUrl) as plantImageUrl
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.id = ? ${session.role === "RESEARCHER" ? "AND rp.researcherId = ?" : ""}
    LIMIT 1
    `,
    session.role === "RESEARCHER" ? [projectId, session.id] : [projectId]
  );

  if (projectRows.length === 0) {
    notFound();
  }

  const project = projectRows[0];

  // Calculate V2 Section Progress
  const v2Progress = await calculateV2ProjectProgress(projectId);

  // Sync DB progressPercent
  if (project.progressPercent !== v2Progress.overallProgressPercent) {
    await pool.query(
      "UPDATE research_projects SET progressPercent = ? WHERE id = ?",
      [v2Progress.overallProgressPercent, projectId]
    );
    project.progressPercent = v2Progress.overallProgressPercent;
  }

  const [activities]: any = await pool.query(
    `SELECT actionType, description, createdAt FROM research_activity_logs WHERE projectId = ? ORDER BY createdAt DESC LIMIT 10`,
    [projectId]
  );

  const [studyRows]: any = await pool.query(
    "SELECT COUNT(*) AS total FROM literature_references WHERE projectId = ?",
    [projectId]
  );

  const [feedbackRows]: any = await pool.query(
    "SELECT COUNT(*) AS total FROM review_feedback WHERE projectId = ? AND status = 'OPEN'",
    [projectId]
  );
  const openRevisionsCount = Number(feedbackRows[0]?.total || 0);

  const [formRows]: any = await pool.query(
    `SELECT rf.formulationName, rf.dosageFormType, rf.formulationType,
            (SELECT COUNT(*) FROM formulation_components fc WHERE fc.projectId = rf.projectId) as componentsCount
     FROM research_formulations rf WHERE rf.projectId = ? ORDER BY rf.id DESC LIMIT 1`,
    [projectId]
  );
  const formulationOverview = formRows[0] || null;

  return (
    <ResearchWorkspaceClient
      project={project}
      v2Progress={v2Progress}
      activities={activities}
      linkedStudies={studyRows[0]?.total || 0}
      openRevisionsCount={openRevisionsCount}
      formulationOverview={formulationOverview}
    />
  );
}
