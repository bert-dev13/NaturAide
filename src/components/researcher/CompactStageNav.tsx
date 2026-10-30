"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers, Lock } from "lucide-react";
import { WORKFLOW_STAGES, getStageUrl } from "@/lib/workflow-stages";

interface CompactStageNavProps {
  projectId: number;
  projectTitle: string;
  stageNumber: number;
  stageTitle?: string;
  stageKey?: string;
  isNextLocked?: boolean;
  className?: string;
}

export default function CompactStageNav({
  projectId,
  projectTitle,
  stageNumber,
  stageTitle,
  stageKey,
  isNextLocked = false,
  className = "",
}: CompactStageNavProps) {
  // Find current, previous, and next stage definitions
  const currentStage =
    WORKFLOW_STAGES.find((s) => s.number === stageNumber || s.key === stageKey) ||
    WORKFLOW_STAGES[0];

  const prevStage =
    currentStage.number > 1
      ? WORKFLOW_STAGES.find((s) => s.number === currentStage.number - 1)
      : null;

  const nextStage =
    currentStage.number < 6
      ? WORKFLOW_STAGES.find((s) => s.number === currentStage.number + 1)
      : null;

  const stageLabel = stageTitle || currentStage.label;
  const stageFormattedNum = String(currentStage.number).padStart(2, "0");

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 1. SIMPLE BREADCRUMBS */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs text-[#78997f]"
      >
        <Link
          href="/researcher/projects"
          className="font-medium hover:text-[#0f2c20] transition-colors"
        >
          My Research Projects
        </Link>
        <span className="text-[#b4c8b9]">/</span>
        <Link
          href={`/researcher/projects/${projectId}`}
          className="font-bold text-[#16a34a] hover:text-[#0f2c20] transition-colors truncate max-w-[200px] sm:max-w-md"
          title={projectTitle}
        >
          {projectTitle}
        </Link>
        <span className="text-[#b4c8b9]">/</span>
        <span className="font-extrabold text-[#0f2c20]">
          {stageLabel}
        </span>
      </nav>

      {/* 2. COMPACT STAGE NAVIGATION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-[#dde6df] shadow-2xs">
        {/* Left: Project title & stage indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0f2c20] text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {stageFormattedNum}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#0f2c20] truncate">
              {projectTitle}
            </p>
            <p className="text-[11px] text-[#78997f]">
              Stage {currentStage.number} of 6 &bull;{" "}
              <span className="font-semibold text-[#1e5c44]">{stageLabel}</span>
            </p>
          </div>
        </div>

        {/* Right: Step controls & View Research Journey CTA */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Previous Stage */}
          {prevStage ? (
            <Link
              href={getStageUrl(projectId, prevStage.key)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#dde6df] bg-white text-xs font-bold text-[#0f2c20] hover:bg-[#f6f8f6] hover:border-[#16a34a] transition-all"
              title={`Previous: Stage ${prevStage.number} - ${prevStage.label}`}
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#16a34a]" />
              <span className="hidden sm:inline">Previous</span>
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#edf2ee] bg-[#fafafa] text-xs font-medium text-slate-300 cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Previous</span>
            </button>
          )}

          {/* Current Stage Pill */}
          <span className="px-3 py-1.5 rounded-xl bg-[#0f2c20] text-emerald-300 text-xs font-bold shadow-2xs whitespace-nowrap">
            {stageFormattedNum} {stageLabel}
          </span>

          {/* Next Stage */}
          {nextStage ? (
            isNextLocked ? (
              <button
                disabled
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-400 cursor-not-allowed"
                title="Complete the current research stage to continue."
              >
                <span className="hidden sm:inline">Next</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </button>
            ) : (
              <Link
                href={getStageUrl(projectId, nextStage.key)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#dde6df] bg-white text-xs font-bold text-[#0f2c20] hover:bg-[#f6f8f6] hover:border-[#16a34a] transition-all"
                title={`Next: Stage ${nextStage.number} - ${nextStage.label}`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#16a34a]" />
              </Link>
            )
          ) : null}

          {/* View Research Journey button */}
          <Link
            href={`/researcher/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-[#0f2c20] hover:bg-emerald-100 transition-colors shadow-2xs ml-1"
            title="Return to Project Workspace"
          >
            <Layers className="w-3.5 h-3.5 text-[#16a34a]" />
            <span>Project Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
