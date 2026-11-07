import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getProjectProfessionalApprovalState } from "@/lib/research-approval-completion-service";
import ProjectProfessionalApprovalClient from "@/components/researcher/completion/ProjectProfessionalApprovalClient";

export default async function ProjectCompletionPage({
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

  // Load project
  const [projectRows]: any = await pool.query(
    `SELECT rp.*,
            COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
            p.scientificName as plantScientificName
     FROM research_projects rp
     LEFT JOIN plants p ON rp.plantId = p.id
     WHERE rp.id = ?
     LIMIT 1`,
    [projectId]
  );

  if (!projectRows || projectRows.length === 0) {
    notFound();
  }

  const project = projectRows[0];
  const approvalState = await getProjectProfessionalApprovalState(projectId);

  return (
    <ProjectProfessionalApprovalClient
      project={project}
      initialApprovalState={approvalState}
    />
  );
}
