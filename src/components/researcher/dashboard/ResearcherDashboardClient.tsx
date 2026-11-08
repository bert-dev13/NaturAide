"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Layers,
  MessageSquareWarning,
  Award,
} from "lucide-react";
import { getStageUrl } from "@/lib/workflow-stages";
import { useLiveDisplayName } from "@/hooks/useLiveDisplayName";

export interface ProjectData {
  id: number;
  title: string;
  status: string;
  currentStage: string;
  progressPercent: number;
  continueRoute?: string;
  currentSectionTitle?: string;
  currentSectionNum?: number;
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
      timeZone: "UTC",
    });
  } catch {
    return "Recently";
  }
}

export function getStatusBadge(status: string) {
  const norm = (status || "").toUpperCase();
  if (norm === "COMPLETED" || status === "Completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-900">
        <CheckCircle2 className="h-3 w-3 text-teal-700" />
        Completed
      </span>
    );
  }
  if (norm === "APPROVED" || status === "Fully Approved — Ready to Complete") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
        <CheckCircle2 className="h-3 w-3 text-emerald-700" />
        Fully Approved
      </span>
    );
  }
  if (
    norm === "REVISION_REQUIRED" ||
    norm === "REVISION_REQUESTED" ||
    status === "Revisions Required"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-900">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Revisions Required
      </span>
    );
  }
  if (
    norm === "UNDER_REVIEW" ||
    norm === "READY_FOR_REVIEW" ||
    status.startsWith("Under Professional Review")
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
        <Clock className="h-3 w-3 text-amber-700" />
        {status.startsWith("Under Professional Review") ? status : "Under Review"}
      </span>
    );
  }
  if (norm === "IN_PROGRESS" || norm === "DRAFT") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
      {status}
    </span>
  );
}

const easeOut = [0.22, 1, 0.36, 1] as const;

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
  const { firstName: liveFirstName } = useLiveDisplayName("", firstName);
  const [selectedActiveIndex, setSelectedActiveIndex] = useState(0);
  const featuredProject = activeProjects[selectedActiveIndex] || activeProjects[0] || null;

  const kpiCards = [
    {
      key: "active",
      label: "Active Research",
      value: stats.activeCount,
      hint: "In pipeline stages",
      href: "/researcher/projects?status=ACTIVE",
      icon: FlaskConical,
      surface: "bg-[linear-gradient(145deg,#ecfdf5_0%,#ffffff_45%,#f0fdfa_100%)]",
      bar: "from-emerald-500 to-teal-300",
      valueClass: "text-emerald-800",
      iconWrap: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
      glow: "bg-emerald-400/25",
    },
    {
      key: "review",
      label: "Awaiting Review",
      value: stats.reviewCount,
      hint: "Submitted dossiers",
      href: "/researcher/projects?status=UNDER_REVIEW",
      icon: ClipboardCheck,
      surface: "bg-[linear-gradient(145deg,#fffbeb_0%,#ffffff_45%,#fff7ed_100%)]",
      bar: "from-amber-500 to-orange-300",
      valueClass: "text-amber-900",
      iconWrap: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
      glow: "bg-amber-400/25",
    },
    {
      key: "revision",
      label: "Needs Revision",
      value: stats.revisionCount,
      hint: "Feedback to resolve",
      href: "/researcher/revisions",
      icon: MessageSquareWarning,
      surface: "bg-[linear-gradient(145deg,#fff1f2_0%,#ffffff_45%,#fff7ed_100%)]",
      bar: "from-rose-500 to-orange-300",
      valueClass: "text-rose-900",
      iconWrap: "bg-gradient-to-br from-rose-500 to-rose-600 text-white",
      glow: "bg-rose-400/25",
    },
    {
      key: "completed",
      label: "Completed",
      value: stats.completedCount,
      hint: "Validated dossiers",
      href: "/researcher/completed",
      icon: CheckCircle2,
      surface: "bg-[linear-gradient(145deg,#f0fdfa_0%,#ffffff_45%,#ecfeff_100%)]",
      bar: "from-teal-500 to-cyan-300",
      valueClass: "text-teal-900",
      iconWrap: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white",
      glow: "bg-teal-400/25",
    },
  ];

  const quickActions = [
    {
      href: "/researcher/projects?new=true",
      label: "New Research Project",
      icon: Plus,
      wrap: "bg-emerald-50 text-emerald-800 border-emerald-100",
    },
    {
      href: "/researcher/projects",
      label: "All Projects",
      icon: FolderGit2,
      wrap: "bg-[#edf5f0] text-[#0f2c20] border-[#d7e4dc]",
    },
    {
      href: "/researcher/revisions",
      label: "Review & Revisions",
      icon: ClipboardCheck,
      wrap: "bg-amber-50 text-amber-800 border-amber-100",
    },
    {
      href: "/researcher/completed",
      label: "Completed Archive",
      icon: Award,
      wrap: "bg-teal-50 text-teal-800 border-teal-100",
    },
  ];

  return (
    <div className="w-full max-w-none space-y-6 pb-12 text-slate-800">
      {/* 1. Compact header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(15,44,32,0.55)] sm:px-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 left-1/4 h-28 w-28 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                <Layers className="h-3 w-3 text-emerald-300" />
                Scientific Workbench
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-100/80">
                6-stage pipeline
              </span>
            </div>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Welcome back, {liveFirstName || firstName}
            </h1>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-emerald-100/75">
              Orchestrate botanical studies across literature, docking, and peer validation.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/researcher/projects"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
            >
              <FolderGit2 className="h-3.5 w-3.5" />
              Projects
            </Link>
            <Link
              href="/researcher/projects?new=true"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300 active:bg-emerald-500"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              New Research
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 2. KPI metrics */}
      <div className="grid w-full grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-4">
        {kpiCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.04 + index * 0.05, ease: easeOut }}
            >
              <Link
                href={stat.href}
                className={`group relative block overflow-hidden rounded-2xl border border-[#d7e4dc]/90 ${stat.surface} p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(15,44,32,0.35)]`}
              >
                <div className={`absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r ${stat.bar}`} />
                <div className={`pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl ${stat.glow}`} />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6d7f76]">
                      {stat.label}
                    </p>
                    <p className={`mt-1.5 text-2xl font-semibold tabular-nums leading-none tracking-tight sm:text-[1.7rem] ${stat.valueClass}`}>
                      {stat.value}
                    </p>
                    <p className="mt-1.5 text-[11px] font-medium text-[#8aa094]">{stat.hint}</p>
                  </div>
                  <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${stat.iconWrap}`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Continue + Quick Actions */}
      <div className="grid w-full grid-cols-1 gap-3.5 lg:grid-cols-12 lg:gap-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14, ease: easeOut }}
          className="flex flex-col gap-3 lg:col-span-8"
        >
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
                Continue Research
              </h2>
            </div>
            {activeProjects.length > 1 && (
              <div className="flex items-center gap-1">
                {activeProjects.map((proj, idx) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => setSelectedActiveIndex(idx)}
                    className={`rounded-lg px-2 py-1 font-mono text-[10px] font-bold transition ${
                      selectedActiveIndex === idx
                        ? "bg-[#0f2c20] text-white"
                        : "border border-[#d7e4dc] bg-white text-[#6d7f76] hover:bg-[#edf5f0]"
                    }`}
                  >
                    #{proj.id}
                  </button>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {featuredProject ? (
              <motion.article
                key={featuredProject.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: easeOut }}
                className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
              >
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-300" />

                <div className="flex flex-1 flex-col gap-3.5 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getStatusBadge(featuredProject.status)}
                      <span className="rounded-md border border-[#d7e4dc] bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5f7468]">
                        Project #{featuredProject.id}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8aa094]">
                      <Clock className="h-3 w-3" />
                      <span suppressHydrationWarning>
                        Updated {formatRelativeTime(featuredProject.updatedAt)}
                      </span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-[#0f2c20] sm:text-base">
                      {featuredProject.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="inline-flex max-w-full items-center gap-1 truncate rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2 py-1 font-semibold text-emerald-900">
                        <Leaf className="h-3 w-3 shrink-0 text-emerald-700" />
                        <span className="truncate">
                          {featuredProject.plantName}
                          {featuredProject.plantScientificName ? (
                            <span className="font-medium italic text-emerald-800/80">
                              {" "}
                              ({featuredProject.plantScientificName})
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 rounded-xl border border-[#e8f0eb] bg-white/80 p-3.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="min-w-0">
                        <p className="font-bold uppercase tracking-[0.12em] text-emerald-800">
                          Stage {getStageNumber(featuredProject.currentStage)} of 6
                        </p>
                        <p className="mt-0.5 truncate font-medium text-[#52645d]">
                          {getHumanStageName(featuredProject.currentStage)}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-[#0f2c20]">
                        {featuredProject.progressPercent}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8f0eb]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${featuredProject.progressPercent}%` }}
                        transition={{ duration: 0.7, ease: easeOut, delay: 0.15 }}
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-[#6d7f76]">
                        {getNextStepText(featuredProject.currentStage, featuredProject.status)}
                      </p>
                      <Link
                        href={
                          featuredProject.continueRoute ||
                          getStageUrl(
                            featuredProject.id,
                            featuredProject.currentStage || "plant-literature"
                          )
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0f2c20] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#164533]"
                      >
                        Continue Research
                        <ArrowRight className="h-3.5 w-3.5 text-emerald-300" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.article>
            ) : (
              <motion.div
                key="empty-active"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-[#d7e4dc] bg-white px-6 py-10 text-center shadow-xs"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d7e4dc] bg-[#f4f8f5] text-emerald-800">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[#0f2c20]">No active research</h3>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#6d7f76]">
                  Start a research project to begin the scientific workflow.
                </p>
                <Link
                  href="/researcher/projects?new=true"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0f2c20] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#164533]"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-300" />
                  Start Research
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18, ease: easeOut }}
          className="flex flex-col gap-3 lg:col-span-4"
        >
          <h2 className="px-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
            Quick Actions
          </h2>
          <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-[#d7e4dc]/90 bg-[linear-gradient(180deg,#ffffff_0%,#f7faf8_100%)] p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, delay: 0.2 + index * 0.04, ease: easeOut }}
                >
                  <Link
                    href={action.href}
                    className="group flex items-center justify-between gap-2 rounded-xl border border-[#e8f0eb] bg-white/90 px-3 py-2.5 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${action.wrap}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-xs font-semibold text-[#0f2c20]">
                        {action.label}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#8aa094] transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      </div>

      {/* 4. Recent completed */}
      {completedProjects.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22, ease: easeOut }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
                Recent Completed Dossiers
              </h2>
            </div>
            <Link
              href="/researcher/completed"
              className="text-[11px] font-semibold text-emerald-800 transition hover:text-emerald-950"
            >
              View All ({stats.completedCount})
            </Link>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {completedProjects.map((p, index) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.24 + index * 0.05, ease: easeOut }}
                whileHover={{ y: -2 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-teal-200/70 bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] shadow-[0_1px_2px_rgba(15,44,32,0.04)] transition-all duration-300 hover:border-emerald-300/80 hover:shadow-[0_18px_34px_-22px_rgba(15,44,32,0.3)]"
              >
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-teal-600 via-teal-400 to-cyan-300" />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                    <span className="rounded-md border border-[#d7e4dc] bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5f7468]">
                      Stage 6/6
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-emerald-900">
                      {p.plantName}
                      {p.plantScientificName ? (
                        <span className="font-medium italic text-emerald-800/75">
                          {" "}
                          ({p.plantScientificName})
                        </span>
                      ) : null}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-[#0f2c20]">
                      {p.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[#e8f0eb] bg-[#f7faf8]/90 px-4 py-3">
                  <span className="text-[11px] font-medium text-[#8aa094]">Archive dossier</span>
                  <Link
                    href={`/researcher/completed/${p.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                  >
                    View Dossier
                    <ArrowRight className="h-3.5 w-3.5 text-teal-100" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
