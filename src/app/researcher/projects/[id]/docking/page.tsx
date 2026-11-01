import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { beginPreparation, loadDockingWorkspace } from "@/lib/docking-jobs";
import { getProfessionalReviewStageStatus } from "@/lib/professional-review-status";
import MolecularDockingWorkspaceClient from "@/components/researcher/docking/MolecularDockingWorkspaceClient";

export const instant = false;

export default async function MolecularDockingStagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "RESEARCHER") redirect("/login");

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) notFound();

  const [projectRows]: any = await pool.query(
    `SELECT id, status FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1`,
    [projectId, session.id]
  );
  if (!projectRows.length) notFound();
  const project = projectRows[0];

  await beginPreparation(projectId);
  const workspace = await loadDockingWorkspace(projectId);
  const [stageRows]: any = await pool.query(
    `SELECT status FROM research_project_stages WHERE projectId = ? AND stageKey = 'docking' LIMIT 1`,
    [projectId]
  );

  // Fetch Pharmacology review feedback
  const [reviewFeedback]: any = await pool.query(
    `
    SELECT rf.*, u.name as reviewerDisplayName
    FROM review_feedback rf
    LEFT JOIN users u ON rf.reviewerId = u.id
    WHERE rf.projectId = ? AND (
      rf.areaKey = 'pharmacology'
      OR rf.affectedStage IN ('Stage 3', 'docking', '3')
    )
    ORDER BY rf.id ASC
    `,
    [projectId]
  );

  // Fetch canonical professional review status for Stage 3 (Pharmacology)
  const stageReview = await getProfessionalReviewStageStatus(projectId, 3);

  return (
    <MolecularDockingWorkspaceClient
      projectId={projectId}
      initialWorkspace={workspace}
      stageCompleted={stageRows[0]?.status === "COMPLETED"}
      initialReviewFeedback={reviewFeedback || []}
      overallAssessment={stageReview.comments}
      reviewStatus={stageReview.status}
      reviewerName={stageReview.reviewerName}
      approvedAt={stageReview.approvedAt}
    />
  );
}
