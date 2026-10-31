import React from "react";

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f5] animate-pulse pb-28">
      {/* Top Bar Skeleton */}
      <div className="sticky top-0 z-40 bg-white/90 border-b border-[#dde6df] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="w-28 h-7 rounded-full bg-[#e2ebe4]" />
          <div className="w-36 h-5 rounded-md bg-[#e2ebe4]" />
          <div className="w-9 h-9 rounded-full bg-[#e2ebe4]" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        <div className="h-48 sm:h-56 rounded-3xl bg-white border border-[#dde6df] p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-32 h-32 rounded-2xl bg-[#edf3ef] shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="w-32 h-5 rounded-md bg-[#e2ebe4]" />
            <div className="w-48 h-7 rounded-xl bg-[#e2ebe4]" />
            <div className="w-full h-4 rounded-md bg-[#e2ebe4]" />
          </div>
        </div>

        <div className="h-44 rounded-3xl bg-white border border-[#dde6df]" />
        <div className="h-48 rounded-3xl bg-white border border-[#dde6df]" />
      </main>
    </div>
  );
}

