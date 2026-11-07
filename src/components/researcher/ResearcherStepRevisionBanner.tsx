"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  X,
  MessageSquareWarning,
  FileCheck2,
  Sparkles,
  Check,
} from "lucide-react";
import { isFeedbackBelongsToStep } from "@/lib/feedback-step-filter";

export interface ResearcherStepRevisionBannerProps {
  projectId: number;
  sectionKey: "section1" | "section2" | "section3";
  sectionTitle: string;
  stepNumber: number;
  stepTitle: string;
}

export default function ResearcherStepRevisionBanner({
  projectId,
  sectionKey,
  sectionTitle,
  stepNumber,
  stepTitle,
}: ResearcherStepRevisionBannerProps) {
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Resubmit modal state
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/researcher/projects/${projectId}/feedback`);
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data.feedback || []);
      }
    } catch (err) {
      console.error("Error loading step feedback:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFeedback();

    const handleSync = () => loadFeedback();
    window.addEventListener("natureaide:review-updated", handleSync);
    window.addEventListener("natureaide:revisions-updated", handleSync);
    return () => {
      window.removeEventListener("natureaide:review-updated", handleSync);
      window.removeEventListener("natureaide:revisions-updated", handleSync);
    };
  }, [loadFeedback]);

  // Find feedback items strictly matching this section and step
  const stepFindings = feedbackList.filter((f) =>
    isFeedbackBelongsToStep(f, sectionKey, stepNumber, stepTitle)
  );

  // Only show if there are active findings (OPEN or ADDRESSED)
  const activeFindings = stepFindings.filter((f) => f.status === "OPEN" || f.status === "ADDRESSED");

  if (loading || activeFindings.length === 0) {
    return null;
  }

  const handleOpenResubmitModal = (item: any) => {
    setActiveItem(item);
    setResolutionNote(item.researcherReply || "");
  };

  const handleConfirmResubmit = async () => {
    if (!activeItem) return;
    const trimmed = resolutionNote.trim();
    if (!trimmed) {
      alert("Please provide a brief resolution note describing your updates for the reviewer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: activeItem.id,
          researcherReply: trimmed,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to resubmit revision.");
      }

      setSuccessMessage(
        `Step ${stepNumber} revision resubmitted successfully! The scientific reviewer has been notified to re-evaluate your updates.`
      );
      setActiveItem(null);
      setResolutionNote("");
      setShowSuccessModal(true);

      await loadFeedback();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("natureaide:revisions-updated"));
        window.dispatchEvent(new CustomEvent("natureaide:review-updated"));
      }
    } catch (err: any) {
      alert(err.message || "Could not resubmit revision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ===================================================================== */}
      {/* 1. ACTIVE STEP REVISION BANNER (HIGH VISIBILITY AT TOP OF STEP)      */}
      {/* ===================================================================== */}
      <div className="mb-6 space-y-3">
        {activeFindings.map((item) => {
          const isAddressed = item.status === "ADDRESSED";

          // Clean title if it contains duplicate comment
          let displayTitle = item.title || `Step ${stepNumber} Finding`;
          if (displayTitle.includes(":")) {
            const parts = displayTitle.split(":");
            const rest = parts.slice(1).join(":").trim();
            if (rest.toLowerCase() === (item.comment || "").trim().toLowerCase()) {
              displayTitle = parts[0].trim();
            }
          }

          const hasDistinctRecommendation =
            item.recommendation &&
            item.recommendation.trim().toLowerCase() !== (item.comment || "").trim().toLowerCase();

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
                isAddressed
                  ? "bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border-teal-300 ring-1 ring-teal-400/20"
                  : "bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border-amber-300 ring-1 ring-amber-400/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-3 border-amber-200/60">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isAddressed
                        ? "bg-teal-600 text-white"
                        : "bg-amber-600 text-white animate-pulse"
                    }`}
                  >
                    {isAddressed ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                      {isAddressed
                        ? `Step ${stepNumber} Revision Addressed`
                        : `Reviewer Revision Required · Step ${stepNumber}`}
                    </span>
                    <h4 className="font-heading font-extrabold text-sm text-slate-900">
                      {displayTitle}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-[9.5px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      item.severity === "CRITICAL"
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : item.severity === "MAJOR"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-sky-100 text-sky-800 border border-sky-300"
                    }`}
                  >
                    {item.severity}
                  </span>

                  <span
                    className={`font-mono text-[9.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isAddressed
                        ? "bg-teal-100 text-teal-900 border-teal-300"
                        : "bg-amber-100 text-amber-900 border-amber-300 font-black animate-pulse"
                    }`}
                  >
                    {isAddressed ? "RESUBMITTED TO REVIEWER" : "ACTION REQUIRED"}
                  </span>
                </div>
              </div>

              {/* Reviewer Note / Critique */}
              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-white/95 border border-amber-200/80 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Reviewer Scientific Critique &amp; Observations:
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                    {item.comment}
                  </p>
                </div>

                {/* Optional Distinct Action */}
                {hasDistinctRecommendation && (
                  <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300/80 text-xs">
                    <strong className="text-amber-950 font-bold block mb-0.5">
                      Required Action:
                    </strong>
                    <p className="text-amber-900 leading-relaxed font-medium">
                      {item.recommendation}
                    </p>
                  </div>
                )}

                {/* Submitted Note if already addressed */}
                {item.researcherReply && (
                  <div className="p-3 rounded-xl bg-teal-100/80 border border-teal-300 text-xs space-y-0.5">
                    <span className="font-bold text-[10.5px] text-teal-900 uppercase tracking-wider block">
                      ✓ Your Submitted Resolution Note:
                    </span>
                    <p className="text-teal-950 font-medium leading-relaxed">
                      {item.researcherReply}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-amber-200/60">
                <span className="text-[11px] text-slate-600">
                  Reviewer: <strong>{item.reviewerDisplayName || "Scientific Reviewer"}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenResubmitModal(item)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      isAddressed
                        ? "bg-teal-700 hover:bg-teal-800 text-white"
                        : "bg-emerald-700 hover:bg-emerald-800 text-white ring-2 ring-emerald-500/20"
                    }`}
                  >
                    {isAddressed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Submitted ✓ (Update Resubmission)</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Resubmit Revision for Review →</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* 2. RESUBMIT REVISION MODAL                                            */}
      {/* ===================================================================== */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900">
                    Resubmit Step {stepNumber} Revision
                  </h3>
                  <span className="text-[11px] text-slate-500">{sectionTitle}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                Reviewer Finding:
              </span>
              <p className="text-amber-950 font-medium leading-relaxed">
                {activeItem.comment}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Resolution &amp; Implementation Summary:
              </label>
              <textarea
                rows={4}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe the scientific updates or corrections made in this step (e.g., Updated botanical voucher identity, recalculated viscosity parameters, refined molecular docking active site box)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed custom-scrollbar shadow-inner"
              />
              <span className="text-[10.5px] text-slate-400 block">
                This note will be submitted directly to the reviewer with your updated parameters.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmResubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm &amp; Resubmit Revision</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. RESUBMISSION SUCCESS MODAL                                         */}
      {/* ===================================================================== */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-heading font-extrabold text-slate-900 tracking-tight">
                Revision Resubmitted Successfully!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {successMessage}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-medium">
              Status updated to <strong>Resubmitted</strong>. The reviewer has received an instant notification to review your revised data.
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Continue Research
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

