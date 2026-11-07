"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Layers,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  CircleAlert,
  Circle,
  RefreshCw,
  ClipboardList,
  ClipboardCheck,
  MessageSquare,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { useReviewerProject } from "@/context/ReviewerProjectContext";

interface ReviewFlowStageItem {
  number: string;
  stageNumber: number;
  stageName: string;
  professionalExpert: string;
  expertise: string;
  areaKey: string;
}

const RESEARCH_REVIEW_FLOW_STAGES: ReviewFlowStageItem[] = [
  {
    number: "01",
    stageNumber: 1,
    stageName: "Section 1 · Formulation R&D",
    professionalExpert: "Formulation Scientist / Pharmacognosist",
    expertise: "Formulation Science & Pharmacognosy",
    areaKey: "formulation",
  },
  {
    number: "02",
    stageNumber: 2,
    stageName: "Section 2 · In-Silico Docking",
    professionalExpert: "Bioinformatician / Computational Scientist",
    expertise: "Bioinformatics & In-Silico",
    areaKey: "bioinformatics",
  },
  {
    number: "03",
    stageNumber: 3,
    stageName: "Section 3 · Paper Submission",
    professionalExpert: "Clinical Pharmacologist / Medical Reviewer",
    expertise: "Clinical Pharmacology & Paper",
    areaKey: "pharmacology",
  },
];

function getStageStatusConfig(status?: string): {
  icon: LucideIcon;
  label: string;
  iconColor: string;
  textColor: string;
  isApproved: boolean;
} {
  const norm = (status || "").toUpperCase();
  switch (norm) {
    case "APPROVED":
    case "COMPLETED":
      return {
        icon: CheckCircle2,
        label: "Approved",
        iconColor: "text-emerald-400",
        textColor: "text-emerald-300",
        isApproved: true,
      };
    case "REVISION_RESUBMITTED":
    case "RESUBMITTED":
      return {
        icon: RefreshCw,
        label: "Revision Resubmitted",
        iconColor: "text-teal-400",
        textColor: "text-teal-300",
        isApproved: false,
      };
    case "REVISION_REQUIRED":
    case "REVISIONS_REQUESTED":
      return {
        icon: AlertTriangle,
        label: "Revision Required",
        iconColor: "text-amber-400",
        textColor: "text-amber-300",
        isApproved: false,
      };
    case "IN_REVIEW":
    case "UNDER_REVIEW":
      return {
        icon: Clock3,
        label: "In Review",
        iconColor: "text-sky-400",
        textColor: "text-sky-300",
        isApproved: false,
      };
    case "PENDING":
    case "NEEDS_REVIEW":
    case "AWAITING_REVIEW":
      return {
        icon: Circle,
        label: "Pending",
        iconColor: "text-slate-400",
        textColor: "text-slate-300",
        isApproved: false,
      };
    case "NOT_SUBMITTED":
    default:
      return {
        icon: Circle,
        label: "Pending",
        iconColor: "text-slate-400",
        textColor: "text-slate-400",
        isApproved: false,
      };
  }
}

function getStageApprovalPercent(stageOrStatus?: any): number {
  if (stageOrStatus && typeof stageOrStatus === "object") {
    if (typeof stageOrStatus.approvedPercent === "number") {
      return stageOrStatus.approvedPercent;
    }
    const norm = (stageOrStatus.status || "").toUpperCase();
    if (norm === "APPROVED" || norm === "COMPLETED") return 100;
    if (norm === "IN_REVIEW" || norm === "UNDER_REVIEW") return 50;
    return 0;
  }
  const norm = (stageOrStatus || "").toUpperCase();
  if (norm === "APPROVED" || norm === "COMPLETED") return 100;
  if (norm === "IN_REVIEW" || norm === "UNDER_REVIEW") return 50;
  return 0;
}

export default function ReviewerSidebar({
  user,
}: {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}) {
  const [userName, setUserName] = useState(user?.name || "Professional Reviewer");
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeProject } = useReviewerProject();

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail?.name) {
        setUserName(e.detail.name);
      }
    };
    window.addEventListener("natureaide:user-profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("natureaide:user-profile-updated", handleProfileUpdate);
    };
  }, []);

  React.useEffect(() => {
    const updateSidebarVar = () => {
      if (window.innerWidth < 1024) {
        document.documentElement.style.setProperty("--sidebar-width", "0px");
      } else {
        document.documentElement.style.setProperty(
          "--sidebar-width",
          collapsed ? "80px" : "305px"
        );
      }
    };
    updateSidebarVar();
    window.addEventListener("resize", updateSidebarVar);
    return () => window.removeEventListener("resize", updateSidebarVar);
  }, [collapsed]);

  const isWorkspaceActive = pathname === "/reviewer";
  const isProjectsActive = pathname === "/reviewer/projects";
  const isRevisionsActive = pathname === "/reviewer/revisions" || pathname.startsWith("/reviewer/revisions");
  const currentSpecialtyParam = searchParams?.get("specialty");
  const isCheckingPath = pathname?.startsWith("/reviewer/checking/");

  // Live count of revisions waiting for reviewer action
  const [openRevisionsCount, setOpenRevisionsCount] = React.useState<number>(0);
  React.useEffect(() => {
    const fetchRevCount = () => {
      fetch("/api/reviewer/revisions")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.revisions) {
            const count = data.revisions.filter(
              (r: any) => r.findingStatus === "ADDRESSED" || r.findingStatus === "OPEN"
            ).length;
            setOpenRevisionsCount(count);
          }
        })
        .catch(() => {});
    };

    fetchRevCount();
    window.addEventListener("natureaide:revisions-updated", fetchRevCount);
    window.addEventListener("natureaide:review-updated", fetchRevCount);
    return () => {
      window.removeEventListener("natureaide:revisions-updated", fetchRevCount);
      window.removeEventListener("natureaide:review-updated", fetchRevCount);
    };
  }, [pathname]);

  // Extract project ID from URL if currently on a project page or fallback to active context
  const projectUrlMatch = pathname?.match(/\/reviewer\/projects\/(\d+)/);
  const currentProjectId = projectUrlMatch ? parseInt(projectUrlMatch[1], 10) : null;
  const [inferredProjectId, setInferredProjectId] = useState<number | null>(null);
  const effectiveProjectId = currentProjectId || activeProject?.id || inferredProjectId;

  // Authoritative project stage data directly maintained by sidebar
  const [sidebarProject, setSidebarProject] = useState<any>(null);

  const loadSidebarProject = useCallback(async (pid: number) => {
    try {
      const res = await fetch(`/api/reviewer/projects/${pid}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.project) {
          setSidebarProject(json.project);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (effectiveProjectId) {
      loadSidebarProject(effectiveProjectId);
    } else {
      // If no active project in URL or context, load first reviewer project
      fetch("/api/reviewer/projects")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.projects && data.projects.length > 0) {
            const firstId = Number(data.projects[0].id);
            setInferredProjectId(firstId);
            loadSidebarProject(firstId);
          }
        })
        .catch(() => {});
    }

    const handleUpdate = () => {
      if (effectiveProjectId) {
        loadSidebarProject(effectiveProjectId);
      }
    };
    window.addEventListener("natureaide:review-updated", handleUpdate);
    window.addEventListener("natureaide:project-updated", handleUpdate);
    return () => {
      window.removeEventListener("natureaide:review-updated", handleUpdate);
      window.removeEventListener("natureaide:project-updated", handleUpdate);
    };
  }, [effectiveProjectId, loadSidebarProject]);

  const projToUse = sidebarProject || activeProject;

  const stagesToRender = RESEARCH_REVIEW_FLOW_STAGES.map((base) => {
    const dynamic = projToUse?.stages?.find(
      (s: any) => Number(s.stageNumber) === base.stageNumber || s.areaKey === base.areaKey
    );
    const approvedStepCount = dynamic?.approvedStepCount ?? (dynamic?.approvedSteps?.length || 0);
    const totalStepCount =
      dynamic?.totalStepCount ?? (base.stageNumber === 1 ? 6 : base.stageNumber === 2 ? 8 : 2);
    const stUpper = String(dynamic?.status || "").toUpperCase();
    const isApproved =
      stUpper === "APPROVED" || stUpper === "COMPLETED" || approvedStepCount >= totalStepCount;

    const approvedPercent = isApproved
      ? 100
      : typeof dynamic?.approvedPercent === "number" && dynamic.approvedPercent > 0
      ? dynamic.approvedPercent
      : Math.round((approvedStepCount / totalStepCount) * 100);

    return {
      ...base,
      status: isApproved ? "APPROVED" : dynamic?.status || "PENDING",
      statusLabel: isApproved ? "Approved" : dynamic?.statusLabel || dynamic?.status || "Pending",
      reviewerName: dynamic?.reviewerName || null,
      approvedAt: dynamic?.approvedAt || null,
      approvedStepCount,
      totalStepCount,
      approvedPercent,
    };
  });

  return (
    <aside
      className={`hidden lg:flex flex-col justify-between shrink-0 transition-all duration-300 border-r border-[#1e3a5f]/60 bg-gradient-to-b from-[#07172b] via-[#0b2447] to-[#051121] text-white ${
        collapsed ? "w-20 px-2.5 py-4" : "w-[305px] px-3.5 py-5"
      } h-screen sticky top-0 select-none shadow-xl z-30`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* LOGO & BRAND HEADER */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 shrink-0">
          <Link
            href="/reviewer"
            className="flex items-center gap-3 overflow-hidden group min-w-0"
            title="NatureAide Scientific Review Platform"
          >
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center shadow-md shadow-blue-950/40 group-hover:scale-105 transition-transform">
              <Image
                src="/images/nature-logo.png"
                alt="NatureAide Logo"
                width={28}
                height={28}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-extrabold text-[19px] tracking-tight text-white flex items-center gap-1.5 leading-tight">
                  NatureAide
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)] animate-pulse" />
                </span>
                <span className="text-[9.5px] font-bold text-blue-300/90 tracking-wider uppercase whitespace-nowrap">
                  SCIENTIFIC REVIEW PLATFORM
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 border border-white/10"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* NAVIGATION SECTIONS */}
        <div className="flex-1 overflow-y-auto pr-1 pb-2 space-y-4 custom-scrollbar">
          {/* SECTION: MAIN */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1">
                <p className="text-[10px] font-extrabold tracking-wider text-blue-300/80 uppercase">
                  MAIN
                </p>
              </div>
            )}
            <Link
              href="/reviewer"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-heading font-bold text-xs transition-all ${
                isWorkspaceActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-blue-300" />
              {!collapsed && <span>Dashboard</span>}
            </Link>

            <Link
              href="/reviewer/projects"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-heading font-bold text-xs transition-all ${
                isProjectsActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Review Queue & All Projects"
            >
              <Layers className="w-4 h-4 shrink-0 text-blue-300" />
              {!collapsed && <span>Review Queue</span>}
            </Link>

            {/* Dedicated Revisions Page */}
            <Link
              href="/reviewer/revisions"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-heading font-bold text-xs transition-all ${
                isRevisionsActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Revisions & Findings Queue"
            >
              <RotateCcw className="w-4 h-4 shrink-0 text-amber-300" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">Revisions</span>
                  {openRevisionsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {openRevisionsCount}
                    </span>
                  )}
                </div>
              )}
            </Link>
          </div>

          {/* SECTION: PROJECT REVIEW (Selected Botanical Subject) */}
          <div className="space-y-1">
            {!collapsed ? (
              <div className="p-2.5 rounded-xl bg-[#0a2318] border border-emerald-600/35 text-white shadow-xs space-y-1">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-600/25">
                  <p className="text-[9.5px] font-extrabold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    PROJECT REVIEW
                  </p>
                  <Link
                    href="/reviewer/projects"
                    className="text-[9.5px] font-medium text-emerald-300 hover:text-white underline transition-colors cursor-pointer"
                    title="Change to another research project"
                  >
                    {activeProject ? "Change" : "Select"}
                  </Link>
                </div>
                {activeProject ? (
                  <Link
                    href={`/reviewer/projects/${activeProject.id}?tab=section1`}
                    className="block group pt-0.5"
                    title={`View ${activeProject.title}`}
                  >
                    <p
                      className="font-heading font-extrabold text-xs text-white leading-snug line-clamp-2 group-hover:text-emerald-300 transition-colors"
                      title={activeProject.title}
                    >
                      {activeProject.title}
                    </p>
                  </Link>
                ) : effectiveProjectId ? (
                  <Link
                    href={`/reviewer/projects/${effectiveProjectId}?tab=section1`}
                    className="block group pt-0.5"
                    title={`View Research Project #${effectiveProjectId}`}
                  >
                    <p className="font-heading font-extrabold text-xs text-white leading-snug line-clamp-2 group-hover:text-emerald-300 transition-colors">
                      Research Project #{effectiveProjectId}
                    </p>
                  </Link>
                ) : (
                  <div className="py-1 text-center">
                    <p className="text-[11px] text-slate-300">No project active</p>
                    <Link
                      href="/reviewer/projects"
                      className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold text-emerald-200 bg-emerald-900/60 hover:bg-emerald-800 transition-colors"
                    >
                      Select a Project →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/reviewer/projects"
                className="w-10 h-10 mx-auto rounded-xl bg-[#0a2318] border border-emerald-600/40 flex items-center justify-center text-emerald-400 hover:text-white transition-colors cursor-pointer block"
                title={
                  activeProject
                    ? `Active Project: ${activeProject.plantName} (${activeProject.plantScientificName || ""}) · Click to change`
                    : "Select a Research Project"
                }
              >
                <FlaskConical className="w-4 h-4 mx-auto" />
              </Link>
            )}
          </div>

          {/* SECTION: RESEARCH REVIEW FLOW */}
          <div className="space-y-1.5">
            {!collapsed && (
              <div className="px-3 pb-0.5">
                <p className="text-[10px] font-extrabold tracking-wider text-blue-300/80 uppercase">
                  RESEARCH REVIEW FLOW
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              {stagesToRender.map((stage) => {
                const statusConfig = getStageStatusConfig(stage.status);
                const StatusIcon = statusConfig.icon;
                const percent = stage.approvedPercent ?? getStageApprovalPercent(stage);
                const targetTab =
                  stage.stageNumber === 1
                    ? "section1"
                    : stage.stageNumber === 2
                    ? "section2"
                    : "section3";

                const isStageActive = (() => {
                  if (pathname?.startsWith("/reviewer/projects/")) {
                    const currentTab = searchParams?.get("tab") || "section1";
                    return currentTab === targetTab;
                  }
                  if (isCheckingPath) {
                    return pathname === `/reviewer/checking/${stage.areaKey}`;
                  }
                  return false;
                })();

                const targetHref = effectiveProjectId
                  ? `/reviewer/projects/${effectiveProjectId}?tab=${targetTab}&specialty=${stage.areaKey}`
                  : `/reviewer/projects`;

                if (collapsed) {
                  return (
                    <Link
                      key={stage.number}
                      href={targetHref}
                      className={`w-10 h-10 mx-auto rounded-lg flex flex-col items-center justify-center transition-all border ${
                        isStageActive
                          ? "bg-blue-600 text-white border-blue-400 shadow-md"
                          : "bg-white/5 border-white/10 hover:bg-white/15 text-slate-300"
                      }`}
                      title={`Stage ${stage.number} — ${stage.stageName}\n${stage.professionalExpert}\nApproval: ${percent}% (${statusConfig.label})`}
                    >
                      <span className="text-[10px] font-mono font-bold leading-none">{stage.number}</span>
                      <span className={`text-[8.5px] font-mono font-bold mt-0.5 ${percent === 100 ? "text-emerald-300" : "text-slate-300"}`}>
                        {percent}%
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={stage.number}
                    href={targetHref}
                    className={`group block px-2.5 py-2 rounded-xl transition-all border ${
                      isStageActive
                        ? "bg-blue-600/30 text-white border-blue-400 shadow-sm"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-slate-200"
                    }`}
                    title={`${stage.number} ${stage.stageName} · ${stage.professionalExpert} · ${percent}% Approved`}
                  >
                    {/* ROW 1: STATUS ICON + STAGE NUMBER + STAGE NAME + APPROVAL PERCENTAGE */}
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`shrink-0 ${statusConfig.iconColor}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-mono text-xs font-black text-blue-300 shrink-0">
                          {stage.number}
                        </span>
                        <span className="font-heading font-bold text-xs text-white leading-tight truncate">
                          {stage.stageName}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          percent === 100
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {percent}% Approved
                      </span>
                    </div>

                    {/* ROW 2: PROFESSIONAL EXPERT & PROGRESS BAR */}
                    <div className="mt-1 pl-5 space-y-1">
                      <div className="flex items-center justify-between text-[10.5px] text-slate-300">
                        <span className="truncate">{stage.professionalExpert}</span>
                        <span className={`text-[10px] font-medium ${statusConfig.textColor}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            percent === 100
                              ? "bg-emerald-400"
                              : percent > 0
                              ? "bg-sky-400"
                              : "bg-white/15"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* PROFESSIONAL EVALUATION PANEL (3 ROLES) */}
              {(() => {
                const approvedCount = stagesToRender.filter(
                  (s) => s.approvedPercent === 100
                ).length;
                const totalApprovalPercent = Math.round(
                  stagesToRender.reduce((sum, s) => sum + s.approvedPercent, 0) / 3
                );

                const isEvaluationActive = (() => {
                  if (pathname?.startsWith("/reviewer/projects/")) {
                    const currentTab = searchParams?.get("tab");
                    return currentTab === "evaluation";
                  }
                  return pathname === "/reviewer/evaluation";
                })();

                const evaluationHref = effectiveProjectId
                  ? `/reviewer/projects/${effectiveProjectId}?tab=evaluation`
                  : "/reviewer/evaluation";

                if (collapsed) {
                  return (
                    <Link
                      href={evaluationHref}
                      className={`w-10 h-10 mx-auto rounded-lg flex flex-col items-center justify-center transition-all border mt-2 ${
                        isEvaluationActive
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                          : "bg-indigo-950/40 border-indigo-500/30 hover:bg-indigo-900/40 text-indigo-200"
                      }`}
                      title={`Professional Evaluation Panel (3 Roles)\nTotal Approval: ${totalApprovalPercent}% (${approvedCount}/3 Approved)`}
                    >
                      <ClipboardCheck
                        className={`w-4 h-4 ${
                          totalApprovalPercent === 100 ? "text-emerald-300" : "text-indigo-300"
                        }`}
                      />
                      <span className="text-[8.5px] font-mono font-bold mt-0.5">
                        {totalApprovalPercent}%
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    href={evaluationHref}
                    className={`group block px-2.5 py-2 rounded-xl transition-all border mt-2 ${
                      isEvaluationActive
                        ? "bg-indigo-600/35 text-white border-indigo-400 shadow-sm"
                        : "bg-gradient-to-r from-indigo-950/40 via-blue-950/30 to-indigo-950/40 border-indigo-500/30 hover:border-indigo-400/50 hover:bg-indigo-900/30 text-slate-200"
                    }`}
                    title="Professional Multidisciplinary Review Panel (3 Roles)"
                  >
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ClipboardCheck
                          className={`w-4 h-4 shrink-0 ${
                            totalApprovalPercent === 100
                              ? "text-emerald-400"
                              : "text-indigo-400"
                          }`}
                        />
                        <span className="font-heading font-bold text-xs text-white leading-tight truncate">
                          Professional Evaluation
                        </span>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          totalApprovalPercent === 100
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                            : "bg-white/10 text-indigo-200 border border-indigo-400/20"
                        }`}
                      >
                        {totalApprovalPercent}% Total
                      </span>
                    </div>

                    <div className="mt-1 pl-5 space-y-1">
                      <div className="flex items-center justify-between text-[10.5px] text-slate-300">
                        <span className="truncate">3 Professional Roles</span>
                        <span className="text-[10px] font-mono text-indigo-300 font-semibold">
                          {approvedCount} of 3 Approved
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            totalApprovalPercent === 100
                              ? "bg-emerald-400"
                              : totalApprovalPercent > 0
                              ? "bg-indigo-400"
                              : "bg-white/20"
                          }`}
                          style={{ width: `${totalApprovalPercent}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })()}
            </div>
          </div>

          {/* SECTION: AI */}
          <div className="pt-2 border-t border-white/10 space-y-1">
            <Link
              href="/reviewer/assistant"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === "/reviewer/assistant"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Ask NatureAide"
            >
              <Sparkles className="w-4 h-4 shrink-0 text-sky-400" />
              {!collapsed && <span>Ask NatureAide</span>}
            </Link>
          </div>

          {/* SECTION: ACCOUNT */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1">
                <p className="text-[10px] font-extrabold tracking-wider text-blue-300/80 uppercase">
                  ACCOUNT
                </p>
              </div>
            )}
            <Link
              href="/reviewer/profile"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === "/reviewer/profile"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Professional Profile"
            >
              <User className="w-4 h-4 shrink-0 text-blue-300" />
              {!collapsed && <span>Profile</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: GENERAL PROFESSIONAL REVIEWER & LOGOUT */}
      <div className="pt-3 border-t border-white/10 shrink-0 space-y-2.5">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/10 border border-white/15">
              <Link
                href="/reviewer/profile"
                className="flex items-center gap-2.5 min-w-0 flex-1 group"
                title={`${userName} (Reviewer Profile)`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-400/40">
                  {(userName || "P").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                    {userName}
                  </p>
                  <span className="text-[10px] text-blue-300/80 font-bold tracking-wider uppercase truncate block">
                    Reviewer
                  </span>
                </div>
              </Link>
            </div>
            <LogoutButton className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 transition-colors cursor-pointer" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/reviewer/profile"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-300 font-bold text-xs transition-colors"
              title={`${userName} (Reviewer Profile)`}
            >
              {(userName || "P").charAt(0).toUpperCase()}
            </Link>
            <LogoutButton iconOnly className="w-10 h-10 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-400/30 flex items-center justify-center transition-colors cursor-pointer" />
          </div>
        )}
      </div>
    </aside>
  );
}
