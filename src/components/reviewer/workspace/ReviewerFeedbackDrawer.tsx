"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  Trash2,
  MessageSquarePlus,
  Filter,
  User,
  Clock,
} from "lucide-react";

export interface ReviewerFeedbackDrawerProps {
  feedbackList: any[];
  onOpenFeedbackModal: () => void;
  onDeleteFeedback: (id: number) => Promise<void>;
  onResolveFeedback: (id: number) => Promise<void>;
}

export default function ReviewerFeedbackDrawer({
  feedbackList,
  onOpenFeedbackModal,
  onDeleteFeedback,
  onResolveFeedback,
}: ReviewerFeedbackDrawerProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filtered = feedbackList.filter((item) => {
    if (filterSeverity !== "ALL" && item.severity !== filterSeverity) return false;
    if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <span>Review Findings &amp; Recommended Revisions Log ({feedbackList.length})</span>
          </h2>
          <p className="text-xs text-slate-500">
            All section-specific feedback, scientific concerns, and recommendations communicated to the researcher.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenFeedbackModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>Add New Recommendation</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Severity:</span>
          </span>
          {["ALL", "CRITICAL", "MAJOR", "MINOR", "INFORMATIONAL"].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                filterSeverity === sev
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Status:</span>
          {["ALL", "OPEN", "RESOLVED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                filterStatus === st
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isResolved = item.status === "RESOLVED";
            const isCritical = item.severity === "CRITICAL" || item.severity === "MAJOR";

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                  isResolved
                    ? "bg-slate-50/70 border-slate-200 opacity-80"
                    : isCritical
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {item.title || item.commentType}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-medium">
                      {item.sectionName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.severity === "CRITICAL"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : item.severity === "MAJOR"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {item.severity}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isResolved
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                  {item.comment}
                </p>

                {item.recommendation && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-0.5">
                    <span className="font-bold text-slate-700 block">
                      Recommended Action:
                    </span>
                    <p className="text-slate-600">{item.recommendation}</p>
                  </div>
                )}

                {item.researcherReply && (
                  <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[11px] space-y-0.5">
                    <span className="font-bold text-indigo-900 block">
                      Researcher Response:
                    </span>
                    <p className="text-indigo-800">{item.researcherReply}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    By <strong>{item.reviewerName || "Reviewer"}</strong> ·{" "}
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recently"}
                  </span>

                  <div className="flex items-center gap-2">
                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => onResolveFeedback(item.id)}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteFeedback(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Finding"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-500 space-y-1">
          <p className="font-medium">No review findings match the selected filters.</p>
          <p className="text-slate-400">
            Click <strong>Add New Recommendation</strong> to log comments and suggestions.
          </p>
        </div>
      )}
    </div>
  );
}

