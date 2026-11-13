"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Leaf,
  FlaskConical,
  Target,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Compass,
  Box,
  ArrowRight,
  Cpu,
} from "lucide-react";
import type { DockingRunItem } from "@/components/researcher/in-silico/DockingExecutionStep4Section";

interface Props {
  projectId: number;
  plantName: string;
  plantScientificName?: string | null;
  compounds: any[];
  targets: any[];
  runs: DockingRunItem[];
  onSelectRunForVisuals: (runId: number, targetStep: 5 | 6) => void;
  onNavigateToResults?: () => void;
}

type DisplayStatus =
  | "Queued"
  | "Preparing"
  | "Running"
  | "Completed"
  | "Failed"
  | "Timed Out"
  | "Needs Attention"
  | "Ready";

type StatusFilter = "ALL" | "READY" | "ACTIVE" | "DONE" | "ISSUE";

interface MatrixRow {
  key: string;
  ligandName: string;
  targetName: string;
  pdbId: string;
  runId: number | null;
  displayStatus: DisplayStatus;
  affinity: number | null;
  error: string | null;
  elapsedLabel: string | null;
  exhaustiveness: number | null;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function formatElapsed(startedAt?: string, completedAt?: string): string | null {
  if (!startedAt || !completedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const totalSec = Math.max(1, Math.floor((end - start) / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return secs ? `${mins}m ${secs}s` : `${mins}m`;
}

function mapStatus(run?: DockingRunItem | null): DisplayStatus {
  if (!run) return "Ready";
  const raw = String(run.jobStatus || run.engineStatus || "").toUpperCase();
  const err = String(run.errorMessage || "");
  if (raw === "COMPLETED" && run.bindingAffinity != null && Number.isFinite(Number(run.bindingAffinity))) {
    return "Completed";
  }
  if (raw === "TIMED_OUT" || /timed out/i.test(err)) return "Timed Out";
  if (raw === "FAILED" || err) return "Failed";
  if (raw === "QUEUED") return "Queued";
  if (raw === "PREPARING") return "Preparing";
  if (["DOCKING", "PROCESSING", "RUNNING"].includes(raw)) return "Running";
  if (raw === "COMPLETED") return "Completed";
  return "Ready";
}

function StatusPill({ status, title }: { status: DisplayStatus; title?: string }) {
  const base =
    "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold";
  switch (status) {
    case "Completed":
      return (
        <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-900`} title={title}>
          <CheckCircle2 className="h-2.5 w-2.5" />
          Done{title ? ` · ${title}` : ""}
        </span>
      );
    case "Running":
    case "Preparing":
    case "Queued":
      return (
        <span className={`${base} border-sky-200 bg-sky-50 text-sky-900`}>
          <Clock className="h-2.5 w-2.5" />
          {status}
        </span>
      );
    case "Failed":
    case "Timed Out":
      return (
        <span className={`${base} border-rose-200 bg-rose-50 text-rose-900`} title={title}>
          <AlertCircle className="h-2.5 w-2.5" />
          {status}
        </span>
      );
    case "Needs Attention":
      return (
        <span className={`${base} border-amber-200 bg-amber-50 text-amber-950`} title={title}>
          <AlertTriangle className="h-2.5 w-2.5" />
          Blocked
        </span>
      );
    default:
      return (
        <span className={`${base} border-slate-200 bg-white text-slate-600`}>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Ready
        </span>
      );
  }
}

export default function ReviewerDockingExecutionStep4({
  plantName,
  plantScientificName,
  compounds,
  targets,
  runs,
  onSelectRunForVisuals,
  onNavigateToResults,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const selectedCompounds = useMemo(() => {
    const selected = compounds.filter(
      (c) => c.selectedForDocking !== 0 && c.selectedForDocking !== false
    );
    const pool = selected.length > 0 ? selected : compounds;
    const map = new Map<string, any>();
    for (const c of pool) {
      const key = `${String(c.compoundName || c.name || "")
        .toLowerCase()
        .trim()}::${c.pubchemId || ""}`;
      if (!map.has(key)) map.set(key, c);
    }
    return Array.from(map.values());
  }, [compounds]);

  const uniqueTargets = useMemo(() => {
    const map = new Map<string, any>();
    for (const t of targets) {
      const pdb = String(t.pdbId || "").toUpperCase();
      if (!pdb) continue;
      if (!map.has(pdb)) map.set(pdb, t);
    }
    // Fallback: derive from runs if target list empty
    if (map.size === 0) {
      for (const r of runs) {
        const pdb = String(r.pdbId || "").toUpperCase();
        if (!pdb || map.has(pdb)) continue;
        map.set(pdb, {
          id: r.targetId,
          pdbId: pdb,
          targetName: r.targetProtein,
        });
      }
    }
    return Array.from(map.values());
  }, [targets, runs]);

  const matrixRows: MatrixRow[] = useMemo(() => {
    const ligandPool =
      selectedCompounds.length > 0
        ? selectedCompounds
        : Array.from(
            new Map(
              runs.map((r) => [
                String(r.ligandName || "").toLowerCase(),
                {
                  id: r.compoundId,
                  compoundName: r.ligandName,
                },
              ])
            ).values()
          );

    const receptorPool =
      uniqueTargets.length > 0
        ? uniqueTargets
        : Array.from(
            new Map(
              runs.map((r) => [
                String(r.pdbId || "").toUpperCase(),
                {
                  id: r.targetId,
                  pdbId: r.pdbId,
                  targetName: r.targetProtein,
                },
              ])
            ).values()
          );

    if (ligandPool.length === 0 || receptorPool.length === 0) {
      // Show runs as flat list when we cannot reconstruct the matrix
      return runs.map((r, idx) => ({
        key: `run-${r.id || idx}`,
        ligandName: r.ligandName || "Ligand",
        targetName: r.targetProtein || "Receptor",
        pdbId: String(r.pdbId || "").toUpperCase(),
        runId: r.id,
        displayStatus: mapStatus(r),
        affinity:
          r.bindingAffinity != null && Number.isFinite(Number(r.bindingAffinity))
            ? Number(r.bindingAffinity)
            : null,
        error: r.errorMessage || null,
        elapsedLabel: formatElapsed(r.startedAt || r.createdAt, r.completedAt),
        exhaustiveness: r.exhaustiveness ?? null,
      }));
    }

    const rows: MatrixRow[] = [];
    for (const c of ligandPool) {
      for (const t of receptorPool) {
        const cId = Number(c.id);
        const tId = Number(t.id);
        const pdb = String(t.pdbId || "").toUpperCase();
        const matching =
          runs.find(
            (r) =>
              Number(r.compoundId) === cId &&
              (Number(r.targetId) === tId || String(r.pdbId || "").toUpperCase() === pdb)
          ) ||
          runs.find(
            (r) =>
              String(r.ligandName || "").toLowerCase() ===
                String(c.compoundName || c.name || "").toLowerCase() &&
              String(r.pdbId || "").toUpperCase() === pdb
          );

        rows.push({
          key: `${cId || c.compoundName}:${pdb}`,
          ligandName: c.compoundName || c.name || matching?.ligandName || "Ligand",
          targetName: t.targetName || t.proteinName || matching?.targetProtein || "Receptor",
          pdbId: pdb,
          runId: matching?.id ?? null,
          displayStatus: mapStatus(matching),
          affinity:
            matching?.bindingAffinity != null &&
            Number.isFinite(Number(matching.bindingAffinity))
              ? Number(matching.bindingAffinity)
              : null,
          error: matching?.errorMessage || null,
          elapsedLabel: formatElapsed(
            matching?.startedAt || matching?.createdAt,
            matching?.completedAt
          ),
          exhaustiveness: matching?.exhaustiveness ?? null,
        });
      }
    }

    // Collapse duplicate ligand×PDB
    const map = new Map<string, MatrixRow>();
    for (const row of rows) {
      const pairKey = `${row.ligandName.toLowerCase()}::${row.pdbId}`;
      const existing = map.get(pairKey);
      if (!existing) {
        map.set(pairKey, row);
        continue;
      }
      const rank = (s: DisplayStatus) =>
        s === "Completed" ? 5 : s === "Failed" || s === "Timed Out" ? 4 : 1;
      if (rank(row.displayStatus) > rank(existing.displayStatus)) map.set(pairKey, row);
      else if (
        rank(row.displayStatus) === rank(existing.displayStatus) &&
        (row.affinity ?? 999) < (existing.affinity ?? 999)
      ) {
        map.set(pairKey, row);
      }
    }
    return Array.from(map.values());
  }, [selectedCompounds, uniqueTargets, runs]);

  const xCount = new Set(matrixRows.map((r) => r.ligandName.toLowerCase())).size;
  const yCount = new Set(matrixRows.map((r) => r.pdbId).filter(Boolean)).size;
  const totalCombinations = matrixRows.length;
  const completedCount = matrixRows.filter((r) => r.displayStatus === "Completed").length;
  const failedCount = matrixRows.filter(
    (r) => r.displayStatus === "Failed" || r.displayStatus === "Timed Out"
  ).length;
  const activeCount = matrixRows.filter((r) =>
    ["Running", "Preparing", "Queued"].includes(r.displayStatus)
  ).length;
  const readyCount = matrixRows.filter((r) => r.displayStatus === "Ready").length;
  const progressPercent =
    totalCombinations > 0 ? Math.round((completedCount / totalCombinations) * 100) : 0;

  const bestRow = useMemo(() => {
    const done = matrixRows.filter(
      (r) => r.displayStatus === "Completed" && r.affinity != null
    );
    if (done.length === 0) return null;
    return [...done].sort((a, b) => Number(a.affinity) - Number(b.affinity))[0];
  }, [matrixRows]);

  const exhaustiveness =
    matrixRows.find((r) => r.exhaustiveness != null)?.exhaustiveness ??
    runs.find((r) => r.exhaustiveness != null)?.exhaustiveness ??
    8;
  const vinaVersion =
    runs.find((r) => r.vinaVersion)?.vinaVersion || "AutoDock Vina";

  const pdbList = Array.from(new Set(matrixRows.map((r) => r.pdbId).filter(Boolean)));

  const filteredRows = useMemo(() => {
    switch (statusFilter) {
      case "READY":
        return matrixRows.filter((r) => r.displayStatus === "Ready");
      case "ACTIVE":
        return matrixRows.filter((r) =>
          ["Running", "Preparing", "Queued"].includes(r.displayStatus)
        );
      case "DONE":
        return matrixRows.filter((r) => r.displayStatus === "Completed");
      case "ISSUE":
        return matrixRows.filter((r) =>
          ["Failed", "Timed Out", "Needs Attention"].includes(r.displayStatus)
        );
      default:
        return matrixRows;
    }
  }, [matrixRows, statusFilter]);

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
            <Zap className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#071930]">Docking Matrix</span>
          <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-900">
            {xCount}×{yCount} · {totalCombinations} pairs
          </span>
          <span className="hidden rounded-md border border-[#071930]/80 bg-[#071930] px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-100 sm:inline">
            Vina · exh {exhaustiveness}
          </span>
          <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 sm:inline">
            Read-only review
          </span>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
          {vinaVersion}
        </span>
      </motion.div>

      {/* Context + KPI cards */}
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
                {plantName || "Docking run"}
                {plantScientificName ? (
                  <span className="ml-1.5 text-[12px] font-normal italic text-slate-500">
                    ({plantScientificName})
                  </span>
                ) : null}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-600">{xCount} ligands</span>
                <span className="mx-1.5 text-slate-200">·</span>
                <span className="font-mono text-slate-600">
                  {pdbList.slice(0, 4).join(" · ")}
                  {pdbList.length > 4 ? ` +${pdbList.length - 4}` : ""}
                </span>
              </p>
            </div>
          </div>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Read-only · Section 2 · Step 3/7
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            {
              label: "Ligands",
              value: String(xCount),
              sub: selectedCompounds
                .slice(0, 2)
                .map((c) => c.compoundName || c.name)
                .filter(Boolean)
                .join(", ") || `${xCount} unique`,
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
              sub: `${completedCount}/${totalCombinations || 0} done`,
              icon: Activity,
            },
            {
              label: bestRow ? "Best ΔG" : "Status",
              value:
                bestRow?.affinity != null ? bestRow.affinity.toFixed(1) : completedCount > 0 ? "OK" : "—",
              sub: bestRow
                ? `${bestRow.ligandName} × ${bestRow.pdbId}`
                : `${failedCount} issues · ${readyCount} pending`,
              icon: Zap,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200/80 bg-white/90 px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {card.label}
                </span>
                <card.icon className="h-3 w-3 text-blue-700" />
              </div>
              <p className="mt-0.5 font-mono text-sm font-bold text-[#071930]">{card.value}</p>
              <p className="truncate text-[10px] text-slate-400">{card.sub}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Protocol strip */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-[11px]">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Cpu className="h-3.5 w-3.5 text-blue-700" />
            Engine
          </div>
          <p className="font-semibold text-[#071930]">{vinaVersion}</p>
          <p className="mt-0.5 text-slate-500">Exhaustiveness {exhaustiveness} · semi-rigid receptor</p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-[11px]">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Activity className="h-3.5 w-3.5 text-sky-700" />
            Completion
          </div>
          <p className="font-semibold text-[#071930]">
            {completedCount} of {totalCombinations || 0} scored
          </p>
          <p className="mt-0.5 text-slate-500">
            {failedCount > 0 ? `${failedCount} blocked/failed pairs` : "No blocking failures"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-[11px]">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Zap className="h-3.5 w-3.5 text-emerald-700" />
            Lead complex
          </div>
          {bestRow ? (
            <>
              <p className="font-semibold text-[#071930] truncate">
                {bestRow.ligandName} × {bestRow.pdbId}
              </p>
              <p className="mt-0.5 font-mono font-bold text-emerald-800">
                {bestRow.affinity?.toFixed(2)} kcal/mol
              </p>
            </>
          ) : (
            <p className="text-slate-500">Awaiting completed scores</p>
          )}
        </div>
      </div>

      {/* Pair matrix */}
      {totalCombinations > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
          className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_1px_2px_rgba(7,25,48,0.04)] sm:p-4"
        >
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-2.5 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-[10px] font-bold text-white">
                1
              </span>
              Pair matrix
              <span className="font-medium normal-case tracking-normal text-slate-400">
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
                  { key: "ISSUE", label: `Issues (${failedCount})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                    statusFilter === f.key
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#071930] to-blue-500 transition-all duration-500"
                style={{ width: `${Math.max(progressPercent, 2)}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-bold text-slate-600">
              {completedCount}/{totalCombinations}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/90">
            <div className="hidden grid-cols-[2rem_minmax(0,1.5fr)_6.5rem_4.5rem_5.5rem] gap-2 border-b border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 lg:grid">
              <span>#</span>
              <span>Ligand × receptor</span>
              <span>Status</span>
              <span className="text-right">ΔG</span>
              <span className="text-right">Inspect</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredRows.map((row, idx) => {
                const isStrong = row.affinity !== null && row.affinity <= -8.0;
                return (
                  <div
                    key={row.key}
                    className={`grid grid-cols-1 gap-2 px-2.5 py-2 lg:grid-cols-[2rem_minmax(0,1.5fr)_6.5rem_4.5rem_5.5rem] lg:items-center lg:gap-2 ${
                      row.displayStatus === "Completed"
                        ? "bg-emerald-50/20"
                        : row.displayStatus === "Failed" || row.displayStatus === "Timed Out"
                          ? "bg-rose-50/30"
                          : "bg-white hover:bg-slate-50/80"
                    }`}
                  >
                    <span className="hidden font-mono text-[10px] text-slate-400 lg:block">
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="truncate text-xs font-semibold text-[#071930]">
                          {row.ligandName}
                        </span>
                        <span className="text-[10px] text-slate-300">×</span>
                        <span className="truncate text-[11px] font-medium text-slate-600">
                          {row.targetName}
                        </span>
                        {row.pdbId && (
                          <span className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono text-[9px] font-bold text-blue-900">
                            {row.pdbId}
                          </span>
                        )}
                      </div>
                      {row.error &&
                        ["Failed", "Timed Out", "Needs Attention"].includes(row.displayStatus) && (
                          <p
                            className="mt-0.5 truncate text-[10px] text-rose-700"
                            title={row.error}
                          >
                            {row.error}
                          </p>
                        )}
                      <div className="mt-1 lg:hidden">
                        <StatusPill status={row.displayStatus} title={row.elapsedLabel || undefined} />
                      </div>
                    </div>

                    <div className="hidden lg:block">
                      <StatusPill status={row.displayStatus} title={row.elapsedLabel || undefined} />
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      {row.displayStatus === "Completed" && row.affinity !== null ? (
                        <span
                          className={`font-bold ${
                            isStrong ? "text-emerald-800" : "text-[#071930]"
                          }`}
                        >
                          {row.affinity.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {row.displayStatus === "Completed" && row.runId ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onSelectRunForVisuals(row.runId!, 5)}
                            className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-900"
                            title="Open 2D interactions"
                          >
                            <Compass className="h-2.5 w-2.5" />
                            2D
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectRunForVisuals(row.runId!, 6)}
                            className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-900"
                            title="Open 3D pose"
                          >
                            <Box className="h-2.5 w-2.5" />
                            3D
                          </button>
                        </>
                      ) : (
                        <span className="text-[9px] text-slate-400">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
          No docking pairs recorded for this dossier yet.
        </div>
      )}

      {/* Footer summary */}
      {totalCombinations > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#071930]">
              {completedCount === totalCombinations
                ? "Docking complete"
                : "Partial docking coverage"}
            </p>
            <p className="text-[11px] text-slate-500">
              {completedCount}/{totalCombinations} scored
              {bestRow?.affinity != null
                ? ` · best ${bestRow.affinity.toFixed(1)} kcal/mol (${bestRow.ligandName} × ${bestRow.pdbId})`
                : ""}
            </p>
          </div>
          {onNavigateToResults && completedCount > 0 && (
            <button
              type="button"
              onClick={onNavigateToResults}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700"
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
