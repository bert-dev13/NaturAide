"use client";

import React from "react";

export default function ProfileSkeleton() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      <div className="flex-1 px-4 sm:px-6 py-5 sm:py-6 space-y-5 max-w-4xl mx-auto w-full">
        {/* Compact Hero Skeleton */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#eaf1ec] border border-[#dcebe0] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3 max-w-md w-full">
            <div className="w-28 h-5 rounded-full bg-[#dde8e0]" />
            <div className="w-44 h-7 rounded-xl bg-[#dde8e0]" />
            <div className="w-64 h-3.5 rounded-md bg-[#dde8e0]" />
            <div className="h-12 rounded-xl bg-white/70 w-full" />
          </div>
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-[#dde8e0]/60 shrink-0 self-center" />
        </div>

        {/* Quick Access Skeleton */}
        <div className="space-y-3">
          <div className="w-36 h-4 rounded-md bg-[#e4ede7]" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-[#eaf1ec] border border-[#dcebe0]" />
            ))}
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="space-y-4">
          <div className="h-56 rounded-3xl bg-[#eaf1ec] border border-[#dcebe0]" />
          <div className="h-44 rounded-3xl bg-[#eaf1ec] border border-[#dcebe0]" />
          <div className="h-48 rounded-3xl bg-[#eaf1ec] border border-[#dcebe0]" />
        </div>
      </div>
    </div>
  );
}
