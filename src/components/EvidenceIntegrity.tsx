"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  ExternalLink, 
  Database, 
  CheckCircle2, 
  FileSearch, 
  Binary, 
  FileText,
  BadgeAlert,
  Sparkles
} from "lucide-react";

export function EvidenceIntegrity() {
  const [selectedSource, setSelectedSource] = useState(0);

  const sources = [
    {
      name: "Kew Gardens Plants of the World Online (POWO)",
      authority: "Royal Botanic Gardens, Kew (UK)",
      role: "Taxonomic Nomenclature & Botanical Authority",
      veracity: "99.9%",
      coverage: "1.4M+ Taxa",
      desc: "Prevents taxonomic synonym confusion by anchoring every herbal entry to its accepted botanical Latin binomial and accepted authority.",
    },
    {
      name: "ChEMBL & PubChem Molecular Repositories",
      authority: "EMBL-EBI & NIH National Library of Medicine",
      role: "Bioactive Compound & Bioassay Cross-Referencing",
      veracity: "99.6%",
      coverage: "2.4M+ Assays",
      desc: "Binds secondary plant metabolites directly to curated biochemical assays, IC50 measurements, and human protein target records.",
    },
    {
      name: "PubMed & Cochrane Database of Systematic Reviews",
      authority: "US National Library of Medicine & Cochrane Collaboration",
      role: "Clinical Trial Meta-Analysis & Evidence Hierarchy",
      veracity: "99.4%",
      coverage: "36M+ Citations",
      desc: "Aggregates randomized controlled trials (RCTs), prospective human cohorts, and in-vivo pharmacology papers with algorithmic veracity scoring.",
    },
    {
      name: "WHO Monographs & EMA HMPC Registers",
      authority: "World Health Organization & European Medicines Agency",
      role: "Therapeutic Indications & Pharmacovigilance",
      veracity: "99.8%",
      coverage: "Official Standards",
      desc: "Benchmarks community indications against international herbal pharmacopoeias, standardized posology, and adverse reaction registries.",
    },
  ];

  return (
    <section id="evidence" className="py-24 bg-white relative overflow-hidden border-t border-[#dde6df]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#edf2ee] border border-[#c4d4c7] px-3.5 py-1.5 rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1e5c44]" />
            <span className="text-xs font-bold text-[#164533] uppercase tracking-wide">
              Data Integrity & Veracity
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            Evidence Sourced from the World’s Leading Scientific Repositories
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475550] leading-relaxed">
            NatureAide refuses hearsay. Every herbal compound, biological target, and traditional preparation is linked directly to primary scientific citations.
          </p>
        </div>

        {/* Source Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {sources.map((src, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedSource(idx)}
              className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer ${
                selectedSource === idx
                  ? "bg-[#faf9f5] border-[#0d9488] shadow-md ring-1 ring-[#0d9488]"
                  : "bg-white border-[#dde6df] hover:border-[#9cb5a1] hover:bg-[#f6f8f6]/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[11px] font-bold text-[#0d9488] uppercase tracking-wide">
                    {src.role}
                  </span>
                  <h3 className="text-lg font-heading font-bold text-[#0f2c20] mt-0.5">
                    {src.name}
                  </h3>
                  <p className="text-xs text-[#78997f] font-medium mt-0.5">
                    {src.authority}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-[#164533] bg-[#edf2ee] px-2 py-0.5 rounded">
                    {src.veracity} Match
                  </span>
                  <p className="text-[10px] text-[#6b7c76] mt-1">{src.coverage}</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#475550] leading-relaxed">
                {src.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Live Veracity Citation Checker Interactive Banner */}
        <div className="bg-gradient-to-r from-[#0f2c20] to-[#164533] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6] animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#ccfbf1]">
                Real-Time Citation Veracity Engine
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-bold">
              Transparent, Conflict-of-Interest Disclosed Citations
            </h3>
            <p className="text-xs sm:text-sm text-[#c4d4c7] max-w-2xl leading-relaxed">
              Every monograph displays immutable cryptographic citation hashes, commercial funding disclosures, and peer-reviewer identities.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <a
              href="#workbench"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0d9488] hover:bg-[#14b8a6] text-white text-xs sm:text-sm font-semibold shadow-md transition-colors"
            >
              <FileSearch className="w-4 h-4" />
              <span>Inspect Citation Schema</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
