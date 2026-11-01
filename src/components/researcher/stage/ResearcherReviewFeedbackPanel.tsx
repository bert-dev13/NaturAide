"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Info,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export interface ReviewRecommendationItem {
  id: number | string;
  type?: string;
  commentType?: string;
  sectionName?: string;
  section?: string;
  title?: string;
  field?: string;
  comment: string;
  recommendation?: string | null;
  severity?: string;
  status?: string;
}

export interface ResearcherReviewFeedbackPanelProps {
  projectId?: number;
  stageNumber?: number;
  stageTitle?: string;
  stageName?: string;
  discipline: string; // e.g. "Pharmacognosy"
  overallAssessment?: string | null;
  reviewStatus?: string | null; // e.g. "REVISION_REQUIRED", "APPROVED", "COMPLETED"
  recommendations?: ReviewRecommendationItem[];
  feedbackItems?: ReviewRecommendationItem[];
  reviewerName?: string | null;
  approvedAt?: string | null;
  isRevisionMode?: boolean;
  isApproved?: boolean;
  onGoToTarget?: (target: string) => void;
}

export function getRecommendationTypeBadge(typeOrCommentType?: string) {
  const norm = (typeOrCommentType || "").toUpperCase();
  if (norm.includes("CORRECTION") || norm === "CORRECTION_SUGGESTED") {
    return {
      label: "Correction",
      className: "bg-rose-50 text-rose-800 border-rose-200/80",
      dot: "bg-rose-500",
    };
  }
  if (norm.includes("CONCERN") || norm === "SAFETY_CONCERN" || norm === "CRITICAL") {
    return {
      label: "Scientific Concern",
      className: "bg-amber-50 text-amber-900 border-amber-300",
      dot: "bg-amber-500",
    };
  }
  if (norm.includes("CLARIFICATION") || norm === "CLARIFICATION_NEEDED") {
    return {
      label: "Clarification",
      className: "bg-sky-50 text-sky-800 border-sky-200/80",
      dot: "bg-sky-500",
    };
  }
  return {
    label: "Recommendation",
    className: "bg-blue-50 text-blue-800 border-blue-200/80",
    dot: "bg-blue-500",
  };
}

export default function ResearcherReviewFeedbackPanel({
  projectId,
  stageNumber,
  stageTitle,
  stageName,
  discipline,
  overallAssessment,
  reviewStatus,
  recommendations = [],
  feedbackItems,
  reviewerName,
  approvedAt,
  isRevisionMode,
  isApproved: propIsApproved,
  onGoToTarget,
}: ResearcherReviewFeedbackPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const displayStageTitle = stageTitle || stageName || (stageNumber ? `Stage ${stageNumber}` : "Research Stage");
  const recList = (recommendations && recommendations.length > 0) ? recommendations : (feedbackItems || []);
  const revisionsUrl = projectId ? `/researcher/projects/${projectId}/revisions` : "#";

  const isApproved = propIsApproved !== undefined ? propIsApproved : (
    reviewStatus === "APPROVED" ||
    reviewStatus === "ACCEPTABLE" ||
    reviewStatus === "COMPLETED"
  );

  const openRecs = recList.filter(
    (r) => (r.status || "OPEN").toUpperCase() !== "RESOLVED"
  );

  const handleScrollToTarget = (sectionName?: string, fieldName?: string) => {
    const rawTarget = (fieldName || sectionName || "").trim().toLowerCase();
    let elementId = "";

    // Stage 1 mapping
    if (rawTarget.includes("identity") || rawTarget.includes("botanical") || rawTarget.includes("family") || rawTarget.includes("voucher") || rawTarget.includes("specimen")) {
      elementId = "sec-identity";
    } else if (rawTarget.includes("material") || rawTarget.includes("part")) {
      elementId = "sec-material";
    } else if (rawTarget.includes("extraction") || rawTarget.includes("solvent")) {
      elementId = "sec-extraction";
    } else if (rawTarget.includes("literature") || rawTarget.includes("study") || rawTarget.includes("reference")) {
      elementId = "sec-literature";
    } else if (rawTarget.includes("synthesis") || rawTarget.includes("interpretation")) {
      elementId = "sec-synthesis";
    }
    // Stage 2 mapping
    else if (rawTarget.includes("compound")) {
      elementId = "sec-compounds";
    } else if (rawTarget.includes("admet") || rawTarget.includes("screening")) {
      elementId = "sec-screening";
    } else if (rawTarget.includes("target")) {
      elementId = "sec-targets";
    } else if (rawTarget.includes("docking") && rawTarget.includes("prep")) {
      elementId = "sec-docking-prep";
    }
    // Stage 3 mapping
    else if (rawTarget.includes("setup") || rawTarget.includes("grid")) {
      elementId = "sec-docking-setup";
    } else if (rawTarget.includes("result") || rawTarget.includes("affinity") || rawTarget.includes("vina")) {
      elementId = "sec-docking-results";
    } else if (rawTarget.includes("pharmacolog") || rawTarget.includes("interpretation")) {
      elementId = "sec-docking-interpretation";
    }
    // Stage 4 mapping
    else if (rawTarget.includes("formulation") || rawTarget.includes("prototype")) {
      elementId = "sec-formulation-design";
    } else if (rawTarget.includes("protocol") || rawTarget.includes("solvent")) {
      elementId = "sec-formulation-protocol";
    } else if (rawTarget.includes("stability") || rawTarget.includes("dosage")) {
      elementId = "sec-formulation-stability";
    }
    // Stage 5 mapping
    else if (rawTarget.includes("evidence") || rawTarget.includes("safety-evidence")) {
      elementId = "sec-safety-evidence";
    } else if (rawTarget.includes("toxic") || rawTarget.includes("assessment")) {
      elementId = "sec-safety-assessment";
    } else if (rawTarget.includes("clinical") || rawTarget.includes("posology")) {
      elementId = "sec-safety-summary";
    }
    // Default fallback
    else {
      elementId = sectionName ? `sec-${sectionName.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "";
    }

    if (elementId) {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("ring-2", "ring-amber-400", "ring-offset-2", "transition-all");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-amber-400", "ring-offset-2");
        }, 3000);
      }
    }

    if (onGoToTarget) {
      onGoToTarget(rawTarget);
    }
  };

  // If approved, show clean green approval badge
  if (isApproved) {
    return (
      <div className="w-full rounded-2xl bg-teal-50/95 border-2 border-teal-200/90 p-4 sm:p-5 shadow-xs space-y-2 text-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Professional Review Endorsed
                </span>
                <span className="text-teal-400">·</span>
                <span className="text-xs font-semibold text-teal-900">
                  {discipline} Review Approved
                </span>
              </div>
              <p className="text-xs text-teal-800/90 mt-0.5">
                {overallAssessment || "All submitted experimental methods and scientific data have been verified as acceptable."}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 text-[10px] font-black uppercase tracking-wider shrink-0 border border-teal-200">
            ✓ Endorsed
          </span>
        </div>
      </div>
    );
  }

  // If revision was resubmitted, show clean informational waiting badge
  const isResubmitted = reviewStatus === "REVISION_RESUBMITTED";
  if (isResubmitted) {
    const addressedItems = recList.filter(
      (r) => (r.status || "").toUpperCase() === "ADDRESSED" || (r.status || "").toUpperCase() === "RESOLVED"
    );
    const count = addressedItems.length > 0 ? addressedItems.length : (recList.length || 1);

    return (
      <div className="w-full rounded-2xl bg-blue-50/90 border border-blue-200/90 p-4 sm:p-5 shadow-xs space-y-2 text-slate-900 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-md border border-blue-200 font-mono">
                  Revision Resubmitted
                </span>
                <span className="text-blue-300">·</span>
                <span className="text-xs font-bold text-blue-950 font-heading">
                  {discipline} Review
                </span>
              </div>
              <p className="text-xs text-blue-900/90 mt-1">
                {count} recommendation{count === 1 ? "" : "s"} addressed. Waiting for professional review.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            {projectId ? (
              <Link
                href={revisionsUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>View Review Status</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // If no open revisions and not in revision required status, don't render panel
  if (openRecs.length === 0 && !overallAssessment && reviewStatus !== "REVISION_REQUIRED") {
    return null;
  }

  return (
    <div className="w-full rounded-2xl bg-amber-50/95 border-2 border-amber-300/90 shadow-sm overflow-hidden text-slate-900 animate-in fade-in duration-300">
      {/* Top Banner Bar - Compact Revision Notice */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-100/60 to-amber-50/40">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-2xs mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase bg-amber-200/90 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-300 font-mono">
                Revision Required
              </span>
              <span className="text-amber-400">·</span>
              <span className="text-xs font-bold text-amber-950 font-heading">
                {discipline} Review
              </span>
            </div>
            <p className="text-xs font-medium text-amber-900 mt-0.5">
              {openRecs.length} recommendation{openRecs.length === 1 ? " requires" : "s require"} your attention.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          {projectId ? (
            <Link
              href={revisionsUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#164130] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>View Revisions</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-950 text-xs font-medium transition-all shadow-2xs cursor-pointer"
            title={expanded ? "Hide quick preview" : "Show quick preview"}
          >
            <span>{expanded ? "Hide Details" : "Quick Preview"}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Reviewer Feedback Panel */}
      {expanded && (
        <div className="p-5 sm:p-6 space-y-5 bg-white/95">
          {/* 1. Overall Assessment */}
          {overallAssessment && (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                <span>Overall Assessment</span>
                {reviewerName && (
                  <span className="text-[11px] font-normal text-amber-800">
                    — {reviewerName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-amber-100">
                &ldquo;{overallAssessment}&rdquo;
              </p>
            </div>
          )}

          {/* 2. Specific Recommendations & Corrections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Reviewer Feedback &amp; Corrections ({openRecs.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Click &ldquo;Go to Field&rdquo; to navigate and update the corresponding research data.
              </span>
            </div>

            <div className="space-y-2.5">
              {openRecs.map((rec, index) => {
                const badge = getRecommendationTypeBadge(rec.type || rec.commentType);
                const itemNum = String(index + 1).padStart(2, "0");
                const sectionDisplay = rec.section || rec.sectionName || "Stage Section";
                const fieldDisplay = rec.field || rec.title;

                return (
                  <div
                    key={`feedback-rec-${rec.id || index}-${index}`}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-colors shadow-2xs space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {itemNum}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${badge.className}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {sectionDisplay}
                          {fieldDisplay && fieldDisplay !== sectionDisplay && (
                            <span className="text-slate-500 font-normal">
                              {" "}
                              · <strong className="font-semibold text-slate-800">{fieldDisplay}</strong>
                            </span>
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleScrollToTarget(sectionDisplay, fieldDisplay)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        <span>{fieldDisplay ? "Go to Field" : "Go to Section"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Exact Reviewer Comment */}
                    <div className="pl-6 border-l-2 border-amber-300">
                      <p className="text-xs text-slate-800 leading-relaxed font-sans">
                        {rec.comment}
                      </p>
                      {rec.recommendation && (
                        <p className="text-[11.5px] text-amber-900 mt-1 font-medium">
                          Suggested action: {rec.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
