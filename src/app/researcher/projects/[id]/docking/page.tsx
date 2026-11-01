import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { beginPreparation, loadDockingWorkspace } from "@/lib/docking-jobs";
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
    `SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1`,
    [projectId, session.id]
  );
  if (!projectRows.length) notFound();

  await beginPreparation(projectId);
  const workspace = await loadDockingWorkspace(projectId);
  const [stageRows]: any = await pool.query(
    `SELECT status FROM research_project_stages WHERE projectId = ? AND stageKey = 'docking' LIMIT 1`,
    [projectId]
  );

  return (
    <MolecularDockingWorkspaceClient
      projectId={projectId}
      initialWorkspace={workspace}
      stageCompleted={stageRows[0]?.status === "COMPLETED"}
    />
  );
}
