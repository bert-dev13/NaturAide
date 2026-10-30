"use client";

import React from "react";
import { 
  CheckCircle, 
  Database, 
  FileCheck2, 
  FlaskRound, 
  Globe2, 
  Award,
  Shield
} from "lucide-react";

export function TrustStrip() {
  const credentials = [
    {
      icon: Globe2,
      label: "Kew Gardens POWO",
      sub: "Botanical Nomenclature Standard",
    },
    {
      icon: Database,
      label: "ChEMBL & PubChem",
      sub: "Bioactivity & Target Integration",
    },
    {
      icon: FileCheck2,
      label: "WHO Monographs",
      sub: "Herbal Efficacy Baseline",
    },
    {
      icon: Shield,
      label: "COPE Protocol",
      sub: "Double-Blind Review Integrity",
    },
    {
      icon: FlaskRound,
      label: "ISO 17025 Ready",
      sub: "Standardized Lab Extraction Specs",
    },
  ];

  return (
    <section className="relative py-10 bg-white border-y border-[#dde6df]/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#78997f]">
            Indexed & Standardized Across Global Scientific Taxonomies
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6 items-center">
          {credentials.map((cred, idx) => {
            const Icon = cred.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#faf9f5] border border-[#dde6df]/70 hover:border-[#9cb5a1] hover:bg-[#edf2ee]/50 transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl bg-white text-[#164533] flex items-center justify-center shrink-0 shadow-xs group-hover:text-[#0d9488] transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0f2c20] truncate">
                    {cred.label}
                  </p>
                  <p className="text-[11px] text-[#475550] truncate">
                    {cred.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
