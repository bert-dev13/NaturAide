import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ReviewWorkspaceClient from "@/components/reviewer/ReviewWorkspaceClient";

export const instant = false;

export default async function AssignedReviewsPage() {
  const session = await getSession();
  if (!session || session.role !== "REVIEWER") {
    redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading assigned reviews...
        </div>
      }
    >
      <ReviewWorkspaceClient />
    </Suspense>
  );
}
