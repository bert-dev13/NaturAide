// src/components/researcher/in-silico/ScientificReferencesSection.tsx
"use client";

import React, { useState } from "react";
import { FileText, ExternalLink, BookOpen, X } from "lucide-react";

export interface LiteratureReferenceItem {
  id: string | number;
  title: string;
  authors?: string | null;
  publicationYear?: number | string | null;
  journalOrPublisher?: string | null;
  doi?: string | null;
  pubmedId?: string | null;
  sourceUrl?: string | null;
  shortSummary?: string | null;
}

interface ReferencesProps {
  references: LiteratureReferenceItem[];
  plantName: string;
}

export default function ScientificReferencesSection({
  references = [],
  plantName,
}: ReferencesProps) {
  const [inspectedRef, setInspectedRef] = useState<LiteratureReferenceItem | null>(null);

  if (!references || references.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 text-xs mt-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-teal-600" />
          Supporting Scientific Literature &amp; Compendial References ({references.length})
        </h3>
        <span className="text-[11px] text-slate-500">Peer-Reviewed Phytochemical &amp; Target Citations</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {references.slice(0, 6).map((ref) => {
          const doiUrl = ref.doi
            ? ref.doi.startsWith("http")
              ? ref.doi
              : `https://doi.org/${ref.doi}`
            : ref.sourceUrl || (ref.pubmedId ? `https://pubmed.ncbi.nlm.nih.gov/${ref.pubmedId}` : null);

          return (
            <div
              key={ref.id}
              className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-teal-300 transition-colors space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-slate-900 line-clamp-2 leading-snug">
                  {ref.title}
                </h4>
                {doiUrl && (
                  <a
                    href={doiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:text-teal-900 p-0.5 shrink-0"
                    title="Open external publication DOI"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span className="truncate max-w-[200px]">
                  {ref.authors || "Botanical Research Group"} • {ref.publicationYear || "2024"}
                </span>

                {ref.shortSummary && (
                  <button
                    type="button"
                    onClick={() => setInspectedRef(ref)}
                    className="text-teal-700 hover:underline font-semibold"
                  >
                    Abstract &rarr;
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Abstract Modal */}
      {inspectedRef && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-3 text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 line-clamp-2">{inspectedRef.title}</h3>
              <button
                type="button"
                onClick={() => setInspectedRef(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              {inspectedRef.authors} ({inspectedRef.publicationYear}) • {inspectedRef.journalOrPublisher || "Scientific Publication"}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 leading-relaxed text-slate-700">
              <span className="font-bold text-slate-900 block text-xs">Summary &amp; Key Findings:</span>
              <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                {inspectedRef.shortSummary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {inspectedRef.doi && (
                <a
                  href={inspectedRef.doi.startsWith("http") ? inspectedRef.doi : `https://doi.org/${inspectedRef.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>DOI: {inspectedRef.doi}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setInspectedRef(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold"
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

