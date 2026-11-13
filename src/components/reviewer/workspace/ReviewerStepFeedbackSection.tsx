"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Check,
  RefreshCw,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { isFeedbackBelongsToStep } from "@/lib/feedback-step-filter";

export interface ReviewerStepFeedbackSectionProps {
  projectId: number;
  submissionId?: number | null;
  sectionKey: "section1" | "section2" | "section3";
  sectionTitle: string;
  stepNumber: number;
  stepTitle: string;
  roleProfession: string;
  isApproved: boolean;
  onToggleApprove: () => void;
  /** When false, hide the step-approval toggle (feedback form still shows). */
  showApproval?: boolean;
  feedbackList: any[];
  onRefreshFeedback: () => Promise<void>;
  onDeleteFeedback: (id: number) => Promise<void>;
  onResolveFeedback: (id: number) => Promise<void>;
}

export default function ReviewerStepFeedbackSection({
  projectId,
  submissionId,
  sectionKey,
  sectionTitle,
  stepNumber,
  stepTitle,
  roleProfession,
  isApproved,
  onToggleApprove,
  showApproval = true,
  feedbackList = [],
  onRefreshFeedback,
  onDeleteFeedback,
  onResolveFeedback,
}: ReviewerStepFeedbackSectionProps) {
  // Form input states
  const [isOpenForm, setIsOpenForm] = useState<boolean>(true);
  const [commentType, setCommentType] = useState<string>("REQUIRED_REVISION");
  const [severity, setSeverity] = useState<string>("MAJOR");
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formAlert, setFormAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // AI-Assisted Revision Engine states
  const [isAiRefining, setIsAiRefining] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    refinedComment: string;
    refinedRecommendation: string;
    suggestedSeverity?: string;
  } | null>(null);

  // Normalize step area key
  const areaKey =
    sectionKey === "section1"
      ? "formulation"
      : sectionKey === "section2"
      ? "bioinformatics"
      : "pharmacology";

  const fullStepName = `${sectionTitle}: Step ${stepNumber} — ${stepTitle}`;

  // Filter feedback items belonging to this specific step
  const stepFindings = feedbackList.filter((f) =>
    isFeedbackBelongsToStep(f, sectionKey, stepNumber, stepTitle)
  );

  // Call AI Assistant endpoint to polish and structure revision
  const handleAiRefine = async (mode: "polish" | "structure" | "monograph" | "clarity") => {
    if (!comment.trim()) {
      setFormAlert({
        type: "error",
        text: "Please write your preliminary notes or draft observations below first before requesting AI refinement.",
      });
      return;
    }

    setIsAiRefining(true);
    setFormAlert(null);

    try {
      const res = await fetch(`/api/reviewer/projects/${projectId}/ai-refine-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawComment: comment,
          rawRecommendation: recommendation,
          sectionName: fullStepName,
          areaKey,
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI revision assistance failed.");
      }

      setAiSuggestion({
        refinedComment: data.refinedComment || comment,
        refinedRecommendation: data.refinedRecommendation || recommendation,
        suggestedSeverity: data.suggestedSeverity || severity,
      });
    } catch (err: any) {
      setFormAlert({
        type: "error",
        text: err.message || "Could not complete AI refinement. You can proceed with manual edits.",
      });
    } finally {
      setIsAiRefining(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;
    const combined = aiSuggestion.refinedRecommendation
      ? `${aiSuggestion.refinedComment}\n\n${aiSuggestion.refinedRecommendation}`
      : aiSuggestion.refinedComment;
    setComment(combined);
    if (aiSuggestion.suggestedSeverity) {
      setSeverity(aiSuggestion.suggestedSeverity);
    }
    setAiSuggestion(null);
    setFormAlert({
      type: "success",
      text: "AI revision refinement applied to text box! You can submit or refine further.",
    });
  };

  // Submit Feedback for this step
  const handleSubmitFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) {
      setFormAlert({
        type: "error",
        text: "Please enter your recommendations, suggestions, or required revisions.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormAlert(null);

    try {
      const autoTitle = title.trim() || `Step ${stepNumber} Review Finding`;

      const res = await fetch(`/api/reviewer/projects/${projectId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: autoTitle,
          comment: trimmed,
          recommendation: null,
          sectionName: fullStepName,
          areaKey,
          commentType,
          severity,
          submissionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit step finding.");
      }

      setTitle("");
      setComment("");
      setRecommendation("");
      setAiSuggestion(null);
      setFormAlert({
        type: "success",
        text: `Recommendations for Step ${stepNumber} recorded successfully! Researcher has been notified.`,
      });

      await onRefreshFeedback();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("natureaide:review-updated", {
            detail: { projectId },
          })
        );
      }
    } catch (err: any) {
      setFormAlert({
        type: "error",
        text: err.message || "Failed to submit feedback.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t-2 border-slate-200/80 space-y-5">
      {/* Step Comment Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 text-white shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h4 className="font-heading font-extrabold text-sm text-white tracking-tight">
              Step {stepNumber} Reviewer Feedback &amp; Revisions Section
            </h4>
          </div>
          <p className="text-[11px] text-slate-300">
            Assigned Specialist: <strong className="text-white">{roleProfession}</strong> · Record specific step comments, required revisions, or monograph verifications directly below.
          </p>
        </div>

        {/* Step Approval Status Indicator & Toggle */}
        {showApproval && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleApprove}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isApproved
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400"
                  : "bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20"
              }`}
              title={
                isApproved
                  ? `Step ${stepNumber} is currently approved. Click to revoke approval.`
                  : `Mark Step ${stepNumber} as approved.`
              }
            >
              {isApproved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Step {stepNumber} Approved</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  <span>Step {stepNumber} Pending Approval</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Existing Step Findings Log (if any findings recorded on this step) */}
      {stepFindings.length > 0 && (
        <div className="space-y-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
          <div className="flex items-center justify-between text-xs font-bold text-amber-950">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>
                Active Reviewer Findings for Step {stepNumber} ({stepFindings.length}):
              </span>
            </span>
          </div>

          <div className="space-y-2.5">
            {stepFindings.map((item) => {
              const isResolved = item.status === "RESOLVED";
              const isAddressed = item.status === "ADDRESSED";

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                    isResolved
                      ? "bg-slate-50 border-slate-200 opacity-80"
                      : isAddressed
                      ? "bg-teal-50 border-teal-300 ring-1 ring-teal-400/20"
                      : "bg-white border-amber-200/90 shadow-2xs"
                  }`}
                >
                  {/* Clean title without echoing duplicate comment */}
                  {(() => {
                    let displayTitle = item.title || `Step ${stepNumber} Finding`;
                    if (displayTitle.includes(":")) {
                      const parts = displayTitle.split(":");
                      const rest = parts.slice(1).join(":").trim();
                      if (rest.toLowerCase() === (item.comment || "").trim().toLowerCase()) {
                        displayTitle = parts[0].trim();
                      }
                    }

                    const showDistinctRecommendation =
                      item.recommendation &&
                      item.recommendation.trim().toLowerCase() !== (item.comment || "").trim().toLowerCase();

                    return (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {displayTitle}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono text-[9.5px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                item.severity === "CRITICAL"
                                  ? "bg-rose-100 text-rose-800"
                                  : item.severity === "MAJOR"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-sky-100 text-sky-800"
                              }`}
                            >
                              {item.severity}
                            </span>
                            <span
                              className={`font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                                isResolved
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isAddressed
                                  ? "bg-teal-100 text-teal-900 animate-pulse font-black"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isResolved
                                ? "RESOLVED"
                                : isAddressed
                                ? "ADDRESSED BY RESEARCHER"
                                : "PENDING RESEARCHER ACTION"}
                            </span>
                          </div>
                        </div>

                        {/* Clean single display of comment */}
                        <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-line text-xs">
                          {item.comment}
                        </p>

                        {/* Only show separate recommendation if distinct from comment */}
                        {showDistinctRecommendation && (
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] text-slate-800">
                            <strong>Action: </strong> {item.recommendation}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Researcher response if present */}
                  {item.researcherReply && (
                    <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 space-y-0.5">
                      <span className="font-bold text-[10.5px] text-teal-800 block">
                        ✓ Researcher Implementation Note:
                      </span>
                      <p className="text-xs text-teal-950 leading-relaxed font-medium">
                        {item.researcherReply}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10.5px] text-slate-500">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <div>
                      {!isResolved ? (
                        <button
                          type="button"
                          onClick={() => onResolveFeedback(item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Mark as Resolved</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Resolved ✓</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inline Form to Add Comment or Revision for this Step (No Modal!) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Add Step {stepNumber} Recommendation or Required Revision
            </h5>
          </div>
          <span className="text-[11px] font-mono font-medium text-slate-400">
            Direct Inline Submission
          </span>
        </div>

        {formAlert && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              formAlert.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {formAlert.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{formAlert.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmitFinding} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Finding Type:
              </label>
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="REQUIRED_REVISION">🔴 Required Revision (Must Be Addressed)</option>
                <option value="CORRECTION_SUGGESTED">🟠 Scientific Correction Suggested</option>
                <option value="CLARIFICATION_NEEDED">🟡 Clarification / Literature Needed</option>
                <option value="MONOGRAPH_GAP">🔵 Monograph Standard Alignment</option>
                <option value="GENERAL_COMMENT">⚪ General Evaluation Note</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Severity:
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="CRITICAL">Critical (Blocker)</option>
                <option value="MAJOR">Major (Substantial Issue)</option>
                <option value="MINOR">Minor (Clarification / Formatting)</option>
                <option value="INFORMATIONAL">Informational (Advisory)</option>
              </select>
            </div>
          </div>

          {/* SINGLE SECTION TO TYPE RECOMMENDATIONS, SUGGESTIONS OR REVISIONS */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Recommendations, Suggestions or Required Revisions:
              </label>

              {/* AI Assistant Buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10.5px] font-bold text-indigo-700 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  <span>AI Assist:</span>
                </span>
                <button
                  type="button"
                  disabled={isAiRefining}
                  onClick={() => handleAiRefine("polish")}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Refine draft into formal scientific prose"
                >
                  {isAiRefining ? <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" /> : null}
                  Polish Tone
                </button>
                <button
                  type="button"
                  disabled={isAiRefining}
                  onClick={() => handleAiRefine("structure")}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Structure into numbered corrective action items"
                >
                  Structure
                </button>
                <button
                  type="button"
                  disabled={isAiRefining}
                  onClick={() => handleAiRefine("monograph")}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Check against monograph / compendial guidelines"
                >
                  Monograph Check
                </button>
                <button
                  type="button"
                  disabled={isAiRefining}
                  onClick={() => handleAiRefine("clarity")}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Make instructions concise and unambiguous"
                >
                  Clarify
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Enter specific recommendations, suggestions, or required revisions for Step ${stepNumber} (${stepTitle})...`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed custom-scrollbar shadow-inner"
            />
          </div>

          {/* AI Suggestion Preview Card */}
          {aiSuggestion && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/90 border border-indigo-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI-Assisted Revision Suggestion:</span>
                </span>
                <button
                  type="button"
                  onClick={handleApplyAiSuggestion}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Check className="w-3 h-3 inline mr-1" />
                  <span>Apply AI Refinement</span>
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-white/90 border border-indigo-100 text-slate-800 leading-relaxed text-[11px] whitespace-pre-line font-medium">
                {aiSuggestion.refinedRecommendation
                  ? `${aiSuggestion.refinedComment}\n\n${aiSuggestion.refinedRecommendation}`
                  : aiSuggestion.refinedComment}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              Applying to: <strong className="text-slate-800">{stepTitle}</strong>
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Submit Step {stepNumber} Finding</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

