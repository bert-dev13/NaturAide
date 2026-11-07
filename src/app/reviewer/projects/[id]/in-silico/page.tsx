import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProjectReviewWorkspaceClient from "@/components/reviewer/ProjectReviewWorkspaceClient";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReviewerInSilicoPage({ params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "REVIEWER") {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) {
    redirect("/reviewer/projects");
  }

  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading In-Silico Molecular Docking Review...
        </div>
      }
    >
      <ProjectReviewWorkspaceClient
        projectId={projectId}
        initialTab="section2"
      />
    </Suspense>
  );
}

