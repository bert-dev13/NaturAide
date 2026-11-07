import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import ProjectReviewWorkspaceClient from "@/components/reviewer/ProjectReviewWorkspaceClient";
import { normalizeReviewAreaKey } from "@/lib/expert-review-areas";

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
  const specialty = normalizeReviewAreaKey(role);

  let targetProjectId = sp.projectId ? parseInt(sp.projectId, 10) : null;

  if (!targetProjectId && sp.assignmentId) {
    const [assRows]: any = await pool.query(
      "SELECT projectId FROM review_assignments WHERE id = ? LIMIT 1",
      [parseInt(sp.assignmentId, 10)]
    );
    if (assRows.length > 0) {
      targetProjectId = Number(assRows[0].projectId);
    }
  }

  if (!targetProjectId) {
    const [subRows]: any = await pool.query(
      "SELECT projectId FROM review_submissions ORDER BY id DESC LIMIT 1"
    );
    if (subRows.length > 0) {
      targetProjectId = Number(subRows[0].projectId);
    }
  }

  if (!targetProjectId) {
    redirect("/reviewer");
  }

  return (
    <ProjectReviewWorkspaceClient
      projectId={targetProjectId}
      initialSpecialty={specialty}
      initialTab="evaluation"
    />
  );
}
