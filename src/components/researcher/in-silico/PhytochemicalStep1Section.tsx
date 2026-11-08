// src/components/researcher/in-silico/PhytochemicalStep1Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dna,
  Search,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  Copy,
  Leaf,
  ChevronRight,
  Sparkles,
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

export default function PhytochemicalStep1Section({
  projectId,
  plantName,
  compounds,
  availableCompounds = [],
  onCompoundsChange,
  onOpenAddModal,
  onRefreshWorkspace,
}: Step1Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedPlantPart, setSelectedPlantPart] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [inspectedCompound, setInspectedCompound] = useState<PhytochemicalCompound | null>(null);
  const [copiedSmiles, setCopiedSmiles] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

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

  const duplicateCount = compounds.length - uniqueCompounds.length;

  const chemicalClasses = useMemo(() => {
    const set = new Set<string>();
    [...uniqueCompounds, ...availableCompounds].forEach((c) => {
      if (c.compoundClass?.trim()) set.add(c.compoundClass.trim());
    });
    return Array.from(set).sort();
  }, [uniqueCompounds, availableCompounds]);

  const plantParts = useMemo(() => {
    const set = new Set<string>();
    [...uniqueCompounds, ...availableCompounds].forEach((c) => {
      if (c.plantPartReported?.trim()) set.add(c.plantPartReported.trim());
    });
    return Array.from(set).sort();
  }, [uniqueCompounds, availableCompounds]);

  const filteredCompounds = useMemo(() => {
    return uniqueCompounds.filter((comp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = comp.compoundName?.toLowerCase().includes(q);
        const matchesFormula = comp.molecularFormula?.toLowerCase().includes(q);
        const matchesCid = comp.pubchemId?.toString().includes(q);
        const matchesClass = comp.compoundClass?.toLowerCase().includes(q);
        if (!matchesName && !matchesFormula && !matchesCid && !matchesClass) return false;
      }

      if (selectedClass !== "ALL" && comp.compoundClass !== selectedClass) return false;
      if (selectedPlantPart !== "ALL" && comp.plantPartReported !== selectedPlantPart) return false;
      if (selectedStatus === "SELECTED" && !comp.selectedForDocking) return false;
      if (selectedStatus === "UNSELECTED" && comp.selectedForDocking) return false;
      if (selectedStatus === "READY" && (!comp.smiles || !comp.molecularWeight)) return false;
      if (selectedStatus === "WARNING" && Boolean(comp.smiles && comp.molecularWeight)) return false;

      return true;
    });
  }, [uniqueCompounds, searchQuery, selectedClass, selectedPlantPart, selectedStatus]);

  const handleToggleDocking = async (compoundId: number, currentSelected: boolean) => {
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
      if (res.ok) {
        // Optimistic local update only — avoid docking workspace refresh (page glitch)
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
      }
    } catch {
      alert("Failed to update selection status.");
    }
  };

  const handleSelectAllEligible = async () => {
    const eligibleIds = uniqueCompounds
      .filter((c) => Boolean(c.smiles?.trim()))
      .map((c) => c.id);
    if (eligibleIds.length === 0) {
      alert("No compounds with valid chemical structures (SMILES) are available.");
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
        text: `Selected ${eligibleIds.length} eligible compounds for docking.`,
        type: "success",
      });
    } catch {
      alert("Error selecting eligible compounds.");
    }
  };

  const handleClearSelection = async () => {
    try {
      for (const comp of uniqueCompounds) {
        if (comp.selectedForDocking) {
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
      }
      onCompoundsChange(compounds.map((c) => ({ ...c, selectedForDocking: 0 })));
      onRefreshWorkspace();
      setFeedbackMessage({ text: "Cleared all docking selections.", type: "success" });
    } catch {
      alert("Error clearing selections.");
    }
  };

  const handleImportSection1 = async () => {
    if (availableCompounds.length === 0) {
      alert(`No documented botanical phytochemicals found in the catalog for ${plantName}.`);
      return;
    }

    const existingKeys = new Set(uniqueCompounds.map(compoundKey));
    const unimported = availableCompounds.filter((ac) => !existingKeys.has(compoundKey(ac)));

    if (unimported.length === 0) {
      setFeedbackMessage({
        text: `All ${availableCompounds.length} phytochemicals documented in Section 1 are already imported.`,
        type: "success",
      });
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-compounds",
          compounds: unimported.map((ac) => ({
            compoundName: ac.compoundName,
            molecularFormula: ac.molecularFormula,
            molecularWeight: ac.molecularWeight,
            compoundClass: ac.compoundClass,
            pubchemId: ac.pubchemId,
            smiles: ac.smiles,
            iupacName: ac.iupacName,
            plantSource: plantName,
            sourceProvenance: "VERIFIED_DATABASE",
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import compounds");

      const resScr = await fetch(`/api/researcher/projects/${projectId}/in-silico`);
      if (resScr.ok) {
        const d = await resScr.json();
        if (d.compounds) onCompoundsChange(d.compounds);
      }
      onRefreshWorkspace();
      setFeedbackMessage({
        text: `Imported ${unimported.length} botanical compounds from Section 1.`,
        type: "success",
      });
    } catch (e: any) {
      alert(e.message || "Failed to import compounds");
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemove = async (compoundId: number, compoundName: string) => {
    if (!confirm(`Remove "${compoundName}" from this research project?`)) return;
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-compound", compoundId }),
      });
      if (res.ok) {
        // Also remove any name+CID duplicates left in the library
        const removed = compounds.find((c) => c.id === compoundId);
        const key = removed ? compoundKey(removed) : null;
        const siblingIds = key
          ? compounds.filter((c) => compoundKey(c) === key).map((c) => c.id)
          : [compoundId];

        for (const id of siblingIds) {
          if (id === compoundId) continue;
          await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete-compound", compoundId: id }),
          });
        }

        onCompoundsChange(compounds.filter((c) => !siblingIds.includes(c.id)));
        onRefreshWorkspace();
        setFeedbackMessage({ text: `Removed "${compoundName}".`, type: "success" });
        if (inspectedCompound && siblingIds.includes(inspectedCompound.id)) {
          setInspectedCompound(null);
        }
      }
    } catch {
      alert("Failed to remove compound.");
    }
  };

  const copySmilesToClipboard = (smiles: string) => {
    navigator.clipboard.writeText(smiles);
    setCopiedSmiles(true);
    setTimeout(() => setCopiedSmiles(false), 2000);
  };

  const selectedCount = uniqueCompounds.filter((c) => c.selectedForDocking).length;
  const readyCount = uniqueCompounds.filter((c) => Boolean(c.smiles?.trim())).length;
  const missingSmiles = uniqueCompounds.some((c) => !c.smiles?.trim());
  const easeOut = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="space-y-4">
      {/* Compact status strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d7e4dc]/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex items-center gap-2 text-[11px] text-[#6d7f76]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Dna className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">Phytochemical Selection</span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
            {selectedCount}/{uniqueCompounds.length} for docking
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleImportSection1}
            disabled={isImporting}
            className="inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-[#f7faf8] px-2.5 py-1 text-[11px] font-semibold text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50"
            title="Import metabolites verified in Section 1"
          >
            <Download className="h-3 w-3 text-emerald-700" />
            {isImporting ? "Importing..." : "Import Section 1"}
          </button>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
          >
            <Plus className="h-3 w-3" />
            Add compound
          </button>
        </div>
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
              <h2 className="text-sm font-semibold text-[#0f2c20]">{plantName}</h2>
              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                <span className="font-semibold text-[#52645d]">
                  {uniqueCompounds.length} unique compounds
                </span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                <span className="font-mono text-[#52645d]">{readyCount} structure-ready</span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                Select ligands for docking
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Import / add" },
              { n: "2", label: "Select for docking" },
              { n: "3", label: "Continue" },
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

        <AnimatePresence>
          {feedbackMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-3 flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-[11px] ${
                feedbackMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {feedbackMessage.text}
              </span>
              <button type="button" onClick={() => setFeedbackMessage(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Library */}
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
            <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
            Ligand library
            <span className="font-medium normal-case tracking-normal text-[#8aa094]">
              · {filteredCompounds.length} of {uniqueCompounds.length} shown
            </span>
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={handleSelectAllEligible}
              className="font-semibold text-emerald-800 hover:text-emerald-950"
            >
              Select all eligible
            </button>
            <span className="text-[#d7e4dc]">·</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="font-medium text-[#6d7f76] hover:text-rose-700"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
            <input
              type="text"
              placeholder="Search name, CID, formula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-lg border border-[#d5e3da] bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-emerald-600"
          >
            <option value="ALL">All classes</option>
            {chemicalClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
          <select
            value={selectedPlantPart}
            onChange={(e) => setSelectedPlantPart(e.target.value)}
            className="rounded-lg border border-[#d5e3da] bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-emerald-600"
          >
            <option value="ALL">All plant parts</option>
            {plantParts.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-[#d5e3da] bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-emerald-600"
          >
            <option value="ALL">All statuses</option>
            <option value="SELECTED">Selected ({selectedCount})</option>
            <option value="UNSELECTED">Not selected ({uniqueCompounds.length - selectedCount})</option>
            <option value="READY">Structure ready</option>
            <option value="WARNING">Missing SMILES</option>
          </select>
        </div>

        {(missingSmiles || duplicateCount > 0) && (
          <div className="flex flex-wrap gap-2 text-[10px]">
            {missingSmiles && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-900">
                <AlertTriangle className="h-3 w-3" />
                Some compounds lack SMILES
              </span>
            )}
            {duplicateCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2 py-0.5 font-semibold text-[#52645d]">
                Hidden {duplicateCount} duplicate {duplicateCount === 1 ? "row" : "rows"}
              </span>
            )}
          </div>
        )}

        {/* Dense compound list */}
        {filteredCompounds.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-[#d7e4dc]/90">
            <div className="hidden grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_4.5rem_minmax(0,0.9fr)_5.5rem_6.5rem_5rem] gap-2 border-b border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#8aa094] lg:grid">
              <span className="text-center">Dock</span>
              <span>Compound</span>
              <span>Formula</span>
              <span>MW</span>
              <span>Class</span>
              <span>CID</span>
              <span>Structure</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-[#e8f0eb]">
              {filteredCompounds.map((comp) => {
                const isSelected = Boolean(comp.selectedForDocking);
                const hasSmiles = Boolean(comp.smiles?.trim());

                return (
                  <div
                    key={comp.id}
                    className={`grid grid-cols-1 gap-2 px-2.5 py-2 lg:grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_4.5rem_minmax(0,0.9fr)_5.5rem_6.5rem_5rem] lg:items-center lg:gap-2 ${
                      isSelected ? "bg-emerald-50/40" : "bg-white hover:bg-[#f7faf8]"
                    }`}
                  >
                    <div className="flex items-center justify-between lg:justify-center">
                      <span className="text-[10px] font-semibold text-[#8aa094] lg:hidden">
                        Dock
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleDocking(comp.id, isSelected)}
                        className="h-3.5 w-3.5 rounded border-[#d5e3da] text-emerald-700 focus:ring-emerald-600"
                        title={isSelected ? "Deselect for docking" : "Select for docking"}
                      />
                    </div>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setInspectedCompound(comp)}
                        className="block truncate text-left text-xs font-semibold text-[#0f2c20] hover:text-emerald-800 hover:underline"
                      >
                        {comp.compoundName}
                      </button>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-[#8aa094] lg:hidden">
                        <span className="font-mono">{comp.molecularFormula || "—"}</span>
                        <span>
                          {comp.molecularWeight
                            ? `${Number(comp.molecularWeight).toFixed(1)} g/mol`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    <span className="hidden font-mono text-[11px] text-[#52645d] lg:block">
                      {comp.molecularFormula || "—"}
                    </span>
                    <span className="hidden font-mono text-[11px] text-[#52645d] lg:block">
                      {comp.molecularWeight ? Number(comp.molecularWeight).toFixed(2) : "—"}
                    </span>
                    <span className="hidden truncate text-[10px] text-[#6d7f76] lg:block">
                      {comp.compoundClass || "Phytochemical"}
                    </span>

                    <div className="hidden lg:block">
                      {comp.pubchemId ? (
                        <a
                          href={`https://pubchem.ncbi.nlm.nih.gov/compound/${comp.pubchemId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold text-emerald-800 hover:underline"
                        >
                          {comp.pubchemId}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#8aa094]">—</span>
                      )}
                    </div>

                    <div>
                      {hasSmiles ? (
                        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-900">
                          <Check className="h-2.5 w-2.5" />
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-900">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          No SMILES
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setInspectedCompound(comp)}
                        className="rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2 py-1 text-[10px] font-semibold text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(comp.id, comp.compoundName)}
                        className="rounded-lg p-1 text-[#8aa094] hover:bg-rose-50 hover:text-rose-700"
                        title="Remove compound"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-8 text-center">
            <Dna className="mx-auto h-7 w-7 text-[#8aa094]" />
            <p className="mt-2 text-xs font-semibold text-[#0f2c20]">No matching phytochemicals</p>
            <p className="mx-auto mt-1 max-w-sm text-[11px] text-[#8aa094]">
              Import from Section 1 for {plantName}, or add a custom compound.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={handleImportSection1}
                disabled={isImporting}
                className="inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#52645d] hover:border-emerald-400"
              >
                <Download className="h-3 w-3" />
                Import Section 1
              </button>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800"
              >
                <Plus className="h-3 w-3" />
                Add compound
              </button>
            </div>
          </div>
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
                  { label: "PubChem", value: inspectedCompound.pubchemId || "—" },
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

              <div className="mt-3 flex items-center justify-between rounded-xl border border-[#e8f0eb] bg-[#f7faf8] px-3 py-2 text-[11px]">
                <span className="font-semibold text-[#52645d]">Provenance</span>
                <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                  {inspectedCompound.sourceProvenance || "Verified botanical registry"}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#e8f0eb] pt-3">
                <button
                  type="button"
                  onClick={() =>
                    handleToggleDocking(
                      inspectedCompound.id,
                      Boolean(inspectedCompound.selectedForDocking)
                    )
                  }
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
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
