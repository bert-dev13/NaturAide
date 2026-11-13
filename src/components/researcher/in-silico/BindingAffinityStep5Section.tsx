// src/components/researcher/in-silico/BindingAffinityStep5Section.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import {
  Activity,
  Info,
  ExternalLink,
  X,
  Compass,
  Box,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step5Props {
  projectId: number;
  plantName: string;
  runs: DockingRunItem[];
  workspace?: any;
  compounds?: any[];
  onSelectRunForVisuals: (runId: number, targetStep: 5 | 6) => void;
  onRetryFailed?: () => Promise<void>;
  onRefreshWorkspace?: () => Promise<void>;
}

type JobBucket = "completed" | "processing" | "failed" | "pending" | "other";

const ACTIVE_STATUSES = new Set([
  "QUEUED",
  "PREPARING",
  "DOCKING",
  "PROCESSING",
  "RUNNING",
]);
const FAILED_STATUSES = new Set(["FAILED", "TIMED_OUT", "CANCELLED"]);

function normalizeStatus(raw: unknown): string {
  return String(raw || "IDLE").toUpperCase();
}

function bucketForRun(r: DockingRunItem): JobBucket {
  const status = normalizeStatus(r.jobStatus);
  const hasScore = r.bindingAffinity !== null && r.bindingAffinity !== undefined;
  if (status === "COMPLETED" || hasScore) return "completed";
  if (ACTIVE_STATUSES.has(status)) return "processing";
  if (FAILED_STATUSES.has(status)) return "failed";
  if (status === "IDLE" || !r.jobStatus) return "pending";
  return "other";
}

function AnimatedPercent({ value, reduceMotion }: { value: number; reduceMotion: boolean }) {
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (latest) => `${Math.round(latest)}%`);
  const [label, setLabel] = useState(`${Math.round(value)}%`);

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      setLabel(`${Math.round(value)}%`);
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = rounded.on("change", (v) => setLabel(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, reduceMotion, motionValue, rounded]);

  return (
    <span className="font-mono text-2xl font-bold tabular-nums text-[#0f2c20] sm:text-3xl">
      {label}
    </span>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#e8f0eb] ${className}`}
      aria-hidden
    />
  );
}

export default function BindingAffinityStep5Section({
  projectId,
  plantName,
  runs = [],
  workspace,
  compounds = [],
  onSelectRunForVisuals,
  onRetryFailed,
  onRefreshWorkspace,
}: Step5Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const [selectedTarget, setSelectedTarget] = useState("ALL");
  const [selectedLigand, setSelectedLigand] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"best" | "worst" | "name">("best");
  const [inspectedRun, setInspectedRun] = useState<DockingRunItem | null>(null);
  const [showScoreNotes, setShowScoreNotes] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const refreshOnce = useRef(false);

  // Soft refresh on mount so progress reflects latest job statuses.
  // Never flash a spinner when completed scores are already on screen.
  useEffect(() => {
    if (refreshOnce.current) return;
    refreshOnce.current = true;
    let cancelled = false;
    (async () => {
      if (!onRefreshWorkspace) {
        if (!cancelled) setInitialLoadDone(true);
        return;
      }
      const alreadyComplete = (Array.isArray(workspace?.runs) ? workspace.runs : runs).some(
        (r: DockingRunItem) =>
          r.bindingAffinity !== null && r.bindingAffinity !== undefined
      );
      if (!alreadyComplete) setIsRefreshing(true);
      try {
        await onRefreshWorkspace();
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
          setInitialLoadDone(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Mount-only soft refresh; workspace/runs identity must not re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefreshWorkspace, projectId]);

  const allRuns: DockingRunItem[] = useMemo(() => {
    const fromWorkspace = Array.isArray(workspace?.runs) ? workspace.runs : [];
    return (fromWorkspace.length > 0 ? fromWorkspace : runs) as DockingRunItem[];
  }, [workspace, runs]);

  // Expected complex count from ligand × target matrix when available
  const expectedTotal = useMemo(() => {
    const jobs = Array.isArray(workspace?.jobs) ? workspace.jobs : [];
    if (jobs.length > 0) {
      const keys = new Set(
        jobs.map(
          (j: any) =>
            `${String(j.ligandName || j.compoundId || "").toLowerCase()}::${String(j.pdbId || "").toUpperCase()}`
        )
      );
      return keys.size || jobs.length;
    }

    const selected = (compounds || []).filter(
      (c: any) => c.selectedForDocking !== 0 && c.selectedForDocking !== false
    );
    const ligandPool = selected.length > 0 ? selected : compounds || [];
    const ligandKeys = new Set(
      ligandPool.map(
        (c: any) =>
          `${String(c.compoundName || c.name || "").toLowerCase().trim()}::${c.pubchemId || ""}`
      )
    );
    const targets = Array.isArray(workspace?.targets) ? workspace.targets : [];
    const pdbKeys = new Set(
      targets.map((t: any) => String(t.pdbId || "").toUpperCase()).filter(Boolean)
    );
    const matrix = ligandKeys.size * pdbKeys.size;
    if (matrix > 0) return matrix;
    return allRuns.length;
  }, [workspace, compounds, allRuns.length]);

  const progress = useMemo(() => {
    const completed = allRuns.filter((r) => bucketForRun(r) === "completed").length;
    const processing = allRuns.filter((r) => bucketForRun(r) === "processing").length;
    const failed = allRuns.filter((r) => bucketForRun(r) === "failed").length;
    const pending = allRuns.filter((r) => bucketForRun(r) === "pending").length;

    // Prefer the larger of observed runs vs expected matrix so idle combos count
    const total = Math.max(expectedTotal, allRuns.length, completed + processing + failed);
    const percent =
      total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

    // Never treat as fully complete while jobs are still processing
    const displayPercent = processing > 0 ? Math.min(percent, 99) : percent;
    const isFullyComplete =
      total > 0 && processing === 0 && completed > 0 && completed + failed >= total;

    return {
      total,
      completed,
      processing,
      failed,
      pending,
      percent: displayPercent,
      isFullyComplete,
      hasAnyJobs: allRuns.length > 0 || expectedTotal > 0,
    };
  }, [allRuns, expectedTotal]);

  const processingRuns = useMemo(
    () => allRuns.filter((r) => bucketForRun(r) === "processing"),
    [allRuns]
  );

  const failedRuns = useMemo(
    () => allRuns.filter((r) => bucketForRun(r) === "failed"),
    [allRuns]
  );

  // Dedupe ligand×PDB — keep strongest (most negative) score
  const uniqueCompleted = useMemo(() => {
    const scored = allRuns.filter(
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
  }, [allRuns]);

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

  const bestOverall = useMemo(() => {
    if (uniqueCompleted.length === 0) return null;
    return [...uniqueCompleted].sort(
      (a, b) => Number(a.bindingAffinity) - Number(b.bindingAffinity)
    )[0];
  }, [uniqueCompleted]);

  const topDisplayed = displayedRuns[0] || null;
  const duplicateHidden =
    allRuns.filter((r) => r.bindingAffinity !== null && r.bindingAffinity !== undefined)
      .length - uniqueCompleted.length;

  const showSkeleton =
    !initialLoadDone && isRefreshing && uniqueCompleted.length === 0 && allRuns.length === 0;

  const easeOut = [0.22, 1, 0.36, 1] as const;
  const enter = reduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0 };
  const initial = reduceMotion ? false : { opacity: 0, y: 8 };

  const openVisual = (runId: number, step: 5 | 6) => {
    setInspectedRun(null);
    onSelectRunForVisuals(runId, step);
  };

  const handleRetryFailed = async () => {
    if (!onRetryFailed || isRetrying) return;
    setIsRetrying(true);
    try {
      await onRetryFailed();
    } finally {
      setIsRetrying(false);
    }
  };

  const statusLabel =
    progress.processing > 0
      ? "Processing"
      : progress.isFullyComplete
        ? "Completed"
        : progress.failed > 0 && progress.completed === 0
          ? "Failed"
          : progress.completed > 0
            ? "Partial results"
            : progress.hasAnyJobs
              ? "Pending"
              : "Empty";

  if (showSkeleton) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading docking results">
        <section className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 sm:p-4">
          <SkeletonBlock className="h-4 w-48" />
          <SkeletonBlock className="mt-2 h-3 w-72" />
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="h-16" />
            ))}
          </div>
          <SkeletonBlock className="mt-3 h-3 w-full rounded-full" />
        </section>
        <section className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 sm:p-4">
          <SkeletonBlock className="h-24 w-full" />
        </section>
        <section className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 sm:p-4">
          <SkeletonBlock className="mb-3 h-4 w-40" />
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="mb-2 h-10 w-full" />
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + progress */}
      <motion.section
        initial={initial}
        animate={enter}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
              <Activity className="h-4 w-4 text-emerald-700" />
              Binding Affinity Results
              {isRefreshing &&
                progress.processing === 0 &&
                uniqueCompleted.length === 0 &&
                !progress.isFullyComplete && (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin text-[#8aa094]"
                    aria-label="Refreshing"
                  />
                )}
            </h2>
            <p className="mt-0.5 text-[12px] text-[#6d7f76]">
              Review and compare predicted binding affinities from molecular docking.
            </p>
            {plantName && (
              <p className="mt-1 text-[11px] text-[#8aa094]">{plantName}</p>
            )}
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
              progress.processing > 0
                ? "border-sky-200 bg-sky-50 text-sky-900"
                : progress.isFullyComplete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : progress.failed > 0 && progress.completed === 0
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-[#d7e4dc] bg-[#f7faf8] text-[#52645d]"
            }`}
          >
            {progress.processing > 0 && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {statusLabel}
          </span>
        </div>

        {/* Docking Results Progress */}
        <div className="mt-3 rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8aa094]">
                Docking Results Progress
              </p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <AnimatedPercent value={progress.percent} reduceMotion={reduceMotion} />
                <span className="text-[11px] font-semibold text-[#52645d]">
                  {progress.completed}/{progress.total} completed
                </span>
              </div>
            </div>
            {progress.processing > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-800">
                <Loader2 className="h-3 w-3 animate-spin" />
                {progress.processing} processing
              </span>
            )}
          </div>

          <div
            className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#d7e4dc]/80"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Docking completion percentage"
          >
            <motion.div
              className={`h-full rounded-full ${
                progress.processing > 0
                  ? "bg-gradient-to-r from-emerald-600 to-sky-500"
                  : progress.isFullyComplete
                    ? "bg-emerald-600"
                    : "bg-emerald-600"
              }`}
              initial={false}
              animate={{ width: `${progress.percent}%` }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.55, ease: easeOut }
              }
            />
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Total", value: progress.total, tone: "text-[#0f2c20]" },
              { label: "Completed", value: progress.completed, tone: "text-emerald-800" },
              { label: "Processing", value: progress.processing, tone: "text-sky-800" },
              { label: "Failed", value: progress.failed, tone: "text-rose-800" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-[#e8f0eb] bg-white px-2.5 py-1.5"
              >
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#8aa094]">
                  {stat.label}
                </p>
                <p className={`font-mono text-lg font-bold tabular-nums ${stat.tone}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {processingRuns.length > 0 && (
            <ul className="mt-2.5 space-y-1 border-t border-[#e8f0eb] pt-2">
              {processingRuns.slice(0, 4).map((r) => (
                <li
                  key={`proc-${r.id}`}
                  className="flex items-center justify-between gap-2 text-[11px] text-[#52645d]"
                >
                  <span className="min-w-0 truncate font-semibold text-[#0f2c20]">
                    {r.ligandName}
                    <span className="mx-1 font-normal text-[#8aa094]">→</span>
                    <span className="font-mono text-emerald-800">{r.pdbId}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-900">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    {normalizeStatus(r.jobStatus)}
                  </span>
                </li>
              ))}
              {processingRuns.length > 4 && (
                <li className="text-[10px] text-[#8aa094]">
                  +{processingRuns.length - 4} more active
                </li>
              )}
            </ul>
          )}
        </div>
      </motion.section>

      {/* Best affinity / empty / failed-only */}
      {bestOverall ? (
        <motion.section
          key={`best-${bestOverall.id}-${bestOverall.bindingAffinity}`}
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: easeOut }}
          className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/80">
                Best binding affinity
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
                  {Number(bestOverall.bindingAffinity).toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-emerald-800">kcal/mol</span>
              </p>
              <p className="mt-1.5 text-[12px] font-semibold text-[#0f2c20]">
                {bestOverall.ligandName}
              </p>
              <p className="mt-0.5 text-[11px] text-[#52645d]">
                {bestOverall.targetProtein}
                <span className="mx-1 text-[#c5d4cb]">·</span>
                <a
                  href={`https://www.rcsb.org/structure/${bestOverall.pdbId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 font-mono font-bold text-emerald-800 hover:underline"
                >
                  {bestOverall.pdbId}
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 content-start">
              <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8aa094]">
                  Ranked complexes
                </p>
                <p className="mt-0.5 font-mono text-xl font-bold text-[#0f2c20]">
                  {uniqueCompleted.length}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8aa094]">
                  Showing
                </p>
                <p className="mt-0.5 font-mono text-xl font-bold text-[#0f2c20]">
                  {displayedRuns.length}
                </p>
              </div>
              {topDisplayed && topDisplayed.id !== bestOverall.id && (
                <div className="col-span-2 rounded-xl border border-emerald-100 bg-white/80 px-3 py-2 text-[11px] text-[#52645d]">
                  Filtered best:{" "}
                  <span className="font-semibold text-[#0f2c20]">
                    {topDisplayed.ligandName}
                  </span>{" "}
                  <span className="font-mono font-bold text-emerald-800">
                    {Number(topDisplayed.bindingAffinity).toFixed(2)} kcal/mol
                  </span>
                </div>
              )}
              {progress.processing > 0 && (
                <div className="col-span-2 flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 text-[11px] font-semibold text-sky-900">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Showing completed scores while {progress.processing} job
                  {progress.processing === 1 ? "" : "s"} still process
                </div>
              )}
            </div>
          </div>
        </motion.section>
      ) : progress.processing > 0 ? (
        <motion.section
          initial={initial}
          animate={enter}
          className="rounded-2xl border border-sky-200 bg-sky-50/50 px-4 py-6 text-center"
        >
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-sky-700" />
          <p className="mt-2 text-xs font-semibold text-[#0f2c20]">
            Docking in progress — scores will appear as jobs complete
          </p>
          <p className="mt-1 text-[11px] text-[#6d7f76]">
            {progress.completed}/{progress.total} completed · {progress.percent}%
          </p>
        </motion.section>
      ) : progress.failed > 0 && progress.completed === 0 ? (
        <motion.section
          initial={initial}
          animate={enter}
          className="rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-6 text-center"
        >
          <AlertTriangle className="mx-auto h-7 w-7 text-rose-700" />
          <p className="mt-2 text-xs font-semibold text-[#0f2c20]">
            {progress.failed} docking job{progress.failed === 1 ? "" : "s"} failed
          </p>
          <p className="mt-1 text-[11px] text-[#6d7f76]">
            No binding affinity scores are available yet.
          </p>
          {onRetryFailed && (
            <button
              type="button"
              disabled={isRetrying}
              onClick={handleRetryFailed}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {isRetrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Retry failed jobs
            </button>
          )}
        </motion.section>
      ) : (
        <motion.section
          initial={initial}
          animate={enter}
          className="rounded-2xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-6 text-center"
        >
          <Activity className="mx-auto h-7 w-7 text-[#8aa094]" />
          <p className="mt-2 text-xs font-semibold text-[#0f2c20]">
            No completed docking results yet
          </p>
          <p className="mt-1 text-[11px] text-[#8aa094]">
            Run Molecular Docking Execution to generate predicted binding affinities.
          </p>
        </motion.section>
      )}

      {/* Failed summary when partial results exist */}
      {progress.failed > 0 && progress.completed > 0 && (
        <motion.div
          initial={initial}
          animate={enter}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-950"
        >
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" />
            {progress.failed} failed job{progress.failed === 1 ? "" : "s"}
            {failedRuns[0]?.errorMessage
              ? ` · ${String(failedRuns[0].errorMessage).slice(0, 80)}`
              : ""}
          </span>
          {onRetryFailed && (
            <button
              type="button"
              disabled={isRetrying}
              onClick={handleRetryFailed}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2 py-1 text-[10px] font-bold hover:bg-amber-50 disabled:opacity-50"
            >
              {isRetrying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Retry failed
            </button>
          )}
        </motion.div>
      )}

      {/* Ranked results table */}
      <motion.section
        initial={initial}
        animate={enter}
        transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.04, ease: easeOut }}
        className="space-y-2.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#0f2c20]">
              Ranked Docking Results
            </h3>
            <p className="text-[11px] text-[#8aa094]">
              {displayedRuns.length} complex{displayedRuns.length === 1 ? "" : "es"}
              {sortOrder === "best" ? " · most negative ΔG first" : ""}
              {duplicateHidden > 0 ? ` · ${duplicateHidden} duplicate pose(s) hidden` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="rounded-lg border border-[#d5e3da] bg-[#f7faf8] px-2 py-1 text-[11px] font-medium text-[#52645d] outline-none focus:border-emerald-600"
              aria-label="Filter by target protein"
            >
              <option value="ALL">All targets</option>
              {targetOptions.map(([pdb, label]) => (
                <option key={pdb} value={pdb}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={selectedLigand}
              onChange={(e) => setSelectedLigand(e.target.value)}
              className="rounded-lg border border-[#d5e3da] bg-[#f7faf8] px-2 py-1 text-[11px] font-medium text-[#52645d] outline-none focus:border-emerald-600"
              aria-label="Filter by compound"
            >
              <option value="ALL">All compounds</option>
              {ligandOptions.map((lig) => (
                <option key={lig} value={lig}>
                  {lig}
                </option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "best" | "worst" | "name")}
              className="rounded-lg border border-[#d5e3da] bg-[#f7faf8] px-2 py-1 text-[11px] font-medium text-[#52645d] outline-none focus:border-emerald-600"
              aria-label="Sort ranked results"
            >
              <option value="best">Best ΔG first</option>
              <option value="worst">Least negative first</option>
              <option value="name">Compound A–Z</option>
            </select>
          </div>
        </div>

        {isRefreshing && uniqueCompleted.length === 0 && progress.processing === 0 ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <SkeletonBlock key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : displayedRuns.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[#d7e4dc]/90">
            <table className="w-full min-w-[42rem] text-left text-xs">
              <thead className="border-b border-[#e8f0eb] bg-[#f7faf8] text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                <tr>
                  <th className="w-12 px-2.5 py-2">Rank</th>
                  <th className="px-2.5 py-2">Compound</th>
                  <th className="px-2.5 py-2">Target Protein</th>
                  <th className="px-2.5 py-2">PDB ID</th>
                  <th className="px-2.5 py-2 text-right">Binding Affinity (ΔG)</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8f0eb]">
                <AnimatePresence initial={!reduceMotion}>
                  {displayedRuns.map((r, idx) => {
                    const score = Number(r.bindingAffinity);
                    const hasScore = Number.isFinite(score);
                    return (
                      <motion.tr
                        key={`${r.id}-${r.pdbId}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.22,
                          delay: reduceMotion ? 0 : Math.min(idx * 0.04, 0.32),
                          ease: easeOut,
                        }}
                        className={
                          idx === 0
                            ? "bg-emerald-50/40 transition-colors hover:bg-emerald-50/70"
                            : "bg-white transition-colors hover:bg-[#f7faf8]"
                        }
                      >
                        <td className="px-2.5 py-2 font-mono text-[11px] font-bold text-[#8aa094]">
                          #{idx + 1}
                        </td>
                        <td className="px-2.5 py-2">
                          <button
                            type="button"
                            onClick={() => setInspectedRun(r)}
                            className="text-left font-semibold text-[#0f2c20] hover:text-emerald-800 hover:underline"
                          >
                            {r.ligandName}
                          </button>
                        </td>
                        <td className="px-2.5 py-2 text-[11px] text-[#52645d]">
                          {r.targetProtein}
                        </td>
                        <td className="px-2.5 py-2">
                          <a
                            href={`https://www.rcsb.org/structure/${r.pdbId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 font-mono text-[11px] font-bold text-emerald-800 hover:underline"
                          >
                            {r.pdbId}
                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                          </a>
                        </td>
                        <td className="px-2.5 py-2 text-right">
                          {hasScore ? (
                            <>
                              <span className="font-mono text-sm font-bold text-[#0f2c20]">
                                {score.toFixed(2)}
                              </span>
                              <span className="ml-1 text-[10px] font-semibold text-[#8aa094]">
                                kcal/mol
                              </span>
                            </>
                          ) : (
                            <span className="text-[#8aa094]">—</span>
                          )}
                        </td>
                        <td className="px-2.5 py-2">
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-900">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        </td>
                        <td className="px-2.5 py-2">
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            <button
                              type="button"
                              disabled={!hasScore}
                              onClick={() => openVisual(r.id, 5)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2 py-1 text-[10px] font-semibold text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                              title="View 2D Interaction"
                            >
                              <Compass className="h-3 w-3" />
                              View 2D
                            </button>
                            <button
                              type="button"
                              disabled={!hasScore}
                              onClick={() => openVisual(r.id, 6)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                              title="View 3D Structure"
                            >
                              <Box className="h-3 w-3" />
                              View 3D
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : uniqueCompleted.length === 0 ? (
          progress.processing > 0 ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/40 px-3 py-2.5"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-700" />
                  <SkeletonBlock className="h-3 flex-1" />
                </div>
              ))}
              <p className="text-center text-[11px] text-[#8aa094]">
                Waiting for completed scores…
              </p>
            </div>
          ) : null
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-6 text-center text-[11px] text-[#8aa094]">
            No complexes match the current filters.
          </div>
        )}

        {/* Compact non-completed status rows */}
        {(processingRuns.length > 0 || failedRuns.length > 0) && (
          <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8]/80 p-2.5">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
              Other job statuses
            </p>
            <ul className="space-y-1">
              {[...processingRuns, ...failedRuns].slice(0, 6).map((r) => {
                const bucket = bucketForRun(r);
                return (
                  <li
                    key={`other-${r.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white bg-white px-2.5 py-1.5 text-[11px]"
                  >
                    <span className="min-w-0 truncate font-semibold text-[#0f2c20]">
                      {r.ligandName}
                      <span className="mx-1 font-normal text-[#8aa094]">→</span>
                      <span className="font-mono text-emerald-800">{r.pdbId}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-[#8aa094]">ΔG —</span>
                      {bucket === "processing" ? (
                        <span className="inline-flex items-center gap-1 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-900">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Processing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-900">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Failed
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </motion.section>

      {/* Disclaimer */}
      <p className="flex items-start gap-1.5 px-1 text-[11px] leading-relaxed text-[#6d7f76]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
        Binding affinity scores are computational predictions, not experimental proof of
        biological activity or therapeutic efficacy. Experimental validation is required.
      </p>

      {/* Expandable score notes */}
      <div className="overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
        <button
          type="button"
          onClick={() => setShowScoreNotes(!showScoreNotes)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[11px] font-semibold text-[#52645d] hover:bg-[#f7faf8]"
        >
          <span className="inline-flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#8aa094]" />
            How to read ΔG scores
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#8aa094] transition ${showScoreNotes ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence>
          {showScoreNotes && (
            <motion.div
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#e8f0eb]"
            >
              <div className="space-y-2 p-3 text-[11px] leading-relaxed text-[#6d7f76]">
                <p>
                  AutoDock Vina reports predicted binding free energy (ΔG) in kcal/mol. More
                  negative values indicate stronger predicted binding for that ligand–receptor
                  pose under the docking model.
                </p>
                <p>
                  Ranking uses the most negative completed score per unique ligand × PDB pair.
                  Progress percentage is completed jobs ÷ total docking complexes from live
                  workspace data.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
              initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#e8f0eb] pb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#0f2c20]">
                    {inspectedRun.ligandName}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#8aa094]">
                    {inspectedRun.targetProtein}
                    <span className="mx-1">·</span>
                    <span className="font-mono font-semibold text-emerald-800">
                      {inspectedRun.pdbId}
                    </span>
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

              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/80">
                  Binding affinity (ΔG)
                </p>
                <p className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-bold text-emerald-950">
                    {Number(inspectedRun.bindingAffinity).toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">kcal/mol</span>
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Engine",
                    value: inspectedRun.vinaVersion
                      ? `AutoDock Vina ${inspectedRun.vinaVersion}`
                      : "AutoDock Vina",
                  },
                  {
                    label: "Poses",
                    value: String(inspectedRun.poseCount ?? "—"),
                  },
                  {
                    label: "Exhaustiveness",
                    value: String(inspectedRun.exhaustiveness ?? "—"),
                  },
                  {
                    label: "PDB",
                    value: inspectedRun.pdbId,
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
                    onClick={() => openVisual(inspectedRun.id, 5)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-[#f7faf8] px-3 py-1.5 text-xs font-semibold text-[#52645d] hover:border-emerald-400"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    View 2D Interaction
                  </button>
                  <button
                    type="button"
                    onClick={() => openVisual(inspectedRun.id, 6)}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    <Box className="h-3.5 w-3.5" />
                    View 3D Structure
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
