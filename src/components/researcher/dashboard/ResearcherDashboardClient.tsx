"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  ClipboardCheck,
  CheckCircle2,
  FolderGit2,
  ArrowRight,
  Clock,
  RefreshCw,
  Leaf,
  Cpu,
  Sprout,
  Network,
  Plus,
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
  docking: "Molecular Docking",
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
    return "Knowledge dossier finalized for scientific archiving & publication";
  }

  const stage = (currentStage || "").toLowerCase();
  switch (stage) {
    case "plant-literature":
    case "plant-research":
    case "plant":
    case "literature":
    case "evidence-review":
    case "evidence":
      return "Advance to Computational In-Silico ADME Screening in Stage 2";
    case "in-silico":
      return "Advance to Molecular Docking with Target Receptors in Stage 3";
    case "docking":
      return "Design Extract Formulation & Assess Toxicological Safety in Stage 4";
    case "formulation-safety":
    case "formulation":
    case "safety":
    case "safety-assessment":
      return "Synthesize findings into Research Integration in Stage 5";
    case "completion-integration":
    case "completion":
    case "knowledge-integration":
      return "Submit the complete dossier for Final Professional Review in Stage 6";
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
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Active
        </span>
      );
    case "UNDER_REVIEW":
    case "READY_FOR_REVIEW":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
          <Clock className="w-3 h-3 text-amber-700" />
          Under Review
        </span>
      );
    case "REVISION_REQUIRED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Needs Revision
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200/80">
          <CheckCircle2 className="w-3 h-3 text-teal-700" />
          Completed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
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
    <div className="w-full max-w-none space-y-6 pb-12">
      {/* 1. TOP WORKBENCH HEADER */}
      <div className="w-full bg-[#0f2c20] rounded-xl border border-emerald-900/60 p-6 sm:p-7 shadow-sm text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium tracking-wider uppercase text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 rounded px-2.5 py-0.5">
                Scientific Workbench
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Orchestrate botanical investigations, in-silico computational screening, molecular docking, and peer validation across the standardized 6-stage NatureAide pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/researcher/projects"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-emerald-700/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4 text-emerald-400" />
              <span>View All Projects</span>
            </Link>

            <Link
              href="/researcher/projects?new=true"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#091a13] text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Research</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KPI CONTAINERS (4 COMPACT FULL-WIDTH CARDS) */}
      <section className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Active Research */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-medium uppercase tracking-wider">Active Research</span>
            <FlaskConical className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {stats.activeCount}
            </div>
            <span className="text-xs text-slate-400">studies in active stages</span>
          </div>
        </div>

        {/* KPI 2: Awaiting Review */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-medium uppercase tracking-wider">Awaiting Review</span>
            <ClipboardCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {stats.reviewCount}
            </div>
            <span className="text-xs text-slate-400">submitted dossiers</span>
          </div>
        </div>

        {/* KPI 3: Needs Revision */}
        <div className={`p-4 sm:p-5 rounded-xl bg-white border shadow-xs flex flex-col justify-between ${
          stats.revisionCount > 0 ? "border-rose-200 bg-rose-50/20" : "border-slate-200/90"
        }`}>
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-medium uppercase tracking-wider">Needs Revision</span>
            <RefreshCw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {stats.revisionCount}
            </div>
            <span className="text-xs text-slate-400">feedback requiring action</span>
          </div>
        </div>

        {/* KPI 4: Completed */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-teal-800">
            <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {stats.completedCount}
            </div>
            <span className="text-xs text-slate-400">validated monographs</span>
          </div>
        </div>
      </section>

      {/* 3. MAIN DASHBOARD ROW: CONTINUE RESEARCH & ACTIONS */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* LEFT COLUMN: CONTINUE RESEARCH (approx 70%) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-800">
                Continue Research
              </h2>
            </div>

            {activeProjects.length > 1 && (
              <div className="flex items-center gap-1.5">
                {activeProjects.map((proj, idx) => (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedActiveIndex(idx)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      selectedActiveIndex === idx
                        ? "bg-[#0f2c20] text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Project #{proj.id}
                  </button>
                ))}
              </div>
            )}
          </div>

          {featuredProject ? (
            <div
              key={featuredProject.id}
              className="flex-1 flex flex-col justify-between p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden space-y-5"
            >
              {/* Top metadata tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(featuredProject.status)}
                  <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Project #{featuredProject.id}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatRelativeTime(featuredProject.updatedAt)}</span>
                </div>
              </div>

              {/* Title & Plant Specimen */}
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight leading-snug">
                  {featuredProject.title}
                </h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                  <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-900">{featuredProject.plantName}</span>
                  {featuredProject.plantScientificName && (
                    <span className="italic text-slate-500 font-normal">
                      ({featuredProject.plantScientificName})
                    </span>
                  )}
                </div>
              </div>

              {/* Stage Progress Block */}
              <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-800 font-medium uppercase tracking-wider text-[11px]">
                      Stage {getStageNumber(featuredProject.currentStage)} of 6
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-medium text-slate-800">
                      {getHumanStageName(featuredProject.currentStage)}
                    </span>
                  </div>
                  <span className="font-mono font-medium text-slate-700">
                    {featuredProject.progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${featuredProject.progressPercent}%` }}
                  />
                </div>

                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 text-xs truncate max-w-md">
                    {getNextStepText(featuredProject.currentStage, featuredProject.status)}
                  </span>

                  <Link
                    href={getStageUrl(featuredProject.id, featuredProject.currentStage || "plant-literature")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-medium transition-colors shadow-xs shrink-0"
                  >
                    <span>Continue Research</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-7 rounded-xl bg-white border border-slate-200/90 text-center space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  No active research
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Start a research project to begin the scientific workflow.
                </p>
              </div>
              <Link
                href="/researcher/projects?new=true"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-medium transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-300" />
                <span>Start Research</span>
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS (approx 30%) */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-800">
              Quick Actions
            </h2>
          </div>

          <div className="flex-1 flex flex-col justify-between p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs gap-2">
            <Link
              href="/researcher/projects?new=true"
              className="flex-1 flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">New Research Project</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            <Link
              href="/researcher/projects"
              className="flex-1 flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <FolderGit2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">All Projects</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            <Link
              href="/researcher/projects?status=UNDER_REVIEW"
              className="flex-1 flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">Review &amp; Evaluation</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            <Link
              href="/researcher/projects?status=COMPLETED"
              className="flex-1 flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">Completed Studies</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. RECENT COMPLETED RESEARCH (FULL WIDTH) */}
      {completedProjects.length > 0 && (
        <section className="w-full space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-800">
                Recent Completed Dossiers
              </h2>
            </div>
            <Link
              href="/researcher/projects?status=COMPLETED"
              className="text-xs font-medium text-emerald-800 hover:text-emerald-950 transition-colors"
            >
              View All ({stats.completedCount})
            </Link>
          </div>

          <div className="w-full space-y-2.5">
            {completedProjects.map((p) => (
              <div
                key={p.id}
                className="w-full p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      {p.plantName}
                    </span>
                    {p.plantScientificName && (
                      <span className="text-xs italic text-slate-500">
                        ({p.plantScientificName})
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200/80 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-teal-700" />
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 leading-relaxed">
                    {p.title}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    Stage 6/6
                  </span>
                  <Link
                    href={getStageUrl(p.id, "completion-integration")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-medium transition-colors"
                  >
                    <span>View Final Dossier</span>
                    <ArrowRight className="w-3 h-3 text-emerald-300" />
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
