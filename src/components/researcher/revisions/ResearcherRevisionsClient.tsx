"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

interface Recommendation {
  id: number | string;
  itemNum: string;
  type: string;
  sectionName: string;
  fieldName: string | null;
  comment: string;
  recommendation?: string | null;
  severity: string | null;
  status: string;
  researcherReply?: string | null;
  researcherRepliedAt?: string | null;
  targetAnchor: string;
  navigateTo: string;
}

interface StageRevisionGroup {
  stageNumber: number;
  stageKey: string;
  stageTitle: string;
  discipline: string;
  route: string;
  status: string; // 'REVISION_REQUIRED' | 'RESUBMITTED' | 'APPROVED' | 'IN_REVIEW' | 'PENDING'
  reviewCycle: number;
  reviewerName: string;
  reviewerRole: string;
  overallAssessment?: string | null;
  submittedAt?: string | null;
  openCount: number;
  addressedCount: number;
  resolvedCount: number;
  totalCount: number;
  recommendations: Recommendation[];
}

interface ReviewHistoryItem {
  id: number;
  areaKey: string;
  stageNumber: number;
  stageTitle: string;
  discipline: string;
  reviewCycle: number;
  assessment: string;
  status: string;
  reviewerName: string;
  reviewerRole: string;
  comments?: string | null;
  submittedAt?: string | null;
  recommendations: {
    id: number | string;
    itemNum: string;
    type: string;
    sectionName: string;
    fieldName: string | null;
    comment: string;
    recommendation?: string | null;
    severity: string | null;
    status: string;
    researcherReply?: string | null;
    researcherRepliedAt?: string | null;
  }[];
}

interface ProjectData {
  id: number;
  title: string;
  plantName: string;
  plantScientificName?: string;
  status: string;
}

export function getTypeBadge(type: string) {
  const norm = (type || "").toUpperCase();
  if (norm.includes("CORRECTION")) {
    return {
      label: "Correction",
      bg: "bg-rose-50 text-rose-800 border-rose-200",
      dot: "bg-rose-500",
    };
  }
  if (norm.includes("CONCERN") || norm.includes("CRITICAL")) {
    return {
      label: "Scientific Concern",
      bg: "bg-amber-50 text-amber-900 border-amber-300",
      dot: "bg-amber-500",
    };
  }
  if (norm.includes("CLARIFICATION")) {
    return {
      label: "Clarification",
      bg: "bg-sky-50 text-sky-800 border-sky-200",
      dot: "bg-sky-500",
    };
  }
  return {
    label: "Recommendation",
    bg: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  };
}

export default function ResearcherRevisionsClient({ projectId }: { projectId: number }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeStages, setActiveStages] = useState<StageRevisionGroup[]>([]);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [openCount, setOpenCount] = useState<number>(0);
  const [stagesRequiringRevisionCount, setStagesRequiringRevisionCount] = useState<number>(0);
  const [addressedCount, setAddressedCount] = useState<number>(0);

  // View state: 'active' or 'history'
  const [currentView, setCurrentView] = useState<"active" | "history">("active");

  const fetchRevisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/researcher/projects/${projectId}/revisions`);
      if (!res.ok) {
        throw new Error(`Failed to load revisions: HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load revisions");
      }

      setProject(data.project);
      setActiveStages(data.activeStages || []);
      setReviewHistory(data.reviewHistory || []);
      setOpenCount(data.openRecommendationsCount || 0);
      setStagesRequiringRevisionCount(data.stagesRequiringRevisionCount || 0);
      setAddressedCount(data.addressedRecommendationsCount || 0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load revisions.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading Research Revisions...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving canonical reviewer recommendations...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="p-6 max-w-md w-full rounded-2xl bg-white border border-rose-200 shadow-sm text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Unable to Load Revisions</h2>
          <p className="text-xs text-slate-600">{error || "Project not found or unauthorized."}</p>
          <Link
            href={`/researcher/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Project Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans pb-32">
      {/* ============================================================== */}
      {/* 1. HEADER & NAVIGATION                                         */}
      {/* ============================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <Link
            href={`/researcher/projects/${projectId}`}
            className="group inline-flex items-center gap-2 text-xs font-bold text-[#52645d] hover:text-[#0f2c20] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 transition-transform group-hover:-translate-x-1" />
            <span>Back to Project Workspace</span>
          </Link>

          <span className="text-xs font-mono text-slate-400">
            Project #{projectId}
          </span>
        </div>

        {/* Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-900/60 bg-gradient-to-br from-[#072418] via-[#0d3626] to-[#041910] p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-2xl" />
          <div className="pointer-events-none absolute left-1/3 -bottom-12 h-36 w-36 rounded-full bg-teal-400/10 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-black tracking-widest text-emerald-300 uppercase block">
                RESEARCH REVISIONS
              </span>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>{project.plantName || "Botanical Research"}</span>
                {project.plantScientificName && (
                  <span className="font-serif italic font-normal text-emerald-200/80 text-lg sm:text-xl">
                    · {project.plantScientificName}
                  </span>
                )}
              </h1>

              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
                Professional reviewer recommendations and scientific feedback requiring your attention.
              </p>
            </div>

            {/* Metric Summary Cards */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300/90 block font-mono">
                  Open Recommendations
                </span>
                <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">
                  {openCount}
                </span>
              </div>

              <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300/90 block font-mono">
                  Stages Requiring Action
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-300 block mt-0.5">
                  {stagesRequiringRevisionCount}
                </span>
              </div>

              {addressedCount > 0 && (
                <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300/90 block font-mono">
                    Resubmitted / Addressed
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-teal-300 block mt-0.5">
                    {addressedCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs: Active Revisions vs Review History */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
          <button
            onClick={() => setCurrentView("active")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              currentView === "active"
                ? "border-emerald-700 text-[#0f2c20] font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${openCount > 0 ? "text-amber-600" : "text-slate-400"}`} />
            <span>Active Revisions</span>
            {openCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-black">
                {openCount}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
                0
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView("history")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              currentView === "history"
                ? "border-emerald-700 text-[#0f2c20] font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Review History</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {reviewHistory.length}
            </span>
          </button>
        </div>
      </motion.div>

      {/* ============================================================== */}
      {/* 2. MAIN CONTENT AREA                                           */}
      {/* ============================================================== */}
      <AnimatePresence mode="wait">
        {currentView === "active" ? (
          /* ================= ACTIVE REVISIONS VIEW ================= */
          activeStages.length === 0 ? (
            /* Clean Empty State: No active revisions */
            <motion.div
              key="empty-active"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 rounded-3xl bg-white border border-[#dde6df] shadow-sm text-center space-y-4 max-w-xl mx-auto"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-[#0f2c20]">No Active Revisions</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All professional recommendations for this research project have been resolved, or no revisions are currently required.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href={`/researcher/projects/${projectId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#164130] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Project Workspace</span>
                </Link>

                {reviewHistory.length > 0 && (
                  <button
                    onClick={() => setCurrentView("history")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                  >
                    <History className="w-4 h-4 text-slate-500" />
                    <span>View Review History ({reviewHistory.length})</span>
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            /* Active Revision Cards (Only stages requiring revision or resubmitted) */
            <motion.div
              key="active-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {activeStages.map((stage) => {
                const isRevisionReq = stage.status === "REVISION_REQUIRED";
                const isResubmitted = stage.status === "RESUBMITTED";

                return (
                  <div
                    key={stage.stageNumber}
                    className={`overflow-hidden rounded-3xl border transition-all shadow-md ${
                      isRevisionReq
                        ? "bg-white border-amber-300/90 shadow-amber-500/5"
                        : "bg-white border-blue-200"
                    }`}
                  >
                    {/* Stage Header Banner */}
                    <div
                      className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isRevisionReq
                          ? "bg-gradient-to-r from-amber-50/90 via-amber-100/40 to-transparent border-amber-200"
                          : "bg-gradient-to-r from-blue-50/80 via-teal-50/30 to-transparent border-blue-200"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`p-3 rounded-2xl text-white shadow-md shrink-0 ${
                            isRevisionReq
                              ? "bg-gradient-to-br from-amber-500 to-orange-600"
                              : "bg-gradient-to-br from-blue-500 to-teal-600"
                          }`}
                        >
                          {isRevisionReq ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-500">
                              STAGE 0{stage.stageNumber}
                            </span>
                            <span className="text-slate-300">·</span>
                            <h2 className="text-base sm:text-lg font-black text-[#0f2c20]">
                              {stage.stageTitle.replace(/^Stage\s+\d+\s*·\s*/i, "")}
                            </h2>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                            <span className="font-bold text-slate-900">{stage.discipline} Review</span>
                            <span className="text-slate-300">·</span>
                            <span>
                              Reviewed by <strong>{stage.reviewerName}</strong>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono text-slate-500">Cycle {stage.reviewCycle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Status Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {isRevisionReq ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>Revision Required</span>
                            <span className="text-amber-700/60 font-normal">·</span>
                            <span>{stage.openCount} open</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-xs font-black uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Revision Resubmitted</span>
                            <span className="text-blue-700/60 font-normal">·</span>
                            <span className="font-normal text-[11px]">Waiting for reviewer</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stage Body */}
                    <div className="p-6 sm:p-7 space-y-6">
                      {/* Overall Assessment Quote (Only if reviewer provided one) */}
                      {stage.overallAssessment && (
                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                            <MessageSquare className="w-4 h-4 text-amber-600" />
                            <span>Overall Reviewer Assessment</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3.5 rounded-xl border border-amber-100 font-serif">
                            &ldquo;{stage.overallAssessment}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Recommendations List */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">
                            Recommendations &amp; Requested Corrections ({stage.recommendations.length})
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Click &ldquo;Go to Field&rdquo; to navigate to the exact parameter.
                          </span>
                        </div>

                        <div className="space-y-3">
                          {stage.recommendations.map((rec) => {
                            const typeInfo = getTypeBadge(rec.type);
                            const isRecOpen = rec.status === "OPEN" || rec.status === "IN_REVIEW";

                            return (
                              <div
                                key={rec.id}
                                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                                  isRecOpen
                                    ? "bg-white border-slate-200 hover:border-amber-300 shadow-2xs"
                                    : "bg-slate-50/70 border-slate-200"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-black text-slate-400">
                                      {rec.itemNum}
                                    </span>
                                    <span className="text-slate-300">·</span>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${typeInfo.bg}`}>
                                      {typeInfo.label}
                                    </span>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-xs font-black text-slate-900">
                                      {rec.sectionName}
                                    </span>
                                    {rec.fieldName ? (
                                      <>
                                        <span className="text-slate-300">/</span>
                                        <span className="text-xs font-semibold text-slate-700">
                                          {rec.fieldName}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[11px] font-medium text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded-md">
                                        Section-level recommendation
                                      </span>
                                    )}
                                  </div>

                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border self-start sm:self-auto ${
                                      isRecOpen
                                        ? "bg-amber-100 text-amber-900 border-amber-300 font-mono"
                                        : "bg-teal-100 text-teal-900 border-teal-300 font-mono"
                                    }`}
                                  >
                                    {isRecOpen ? "Action Required" : "Resubmitted"}
                                  </span>
                                </div>

                                {/* Reviewer Comment (Only if present) */}
                                {rec.comment && (
                                  <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80">
                                    <strong className="text-slate-900 font-bold block mb-1">
                                      Reviewer Note:
                                    </strong>
                                    {rec.comment}
                                  </p>
                                )}

                                {/* Specific Actionable Recommendation (if any) */}
                                {rec.recommendation && (
                                  <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                                    <strong className="text-amber-900 font-bold block mb-0.5">
                                      Suggested Action:
                                    </strong>
                                    {rec.recommendation}
                                  </p>
                                )}

                                {/* Researcher Resubmission Note (Only if present) */}
                                {rec.researcherReply && (
                                  <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-900 space-y-0.5">
                                    <span className="font-bold text-[10px] uppercase font-mono tracking-wider block text-teal-800">
                                      Researcher Resubmission Note:
                                    </span>
                                    <p className="leading-relaxed">{rec.researcherReply}</p>
                                  </div>
                                )}

                                {/* Action Button & Severity */}
                                <div className="flex items-center justify-between pt-1">
                                  <div>
                                    {rec.severity ? (
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        Severity: <strong className="text-slate-700">{rec.severity}</strong>
                                      </span>
                                    ) : null}
                                  </div>

                                  <Link
                                    href={rec.navigateTo}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                      isRecOpen
                                        ? "bg-[#0f2c20] hover:bg-[#164130] text-white hover:shadow-xs"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    }`}
                                  >
                                    <span>
                                      {rec.fieldName ? "Go to Field" : "Go to Section"}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stage Bottom Action: Jump to Stage Workspace */}
                      <div className="pt-2 flex justify-end">
                        <Link
                          href={`/researcher/projects/${projectId}/${stage.route}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-800 font-bold text-xs transition-colors border border-slate-200 hover:border-emerald-300 cursor-pointer"
                        >
                          <span>Open Stage 0{stage.stageNumber} Workspace</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )
        ) : (
          /* ================= REVIEW HISTORY VIEW ================= */
          <motion.div
            key="history-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {reviewHistory.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-[#dde6df] shadow-sm text-center space-y-3 max-w-xl mx-auto">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Historical Reviews Yet</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Completed professional reviews and formal evaluation cycles will appear here as reviewers submit their findings.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewHistory.map((item) => {
                  const isApproved = item.assessment === "ACCEPTABLE" || item.status === "APPROVED";

                  return (
                    <div
                      key={item.id}
                      className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-400">
                              STAGE 0{item.stageNumber}
                            </span>
                            <span className="text-slate-300">·</span>
                            <h3 className="text-sm font-bold text-[#0f2c20]">
                              {item.discipline} Review
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span>
                              Reviewed by <strong>{item.reviewerName}</strong>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono">Cycle {item.reviewCycle}</span>
                            {item.submittedAt && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-xs font-black uppercase tracking-wider">
                              <span>Completed Cycle</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {item.comments && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
                          &ldquo;{item.comments}&rdquo;
                        </div>
                      )}

                      {item.recommendations.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">
                            Evaluated Items ({item.recommendations.length})
                          </span>
                          <div className="space-y-2">
                            {item.recommendations.map((rec) => (
                              <div
                                key={rec.id}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                    <span>{rec.sectionName}</span>
                                    {rec.fieldName && <span>/ {rec.fieldName}</span>}
                                  </div>
                                  {rec.comment && (
                                    <p className="text-slate-600 text-[11px] leading-relaxed">
                                      {rec.comment}
                                    </p>
                                  )}
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold self-start sm:self-auto shrink-0">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Resolved</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
