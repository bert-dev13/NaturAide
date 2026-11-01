"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FlaskConical,
  UserRound,
  Sparkles,
  MessageSquareWarning,
} from "lucide-react";
import { WORKFLOW_STAGES } from "@/lib/workflow-stages";

interface ProjectDetails {
  id: number;
  title: string;
  plantName?: string;
  plantScientificName?: string;
  currentStage?: string;
  status?: string;
}

interface StageRecord {
  stageKey: string;
  status: string;
}

interface ProjectApiResponse {
  success: boolean;
  project: ProjectDetails;
  stages: StageRecord[];
  completedStagesCount: number;
  openFeedbackCount?: number;
  reviewerFeedback?: any[];
}

// In-memory cache across navigation within the researcher platform
const projectCache = new Map<number, ProjectApiResponse>();

export default function ResearcherNavSections({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || "";

  // Extract projectId if inside /researcher/projects/:id(/...)
  const projectMatch = pathname.match(/^\/researcher\/projects\/(\d+)(?:\/([a-zA-Z0-9_-]+))?/);
  const routeProjectId = projectMatch ? parseInt(projectMatch[1], 10) : null;
  const activeSubpath = projectMatch && projectMatch[2] ? projectMatch[2] : "";

  // Persistent active project id across researcher pages
  const [activeProjectId, setActiveProjectId] = useState<number | null>(routeProjectId);

  // Sync routeProjectId with sessionStorage / local state
  useEffect(() => {
    if (routeProjectId) {
      setActiveProjectId(routeProjectId);
      try {
        sessionStorage.setItem("natureaide_active_project_id", String(routeProjectId));
      } catch {
        // ignore
      }
    } else {
      try {
        const saved = sessionStorage.getItem("natureaide_active_project_id");
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed)) setActiveProjectId(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, [routeProjectId]);

  // Project state
  const [projectData, setProjectData] = useState<ProjectApiResponse | null>(() => {
    return activeProjectId && projectCache.has(activeProjectId)
      ? projectCache.get(activeProjectId)!
      : null;
  });

  useEffect(() => {
    if (!activeProjectId) {
      let isMounted = true;
      fetch("/api/researcher/projects")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isMounted || !data?.projects || data.projects.length === 0) return;
          const firstProj = data.projects[0];
          setActiveProjectId(firstProj.id);
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }

    if (projectCache.has(activeProjectId)) {
      setProjectData(projectCache.get(activeProjectId)!);
    }

    let isMounted = true;

    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/researcher/projects/${activeProjectId}`);
        if (!res.ok) return;
        const data: ProjectApiResponse = await res.json();
        if (data.success && isMounted) {
          projectCache.set(activeProjectId, data);
          setProjectData(data);
        }
      } catch (err) {
        console.error("Error fetching project for sidebar:", err);
      }
    };

    fetchProject();

    const handleUpdate = () => fetchProject();
    window.addEventListener("natureaide:project-updated", handleUpdate);
    window.addEventListener("natureaide:revisions-updated", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("natureaide:project-updated", handleUpdate);
      window.removeEventListener("natureaide:revisions-updated", handleUpdate);
    };
  }, [activeProjectId, pathname]);

  // Active section helpers
  const isDashboardActive = pathname === "/researcher";
  const isAssistantActive = pathname.startsWith("/researcher/assistant");
  const isProjectsActive =
    pathname === "/researcher/projects" || pathname.startsWith("/researcher/projects?new=true");

  const isRevisionsActive =
    pathname.endsWith("/revisions") ||
    activeSubpath === "revisions" ||
    (activeProjectId !== null && pathname === `/researcher/projects/${activeProjectId}/revisions`);

  const isWorkspaceActive =
    routeProjectId !== null && (activeSubpath === "" || activeSubpath === undefined);

  const isJourneyActive =
    routeProjectId !== null &&
    (activeSubpath === "journey" ||
      WORKFLOW_STAGES.some((s) => s.path === activeSubpath || s.key === activeSubpath));

  const isProfileActive = pathname.startsWith("/researcher/profile");

  // Stage status mapping
  const stageStatusMap: Record<string, string> = {};
  if (projectData?.stages) {
    for (const s of projectData.stages) {
      stageStatusMap[s.stageKey] = s.status;
    }
  }

  // Count completed stages
  const completedCount =
    typeof projectData?.completedStagesCount === "number"
      ? projectData.completedStagesCount
      : WORKFLOW_STAGES.filter((s) => stageStatusMap[s.key] === "COMPLETED").length;

  const progressPercent = Math.min(100, Math.round((completedCount / 6) * 100));

  // Current stage info
  const rawCurrentStage = String(projectData?.project?.currentStage || "plant-literature");
  const stageNum = parseInt(rawCurrentStage, 10);
  const currentStageIndex = WORKFLOW_STAGES.findIndex(
    (s) =>
      s.key === rawCurrentStage ||
      s.path === rawCurrentStage ||
      (!isNaN(stageNum) && s.number === stageNum)
  );
  const currentStageObj =
    currentStageIndex !== -1 ? WORKFLOW_STAGES[currentStageIndex] : WORKFLOW_STAGES[0];
  const currentStageNumber = currentStageObj.number;

  const projectTitle = projectData?.project?.title || "Phytochemical & In-Silico Study";
  const scientificName =
    projectData?.project?.plantScientificName ||
    projectData?.project?.plantName ||
    "Botanical Specimen";

  const openRevisionsCount =
    typeof projectData?.openFeedbackCount === "number"
      ? projectData.openFeedbackCount
      : (projectData?.reviewerFeedback?.filter(
          (f: any) => f.status === "OPEN" || f.status === "IN_REVIEW"
        ).length || 0);

  return (
    <nav className="space-y-4 text-white select-none" aria-label="Researcher Platform Navigation">
      {/* ================================================== */}
      {/* 1. WORKSPACE SECTION                               */}
      {/* ================================================== */}
      <div className="space-y-1">
        {!collapsed && (
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">
            Workspace
          </p>
        )}

        {/* Dashboard */}
        <Link
          href="/researcher"
          onClick={onNavigate}
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            isDashboardActive
              ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
          title={collapsed ? "Dashboard" : undefined}
        >
          <LayoutDashboard
            className={`w-4 h-4 shrink-0 transition-colors ${
              isDashboardActive ? "text-emerald-300" : "text-slate-400"
            }`}
          />
          {!collapsed && <span className="truncate">Dashboard</span>}
        </Link>

        {/* My Research Projects */}
        <Link
          href="/researcher/projects"
          onClick={onNavigate}
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            isProjectsActive
              ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
          title={collapsed ? "My Research Projects" : undefined}
        >
          <FolderKanban
            className={`w-4 h-4 shrink-0 transition-colors ${
              isProjectsActive ? "text-emerald-300" : "text-slate-400"
            }`}
          />
          {!collapsed && <span className="truncate">My Research Projects</span>}
        </Link>

        {/* Research Revisions */}
        <Link
          href={
            activeProjectId
              ? `/researcher/projects/${activeProjectId}/revisions`
              : "/researcher/projects"
          }
          onClick={onNavigate}
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            isRevisionsActive
              ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
          title={
            collapsed
              ? openRevisionsCount > 0
                ? `Research Revisions (${openRevisionsCount} required)`
                : "Research Revisions"
              : undefined
          }
        >
          <MessageSquareWarning
            className={`w-4 h-4 shrink-0 transition-colors ${
              isRevisionsActive
                ? "text-emerald-300"
                : openRevisionsCount > 0
                ? "text-amber-400"
                : "text-slate-400"
            }`}
          />
          {!collapsed ? (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">Research Revisions</span>
              {openRevisionsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {openRevisionsCount}
                </span>
              )}
            </div>
          ) : (
            openRevisionsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
            )
          )}
        </Link>

        {/* Ask NatureAide */}
        <Link
          href="/researcher/assistant"
          onClick={onNavigate}
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            isAssistantActive
              ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
          title={collapsed ? "Ask NatureAide" : undefined}
        >
          <Sparkles
            className={`w-4 h-4 shrink-0 transition-colors ${
              isAssistantActive ? "text-emerald-300" : "text-slate-400"
            }`}
          />
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">Ask NatureAide</span>
              <span className="text-[10px] font-mono font-medium text-emerald-300/80 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-700/40">
                AI
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* ================================================== */}
      {/* 2. CURRENT INVESTIGATION SECTION                   */}
      {/* ================================================== */}
      <div className="space-y-1.5 pt-3 border-t border-emerald-900/50">
        {!collapsed && (
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">
            Current Investigation
          </p>
        )}

        {/* Dynamic Project Anchor Card */}
        {activeProjectId && projectData?.project ? (
          <div className="space-y-1.5">
            {!collapsed && (
              <div className="mx-1 p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-emerald-300/80">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active Study
                  </span>
                  <span className="font-mono text-emerald-300 font-semibold">
                    {progressPercent}%
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h3
                    className="font-medium text-xs text-white leading-snug line-clamp-2"
                    title={projectTitle}
                  >
                    {projectTitle}
                  </h3>
                  <p
                    className="text-[11px] italic text-emerald-300/70 font-normal truncate"
                    title={scientificName}
                  >
                    {scientificName}
                  </p>
                </div>

                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-[10px] text-emerald-300/60">
                    <span>Stage {currentStageNumber} of 6</span>
                    <span className="font-mono">{completedCount}/6</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-emerald-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Compact Revision Indicator on Active Study Card */}
                {openRevisionsCount > 0 && (
                  <Link
                    href={`/researcher/projects/${activeProjectId}/revisions`}
                    onClick={onNavigate}
                    className="mt-2 flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-medium transition-all group cursor-pointer"
                    title={`${openRevisionsCount} revisions required`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="flex h-1.5 w-1.5 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                      </span>
                      <span className="truncate font-semibold">
                        ! {openRevisionsCount} Revision{openRevisionsCount > 1 ? "s" : ""} Required
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300/80 group-hover:text-amber-200 group-hover:translate-x-0.5 transition-transform shrink-0">
                      &rarr;
                    </span>
                  </Link>
                )}
              </div>
            )}

            {/* Current Project Sub-Navigation */}
            <div className="space-y-1">
              <Link
                href={`/researcher/projects/${activeProjectId}`}
                onClick={onNavigate}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  isWorkspaceActive || isJourneyActive
                    ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
                title={collapsed ? "Project Workspace" : undefined}
              >
                <FlaskConical
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isWorkspaceActive || isJourneyActive ? "text-emerald-300" : "text-slate-400"
                  }`}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">Project Workspace</span>
                    <span className="text-[10px] font-mono font-medium text-emerald-300/70 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-700/40">
                      6 Stages
                    </span>
                  </div>
                )}
              </Link>
            </div>
          </div>
        ) : (
          !collapsed && (
            <div className="mx-1 p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40 border-dashed text-center space-y-1">
              <p className="text-xs font-medium text-slate-300">
                No Project Selected
              </p>
              <p className="text-[11px] text-slate-400 leading-snug">
                Open a project from My Research Projects to access its workspace.
              </p>
            </div>
          )
        )}
      </div>

      {/* ================================================== */}
      {/* 3. SETTINGS & ACCOUNT SECTION                      */}
      {/* ================================================== */}
      <div className="space-y-1 pt-3 border-t border-emerald-900/50">
        {!collapsed && (
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">
            Account
          </p>
        )}

        {/* Profile */}
        <Link
          href="/researcher/profile"
          onClick={onNavigate}
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            isProfileActive
              ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
          title={collapsed ? "Profile" : undefined}
        >
          <UserRound
            className={`w-4 h-4 shrink-0 transition-colors ${
              isProfileActive ? "text-emerald-300" : "text-slate-400"
            }`}
          />
          {!collapsed && <span className="truncate">Profile &amp; Credentials</span>}
        </Link>
      </div>
    </nav>
  );
}
