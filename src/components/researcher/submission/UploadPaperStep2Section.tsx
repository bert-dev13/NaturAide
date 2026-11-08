"use client";

import React, { RefObject } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  ChevronRight,
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
  isDragging: boolean;
  onDraggingChange: (dragging: boolean) => void;
  onFileUpload: (file: File) => void;
  onRemove: () => void;
  hasUploadedFile: boolean;
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

export default function UploadPaperStep2Section({
  projectId,
  manuscript,
  fileInputRef,
  fileViewUrl,
  isUploading,
  isDragging,
  onDraggingChange,
  onFileUpload,
  onRemove,
  hasUploadedFile,
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
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d7e4dc]/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6d7f76]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Upload className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">Manuscript Upload</span>
          {hasUploadedFile ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
              <CheckCircle2 className="h-3 w-3" />
              Uploaded
            </span>
          ) : (
            <span className="rounded-md border border-[#d7e4dc] bg-[#f6f8f6] px-2 py-0.5 text-[10px] font-medium text-[#52645d]">
              PDF or DOCX · max 25 MB
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium text-[#8aa094]">
          Upload · submit for review
        </span>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-300" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#0f2c20]">Upload Research Paper</h2>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              Attach the finished manuscript before professional review
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Upload file" },
              { n: "2", label: "Verify" },
              { n: "3", label: "Submit" },
            ].map((step, idx) => (
              <span
                key={step.n}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#52645d]"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-md bg-emerald-600 text-[9px] font-bold text-white">
                  {step.n}
                </span>
                {step.label}
                {idx < 2 && <ChevronRight className="h-3 w-3 text-[#c5d4cb]" />}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileUpload(file);
        }}
      />

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: easeOut, delay: 0.04 }}
        className="overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        {hasUploadedFile && manuscript ? (
          <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-800">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#0f2c20]">
                  {manuscript.fileName || "Uploaded_Research_Paper.pdf"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#6d7f76]">
                  <span className="font-mono font-semibold text-[#0f2c20]">
                    {formatFileSize(manuscript.fileSize)}
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-emerald-800">Saved</span>
                  {manuscript.uploadedAt && (
                    <>
                      <span>·</span>
                      <span suppressHydrationWarning>
                        {new Date(manuscript.uploadedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "UTC",
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href={fileViewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#52645d] transition hover:border-emerald-300"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-700" />
                View
              </a>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2c20] px-3 py-1.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-[#1e5c44] disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Replace
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={onRemove}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              onDraggingChange(true);
            }}
            onDragLeave={() => onDraggingChange(false)}
            onDrop={(e) => {
              e.preventDefault();
              onDraggingChange(false);
              const file = e.dataTransfer.files?.[0];
              if (file) onFileUpload(file);
            }}
            className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-[#d7e4dc] bg-[#f8fbf9] hover:border-emerald-400"
            }`}
          >
            <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <FileUp className="h-6 w-6" />
              )}
            </span>
            <p className="text-sm font-semibold text-[#0f2c20]">
              {isUploading ? "Uploading manuscript…" : "Drop research paper here"}
            </p>
            <p className="mt-1 text-[11px] text-[#6d7f76]">
              <span className="font-semibold text-[#0f2c20]">PDF</span> or{" "}
              <span className="font-semibold text-[#0f2c20]">DOCX</span> · max 25 MB
            </p>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0f2c20] px-4 py-2 text-[11px] font-semibold text-emerald-100 transition hover:bg-[#1e5c44] disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Browse files
            </button>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-4 border-t border-[#eef2ef] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-[#0f2c20]">
              {isCompletedProject
                ? "Research completed"
                : revisionsRequiredSpecialties.length > 0
                  ? "Resubmit revised dossier"
                  : hasSubmittedDossier
                    ? "Under professional review"
                    : "Submit for professional review"}
            </h4>
            <p className="mt-0.5 text-[11px] text-[#6d7f76]">
              {isCompletedProject
                ? "All specialty approvals received · project locked."
                : revisionsRequiredSpecialties.length > 0
                  ? `Revisions requested by ${revisionsRequiredSpecialties.join(", ")}.`
                  : hasSubmittedDossier
                    ? "Track approvals in Professional Approval & Completion."
                    : "Summary + manuscript required before submit."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasSubmittedDossier && (
              <Link
                href={`/researcher/projects/${projectId}/completion`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-[#f6f8f6] px-3.5 py-2 text-[11px] font-semibold text-[#0f2c20] transition hover:bg-white"
              >
                <Award className="h-3.5 w-3.5 text-emerald-700" />
                Approval status
              </Link>
            )}
            {!isCompletedProject && !isAlreadyUnderReview && !isAlreadyApproved && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmitNow || isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-bold text-[#091a13] shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {hasSubmittedDossier ? "Resubmit" : "Submit for review"}
              </button>
            )}
          </div>
        </div>

        {submissionHistory.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-[#eef2ef] pt-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6d7f76]">
                Submission history
              </h4>
              <Link
                href={`/researcher/projects/${projectId}/revisions`}
                className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950"
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
                    <span className="text-[#8aa094]">·</span>
                    <span className="text-[#52645d]">{sub.status}</span>
                  </div>
                  <span suppressHydrationWarning className="font-mono text-[10px] text-[#8aa094]">
                    {new Date(sub.submittedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "UTC",
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
