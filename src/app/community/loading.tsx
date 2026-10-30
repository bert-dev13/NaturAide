import React from "react";

export default function CommunityLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5] animate-pulse">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-[#dde6df] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-[#dde6df] rounded-md" />
              <div className="h-3 w-36 bg-[#eef3f0] rounded-md" />
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#dde6df]" />
        </div>
      </header>

      {/* Main Skeleton */}
      <main className="flex-1 px-4 sm:px-6 py-5 space-y-6">
        {/* Hero Card Skeleton */}
        <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-900/10 space-y-4">
          <div className="h-6 w-32 bg-emerald-200/50 rounded-full" />
          <div className="h-8 w-3/4 bg-emerald-200/40 rounded-xl" />
          <div className="h-4 w-1/2 bg-emerald-200/30 rounded-lg" />
          <div className="h-12 w-full bg-white/70 rounded-2xl mt-4" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-32 bg-[#dde6df] rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-white rounded-2xl border border-[#dde6df] p-4 flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-[#edf2ee] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-[#dde6df] rounded" />
                  <div className="h-3 w-40 bg-[#edf2ee] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explore Medicinal Plants Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-44 bg-[#dde6df] rounded-md" />
            <div className="h-4 w-16 bg-[#dde6df] rounded-md" />
          </div>
          <div className="flex gap-4 overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-64 sm:w-72 bg-white rounded-3xl border border-[#dde6df] overflow-hidden shrink-0 space-y-3 pb-4"
              >
                <div className="h-40 bg-[#edf2ee]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-32 bg-[#dde6df] rounded" />
                  <div className="h-3 w-48 bg-[#edf2ee] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
