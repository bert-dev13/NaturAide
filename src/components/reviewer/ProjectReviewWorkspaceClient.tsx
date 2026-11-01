"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  Loader2,
  Leaf,
  Dna,
  Pill,
  FlaskConical,
  Stethoscope,
  ChevronRight,
  FolderGit2,
  UserCheck,
  Check,
  Lock,
  BookOpen,
  FileText,
  Layers,
  HelpCircle,
} from "lucide-react";
import { useReviewerProject } from "@/context/ReviewerProjectContext";

interface AreaItem {
  number: string;
  key: string;
  profession: string;
  checkingArea: string;
  description: string;
  status: string;
  isReady: boolean;
  isCompleted: boolean;
  assignmentId: number | null;
  actionLabel: string;
  actionUrl: string;
  assessment?: string | null;
  comments?: string | null;
  reviewerName?: string | null;
  approvedAt?: string | null;
}

interface ProjectData {
  id: number;
  title: string;
  shortDescription?: string;
  researchObjective?: string;
  currentStage?: string;
  plantName: string;
  plantScientificName?: string | null;
  plantFamily?: string | null;
  plantCategory?: string | null;
  researcherName: string;
  researcherEmail: string;
  cycle: number;
  versionTag: string;
  submittedAt: string;
  updatedAt: string;
  overallStatus: string;
  completedReviewsCount: number;
  totalRequiredReviews: number;
  areas: AreaItem[];
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  pharmacognosy: Leaf,
  bioinformatics: Dna,
  pharmacology: Pill,
  formulation: FlaskConical,
  clinical_safety: Stethoscope,
};

const ROLE_COLOR_THEMES: Record<
  string,
  {
    bgLight: string;
    textDark: string;
    border: string;
    iconBg: string;
    badge: string;
  }
> = {
  pharmacognosy: {
    bgLight: "bg-emerald-50/50",
    textDark: "text-emerald-900",
    border: "border-emerald-200/70",
    iconBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  bioinformatics: {
    bgLight: "bg-sky-50/50",
    textDark: "text-sky-900",
    border: "border-sky-200/70",
    iconBg: "bg-sky-100 text-sky-700 border-sky-200",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
  },
  pharmacology: {
    bgLight: "bg-indigo-50/50",
    textDark: "text-indigo-900",
    border: "border-indigo-200/70",
    iconBg: "bg-indigo-100 text-indigo-700 border-indigo-200",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  formulation: {
    bgLight: "bg-amber-50/50",
    textDark: "text-amber-900",
    border: "border-amber-200/70",
    iconBg: "bg-amber-100 text-amber-700 border-amber-200",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  clinical_safety: {
    bgLight: "bg-teal-50/50",
    textDark: "text-teal-900",
    border: "border-teal-200/70",
    iconBg: "bg-teal-100 text-teal-700 border-teal-200",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
  },
};

export default function ProjectReviewWorkspaceClient({
  projectId,
}: {
  projectId: number;
}) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const { setActiveProject } = useReviewerProject();

  useEffect(() => {
    if (project) {
      setActiveProject({
        id: project.id,
        title: project.title,
        plantName: project.plantName,
        plantScientificName: project.plantScientificName || null,
        status: project.overallStatus,
      });
    }
  }, [project, setActiveProject]);

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviewer/projects/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data.project || null);
        }
      } catch (err) {
        console.error("Failed to load project review data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="w-full max-w-none space-y-6 pb-12 font-sans animate-in fade-in duration-300">
        <div className="w-full bg-[#0b2447] rounded-xl border border-blue-900/60 p-6 sm:p-7 shadow-sm text-white">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-blue-900/60 rounded" />
            <div className="h-8 w-64 bg-blue-900/60 rounded" />
            <div className="h-4 w-96 bg-blue-900/60 rounded" />
          </div>
        </div>
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-white border border-slate-200 p-4 animate-pulse flex flex-col justify-between"
            >
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-6 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full max-w-none space-y-6 pb-12 font-sans">
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Project Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              The requested research dossier could not be located or you may not possess authorized reviewer privileges.
            </p>
          </div>
          <Link
            href="/reviewer/projects"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0b2447] hover:bg-[#123668] transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to All Research Projects</span>
          </Link>
        </div>
      </div>
    );
  }

  const percentComplete = Math.round(
    ((project.completedReviewsCount || 0) / (project.totalRequiredReviews || 5)) * 100
  );

  return (
    <div className="w-full max-w-none space-y-6 pb-12 font-sans">
      {/* ============================================================== */}
      {/* 1. TOP REVIEW BANNER (NAVY BLUE WORKBENCH STYLE)               */}
      {/* ============================================================== */}
      <div className="w-full bg-[#0b2447] rounded-xl border border-blue-900/60 p-6 sm:p-7 shadow-sm text-white relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Back Navigation Button */}
          <div>
            <Link
              href="/reviewer/projects"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-200/80 hover:text-white transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to All Research Projects</span>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium tracking-wider uppercase text-blue-300 bg-blue-950/80 border border-blue-500/30 rounded px-2.5 py-0.5">
                  Project Review Dossier
                </span>
                <span className="text-xs font-mono font-medium text-blue-200/90 bg-blue-900/50 border border-blue-700/40 rounded px-2 py-0.5">
                  Cycle {project.cycle} ({project.versionTag})
                </span>
                <span className="text-xs font-mono font-medium text-blue-300/80 bg-blue-950/40 border border-blue-800/40 rounded px-2 py-0.5">
                  Stage {project.currentStage ? project.currentStage.replace(/_/g, " ") : "Active"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-snug">
                {project.title}
              </h1>

              {/* Botanical Specimen Metadata Strip */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-100/90 pt-0.5">
                <div className="inline-flex items-center gap-1.5 bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-800/50 font-medium text-blue-100">
                  <Leaf className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                  <span>{project.plantName}</span>
                </div>
                {project.plantScientificName && (
                  <span className="italic text-blue-200/80 font-normal">
                    · {project.plantScientificName}
                  </span>
                )}
                {project.plantFamily && (
                  <span className="text-blue-300/70 text-xs">
                    ({project.plantFamily})
                  </span>
                )}
                {project.plantCategory && (
                  <span className="text-blue-300/70 text-xs hidden md:inline">
                    · {project.plantCategory}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
              <Link
                href="/reviewer/projects"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-blue-700/60 bg-blue-950/60 hover:bg-blue-900/60 text-blue-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                <FolderGit2 className="w-4 h-4 text-blue-400" />
                <span>All Projects</span>
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
      </div>

      {/* ============================================================== */}
      {/* 2. KPI METRIC CARDS (MATCHING DASHBOARD ARCHITECTURE)           */}
      {/* ============================================================== */}
      <section className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Lead Researcher */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-xs font-medium uppercase tracking-wider">Lead Researcher</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3">
            <div className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight truncate">
              {project.researcherName}
            </div>
            <span className="text-xs text-slate-400 truncate block mt-0.5">
              {project.researcherEmail}
            </span>
          </div>
        </div>

        {/* KPI 2: Review Cycle */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-medium uppercase tracking-wider">Review Cycle</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Cycle {project.cycle}
            </div>
            <span className="text-xs text-slate-400">
              Release tag: <strong className="font-mono text-slate-700 font-medium">{project.versionTag}</strong>
            </span>
          </div>
        </div>

        {/* KPI 3: Overall Dossier Status */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-xs font-medium uppercase tracking-wider">Overall Status</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              {project.overallStatus}
            </div>
            <span className="text-xs text-slate-400 block mt-1.5">
              Standardized Peer Consensus
            </span>
          </div>
        </div>

        {/* KPI 4: Multi-Discipline Approval Progress */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-teal-800">
            <span className="text-xs font-medium uppercase tracking-wider">Discipline Coverage</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {project.completedReviewsCount} / {project.totalRequiredReviews}
            </div>
            <span className="text-xs text-slate-400">
              {percentComplete}% specialty endorsements
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. MULTI-DISCIPLINE PROGRESS STRIP                             */}
      {/* ============================================================== */}
      <section className="w-full p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Professional Consensus Progress
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">
              {project.completedReviewsCount} of {project.totalRequiredReviews} disciplines fully approved
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-slate-700">
            {percentComplete}% Complete
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              percentComplete === 100
                ? "bg-teal-600"
                : percentComplete > 0
                ? "bg-blue-600"
                : "bg-slate-300"
            }`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        {/* Five Discipline Pills Preview */}
        <div className="pt-1 flex flex-wrap items-center gap-2">
          {project.areas.map((area) => {
            const isApp = area.isCompleted || area.status === "Approved";
            const isRev = area.status?.toLowerCase().includes("revision");
            const isInRev = area.status === "In Review";

            return (
              <span
                key={area.key}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium border ${
                  isApp
                    ? "bg-teal-50 text-teal-800 border-teal-200/80"
                    : isRev
                    ? "bg-rose-50 text-rose-800 border-rose-200/80"
                    : isInRev
                    ? "bg-blue-50 text-blue-800 border-blue-200/80"
                    : area.isReady
                    ? "bg-amber-50 text-amber-800 border-amber-200/80"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                <span>{area.checkingArea}</span>
                {isApp ? (
                  <Check className="w-3 h-3 text-teal-700 stroke-[3]" />
                ) : isRev ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                ) : isInRev ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                ) : area.isReady ? (
                  <Clock className="w-3 h-3 text-amber-600" />
                ) : (
                  <Lock className="w-3 h-3 text-slate-400" />
                )}
              </span>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. MAIN CONTENT GRID (70% AREAS / 30% DOSSIER CONTEXT)         */}
      {/* ============================================================== */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* LEFT COLUMN: THE FIVE PROFESSIONAL CHECKING AREAS (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-800">
                Professional Checking Areas
              </h2>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              5 Disciplines Required
            </span>
          </div>

          {/* List of Area Cards with rich animations & hover interactions */}
          <div className="space-y-3">
            {project.areas.map((area, index) => {
              const Icon = ROLE_ICONS[area.key] || Leaf;
              const theme = ROLE_COLOR_THEMES[area.key] || ROLE_COLOR_THEMES.pharmacognosy;

              const isApp = area.isCompleted || area.status === "Approved";
              const isRev = area.status?.toLowerCase().includes("revision");
              const isInRev = area.status === "In Review";
              const isLocked = !area.isReady;

              return (
                <div
                  key={area.key}
                  className={`w-full rounded-xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition-all duration-200 group relative overflow-hidden`}
                >
                  {/* Subtle top indicator bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-0.5 ${
                      isApp
                        ? "bg-teal-500"
                        : isRev
                        ? "bg-rose-500"
                        : isInRev
                        ? "bg-blue-500"
                        : area.isReady
                        ? "bg-amber-400"
                        : "bg-slate-200"
                    }`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left: Icon and Area Details */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Area Specialty Icon */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs ${
                          isApp
                            ? "bg-teal-50 text-teal-700 border-teal-200"
                            : isRev
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : isInRev
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : area.isReady
                            ? theme.iconBg
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Details */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            {area.number || `0${index + 1}`} · {area.profession}
                          </span>
                        </div>

                        <h3 className="text-base font-semibold text-slate-900 tracking-tight group-hover:text-blue-900 transition-colors">
                          {area.checkingArea}
                        </h3>

                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                          {area.description}
                        </p>

                        {/* Status Note or Stage Pre-requisite info */}
                        {isLocked ? (
                          <div className="pt-2 flex items-center gap-1.5 text-xs text-slate-400 italic">
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Researcher submission not yet available.</span>
                          </div>
                        ) : (
                          <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Stage data assembled and ready for scientific evaluation.</span>
                          </div>
                        )}

                        {/* Completed Assessment Metadata */}
                        {isApp && (area.reviewerName || area.approvedAt) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                            {area.reviewerName && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-slate-400">Validated by:</span>
                                <strong className="font-semibold text-slate-800">{area.reviewerName}</strong>
                              </span>
                            )}
                            {area.approvedAt && (
                              <span className="inline-flex items-center gap-1 text-teal-800 font-medium">
                                <span className="text-slate-300">·</span>
                                <span>Approved on {new Date(area.approvedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status Pill & Action Button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${
                          isApp
                            ? "bg-teal-50 text-teal-800 border-teal-200/80"
                            : isRev
                            ? "bg-rose-50 text-rose-800 border-rose-200/80"
                            : isInRev
                            ? "bg-blue-50 text-blue-800 border-blue-200/80"
                            : area.isReady
                            ? "bg-amber-50 text-amber-800 border-amber-200/80"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isApp
                              ? "bg-teal-600"
                              : isRev
                              ? "bg-rose-500"
                              : isInRev
                              ? "bg-blue-600 animate-pulse"
                              : area.isReady
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          }`}
                        />
                        <span>{area.status}</span>
                      </span>

                      {/* Primary CTA */}
                      {area.isReady ? (
                        <Link
                          href={area.actionUrl}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer group/btn ${
                            isApp
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                              : "bg-[#0b2447] hover:bg-[#123668] text-white shadow-blue-900/20"
                          }`}
                        >
                          <span>{area.actionLabel || `Open ${area.checkingArea} Review`}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 select-none">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Not Submitted</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DOSSIER CONTEXT & PROTOCOL (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* 1. Research Objectives & Botanical Scope */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                Research Objective &amp; Scope
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Botanical Subject
                </span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {project.plantName}
                </span>
                {project.plantScientificName && (
                  <span className="italic text-slate-500 font-serif block">
                    {project.plantScientificName}
                  </span>
                )}
              </div>

              {project.shortDescription && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Project Summary
                  </span>
                  <p className="text-slate-600 leading-relaxed mt-0.5">
                    {project.shortDescription}
                  </p>
                </div>
              )}

              {project.researchObjective && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Primary Objective
                  </span>
                  <p className="text-slate-600 leading-relaxed mt-0.5">
                    {project.researchObjective}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. NatureAide 5-Discipline Consensus Protocol Card */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                Peer Review Standard
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              NatureAide requires independent multi-disciplinary consensus before any botanical dossier can be recognized as research complete.
            </p>

            <ul className="space-y-2 text-xs text-slate-600 pt-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>All 5 scientific disciplines must submit independent evaluations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Any requested revision pauses overall completion until re-verified.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Full endorsement enables generation of the verified final monograph.</span>
              </li>
            </ul>
          </div>

          {/* 3. Quick Assistance / Links */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2">
            <Link
              href="/reviewer/assistant"
              className="flex items-center justify-between p-3 rounded-lg bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/70 text-blue-900 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Consult AI Assistant</div>
                  <div className="text-[10px] text-blue-700">Analyze docking &amp; safety</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/reviewer"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-800 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">Return to Reviewer Dashboard</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
