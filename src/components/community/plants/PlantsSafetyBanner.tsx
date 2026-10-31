"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function PlantsSafetyBanner() {
  return (
    <section className="w-full">
      <div className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-br from-[#ebf7f0] via-[#f4faf6] to-[#fbf8f0] border border-[#d2e4d7] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Icon and Text */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300/60 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>

          <div className="min-w-0">
            <h3 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] tracking-tight">
              Use herbal information safely
            </h3>
            <p className="text-xs text-[#52796f] font-medium leading-relaxed max-w-lg">
              Medicinal plants may have precautions, interactions, and situations where professional care is more appropriate.
            </p>
          </div>
        </div>

        {/* Right Action Button */}
        <Link
          href="/community/guidance"
          className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4b36] active:scale-95 text-white text-xs font-black transition-all shadow-2xs shrink-0"
        >
          <span>View Safety Guide</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
        </Link>
      </div>
    </section>
  );
}

