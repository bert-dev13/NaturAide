import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RoleCheckingWorkspaceClient from "@/components/reviewer/RoleCheckingWorkspaceClient";

export const instant = false;

export default async function RoleCheckingPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ projectId?: string; assignmentId?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "REVIEWER") {
    redirect("/login");
  }

  const { role } = await params;
  const sp = await searchParams;
  const initialProjectId = sp.projectId ? parseInt(sp.projectId, 10) : null;
  const initialAssignmentId = sp.assignmentId ? parseInt(sp.assignmentId, 10) : null;

  return (
    <RoleCheckingWorkspaceClient
      role={role}
      initialProjectId={initialProjectId}
      initialAssignmentId={initialAssignmentId}
    />
  );
}

