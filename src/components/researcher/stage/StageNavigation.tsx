"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CircleDot,
  Clock,
  AlertCircle,
  Circle,
  Lock,
  Layers,
  X,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  OFFICIAL_STAGES,
  getStageUrl,
  resolveStageStatus,
  type StageProgressStatus,
} from "./stageConstants";

interface StageNavigationProps {
  projectId: number;
  projectTitle?: string;
  currentStageNumber: number;
  stagesStatus?: Record<string, string>;
  projectStatus?: string;
  isNextLocked?: boolean;
  canAdvance?: boolean;
  onAdvanceStage?: () => void;
  advanceButtonLabel?: string;
  isAdvancing?: boolean;
  className?: string;
}

export default function StageNavigation({
  projectId,
  projectTitle = "Research Project",
  currentStageNumber,
  stagesStatus = {},
  projectStatus = "IN_PROGRESS",
  isNextLocked = false,
  canAdvance = true,
  onAdvanceStage,
  advanceButtonLabel,
  isAdvancing = false,
  className = "",
}: StageNavigationProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const prevStage =
    currentStageNumber > 1
      ? OFFICIAL_STAGES.find((s) => s.number === currentStageNumber - 1)
      : null;

  const nextStage =
    currentStageNumber < 8
      ? OFFICIAL_STAGES.find((s) => s.number === currentStageNumber + 1)
      : null;

  const currentStageDef =
    OFFICIAL_STAGES.find((s) => s.number === currentStageNumber) || OFFICIAL_STAGES[0];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ========================================================
          DESKTOP 6-STAGE COMPACT PIPELINE (>= md)
          ======================================================== */}
      <div className="hidden md:block bg-white/80 backdrop-blur-xs rounded-2xl border border-[#dde6df] p-3 shadow-2xs">
        <div className="relative flex items-center justify-between px-2">
          {OFFICIAL_STAGES.map((st, index) => {
            const status: StageProgressStatus = resolveStageStatus(
              st.number,
              currentStageNumber,
              stagesStatus[st.key] || stagesStatus[st.path],
              projectStatus
            );

            const isCurrent = st.number === currentStageNumber;
            const isCompleted = status === "COMPLETED";
            const isLocked = status === "LOCKED";
            const isUnderReview = status === "UNDER_REVIEW";
            const isNeedsRevision = status === "NEEDS_REVISION";

            // Clickable if completed, current, or under review/revision
            const isClickable = !isLocked || isCurrent;

            // Icon for status
            let NodeIcon = Circle;
            let nodeStyle = "bg-[#f1f5f2] border-slate-300 text-slate-400";
            let lineStyle = "bg-[#e2ebe4]";

            if (isCompleted) {
              NodeIcon = Check;
              nodeStyle = "bg-emerald-600 border-emerald-600 text-white shadow-xs";
              lineStyle = "bg-emerald-500";
            } else if (isCurrent) {
              NodeIcon = CircleDot;
              nodeStyle =
                "bg-white border-2 border-emerald-600 text-emerald-700 ring-4 ring-emerald-100 shadow-sm";
            } else if (isUnderReview) {
              NodeIcon = Clock;
              nodeStyle = "bg-amber-100 border-amber-400 text-amber-800";
            } else if (isNeedsRevision) {
              NodeIcon = AlertCircle;
              nodeStyle = "bg-orange-100 border-orange-400 text-orange-800";
            } else if (isLocked) {
              NodeIcon = Lock;
              nodeStyle = "bg-[#f4f6f4] border-slate-200 text-slate-300";
            }

            const stageHref = getStageUrl(projectId, st.path);

            return (
              <React.Fragment key={st.number}>
                {/* Connecting Line */}
                {index > 0 && (
                  <div
                    className={`h-[2px] flex-1 mx-1 transition-all ${
                      st.number <= currentStageNumber ? "bg-emerald-500" : "bg-[#e2ebe4]"
                    }`}
                  />
                )}

                {/* Stage Node */}
                <div
                  className="relative flex flex-col items-center"
                  onMouseEnter={() => setHoveredStage(st.number)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  {isClickable ? (
                    <Link
                      href={stageHref}
                      className={`group flex items-center justify-center w-7 h-7 rounded-full border transition-all cursor-pointer ${nodeStyle} ${
                        isCurrent ? "scale-110" : "hover:scale-105"
                      }`}
                      title={`${st.number}. ${st.label}`}
                    >
                      <NodeIcon
                        className={`w-3.5 h-3.5 ${
                          isCompleted ? "stroke-[2.5]" : isCurrent ? "stroke-[2.5]" : ""
                        }`}
                      />
                    </Link>
                  ) : (
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-full border cursor-not-allowed ${nodeStyle}`}
                      title={`${st.number}. ${st.label} (Locked - Complete preceding stages)`}
                    >
                      <NodeIcon className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Stage Number Label Below */}
                  <span
                    className={`mt-1 text-[10px] font-mono font-bold tracking-tight transition-colors ${
                      isCurrent
                        ? "text-emerald-800 font-extrabold"
                        : isCompleted
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    {String(st.number).padStart(2, "0")}
                  </span>

                  {/* Hover Floating Tooltip */}
                  {hoveredStage === st.number && (
                    <div className="absolute -top-11 z-30 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#0f2c20] text-white text-[11px] font-semibold shadow-md flex items-center gap-1.5 animate-fadeIn">
                      <span className="text-emerald-400 font-mono font-extrabold">
                        {String(st.number).padStart(2, "0")}
                      </span>
                      <span>{st.label}</span>
                      {isLocked && <span className="text-slate-400 text-[10px]">• Locked</span>}
                      {isCompleted && <span className="text-emerald-300 text-[10px]">• Done</span>}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          MOBILE COMPACT STAGE BAR (< md)
          ======================================================== */}
      <div className="md:hidden flex items-center justify-between gap-2 p-2.5 bg-white rounded-2xl border border-[#dde6df] shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-xl bg-[#0f2c20] text-emerald-300 font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
            {String(currentStageNumber).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#0f2c20] truncate">
              {currentStageDef.label}
            </p>
            <p className="text-[10px] text-[#78997f]">
              Stage {currentStageNumber} of 6
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 shrink-0"
        >
          <Layers className="w-3.5 h-3.5 text-[#16a34a]" />
          <span>Journey</span>
        </button>
      </div>

      {/* ========================================================
          MOBILE JOURNEY DRAWER MODAL
          ======================================================== */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#dde6df] shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#dde6df]">
                <div>
                  <h3 className="text-sm font-bold text-[#0f2c20]">
                    6-Stage Research Journey
                  </h3>
                  <p className="text-xs text-[#78997f]">{projectTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {OFFICIAL_STAGES.map((st) => {
                  const status = resolveStageStatus(
                    st.number,
                    currentStageNumber,
                    stagesStatus[st.key] || stagesStatus[st.path],
                    projectStatus
                  );
                  const isCurrent = st.number === currentStageNumber;
                  const isCompleted = status === "COMPLETED";
                  const isLocked = status === "LOCKED";
                  const isClickable = !isLocked || isCurrent;
                  const Icon = st.icon;

                  return (
                    <div
                      key={st.number}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        isCurrent
                          ? "bg-[#0f2c20] text-white border-[#0f2c20] font-bold"
                          : isCompleted
                          ? "bg-emerald-50/70 text-emerald-950 border-emerald-200"
                          : isLocked
                          ? "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
                          : "bg-white text-[#0f2c20] border-[#dde6df]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? "bg-emerald-400 text-[#0f2c20]"
                              : isCompleted
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : st.number}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{st.label}</p>
                          <p className={`text-[10px] truncate ${isCurrent ? "text-emerald-200" : "text-slate-500"}`}>
                            {st.subtitle}
                          </p>
                        </div>
                      </div>

                      {isClickable ? (
                        <Link
                          href={getStageUrl(projectId, st.path)}
                          onClick={() => setDrawerOpen(false)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isCurrent
                              ? "bg-emerald-400 text-[#0f2c20]"
                              : "bg-white border border-[#dde6df] text-[#0f2c20] hover:bg-emerald-50"
                          }`}
                        >
                          {isCurrent ? "Active" : "Open"}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
