"use client";

import React, { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpDown, Check } from "lucide-react";
import { HerbalProductItem } from "@/components/community/HerbalGuideClient";
import ProductDirectoryCard from "./ProductDirectoryCard";
import {
  AllProducts2DIcon,
  TeaInfusion2DIcon,
  Capsule2DIcon,
  SyrupLiquid2DIcon,
  TopicalBalm2DIcon,
} from "./ProductIcons2D";
import PlantsEmptyState from "../plants/PlantsEmptyState";
import PlantsSafetyBanner from "../plants/PlantsSafetyBanner";

const FORMULATION_FILTERS = [
  {
    id: "all",
    label: "All Formulations",
    match: "",
    icon: <AllProducts2DIcon className="w-4 h-4" />,
  },
  {
    id: "tea",
    label: "Teas & Infusions",
    match: "tea",
    icon: <TeaInfusion2DIcon className="w-4 h-4" />,
  },
  {
    id: "capsule",
    label: "Capsules & Tablets",
    match: "capsule",
    icon: <Capsule2DIcon className="w-4 h-4" />,
  },
  {
    id: "syrup",
    label: "Syrups & Liquids",
    match: "syrup",
    icon: <SyrupLiquid2DIcon className="w-4 h-4" />,
  },
  {
    id: "topical",
    label: "Balms & Topicals",
    match: "ointment",
    icon: <TopicalBalm2DIcon className="w-4 h-4" />,
  },
];

interface ProductsDirectoryViewProps {
  products: HerbalProductItem[];
  searchQuery?: string;
  onClearSearch?: () => void;
}

export default function ProductsDirectoryView({
  products,
  searchQuery = "",
  onClearSearch,
}: ProductsDirectoryViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedForm, setSelectedForm] = useState("all");
  const [sortOrder, setSortOrder] = useState<"A-Z" | "Z-A">("A-Z");

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = products.filter((prod) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          prod.name.toLowerCase().includes(q) ||
          (prod.brandName && prod.brandName.toLowerCase().includes(q)) ||
          (prod.manufacturer && prod.manufacturer.toLowerCase().includes(q)) ||
          (prod.mainPlantName && prod.mainPlantName.toLowerCase().includes(q)) ||
          (prod.dosageForm && prod.dosageForm.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Dosage Form Filter
      if (selectedForm !== "all") {
        const item = FORMULATION_FILTERS.find((f) => f.id === selectedForm);
        const matchStr = item?.match || selectedForm;
        const formText = `${prod.dosageForm || ""} ${prod.name}`.toLowerCase();
        if (!formText.includes(matchStr.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // 3. Sort Order
    list = [...list].sort((a, b) => {
      return sortOrder === "A-Z"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

    return list;
  }, [products, searchQuery, selectedForm, sortOrder]);

  const hasSearch = searchQuery.trim().length > 0;
  const isFiltering = selectedForm !== "all";

  const resetAllFilters = () => {
    setSelectedForm("all");
    if (onClearSearch) onClearSearch();
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. FORMULATION QUICK FILTERS ("Explore Formulations") */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] tracking-tight">
            Explore Formulations
          </h2>
          {isFiltering && (
            <button
              type="button"
              onClick={() => setSelectedForm("all")}
              className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>

        {/* Clean horizontal pill chips with 2D icons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:pb-1 md:flex-wrap scrollbar-none">
          {FORMULATION_FILTERS.map((cat) => {
            const isSelected = selectedForm === cat.id;

            return (
              <motion.button
                key={cat.id}
                type="button"
                onClick={() => setSelectedForm(cat.id)}
                whileHover={
                  shouldReduceMotion
                    ? {}
                    : {
                        y: -2,
                        scale: 1.02,
                        transition: { duration: 0.15 },
                      }
                }
                whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 select-none text-xs sm:text-[13px] ${
                  isSelected
                    ? "bg-teal-50 text-teal-950 border-teal-500 ring-2 ring-teal-500/20 font-black shadow-xs"
                    : "bg-white hover:bg-[#f6faf7] border-[#dde6df] hover:border-teal-300 text-[#475550] hover:text-[#0f2c20] font-medium shadow-2xs"
                }`}
              >
                <span className="shrink-0">{cat.icon}</span>
                <span>{cat.label}</span>
                {isSelected && (
                  <span className="w-3.5 h-3.5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 ml-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* 2. PRODUCTS DIRECTORY HEADER */}
      <div className="flex items-center justify-between pt-1 border-t border-[#edf2ee]">
        <div>
          <h2 className="font-heading font-black text-base sm:text-lg text-[#0f2c20] tracking-tight">
            Commercial Herbal Products
          </h2>
          <p className="text-xs text-[#52796f] font-medium">
            Verified Philippine registered herbal formulations, teas, and remedies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Dynamic Product Count Badge */}
          <span className="text-xs font-bold text-teal-900 bg-teal-100/80 px-2.5 py-1 rounded-full border border-teal-300/50">
            {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
          </span>

          {/* Quick Sort Control */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "A-Z" ? "Z-A" : "A-Z")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#dde6df] hover:border-teal-300 text-xs font-extrabold text-[#52796f] hover:text-[#0f2c20] transition-all cursor-pointer shadow-2xs select-none active:scale-95"
            aria-label="Toggle Sort Order"
          >
            <ArrowUpDown className="w-3 h-3 text-teal-700" />
            <span>{sortOrder === "A-Z" ? "A–Z" : "Z–A"}</span>
          </button>
        </div>
      </div>

      {/* 3. PRODUCTS GRID (STRICTLY 3 PER ROW ON DESKTOP) */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
          {filteredProducts.map((prod, index) => (
            <motion.div
              key={prod.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.3),
              }}
            >
              <ProductDirectoryCard product={prod} />
            </motion.div>
          ))}
        </div>
      ) : hasSearch ? (
        <PlantsEmptyState
          type="search"
          searchQuery={searchQuery}
          onClearSearch={onClearSearch || resetAllFilters}
          onResetFilters={resetAllFilters}
        />
      ) : (
        <PlantsEmptyState
          type="filter"
          onResetFilters={resetAllFilters}
        />
      )}

      {/* 4. COMPACT SAFETY & REGULATORY BANNER */}
      <div className="pt-2">
        <PlantsSafetyBanner />
      </div>
    </div>
  );
}

