"use client";

import React from "react";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";
import StageStatusBadge from "./StageStatusBadge";
import StageProgress from "./StageProgress";

export interface RequirementItem {
  id: string;
  label: string;
  met: boolean;
  hint?: string;
}

export interface MetricItem {
  label: string;
  value: string | number;
  icon?: React.ElementType;
}

export interface StageSummaryProps {
  stageNumber: number;
  stageTitle: string;
  stageStatus: string;
  requirements?: RequirementItem[];
  metrics?: MetricItem[];
  warnings?: string[];
  reviewerStatus?: string;
  completionPercentage?: number;
  nextStepText?: string;
  extraContent?: React.ReactNode;
  className?: string;
}

export default function StageSummary({
  stageNumber,
  stageTitle,
  stageStatus,
  requirements = [],
  metrics = [],
  warnings = [],
  reviewerStatus,
  completionPercentage,
  nextStepText,
  extraContent,
  className = "",
}: StageSummaryProps) {
  const metCount = requirements.filter((r) => r.met).length;
  const totalCount = requirements.length;
  const allMet = totalCount > 0 && metCount === totalCount;

  return (
    <div className={`w-full bg-white/95 backdrop-blur-md rounded-2xl border border-[#dde6df] shadow-xs p-2.5 sm:p-3 ${className}`}>
      <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-3 text-xs">
        {/* 1. STAGE STATUS & PROGRESS PILL */}
        <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-[#edf2ee]">
          <StageStatusBadge status={stageStatus} size="sm" />
          <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-[#52645d]">
            <span className="text-[#0f2c20] font-extrabold">Stage {stageNumber}</span>
            <span className="text-slate-400">/ 06</span>
            {completionPercentage !== undefined && (
              <span className="ml-1 px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                {completionPercentage}%
              </span>
            )}
          </div>
          {reviewerStatus && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold">
              {reviewerStatus}
            </span>
          )}
        </div>

        {/* 2. STAGE REQUIREMENTS (0 / 4) IN 1 ROW */}
        {requirements.length > 0 && (
          <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-[#edf2ee]">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#78997f]">
                Requirements
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] font-extrabold ${
                  allMet
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}
              >
                {metCount}/{totalCount}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                    req.met
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs"
                      : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}
                  title={req.hint ? `${req.label} — ${req.hint}` : req.label}
                >
                  {req.met ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 text-slate-300 shrink-0" />
                  )}
                  <span className="truncate max-w-[95px] 2xl:max-w-none">{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. STAGE RECORDS / METRICS IN 1 ROW */}
        {metrics.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-[#edf2ee]">
            {metrics.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#faf9f5] border border-[#dde6df]"
              >
                {m.icon && <m.icon className="w-3 h-3 text-emerald-600 shrink-0" />}
                <span className="text-[10px] text-[#78997f] font-semibold">{m.label}:</span>
                <span className="font-mono text-[10px] font-extrabold text-[#0f2c20] truncate max-w-[85px]">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 4. NEXT SUGGESTED ACTION */}
        {nextStepText && (
          <div className="flex items-center gap-1.5 min-w-0 shrink text-[11px] text-[#52645d]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate font-medium text-[#475550]">{nextStepText}</span>
          </div>
        )}
      </div>

      {/* Warnings if any */}
      {warnings.length > 0 && (
        <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center gap-2 text-xs text-amber-900">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="font-semibold">{warnings.join(" • ")}</span>
        </div>
      )}

      {extraContent}
    </div>
  );
}
