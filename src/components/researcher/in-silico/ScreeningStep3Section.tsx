// src/components/researcher/in-silico/ScreeningStep3Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  Info,
  X,
  Sliders,
  Leaf,
  Beaker,
} from "lucide-react";

export interface ScreeningResultItem {
  id: number;
  compoundId: number;
  compoundName: string;
  molecularWeight?: number | null;
  molecularFormula?: string | null;
  compoundSmiles?: string | null;
  pubchemId?: string | null;
  resultSummary?: string | null;
  detailedMetrics?: any;
  engineStatus?: string;
  engineTool?: string;
}

interface Step3Props {
  projectId: number;
  compounds: any[];
  screenResults: ScreeningResultItem[];
  onRunScreening: () => Promise<void>;
  isScreening: boolean;
  onToggleDocking?: (compoundId: number, selected: boolean) => Promise<void>;
  onNextStep?: () => void;
}

function compoundKey(c: { compoundName?: string | null; pubchemId?: string | null }) {
  return `${(c.compoundName || "").toLowerCase().trim()}::${c.pubchemId || ""}`;
}

export default function ScreeningStep3Section({
  projectId: _projectId,
  compounds = [],
  screenResults = [],
  onRunScreening,
  isScreening,
  onToggleDocking,
  onNextStep: _onNextStep,
}: Step3Props) {
  const [inspectedId, setInspectedId] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DONE" | "PENDING" | "DOCK">("ALL");

  // Collapse duplicate name+CID rows (prefer docking-selected)
  const uniqueCompounds = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of compounds) {
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

  const duplicateCount = compounds.length - uniqueCompounds.length;

  const resultMap = useMemo(() => {
    const byId = new Map<number, ScreeningResultItem>();
    const byName = new Map<string, ScreeningResultItem>();
    for (const res of screenResults) {
      if (res.compoundId) byId.set(res.compoundId, res);
      if (res.compoundName) byName.set(res.compoundName.trim().toLowerCase(), res);
    }
    return { byId, byName };
  }, [screenResults]);

  const parseMetrics = (res?: ScreeningResultItem) => {
    if (!res) return null;
    let metrics: any = {};
    if (res.detailedMetrics) {
      metrics =
        typeof res.detailedMetrics === "string"
          ? (() => {
              try {
                return JSON.parse(res.detailedMetrics);
              } catch {
                return {};
              }
            })()
          : res.detailedMetrics;
    }

    const prop = metrics.physicochemicalProperties || {};
    const dl = metrics.drugLikeness?.lipinskiRuleOfFive || {};
    const admet = metrics.admet || {};
    const dockSuit = metrics.dockingSuitability || {};

    const mw =
      res.molecularWeight ||
      prop.molecularWeight?.value?.replace(" g/mol", "") ||
      "—";
    const formula = res.molecularFormula || prop.molecularFormula?.value || "—";
    const logP = prop.logP?.value !== undefined ? prop.logP.value : "—";
    const tpsa = prop.tpsa?.value !== undefined ? prop.tpsa.value : "—";
    const hbd = prop.hBondDonors?.value !== undefined ? prop.hBondDonors.value : "—";
    const hba = prop.hBondAcceptors?.value !== undefined ? prop.hBondAcceptors.value : "—";
    const rotBonds =
      prop.rotatableBonds?.value !== undefined ? prop.rotatableBonds.value : "—";
    const heavyAtoms =
      prop.heavyAtoms?.value !== undefined ? prop.heavyAtoms.value : "—";

    const status: "Completed" | "Needs Review" | "Failed" =
      res.engineStatus === "Completed" ||
      res.engineStatus === "Needs Review" ||
      res.engineStatus === "Failed"
        ? (res.engineStatus as any)
        : dl.violations !== undefined && dl.violations >= 2
          ? "Needs Review"
          : mw !== "—"
            ? "Completed"
            : "Failed";

    return {
      status,
      mw,
      formula,
      logP,
      tpsa,
      hbd,
      hba,
      rotBonds,
      heavyAtoms,
      lipinskiViolations: dl.violations ?? 0,
      lipinskiList: dl.violationsList || [],
      skinPerm: admet.skinPermeability?.prediction || "Moderate Permeability",
      skinLogKp: admet.skinPermeability?.logKp || null,
      giAbs: admet.giAbsorption?.prediction || "Moderate Absorption",
      bbb: admet.bbbPermeability?.prediction || "Non-permeant",
      waterSol: admet.waterSolubility?.prediction || "Moderate Solubility",
      cyp3a4: admet.cyp3a4Inhibition?.prediction || "Low Inhibition Potential",
      engineTool: res.engineTool || "RDKit + NatureAide QSAR",
      summary: res.resultSummary || "",
      suitabilityNote: dockSuit.recommendation || null,
    };
  };

  const getResult = (compound: any) =>
    resultMap.byId.get(compound.id) ||
    resultMap.byName.get((compound.compoundName || "").trim().toLowerCase());

  const evaluatedCount = uniqueCompounds.filter((c) => Boolean(getResult(c))).length;
  const dockCount = uniqueCompounds.filter(
    (c) => c.selectedForDocking === 1 || c.selectedForDocking === true
  ).length;

  const filteredCompounds = useMemo(() => {
    return uniqueCompounds.filter((c) => {
      const parsed = parseMetrics(getResult(c) || undefined);
      const isDock = c.selectedForDocking === 1 || c.selectedForDocking === true;
      if (statusFilter === "DONE") return Boolean(parsed);
      if (statusFilter === "PENDING") return !parsed;
      if (statusFilter === "DOCK") return isDock;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueCompounds, statusFilter, resultMap]);

  const handleToggle = async (compoundId: number, currentSelected: boolean) => {
    if (!onToggleDocking) return;
    setTogglingId(compoundId);
    try {
      await onToggleDocking(compoundId, !currentSelected);
    } finally {
      setTogglingId(null);
    }
  };

  const inspectedCompound = uniqueCompounds.find((c) => c.id === inspectedId) || null;
  const inspectedParsed = inspectedCompound
    ? parseMetrics(getResult(inspectedCompound) || undefined)
    : null;

  const easeOut = [0.22, 1, 0.36, 1] as const;

  const StatusPill = ({ status }: { status?: string | null }) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-[#d7e4dc] bg-[#f7faf8] px-1.5 py-0.5 text-[9px] font-semibold text-[#6d7f76]">
          <Clock className="h-2.5 w-2.5" />
          Pending
        </span>
      );
    }
    if (status === "Completed") {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-900">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Done
        </span>
      );
    }
    if (status === "Needs Review") {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-900">
          <AlertTriangle className="h-2.5 w-2.5" />
          Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-900">
        <XCircle className="h-2.5 w-2.5" />
        Failed
      </span>
    );
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
        <div className="flex items-center gap-2 text-[11px] text-[#6d7f76]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <FlaskConical className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">In-Silico Screening</span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
            {evaluatedCount}/{uniqueCompounds.length} screened
          </span>
          <span className="hidden rounded-md border border-[#d7e4dc] bg-[#f7faf8] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#52645d] sm:inline">
            {dockCount} docking
          </span>
        </div>
        <button
          type="button"
          disabled={isScreening || uniqueCompounds.length === 0}
          onClick={onRunScreening}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {isScreening ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Screening...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              {evaluatedCount > 0 ? "Re-run" : "Run screening"}
            </>
          )}
        </button>
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
              <h2 className="text-sm font-semibold text-[#0f2c20]">ADMET &amp; descriptors</h2>
              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                <span className="font-semibold text-[#52645d]">
                  {uniqueCompounds.length} unique ligands
                </span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                MW · LogP · TPSA · dermal QSAR
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Run screen" },
              { n: "2", label: "Review ADMET" },
              { n: "3", label: "Pick for docking" },
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

      {/* Results */}
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
            <Beaker className="h-3.5 w-3.5 text-emerald-700" />
            Screening results
            <span className="font-medium normal-case tracking-normal text-[#8aa094]">
              · {filteredCompounds.length} shown
            </span>
          </h3>
          <div className="flex flex-wrap gap-1">
            {(
              [
                { key: "ALL", label: "All" },
                { key: "DONE", label: "Screened" },
                { key: "PENDING", label: "Pending" },
                { key: "DOCK", label: "Docking" },
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

        {duplicateCount > 0 && (
          <span className="inline-flex rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2 py-0.5 text-[10px] font-semibold text-[#52645d]">
            Hidden {duplicateCount} duplicate {duplicateCount === 1 ? "row" : "rows"}
          </span>
        )}

        {uniqueCompounds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-8 text-center">
            <FlaskConical className="mx-auto h-7 w-7 text-[#8aa094]" />
            <p className="mt-2 text-xs font-semibold text-[#0f2c20]">No compounds selected</p>
            <p className="mt-1 text-[11px] text-[#8aa094]">
              Go back to Step 1 and choose ligands first.
            </p>
          </div>
        ) : filteredCompounds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-6 text-center text-[11px] text-[#8aa094]">
            No compounds match this filter.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#d7e4dc]/90">
            <div className="hidden grid-cols-[minmax(0,1.3fr)_4.5rem_minmax(0,1fr)_minmax(0,1fr)_3.5rem_3.5rem] gap-2 border-b border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#8aa094] lg:grid">
              <span>Compound</span>
              <span>Status</span>
              <span>MW / LogP / TPSA</span>
              <span>ADMET</span>
              <span className="text-center">Dock</span>
              <span className="text-right">Info</span>
            </div>
            <div className="divide-y divide-[#e8f0eb]">
              {filteredCompounds.map((compound) => {
                const res = getResult(compound);
                const parsed = parseMetrics(res || undefined);
                const isDockingSelected =
                  compound.selectedForDocking === 1 || compound.selectedForDocking === true;

                return (
                  <div
                    key={compound.id}
                    className={`grid grid-cols-1 gap-2 px-2.5 py-2 lg:grid-cols-[minmax(0,1.3fr)_4.5rem_minmax(0,1fr)_minmax(0,1fr)_3.5rem_3.5rem] lg:items-center lg:gap-2 ${
                      isDockingSelected ? "bg-emerald-50/35" : "bg-white hover:bg-[#f7faf8]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectedId(compound.id)}
                          className="truncate text-left text-xs font-semibold text-[#0f2c20] hover:text-emerald-800 hover:underline"
                        >
                          {compound.compoundName}
                        </button>
                        <span className="lg:hidden">
                          <StatusPill status={parsed?.status} />
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 font-mono text-[10px] text-[#8aa094]">
                        <span>{compound.molecularFormula || parsed?.formula || "—"}</span>
                        {compound.pubchemId && <span>CID {compound.pubchemId}</span>}
                      </div>
                    </div>

                    <div className="hidden lg:block">
                      <StatusPill status={parsed?.status} />
                    </div>

                    <div className="font-mono text-[11px] text-[#52645d]">
                      {parsed && parsed.mw !== "—" ? (
                        <>
                          <span className="font-semibold text-[#0f2c20]">{parsed.mw}</span>
                          <span className="text-[#8aa094]"> · {parsed.logP} · {parsed.tpsa}</span>
                        </>
                      ) : (
                        <span className="text-[10px] italic text-[#8aa094]">Not screened</span>
                      )}
                    </div>

                    <div className="text-[10px] text-[#6d7f76]">
                      {parsed ? (
                        <>
                          <span className="font-semibold text-[#0f2c20]">{parsed.skinPerm}</span>
                          <span className="mt-0.5 block text-[#8aa094]">
                            GI {parsed.giAbs.replace(/ Absorption$/i, "")} · BBB{" "}
                            {parsed.bbb.replace(/^Non-/, "Non-")}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#8aa094]">—</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between lg:justify-center">
                      <span className="text-[10px] font-semibold text-[#8aa094] lg:hidden">
                        Dock
                      </span>
                      <input
                        type="checkbox"
                        checked={isDockingSelected}
                        disabled={togglingId === compound.id || !onToggleDocking}
                        onChange={() => handleToggle(compound.id, isDockingSelected)}
                        className="h-3.5 w-3.5 rounded border-[#d5e3da] text-emerald-700 focus:ring-emerald-600"
                        title="Select for docking"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setInspectedId(compound.id)}
                        className="rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2 py-1 text-[10px] font-semibold text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50"
                      >
                        Info
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.section>

      {/* Advanced — collapsed by default, short copy */}
      <div className="overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[11px] font-semibold text-[#52645d] hover:bg-[#f7faf8]"
        >
          <span className="inline-flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-[#8aa094]" />
            Screening model notes
          </span>
          <span className="text-[10px] text-[#8aa094]">{showAdvanced ? "Hide" : "Show"}</span>
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#e8f0eb]"
            >
              <div className="grid gap-2 p-3 text-[11px] text-[#6d7f76] sm:grid-cols-2">
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5">
                  <p className="font-semibold text-[#0f2c20]">Topical adaptation</p>
                  <p className="mt-1 leading-relaxed">
                    Lipinski is an oral guide. Higher-MW glycosides can still be active in hydrogels
                    and dermal products.
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5">
                  <p className="font-semibold text-[#0f2c20]">QSAR engines</p>
                  <p className="mt-1 leading-relaxed">
                    RDKit descriptors · Potts &amp; Guy dermal Log Kp · Delaney ESOL solubility.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Details modal */}
      <AnimatePresence>
        {inspectedCompound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c20]/35 p-4 backdrop-blur-[2px]"
            onClick={() => setInspectedId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#e8f0eb] pb-3">
                <div className="min-w-0">
                  <h3 className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#0f2c20]">
                    <FlaskConical className="h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="truncate">{inspectedCompound.compoundName}</span>
                    <StatusPill status={inspectedParsed?.status} />
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] text-[#8aa094]">
                    {inspectedCompound.molecularFormula || inspectedParsed?.formula || "—"}
                    {inspectedCompound.pubchemId ? ` · CID ${inspectedCompound.pubchemId}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedId(null)}
                  className="rounded-lg p-1 text-[#8aa094] hover:bg-[#f7faf8]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {inspectedParsed ? (
                <div className="mt-3 space-y-3">
                  {(inspectedParsed.summary || inspectedParsed.suitabilityNote) && (
                    <div className="flex gap-2 rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5 text-[11px] text-[#52645d]">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                      <div>
                        {inspectedParsed.summary && <p>{inspectedParsed.summary}</p>}
                        {inspectedParsed.suitabilityNote && (
                          <p className="mt-1 font-semibold text-[#0f2c20]">
                            {inspectedParsed.suitabilityNote}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: "MW", value: `${inspectedParsed.mw}`, hint: "≤ 500" },
                      { label: "LogP", value: `${inspectedParsed.logP}`, hint: "≤ 5" },
                      { label: "TPSA", value: `${inspectedParsed.tpsa}`, hint: "≤ 140" },
                      {
                        label: "HBD/HBA",
                        value: `${inspectedParsed.hbd}/${inspectedParsed.hba}`,
                        hint: "≤5 / ≤10",
                      },
                    ].map((cell) => (
                      <div
                        key={cell.label}
                        className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2"
                      >
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8aa094]">
                          {cell.label}
                        </span>
                        <span className="mt-0.5 block font-mono text-sm font-bold text-[#0f2c20]">
                          {cell.value}
                        </span>
                        <span className="text-[9px] text-[#8aa094]">{cell.hint}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-2 text-[11px] sm:grid-cols-3">
                    <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8aa094]">
                        Skin
                      </p>
                      <p className="mt-0.5 font-semibold text-[#0f2c20]">
                        {inspectedParsed.skinPerm}
                      </p>
                      {inspectedParsed.skinLogKp && (
                        <p className="font-mono text-[10px] text-[#8aa094]">
                          Log Kp {inspectedParsed.skinLogKp}
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8aa094]">
                        Solubility
                      </p>
                      <p className="mt-0.5 font-semibold text-[#0f2c20]">
                        {inspectedParsed.waterSol}
                      </p>
                      <p className="text-[10px] text-[#8aa094]">CYP3A4: {inspectedParsed.cyp3a4}</p>
                    </div>
                    <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8aa094]">
                        Lipinski
                      </p>
                      <p className="mt-0.5 font-semibold text-[#0f2c20]">
                        {inspectedParsed.lipinskiViolations === 0
                          ? "0 violations"
                          : `${inspectedParsed.lipinskiViolations}: ${(inspectedParsed.lipinskiList || []).join(", ")}`}
                      </p>
                      <p className="text-[10px] italic text-[#8aa094]">Oral guide only</p>
                    </div>
                  </div>

                  <p className="font-mono text-[10px] text-[#8aa094]">
                    Engine: {inspectedParsed.engineTool}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-3 py-6 text-center text-[11px] text-[#8aa094]">
                  Not screened yet — run screening to compute descriptors.
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-[#e8f0eb] pt-3">
                <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#52645d]">
                  <input
                    type="checkbox"
                    checked={
                      inspectedCompound.selectedForDocking === 1 ||
                      inspectedCompound.selectedForDocking === true
                    }
                    disabled={togglingId === inspectedCompound.id || !onToggleDocking}
                    onChange={() =>
                      handleToggle(
                        inspectedCompound.id,
                        inspectedCompound.selectedForDocking === 1 ||
                          inspectedCompound.selectedForDocking === true
                      )
                    }
                    className="h-3.5 w-3.5 rounded border-[#d5e3da] text-emerald-700"
                  />
                  Docking candidate
                </label>
                <button
                  type="button"
                  onClick={() => setInspectedId(null)}
                  className="rounded-xl border border-[#d7e4dc] bg-white px-4 py-1.5 text-xs font-semibold text-[#52645d] hover:bg-[#f7faf8]"
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
