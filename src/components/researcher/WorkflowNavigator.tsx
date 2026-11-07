"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";

import { WORKFLOW_STAGES, type WorkflowStage, getStageUrl } from "@/lib/workflow-stages";
import { StageIcon } from "./workflow-stage-icons";
export { WORKFLOW_STAGES, type WorkflowStage, getStageUrl };

export default function WorkflowNavigator({
  projectId,
  stagesStatus = {},
  currentStageKey,
}: {
  projectId: number;
  stagesStatus?: Record<string, string>;
  currentStageKey?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="bg-white rounded-2xl border border-[#dde6df] p-3 shadow-2xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#edf2ee] px-2 text-xs">
        <span className="font-bold text-[#0f2c20] uppercase tracking-wider text-[11px]">
          6-Stage Research Journey
        </span>
        <span className="text-[#6b7c76] text-[11px]">
          Click any step to inspect or edit without losing previous data
        </span>
      </div>

      {/* Horizontal step bar with icons & completion indicators */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {WORKFLOW_STAGES.map((stage) => {
          const status = stagesStatus[stage.key] || "NOT_STARTED";
          const isCompleted = status === "COMPLETED";
          const isCurrent =
            currentStageKey === stage.key ||
            pathname.includes(`/projects/${projectId}/${stage.key}`);

          return (
            <Link
              key={stage.key}
              href={getStageUrl(projectId, stage.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                isCurrent
                  ? "bg-[#0f2c20] text-white shadow-xs font-bold"
                  : isCompleted
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
                  : "bg-[#f6f8f6] text-[#475550] border border-[#dde6df] hover:border-[#16a34a] hover:text-[#0f2c20]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                  isCurrent
                    ? "bg-emerald-400 text-[#0f2c20] font-extrabold"
                    : isCompleted
                    ? "bg-emerald-600 text-white"
                    : "bg-[#dde6df] text-[#475550]"
                }`}
              >
                {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : stage.number}
              </div>

              <StageIcon stageKey={stage.key} className="w-3.5 h-3.5 shrink-0" />
              <span>{stage.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
