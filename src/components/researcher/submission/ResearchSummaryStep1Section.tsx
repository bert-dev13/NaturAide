"use client";

import React, { RefObject } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Leaf,
  FlaskConical,
  Cpu,
  Activity,
  Droplets,
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
  FileSpreadsheet,
  Target,
  Zap,
  ChevronRight,
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
  onRecompile: () => void;
  onSave: () => void;
  findingsParagraphs: string[];
  limitationsParagraphs: string[];
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function qcTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("pass")) return "text-emerald-800 bg-emerald-50 border-emerald-200";
  if (s.includes("fail") || s.includes("reject")) return "text-rose-800 bg-rose-50 border-rose-200";
  if (s.includes("simulat") || s.includes("prelim")) return "text-amber-800 bg-amber-50 border-amber-200";
  return "text-[#52645d] bg-[#f3f7f4] border-[#d7e4dc]";
}

export default function ResearchSummaryStep1Section({
  projectId,
  compiledOverview,
  executiveSummary,
  onSummaryChange,
  summaryTextareaRef,
  hasUnsavedSummaryEdits,
  isSaving,
  onRecompile,
  onSave,
  findingsParagraphs,
  limitationsParagraphs,
}: Props) {
  const hasInterpretation =
    findingsParagraphs.length > 0 || limitationsParagraphs.length > 0;

  return (
    <div className="space-y-4">
      {/* Status strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d7e4dc]/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6d7f76]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <FileText className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">Dossier Overview</span>
          <span className="rounded-md border border-[#d7e4dc] bg-[#f6f8f6] px-2 py-0.5 text-[10px] font-medium text-[#52645d]">
            Sections 1 &amp; 2
          </span>
        </div>
        <span className="text-[10px] font-medium text-[#8aa094]">
          Review cards · edit summary · save
        </span>
      </motion.div>

      {/* Context + micro steps */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-300" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Leaf className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#0f2c20]">
                {compiledOverview.plant.commonName}
                {compiledOverview.plant.scientificName ? (
                  <span className="ml-1.5 text-[12px] font-normal italic text-[#6d7f76]">
                    {compiledOverview.plant.scientificName}
                  </span>
                ) : null}
              </h2>
              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                Compact research overview · compiled dossier summary
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Scan overview" },
              { n: "2", label: "Check AI notes" },
              { n: "3", label: "Edit & save" },
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

      {/* Overview grid */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: easeOut, delay: 0.04 }}
        className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        {/* Botanical */}
        <div className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Leaf className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Botanical
              </span>
            </div>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
              {compiledOverview.plant.partsStudied || "Leaves"}
            </span>
          </div>
          <p className="text-sm font-semibold text-[#0f2c20] leading-snug">
            {compiledOverview.plant.commonName}
          </p>
          {compiledOverview.plant.scientificName && (
            <p className="mt-0.5 text-[11px] italic text-[#6d7f76]">
              {compiledOverview.plant.scientificName}
              {compiledOverview.plant.family ? ` · ${compiledOverview.plant.family}` : ""}
            </p>
          )}
          <div className="mt-3 flex items-start gap-1.5 border-t border-[#eef2ef] pt-2.5 text-[11px] text-[#52645d]">
            <Droplets className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
            <span className="leading-snug">
              {compiledOverview.plant.extractionMethod}
              {compiledOverview.plant.extractionSolvent
                ? ` (${compiledOverview.plant.extractionSolvent})`
                : ""}
            </span>
          </div>
        </div>

        {/* Formulation */}
        <div className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                <FlaskConical className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Formulation
              </span>
            </div>
            <span className="rounded-md border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-900">
              {compiledOverview.formulation.componentsCount} ing.
            </span>
          </div>
          <p className="text-sm font-semibold text-[#0f2c20] leading-snug">
            {compiledOverview.formulation.dosageForm}
          </p>
          {compiledOverview.formulation.formulationName &&
            compiledOverview.formulation.formulationName !==
              compiledOverview.formulation.dosageForm && (
              <p className="mt-0.5 text-[11px] text-[#6d7f76]">
                {compiledOverview.formulation.formulationName}
              </p>
            )}
          <div className="mt-2.5 flex flex-wrap gap-1">
            {compiledOverview.formulation.ingredientsList.length > 0 ? (
              compiledOverview.formulation.ingredientsList.slice(0, 8).map((ing, i) => (
                <span
                  key={`${ing.name}-${i}`}
                  className="rounded-md border border-[#d7e4dc] bg-[#f6f8f6] px-1.5 py-0.5 text-[10px] font-medium text-[#0f2c20]"
                >
                  {ing.name}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[#8aa094]">None recorded</span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-[#eef2ef] pt-2.5 text-[11px]">
            <Beaker className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${qcTone(
                compiledOverview.formulation.qcStatus
              )}`}
            >
              QC · {compiledOverview.formulation.qcStatus}
            </span>
          </div>
        </div>

        {/* Screening */}
        <div className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Cpu className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Screening
              </span>
            </div>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
              {compiledOverview.screening.totalCompounds} cmpds
            </span>
          </div>
          <p className="text-sm font-semibold text-[#0f2c20] leading-snug">
            {compiledOverview.screening.totalCompounds} phytochemicals
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            {compiledOverview.screening.screeningStatus}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {compiledOverview.screening.compoundNames.length > 0 ? (
              compiledOverview.screening.compoundNames.map((name) => (
                <span
                  key={name}
                  className="rounded-md border border-emerald-200/80 bg-emerald-50/70 px-1.5 py-0.5 text-[10px] font-medium text-emerald-950"
                >
                  {name}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[#8aa094]">None selected</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#eef2ef] pt-2.5 text-[10px] text-[#8aa094]">
            <span>Engine</span>
            <span className="font-semibold text-emerald-800">RDKit + QSAR</span>
          </div>
        </div>

        {/* Docking */}
        <div className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                <Activity className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Docking
              </span>
            </div>
            <span className="rounded-md border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-900">
              {compiledOverview.docking.targetsCount} targets
            </span>
          </div>
          <p className="text-sm font-semibold text-[#0f2c20] leading-snug">
            {compiledOverview.docking.completedRunsCount} completed runs
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {compiledOverview.docking.targetNames.length > 0 ? (
              compiledOverview.docking.targetNames.map((tName) => (
                <span
                  key={tName}
                  className="inline-flex max-w-full items-center gap-1 truncate rounded-md border border-[#d7e4dc] bg-[#f6f8f6] px-1.5 py-0.5 text-[10px] font-medium text-[#0f2c20]"
                >
                  <Target className="h-2.5 w-2.5 shrink-0 text-teal-700" />
                  <span className="truncate">{tName}</span>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[#8aa094]">None</span>
            )}
          </div>
          <div className="mt-3 rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 p-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-800">
                  <Zap className="h-2.5 w-2.5" />
                  Best affinity
                </span>
                {compiledOverview.docking.bestComplex ? (
                  <p className="mt-0.5 text-[11px] font-medium leading-snug text-[#0f2c20]">
                    {compiledOverview.docking.bestComplex.ligandName} ×{" "}
                    {compiledOverview.docking.bestComplex.pdbId}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[11px] text-[#8aa094]">Pending</p>
                )}
              </div>
              {compiledOverview.docking.bestComplex && (
                <span className="shrink-0 rounded-lg bg-[#0f2c20] px-2 py-1 font-mono text-[11px] font-bold text-emerald-100">
                  {compiledOverview.docking.bestComplex.affinityFormatted}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Scientific interpretation */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: easeOut, delay: 0.06 }}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[#0f2c20]">Scientific Interpretation</h3>
              <p className="text-[11px] text-[#8aa094]">From Section 2 · Step 8</p>
            </div>
          </div>
          <Link
            href={`/researcher/projects/${projectId}/in-silico?step=8`}
            className="inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#52645d] transition hover:border-emerald-300 hover:text-emerald-900"
          >
            Edit in Section 2
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {hasInterpretation ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
              <div className="mb-2.5 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                  Findings
                </span>
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
                <p className="text-[11px] italic text-[#8aa094]">No findings saved yet.</p>
              )}
            </div>
            <div className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
              <div className="mb-2.5 flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Limitations
                </span>
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
                <p className="text-[11px] italic text-[#8aa094]">No limitations saved yet.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[#d7e4dc] bg-[#f8fbf9] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#8aa094]" />
              <div>
                <p className="text-sm font-semibold text-[#0f2c20]">No AI interpretation saved</p>
                <p className="mt-0.5 text-[11px] text-[#6d7f76]">
                  Generate findings in Section 2 Step 8 to populate this block.
                </p>
              </div>
            </div>
            <Link
              href={`/researcher/projects/${projectId}/in-silico?step=8`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0f2c20] px-3 py-2 text-[11px] font-semibold text-emerald-100 transition hover:bg-[#1e5c44]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open Step 8
            </Link>
          </div>
        )}
      </motion.section>

      {/* Summary editor */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: easeOut, delay: 0.08 }}
        className="overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex flex-col gap-3 border-b border-[#eef2ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0f2c20]">Research Summary</h3>
                {hasUnsavedSummaryEdits ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    Unsaved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Saved
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8aa094]">Compiled from Sections 1 &amp; 2 · editable</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRecompile}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-[#f6f8f6] px-3 py-1.5 text-[11px] font-semibold text-[#52645d] transition hover:bg-white disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Recompile
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2c20] px-3.5 py-1.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-[#1e5c44] disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#eef2ef] bg-[#f8fbf9] px-4 py-1.5 text-[11px] text-[#8aa094]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Compiled dossier
          </span>
          <span className="font-mono text-[10px]">{executiveSummary.length} chars</span>
        </div>
        <textarea
          ref={summaryTextareaRef}
          value={executiveSummary}
          onChange={(e) => onSummaryChange(e.target.value)}
          rows={14}
          className="min-h-[320px] w-full resize-y bg-white p-4 text-sm leading-relaxed text-[#1a2e24] outline-none focus:bg-[#fcfdfc] sm:p-5"
          placeholder="Compiled research summary from Sections 1 and 2..."
        />
      </motion.section>
    </div>
  );
}
