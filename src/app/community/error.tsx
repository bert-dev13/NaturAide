"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Community module error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-12 text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#0f2c20] tracking-tight mb-2">
        We couldn't load the community page
      </h2>

      <p className="text-xs sm:text-sm text-[#52796f] max-w-sm mb-6 leading-relaxed">
        {error?.message && !error.message.includes("digest")
          ? error.message
          : "An unexpected error occurred while loading herbal information. Please try refreshing or check back in a moment."}
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
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-[#dde6df] hover:bg-[#edf2ee] text-[#0f2c20] text-sm font-bold shadow-2xs active:scale-95 transition-all"
        >
          <Home className="w-4 h-4 text-[#52796f]" />
          <span>Community Home</span>
        </Link>
      </div>
    </div>
  );
}
