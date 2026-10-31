"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X, Search } from "lucide-react";
import {
  BookmarkGold2DIcon,
  SavedPlant2DIcon,
  SavedProduct2DIcon,
  SavedGuide2DIcon,
} from "./SavedIcons2D";

export type SavedFilterCategory = "all" | "plants" | "products" | "guides";

interface SavedFiltersProps {
  selectedCategory: SavedFilterCategory;
  onSelectCategory: (cat: SavedFilterCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  plantCount: number;
  productCount: number;
  guideCount: number;
}

export default function SavedFilters({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  plantCount,
  productCount,
  guideCount,
}: SavedFiltersProps) {
  const shouldReduceMotion = useReducedMotion();

  const totalSaved = plantCount + productCount + guideCount;

  const categories: { id: SavedFilterCategory; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: "all",
      label: "All",
      count: totalSaved,
      icon: <BookmarkGold2DIcon className="w-4 h-4 shrink-0" />,
    },
    {
      id: "plants",
      label: "Plants",
      count: plantCount,
      icon: <SavedPlant2DIcon className="w-4 h-4 shrink-0" />,
    },
    {
      id: "products",
      label: "Products",
      count: productCount,
      icon: <SavedProduct2DIcon className="w-4 h-4 shrink-0" />,
    },
    {
      id: "guides",
      label: "Guides",
      count: guideCount,
      icon: <SavedGuide2DIcon className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <div className="space-y-3">
      {/* 1. COMPACT SEARCH INPUT */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-700">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search your saved plants, products, or guides..."
          className="w-full bg-white text-[#0f2c20] placeholder-[#6b7c76] text-xs sm:text-[13px] pl-10 pr-9 py-2.5 rounded-xl border border-[#dde6df] focus:outline-none focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            aria-label="Clear Search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. THE 4 FILTER TABS: [ All ] [ Plants ] [ Products ] [ Guides ] */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-900/10 shadow-2xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              whileHover={shouldReduceMotion ? {} : { y: -1 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              aria-pressed={isSelected}
              className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer select-none ${
                isSelected
                  ? "bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs"
                  : "bg-transparent text-[#475550] hover:text-[#0f2c20] hover:bg-black/5 border border-transparent"
              }`}
            >
              <span className="shrink-0">{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-emerald-200/80 text-emerald-950"
                    : "bg-black/5 text-[#475550]"
                }`}
              >
                {cat.count}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
