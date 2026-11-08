"use client";

import React from "react";
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
  findingsParagraphs: string[];
  limitationsParagraphs: string[];
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function qcTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("pass")) return "text-emerald-800 bg-emerald-50 border-emerald-200";
  if (s.includes("fail") || s.includes("reject")) return "text-rose-800 bg-rose-50 border-rose-200";
  if (s.includes("simulat") || s.includes("prelim")) return "text-amber-800 bg-amber-50 border-amber-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
}

export default function ReviewerResearchSummaryStep1({
  projectId,
  compiledOverview,
  executiveSummary,
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
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(7,25,48,0.04)]"
      >
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
            <FileText className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#071930]">Dossier Overview</span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            Sections 1 &amp; 2
          </span>
        </div>
        <span className="text-[10px] font-medium text-slate-400">
          Review cards · read-only summary
        </span>
      </motion.div>

      {/* Context + micro steps */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-[linear-gradient(165deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_1px_2px_rgba(7,25,48,0.04)]"
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#071930] via-blue-500 to-sky-300" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
              <Leaf className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#071930]">
                {compiledOverview.plant.commonName}
                {compiledOverview.plant.scientificName ? (
                  <span className="ml-1.5 text-[12px] font-normal italic text-slate-500">
                    {compiledOverview.plant.scientificName}
                  </span>
                ) : null}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Compact research overview · compiled dossier summary
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Scan overview" },
              { n: "2", label: "Check AI notes" },
              { n: "3", label: "Inspect summary" },
            ].map((step, idx) => (
              <span
                key={step.n}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-md bg-blue-600 text-[9px] font-bold text-white">
                  {step.n}
                </span>
                {step.label}
                {idx < 2 && <ChevronRight className="h-3 w-3 text-slate-300" />}
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
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(7,25,48,0.04)]">
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
          <p className="text-sm font-semibold leading-snug text-[#071930]">
            {compiledOverview.plant.commonName}
          </p>
          {compiledOverview.plant.scientificName && (
            <p className="mt-0.5 text-[11px] italic text-slate-500">
              {compiledOverview.plant.scientificName}
              {compiledOverview.plant.family ? ` · ${compiledOverview.plant.family}` : ""}
            </p>
          )}
          <div className="mt-3 flex items-start gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600">
            <Droplets className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
            <span className="leading-snug">
              {compiledOverview.plant.extractionMethod}
              {compiledOverview.plant.extractionSolvent
                ? ` (${compiledOverview.plant.extractionSolvent})`
                : ""}
            </span>
          </div>
        </div>

        {/* Formulation */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(7,25,48,0.04)]">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                <FlaskConical className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Formulation
              </span>
            </div>
            <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-900">
              {compiledOverview.formulation.componentsCount} ing.
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug text-[#071930]">
            {compiledOverview.formulation.dosageForm}
          </p>
          {compiledOverview.formulation.formulationName &&
            compiledOverview.formulation.formulationName !==
              compiledOverview.formulation.dosageForm && (
              <p className="mt-0.5 text-[11px] text-slate-500">
                {compiledOverview.formulation.formulationName}
              </p>
            )}
          <div className="mt-2.5 flex flex-wrap gap-1">
            {compiledOverview.formulation.ingredientsList.length > 0 ? (
              compiledOverview.formulation.ingredientsList.slice(0, 8).map((ing, i) => (
                <span
                  key={`${ing.name}-${i}`}
                  className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-[#071930]"
                >
                  {ing.name}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400">None recorded</span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-[11px]">
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
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(7,25,48,0.04)]">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
                <Cpu className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                Screening
              </span>
            </div>
            <span className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-900">
              {compiledOverview.screening.totalCompounds} cmpds
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug text-[#071930]">
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
                  className="rounded-md border border-sky-200/80 bg-sky-50/70 px-1.5 py-0.5 text-[10px] font-medium text-sky-950"
                >
                  {name}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400">None selected</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] text-slate-400">
            <span>Engine</span>
            <span className="font-semibold text-sky-800">RDKit + QSAR</span>
          </div>
        </div>

        {/* Docking */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(7,25,48,0.04)]">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                <Activity className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Docking
              </span>
            </div>
            <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-900">
              {compiledOverview.docking.targetsCount} targets
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug text-[#071930]">
            {compiledOverview.docking.completedRunsCount} completed runs
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {compiledOverview.docking.targetNames.length > 0 ? (
              compiledOverview.docking.targetNames.map((tName) => (
                <span
                  key={tName}
                  className="inline-flex max-w-full items-center gap-1 truncate rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-[#071930]"
                >
                  <Target className="h-2.5 w-2.5 shrink-0 text-blue-700" />
                  <span className="truncate">{tName}</span>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400">None</span>
            )}
          </div>
          <div className="mt-3 rounded-xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 to-sky-50/70 p-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-blue-800">
                  <Zap className="h-2.5 w-2.5" />
                  Best affinity
                </span>
                {compiledOverview.docking.bestComplex ? (
                  <p className="mt-0.5 text-[11px] font-medium leading-snug text-[#071930]">
                    {compiledOverview.docking.bestComplex.ligandName} ×{" "}
                    {compiledOverview.docking.bestComplex.pdbId}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[11px] text-slate-400">Pending</p>
                )}
              </div>
              {compiledOverview.docking.bestComplex && (
                <span className="shrink-0 rounded-lg bg-[#071930] px-2 py-1 font-mono text-[11px] font-bold text-blue-100">
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
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[#071930]">Scientific Interpretation</h3>
              <p className="text-[11px] text-slate-400">From Section 2 · Step 8</p>
            </div>
          </div>
          <Link
            href={`/reviewer/projects/${projectId}?tab=section2&step=8`}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-900"
          >
            View in Section 2
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {hasInterpretation ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(7,25,48,0.04)]">
              <div className="mb-2.5 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-sky-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                  Findings
                </span>
              </div>
              {findingsParagraphs.length > 0 ? (
                <div className="space-y-2 border-l-2 border-sky-400 pl-3">
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
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(7,25,48,0.04)]">
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
                      className="whitespace-pre-line text-[12px] leading-relaxed text-slate-700"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] italic text-slate-400">No limitations saved yet.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-[#071930]">No AI interpretation saved</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Researcher has not generated findings in Section 2 Step 8 yet.
                </p>
              </div>
            </div>
            <Link
              href={`/reviewer/projects/${projectId}?tab=section2&step=8`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-blue-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open Step 8
            </Link>
          </div>
        )}
      </motion.section>

      {/* Summary (read-only) */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: easeOut, delay: 0.08 }}
        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(7,25,48,0.04)]"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-[#071930]">Research Summary</h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Submitted
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Compiled from Sections 1 &amp; 2 · read-only
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-1.5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Compiled dossier
          </span>
          <span className="font-mono text-[10px]">{executiveSummary.length} chars</span>
        </div>
        <pre className="min-h-[320px] w-full whitespace-pre-wrap break-words bg-white p-4 text-sm leading-relaxed text-slate-800 sm:p-5">
          {executiveSummary.trim() ||
            "No research summary has been submitted for this dossier yet."}
        </pre>
      </motion.section>
    </div>
  );
}
