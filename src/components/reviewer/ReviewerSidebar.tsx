"use client";

import React, { useState } from "react";
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
  Clock,
  AlertCircle,
  Circle,
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
    stageName: "Plant & Literature",
    professionalExpert: "Pharmacist / Pharmacognosist",
    expertise: "Pharmacognosy",
    areaKey: "pharmacognosy",
  },
  {
    number: "02",
    stageNumber: 2,
    stageName: "In-Silico Analysis",
    professionalExpert: "Bioinformatician / Computational Scientist",
    expertise: "Bioinformatics",
    areaKey: "bioinformatics",
  },
  {
    number: "03",
    stageNumber: 3,
    stageName: "Molecular Docking",
    professionalExpert: "Pharmacologist",
    expertise: "Pharmacology",
    areaKey: "pharmacology",
  },
  {
    number: "04",
    stageNumber: 4,
    stageName: "Formulation",
    professionalExpert: "Pharmacist / Pharmaceutical Scientist",
    expertise: "Formulation",
    areaKey: "formulation",
  },
  {
    number: "05",
    stageNumber: 5,
    stageName: "Safety / Clinical",
    professionalExpert: "Physician / Clinical Pharmacist",
    expertise: "Clinical Safety",
    areaKey: "clinical_safety",
  },
  {
    number: "06",
    stageNumber: 6,
    stageName: "Knowledge Integration",
    professionalExpert: "Pharmacist / Pharmacognosist",
    expertise: "Pharmacognosy",
    areaKey: "pharmacognosy",
  },
];

function getStageStatusConfig(status?: string): {
  icon: LucideIcon;
  label: string;
  iconColor: string;
  textColor: string;
  isApproved: boolean;
} {
  switch (status) {
    case "APPROVED":
      return {
        icon: CheckCircle2,
        label: "Approved",
        iconColor: "text-emerald-400",
        textColor: "text-emerald-300",
        isApproved: true,
      };
    case "IN_REVIEW":
      return {
        icon: Clock,
        label: "In Review",
        iconColor: "text-sky-400",
        textColor: "text-sky-300",
        isApproved: false,
      };
    case "REVISION_REQUIRED":
      return {
        icon: AlertCircle,
        label: "Revision Required",
        iconColor: "text-amber-400",
        textColor: "text-amber-300",
        isApproved: false,
      };
    case "AWAITING_REVIEW":
      return {
        icon: Circle,
        label: "Awaiting Review",
        iconColor: "text-slate-400",
        textColor: "text-slate-300",
        isApproved: false,
      };
    case "NOT_SUBMITTED":
    default:
      return {
        icon: Circle,
        label: "Not Submitted",
        iconColor: "text-slate-400",
        textColor: "text-slate-400",
        isApproved: false,
      };
  }
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
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeProject } = useReviewerProject();

  const isWorkspaceActive = pathname === "/reviewer";
  const isProjectsActive = pathname === "/reviewer/projects" || pathname.startsWith("/reviewer/projects/");
  const currentStageParam = searchParams?.get("stage");
  const isCheckingPath = pathname?.startsWith("/reviewer/checking/");

  const stagesToRender = RESEARCH_REVIEW_FLOW_STAGES.map((base) => {
    const dynamic = activeProject?.stages?.find((s) => s.stageNumber === base.stageNumber);
    return {
      ...base,
      status: dynamic?.status || "NOT_SUBMITTED",
      statusLabel: dynamic?.statusLabel || "Not Submitted",
      reviewerName: dynamic?.reviewerName || null,
      approvedAt: dynamic?.approvedAt || null,
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
              title="Review Workspace"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-blue-300" />
              {!collapsed && <span>Review Workspace</span>}
            </Link>

            <Link
              href="/reviewer/projects"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-heading font-bold text-xs transition-all ${
                isProjectsActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="All Research Projects"
            >
              <Layers className="w-4 h-4 shrink-0 text-blue-300" />
              {!collapsed && <span>All Research Projects</span>}
            </Link>
          </div>

          {/* SECTION: PROJECT REVIEW (Selected Botanical Subject) */}
          <div className="space-y-1">
            {!collapsed ? (
              <div className="px-3 py-2.5 rounded-xl bg-[#0a2318] border border-emerald-600/35 text-white shadow-xs space-y-1">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-600/25">
                  <p className="text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    PROJECT REVIEW
                  </p>
                  <Link
                    href="/reviewer/projects"
                    className="text-[10px] font-medium text-emerald-300 hover:text-white underline transition-colors cursor-pointer"
                    title="Change to another research project"
                  >
                    {activeProject ? "Change" : "Select"}
                  </Link>
                </div>
                {activeProject ? (
                  <div className="pt-0.5 space-y-0.5">
                    <p className="font-heading font-extrabold text-xs text-white leading-snug">
                      {activeProject.plantName}
                    </p>
                    {activeProject.plantScientificName && (
                      <p className="italic font-serif text-[11px] text-emerald-300/85 truncate">
                        {activeProject.plantScientificName}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 truncate pt-0.5" title={activeProject.title}>
                      {activeProject.title}
                    </p>
                  </div>
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
                const isStageActive = (() => {
                  if (!isCheckingPath) return false;
                  if (stage.stageNumber === 6) {
                    return pathname === "/reviewer/checking/pharmacognosy" && currentStageParam === "6";
                  }
                  if (stage.stageNumber === 1) {
                    return pathname === "/reviewer/checking/pharmacognosy" && currentStageParam !== "6";
                  }
                  return pathname === `/reviewer/checking/${stage.areaKey}`;
                })();

                const targetHref = activeProject
                  ? stage.stageNumber === 6
                    ? `/reviewer/checking/pharmacognosy?projectId=${activeProject.id}&stage=6`
                    : `/reviewer/checking/${stage.areaKey}?projectId=${activeProject.id}`
                  : stage.stageNumber === 6
                  ? `/reviewer/checking/pharmacognosy?stage=6`
                  : `/reviewer/checking/${stage.areaKey}`;

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
                      title={`Stage ${stage.number} — ${stage.stageName}\n${stage.professionalExpert}\n${stage.expertise}\nStatus: ${statusConfig.label}`}
                    >
                      <span className="text-[10px] font-mono font-bold leading-none">{stage.number}</span>
                      <StatusIcon className={`w-3.5 h-3.5 mt-0.5 ${statusConfig.iconColor}`} />
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
                    title={`${stage.number} ${stage.stageName} · ${stage.professionalExpert}`}
                  >
                    {/* ROW 1: STATUS ICON + STAGE NUMBER + STAGE NAME */}
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

                    {/* ROW 2: PROFESSIONAL EXPERT (Secondary, clean natural wrap, no word break) */}
                    <div className="mt-1 pl-5 space-y-0.5 min-w-0">
                      <p className="text-[11.5px] font-semibold text-slate-200 leading-snug break-normal whitespace-normal hyphens-none">
                        {stage.professionalExpert}
                      </p>

                      {/* ROW 3: EXPERTISE (Muted/Uppercase) + REVIEW STATUS */}
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <span className="text-[9.5px] font-bold text-blue-300/70 tracking-wider uppercase">
                          {stage.expertise}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${statusConfig.textColor}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
                title="Professional Reviewer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/40">
                  <ShieldCheck className="w-4 h-4 text-blue-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                    Professional Reviewer
                  </p>
                  <span className="text-[10px] text-blue-300/80 font-bold tracking-wider uppercase truncate block">
                    Scientific Review Platform
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
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-300 transition-colors"
              title="Professional Reviewer"
            >
              <ShieldCheck className="w-5 h-5 text-blue-300" />
            </Link>
            <LogoutButton iconOnly className="w-10 h-10 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-400/30 flex items-center justify-center transition-colors cursor-pointer" />
          </div>
        )}
      </div>
    </aside>
  );
}
