import React, { Suspense } from "react";
import ResearchProjectsManager from "@/components/researcher/projects/ResearchProjectsManager";
import ProjectsLoadingFallback from "@/components/researcher/projects/ProjectsLoadingFallback";

export const instant = false;

export default function ResearcherProjectsPage() {
  return (
    <Suspense fallback={<ProjectsLoadingFallback />}>
      <ResearchProjectsManager />
    </Suspense>
  );
}
