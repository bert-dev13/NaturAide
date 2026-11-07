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

  const completedProjects = await getCompletedResearchListForResearcher(
    Number(session.id)
  );

  return (
    <CompletedResearchListClient
      completedProjects={completedProjects}
    />
  );
}

