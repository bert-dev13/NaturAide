import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ResearcherRevisionsClient from "@/components/researcher/revisions/ResearcherRevisionsClient";

export const instant = false;

export default async function ResearcherRevisionsPage({
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
  if (isNaN(projectId)) {
    redirect("/researcher/projects");
  }

  return <ResearcherRevisionsClient projectId={projectId} />;
}
