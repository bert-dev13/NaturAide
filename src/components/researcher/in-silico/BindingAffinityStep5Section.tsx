// src/components/researcher/in-silico/BindingAffinityStep5Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Info,
  TrendingDown,
  ExternalLink,
  X,
  Leaf,
  ChevronRight,
  Compass,
  Box,
  Medal,
} from "lucide-react";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step5Props {
  projectId: number;
  plantName: string;
  runs: DockingRunItem[];
  onSelectRunForVisuals: (runId: number, targetStep: 6 | 7) => void;
}

function fitLabel(score: number) {
  if (score <= -8.0) return { label: "Strong", tone: "emerald" as const };
  if (score <= -6.5) return { label: "Good", tone: "teal" as const };
  if (score <= -5.0) return { label: "Moderate", tone: "amber" as const };
  return { label: "Weak", tone: "slate" as const };
}

function toneClasses(tone: "emerald" | "teal" | "amber" | "slate") {
  switch (tone) {
    case "emerald":
      return {
        pill: "border-emerald-200 bg-emerald-50 text-emerald-900",
        bar: "bg-emerald-600",
        score: "text-emerald-800",
      };
    case "teal":
      return {
        pill: "border-teal-200 bg-teal-50 text-teal-900",
        bar: "bg-teal-500",
        score: "text-teal-800",
      };
    case "amber":
      return {
        pill: "border-amber-200 bg-amber-50 text-amber-900",
        bar: "bg-amber-500",
        score: "text-amber-900",
      };
    default:
      return {
        pill: "border-[#d7e4dc] bg-[#f7faf8] text-[#52645d]",
        bar: "bg-[#8aa094]",
        score: "text-[#52645d]",
      };
  }
}

export default function BindingAffinityStep5Section({
  plantName,
  runs = [],
  onSelectRunForVisuals,
}: Step5Props) {
  const [selectedTarget, setSelectedTarget] = useState("ALL");
  const [selectedLigand, setSelectedLigand] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"best" | "worst" | "name">("best");
  const [inspectedRun, setInspectedRun] = useState<DockingRunItem | null>(null);

  // Dedupe ligand×PDB — keep strongest (most negative) score
  const uniqueCompleted = useMemo(() => {
    const scored = runs.filter(
      (r) => r.bindingAffinity !== null && r.bindingAffinity !== undefined
    );
    const map = new Map<string, DockingRunItem>();
    for (const r of scored) {
      const key = `${(r.ligandName || "").toLowerCase().trim()}::${String(r.pdbId || "").toUpperCase()}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...r, pdbId: String(r.pdbId || "").toUpperCase() });
        continue;
      }
      if (Number(r.bindingAffinity) < Number(existing.bindingAffinity)) {
        map.set(key, { ...r, pdbId: String(r.pdbId || "").toUpperCase() });
      }
    }
    return Array.from(map.values());
  }, [runs]);

  const targetOptions = useMemo(() => {
    const map = new Map<string, string>();
    uniqueCompleted.forEach((r) =>
      map.set(r.pdbId, `${r.targetProtein} (${r.pdbId})`)
    );
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [uniqueCompleted]);

  const ligandOptions = useMemo(() => {
    const set = new Set<string>();
    uniqueCompleted.forEach((r) => set.add(r.ligandName));
    return Array.from(set).sort();
  }, [uniqueCompleted]);

  const displayedRuns = useMemo(() => {
    let result = uniqueCompleted.filter((r) => {
      if (selectedTarget !== "ALL" && r.pdbId !== selectedTarget) return false;
      if (selectedLigand !== "ALL" && r.ligandName !== selectedLigand) return false;
      return true;
    });

    if (sortOrder === "best") {
      result = [...result].sort(
        (a, b) => Number(a.bindingAffinity) - Number(b.bindingAffinity)
      );
    } else if (sortOrder === "worst") {
      result = [...result].sort(
        (a, b) => Number(b.bindingAffinity) - Number(a.bindingAffinity)
      );
    } else {
      result = [...result].sort((a, b) => a.ligandName.localeCompare(b.ligandName));
    }
    return result;
  }, [uniqueCompleted, selectedTarget, selectedLigand, sortOrder]);

  const topRun = displayedRuns[0] || null;
  const duplicateHidden = runs.filter(
    (r) => r.bindingAffinity !== null && r.bindingAffinity !== undefined
  ).length - uniqueCompleted.length;

  // Relative bar scale from dataset min/max (more negative → longer)
  const scoreExtent = useMemo(() => {
    if (displayedRuns.length === 0) return { min: -12, max: -4 };
    const vals = displayedRuns.map((r) => Number(r.bindingAffinity));
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [displayedRuns]);

  const barWidth = (score: number) => {
    const span = Math.abs(scoreExtent.max - scoreExtent.min) || 1;
    // Map most negative to ~100%, least negative to ~28%
    const t = (scoreExtent.max - score) / span;
    return Math.min(100, Math.max(28, 28 + t * 72));
  };

  const strongCount = displayedRuns.filter((r) => Number(r.bindingAffinity) <= -8).length;
  const easeOut = [0.22, 1, 0.36, 1] as const;

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
            <Activity className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">Binding Affinity</span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
            {displayedRuns.length} complexes
          </span>
          {strongCount > 0 && (
            <span className="hidden rounded-md border border-[#d7e4dc] bg-[#f7faf8] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#52645d] sm:inline">
              {strongCount} ≤ −8.0
            </span>
          )}
        </div>
        {topRun && (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
            <Medal className="h-3 w-3" />
            <span className="truncate max-w-[14rem]">
              {topRun.ligandName} → {topRun.pdbId}
            </span>
            <span className="font-mono font-bold">
              {Number(topRun.bindingAffinity).toFixed(2)}
            </span>
          </span>
        )}
      </motion.div>

      {/* Context */}
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
              <h2 className="text-sm font-semibold text-[#0f2c20]">{plantName}</h2>
              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                <span className="font-semibold text-[#52645d]">Vina ΔG ranking</span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                more negative = stronger predicted affinity
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Compare scores" },
              { n: "2", label: "Filter / rank" },
              { n: "3", label: "Open 2D / 3D" },
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

      {/* Score comparison viz */}
      {displayedRuns.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
          className="space-y-2.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f0eb] pb-2.5">
            <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                1
              </span>
              <TrendingDown className="h-3.5 w-3.5 text-emerald-700" />
              Score comparison
              <span className="font-medium normal-case tracking-normal text-[#8aa094]">
                · top {Math.min(8, displayedRuns.length)}
              </span>
            </h3>
            <span className="font-mono text-[10px] text-[#8aa094]">kcal/mol</span>
          </div>

          <div className="space-y-1.5">
            {displayedRuns.slice(0, 8).map((r, idx) => {
              const score = Number(r.bindingAffinity) || 0;
              const fit = fitLabel(score);
              const tones = toneClasses(fit.tone);
              return (
                <button
                  key={`${r.id}-${r.pdbId}`}
                  type="button"
                  onClick={() => setInspectedRun(r)}
                  className="group w-full rounded-xl border border-transparent px-1.5 py-1 text-left hover:border-[#d7e4dc] hover:bg-[#f7faf8]"
                >
                  <div className="mb-0.5 flex items-center justify-between gap-2 text-[11px]">
                    <span className="min-w-0 truncate font-semibold text-[#0f2c20]">
                      <span className="mr-1.5 font-mono text-[10px] text-[#8aa094]">
                        #{idx + 1}
                      </span>
                      {r.ligandName}
                      <span className="mx-1 text-[#c5d4cb]">→</span>
                      <span className="font-mono text-emerald-800">{r.pdbId}</span>
                    </span>
                    <span className={`shrink-0 font-mono text-xs font-bold ${tones.score}`}>
                      {score.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8f0eb]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${tones.bar}`}
                      style={{ width: `${barWidth(score)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Ranked table */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: easeOut }}
        className="space-y-2.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
              2
            </span>
            Ranked complexes
            <span className="font-medium normal-case tracking-normal text-[#8aa094]">
              · {displayedRuns.length} shown
            </span>
          </h3>
          {duplicateHidden > 0 && (
            <span className="rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2 py-0.5 text-[10px] font-semibold text-[#52645d]">
              Hidden {duplicateHidden} duplicates
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="rounded-lg border border-[#d5e3da] bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-emerald-600"
          >
            <option value="ALL">All targets ({targetOptions.length})</option>
            {targetOptions.map(([pdb, label]) => (
              <option key={pdb} value={pdb}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={selectedLigand}
            onChange={(e) => setSelectedLigand(e.target.value)}
            className="rounded-lg border border-[#d5e3da] bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-emerald-600"
          >
            <option value="ALL">All ligands ({ligandOptions.length})</option>
            {ligandOptions.map((lig) => (
              <option key={lig} value={lig}>
                {lig}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "best" | "worst" | "name")}
            className="rounded-lg border border-[#d5e3da] bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-emerald-600"
          >
            <option value="best">Best ΔG first</option>
            <option value="worst">Weakest first</option>
            <option value="name">Ligand A–Z</option>
          </select>
        </div>

        {displayedRuns.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-[#d7e4dc]/90">
            <div className="hidden grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1.1fr)_3.5rem_5rem_5rem_7rem] gap-2 border-b border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#8aa094] lg:grid">
              <span>#</span>
              <span>Ligand</span>
              <span>Receptor</span>
              <span>PDB</span>
              <span className="text-right">ΔG</span>
              <span>Fit</span>
              <span className="text-right">Open</span>
            </div>
            <div className="divide-y divide-[#e8f0eb]">
              {displayedRuns.map((r, idx) => {
                const score = Number(r.bindingAffinity) || 0;
                const fit = fitLabel(score);
                const tones = toneClasses(fit.tone);
                return (
                  <div
                    key={`${r.id}-${r.pdbId}`}
                    className={`grid grid-cols-1 gap-2 px-2.5 py-2 lg:grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1.1fr)_3.5rem_5rem_5rem_7rem] lg:items-center lg:gap-2 ${
                      idx === 0 ? "bg-emerald-50/40" : "bg-white hover:bg-[#f7faf8]"
                    }`}
                  >
                    <span className="hidden font-mono text-[10px] font-bold text-[#8aa094] lg:block">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setInspectedRun(r)}
                        className="truncate text-left text-xs font-semibold text-[#0f2c20] hover:text-emerald-800 hover:underline"
                      >
                        <span className="mr-1 font-mono text-[10px] text-[#8aa094] lg:hidden">
                          #{idx + 1}
                        </span>
                        {r.ligandName}
                      </button>
                      <p className="truncate text-[10px] text-[#8aa094] lg:hidden">
                        {r.targetProtein} · {r.pdbId}
                      </p>
                    </div>
                    <span className="hidden truncate text-[11px] text-[#52645d] lg:block">
                      {r.targetProtein}
                    </span>
                    <a
                      href={`https://www.rcsb.org/structure/${r.pdbId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden items-center gap-0.5 font-mono text-[11px] font-bold text-emerald-800 hover:underline lg:inline-flex"
                    >
                      {r.pdbId}
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                    <span
                      className={`text-right font-mono text-xs font-bold ${tones.score} lg:text-right`}
                    >
                      {score.toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold ${tones.pill}`}
                    >
                      {fit.label}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setInspectedRun(r)}
                        className="rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-1.5 py-0.5 text-[9px] font-semibold text-[#52645d] hover:border-emerald-400"
                      >
                        Info
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectRunForVisuals(r.id, 6)}
                        className="inline-flex items-center gap-0.5 rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-1.5 py-0.5 text-[9px] font-semibold text-[#52645d] hover:border-emerald-400"
                      >
                        <Compass className="h-2.5 w-2.5" />
                        2D
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectRunForVisuals(r.id, 7)}
                        className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-700 px-1.5 py-0.5 text-[9px] font-semibold text-white hover:bg-emerald-800"
                      >
                        <Box className="h-2.5 w-2.5" />
                        3D
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-8 text-center">
            <Activity className="mx-auto h-7 w-7 text-[#8aa094]" />
            <p className="mt-2 text-xs font-semibold text-[#0f2c20]">No scored complexes yet</p>
            <p className="mt-1 text-[11px] text-[#8aa094]">
              Finish docking in Step 4 to populate rankings.
            </p>
          </div>
        )}
      </motion.section>

      <p className="flex items-start gap-1.5 px-1 text-[10px] leading-relaxed text-[#8aa094]">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-emerald-700" />
        Vina ΔG is a computational estimate — not experimental efficacy. Confirm with assay data.
      </p>

      {/* Details modal */}
      <AnimatePresence>
        {inspectedRun && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c20]/35 p-4 backdrop-blur-[2px]"
            onClick={() => setInspectedRun(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#e8f0eb] pb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#0f2c20]">
                    {inspectedRun.ligandName}{" "}
                    <span className="font-mono text-emerald-800">→ {inspectedRun.pdbId}</span>
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#8aa094]">
                    {inspectedRun.targetProtein}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedRun(null)}
                  className="rounded-lg p-1 text-[#8aa094] hover:bg-[#f7faf8]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  {
                    label: "ΔG",
                    value: `${Number(inspectedRun.bindingAffinity).toFixed(2)} kcal/mol`,
                  },
                  { label: "Engine", value: "AutoDock Vina 1.2.7" },
                  {
                    label: "Poses",
                    value: String(inspectedRun.poseCount || 9),
                  },
                  {
                    label: "Exhaustiveness",
                    value: String(inspectedRun.exhaustiveness || 8),
                  },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5"
                  >
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8aa094]">
                      {cell.label}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] font-bold text-[#0f2c20]">
                      {cell.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#e8f0eb] pt-3">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const id = inspectedRun.id;
                      setInspectedRun(null);
                      onSelectRunForVisuals(id, 6);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-[#f7faf8] px-3 py-1.5 text-xs font-semibold text-[#52645d]"
                  >
                    <Compass className="h-3 w-3" />
                    2D
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const id = inspectedRun.id;
                      setInspectedRun(null);
                      onSelectRunForVisuals(id, 7);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Box className="h-3 w-3" />
                    3D
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedRun(null)}
                  className="rounded-xl border border-[#d7e4dc] px-3 py-1.5 text-xs font-semibold text-[#52645d]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
