"use client";

import React, { useState } from "react";
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
  FileText,
  ChevronDown,
} from "lucide-react";
import type { CompiledResearchOverview } from "@/lib/manuscript-upload-service";

interface Props {
  projectId: number;
  compiledOverview: CompiledResearchOverview;
  executiveSummary: string;
  findingsParagraphs: string[];
  limitationsParagraphs: string[];
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function qcTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("pass")) return "text-emerald-800 bg-emerald-50 border-emerald-200";
  if (s.includes("fail") || s.includes("reject")) return "text-rose-800 bg-rose-50 border-rose-200";
  if (s.includes("test") || s.includes("pending") || s.includes("simulat") || s.includes("prelim")) {
    return "text-amber-800 bg-amber-50 border-amber-200";
  }
  return "text-slate-600 bg-slate-50 border-slate-200";
}

export default function ReviewerResearchSummaryStep1({
  compiledOverview,
  executiveSummary,
  findingsParagraphs,
  limitationsParagraphs,
}: Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const hasInterpretation =
    findingsParagraphs.length > 0 || limitationsParagraphs.length > 0;
  const [interpretationOpen, setInterpretationOpen] = useState(false);

  const fade = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-5">
      {/* Compact 5-category overview — mirrors researcher Section 3 Step 1 */}
      <motion.section
        {...fade}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3.5 sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-[#071930]">Research Overview</h2>
            <p className="text-[11px] text-slate-500">
              Latest records from Sections 1 &amp; 2 · read-only
            </p>
          </div>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Section 3 · Step 1/2
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <Leaf className="h-3.5 w-3.5" />
              Botanical Information
            </div>
            <p className="text-sm font-semibold leading-snug text-[#071930]">
              {compiledOverview.plant.commonName || "Not recorded"}
            </p>
            <p className="mt-0.5 text-[11px] italic text-slate-500">
              {compiledOverview.plant.scientificName || "Scientific name unavailable"}
            </p>
            <p className="mt-2 text-[11px] text-slate-600">
              {compiledOverview.plant.partsStudied || "Plant part not recorded"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <FlaskConical className="h-3.5 w-3.5" />
              Formulation
            </div>
            <p className="text-sm font-semibold leading-snug text-[#071930]">
              {compiledOverview.formulation.dosageForm || "Not recorded"}
            </p>
            <p className="mt-2 text-[11px] text-slate-600">
              {`${compiledOverview.formulation.componentsCount} ingredient${
                compiledOverview.formulation.componentsCount === 1 ? "" : "s"
              }`}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <Beaker className="h-3.5 w-3.5" />
              Batch Analysis &amp; QC
            </div>
            <p className="text-sm font-semibold leading-snug text-[#071930]">
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

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <Cpu className="h-3.5 w-3.5" />
              In-Silico Screening
            </div>
            <p className="text-sm font-semibold leading-snug text-[#071930]">
              {`${compiledOverview.screening.screenedCount} compound${
                compiledOverview.screening.screenedCount === 1 ? "" : "s"
              } screened`}
            </p>
            <p className="mt-2 truncate text-[11px] text-slate-600">
              {compiledOverview.screening.compoundNames[0] ||
                compiledOverview.screening.screeningStatus}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <Activity className="h-3.5 w-3.5" />
              Molecular Docking
            </div>
            <p className="text-sm font-semibold leading-snug text-[#071930]">
              {`${compiledOverview.docking.completedRunsCount} completed run${
                compiledOverview.docking.completedRunsCount === 1 ? "" : "s"
              }`}
            </p>
            {compiledOverview.docking.bestComplex ? (
              <p className="mt-2 font-mono text-[11px] font-semibold text-[#071930]">
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
      </motion.section>

      {/* Collapsible interpretation */}
      <motion.section
        {...fade}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut, delay: reduceMotion ? 0 : 0.04 }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <button
          type="button"
          onClick={() => setInterpretationOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 px-4 py-3 text-left sm:px-5"
          aria-expanded={interpretationOpen}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-[#071930]">Scientific Interpretation</h3>
              <span className="text-[10px] font-medium text-slate-500">Section 2 · Step 7</span>
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

        <AnimatePresence initial={false}>
          {interpretationOpen && (
            <motion.div
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.22 }}
              className="overflow-hidden border-t border-slate-200"
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
                              className="whitespace-pre-line text-[12px] leading-relaxed text-slate-700"
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-slate-400">No findings saved yet.</p>
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
                              className="whitespace-pre-line text-[12px] leading-relaxed text-slate-700"
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
                  <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <p className="text-xs text-slate-600">
                      No computational interpretation was saved in Section 2 Step 7.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Compiled dossier — read-only */}
      <motion.section
        {...fade}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut, delay: reduceMotion ? 0 : 0.06 }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#071930] text-white">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-[#071930]">Compiled Research Summary</h3>
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  Read-only
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Seven-section scientific dossier saved by the researcher
              </p>
            </div>
          </div>
        </div>
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-1.5 text-[10px] text-slate-500 sm:px-5">
          1 Botanical · 2 Formulation · 3 Batch/QC · 4 Screening · 5 Docking · 6 Findings · 7
          Limitations
          <span className="float-right font-mono">{executiveSummary.length} chars</span>
        </div>
        <pre className="min-h-[320px] whitespace-pre-wrap px-5 py-5 font-serif text-[15px] leading-[1.75] text-slate-800 sm:px-7 sm:py-6">
          {executiveSummary.trim() || "No compiled research summary has been saved yet."}
        </pre>
      </motion.section>
    </div>
  );
}
