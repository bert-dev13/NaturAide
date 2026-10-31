"use client";

import React from "react";
import {
  SavedPlant2DIcon,
  SavedProduct2DIcon,
  SavedGuide2DIcon,
  BookmarkGold2DIcon,
} from "./SavedIcons2D";

interface SavedLibrarySummaryProps {
  plantCount: number;
  productCount: number;
  guideCount: number;
}

export default function SavedLibrarySummary({
  plantCount,
  productCount,
  guideCount,
}: SavedLibrarySummaryProps) {
  const totalCount = plantCount + productCount + guideCount;
  if (totalCount === 0) return null;

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-900/10 p-2.5 sm:p-3 shadow-2xs flex items-center justify-between gap-3 overflow-x-auto scrollbar-none text-xs">
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Plant Count */}
        <div className="flex items-center gap-1.5 font-bold text-[#0f2c20]">
          <SavedPlant2DIcon className="w-4 h-4 shrink-0" />
          <span>{plantCount} {plantCount === 1 ? "Plant" : "Plants"}</span>
        </div>

        {/* Product Count (if any) */}
        {productCount > 0 && (
          <>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 font-bold text-[#0f2c20]">
              <SavedProduct2DIcon className="w-4 h-4 shrink-0" />
              <span>{productCount} {productCount === 1 ? "Product" : "Products"}</span>
            </div>
          </>
        )}

        {/* Guide Count (if any) */}
        {guideCount > 0 && (
          <>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 font-bold text-[#0f2c20]">
              <SavedGuide2DIcon className="w-4 h-4 shrink-0" />
              <span>{guideCount} {guideCount === 1 ? "Guide" : "Guides"}</span>
            </div>
          </>
        )}
      </div>

      {/* Total Saved Badge */}
      <div className="flex items-center gap-1.5 font-black text-amber-950 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 shrink-0">
        <BookmarkGold2DIcon className="w-3.5 h-3.5" />
        <span>{totalCount} Total</span>
      </div>
    </div>
  );
}

