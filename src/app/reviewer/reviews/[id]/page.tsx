import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DossierReviewWorkspaceClient from "@/components/reviewer/DossierReviewWorkspaceClient";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReviewDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "REVIEWER") {
    redirect("/login");
  }

  const { id } = await params;
  const assignmentId = parseInt(id, 10);
  if (isNaN(assignmentId)) {
    redirect("/reviewer");
  }

  return <DossierReviewWorkspaceClient assignmentId={assignmentId} />;
}
