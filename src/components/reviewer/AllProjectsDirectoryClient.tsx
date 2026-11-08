"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Layers,
  Sparkles,
  Loader2,
  FolderOpen,
  Leaf,
  Dna,
  Pill,
  FlaskConical,
  Stethoscope,
  ChevronRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { useReviewerProject } from "@/context/ReviewerProjectContext";

interface AreaItem {
  key: string;
  profession: string;
  checkingArea: string;
  status: string;
  displayStatus: string;
  isReady: boolean;
  isCompleted: boolean;
  assignmentId: number | null;
  actionUrl: string;
}

interface ProjectItem {
  projectId: number;
  title: string;
  shortDescription?: string;
  researchObjective?: string;
  plantName: string;
  plantScientificName?: string | null;
  plantFamily?: string | null;
  plantImageUrl?: string | null;
  researcherId: number;
  researcherName: string;
  researcherEmail: string;
  currentStage?: string;
  stageNumber: number;
  stageName: string;
  progressPercent: number;
  rawStatus: string;
  displayStatus: string;
  reviewRound: number;
  versionTag: string;
  submittedAt: string;
  updatedAt: string;
  totalRequiredReviews: number;
  completedReviewsCount: number;
  isReviewReady: boolean;
  areas: AreaItem[];
  action: {
    label: string;
    href: string;
  };
}

interface TabCounts {
  ALL: number;
  ACTIVE: number;
  UNDER_REVIEW: number;
  REVISION: number;
  COMPLETED: number;
  ARCHIVED: number;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  pharmacognosy: Leaf,
  bioinformatics: Dna,
  pharmacology: Pill,
  formulation: FlaskConical,
  clinical_safety: Stethoscope,
};

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

export default function AllProjectsDirectoryClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = searchParams.get("status") || "ALL";
  const searchParam = searchParams.get("q") || "";

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tabCounts, setTabCounts] = useState<TabCounts>({
    ALL: 0,
    ACTIVE: 0,
    UNDER_REVIEW: 0,
    REVISION: 0,
    COMPLETED: 0,
    ARCHIVED: 0,
  });
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [activeStatus, setActiveStatus] = useState(statusParam);
  const [isPending, startTransition] = useTransition();
  const { setActiveProject } = useReviewerProject();

  const handleSelectProject = (p: ProjectItem) => {
    setActiveProject({
      id: p.projectId,
      title: p.title,
      plantName: p.plantName,
      plantScientificName: p.plantScientificName || null,
      status: p.displayStatus,
    });
  };

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (activeStatus && activeStatus !== "ALL") {
          params.set("status", activeStatus);
        }
        if (searchQuery.trim()) {
          params.set("q", searchQuery.trim());
        }

        const res = await fetch(`/api/reviewer/projects?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
          if (data.tabCounts) {
            setTabCounts(data.tabCounts);
          }
        }
      } catch (err) {
        console.error("Error loading canonical project directory:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadProjects();
    }, 150);

    return () => clearTimeout(timer);
  }, [activeStatus, searchQuery]);

  const handleStatusFilterChange = (status: string) => {
    setActiveStatus(status);
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    startTransition(() => {
      router.push(`/reviewer/projects?${params.toString()}`);
    });
  };

  const filterTabs = [
    { id: "ALL", label: "All", count: tabCounts.ALL },
    { id: "ACTIVE", label: "Active", count: tabCounts.ACTIVE },
    { id: "UNDER_REVIEW", label: "Under Review", count: tabCounts.UNDER_REVIEW },
    { id: "REVISION", label: "Revisions", count: tabCounts.REVISION },
    { id: "COMPLETED", label: "Completed", count: tabCounts.COMPLETED },
    { id: "ARCHIVED", label: "Archived", count: tabCounts.ARCHIVED },
    { id: "REVIEW_READY", label: "Review Ready", count: projects.filter((p) => p.isReviewReady).length },
  ];

  return (
    <div className="w-full max-w-none space-y-4 pb-12 font-sans text-slate-800">
      {/* 1. Compact navy hero */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-blue-500/20 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(7,25,48,0.55)] sm:px-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-blue-200">
              <Layers className="h-3 w-3 text-blue-300" />
              Directory
            </span>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
              All Research Projects
            </h1>
            <p className="mt-0.5 text-xs text-blue-100/75">Browse and open dossiers for review.</p>
          </div>
          <Link
            href="/reviewer/assistant"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask NatureAide
          </Link>
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR (FULL WIDTH) */}
      <div className="w-full">
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_1px_2px_rgba(7,25,48,0.04)] md:flex-row md:items-center sm:p-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = activeStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleStatusFilterChange(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. PROJECT DIRECTORY TABLE (FULL WIDTH) */}
      <div className="w-full">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading research directory...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 font-heading">
              {searchQuery
                ? `No research projects found for "${searchQuery}"`
                : tabCounts.ALL === 0
                ? "No research projects available."
                : "No projects match this filter."}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Try searching with a different plant name, title, or researcher keyword."
                : "Select another status tab to view corresponding scientific research investigations."}
            </p>
            {(searchQuery || activeStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  handleStatusFilterChange("ALL");
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Desktop Full-width Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Research Project</th>
                    <th className="py-2.5 px-3">Plant / Study</th>
                    <th className="py-2.5 px-3">Researcher</th>
                    <th className="py-2.5 px-3">Research Progress</th>
                    <th className="py-2.5 px-3">Professional Review</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Updated</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((project) => {
                    const percentComplete = Math.round(
                      (project.completedReviewsCount / project.totalRequiredReviews) * 100
                    );

                    return (
                      <tr
                        key={project.projectId}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Research Project Title & Cycle */}
                        <td className="py-3 px-4 max-w-xs xl:max-w-sm">
                          <div className="flex flex-col min-w-0">
                            <Link
                              href={`/reviewer/projects/${project.projectId}?tab=section1`}
                              onClick={() => handleSelectProject(project)}
                              className="font-heading font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
                              title={project.title}
                            >
                              {project.title}
                            </Link>
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                              Cycle {project.reviewRound}
                            </span>
                          </div>
                        </td>

                        {/* Plant / Study */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-emerald-800">
                              {project.plantName}
                            </span>
                            {project.plantScientificName && (
                              <span className="italic font-serif text-[11.5px] text-slate-500">
                                {project.plantScientificName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Researcher */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-medium text-slate-700">
                            {project.researcherName}
                          </span>
                        </td>

                        {/* Research Progress (e.g. Stage 3 of 6 · 33%) */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1 min-w-[120px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-700">
                                Stage {project.stageNumber} of 6
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {project.progressPercent}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${project.progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 truncate">
                              {project.stageName}
                            </span>
                          </div>
                        </td>

                        {/* Professional Review Progress (e.g. 2 / 5 complete) */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 min-w-[130px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-700">
                                {project.completedReviewsCount} / {project.totalRequiredReviews} complete
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">{percentComplete}%</span>
                            </div>

                            {/* Thin progress line */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  percentComplete === 100
                                    ? "bg-emerald-500"
                                    : percentComplete > 0
                                    ? "bg-blue-500"
                                    : "bg-slate-300"
                                }`}
                                style={{ width: `${percentComplete}%` }}
                              />
                            </div>

                            {/* 5 Area Micro Indicators */}
                            <div className="flex items-center gap-1 mt-0.5">
                              {project.areas.map((area) => {
                                const Icon = ROLE_ICONS[area.key] || Leaf;
                                const isDone = area.isCompleted;
                                const isRev =
                                  area.status === "Revision Requested" || area.status === "Revision Submitted";
                                const isProg = area.status === "In Review";
                                const isNotReady =
                                  area.status === "Not Ready" || area.status === "Not Submitted";

                                return (
                                  <div
                                    key={area.key}
                                    title={`${area.checkingArea}: ${area.status}`}
                                    className={`w-5 h-5 rounded flex items-center justify-center transition-transform hover:scale-110 ${
                                      isDone
                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                        : isRev
                                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                                        : isProg
                                        ? "bg-sky-100 text-sky-700 border border-sky-200 animate-pulse"
                                        : isNotReady
                                        ? "bg-slate-50 text-slate-300 border border-slate-100"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                  >
                                    <Icon className="w-3 h-3" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Project Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              project.displayStatus === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : project.displayStatus === "Revisions Needed"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : project.displayStatus === "Under Review"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : project.displayStatus === "Archived"
                                ? "bg-slate-100 text-slate-600 border border-slate-200"
                                : "bg-sky-50 text-sky-700 border border-sky-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                project.displayStatus === "Completed"
                                  ? "bg-emerald-500"
                                  : project.displayStatus === "Revisions Needed"
                                  ? "bg-rose-500"
                                  : project.displayStatus === "Under Review"
                                  ? "bg-blue-500"
                                  : project.displayStatus === "Archived"
                                  ? "bg-slate-400"
                                  : "bg-sky-500"
                              }`}
                            />
                            {project.displayStatus}
                          </span>
                        </td>

                        {/* Updated */}
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                          {formatRelativeTime(project.updatedAt)}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-5 whitespace-nowrap text-right">
                          <Link
                            href={`/reviewer/projects/${project.projectId}?tab=section1`}
                            onClick={() => handleSelectProject(project)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                              project.displayStatus === "Completed"
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                            }`}
                          >
                            <span>{project.action.label}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="lg:hidden divide-y divide-slate-100">
              {projects.map((project) => (
                <div key={project.projectId} className="p-4 sm:p-5 space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Link
                        href={`/reviewer/projects/${project.projectId}?tab=section1`}
                        onClick={() => handleSelectProject(project)}
                        className="font-heading font-bold text-base text-slate-900 hover:text-blue-600"
                      >
                        {project.title}
                      </Link>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        Cycle {project.reviewRound}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="font-semibold text-emerald-800">{project.plantName}</span>
                      {project.plantScientificName && (
                        <span className="italic font-serif text-[11.5px] text-slate-500">
                          · {project.plantScientificName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Researcher</span>
                      <span className="font-medium text-slate-800">{project.researcherName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Progress</span>
                      <span className="font-medium text-slate-800">
                        Stage {project.stageNumber} of 6 ({project.progressPercent}%)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                      <span className="font-semibold text-slate-800">{project.displayStatus}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/reviewer/projects/${project.projectId}?tab=section1`}
                      onClick={() => handleSelectProject(project)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                    >
                      {project.action.label}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
