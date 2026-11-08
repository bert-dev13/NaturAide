"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ClipboardCheck,
  Save,
  Loader2,
  User,
  MessageSquare,
  FileCheck2,
  ArrowRight,
  Check,
  RefreshCw,
  Layers,
  Award,
  Eye,
} from "lucide-react";

export interface ReviewerSpecialtyEvaluationSectionProps {
  specialties: any[];
  activeSpecialtyKey?: string;
  onSelectSpecialty?: (key: string) => void;
  commentsByArea?: Record<string, string>;
  checklistByArea?: Record<string, Record<string, boolean>>;
  onChangeComments?: (areaKey: string, text: string) => void;
  onToggleCriterion?: (areaKey: string, criterion: string) => void;
  onSubmitAction?: (
    action: "save_draft" | "request_revisions" | "approve",
    targetAreaKey?: string
  ) => Promise<void>;
  isSubmittingAction?: string | null;
  actionFeedback?: { type: "success" | "error"; text: string } | null;
  activeSubmission?: any;
  onNavigateTab?: (tab: any) => void;
  approvedStepsBySection?: {
    section1: number[];
    section2: number[];
    section3: number[];
  };
  onToggleApproveStep?: (
    sectionKey: "section1" | "section2" | "section3",
    stepNum: number
  ) => void;
}

interface SectionRoleConfig {
  number: string;
  sectionNumber: number;
  sectionTitle: string;
  areaKey: string;
  roleTitle: string;
  specialistTitle: string;
  evaluatorDefault: string;
  stepsCount: string;
  targetTab: string;
  summary: string;
  criteria: string[];
}

const SECTION_ROLE_CONFIGS: SectionRoleConfig[] = [
  {
    number: "01",
    sectionNumber: 1,
    sectionTitle: "Section 1: Formulation Research & Development",
    areaKey: "formulation",
    roleTitle: "Formulation Science & Pharmacognosy",
    specialistTitle: "Formulation Scientist / Pharmacognosist",
    evaluatorDefault: "Elena Rostova, RPh",
    stepsCount: "6 Steps (Steps 1 to 6)",
    targetTab: "section1",
    summary:
      "Botanical specimen identity, plant extraction parameters, excipient pharmacopeial inventory, composition matrix, and batch quality control assays.",
    criteria: [
      "Botanical voucher authentication, scientific nomenclature & taxonomy verification (Steps 1 & 2)",
      "Standardized extraction methodology, solvent safety & excipient monograph compliance (Steps 3 & 4)",
      "Formulation builder mass balance & batch release quality assays (pH, viscosity, microbial) (Steps 5 & 6)",
    ],
  },
  {
    number: "02",
    sectionNumber: 2,
    sectionTitle: "Section 2: In-Silico Molecular Docking",
    areaKey: "bioinformatics",
    roleTitle: "Bioinformatics & In-Silico Modeling",
    specialistTitle: "Bioinformatician / Computational Scientist",
    evaluatorDefault: "Bioinformatics Specialist",
    stepsCount: "8 Steps (Steps 1 to 8)",
    targetTab: "section2",
    summary:
      "Target receptor selection, PDB structure validation, Lipinski ADMET screening, AutoDock Vina binding affinities, and 2D/3D interaction contacts.",
    criteria: [
      "Phytochemical ligand library curation & Lipinski Rule of 5 / ADMET drug-likeness screening (Steps 1 & 3)",
      "Target receptor PDB crystallographic resolution & active site grid box definition (Steps 2 & 4)",
      "AutoDock Vina binding energy thresholds (<-7.0 kcal/mol) & 2D/3D interaction validation (Steps 5 to 8)",
    ],
  },
  {
    number: "03",
    sectionNumber: 3,
    sectionTitle: "Section 3: Research Paper & Manuscript",
    areaKey: "pharmacology",
    roleTitle: "Clinical Pharmacology & Paper Review",
    specialistTitle: "Clinical Pharmacologist / Medical Reviewer",
    evaluatorDefault: "Clinical Pharmacologist",
    stepsCount: "2 Steps (Steps 1 to 2)",
    targetTab: "section3",
    summary:
      "Cross-disciplinary synthesis, research dossier overview, and scientific manuscript peer review.",
    criteria: [
      "Cross-disciplinary synthesis & therapeutic dosage safety justification (Step 1)",
      "Scientific manuscript PDF / DOCX completeness & monograph formatting standards (Step 2)",
    ],
  },
];

export default function ReviewerSpecialtyEvaluationSection({
  specialties,
  activeSpecialtyKey,
  onSelectSpecialty,
  commentsByArea = {},
  checklistByArea = {},
  onChangeComments,
  onToggleCriterion,
  onSubmitAction,
  isSubmittingAction,
  actionFeedback,
  activeSubmission,
  onNavigateTab,
  approvedStepsBySection = { section1: [], section2: [], section3: [] },
  onToggleApproveStep,
}: ReviewerSpecialtyEvaluationSectionProps) {
  // Map sections with live statuses and calculated approval percentages
  const sectionsData = SECTION_ROLE_CONFIGS.map((cfg) => {
    // Find matching specialty record from API
    const match = specialties.find(
      (s) =>
        s.areaKey === cfg.areaKey ||
        (cfg.areaKey === "formulation" && s.areaKey === "pharmacognosy") ||
        (cfg.areaKey === "pharmacology" && s.areaKey === "clinical_safety")
    );

    const rawStatus = String(match?.rawStatus || match?.status || "PENDING").toUpperCase();
    const isApproved = rawStatus === "APPROVED" || rawStatus === "COMPLETED";
    const isRevision = rawStatus === "REVISION_REQUIRED" || rawStatus === "REVISIONS_REQUESTED";
    const isInReview = rawStatus === "IN_REVIEW" || rawStatus === "UNDER_REVIEW";

    // Criteria checklist for this area
    const criteriaList = match?.criteria && match.criteria.length > 0 ? match.criteria : cfg.criteria;
    const currentChecklist = (checklistByArea && checklistByArea[cfg.areaKey]) || {};
    const checkedCount = criteriaList.filter((c: string) => Boolean(currentChecklist[c])).length;

    // Approved steps for this section
    const sectionKey = cfg.targetTab as "section1" | "section2" | "section3";
    const approvedStepList = approvedStepsBySection?.[sectionKey] || [];
    const totalSectionSteps = cfg.sectionNumber === 1 ? 6 : cfg.sectionNumber === 2 ? 8 : 2;
    const stepApprovedPercent = Math.round((approvedStepList.length / totalSectionSteps) * 100);

    // Calculate percentage approved
    let approvedPercent = 0;
    if (isApproved) {
      approvedPercent = 100;
    } else if (isRevision) {
      approvedPercent = 0;
    } else if (approvedStepList.length > 0) {
      approvedPercent = stepApprovedPercent;
    } else if (checkedCount > 0 && criteriaList.length > 0) {
      approvedPercent = Math.min(90, Math.round((checkedCount / criteriaList.length) * 100));
    } else if (isInReview) {
      approvedPercent = 40;
    }

    return {
      ...cfg,
      sectionKey,
      apiSpecialty: match,
      statusLabel: isApproved
        ? "Approved"
        : isRevision
        ? "Revision Required"
        : isInReview
        ? "In Review"
        : "Pending Evaluation",
      isApproved,
      isRevision,
      approvedPercent,
      approvedStepList,
      totalSectionSteps,
      stepApprovedPercent,
      reviewerName: match?.reviewerName || cfg.evaluatorDefault,
      criteriaList,
      currentChecklist,
      checkedCount,
      totalCriteria: criteriaList.length,
      comments: (commentsByArea && commentsByArea[cfg.areaKey]) || "",
    };
  });

  // Calculate Overall Multidisciplinary Panel Approval Progress
  const totalApprovedSections = sectionsData.filter((s) => s.isApproved).length;
  const overallApprovalPercent = Math.round(
    sectionsData.reduce((acc, s) => acc + s.approvedPercent, 0) / 3
  );

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* 1. TOP PANEL: COMPACT MULTIDISCIPLINARY APPROVAL DASHBOARD          */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(7,25,48,0.55)] sm:px-5 space-y-3">
        <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-blue-400/12 blur-3xl" />

        <div className="relative flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-500/15">
              <ClipboardCheck
                className={`h-4 w-4 ${
                  overallApprovalPercent === 100 ? "text-emerald-400" : "text-blue-300"
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                  Multidisciplinary review panel
                </h2>
                <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-200">
                  3 roles
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-blue-100/75">
                Cross-section verification · 16 research steps
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 self-start rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 sm:self-auto">
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200 leading-none">
                Total
              </span>
              <span className="mt-0.5 block font-mono text-[11px] text-blue-100/80">
                {totalApprovedSections}/3 approved
              </span>
            </div>
            <div className="border-l border-white/10 pl-2.5 text-right">
              <span className="font-mono text-xl font-bold leading-none text-white sm:text-2xl">
                {overallApprovalPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallApprovalPercent === 100
                ? "bg-gradient-to-r from-emerald-400 to-teal-400 shadow-xs shadow-emerald-400/40"
                : overallApprovalPercent > 0
                ? "bg-gradient-to-r from-blue-400 to-blue-500"
                : "bg-white/15"
            }`}
            style={{ width: `${Math.max(overallApprovalPercent, 2)}%` }}
          />
        </div>

        {/* ROW 3: 3 COMPACT STAGE TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
          {sectionsData.map((sec) => (
            <div
              key={sec.areaKey}
              className={`px-3 py-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
                sec.isApproved
                  ? "bg-emerald-500/15 border-emerald-400/35 text-emerald-100"
                  : sec.isRevision
                  ? "bg-amber-500/15 border-amber-400/35 text-amber-100"
                  : "bg-white/[0.04] border-white/10 text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="font-mono text-[10px] font-bold text-cyan-300/90 shrink-0">
                  Stage {sec.number}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-mono font-bold shrink-0 ${
                    sec.isApproved
                      ? "bg-emerald-400/25 text-emerald-300 border border-emerald-400/40"
                      : sec.isRevision
                      ? "bg-amber-400/25 text-amber-300 border border-amber-400/40"
                      : "bg-white/10 text-white border border-white/15"
                  }`}
                >
                  {sec.isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  <span>{sec.approvedPercent}%</span>
                </span>
              </div>

              <div className="text-xs font-bold truncate text-white leading-snug" title={sec.roleTitle}>
                {sec.roleTitle}
              </div>

              {/* Stage micro progress bar */}
              <div className="w-full h-1 bg-black/30 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    sec.isApproved
                      ? "bg-emerald-400"
                      : sec.approvedPercent > 0
                      ? "bg-cyan-400"
                      : "bg-white/15"
                  }`}
                  style={{ width: `${sec.approvedPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            actionFeedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. THE 3 SECTION APPROVAL CARDS (SIMPLE, CLEAN, HIGH FIDELITY)      */}
      {/* =================================================================== */}
      <div className="space-y-6">
        {sectionsData.map((sec) => {
          const isCurrentActive = activeSpecialtyKey === sec.areaKey;
          const isSubmittingThis =
            Boolean(
              isSubmittingAction &&
                (isSubmittingAction.includes(sec.areaKey) ||
                  isSubmittingAction === "approve" ||
                  isSubmittingAction === "request_revisions" ||
                  isSubmittingAction === "save_draft")
            );

          return (
            <div
              key={sec.areaKey}
              className={`rounded-2xl border transition-all duration-200 bg-white shadow-xs overflow-hidden ${
                sec.isApproved
                  ? "border-emerald-300/80 ring-1 ring-emerald-400/20"
                  : sec.isRevision
                  ? "border-amber-300/80 ring-1 ring-amber-400/20"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
            >
              {/* CARD TOP BANNER */}
              <div
                className={`p-5 sm:p-6 border-b transition-colors ${
                  sec.isApproved
                    ? "bg-emerald-50/50 border-emerald-100"
                    : sec.isRevision
                    ? "bg-amber-50/50 border-amber-100"
                    : "bg-slate-50/70 border-slate-100"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Role & Section Meta */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-slate-900 text-white shadow-2xs">
                        Role {sec.number}
                      </span>
                      <span className="font-semibold text-xs text-slate-700">
                        {sec.roleTitle}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {sec.specialistTitle}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {sec.sectionTitle}
                    </h3>

                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                      {sec.summary}
                    </p>
                  </div>

                  {/* Right: Prominent Approved Percentage Metric */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border font-mono ${
                          sec.isApproved
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : sec.isRevision
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-slate-100 text-slate-800 border-slate-300"
                        }`}
                      >
                        {sec.isApproved ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : sec.isRevision ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{sec.approvedPercent}% Approved</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>
                        Evaluator: <strong className="text-slate-700">{sec.reviewerName}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section Specific Approval Bar */}
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">
                      Approval Metric:
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {sec.isApproved
                        ? "100% Fully Approved"
                        : `${sec.approvedPercent}% Approved (${sec.approvedStepList.length} of ${sec.totalSectionSteps} Steps Approved)`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        sec.isApproved
                          ? "bg-emerald-500"
                          : sec.approvedPercent > 0
                          ? "bg-blue-600"
                          : "bg-slate-300"
                      }`}
                      style={{ width: `${Math.max(sec.approvedPercent, 2)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* CARD BODY: SIMPLE VERIFICATION & ACTIONS */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* 1. Quick Pages Inspection Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Submitted Research Pages: {sec.stepsCount}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Inspect the researcher's raw data and submitted steps in read-only reviewer mode.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab(sec.targetTab)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 transition-colors shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Inspect {sec.targetTab.toUpperCase()} Pages →</span>
                  </button>
                </div>

                {/* Step Approval Progress Bar & Step Status Overview */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        Step Approval Progress:{" "}
                        <strong className="text-slate-900">
                          {sec.approvedStepList.length} of {sec.totalSectionSteps} Steps Approved
                        </strong>
                      </span>
                    </span>
                    <span
                      className={`font-mono font-bold px-2.5 py-0.5 rounded text-xs ${
                        sec.stepApprovedPercent === 100
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-cyan-100 text-cyan-900 border border-cyan-300"
                      }`}
                    >
                      {sec.stepApprovedPercent}% Approved
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        sec.stepApprovedPercent === 100
                          ? "bg-emerald-500 shadow-sm shadow-emerald-400/40"
                          : sec.stepApprovedPercent > 0
                          ? "bg-cyan-500"
                          : "bg-slate-300"
                      }`}
                      style={{ width: `${Math.max(sec.stepApprovedPercent, 2)}%` }}
                    />
                  </div>

                  {/* Step Status Badges */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Individual Step Status (Approved in section workspace):
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {Array.from({ length: sec.totalSectionSteps }).map((_, sIdx) => {
                        const stepNum = sIdx + 1;
                        const isStepDone = sec.approvedStepList.includes(stepNum);
                        return (
                          <button
                            key={stepNum}
                            type="button"
                            onClick={() => onNavigateTab && onNavigateTab(sec.targetTab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isStepDone
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                            }`}
                            title={
                              isStepDone
                                ? `Step ${stepNum} is approved. Click to view.`
                                : `Step ${stepNum} is pending approval. Click to inspect.`
                            }
                          >
                            {isStepDone ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-300" />
                            )}
                            <span>Step {stepNum}</span>
                            <span
                              className={`text-[9.5px] font-sans px-1 py-0.2 rounded font-semibold ${
                                isStepDone ? "text-emerald-800" : "text-slate-400"
                              }`}
                            >
                              {isStepDone ? "Approved" : "Pending"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary note */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {sec.stepApprovedPercent === 100 ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          All {sec.totalSectionSteps} steps in {sec.sectionTitle} have been verified and approved.
                        </span>
                      ) : (
                        <span>
                          {sec.totalSectionSteps - sec.approvedStepList.length} step{sec.totalSectionSteps - sec.approvedStepList.length > 1 ? "s" : ""} remaining to inspect and approve in this section.
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab(sec.targetTab)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold underline text-xs cursor-pointer ml-2 shrink-0"
                    >
                      Go to {sec.targetTab.toUpperCase()} →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
