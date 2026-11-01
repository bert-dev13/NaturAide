"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  X,
  Check,
  RotateCcw,
} from "lucide-react";

export type RecommendationType =
  | "Correction"
  | "Recommendation"
  | "Scientific Concern"
  | "Clarification";

export interface ReviewRecommendation {
  id?: number | string;
  type: RecommendationType;
  section: string;
  field?: string;
  comment: string;
}

export interface AiSuggestion {
  id: string;
  title: string;
  section: string;
  field?: string;
  type: RecommendationType;
  description: string;
}

export interface ConsolidatedProfessionalReviewFormProps {
  professionTitle: string;
  discipline: string; // e.g. "Pharmacognosy"
  stageTitle: string;
  sections: Array<{ id: string; title: string }>;
  overallAssessment: string;
  onChangeOverallAssessment: (val: string) => void;
  recommendations: ReviewRecommendation[];
  onAddRecommendation: (rec: ReviewRecommendation) => void;
  onUpdateRecommendation: (index: number, rec: ReviewRecommendation) => void;
  onRemoveRecommendation: (index: number) => void;
  aiSuggestions?: AiSuggestion[];
  onDismissAiSuggestion?: (id: string) => void;
  reviewStatus?: string;
  isReadOnly?: boolean;
}

export function getTypeBadge(type: RecommendationType) {
  switch (type) {
    case "Correction":
      return {
        label: "Correction",
        className: "bg-rose-50 text-rose-800 border-rose-200",
        dot: "bg-rose-500",
      };
    case "Scientific Concern":
      return {
        label: "Scientific Concern",
        className: "bg-amber-50 text-amber-900 border-amber-300",
        dot: "bg-amber-500",
      };
    case "Clarification":
      return {
        label: "Clarification",
        className: "bg-sky-50 text-sky-800 border-sky-200",
        dot: "bg-sky-500",
      };
    default:
      return {
        label: "Recommendation",
        className: "bg-blue-50 text-blue-800 border-blue-200",
        dot: "bg-blue-500",
      };
  }
}

export default function ConsolidatedProfessionalReviewForm({
  professionTitle,
  discipline,
  stageTitle,
  sections,
  overallAssessment,
  onChangeOverallAssessment,
  recommendations,
  onAddRecommendation,
  onUpdateRecommendation,
  onRemoveRecommendation,
  aiSuggestions = [],
  onDismissAiSuggestion,
  reviewStatus,
  isReadOnly = false,
}: ConsolidatedProfessionalReviewFormProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form fields for adding/editing a recommendation
  const [formType, setFormType] = useState<RecommendationType>("Correction");
  const [formSection, setFormSection] = useState(sections[0]?.title || "Plant Identity");
  const [formField, setFormField] = useState("");
  const [formComment, setFormComment] = useState("");

  const openAddModal = (initialSection?: string, initialField?: string) => {
    setEditingIndex(null);
    setFormType("Correction");
    setFormSection(initialSection || sections[0]?.title || "Plant Identity");
    setFormField(initialField || "");
    setFormComment("");
    setModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    const rec = recommendations[idx];
    if (!rec) return;
    setEditingIndex(idx);
    setFormType(rec.type);
    setFormSection(rec.section);
    setFormField(rec.field || "");
    setFormComment(rec.comment);
    setModalOpen(true);
  };

  const handleSaveRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formComment.trim()) return;

    const newRec: ReviewRecommendation = {
      type: formType,
      section: formSection,
      field: formField.trim() || undefined,
      comment: formComment.trim(),
    };

    if (editingIndex !== null) {
      onUpdateRecommendation(editingIndex, newRec);
    } else {
      onAddRecommendation(newRec);
    }
    setModalOpen(false);
  };

  const handleAcceptAiSuggestion = (sugg: AiSuggestion) => {
    onAddRecommendation({
      type: sugg.type,
      section: sugg.section,
      field: sugg.field,
      comment: sugg.description,
    });
    if (onDismissAiSuggestion) {
      onDismissAiSuggestion(sugg.id);
    }
  };

  return (
    <div
      id="sec-professional-review"
      className="w-full rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6 text-slate-900"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0b2447] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                Official Multi-Disciplinary Review
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-heading mt-0.5">
              {professionTitle} · {discipline}
            </h2>
          </div>
        </div>

        <div className="text-xs text-slate-500 sm:text-right">
          <span className="font-semibold text-slate-800">{stageTitle}</span>
          <div className="text-[11px] text-slate-400">
            One unified assessment across all sections
          </div>
        </div>
      </div>

      {/* AI Review Assistance Suggestions (If Any) */}
      {aiSuggestions.length > 0 && !isReadOnly && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/40 border border-blue-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Ask NatureAide Review Assistance</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-blue-600/80 bg-white/70 px-2 py-0.5 rounded-full border border-blue-200/60">
              Computational Advisory · Not Official Findings
            </span>
          </div>

          <div className="space-y-2.5">
            {aiSuggestions.map((sugg) => (
              <div
                key={sugg.id}
                className="p-3 bg-white rounded-lg border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{sugg.title}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500">{sugg.section}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{sugg.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleAcceptAiSuggestion(sugg)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add to Recommendations</span>
                  </button>
                  {onDismissAiSuggestion && (
                    <button
                      type="button"
                      onClick={() => onDismissAiSuggestion(sugg.id)}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Overall Assessment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Overall Assessment</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {!isReadOnly && overallAssessment.trim().length === 0 && (
              <button
                type="button"
                onClick={() =>
                  onChangeOverallAssessment(
                    `Scientific review conducted for ${discipline}. Methodological findings and evaluation notes are detailed in the recommendations below.`
                  )
                }
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Insert standard summary
              </button>
            )}
            <span
              className={`text-[11px] font-mono font-medium ${
                overallAssessment.trim().length >= 10 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {overallAssessment.trim().length}/10 chars min
            </span>
          </div>
        </div>
        <textarea
          id="reviewer-overall-assessment"
          value={overallAssessment}
          onChange={(e) => onChangeOverallAssessment(e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder={`Enter comprehensive scientific evaluation for ${discipline}... (minimum 10 characters)`}
          className={`w-full rounded-xl border p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all leading-relaxed disabled:bg-slate-50 disabled:text-slate-600 ${
            overallAssessment.trim().length > 0 && overallAssessment.trim().length < 10
              ? "border-amber-400 focus:ring-amber-500/20 focus:border-amber-500"
              : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
          }`}
        />
        {overallAssessment.trim().length > 0 && overallAssessment.trim().length < 10 && (
          <p className="text-[11px] text-amber-600 font-medium">
            Please enter at least {10 - overallAssessment.trim().length} more character{10 - overallAssessment.trim().length === 1 ? "" : "s"}.
          </p>
        )}
      </div>

      {/* 2. Recommendations & Corrections List */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recommendations &amp; Corrections ({recommendations.length})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Specific corrections or recommendations for the researcher to address.
            </p>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recommendation</span>
            </button>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-500">
              No specific corrections or recommendations logged.
            </p>
            {!isReadOnly && (
              <p className="text-[11px] text-slate-400">
                If changes are required, click &ldquo;Add Recommendation&rdquo; or click &ldquo;+ Add Comment&rdquo; beside any field above.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {recommendations.map((rec, index) => {
              const badge = getTypeBadge(rec.type);
              const numStr = String(index + 1).padStart(2, "0");

              return (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2"
                >
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {numStr}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${badge.className}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {rec.section}
                        {rec.field && (
                          <span className="text-slate-500 font-normal">
                            {" "}
                            · <strong className="font-semibold text-slate-800">{rec.field}</strong>
                          </span>
                        )}
                      </span>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(index)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveRecommendation(index)}
                          className="p-1 rounded text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pl-6 border-l-2 border-slate-200">
                    {rec.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Recommendation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                {editingIndex !== null ? "Edit Recommendation" : "Add Recommendation / Correction"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecommendation} className="p-5 space-y-4 text-xs">
              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Feedback Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      "Correction",
                      "Recommendation",
                      "Scientific Concern",
                      "Clarification",
                    ] as RecommendationType[]
                  ).map((t) => {
                    const badge = getTypeBadge(t);
                    const isSelected = formType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormType(t)}
                        className={`p-2 rounded-xl text-center font-bold text-[11px] border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : `${badge.className} hover:opacity-90`
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Section */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Affected Section <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.title}>
                      {sec.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Field (Optional) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Target Field <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formField}
                  onChange={(e) => setFormField(e.target.value)}
                  placeholder="e.g. Botanical Family, Extraction Solvent, SMILES..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Reviewer Comment */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Reviewer Comment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Provide precise scientific feedback or required correction..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {editingIndex !== null ? "Update Recommendation" : "Add Recommendation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

