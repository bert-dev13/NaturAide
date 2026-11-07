// src/components/researcher/in-silico/TargetProteinStep2Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Target,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Activity,
  Layers,
} from "lucide-react";
import {
  CURATED_TARGET_PROTEINS,
  CuratedTargetProtein,
  suggestTargetsForProject,
  TargetSuggestionResult,
} from "@/lib/target-protein-catalog";

export interface TargetProteinItem {
  id: number;
  pdbId: string;
  targetName: string;
  organism?: string;
  resolution?: string;
  method?: string;
  prepStatus?: string;
  boundLigand?: string;
  chains?: string;
  notes?: string;
}

interface Step2Props {
  projectId: number;
  plantName: string;
  plantScientificName?: string;
  researchObjective?: string;
  compounds?: any[];
  targets: TargetProteinItem[];
  onAddTarget: (pdbId: string) => Promise<void>;
  onRemoveTarget: (targetId: number) => Promise<void>;
  isAddingTarget: boolean;
}

export default function TargetProteinStep2Section({
  projectId,
  plantName,
  plantScientificName,
  researchObjective = "",
  compounds = [],
  targets = [],
  onAddTarget,
  onRemoveTarget,
  isAddingTarget,
}: Step2Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSuggestingWithAi, setIsSuggestingWithAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<TargetSuggestionResult[] | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map existing targets by uppercase PDB ID for instant lookup
  const selectedMap = useMemo(() => {
    const map = new Map<string, TargetProteinItem>();
    targets.forEach((t) => {
      if (t.pdbId) {
        map.set(t.pdbId.toUpperCase(), t);
      }
    });
    return map;
  }, [targets]);

  // Combine curated library with any historical custom targets previously added
  const allLibraryProteins = useMemo<CuratedTargetProtein[]>(() => {
    const list = [...CURATED_TARGET_PROTEINS];
    targets.forEach((t) => {
      const cleanPdb = (t.pdbId || "").toUpperCase();
      if (cleanPdb && !list.some((c) => c.pdbId.toUpperCase() === cleanPdb)) {
        list.push({
          pdbId: cleanPdb,
          targetName: t.targetName || `Receptor ${cleanPdb}`,
          geneOrProtein: t.chains || "Verified Structure",
          organism: t.organism || "Homo sapiens",
          biologicalFunction: t.notes || "Macromolecular target receptor loaded from project history.",
          therapeuticCategory: "Custom Project Target",
          resolution: t.resolution || "Compendial / Experimental",
          method: t.method || "X-ray Diffraction",
          targetType: "EXPERIMENTALLY_ESTABLISHED",
          relevance: "Project target selected for molecular docking.",
          compoundAssociations: [],
          objectiveKeywords: [],
        });
      }
    });
    return list;
  }, [targets]);

  // AI Suggestion Trigger
  const handleSuggestWithAi = async () => {
    setIsSuggestingWithAi(true);
    setErrorMessage(null);

    try {
      // Extract selected compound names
      const compoundNames = compounds.map((c) => c.compoundName || c.name || "").filter(Boolean);

      // Attempt backend AI suggestion
      const res = await fetch(`/api/researcher/projects/${projectId}/docking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest-targets" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setAiSuggestions(data.suggestions);
          setIsSuggestingWithAi(false);
          return;
        }
      }

      // Client-side fallback ranking
      const ranked = suggestTargetsForProject({
        plantName,
        researchObjective,
        compoundNames,
      });
      setAiSuggestions(ranked);
    } catch (err: any) {
      // Fallback to deterministic ranking
      const compoundNames = compounds.map((c) => c.compoundName || c.name || "").filter(Boolean);
      const ranked = suggestTargetsForProject({
        plantName,
        researchObjective,
        compoundNames,
      });
      setAiSuggestions(ranked);
    } finally {
      setIsSuggestingWithAi(false);
    }
  };

  // Map AI recommendations for fast lookup
  const aiSuggestionMap = useMemo(() => {
    if (!aiSuggestions) return new Map<string, TargetSuggestionResult>();
    const map = new Map<string, TargetSuggestionResult>();
    aiSuggestions.forEach((s) => {
      map.set(s.target.pdbId.toUpperCase(), s);
    });
    return map;
  }, [aiSuggestions]);

  // Filtered and sorted protein list
  const filteredProteins = useMemo(() => {
    let list = allLibraryProteins;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        return (
          p.targetName.toLowerCase().includes(q) ||
          p.pdbId.toLowerCase().includes(q) ||
          p.geneOrProtein.toLowerCase().includes(q) ||
          p.therapeuticCategory.toLowerCase().includes(q) ||
          p.biologicalFunction.toLowerCase().includes(q)
        );
      });
    }

    // Sort: if AI suggestions exist, sort by AI recommendation score descending
    if (aiSuggestions && aiSuggestions.length > 0) {
      list = [...list].sort((a, b) => {
        const scoreA = aiSuggestionMap.get(a.pdbId.toUpperCase())?.score || 0;
        const scoreB = aiSuggestionMap.get(b.pdbId.toUpperCase())?.score || 0;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [allLibraryProteins, searchQuery, aiSuggestions, aiSuggestionMap]);

  // Toggle selection
  const handleToggleTarget = async (pdbId: string) => {
    const cleanId = pdbId.toUpperCase();
    const existing = selectedMap.get(cleanId);
    setErrorMessage(null);

    try {
      if (existing) {
        // Deselect -> remove target
        await onRemoveTarget(existing.id);
      } else {
        // Select -> add target and automatically initiate receptor prep
        await onAddTarget(cleanId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update target selection.");
    }
  };

  // Toggle inline scientific details
  const toggleDetails = (pdbId: string) => {
    setExpandedDetails((prev) => {
      const next = new Set(prev);
      if (next.has(pdbId)) {
        next.delete(pdbId);
      } else {
        next.add(pdbId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* ===================================================================== */}
      {/* 1. HEADER & SEARCH / AI SUGGEST CONTROLS                              */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                Section 2 / Step 02 of 08
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-teal-600" />
                Target Protein Selection
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Choose the proteins you want to investigate. Receptors are automatically prepared from verified compendial PDB structures.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {selectedMap.size} Target{selectedMap.size === 1 ? "" : "s"} Selected
              </span>
            </span>

            <button
              type="button"
              onClick={handleSuggestWithAi}
              disabled={isSuggestingWithAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Recommend relevant target proteins based on research objectives and phytochemicals"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSuggestingWithAi ? "animate-spin" : ""}`} />
              <span>{isSuggestingWithAi ? "Suggesting..." : "Suggest Targets with AI"}</span>
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proteins by name, PDB ID (e.g. 5KIR, 6Y3C), gene, or therapeutic category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden transition-colors"
          />
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-2.5 rounded-lg text-xs flex items-center justify-between bg-rose-50 text-rose-900 border border-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-xs ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. COMPACT SELECTABLE PROTEIN LIST WITH CHECKBOXES                   */}
      {/* ===================================================================== */}
      <div className="space-y-2">
        {filteredProteins.map((protein) => {
          const cleanPdb = protein.pdbId.toUpperCase();
          const isSelected = selectedMap.has(cleanPdb);
          const selectedTarget = selectedMap.get(cleanPdb);
          const isExpanded = expandedDetails.has(cleanPdb);
          const aiMatch = aiSuggestionMap.get(cleanPdb);

          return (
            <div
              key={cleanPdb}
              className={`p-3 rounded-xl border transition-all ${
                isSelected
                  ? "bg-teal-50/30 border-teal-300 shadow-2xs"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Checkbox and Primary Info */}
                <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleTarget(cleanPdb)}
                    disabled={isAddingTarget}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-slate-900">{protein.targetName}</span>
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {cleanPdb}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-medium">{protein.therapeuticCategory}</span>

                      {/* AI Recommendation Pill */}
                      {aiMatch && aiMatch.isRecommended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          <span>AI Match: {aiMatch.matchReasons[0]}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {protein.biologicalFunction}
                    </p>
                  </div>
                </label>

                {/* Status Indicator & Details Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  {isSelected && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        selectedTarget?.prepStatus === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : selectedTarget?.prepStatus === "PREPARING"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-teal-50 text-teal-800 border-teal-200"
                      }`}
                    >
                      {selectedTarget?.prepStatus === "PREPARING" ? (
                        <Activity className="w-3 h-3 text-amber-600 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      )}
                      <span>
                        {selectedTarget?.prepStatus === "COMPLETED"
                          ? "Receptor Ready"
                          : selectedTarget?.prepStatus || "Ready"}
                      </span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleDetails(cleanPdb)}
                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 px-1.5 py-0.5 transition-colors cursor-pointer"
                  >
                    {isExpanded ? "Hide Details" : "Details"}
                  </button>
                </div>
              </div>

              {/* Optional Inline Scientific Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] p-2 rounded bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Organism</span>
                      <span className="font-semibold text-slate-800">{protein.organism}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Gene / Protein</span>
                      <span className="font-semibold text-slate-800">{protein.geneOrProtein}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Method &amp; Resolution</span>
                      <span className="font-semibold text-slate-800">
                        {protein.method} ({protein.resolution})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Co-Ligand</span>
                      <span className="font-semibold text-teal-700">{protein.coLigand || "None"}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-700 block text-[11px]">
                      Biological Function &amp; Botanical Research Relevance:
                    </span>
                    <p className="text-slate-600 text-xs leading-relaxed">{protein.biologicalFunction}</p>
                    <p className="text-slate-600 text-xs leading-relaxed font-medium mt-1">
                      {protein.relevance}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-500">
                      RCSB Protein Data Bank ID: <strong className="font-mono text-slate-800">{cleanPdb}</strong>
                    </span>
                    <a
                      href={`https://www.rcsb.org/structure/${cleanPdb}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 font-semibold"
                    >
                      <span>View on RCSB PDB</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredProteins.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-2">
            <Target className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No matching target proteins found</p>
            <p className="text-[11px] text-slate-500">
              Try adjusting your search terms or click "Suggest Targets with AI" to view recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
