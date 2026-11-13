// src/components/researcher/in-silico/InterpretationStep8Section.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Layers,
  Save,
  FlaskConical,
  Target,
  Activity,
  Trophy,
  BookOpen,
  ShieldAlert,
  ArrowRight,
  Box,
  Atom,
} from "lucide-react";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step8Props {
  projectId: number;
  plantName: string;
  compoundsCount: number;
  targetsCount: number;
  completedRunsCount: number;
  topRuns: DockingRunItem[];
  allRuns?: DockingRunItem[];
  isLoadingResults?: boolean;
  synthesisText: string;
  onSynthesisTextChange: (text: string) => void;
  limitationsText: string;
  onLimitationsTextChange: (text: string) => void;
  onSaveSynthesis: () => Promise<boolean>;
  isSaving: boolean;
  onProceedToSection3?: () => void;
  onSelectRunForVisuals?: (runId: number, targetStep: 5 | 6) => void;
  onDirtyChange?: (dirty: boolean) => void;
  /** Reviewer / read-only mode: hide generate/save/edit controls */
  readOnly?: boolean;
}

const ACTIVE_STATUSES = new Set([
  "QUEUED",
  "PREPARING",
  "DOCKING",
  "PROCESSING",
  "RUNNING",
]);

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#e8f0eb] ${className}`} aria-hidden />;
}

function formatAffinity(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(2);
}

export default function InterpretationStep8Section({
  projectId,
  plantName,
  compoundsCount,
  targetsCount,
  completedRunsCount,
  topRuns = [],
  allRuns = [],
  isLoadingResults = false,
  synthesisText,
  onSynthesisTextChange,
  limitationsText,
  onLimitationsTextChange,
  onSaveSynthesis,
  isSaving,
  onProceedToSection3,
  onSelectRunForVisuals,
  onDirtyChange,
  readOnly = false,
}: Step8Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<"idle" | "saved" | "error">("idle");

  const [savedFindings, setSavedFindings] = useState(synthesisText);
  const [savedLimitations, setSavedLimitations] = useState(limitationsText);
  const initializedBaseline = useRef(false);

  useEffect(() => {
    if (!initializedBaseline.current) {
      setSavedFindings(synthesisText);
      setSavedLimitations(limitationsText);
      initializedBaseline.current = true;
    }
  }, [synthesisText, limitationsText]);

  const isDirty =
    !readOnly &&
    (synthesisText !== savedFindings || limitationsText !== savedLimitations);

  useEffect(() => {
    if (readOnly) return;
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange, readOnly]);

  useEffect(() => {
    if (readOnly || !isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, readOnly]);

  const sortedTopRuns = useMemo(() => {
    return [...topRuns].sort(
      (a, b) => Number(a.bindingAffinity ?? 0) - Number(b.bindingAffinity ?? 0)
    );
  }, [topRuns]);

  const topLead = sortedTopRuns[0] || null;

  const processingRuns = useMemo(() => {
    const source = allRuns.length > 0 ? allRuns : topRuns;
    return source.filter((r) =>
      ACTIVE_STATUSES.has(String(r.jobStatus || "").toUpperCase())
    );
  }, [allRuns, topRuns]);

  const processingProgress = useMemo(() => {
    if (processingRuns.length === 0) return null;
    const withProgress = processingRuns.filter(
      (r) => typeof (r as any).progressPercent === "number"
    );
    if (withProgress.length === 0) return null;
    const avg =
      withProgress.reduce((sum, r) => sum + Number((r as any).progressPercent || 0), 0) /
      withProgress.length;
    return Math.round(Math.min(100, Math.max(0, avg)));
  }, [processingRuns]);

  const hasInterpretation =
    Boolean(synthesisText?.trim() || limitationsText?.trim());

  const fade = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
      };

  const runGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(null);
    setConfirmRegenerate(false);
    setSaveFeedback("idle");

    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-ai-interpretation" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Failed to generate AI interpretation. Please try again."
        );
      }

      const findings = data.computationalFindings || "";
      const limitations = data.computationalLimitations || "";
      onSynthesisTextChange(findings);
      onLimitationsTextChange(limitations);
      setSavedFindings(findings);
      setSavedLimitations(limitations);
      setGenerationSuccess(
        data.model
          ? `AI synthesis generated and saved (${data.model}).`
          : "AI synthesis generated and saved."
      );
    } catch (err: any) {
      setGenerationError(
        err?.message || "Failed to generate AI interpretation."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = () => {
    if (isGenerating || isSaving) return;
    const hasEdits =
      isDirty || Boolean(synthesisText?.trim() || limitationsText?.trim());
    if (hasEdits) {
      setConfirmRegenerate(true);
      return;
    }
    void runGenerate();
  };

  const handleSave = async () => {
    setSaveFeedback("idle");
    setGenerationError(null);
    const ok = await onSaveSynthesis();
    if (ok) {
      setSavedFindings(synthesisText);
      setSavedLimitations(limitationsText);
      setSaveFeedback("saved");
      setTimeout(() => setSaveFeedback("idle"), 2500);
    } else {
      setSaveFeedback("error");
    }
  };

  const handleProceed = () => {
    if (!onProceedToSection3) return;
    if (isDirty) {
      const leave = window.confirm(
        "You have unsaved interpretation edits. Leave without saving?"
      );
      if (!leave) return;
    }
    onProceedToSection3();
  };

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white">
        <div className="border-b border-[#d7e4dc] bg-gradient-to-r from-[#f4faf6] via-white to-[#eef6f1] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a5c3a] text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-[#c5ddd0] bg-[#e8f0eb] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1a5c3a]">
                    Section 2 · Step 7/7
                  </span>
                  {plantName && (
                    <span className="text-xs font-medium text-slate-600">{plantName}</span>
                  )}
                  {readOnly ? (
                    <span className="rounded-md border border-[#c5ddd0] bg-[#f4faf6] px-2 py-0.5 text-[10px] font-semibold text-[#1a5c3a]">
                      Read-only review
                    </span>
                  ) : isDirty ? (
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Unsaved edits
                    </span>
                  ) : hasInterpretation ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Synced with Section 3 on save
                    </span>
                  ) : null}
                </div>
                <h2 className="text-lg font-bold tracking-tight text-[#0f2c20] sm:text-xl">
                  Results &amp; Interpretation
                </h2>
                <p className="max-w-2xl text-sm text-slate-600">
                  {readOnly
                    ? "Read-only review of the researcher’s computational synthesis."
                    : "Review computational metrics, edit the scientific synthesis, and save for Section 3."}
                </p>
              </div>
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={handleGenerateClick}
                disabled={isGenerating || isSaving}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#c5ddd0] bg-white px-3.5 py-2 text-xs font-semibold text-[#1a5c3a] transition hover:bg-[#f4faf6] disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : hasInterpretation ? (
                  <RotateCcw className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isGenerating
                  ? "Generating…"
                  : hasInterpretation
                    ? "Regenerate AI Synthesis"
                    : "Generate AI Synthesis"}
              </button>
            )}
          </div>
        </div>

        {/* Metric cards */}
        <div className="p-5 sm:p-6">
          {isLoadingResults ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonBlock key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a5c3a]">
                    Compounds Screened
                  </span>
                  <FlaskConical className="h-4 w-4 text-[#3d7a5a]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-[#0f2c20]">
                    {compoundsCount}
                  </span>
                  <span className="text-xs text-slate-500">compounds</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  From project screening records
                </p>
              </div>

              <div className="rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a5c3a]">
                    Target Receptors
                  </span>
                  <Target className="h-4 w-4 text-[#3d7a5a]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-[#0f2c20]">
                    {targetsCount}
                  </span>
                  <span className="text-xs text-slate-500">receptors</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Selected PDB structures</p>
              </div>

              <div className="rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a5c3a]">
                    Completed Docking Runs
                  </span>
                  <Activity className="h-4 w-4 text-[#3d7a5a]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-[#0f2c20]">
                    {completedRunsCount}
                  </span>
                  <span className="text-xs text-slate-500">runs</span>
                </div>
                {processingRuns.length > 0 ? (
                  <p className="mt-1 text-[11px] font-medium text-sky-700">
                    {processingRuns.length} processing
                    {processingProgress !== null ? ` · ${processingProgress}%` : ""}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-500">
                    With predicted binding affinities
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a5c3a]">
                    Best Predicted Binding Affinity
                  </span>
                  <Trophy className="h-4 w-4 text-[#3d7a5a]" />
                </div>
                {topLead?.bindingAffinity != null ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-2xl font-bold text-[#0f2c20]">
                        {formatAffinity(topLead.bindingAffinity)}
                      </span>
                      <span className="text-xs font-semibold text-[#1a5c3a]">kcal/mol</span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {topLead.ligandName} × {topLead.pdbId}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-xl font-bold text-slate-400">N/A</span>
                    <p className="mt-1 text-[11px] text-slate-500">
                      No completed docking scores yet
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leading complexes */}
      <div className="overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white">
        <div className="flex flex-col gap-1 border-b border-[#d7e4dc] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f2c20]">
            <Layers className="h-4 w-4 text-[#1a5c3a]" />
            Leading Computational Complexes
          </h3>
          <span className="text-[11px] text-slate-500">
            Ranked by predicted binding affinity (kcal/mol)
          </span>
        </div>

        {isLoadingResults ? (
          <div className="space-y-2 p-5">
            <SkeletonBlock className="h-10" />
            <SkeletonBlock className="h-10" />
            <SkeletonBlock className="h-10" />
          </div>
        ) : sortedTopRuns.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            No completed docking complexes with predicted affinities are available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#d7e4dc] bg-[#f8fbf9] text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Compound</th>
                  <th className="px-4 py-3">Target Protein</th>
                  <th className="px-4 py-3 whitespace-nowrap">PDB ID</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">
                    Predicted Vina Score
                  </th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8f0eb]">
                {sortedTopRuns.slice(0, 10).map((r, idx) => (
                  <tr
                    key={r.id || idx}
                    className={idx === 0 ? "bg-[#f4faf6]" : "hover:bg-[#f8fbf9]"}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          idx === 0
                            ? "bg-[#1a5c3a] text-white"
                            : "bg-[#e8f0eb] text-[#1a5c3a]"
                        }`}
                      >
                        {idx === 0 && <Trophy className="h-3 w-3" />}#{idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#0f2c20]">
                      {r.ligandName}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.targetProtein}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded bg-[#0f2c20] px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-100">
                        {r.pdbId}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-sm font-bold text-[#0f2c20]">
                      {formatAffinity(r.bindingAffinity)}{" "}
                      <span className="text-[10px] font-semibold text-slate-500">
                        kcal/mol
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {onSelectRunForVisuals && r.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectRunForVisuals(r.id, 5)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#c5ddd0] bg-white px-2 py-1 text-[10px] font-semibold text-[#1a5c3a] transition hover:bg-[#f4faf6]"
                            title="Open 2D interaction view"
                          >
                            <Atom className="h-3 w-3" />
                            2D
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectRunForVisuals(r.id, 6)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#c5ddd0] bg-white px-2 py-1 text-[10px] font-semibold text-[#1a5c3a] transition hover:bg-[#f4faf6]"
                            title="Open 3D visualization"
                          >
                            <Box className="h-3 w-3" />
                            3D
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm regenerate */}
      <AnimatePresence>
        {!readOnly && confirmRegenerate && (
          <motion.div
            {...fade}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5 text-sm text-amber-950">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div>
                  <p className="font-semibold">Replace current interpretation?</p>
                  <p className="text-xs text-amber-800">
                    Regenerating will overwrite the editable findings and limitations with a new
                    AI synthesis grounded in this project&apos;s records.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmRegenerate(false)}
                  className="rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void runGenerate()}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-800 px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Replace &amp; Regenerate
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generation loading */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            {...fade}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#c5ddd0] bg-white px-6 py-10 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c5ddd0] bg-[#f4faf6]">
              <Loader2
                className={`h-6 w-6 text-[#1a5c3a] ${reduceMotion ? "" : "animate-spin"}`}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0f2c20]">
                Generating scientific synthesis…
              </p>
              <p className="text-xs text-slate-500">
                Using this project&apos;s compounds, screening records, targets, and docking scores.
              </p>
            </div>
            <div
              className={`h-1 w-48 overflow-hidden rounded-full bg-[#e8f0eb] ${
                reduceMotion ? "" : ""
              }`}
            >
              <div
                className={`h-full w-1/2 rounded-full bg-[#1a5c3a] ${
                  reduceMotion ? "" : "animate-pulse"
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback banners */}
      <AnimatePresence>
        {generationError && !isGenerating && (
          <motion.div
            {...fade}
            className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div>
                <span className="font-bold">Generation failed</span>
                <p>{generationError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(generationSuccess || saveFeedback === "saved") && !isGenerating && (
          <motion.div
            {...fade}
            className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              {saveFeedback === "saved"
                ? "Interpretation saved and synchronized with Section 3."
                : generationSuccess}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scientific Interpretation Editor — primary focus */}
      {!isGenerating && (
        <div className="overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white">
          <div className="border-b border-[#d7e4dc] px-5 py-3.5 sm:px-6">
            <h3 className="text-sm font-bold text-[#0f2c20]">
              {readOnly ? "Scientific Interpretation" : "Scientific Interpretation Editor"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {readOnly
                ? "Researcher-saved synthesis grounded in project screening and docking records."
                : "Editable by the researcher. AI content is a starting draft grounded in project records."}
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {!hasInterpretation && (
              <div className="rounded-xl border border-dashed border-[#c5ddd0] bg-[#f8fbf9] px-4 py-6 text-center">
                <Sparkles className="mx-auto mb-2 h-5 w-5 text-[#1a5c3a]" />
                <p className="text-sm font-semibold text-[#0f2c20]">
                  No interpretation yet
                </p>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                  {readOnly
                    ? "The researcher has not saved a computational interpretation for this project."
                    : "Generate an AI synthesis from this project’s screening and docking data, or write your own findings and limitations below."}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0f2c20]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8f0eb] text-[#1a5c3a]">
                  <BookOpen className="h-3.5 w-3.5" />
                </span>
                A. Computational Findings &amp; Interpretation
              </label>
              <textarea
                rows={10}
                value={synthesisText}
                onChange={(e) => {
                  if (readOnly) return;
                  onSynthesisTextChange(e.target.value);
                  setGenerationSuccess(null);
                }}
                readOnly={readOnly}
                disabled={!readOnly && isSaving}
                className={`w-full resize-y rounded-xl border border-[#c5ddd0] p-4 text-sm leading-relaxed text-[#0f2c20] shadow-none outline-hidden transition focus:border-[#1a5c3a] focus:ring-2 focus:ring-[#1a5c3a]/15 disabled:opacity-60 ${
                  readOnly ? "bg-[#f8fbf9]" : "bg-white"
                }`}
                placeholder="Describe computational findings based on screened compounds, selected targets, docking scores, and available interaction results…"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0f2c20]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <ShieldAlert className="h-3.5 w-3.5" />
                </span>
                B. Computational Limitations &amp; Required Validation
              </label>
              <textarea
                rows={7}
                value={limitationsText}
                onChange={(e) => {
                  if (readOnly) return;
                  onLimitationsTextChange(e.target.value);
                  setGenerationSuccess(null);
                }}
                readOnly={readOnly}
                disabled={!readOnly && isSaving}
                className={`w-full resize-y rounded-xl border border-[#c5ddd0] p-4 text-sm leading-relaxed text-[#0f2c20] shadow-none outline-hidden transition focus:border-[#1a5c3a] focus:ring-2 focus:ring-[#1a5c3a]/15 disabled:opacity-60 ${
                  readOnly ? "bg-[#f8fbf9]" : "bg-white"
                }`}
                placeholder="Document methodological limitations and experimental validation required before biological conclusions…"
              />
            </div>

            {!readOnly && (
              <div className="flex flex-col gap-3 rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-600">
                  Predicted docking scores are computational estimates only—not experimental proof of
                  therapeutic effect. Saving updates MySQL and Section 3.
                </p>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || isGenerating || !hasInterpretation}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a5c3a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#154e31] disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Interpretation
                  </button>
                  {onProceedToSection3 && (
                    <button
                      type="button"
                      onClick={handleProceed}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#c5ddd0] bg-white px-4 py-2 text-xs font-semibold text-[#1a5c3a] transition hover:bg-white"
                    >
                      Proceed to Section 3 · Paper Submission
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
