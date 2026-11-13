import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCompletedResearchListForResearcher } from "@/lib/research-approval-completion-service";
import CompletedResearchListClient from "@/components/researcher/completed/CompletedResearchListClient";

export default async function CompletedResearchPage() {
  const session = await getSession();
  if (!session || session.role !== "RESEARCHER") {
    redirect("/login");
  }

  let completedProjects: Awaited<ReturnType<typeof getCompletedResearchListForResearcher>> = [];
  try {
    completedProjects = await getCompletedResearchListForResearcher(Number(session.id));
  } catch (error) {
    console.warn("Completed research list failed:", error);
    completedProjects = [];
  }

  return (
    <CompletedResearchListClient
      completedProjects={completedProjects}
    />
  );
}

