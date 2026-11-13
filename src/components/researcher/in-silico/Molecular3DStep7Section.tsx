// src/components/researcher/in-silico/Molecular3DStep7Section.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Layers,
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Molecular3DViewer, {
  SelectedResidueInfo,
} from "./Molecular3DViewer";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step7Props {
  projectId: number;
  plantName: string;
  runs: DockingRunItem[];
  selectedRunId: number | null;
  onSelectRunId: (runId: number) => void;
  selectedPose?: number;
  onSelectPose?: (pose: number) => void;
  structureData: {
    receptorPdb: string;
    ligandPdbqt: string;
    interactions: any;
  } | null;
  isLoadingStructures: boolean;
  onNavigateTo2D?: () => void;
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#e8f0eb] ${className}`} aria-hidden />;
}

export default function Molecular3DStep7Section({
  plantName,
  runs = [],
  selectedRunId,
  onSelectRunId,
  selectedPose: controlledPose,
  onSelectPose,
  structureData,
  isLoadingStructures,
  onNavigateTo2D,
}: Step7Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const [localPose, setLocalPose] = useState(1);
  const selectedPose = controlledPose ?? localPose;
  const setSelectedPose = (pose: number) => {
    if (onSelectPose) onSelectPose(pose);
    else setLocalPose(pose);
  };

  const [selection, setSelection] = useState<SelectedResidueInfo | null>(null);
  const [viewerKey, setViewerKey] = useState(0);
  const [awaitingInitialLoad, setAwaitingInitialLoad] = useState(true);

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

  useEffect(() => {
    setViewerKey((k) => k + 1);
    setSelection(null);
  }, [activeRun?.id]);

  useEffect(() => {
    const maxPose = activeRun?.poseCount || 9;
    if (selectedPose > maxPose) setSelectedPose(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRun?.id, activeRun?.poseCount]);

  useEffect(() => {
    setAwaitingInitialLoad(true);
  }, [activeRun?.id]);

  useEffect(() => {
    if (isLoadingStructures || structureData !== null || !activeRun) {
      setAwaitingInitialLoad(false);
    }
  }, [isLoadingStructures, structureData, activeRun]);

  useEffect(() => {
    if (!awaitingInitialLoad) return;
    const t = window.setTimeout(() => setAwaitingInitialLoad(false), 12000);
    return () => window.clearTimeout(t);
  }, [awaitingInitialLoad, activeRun?.id]);

  const hasModel = Boolean(structureData?.receptorPdb && structureData?.ligandPdbqt);
  const loadError =
    !isLoadingStructures &&
    !awaitingInitialLoad &&
    activeRun &&
    structureData &&
    (!structureData.receptorPdb || !structureData.ligandPdbqt);

  const showLoading =
    Boolean(activeRun) &&
    !hasModel &&
    !loadError &&
    (isLoadingStructures || awaitingInitialLoad);

  const interactions: any[] = Array.isArray(structureData?.interactions?.interactions)
    ? structureData!.interactions.interactions
    : [];

  const selectionContacts = useMemo(() => {
    if (!selection || selection.resi <= 0) return [];
    return interactions
      .filter((i) => {
        const seq = Number(i.resSeq ?? i.residueSeq ?? String(i.residue || "").match(/\d+/)?.[0]);
        return seq === selection.resi;
      })
      .sort(
        (a, b) =>
          Number(a.distanceAngstroms ?? a.distance ?? 99) -
          Number(b.distanceAngstroms ?? b.distance ?? 99)
      )
      .slice(0, 6);
  }, [selection, interactions]);

  const easeOut = [0.22, 1, 0.36, 1] as const;
  const initial = reduceMotion ? false : { opacity: 0, y: 8 };

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.section
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
              <Layers className="h-4 w-4 text-emerald-700" />
              3D Molecular Visualization
            </h2>
            <p className="mt-0.5 text-[12px] text-[#6d7f76]">
              Explore the three-dimensional structure of docked compounds and their target
              proteins.
            </p>
          </div>
          {onNavigateTo2D && (
            <button
              type="button"
              onClick={onNavigateTo2D}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-[#f7faf8] px-3 py-1.5 text-[11px] font-semibold text-[#52645d] hover:border-emerald-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to 2D
            </button>
          )}
        </div>
      </motion.section>

      {/* Main layout: viewer + side panel */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,19rem)]">
        {/* Viewer */}
        <motion.section
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.04, ease: easeOut }}
          className="min-w-0"
        >
          <AnimatePresence mode="wait">
            {showLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-[min(72vh,40rem)] min-h-[32rem] flex-col items-center justify-center gap-3 rounded-2xl border border-[#d7e4dc] bg-[#0b1f16]"
                aria-busy="true"
                aria-label="Loading 3D structure"
              >
                <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                <p className="text-xs font-semibold text-emerald-100/80">
                  Loading molecular structure…
                </p>
                <div className="mt-2 w-full max-w-sm space-y-2 px-6">
                  <SkeletonBlock className="h-3 w-full bg-emerald-900/40" />
                  <SkeletonBlock className="h-3 w-4/5 bg-emerald-900/30" />
                </div>
              </motion.div>
            ) : loadError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-[min(60vh,32rem)] flex-col items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/40 px-4 text-center"
              >
                <AlertTriangle className="h-7 w-7 text-rose-700" />
                <p className="text-xs font-semibold text-[#0f2c20]">
                  Structure files unavailable
                </p>
                <p className="max-w-sm text-[11px] text-[#6d7f76]">
                  Receptor or ligand coordinates could not be loaded for this docking complex.
                </p>
              </motion.div>
            ) : hasModel && activeRun ? (
              <motion.div
                key={`viewer-${viewerKey}`}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut }}
              >
                <Molecular3DViewer
                  receptorPdb={structureData!.receptorPdb}
                  ligandPdbqt={structureData!.ligandPdbqt}
                  proteinName={activeRun.targetProtein || "Receptor"}
                  ligandName={activeRun.ligandName || "Ligand"}
                  bindingAffinity={activeRun.bindingAffinity}
                  highlightResidues={structureData?.interactions?.uniqueResidues || []}
                  showOverlayBadge={false}
                  onSelectionChange={setSelection}
                  className="min-h-[32rem] h-[min(72vh,40rem)]"
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-[min(50vh,28rem)] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] text-center"
              >
                <Layers className="h-8 w-8 text-[#8aa094]" />
                <p className="text-xs font-semibold text-[#0f2c20]">No 3D model available</p>
                <p className="max-w-sm text-[11px] text-[#8aa094]">
                  Complete molecular docking, then select a scored complex to explore in 3D.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Side panel */}
        <motion.aside
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.06, ease: easeOut }}
          className="space-y-3"
        >
          <div className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
              Docking complex
            </p>
            <select
              value={activeRun?.id || ""}
              onChange={(e) => onSelectRunId(parseInt(e.target.value, 10))}
              disabled={completedRuns.length === 0}
              className="mt-1.5 w-full rounded-xl border border-[#d5e3da] bg-[#f7faf8] px-2.5 py-2 text-xs font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 disabled:opacity-50"
              aria-label="Select docking complex"
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

            <select
              value={selectedPose}
              onChange={(e) => setSelectedPose(parseInt(e.target.value, 10))}
              disabled={!activeRun}
              className="mt-2 w-full rounded-xl border border-[#d5e3da] bg-[#f7faf8] px-2.5 py-2 text-xs font-medium text-[#52645d] outline-none focus:border-emerald-600 disabled:opacity-50"
              aria-label="Select docking pose"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9]
                .slice(0, activeRun?.poseCount || 9)
                .map((p) => (
                  <option key={p} value={p}>
                    Pose {p}
                    {p === 1 ? " (best)" : ""}
                  </option>
                ))}
            </select>

            {activeRun ? (
              <dl className="mt-3 space-y-2 border-t border-[#e8f0eb] pt-3 text-[11px]">
                {plantName && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#8aa094]">Plant</dt>
                    <dd className="text-right font-semibold text-[#0f2c20]">{plantName}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-[#8aa094]">Compound</dt>
                  <dd className="text-right font-semibold text-[#0f2c20]">
                    {activeRun.ligandName}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#8aa094]">Target</dt>
                  <dd className="text-right font-semibold text-[#0f2c20]">
                    {activeRun.targetProtein}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#8aa094]">PDB ID</dt>
                  <dd className="text-right font-mono font-bold text-emerald-800">
                    {activeRun.pdbId}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#8aa094]">Pose</dt>
                  <dd className="text-right font-semibold text-[#0f2c20]">{selectedPose}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#8aa094]">ΔG</dt>
                  <dd className="text-right font-mono font-bold text-emerald-900">
                    {Number(activeRun.bindingAffinity).toFixed(2)}{" "}
                    <span className="text-[10px] font-semibold text-[#8aa094]">kcal/mol</span>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-[11px] text-[#8aa094]">
                Select a completed docking complex to inspect.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
              Viewer tips
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-[#6d7f76]">
              <li>Drag to rotate · scroll to zoom · right-drag to pan</li>
              <li>Toggle Protein, Ligand, Pocket, and Labels in the viewer toolbar</li>
              <li>Click a residue or the ligand to inspect it</li>
            </ul>
          </div>

          {/* Selection / interaction details — only real data */}
          <div className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
              Structural inspection
            </p>
            {selection ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-semibold text-[#0f2c20]">
                  {selection.residue === "Ligand" ? (
                    <>Ligand · {activeRun?.ligandName}</>
                  ) : (
                    <>
                      {selection.residue}
                      {selection.chain ? (
                        <span className="font-mono text-[10px] text-[#8aa094]">
                          {" "}
                          · chain {selection.chain}
                        </span>
                      ) : null}
                    </>
                  )}
                </p>
                {selection.atom && selection.residue !== "Ligand" && (
                  <p className="font-mono text-[10px] text-[#52645d]">Atom {selection.atom}</p>
                )}
                {selectionContacts.length > 0 ? (
                  <ul className="space-y-1 border-t border-[#e8f0eb] pt-2">
                    {selectionContacts.map((c, idx) => (
                      <li
                        key={`${c.residue}-${c.proteinAtom}-${idx}`}
                        className="flex items-center justify-between gap-2 text-[10px]"
                      >
                        <span className="truncate text-[#52645d]">
                          {c.interactionType || "Contact"}
                          {c.proteinAtom ? ` · ${c.proteinAtom}` : ""}
                        </span>
                        <span className="shrink-0 font-mono font-semibold text-[#0f2c20]">
                          {Number(c.distanceAngstroms ?? c.distance).toFixed(2)} Å
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : selection.residue !== "Ligand" ? (
                  <p className="text-[10px] text-[#8aa094]">
                    No stored interaction distances for this residue.
                  </p>
                ) : (
                  <p className="text-[10px] text-[#8aa094]">
                    Ligand selected in the binding pocket.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-[#8aa094]">
                Click a residue or the ligand in the 3D scene to inspect it. Distances appear only
                when interaction analysis data is available.
              </p>
            )}
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
