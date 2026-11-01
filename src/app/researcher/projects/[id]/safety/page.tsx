import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SafetyClinicalClient from "@/components/researcher/safety/SafetyClinicalClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const instant = false;

export default async function SafetyClinicalStagePage({ params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "RESEARCHER") {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) {
    redirect("/researcher/projects");
  }

  return <SafetyClinicalClient projectId={projectId} />;
}
