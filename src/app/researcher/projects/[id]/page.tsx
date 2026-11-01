import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { WORKFLOW_STAGES } from "@/lib/workflow-stages";
import ResearchWorkspaceClient from "@/components/researcher/workspace/ResearchWorkspaceClient";

export const instant = false;

export default async function ResearchProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "RESEARCHER") {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) notFound();

  // Query project ensuring researcher ownership
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.*,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName,
           p.category as plantCategory,
           COALESCE(p.local_image_path, p.imageUrl) as plantImageUrl
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.id = ? AND rp.researcherId = ?
    LIMIT 1
    `,
    [projectId, session.id]
  );

  if (projectRows.length === 0) {
    notFound();
  }

  const project = projectRows[0];

  // Fetch stages
  const [stages]: any = await pool.query(
    `SELECT stageKey, status, completedAt, updatedAt FROM research_project_stages WHERE projectId = ?`,
    [projectId]
  );

  // Self-heal project.currentStage if it has regressed or is out of sync with completed stages
  const stageStatusMap: Record<string, string> = {};
  for (const s of stages) stageStatusMap[s.stageKey] = s.status;

  const currentStageKey = project.currentStage;
  if (stageStatusMap[currentStageKey] === "COMPLETED") {
    const activeStage =
      WORKFLOW_STAGES.find((s) => stageStatusMap[s.key] === "IN_PROGRESS" || stageStatusMap[s.key] === "UNDER_REVIEW") ||
      WORKFLOW_STAGES.find((s) => stageStatusMap[s.key] !== "COMPLETED") ||
      WORKFLOW_STAGES[WORKFLOW_STAGES.length - 1];

    if (activeStage && activeStage.key !== currentStageKey) {
      project.currentStage = activeStage.key;
      await pool.query(
        `UPDATE research_projects SET currentStage = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [activeStage.key, projectId]
      );
    }
  }

  const [activities]: any = await pool.query(
    `SELECT actionType, description, createdAt FROM research_activity_logs WHERE projectId = ? ORDER BY createdAt DESC LIMIT 12`,
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

  return (
    <ResearchWorkspaceClient
      project={project}
      stages={stages}
      activities={activities}
      linkedStudies={Number(studyRows[0]?.total || 0)}
      openRevisionsCount={openRevisionsCount}
    />
  );
}
