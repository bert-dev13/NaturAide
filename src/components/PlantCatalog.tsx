"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sprout, 
  ArrowRight, 
  Filter, 
  Activity, 
  Dna, 
  ShieldCheck, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { FEATURED_PLANTS, MedicinalPlant } from "@/data/plantData";
import { PlantModal } from "./PlantModal";

export function PlantCatalog() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedPlant, setSelectedPlant] = useState<MedicinalPlant | null>(null);

  const categories = [
    { id: "all", label: "All Curated Taxa" },
    { id: "adaptogen", label: "Adaptogens & Stress" },
    { id: "anti-inflammatory", label: "Anti-Inflammatory" },
    { id: "cognitive", label: "Cognitive & Nootropics" },
    { id: "metabolic", label: "Metabolic & Glycemic" },
  ];

  const filteredPlants =
    activeCategory === "all"
      ? FEATURED_PLANTS
      : FEATURED_PLANTS.filter((p) => p.category === activeCategory);

  return (
    <section id="plants" className="py-24 bg-white relative overflow-hidden border-t border-[#dde6df]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#edf2ee] border border-[#c4d4c7] px-3.5 py-1.5 rounded-full mb-4">
            <Sprout className="w-3.5 h-3.5 text-[#1e5c44]" />
            <span className="text-xs font-bold text-[#164533] uppercase tracking-wide">
              Peer-Reviewed Botanical Index
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            Featured Medicinal Botanical Monographs
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475550] leading-relaxed">
            Every taxa entry combines botanical voucher verification, chemical metabolite mapping, in-silico binding affinities, and clinical safety indexes.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                activeCategory === cat.id
                  ? "bg-[#0f2c20] text-white border-[#0f2c20] shadow-sm"
                  : "bg-[#faf9f5] text-[#2f3a35] border-[#dde6df] hover:border-[#9cb5a1] hover:bg-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Plant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map((plant) => (
            <div
              key={plant.id}
              className="bg-[#faf9f5] rounded-3xl p-6 border border-[#dde6df] hover:border-[#0d9488] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Top Card Bar */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-[#78997f] uppercase">
                    {plant.family}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold bg-[#edf2ee] text-[#1e5c44] border border-[#c4d4c7] px-2 py-0.5 rounded-full">
                      GRADE {plant.evidenceGrade}
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-teal-50 text-[#0f766e] border border-teal-200 px-2 py-0.5 rounded-full">
                      {plant.dockingScore}
                    </span>
                  </div>
                </div>

                {/* Plant Name */}
                <h3 className="text-xl font-heading font-extrabold text-[#0f2c20] italic group-hover:text-[#0d9488] transition-colors">
                  {plant.scientificName}
                </h3>
                <p className="text-xs font-medium text-[#475550] mb-4">
                  Common: {plant.commonName}
                </p>

                {/* Key Phytochemicals */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#78997f] block mb-1.5">
                    Primary Bioactives
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {plant.activeCompounds.slice(0, 2).map((comp, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[11px] font-medium bg-white text-[#164533] px-2 py-0.5 rounded-md border border-[#dde6df]"
                      >
                        {comp}
                      </span>
                    ))}
                    {plant.activeCompounds.length > 2 && (
                      <span className="text-[11px] text-[#6b7c76] px-1 py-0.5">
                        +{plant.activeCompounds.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Target & Traditional Use */}
                <div className="p-3 bg-white rounded-xl border border-[#dde6df]/80 mb-4 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#2f3a35]">
                    <span className="text-[#6b7c76]">Target Receptor:</span>
                    <span className="font-semibold truncate max-w-[170px]">{plant.primaryTargets[0]}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#2f3a35]">
                    <span className="text-[#6b7c76]">Clinical Trials:</span>
                    <span className="font-bold text-[#0f2c20]">{plant.clinicalTrialsCount} Studies</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedPlant(plant)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#0f2c20] bg-white group-hover:bg-[#0f2c20] group-hover:text-white border border-[#dde6df] group-hover:border-[#0f2c20] shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Inspect Full Monograph</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 text-center">
          <p className="text-xs text-[#6b7c76]">
            Showing 6 of 1,420+ curated plant monographs. All chemical spectra cross-referenced with PubChem & ChEMBL databases.
          </p>
        </div>

      </div>

      {/* Detail Modal */}
      <PlantModal plant={selectedPlant} onClose={() => setSelectedPlant(null)} />
    </section>
  );
}
