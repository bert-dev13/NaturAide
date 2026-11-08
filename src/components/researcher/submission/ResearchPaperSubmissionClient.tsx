"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  X,
  Leaf,
  Cpu,
} from "lucide-react";
import { V2SectionProgress } from "@/lib/v2-progress-service";
import type { CompiledResearchOverview } from "@/lib/manuscript-upload-service";
import { resolveResearchSummaryText } from "@/lib/research-summary-utils";
import type { ProfessionalApprovalState } from "@/lib/research-approval-completion-service";
import ResearchStepFooterNav from "@/components/researcher/ResearchStepFooterNav";
import ResearcherStepRevisionBanner from "@/components/researcher/ResearcherStepRevisionBanner";
import ResearchSummaryStep1Section from "./ResearchSummaryStep1Section";
import UploadPaperStep2Section from "./UploadPaperStep2Section";

interface Props {
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
    status: string;
  };
  dossier: any;
  manuscript: any;
  compiledOverview: CompiledResearchOverview;
  submissionHistory?: {
    id: number;
    versionTag: string;
    reviewRound: number;
    status: string;
    submittedAt: string;
    reviewedAt?: string | null;
  }[];
  v2Progress: V2SectionProgress;
  initialStep?: number;
  initialApprovalState?: ProfessionalApprovalState | null;
}

function formatFileSize(bytes?: number | null): string {
  const n = Number(bytes || 0);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function splitReadableParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function ResearchPaperSubmissionClient({
  project,
  dossier: initialDossier,
  manuscript: initialManuscript,
  compiledOverview,
  submissionHistory: initialHistory = [],
  v2Progress,
  initialStep = 1,
  initialApprovalState = null,
}: Props) {
  const router = useRouter();
  const [approvalState, setApprovalState] = useState<ProfessionalApprovalState | null>(
    initialApprovalState
  );
  const [activeStep, setActiveStep] = useState<number>(
    initialStep >= 1 && initialStep <= 2 ? initialStep : 1
  );

  useEffect(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 2) {
      setActiveStep(initialStep);
    }
  }, [initialStep]);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Prefer a real compiled dossier over seed/stub one-liners saved in research_dossiers
  const initialSummaryText = resolveResearchSummaryText(
    initialDossier?.executiveSummary,
    compiledOverview.compiledSummaryText
  );
  const [executiveSummary, setExecutiveSummary] = useState<string>(initialSummaryText);
  const [savedSummaryBaseline, setSavedSummaryBaseline] = useState<string>(initialSummaryText);
  const summaryTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-expand summary textarea so it never appears collapsed or cuts off content
  useEffect(() => {
    const el = summaryTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(380, el.scrollHeight + 8)}px`;
  }, [executiveSummary, activeStep]);

  // Step 2: Uploaded Research Paper State
  const [manuscript, setManuscript] = useState<any>(initialManuscript || null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Submission History & Project Status State
  const [projectStatus, setProjectStatus] = useState<string>(project.status || "Draft");
  const [submissionHistory, setSubmissionHistory] = useState(initialHistory);

  const STEPS = [
    { number: 1, title: "Research Summary", icon: FileText },
    { number: 2, title: "Upload Research Paper", icon: Upload },
  ];

  const isSummaryReady = Boolean(executiveSummary && executiveSummary.trim().length > 0);
  const hasUnsavedSummaryEdits = executiveSummary.trim() !== savedSummaryBaseline.trim();
  const hasUploadedFile = Boolean(manuscript && (manuscript.fileUrl || manuscript.fileName));
  const hasLegacyManuscript = Boolean(manuscript && manuscript.abstract && manuscript.conclusion);
  const isManuscriptReady = hasUploadedFile || hasLegacyManuscript;
  const isPdfFile = Boolean(
    manuscript?.mimeType === "application/pdf" ||
      String(manuscript?.fileName || "").toLowerCase().endsWith(".pdf")
  );

  const latestSubmission = submissionHistory[0] || null;
  const hasSubmittedDossier = Boolean(
    approvalState?.hasSubmission || submissionHistory.length > 0
  );
  const isCompletedProject = Boolean(
    approvalState?.isCompleted || String(projectStatus).toUpperCase() === "COMPLETED"
  );
  const isAlreadyApproved =
    isCompletedProject ||
    String(projectStatus).toUpperCase() === "APPROVED" ||
    (latestSubmission && String(latestSubmission.status || "").toUpperCase() === "APPROVED") ||
    (approvalState?.approvedCount === 5 && approvalState?.unresolvedRevisionsCount === 0);
  const isAlreadyUnderReview =
    ["UNDER_REVIEW", "SUBMITTED"].includes(String(projectStatus).toUpperCase()) &&
    latestSubmission &&
    String(latestSubmission.status || "").toUpperCase() === "UNDER_REVIEW" &&
    (approvalState?.revisionsRequiredSpecialties?.length || 0) === 0;

  const canSubmitNow =
    v2Progress.section1.status === "COMPLETED" &&
    v2Progress.section2.status === "COMPLETED" &&
    isSummaryReady &&
    isManuscriptReady &&
    !isAlreadyUnderReview &&
    !isAlreadyApproved &&
    !isCompletedProject;

  const refreshApprovalStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/approval-status`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.approvalState) {
        setApprovalState(data.approvalState);
        if (data.approvalState.projectStatus) {
          setProjectStatus(data.approvalState.projectStatus);
        }
      }
    } catch {
      // Non-fatal
    }
  }, [project.id]);

  const handleStepNavigation = (targetStep: number) => {
    setMessage(null);
    setActiveStep(targetStep);
  };

  // Warn before closing tab if researcher has unsaved edits in the summary editor
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedSummaryEdits) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedSummaryEdits]);

  // ---------------------------------------------------------------------------
  // STEP 1 HANDLERS: RESEARCH SUMMARY
  // ---------------------------------------------------------------------------
  const handleRecompileSummary = () => {
    const freshCompiled = String(compiledOverview.compiledSummaryText || "").trim();
    if (!freshCompiled) {
      setMessage({
        text: "No compiled dossier is available yet. Complete Sections 1 and 2 first.",
        type: "error",
      });
      return;
    }

    const currentTrimmed = executiveSummary.trim();
    const replacingRealEdit =
      currentTrimmed.length > 0 &&
      currentTrimmed !== freshCompiled &&
      // Skip confirm for short stubs / seed placeholders
      currentTrimmed.length >= 120 &&
      !/^Executive research summary of .+\.?$/i.test(currentTrimmed);

    if (replacingRealEdit && typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Recompiling the Research Summary from Sections 1 and 2 will replace your current text in the editor. Do you want to continue?"
      );
      if (!confirmed) return;
    }

    setExecutiveSummary(freshCompiled);
    setMessage({
      text: "Research summary recompiled from Sections 1 and 2. Click Save to persist.",
      type: "success",
    });
  };

  const handleSaveSummary = async (): Promise<boolean> => {
    const cleanText = executiveSummary.trim();
    if (!cleanText) {
      setMessage({ text: "Research summary cannot be empty.", type: "error" });
      return false;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executiveSummary: cleanText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save research summary");
      setSavedSummaryBaseline(cleanText);
      setMessage({ text: "Research summary saved to database.", type: "success" });
      return true;
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save summary", type: "error" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2 HANDLERS: UPLOAD RESEARCH PAPER (PDF / DOCX)
  // ---------------------------------------------------------------------------
  const handleFileUpload = async (file: File) => {
    setMessage(null);
    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith(".pdf") && !nameLower.endsWith(".docx")) {
      setMessage({
        text: "Invalid file format. Please upload your manuscript in PDF (.pdf) or DOCX (.docx) format.",
        type: "error",
      });
      return;
    }
    if (file.size <= 0) {
      setMessage({ text: "Selected file is empty.", type: "error" });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setMessage({
        text: "File size exceeds the 25 MB maximum limit.",
        type: "error",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/researcher/projects/${project.id}/manuscript`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload research paper.");
      }

      setManuscript(data.manuscript);
      setMessage({
        text: `Uploaded "${file.name}" (${formatFileSize(file.size)}) successfully.`,
        type: "success",
      });
    } catch (e: any) {
      setMessage({ text: e.message || "Upload failed.", type: "error" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveUploadedFile = async () => {
    setIsUploading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/manuscript`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove uploaded file.");
      }
      setManuscript(data.manuscript || null);
      setMessage({ text: "Uploaded research paper removed.", type: "success" });
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to remove file.", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveActiveStep = async (): Promise<boolean> => {
    if (activeStep === 1) {
      return await handleSaveSummary();
    }
    return true;
  };

  // ---------------------------------------------------------------------------
  // STEP 3 HANDLER: REVIEW & SUBMIT (Modern Confirmation Modal)
  // ---------------------------------------------------------------------------
  const handleSubmitFinal = () => {
    setMessage(null);

    if (isAlreadyUnderReview) {
      setMessage({
        text: `This research has already been submitted (${latestSubmission?.versionTag || "v1.0"}) and is currently under expert review.`,
        type: "error",
      });
      return;
    }

    if (!isSummaryReady) {
      setMessage({
        text: "Please review and save your Research Summary in Step 1 before submitting.",
        type: "error",
      });
      setActiveStep(1);
      return;
    }

    if (!isManuscriptReady) {
      setMessage({
        text: "Please upload your Research Paper (PDF or DOCX) in Step 2 before submitting.",
        type: "error",
      });
      setActiveStep(2);
      return;
    }

    if (v2Progress.section1.status !== "COMPLETED" || v2Progress.section2.status !== "COMPLETED") {
      setMessage({
        text: "Please complete all steps in Section 1 and Section 2 before submitting for review.",
        type: "error",
      });
      return;
    }

    // Open modern confirmation modal instead of native browser popup
    setShowSubmitModal(true);
  };

  const handleConfirmSubmitFinal = async () => {
    setIsSubmitting(true);
    try {
      await handleSaveSummary();

      const res = await fetch(`/api/researcher/projects/${project.id}/submit-final`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit research for expert review.");
      }

      setProjectStatus(data.newStatus || "UNDER_REVIEW");
      setSubmissionHistory((prev) => [
        {
          id: data.submissionId || Date.now(),
          versionTag: data.versionTag || `v${(prev[0]?.reviewRound || 0) + 1}.0`,
          reviewRound: data.reviewRound || (prev[0]?.reviewRound || 0) + 1,
          status: "UNDER_REVIEW",
          submittedAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      setShowSubmitModal(false);
      await refreshApprovalStatus();
      setMessage({
        text: `Submitted (${data.versionTag || "v1.0"}) for multidisciplinary expert review! Redirecting to Professional Approval...`,
        type: "success",
      });
      router.push(`/researcher/projects/${project.id}/completion`);
    } catch (e: any) {
      setMessage({ text: e.message || "Submission failed.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileViewUrl =
    manuscript?.fileUrl || `/api/researcher/projects/${project.id}/manuscript/file`;

  const findingsParagraphs = splitReadableParagraphs(compiledOverview.interpretation.keyFindings);
  const limitationsParagraphs = splitReadableParagraphs(
    compiledOverview.interpretation.potentialLimitations
  );

  const ActiveIcon = STEPS[activeStep - 1]?.icon || FileText;

  const statusLabel = isCompletedProject
    ? `Completed (${approvalState?.approvedCount ?? 5}/5)`
    : (approvalState?.revisionsRequiredSpecialties?.length || 0) > 0
      ? "Revisions required"
      : hasSubmittedDossier
        ? `${latestSubmission?.versionTag || "v1.0"} · ${approvalState?.approvedCount ?? 0}/${approvalState?.totalSpecialties ?? 5}`
        : isSaving
          ? "Saving…"
          : message?.type === "success"
            ? "Saved"
            : "Draft";

  return (
    <div className="w-full max-w-none space-y-5 pb-32 text-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(15,44,32,0.55)] sm:px-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-emerald-200/80">
                <Link
                  href={`/researcher/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 transition hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Workspace Hub
                </Link>
                <span className="text-emerald-700">/</span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                  Section 3 · Step {String(activeStep).padStart(2, "0")} / 02
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    isCompletedProject
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                      : (approvalState?.revisionsRequiredSpecialties?.length || 0) > 0
                        ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
                        : hasSubmittedDossier
                          ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                          : isSaving
                            ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                            : message?.type === "success"
                              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                              : "border-white/15 bg-white/5 text-emerald-100/80"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isCompletedProject || message?.type === "success"
                        ? "bg-emerald-300"
                        : (approvalState?.revisionsRequiredSpecialties?.length || 0) > 0
                          ? "bg-rose-300"
                          : hasSubmittedDossier
                            ? "bg-sky-300"
                            : isSaving
                              ? "animate-pulse bg-amber-300"
                              : "bg-slate-300"
                    }`}
                  />
                  {statusLabel}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200">
                  <ActiveIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
                    {STEPS[activeStep - 1].title}
                  </h1>
                  <p className="truncate text-[11px] text-emerald-200/70">{project.title}</p>
                </div>
              </div>
              <div className="mt-2 flex max-w-xs items-center gap-1">
                {STEPS.map((step) => (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => handleStepNavigation(step.number)}
                    title={`Step ${step.number}: ${step.title}`}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      step.number <= activeStep ? "bg-emerald-400" : "bg-white/15 hover:bg-white/25"
                    }`}
                  />
                ))}
              </div>
            </div>

            {hasSubmittedDossier ? (
              <Link
                href={`/researcher/projects/${project.id}/completion`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
              >
                Approval status
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => handleStepNavigation(activeStep === 1 ? 2 : 1)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
              >
                {activeStep === 1 ? "Upload paper" : "Back to summary"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCurrent = activeStep === step.number;
              const isDone =
                (step.number === 1 && isSummaryReady && !hasUnsavedSummaryEdits) ||
                (step.number === 2 && isManuscriptReady);
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => handleStepNavigation(step.number)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    isCurrent
                      ? "bg-emerald-400 text-[#091a13] shadow-sm"
                      : isDone
                        ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                        : "border border-white/10 bg-white/5 text-emerald-100/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="font-mono text-[10px] opacity-80">{step.number}</span>
                  <span>{step.title}</span>
                  {isDone && !isCurrent && <CheckCircle2 className="h-3 w-3 opacity-80" />}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-medium ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <span className="flex items-start gap-2">
              {message.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              {message.text}
            </span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="rounded-md p-1 text-current/60 hover:bg-black/5 hover:text-current"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ResearcherStepRevisionBanner
        projectId={project.id}
        sectionKey="section3"
        sectionTitle="Section 3: Paper & Manuscript Submission"
        stepNumber={activeStep}
        stepTitle={STEPS[activeStep - 1]?.title || `Step ${activeStep}`}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeStep === 1 && (
            <ResearchSummaryStep1Section
              projectId={project.id}
              compiledOverview={compiledOverview}
              executiveSummary={executiveSummary}
              onSummaryChange={setExecutiveSummary}
              summaryTextareaRef={summaryTextareaRef}
              hasUnsavedSummaryEdits={hasUnsavedSummaryEdits}
              isSaving={isSaving}
              onRecompile={handleRecompileSummary}
              onSave={() => {
                void handleSaveSummary();
              }}
              findingsParagraphs={findingsParagraphs}
              limitationsParagraphs={limitationsParagraphs}
            />
          )}

          {activeStep === 2 && (
            <UploadPaperStep2Section
              projectId={project.id}
              manuscript={manuscript}
              fileInputRef={fileInputRef}
              fileViewUrl={fileViewUrl}
              isUploading={isUploading}
              isDragging={isDragging}
              onDraggingChange={setIsDragging}
              onFileUpload={handleFileUpload}
              onRemove={handleRemoveUploadedFile}
              hasUploadedFile={hasUploadedFile}
              isCompletedProject={isCompletedProject}
              hasSubmittedDossier={hasSubmittedDossier}
              isAlreadyUnderReview={Boolean(isAlreadyUnderReview)}
              isAlreadyApproved={Boolean(isAlreadyApproved)}
              canSubmitNow={canSubmitNow}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmitFinal}
              revisionsRequiredSpecialties={approvalState?.revisionsRequiredSpecialties || []}
              submissionHistory={submissionHistory}
              formatFileSize={formatFileSize}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <ResearchStepFooterNav
        projectId={project.id}
        sectionNumber={3}
        sectionTitle="Section 3: Research Paper Submission"
        steps={STEPS}
        activeStep={activeStep}
        onStepChange={(stepNum) => {
          handleStepNavigation(stepNum);
        }}
        onSaveDraft={activeStep === 1 && !isCompletedProject ? handleSaveActiveStep : undefined}
        onSubmitFinal={
          hasSubmittedDossier
            ? () => router.push(`/researcher/projects/${project.id}/completion`)
            : handleSubmitFinal
        }
        canSubmitFinal={hasSubmittedDossier ? true : canSubmitNow}
        nextLabelOverride={
          activeStep === 2 && hasSubmittedDossier
            ? { full: "View Professional Approval →", short: "Approval →" }
            : activeStep === 2 && !hasSubmittedDossier
              ? { full: "Submit for Professional Review", short: "Submit" }
              : undefined
        }
        isSaving={isSaving || isUploading || isSubmitting}
        saveStatus={
          isSaving || isUploading || isSubmitting
            ? "saving"
            : message?.type === "success"
              ? "saved"
              : message?.type === "error"
                ? "error"
                : hasUnsavedSummaryEdits && activeStep === 1
                  ? "unsaved"
                  : "idle"
        }
      />

      {showSubmitModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c20]/55 p-4 backdrop-blur-xs"
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#eef2ef] p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Send className="h-5 w-5" />
                </span>
                <div>
                  <h3 id="submit-modal-title" className="text-base font-bold text-[#0f2c20]">
                    Submit for expert review
                  </h3>
                  <p className="text-[11px] text-[#6d7f76]">Multidisciplinary panel evaluation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8aa094] hover:bg-[#f6f8f6] hover:text-[#0f2c20] disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm font-medium leading-relaxed text-[#1a2e24]">
                Submit your research summary and manuscript for professional review?
              </p>
              <div className="space-y-2.5 rounded-xl border border-[#e6ebe7] bg-[#f8fbf9] p-3.5 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#52645d]">
                    <Leaf className="h-3.5 w-3.5 text-emerald-700" />
                    Botanical
                  </span>
                  <span className="font-semibold text-[#0f2c20]">
                    {compiledOverview.plant.commonName} · {compiledOverview.formulation.dosageForm}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#52645d]">
                    <Cpu className="h-3.5 w-3.5 text-emerald-700" />
                    In-silico
                  </span>
                  <span className="font-semibold text-[#0f2c20]">
                    {compiledOverview.screening.totalCompounds} compounds ·{" "}
                    {compiledOverview.docking.completedRunsCount} runs
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#52645d]">
                    <FileText className="h-3.5 w-3.5 text-emerald-700" />
                    Manuscript
                  </span>
                  <span className="max-w-[220px] truncate font-semibold text-[#0f2c20]">
                    {manuscript?.fileName || "Uploaded Research Paper"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#eef2ef] bg-[#f8fbf9] p-4">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="rounded-xl border border-[#d7e4dc] bg-white px-4 py-2 text-[11px] font-semibold text-[#52645d] hover:bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitFinal}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f2c20] px-5 py-2 text-[11px] font-bold text-emerald-100 hover:bg-[#1e5c44] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Confirm &amp; submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
