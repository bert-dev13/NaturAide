// src/components/researcher/in-silico/Molecular3DStep7Section.tsx
"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Leaf,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Molecular3DViewer from "./Molecular3DViewer";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step7Props {
  projectId: number;
  plantName: string;
  runs: DockingRunItem[];
  selectedRunId: number | null;
  onSelectRunId: (runId: number) => void;
  structureData: {
    receptorPdb: string;
    ligandPdbqt: string;
    interactions: any;
  } | null;
  isLoadingStructures: boolean;
}

export default function Molecular3DStep7Section({
  plantName,
  runs = [],
  selectedRunId,
  onSelectRunId,
  structureData,
  isLoadingStructures,
}: Step7Props) {
  const completedRuns = useMemo(() => {
    const scored = runs.filter(
      (r) => r.bindingAffinity !== null && r.bindingAffinity !== undefined
    );
    const map = new Map<string, DockingRunItem>();
    for (const r of scored) {
      const key = `${(r.ligandName || "").toLowerCase()}::${String(r.pdbId || "").toUpperCase()}`;
      const existing = map.get(key);
      if (!existing || Number(r.bindingAffinity) < Number(existing.bindingAffinity)) {
        map.set(key, { ...r, pdbId: String(r.pdbId || "").toUpperCase() });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => Number(a.bindingAffinity) - Number(b.bindingAffinity)
    );
  }, [runs]);

  const activeRun = useMemo(() => {
    return runs.find((r) => r.id === selectedRunId) || completedRuns[0] || null;
  }, [runs, selectedRunId, completedRuns]);

  const easeOut = [0.22, 1, 0.36, 1] as const;
  const hasModel = Boolean(structureData?.receptorPdb && structureData?.ligandPdbqt);

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
            <Layers className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">3D Viewer</span>
          {activeRun && (
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
              {Number(activeRun.bindingAffinity).toFixed(2)} kcal/mol
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium text-[#8aa094]">
          Drag rotate · scroll zoom · right-drag pan
        </span>
      </motion.div>

      {/* Context + complex picker */}
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
                Pick a complex · explore the pocket in 3D
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Pick complex" },
              { n: "2", label: "Toggle layers" },
              { n: "3", label: "Inspect pose" },
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

        <div className="mt-3">
          <select
            value={activeRun?.id || ""}
            onChange={(e) => onSelectRunId(parseInt(e.target.value, 10))}
            disabled={completedRuns.length === 0}
            className="w-full rounded-lg border border-[#d5e3da] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 disabled:opacity-50"
          >
            {completedRuns.length === 0 && (
              <option value="">No scored complexes</option>
            )}
            {completedRuns.map((r) => (
              <option key={r.id} value={r.id}>
                {r.ligandName} → {r.pdbId} ({Number(r.bindingAffinity).toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </motion.section>

      {/* Viewer */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white p-2 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-3"
      >
        <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
            1
          </span>
          Scene
        </div>

        {isLoadingStructures ? (
          <div className="flex h-[480px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d7e4dc] bg-[#0b1f16] text-emerald-100/70">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            <p className="text-xs font-semibold">Loading 3D model…</p>
          </div>
        ) : hasModel ? (
          <Molecular3DViewer
            receptorPdb={structureData!.receptorPdb}
            ligandPdbqt={structureData!.ligandPdbqt}
            proteinName={activeRun?.targetProtein || "Receptor"}
            ligandName={activeRun?.ligandName || "Ligand"}
            bindingAffinity={activeRun?.bindingAffinity}
            highlightResidues={structureData?.interactions?.uniqueResidues || []}
          />
        ) : (
          <div className="flex h-[360px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] text-center">
            <Layers className="h-7 w-7 text-[#8aa094]" />
            <p className="text-xs font-semibold text-[#0f2c20]">No 3D model loaded</p>
            <p className="max-w-sm text-[11px] text-[#8aa094]">
              Finish docking, then pick a scored complex above.
            </p>
          </div>
        )}
      </motion.section>
    </div>
  );
}
