import React from "react";

export default function PlantDetailLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f5] animate-pulse pb-28">
      {/* Top Bar Skeleton */}
      <div className="sticky top-0 z-40 bg-white/90 border-b border-[#dde6df] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="w-24 h-7 rounded-full bg-[#e2ebe4]" />
          <div className="w-32 h-5 rounded-md bg-[#e2ebe4]" />
          <div className="w-9 h-9 rounded-full bg-[#e2ebe4]" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Hero Skeleton */}
        <div className="h-64 sm:h-80 rounded-3xl bg-[#edf3ef] border border-[#dcebe0] overflow-hidden" />

        {/* 4 Quick Info Skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white border border-[#dde6df]" />
          ))}
        </div>

        {/* Section Cards Skeletons */}
        <div className="h-44 rounded-3xl bg-white border border-[#dde6df]" />
        <div className="h-56 rounded-3xl bg-white border border-[#dde6df]" />
        <div className="h-40 rounded-3xl bg-[#fffdf5] border-2 border-[#fef08a]" />
      </main>
    </div>
  );
}

