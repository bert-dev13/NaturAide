import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ResearcherRevisionsHubClient from "@/components/researcher/revisions/ResearcherRevisionsHubClient";
import { Loader2 } from "lucide-react";

export default async function ResearcherRevisionsHubPage() {
  const session = await getSession();
  if (!session || session.role !== "RESEARCHER") {
    redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-600">Loading Revisions Hub...</span>
          </div>
        </div>
      }
    >
      <ResearcherRevisionsHubClient />
    </Suspense>
  );
}
