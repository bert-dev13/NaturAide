import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getCompletedResearchDetail,
  type CompletedResearchDetail,
} from "@/lib/research-approval-completion-service";
import CompletedResearchDetailClient from "@/components/researcher/completed/CompletedResearchDetailClient";

function DossierLoading() {
  return (
    <div className="w-full min-w-0 space-y-4 pb-16">
      <div className="h-36 animate-pulse rounded-2xl border border-[#d7e4dc] bg-white" />
      <div className="h-64 animate-pulse rounded-2xl border border-[#d7e4dc] bg-white" />
    </div>
  );
}

export default async function CompletedResearchDetailPage({
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

  let detail: CompletedResearchDetail | null = null;
  let isForbidden = false;

  try {
    detail = await getCompletedResearchDetail(projectId, {
      id: Number(session.id),
      role: String(session.role),
    });
  } catch (error: unknown) {
    const errObj = error as { statusCode?: number };
    if (errObj?.statusCode === 403) {
      isForbidden = true;
    }
  }

  if (isForbidden) {
    redirect("/researcher/completed");
  }

  if (!detail) {
    notFound();
  }

  return (
    <Suspense fallback={<DossierLoading />}>
      <CompletedResearchDetailClient detail={detail} />
    </Suspense>
  );
}
