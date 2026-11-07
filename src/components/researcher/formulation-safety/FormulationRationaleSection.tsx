"use client";

import React from "react";
import {
  FileText,
  Droplets,
  ShieldAlert,
  BookOpen,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface FormulationRationaleSectionProps {
  scientificRationale: string;
  onChangeScientificRationale: (val: string) => void;
  compatibilityConsiderations: string;
  onChangeCompatibilityConsiderations: (val: string) => void;
  safetyAndLimitations: string;
  onChangeSafetyAndLimitations: (val: string) => void;
  literature: Array<{
    id: number | string;
    title: string;
    authors?: string;
    year?: number | string;
    journal?: string;
    pmid?: string;
    doi?: string;
  }>;
  isReadOnly?: boolean;
}

export default function FormulationRationaleSection({
  scientificRationale,
  onChangeScientificRationale,
  compatibilityConsiderations,
  onChangeCompatibilityConsiderations,
  safetyAndLimitations,
  onChangeSafetyAndLimitations,
  literature = [],
  isReadOnly = false,
}: FormulationRationaleSectionProps) {
  return (
    <div className="space-y-6">
      {/* 1. Scientific Rationale */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#dde6df] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>Scientific Rationale for Formulation Architecture</span>
          </label>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Mechanism & Delivery
          </span>
        </div>
        <p className="text-xs text-[#52645d]">
          Explain the pharmacognostical and biopharmaceutical rationale connecting Stage 1 extraction, Stage 2 phytochemicals, and Stage 3 docking targets to this delivery system.
        </p>
        <textarea
          rows={4}
          value={scientificRationale}
          onChange={(e) => onChangeScientificRationale(e.target.value)}
          disabled={isReadOnly}
          placeholder="e.g. Carbomer hydrogel polymer matrix was chosen to deliver hydrophilic rosmarinic acid fractions across the stratum corneum with optimal cutaneous residence time..."
          className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none leading-relaxed font-sans shadow-2xs disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* 2. Compatibility & Preclinical Limitations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Excipient Compatibility */}
        <div className="p-5 rounded-2xl bg-white border border-[#dde6df] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-teal-700" />
              <span>Excipient Compatibility & Stability</span>
            </label>
            <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Physicochemical
            </span>
          </div>
          <p className="text-xs text-[#52645d]">
            Document potential polyphenol precipitation, pH stability bounds, and polymer interaction precautions.
          </p>
          <textarea
            rows={3}
            value={compatibilityConsiderations}
            onChange={(e) => onChangeCompatibilityConsiderations(e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. Maintain formulation pH between 5.8 - 6.5 to prevent polyphenol auto-oxidation..."
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs text-[#0f2c20] focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none leading-relaxed font-sans shadow-2xs disabled:bg-slate-100"
          />
        </div>

        {/* Preclinical Safety Limitations */}
        <div className="p-5 rounded-2xl bg-white border border-[#dde6df] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Preclinical Limitations & Required Validation</span>
            </label>
            <span className="text-[10px] font-mono text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Bench Testing Required
            </span>
          </div>
          <p className="text-xs text-[#52645d]">
            Explicitly note required experimental determinations before considering this preliminary design verified.
          </p>
          <textarea
            rows={3}
            value={safetyAndLimitations}
            onChange={(e) => onChangeSafetyAndLimitations(e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. Preliminary proposal only. Laboratory compounding, accelerated stability testing (40°C/75% RH), and dermal irritation assays required..."
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs text-[#0f2c20] focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none leading-relaxed font-sans shadow-2xs disabled:bg-slate-100"
          />
        </div>
      </div>

      {/* 3. Stage 1 Literature References */}
      {literature.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Available Project Literature & Supporting Citations ({literature.length})</span>
            </h5>
            <span className="text-[10px] text-[#78997f]">
              Stage 1 Curated Evidence
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {literature.slice(0, 6).map((lit) => (
              <div
                key={lit.id}
                className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1 shadow-2xs hover:border-emerald-300 transition-colors"
              >
                <p className="font-bold text-[#0f2c20] line-clamp-1 leading-snug">
                  {lit.title}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#78997f]">
                  <span>{lit.journal || lit.authors || "Scientific Reference"} {lit.year ? `(${lit.year})` : ""}</span>
                  {lit.pmid && (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${lit.pmid}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-emerald-700 hover:text-emerald-900 font-mono font-bold"
                    >
                      <span>PMID:{lit.pmid}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

