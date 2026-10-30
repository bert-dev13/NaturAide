"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  ClipboardCheck,
  MessageSquareWarning,
  CheckCircle2,
  PlusCircle,
  FolderGit2,
  ArrowRight,
  Clock,
  RefreshCw,
  Leaf,
  X,
  Cpu,
  Sprout,
  BookOpen,
  Network,
  Database,
  ChevronRight,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getStageUrl } from "@/lib/workflow-stages";

export interface ProjectData {
  id: number;
  title: string;
  status: string;
  currentStage: string;
  progressPercent: number;
  updatedAt: string;
  plantName: string;
  plantScientificName?: string | null;
  shortDescription?: string | null;
  stagesMap?: Record<string, string>;
}

export interface FeedbackData {
  id: number;
  projectId: number;
  projectTitle: string;
  sectionName: string;
  reviewerName: string;
  comment: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface DashboardStats {
  activeCount: number;
  reviewCount: number;
  revisionCount: number;
  completedCount: number;
  totalCount: number;
}

export interface WorkflowStageDef {
  num: string;
  key: string;
  name: string;
  shortName: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const OFFICIAL_WORKFLOW_STAGES: WorkflowStageDef[] = [
  { num: "01", key: "plant-literature", name: "Plant & Literature Research", shortName: "Plant & Lit", desc: "Botanical taxonomy, voucher validation, and literature synthesis", icon: Sprout },
  { num: "02", key: "in-silico", name: "In-Silico Analysis", shortName: "In-Silico", desc: "Computational screening, Lipinski Ro5, and ADME predictions", icon: Cpu },
  { num: "03", key: "docking", name: "Molecular Docking", shortName: "Docking", desc: "AutoDock Vina molecular docking & receptor binding affinity", icon: Network },
  { num: "04", key: "formulation-safety", name: "Formulation & Safety", shortName: "Formulation", desc: "Standardized extract preparation and toxicological safety profile", icon: FlaskConical },
  { num: "05", key: "completion-integration", name: "Research Integration", shortName: "Integration", desc: "Combine the research record into the final dossier", icon: CheckCircle2 },
  { num: "06", key: "expert-review", name: "Final Professional Review", shortName: "Final Review", desc: "Submit the complete dossier once for professional review", icon: ClipboardCheck },
];

export const STAGE_DISPLAY_NAMES: Record<string, string> = {
  "evidence-review": "Plant & Literature Research",
  "evidence": "Plant & Literature Research",
  "plant-literature": "Plant & Literature Research",
  "plant-research": "Plant & Literature Research",
  "plant": "Plant & Literature Research",
  "literature": "Plant & Literature Research",
  "in-silico": "In-Silico Analysis",
  "docking": "Molecular Docking",
  "formulation-safety": "Formulation & Safety",
  "formulation": "Formulation & Safety",
  "safety": "Formulation & Safety",
  "safety-assessment": "Formulation & Safety",
  "laboratory": "Research Integration",
  "completion-integration": "Research Integration",
  "completion": "Research Integration",
  "knowledge-integration": "Research Integration",
  "expert-review": "Final Professional Review",
  "review": "Final Professional Review",
  "revisions": "Final Professional Review",
};

export function getHumanStageName(stageKey: string): string {
  if (!stageKey) return "Research Setup";
  const normalized = stageKey.toLowerCase().replace(/_/g, "-");
  return STAGE_DISPLAY_NAMES[normalized] || stageKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getStageNumber(stageKey: string): string {
  const normalized = (stageKey || "").toLowerCase().replace(/_/g, "-");
  const idx = OFFICIAL_WORKFLOW_STAGES.findIndex(s => s.key === normalized || s.key === normalized.replace("-review", ""));
  if (idx !== -1) {
    return OFFICIAL_WORKFLOW_STAGES[idx].num;
  }
  return "01";
}

export function getNextStepText(currentStage: string, status: string): string {
  if (status === "REVISION_REQUIRED") {
    return "Address reviewer feedback & update clearance profile";
  }
  if (status === "UNDER_REVIEW" || status === "READY_FOR_REVIEW") {
    return "Awaiting formal review decision from Clinical Board";
  }
  if (status === "COMPLETED") {
    return "Propose Knowledge Integration for Community Herbal Guide";
  }

  const stage = (currentStage || "").toLowerCase();
  switch (stage) {
    case "plant-literature":
    case "plant-research":
    case "plant":
    case "literature":
    case "evidence-review":
    case "evidence":
      return "Run Computational In-Silico ADME Screening in Stage 2";
    case "in-silico":
      return "Perform Molecular Docking with Target Receptors in Stage 3";
    case "docking":
      return "Design Extract Formulation & Assess Toxicological Safety in Stage 4";
    case "formulation-safety":
    case "formulation":
    case "safety":
    case "safety-assessment":
      return "Continue to Research Integration in Stage 5";
    case "laboratory":
      return "Continue to Research Integration in Stage 6";
    case "completion-integration":
    case "completion":
    case "knowledge-integration":
      return "Submit the complete dossier for Final Professional Review in Stage 7";
    case "expert-review":
    case "review":
    case "revisions":
      return "Final professional review of the complete dossier";
    default:
      return "Continue structured research workflow";
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffMin < 2) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export function getStatusBadge(status: string) {
  const norm = (status || "").toUpperCase();
  switch (norm) {
    case "IN_PROGRESS":
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ACTIVE
        </span>
      );
    case "UNDER_REVIEW":
    case "READY_FOR_REVIEW":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          UNDER REVIEW
        </span>
      );
    case "REVISION_REQUIRED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          NEEDS REVISION
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0f2c20] border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
          COMPLETED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#edf2ee] text-[#475550] border border-[#dde6df]">
          {status}
        </span>
      );
  }
}

export default function ResearcherDashboardClient({
  firstName,
  stats,
  activeProjects = [],
  completedProjects = [],
}: {
  firstName: string;
  stats: DashboardStats;
  activeProjects: ProjectData[];
  completedProjects?: ProjectData[];
}) {
  const [selectedActiveIndex, setSelectedActiveIndex] = useState(0);

  const featuredProject = activeProjects[selectedActiveIndex] || activeProjects[0] || null;

  return (
    <div className="w-full max-w-none space-y-6 sm:space-y-8 pb-12">
      {/* ================================================== */}
      {/* 1. TOP WORKBENCH HEADER (Botanical Luxury Emerald) */}
      {/* ================================================== */}
      <motion.section
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full relative overflow-hidden rounded-3xl border border-emerald-700/40 bg-gradient-to-br from-[#072418] via-[#0d3626] to-[#041910] p-6 sm:p-7 text-white shadow-xl shadow-emerald-950/20"
      >
        {/* Subtle ambient light glows */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-400/15 blur-2xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-10 h-36 w-36 rounded-full bg-teal-400/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Text */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 text-[#051a11] font-mono text-[10px] font-black uppercase tracking-wider shadow-sm shadow-emerald-500/25">
                <Sparkles className="w-3 h-3 text-[#051a11]" />
                <span>LABRESEARCH WORKBENCH</span>
              </span>
              <span className="text-xs text-emerald-300/80 font-bold">NatureAide</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-2xs">
              Welcome back, {firstName}.
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium tracking-wide">
              Research. Validate. Integrate.
            </p>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/researcher/projects"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shadow-sm backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <FolderGit2 className="w-4 h-4 text-emerald-300" />
              <span>View Projects</span>
            </Link>

            <Link
              href="/researcher/projects?new=true"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#051a11] text-xs font-black transition-all shadow-md shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#051a11] stroke-[2.5]" />
              <span>+ New Research</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ================================================== */}
      {/* 2. KPI CONTAINERS (4 COMPACT FULL-WIDTH CARDS)     */}
      {/* ================================================== */}
      <section className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Active Research */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          whileHover={{ y: -2 }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#dde6df] shadow-2xs space-y-2 transition-all hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6b7c76]">Active Research</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/80">
              <FlaskConical className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            {stats.activeCount}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>In investigation</span>
          </div>
        </motion.div>

        {/* KPI 2: Awaiting Review */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          whileHover={{ y: -2 }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#dde6df] shadow-2xs space-y-2 transition-all hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6b7c76]">Awaiting Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100/80">
              <ClipboardCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            {stats.reviewCount}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Clinical board</span>
          </div>
        </motion.div>

        {/* KPI 3: Needs Revision */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          whileHover={{ y: -2 }}
          className={`p-4 sm:p-5 rounded-2xl bg-white border shadow-2xs space-y-2 transition-all hover:shadow-xs ${
            stats.revisionCount > 0 ? "border-orange-300 bg-orange-50/20" : "border-[#dde6df]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6b7c76]">Needs Revision</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-200/80">
              <RefreshCw className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            {stats.revisionCount}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-orange-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span>Actionable remarks</span>
          </div>
        </motion.div>

        {/* KPI 4: Completed */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          whileHover={{ y: -2 }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#dde6df] shadow-2xs space-y-2 transition-all hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6b7c76]">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-[#0f2c20] flex items-center justify-center border border-emerald-200/80">
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            {stats.completedCount}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-900 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Validated monographs</span>
          </div>
        </motion.div>
      </section>

      {/* ================================================== */}
      {/* 3. MAIN DASHBOARD ROW: CONTINUE RESEARCH & ACTIONS */}
      {/* ================================================== */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* LEFT COLUMN: CONTINUE RESEARCH (approx 70%) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-black tracking-widest uppercase text-[#0f2c20]">
                Continue Research
              </h2>
            </div>

            {activeProjects.length > 1 && (
              <div className="flex items-center gap-1.5">
                {activeProjects.map((proj, idx) => (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedActiveIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedActiveIndex === idx
                        ? "bg-[#0f2c20] text-white shadow-2xs"
                        : "bg-white text-[#6b7c76] border border-[#dde6df] hover:text-[#0f2c20]"
                    }`}
                  >
                    Project #{proj.id}
                  </button>
                ))}
              </div>
            )}
          </div>

          {featuredProject ? (
            <motion.div
              key={featuredProject.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white border border-[#dde6df] shadow-xs relative overflow-hidden space-y-5"
            >
              {/* Top metadata tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2ee] pb-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(featuredProject.status)}
                  <span className="text-[11px] font-bold text-[#52796f] bg-[#f6f8f6] px-2.5 py-0.5 rounded-full border border-[#dde6df]">
                    Project #{featuredProject.id}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#78997f]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatRelativeTime(featuredProject.updatedAt)}</span>
                </div>
              </div>

              {/* Title & Plant Specimen */}
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-heading font-extrabold text-[#0f2c20] tracking-tight leading-snug">
                  {featuredProject.title}
                </h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-800 font-medium">
                  <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">{featuredProject.plantName}</span>
                  {featuredProject.plantScientificName && (
                    <span className="italic text-[#6b7c76] font-normal">
                      ({featuredProject.plantScientificName})
                    </span>
                  )}
                </div>
              </div>

              {/* Stage Progress Block */}
              <div className="p-4 rounded-xl bg-[#faf9f5] border border-[#dde6df] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                      Stage {getStageNumber(featuredProject.currentStage)} of 6
                    </span>
                    <span className="text-[#a0b0aa]">·</span>
                    <span className="font-extrabold text-[#0f2c20]">
                      {getHumanStageName(featuredProject.currentStage)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-800">
                    {featuredProject.progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#e2eae4] h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${featuredProject.progressPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="bg-[#0f2c20] h-full rounded-full"
                  />
                </div>

                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-[#6b7c76] text-xs truncate max-w-md">
                    {getNextStepText(featuredProject.currentStage, featuredProject.status)}
                  </span>

                  <Link
                    href={getStageUrl(featuredProject.id, featuredProject.currentStage || "plant-literature")}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-bold transition-all shadow-2xs hover:-translate-y-0.5 shrink-0"
                  >
                    <span>Continue Research</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Compact Attractive Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-7 rounded-2xl bg-white border border-[#dde6df] text-center space-y-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-100">
                <FlaskConical className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                  No active research
                </h3>
                <p className="text-xs text-[#6b7c76] max-w-sm mx-auto">
                  Start a research project to begin the scientific workflow.
                </p>
              </div>
              <Link
                href="/researcher/projects?new=true"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-bold transition-all shadow-xs hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
                <span>+ Start Research</span>
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS (approx 30%) */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-black tracking-widest uppercase text-[#0f2c20]">
              Quick Actions
            </h2>
          </div>

          <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[#dde6df] shadow-2xs gap-2.5">
            {/* Action 1: + New Research */}
            <Link
              href="/researcher/projects?new=true"
              className="flex-1 flex items-center justify-between p-3 rounded-xl bg-[#faf9f5] hover:bg-emerald-50/60 border border-[#dde6df] hover:border-emerald-300 text-[#0f2c20] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold">+ New Research</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#78997f] group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Action 2: My Projects */}
            <Link
              href="/researcher/projects"
              className="flex-1 flex items-center justify-between p-3 rounded-xl bg-[#faf9f5] hover:bg-emerald-50/60 border border-[#dde6df] hover:border-emerald-300 text-[#0f2c20] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FolderGit2 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold">My Projects</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#78997f] group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Action 3: Review Feedback */}
            <Link
              href="/researcher/projects"
              className="flex-1 flex items-center justify-between p-3 rounded-xl bg-[#faf9f5] hover:bg-emerald-50/60 border border-[#dde6df] hover:border-emerald-300 text-[#0f2c20] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ClipboardCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold">Review Feedback</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#78997f] group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Action 4: Completed Studies */}
            <Link
              href="/researcher/projects"
              className="flex-1 flex items-center justify-between p-3 rounded-xl bg-[#faf9f5] hover:bg-emerald-50/60 border border-[#dde6df] hover:border-emerald-300 text-[#0f2c20] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold">Completed Studies</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#78997f] group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 4. RECENT COMPLETED RESEARCH (FULL WIDTH)          */}
      {/* ================================================== */}
      {completedProjects.length > 0 && (
        <section className="w-full space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black tracking-widest uppercase text-[#0f2c20]">
                Recent Research
              </h2>
            </div>
            <Link
              href="/researcher/projects"
              className="text-xs font-bold text-emerald-800 hover:text-[#0f2c20] transition-colors"
            >
              View All ({stats.completedCount})
            </Link>
          </div>

          <div className="w-full space-y-3">
            {completedProjects.map((p) => (
              <div
                key={p.id}
                className="w-full p-5 sm:p-6 rounded-2xl bg-white border border-[#dde6df] hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <span className="font-heading font-extrabold text-base text-[#0f2c20]">
                      {p.plantName}
                    </span>
                    {p.plantScientificName && (
                      <span className="text-xs sm:text-sm italic text-[#6b7c76]">
                        ({p.plantScientificName})
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0f2c20] border border-emerald-300 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Completed
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#475550] leading-relaxed">
                    {p.title}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#edf2ee]">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    6/6
                  </span>
                  <Link
                    href={getStageUrl(p.id, "completion-integration")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-bold transition-all shadow-2xs hover:-translate-y-0.5"
                  >
                    <span>View Final Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
