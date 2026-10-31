"use client";

import React from "react";

export default function PlantCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-[#dde6df] shadow-2xs overflow-hidden flex flex-col justify-between animate-pulse">
      {/* Compact Image Skeleton */}
      <div className="relative h-36 sm:h-40 w-full bg-[#eef3f0] flex items-center justify-center">
        {/* Tiny NaturAide Leaf Loading Indicator */}
        <div className="w-7 h-7 rounded-full bg-emerald-100/80 flex items-center justify-center text-emerald-600 animate-bounce">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C8 5 3 8 0 8C5 8 8 13 8 16C8 11 13 8 16 8C11 8 8 3 8 0Z" />
          </svg>
        </div>

        {/* Badge Skeleton */}
        <div className="absolute top-2.5 left-2.5 w-14 h-4 bg-emerald-200/50 rounded-full" />
      </div>

      {/* Content Skeleton */}
      <div className="p-3 sm:p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-20 bg-emerald-100/70 rounded-md" />
          <div className="h-4 w-3/4 bg-[#eef3f0] rounded" />
        </div>

        {/* Footer Skeleton */}
        <div className="pt-2 border-t border-[#edf2ee] flex items-center justify-between">
          <div className="h-3 w-16 bg-[#dde6df] rounded" />
          <div className="h-3 w-3 bg-[#dde6df] rounded-full" />
        </div>
      </div>
    </div>
  );
}
