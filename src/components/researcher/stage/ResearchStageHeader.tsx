"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Dna,
  FileCheck,
  FlaskConical,
  Layers,
  Leaf,
  Microscope,
  Pill,
  ShieldCheck,
  Sparkles,
  Sprout,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

export interface ResearchStageHeaderProps {
  projectId: number;
  stageNumber: number; // 1 to 6
  totalStages?: number; // default: 6
  stageTitle?: string | null;
  title?: string | null;
  plantCommonName?: string | null;
  plantName?: string | null;
  plantScientificName?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  complete?: boolean;
  contextualAction?: React.ReactNode;
  backHref?: string | null;
  backLabel?: string | null;
  className?: string;
}

const DEFAULT_TITLES: Record<number, string> = {
  1: "Plant & Literature Research",
  2: "In-Silico Analysis",
  3: "Molecular Docking",
  4: "Formulation & Safety",
  5: "Research Integration",
  6: "Final Professional Review",
};

const STAGE_ICONS: Record<number, LucideIcon> = {
  1: Sprout,
  2: Dna,
  3: Microscope,
  4: FlaskConical,
  5: Layers,
  6: ShieldCheck,
};

export function ResearchStageHeader({
  projectId,
  stageNumber,
  totalStages = 6,
  stageTitle,
  title,
  plantCommonName,
  plantName,
  plantScientificName,
  status,
  statusLabel,
  complete = false,
  contextualAction,
  backHref,
  backLabel = "Back to Project",
  className = "",
}: ResearchStageHeaderProps) {
  const effectiveTitle = stageTitle || title || DEFAULT_TITLES[stageNumber] || `Stage ${stageNumber}`;
  const effectivePlantName = (plantCommonName || plantName || "").trim();
  const effectiveStatus = statusLabel || status || (complete ? "Completed" : "In Progress");

  const isCompleted =
    complete ||
    effectiveStatus.toLowerCase().includes("completed") ||
    effectiveStatus.toLowerCase().includes("approved");
  const isUnderReview = effectiveStatus.toLowerCase().includes("review");
  const isRevisions = effectiveStatus.toLowerCase().includes("revision");

  const StageIcon = STAGE_ICONS[stageNumber] || Sprout;

  return (
    <div className={`w-full space-y-2.5 font-sans ${className}`}>
      {/* Top Navigation: ← Back to Project */}
      <div className="flex items-center justify-between px-0.5">
        <Link
          href={backHref || `/researcher/projects/${projectId}`}
          className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#52645d] hover:text-[#0f2c20] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 transition-transform group-hover:-translate-x-1" />
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Main Luxury Compact Emerald Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-emerald-700/40 bg-gradient-to-br from-[#072418] via-[#0d3626] to-[#041910] px-5 py-4 text-white shadow-xl shadow-emerald-950/20 sm:px-6 sm:py-4.5"
      >
        {/* Ambient subtle light glows */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-2xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-12 h-36 w-36 rounded-full bg-teal-400/10 blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Stage badge, icon, title, botanical specimen */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 text-[#051a11] font-mono text-[10px] font-black uppercase tracking-wider shadow-sm shadow-emerald-500/25">
                <StageIcon className="w-3 h-3 text-[#051a11]" />
                <span>Stage {stageNumber} of {totalStages}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate drop-shadow-2xs">
              {effectiveTitle}
            </h1>

            {(effectivePlantName || plantScientificName) && (
              <p className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {effectivePlantName && (
                  <span className="font-extrabold text-emerald-300">{effectivePlantName}</span>
                )}
                {plantScientificName && (
                  <span className="font-serif italic text-emerald-100/80">
                    · {plantScientificName}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Right: Glassmorphic status badge & contextual action */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-inner transition-colors ${
                isCompleted
                  ? "bg-emerald-950/80 border border-emerald-400/50 text-emerald-300"
                  : isRevisions
                  ? "bg-amber-950/80 border border-amber-400/50 text-amber-200"
                  : isUnderReview
                  ? "bg-teal-950/80 border border-teal-400/50 text-teal-200"
                  : "bg-emerald-950/70 border border-emerald-500/40 text-emerald-300"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : isRevisions ? (
                <TriangleAlert className="w-3.5 h-3.5 text-amber-400" />
              ) : isUnderReview ? (
                <Clock className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              )}
              <span className="font-mono text-[11px] uppercase tracking-wider">{effectiveStatus}</span>
            </span>

            {/* Optional Contextual Action Slot */}
            {contextualAction}
          </div>
        </div>
      </motion.header>
    </div>
  );
}

export default ResearchStageHeader;
