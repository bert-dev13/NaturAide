"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Search,
  Loader2,
  FileText,
  AlertCircle,
  Sparkles,
  BookmarkCheck,
  BookmarkPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LiteratureItem } from "@/lib/literature-service";

interface SupportingLiteratureAccordionProps {
  projectId: number;
  stageKey: string;
  resultType: "DOCKING" | "IN_SILICO" | "SAFETY" | "LABORATORY" | "FOUNDATIONAL";
  resultId?: number;
  compound?: string;
  target?: string;
  pathway?: string;
  endpoint?: string;
  assay?: string;
  cellLine?: string;
  initialCount?: number;
  defaultExpanded?: boolean;
}

export default function SupportingLiteratureAccordion({
  projectId,
  stageKey,
  resultType,
  resultId,
  compound,
  target,
  pathway,
  endpoint,
  assay,
  cellLine,
  initialCount = 0,
  defaultExpanded = false,
}: SupportingLiteratureAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [items, setItems] = useState<LiteratureItem[]>([]);
  const [queryUsed, setQueryUsed] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({});

  const fetchSupportingLiterature = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/evidence/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageKey,
          resultType,
          resultId,
          compound,
          target,
          pathway,
          endpoint,
          assay,
          cellLine,
          autoAttach: false,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setQueryUsed(data.generatedQuery || "");
        setFromCache(data.fromCache || false);
        setEmptyMessage(data.emptyMessage || "");
        setHasQueried(true);
      }
    } catch (err) {
      console.error("Error loading supporting literature:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !hasQueried) {
      fetchSupportingLiterature();
    }
  };

  const toggleAbstract = (key: string) => {
    setExpandedAbstracts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAttachItem = async (item: LiteratureItem, index: number) => {
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          authors: item.authors,
          year: item.publicationYear,
          journalSource: item.journal,
          doiOrUrl: item.doi ? `https://doi.org/${item.doi}` : item.sourceUrl,
          relevanceToCurrentResearch: item.relevanceExplanation,
          evidenceClass: "LITERATURE",
          stageKey,
          targetCompound: compound || item.targetCompound,
          targetBiological: target || item.targetBiological,
          assayOrEndpoint: endpoint || assay || item.assayOrEndpoint,
        }),
      });
      if (res.ok) {
        setSavedItems((prev) => ({ ...prev, [item.title]: true }));
      }
    } catch (err) {
      console.error("Failed to attach literature:", err);
    }
  };

  return (
    <div className="w-full mt-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/30 overflow-hidden shadow-2xs">
      {/* Header Accordion Bar */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-indigo-50/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-xs text-[#0f2c20]">
                Supporting Scientific Literature
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white tracking-wider uppercase">
                LITERATURE
              </span>
              {hasQueried && fromCache && (
                <span className="hidden sm:inline px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600">
                  Cached NCBI
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#475550] truncate">
              {hasQueried
                ? items.length > 0
                  ? `${items.length} peer-reviewed publication${items.length > 1 ? "s" : ""} retrieved`
                  : "Zero publications matching criteria"
                : compound && target
                ? `Contextual PubMed query for ${compound} × ${target}`
                : "Contextual literature layer supporting this research finding"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-indigo-700">
            {expanded ? "Collapse" : hasQueried ? `View (${items.length})` : "Explore Literature"}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-indigo-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-indigo-700" />
          )}
        </div>
      </button>

      {/* Expanded Content Area */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-indigo-100 p-4 space-y-3.5 bg-white"
          >
            {/* Scientific Evidence Distinction Disclaimer */}
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Strict Evidence Classification: </span>
                Supporting papers remain classified as <span className="font-bold uppercase text-indigo-800">LITERATURE</span>.
                Literature validates biological plausibility and mechanism, but <span className="underline">never</span> automatically
                converts computational predictions into experimental evidence.
              </div>
            </div>

            {/* Contextual Query Used */}
            {queryUsed && (
              <div className="flex items-center justify-between text-[11px] text-[#78997f] bg-[#f6f8f6] p-2 rounded-xl border border-[#dde6df]">
                <div className="flex items-center gap-1.5 truncate">
                  <Search className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-mono text-[10px] text-[#0f2c20] truncate">
                    {queryUsed}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchSupportingLiterature}
                  disabled={loading}
                  className="text-[10px] font-bold text-indigo-700 hover:underline shrink-0 ml-2"
                >
                  {loading ? "Searching..." : "Re-query NCBI"}
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                <p className="text-xs text-[#475550] font-semibold">
                  Querying NCBI PubMed and verifying literature cache...
                </p>
              </div>
            )}

            {/* Empty State (Strict Anti-Fabrication Rule) */}
            {!loading && hasQueried && items.length === 0 && (
              <div className="p-6 text-center space-y-2 bg-[#fdfcf9] rounded-2xl border border-dashed border-[#dde6df]">
                <FileText className="w-8 h-8 text-[#78997f] mx-auto opacity-70" />
                <p className="text-xs font-bold text-[#0f2c20]">
                  No relevant verified literature found for this research context.
                </p>
                <p className="text-[11px] text-[#78997f] max-w-md mx-auto">
                  NatureAide adheres to strict anti-fabrication standards. Bibliographic citations are never
                  manufactured when PubMed/NCBI returns no exact verified peer-reviewed publications.
                </p>
              </div>
            )}

            {/* Results List */}
            {!loading && items.length > 0 && (
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const itemKey = item.pmid || item.doi || `lit-${idx}`;
                  const isAbstractOpen = !!expandedAbstracts[itemKey];
                  const isSaved = !!savedItems[item.title];

                  return (
                    <article
                      key={itemKey}
                      className="p-3.5 rounded-2xl bg-white border border-[#dde6df] hover:border-indigo-300 shadow-2xs space-y-2.5 transition-all"
                    >
                      {/* Top Bar: Title & LITERATURE Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wide">
                              LITERATURE
                            </span>
                            {item.isVerified && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Verified Source</span>
                              </span>
                            )}
                            {item.relevanceScore && (
                              <span className="text-[10px] font-bold text-indigo-700">
                                {Math.round(item.relevanceScore)}% Relevance
                              </span>
                            )}
                          </div>

                          <h4 className="font-heading font-extrabold text-xs text-[#0f2c20] leading-snug">
                            {item.title}
                          </h4>
                        </div>

                        {/* Direct Link to PubMed */}
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold shrink-0 transition-colors"
                            title="View on PubMed National Library of Medicine"
                          >
                            <span>PubMed</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Authors · Year · Journal */}
                      <div className="text-[11px] text-[#78997f]">
                        <span className="font-medium text-[#475550]">{item.authors}</span>
                        <span className="mx-1.5">•</span>
                        <span className="font-bold text-[#0f2c20]">{item.publicationYear}</span>
                        <span className="mx-1.5">•</span>
                        <span className="italic">{item.journal}</span>
                      </div>

                      {/* Relevance Narrative */}
                      <div className="p-2.5 rounded-xl bg-[#f6f8f6] border border-[#edf2ee] text-[11px] text-[#1e5c44] leading-relaxed">
                        <span className="font-bold text-[#0f2c20]">Relevance to Finding: </span>
                        {item.relevanceExplanation}
                      </div>

                      {/* Footer Actions: Abstract Toggle & Save to Dossier */}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <div className="flex items-center gap-3">
                          {item.abstract && (
                            <button
                              type="button"
                              onClick={() => toggleAbstract(itemKey)}
                              className="font-bold text-[#475550] hover:text-[#0f2c20] flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isAbstractOpen ? "Hide Abstract" : "Read Abstract"}</span>
                              {isAbstractOpen ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                          {item.pmid && (
                            <span className="text-[10px] text-[#78997f]">PMID: {item.pmid}</span>
                          )}
                          {item.doi && (
                            <span className="text-[10px] text-[#78997f] truncate max-w-[150px]">
                              DOI: {item.doi}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAttachItem(item, idx)}
                          disabled={isSaved}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            isSaved
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-[#f6f8f6] text-[#0f2c20] hover:bg-[#edf2ee] border border-[#dde6df]"
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <BookmarkCheck className="w-3 h-3 text-emerald-600" />
                              <span>Attached to Dossier</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3 h-3 text-[#16a34a]" />
                              <span>Attach as Evidence</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Abstract Drawer */}
                      {isAbstractOpen && item.abstract && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#475550] leading-relaxed">
                          <p className="font-bold text-[#0f2c20] mb-1">PubMed Abstract:</p>
                          <p>{item.abstract}</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
