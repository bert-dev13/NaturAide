"use client";

import React from "react";
import Link from "next/link";
import { Clock, Save } from "lucide-react";
import WorkflowNavigator from "./WorkflowNavigator";
import CompactStageNav from "./CompactStageNav";

interface StagePageHeaderProps {
  projectId: number;
  projectTitle: string;
  plantName: string;
  plantScientificName?: string;
  stageKey: string;
  stageNumber: number;
  stageTitle: string;
  stageSubtitle: string;
  stageStatus: string;
  stageMap?: Record<string, string>;
  isSaving?: boolean;
  lastSaved?: string | null;
  onSave?: () => void;
  nextStageKey?: string;
}

export default function StagePageHeader({
  projectId,
  projectTitle,
  plantName,
  plantScientificName,
  stageKey,
  stageNumber,
  stageTitle,
  stageSubtitle,
  stageStatus,
  stageMap = {},
  isSaving = false,
  lastSaved,
  onSave,
  nextStageKey,
}: StagePageHeaderProps) {
  const isCompleted = stageStatus === "COMPLETED";

  return (
    <div className="space-y-4">
      {/* 1. COMPACT STAGE NAVIGATION & BREADCRUMBS */}
      <CompactStageNav
        projectId={projectId}
        projectTitle={projectTitle}
        stageNumber={stageNumber}
        stageTitle={stageTitle}
        stageKey={stageKey}
      />

      {/* 2. MAIN STAGE BANNER CARD */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde6df] space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0f2c20] text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                Stage {stageNumber} of 6
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                {plantName}{" "}
                {plantScientificName && (
                  <span className="italic font-normal">({plantScientificName})</span>
                )}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isCompleted
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    : stageStatus === "IN_PROGRESS"
                    ? "bg-teal-100 text-teal-900 border border-teal-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {stageStatus.replace(/_/g, " ")}
              </span>
            </div>

            <h1 className="text-2xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
              {stageTitle}
            </h1>
            <p className="text-xs text-[#475550] max-w-2xl leading-relaxed">
              {stageSubtitle}
            </p>
          </div>

          {/* Action Button & Autosave Status */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSaving ? "Saving..." : "Save Stage Progress"}</span>
              </button>
            )}

            {lastSaved && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#78997f]">
                <Clock className="w-3 h-3 text-[#16a34a]" />
                <span>
                  Last saved{" "}
                  {new Date(lastSaved).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 12-stage workflow visual bar */}
        <WorkflowNavigator
          projectId={projectId}
          stagesStatus={stageMap}
          currentStageKey={stageKey}
        />
      </div>
    </div>
  );
}
