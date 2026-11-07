"use client";

import React, { useState } from "react";
import {
  X,
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  FileCheck2,
  Send,
  Loader2,
  BookOpen,
} from "lucide-react";

export interface ReviewerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  submissionId?: number | null;
  defaultSection?: string;
  defaultAreaKey?: string;
  onFeedbackAdded?: () => void;
}

const SECTION_OPTIONS = [
  { group: "General", items: ["Overall Research Project", "Executive Summary", "Literature References"] },
  {
    group: "Section 1: Formulation R&D",
    items: [
      "Section 1: Step 1 — Plant Information & Specimen Authentication",
      "Section 1: Step 2 — Product Selection & Target Specifications",
      "Section 1: Step 3 — Standardized Extraction Methodology & Yield",
      "Section 1: Step 4 — Smart Materials & Excipients Inventory",
      "Section 1: Step 5 — Formulation Development & Composition Matrix",
      "Section 1: Step 6 — Automated Batch Analysis & Quality Control",
    ],
  },
  {
    group: "Section 2: In-Silico Molecular Docking",
    items: [
      "Section 2: Step 1 — Phytochemical Selection & Ligand Library",
      "Section 2: Step 2 — Target Protein Selection & PDB Validation",
      "Section 2: Step 3 — In-Silico Screening (Lipinski & ADMET)",
      "Section 2: Step 4 — Molecular Docking Setup & AutoDock Vina Execution",
      "Section 2: Step 5 — Binding Affinity Results & Energetics Leaderboard",
      "Section 2: Step 6 — 2D Pharmacophore & Interaction Profiling",
      "Section 2: Step 7 — 3D Molecular Complex Visualization",
      "Section 2: Step 8 — Scientific Interpretation & Study Limitations",
    ],
  },
  {
    group: "Section 3: Research Paper Submission",
    items: [
      "Section 3: Step 1 — Cross-Disciplinary Research Summary & Synthesis",
      "Section 3: Step 2 — Uploaded Scientific Manuscript (PDF / DOCX)",
    ],
  },
];

const SPECIALTY_OPTIONS = [
  { key: "formulation", label: "01 Formulation Science & Pharmacognosy (Section 1)" },
  { key: "bioinformatics", label: "02 Bioinformatics & In-Silico Modeling (Section 2)" },
  { key: "pharmacology", label: "03 Clinical Pharmacology & Paper Review (Section 3)" },
];

const COMMENT_TYPES = [
  { value: "CORRECTION_SUGGESTED", label: "Correction Suggested", icon: AlertTriangle, color: "text-amber-600" },
  { value: "CLARIFICATION_NEEDED", label: "Clarification Needed", icon: HelpCircle, color: "text-sky-600" },
  { value: "EVIDENCE_NEEDED", label: "Evidence / Literature Needed", icon: BookOpen, color: "text-indigo-600" },
  { value: "SAFETY_CONCERN", label: "Safety Concern", icon: ShieldAlert, color: "text-rose-600" },
  { value: "GENERAL_COMMENT", label: "General Comment / Evaluation Note", icon: MessageSquare, color: "text-slate-600" },
];

const SEVERITY_LEVELS = [
  { value: "INFORMATIONAL", label: "Informational", desc: "Helpful scientific note or suggestion" },
  { value: "MINOR", label: "Minor", desc: "Typo, formatting, or minor clarification" },
  { value: "MAJOR", label: "Major", desc: "Significant concern requiring researcher response" },
  { value: "CRITICAL", label: "Critical", desc: "Scientific flaw, safety issue, or blocker" },
];

export default function ReviewerFeedbackModal({
  isOpen,
  onClose,
  projectId,
  submissionId,
  defaultSection = "Section 1: Step 1 — Botanical Profile & Authentication",
  defaultAreaKey = "pharmacognosy",
  onFeedbackAdded,
}: ReviewerFeedbackModalProps) {
  const [sectionName, setSectionName] = useState(defaultSection);
  const [areaKey, setAreaKey] = useState(defaultAreaKey);
  const [commentType, setCommentType] = useState("CORRECTION_SUGGESTED");
  const [severity, setSeverity] = useState("MINOR");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [referenceLink, setReferenceLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg("Please enter evaluation comments.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/reviewer/projects/${projectId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          submissionId,
          sectionName,
          areaKey,
          commentType,
          severity,
          title: title.trim() || undefined,
          comment: comment.trim(),
          recommendation: recommendation.trim(),
          referenceLink: referenceLink.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to add comment / revision");
      }

      // Reset and close
      setTitle("");
      setComment("");
      setRecommendation("");
      setReferenceLink("");
      if (onFeedbackAdded) onFeedbackAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>Add Reviewer Comment &amp; Revision</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40 font-normal">
                  Read-Only Evaluation
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Provide feedback or recommended revisions for the researcher to improve their submission.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Section / Step
              </label>
              <select
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {SECTION_OPTIONS.map((grp) => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.items.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Related Specialty Area
              </label>
              <select
                value={areaKey}
                onChange={(e) => setAreaKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {SPECIALTY_OPTIONS.map((spec) => (
                  <option key={spec.key} value={spec.key}>
                    {spec.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comment Type & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Feedback Category
              </label>
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {COMMENT_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Severity / Impact
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {SEVERITY_LEVELS.map((sev) => (
                  <option key={sev.value} value={sev.value}>
                    {sev.label} — {sev.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title / Summary Line */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Feedback Subject / Headline (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inconsistent batch pH reading across replicates 2 and 3"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Comment Body */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Evaluation Comments &amp; Scientific Rationale <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the scientific observation, inconsistency, or validation concern. Reference specific data points, materials, formulas, or binding affinities..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
              required
            />
          </div>

          {/* Recommended Action / Revision */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Recommended Revision / Corrective Action (Optional)
            </label>
            <textarea
              rows={2}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="Suggest the specific action for the researcher (e.g. Conduct accelerated stability test for 30 days, adjust excipient ratio, or clarify extraction temperature)..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
            />
          </div>

          {/* Reference Citation */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Scientific Reference / Standard Citation (Optional)
            </label>
            <input
              type="text"
              value={referenceLink}
              onChange={(e) => setReferenceLink(e.target.value)}
              placeholder="e.g. Philippine Pharmacopeia 2nd Ed. Monograph on Blumea balsamifera / DOI: 10.1016/..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              The researcher will receive this feedback in their Revisions &amp; Feedback hub.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Finding...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Review Finding</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

