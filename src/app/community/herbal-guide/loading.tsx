import React from "react";
import PlantCardSkeleton from "@/components/community/plants/PlantCardSkeleton";

export default function HerbalGuideLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* Hero Skeleton */}
        <div className="w-full h-52 rounded-[24px] bg-[#eaf5ee]/60 border border-[#d5e7dc] animate-pulse p-6 flex items-center justify-between">
          <div className="space-y-3 max-w-md w-full">
            <div className="h-5 w-40 bg-emerald-200/50 rounded-full" />
            <div className="h-8 w-64 bg-emerald-300/40 rounded-xl" />
            <div className="h-4 w-full bg-emerald-200/30 rounded" />
            <div className="h-10 w-full bg-white/70 rounded-xl mt-2" />
          </div>
          <div className="hidden md:block w-36 h-36 rounded-full bg-emerald-100/50" />
        </div>

        {/* Filter Tiles Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-white border border-[#dde6df] animate-pulse"
            />
          ))}
        </div>

        {/* Plants Grid Skeleton (3 per row, compact gaps) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PlantCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

