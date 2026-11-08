// src/components/researcher/in-silico/Interaction2DStep6Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Atom,
  ArrowRight,
  Leaf,
  ChevronRight,
  Loader2,
  Box,
} from "lucide-react";
import Interaction2DDiagram from "./Interaction2DDiagram";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step6Props {
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

export default function Interaction2DStep6Section({
  plantName,
  runs = [],
  selectedRunId,
  onSelectRunId,
  structureData,
  isLoadingStructures,
  onNavigateTo3D,
}: Step6Props) {
  const [selectedPose, setSelectedPose] = useState<number>(1);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [showAllContacts, setShowAllContacts] = useState(false);

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
    : filteredContacts.slice(0, 8);

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
            <Atom className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">2D Contacts</span>
          {activeRun && (
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
              {Number(activeRun.bindingAffinity).toFixed(2)} kcal/mol
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onNavigateTo3D}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
        >
          <Box className="h-3 w-3" />
          Open 3D
          <ArrowRight className="h-3 w-3" />
        </button>
      </motion.div>

      {/* Context + selectors */}
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
                Residue contacts · pick complex · inspect map
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Pick complex" },
              { n: "2", label: "Read contacts" },
              { n: "3", label: "Open 3D" },
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

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <select
            value={activeRun?.id || ""}
            onChange={(e) => onSelectRunId(parseInt(e.target.value, 10))}
            disabled={completedRuns.length === 0}
            className="rounded-lg border border-[#d5e3da] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 disabled:opacity-50"
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
            className="rounded-lg border border-[#d5e3da] bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-emerald-600"
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
        </div>
      </motion.section>

      {/* Count chips */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          {
            key: "HBond" as TypeFilter,
            label: "H-bonds",
            value: categoryCounts.hBonds,
            active: "border-emerald-400 bg-emerald-50 text-emerald-900",
          },
          {
            key: "Hydrophobic" as TypeFilter,
            label: "Hydrophobic",
            value: categoryCounts.hydrophobic,
            active: "border-amber-400 bg-amber-50 text-amber-900",
          },
          {
            key: "Salt" as TypeFilter,
            label: "Salt bridges",
            value: categoryCounts.saltBridges,
            active: "border-indigo-400 bg-indigo-50 text-indigo-900",
          },
          {
            key: "ALL" as TypeFilter,
            label: "All contacts",
            value: categoryCounts.total,
            active: "border-emerald-600 bg-[#0f2c20] text-white",
          },
        ].map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setTypeFilter(chip.key)}
            className={`rounded-xl border px-2.5 py-2 text-left transition ${
              typeFilter === chip.key
                ? chip.active
                : "border-[#d7e4dc] bg-white text-[#52645d] hover:border-emerald-300"
            }`}
          >
            <span className="block text-[9px] font-bold uppercase tracking-wider opacity-80">
              {chip.label}
            </span>
            <span className="font-mono text-lg font-bold">{chip.value}</span>
          </button>
        ))}
      </div>

      {/* Map + contact list */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
            1
          </span>
          Interaction map
        </h3>

        {isLoadingStructures ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] py-14 text-[#8aa094]">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
            <p className="text-xs font-semibold text-[#52645d]">Loading contacts…</p>
          </div>
        ) : activeRun && rawInteractions.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <Interaction2DDiagram
              ligandName={activeRun.ligandName}
              proteinName={activeRun.targetProtein}
              pdbId={activeRun.pdbId}
              bindingAffinity={activeRun.bindingAffinity}
              interactions={rawInteractions}
              maxNodes={12}
              typeFilter={typeFilter}
            />

            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d7e4dc]/90">
              <div className="flex items-center justify-between border-b border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                  Contacts · {filteredContacts.length}
                </span>
                {filteredContacts.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllContacts((v) => !v)}
                    className="text-[10px] font-semibold text-emerald-800 hover:underline"
                  >
                    {showAllContacts ? "Show less" : "Show all"}
                  </button>
                )}
              </div>
              <div className="max-h-[28rem] divide-y divide-[#e8f0eb] overflow-y-auto">
                {visibleContacts.map((item: any, idx: number) => {
                  const bucket = typeBucket(item.interactionType);
                  const pill =
                    bucket === "HBond"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : bucket === "Hydrophobic"
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : bucket === "Salt"
                          ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                          : "border-[#d7e4dc] bg-[#f7faf8] text-[#52645d]";
                  return (
                    <div
                      key={`${item.residue}-${idx}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2.5 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[11px] font-bold text-[#0f2c20]">
                          {item.residue}
                        </p>
                        <p className="truncate text-[10px] text-[#8aa094]">
                          {item.proteinAtom}
                          {item.distanceAngstroms != null
                            ? ` · ${item.distanceAngstroms.toFixed(2)} Å`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold ${pill}`}
                      >
                        {bucket === "HBond"
                          ? "H-bond"
                          : bucket === "Hydrophobic"
                            ? "Hydro"
                            : bucket === "Salt"
                              ? "Salt"
                              : "Other"}
                      </span>
                    </div>
                  );
                })}
                {visibleContacts.length === 0 && (
                  <p className="px-3 py-6 text-center text-[11px] text-[#8aa094]">
                    No contacts in this filter.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-10 text-center">
            <Atom className="mx-auto h-7 w-7 text-[#8aa094]" />
            <p className="mt-2 text-xs font-semibold text-[#0f2c20]">
              No interaction data yet
            </p>
            <p className="mt-1 text-[11px] text-[#8aa094]">
              Complete docking in Step 4, then pick a scored complex above.
            </p>
          </div>
        )}
      </motion.section>
    </div>
  );
}
