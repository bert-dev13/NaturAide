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
  ArrowRight,
  Send,
  Loader2,
  X,
  Leaf,
  Beaker,
} from "lucide-react";
import { V2SectionProgress } from "@/lib/v2-progress-service";
import type { CompiledResearchOverview } from "@/lib/manuscript-upload-service";
import {
  resolveResearchSummaryText,
  diffCompiledSectionLabels,
  isLikelyResearcherEditedSummary,
} from "@/lib/research-summary-utils";
import type { ProfessionalApprovalState } from "@/lib/research-approval-completion-service";
import ResearchStepFooterNav from "@/components/researcher/ResearchStepFooterNav";
import ResearcherStepRevisionBanner from "@/components/researcher/ResearcherStepRevisionBanner";
import ResearchSectionWorkspaceHeader from "@/components/researcher/ResearchSectionWorkspaceHeader";
import ResearchSummaryStep1Section from "./ResearchSummaryStep1Section";
import LaboratoryResultsStepSection from "./LaboratoryResultsStepSection";
import UploadPaperStep2Section from "./UploadPaperStep2Section";
import { showToast, confirmAction } from "@/lib/toast";

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
  compiledOverview: initialCompiledOverview,
  submissionHistory: initialHistory = [],
  v2Progress: initialV2Progress,
  initialStep = 1,
  initialApprovalState = null,
}: Props) {
  const router = useRouter();
  const [approvalState, setApprovalState] = useState<ProfessionalApprovalState | null>(
    initialApprovalState
  );
  const [v2Progress, setV2Progress] = useState<V2SectionProgress>(initialV2Progress);
  const [activeStep, setActiveStep] = useState<number>(
    initialStep >= 1 && initialStep <= 3 ? initialStep : 1
  );
  const [labResultsCount, setLabResultsCount] = useState(
    initialV2Progress.laboratoryResults?.count ?? 0
  );

  useEffect(() => {
    setV2Progress(initialV2Progress);
    setLabResultsCount(initialV2Progress.laboratoryResults?.count ?? 0);
  }, [initialV2Progress]);

  const handleLabProgressChange = useCallback(
    (
      info: { count: number; progressPercent: number; status: "NOT_STARTED" | "COMPLETED" },
      fullProgress?: V2SectionProgress
    ) => {
      setLabResultsCount((prev) => (prev === info.count ? prev : info.count));
      if (fullProgress) {
        setV2Progress(fullProgress);
      }
    },
    []
  );

  useEffect(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 3) {
      setActiveStep(initialStep);
    }
  }, [initialStep]);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRecompiling, setIsRecompiling] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingRetryFile, setPendingRetryFile] = useState<File | null>(null);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const notify = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    showToast(text, type);
  };
  const [compiledOverview, setCompiledOverview] =
    useState<CompiledResearchOverview>(initialCompiledOverview);
  const [updatedSectionLabels, setUpdatedSectionLabels] = useState<string[]>([]);
  const [lastCompiledAt, setLastCompiledAt] = useState<string | null>(null);

  // Prefer a real compiled dossier over seed/stub one-liners saved in research_dossiers
  const initialSummaryText = resolveResearchSummaryText(
    initialDossier?.executiveSummary,
    initialCompiledOverview.compiledSummaryText
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
    { number: 2, title: "Laboratory Results", icon: Beaker },
    { number: 3, title: "Upload Research Paper", icon: Upload },
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

  const handleStepNavigation = async (targetStep: number) => {
    if (targetStep !== activeStep && activeStep === 1 && hasUnsavedSummaryEdits) {
      const leave = await confirmAction({
        title: "Unsaved summary edits",
        message: "You have unsaved research summary edits. Leave without saving?",
        confirmLabel: "Leave",
        cancelLabel: "Stay",
        variant: "destructive",
      });
      if (!leave) return;
    }
    setMessage(null);
    setUpdatedSectionLabels([]);
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
  const handleRecompileSummary = async () => {
    if (isRecompiling || isSaving) return;

    const previousCompiled = String(compiledOverview.compiledSummaryText || "").trim();
    const replacingRealEdit = isLikelyResearcherEditedSummary(
      executiveSummary,
      previousCompiled
    );

    if (replacingRealEdit) {
      const confirmed = await confirmAction({
        title: "Recompile research summary?",
        message:
          "Recompiling retrieves the latest Sections 1 and 2 records and may replace your current dossier edits. Continue?",
        confirmLabel: "Recompile",
        cancelLabel: "Cancel",
      });
      if (!confirmed) return;
    }

    setIsRecompiling(true);
    setMessage(null);
    setUpdatedSectionLabels([]);

    try {
      const res = await fetch(
        `/api/researcher/projects/${project.id}/compiled-overview`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.compiledOverview) {
        throw new Error(data.error || "Failed to recompile research overview.");
      }

      const nextOverview = data.compiledOverview as CompiledResearchOverview;
      const freshCompiled = String(nextOverview.compiledSummaryText || "").trim();
      if (!freshCompiled) {
        throw new Error(
          "No compiled dossier is available yet. Complete Sections 1 and 2 first."
        );
      }

      const changed = diffCompiledSectionLabels(previousCompiled, freshCompiled);
      setCompiledOverview(nextOverview);
      setExecutiveSummary(freshCompiled);
      setUpdatedSectionLabels(changed);
      setLastCompiledAt(data.compiledAt || new Date().toISOString());
      notify(
        changed.length > 0
          ? `Dossier recompiled. Updated: ${changed.join(", ")}. Save to persist.`
          : "Dossier recompiled from Sections 1 and 2 (no section text changes detected). Save to persist.",
        "success"
      );
    } catch (e: any) {
      notify(e?.message || "Compilation failed. Please try again.", "error");
    } finally {
      setIsRecompiling(false);
    }
  };

  const handleSaveSummary = async (): Promise<boolean> => {
    const cleanText = executiveSummary.trim();
    if (!cleanText) {
      notify("Research summary cannot be empty.", "error");
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
      setUpdatedSectionLabels([]);
      notify("Research summary saved to database.", "success");
      return true;
    } catch (e: any) {
      notify(e.message || "Failed to save summary", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2 HANDLERS: UPLOAD RESEARCH PAPER (PDF / DOCX)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      uploadXhrRef.current?.abort();
      uploadXhrRef.current = null;
    };
  }, []);

  const handleFileUpload = (file: File) => {
    setMessage(null);
    setUploadError(null);

    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith(".pdf") && !nameLower.endsWith(".docx")) {
      const err =
        "Unsupported format. Please upload a PDF (.pdf) or DOCX (.docx) manuscript.";
      setUploadError(err);
      notify(err, "error");
      return;
    }
    if (file.size <= 0) {
      const err = "Selected file is empty.";
      setUploadError(err);
      notify(err, "error");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      const err = "File exceeds the 25 MB maximum size limit.";
      setUploadError(err);
      notify(err, "error");
      return;
    }

    if (isUploading) return;

    uploadXhrRef.current?.abort();
    setPendingRetryFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    uploadXhrRef.current = xhr;
    xhr.open("POST", `/api/researcher/projects/${project.id}/manuscript`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      const pct = Math.round((event.loaded / event.total) * 100);
      setUploadProgress(Math.min(100, Math.max(0, pct)));
    };

    xhr.onload = () => {
      uploadXhrRef.current = null;
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        data = {};
      }

      if (xhr.status >= 200 && xhr.status < 300 && data.manuscript) {
        setManuscript(data.manuscript);
        setPendingRetryFile(null);
        setUploadError(null);
        setUploadProgress(100);
        notify(`Uploaded "${file.name}" (${formatFileSize(file.size)}) successfully.`, "success");
      } else {
        const err = data.error || "Failed to upload research paper.";
        setUploadError(err);
        notify(err, "error");
      }
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    xhr.onerror = () => {
      uploadXhrRef.current = null;
      const err = "Upload failed due to a network error. Please retry.";
      setUploadError(err);
      notify(err, "error");
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    xhr.onabort = () => {
      uploadXhrRef.current = null;
      setIsUploading(false);
      setUploadProgress(null);
      setUploadError("Upload was interrupted. You can retry when ready.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    xhr.send(formData);
  };

  const handleRetryUpload = () => {
    if (!pendingRetryFile || isUploading) return;
    handleFileUpload(pendingRetryFile);
  };

  const handleRemoveUploadedFile = async () => {
    if (isUploading || isSubmitting) return;
    uploadXhrRef.current?.abort();
    setIsUploading(true);
    setMessage(null);
    setUploadError(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/manuscript`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove uploaded file.");
      }
      setManuscript(data.manuscript || null);
      setPendingRetryFile(null);
      notify("Uploaded research paper removed.", "success");
    } catch (e: any) {
      notify(e.message || "Failed to remove file.", "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
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
      notify(
        `This research has already been submitted (${latestSubmission?.versionTag || "v1.0"}) and is currently under expert review.`,
        "error"
      );
      return;
    }

    if (!isSummaryReady) {
      notify("Please review and save your Research Summary in Step 1 before submitting.", "error");
      setActiveStep(1);
      return;
    }

    if (!isManuscriptReady) {
      notify(
        "Please upload your Research Paper (PDF or DOCX) in Step 3 before submitting.",
        "error"
      );
      setActiveStep(3);
      return;
    }

    if (v2Progress.section1.status !== "COMPLETED" || v2Progress.section2.status !== "COMPLETED") {
      notify(
        "Please complete all steps in Section 1 and Section 2 before submitting for review.",
        "error"
      );
      return;
    }

    // Open modern confirmation modal instead of native browser popup
    setShowSubmitModal(true);
  };

  const handleConfirmSubmitFinal = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const saved = await handleSaveSummary();
      if (!saved) {
        throw new Error("Could not save the research summary before submission.");
      }

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
      notify(
        `Submitted (${data.versionTag || "v1.0"}) for multidisciplinary expert review! Redirecting to Professional Approval...`,
        "success"
      );
      router.push(`/researcher/projects/${project.id}/completion`);
    } catch (e: any) {
      // Preserve manuscript + summary on failure; only show error.
      notify(e.message || "Submission failed.", "error");
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

  const statusLabel = isCompletedProject
    ? `Completed (${approvalState?.approvedCount ?? 0}/${approvalState?.totalSpecialties ?? 3})`
    : (approvalState?.revisionsRequiredSpecialties?.length || 0) > 0
      ? "Revisions required"
      : hasSubmittedDossier
        ? `${latestSubmission?.versionTag || "v1.0"} · ${approvalState?.approvedCount ?? 0}/${approvalState?.totalSpecialties ?? 3}`
        : isSaving || isRecompiling
          ? isRecompiling
            ? "Recompiling…"
            : "Saving…"
          : hasUnsavedSummaryEdits
            ? "Unsaved"
            : message?.type === "success"
              ? "Saved"
              : "Draft";

  const statusVariant = isCompletedProject
    ? ("success" as const)
    : (approvalState?.revisionsRequiredSpecialties?.length || 0) > 0
      ? ("warning" as const)
      : hasSubmittedDossier
        ? ("running" as const)
        : isSaving || isRecompiling
          ? ("saving" as const)
          : hasUnsavedSummaryEdits
            ? ("warning" as const)
            : message?.type === "success"
              ? ("saved" as const)
              : ("draft" as const);

  const headerSteps = STEPS.map((step) => ({
    number: step.number,
    title: step.title,
    done:
      (step.number === 1 && isSummaryReady && !hasUnsavedSummaryEdits) ||
      (step.number === 2 && labResultsCount > 0) ||
      (step.number === 3 && isManuscriptReady),
  }));

  return (
    <div className="w-full max-w-none space-y-5 pb-32 text-slate-800">
      <ResearchSectionWorkspaceHeader
        projectId={project.id}
        sectionLabel="Paper Submission"
        steps={headerSteps}
        activeStep={activeStep}
        onStepChange={handleStepNavigation}
        statusLabel={statusLabel}
        statusVariant={statusVariant}
        subtitle={project.title}
        proceedSlot={
          hasSubmittedDossier ? (
            <Link
              href={`/researcher/projects/${project.id}/completion`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
            >
              Approval status
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => handleStepNavigation(activeStep < 3 ? activeStep + 1 : 1)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
            >
              {activeStep === 1
                ? "Laboratory results"
                : activeStep === 2
                  ? "Upload paper"
                  : "Back to summary"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )
        }
      />

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
              onSummaryChange={(value) => {
                setExecutiveSummary(value);
                setUpdatedSectionLabels([]);
              }}
              summaryTextareaRef={summaryTextareaRef}
              hasUnsavedSummaryEdits={hasUnsavedSummaryEdits}
              isSaving={isSaving}
              isRecompiling={isRecompiling}
              onRecompile={() => {
                void handleRecompileSummary();
              }}
              onSave={() => {
                void handleSaveSummary();
              }}
              findingsParagraphs={findingsParagraphs}
              limitationsParagraphs={limitationsParagraphs}
              updatedSectionLabels={updatedSectionLabels}
              lastCompiledAt={lastCompiledAt}
            />
          )}

          {activeStep === 2 && (
            <LaboratoryResultsStepSection
              projectId={project.id}
              projectTitle={project.title}
              readOnly={isCompletedProject}
              onCountChange={setLabResultsCount}
              onProgressChange={handleLabProgressChange}
            />
          )}

          {activeStep === 3 && (
            <UploadPaperStep2Section
              projectId={project.id}
              manuscript={manuscript}
              fileInputRef={fileInputRef}
              fileViewUrl={fileViewUrl}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              uploadError={uploadError}
              onRetryUpload={pendingRetryFile ? handleRetryUpload : undefined}
              isDragging={isDragging}
              onDraggingChange={setIsDragging}
              onFileUpload={handleFileUpload}
              onRemove={() => {
                void handleRemoveUploadedFile();
              }}
              hasUploadedFile={hasUploadedFile}
              isSummaryReady={isSummaryReady}
              hasUnsavedSummaryEdits={hasUnsavedSummaryEdits}
              sectionsReady={
                v2Progress.section1.status === "COMPLETED" &&
                v2Progress.section2.status === "COMPLETED"
              }
              isCompletedProject={isCompletedProject}
              hasSubmittedDossier={hasSubmittedDossier}
              isAlreadyUnderReview={Boolean(isAlreadyUnderReview)}
              isAlreadyApproved={Boolean(isAlreadyApproved)}
              canSubmitNow={canSubmitNow && !hasUnsavedSummaryEdits}
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
        canSubmitFinal={
          hasSubmittedDossier ? true : canSubmitNow && !hasUnsavedSummaryEdits && !isUploading
        }
        nextLabelOverride={
          activeStep === 3 && hasSubmittedDossier
            ? { full: "View Professional Approval →", short: "Approval →" }
            : activeStep === 3 && !hasSubmittedDossier
              ? { full: "Submit for Professional Review", short: "Submit" }
              : undefined
        }
        isSaving={isSaving || isUploading || isSubmitting || isRecompiling}
        saveStatus={
          isSaving || isUploading || isSubmitting || isRecompiling
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
                The research dossier will be submitted for professional review. Reviewers will
                receive the saved summary and uploaded manuscript through the existing review
                workflow.
              </p>
              <div className="space-y-2.5 rounded-xl border border-[#e6ebe7] bg-[#f8fbf9] p-3.5 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[#52645d]">Project</span>
                  <span className="max-w-[240px] truncate font-semibold text-[#0f2c20]">
                    {project.title}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[#52645d]">Research summary</span>
                  <span className="font-semibold text-[#0f2c20]">
                    {isSummaryReady && !hasUnsavedSummaryEdits ? "Saved" : "Incomplete"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#52645d]">
                    <FileText className="h-3.5 w-3.5 text-emerald-700" />
                    Manuscript
                  </span>
                  <span className="max-w-[220px] truncate font-semibold text-[#0f2c20]">
                    {manuscript?.fileName || "Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#52645d]">
                    <Leaf className="h-3.5 w-3.5 text-emerald-700" />
                    Botanical
                  </span>
                  <span className="font-semibold text-[#0f2c20]">
                    {compiledOverview.plant.commonName} · {compiledOverview.formulation.dosageForm}
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
