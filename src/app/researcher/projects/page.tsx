import React, { Suspense } from "react";
import ResearchProjectsManager from "@/components/researcher/projects/ResearchProjectsManager";
import { Loader2 } from "lucide-react";

export const instant = false;

export default function ResearcherProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-[#475550] font-semibold">Loading research projects...</p>
        </div>
      }
    >
      <ResearchProjectsManager />
    </Suspense>
  );
}
