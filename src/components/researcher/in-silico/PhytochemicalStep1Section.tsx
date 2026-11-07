// src/components/researcher/in-silico/PhytochemicalStep1Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Dna,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  X,
  Copy,
  BookOpen,
  ArrowRight,
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

export default function PhytochemicalStep1Section({
  projectId,
  plantName,
  compounds,
  availableCompounds = [],
  onCompoundsChange,
  onOpenAddModal,
  onRefreshWorkspace,
}: Step1Props) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedPlantPart, setSelectedPlantPart] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Inspection modal
  const [inspectedCompound, setInspectedCompound] = useState<PhytochemicalCompound | null>(null);
  const [copiedSmiles, setCopiedSmiles] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Extract distinct chemical classes and plant parts from all compounds
  const chemicalClasses = useMemo(() => {
    const set = new Set<string>();
    [...compounds, ...availableCompounds].forEach((c) => {
      if (c.compoundClass?.trim()) set.add(c.compoundClass.trim());
    });
    return Array.from(set).sort();
  }, [compounds, availableCompounds]);

  const plantParts = useMemo(() => {
    const set = new Set<string>();
    [...compounds, ...availableCompounds].forEach((c) => {
      if (c.plantPartReported?.trim()) set.add(c.plantPartReported.trim());
    });
    return Array.from(set).sort();
  }, [compounds, availableCompounds]);

  // Filtered compounds list
  const filteredCompounds = useMemo(() => {
    return compounds.filter((comp) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = comp.compoundName?.toLowerCase().includes(q);
        const matchesFormula = comp.molecularFormula?.toLowerCase().includes(q);
        const matchesCid = comp.pubchemId?.toString().includes(q);
        const matchesClass = comp.compoundClass?.toLowerCase().includes(q);
        if (!matchesName && !matchesFormula && !matchesCid && !matchesClass) return false;
      }

      // Chemical Class filter
      if (selectedClass !== "ALL" && comp.compoundClass !== selectedClass) {
        return false;
      }

      // Plant Part filter
      if (selectedPlantPart !== "ALL" && comp.plantPartReported !== selectedPlantPart) {
        return false;
      }

      // Status filter
      if (selectedStatus === "SELECTED" && !comp.selectedForDocking) return false;
      if (selectedStatus === "UNSELECTED" && comp.selectedForDocking) return false;
      if (selectedStatus === "READY" && (!comp.smiles || !comp.molecularWeight)) return false;
      if (selectedStatus === "WARNING" && Boolean(comp.smiles && comp.molecularWeight)) return false;

      return true;
    });
  }, [compounds, searchQuery, selectedClass, selectedPlantPart, selectedStatus]);

  // Handle toggle selection for docking
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
        onCompoundsChange(
          compounds.map((c) => (c.id === compoundId ? { ...c, selectedForDocking: newSelected ? 1 : 0 } : c))
        );
        onRefreshWorkspace();
      }
    } catch {
      alert("Failed to update selection status.");
    }
  };

  // Select all eligible compounds (those with valid SMILES)
  const handleSelectAllEligible = async () => {
    const eligibleIds = compounds.filter((c) => Boolean(c.smiles?.trim())).map((c) => c.id);
    if (eligibleIds.length === 0) {
      alert("No compounds with valid chemical structures (SMILES) are available.");
      return;
    }

    try {
      for (const id of eligibleIds) {
        await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggle-docking", compoundId: id, selectedForDocking: true }),
        });
      }
      onCompoundsChange(
        compounds.map((c) => (eligibleIds.includes(c.id) ? { ...c, selectedForDocking: 1 } : c))
      );
      onRefreshWorkspace();
      setFeedbackMessage({ text: `Selected ${eligibleIds.length} eligible compounds for docking.`, type: "success" });
    } catch {
      alert("Error selecting eligible compounds.");
    }
  };

  // Clear all selections
  const handleClearSelection = async () => {
    try {
      for (const comp of compounds) {
        if (comp.selectedForDocking) {
          await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "toggle-docking", compoundId: comp.id, selectedForDocking: false }),
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

  // Import documented plant compounds from Section 1
  const handleImportSection1 = async () => {
    if (availableCompounds.length === 0) {
      alert(`No documented botanical phytochemicals found in the catalog for ${plantName}.`);
      return;
    }

    const unimported = availableCompounds.filter(
      (ac) => !compounds.some((c) => c.compoundName.toLowerCase().trim() === ac.compoundName.toLowerCase().trim())
    );

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

      // Refetch
      const resScr = await fetch(`/api/researcher/projects/${projectId}/in-silico`);
      if (resScr.ok) {
        const d = await resScr.json();
        if (d.compounds) onCompoundsChange(d.compounds);
      }
      onRefreshWorkspace();
      setFeedbackMessage({
        text: `Successfully imported ${unimported.length} documented botanical compounds from Section 1!`,
        type: "success",
      });
    } catch (e: any) {
      alert(e.message || "Failed to import compounds");
    } finally {
      setIsImporting(false);
    }
  };

  // Remove a compound
  const handleRemove = async (compoundId: number, compoundName: string) => {
    if (!confirm(`Remove "${compoundName}" from this research project?`)) return;
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-compound", compoundId }),
      });
      if (res.ok) {
        onCompoundsChange(compounds.filter((c) => c.id !== compoundId));
        onRefreshWorkspace();
        setFeedbackMessage({ text: `Removed "${compoundName}".`, type: "success" });
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

  const selectedCount = compounds.filter((c) => c.selectedForDocking).length;

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar & Quick Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                Section 2 / Step 01 of 08
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700">Phytochemical Selection</span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {selectedCount} of {compounds.length} Selected for Docking
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
              <Dna className="w-4 h-4 text-teal-600" />
              Candidate Bioactive Phytochemicals
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleImportSection1}
              disabled={isImporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50/80 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Import all metabolites verified in Section 1 Plant Information"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isImporting ? "Importing..." : "Import From Section 1"}</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Compound</span>
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMessage && (
          <div
            className={`mt-3 p-2.5 rounded-lg text-xs flex items-center justify-between ${
              feedbackMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMessage.text}</span>
            </div>
            <button type="button" onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Search Box */}
          <div className="relative sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, CID, formula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Chemical Class Dropdown */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="ALL">All Chemical Classes</option>
              {chemicalClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Plant Part Dropdown */}
          <div>
            <select
              value={selectedPlantPart}
              onChange={(e) => setSelectedPlantPart(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="ALL">All Plant Parts</option>
              {plantParts.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          </div>

          {/* Screening Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="ALL">All Screening Statuses</option>
              <option value="SELECTED">Selected for Docking ({selectedCount})</option>
              <option value="UNSELECTED">Not Selected ({compounds.length - selectedCount})</option>
              <option value="READY">Structure Ready (SMILES Valid)</option>
              <option value="WARNING">Structure Warning (Missing SMILES)</option>
            </select>
          </div>
        </div>

        {/* Quick Selection Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Showing {filteredCompounds.length} of {compounds.length} compounds</span>
            {compounds.some((c) => !c.smiles) && (
              <span className="text-amber-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Some compounds lack 3D structure / SMILES
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllEligible}
              className="text-teal-700 hover:text-teal-900 font-semibold"
            >
              Select All Eligible
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-slate-600 hover:text-rose-700 font-medium"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>

      {/* 3. Compact Searchable Compounds Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredCompounds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">Dock</th>
                  <th className="py-2.5 px-3">Compound Name</th>
                  <th className="py-2.5 px-3">Formula</th>
                  <th className="py-2.5 px-3">MW (g/mol)</th>
                  <th className="py-2.5 px-3">Chemical Class</th>
                  <th className="py-2.5 px-3">PubChem CID</th>
                  <th className="py-2.5 px-3">Structure Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompounds.map((comp) => {
                  const isSelected = Boolean(comp.selectedForDocking);
                  const hasSmiles = Boolean(comp.smiles?.trim());

                  return (
                    <tr
                      key={comp.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? "bg-teal-50/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleDocking(comp.id, isSelected)}
                          className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                          title={isSelected ? "Deselect for docking" : "Select for docking"}
                        />
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() => setInspectedCompound(comp)}
                          className="hover:text-teal-700 hover:underline text-left font-medium text-slate-800"
                        >
                          {comp.compoundName}
                        </button>
                      </td>

                      {/* Formula */}
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {comp.molecularFormula || "—"}
                      </td>

                      {/* MW */}
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {comp.molecularWeight ? `${Number(comp.molecularWeight).toFixed(2)}` : "—"}
                      </td>

                      {/* Chemical Class */}
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {comp.compoundClass || "Phytochemical"}
                        </span>
                      </td>

                      {/* PubChem CID */}
                      <td className="py-2.5 px-3 font-mono">
                        {comp.pubchemId ? (
                          <a
                            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${comp.pubchemId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-700 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <span>{comp.pubchemId}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Structure Status */}
                      <td className="py-2.5 px-3">
                        {hasSmiles ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Structure Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Missing SMILES
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectedCompound(comp)}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(comp.id, comp.compoundName)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove compound"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50/50 space-y-2">
            <Dna className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No matching phytochemicals found</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Click &ldquo;Import From Section 1&rdquo; to pull compounds documented for {plantName},
              or click &ldquo;Add Custom Compound&rdquo; to enter a new metabolite.
            </p>
          </div>
        )}
      </div>

      {/* 4. Compound Details Modal */}
      {inspectedCompound && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Dna className="w-4 h-4 text-teal-600" />
                  {inspectedCompound.compoundName}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectedCompound.compoundClass || "Botanical Secondary Metabolite"} • {plantName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedCompound(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-sans">Formula:</span>
                <span className="font-bold text-slate-900">{inspectedCompound.molecularFormula || "—"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-sans">Molecular Weight:</span>
                <span className="font-bold text-slate-900">
                  {inspectedCompound.molecularWeight ? `${inspectedCompound.molecularWeight} g/mol` : "—"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-sans">PubChem CID:</span>
                <span className="font-bold text-teal-700">{inspectedCompound.pubchemId || "—"}</span>
              </div>
            </div>

            {/* Canonical SMILES */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-slate-700">Canonical SMILES String:</label>
                {inspectedCompound.smiles && (
                  <button
                    type="button"
                    onClick={() => copySmilesToClipboard(inspectedCompound.smiles || "")}
                    className="text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSmiles ? "Copied!" : "Copy"}</span>
                  </button>
                )}
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 text-teal-300 font-mono text-[11px] break-all border border-slate-800">
                {inspectedCompound.smiles || (
                  <span className="text-slate-500 italic">No SMILES structure available.</span>
                )}
              </div>
            </div>

            {/* IUPAC Name */}
            {inspectedCompound.iupacName && (
              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-0.5">IUPAC Systematic Name:</label>
                <p className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px]">
                  {inspectedCompound.iupacName}
                </p>
              </div>
            )}

            {/* Provenance & Literature */}
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Source Provenance:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {inspectedCompound.sourceProvenance || "Verified Botanical Registry"}
                </span>
              </div>
              {inspectedCompound.sourceReference && (
                <div>
                  <span className="text-slate-500">Citation:</span>
                  <p className="font-medium text-slate-800">{inspectedCompound.sourceReference}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  handleToggleDocking(inspectedCompound.id, Boolean(inspectedCompound.selectedForDocking))
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  inspectedCompound.selectedForDocking
                    ? "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                    : "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                }`}
              >
                {inspectedCompound.selectedForDocking ? "Deselect for Docking" : "Select for Docking"}
              </button>

              <button
                type="button"
                onClick={() => setInspectedCompound(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

