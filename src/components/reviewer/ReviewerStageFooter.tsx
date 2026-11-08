"use client";

import React from "react";
import { CheckCircle2, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { getReviewerActions, type ReviewCanonicalStatus } from "@/lib/professional-review-types";

export interface ReviewerStageFooterProps {
  stageNumber: number; // 1 to 6
  stageTitle: string; // e.g. "Plant & Literature Research"
  cycle: number;
  discipline: string; // e.g. "Pharmacognosy"
  onRequestRevision: () => void;
  onApprove: () => void;
  reviewStatus?: ReviewCanonicalStatus | string | null;
  reviewerName?: string | null;
  approvedAt?: string | null;
  isSubmitting?: boolean;
  isApproved?: boolean;
  isResubmitted?: boolean;
  disabled?: boolean;
}

export default function ReviewerStageFooter({
  stageNumber,
  stageTitle,
  cycle,
  discipline,
  onRequestRevision,
  onApprove,
  reviewStatus,
  reviewerName,
  approvedAt,
  isSubmitting = false,
  isApproved: propIsApproved,
  isResubmitted: propIsResubmitted,
  disabled = false,
}: ReviewerStageFooterProps) {
  // Determine effective status
  const effectiveStatus = reviewStatus || (propIsApproved ? "APPROVED" : propIsResubmitted ? "REVISION_RESUBMITTED" : "IN_REVIEW");
  const actionsState = getReviewerActions(effectiveStatus);

  const isApproved = propIsApproved || actionsState.statusBadge === "Approved";
  const isRevisionRequired = actionsState.statusBadge === "Revision Required";
  const isResubmitted = propIsResubmitted || actionsState.statusBadge === "Revision Resubmitted";

  const formattedDate = approvedAt
    ? new Date(approvedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <footer className="sticky bottom-0 z-30 w-full border-t border-blue-200/80 bg-[#f8fafc]/95 py-2.5 px-3 backdrop-blur-md sm:px-5 shadow-[0_-4px_16px_-8px_rgba(7,25,48,0.15)] font-sans">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        {/* Left / Center: Stage and Cycle Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-800">
            Stage {stageNumber} of 6 · {stageTitle}
          </span>
          <span className="text-slate-300">·</span>
          <span className="font-mono text-slate-500">
            Cycle {cycle} · <strong className="font-semibold text-[#0b2447]">{discipline}</strong>
          </span>

          {isApproved ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 ml-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Approved</span>
            </span>
          ) : isRevisionRequired ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 ml-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Revision Required</span>
            </span>
          ) : isResubmitted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 ml-1">
              <RotateCcw className="w-3 h-3 text-blue-600" />
              <span>Revision Resubmitted</span>
            </span>
          ) : null}
        </div>

        {/* Right: Consolidated Review Action State or Decision Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {isApproved ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/90 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>✓ Approved · Professional review completed</span>
              </div>
              {(reviewerName || formattedDate) && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Approved by {reviewerName || "Professional Reviewer"}{formattedDate ? ` on ${formattedDate}` : ""}
                </span>
              )}
            </div>
          ) : isRevisionRequired ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Revision Required · Waiting for researcher corrections</span>
            </div>
          ) : (
            /* Action Buttons (Available only when review is actionable: NEEDS_REVIEW, IN_REVIEW, REVISION_RESUBMITTED) */
            <>
              <button
                type="button"
                onClick={onRequestRevision}
                disabled={disabled || isSubmitting}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-300 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                )}
                <span>{isResubmitted ? "Request Further Revision" : "Request Revision"}</span>
              </button>

              <button
                type="button"
                onClick={onApprove}
                disabled={disabled || isSubmitting}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-100" />
                    <span>Approving…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Approve stage</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
