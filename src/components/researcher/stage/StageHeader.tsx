"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Save,
  Clock,
  Sparkles,
  CheckCircle2,
  Check,
  Lock,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StageStatusBadge from "./StageStatusBadge";
import StageNavigation from "./StageNavigation";
import {
  OFFICIAL_STAGES,
  getStageByNumber,
  getStageUrl,
  type StageDefinition,
} from "./stageConstants";

export interface StageHeaderProps {
  projectId: number;
  projectTitle: string;
  plantName?: string;
  plantScientificName?: string;
  stageNumber: number;
  stageTitle?: string;
  stageSubtitle?: string;
  stageStatus: string;
  stageMap?: Record<string, string>;
  projectStatus?: string;
  isSaving?: boolean;
  lastSaved?: string | null;
  onSave?: () => void;
  canAdvance?: boolean;
  onAdvance?: () => void;
  advanceLabel?: string;
  isAdvancing?: boolean;
  guideContent?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

const STAGE_THEMES: Record<
  number,
  {
    gradient: string;
    glow: string;
    iconBg: string;
    iconColor: string;
    borderColor: string;
    completedBorder: string;
    completedBg: string;
    completedText: string;
  }
> = {
  1: {
    gradient: "from-emerald-600 to-teal-700",
    glow: "shadow-emerald-600/30 ring-emerald-500/50",
    iconBg: "bg-emerald-100 text-emerald-800",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    completedBorder: "border-emerald-300",
    completedBg: "bg-emerald-50/90",
    completedText: "text-emerald-900",
  },
  2: {
    gradient: "from-cyan-600 to-blue-700",
    glow: "shadow-cyan-600/30 ring-cyan-500/50",
    iconBg: "bg-cyan-100 text-cyan-800",
    iconColor: "text-cyan-600",
    borderColor: "border-cyan-200",
    completedBorder: "border-cyan-300",
    completedBg: "bg-cyan-50/90",
    completedText: "text-cyan-900",
  },
  3: {
    gradient: "from-purple-600 to-indigo-700",
    glow: "shadow-purple-600/30 ring-purple-500/50",
    iconBg: "bg-purple-100 text-purple-800",
    iconColor: "text-purple-600",
    borderColor: "border-purple-200",
    completedBorder: "border-purple-300",
    completedBg: "bg-purple-50/90",
    completedText: "text-purple-900",
  },
  4: {
    gradient: "from-amber-600 to-orange-700",
    glow: "shadow-amber-600/30 ring-amber-500/50",
    iconBg: "bg-amber-100 text-amber-800",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200",
    completedBorder: "border-amber-300",
    completedBg: "bg-amber-50/90",
    completedText: "text-amber-900",
  },
  5: {
    gradient: "from-emerald-700 to-teal-800",
    glow: "shadow-emerald-600/30 ring-emerald-500/50",
    iconBg: "bg-emerald-100 text-emerald-900",
    iconColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    completedBorder: "border-emerald-300",
    completedBg: "bg-emerald-50/90",
    completedText: "text-emerald-900",
  },
  6: {
    gradient: "from-slate-700 to-blue-900",
    glow: "shadow-slate-600/30 ring-slate-500/50",
    iconBg: "bg-slate-200 text-slate-800",
    iconColor: "text-slate-600",
    borderColor: "border-slate-200",
    completedBorder: "border-slate-300",
    completedBg: "bg-slate-50/90",
    completedText: "text-slate-900",
  },
};

export default function StageHeader({
  projectId,
  projectTitle,
  plantName,
  plantScientificName,
  stageNumber,
  stageTitle,
  stageSubtitle,
  stageStatus,
  stageMap = {},
  projectStatus = "IN_PROGRESS",
  isSaving = false,
  lastSaved,
  onSave,
  canAdvance = true,
  onAdvance,
  advanceLabel,
  isAdvancing = false,
  guideContent,
  breadcrumbs,
  className = "",
}: StageHeaderProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  const stageDef = getStageByNumber(stageNumber);
  const title = stageTitle || stageDef.label;
  const subtitle = stageSubtitle || stageDef.subtitle;
  const StageIcon = stageDef.icon;

  const prevStage =
    stageNumber > 1 ? OFFICIAL_STAGES.find((s) => s.number === stageNumber - 1) : null;
  const nextStage =
    stageNumber < 6 ? OFFICIAL_STAGES.find((s) => s.number === stageNumber + 1) : null;

  const isCompleted = stageStatus === "COMPLETED";

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* 1. TOP CONTEXT BAR (Minimal Breadcrumb + Plant Badge + Actions) */}
      <div className="flex items-center justify-between text-xs px-1 text-[#78997f]">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
          <Link href="/researcher/projects" className="hover:text-[#0f2c20] transition-colors truncate">
            Projects
          </Link>
          <span className="text-[#b4c8b9]">/</span>
          <Link
            href={`/researcher/projects/${projectId}`}
            className="font-semibold text-[#16a34a] hover:text-[#0f2c20] transition-colors truncate max-w-[150px] sm:max-w-xs"
            title={projectTitle}
          >
            {projectTitle}
          </Link>
          <span className="text-[#b4c8b9]">/</span>
          <span className="font-bold text-[#0f2c20] truncate">Stage {stageNumber}</span>
        </nav>

        <Link
          href={`/researcher/projects/${projectId}`}
          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#1e5c44] hover:text-[#0f2c20] hover:underline transition-all"
        >
          <Layers className="w-3 h-3 text-[#16a34a]" />
          <span>Project Workspace</span>
        </Link>
      </div>

      {/* 2. EXECUTIVE STAGE BANNER BAR (Single Row) */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#dde6df] shadow-xs px-3 sm:px-4 py-2 flex items-center justify-between gap-3 relative"
      >
        {/* LEFT: Stage Identity, Plant & Status */}
        <div className="flex items-center gap-2.5 min-w-0 shrink">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 2 }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${stageDef.accentBg} ${stageDef.accentBorder} border flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <StageIcon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${stageDef.accentText}`} />
          </motion.div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="px-1.5 py-0.5 rounded-md bg-[#0f2c20] text-emerald-300 font-mono text-[10px] sm:text-[11px] font-extrabold tracking-wider shrink-0">
              {String(stageNumber).padStart(2, "0")}
            </span>
            <h1 className="text-xs sm:text-sm font-heading font-extrabold text-[#0f2c20] tracking-tight truncate">
              {title}
            </h1>
          </div>

          {plantName && (
            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-[11px] font-bold shrink-0">
              <span>{plantName}</span>
              {plantScientificName && (
                <span className="italic font-normal text-emerald-700/80">({plantScientificName})</span>
              )}
            </div>
          )}

          <div className="shrink-0 hidden md:block">
            <StageStatusBadge status={stageStatus} size="sm" />
          </div>
        </div>

        {/* RIGHT: Minimal Controls in the same 1 row */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setGuideOpen(!guideOpen)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              guideOpen
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs"
                : "bg-[#f4f6f4] text-[#475550] border border-[#dde6df] hover:border-[#16a34a] hover:text-[#0f2c20]"
            }`}
            title="Toggle Stage Guide"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#dde6df] bg-white hover:bg-[#f6f8f6] text-xs font-bold text-[#0f2c20] transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">{isSaving ? "Saving..." : "Save"}</span>
            </button>
          )}

          {prevStage && (
            <Link
              href={getStageUrl(projectId, prevStage.path)}
              className="p-1.5 rounded-xl border border-[#dde6df] bg-white text-[#0f2c20] hover:bg-[#f6f8f6] hover:border-[#16a34a] transition-all shadow-2xs"
              title={`Previous: Stage ${prevStage.number} - ${prevStage.label}`}
            >
              <ChevronLeft className="w-4 h-4 text-[#16a34a]" />
            </Link>
          )}

          {stageNumber === 6 ? (
            isCompleted && (
              <Link
                href={`/researcher/projects/${projectId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done</span>
              </Link>
            )
          ) : onAdvance ? (
            <button
              type="button"
              onClick={onAdvance}
              disabled={!canAdvance || isAdvancing}
              className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{advanceLabel || "Next Stage"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : nextStage ? (
            <Link
              href={getStageUrl(projectId, nextStage.path)}
              className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs transition-all"
              title={`Next: Stage ${nextStage.number} - ${nextStage.label}`}
            >
              <span>Next Stage</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : null}
        </div>
      </motion.div>

      {/* 3. PROMINENT 1-ROW 6-STAGE PIPELINE (HIGH VISIBILITY, VIBRANT COLORS & ICONS) */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-[#dde6df] p-1.5 sm:p-2 shadow-xs">
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {OFFICIAL_STAGES.map((st, idx) => {
            const isCurrent = st.number === stageNumber;
            const isStageCompleted =
              (stageMap[st.key] || stageMap[st.path]) === "COMPLETED" || st.number < stageNumber;
            const isLocked = st.number > stageNumber && !isStageCompleted;
            const href = getStageUrl(projectId, st.path);
            const theme = STAGE_THEMES[st.number] || STAGE_THEMES[1];
            const NodeIcon = st.icon;

            return (
              <React.Fragment key={st.number}>
                {idx > 0 && (
                  <div
                    className={`h-[2px] w-1.5 sm:w-2.5 xl:w-3.5 shrink-0 transition-all duration-300 ${
                      st.number <= stageNumber
                        ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                        : "bg-slate-200"
                    }`}
                  />
                )}

                <motion.div
                  whileHover={{ y: isLocked ? 0 : -2, scale: isLocked ? 1 : 1.03 }}
                  whileTap={{ scale: isLocked ? 1 : 0.97 }}
                  className="relative flex-1 min-w-[70px] sm:min-w-0"
                >
                  {isLocked ? (
                    <div
                      className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-slate-400 cursor-not-allowed select-none transition-all"
                      title={`${st.number}. ${st.label} (Locked)`}
                    >
                      <NodeIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-400">
                        {String(st.number).padStart(2, "0")}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 truncate hidden lg:inline">
                        {st.shortLabel}
                      </span>
                    </div>
                  ) : (
                    <Link
                      href={href}
                      className={`group flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? `bg-gradient-to-r ${theme.gradient} text-white shadow-sm ring-2 ${theme.glow} font-bold`
                          : isStageCompleted
                          ? `${theme.completedBg} ${theme.completedText} ${theme.completedBorder} hover:shadow-xs`
                          : `bg-white text-slate-600 border-slate-200 hover:${theme.borderColor} hover:text-slate-900 hover:shadow-2xs`
                      }`}
                      title={`Stage ${st.number}: ${st.label}`}
                    >
                      {/* Stage Thematic Icon */}
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isCurrent
                            ? "bg-white/20 text-white"
                            : isStageCompleted
                            ? theme.iconBg
                            : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                        }`}
                      >
                        {isStageCompleted && !isCurrent ? (
                          <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                        ) : (
                          <NodeIcon className={`w-3 h-3 ${isCurrent ? "text-white" : ""}`} />
                        )}
                      </div>

                      {/* Stage Number */}
                      <span
                        className={`font-mono text-[10px] sm:text-[11px] font-extrabold ${
                          isCurrent
                            ? "text-white"
                            : isStageCompleted
                            ? "text-emerald-800"
                            : "text-slate-600"
                        }`}
                      >
                        {String(st.number).padStart(2, "0")}
                      </span>

                      {/* Stage Short Label */}
                      <span
                        className={`text-[11px] font-bold tracking-tight truncate hidden md:inline ${
                          isCurrent
                            ? "text-white"
                            : isStageCompleted
                            ? theme.completedText
                            : "text-slate-700"
                        }`}
                      >
                        {st.shortLabel}
                      </span>

                      {/* Pulsing Active Indicator Dot */}
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shrink-0 hidden sm:block" />
                      )}
                    </Link>
                  )}
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Expandable Collapsible Stage Guide Panel */}
      <AnimatePresence>
        {guideOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3.5 rounded-xl bg-[#faf9f5] border border-[#dde6df] space-y-2 text-xs text-[#33413b]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-[#0f2c20]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stage Methodology & Scientific Scope</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#78997f]">
                  NaturAide Botanical Standard
                </span>
              </div>
              <p className="leading-relaxed text-[#475550]">{stageDef.description}</p>
              {guideContent && <div className="pt-1">{guideContent}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
