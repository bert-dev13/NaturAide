// src/components/researcher/in-silico/TargetProteinStep2Section.tsx
"use client";

import React, { useState, useMemo } from "react";
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
  ChevronRight,
  X,
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

function shortCategory(cat: string) {
  const first = cat.split(/[&·|,]/)[0]?.trim() || cat;
  return first.length > 28 ? `${first.slice(0, 26)}…` : first;
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
}: Step2Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isSuggestingWithAi, setIsSuggestingWithAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<TargetSuggestionResult[] | null>(null);
  const [inspectedPdb, setInspectedPdb] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** PDB IDs currently mid-toggle — avoid global disable / remount flash */
  const [pendingPdbs, setPendingPdbs] = useState<Set<string>>(new Set());

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

  const inspectedProtein = useMemo(() => {
    if (!inspectedPdb) return null;
    return allLibraryProteins.find((p) => p.pdbId.toUpperCase() === inspectedPdb) || null;
  }, [inspectedPdb, allLibraryProteins]);

  const readyCount = [...selectedMap.values()].filter(
    (t) => t.prepStatus === "COMPLETED" || !t.prepStatus || t.prepStatus === "Ready"
  ).length;

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
        <div className="flex items-center gap-2 text-[11px] text-[#6d7f76]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Target className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">Target Proteins</span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
            {selectedMap.size} selected
          </span>
          {selectedMap.size > 0 && (
            <span className="hidden rounded-md border border-[#d7e4dc] bg-[#f7faf8] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#52645d] sm:inline">
              {readyCount} ready
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSuggestWithAi}
          disabled={isSuggestingWithAi}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          title="Rank targets by plant, objective, and compounds"
        >
          <Sparkles className={`h-3 w-3 ${isSuggestingWithAi ? "animate-spin" : ""}`} />
          {isSuggestingWithAi ? "Ranking..." : "AI suggest"}
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
              <h2 className="text-sm font-semibold text-[#0f2c20]">
                {plantName}
                {plantScientificName ? (
                  <span className="ml-1.5 text-[11px] font-normal italic text-[#8aa094]">
                    {plantScientificName}
                  </span>
                ) : null}
              </h2>
              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                <span className="font-semibold text-[#52645d]">
                  {allLibraryProteins.length} PDB receptors
                </span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                Auto-prepared on select
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Browse / search" },
              { n: "2", label: "Select receptors" },
              { n: "3", label: "Dock next" },
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

      {/* Receptor library */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="space-y-2.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f0eb] pb-2.5">
          <h3 className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
              1
            </span>
            Receptor library
            <span className="font-medium normal-case tracking-normal text-[#8aa094]">
              · {filteredProteins.length} shown
            </span>
          </h3>
          {aiSuggestions && (
            <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-900">
              <Sparkles className="h-2.5 w-2.5" />
              AI-ranked
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
            <input
              type="text"
              placeholder="Name, PDB ID, gene..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[#d5e3da] bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-emerald-600 sm:max-w-[14rem]"
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProteins.map((protein) => {
              const cleanPdb = protein.pdbId.toUpperCase();
              const isSelected = selectedMap.has(cleanPdb);
              const selectedTarget = selectedMap.get(cleanPdb);
              const aiMatch = aiSuggestionMap.get(cleanPdb);
              const prep = selectedTarget?.prepStatus;
              const isPending = pendingPdbs.has(cleanPdb);

              return (
                <div
                  key={cleanPdb}
                  className={`group relative flex flex-col rounded-xl border p-2.5 transition-colors ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-50/50 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]"
                      : "border-[#d7e4dc]/90 bg-white hover:border-emerald-300 hover:bg-[#f7faf8]"
                  } ${isPending ? "opacity-80" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <label className="mt-0.5 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTarget(cleanPdb)}
                        disabled={isPending}
                        className="h-3.5 w-3.5 rounded border-[#d5e3da] text-emerald-700 focus:ring-emerald-600 disabled:opacity-50"
                        aria-label={`Select ${protein.targetName}`}
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectedPdb(cleanPdb)}
                          className="truncate text-left text-xs font-bold text-[#0f2c20] hover:text-emerald-800 hover:underline"
                        >
                          {protein.targetName}
                        </button>
                        <a
                          href={`https://www.rcsb.org/structure/${cleanPdb}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 rounded-md border border-[#d7e4dc] bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-900 hover:border-emerald-400"
                          title="Open RCSB PDB"
                        >
                          {cleanPdb}
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="rounded border border-[#e8f0eb] bg-[#f7faf8] px-1.5 py-0.5 text-[9px] font-semibold text-[#52645d]">
                          {shortCategory(protein.therapeuticCategory)}
                        </span>
                        {aiMatch?.isRecommended && (
                          <span className="inline-flex items-center gap-0.5 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-900">
                            <Sparkles className="h-2 w-2" />
                            AI
                          </span>
                        )}
                        {isSelected && (
                          <span
                            className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[9px] font-semibold ${
                              prep === "COMPLETED"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : prep === "PREPARING"
                                  ? "border-amber-200 bg-amber-50 text-amber-900"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
                            }`}
                          >
                            {prep === "PREPARING" ? (
                              <Activity className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-2.5 w-2.5" />
                            )}
                            {prep === "COMPLETED"
                              ? "Ready"
                              : prep === "PREPARING"
                                ? "Prep..."
                                : "Selected"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-[#e8f0eb]/80 pt-1.5">
                    <span className="truncate font-mono text-[10px] text-[#8aa094]">
                      {protein.geneOrProtein}
                      {protein.resolution ? ` · ${protein.resolution}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInspectedPdb(cleanPdb)}
                      className="text-[10px] font-semibold text-emerald-800 hover:underline"
                    >
                      Info
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-8 text-center">
            <Target className="mx-auto h-7 w-7 text-[#8aa094]" />
            <p className="mt-2 text-xs font-semibold text-[#0f2c20]">No matching receptors</p>
            <p className="mt-1 text-[11px] text-[#8aa094]">
              Clear filters or run AI suggest.
            </p>
          </div>
        )}
      </motion.section>

      {/* Details modal — keeps list clean */}
      <AnimatePresence>
        {inspectedProtein && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c20]/35 p-4 backdrop-blur-[2px]"
            onClick={() => setInspectedPdb(null)}
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
                    <Target className="h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="truncate">{inspectedProtein.targetName}</span>
                    <span className="rounded-md border border-[#d7e4dc] bg-[#f7faf8] px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
                      {inspectedProtein.pdbId.toUpperCase()}
                    </span>
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#8aa094]">
                    {inspectedProtein.therapeuticCategory}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedPdb(null)}
                  className="rounded-lg p-1 text-[#8aa094] hover:bg-[#f7faf8] hover:text-[#0f2c20]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Organism", value: inspectedProtein.organism },
                  { label: "Gene", value: inspectedProtein.geneOrProtein },
                  {
                    label: "Method",
                    value: `${inspectedProtein.method} (${inspectedProtein.resolution})`,
                  },
                  {
                    label: "Co-ligand",
                    value: inspectedProtein.coLigand || "None",
                  },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2"
                  >
                    <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#8aa094]">
                      {cell.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-[#0f2c20]">
                      {cell.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-2 rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-3 text-[11px] leading-relaxed text-[#52645d]">
                <p>{inspectedProtein.biologicalFunction}</p>
                {inspectedProtein.relevance && (
                  <p className="font-medium text-[#0f2c20]">{inspectedProtein.relevance}</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#e8f0eb] pt-3">
                <a
                  href={`https://www.rcsb.org/structure/${inspectedProtein.pdbId.toUpperCase()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline"
                >
                  RCSB PDB
                  <ExternalLink className="h-3 w-3" />
                </a>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectedPdb(null)}
                    className="rounded-xl border border-[#d7e4dc] bg-white px-3 py-1.5 text-xs font-semibold text-[#52645d] hover:bg-[#f7faf8]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={pendingPdbs.has(inspectedProtein.pdbId.toUpperCase())}
                    onClick={async () => {
                      await handleToggleTarget(inspectedProtein.pdbId);
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                      selectedMap.has(inspectedProtein.pdbId.toUpperCase())
                        ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                        : "bg-emerald-700 text-white hover:bg-emerald-800"
                    }`}
                  >
                    {selectedMap.has(inspectedProtein.pdbId.toUpperCase())
                      ? "Deselect"
                      : "Select target"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
