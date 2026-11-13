// src/components/researcher/in-silico/DockingExecutionStep4Section.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  FlaskConical,
  Target,
  ChevronRight,
  Leaf,
  Activity,
  Box,
  Compass,
  Zap,
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
  onSelectRunForVisuals: (runId: number, targetStep: 5 | 6) => void;
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

type StatusFilter = "ALL" | "READY" | "ACTIVE" | "DONE" | "ISSUE";

function formatElapsed(ms: number): string {
  const totalSec = Math.max(1, Math.floor(ms / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}m ${secs}s`;
}

function compoundKey(c: { compoundName?: string; name?: string; pubchemId?: string | null }) {
  return `${(c.compoundName || c.name || "").toLowerCase().trim()}::${c.pubchemId || ""}`;
}

const STATUS_RANK: Record<CombinationRow["displayStatus"], number> = {
  Completed: 80,
  Running: 70,
  Preparing: 60,
  Queued: 50,
  Ready: 40,
  "Needs Attention": 30,
  Failed: 20,
  "Timed Out": 10,
};

function mapJobToRow(j: any, runs: DockingRunItem[]): CombinationRow {
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
      : matchingRun?.bindingAffinity != null &&
          Number.isFinite(Number(matchingRun.bindingAffinity))
        ? Number(matchingRun.bindingAffinity)
        : null;

  let displayStatus: CombinationRow["displayStatus"] = "Ready";
  if (raw === "COMPLETED" && affinity !== null) displayStatus = "Completed";
  else if (raw === "QUEUED") displayStatus = "Queued";
  else if (raw === "PREPARING") displayStatus = "Preparing";
  else if (["DOCKING", "PROCESSING", "RUNNING"].includes(raw)) displayStatus = "Running";
  else if (isTimedOut) displayStatus = "Timed Out";
  else if (raw === "FAILED") displayStatus = "Failed";
  else if (j.blockedReason) displayStatus = "Needs Attention";

  return {
    key: `${j.compoundId}:${j.targetId}`,
    compoundId: Number(j.compoundId),
    targetId: Number(j.targetId),
    ligandName: j.ligandName || "Compound",
    targetName: j.targetName || "Target Protein",
    pdbId: (j.pdbId || "").toUpperCase(),
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const rawTargets: any[] = workspace?.targets || [];
  const runs: DockingRunItem[] = workspace?.runs || [];
  const workspaceJobs: any[] = workspace?.jobs || [];

  // Unique ligands (collapse duplicate Rhein rows)
  const selectedCompounds = useMemo(() => {
    const selected = compounds.filter(
      (c) => c.selectedForDocking !== 0 && c.selectedForDocking !== false
    );
    const pool = selected.length > 0 ? selected : compounds;
    const map = new Map<string, any>();
    for (const c of pool) {
      const key = compoundKey(c);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, c);
        continue;
      }
      if (
        (c.selectedForDocking === 1 || c.selectedForDocking === true) &&
        !(existing.selectedForDocking === 1 || existing.selectedForDocking === true)
      ) {
        map.set(key, c);
      }
    }
    return Array.from(map.values());
  }, [compounds]);

  // Unique receptors by PDB ID
  const targets = useMemo(() => {
    const map = new Map<string, any>();
    for (const t of rawTargets) {
      const pdb = String(t.pdbId || "").toUpperCase();
      if (!pdb) continue;
      const existing = map.get(pdb);
      if (!existing) {
        map.set(pdb, t);
        continue;
      }
      // Prefer completed prep / non-failed
      const existingBad =
        existing.prepStatus === "FAILED" || existing.status === "FAILED";
      const nextGood = t.prepStatus === "COMPLETED" || t.status === "COMPLETED";
      if (existingBad && nextGood) map.set(pdb, t);
    }
    return Array.from(map.values());
  }, [rawTargets]);

  const xCount = selectedCompounds.length;
  const yCount = targets.length;

  const combinationRows: CombinationRow[] = useMemo(() => {
    const selectedIds = new Set(selectedCompounds.map((c) => Number(c.id)));
    let rows: CombinationRow[] = [];

    if (workspaceJobs.length > 0) {
      const filteredJobs = workspaceJobs.filter((j) =>
        selectedIds.size > 0 ? selectedIds.has(Number(j.compoundId)) : true
      );
      if (filteredJobs.length > 0) {
        rows = filteredJobs.map((j) => mapJobToRow(j, runs));
      }
    }

    if (rows.length === 0) {
      rows = selectedCompounds.flatMap((c) =>
        targets.map((t) => {
          const cId = Number(c.id);
          const tId = Number(t.id);
          const matchingRun = runs.find(
            (r) =>
              Number(r.compoundId) === cId &&
              (Number(r.targetId) === tId || r.pdbId === t.pdbId)
          );
          return mapJobToRow(
            {
              compoundId: cId,
              targetId: tId,
              ligandName: c.compoundName || c.name || "Compound",
              targetName: t.targetName || t.proteinName || "Target Protein",
              pdbId: t.pdbId || "",
              status: matchingRun?.jobStatus || "IDLE",
              engineStatus: matchingRun?.engineStatus,
              runId: matchingRun?.id,
              affinity: matchingRun?.bindingAffinity,
              poseCount: matchingRun?.poseCount,
              error: matchingRun?.errorMessage,
              blockedReason:
                t.status === "FAILED" || t.prepStatus === "FAILED"
                  ? t.issue || "Target needs setup"
                  : null,
              startedAt: matchingRun?.startedAt || matchingRun?.createdAt,
              completedAt: matchingRun?.completedAt,
            },
            runs
          );
        })
      );
    }

    // Collapse duplicate ligand×PDB pairs (keep best status)
    const map = new Map<string, CombinationRow>();
    for (const row of rows) {
      const pairKey = `${row.ligandName.toLowerCase().trim()}::${row.pdbId}`;
      const existing = map.get(pairKey);
      if (!existing) {
        map.set(pairKey, row);
        continue;
      }
      if (STATUS_RANK[row.displayStatus] > STATUS_RANK[existing.displayStatus]) {
        map.set(pairKey, row);
      } else if (
        STATUS_RANK[row.displayStatus] === STATUS_RANK[existing.displayStatus] &&
        (row.affinity ?? 0) < (existing.affinity ?? 0)
      ) {
        map.set(pairKey, row);
      }
    }
    return Array.from(map.values());
  }, [workspaceJobs, selectedCompounds, targets, runs]);

  const totalCombinations = combinationRows.length;
  const completedCount = combinationRows.filter((r) => r.displayStatus === "Completed").length;
  const failedCount = combinationRows.filter(
    (r) => r.displayStatus === "Failed" || r.displayStatus === "Timed Out"
  ).length;
  const needsAttentionCount = combinationRows.filter(
    (r) => r.displayStatus === "Needs Attention"
  ).length;
  const activeCount = combinationRows.filter((r) =>
    ["Queued", "Preparing", "Running"].includes(r.displayStatus)
  ).length;
  const readyCount = combinationRows.filter((r) => r.displayStatus === "Ready").length;
  const hasCreatedJobs = combinationRows.some((r) => r.rawStatus !== "IDLE" || r.runId !== null);
  const isBusy = isRunningDocking || activeCount > 0;

  const filteredRows = useMemo(() => {
    return combinationRows.filter((r) => {
      if (statusFilter === "READY") return r.displayStatus === "Ready";
      if (statusFilter === "ACTIVE")
        return ["Queued", "Preparing", "Running"].includes(r.displayStatus);
      if (statusFilter === "DONE") return r.displayStatus === "Completed";
      if (statusFilter === "ISSUE")
        return ["Failed", "Timed Out", "Needs Attention"].includes(r.displayStatus);
      return true;
    });
  }, [combinationRows, statusFilter]);

  useEffect(() => {
    if (!isBusy) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isBusy]);

  const isDockingComplete =
    totalCombinations > 0 &&
    hasCreatedJobs &&
    !isBusy &&
    completedCount + failedCount + needsAttentionCount === totalCombinations &&
    completedCount > 0;

  const progressPercent =
    totalCombinations > 0
      ? Math.min(100, Math.round((completedCount / totalCombinations) * 100))
      : 0;

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
      if (Number.isFinite(end) && end >= start) return formatElapsed(end - start);
    }
    return null;
  };

  const bestCompletedRow = useMemo(() => {
    const done = combinationRows.filter(
      (r) => r.displayStatus === "Completed" && r.affinity !== null
    );
    if (done.length === 0) return null;
    return done.reduce((best, curr) =>
      (curr.affinity ?? 0) < (best.affinity ?? 0) ? curr : best
    );
  }, [combinationRows]);

  const pdbList = targets.map((t) => String(t.pdbId || "").toUpperCase()).filter(Boolean);
  const easeOut = [0.22, 1, 0.36, 1] as const;

  const StatusPill = ({ row }: { row: CombinationRow }) => {
    const elapsed = getRowElapsedText(row);
    const base = "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-semibold";
    switch (row.displayStatus) {
      case "Completed":
        return (
          <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-900`}>
            <CheckCircle2 className="h-2.5 w-2.5" />
            Done{elapsed ? ` · ${elapsed}` : ""}
          </span>
        );
      case "Running":
        return (
          <span className={`${base} border-sky-200 bg-sky-50 text-sky-900`}>
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            Running{elapsed ? ` · ${elapsed}` : ""}
          </span>
        );
      case "Preparing":
        return (
          <span className={`${base} border-amber-200 bg-amber-50 text-amber-900`}>
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            Prep{elapsed ? ` · ${elapsed}` : ""}
          </span>
        );
      case "Queued":
        return (
          <span className={`${base} border-[#d7e4dc] bg-[#f7faf8] text-[#52645d]`}>
            <Clock className="h-2.5 w-2.5" />
            Queued
          </span>
        );
      case "Timed Out":
        return (
          <span className={`${base} border-amber-300 bg-amber-50 text-amber-950`} title={row.error || undefined}>
            <Clock className="h-2.5 w-2.5" />
            Timeout
          </span>
        );
      case "Failed":
        return (
          <span className={`${base} border-rose-200 bg-rose-50 text-rose-900`} title={row.error || undefined}>
            <AlertCircle className="h-2.5 w-2.5" />
            Failed
          </span>
        );
      case "Needs Attention":
        return (
          <span
            className={`${base} border-amber-200 bg-amber-50 text-amber-950`}
            title={row.blockedReason || row.error || undefined}
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            Blocked
          </span>
        );
      default:
        return (
          <span className={`${base} border-[#d7e4dc] bg-white text-[#52645d]`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Ready
          </span>
        );
    }
  };

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
            <Zap className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">Docking Matrix</span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
            {xCount}×{yCount} · {totalCombinations} pairs
          </span>
          <span className="hidden rounded-md border border-[#0f2c20]/80 bg-[#0f2c20] px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-200 sm:inline">
            Vina · exh {exhaustiveness}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {failedCount > 0 && !isBusy && onRetryFailed && (
            <button
              type="button"
              onClick={handleRetryAllFailed}
              disabled={isRetryingAll}
              className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              {isRetryingAll ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Retry {failedCount}
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running...
              </>
            ) : completedCount === totalCombinations && totalCombinations > 0 ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                All done
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Run docking
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Context + stats */}
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
              <h2 className="text-sm font-semibold text-[#0f2c20]">{plantName || "Docking run"}</h2>
              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                <span className="font-semibold text-[#52645d]">{xCount} ligands</span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                <span className="font-mono text-[#52645d]">
                  {pdbList.slice(0, 4).join(" · ")}
                  {pdbList.length > 4 ? ` +${pdbList.length - 4}` : ""}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Queue pairs" },
              { n: "2", label: "Run Vina" },
              { n: "3", label: "Review scores" },
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

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            {
              label: "Ligands",
              value: String(xCount),
              sub: selectedCompounds
                .slice(0, 2)
                .map((c) => c.compoundName || c.name)
                .join(", "),
              icon: FlaskConical,
            },
            {
              label: "Receptors",
              value: String(yCount),
              sub: pdbList.slice(0, 3).join(" · ") || "None",
              icon: Target,
            },
            {
              label: "Progress",
              value: `${progressPercent}%`,
              sub: `${completedCount}/${totalCombinations} done`,
              icon: Activity,
            },
            {
              label: bestCompletedRow ? "Best ΔG" : "Status",
              value: bestCompletedRow?.affinity != null
                ? bestCompletedRow.affinity.toFixed(1)
                : isBusy
                  ? "Live"
                  : "Ready",
              sub: bestCompletedRow
                ? `${bestCompletedRow.ligandName} × ${bestCompletedRow.pdbId}`
                : `${readyCount} ready · ${needsAttentionCount} blocked`,
              icon: Activity,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-[#e8f0eb] bg-white/80 px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8aa094]">
                  {card.label}
                </span>
                <card.icon className="h-3 w-3 text-emerald-700" />
              </div>
              <p className="mt-0.5 font-mono text-sm font-bold text-[#0f2c20]">{card.value}</p>
              <p className="truncate text-[10px] text-[#8aa094]">{card.sub}</p>
            </div>
          ))}
        </div>

        {totalCombinations === 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Select ligands in Step 1 and receptors in Step 2 first.
          </div>
        )}
      </motion.section>

      {/* Matrix table */}
      {totalCombinations > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
          className="space-y-2.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
        >
          <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                1
              </span>
              Pair matrix
              <span className="font-medium normal-case tracking-normal text-[#8aa094]">
                · {filteredRows.length} shown
              </span>
            </h3>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { key: "ALL", label: "All" },
                  { key: "READY", label: `Ready (${readyCount})` },
                  { key: "ACTIVE", label: `Live (${activeCount})` },
                  { key: "DONE", label: `Done (${completedCount})` },
                  {
                    key: "ISSUE",
                    label: `Issues (${failedCount + needsAttentionCount})`,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                    statusFilter === f.key
                      ? "bg-emerald-700 text-white"
                      : "border border-[#d7e4dc] bg-[#f7faf8] text-[#52645d] hover:border-emerald-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compact progress */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8f0eb]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-bold text-[#52645d]">
              {completedCount}/{totalCombinations}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#d7e4dc]/90">
            <div className="hidden grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_5.5rem_7rem] gap-2 border-b border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#8aa094] lg:grid">
              <span>#</span>
              <span>Ligand × receptor</span>
              <span>Status</span>
              <span className="text-right">ΔG</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-[#e8f0eb]">
              {filteredRows.map((row, idx) => {
                const isStrong = row.affinity !== null && row.affinity <= -8.0;
                return (
                  <div
                    key={row.key}
                    className={`grid grid-cols-1 gap-2 px-2.5 py-2 lg:grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_5.5rem_7rem] lg:items-center lg:gap-2 ${
                      row.displayStatus === "Running" || row.displayStatus === "Preparing"
                        ? "bg-sky-50/40"
                        : row.displayStatus === "Completed"
                          ? "bg-emerald-50/25"
                          : "bg-white hover:bg-[#f7faf8]"
                    }`}
                  >
                    <span className="hidden font-mono text-[10px] text-[#8aa094] lg:block">
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="truncate text-xs font-semibold text-[#0f2c20]">
                          {row.ligandName}
                        </span>
                        <span className="text-[10px] text-[#c5d4cb]">×</span>
                        <span className="truncate text-[11px] font-medium text-[#52645d]">
                          {row.targetName}
                        </span>
                        {row.pdbId && (
                          <span className="rounded border border-[#d7e4dc] bg-[#f7faf8] px-1 py-0.5 font-mono text-[9px] font-bold text-emerald-900">
                            {row.pdbId}
                          </span>
                        )}
                      </div>
                      {(row.error || row.blockedReason) &&
                        ["Failed", "Timed Out", "Needs Attention"].includes(row.displayStatus) && (
                          <p className="mt-0.5 truncate text-[10px] text-rose-700" title={row.error || row.blockedReason || undefined}>
                            {row.error || row.blockedReason}
                          </p>
                        )}
                      <div className="mt-1 lg:hidden">
                        <StatusPill row={row} />
                      </div>
                    </div>

                    <div className="hidden lg:block">
                      <StatusPill row={row} />
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      {row.displayStatus === "Completed" && row.affinity !== null ? (
                        <span
                          className={`font-bold ${
                            isStrong ? "text-emerald-800" : "text-[#0f2c20]"
                          }`}
                        >
                          {row.affinity.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-[#8aa094]">—</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {row.displayStatus === "Completed" && row.runId && (
                        <>
                          <button
                            type="button"
                            onClick={() => onSelectRunForVisuals(row.runId!, 5)}
                            className="inline-flex items-center gap-0.5 rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-1.5 py-0.5 text-[9px] font-semibold text-[#52645d] hover:border-emerald-400"
                            title="2D interactions"
                          >
                            <Compass className="h-2.5 w-2.5" />
                            2D
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectRunForVisuals(row.runId!, 6)}
                            className="inline-flex items-center gap-0.5 rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-1.5 py-0.5 text-[9px] font-semibold text-[#52645d] hover:border-emerald-400"
                            title="3D pose"
                          >
                            <Box className="h-2.5 w-2.5" />
                            3D
                          </button>
                        </>
                      )}
                      {onRunSingleDocking &&
                        ["Ready", "Failed", "Timed Out", "Completed"].includes(
                          row.displayStatus
                        ) && (
                          <button
                            type="button"
                            onClick={() => handleRetrySingle(row)}
                            disabled={retryingKey === row.key || isBusy}
                            className={`inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[9px] font-semibold disabled:opacity-50 ${
                              row.displayStatus === "Failed" ||
                              row.displayStatus === "Timed Out"
                                ? "border border-amber-200 bg-amber-50 text-amber-900"
                                : row.displayStatus === "Ready"
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                                  : "border border-[#d7e4dc] bg-[#f7faf8] text-[#52645d]"
                            }`}
                          >
                            {retryingKey === row.key ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : row.displayStatus === "Ready" ? (
                              <Play className="h-2.5 w-2.5 fill-current" />
                            ) : (
                              <RotateCcw className="h-2.5 w-2.5" />
                            )}
                            {row.displayStatus === "Ready"
                              ? "Run"
                              : row.displayStatus === "Completed"
                                ? "Re-run"
                                : "Retry"}
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
              {filteredRows.length === 0 && (
                <div className="px-3 py-6 text-center text-[11px] text-[#8aa094]">
                  No pairs match this filter.
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Done banner */}
      {(isDockingComplete || (completedCount > 0 && !isBusy)) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-700/20 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_100%)] px-4 py-3.5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Docking complete</p>
            <p className="mt-0.5 text-[11px] text-emerald-100/80">
              {completedCount}/{totalCombinations} scored
              {bestCompletedRow?.affinity != null && (
                <>
                  {" "}
                  · best {bestCompletedRow.affinity.toFixed(1)} kcal/mol (
                  {bestCompletedRow.ligandName} × {bestCompletedRow.pdbId})
                </>
              )}
            </p>
          </div>
          {onNavigateToResults && (
            <button
              type="button"
              onClick={onNavigateToResults}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-bold text-[#091a13] hover:bg-emerald-300"
            >
              View results
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
