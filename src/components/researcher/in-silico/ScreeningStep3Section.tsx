// src/components/researcher/in-silico/ScreeningStep3Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Info,
  X,
  Sliders,
  ExternalLink,
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

type ScreeningStatusLabel =
  | "Pending"
  | "Screening"
  | "Completed"
  | "Requires Review"
  | "Failed"
  | "Ready for Docking";

export default function ScreeningStep3Section({
  projectId,
  compounds = [],
  screenResults = [],
  onRunScreening,
  isScreening,
  onToggleDocking,
}: Step3Props) {
  const [inspectedId, setInspectedId] = useState<number | null>(null);
  const [showModelNotes, setShowModelNotes] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DONE" | "PENDING" | "DOCK">("ALL");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" | "info" } | null>(
    null
  );

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
      res.molecularWeight ??
      (prop.molecularWeight?.value
        ? String(prop.molecularWeight.value).replace(/\s*g\/mol/i, "")
        : null);
    const formula = res.molecularFormula || prop.molecularFormula?.value || null;
    const logP = prop.logP?.value !== undefined && prop.logP?.value !== "Unavailable" ? prop.logP.value : null;
    const tpsa =
      prop.tpsa?.value !== undefined && prop.tpsa?.value !== "Unavailable"
        ? String(prop.tpsa.value).replace(/\s*Å²/i, "")
        : null;
    const hbd = prop.hBondDonors?.value !== undefined ? prop.hBondDonors.value : null;
    const hba = prop.hBondAcceptors?.value !== undefined ? prop.hBondAcceptors.value : null;
    const rotBonds = prop.rotatableBonds?.value !== undefined ? prop.rotatableBonds.value : null;

    const engineStatus = res.engineStatus || metrics.status;
    let status: "Completed" | "Needs Review" | "Failed" =
      engineStatus === "Completed" ||
      engineStatus === "Needs Review" ||
      engineStatus === "Failed"
        ? (engineStatus as any)
        : dl.violations !== undefined && dl.violations >= 2
          ? "Needs Review"
          : mw != null
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
      lipinskiViolations: dl.violations ?? null,
      lipinskiList: dl.violationsList || [],
      lipinskiResult: dl.result || null,
      // Only surface stored predictions — do not invent defaults
      skinPerm: admet.skinPermeability?.prediction || null,
      skinLogKp: admet.skinPermeability?.logKp || null,
      skinModel: admet.skinPermeability?.model || null,
      giAbs: admet.giAbsorption?.prediction || null,
      giModel: admet.giAbsorption?.model || null,
      bbb: admet.bbbPermeability?.prediction || null,
      bbbModel: admet.bbbPermeability?.model || null,
      waterSol: admet.waterSolubility?.prediction || null,
      waterLogS: admet.waterSolubility?.logS || null,
      waterModel: admet.waterSolubility?.model || null,
      cyp3a4: admet.cyp3a4Inhibition?.prediction || null,
      cypModel: admet.cyp3a4Inhibition?.model || null,
      engineTool: res.engineTool || metrics.engineTool || null,
      summary: res.resultSummary || "",
      suitabilityNote: dockSuit.recommendation || null,
      isDockReady: dockSuit.isReady === true,
    };
  };

  const getResult = (compound: any) =>
    resultMap.byId.get(compound.id) ||
    resultMap.byName.get((compound.compoundName || "").trim().toLowerCase());

  const resolveScreeningLabel = (
    compound: any,
    parsed: ReturnType<typeof parseMetrics>
  ): ScreeningStatusLabel => {
    const isDock =
      compound.selectedForDocking === 1 || compound.selectedForDocking === true;
    if (isScreening && !parsed) return "Screening";
    if (!parsed) return "Pending";
    if (isDock && parsed.status === "Completed") return "Ready for Docking";
    if (parsed.status === "Needs Review") return "Requires Review";
    if (parsed.status === "Failed") return "Failed";
    if (parsed.status === "Completed") return "Completed";
    return "Pending";
  };

  const admetCompactLabel = (parsed: ReturnType<typeof parseMetrics>) => {
    if (!parsed) return "—";
    if (parsed.status === "Failed") return "Unavailable";
    if (parsed.lipinskiViolations != null && parsed.lipinskiViolations >= 2) return "Review flags";
    if (parsed.giAbs || parsed.skinPerm) {
      const bits = [parsed.giAbs, parsed.skinPerm].filter(Boolean);
      return bits[0] ? String(bits[0]).replace(/ Absorption$/i, "").replace(/ Permeability$/i, "") : "Predicted";
    }
    return "Predicted";
  };

  const totalCount = uniqueCompounds.length;
  const screenedCount = uniqueCompounds.filter((c) => Boolean(getResult(c))).length;
  const pendingCount = Math.max(0, totalCount - screenedCount);
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
  }, [uniqueCompounds, statusFilter, resultMap, isScreening]);

  const hasSmiles = (compound: any) =>
    Boolean(String(compound?.smiles || compound?.compoundSmiles || "").trim());

  const dockingBlockReason = (compound: any) => {
    if (hasSmiles(compound)) return null;
    return "No valid molecular structure (SMILES) — cannot be selected for docking.";
  };

  const handleToggle = async (compoundId: number, currentSelected: boolean, compound: any) => {
    if (!onToggleDocking) return;
    const block = dockingBlockReason(compound);
    if (!currentSelected && block) {
      setFeedback({ text: block, type: "error" });
      return;
    }
    setTogglingId(compoundId);
    try {
      await onToggleDocking(compoundId, !currentSelected);
      setFeedback({
        text: !currentSelected
          ? "Compound selected for Molecular Docking Execution."
          : "Compound deselected.",
        type: "success",
      });
    } catch (e: any) {
      setFeedback({ text: e?.message || "Failed to update docking selection.", type: "error" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleRun = async () => {
    if (isScreening || uniqueCompounds.length === 0) return;
    setFeedback(null);
    try {
      await onRunScreening();
      setFeedback({
        text: "Screening finished. Review ADMET details and select compounds for docking.",
        type: "success",
      });
    } catch (e: any) {
      setFeedback({
        text: e?.message || "Screening failed. Try again after checking compound structures.",
        type: "error",
      });
    }
  };

  const inspectedCompound = uniqueCompounds.find((c) => c.id === inspectedId) || null;
  const inspectedParsed = inspectedCompound
    ? parseMetrics(getResult(inspectedCompound) || undefined)
    : null;

  const easeOut = [0.22, 1, 0.36, 1] as const;

  const StatusPill = ({ label }: { label: ScreeningStatusLabel }) => {
    if (label === "Pending") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-[#d7e4dc] bg-[#f7faf8] px-1.5 py-0.5 text-[10px] font-semibold text-[#6d7f76]">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    }
    if (label === "Screening") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-900">
          <Loader2 className="h-3 w-3 animate-spin" />
          Screening
        </span>
      );
    }
    if (label === "Completed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    }
    if (label === "Ready for Docking") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-950">
          <CheckCircle2 className="h-3 w-3" />
          Ready for Docking
        </span>
      );
    }
    if (label === "Requires Review") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
          <AlertTriangle className="h-3 w-3" />
          Requires Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-900">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  };

  const fmt = (v: any) => (v === null || v === undefined || v === "" || v === "Unavailable" ? "—" : String(v));

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
              <FlaskConical className="h-4 w-4 text-emerald-700" />
              In-Silico Screening
            </h2>
            <p className="mt-0.5 text-[12px] text-[#6d7f76]">
              Evaluate compound properties and predicted ADMET profiles before molecular docking.
            </p>
          </div>
          <button
            type="button"
            disabled={isScreening || uniqueCompounds.length === 0}
            onClick={handleRun}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isScreening ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Screening…
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                {screenedCount > 0 ? "Re-run Screening" : "Run Screening"}
              </>
            )}
          </button>
        </div>

        {/* Overview stats */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Total Compounds", value: totalCount, tone: "text-[#0f2c20]" },
            { label: "Screened", value: screenedCount, tone: "text-emerald-800" },
            { label: "Pending", value: pendingCount, tone: "text-amber-800" },
            { label: "Ready for Docking", value: dockCount, tone: "text-emerald-900" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] px-3 py-2"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8aa094]">
                {stat.label}
              </p>
              <p className={`mt-0.5 font-mono text-xl font-bold ${stat.tone}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-3 flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-[11px] ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : feedback.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-sky-200 bg-sky-50 text-sky-900"
              }`}
            >
              <span>{feedback.text}</span>
              <button type="button" onClick={() => setFeedback(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Compound table */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="space-y-2.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#0f2c20]">Compound Screening</h3>
            <p className="text-[11px] text-[#8aa094]">
              {filteredCompounds.length} shown · {dockCount} selected for docking
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {(
              [
                { key: "ALL", label: "All" },
                { key: "DONE", label: "Screened" },
                { key: "PENDING", label: "Pending" },
                { key: "DOCK", label: "For docking" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
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

        {uniqueCompounds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-8 text-center">
            <FlaskConical className="mx-auto h-7 w-7 text-[#8aa094]" />
            <p className="mt-2 text-xs font-semibold text-[#0f2c20]">No compounds from Section 1</p>
            <p className="mt-1 text-[11px] text-[#8aa094]">
              Identify structure-ready phytochemicals in Plant Information first.
            </p>
            <Link
              href={`/researcher/projects/${projectId}/formulation-rd`}
              className="mt-3 inline-flex text-[11px] font-semibold text-emerald-800 hover:underline"
            >
              Go to Section 1
            </Link>
          </div>
        ) : filteredCompounds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-6 text-center text-[11px] text-[#8aa094]">
            No compounds match this filter.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#d7e4dc]/90">
            <table className="w-full min-w-[44rem] text-left text-xs">
              <thead className="border-b border-[#e8f0eb] bg-[#f7faf8] text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                <tr>
                  <th className="w-12 px-2.5 py-2 text-center">Select</th>
                  <th className="px-2.5 py-2">Compound</th>
                  <th className="px-2.5 py-2 text-right">MW</th>
                  <th className="px-2.5 py-2 text-right">LogP</th>
                  <th className="px-2.5 py-2 text-right">TPSA</th>
                  <th className="px-2.5 py-2">Screening Status</th>
                  <th className="px-2.5 py-2">ADMET Status</th>
                  <th className="w-16 px-2.5 py-2 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8f0eb]">
                {filteredCompounds.map((compound) => {
                  const res = getResult(compound);
                  const parsed = parseMetrics(res || undefined);
                  const isDockingSelected =
                    compound.selectedForDocking === 1 || compound.selectedForDocking === true;
                  const label = resolveScreeningLabel(compound, parsed);
                  const blockReason = dockingBlockReason(compound);
                  const dockingEligible = !blockReason;

                  return (
                    <tr
                      key={compound.id}
                      className={
                        isDockingSelected
                          ? "bg-emerald-50/40"
                          : "bg-white hover:bg-[#f7faf8]"
                      }
                    >
                      <td className="px-2.5 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isDockingSelected}
                          disabled={
                            togglingId === compound.id ||
                            !onToggleDocking ||
                            (!isDockingSelected && !dockingEligible)
                          }
                          onChange={() =>
                            handleToggle(compound.id, isDockingSelected, compound)
                          }
                          className="h-4 w-4 rounded border-[#d5e3da] text-emerald-700 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            blockReason
                              ? blockReason
                              : isDockingSelected
                                ? "Deselect for docking"
                                : "Select for docking"
                          }
                          aria-label={`Select ${compound.compoundName} for docking`}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <button
                          type="button"
                          onClick={() => setInspectedId(compound.id)}
                          className="text-left font-semibold text-[#0f2c20] hover:text-emerald-800 hover:underline"
                        >
                          {compound.compoundName}
                        </button>
                        <p className="mt-0.5 font-mono text-[10px] text-[#8aa094]">
                          {compound.molecularFormula || parsed?.formula || "—"}
                          {compound.pubchemId ? ` · CID ${compound.pubchemId}` : ""}
                        </p>
                      </td>
                      <td className="px-2.5 py-2 text-right font-mono text-[11px] text-[#0f2c20]">
                        {fmt(parsed?.mw)}
                      </td>
                      <td className="px-2.5 py-2 text-right font-mono text-[11px] text-[#0f2c20]">
                        {fmt(parsed?.logP)}
                      </td>
                      <td className="px-2.5 py-2 text-right font-mono text-[11px] text-[#0f2c20]">
                        {fmt(parsed?.tpsa)}
                      </td>
                      <td className="px-2.5 py-2">
                        <StatusPill label={label} />
                      </td>
                      <td className="px-2.5 py-2 text-[11px] text-[#52645d]">
                        {admetCompactLabel(parsed)}
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectedId(compound.id)}
                          className="rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2 py-1 text-[10px] font-semibold text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {dockCount === 0 && screenedCount > 0 && (
          <p className="flex items-start gap-1.5 text-[11px] text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Select at least one screened compound for Molecular Docking Execution.
          </p>
        )}
      </motion.section>

      {/* Model notes — collapsed */}
      <div className="overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white shadow-[0_1px_2px_rgba(15,44,32,0.04)]">
        <button
          type="button"
          onClick={() => setShowModelNotes(!showModelNotes)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[11px] font-semibold text-[#52645d] hover:bg-[#f7faf8]"
        >
          <span className="inline-flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-[#8aa094]" />
            Screening model notes
          </span>
          <span className="text-[10px] text-[#8aa094]">{showModelNotes ? "Hide" : "Show"}</span>
        </button>
        <AnimatePresence>
          {showModelNotes && (
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
                    Lipinski is an oral bioavailability guide. Higher-MW glycosides may still be
                    relevant for topical hydrogels and dermal products.
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5">
                  <p className="font-semibold text-[#0f2c20]">Prediction engines</p>
                  <p className="mt-1 leading-relaxed">
                    RDKit descriptors · Potts &amp; Guy dermal Log Kp · Delaney ESOL solubility.
                    Predictions are computational estimates, not clinical findings.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Details modal — ADMET groups */}
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
                    <StatusPill
                      label={resolveScreeningLabel(inspectedCompound, inspectedParsed)}
                    />
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

              {inspectedCompound.pubchemId && (
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${inspectedCompound.pubchemId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline"
                >
                  Open in PubChem
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

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

                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Molecular descriptors
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: "MW", value: fmt(inspectedParsed.mw), hint: "g/mol" },
                        { label: "LogP", value: fmt(inspectedParsed.logP), hint: "lipophilicity" },
                        { label: "TPSA", value: fmt(inspectedParsed.tpsa), hint: "Å²" },
                        {
                          label: "HBD / HBA",
                          value: `${fmt(inspectedParsed.hbd)} / ${fmt(inspectedParsed.hba)}`,
                          hint: "H-bonds",
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
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Predicted ADMET
                    </p>
                    <div className="grid gap-2 text-[11px] sm:grid-cols-2">
                      {[
                        {
                          group: "Absorption",
                          items: [
                            { k: "GI absorption", v: inspectedParsed.giAbs, m: inspectedParsed.giModel },
                            {
                              k: "Skin permeability",
                              v: inspectedParsed.skinPerm,
                              m: inspectedParsed.skinModel,
                              extra: inspectedParsed.skinLogKp
                                ? `Log Kp ${inspectedParsed.skinLogKp}`
                                : null,
                            },
                          ],
                        },
                        {
                          group: "Distribution",
                          items: [
                            {
                              k: "BBB permeability",
                              v: inspectedParsed.bbb,
                              m: inspectedParsed.bbbModel,
                            },
                          ],
                        },
                        {
                          group: "Metabolism",
                          items: [
                            {
                              k: "CYP3A4 inhibition",
                              v: inspectedParsed.cyp3a4,
                              m: inspectedParsed.cypModel,
                            },
                          ],
                        },
                        {
                          group: "Excretion",
                          items: [
                            {
                              k: "Water solubility",
                              v: inspectedParsed.waterSol,
                              m: inspectedParsed.waterModel,
                              extra: inspectedParsed.waterLogS || null,
                            },
                          ],
                        },
                        {
                          group: "Toxicity / drug-likeness",
                          items: [
                            {
                              k: "Lipinski Rule of Five",
                              v:
                                inspectedParsed.lipinskiViolations == null
                                  ? null
                                  : inspectedParsed.lipinskiViolations === 0
                                    ? "0 violations (oral guide)"
                                    : `${inspectedParsed.lipinskiViolations} violation(s)`,
                              m: "Oral bioavailability guide — topical use may differ",
                              extra:
                                inspectedParsed.lipinskiList?.length > 0
                                  ? inspectedParsed.lipinskiList.join(", ")
                                  : null,
                            },
                          ],
                        },
                      ].map((block) => (
                        <div
                          key={block.group}
                          className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5"
                        >
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">
                            {block.group}
                          </p>
                          <div className="mt-1.5 space-y-2">
                            {block.items.map((item) => (
                              <div key={item.k}>
                                <p className="text-[10px] text-[#8aa094]">{item.k}</p>
                                <p className="font-semibold text-[#0f2c20]">{fmt(item.v)}</p>
                                {item.extra && (
                                  <p className="font-mono text-[10px] text-[#6d7f76]">{item.extra}</p>
                                )}
                                {item.m && (
                                  <p className="mt-0.5 text-[9px] italic text-[#8aa094]">{item.m}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] italic text-[#8aa094]">
                      Computational predictions only — not confirmed biological or clinical findings.
                    </p>
                  </div>

                  {inspectedParsed.engineTool && (
                    <p className="font-mono text-[10px] text-[#8aa094]">
                      Engine: {inspectedParsed.engineTool}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-3 py-6 text-center text-[11px] text-[#8aa094]">
                  Not screened yet — run screening to compute descriptors and ADMET predictions.
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-[#e8f0eb] pt-3">
                <label
                  className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#52645d]"
                  title={dockingBlockReason(inspectedCompound) || undefined}
                >
                  <input
                    type="checkbox"
                    checked={
                      inspectedCompound.selectedForDocking === 1 ||
                      inspectedCompound.selectedForDocking === true
                    }
                    disabled={
                      togglingId === inspectedCompound.id ||
                      !onToggleDocking ||
                      (!(
                        inspectedCompound.selectedForDocking === 1 ||
                        inspectedCompound.selectedForDocking === true
                      ) &&
                        Boolean(dockingBlockReason(inspectedCompound)))
                    }
                    onChange={() =>
                      handleToggle(
                        inspectedCompound.id,
                        inspectedCompound.selectedForDocking === 1 ||
                          inspectedCompound.selectedForDocking === true,
                        inspectedCompound
                      )
                    }
                    className="h-3.5 w-3.5 rounded border-[#d5e3da] text-emerald-700"
                  />
                  Select for docking
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
