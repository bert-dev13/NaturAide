"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";
import { ShieldAlert2DIcon } from "@/components/community/CommunityIcons2D";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep technical error details safely logged in console, never in user-facing UI
    console.error("Community module error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-12 text-center bg-[#faf9f5]">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs mb-4">
        <ShieldAlert2DIcon size={28} />
      </div>

      <h1 className="text-xl sm:text-2xl font-heading font-black text-[#0f2c20] tracking-tight mb-2">
        Something didn&apos;t load
      </h1>

      <p className="text-xs sm:text-sm text-[#52796f] max-w-sm mb-6 leading-relaxed font-medium">
        Please try again. If the issue continues, return to Community Home.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-sm font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>

        <Link
          href="/community"
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-[#dde6df] hover:bg-[#f0f4f1] text-[#0f2c20] text-sm font-bold shadow-2xs active:scale-95 transition-all"
        >
          <Home className="w-4 h-4 text-[#52796f]" />
          <span>Community Home</span>
        </Link>
      </div>
    </div>
  );
}
