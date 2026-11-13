"use client";

import React, { useState } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  Download,
  AlertTriangle,
  Check,
  Beaker,
} from "lucide-react";
import ReviewerStepFeedbackSection from "./ReviewerStepFeedbackSection";
import ReviewerResearchSummaryStep1 from "./ReviewerResearchSummaryStep1";
import ReviewerLaboratoryResultsSection from "./ReviewerLaboratoryResultsSection";
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
    approveable: true,
  },
  {
    num: 2,
    title: "Laboratory Results",
    shortTitle: "Laboratory Results",
    icon: Beaker,
    roleNumber: "03",
    roleName: "Clinical Pharmacology & Paper Review",
    roleProfession: "Clinical Pharmacologist & Medical Reviewer",
    approveable: true,
  },
  {
    num: 3,
    title: "Uploaded Scientific Manuscript (PDF / DOCX)",
    shortTitle: "Manuscript Preview",
    icon: Upload,
    roleNumber: "03",
    roleName: "Clinical Pharmacology & Paper Review",
    roleProfession: "Scientific Peer Reviewer",
    approveable: true,
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
  const isStepApproved = approvedSteps.includes(activeStep);

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
          const stepApproved = approvedSteps.includes(step.num);
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveStep(step.num)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
                isCurrent
                  ? "bg-purple-700 text-white font-semibold shadow-xs"
                  : stepApproved
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>
                {step.num}. {step.shortTitle}
              </span>
              {stepApproved && (
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
            {isStepApproved ? (
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
        {/* STEP 2: LABORATORY RESULTS (read-only, same DB records)           */}
        {/* ================================================================= */}
        {activeStep === 2 && (
          <ReviewerLaboratoryResultsSection projectId={project.id} />
        )}

        {/* ================================================================= */}
        {/* STEP 3: UPLOADED MANUSCRIPT PREVIEW                               */}
        {/* ================================================================= */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Upload className="h-4 w-4 text-purple-600" />
                  Research Manuscript
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Read-only preview of the researcher&apos;s uploaded PDF or DOCX.
                </p>
              </div>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Section 3 · Step 3/3
              </span>
            </div>

            {hasUploadedManuscript && manuscript ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f2c20] text-white">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {manuscript.fileName || "Uploaded_Research_Paper.pdf"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600">
                          <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-semibold text-slate-700">
                            {isPdfManuscript
                              ? "PDF"
                              : String(manuscript.fileName || "")
                                    .toLowerCase()
                                    .endsWith(".docx")
                                ? "DOCX"
                                : "File"}
                          </span>
                          {manuscript.fileSize != null && (
                            <span className="font-mono font-semibold text-slate-900">
                              {Number(manuscript.fileSize) < 1024
                                ? `${manuscript.fileSize} B`
                                : Number(manuscript.fileSize) < 1024 * 1024
                                  ? `${(Number(manuscript.fileSize) / 1024).toFixed(1)} KB`
                                  : `${(Number(manuscript.fileSize) / (1024 * 1024)).toFixed(2)} MB`}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Uploaded
                          </span>
                          {manuscript.uploadedAt && (
                            <span suppressHydrationWarning className="text-slate-500">
                              {new Date(manuscript.uploadedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={manuscriptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-purple-300 hover:text-purple-900"
                      >
                        Preview
                      </a>
                      <a
                        href={manuscriptUrl}
                        download={manuscript.fileName || undefined}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-purple-300 hover:text-purple-900"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>

                {isPdfManuscript ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <iframe
                      title="Manuscript preview"
                      src={manuscriptUrl}
                      className="h-[640px] w-full bg-white"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                    DOCX preview is available via Download. Open the file in a word processor to review full formatting.
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-10 text-center">
                <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-600" />
                <p className="text-sm font-semibold text-amber-950">No manuscript uploaded</p>
                <p className="mt-1 text-xs text-amber-800">
                  The researcher has not uploaded a PDF or DOCX manuscript for this submission.
                </p>
              </div>
            )}
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
          isApproved={isStepApproved}
          showApproval={Boolean(currentStepConfig.approveable)}
          onToggleApprove={() => {
            if (onToggleApproveStep) onToggleApproveStep(activeStep);
          }}
          feedbackList={feedbackList}
          onRefreshFeedback={onRefreshFeedback || (async () => {})}
          onDeleteFeedback={onDeleteFeedback || (async () => {})}
          onResolveFeedback={onResolveFeedback || (async () => {})}
        />

      </div>
    </div>
  );
}
