"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import RecordImage from "@/components/community/RecordImage";
import {
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  Droplets,
  Sparkles,
  Info,
} from "lucide-react";

export interface PreparationSummary {
  id: string;
  title: string;
  preparation_type: string;
  plant_part_used: string;
  traditional_use_context: string;
  description: string;
  reference_count: number;
}

export interface PlantWithPreparations {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  imageUrl: string | null;
  category: string;
  simpleUse: string;
  preparations: PreparationSummary[];
}

interface PreparationCatalogClientProps {
  initialPlants: PlantWithPreparations[];
  isProfessionalGuidanceRequired: boolean;
}

const FILTER_OPTIONS = [
  { id: "ALL", label: "All" },
  { id: "DECOCTION", label: "Decoction" },
  { id: "INFUSION", label: "Infusion / Tea" },
  { id: "TOPICAL", label: "Topical" },
  { id: "WASH", label: "Wash" },
  { id: "OTHER", label: "Other" },
];

export function formatPrepTypeLabel(type: string): string {
  switch (type) {
    case "DECOCTION":
      return "Decoction";
    case "INFUSION":
      return "Infusion";
    case "HERBAL_TEA":
      return "Herbal Tea";
    case "WASH":
      return "Wash";
    case "POULTICE":
      return "Poultice";
    case "TOPICAL_APPLICATION":
      return "Topical";
    case "STEAM":
      return "Steam";
    case "OTHER_DOCUMENTED_METHOD":
      return "Documented Method";
    default:
      return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export default function PreparationCatalogClient({
  initialPlants,
  isProfessionalGuidanceRequired,
}: PreparationCatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const filteredPlants = useMemo(() => {
    return initialPlants.filter((plant) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName =
          plant.commonName.toLowerCase().includes(q) ||
          plant.scientificName.toLowerCase().includes(q) ||
          plant.simpleUse.toLowerCase().includes(q);
        const matchesPreps = plant.preparations.some(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.plant_part_used.toLowerCase().includes(q) ||
            p.traditional_use_context.toLowerCase().includes(q) ||
            p.preparation_type.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesPreps) return false;
      }

      // 2. Category Filter
      if (selectedFilter === "ALL") return true;

      if (selectedFilter === "DECOCTION") {
        return plant.preparations.some((p) => p.preparation_type === "DECOCTION");
      }
      if (selectedFilter === "INFUSION") {
        return plant.preparations.some(
          (p) => p.preparation_type === "INFUSION" || p.preparation_type === "HERBAL_TEA"
        );
      }
      if (selectedFilter === "TOPICAL") {
        return plant.preparations.some(
          (p) =>
            p.preparation_type === "TOPICAL_APPLICATION" ||
            p.preparation_type === "POULTICE"
        );
      }
      if (selectedFilter === "WASH") {
        return plant.preparations.some((p) => p.preparation_type === "WASH");
      }
      if (selectedFilter === "OTHER") {
        return plant.preparations.some(
          (p) =>
            ![
              "DECOCTION",
              "INFUSION",
              "HERBAL_TEA",
              "TOPICAL_APPLICATION",
              "POULTICE",
              "WASH",
            ].includes(p.preparation_type)
        );
      }

      return true;
    });
  }, [initialPlants, searchQuery, selectedFilter]);

  return (
    <div className="space-y-6">
      {/* PROFESSIONAL GUIDANCE RESTRICTION NOTICE (IF SCREENING OUTCOME IS ACTIVE) */}
      {isProfessionalGuidanceRequired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-extrabold text-amber-900">
              Health Screening Educational Notice
            </p>
            <p className="text-amber-800 leading-relaxed">
              These traditional herbal preparation guides are provided for general educational purposes only.
              Because your health screening profile indicates medical supervision is required, do NOT use these
              botanical preparations as self-treatment without direct guidance from your healthcare provider.
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-bold">
          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
          <span>Authoritative Botanical Knowledge</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
          Traditional Herbal Preparation
        </h1>
        <p className="text-sm sm:text-base text-[#475550] leading-relaxed max-w-2xl">
          Learn documented ways medicinal plants have traditionally been prepared, with clear steps, precautions, and verified sources.
        </p>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7c76] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plants..."
            className="w-full bg-white text-[#0f2c20] placeholder-[#6b7c76] text-sm pl-11 pr-4 py-3.5 rounded-2xl border border-[#dde6df] focus:outline-none focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all font-medium shadow-2xs"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_OPTIONS.map((f) => {
            const isActive = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0f2c20] text-white shadow-2xs"
                    : "bg-white text-[#475550] border border-[#dde6df] hover:border-[#b0c4b1] hover:text-[#0f2c20]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUMMARY STATS BAR */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#52796f] px-1">
        <span>
          Showing <strong>{filteredPlants.length}</strong> {filteredPlants.length === 1 ? "plant" : "plants"} with verified traditional guides
        </span>
      </div>

      {/* PLANTS PREPARATION CARDS GRID */}
      {filteredPlants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlants.map((plant) => {
            const hasMultiple = plant.preparations.length > 1;
            const primaryPrep = plant.preparations[0];
            const prepTypesList = Array.from(
              new Set(plant.preparations.map((p) => formatPrepTypeLabel(p.preparation_type)))
            ).join(" • ");

            // Unique parts used across methods
            const partsList = Array.from(
              new Set(plant.preparations.map((p) => p.plant_part_used))
            ).join(" / ");

            return (
              <div
                key={plant.id}
                className="bg-white rounded-3xl border border-[#dde6df] p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4">
                  {/* Plant Image */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-[#dde6df]/80 bg-[#f4f7f5]">
                    <RecordImage
                      kind="plant"
                      src={plant.imageUrl}
                      alt={plant.commonName}
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>

                  {/* Plant Identity & Preparation Header */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider">
                        Verified Guide
                      </span>
                      {hasMultiple && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                          {plant.preparations.length} Methods
                        </span>
                      )}
                    </div>

                    <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#0f2c20] truncate">
                      {plant.commonName}
                    </h2>
                    <p className="text-xs text-[#52796f] italic truncate">
                      {plant.scientificName}
                    </p>

                    <div className="pt-1 space-y-1 text-xs">
                      <div className="flex items-start gap-1 text-[#3d4a45]">
                        <span className="font-bold text-[#0f2c20] shrink-0">Preparation:</span>
                        <span className="text-[#154332] font-semibold truncate">{prepTypesList}</span>
                      </div>
                      <div className="flex items-start gap-1 text-[#3d4a45]">
                        <span className="font-bold text-[#0f2c20] shrink-0">Plant Part:</span>
                        <span className="text-[#52796f] truncate">{partsList}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Short Traditional Context Snippet */}
                {primaryPrep && (
                  <p className="text-xs text-[#475550] line-clamp-2 leading-relaxed bg-[#faf9f5] p-3 rounded-2xl border border-[#dde6df]/60">
                    <strong className="text-[#0f2c20]">Context: </strong>
                    {primaryPrep.traditional_use_context}
                  </p>
                )}

                {/* Action Button */}
                <Link
                  href={`/community/preparation/${plant.slug}`}
                  className="w-full py-3 px-4 rounded-2xl bg-[#0f2c20] hover:bg-[#1a4b36] active:scale-[0.99] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-2xs group"
                >
                  <span>{hasMultiple ? `View ${plant.preparations.length} Preparation Guides` : "View Preparation Guide"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-10 rounded-3xl bg-white border border-[#dde6df] text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
            No matching traditional preparation guides found
          </h3>
          <p className="text-xs sm:text-sm text-[#6b7c76] max-w-sm mx-auto">
            Try adjusting your search keywords or switching filters to view all documented preparations.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedFilter("ALL");
            }}
            className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold hover:bg-emerald-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* MANDATORY EDUCATIONAL SAFETY LANGUAGE DISCLAIMER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#f4f7f5] border border-[#dde6df] text-xs text-[#475550] leading-relaxed flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
        <p>
          <strong>Traditional Preparation Notice:</strong> Traditional preparation information is provided for educational purposes and is based on documented sources. Traditional use does not necessarily establish clinical effectiveness or suitability for every person. Consult a qualified healthcare professional when appropriate.
        </p>
      </div>
    </div>
  );
}
