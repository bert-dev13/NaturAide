"use client";

import React from "react";
import Image from "next/image";
import { SearchX, RotateCcw } from "lucide-react";

interface PlantsEmptyStateProps {
  type: "search" | "filter";
  searchQuery?: string;
  onClearSearch?: () => void;
  onResetFilters?: () => void;
}

export default function PlantsEmptyState({
  type,
  searchQuery,
  onClearSearch,
  onResetFilters,
}: PlantsEmptyStateProps) {
  if (type === "search") {
    return (
      <div className="p-7 sm:p-8 rounded-[24px] bg-white border border-[#dde6df] text-center space-y-4 shadow-2xs max-w-lg mx-auto">
        {/* Transparent Mascot Thumbnail */}
        <div className="relative w-20 h-20 mx-auto">
          <Image
            src="/images/mascot-plants.png"
            alt="Mascot Thinking"
            width={1367}
            height={1151}
            className="object-contain w-full h-full"
          />
        </div>

        <div className="space-y-1">
          <h3 className="font-heading font-black text-base sm:text-lg text-[#0f2c20]">
            Hmm, we couldn&apos;t find that plant.
          </h3>
          <p className="text-xs sm:text-[13px] text-[#52796f] leading-relaxed max-w-sm mx-auto">
            {searchQuery
              ? `No plant matching "${searchQuery}". Try another plant name, documented use, or health topic.`
              : "Try another plant name, documented use, or health topic."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Clear Search
            </button>
          )}
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#194733] text-white text-xs font-black transition-all cursor-pointer active:scale-95"
            >
              Browse All Plants
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-7 sm:p-8 rounded-[24px] bg-white border border-[#dde6df] text-center space-y-4 shadow-2xs max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200/60 shadow-2xs">
        <SearchX className="w-6 h-6 text-amber-700" />
      </div>

      <div className="space-y-1">
        <h3 className="font-heading font-black text-base sm:text-lg text-[#0f2c20]">
          No plants match these filters
        </h3>
        <p className="text-xs sm:text-[13px] text-[#52796f] leading-relaxed max-w-sm mx-auto">
          Try removing a filter or exploring another health category.
        </p>
      </div>

      {onResetFilters && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#194733] text-white text-xs font-black transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}

