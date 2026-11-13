// src/components/researcher/in-silico/PhytochemicalStep1Section.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dna,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  Copy,
  Leaf,
  Info,
} from "lucide-react";

export interface PhytochemicalCompound {
  id: number;
  compoundName: string;
  molecularFormula?: string | null;
  molecularWeight?: number | null;
  compoundClass?: string | null;
  pubchemId?: string | null;
  smiles?: string | null;
  iupacName?: string | null;
  plantSource?: string | null;
  plantPartReported?: string | null;
  sourceReference?: string | null;
  sourceNotes?: string | null;
  sourceProvenance?: string | null;
  selectedForDocking?: number | boolean;
  preparationStatus?: string | null;
  references?: any[];
  structureReady?: boolean;
}

interface Step1Props {
  projectId: number;
  plantName: string;
  compounds: PhytochemicalCompound[];
  availableCompounds: any[];
  onCompoundsChange: (compounds: PhytochemicalCompound[]) => void;
  onOpenAddModal: () => void;
  onRefreshWorkspace: () => void;
}

function compoundKey(c: { compoundName?: string | null; pubchemId?: string | null }) {
  return `${(c.compoundName || "").toLowerCase().trim()}::${c.pubchemId || ""}`;
}

function isStructureReady(c: PhytochemicalCompound) {
  return Boolean(c.smiles?.trim());
}

export default function PhytochemicalStep1Section({
  projectId,
  plantName,
  compounds,
  availableCompounds = [],
  onCompoundsChange,
  onRefreshWorkspace,
}: Step1Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectedCompound, setInspectedCompound] = useState<PhytochemicalCompound | null>(null);
  const [copiedSmiles, setCopiedSmiles] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const didAutoSync = useRef(false);

  // Prefer selected row when collapsing duplicate name+CID entries
  const uniqueCompounds = useMemo(() => {
    const map = new Map<string, PhytochemicalCompound>();
    for (const c of compounds) {
      const key = compoundKey(c);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, c);
        continue;
      }
      if (c.selectedForDocking && !existing.selectedForDocking) {
        map.set(key, c);
      }
    }
    return Array.from(map.values());
  }, [compounds]);

  // Merge catalog metadata for display only when project fields are empty
  const displayCompounds = useMemo(() => {
    return uniqueCompounds.map((c) => {
      const match =
        availableCompounds.find(
          (ac) =>
            (c.pubchemId && String(ac.pubchemId) === String(c.pubchemId)) ||
            String(ac.compoundName || "").toLowerCase().trim() ===
              String(c.compoundName || "").toLowerCase().trim()
        ) || null;

      return {
        ...c,
        molecularFormula: c.molecularFormula || match?.molecularFormula || null,
        molecularWeight: c.molecularWeight ?? match?.molecularWeight ?? null,
        compoundClass: c.compoundClass || match?.compoundClass || null,
        pubchemId: c.pubchemId || (match?.pubchemId ? String(match.pubchemId) : null),
        smiles: c.smiles || match?.smiles || null,
        iupacName: c.iupacName || match?.iupacName || null,
        structureReady: isStructureReady({ ...c, smiles: c.smiles || match?.smiles }),
      };
    });
  }, [uniqueCompounds, availableCompounds]);

  const filteredCompounds = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return displayCompounds;
    return displayCompounds.filter((comp) => {
      return (
        comp.compoundName?.toLowerCase().includes(q) ||
        comp.molecularFormula?.toLowerCase().includes(q) ||
        comp.pubchemId?.toString().includes(q) ||
        comp.compoundClass?.toLowerCase().includes(q)
      );
    });
  }, [displayCompounds, searchQuery]);

  // Soft-sync: fill NULL scientific fields from Section 1 plant catalog; never duplicate rows
  useEffect(() => {
    if (didAutoSync.current) return;
    didAutoSync.current = true;

    let cancelled = false;
    (async () => {
      setIsSyncing(true);
      try {
        const res = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "enrich-from-section1-catalog" }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && Array.isArray(data.compounds)) {
          onCompoundsChange(data.compounds);
          if (data.enrichedCount > 0) {
            setFeedbackMessage({
              text: `Synced ${data.enrichedCount} compound field(s) from Section 1 catalog data.`,
              type: "info",
            });
          }
        }
      } catch {
        // Non-blocking — page still works with existing project compounds
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleToggleDocking = async (compoundId: number, currentSelected: boolean, eligible: boolean) => {
    if (!currentSelected && !eligible) {
      setFeedbackMessage({
        text: "Compounds without a molecular structure (SMILES) cannot be selected for docking.",
        type: "error",
      });
      return;
    }

    const newSelected = !currentSelected;
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-docking",
          compoundId,
          selectedForDocking: newSelected,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedbackMessage({
          text: data.error || "Failed to update selection status.",
          type: "error",
        });
        return;
      }

      onCompoundsChange(
        compounds.map((c) =>
          c.id === compoundId ? { ...c, selectedForDocking: newSelected ? 1 : 0 } : c
        )
      );
      if (inspectedCompound?.id === compoundId) {
        setInspectedCompound({
          ...inspectedCompound,
          selectedForDocking: newSelected ? 1 : 0,
        });
      }
    } catch {
      setFeedbackMessage({ text: "Failed to update selection status.", type: "error" });
    }
  };

  const handleSelectAllEligible = async () => {
    const eligibleIds = displayCompounds
      .filter((c) => isStructureReady(c) && !c.selectedForDocking)
      .map((c) => c.id);

    if (eligibleIds.length === 0) {
      setFeedbackMessage({
        text: "All structure-ready compounds are already selected, or none have valid SMILES.",
        type: "info",
      });
      return;
    }

    try {
      for (const id of eligibleIds) {
        await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "toggle-docking",
            compoundId: id,
            selectedForDocking: true,
          }),
        });
      }
      onCompoundsChange(
        compounds.map((c) => (eligibleIds.includes(c.id) ? { ...c, selectedForDocking: 1 } : c))
      );
      onRefreshWorkspace();
      setFeedbackMessage({
        text: `Selected ${eligibleIds.length} structure-ready compound(s) for docking.`,
        type: "success",
      });
    } catch {
      setFeedbackMessage({ text: "Error selecting eligible compounds.", type: "error" });
    }
  };

  const handleClearSelection = async () => {
    const selected = uniqueCompounds.filter((c) => c.selectedForDocking);
    if (selected.length === 0) return;

    try {
      for (const comp of selected) {
        await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "toggle-docking",
            compoundId: comp.id,
            selectedForDocking: false,
          }),
        });
      }
      onCompoundsChange(compounds.map((c) => ({ ...c, selectedForDocking: 0 })));
      onRefreshWorkspace();
      setFeedbackMessage({ text: "Cleared docking selection.", type: "success" });
    } catch {
      setFeedbackMessage({ text: "Error clearing selections.", type: "error" });
    }
  };

  const copySmilesToClipboard = (smiles: string) => {
    navigator.clipboard.writeText(smiles);
    setCopiedSmiles(true);
    setTimeout(() => setCopiedSmiles(false), 2000);
  };

  const selectedCount = displayCompounds.filter((c) => c.selectedForDocking).length;
  const readyCount = displayCompounds.filter((c) => isStructureReady(c)).length;
  const missingStructureCount = displayCompounds.length - readyCount;
  const easeOut = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="space-y-4">
      {/* Plant Summary */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
              <Dna className="h-4 w-4 text-emerald-700" />
              Select Compounds for Docking
            </h2>
            <p className="mt-0.5 text-[12px] text-[#6d7f76]">
              Choose which identified plant compounds will be included in the in-silico analysis.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#6d7f76]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#0f2c20]">
                <Leaf className="h-3.5 w-3.5 text-emerald-700" />
                {plantName}
              </span>
              <span className="text-[#d7e4dc]">·</span>
              <span>
                <span className="font-semibold text-[#52645d]">{displayCompounds.length}</span> identified
              </span>
              <span className="text-[#d7e4dc]">·</span>
              <span>
                <span className="font-semibold text-emerald-800">{readyCount}</span> structure-ready
              </span>
              <span className="text-[#d7e4dc]">·</span>
              <span>
                <span className="font-semibold text-[#0f2c20]">{selectedCount}</span> selected
              </span>
              {isSyncing && <span className="text-[#8aa094]">Syncing…</span>}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {feedbackMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-3 flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-[11px] ${
                feedbackMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : feedbackMessage.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-sky-200 bg-sky-50 text-sky-900"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {feedbackMessage.type === "error" ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                )}
                {feedbackMessage.text}
              </span>
              <button type="button" onClick={() => setFeedbackMessage(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Compound Selection */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="space-y-2.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold tracking-tight text-[#0f2c20]">Compound Selection</h3>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md border border-[#d7e4dc] bg-[#f7faf8] px-2 py-0.5 font-semibold text-[#52645d]">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={handleSelectAllEligible}
              className="font-semibold text-emerald-800 hover:text-emerald-950"
            >
              Select All Eligible
            </button>
            <span className="text-[#d7e4dc]">·</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="font-medium text-[#6d7f76] hover:text-rose-700"
            >
              Clear Selection
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
          <input
            type="text"
            placeholder="Search compound…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          />
        </div>

        {missingStructureCount > 0 && (
          <div className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {missingStructureCount} compound{missingStructureCount === 1 ? "" : "s"} lack a molecular
              structure (SMILES) and cannot be used for docking until structure data is available in
              Section 1.
            </span>
          </div>
        )}

        {filteredCompounds.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[#d7e4dc]/90">
            <table className="w-full min-w-[36rem] text-left text-xs">
              <thead className="border-b border-[#e8f0eb] bg-[#f7faf8] text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                <tr>
                  <th className="w-10 px-2.5 py-1.5 text-center">Select</th>
                  <th className="px-2.5 py-1.5">Compound Name</th>
                  <th className="px-2.5 py-1.5">Molecular Formula</th>
                  <th className="px-2.5 py-1.5 text-right">Molecular Weight</th>
                  <th className="px-2.5 py-1.5">Structure Status</th>
                  <th className="w-20 px-2.5 py-1.5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8f0eb]">
                {filteredCompounds.map((comp) => {
                  const isSelected = Boolean(comp.selectedForDocking);
                  const eligible = isStructureReady(comp);

                  return (
                    <tr
                      key={comp.id}
                      className={
                        isSelected
                          ? "bg-emerald-50/40"
                          : !eligible
                            ? "bg-amber-50/20"
                            : "bg-white hover:bg-[#f7faf8]"
                      }
                    >
                      <td className="px-2.5 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!eligible && !isSelected}
                          onChange={() => handleToggleDocking(comp.id, isSelected, eligible)}
                          className="h-3.5 w-3.5 rounded border-[#d5e3da] text-emerald-700 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            eligible
                              ? isSelected
                                ? "Deselect for docking"
                                : "Select for docking"
                              : "Missing molecular structure — not eligible for docking"
                          }
                          aria-label={`Select ${comp.compoundName}`}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <span className="font-semibold text-[#0f2c20]">{comp.compoundName}</span>
                        {comp.compoundClass ? (
                          <span className="mt-0.5 block text-[10px] text-[#8aa094]">
                            {comp.compoundClass}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-[11px] text-[#52645d]">
                        {comp.molecularFormula || "—"}
                      </td>
                      <td className="px-2.5 py-2 text-right font-mono text-[11px] text-[#52645d]">
                        {comp.molecularWeight != null && comp.molecularWeight !== ""
                          ? Number(comp.molecularWeight).toFixed(2)
                          : "—"}
                      </td>
                      <td className="px-2.5 py-2">
                        {eligible ? (
                          <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
                            <Check className="h-2.5 w-2.5" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            No structure
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectedCompound(comp)}
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
        ) : displayCompounds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-8 text-center">
            <Dna className="mx-auto h-7 w-7 text-[#8aa094]" />
            <p className="mt-2 text-xs font-semibold text-[#0f2c20]">
              No compounds from Section 1 yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[11px] text-[#8aa094]">
              Identify and select phytochemicals in Plant Information (Section 1). Those compounds
              appear here for docking selection.
            </p>
            <Link
              href={`/researcher/projects/${projectId}/formulation-rd`}
              className="mt-3 inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50"
            >
              <Leaf className="h-3 w-3 text-emerald-700" />
              Go to Section 1 · Plant Information
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-6 text-center text-[11px] text-[#8aa094]">
            No compounds match your search.
          </div>
        )}

        {displayCompounds.length > 0 && (
          <p className="flex items-start gap-1.5 text-[10px] text-[#8aa094]">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              Need another compound? Add it in{" "}
              <Link
                href={`/researcher/projects/${projectId}/formulation-rd`}
                className="font-semibold text-emerald-800 hover:underline"
              >
                Section 1 · Plant Information
              </Link>{" "}
              so this step reuses the same project records without creating duplicates.
            </span>
          </p>
        )}
      </motion.section>

      {/* Details modal */}
      <AnimatePresence>
        {inspectedCompound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c20]/35 p-4 backdrop-blur-[2px]"
            onClick={() => setInspectedCompound(null)}
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
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#0f2c20]">
                    <Dna className="h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="truncate">{inspectedCompound.compoundName}</span>
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#8aa094]">
                    {inspectedCompound.compoundClass || "Botanical metabolite"} · {plantName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedCompound(null)}
                  className="rounded-lg p-1 text-[#8aa094] hover:bg-[#f7faf8] hover:text-[#0f2c20]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { label: "Formula", value: inspectedCompound.molecularFormula || "—" },
                  {
                    label: "MW",
                    value: inspectedCompound.molecularWeight
                      ? `${inspectedCompound.molecularWeight} g/mol`
                      : "—",
                  },
                  { label: "PubChem CID", value: inspectedCompound.pubchemId || "—" },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5"
                  >
                    <span className="block text-[10px] text-[#8aa094]">{cell.label}</span>
                    <span className="font-mono text-[11px] font-bold text-[#0f2c20]">
                      {cell.value}
                    </span>
                  </div>
                ))}
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

              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#52645d]">Canonical SMILES</span>
                  {inspectedCompound.smiles && (
                    <button
                      type="button"
                      onClick={() => copySmilesToClipboard(inspectedCompound.smiles || "")}
                      className="inline-flex items-center gap-1 font-semibold text-emerald-800"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedSmiles ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
                <div className="break-all rounded-xl border border-[#0f2c20]/80 bg-[#0f2c20] p-2.5 font-mono text-[11px] text-emerald-200">
                  {inspectedCompound.smiles || (
                    <span className="italic text-emerald-200/50">No SMILES available</span>
                  )}
                </div>
              </div>

              {inspectedCompound.iupacName && (
                <div className="mt-3">
                  <span className="mb-1 block text-[11px] font-bold text-[#52645d]">IUPAC</span>
                  <p className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2 font-mono text-[11px] text-[#0f2c20]">
                    {inspectedCompound.iupacName}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-[#e8f0eb] pt-3">
                <button
                  type="button"
                  onClick={() =>
                    handleToggleDocking(
                      inspectedCompound.id,
                      Boolean(inspectedCompound.selectedForDocking),
                      isStructureReady(inspectedCompound)
                    )
                  }
                  disabled={
                    !isStructureReady(inspectedCompound) && !inspectedCompound.selectedForDocking
                  }
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    inspectedCompound.selectedForDocking
                      ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                      : "bg-emerald-700 text-white hover:bg-emerald-800"
                  }`}
                >
                  {inspectedCompound.selectedForDocking
                    ? "Deselect for docking"
                    : "Select for docking"}
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedCompound(null)}
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
