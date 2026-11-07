"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Plus,
  Check,
  CheckCircle2,
  Atom,
  AlertCircle,
  Loader2,
  FlaskConical,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

export interface PhytochemicalItem {
  id?: number | string;
  compoundName: string;
  plantId?: string;
  plantCommonName?: string;
  plantScientificName?: string;
  compoundClass?: string;
  molecularFormula?: string | null;
  molecularWeight?: number | null;
  smiles?: string | null;
  pubchemId?: string | null;
  iupacName?: string | null;
  plantPartReported?: string | null;
  structureReady?: boolean;
  structureStatusNote?: string;
  referencesCount?: number;
  isAlreadyAdded?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  plantName: string;
  plantScientificName?: string;
  existingCompoundNames: string[];
  onCompoundAdded: (compound: any) => Promise<void>;
  onSelectTargetProtein?: (target: any) => void;
}

export default function PhytochemicalSelectorModal({
  isOpen,
  onClose,
  projectId,
  plantName,
  plantScientificName,
  existingCompoundNames,
  onCompoundAdded,
}: Props) {
  const [activeTab, setActiveTab] = useState<"plant" | "database">("plant");
  const [searchTerm, setSearchTerm] = useState("");
  const [plantCompounds, setPlantCompounds] = useState<PhytochemicalItem[]>([]);
  const [databaseCompounds, setDatabaseCompounds] = useState<PhytochemicalItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [addingId, setAddingId] = useState<string | number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const existingSet = useMemo(() => {
    return new Set(existingCompoundNames.map((n) => n.toLowerCase().trim()));
  }, [existingCompoundNames]);

  // Load Plant-specific compounds on mount
  useEffect(() => {
    if (!isOpen) return;
    loadPlantCompounds();
  }, [isOpen, projectId]);

  async function loadPlantCompounds() {
    setLoadingList(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search-phytochemicals", filterByPlant: true, query: "" }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        setPlantCompounds(data.results);
      }
    } catch (e: any) {
      console.warn("Could not load plant compounds:", e);
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSearchDatabase(q: string) {
    setLoadingList(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search-phytochemicals", filterByPlant: false, query: q }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        setDatabaseCompounds(data.results);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Botanical database search failed.");
    } finally {
      setLoadingList(false);
    }
  }

  async function handleAddCompound(compound: PhytochemicalItem, customSourceRef?: string) {
    const cid = compound.id || compound.compoundName;
    setAddingId(cid);
    setErrorMsg(null);
    try {
      await onCompoundAdded({
        compoundName: compound.compoundName,
        iupacName: compound.iupacName || "",
        smiles: compound.smiles || "",
        molecularFormula: compound.molecularFormula || "",
        molecularWeight: compound.molecularWeight || null,
        pubchemId: compound.pubchemId || "",
        plantSource: compound.plantCommonName || plantName,
        sourceReference:
          customSourceRef ||
          compound.plantPartReported ||
          `Documented constituent of ${compound.plantCommonName || plantName}`,
        sourceProvenance: compound.pubchemId ? "VERIFIED_DATABASE" : "RESEARCHER_ENTERED",
        selectedForDocking: compound.structureReady !== false,
      });

      setSuccessMsg(`Added "${compound.compoundName}" to project phytochemical candidates.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to add compound.");
    } finally {
      setAddingId(null);
    }
  }

  if (!isOpen) return null;

  const currentList = activeTab === "plant" ? plantCompounds : databaseCompounds;
  const filteredList = currentList.filter((c) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      c.compoundName.toLowerCase().includes(s) ||
      (c.molecularFormula && c.molecularFormula.toLowerCase().includes(s)) ||
      (c.compoundClass && c.compoundClass.toLowerCase().includes(s)) ||
      (c.pubchemId && String(c.pubchemId).includes(s)) ||
      (c.plantCommonName && c.plantCommonName.toLowerCase().includes(s))
    );
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[88vh] max-h-[88vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header (Clean Forest Emerald Gradient - Fixed at Top) */}
        <div className="px-6 py-4 border-b border-emerald-900/60 bg-gradient-to-r from-[#0a2318] via-[#0f2c20] to-[#0d2a1e] text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Verified Botanical Library
              </span>
              <span className="text-xs text-emerald-200 font-medium truncate">
                {plantName} {plantScientificName && `(${plantScientificName})`}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white tracking-tight">
              Select Verified Phytochemicals
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Segmented Navigation & Stats Strip - Fixed below header */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-300/50">
            <button
              type="button"
              onClick={() => {
                setActiveTab("plant");
                setSearchTerm("");
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "plant"
                  ? "bg-white text-emerald-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
              <span>Plant Compounds ({plantCompounds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("database");
                setSearchTerm("");
                if (databaseCompounds.length === 0) handleSearchDatabase("");
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "database"
                  ? "bg-white text-emerald-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Search Botanical Database</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <strong className="text-emerald-800">{existingSet.size}</strong> already in project
            </span>
          </div>
        </div>

        {/* Alerts & Feedback */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Content - Single Scroll Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          {/* Search Field */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                if (activeTab === "database") {
                  handleSearchDatabase(val);
                }
              }}
              placeholder={
                activeTab === "plant"
                  ? `Filter documented constituents for ${plantName} by name, formula, or PubChem CID...`
                  : "Search over 250+ botanical constituents across Philippine flora..."
              }
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  if (activeTab === "database") handleSearchDatabase("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Minimal Professional Guidance Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-semibold text-emerald-900">
                Automatic Chemical Properties &amp; 3D Structure Resolution
              </p>
              <p className="text-emerald-800/80 text-[11px]">
                Selecting any compound automatically populates canonical SMILES coordinates, molecular weight, Lipinski drug-likeness rules, and PubChem CIDs. No manual chemical typing is required.
              </p>
            </div>
          </div>

          {/* Compound Cards List */}
          {loadingList ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs">Loading verified phytochemical records...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2.5">
              <Atom className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">No matching phytochemicals found</h4>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                {activeTab === "plant" ? (
                  <>
                    No constituents found matching &ldquo;{searchTerm}&rdquo; in {plantName}. Switch to the{" "}
                    <strong>Search Botanical Database</strong> tab to explore compounds from other Philippine medicinal plants.
                  </>
                ) : (
                  <>No botanical compounds matched &ldquo;{searchTerm}&rdquo;. Try another search term.</>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 pb-2">
              {filteredList.map((c) => {
                const isAdded = existingSet.has(c.compoundName.toLowerCase().trim());
                const isAdding = addingId === (c.id || c.compoundName);

                return (
                  <div
                    key={c.id || c.compoundName}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isAdded
                        ? "bg-slate-50/70 border-slate-200"
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-[#0f2c20]">
                          {c.compoundName}
                        </h4>
                        {c.molecularFormula && (
                          <span className="font-mono text-[10.5px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {c.molecularFormula}
                          </span>
                        )}
                        {c.compoundClass && (
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {c.compoundClass}
                          </span>
                        )}
                        {c.structureReady ? (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            Structure Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            2D Coordinates
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
                        {c.molecularWeight && (
                          <span>MW: {Number(c.molecularWeight).toFixed(2)} g/mol</span>
                        )}
                        {c.pubchemId && (
                          <>
                            <span>·</span>
                            <span>PubChem CID: {c.pubchemId}</span>
                          </>
                        )}
                        {c.plantPartReported && (
                          <>
                            <span>·</span>
                            <span className="italic text-emerald-900 font-medium">Part: {c.plantPartReported}</span>
                          </>
                        )}
                        {c.plantCommonName && activeTab === "database" && (
                          <>
                            <span>·</span>
                            <span className="font-medium text-slate-600">Plant: {c.plantCommonName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 self-end sm:self-center">
                      {isAdded ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Added
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddCompound(c)}
                          disabled={isAdding}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#184433] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isAdding ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          <span>Select &amp; Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Click on any compound to add without typing technical parameters.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
