"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export default function SavedDiscoveryBanner() {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-[#eaf5ee] via-[#f4faf6] to-[#fcfbf7] border border-[#d5e7dc] p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-800">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>Discover Something New</span>
          </div>
          <h3 className="font-heading font-black text-base sm:text-lg text-[#0f2c20]">
            Explore more Philippine medicinal plants
          </h3>
          <p className="text-xs text-[#52796f] max-w-md font-medium leading-relaxed">
            Expand your personal herbal library with evidence-based traditional health remedies and safe-use information.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Link
            href="/community/herbal-guide"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4b36] text-white text-xs font-black transition-all shadow-xs active:scale-95"
          >
            <span>Explore Plants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/community/ask"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-[#f6faf7] text-[#0f2c20] border border-[#dde6df] text-xs font-bold transition-all shadow-2xs active:scale-95"
          >
            <span>Ask NaturAide</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

