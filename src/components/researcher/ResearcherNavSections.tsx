"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FlaskConical,
  MessageSquareWarning,
  UserRound,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck2,
  Cpu,
  Award,
} from "lucide-react";

interface V2ProgressResponse {
  section1: { status: string; completedSteps: number; totalSteps: number };
  section2: { status: string; completedSteps: number; totalSteps: number };
  section3: { status: string; completedSteps: number; totalSteps: number };
  section4?: { status: string; completedSteps: number; totalSteps: number };
  overallStatus: string;
  overallProgressPercent: number;
  sectionApprovalPercent?: {
    section1: number;
    section2: number;
    section3: number;
    overall: number;
  };
  approvedStepsBySection?: {
    section1: number[];
    section2: number[];
    section3: number[];
  };
}

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

  // Active project ID state
  const [activeProjectId, setActiveProjectId] = useState<number | null>(routeProjectId);
  const [projectTitle, setProjectTitle] = useState<string>("Active Project");
  const [v2Progress, setV2Progress] = useState<V2ProgressResponse | null>(null);
  const [openRevisionsCount, setOpenRevisionsCount] = useState<number>(0);

  // Sync routeProjectId with sessionStorage
  useEffect(() => {
    if (routeProjectId) {
      setActiveProjectId(routeProjectId);
      try {
        sessionStorage.setItem("natureaide_active_project_id", String(routeProjectId));
      } catch {}
    } else {
      try {
        const saved = sessionStorage.getItem("natureaide_active_project_id");
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed)) setActiveProjectId(parsed);
        }
      } catch {}
    }
  }, [routeProjectId]);

  // Load project details and V2 progress when activeProjectId is set
  useEffect(() => {
    if (!activeProjectId) {
      // Fetch user's first project if none active
      fetch("/api/researcher/projects")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.projects && data.projects.length > 0) {
            setActiveProjectId(data.projects[0].id);
            setProjectTitle(data.projects[0].title || "Active Project");
          }
        })
        .catch(() => {});
      return;
    }

    const loadData = async () => {
      try {
        const [projRes, progRes, revRes] = await Promise.all([
          fetch(`/api/researcher/projects/${activeProjectId}`),
          fetch(`/api/researcher/projects/${activeProjectId}/v2-progress`),
          fetch(`/api/researcher/projects/${activeProjectId}/feedback`),
        ]);

        if (projRes.ok) {
          const pData = await projRes.json();
          if (pData?.project?.title) setProjectTitle(pData.project.title);
        }

        if (progRes.ok) {
          const progData = await progRes.json();
          if (progData?.progress) setV2Progress(progData.progress);
        }

        if (revRes.ok) {
          const revData = await revRes.json();
          if (revData?.feedback) {
            const openCount = revData.feedback.filter((f: any) => f.status === "OPEN" || f.status === "IN_REVIEW").length;
            setOpenRevisionsCount(openCount);
          }
        }
      } catch (err) {
        console.error("Error loading active project nav data:", err);
      }
    };

    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("natureaide:project-updated", handleUpdate);
    window.addEventListener("natureaide:revisions-updated", handleUpdate);
    window.addEventListener("natureaide:review-updated", handleUpdate);
    return () => {
      window.removeEventListener("natureaide:project-updated", handleUpdate);
      window.removeEventListener("natureaide:revisions-updated", handleUpdate);
      window.removeEventListener("natureaide:review-updated", handleUpdate);
    };
  }, [activeProjectId, pathname]);

  // Active path matchers
  const isDashboardActive = pathname === "/researcher";
  const isMyResearchActive = pathname === "/researcher/projects" || pathname === "/researcher/projects/new" || pathname.includes("new=true");
  const isAssistantActive = pathname.startsWith("/researcher/assistant");
  const isWorkspaceActive = routeProjectId !== null && (activeSubpath === "" || activeSubpath === undefined);
  const isSection1Active = activeSubpath === "formulation-rd" || activeSubpath === "formulation" || activeSubpath === "formulation-safety" || activeSubpath === "plant-literature";
  const isSection2Active = activeSubpath === "in-silico" || activeSubpath === "docking";
  const isSection3Active = activeSubpath === "submission" || activeSubpath === "knowledge-integration";
  const isCompletionActive = activeSubpath === "completion" || activeSubpath === "complete";
  const isReviewFeedbackActive = pathname.includes("/revisions") || activeSubpath === "revisions" || pathname.startsWith("/researcher/review-feedback");
  const isCompletedResearchActive = pathname.startsWith("/researcher/completed");
  const isProfileActive = pathname.startsWith("/researcher/profile");

  const progressPercent = v2Progress?.overallProgressPercent ?? 0;
  const projectStatusDisplay = v2Progress?.overallStatus || "Draft";
  const overallApprovalPct = v2Progress?.sectionApprovalPercent?.overall ?? 0;

  const getSectionBadge = (
    status?: string,
    approvalPct?: number
  ) => {
    if (typeof approvalPct === "number" && approvalPct > 0) {
      if (approvalPct >= 100) {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>Approved</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold font-mono text-emerald-300 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-600/40">
          {approvalPct}% Approved
        </span>
      );
    }
    if (status === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
          Complete
        </span>
      );
    }
    if (status === "IN_PROGRESS") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
        Not Started
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (status === "COMPLETED") {
      return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">Complete</span>;
    }
    if (status === "IN_PROGRESS") {
      return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">In Progress</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">Not Started</span>;
  };

  return (
    <nav className="space-y-4 text-white select-none" aria-label="NatureAide Researcher Navigation">
      {/* 1. MAIN NAVIGATION */}
      <div className="space-y-1">
        {!collapsed && (
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">
            Main
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
          <LayoutDashboard className={`w-4 h-4 shrink-0 ${isDashboardActive ? "text-emerald-300" : "text-slate-400"}`} />
          {!collapsed && <span className="truncate">Dashboard</span>}
        </Link>

        {/* My Research */}
        <Link
          href="/researcher/projects"
          onClick={onNavigate}
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            isMyResearchActive
              ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
          title={collapsed ? "My Research" : undefined}
        >
          <FolderKanban className={`w-4 h-4 shrink-0 ${isMyResearchActive ? "text-emerald-300" : "text-slate-400"}`} />
          {!collapsed && <span className="truncate">My Research</span>}
        </Link>

        {/* Review Feedback / Revisions */}
        <Link
          href={
            activeProjectId
              ? `/researcher/revisions?projectId=${activeProjectId}`
              : "/researcher/revisions"
          }
          onClick={onNavigate}
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            isReviewFeedbackActive
              ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
          title={collapsed ? "Review Revisions & Feedback" : undefined}
        >
          <MessageSquareWarning
            className={`w-4 h-4 shrink-0 ${
              isReviewFeedbackActive
                ? "text-emerald-300"
                : openRevisionsCount > 0
                ? "text-amber-400"
                : "text-slate-400"
            }`}
          />
          {!collapsed ? (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">Review Revisions</span>
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

        {/* Completed Research */}
        <Link
          href="/researcher/completed"
          onClick={onNavigate}
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            isCompletedResearchActive
              ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
          title={collapsed ? "Completed Research" : undefined}
        >
          <Award className={`w-4 h-4 shrink-0 ${isCompletedResearchActive ? "text-emerald-300" : "text-slate-400"}`} />
          {!collapsed && <span className="truncate">Completed Research</span>}
        </Link>
      </div>

      {/* 2. RESEARCH WORKSPACE (V2 3 SECTIONS) */}
      <div className="space-y-1.5 pt-3 border-t border-emerald-900/50">
        {!collapsed && (
          <div className="flex items-center justify-between px-3 pb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">
              Research Workspace
            </span>
            {activeProjectId && (
              <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/40">
                {overallApprovalPct > 0 ? `${overallApprovalPct}% Approved` : `${progressPercent}%`}
              </span>
            )}
          </div>
        )}

        {activeProjectId ? (
          <div className="space-y-1.5">
            {/* Overview / Project Hub */}
            <Link
              href={`/researcher/projects/${activeProjectId}`}
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                isWorkspaceActive
                  ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? "Project Overview" : undefined}
            >
              <FlaskConical className={`w-4 h-4 shrink-0 ${isWorkspaceActive ? "text-emerald-300" : "text-slate-400"}`} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">Overview</span>
                  <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-700/40">
                    {projectStatusDisplay}
                  </span>
                </div>
              )}
            </Link>

            {/* Section 1: Formulation Research & Development */}
            <Link
              href={`/researcher/projects/${activeProjectId}/formulation-rd`}
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isSection1Active
                  ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? "Section 1: Formulation R&D" : undefined}
            >
              <Layers className={`w-4 h-4 shrink-0 ${isSection1Active ? "text-emerald-300" : "text-slate-400"}`} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">1. Formulation R&amp;D</span>
                  {getSectionBadge(v2Progress?.section1?.status, v2Progress?.sectionApprovalPercent?.section1)}
                </div>
              )}
            </Link>

            {/* Section 2: In-Silico Analysis */}
            <Link
              href={`/researcher/projects/${activeProjectId}/in-silico`}
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isSection2Active
                  ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? "Section 2: In-Silico Analysis" : undefined}
            >
              <Cpu className={`w-4 h-4 shrink-0 ${isSection2Active ? "text-emerald-300" : "text-slate-400"}`} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">2. In-Silico Analysis</span>
                  {getSectionBadge(v2Progress?.section2?.status, v2Progress?.sectionApprovalPercent?.section2)}
                </div>
              )}
            </Link>

            {/* Section 3: Research Paper Submission */}
            <Link
              href={`/researcher/projects/${activeProjectId}/submission`}
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isSection3Active
                  ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? "Section 3: Paper Submission" : undefined}
            >
              <FileCheck2 className={`w-4 h-4 shrink-0 ${isSection3Active ? "text-emerald-300" : "text-slate-400"}`} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">3. Paper Submission</span>
                  {getSectionBadge(v2Progress?.section3?.status, v2Progress?.sectionApprovalPercent?.section3)}
                </div>
              )}
            </Link>

            {/* Section 4: Professional Approval */}
            <Link
              href={`/researcher/projects/${activeProjectId}/completion`}
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isCompletionActive
                  ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? "4. Professional Approval" : undefined}
            >
              <Award className={`w-4 h-4 shrink-0 ${isCompletionActive ? "text-emerald-300" : "text-slate-400"}`} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">4. Professional Approval</span>
                  {getSectionBadge(
                    v2Progress?.section4?.status ||
                      (v2Progress?.overallStatus === "Completed"
                        ? "COMPLETED"
                        : v2Progress?.section3?.status === "COMPLETED"
                        ? "IN_PROGRESS"
                        : "NOT_STARTED"),
                    overallApprovalPct
                  )}
                </div>
              )}
            </Link>

            {/* Ask NatureAide AI (After Section 4) */}
            <Link
              href="/researcher/assistant"
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isAssistantActive
                  ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? "Ask NatureAide AI" : undefined}
            >
              <Sparkles
                className={`w-4 h-4 shrink-0 ${
                  isAssistantActive ? "text-emerald-300 animate-pulse" : "text-emerald-400"
                }`}
              />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">Ask NatureAide</span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    AI
                  </span>
                </div>
              )}
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {!collapsed && (
              <div className="mx-1 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/40 border-dashed text-center">
                <p className="text-[11px] text-slate-400">Select or start a research project to open workspace</p>
              </div>
            )}
            <Link
              href="/researcher/assistant"
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isAssistantActive
                  ? "bg-emerald-600/25 text-emerald-300 font-semibold border-l-2 border-emerald-400"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? "Ask NatureAide AI" : undefined}
            >
              <Sparkles
                className={`w-4 h-4 shrink-0 ${
                  isAssistantActive ? "text-emerald-300 animate-pulse" : "text-emerald-400"
                }`}
              />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">Ask NatureAide</span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    AI
                  </span>
                </div>
              )}
            </Link>
          </div>
        )}
      </div>

      {/* 3. ACCOUNT */}
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
          <UserRound className={`w-4 h-4 shrink-0 ${isProfileActive ? "text-emerald-300" : "text-slate-400"}`} />
          {!collapsed && <span className="truncate">Profile</span>}
        </Link>
      </div>
    </nav>
  );
}
