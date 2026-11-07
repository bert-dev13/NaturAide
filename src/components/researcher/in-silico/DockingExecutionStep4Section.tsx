// src/components/researcher/in-silico/DockingExecutionStep4Section.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Play,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  Cpu,
  FlaskConical,
  Target,
  Layers,
  Zap,
  Sparkles,
  Box,
  Compass,
  Activity,
} from "lucide-react";

export interface DockingRunItem {
  id: number;
  compoundId: number;
  targetId?: number;
  ligandName: string;
  targetProtein: string;
  pdbId: string;
  jobStatus:
    | "IDLE"
    | "QUEUED"
    | "PREPARING"
    | "DOCKING"
    | "PROCESSING"
    | "RUNNING"
    | "COMPLETED"
    | "FAILED"
    | "TIMED_OUT"
    | "CANCELLED"
    | string;
  engineStatus?: string;
  bindingAffinity?: number | null;
  poseCount?: number;
  exhaustiveness?: number;
  vinaVersion?: string;
  logOutput?: string;
  errorMessage?: string | null;
  poses?: any[];
  startedAt?: string;
  createdAt?: string;
  completedAt?: string;
}

interface Step4Props {
  projectId: number;
  plantName: string;
  workspace: any;
  compounds: any[];
  onRunAllDocking: () => Promise<void>;
  onRetryFailed?: () => Promise<void>;
  onRunSingleDocking?: (compoundId: number, targetId: number) => Promise<void>;
  onNavigateToResults?: () => void;
  isRunningDocking: boolean;
  exhaustiveness?: number;
  onExhaustivenessChange?: (val: number) => void;
  numModes?: number;
  onNumModesChange?: (val: number) => void;
  onSelectRunForVisuals: (runId: number, targetStep: 6 | 7) => void;
}

interface CombinationRow {
  key: string;
  compoundId: number;
  targetId: number;
  ligandName: string;
  targetName: string;
  pdbId: string;
  runId: number | null;
  rawStatus: string;
  displayStatus:
    | "Queued"
    | "Preparing"
    | "Running"
    | "Completed"
    | "Failed"
    | "Timed Out"
    | "Needs Attention"
    | "Ready";
  affinity: number | null;
  poseCount: number | null;
  error: string | null;
  blockedReason: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.max(1, Math.floor(ms / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}m ${secs}s`;
}

export default function DockingExecutionStep4Section({
  plantName,
  workspace,
  compounds,
  onRunAllDocking,
  onRetryFailed,
  onRunSingleDocking,
  onNavigateToResults,
  isRunningDocking,
  exhaustiveness = 8,
  onSelectRunForVisuals,
}: Step4Props) {
  const [retryingKey, setRetryingKey] = useState<string | null>(null);
  const [isRetryingAll, setIsRetryingAll] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const targets: any[] = workspace?.targets || [];
  const runs: DockingRunItem[] = workspace?.runs || [];
  const workspaceJobs: any[] = workspace?.jobs || [];

  // Use selected compounds from Step 1/3 (fallback to all project compounds if none explicitly unmarked)
  const selectedCompounds = useMemo(() => {
    const selected = compounds.filter((c) => c.selectedForDocking !== 0 && c.selectedForDocking !== false);
    return selected.length > 0 ? selected : compounds;
  }, [compounds]);

  const xCount = selectedCompounds.length;
  const yCount = targets.length;
  const totalCombinations = xCount * yCount;

  // Build canonical combination rows from workspace.jobs (or cross-product of selectedCompounds × targets + runs)
  const combinationRows: CombinationRow[] = useMemo(() => {
    const selectedIds = new Set(selectedCompounds.map((c) => Number(c.id)));
    if (workspaceJobs.length > 0) {
      const filteredJobs = workspaceJobs.filter((j) =>
        selectedIds.size > 0 ? selectedIds.has(Number(j.compoundId)) : true
      );
      if (filteredJobs.length > 0) {
        return filteredJobs.map((j) => {
          const matchingRun = runs.find(
            (r) =>
              (r.id && j.runId && Number(r.id) === Number(j.runId)) ||
              (Number(r.compoundId) === Number(j.compoundId) &&
                (Number(r.targetId) === Number(j.targetId) || r.pdbId === j.pdbId))
          );
          const raw = String(j.status || matchingRun?.jobStatus || "IDLE").toUpperCase();
          const engineStatus = String(j.engineStatus || matchingRun?.engineStatus || raw).toUpperCase();
          const errorMsg = j.error || matchingRun?.errorMessage || null;
          const isTimedOut =
            engineStatus === "TIMED_OUT" ||
            raw === "TIMED_OUT" ||
            Boolean(errorMsg && /timed out/i.test(String(errorMsg)));

          const affinity =
            j.affinity != null && Number.isFinite(Number(j.affinity))
              ? Number(j.affinity)
              : matchingRun?.bindingAffinity != null && Number.isFinite(Number(matchingRun.bindingAffinity))
              ? Number(matchingRun.bindingAffinity)
              : null;

          let displayStatus: CombinationRow["displayStatus"] = "Ready";
          if (raw === "COMPLETED" && affinity !== null) {
            displayStatus = "Completed";
          } else if (raw === "QUEUED") {
            displayStatus = "Queued";
          } else if (raw === "PREPARING") {
            displayStatus = "Preparing";
          } else if (["DOCKING", "PROCESSING", "RUNNING"].includes(raw)) {
            displayStatus = "Running";
          } else if (isTimedOut) {
            displayStatus = "Timed Out";
          } else if (raw === "FAILED") {
            displayStatus = "Failed";
          } else if (j.blockedReason) {
            displayStatus = "Needs Attention";
          }

          return {
            key: `${j.compoundId}:${j.targetId}`,
            compoundId: Number(j.compoundId),
            targetId: Number(j.targetId),
            ligandName: j.ligandName || "Compound",
            targetName: j.targetName || "Target Protein",
            pdbId: j.pdbId || "",
            runId: j.runId ?? matchingRun?.id ?? null,
            rawStatus: raw,
            displayStatus,
            affinity,
            poseCount: j.poseCount ?? matchingRun?.poseCount ?? null,
            error: errorMsg,
            blockedReason: j.blockedReason || null,
            startedAt: j.startedAt || matchingRun?.startedAt || matchingRun?.createdAt || null,
            completedAt: j.completedAt || matchingRun?.completedAt || null,
          };
        });
      }
    }

    // Fallback when workspace.jobs isn't populated yet
    return selectedCompounds.flatMap((c) =>
      targets.map((t) => {
        const cId = Number(c.id);
        const tId = Number(t.id);
        const matchingRun = runs.find(
          (r) => Number(r.compoundId) === cId && (Number(r.targetId) === tId || r.pdbId === t.pdbId)
        );
        const raw = String(matchingRun?.jobStatus || "IDLE").toUpperCase();
        const engineStatus = String(matchingRun?.engineStatus || raw).toUpperCase();
        const errorMsg = matchingRun?.errorMessage || null;
        const isTimedOut =
          engineStatus === "TIMED_OUT" ||
          raw === "TIMED_OUT" ||
          Boolean(errorMsg && /timed out/i.test(String(errorMsg)));

        const affinity =
          matchingRun?.bindingAffinity != null && Number.isFinite(Number(matchingRun.bindingAffinity))
            ? Number(matchingRun.bindingAffinity)
            : null;
        const targetIssue = t.status === "FAILED" || t.prepStatus === "FAILED" ? t.issue || "Target needs setup" : null;

        let displayStatus: CombinationRow["displayStatus"] = "Ready";
        if (raw === "COMPLETED" && affinity !== null) {
          displayStatus = "Completed";
        } else if (raw === "QUEUED") {
          displayStatus = "Queued";
        } else if (raw === "PREPARING") {
          displayStatus = "Preparing";
        } else if (["DOCKING", "PROCESSING", "RUNNING"].includes(raw)) {
          displayStatus = "Running";
        } else if (isTimedOut) {
          displayStatus = "Timed Out";
        } else if (raw === "FAILED") {
          displayStatus = "Failed";
        } else if (targetIssue) {
          displayStatus = "Needs Attention";
        }

        return {
          key: `${cId}:${tId}`,
          compoundId: cId,
          targetId: tId,
          ligandName: c.compoundName || c.name || "Compound",
          targetName: t.targetName || t.proteinName || "Target Protein",
          pdbId: t.pdbId || "",
          runId: matchingRun?.id ?? null,
          rawStatus: raw,
          displayStatus,
          affinity,
          poseCount: matchingRun?.poseCount ?? null,
          error: errorMsg,
          blockedReason: targetIssue,
          startedAt: matchingRun?.startedAt || matchingRun?.createdAt || null,
          completedAt: matchingRun?.completedAt || null,
        };
      })
    );
  }, [workspaceJobs, selectedCompounds, targets, runs]);

  const completedCount = combinationRows.filter((r) => r.displayStatus === "Completed").length;
  const failedCount = combinationRows.filter(
    (r) => r.displayStatus === "Failed" || r.displayStatus === "Timed Out"
  ).length;
  const needsAttentionCount = combinationRows.filter((r) => r.displayStatus === "Needs Attention").length;
  const activeCount = combinationRows.filter((r) =>
    ["Queued", "Preparing", "Running"].includes(r.displayStatus)
  ).length;
  const hasCreatedJobs = combinationRows.some((r) => r.rawStatus !== "IDLE" || r.runId !== null);
  const isBusy = isRunningDocking || activeCount > 0;

  // Live 1-second timer to update elapsed time while any docking job is running
  useEffect(() => {
    if (!isBusy) return;
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isBusy]);

  const isDockingComplete =
    totalCombinations > 0 &&
    hasCreatedJobs &&
    !isBusy &&
    completedCount + failedCount + needsAttentionCount === totalCombinations &&
    completedCount > 0;

  const progressPercent =
    totalCombinations > 0 ? Math.min(100, Math.round((completedCount / totalCombinations) * 100)) : 0;

  const handleRetryAllFailed = async () => {
    if (!onRetryFailed || isRetryingAll) return;
    setIsRetryingAll(true);
    try {
      await onRetryFailed();
    } finally {
      setIsRetryingAll(false);
    }
  };

  const handleRetrySingle = async (row: CombinationRow) => {
    if (!onRunSingleDocking || retryingKey) return;
    setRetryingKey(row.key);
    try {
      await onRunSingleDocking(row.compoundId, row.targetId);
    } finally {
      setRetryingKey(null);
    }
  };

  const getRowElapsedText = (row: CombinationRow): string | null => {
    if (!row.startedAt) return null;
    const start = new Date(row.startedAt).getTime();
    if (!Number.isFinite(start)) return null;
    if (["Queued", "Preparing", "Running"].includes(row.displayStatus)) {
      return formatElapsed(Math.max(1000, nowMs - start));
    }
    if (row.completedAt) {
      const end = new Date(row.completedAt).getTime();
      if (Number.isFinite(end) && end >= start) {
        return formatElapsed(end - start);
      }
    }
    return null;
  };

  // Compute best binding affinity among completed runs
  const bestCompletedRow = useMemo(() => {
    const completedWithAffinity = combinationRows.filter(
      (r) => r.displayStatus === "Completed" && r.affinity !== null
    );
    if (completedWithAffinity.length === 0) return null;
    return completedWithAffinity.reduce((best, curr) =>
      (curr.affinity ?? 0) < (best.affinity ?? 0) ? curr : best
    );
  }, [combinationRows]);

  const readyCount = combinationRows.filter((r) => r.displayStatus === "Ready").length;

  return (
    <div className="w-full space-y-5">
      {/* ===================================================================== */}
      {/* 1. ENHANCED HERO HEADER & CONTROL CARD                                */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-teal-900/5 via-emerald-50/60 to-cyan-50/40 px-6 py-5 border-b border-slate-200/80">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-100/80 text-teal-800 border border-teal-200/70">
                    Section 2 • Step 04 of 08
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-slate-900 text-teal-300">
                    <Zap className="w-3 h-3 text-teal-400" />
                    AutoDock Vina v1.2.7 • Exhaustiveness {exhaustiveness}
                  </span>
                  {plantName && (
                    <span className="text-xs font-semibold text-slate-600">
                      • {plantName}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Molecular Docking Simulation Matrix
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Execute automated 3D receptor–ligand conformational sampling and free-energy scoring across all selected phytochemicals and target proteins.
                </p>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {failedCount > 0 && !isBusy && onRetryFailed && (
                <button
                  type="button"
                  onClick={handleRetryAllFailed}
                  disabled={isRetryingAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isRetryingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  ) : (
                    <RotateCcw className="w-4 h-4 text-amber-700" />
                  )}
                  <span>Retry Failed ({failedCount})</span>
                </button>
              )}

              <button
                type="button"
                disabled={
                  isBusy ||
                  totalCombinations === 0 ||
                  (completedCount === totalCombinations && totalCombinations > 0)
                }
                onClick={onRunAllDocking}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-55 ${
                  completedCount === totalCombinations && totalCombinations > 0
                    ? "bg-emerald-600 text-white"
                    : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                }`}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running Molecular Docking...</span>
                  </>
                ) : completedCount === totalCombinations && totalCombinations > 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All Combinations Docked</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Molecular Docking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. COLOR-CODED 4-CARD METRIC GRID                                     */}
        {/* ===================================================================== */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Phytochemical Ligands */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/20 border border-indigo-200/80 shadow-2xs flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                  Selected Phytochemicals
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">{xCount}</span>
                  <span className="text-xs font-medium text-slate-500">
                    {xCount === 1 ? "ligand" : "ligands"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {selectedCompounds.length > 0
                    ? selectedCompounds
                        .slice(0, 3)
                        .map((c) => c.compoundName || c.name)
                        .join(", ") + (selectedCompounds.length > 3 ? ` +${selectedCompounds.length - 3}` : "")
                    : "None selected"}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <FlaskConical className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: Target Proteins */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/70 via-white to-cyan-50/20 border border-cyan-200/80 shadow-2xs flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-800 block">
                  Target Proteins
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">{yCount}</span>
                  <span className="text-xs font-medium text-slate-500">
                    {yCount === 1 ? "receptor" : "receptors"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {targets.length > 0
                    ? targets.map((t) => t.pdbId).filter(Boolean).join(" • ")
                    : "No PDB receptors selected"}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: Total Combinations */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/30 border border-teal-200/80 shadow-2xs flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
                  Total Combinations
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-teal-700">
                    {xCount} × {yCount} = {totalCombinations}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {totalCombinations === 0
                    ? "Select ligands & targets first"
                    : `${completedCount} completed • ${readyCount} ready`}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            {/* Card 4: Top Affinity / Execution Readiness */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/20 border border-emerald-200/80 shadow-2xs flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  {bestCompletedRow ? "Top Binding Affinity" : "Simulation Status"}
                </span>
                {bestCompletedRow && bestCompletedRow.affinity !== null ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold font-mono text-emerald-700">
                        {bestCompletedRow.affinity.toFixed(1)}
                      </span>
                      <span className="text-xs font-bold text-emerald-800">kcal/mol</span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      {bestCompletedRow.ligandName} × {bestCompletedRow.pdbId}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-slate-800">
                        {isBusy ? "Running..." : hasCreatedJobs ? `${progressPercent}%` : "Ready"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isBusy
                        ? `${activeCount} active simulation(s)`
                        : `${totalCombinations} pair(s) queued for Vina`}
                    </p>
                  </>
                )}
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Empty Combination Warning */}
          {totalCombinations === 0 && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Docking Matrix Incomplete</p>
                <p className="text-amber-800 mt-0.5">
                  Select at least one phytochemical in <strong>Step 1</strong> and one target protein in{" "}
                  <strong>Step 2</strong> to generate your receptor–ligand docking matrix.
                </p>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* 3. DOCKING PROGRESS & COMBINATIONS TABLE                            */}
          {/* =================================================================== */}
          {totalCombinations > 0 && (
            <div className="space-y-4">
              {/* Enhanced Progress Bar Card */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4 text-teal-600" />
                      )}
                      Docking Execution Progress
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                      {progressPercent}%
                    </span>
                  </div>

                  {/* Status Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {completedCount} Completed
                    </span>
                    {activeCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        {activeCount} Running
                      </span>
                    )}
                    {readyCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                        {readyCount} Ready
                      </span>
                    )}
                    {failedCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                        {failedCount} Failed
                      </span>
                    )}
                    <span className="font-mono text-slate-600 pl-1">
                      {completedCount} of {totalCombinations} Completed
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Docking Combinations Table */}
              <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                        <th className="py-3.5 px-4">Phytochemical Ligand × Target Receptor</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Simulation Status</th>
                        <th className="py-3.5 px-4 whitespace-nowrap text-right">Binding Affinity Score</th>
                        <th className="py-3.5 px-4 whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {combinationRows.map((row, idx) => {
                        const elapsedText = getRowElapsedText(row);
                        const isStrongAffinity = row.affinity !== null && row.affinity <= -8.0;
                        const isModerateAffinity =
                          row.affinity !== null && row.affinity > -8.0 && row.affinity <= -6.5;

                        return (
                          <tr
                            key={row.key}
                            className={`transition-colors ${
                              row.displayStatus === "Running" || row.displayStatus === "Preparing"
                                ? "bg-blue-50/30 hover:bg-blue-50/50"
                                : row.displayStatus === "Completed"
                                ? "hover:bg-emerald-50/30"
                                : "hover:bg-slate-50/80"
                            }`}
                          >
                            {/* Index */}
                            <td className="py-3.5 px-4 text-center font-mono text-[11px] font-semibold text-slate-400">
                              {String(idx + 1).padStart(2, "0")}
                            </td>

                            {/* Compound × Protein */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 bg-indigo-50/60 border border-indigo-200/60 px-2.5 py-1 rounded-lg">
                                  <FlaskConical className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  {row.ligandName}
                                </span>

                                <span className="text-slate-400 font-bold text-xs">×</span>

                                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 bg-cyan-50/60 border border-cyan-200/60 px-2.5 py-1 rounded-lg">
                                  <Target className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                                  <span>{row.targetName}</span>
                                  {row.pdbId && (
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-900 text-cyan-100 font-mono text-[10px] font-bold">
                                      {row.pdbId}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {row.displayStatus === "Completed" && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Completed{elapsedText ? ` · ${elapsedText}` : ""}
                                  </span>
                                )}
                                {row.displayStatus === "Running" && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
                                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                    Running{elapsedText ? ` · ${elapsedText}` : ""}
                                  </span>
                                )}
                                {row.displayStatus === "Preparing" && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                    <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                    Preparing{elapsedText ? ` · ${elapsedText}` : ""}
                                  </span>
                                )}
                                {row.displayStatus === "Queued" && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    Queued{elapsedText ? ` · ${elapsedText}` : ""}
                                  </span>
                                )}
                                {row.displayStatus === "Timed Out" && (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold"
                                    title={row.error || undefined}
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                                    Timed Out
                                  </span>
                                )}
                                {row.displayStatus === "Failed" && (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold"
                                    title={row.error || undefined}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                    Failed
                                  </span>
                                )}
                                {row.displayStatus === "Needs Attention" && (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold"
                                    title={row.blockedReason || undefined}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    Needs Attention
                                  </span>
                                )}
                                {row.displayStatus === "Ready" && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                    Ready
                                  </span>
                                )}
                              </div>
                              {(row.error || row.blockedReason) &&
                                (row.displayStatus === "Failed" ||
                                  row.displayStatus === "Timed Out" ||
                                  row.displayStatus === "Needs Attention") && (
                                  <p className="text-[11px] text-rose-700 mt-1 whitespace-normal max-w-xs">
                                    {row.error || row.blockedReason}
                                  </p>
                                )}
                            </td>

                            {/* Binding Affinity Score */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                              {row.displayStatus === "Completed" && row.affinity !== null ? (
                                <div className="inline-flex flex-col items-end">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-extrabold border ${
                                      isStrongAffinity
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : isModerateAffinity
                                        ? "bg-teal-50 text-teal-800 border-teal-200"
                                        : "bg-slate-100 text-slate-800 border-slate-200"
                                    }`}
                                  >
                                    {row.affinity.toFixed(1)} kcal/mol
                                  </span>
                                  {row.poseCount ? (
                                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                      {row.poseCount} poses generated
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-slate-400 font-mono">—</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {row.displayStatus === "Completed" && row.runId && onSelectRunForVisuals && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onSelectRunForVisuals(row.runId!, 6)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold transition-colors cursor-pointer"
                                      title="View 2D Protein–Ligand Interactions"
                                    >
                                      <Compass className="w-3 h-3" />
                                      <span>2D</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onSelectRunForVisuals(row.runId!, 7)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200/80 text-[11px] font-bold transition-colors cursor-pointer"
                                      title="Inspect 3D Binding Pocket Pose"
                                    >
                                      <Box className="w-3 h-3" />
                                      <span>3D</span>
                                    </button>
                                  </>
                                )}

                                {onRunSingleDocking &&
                                (row.displayStatus === "Ready" ||
                                  row.displayStatus === "Failed" ||
                                  row.displayStatus === "Timed Out" ||
                                  row.displayStatus === "Completed") ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRetrySingle(row)}
                                    disabled={retryingKey === row.key || isBusy}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-sans text-[11px] font-bold transition-colors disabled:opacity-50 cursor-pointer ${
                                      row.displayStatus === "Failed" || row.displayStatus === "Timed Out"
                                        ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300"
                                        : row.displayStatus === "Ready"
                                        ? "bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                    }`}
                                  >
                                    {retryingKey === row.key ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : row.displayStatus === "Failed" ||
                                      row.displayStatus === "Timed Out" ||
                                      row.displayStatus === "Completed" ? (
                                      <RotateCcw className="w-3 h-3" />
                                    ) : (
                                      <Play className="w-3 h-3 fill-current" />
                                    )}
                                    <span>
                                      {row.displayStatus === "Failed" || row.displayStatus === "Timed Out"
                                        ? "Retry"
                                        : row.displayStatus === "Completed"
                                        ? "Re-run"
                                        : "Run"}
                                    </span>
                                  </button>
                                ) : (
                                  !row.runId && <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. RESULTS SUMMARY BANNER (WHEN DOCKING FINISHES)                     */}
      {/* ===================================================================== */}
      {(isDockingComplete || (completedCount > 0 && !isBusy)) && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-5 shadow-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Molecular Docking Simulations Completed
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-50">
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 font-semibold">
                  Completed: <strong>{completedCount}</strong> / {totalCombinations}
                </span>
                {failedCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-100 font-semibold">
                    Failed: <strong>{failedCount}</strong>
                  </span>
                )}
                {bestCompletedRow && bestCompletedRow.affinity !== null && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 font-mono font-semibold">
                    Best Score: <strong>{bestCompletedRow.affinity.toFixed(1)} kcal/mol</strong> ({bestCompletedRow.ligandName} × {bestCompletedRow.pdbId})
                  </span>
                )}
              </div>
            </div>
          </div>

          {onNavigateToResults && (
            <button
              type="button"
              onClick={onNavigateToResults}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer shrink-0"
            >
              <span>View Docking Results</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
