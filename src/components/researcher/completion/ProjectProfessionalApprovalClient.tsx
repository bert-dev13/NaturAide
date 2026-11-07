"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowLeft,
  UserCheck,
  ExternalLink,
  Loader2,
  Lock,
  Sparkles,
  Layers,
  Cpu,
  FileCheck2,
  X,
  FileText,
  ShieldCheck,
  Check,
  ChevronRight,
  FlaskConical,
  MessageSquareWarning,
} from "lucide-react";
import type {
  ProfessionalApprovalState,
  SpecialtyApprovalRow,
} from "@/lib/research-approval-completion-service";

interface Props {
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
    status: string;
  };
  initialApprovalState: ProfessionalApprovalState | null;
}

export default function ProjectProfessionalApprovalClient({
  project,
  initialApprovalState,
}: Props) {
  const router = useRouter();
  const [approvalState, setApprovalState] = useState<ProfessionalApprovalState | null>(
    initialApprovalState
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const isCompletedProject =
    project.status === "COMPLETED" || approvalState?.isCompleted;

  const refreshApprovalStatus = useCallback(async () => {
    setIsRefreshing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/approval-status`);
      if (res.ok) {
        const data = await res.json();
        if (data.approvalState) {
          setApprovalState(data.approvalState);
        }
      }
    } catch (err) {
      console.error("Failed to refresh approval status:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [project.id]);

  useEffect(() => {
    const handleSync = () => refreshApprovalStatus();
    window.addEventListener("natureaide:review-updated", handleSync);
    window.addEventListener("natureaide:revisions-updated", handleSync);
    window.addEventListener("natureaide:project-updated", handleSync);
    return () => {
      window.removeEventListener("natureaide:review-updated", handleSync);
      window.removeEventListener("natureaide:revisions-updated", handleSync);
      window.removeEventListener("natureaide:project-updated", handleSync);
    };
  }, [refreshApprovalStatus]);

  const handleCompleteResearch = async () => {
    setIsCompleting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/complete-research`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete research project.");
      }

      setShowCompleteModal(false);
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push(`/researcher/completed/${project.id}`);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to complete research project." });
      setIsCompleting(false);
    }
  };

  const approvedCount = approvalState?.approvedCount ?? 0;
  const totalSpecialties = approvalState?.totalSpecialties ?? 3;
  const isAllApproved = approvedCount === totalSpecialties;
  const canComplete = Boolean(approvalState?.canCompleteResearch || isAllApproved);
  const approvalPercent = Math.min(100, Math.round((approvedCount / totalSpecialties) * 100));

  const overallStepPercent =
    typeof approvalState?.overallApprovalPercent === "number"
      ? approvalState.overallApprovalPercent
      : approvalState?.specialties && approvalState.specialties.length > 0
      ? Math.round(
          approvalState.specialties.reduce(
            (sum, s) => sum + (s.approvedPercent ?? (s.status === "Approved" ? 100 : 0)),
            0
          ) / approvalState.specialties.length
        )
      : approvalPercent;

  const specialties = approvalState?.specialties || [
    {
      code: "01",
      areaKey: "formulation",
      specialty: "Formulation Science & Pharmacognosy",
      roleTitle: "Formulation Scientist / Pharmacognosist",
      reviewerId: null,
      reviewerName: null,
      reviewerQualification: null,
      status: "Pending" as const,
      rawStatus: "PENDING",
      decision: null,
      decisionDate: null,
      comments: null,
      strengths: null,
      concerns: null,
      requiredRevisions: null,
      carriedForward: false,
      openFeedbackCount: 0,
      hasFeedback: false,
    },
    {
      code: "02",
      areaKey: "bioinformatics",
      specialty: "Bioinformatics & In-Silico Modeling",
      roleTitle: "Bioinformatician / Computational Scientist",
      reviewerId: null,
      reviewerName: null,
      reviewerQualification: null,
      status: "Pending" as const,
      rawStatus: "PENDING",
      decision: null,
      decisionDate: null,
      comments: null,
      strengths: null,
      concerns: null,
      requiredRevisions: null,
      carriedForward: false,
      openFeedbackCount: 0,
      hasFeedback: false,
    },
    {
      code: "03",
      areaKey: "pharmacology",
      specialty: "Clinical Pharmacology & Paper Review",
      roleTitle: "Clinical Pharmacologist / Medical Reviewer",
      reviewerId: null,
      reviewerName: null,
      reviewerQualification: null,
      status: "Pending" as const,
      rawStatus: "PENDING",
      decision: null,
      decisionDate: null,
      comments: null,
      strengths: null,
      concerns: null,
      requiredRevisions: null,
      carriedForward: false,
      openFeedbackCount: 0,
      hasFeedback: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 pb-36">
      {/* =================================================================== */}
      {/* 1. STICKY HEADER (Identical Structure to Section 3 in Green Palette)*/}
      {/* =================================================================== */}
      <header className="bg-white border-b border-emerald-900/10 sticky top-0 z-20 shadow-2xs">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Top Row: Breadcrumb + Title + Status Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Link
                  href={`/researcher/projects/${project.id}`}
                  className="hover:text-emerald-700 inline-flex items-center gap-1 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Workspace Hub</span>
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-emerald-700 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <span>Section 4</span>
                  <span className="text-slate-300">•</span>
                  <span>Professional Approval</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
                  {project.title}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="truncate">Professional Approval &amp; Research Completion</span>
              </h1>

              {/* Progress bar across step approvals */}
              <div className="flex items-center gap-2 pt-0.5 max-w-xs">
                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${overallStepPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-semibold text-emerald-700">
                  {overallStepPercent}% ({approvedCount} of {totalSpecialties} Roles Approved)
                </span>
              </div>
            </div>

            {/* Right Status Badge & Refresh Sync Button */}
            <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={refreshApprovalStatus}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                title="Sync live reviewer decisions"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
                <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
              </button>

              {isCompletedProject ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Completed (3/3 Approved)</span>
                </span>
              ) : (approvalState?.revisionsRequiredSpecialties?.length || 0) > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Revisions Required</span>
                </span>
              ) : isAllApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3 of 3 Approved • Ready to Complete</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {approvalState?.latestSubmission?.versionTag || "v1.0"} • {approvedCount} of {totalSpecialties} Approved
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Bottom Row: Navigation / Section Switcher Bar styled in green */}
          <nav
            aria-label="Workspace sections navigation"
            className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-2.5"
          >
            <Link
              href={`/researcher/projects/${project.id}/formulation-rd`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
            >
              <FlaskConical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>1. Formulation R&amp;D</span>
            </Link>

            <Link
              href={`/researcher/projects/${project.id}/in-silico`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
            >
              <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>2. In-Silico Analysis</span>
            </Link>

            <Link
              href={`/researcher/projects/${project.id}/submission`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>3. Paper Submission</span>
            </Link>

            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 shadow-2xs shrink-0 cursor-default"
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>4. Professional Approval</span>
              {isAllApproved && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              )}
            </span>

            <Link
              href={`/researcher/revisions?projectId=${project.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0 sm:ml-auto"
            >
              <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Revisions Hub</span>
              {(approvalState?.unresolvedRevisionsCount ?? 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                  {approvalState?.unresolvedRevisionsCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. MAIN CONTENT CONTAINER (Clean Layout Matching Section 3)         */}
      {/* =================================================================== */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Flash Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-2xs animate-in fade-in duration-150 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. KEY METRICS STATS BAR (Elevated 3-Card Visual)                 */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: 3-Specialty Progress */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Multidisciplinary Approval
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-slate-900 font-mono">
                    {overallStepPercent}%
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    ({approvedCount} of {totalSpecialties} Roles Approved)
                  </span>
                </div>
              </div>

              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                  isAllApproved
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                {isAllApproved ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Clock className="w-6 h-6 text-amber-500 animate-pulse" />
                )}
              </div>
            </div>

            {/* Visual Animated Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isAllApproved
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-2xs"
                      : "bg-gradient-to-r from-amber-500 to-emerald-600"
                  }`}
                  style={{ width: `${overallStepPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>0% Progress</span>
                <span className="font-semibold text-slate-600">
                  {isAllApproved ? "100% Fully Approved" : `${overallStepPercent}% Total Steps Approved`}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Current Status & Cycle */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Overall Evaluation State
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {isCompletedProject
                      ? "Research Completed ✓"
                      : isAllApproved
                      ? "Ready for Final Completion"
                      : (approvalState?.revisionsRequiredSpecialties?.length || 0) > 0
                      ? "Revisions In Progress"
                      : "Under Peer Review"}
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    Cycle {approvalState?.latestSubmission?.versionNumber || 1} · {approvalState?.latestSubmission?.versionTag || "v1.0"}
                  </span>
                </div>
              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Award className="w-6 h-6 text-emerald-700" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Submission Date:</span>
              <span suppressHydrationWarning className="font-mono font-medium text-slate-700">
                {approvalState?.latestSubmission?.submittedAt
                  ? new Date(approvalState.latestSubmission.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Active"}
              </span>
            </div>
          </div>

          {/* Card 3: Actionable Findings & Corrections */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600" />
                  Feedback &amp; Corrections
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-slate-900 font-mono">
                    {approvalState?.unresolvedRevisionsCount ?? 0}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    Unresolved Finding(s)
                  </span>
                </div>
              </div>

              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                  (approvalState?.unresolvedRevisionsCount ?? 0) > 0
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}
              >
                {(approvalState?.unresolvedRevisionsCount ?? 0) > 0 ? (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Revision Status:</span>
              <Link
                href={`/researcher/revisions?projectId=${project.id}`}
                className="font-semibold text-emerald-700 hover:text-emerald-900 transition-colors inline-flex items-center gap-1"
              >
                <span>View Details</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 4. REVISIONS REQUIRED ALERT BANNER (IF ACTIVE)                    */}
        {/* ================================================================= */}
        {(approvalState?.revisionsRequiredSpecialties?.length || 0) > 0 && !isCompletedProject && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-200 rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                  <AlertCircle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-amber-950 flex items-center gap-2">
                    <span>Revisions Requested by Reviewers</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-mono text-[10.5px] font-bold">
                      {approvalState?.revisionsRequiredSpecialties.length} Role(s)
                    </span>
                  </h3>
                  <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
                    Reviewers from <strong>{approvalState?.revisionsRequiredSpecialties.join(", ")}</strong> have submitted specific findings requiring your correction. Jump to the relevant section workspace or review instructions in the Revision Hub.
                  </p>
                </div>
              </div>

              <Link
                href={`/researcher/revisions?projectId=${project.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-colors shrink-0"
              >
                <span>Open Revision Hub</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 5. THREE MULTIDISCIPLINARY SPECIALTY REVIEW CARDS                 */}
        {/* ================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/40 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Multidisciplinary Review Specialties</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Independent evaluation grid across Formulation R&amp;D, In-Silico Molecular Docking, and Clinical Pharmacology.
              </p>
            </div>

            <Link
              href={`/researcher/revisions?projectId=${project.id}`}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Feedback &amp; Notes Feed</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {specialties.map((spec: SpecialtyApprovalRow) => {
              const isApproved = spec.status === "Approved";
              const isRevision = spec.status === "Revision Required";
              const isInReview = spec.status === "In Review";

              const sectionBadge =
                spec.code === "01"
                  ? "Section 1: Formulation R&D"
                  : spec.code === "02"
                  ? "Section 2: In-Silico Analysis"
                  : "Section 3: Paper Submission";

              const sectionRoute =
                spec.code === "01"
                  ? `/researcher/projects/${project.id}/formulation-rd`
                  : spec.code === "02"
                  ? `/researcher/projects/${project.id}/in-silico`
                  : `/researcher/projects/${project.id}/submission`;

              const Icon =
                spec.code === "01"
                  ? FlaskConical
                  : spec.code === "02"
                  ? Cpu
                  : FileCheck2;

              const themeColor =
                spec.code === "01"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : spec.code === "02"
                  ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                  : "text-teal-700 bg-teal-50 border-teal-200";

              return (
                <div
                  key={spec.areaKey}
                  className="p-6 transition-all hover:bg-slate-50/70 space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Discipline Icon Tile */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${themeColor}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">
                            {spec.code}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 tracking-tight">
                            {spec.specialty}
                          </h4>
                          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                            {sectionBadge}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{spec.roleTitle}</span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Reviewer:{" "}
                              <strong className="text-slate-800">
                                {spec.reviewerName || "Assigned Panel Reviewer"}
                              </strong>
                              {spec.reviewerQualification && (
                                <span className="text-slate-400 font-normal ml-1">
                                  ({spec.reviewerQualification})
                                </span>
                              )}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill and Jump Action */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-auto">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-shadow shadow-2xs ${
                          isApproved
                            ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border-emerald-300"
                            : isRevision
                            ? "bg-gradient-to-r from-rose-50 to-amber-50 text-rose-800 border-rose-300 animate-pulse"
                            : isInReview
                            ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isRevision ? (
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{spec.status}</span>
                      </span>

                      <Link
                        href={sectionRoute}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                      >
                        <span>Open Section Workspace</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </div>
                  </div>

                  {/* Step Approval Matrix Progress Bar */}
                  {(() => {
                    const fallbackTotal = spec.code === "01" ? 6 : spec.code === "02" ? 8 : 2;
                    const totalSteps = spec.totalSteps || fallbackTotal;
                    const approvedStepCount =
                      typeof spec.approvedStepCount === "number"
                        ? spec.approvedStepCount
                        : spec.status === "Approved"
                        ? totalSteps
                        : 0;
                    const pct =
                      typeof spec.approvedPercent === "number"
                        ? spec.approvedPercent
                        : spec.status === "Approved"
                        ? 100
                        : Math.round((approvedStepCount / totalSteps) * 100);

                    return (
                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${
                                pct === 100 ? "text-emerald-600" : "text-slate-400"
                              }`}
                            />
                            <span>Step Approvals:</span>
                            <strong className="text-slate-900 font-mono">
                              {approvedStepCount} of {totalSteps} Steps Approved
                            </strong>
                          </span>
                          <span className="font-mono font-bold text-xs text-emerald-700">
                            {pct}% Approved
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Reviewer Note / Scientific Comments Quote Bubble */}
                  {spec.comments && (
                    <div className="mt-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic flex items-start gap-2.5">
                      <span className="text-slate-400 font-serif text-lg leading-none select-none">
                        &ldquo;
                      </span>
                      <p className="flex-1 not-italic text-slate-700">
                        {spec.comments}
                      </p>
                    </div>
                  )}

                  {/* Decision Timestamp and Carried Forward Indicator */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span suppressHydrationWarning className="font-mono">
                      {spec.decisionDate
                        ? `Evaluation recorded on ${new Date(spec.decisionDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : "Awaiting reviewer evaluation"}
                    </span>
                    {spec.carriedForward && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                        Carried forward from prior cycle
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 6. COMPLETE RESEARCH ACTION CARD (Vibrant 100% Unlock Showcase)   */}
        {/* ================================================================= */}
        <div
          id="review-complete-research"
          className={`rounded-3xl border p-6 sm:p-8 transition-all shadow-2xs ${
            isCompletedProject
              ? "bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-700 shadow-md"
              : canComplete
              ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-300 shadow-md ring-2 ring-emerald-400/20"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isCompletedProject
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : canComplete
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <h3
                  className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                    isCompletedProject ? "text-white" : "text-slate-900"
                  }`}
                >
                  {isCompletedProject
                    ? "Research Project Completed & Published"
                    : canComplete
                    ? "All 3 Review Disciplines Approved! Ready to Complete"
                    : "Complete & Finalize Research"}
                </h3>
              </div>

              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  isCompletedProject
                    ? "text-emerald-100/80"
                    : canComplete
                    ? "text-emerald-950 font-medium"
                    : "text-slate-500"
                }`}
              >
                {isCompletedProject
                  ? "Your research project has earned 3 of 3 independent professional approvals and is permanently archived in the Completed Research catalog."
                  : canComplete
                  ? "Congratulations! Formulation Science, Bioinformatics, and Clinical Pharmacology reviewer roles have all officially approved this project. You may now generate the permanent research record and finalize the project."
                  : "Final completion unlocks once all 3 professional reviewer roles (Section 1, Section 2, Section 3) submit 100% approval decisions with no open revision requests."}
              </p>
            </div>

            {/* Action CTA Button */}
            <div className="shrink-0 flex flex-wrap items-center gap-3">
              {isCompletedProject ? (
                <Link
                  href={`/researcher/completed/${project.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>View Published Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(true)}
                  disabled={!canComplete || isCompleting}
                  className={`inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-xs font-extrabold transition-all shadow-md ${
                    canComplete
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer hover:scale-[1.02] shadow-emerald-500/20 active:scale-95"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  }`}
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Completing Project...</span>
                    </>
                  ) : canComplete ? (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Complete Research Project ✓</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Complete Research (Locked)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Unmet Prerequisites Checklist (When Locked) */}
          {!isCompletedProject && !canComplete && (
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Required approvals before project completion:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {specialties.map((spec) => {
                  const approved = spec.status === "Approved";
                  return (
                    <div
                      key={spec.areaKey}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        approved
                          ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <span className="font-medium truncate max-w-[180px]">{spec.specialty}</span>
                      {approved ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                          {spec.status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =================================================================== */}
      {/* 7. CONFIRM COMPLETE RESEARCH MODAL                                  */}
      {/* =================================================================== */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    Confirm Research Completion
                  </h3>
                  <span className="text-xs text-slate-500">Official Scientific Archival</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-xs text-emerald-950 space-y-2.5">
              <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>All 3 Multidisciplinary Roles Officially Approved!</span>
              </p>
              <p className="leading-relaxed text-emerald-800">
                Completing this research permanently records the project dossier, generates the immutable publication snapshot, and publishes the findings to your <strong>Completed Research</strong> archive.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCompleting}
                onClick={handleCompleteResearch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isCompleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Yes, Complete Research Project</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
