"use client";

import React, { RefObject } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Upload,
  FileText,
  FileUp,
  CheckCircle2,
  Eye,
  RefreshCw,
  Trash2,
  Loader2,
  Send,
  Award,
  AlertCircle,
  Download,
} from "lucide-react";

interface ManuscriptLike {
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  uploadedAt?: string | null;
  abstract?: string | null;
  conclusion?: string | null;
}

interface SubmissionRow {
  id: number;
  versionTag: string;
  reviewRound: number;
  status: string;
  submittedAt: string;
  reviewedAt?: string | null;
}

interface Props {
  projectId: number;
  manuscript: ManuscriptLike | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  fileViewUrl: string;
  isUploading: boolean;
  uploadProgress: number | null;
  uploadError: string | null;
  onRetryUpload?: () => void;
  isDragging: boolean;
  onDraggingChange: (dragging: boolean) => void;
  onFileUpload: (file: File) => void;
  onRemove: () => void;
  hasUploadedFile: boolean;
  isSummaryReady: boolean;
  hasUnsavedSummaryEdits?: boolean;
  sectionsReady: boolean;
  isCompletedProject: boolean;
  hasSubmittedDossier: boolean;
  isAlreadyUnderReview: boolean;
  isAlreadyApproved: boolean;
  canSubmitNow: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  revisionsRequiredSpecialties?: string[];
  submissionHistory: SubmissionRow[];
  formatFileSize: (bytes?: number | null) => string;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function fileTypeLabel(manuscript: ManuscriptLike | null): string {
  const name = String(manuscript?.fileName || "").toLowerCase();
  const mime = String(manuscript?.mimeType || "").toLowerCase();
  if (name.endsWith(".pdf") || mime.includes("pdf")) return "PDF";
  if (name.endsWith(".docx") || mime.includes("wordprocessingml")) return "DOCX";
  return "File";
}

export default function UploadPaperStep2Section({
  projectId,
  manuscript,
  fileInputRef,
  fileViewUrl,
  isUploading,
  uploadProgress,
  uploadError,
  onRetryUpload,
  isDragging,
  onDraggingChange,
  onFileUpload,
  onRemove,
  hasUploadedFile,
  isSummaryReady,
  hasUnsavedSummaryEdits = false,
  sectionsReady,
  isCompletedProject,
  hasSubmittedDossier,
  isAlreadyUnderReview,
  isAlreadyApproved,
  canSubmitNow,
  isSubmitting,
  onSubmit,
  revisionsRequiredSpecialties = [],
  submissionHistory,
  formatFileSize,
}: Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const summaryOk = isSummaryReady && !hasUnsavedSummaryEdits;
  const manuscriptOk = hasUploadedFile;
  const showProgress =
    isUploading && uploadProgress !== null && Number.isFinite(uploadProgress);

  return (
    <div className="space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        disabled={isUploading || isSubmitting}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileUpload(file);
        }}
      />

      {/* Primary upload / file panel */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut }}
        className="overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d7e4dc] px-5 py-3.5">
          <div>
            <h2 className="text-sm font-bold text-[#0f2c20]">Research Manuscript</h2>
            <p className="text-[11px] text-slate-500">PDF or DOCX · maximum 25 MB</p>
          </div>
          <span className="rounded-md border border-[#c5ddd0] bg-[#f4faf6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1a5c3a]">
            Section 3 · Step 2/2
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {hasUploadedFile && manuscript && !isUploading ? (
            <div className="rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1a5c3a] text-white">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0f2c20]">
                      {manuscript.fileName || "Uploaded_Research_Paper.pdf"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600">
                      <span className="rounded-md border border-[#c5ddd0] bg-white px-1.5 py-0.5 font-semibold text-[#1a5c3a]">
                        {fileTypeLabel(manuscript)}
                      </span>
                      <span className="font-mono font-semibold text-[#0f2c20]">
                        {formatFileSize(manuscript.fileSize)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Uploaded
                      </span>
                      {manuscript.uploadedAt && (
                        <span suppressHydrationWarning className="text-slate-500">
                          {new Date(manuscript.uploadedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={fileViewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#c5ddd0] bg-white px-3 py-2 text-[11px] font-semibold text-[#1a5c3a] transition hover:bg-white"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </a>
                  <a
                    href={fileViewUrl}
                    download={manuscript.fileName || undefined}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#c5ddd0] bg-white px-3 py-2 text-[11px] font-semibold text-[#1a5c3a] transition hover:bg-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                  <button
                    type="button"
                    disabled={isUploading || isSubmitting || isCompletedProject}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#c5ddd0] bg-white px-3 py-2 text-[11px] font-semibold text-[#1a5c3a] transition hover:bg-[#f4faf6] disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Replace File
                  </button>
                  <button
                    type="button"
                    disabled={isUploading || isSubmitting || isCompletedProject}
                    onClick={onRemove}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove File
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!isUploading && !isSubmitting) onDraggingChange(true);
              }}
              onDragLeave={() => onDraggingChange(false)}
              onDrop={(e) => {
                e.preventDefault();
                onDraggingChange(false);
                if (isUploading || isSubmitting) return;
                const file = e.dataTransfer.files?.[0];
                if (file) onFileUpload(file);
              }}
              className={`rounded-2xl border-2 border-dashed px-6 py-12 text-center transition sm:py-14 ${
                isDragging
                  ? "border-[#1a5c3a] bg-[#e8f0eb]"
                  : "border-[#c5ddd0] bg-[#f8fbf9] hover:border-[#1a5c3a]/50"
              }`}
            >
              <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c5ddd0] bg-white text-[#1a5c3a]">
                {isUploading ? (
                  <Loader2
                    className={`h-7 w-7 ${reduceMotion ? "" : "animate-spin"}`}
                  />
                ) : (
                  <FileUp className="h-7 w-7" />
                )}
              </span>

              <p className="text-base font-semibold text-[#0f2c20]">
                {isUploading
                  ? showProgress
                    ? `Uploading… ${uploadProgress}%`
                    : "Uploading manuscript…"
                  : "Drop your research paper here"}
              </p>
              <p className="mt-1.5 text-xs text-slate-500">
                Supported formats: <span className="font-semibold text-[#0f2c20]">PDF</span> and{" "}
                <span className="font-semibold text-[#0f2c20]">DOCX</span> · Max 25 MB
              </p>

              {isUploading && (
                <div className="mx-auto mt-5 w-full max-w-sm">
                  <div className="h-2 overflow-hidden rounded-full bg-[#e8f0eb]">
                    <div
                      className={`h-full rounded-full bg-[#1a5c3a] transition-[width] duration-150 ${
                        showProgress ? "" : reduceMotion ? "" : "animate-pulse"
                      }`}
                      style={{
                        width: showProgress
                          ? `${Math.min(100, Math.max(0, uploadProgress || 0))}%`
                          : "40%",
                      }}
                    />
                  </div>
                  {showProgress && (
                    <p className="mt-1.5 font-mono text-[11px] font-semibold text-[#1a5c3a]">
                      {uploadProgress}% uploaded
                    </p>
                  )}
                </div>
              )}

              {!isUploading && (
                <button
                  type="button"
                  disabled={isSubmitting || isCompletedProject}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1a5c3a] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#154e31] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Browse Files
                </button>
              )}
            </div>
          )}

          {uploadError && !isUploading && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
              {onRetryUpload && (
                <button
                  type="button"
                  onClick={onRetryUpload}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-700 px-3.5 py-2 text-[11px] font-semibold text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry Upload
                </button>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* Compact readiness checklist */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut, delay: reduceMotion ? 0 : 0.04 }}
        className="rounded-2xl border border-[#d7e4dc] bg-white px-5 py-4"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f2c20]">
          Submission Readiness
        </h3>
        <ul className="mt-3 space-y-2.5">
          <li className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">Research Summary</span>
            {summaryOk ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Incomplete
              </span>
            )}
          </li>
          <li className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">Research Manuscript</span>
            {manuscriptOk ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Uploaded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Missing
              </span>
            )}
          </li>
        </ul>
        {!sectionsReady && (
          <p className="mt-3 text-[11px] text-amber-800">
            Sections 1 and 2 must be complete before professional review submission is allowed.
          </p>
        )}
        {hasUnsavedSummaryEdits && isSummaryReady && (
          <p className="mt-3 text-[11px] text-amber-800">
            Save your Research Summary edits in Step 1 before submitting.
          </p>
        )}
      </motion.section>

      {/* Primary submit action */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut, delay: reduceMotion ? 0 : 0.06 }}
        className="rounded-2xl border border-[#d7e4dc] bg-white px-5 py-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0f2c20]">
              {isCompletedProject
                ? "Research completed"
                : revisionsRequiredSpecialties.length > 0
                  ? "Resubmit revised dossier"
                  : hasSubmittedDossier
                    ? "Under professional review"
                    : "Submit for Professional Review"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isCompletedProject
                ? "All specialty approvals received. Project is locked."
                : revisionsRequiredSpecialties.length > 0
                  ? `Revisions requested by ${revisionsRequiredSpecialties.join(", ")}.`
                  : hasSubmittedDossier
                    ? "Track reviewer decisions in Professional Approval."
                    : "Both readiness checks must pass. The backend re-validates eligibility on submit."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasSubmittedDossier && (
              <Link
                href={`/researcher/projects/${projectId}/completion`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#c5ddd0] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1a5c3a] transition hover:bg-[#f4faf6]"
              >
                <Award className="h-3.5 w-3.5" />
                Approval status
              </Link>
            )}
            {!isCompletedProject && !isAlreadyUnderReview && !isAlreadyApproved && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmitNow || isSubmitting || isUploading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1a5c3a] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#154e31] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2
                    className={`h-4 w-4 ${reduceMotion ? "" : "animate-spin"}`}
                  />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSubmitting
                  ? "Submitting…"
                  : hasSubmittedDossier
                    ? "Resubmit for Review"
                    : "Submit for Professional Review"}
              </button>
            )}
          </div>
        </div>

        {submissionHistory.length > 0 && (
          <div className="mt-5 border-t border-[#eef2ef] pt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Submission history
              </h4>
              <Link
                href={`/researcher/projects/${projectId}/revisions`}
                className="text-[11px] font-semibold text-[#1a5c3a] hover:underline"
              >
                Reviewer feedback →
              </Link>
            </div>
            <div className="divide-y divide-[#eef2ef] text-[11px]">
              {submissionHistory.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
                      {sub.versionTag || `v${sub.reviewRound}.0`}
                    </span>
                    <span className="font-semibold text-[#0f2c20]">
                      Cycle {sub.reviewRound}
                    </span>
                    <span className="text-slate-500">{sub.status}</span>
                  </div>
                  <span suppressHydrationWarning className="font-mono text-[10px] text-slate-400">
                    {new Date(sub.submittedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}
