"use client";

import React, { useState, useEffect } from "react";
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
  Layers,
  Sparkles,
  UserCheck,
  Check,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { useReviewerProject } from "@/context/ReviewerProjectContext";

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
  researcherName?: string;
  reviewRound?: number;
  areas?: {
    key: string;
    label: string;
    status: string;
    checkingArea?: string;
    actionUrl: string;
  }[];
  action?: {
    label: string;
    href: string;
  };
}

export interface DashboardStats {
  activeCount: number;
  reviewCount: number;
  revisionCount: number;
  completedCount: number;
  totalCount: number;
}

export const STAGE_DISPLAY_NAMES: Record<string, string> = {
  "plant-literature": "Plant & Literature Research",
  "in-silico": "In-Silico Analysis",
  docking: "Molecular Docking",
  "formulation-safety": "Formulation & Safety",
  "completion-integration": "Research Integration",
  "knowledge-integration": "Knowledge Integration",
  "safety": "Safety & Clinical",
  "expert-review": "Final Professional Review",
};

export function getHumanStageName(stageKey: string): string {
  if (!stageKey) return "Plant & Literature Research";
  const normalized = stageKey.toLowerCase().replace(/_/g, "-");
  return STAGE_DISPLAY_NAMES[normalized] || stageKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getStageNumber(stageKey: string): string {
  const normalized = (stageKey || "").toLowerCase().replace(/_/g, "-");
  switch (normalized) {
    case "plant-literature":
    case "plant-research":
    case "plant":
    case "evidence":
      return "01";
    case "in-silico":
      return "02";
    case "docking":
      return "03";
    case "formulation-safety":
    case "formulation":
      return "04";
    case "safety":
    case "safety-clinical":
      return "05";
    case "completion-integration":
    case "knowledge-integration":
    case "expert-review":
    case "completion":
      return "06";
    default:
      return "05";
  }
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Recently";
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
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
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

export function getReviewerNextStepText(currentStage: string, status: string): string {
  if (status === "REVISION_REQUIRED") {
    return "Awaiting researcher resubmission addressing review feedback";
  }
  if (status === "UNDER_REVIEW" || status === "READY_FOR_REVIEW") {
    return "Awaiting formal review determination from peer review specialties";
  }
  if (status === "COMPLETED") {
    return "Dossier fully validated and endorsed by scientific review board";
  }

  const stage = (currentStage || "").toLowerCase();
  switch (stage) {
    case "plant-literature":
      return "Review taxonomic voucher authentication and traditional usage evidence";
    case "in-silico":
      return "Review computational drug-likeness & ADMET screening compliance";
    case "docking":
      return "Verify macromolecular target binding affinities & docking poses";
    case "formulation-safety":
    case "formulation":
      return "Review extract compounding standard operating procedures";
    case "safety":
      return "Evaluate preclinical safety margins, posology, and contraindications";
    case "completion-integration":
    case "knowledge-integration":
      return "Final professional peer review of integrated monograph dossier";
    default:
      return "Conduct independent peer evaluation of candidate dossier";
  }
}

export default function ReviewWorkspaceClient() {
  const [loading, setLoading] = useState(true);
  const [activeProjects, setActiveProjects] = useState<ProjectData[]>([]);
  const [completedProjects, setCompletedProjects] = useState<ProjectData[]>([]);
  const [selectedActiveIndex, setSelectedActiveIndex] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({
    activeCount: 0,
    reviewCount: 0,
    revisionCount: 0,
    completedCount: 0,
    totalCount: 0,
  });

  const { setActiveProject } = useReviewerProject();

  const handleSelectProject = (project: ProjectData) => {
    setActiveProject({
      id: project.id,
      title: project.title,
      plantName: project.plantName,
      plantScientificName: project.plantScientificName || null,
      status: project.status,
    });
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const projRes = await fetch("/api/reviewer/projects");

        if (projRes.ok) {
          const pData = await projRes.json();
          const allProjects = pData.projects || [];
          const tabCounts = pData.tabCounts || {};

          setStats({
            activeCount: Number(tabCounts.ACTIVE || 0),
            reviewCount: Number(tabCounts.UNDER_REVIEW || 0),
            revisionCount: Number(tabCounts.REVISION || 0),
            completedCount: Number(tabCounts.COMPLETED || 0),
            totalCount: Number(tabCounts.ALL || 0),
          });

          // Map active and priority projects
          const activeList = allProjects
            .filter((p: any) => p.rawStatus !== "ARCHIVED" && p.rawStatus !== "COMPLETED")
            .map((p: any) => ({
              id: p.projectId,
              title: p.title,
              status: p.rawStatus || "IN_PROGRESS",
              currentStage: p.currentStage || "plant-literature",
              progressPercent: Number(p.progressPercent || 0),
              updatedAt: p.updatedAt,
              plantName: p.plantName,
              plantScientificName: p.plantScientificName,
              shortDescription: p.shortDescription,
              researcherName: p.researcherName,
              reviewRound: p.reviewRound || 1,
              areas: p.areas,
              action: p.action,
            }));

          setActiveProjects(activeList);

          // Map completed projects
          const completedList = allProjects
            .filter((p: any) => p.rawStatus === "COMPLETED" || p.completedReviewsCount === 5)
            .map((p: any) => ({
              id: p.projectId,
              title: p.title,
              status: "COMPLETED",
              currentStage: p.currentStage || "knowledge-integration",
              progressPercent: 100,
              updatedAt: p.updatedAt,
              plantName: p.plantName,
              plantScientificName: p.plantScientificName,
              shortDescription: p.shortDescription,
              researcherName: p.researcherName,
              areas: p.areas,
              action: p.action,
            }));

          setCompletedProjects(completedList);
        }
      } catch (err) {
        console.error("Failed to load reviewer dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const featuredProject = activeProjects[selectedActiveIndex] || activeProjects[0] || null;

  return (
    <div className="w-full max-w-none space-y-6 pb-12 font-sans">
      {/* ============================================================== */}
      {/* 1. TOP WORKBENCH HEADER                                        */}
      {/* ============================================================== */}
      <div className="w-full bg-[#0b2447] rounded-xl border border-blue-900/60 p-6 sm:p-7 shadow-sm text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium tracking-wider uppercase text-blue-300 bg-blue-950/80 border border-blue-500/30 rounded px-2.5 py-0.5">
                Reviewer Dashboard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Scientific Review Platform
            </h1>
            <p className="text-sm text-blue-100/80 leading-relaxed">
              Evaluate candidate botanical dossiers, inspect computational screening and docking energetics, and submit official multi-disciplinary peer assessments across the standardized NatureAide pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/reviewer/projects"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-blue-700/60 bg-blue-950/60 hover:bg-blue-900/60 text-blue-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4 text-blue-400" />
              <span>View All Projects</span>
            </Link>

            <Link
              href="/reviewer/assistant"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-200 stroke-[2.5]" />
              <span>Ask NatureAide</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. KPI CONTAINERS (4 Compact Cards Matching Researcher Role)    */}
      {/* ============================================================== */}
      <section className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Active Research */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-xs font-medium uppercase tracking-wider">Active Research</span>
            <FlaskConical className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {stats.activeCount}
            </div>
            <span className="text-xs text-slate-400">studies in active pipeline</span>
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
        <div
          className={`p-4 sm:p-5 rounded-xl bg-white border shadow-xs flex flex-col justify-between ${
            stats.revisionCount > 0 ? "border-rose-200 bg-rose-50/20" : "border-slate-200/90"
          }`}
        >
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

      {/* ============================================================== */}
      {/* 3. MAIN DASHBOARD ROW: PRIORITY REVIEW & QUICK ACTIONS         */}
      {/* ============================================================== */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* LEFT COLUMN: CONTINUE REVIEW (70% - lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-800">
                Priority Review Dossiers
              </h2>
            </div>

            {activeProjects.length > 1 && (
              <div className="flex items-center gap-1.5">
                {activeProjects.slice(0, 3).map((proj, idx) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSelectedActiveIndex(idx);
                      handleSelectProject(proj);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      selectedActiveIndex === idx
                        ? "bg-blue-600 text-white shadow-xs"
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
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Cycle {featuredProject.reviewRound || 1}
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
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-700">
                  <Leaf className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-medium text-slate-900">{featuredProject.plantName}</span>
                  {featuredProject.plantScientificName && (
                    <span className="italic text-slate-500 font-normal">
                      ({featuredProject.plantScientificName})
                    </span>
                  )}
                  {featuredProject.researcherName && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">
                        Researcher: <strong className="text-slate-700 font-medium">{featuredProject.researcherName}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Stage Progress Block */}
              <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-800 font-medium uppercase tracking-wider text-[11px]">
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
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${featuredProject.progressPercent}%` }}
                  />
                </div>

                {/* 5-Discipline Status Pills */}
                {featuredProject.areas && featuredProject.areas.length > 0 && (
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mr-1">
                      Reviews:
                    </span>
                    {featuredProject.areas.map((area) => {
                      const isApp = area.status === "Approved" || area.status === "APPROVED";
                      const isRev = area.status?.toLowerCase().includes("revision");
                      const isInRev = area.status === "In Review" || area.status === "IN_REVIEW";

                      return (
                        <Link
                          key={area.key}
                          href={area.actionUrl}
                          onClick={() => handleSelectProject(featuredProject)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                            isApp
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100"
                              : isRev
                                ? "bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100"
                                : isInRev
                                  ? "bg-blue-50 text-blue-800 border-blue-200/80 hover:bg-blue-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          <span>{area.checkingArea || area.label}</span>
                          {isApp ? (
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          ) : isRev ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          ) : isInRev ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}

                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-200/60">
                  <span className="text-slate-500 text-xs truncate max-w-md">
                    {getReviewerNextStepText(featuredProject.currentStage, featuredProject.status)}
                  </span>

                  <Link
                    href={featuredProject.action?.href || `/reviewer/projects/${featuredProject.id}`}
                    onClick={() => handleSelectProject(featuredProject)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs shrink-0"
                  >
                    <span>Open Review Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
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
                  No active review dossiers
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All assigned peer reviews are up to date.
                </p>
              </div>
              <Link
                href="/reviewer/projects"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b2447] hover:bg-[#123668] text-white text-xs font-medium transition-colors shadow-xs"
              >
                <Layers className="w-3.5 h-3.5 text-blue-300" />
                <span>Browse All Projects</span>
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS (30% - lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-800">
              Quick Actions
            </h2>
          </div>

          <div className="flex-1 flex flex-col justify-between p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs gap-2">
            <Link
              href="/reviewer/projects"
              className="flex-1 flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <FolderGit2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">All Research Projects</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            <Link
              href="/reviewer/projects?status=UNDER_REVIEW"
              className="flex-1 flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">Review &amp; Evaluation Queue</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            <Link
              href="/reviewer/revisions"
              className="flex-1 flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">Revisions Requested</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            <Link
              href="/reviewer/assistant"
              className="flex-1 flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">Ask NatureAide Assistant</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            <Link
              href="/reviewer/profile"
              className="flex-1 flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-slate-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">Reviewer Profile &amp; Credentials</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. RECENT COMPLETED RESEARCH (FULL WIDTH)                      */}
      {/* ============================================================== */}
      {completedProjects.length > 0 && (
        <section className="w-full space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-800">
                Recent Fully Endorsed Dossiers
              </h2>
            </div>
            <Link
              href="/reviewer/projects?status=COMPLETED"
              className="text-xs font-medium text-blue-800 hover:text-blue-950 transition-colors"
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
                      Fully Approved
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
                    href={`/reviewer/projects/${p.id}`}
                    onClick={() => handleSelectProject(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0b2447] hover:bg-[#123668] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>Inspect Final Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
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
