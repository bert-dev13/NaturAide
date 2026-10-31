import React from "react";
import SavedCardSkeleton from "@/components/community/saved/SavedCardSkeleton";

export default function MyGuideLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Hero Skeleton */}
        <div className="w-full h-52 rounded-[24px] bg-[#fcfbf7] border border-[#dcebe1] animate-pulse p-6 flex items-center justify-between">
          <div className="space-y-3 max-w-md w-full">
            <div className="h-5 w-36 bg-amber-100 rounded-full" />
            <div className="h-8 w-60 bg-emerald-200/50 rounded-xl" />
            <div className="h-4 w-full bg-emerald-100/40 rounded" />
            <div className="h-9 w-48 bg-white rounded-xl mt-2" />
          </div>
          <div className="hidden md:block w-36 h-36 rounded-full bg-amber-50" />
        </div>

        {/* 3 Per Row Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SavedCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

