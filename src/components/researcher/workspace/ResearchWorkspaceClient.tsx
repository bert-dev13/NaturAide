"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Layers,
  Cpu,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  BookOpen,
  Send,
  ShieldCheck,
  ChevronRight,
  Info,
  Beaker,
  FolderKanban,
  FileText,
  Award,
  Leaf,
} from "lucide-react";
import { V2SectionProgress } from "@/lib/v2-progress-service";

interface ProjectData {
  id: number;
  title: string;
  researchObjective?: string;
  researchQuestion?: string;
  status: string;
  currentStage?: string;
  progressPercent: number;
  plantName: string;
  plantScientificName?: string;
  updatedAt?: string;
  createdAt: string;
}

interface ActivityRecord {
  actionType: string;
  description: string;
  createdAt: string;
}

interface FormulationOverview {
  formulationName?: string;
  dosageFormType?: string;
  formulationType?: string;
  componentsCount?: number;
}

interface Props {
  project: ProjectData;
  v2Progress: V2SectionProgress;
  activities: ActivityRecord[];
  linkedStudies: number;
  openRevisionsCount?: number;
  formulationOverview?: FormulationOverview | null;
}

export default function ResearchWorkspaceClient({
  project,
  v2Progress,
  activities,
  linkedStudies,
  openRevisionsCount = 0,
  formulationOverview,
}: Props) {
  const [activeTab, setActiveTab] = useState<"sections" | "activity" | "details">("sections");

  // Determine earliest incomplete section / step for "Continue Research"
  const continueRoute = useMemo(() => {
    if (v2Progress.section1.status !== "COMPLETED") {
      return `/researcher/projects/${project.id}/formulation-rd`;
    }
    if (v2Progress.section2.status !== "COMPLETED") {
      return `/researcher/projects/${project.id}/in-silico`;
    }
    return `/researcher/projects/${project.id}/submission`;
  }, [project.id, v2Progress]);

  const isProjectCompleted =
    project.status === "COMPLETED" ||
    (v2Progress?.overallStatus && v2Progress.overallStatus.toLowerCase() === "completed");

  const renderSectionStatusBadge = (status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED") => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
        {/* 1. TOP HEADER WORKSPACE BANNER (Compact Forest Emerald Theme with Icons & Badges) */}
        <div className="w-full bg-gradient-to-r from-[#0b261b] via-[#0f3424] to-[#071c13] text-white rounded-2xl border border-emerald-800/60 p-4 sm:p-5 shadow-lg shadow-emerald-950/25 relative overflow-hidden transition-all duration-300 space-y-3.5">
          {/* Ambient decorative glowing backdrops */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Row 1: Breadcrumb + Tag + Actions */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-300/80">
              <Link
                href="/researcher/projects"
                className="hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
                <span>My Research</span>
              </Link>
              <span className="text-emerald-700">/</span>
              <span className="text-white font-semibold truncate max-w-xs">{project.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10.5px] font-bold">
                #{project.id}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {openRevisionsCount > 0 && (
                <Link
                  href={`/researcher/projects/${project.id}/revisions`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold border border-amber-400/50 transition-all shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{openRevisionsCount} Revision{openRevisionsCount > 1 ? "s" : ""} Required</span>
                </Link>
              )}

              {isProjectCompleted ? (
                <Link
                  href={`/researcher/completed/${project.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Completed Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href={continueRoute}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <span>Continue Research</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Row 2: Title + Botanical Info + Last Updated + Compact Completion Progress Bar */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{project.title}</span>
                  {isProjectCompleted && (
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  )}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isProjectCompleted
                      ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/50"
                      : "bg-emerald-950/80 text-emerald-300 border border-emerald-600/40"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{v2Progress.overallStatus}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-100/80">
                <span className="inline-flex items-center gap-1.5 font-semibold bg-emerald-900/60 px-2.5 py-0.5 rounded-lg border border-emerald-700/50 text-white">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{project.plantName}</span>
                  {project.plantScientificName && (
                    <span className="italic text-emerald-300/80">({project.plantScientificName})</span>
                  )}
                </span>

                {project.updatedAt && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-300/80">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span suppressHydrationWarning>
                      Last updated {new Date(project.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Compact Completion Progress Card */}
            <div className="w-full md:w-72 bg-emerald-950/60 rounded-xl border border-emerald-700/40 p-2.5 space-y-1.5 shrink-0 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Research Completion</span>
                </span>
                <span className="font-mono font-bold text-white text-xs bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-600/40">
                  {v2Progress.overallProgressPercent}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-emerald-950 border border-emerald-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${v2Progress.overallProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. BODY CONTENT */}
        <div>
        {/* Research Objective Box */}
        {project.researchObjective && (
          <div className="mb-8 p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Research Objective</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{project.researchObjective}</p>
            </div>
          </div>
        )}

        {/* THREE MAIN RESEARCH SECTIONS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Three Main Research Sections
            </h2>
            <span className="text-xs text-slate-500">
              All 3 sections must be fully completed before final manuscript submission.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* ========================================================= */}
            {/* SECTION 1: FORMULATION RESEARCH & DEVELOPMENT             */}
            {/* ========================================================= */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-emerald-700 tracking-wider uppercase">Section 1</span>
                      {renderSectionStatusBadge(v2Progress.section1.status)}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Formulation Research &amp; Development
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Specimen authentication, dosage format selection, standardized extraction, excipient matrix compounding, and batch quality control.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-slate-400 font-medium">Steps completed</span>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                      {v2Progress.section1.completedSteps} / {v2Progress.section1.totalSteps}
                    </p>
                  </div>
                  <Link
                    href={`/researcher/projects/${project.id}/formulation-rd`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                  >
                    <span>Open Section</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 6 Steps Checklist */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {v2Progress.section1.steps.map((st, idx) => (
                  <div
                    key={st.stepKey}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      st.completed
                        ? "bg-emerald-50/40 border-emerald-200/80"
                        : "bg-slate-50/60 border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {st.title}
                      </span>
                      {st.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{st.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 2: IN-SILICO ANALYSIS                             */}
            {/* ========================================================= */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-teal-700 tracking-wider uppercase">Section 2</span>
                      {renderSectionStatusBadge(v2Progress.section2.status)}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      In-Silico Analysis
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bioactive phytochemical library search, therapeutic target selection, ADMET screening, AutoDock Vina calculations, and 2D/3D interaction visualization.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-slate-400 font-medium">Steps completed</span>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                      {v2Progress.section2.completedSteps} / {v2Progress.section2.totalSteps}
                    </p>
                  </div>
                  <Link
                    href={`/researcher/projects/${project.id}/in-silico`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                  >
                    <span>Open Section</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 8 Steps Checklist */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {v2Progress.section2.steps.map((st, idx) => (
                  <div
                    key={st.stepKey}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      st.completed
                        ? "bg-teal-50/40 border-teal-200/80"
                        : "bg-slate-50/60 border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {st.title}
                      </span>
                      {st.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{st.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 3: RESEARCH PAPER SUBMISSION                      */}
            {/* ========================================================= */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-indigo-700 tracking-wider uppercase">Section 3</span>
                      {renderSectionStatusBadge(v2Progress.section3.status)}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Research Paper Submission
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Compiled multi-stage research summary, PDF/DOCX manuscript upload, and dossier submission for multidisciplinary expert review.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-slate-400 font-medium">Steps completed</span>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                      {v2Progress.section3.completedSteps} / {v2Progress.section3.totalSteps}
                    </p>
                  </div>
                  <Link
                    href={`/researcher/projects/${project.id}/submission`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                  >
                    <span>Open Section</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 3 Steps Checklist */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {v2Progress.section3.steps.map((st, idx) => (
                  <Link
                    key={st.stepKey}
                    href={`/researcher/projects/${project.id}/submission?step=${idx + 1}`}
                    className={`p-3 rounded-lg border text-xs transition-colors block ${
                      st.completed
                        ? "bg-indigo-50/40 border-indigo-200/80 hover:border-indigo-300"
                        : "bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {st.title}
                      </span>
                      {st.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{st.detail}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 4: PROFESSIONAL APPROVAL & COMPLETION             */}
            {/* ========================================================= */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-emerald-700 tracking-wider uppercase">Section 4</span>
                      {renderSectionStatusBadge(
                        v2Progress.section4?.status ||
                          (v2Progress.overallStatus === "Completed"
                            ? "COMPLETED"
                            : v2Progress.section3.status === "COMPLETED"
                            ? "IN_PROGRESS"
                            : "NOT_STARTED")
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Professional Approval &amp; Research Completion
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Multidisciplinary review panel evaluations across Formulation, Bioinformatics, and Clinical Pharmacology. Unlocks completion at 100% approval.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-slate-400 font-medium">Panel Approvals</span>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                      {v2Progress.approvedSpecialtiesCount ?? 0} / 3
                    </p>
                  </div>
                  <Link
                    href={`/researcher/projects/${project.id}/completion`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                  >
                    <span>Track Approval</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Section 4 Specialties Checklist */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(v2Progress.section4?.steps || [
                  { stepKey: "formulation-review", title: "Formulation Science", completed: (v2Progress.approvedSpecialtiesCount ?? 0) >= 1, detail: "Section 1 formulation evaluation" },
                  { stepKey: "insilico-review", title: "Bioinformatics & Docking", completed: (v2Progress.approvedSpecialtiesCount ?? 0) >= 2, detail: "Section 2 computational modeling" },
                  { stepKey: "clinical-review", title: "Clinical Pharmacology", completed: (v2Progress.approvedSpecialtiesCount ?? 0) >= 3, detail: "Section 3 clinical review" },
                ]).map((st, idx) => (
                  <Link
                    key={st.stepKey}
                    href={`/researcher/projects/${project.id}/completion`}
                    className={`p-3 rounded-lg border text-xs transition-colors block ${
                      st.completed
                        ? "bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300"
                        : "bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {st.title}
                      </span>
                      {st.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{st.detail}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. RECENT RESEARCH ACTIVITY */}
        <div className="mt-10 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Recent Research Activity Logs
          </h2>
          {activities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {activities.map((act, index) => (
                <div key={index} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-semibold text-slate-700">{act.actionType}</span>
                    <span className="text-slate-500 truncate">{act.description}</span>
                  </div>
                  <span suppressHydrationWarning className="text-slate-400 font-mono text-[11px] shrink-0 ml-4">
                    {new Date(act.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No activity recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
