"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FlaskConical,
  Route,
  UserRound,
  Sparkles,
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

    return () => {
      isMounted = false;
      window.removeEventListener("natureaide:project-updated", handleUpdate);
    };
  }, [activeProjectId, pathname]);

  // Active section helpers
  const isDashboardActive = pathname === "/researcher";
  const isAssistantActive = pathname.startsWith("/researcher/assistant");
  const isProjectsActive =
    pathname === "/researcher/projects" || pathname.startsWith("/researcher/projects?new=true");

  const isWorkspaceActive =
    routeProjectId !== null && (activeSubpath === "" || activeSubpath === undefined);

  // Research Journey is active if on #research-journey or inside any of the 12 stage routes
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

  const progressPercent = Math.min(100, Math.round((completedCount / 7) * 100));

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

  const projectTitle = projectData?.project?.title || "In-Silico & Phytochemical Evaluation";
  const scientificName =
    projectData?.project?.plantScientificName ||
    projectData?.project?.plantName ||
    "Blumea balsamifera";

  return (
    <nav className="space-y-5 text-white select-none" aria-label="Researcher Platform Navigation">
      {/* ================================================== */}
      {/* 1. RESEARCH SECTION                                */}
      {/* ================================================== */}
      <div className="space-y-1">
        {!collapsed && (
          <p className="px-3 pb-1 text-[11px] font-heading font-extrabold uppercase tracking-wider text-emerald-400/90">
            Research
          </p>
        )}

        {/* Dashboard */}
        <Link
          href="/researcher"
          onClick={onNavigate}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all group ${
            isDashboardActive
              ? "bg-emerald-500/20 text-white font-bold border-l-[3px] border-emerald-400 shadow-xs"
              : "text-[#d0e5da] hover:text-white hover:bg-white/10"
          }`}
          title={collapsed ? "Dashboard" : undefined}
        >
          <LayoutDashboard
            className={`w-[18px] h-[18px] shrink-0 transition-colors ${
              isDashboardActive ? "text-emerald-300" : "text-emerald-300/60 group-hover:text-emerald-200"
            }`}
          />
          {!collapsed && <span className="truncate">Dashboard</span>}
        </Link>

        {/* My Research Projects */}
        <Link
          href="/researcher/projects"
          onClick={onNavigate}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all group ${
            isProjectsActive
              ? "bg-emerald-500/20 text-white font-bold border-l-[3px] border-emerald-400 shadow-xs"
              : "text-[#d0e5da] hover:text-white hover:bg-white/10"
          }`}
          title={collapsed ? "My Research Projects" : undefined}
        >
          <FolderKanban
            className={`w-[18px] h-[18px] shrink-0 transition-colors ${
              isProjectsActive ? "text-emerald-300" : "text-emerald-300/60 group-hover:text-emerald-200"
            }`}
          />
          {!collapsed && <span className="truncate">My Research Projects</span>}
        </Link>

        {/* Ask NatureAide */}
        <Link
          href="/researcher/assistant"
          onClick={onNavigate}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all group ${
            isAssistantActive
              ? "bg-emerald-500/20 text-white font-bold border-l-[3px] border-emerald-400 shadow-xs"
              : "text-[#d0e5da] hover:text-white hover:bg-white/10"
          }`}
          title={collapsed ? "Ask NatureAide" : undefined}
        >
          <Sparkles
            className={`w-[18px] h-[18px] shrink-0 transition-colors ${
              isAssistantActive ? "text-emerald-300" : "text-emerald-300/60 group-hover:text-emerald-200"
            }`}
          />
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="truncate">Ask NatureAide</span>
              <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-400/25 text-emerald-200 border border-emerald-400/30">
                AI
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* ================================================== */}
      {/* 2. CURRENT PROJECT SECTION                         */}
      {/* ================================================== */}
      <div className="space-y-1.5 pt-2 border-t border-white/10">
        {!collapsed && (
          <p className="px-2.5 pb-0.5 text-[10px] font-heading font-extrabold uppercase tracking-wider text-emerald-400/80">
            Current Project
          </p>
        )}

        {/* Dynamic Project Container Card */}
        {activeProjectId && projectData?.project ? (
          <div className="space-y-1.5">
            {!collapsed && (
              <div className="mx-1 p-2.5 rounded-xl bg-white/[0.07] backdrop-blur-xs border border-emerald-500/25 shadow-2xs space-y-1.5 hover:bg-white/[0.09] transition-colors">
                <div className="flex items-center justify-between text-[9.5px] font-heading font-extrabold uppercase tracking-wider text-emerald-300/90">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Project
                  </span>
                  <span className="font-mono font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                    {progressPercent}%
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h3
                    className="font-heading font-semibold text-[12px] text-white leading-tight line-clamp-2"
                    title={projectTitle}
                  >
                    {projectTitle}
                  </h3>
                  <p
                    className="text-[11px] italic text-emerald-300/80 font-normal truncate"
                    title={scientificName}
                  >
                    {scientificName}
                  </p>
                </div>

                <div className="pt-0.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-emerald-200/65">
                    <span className="font-medium">Stage {currentStageNumber} of 6</span>
                    <span className="font-mono font-semibold text-white/90">{completedCount}/6</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Current Project Sub-Navigation Links */}
            <div className="space-y-1">
              {/* Unified Project Workspace */}
              <Link
                href={`/researcher/projects/${activeProjectId}`}
                onClick={onNavigate}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all group ${
                  isWorkspaceActive || isJourneyActive
                    ? "bg-emerald-500/20 text-white font-bold border-l-[3px] border-emerald-400 shadow-xs"
                    : "text-[#d0e5da] hover:text-white hover:bg-white/10"
                }`}
                title={collapsed ? "Project Workspace (6 Stages)" : undefined}
              >
                <FlaskConical
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    isWorkspaceActive || isJourneyActive
                      ? "text-emerald-300"
                      : "text-emerald-300/60 group-hover:text-emerald-200"
                  }`}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">Project Workspace</span>
                    <span className="text-[10px] font-bold text-emerald-200 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/50">
                      6 Stages
                    </span>
                  </div>
                )}
              </Link>
            </div>
          </div>
        ) : (
          !collapsed && (
            <div className="mx-1 p-3 rounded-2xl bg-white/5 border border-white/15 border-dashed text-center space-y-1">
              <p className="text-[11px] font-heading font-bold text-white/80">
                No Project Selected
              </p>
              <p className="text-[10px] text-emerald-300/60 leading-snug">
                Open a project from My Research Projects to access its workspace &amp; journey.
              </p>
            </div>
          )
        )}
      </div>

      {/* ================================================== */}
      {/* 3. ACCOUNT SECTION                                 */}
      {/* ================================================== */}
      <div className="space-y-1 pt-2 border-t border-white/10">
        {!collapsed && (
          <p className="px-3 pb-1 text-[11px] font-heading font-extrabold uppercase tracking-wider text-emerald-400/90">
            Account
          </p>
        )}

        {/* Profile */}
        <Link
          href="/researcher/profile"
          onClick={onNavigate}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all group ${
            isProfileActive
              ? "bg-emerald-500/20 text-white font-bold border-l-[3px] border-emerald-400 shadow-xs"
              : "text-[#d0e5da] hover:text-white hover:bg-white/10"
          }`}
          title={collapsed ? "Profile" : undefined}
        >
          <UserRound
            className={`w-[18px] h-[18px] shrink-0 transition-colors ${
              isProfileActive ? "text-emerald-300" : "text-emerald-300/60 group-hover:text-emerald-200"
            }`}
          />
          {!collapsed && <span className="truncate">Profile</span>}
        </Link>
      </div>
    </nav>
  );
}
