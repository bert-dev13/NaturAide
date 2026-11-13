"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Loader2,
  Lock,
  Sparkles,
  Cpu,
  FileCheck2,
  X,
  FlaskConical,
  MessageSquareWarning,
  ChevronRight,
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

const easeOut = [0.22, 1, 0.36, 1] as const;

const FALLBACK_SPECIALTIES: SpecialtyApprovalRow[] = [
  {
    code: "01",
    areaKey: "formulation",
    specialty: "Formulation Science & Pharmacognosy",
    roleTitle: "Formulation Scientist / Pharmacognosist",
    reviewerId: null,
    reviewerName: null,
    reviewerQualification: null,
    status: "Pending",
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
    status: "Pending",
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
    status: "Pending",
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

function shortSpecialty(code: string, specialty: string) {
  if (code === "01") return "Formulation";
  if (code === "02") return "In-Silico";
  if (code === "03") return "Clinical / Paper";
  return specialty.split("&")[0]?.trim() || specialty;
}

function sectionMeta(code: string, projectId: number) {
  if (code === "01") {
    return {
      label: "Section 1",
      href: `/researcher/projects/${projectId}/formulation-rd`,
      Icon: FlaskConical,
      stepsFallback: 6,
    };
  }
  if (code === "02") {
    return {
      label: "Section 2",
      href: `/researcher/projects/${projectId}/in-silico`,
      Icon: Cpu,
      stepsFallback: 7,
    };
  }
  return {
    label: "Section 3",
    href: `/researcher/projects/${projectId}/submission`,
    Icon: FileCheck2,
    stepsFallback: 3,
  };
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

  const isCompletedProject = Boolean(
    project.status === "COMPLETED" || approvalState?.isCompleted
  );

  const refreshApprovalStatus = useCallback(async () => {
    setIsRefreshing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/approval-status`);
      if (res.ok) {
        const data = await res.json();
        if (data.approvalState) setApprovalState(data.approvalState);
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
      if (!res.ok) throw new Error(data.error || "Failed to complete research project.");
      setShowCompleteModal(false);
      router.push(data.redirectUrl || `/researcher/completed/${project.id}`);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to complete research project." });
      setIsCompleting(false);
    }
  };

  const approvedCount = approvalState?.approvedCount ?? 0;
  const totalSpecialties = approvalState?.totalSpecialties ?? 3;
  const isAllApproved = approvedCount === totalSpecialties;
  const canComplete = Boolean(approvalState?.canCompleteResearch || isAllApproved);
  const unresolved = approvalState?.unresolvedRevisionsCount ?? 0;
  const revisionsNeeded = approvalState?.revisionsRequiredSpecialties?.length || 0;

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
        : Math.min(100, Math.round((approvedCount / totalSpecialties) * 100));

  const specialties = approvalState?.specialties?.length
    ? approvalState.specialties
    : FALLBACK_SPECIALTIES;

  const statusLabel = isCompletedProject
    ? `Completed (${approvedCount}/${totalSpecialties})`
    : revisionsNeeded > 0
      ? "Revisions required"
      : isAllApproved
        ? "Ready to complete"
        : `${approvedCount}/${totalSpecialties} approved`;

  const sectionLinks = [
    {
      n: 1,
      title: "Formulation",
      href: `/researcher/projects/${project.id}/formulation-rd`,
      Icon: FlaskConical,
      done: Boolean(approvalState?.readiness?.isSection1Complete),
    },
    {
      n: 2,
      title: "In-Silico",
      href: `/researcher/projects/${project.id}/in-silico`,
      Icon: Cpu,
      done: Boolean(approvalState?.readiness?.isSection2Complete),
    },
    {
      n: 3,
      title: "Paper",
      href: `/researcher/projects/${project.id}/submission`,
      Icon: FileCheck2,
      done: Boolean(approvalState?.readiness?.isDossierComplete),
    },
    {
      n: 4,
      title: "Approval",
      href: `/researcher/projects/${project.id}/completion`,
      Icon: Award,
      current: true,
      done: isCompletedProject || isAllApproved,
    },
  ];

  return (
    <div className="w-full max-w-none space-y-4 pb-28 text-slate-800">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(15,44,32,0.55)] sm:px-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-emerald-200/80">
                <Link
                  href={`/researcher/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 transition hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Workspace Hub
                </Link>
                <span className="text-emerald-700">/</span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                  Section 4 · Approval
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    isCompletedProject || isAllApproved
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                      : revisionsNeeded > 0
                        ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
                        : "border-sky-400/40 bg-sky-500/15 text-sky-100"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isCompletedProject || isAllApproved
                        ? "bg-emerald-300"
                        : revisionsNeeded > 0
                          ? "bg-rose-300"
                          : "animate-pulse bg-sky-300"
                    }`}
                  />
                  {statusLabel}
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200">
                  <Award className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
                    Professional Approval
                  </h1>
                  <p className="truncate text-[11px] text-emerald-200/70">{project.title}</p>
                </div>
              </div>

              <div className="mt-2 flex max-w-sm items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${overallStepPercent}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] font-bold text-emerald-200">
                  {overallStepPercent}% · {approvedCount}/{totalSpecialties}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={refreshApprovalStatus}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold text-emerald-100 transition hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Sync
              </button>
              <Link
                href={`/researcher/revisions?projectId=${project.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold text-emerald-100 transition hover:bg-white/10"
              >
                <MessageSquareWarning className="h-3.5 w-3.5" />
                Revisions
                {unresolved > 0 && (
                  <span className="rounded-md bg-amber-400/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#091a13]">
                    {unresolved}
                  </span>
                )}
              </Link>
              {isCompletedProject ? (
                <Link
                  href={`/researcher/completed/${project.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
                >
                  Published dossier
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : canComplete ? (
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
                >
                  Complete research
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {sectionLinks.map((step) => {
              const Icon = step.Icon;
              return (
                <Link
                  key={step.n}
                  href={step.href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    step.current
                      ? "bg-emerald-400 text-[#091a13] shadow-sm"
                      : step.done
                        ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                        : "border border-white/10 bg-white/5 text-emerald-100/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="font-mono text-[10px] opacity-80">{step.n}</span>
                  <span>{step.title}</span>
                  {step.done && !step.current && <CheckCircle2 className="h-3 w-3 opacity-80" />}
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-medium ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="rounded-md p-1 text-current/60 hover:bg-black/5"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact metrics strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {[
          {
            label: "Roles",
            value: `${approvedCount}/${totalSpecialties}`,
            hint: "approved",
          },
          {
            label: "Steps",
            value: `${overallStepPercent}%`,
            hint: "step coverage",
          },
          {
            label: "Cycle",
            value: approvalState?.latestSubmission?.versionTag || "v1.0",
            hint: approvalState?.latestSubmission?.submittedAt
              ? new Date(approvalState.latestSubmission.submittedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "—",
          },
          {
            label: "Findings",
            value: String(unresolved),
            hint: unresolved > 0 ? "open" : "clear",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-[#d7e4dc]/90 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">{m.label}</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#0f2c20]">{m.value}</p>
            <p className="text-[10px] text-[#6d7f76]">{m.hint}</p>
          </div>
        ))}
      </motion.div>

      {revisionsNeeded > 0 && !isCompletedProject && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-950">Revisions requested</p>
              <p className="text-[11px] text-amber-900/80">
                {approvalState?.revisionsRequiredSpecialties.join(", ")}
              </p>
            </div>
          </div>
          <Link
            href={`/researcher/revisions?projectId=${project.id}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-amber-700"
          >
            Open revisions
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      )}

      {/* Specialty grid */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef2ef] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Award className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#0f2c20]">Review specialties</h2>
              <p className="text-[11px] text-[#8aa094]">3 independent roles · step coverage</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Track roles" },
              { n: "2", label: "Fix findings" },
              { n: "3", label: "Complete" },
            ].map((step, idx) => (
              <span
                key={step.n}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] px-2.5 py-1 text-[10px] font-semibold text-[#52645d]"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-md bg-emerald-600 text-[9px] font-bold text-white">
                  {step.n}
                </span>
                {step.label}
                {idx < 2 && <ChevronRight className="h-3 w-3 text-[#c5d4cb]" />}
              </span>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#eef2ef]">
          {specialties.map((spec) => {
            const isApproved = spec.status === "Approved";
            const isRevision = spec.status === "Revision Required";
            const isInReview = spec.status === "In Review";
            const meta = sectionMeta(spec.code, project.id);
            const Icon = meta.Icon;
            const totalSteps = spec.totalSteps || meta.stepsFallback;
            const approvedStepCount =
              typeof spec.approvedStepCount === "number"
                ? spec.approvedStepCount
                : isApproved
                  ? totalSteps
                  : 0;
            const pct =
              typeof spec.approvedPercent === "number"
                ? spec.approvedPercent
                : isApproved
                  ? 100
                  : Math.round((approvedStepCount / totalSteps) * 100);

            return (
              <div key={spec.areaKey} className="px-4 py-3.5 transition hover:bg-[#f8fbf9]/80">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d7e4dc] bg-[#f6f8f6] text-emerald-800">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[#8aa094]">
                          {spec.code}
                        </span>
                        <h3 className="text-sm font-semibold text-[#0f2c20]">
                          {shortSpecialty(spec.code, spec.specialty)}
                        </h3>
                        <span className="rounded-md border border-[#d7e4dc] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#52645d]">
                          {meta.label}
                        </span>
                      </div>
                      {spec.decisionDate ? (
                        <p className="mt-0.5 text-[11px] text-[#6d7f76]" suppressHydrationWarning>
                          Evaluated{" "}
                          {new Date(spec.decisionDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-[#8aa094]">Awaiting evaluation</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <div className="min-w-[140px]">
                      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[#6d7f76]">
                        <span>
                          {approvedStepCount}/{totalSteps} steps
                        </span>
                        <span className="font-mono text-emerald-800">{pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#e6ebe7]">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold ${
                        isApproved
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : isRevision
                            ? "border-rose-200 bg-rose-50 text-rose-900"
                            : isInReview
                              ? "border-sky-200 bg-sky-50 text-sky-900"
                              : "border-[#d7e4dc] bg-[#f6f8f6] text-[#52645d]"
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : isRevision ? (
                        <AlertCircle className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      {spec.status}
                    </span>

                    <Link
                      href={meta.href}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#52645d] transition hover:border-emerald-300 hover:text-emerald-900"
                    >
                      Open
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {spec.comments && (
                  <p className="mt-2.5 line-clamp-2 rounded-xl border border-[#eef2ef] bg-[#f8fbf9] px-3 py-2 text-[11px] leading-relaxed text-[#33443c]">
                    {spec.comments}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Completion strip */}
      <motion.section
        id="review-complete-research"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: easeOut, delay: 0.04 }}
        className={`rounded-2xl border px-4 py-4 sm:px-5 ${
          isCompletedProject
            ? "border-emerald-800/40 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_100%)] text-white"
            : canComplete
              ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50/60"
              : "border-[#d7e4dc]/90 bg-white"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Award
                className={`h-4 w-4 ${
                  isCompletedProject
                    ? "text-emerald-300"
                    : canComplete
                      ? "text-emerald-700"
                      : "text-[#8aa094]"
                }`}
              />
              <h3
                className={`text-sm font-semibold ${
                  isCompletedProject ? "text-white" : "text-[#0f2c20]"
                }`}
              >
                {isCompletedProject
                  ? "Published"
                  : canComplete
                    ? "Ready to complete"
                    : "Awaiting full approval"}
              </h3>
            </div>
            <p
              className={`mt-0.5 text-[11px] ${
                isCompletedProject ? "text-emerald-200/80" : "text-[#6d7f76]"
              }`}
            >
              {isCompletedProject
                ? `${approvedCount}/${totalSpecialties} roles approved · archived in Completed Research`
                : canComplete
                  ? "All 3 roles approved · finalize the permanent record"
                  : "Unlocks when Formulation, In-Silico, and Clinical/Paper are approved"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isCompletedProject ? (
              <Link
                href={`/researcher/completed/${project.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-[11px] font-bold text-[#091a13] transition hover:bg-emerald-300"
              >
                View dossier
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowCompleteModal(true)}
                disabled={!canComplete || isCompleting}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-bold transition disabled:cursor-not-allowed ${
                  canComplete
                    ? "bg-[#0f2c20] text-emerald-100 hover:bg-[#1e5c44]"
                    : "border border-[#d7e4dc] bg-[#f6f8f6] text-[#8aa094]"
                }`}
              >
                {isCompleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : canComplete ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                {canComplete ? "Complete research" : "Locked"}
              </button>
            )}
          </div>
        </div>

        {!isCompletedProject && !canComplete && (
          <div className="mt-3 grid grid-cols-1 gap-1.5 border-t border-[#eef2ef] pt-3 sm:grid-cols-3">
            {specialties.map((spec) => {
              const approved = spec.status === "Approved";
              return (
                <div
                  key={spec.areaKey}
                  className={`flex items-center justify-between rounded-xl border px-2.5 py-2 text-[11px] ${
                    approved
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                      : "border-[#e6ebe7] bg-[#f8fbf9] text-[#52645d]"
                  }`}
                >
                  <span className="truncate font-medium">
                    {shortSpecialty(spec.code, spec.specialty)}
                  </span>
                  {approved ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                  ) : (
                    <span className="shrink-0 font-mono text-[10px]">{spec.status}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c20]/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2ef] p-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Award className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#0f2c20]">Complete research?</h3>
                  <p className="text-[11px] text-[#6d7f76]">Archives the approved dossier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="rounded-lg p-1.5 text-[#8aa094] hover:bg-[#f6f8f6] hover:text-[#0f2c20]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 p-4 text-[12px] leading-relaxed text-[#33443c]">
              <p>
                All 3 roles are approved. Completing publishes this project to Completed Research.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#eef2ef] bg-[#f8fbf9] p-3">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="rounded-xl border border-[#d7e4dc] bg-white px-3.5 py-2 text-[11px] font-semibold text-[#52645d]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCompleting}
                onClick={handleCompleteResearch}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2c20] px-3.5 py-2 text-[11px] font-bold text-emerald-100 hover:bg-[#1e5c44] disabled:opacity-50"
              >
                {isCompleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Confirm complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
