// src/components/researcher/in-silico/InterpretationStep8Section.tsx
"use client";

import React, { useState } from "react";
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
  Cpu,
} from "lucide-react";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step8Props {
  projectId: number;
  plantName: string;
  compoundsCount: number;
  targetsCount: number;
  completedRunsCount: number;
  topRuns: DockingRunItem[];
  synthesisText: string;
  onSynthesisTextChange: (text: string) => void;
  limitationsText: string;
  onLimitationsTextChange: (text: string) => void;
  onSaveSynthesis: () => Promise<void>;
  isSaving: boolean;
  onProceedToSection3?: () => void;
}

export default function InterpretationStep8Section({
  projectId,
  plantName,
  compoundsCount,
  targetsCount,
  completedRunsCount,
  topRuns = [],
  synthesisText,
  onSynthesisTextChange,
  limitationsText,
  onLimitationsTextChange,
  onSaveSynthesis,
  isSaving,
  onProceedToSection3,
}: Step8Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [hasGeneratedOrRestored, setHasGeneratedOrRestored] = useState<boolean>(
    () => Boolean(synthesisText?.trim() || limitationsText?.trim())
  );

  // Sort completed runs by best (most negative) binding affinity
  const sortedTopRuns = React.useMemo(() => {
    return [...topRuns].sort(
      (a, b) => Number(a.bindingAffinity ?? 0) - Number(b.bindingAffinity ?? 0)
    );
  }, [topRuns]);

  const showInterpretationSections =
    hasGeneratedOrRestored || Boolean(synthesisText?.trim() || limitationsText?.trim());

  const handleGenerateAiInterpretation = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);

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

      onSynthesisTextChange(data.computationalFindings || "");
      onLimitationsTextChange(data.computationalLimitations || "");
      setHasGeneratedOrRestored(true);
    } catch (err: any) {
      setGenerationError(
        err?.message || "Failed to generate AI interpretation with Together AI."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const topLead = sortedTopRuns[0] || null;

  return (
    <div className="w-full space-y-5">
      {/* ===================================================================== */}
      {/* 1. ENHANCED HERO HEADER & SUMMARY METRICS CARD                        */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-teal-900/5 via-emerald-50/60 to-indigo-50/40 px-6 py-5 border-b border-slate-200/80">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-100/80 text-teal-800 border border-teal-200/70">
                    Section 2 • Step 08 of 08
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200/70">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    AI-Assisted Scientific Synthesis
                  </span>
                  {plantName && (
                    <span className="text-xs font-semibold text-slate-600">
                      • {plantName}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Results &amp; Scientific Interpretation
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Review your consolidated computational screening metrics, leading ligand–receptor complexes, and synthesize your scientific interpretation for Section 3.
                </p>
              </div>
            </div>

            {/* Header Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleGenerateAiInterpretation}
                disabled={isGenerating || isSaving}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer ${
                  showInterpretationSections
                    ? "border border-teal-300 bg-white hover:bg-teal-50 text-teal-800"
                    : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing with AI...</span>
                  </>
                ) : showInterpretationSections ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Regenerate AI Synthesis</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Interpretation</span>
                  </>
                )}
              </button>

              {showInterpretationSections && (
                <button
                  type="button"
                  onClick={onSaveSynthesis}
                  disabled={isSaving || isGenerating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? "Saving..." : "Save Interpretation"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. COLOR-CODED 4-CARD METRIC GRID                                   */}
        {/* =================================================================== */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Metric 1: Compounds Screened */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/20 border border-indigo-200/80 shadow-2xs flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                  Compounds Screened
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    {compoundsCount}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    phytochemicals
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  ADMET &amp; Lipinski evaluated
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <FlaskConical className="w-4 h-4" />
              </div>
            </div>

            {/* Metric 2: Target Receptors */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/70 via-white to-cyan-50/20 border border-cyan-200/80 shadow-2xs flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-800 block">
                  Target Receptors
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    {targetsCount}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    PDB structures
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Co-crystallized catalytic pockets
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
            </div>

            {/* Metric 3: Completed Docking Runs */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/30 border border-teal-200/80 shadow-2xs flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
                  Completed Docking Runs
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-teal-700 font-mono">
                    {completedRunsCount}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    simulations
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  AutoDock Vina v1.2.7 verified
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            {/* Metric 4: Top Predicted Score */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/20 border border-emerald-200/80 shadow-2xs flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Top Predicted Score
                </span>
                {topLead?.bindingAffinity != null ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold font-mono text-emerald-700">
                        {Number(topLead.bindingAffinity).toFixed(1)}
                      </span>
                      <span className="text-xs font-bold text-emerald-800">kcal/mol</span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      {topLead.ligandName} × {topLead.pdbId}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-xl font-extrabold text-slate-400 font-mono">N/A</span>
                    <p className="text-[11px] text-slate-500">Run docking in Step 4</p>
                  </>
                )}
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 3. LEADING COMPUTATIONAL COMPLEXES TABLE                          */}
          {/* ================================================================= */}
          {sortedTopRuns.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Leading Computational Complexes (Top {Math.min(5, sortedTopRuns.length)})
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Ranked by lowest free energy of binding (ΔG)
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200/90 rounded-xl shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-24">Rank</th>
                      <th className="py-3 px-4">Ligand Molecule</th>
                      <th className="py-3 px-4">Target Protein Receptor</th>
                      <th className="py-3 px-4 whitespace-nowrap">PDB ID</th>
                      <th className="py-3 px-4 whitespace-nowrap text-right">Predicted Vina Score</th>
                      <th className="py-3 px-4 whitespace-nowrap text-right">Binding Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sortedTopRuns.slice(0, 5).map((r, idx) => {
                      const score = Number(r.bindingAffinity ?? 0);
                      const isStrong = score <= -8.0;
                      const isFavorable = score > -8.0 && score <= -6.5;

                      return (
                        <tr
                          key={r.id || idx}
                          className={`transition-colors ${
                            idx === 0 ? "bg-emerald-50/30 hover:bg-emerald-50/50" : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                idx === 0
                                  ? "bg-amber-50 text-amber-900 border-amber-300"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {idx === 0 && <Trophy className="w-3 h-3 text-amber-600" />}
                              Rank #{idx + 1}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 bg-indigo-50/60 border border-indigo-200/60 px-2.5 py-1 rounded-lg">
                              <FlaskConical className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              {r.ligandName}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                              <Target className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                              {r.targetProtein}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-cyan-900 text-cyan-100 font-mono text-[11px] font-bold">
                              {r.pdbId}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg font-mono text-xs font-extrabold border ${
                                isStrong
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : isFavorable
                                  ? "bg-teal-50 text-teal-800 border-teal-200"
                                  : "bg-slate-100 text-slate-800 border-slate-200"
                              }`}
                            >
                              {Number(r.bindingAffinity).toFixed(1)} kcal/mol
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isStrong
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : isFavorable
                                  ? "bg-teal-50 text-teal-800 border-teal-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {isStrong
                                ? "Strong Target Affinity"
                                : isFavorable
                                ? "Favorable Binding"
                                : "Moderate Affinity"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. GENERATE AI INTERPRETATION CTA (WHEN EMPTY)                        */}
      {/* ===================================================================== */}
      {!showInterpretationSections && !isGenerating && (
        <div className="bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 rounded-2xl border border-teal-200/90 p-8 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-base font-bold text-slate-900">
              Synthesize Your In-Silico Findings with Together AI
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Generate a grounded scientific interpretation of your phytochemical screening, AutoDock Vina binding affinities, structure–activity relationships, and methodological limitations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateAiInterpretation}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate AI Interpretation</span>
          </button>
        </div>
      )}

      {/* Loading Animation while Together AI is processing */}
      {isGenerating && (
        <div className="bg-white rounded-2xl border border-teal-200 p-8 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">
              Generating AI scientific interpretation with Together AI...
            </p>
            <p className="text-xs text-slate-500">
              Analyzing your screened phytochemicals, target receptors, and AutoDock Vina binding affinities.
            </p>
          </div>
        </div>
      )}

      {/* Error State with Retry Option */}
      {generationError && !isGenerating && (
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">AI Interpretation Generation Failed</span>
              <span>{generationError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateAiInterpretation}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Generation</span>
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. EDITABLE AI-GENERATED SCIENTIFIC INTERPRETATION PANELS             */}
      {/* ===================================================================== */}
      {showInterpretationSections && !isGenerating && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Card Header Bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-teal-50/30 to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Scientific Interpretation Dossier
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Editable by researcher • Grounded in project screening &amp; docking data
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAiInterpretation}
                disabled={isGenerating || isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                <span>Regenerate</span>
              </button>
              <button
                type="button"
                onClick={onSaveSynthesis}
                disabled={isSaving || isGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Saving..." : "Save Interpretation"}</span>
              </button>
            </div>
          </div>

          {/* Two-Panel Interpretation Body */}
          <div className="p-6 space-y-5">
            {/* Panel 1: Computational Findings */}
            <div className="rounded-xl border border-teal-200/80 bg-gradient-to-b from-teal-50/30 to-white p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 text-xs sm:text-sm">
                      Computational Findings &amp; Target Binding Synthesis
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Mechanistic interpretation of ligand–receptor binding affinities, catalytic pocket interactions, and ADMET compatibility
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200/70 text-[10px] font-bold text-teal-800 uppercase tracking-wider shrink-0">
                  Primary Synthesis
                </span>
              </div>

              <textarea
                rows={7}
                value={synthesisText}
                onChange={(e) => onSynthesisTextChange(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 bg-white leading-relaxed text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden shadow-2xs"
                placeholder="Synthesize the findings from in-silico screening and molecular docking..."
              />
            </div>

            {/* Panel 2: Computational Limitations */}
            <div className="rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50/30 to-white p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 text-xs sm:text-sm">
                      Computational Limitations &amp; Verification Requirements
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Methodological boundaries of rigid/semi-flexible docking and required in-vitro / in-vivo bioassay validation
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/70 text-[10px] font-bold text-amber-800 uppercase tracking-wider shrink-0">
                  Scientific Rigor
                </span>
              </div>

              <textarea
                rows={5}
                value={limitationsText}
                onChange={(e) => onLimitationsTextChange(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 bg-white leading-relaxed text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden shadow-2xs"
                placeholder="Record prediction uncertainties, methodological limitations, and recommended laboratory validation..."
              />
            </div>

            {/* Synchronization Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-slate-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs leading-relaxed">
                  Saved interpretations are stored in MySQL and automatically synchronized into{" "}
                  <strong className="text-slate-900">Section 3: Research Paper &amp; Submission</strong>.
                </p>
              </div>

              {onProceedToSection3 && (
                <button
                  type="button"
                  onClick={onProceedToSection3}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <span>Proceed to Section 3</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
