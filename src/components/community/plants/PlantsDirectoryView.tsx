"use client";

import React, { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";
import { HerbalPlantItem } from "@/components/community/HerbalGuideClient";
import PlantsHero from "./PlantsHero";
import PlantsCategoryFilters, { PLANT_CATEGORIES } from "./PlantsCategoryFilters";
import PlantsFeaturedCard from "./PlantsFeaturedCard";
import PlantsDirectoryCard from "./PlantsDirectoryCard";
import PlantsSafetyBanner from "./PlantsSafetyBanner";
import PlantsEmptyState from "./PlantsEmptyState";

interface PlantsDirectoryViewProps {
  plants: HerbalPlantItem[];
  initialQuery?: string;
  initialCategory?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  showHero?: boolean;
}

export default function PlantsDirectoryView({
  plants,
  initialQuery = "",
  initialCategory = "all",
  searchQuery: controlledSearchQuery,
  onSearchChange,
  showHero = true,
}: PlantsDirectoryViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [internalQuery, setInternalQuery] = useState(initialQuery);
  const activeSearchQuery = controlledSearchQuery !== undefined ? controlledSearchQuery : internalQuery;
  const handleSearchChange = onSearchChange || setInternalQuery;
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortOrder, setSortOrder] = useState<"A-Z" | "Z-A">("A-Z");

  // Filter and sort plants
  const filteredPlants = useMemo(() => {
    let list = plants.filter((plant) => {
      // 1. Search Query
      if (activeSearchQuery.trim()) {
        const q = activeSearchQuery.toLowerCase().trim();
        const matches =
          plant.commonName.toLowerCase().includes(q) ||
          plant.scientificName.toLowerCase().includes(q) ||
          (plant.local_names && plant.local_names.toLowerCase().includes(q)) ||
          plant.category.toLowerCase().includes(q) ||
          plant.simpleUse.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== "all") {
        const catObj = PLANT_CATEGORIES.find((c) => c.id === selectedCategory);
        const matchStr = catObj?.match || selectedCategory;
        const text = `${plant.category} ${plant.simpleUse} ${plant.commonName}`.toLowerCase();
        if (!text.includes(matchStr.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // 3. Sort Order
    list = [...list].sort((a, b) => {
      return sortOrder === "A-Z"
        ? a.commonName.localeCompare(b.commonName)
        : b.commonName.localeCompare(a.commonName);
    });

    return list;
  }, [plants, activeSearchQuery, selectedCategory, sortOrder]);

  const featuredPlant = useMemo(() => {
    // Pick the first PITAHC plant, or Lagundi if available
    return (
      plants.find((p) => p.commonName.toLowerCase().includes("lagundi")) ||
      plants[0]
    );
  }, [plants]);

  const isFiltering = selectedCategory !== "all";
  const hasSearch = activeSearchQuery.trim().length > 0;

  const resetAllFilters = () => {
    setSelectedCategory("all");
    handleSearchChange("");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. PLANTS HERO SECTION (Only rendered if showHero is true) */}
      {showHero && (
        <PlantsHero
          searchQuery={activeSearchQuery}
          onSearchChange={handleSearchChange}
          plants={plants}
          onSelectSuggestion={(p) => handleSearchChange(p.commonName)}
        />
      )}

      {/* 2. EXPLORE BY USE CATEGORY FILTERS */}
      <PlantsCategoryFilters
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* 3. OPTIONAL FEATURED PLANT (When not actively searching/filtering) */}
      {!hasSearch && !isFiltering && featuredPlant && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PlantsFeaturedCard plant={featuredPlant} />
        </motion.div>
      )}

      {/* 4. MEDICINAL PLANT DIRECTORY HEADER */}
      <div className="flex items-center justify-between pt-1 border-t border-[#edf2ee]">
        <div>
          <h2 className="font-heading font-black text-base sm:text-lg text-[#0f2c20] tracking-tight">
            Medicinal Plant Directory
          </h2>
          <p className="text-xs text-[#52796f] font-medium">
            Browse trusted Philippine medicinal plant information.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Dynamic Plant Count */}
          <span className="text-xs font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300/50">
            {filteredPlants.length} {filteredPlants.length === 1 ? "Plant" : "Plants"}
          </span>

          {/* Quick Sort Control */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "A-Z" ? "Z-A" : "A-Z")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#dde6df] hover:border-emerald-300 text-xs font-extrabold text-[#52796f] hover:text-[#0f2c20] transition-all cursor-pointer shadow-2xs select-none active:scale-95"
            aria-label="Toggle Sort Order"
          >
            <ArrowUpDown className="w-3 h-3 text-emerald-700" />
            <span>{sortOrder === "A-Z" ? "A–Z" : "Z–A"}</span>
          </button>
        </div>
      </div>

      {/* 5. PLANTS GRID (EXACTLY 3 PER ROW ON DESKTOP, COMPACT GAPS) */}
      {filteredPlants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
          {filteredPlants.map((plant, index) => (
            <motion.div
              key={plant.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.3),
              }}
            >
              <PlantsDirectoryCard plant={plant} />
            </motion.div>
          ))}
        </div>
      ) : hasSearch ? (
        <PlantsEmptyState
          type="search"
          searchQuery={activeSearchQuery}
          onClearSearch={() => handleSearchChange("")}
          onResetFilters={resetAllFilters}
        />
      ) : (
        <PlantsEmptyState
          type="filter"
          onResetFilters={resetAllFilters}
        />
      )}

      {/* 6. COMPACT SAFETY REMINDER BANNER */}
      <div className="pt-2">
        <PlantsSafetyBanner />
      </div>
    </div>
  );
}

