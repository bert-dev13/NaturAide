"use client";

import React, { RefObject, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Leaf,
  FlaskConical,
  Cpu,
  Activity,
  Beaker,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  ArrowUpRight,
  FileText,
  RefreshCw,
  Save,
  Loader2,
  ChevronDown,
} from "lucide-react";
import type { CompiledResearchOverview } from "@/lib/manuscript-upload-service";

interface Props {
  projectId: number;
  compiledOverview: CompiledResearchOverview;
  executiveSummary: string;
  onSummaryChange: (value: string) => void;
  summaryTextareaRef: RefObject<HTMLTextAreaElement | null>;
  hasUnsavedSummaryEdits: boolean;
  isSaving: boolean;
  isRecompiling?: boolean;
  isLoadingOverview?: boolean;
  onRecompile: () => void;
  onSave: () => void;
  findingsParagraphs: string[];
  limitationsParagraphs: string[];
  updatedSectionLabels?: string[];
  lastCompiledAt?: string | null;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function qcTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("pass")) return "text-emerald-800 bg-emerald-50 border-emerald-200";
  if (s.includes("fail") || s.includes("reject")) return "text-rose-800 bg-rose-50 border-rose-200";
  if (s.includes("test") || s.includes("pending") || s.includes("simulat") || s.includes("prelim")) {
    return "text-amber-800 bg-amber-50 border-amber-200";
  }
  return "text-[#52645d] bg-[#f3f7f4] border-[#d7e4dc]";
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#e8f0eb] ${className}`} aria-hidden />;
}

export default function ResearchSummaryStep1Section({
  projectId,
  compiledOverview,
  executiveSummary,
  onSummaryChange,
  summaryTextareaRef,
  hasUnsavedSummaryEdits,
  isSaving,
  isRecompiling = false,
  isLoadingOverview = false,
  onRecompile,
  onSave,
  findingsParagraphs,
  limitationsParagraphs,
  updatedSectionLabels = [],
  lastCompiledAt = null,
}: Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const hasInterpretation =
    findingsParagraphs.length > 0 || limitationsParagraphs.length > 0;
  const [interpretationOpen, setInterpretationOpen] = useState(false);

  const fade = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
      };

  const overviewBusy = isLoadingOverview || isRecompiling;

  return (
    <div className="space-y-5">
      {/* Compact research overview — 5 categories */}
      <motion.section
        {...fade}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut }}
        className="overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d7e4dc] px-5 py-3.5 sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-[#0f2c20]">Research Overview</h2>
            <p className="text-[11px] text-slate-500">
              Latest records from Sections 1 &amp; 2
              {lastCompiledAt
                ? ` · refreshed ${new Date(lastCompiledAt).toLocaleString()}`
                : ""}
            </p>
          </div>
          <span className="rounded-md border border-[#c5ddd0] bg-[#f4faf6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1a5c3a]">
            Section 3 · Step 1/2
          </span>
        </div>

        <div className="p-4 sm:p-5">
          {overviewBusy ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonBlock key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] p-3.5">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1a5c3a]">
                  <Leaf className="h-3.5 w-3.5" />
                  Botanical Information
                </div>
                <p className="text-sm font-semibold text-[#0f2c20] leading-snug">
                  {compiledOverview.plant.commonName || "Not recorded"}
                </p>
                <p className="mt-0.5 text-[11px] italic text-slate-500">
                  {compiledOverview.plant.scientificName || "Scientific name unavailable"}
                </p>
                <p className="mt-2 text-[11px] text-slate-600">
                  {compiledOverview.plant.partsStudied || "Plant part not recorded"}
                </p>
              </div>

              <div className="rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] p-3.5">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1a5c3a]">
                  <FlaskConical className="h-3.5 w-3.5" />
                  Formulation
                </div>
                <p className="text-sm font-semibold text-[#0f2c20] leading-snug">
                  {compiledOverview.formulation.dosageForm || "Not recorded"}
                </p>
                <p className="mt-2 text-[11px] text-slate-600">
                  {`${compiledOverview.formulation.componentsCount} ingredient${
                    compiledOverview.formulation.componentsCount === 1 ? "" : "s"
                  }`}
                </p>
              </div>

              <div className="rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] p-3.5">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1a5c3a]">
                  <Beaker className="h-3.5 w-3.5" />
                  Batch Analysis &amp; QC
                </div>
                <p className="text-sm font-semibold text-[#0f2c20] leading-snug">
                  {`${compiledOverview.formulation.batchesCount} recorded batch${
                    compiledOverview.formulation.batchesCount === 1 ? "" : "es"
                  }`}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${qcTone(
                    compiledOverview.formulation.qcStatus
                  )}`}
                >
                  {compiledOverview.formulation.qcStatus}
                </span>
              </div>

              <div className="rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] p-3.5">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1a5c3a]">
                  <Cpu className="h-3.5 w-3.5" />
                  In-Silico Screening
                </div>
                <p className="text-sm font-semibold text-[#0f2c20] leading-snug">
                  {`${compiledOverview.screening.screenedCount} compound${
                    compiledOverview.screening.screenedCount === 1 ? "" : "s"
                  } screened`}
                </p>
                <p className="mt-2 truncate text-[11px] text-slate-600">
                  {compiledOverview.screening.compoundNames[0] ||
                    compiledOverview.screening.screeningStatus}
                </p>
              </div>

              <div className="rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] p-3.5">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1a5c3a]">
                  <Activity className="h-3.5 w-3.5" />
                  Molecular Docking
                </div>
                <p className="text-sm font-semibold text-[#0f2c20] leading-snug">
                  {`${compiledOverview.docking.completedRunsCount} completed run${
                    compiledOverview.docking.completedRunsCount === 1 ? "" : "s"
                  }`}
                </p>
                {compiledOverview.docking.bestComplex ? (
                  <p className="mt-2 font-mono text-[11px] font-semibold text-[#0f2c20]">
                    {compiledOverview.docking.bestComplex.affinityFormatted}
                    <span className="mt-0.5 block truncate font-sans text-[10px] font-medium text-slate-500">
                      {compiledOverview.docking.bestComplex.ligandName} ×{" "}
                      {compiledOverview.docking.bestComplex.pdbId}
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">No scores recorded</p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Collapsible scientific interpretation */}
      <motion.section
        {...fade}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut, delay: reduceMotion ? 0 : 0.04 }}
        className="overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setInterpretationOpen((o) => !o)}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            aria-expanded={interpretationOpen}
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f0eb] text-[#1a5c3a]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0f2c20]">
                  Scientific Interpretation
                </h3>
                <span className="text-[10px] font-medium text-slate-500">
                  Section 2 · Step 7
                </span>
              </div>
              {!interpretationOpen && (
                <p className="truncate text-[11px] text-slate-500">
                  {hasInterpretation
                    ? "Computational findings & validation requirements"
                    : "No interpretation saved yet"}
                </p>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                interpretationOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          <Link
            href={`/researcher/projects/${projectId}/in-silico?step=7`}
            className="inline-flex items-center gap-1 rounded-xl border border-[#c5ddd0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#1a5c3a] transition hover:bg-[#f4faf6]"
          >
            Edit in Section 2
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <AnimatePresence initial={false}>
          {interpretationOpen && (
            <motion.div
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.22 }}
              className="overflow-hidden border-t border-[#d7e4dc]"
            >
              <div className="space-y-4 p-4 sm:p-5">
                {hasInterpretation ? (
                  <>
                    <div>
                      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800">
                        <Sparkles className="h-3 w-3" />
                        Computational Findings
                      </div>
                      {findingsParagraphs.length > 0 ? (
                        <div className="space-y-2 border-l-2 border-teal-400 pl-3">
                          {findingsParagraphs.map((para, i) => (
                            <p
                              key={i}
                              className="whitespace-pre-line text-[12px] leading-relaxed text-[#33443c]"
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-slate-400">
                          No findings saved yet.
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        <ShieldAlert className="h-3 w-3" />
                        Limitations &amp; Required Validation
                      </div>
                      {limitationsParagraphs.length > 0 ? (
                        <div className="space-y-2 border-l-2 border-amber-400 pl-3">
                          {limitationsParagraphs.map((para, i) => (
                            <p
                              key={i}
                              className="whitespace-pre-line text-[12px] leading-relaxed text-[#33443c]"
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-slate-400">
                          No limitations saved yet.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#c5ddd0] bg-[#f8fbf9] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <p className="text-xs text-slate-600">
                        Generate findings in Section 2 Step 7 to populate this review panel.
                      </p>
                    </div>
                    <Link
                      href={`/researcher/projects/${projectId}/in-silico?step=7`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0f2c20] px-3 py-2 text-[11px] font-semibold text-emerald-100"
                    >
                      Open Step 7
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Compiled dossier — primary focus */}
      <motion.section
        {...fade}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut, delay: reduceMotion ? 0 : 0.06 }}
        className="overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white"
      >
        <div className="flex flex-col gap-3 border-b border-[#d7e4dc] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a5c3a] text-white">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-[#0f2c20]">
                  Compiled Research Summary
                </h3>
                {hasUnsavedSummaryEdits ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    <span
                      className={`h-1.5 w-1.5 rounded-full bg-amber-500 ${
                        reduceMotion ? "" : "animate-pulse"
                      }`}
                    />
                    Unsaved changes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Saved
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Seven-section scientific dossier · editable by researcher
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRecompile}
              disabled={isSaving || isRecompiling}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#c5ddd0] bg-white px-3 py-2 text-[11px] font-semibold text-[#1a5c3a] transition hover:bg-[#f4faf6] disabled:opacity-50"
            >
              {isRecompiling ? (
                <Loader2
                  className={`h-3.5 w-3.5 ${reduceMotion ? "" : "animate-spin"}`}
                />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {isRecompiling ? "Recompiling…" : "Recompile"}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || isRecompiling || !executiveSummary.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a5c3a] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-[#154e31] disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2
                  className={`h-3.5 w-3.5 ${reduceMotion ? "" : "animate-spin"}`}
                />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {isSaving ? "Saving…" : "Save Summary"}
            </button>
          </div>
        </div>

        {updatedSectionLabels.length > 0 && (
          <div className="border-b border-emerald-100 bg-emerald-50/80 px-4 py-2.5 text-[11px] text-emerald-900 sm:px-5">
            <span className="font-semibold">Updated sections: </span>
            {updatedSectionLabels.join(" · ")}
          </div>
        )}

        {isRecompiling ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c5ddd0] bg-[#f4faf6]">
              <Loader2
                className={`h-6 w-6 text-[#1a5c3a] ${reduceMotion ? "" : "animate-spin"}`}
              />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f2c20]">
                Recompiling dossier from Sections 1 &amp; 2…
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Retrieving the latest plant, formulation, screening, docking, and interpretation records.
              </p>
            </div>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-[#e8f0eb]">
              <div
                className={`h-full w-1/2 rounded-full bg-[#1a5c3a] ${
                  reduceMotion ? "" : "animate-pulse"
                }`}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-[#eef2ef] bg-[#f8fbf9] px-4 py-1.5 text-[10px] text-slate-500 sm:px-5">
              <span className="font-medium">
                1 Botanical · 2 Formulation · 3 Batch/QC · 4 Screening · 5 Docking · 6 Findings · 7
                Limitations
              </span>
              <span className="float-right font-mono">{executiveSummary.length} chars</span>
            </div>
            <textarea
              ref={summaryTextareaRef}
              value={executiveSummary}
              onChange={(e) => onSummaryChange(e.target.value)}
              rows={18}
              disabled={isSaving}
              className="min-h-[420px] w-full resize-y bg-white px-5 py-5 font-serif text-[15px] leading-[1.75] text-[#1a2e24] outline-none focus:bg-[#fcfdfc] disabled:opacity-60 sm:px-7 sm:py-6"
              placeholder="Compiled research summary from Sections 1 and 2 will appear here…"
              spellCheck
            />
          </>
        )}
      </motion.section>
    </div>
  );
}
