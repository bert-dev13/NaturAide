"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCheck2,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Save,
  Trash2,
  RefreshCw,
  Eye,
  Sparkles,
  Leaf,
  FlaskConical,
  Cpu,
  ShieldCheck,
  Loader2,
  Clock,
  FileUp,
  Activity,
  Beaker,
  Droplets,
  Dna,
  Target,
  Zap,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  FileSpreadsheet,
  ChevronDown,
  X,
  Award,
  Lock,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { V2SectionProgress } from "@/lib/v2-progress-service";
import type { CompiledResearchOverview } from "@/lib/manuscript-upload-service";
import type {
  ProfessionalApprovalState,
  SpecialtyApprovalRow,
} from "@/lib/research-approval-completion-service";
import ResearchStepFooterNav from "@/components/researcher/ResearchStepFooterNav";
import ResearcherStepRevisionBanner from "@/components/researcher/ResearcherStepRevisionBanner";

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
  const [isRefreshingApproval, setIsRefreshingApproval] = useState<boolean>(false);
  

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
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);
  const [showFullSummaryInReview, setShowFullSummaryInReview] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Step 1: Research Summary State (never empty when saved or compiled content exists)
  const initialSummaryText =
    (initialDossier?.executiveSummary && String(initialDossier.executiveSummary).trim()) ||
    compiledOverview.compiledSummaryText ||
    "";
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
    setIsRefreshingApproval(true);
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
    } finally {
      setIsRefreshingApproval(false);
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
    const freshCompiled = compiledOverview.compiledSummaryText;
    const currentTrimmed = executiveSummary.trim();
    if (
      currentTrimmed.length > 0 &&
      currentTrimmed !== freshCompiled.trim() &&
      typeof window !== "undefined"
    ) {
      const confirmed = window.confirm(
        "Recompiling the Research Summary from Sections 1 and 2 will replace your current text in the editor. Do you want to continue?"
      );
      if (!confirmed) return;
    }

    setExecutiveSummary(freshCompiled);
    setMessage({
      text: "Research summary recompiled from Sections 1 and 2. Click Save Summary to save changes.",
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
      setShowPdfPreview(false);
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

  return (
    <div className="min-h-screen bg-slate-50/60 pb-36">
      {/* 1. STICKY HEADER & 4-STEP NAVIGATION (Consistent Fixed Layout) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Top Row: Breadcrumb + Title + Status Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Link
                  href={`/researcher/projects/${project.id}`}
                  className="hover:text-indigo-700 inline-flex items-center gap-1 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Workspace Hub</span>
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  Section 3 • Step 0{activeStep} of 02
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
                  {project.title}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="truncate">{STEPS[activeStep - 1]?.title || STEPS[0].title}</span>
              </h1>

              {/* Compact 4-segment progress bar */}
              <div className="flex items-center gap-1.5 pt-0.5 max-w-xs">
                {STEPS.map((step) => {
                  const isFilled = step.number <= activeStep;
                  const isLockedStep4 = step.number === 4 && !hasSubmittedDossier;
                  return (
                    <div
                      key={step.number}
                      onClick={() => !isLockedStep4 && handleStepNavigation(step.number)}
                      title={`Step ${step.number}: ${step.title}`}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        isLockedStep4 ? "cursor-not-allowed" : "cursor-pointer"
                      } ${isFilled ? "bg-indigo-600" : "bg-slate-200"}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Right Status Badge */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              {isCompletedProject ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Completed ({approvalState?.approvedCount ?? 5}/5 Approved)</span>
                </span>
              ) : (approvalState?.revisionsRequiredSpecialties?.length || 0) > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Revisions Required</span>
                </span>
              ) : hasSubmittedDossier ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {latestSubmission?.versionTag || "v1.0"} • {approvalState?.approvedCount ?? 0} of{" "}
                    {approvalState?.totalSpecialties ?? 5} Approved
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Draft / In Progress</span>
                </span>
              )}
            </div>
          </div>

          {/* Bottom Row: Dedicated 4-Step Switcher Bar (Never wraps or shifts header alignment) */}
          <nav
            aria-label="Section 3 steps"
            className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-2.5"
          >
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCurrent = activeStep === step.number;
              const isLockedStep4 = step.number === 4 && !hasSubmittedDossier;
              const isDone =
                (step.number === 1 && isSummaryReady) ||
                (step.number === 2 && isManuscriptReady) ||
                (step.number === 3 && hasSubmittedDossier) ||
                (step.number === 4 && isCompletedProject);

              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => handleStepNavigation(step.number)}
                  title={
                    isLockedStep4
                      ? "Submit your research dossier in Step 3 to unlock Professional Approval & Completion"
                      : `${step.number}. ${step.title}`
                  }
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                    isCurrent
                      ? "bg-indigo-600 text-white font-semibold shadow-2xs cursor-pointer"
                      : isLockedStep4
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                  }`}
                >
                  {isLockedStep4 ? (
                    <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>
                    {step.number}. {step.title}
                  </span>
                  {isDone && !isCurrent && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 2. MAIN CONTENT CONTAINER (Full-Width Responsive Scientific Dashboard) */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs sm:text-sm font-medium flex items-start justify-between gap-3 animate-in fade-in duration-150 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed break-words">{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-600 shrink-0 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Active Step Reviewer Revision Banner */}
        <ResearcherStepRevisionBanner
          projectId={project.id}
          sectionKey="section3"
          sectionTitle="Section 3: Paper & Manuscript Submission"
          stepNumber={activeStep}
          stepTitle={STEPS[activeStep - 1]?.title || `Step ${activeStep}`}
        />

        {/* ================================================================ */}
        {/* STEP 1 — RESEARCH SUMMARY                                        */}
        {/* ================================================================ */}
        {activeStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* ------------------------------------------------------------ */}
            {/* A. RESEARCH OVERVIEW (4 Compact, Modern Scientific Cards)    */}
            {/* ------------------------------------------------------------ */}
            <section aria-labelledby="heading-research-overview" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <h2
                    id="heading-research-overview"
                    className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800"
                  >
                    Research Overview
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Compiled from Sections 1 &amp; 2
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 items-stretch">
                {/* Card 1: Botanical Information */}
                <div className="group relative bg-white rounded-xl border border-slate-200/90 border-t-[3px] border-t-emerald-500 p-3.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between space-y-2.5 animate-in fade-in slide-in-from-bottom-1">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                          <Leaf className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-700">
                          Botanical Information
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-semibold shrink-0">
                        {compiledOverview.plant.partsStudied || "Leaves"}
                      </span>
                    </div>

                    {/* Plant Title & Taxonomy */}
                    <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                      <p className="text-base font-bold text-slate-900 leading-tight">
                        {compiledOverview.plant.commonName}
                      </p>
                      {compiledOverview.plant.scientificName && (
                        <p className="text-xs italic text-slate-600">
                          {compiledOverview.plant.scientificName}
                          {compiledOverview.plant.family
                            ? ` (${compiledOverview.plant.family})`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Extraction Details */}
                  <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                    <div className="flex items-start gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-slate-400 font-medium">Extraction: </span>
                        <span className="text-slate-700 font-medium leading-snug">
                          {compiledOverview.plant.extractionMethod}
                          {compiledOverview.plant.extractionSolvent
                            ? ` (${compiledOverview.plant.extractionSolvent})`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Formulation */}
                <div className="group relative bg-white rounded-xl border border-slate-200/90 border-t-[3px] border-t-teal-500 p-3.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-teal-300 transition-all duration-200 flex flex-col justify-between space-y-2.5 animate-in fade-in slide-in-from-bottom-1">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 border border-teal-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200">
                          <FlaskConical className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold uppercase tracking-wider text-[10px] text-teal-700">
                          Formulation
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 text-[10px] font-semibold shrink-0">
                        {compiledOverview.formulation.componentsCount} ingredients
                      </span>
                    </div>

                    {/* Dosage & Formulation Name */}
                    <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                      <p className="text-base font-bold text-slate-900 leading-tight">
                        {compiledOverview.formulation.dosageForm}
                      </p>
                      {compiledOverview.formulation.formulationName &&
                        compiledOverview.formulation.formulationName !==
                          compiledOverview.formulation.dosageForm && (
                          <p className="text-xs text-slate-600 font-medium">
                            {compiledOverview.formulation.formulationName}
                          </p>
                        )}
                    </div>

                    {/* Compact Ingredient Tags */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Ingredients:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {compiledOverview.formulation.ingredientsList.length > 0 ? (
                          compiledOverview.formulation.ingredientsList.map((ing, i) => {
                            const isActive = ing.role.toLowerCase().includes("active");
                            return (
                              <span
                                key={i}
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  isActive
                                    ? "bg-teal-50 text-teal-900 border-teal-200/80 font-semibold"
                                    : "bg-slate-100 text-slate-700 border-slate-200/70"
                                }`}
                              >
                                {isActive && (
                                  <span className="w-1 h-1 rounded-full bg-teal-500 mr-1 shrink-0" />
                                )}
                                {ing.name}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-slate-400">None recorded</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* QC Status Row */}
                  <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px]">
                    <Beaker className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-slate-400 font-medium">QC Status: </span>
                      <span className="text-amber-800 font-semibold break-words">
                        {compiledOverview.formulation.qcStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: In-Silico Screening */}
                <div className="group relative bg-white rounded-xl border border-slate-200/90 border-t-[3px] border-t-indigo-500 p-3.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between space-y-2.5 animate-in fade-in slide-in-from-bottom-1">
                  <div className="space-y-2">
                    {/* Header: Short badge prevents any title collision/overlap */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-700">
                          In-Silico Screening
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/80 text-[10px] font-semibold shrink-0">
                        {compiledOverview.screening.totalCompounds} Compounds
                      </span>
                    </div>

                    {/* Hero Title & Full Status Badge */}
                    <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                      <p className="text-base font-bold text-slate-900 leading-tight">
                        {compiledOverview.screening.totalCompounds} Selected Phytochemicals
                      </p>
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{compiledOverview.screening.screeningStatus}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-700 font-medium">
                        ADMET &amp; Lipinski Drug-Likeness Evaluated
                      </p>
                    </div>

                    {/* Compact Compound Chips */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Dna className="w-3 h-3 text-indigo-500" />
                        Compounds:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {compiledOverview.screening.compoundNames.length > 0 ? (
                          compiledOverview.screening.compoundNames.map((name, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50/80 text-indigo-950 border border-indigo-200/70 text-[10px] font-medium"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">None selected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Engine Info */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Screening Engine</span>
                    <span className="text-indigo-600 font-semibold">RDKit + QSAR</span>
                  </div>
                </div>

                {/* Card 4: Molecular Docking */}
                <div className="group relative bg-white rounded-xl border border-slate-200/90 border-t-[3px] border-t-amber-500 p-3.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-amber-300 transition-all duration-200 flex flex-col justify-between space-y-2.5 animate-in fade-in slide-in-from-bottom-1">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700">
                          Molecular Docking
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-semibold shrink-0">
                        {compiledOverview.docking.targetsCount} Targets
                      </span>
                    </div>

                    {/* Hero Completed Runs & Targets */}
                    <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                      <p className="text-base font-bold text-slate-900 leading-tight">
                        {compiledOverview.docking.completedRunsCount} Completed Runs
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {compiledOverview.docking.targetNames.length > 0 ? (
                          compiledOverview.docking.targetNames.map((tName, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-medium"
                            >
                              <Target className="w-2.5 h-2.5 text-amber-600 mr-1 shrink-0" />
                              {tName}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Best Predicted Affinity Box */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200/90 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-emerald-600" />
                          Best Affinity
                        </span>
                        {compiledOverview.docking.bestComplex ? (
                          <p className="text-[11px] font-medium text-slate-800 leading-tight mt-0.5">
                            {compiledOverview.docking.bestComplex.ligandName} ×{" "}
                            {compiledOverview.docking.bestComplex.targetProtein} (
                            {compiledOverview.docking.bestComplex.pdbId})
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500">Pending</p>
                        )}
                      </div>
                      {compiledOverview.docking.bestComplex && (
                        <span className="px-2 py-1 rounded bg-emerald-600 text-white font-mono font-bold text-xs shrink-0 shadow-2xs">
                          {compiledOverview.docking.bestComplex.affinityFormatted}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------------------ */}
            {/* B. SCIENTIFIC INTERPRETATION (Saved from Section 2)          */}
            {/* ------------------------------------------------------------ */}
            <section aria-labelledby="heading-scientific-interpretation" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2
                        id="heading-scientific-interpretation"
                        className="text-sm font-bold uppercase tracking-wider text-slate-800"
                      >
                        Scientific Interpretation
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/80">
                        Section 2 • Step 8
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Saved computational findings &amp; mechanistic hypothesis from Together AI
                    </p>
                  </div>
                </div>

                <Link
                  href={`/researcher/projects/${project.id}/in-silico?step=8`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 border border-slate-200 shadow-2xs hover:shadow-xs transition-all group"
                >
                  <span>Edit in Section 2</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>

              {findingsParagraphs.length > 0 || limitationsParagraphs.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
                  {/* Card 1: Computational Findings */}
                  <div className="group relative bg-white rounded-xl border border-slate-200/90 border-t-[3px] border-t-teal-500 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-teal-300 transition-all duration-200 flex flex-col justify-between space-y-3.5 animate-in fade-in slide-in-from-bottom-1">
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="font-bold uppercase tracking-wider text-[11px] text-teal-800">
                            Computational Findings
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-semibold shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          AutoDock Vina Validated
                        </span>
                      </div>

                      {/* Paragraphs with left accent indicator */}
                      {findingsParagraphs.length > 0 ? (
                        <div className="border-l-2 border-teal-400 pl-3.5 space-y-2.5">
                          {findingsParagraphs.map((para, i) => (
                            <p
                              key={i}
                              className="text-xs sm:text-[13px] text-slate-700 leading-relaxed break-words whitespace-pre-line"
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No computational findings recorded yet.
                        </p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Engine: Together AI + Vina v1.2.7</span>
                      <span className="text-teal-700 font-semibold">Favorable Binding</span>
                    </div>
                  </div>

                  {/* Card 2: Computational Limitations & Verification */}
                  <div className="group relative bg-white rounded-xl border border-slate-200/90 border-t-[3px] border-t-amber-500 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-amber-300 transition-all duration-200 flex flex-col justify-between space-y-3.5 animate-in fade-in slide-in-from-bottom-1">
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="font-bold uppercase tracking-wider text-[11px] text-amber-800">
                            Computational Limitations &amp; Verification
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-semibold shrink-0">
                          <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                          Validation Required
                        </span>
                      </div>

                      {/* Paragraphs with left accent indicator */}
                      {limitationsParagraphs.length > 0 ? (
                        <div className="border-l-2 border-amber-400 pl-3.5 space-y-2.5">
                          {limitationsParagraphs.map((para, i) => (
                            <p
                              key={i}
                              className="text-xs sm:text-[13px] text-slate-700 leading-relaxed break-words whitespace-pre-line"
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No computational limitations recorded yet.
                        </p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Required: Enzymatic Assays &amp; Franz Diffusion</span>
                      <span className="text-amber-700 font-semibold">Non-Clinical</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      No saved AI scientific interpretation found
                    </p>
                    <p className="text-xs text-slate-500">
                      Generate computational findings and limitations in Section 2 Step 8 to automatically populate this section.
                    </p>
                  </div>
                  <Link
                    href={`/researcher/projects/${project.id}/in-silico?step=8`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Open Section 2 Step 8</span>
                  </Link>
                </div>
              )}
            </section>

            {/* ------------------------------------------------------------ */}
            {/* C. RESEARCH SUMMARY (Prominent Auto-Expanding Editor)        */}
            {/* ------------------------------------------------------------ */}
            <section aria-labelledby="heading-research-summary" className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shadow-2xs shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2
                          id="heading-research-summary"
                          className="text-base sm:text-lg font-bold text-slate-900"
                        >
                          Research Summary
                        </h2>
                        {hasUnsavedSummaryEdits ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Unsaved Edits
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Saved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Complete multi-stage research summary compiled from Sections 1 and 2. Review and edit as needed.
                      </p>
                    </div>
                  </div>

                  {/* Only Two Actions: Recompile Summary & Save Summary */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRecompileSummary}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      title="Recompile research summary from Sections 1 and 2"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Recompile Summary</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveSummary}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Summary</span>
                    </button>
                  </div>
                </div>

                {/* Editor Container with Document Meta Bar */}
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-50/90 border-b border-slate-200 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                      Compiled Dossier Summary (Sections 1 &amp; 2)
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {executiveSummary.length} characters
                    </span>
                  </div>
                  <textarea
                    ref={summaryTextareaRef}
                    value={executiveSummary}
                    onChange={(e) => setExecutiveSummary(e.target.value)}
                    rows={16}
                    className="w-full min-h-[380px] p-4 sm:p-5 bg-white text-sm text-slate-800 leading-relaxed break-words focus:outline-none resize-y font-sans"
                    placeholder="Compiled research summary from Sections 1 and 2..."
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 2 — UPLOAD RESEARCH PAPER                                   */}
        {/* ================================================================ */}
        {activeStep === 2 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Upload Research Paper</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Upload your completed research manuscript in PDF (.pdf) or Microsoft Word (.docx) format (max 25 MB).
                </p>
              </div>
              {hasUploadedFile && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Uploaded
                </span>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />

            {hasUploadedFile ? (
              <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-bold text-slate-900 break-words">
                        {manuscript.fileName || "Uploaded_Research_Paper.pdf"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-700">
                          {formatFileSize(manuscript.fileSize)}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">Saved in MySQL</span>
                        {manuscript.uploadedAt && (
                          <>
                            <span>•</span>
                            <span suppressHydrationWarning>
                              Uploaded {new Date(manuscript.uploadedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* View, Replace, Remove Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={fileViewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>View</span>
                    </a>

                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>Replace</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={handleRemoveUploadedFile}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50/40"
                    : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 border border-indigo-200">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileUp className="w-6 h-6" />
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {isUploading
                    ? "Uploading manuscript..."
                    : "Drag and drop your research paper here"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Accepted formats:{" "}
                  <span className="font-semibold text-slate-700">PDF (.pdf)</span> or{" "}
                  <span className="font-semibold text-slate-700">Word (.docx)</span> • Max 25 MB
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse Files</span>
                  </button>
                </div>
              </div>
            )}

            {/* Submit / Resubmit or Advance to Step 4 Action Bar */}
            <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  {isCompletedProject
                    ? "Research Officially Completed"
                    : (approvalState?.revisionsRequiredSpecialties?.length || 0) > 0
                    ? "Resubmit Revised Research Dossier"
                    : hasSubmittedDossier
                    ? "Submitted for Multidisciplinary Professional Review"
                    : "Submit Research for Professional Review"}
                </h4>
                <p className="text-xs text-slate-500">
                  {isCompletedProject
                    ? "This project has received 3 of 3 professional approvals and is locked as Completed."
                    : (approvalState?.revisionsRequiredSpecialties?.length || 0) > 0
                    ? `Revisions were requested by ${approvalState?.revisionsRequiredSpecialties.join(", ")}. Update your sections/manuscript and resubmit.`
                    : hasSubmittedDossier
                    ? "Your research dossier is queued with the 3 professional reviewers (1 reviewer per section). Proceed to Professional Approval & Completion to track approvals."
                    : "Submit your completed research summary and manuscript for multidisciplinary professional review."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {hasSubmittedDossier && (
                  <Link
                    href={`/researcher/projects/${project.id}/completion`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Open Professional Approval &amp; Completion →</span>
                  </Link>
                )}

                {!isCompletedProject && !isAlreadyUnderReview && !isAlreadyApproved && (
                  <button
                    type="button"
                    onClick={handleSubmitFinal}
                    disabled={!canSubmitNow || isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {hasSubmittedDossier
                        ? "Resubmit Revised Research"
                        : "Submit for Professional Review"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Submission History (Compact) */}
            {submissionHistory.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Submission History &amp; Expert Review Status
                  </h4>
                  <Link
                    href={`/researcher/projects/${project.id}/revisions`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    View Reviewer Feedback →
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {submissionHistory.map((sub) => (
                    <div
                      key={sub.id}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200">
                          {sub.versionTag || `v${sub.reviewRound}.0`}
                        </span>
                        <span className="font-semibold text-slate-800">
                          Review Cycle {sub.reviewRound}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{sub.status}</span>
                      </div>
                      <span suppressHydrationWarning className="text-slate-400 font-mono text-[11px]">
                        Submitted {new Date(sub.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ONE STICKY FOOTER: Back to Section 2 | Save Draft | Next Step / Complete Research */}
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

      

      {/* =================================================================== */}
      {/* FINAL SUBMISSION CONFIRMATION MODAL                                 */}
      {/* =================================================================== */}
      {showSubmitModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="submit-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                    Submit Research for Expert Review
                  </h3>
                  <p className="text-xs text-slate-500">
                    Multidisciplinary panel evaluation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isSubmitting && setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                Submit your completed research summary and manuscript for multidisciplinary expert review?
              </p>

              {/* Research Dossier Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    Botanical &amp; Formulation
                  </span>
                  <span className="font-semibold text-slate-900">
                    {compiledOverview.plant.commonName} · {compiledOverview.formulation.dosageForm}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                    Screening &amp; Docking
                  </span>
                  <span className="font-semibold text-slate-900">
                    {compiledOverview.screening.totalCompounds} compounds · {compiledOverview.docking.completedRunsCount} runs
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    Uploaded Manuscript
                  </span>
                  <span className="font-semibold text-slate-900 break-words max-w-[220px]">
                    {manuscript?.fileName || "Uploaded Research Paper"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Once submitted, your project dossier and manuscript will be queued for evaluation by the 3 professional reviewer roles (Section 1: Formulation Scientist &amp; Pharmacognosist, Section 2: Bioinformatician &amp; Computational Scientist, Section 3: Clinical Pharmacologist &amp; Medical Reviewer).
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmSubmitFinal}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Research...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Submit</span>
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
