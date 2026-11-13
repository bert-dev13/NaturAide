// src/components/researcher/in-silico/TargetProteinStep2Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Activity,
  Leaf,
  X,
  ChevronDown,
  Check,
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
  status?: string;
  boundLigand?: string;
  chains?: string;
  notes?: string;
}

interface LigandSummary {
  total: number;
  structureReady: number;
  missingStructure?: number;
  message?: string;
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
  ligandStatus?: LigandSummary | null;
}

function shortCategory(cat: string) {
  const first = cat.split(/[&·|,]/)[0]?.trim() || cat;
  return first.length > 32 ? `${first.slice(0, 30)}…` : first;
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
  isAddingTarget: _isAddingTarget,
  ligandStatus = null,
}: Step2Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isSuggestingWithAi, setIsSuggestingWithAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<TargetSuggestionResult[] | null>(null);
  const [expandedPdb, setExpandedPdb] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingPdbs, setPendingPdbs] = useState<Set<string>>(new Set());

  const identifiedCount =
    ligandStatus?.total ??
    compounds.length;
  const structureReadyCount =
    ligandStatus?.structureReady ??
    compounds.filter((c) => String(c.smiles || "").trim()).length;

  const selectedMap = useMemo(() => {
    const map = new Map<string, TargetProteinItem>();
    targets.forEach((t) => {
      if (t.pdbId) map.set(t.pdbId.toUpperCase(), t);
    });
    return map;
  }, [targets]);

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
          biologicalFunction:
            t.notes || "Macromolecular target receptor loaded from project history.",
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    allLibraryProteins.forEach((p) => {
      if (p.therapeuticCategory?.trim()) set.add(shortCategory(p.therapeuticCategory));
    });
    return Array.from(set).sort();
  }, [allLibraryProteins]);

  const handleSuggestWithAi = async () => {
    setIsSuggestingWithAi(true);
    setErrorMessage(null);

    try {
      const compoundNames = compounds
        .map((c) => c.compoundName || c.name || "")
        .filter(Boolean);

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

      setAiSuggestions(
        suggestTargetsForProject({ plantName, researchObjective, compoundNames })
      );
    } catch {
      const compoundNames = compounds
        .map((c) => c.compoundName || c.name || "")
        .filter(Boolean);
      setAiSuggestions(
        suggestTargetsForProject({ plantName, researchObjective, compoundNames })
      );
    } finally {
      setIsSuggestingWithAi(false);
    }
  };

  const aiSuggestionMap = useMemo(() => {
    if (!aiSuggestions) return new Map<string, TargetSuggestionResult>();
    const map = new Map<string, TargetSuggestionResult>();
    aiSuggestions.forEach((s) => {
      map.set(s.target.pdbId.toUpperCase(), s);
    });
    return map;
  }, [aiSuggestions]);

  const filteredProteins = useMemo(() => {
    let list = allLibraryProteins;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.targetName.toLowerCase().includes(q) ||
          p.pdbId.toLowerCase().includes(q) ||
          p.geneOrProtein.toLowerCase().includes(q) ||
          p.therapeuticCategory.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "ALL") {
      list = list.filter((p) => shortCategory(p.therapeuticCategory) === categoryFilter);
    }

    if (aiSuggestions && aiSuggestions.length > 0) {
      list = [...list].sort((a, b) => {
        const scoreA = aiSuggestionMap.get(a.pdbId.toUpperCase())?.score || 0;
        const scoreB = aiSuggestionMap.get(b.pdbId.toUpperCase())?.score || 0;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [allLibraryProteins, searchQuery, categoryFilter, aiSuggestions, aiSuggestionMap]);

  const handleToggleTarget = async (pdbId: string) => {
    const cleanId = pdbId.toUpperCase();
    if (pendingPdbs.has(cleanId)) return;

    const existing = selectedMap.get(cleanId);
    setErrorMessage(null);
    setPendingPdbs((prev) => new Set(prev).add(cleanId));

    try {
      if (existing) {
        await onRemoveTarget(existing.id);
      } else {
        await onAddTarget(cleanId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update target selection.");
    } finally {
      setPendingPdbs((prev) => {
        const next = new Set(prev);
        next.delete(cleanId);
        return next;
      });
    }
  };

  const selectedList = useMemo(() => {
    return [...selectedMap.values()].map((t) => {
      const meta = allLibraryProteins.find(
        (p) => p.pdbId.toUpperCase() === t.pdbId.toUpperCase()
      );
      return {
        ...t,
        displayName: meta?.targetName || t.targetName || t.pdbId,
      };
    });
  }, [selectedMap, allLibraryProteins]);

  const easeOut = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
              <Target className="h-4 w-4 text-emerald-700" />
              Target Protein Selection
            </h2>
            <p className="mt-0.5 text-[12px] text-[#6d7f76]">
              Choose the protein targets for molecular docking analysis.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-900">
            {selectedMap.size} selected
          </span>
        </div>

        {/* Compact compound / plant summary */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#e8f0eb] bg-[#f7faf8] px-3 py-2 text-[11px] text-[#52645d]">
          <span className="inline-flex items-center gap-1 font-semibold text-[#0f2c20]">
            <Leaf className="h-3.5 w-3.5 text-emerald-700" />
            {plantName}
            {plantScientificName ? (
              <span className="font-normal italic text-[#8aa094]">{plantScientificName}</span>
            ) : null}
          </span>
          <span className="text-[#d7e4dc]">·</span>
          <span>
            <span className="font-semibold text-[#0f2c20]">{identifiedCount}</span> identified
          </span>
          <span className="text-[#d7e4dc]">·</span>
          <span>
            <span className="font-semibold text-emerald-800">{structureReadyCount}</span>{" "}
            structure-ready
          </span>
          {structureReadyCount === 0 && (
            <>
              <span className="text-[#d7e4dc]">·</span>
              <Link
                href={`/researcher/projects/${projectId}/formulation-rd`}
                className="font-semibold text-emerald-800 hover:underline"
              >
                Add compounds in Section 1
              </Link>
            </>
          )}
        </div>

        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-900"
            >
              <span className="inline-flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                {errorMessage}
              </span>
              <button type="button" onClick={() => setErrorMessage(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Selected proteins summary */}
      {selectedList.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3 sm:p-3.5"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
              Selected proteins ({selectedList.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedList.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] text-[#0f2c20]"
              >
                <span className="max-w-[10rem] truncate font-semibold sm:max-w-[14rem]">
                  {t.displayName}
                </span>
                <span className="font-mono text-[10px] font-bold text-emerald-800">
                  {t.pdbId.toUpperCase()}
                </span>
                {t.prepStatus === "PREPARING" && (
                  <Activity className="h-3 w-3 animate-spin text-amber-600" />
                )}
                <button
                  type="button"
                  onClick={() => handleToggleTarget(t.pdbId)}
                  disabled={pendingPdbs.has(t.pdbId.toUpperCase())}
                  className="rounded p-0.5 text-[#8aa094] hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                  title="Remove selection"
                  aria-label={`Remove ${t.displayName}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </motion.section>
      )}

      {/* Target protein library */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#0f2c20]">
              Target Protein Library
            </h3>
            <p className="text-[11px] text-[#8aa094]">
              {filteredProteins.length} of {allLibraryProteins.length} shown
              {aiSuggestions ? " · AI-ranked for review" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSuggestWithAi}
            disabled={isSuggestingWithAi}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
            title="Suggest targets based on plant, objective, and compounds — review before selecting"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isSuggestingWithAi ? "animate-pulse" : ""}`} />
            {isSuggestingWithAi ? "Suggesting…" : "AI Suggest"}
          </button>
        </div>

        {aiSuggestions && aiSuggestions.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-950">
            <p className="font-semibold">
              AI suggestions are for review only — nothing is selected automatically.
            </p>
            <p className="mt-0.5 text-amber-900/80">
              Relevance notes use available project context and curated evidence; they do not claim
              validated biological interactions.
            </p>
            <button
              type="button"
              onClick={() => setAiSuggestions(null)}
              className="mt-1.5 text-[10px] font-semibold text-amber-900 underline-offset-2 hover:underline"
            >
              Clear AI ranking
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa094]" />
            <input
              type="text"
              placeholder="Search by protein name, PDB ID, or gene…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] py-2 pl-10 pr-3 text-sm text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-xl border border-[#d5e3da] bg-white px-3 text-xs font-medium text-[#0f2c20] outline-none focus:border-emerald-600 sm:max-w-[13rem]"
            aria-label="Filter by category"
          >
            <option value="ALL">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {filteredProteins.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProteins.map((protein) => {
              const cleanPdb = protein.pdbId.toUpperCase();
              const isSelected = selectedMap.has(cleanPdb);
              const selectedTarget = selectedMap.get(cleanPdb);
              const aiMatch = aiSuggestionMap.get(cleanPdb);
              const prep = selectedTarget?.prepStatus || selectedTarget?.status;
              const isPreparing = prep === "PREPARING";
              const isPending = pendingPdbs.has(cleanPdb);
              const isExpanded = expandedPdb === cleanPdb;

              return (
                <div
                  key={cleanPdb}
                  className={`relative flex flex-col overflow-hidden rounded-2xl border transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/60 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                      : "border-[#d7e4dc] bg-white hover:border-emerald-300 hover:bg-[#f7faf8]"
                  } ${isPending ? "opacity-75" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTarget(cleanPdb)}
                    disabled={isPending}
                    className="flex flex-1 flex-col p-3.5 text-left disabled:cursor-wait"
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Deselect" : "Select"} ${protein.targetName}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-snug text-[#0f2c20]">
                          {protein.targetName}
                        </p>
                        <p className="mt-1 font-mono text-[12px] font-bold text-emerald-800">
                          {cleanPdb}
                        </p>
                      </div>
                      <span
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-[#d5e3da] bg-white text-transparent"
                        }`}
                        aria-hidden
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-1 text-[11px] text-[#52645d]">
                      <p>
                        <span className="text-[#8aa094]">Gene / target · </span>
                        <span className="font-semibold text-[#0f2c20]">{protein.geneOrProtein}</span>
                      </p>
                      <p>
                        <span className="text-[#8aa094]">Category · </span>
                        <span className="font-medium">
                          {shortCategory(protein.therapeuticCategory)}
                        </span>
                      </p>
                      <p>
                        <span className="text-[#8aa094]">Resolution · </span>
                        <span className="font-mono font-medium">
                          {protein.resolution || "—"}
                        </span>
                      </p>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {isSelected && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                            isPreparing || isPending
                              ? "border-amber-200 bg-amber-50 text-amber-900"
                              : "border-emerald-300 bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {isPreparing ? (
                            <Activity className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {isPreparing
                            ? "Preparing receptor…"
                            : isPending
                              ? "Saving…"
                              : "Selected"}
                        </span>
                      )}
                      {aiMatch?.isRecommended && (
                        <span className="inline-flex items-center gap-0.5 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                          <Sparkles className="h-2.5 w-2.5" />
                          Suggested
                        </span>
                      )}
                    </div>
                  </button>

                  {aiMatch && (aiMatch.matchReasons?.length > 0 || aiMatch.isRecommended) && (
                    <div className="border-t border-amber-100 bg-amber-50/50 px-3.5 py-2 text-[10px] leading-relaxed text-amber-950">
                      <span className="font-semibold">Why suggested: </span>
                      {(aiMatch.matchReasons || []).slice(0, 2).join(" · ") ||
                        "Matches project context"}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 border-t border-[#e8f0eb] px-3.5 py-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPdb(isExpanded ? null : cleanPdb);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#52645d] hover:text-emerald-800"
                    >
                      Details
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    <a
                      href={`https://www.rcsb.org/structure/${cleanPdb}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline"
                    >
                      RCSB
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-[#e8f0eb] bg-[#f7faf8]"
                      >
                        <div className="space-y-2 px-3.5 py-3 text-[11px] leading-relaxed text-[#52645d]">
                          <p>
                            <span className="font-semibold text-[#0f2c20]">Organism: </span>
                            {protein.organism}
                          </p>
                          <p>
                            <span className="font-semibold text-[#0f2c20]">Method: </span>
                            {protein.method}
                            {protein.resolution ? ` (${protein.resolution})` : ""}
                          </p>
                          {protein.coLigand && (
                            <p>
                              <span className="font-semibold text-[#0f2c20]">Co-ligand: </span>
                              {protein.coLigand}
                            </p>
                          )}
                          <p>{protein.biologicalFunction}</p>
                          {protein.relevance && (
                            <p className="font-medium text-[#0f2c20]">{protein.relevance}</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-8 text-center">
            <Target className="mx-auto h-7 w-7 text-[#8aa094]" />
            <p className="mt-2 text-xs font-semibold text-[#0f2c20]">No matching proteins</p>
            <p className="mt-1 text-[11px] text-[#8aa094]">
              Clear search or filters, or try AI Suggest.
            </p>
          </div>
        )}

        {selectedMap.size === 0 && (
          <p className="flex items-start gap-1.5 text-[11px] text-amber-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Select at least one protein target to continue to In-Silico Screening.
          </p>
        )}
      </motion.section>
    </div>
  );
}
