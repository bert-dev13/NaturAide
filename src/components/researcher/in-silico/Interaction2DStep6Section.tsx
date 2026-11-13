// src/components/researcher/in-silico/Interaction2DStep6Section.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Atom,
  ArrowRight,
  Loader2,
  Box,
  Droplets,
  Waves,
  Zap,
  CircleDot,
  AlertTriangle,
} from "lucide-react";
import Interaction2DDiagram from "./Interaction2DDiagram";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step6Props {
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
  onNavigateTo3D: () => void;
}

type TypeFilter = "ALL" | "HBond" | "Hydrophobic" | "Salt";

function typeBucket(t: string): TypeFilter | "Other" {
  const s = (t || "").toLowerCase();
  if (s.includes("hydrogen") || s.includes("h-bond")) return "HBond";
  if (s.includes("hydrophobic")) return "Hydrophobic";
  if (s.includes("salt") || s.includes("ionic")) return "Salt";
  return "Other";
}

function typeLabel(bucket: TypeFilter | "Other") {
  if (bucket === "HBond") return "Hydrogen Bond";
  if (bucket === "Hydrophobic") return "Hydrophobic";
  if (bucket === "Salt") return "Salt Bridge";
  return "Other Contact";
}

function typePill(bucket: TypeFilter | "Other") {
  if (bucket === "HBond") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (bucket === "Hydrophobic") return "border-amber-200 bg-amber-50 text-amber-900";
  if (bucket === "Salt") return "border-indigo-200 bg-indigo-50 text-indigo-900";
  return "border-[#d7e4dc] bg-[#f7faf8] text-[#52645d]";
}

function normalizeItem(item: any) {
  const resName = item.resName || item.residueName || "";
  const resSeq = item.resSeq ?? item.residueSeq ?? "";
  const distance =
    item.distanceAngstroms ?? (item.distance != null ? Number(item.distance) : NaN);
  return {
    ...item,
    resName,
    resSeq,
    residue: item.residue || `${resName} ${resSeq}`.trim(),
    interactionType: item.interactionType || "Contact",
    distanceAngstroms: Number.isFinite(Number(distance)) ? Number(distance) : null,
    proteinAtom: item.proteinAtom || item.atomName || "—",
  };
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#e8f0eb] ${className}`} aria-hidden />;
}

export default function Interaction2DStep6Section({
  plantName,
  runs = [],
  selectedRunId,
  onSelectRunId,
  selectedPose: controlledPose,
  onSelectPose,
  structureData,
  isLoadingStructures,
  onNavigateTo3D,
}: Step6Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const [localPose, setLocalPose] = useState(1);
  const selectedPose = controlledPose ?? localPose;
  const setSelectedPose = (pose: number) => {
    if (onSelectPose) onSelectPose(pose);
    else setLocalPose(pose);
  };

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [awaitingInitialLoad, setAwaitingInitialLoad] = useState(true);

  // Unique completed complexes (ligand × PDB)
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

  // Remount diagram animation when complex changes
  useEffect(() => {
    setMapKey((k) => k + 1);
    setShowAllContacts(false);
  }, [activeRun?.id, typeFilter]);

  // Keep pose within available count when complex changes
  useEffect(() => {
    const maxPose = activeRun?.poseCount || 9;
    if (selectedPose > maxPose) setSelectedPose(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRun?.id, activeRun?.poseCount]);

  const rawInteractions = useMemo(() => {
    const list = structureData?.interactions?.interactions || [];
    return (Array.isArray(list) ? list : []).map(normalizeItem);
  }, [structureData]);

  const categoryCounts = useMemo(() => {
    let hBonds = 0;
    let hydrophobic = 0;
    let saltBridges = 0;
    rawInteractions.forEach((item: any) => {
      const b = typeBucket(item.interactionType);
      if (b === "HBond") hBonds++;
      else if (b === "Hydrophobic") hydrophobic++;
      else if (b === "Salt") saltBridges++;
    });
    return {
      hBonds,
      hydrophobic,
      saltBridges,
      total: rawInteractions.length,
    };
  }, [rawInteractions]);

  const filteredContacts = useMemo(() => {
    let list = [...rawInteractions];
    if (typeFilter !== "ALL") {
      list = list.filter((i) => typeBucket(i.interactionType) === typeFilter);
    }
    list.sort(
      (a, b) => (a.distanceAngstroms ?? 99) - (b.distanceAngstroms ?? 99)
    );
    return list;
  }, [rawInteractions, typeFilter]);

  const visibleContacts = showAllContacts
    ? filteredContacts
    : filteredContacts.slice(0, 12);

  const easeOut = [0.22, 1, 0.36, 1] as const;
  const initial = reduceMotion ? false : { opacity: 0, y: 8 };
  const hasInteractions = rawInteractions.length > 0;

  // Avoid empty-state flash before the parent structure fetch effect starts
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

  const loadError =
    !isLoadingStructures &&
    !awaitingInitialLoad &&
    activeRun &&
    structureData &&
    !structureData.receptorPdb &&
    !structureData.ligandPdbqt;

  const showMapLoading =
    Boolean(activeRun) &&
    !hasInteractions &&
    !loadError &&
    (isLoadingStructures || awaitingInitialLoad);

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
              <Atom className="h-4 w-4 text-emerald-700" />
              2D Interaction Visualization
            </h2>
            <p className="mt-0.5 text-[12px] text-[#6d7f76]">
              Explore how selected compounds interact with target protein residues.
            </p>
            {plantName && (
              <p className="mt-1 text-[11px] text-[#8aa094]">{plantName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onNavigateTo3D}
            disabled={!activeRun}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Box className="h-3.5 w-3.5" />
            Open 3D Visualization
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Complex summary + selectors */}
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.55fr)]">
          <select
            value={activeRun?.id || ""}
            onChange={(e) => onSelectRunId(parseInt(e.target.value, 10))}
            disabled={completedRuns.length === 0}
            className="rounded-xl border border-[#d5e3da] bg-[#f7faf8] px-3 py-2 text-xs font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 disabled:opacity-50"
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
            className="rounded-xl border border-[#d5e3da] bg-[#f7faf8] px-3 py-2 text-xs font-medium text-[#52645d] outline-none focus:border-emerald-600 disabled:opacity-50"
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
          <div className="flex items-center rounded-xl border border-[#e8f0eb] bg-[#f7faf8] px-3 py-2">
            {activeRun ? (
              <span className="font-mono text-sm font-bold text-emerald-900">
                {Number(activeRun.bindingAffinity).toFixed(2)}{" "}
                <span className="text-[10px] font-semibold text-[#8aa094]">kcal/mol</span>
              </span>
            ) : (
              <span className="text-[11px] text-[#8aa094]">No score</span>
            )}
          </div>
        </div>

        {activeRun && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#52645d]">
            <span>
              <span className="text-[#8aa094]">Compound</span>{" "}
              <span className="font-semibold text-[#0f2c20]">{activeRun.ligandName}</span>
            </span>
            <span className="text-[#d7e4dc]">·</span>
            <span>
              <span className="text-[#8aa094]">Target</span>{" "}
              <span className="font-semibold text-[#0f2c20]">{activeRun.targetProtein}</span>
            </span>
            <span className="text-[#d7e4dc]">·</span>
            <span>
              <span className="text-[#8aa094]">PDB</span>{" "}
              <span className="font-mono font-bold text-emerald-800">{activeRun.pdbId}</span>
            </span>
            <span className="text-[#d7e4dc]">·</span>
            <span>
              <span className="text-[#8aa094]">Pose</span>{" "}
              <span className="font-semibold text-[#0f2c20]">{selectedPose}</span>
            </span>
          </div>
        )}
      </motion.section>

      {/* Interaction statistics */}
      <motion.div
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, delay: reduceMotion ? 0 : 0.03, ease: easeOut }}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {[
          {
            key: "HBond" as TypeFilter,
            label: "Hydrogen Bonds",
            value: categoryCounts.hBonds,
            icon: Droplets,
            active: "border-emerald-400 bg-emerald-50 text-emerald-900",
            iconTone: "text-emerald-700",
          },
          {
            key: "Hydrophobic" as TypeFilter,
            label: "Hydrophobic",
            value: categoryCounts.hydrophobic,
            icon: Waves,
            active: "border-amber-400 bg-amber-50 text-amber-900",
            iconTone: "text-amber-700",
          },
          {
            key: "Salt" as TypeFilter,
            label: "Salt Bridges",
            value: categoryCounts.saltBridges,
            icon: Zap,
            active: "border-indigo-400 bg-indigo-50 text-indigo-900",
            iconTone: "text-indigo-700",
          },
          {
            key: "ALL" as TypeFilter,
            label: "Total Contacts",
            value: categoryCounts.total,
            icon: CircleDot,
            active: "border-emerald-700 bg-[#0f2c20] text-white",
            iconTone: "text-emerald-300",
          },
        ].map((chip) => {
          const Icon = chip.icon;
          const selected = typeFilter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setTypeFilter(chip.key)}
              className={`rounded-xl border px-2.5 py-2.5 text-left transition ${
                selected
                  ? chip.active
                  : "border-[#d7e4dc] bg-white text-[#52645d] hover:border-emerald-300"
              }`}
            >
              <span className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                  {chip.label}
                </span>
                <Icon className={`h-3.5 w-3.5 ${selected ? chip.iconTone : "text-[#8aa094]"}`} />
              </span>
              <span className="mt-0.5 block font-mono text-xl font-bold tabular-nums">
                {showMapLoading ? "—" : chip.value}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Main 2D map */}
      <motion.section
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.05, ease: easeOut }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-sm font-bold tracking-tight text-[#0f2c20]">
            Interaction Map
          </h3>
          {showMapLoading && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#6d7f76]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
              Loading interactions…
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showMapLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white p-3"
              aria-busy="true"
              aria-label="Loading interaction map"
            >
              <SkeletonBlock className="mb-3 h-8 w-full" />
              <SkeletonBlock className="mx-auto h-[28rem] w-full max-w-3xl rounded-2xl bg-[#0b1f16]/10" />
              <div className="mt-3 flex gap-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-4 w-20" />
              </div>
            </motion.div>
          ) : loadError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-10 text-center"
            >
              <AlertTriangle className="mx-auto h-7 w-7 text-rose-700" />
              <p className="mt-2 text-xs font-semibold text-[#0f2c20]">
                Structure files unavailable
              </p>
              <p className="mt-1 text-[11px] text-[#6d7f76]">
                Interaction analysis could not load receptor or ligand coordinates for this complex.
              </p>
            </motion.div>
          ) : activeRun && hasInteractions ? (
            <motion.div
              key={`map-${mapKey}`}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: easeOut }}
            >
              <Interaction2DDiagram
                ligandName={activeRun.ligandName}
                proteinName={activeRun.targetProtein}
                pdbId={activeRun.pdbId}
                bindingAffinity={activeRun.bindingAffinity}
                interactions={rawInteractions}
                maxNodes={14}
                typeFilter={typeFilter}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-12 text-center"
            >
              <Atom className="mx-auto h-8 w-8 text-[#8aa094]" />
              <p className="mt-2 text-xs font-semibold text-[#0f2c20]">
                No interaction data yet
              </p>
              <p className="mt-1 text-[11px] text-[#8aa094]">
                Complete molecular docking, then select a scored complex above.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Residue contact details */}
      {(hasInteractions || showMapLoading) && (
        <motion.section
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.08, ease: easeOut }}
          className="space-y-2.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f0eb] pb-2.5">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[#0f2c20]">
                Residue Contact Details
              </h3>
              <p className="text-[11px] text-[#8aa094]">
                {filteredContacts.length === 1
                  ? "1 contact"
                  : `${filteredContacts.length} contacts`}
                {typeFilter !== "ALL" ? ` · ${typeLabel(typeFilter)}` : ""}
                {" · closest first"}
              </p>
            </div>
            {filteredContacts.length > 12 && (
              <button
                type="button"
                onClick={() => setShowAllContacts((v) => !v)}
                className="rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2.5 py-1 text-[10px] font-semibold text-emerald-800 hover:border-emerald-400"
              >
                {showAllContacts ? "Show less" : "Show all"}
              </button>
            )}
          </div>

          {showMapLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonBlock key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#d7e4dc]/90">
              <table className="w-full min-w-[32rem] text-left text-xs">
                <thead className="border-b border-[#e8f0eb] bg-[#f7faf8] text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                  <tr>
                    <th className="px-2.5 py-2">Residue</th>
                    <th className="px-2.5 py-2">Atom</th>
                    <th className="px-2.5 py-2 text-right">Distance (Å)</th>
                    <th className="px-2.5 py-2">Interaction Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8f0eb]">
                  <AnimatePresence initial={!reduceMotion}>
                    {visibleContacts.map((item: any, idx: number) => {
                      const bucket = typeBucket(item.interactionType);
                      return (
                        <motion.tr
                          key={`${item.residue}-${item.proteinAtom}-${idx}`}
                          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.18,
                            delay: reduceMotion ? 0 : Math.min(idx * 0.03, 0.24),
                          }}
                          className="bg-white hover:bg-[#f7faf8]"
                        >
                          <td className="px-2.5 py-2 font-mono text-[11px] font-bold text-[#0f2c20]">
                            {item.residue}
                          </td>
                          <td className="px-2.5 py-2 font-mono text-[11px] text-[#52645d]">
                            {item.proteinAtom}
                          </td>
                          <td className="px-2.5 py-2 text-right font-mono text-[11px] font-semibold text-[#0f2c20]">
                            {item.distanceAngstroms != null
                              ? item.distanceAngstroms.toFixed(2)
                              : "—"}
                          </td>
                          <td className="px-2.5 py-2">
                            <span
                              className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${typePill(bucket)}`}
                            >
                              {typeLabel(bucket)}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
              {visibleContacts.length === 0 && (
                <p className="px-3 py-6 text-center text-[11px] text-[#8aa094]">
                  No contacts in this filter.
                </p>
              )}
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}
