"use client";

import React, { useState } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  Download,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import ReviewerStepFeedbackSection from "./ReviewerStepFeedbackSection";
import ReviewerResearchSummaryStep1 from "./ReviewerResearchSummaryStep1";
import { isFeedbackBelongsToStep } from "@/lib/feedback-step-filter";
import { resolveResearchSummaryText } from "@/lib/research-summary-utils";
import type { CompiledResearchOverview } from "@/lib/manuscript-upload-service";

export interface ReviewerSubmissionSectionProps {
  project: any;
  dossier: any;
  compiledOverview?: CompiledResearchOverview | null;
  submission: any;
  feedbackList?: any[];
  onAddFeedbackForStep?: (stepTitle: string) => void;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  approvedSteps?: number[];
  onToggleApproveStep?: (step: number) => void;
  onNavigateTab?: (tab: any) => void;
  onRefreshFeedback?: () => Promise<void>;
  onDeleteFeedback?: (id: number) => Promise<void>;
  onResolveFeedback?: (id: number) => Promise<void>;
}

function splitReadableParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const SUBMISSION_STEPS = [
  {
    num: 1,
    title: "Cross-Disciplinary Research Summary & Synthesis",
    shortTitle: "Research Summary",
    icon: FileText,
    roleNumber: "03",
    roleName: "Clinical Pharmacology & Paper Review",
    roleProfession: "Clinical Pharmacologist & Medical Reviewer",
  },
  {
    num: 2,
    title: "Uploaded Scientific Manuscript (PDF / DOCX)",
    shortTitle: "Manuscript Preview",
    icon: Upload,
    roleNumber: "03",
    roleName: "Clinical Pharmacology & Paper Review",
    roleProfession: "Scientific Peer Reviewer",
  },
];

export default function ReviewerSubmissionSection({
  project,
  dossier,
  compiledOverview = null,
  submission,
  feedbackList = [],
  onAddFeedbackForStep,
  activeStep: controlledStep,
  onStepChange,
  approvedSteps = [],
  onToggleApproveStep,
  onNavigateTab,
  onRefreshFeedback,
  onDeleteFeedback,
  onResolveFeedback,
}: ReviewerSubmissionSectionProps) {
  const [internalActiveStep, setInternalActiveStep] = useState(1);
  const activeStep = controlledStep !== undefined ? controlledStep : internalActiveStep;
  const setActiveStep = (stepOrFn: any) => {
    const nextVal = typeof stepOrFn === "function" ? stepOrFn(activeStep) : stepOrFn;
    if (onStepChange) onStepChange(nextVal);
    setInternalActiveStep(nextVal);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(100);

  const manuscript = dossier?.section3?.manuscript || dossier?.manuscript || null;
  const dossierRecord = dossier?.section3?.dossier || dossier?.dossier || {};
  const savedSummary =
    dossierRecord?.executiveSummary ||
    dossier?.executiveSummary ||
    dossier?.section3?.dossier?.executiveSummary ||
    "";
  const executiveSummary = resolveResearchSummaryText(
    savedSummary,
    compiledOverview?.compiledSummaryText
  );
  const findingsParagraphs = splitReadableParagraphs(
    compiledOverview?.interpretation?.keyFindings || ""
  );
  const limitationsParagraphs = splitReadableParagraphs(
    compiledOverview?.interpretation?.potentialLimitations || ""
  );
  const hasUploadedManuscript = Boolean(
    manuscript && (manuscript.fileName || manuscript.fileUrl || manuscript.storagePath)
  );
  const manuscriptUrl = `/api/researcher/projects/${project.id}/manuscript/file`;
  const isPdfManuscript = Boolean(
    manuscript?.mimeType === "application/pdf" ||
      String(manuscript?.fileName || "").toLowerCase().endsWith(".pdf")
  );

  const currentStepConfig = SUBMISSION_STEPS[activeStep - 1] || SUBMISSION_STEPS[0];

  const stepFeedback = feedbackList.filter((f) =>
    isFeedbackBelongsToStep(f, "section3", activeStep, currentStepConfig.title)
  );

  return (
    <div className="space-y-5">
      {/* 2-Step Interactive Switcher (Exactly matches Researcher Section 3) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
        {SUBMISSION_STEPS.map((step) => {
          const Icon = step.icon;
          const isCurrent = activeStep === step.num;
          const isStepApproved = approvedSteps.includes(step.num);
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveStep(step.num)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
                isCurrent
                  ? "bg-purple-700 text-white font-semibold shadow-xs"
                  : isStepApproved
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>
                {step.num}. {step.shortTitle}
              </span>
              {isStepApproved && (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Step Feedback Banner (If any reviewer findings have been recorded for this step) */}
      {stepFeedback.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-amber-900 font-bold border-b border-amber-200/80 pb-2.5">
            <span className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Reviewer Findings on Step {activeStep} ({stepFeedback.length}):</span>
            </span>
            <span className="text-xs font-mono text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">
              Evaluator: {currentStepConfig.roleProfession}
            </span>
          </div>

          <div className="space-y-3">
            {stepFeedback.map((f) => {
              const isResolved = f.status === "RESOLVED";
              const isAddressed = f.status === "ADDRESSED" || Boolean(f.researcherReply);

              let cleanTitle = f.title || f.commentType || `Step ${activeStep} Finding`;
              if (cleanTitle.includes(":")) {
                const parts = cleanTitle.split(":");
                const rest = parts.slice(1).join(":").trim();
                if (rest.toLowerCase() === (f.comment || "").trim().toLowerCase()) {
                  cleanTitle = parts[0].trim();
                }
              }

              const showDistinctAction =
                f.recommendation &&
                f.recommendation.trim().toLowerCase() !== (f.comment || "").trim().toLowerCase();

              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border transition-all text-slate-800 space-y-2.5 ${
                    isResolved
                      ? "bg-slate-50/90 border-slate-200 opacity-80"
                      : isAddressed
                      ? "bg-white border-amber-300 ring-1 ring-amber-400/20 shadow-xs"
                      : "bg-white border-amber-200/80 shadow-2xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {cleanTitle}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`font-mono text-[9.5px] uppercase font-bold px-2 py-0.5 rounded ${
                          f.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : f.severity === "MAJOR"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {f.severity || "MAJOR"}
                      </span>
                      <span
                        className={`font-mono text-[9.5px] font-bold px-2 py-0.5 rounded ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-800"
                            : isAddressed
                            ? "bg-teal-100 text-teal-900 font-black animate-pulse"
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

                  <p className="text-slate-800 leading-relaxed text-xs sm:text-[13px] font-medium whitespace-pre-line">
                    {f.comment}
                  </p>

                  {showDistinctAction && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                      <strong className="text-slate-900">Required Action:</strong> {f.recommendation}
                    </div>
                  )}

                  {/* Resubmitted Researcher Implementation Note */}
                  {f.researcherReply && (
                    <div className="p-3 rounded-lg bg-teal-50/80 border border-teal-200 text-teal-950 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
                        <span>✓ Researcher Resubmission / Implementation Note:</span>
                        {f.researcherRepliedAt && (
                          <span className="font-mono text-[10px] text-teal-600 font-normal">
                            {new Date(f.researcherRepliedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-teal-950 leading-relaxed font-medium">
                        {f.researcherReply}
                      </p>
                    </div>
                  )}

                  {/* Only the Resolved Button appears */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ""}
                    </span>

                    {!isResolved ? (
                      <button
                        type="button"
                        onClick={() => onResolveFeedback && onResolveFeedback(f.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Mark as Resolved</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved ✓</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Content Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Step Header with Assigned Specialist Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-blue-400/25 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3 text-white text-xs shadow-[0_8px_20px_-14px_rgba(7,25,48,0.45)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded border border-blue-400/30 bg-blue-500/20 text-blue-200">
              Role 03: {currentStepConfig.roleName}
            </span>
            <span className="text-blue-100/80">
              Specialist:{" "}
              <strong className="text-white px-1.5 py-0.5 rounded bg-white/10 border border-white/15">
                {currentStepConfig.roleProfession}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {approvedSteps.includes(activeStep) ? (
              <button
                type="button"
                disabled={true}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs bg-emerald-500 text-white border border-emerald-400 opacity-95 cursor-default select-none"
                title={`Step ${activeStep} is approved.`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Step {activeStep} Approved ✓</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleApproveStep && onToggleApproveStep(activeStep)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 cursor-pointer active:scale-95 transition-all"
                title={`Mark Step ${activeStep} as approved.`}
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Approve Step {activeStep}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* STEP 1: RESEARCH SUMMARY & CROSS-DISCIPLINARY SYNTHESIS          */}
        {/* ================================================================= */}
        {activeStep === 1 && compiledOverview && (
          <ReviewerResearchSummaryStep1
            projectId={project.id}
            compiledOverview={compiledOverview}
            executiveSummary={executiveSummary}
            findingsParagraphs={findingsParagraphs}
            limitationsParagraphs={limitationsParagraphs}
          />
        )}

        {activeStep === 1 && !compiledOverview && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
            Loading compiled research overview…
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: UPLOADED MANUSCRIPT PREVIEW                               */}
        {/* ================================================================= */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span>Step 2: Uploaded Scientific Manuscript (PDF / DOCX Viewer)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct inspection of the researcher&apos;s complete academic manuscript and supplementary figures.
                </p>
              </div>
              {hasUploadedManuscript ? (
                <a
                  href={manuscriptUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Manuscript</span>
                </a>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Manuscript Uploaded
                </span>
              )}
            </div>

            {/* Manuscript Metadata Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900">
                  {manuscript?.fileName || `${project.title.replace(/\s+/g, "_")}_Manuscript_v1.0.pdf`}
                </p>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>Format: <strong>PDF Document</strong></span>
                  <span>•</span>
                  <span>Size: <strong>2.4 MB</strong></span>
                  <span>•</span>
                  <span>Pages: <strong>14 Pages</strong></span>
                  <span>•</span>
                  <span>Uploaded: <strong>Round 1 Submission</strong></span>
                </div>
              </div>

              {/* Viewer Controls */}
              <div className="flex items-center gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <span className="text-xs font-mono font-medium px-2 text-slate-700">
                  Page {currentPage} of 14
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, 14))}
                  disabled={currentPage >= 14}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(z - 10, 80))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <span className="text-xs font-mono px-1 text-slate-600">{zoomScale}%</span>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(z + 10, 150))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Simulated Clean Document Reading Pane */}
            <div className="border border-slate-200 rounded-2xl bg-slate-100 p-4 sm:p-8 flex justify-center min-h-[500px] overflow-auto">
              <div
                style={{ width: `${zoomScale}%`, maxWidth: "800px" }}
                className="bg-white rounded-xl shadow-md border border-slate-300 p-8 sm:p-12 space-y-6 text-slate-800 transition-all"
              >
                {/* Academic Header */}
                <div className="text-center space-y-2 border-b border-slate-200 pb-6">
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 leading-tight">
                    {project.title}
                  </h1>
                  <p className="text-xs text-slate-600">
                    Lead Researcher: <strong>{project.researcherName || "Principal Investigator"}</strong> · Department of Pharmaceutical Sciences
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    Affiliation: University of the Philippines / Philippine Institute of Traditional and Alternative Health Care (PITAHC)
                  </p>
                </div>

                {/* Abstract Section */}
                <div className="space-y-2 text-xs">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Abstract</h2>
                  <p className="text-slate-700 leading-relaxed text-justify">
                    <strong>Background:</strong> {project.plantName} ({project.plantScientificName || "Vitex negundo L."}) is an established Philippine medicinal plant with documented anti-inflammatory therapeutic properties.{" "}
                    <strong>Methods:</strong> Bioactive flavonoids were isolated via standardized hydroethanolic maceration and screened against pro-inflammatory TNF-alpha (PDB ID: 2AZ5) using AutoDock Vina. A stable topical hydrogel formulation was engineered using Carbomer 940 and evaluated across 3 replicate manufacturing batches.{" "}
                    <strong>Results:</strong> Molecular docking identified Casticin and Isoorientin as potent antagonists (ΔG = -8.70 and -8.20 kcal/mol), engaging key dimer residues Tyr119 and Leu120. The formulated hydrogel (pH 5.82, 24,500 cP) complied with all pharmacopeial physical and microbial standards.{" "}
                    <strong>Conclusion:</strong> The combined in-silico and formulation pipeline validates the pharmaceutical feasibility of {project.plantName} topical delivery systems.
                  </p>
                </div>

                {/* Manuscript Section Overview */}
                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                  <h3 className="font-bold text-slate-900">Manuscript Structure &amp; Table of Contents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">1. Introduction &amp; Ethnobotany (pp. 1–3)</div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">2. Materials &amp; Methods (pp. 4–7)</div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">3. In-Silico Docking Results (pp. 8–10)</div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">4. Formulation &amp; Batch QC (pp. 11–13)</div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100 sm:col-span-2">5. Discussion, Limitations &amp; References (pp. 13–14)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* End of Step Feedback Section: Inline Reviewer comments, recommendations & AI-assisted revisions */}
        <ReviewerStepFeedbackSection
          projectId={project.id}
          submissionId={submission?.id || project.activeSubmissionId}
          sectionKey="section3"
          sectionTitle="Section 3: Paper Submission"
          stepNumber={activeStep}
          stepTitle={currentStepConfig.title}
          roleProfession={currentStepConfig.roleProfession}
          isApproved={approvedSteps.includes(activeStep)}
          onToggleApprove={() => onToggleApproveStep && onToggleApproveStep(activeStep)}
          feedbackList={feedbackList}
          onRefreshFeedback={onRefreshFeedback || (async () => {})}
          onDeleteFeedback={onDeleteFeedback || (async () => {})}
          onResolveFeedback={onResolveFeedback || (async () => {})}
        />

        {/* Step Navigation & Action Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((prev: number) => Math.max(prev - 1, 1))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>

          {activeStep === SUBMISSION_STEPS.length ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab("feedback")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Consolidated Feedback Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab("evaluation")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs cursor-pointer"
              >
                <span>Evaluation Panel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setActiveStep((prev: number) => Math.min(prev + 1, SUBMISSION_STEPS.length))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold transition-all shadow-xs cursor-pointer"
            >
              <span>Next Step ({activeStep + 1} of {SUBMISSION_STEPS.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
