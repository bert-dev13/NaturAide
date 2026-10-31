"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { SavedPlant2DIcon } from "./SavedIcons2D";

interface SavedEmptyStateProps {
  type?: "all" | "filter" | "search";
  category?: string;
  searchQuery?: string;
  onClearSearch?: () => void;
  onResetFilter?: () => void;
}

export default function SavedEmptyState({
  type = "all",
  category = "plants",
  searchQuery = "",
  onClearSearch,
  onResetFilter,
}: SavedEmptyStateProps) {
  const shouldReduceMotion = useReducedMotion();

  // 1. Search Query Empty State
  if (type === "search" && searchQuery) {
    return (
      <div className="rounded-3xl bg-white border border-[#dde6df] p-8 sm:p-12 text-center space-y-4 shadow-2xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
          <SavedPlant2DIcon className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="font-heading font-black text-lg text-[#0f2c20]">
            No saved items match &ldquo;{searchQuery}&rdquo;
          </h3>
          <p className="text-xs sm:text-[13px] text-[#52796f] leading-relaxed">
            Check your spelling or try searching for another bookmarked plant, product, or guide.
          </p>
        </div>
        {onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4b36] text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span>Clear Search</span>
          </button>
        )}
      </div>
    );
  }

  // 2. Specific Category Empty State (e.g. No saved products yet)
  if (type === "filter") {
    let title = "No items in this category yet";
    let desc = "Items you bookmark will automatically appear in this section.";
    let ctaHref = "/community/herbal-guide";
    let ctaLabel = "Explore Directory";

    if (category === "plants") {
      title = "No saved medicinal plants yet";
      desc = "Bookmark plants from the directory so you can quickly review their traditional uses.";
      ctaHref = "/community/herbal-guide?tab=plants";
      ctaLabel = "Explore Plants";
    } else if (category === "products") {
      title = "No saved products yet";
      desc = "Bookmark verified commercial herbal teas, oils, and capsules to track them here.";
      ctaHref = "/community/herbal-guide?tab=products";
      ctaLabel = "Explore Products";
    } else if (category === "guides") {
      title = "No preparation recipes saved";
      desc = "Save step-by-step traditional decoctions and infusions for safe preparation.";
      ctaHref = "/community/preparation-guide";
      ctaLabel = "Browse Preparation Guide";
    } else if (category === "recent") {
      title = "No recently viewed items";
      desc = "Plants and remedies you explore in the herbal directory will appear here for quick access.";
      ctaHref = "/community/herbal-guide";
      ctaLabel = "Explore Directory";
    }

    return (
      <div className="rounded-3xl bg-white border border-[#dde6df] p-8 sm:p-12 text-center space-y-4 shadow-2xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center">
          <SavedPlant2DIcon className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="font-heading font-black text-lg text-[#0f2c20]">
            {title}
          </h3>
          <p className="text-xs sm:text-[13px] text-[#52796f] leading-relaxed">
            {desc}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4b36] text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          {onResetFilter && (
            <button
              type="button"
              onClick={onResetFilter}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0f2c20] text-xs font-bold transition-all cursor-pointer"
            >
              View All Saved
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Overall Empty State with Mascot (User has no saved items at all)
  return (
    <div className="rounded-[28px] bg-gradient-to-br from-[#fbf9f4] via-[#f7faf7] to-[#eff8f2] border border-[#dcebe1] p-6 sm:p-10 text-center space-y-5 shadow-sm max-w-2xl mx-auto">
      {/* Friendly Mascot Reading Guide */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative w-36 sm:w-44 aspect-[1431/1099] mx-auto"
      >
        <Image
          src="/images/mascot-saved.png"
          alt="NaturAide Herbal Library Mascot"
          width={1431}
          height={1099}
          priority
          className="object-contain w-full h-full select-none pointer-events-none"
        />
      </motion.div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-950 text-xs font-black border border-emerald-300/50 mb-1">
          <Sparkles className="w-3 h-3 text-emerald-700" />
          <span>Your Herbal Library is Waiting</span>
        </div>
        <h3 className="font-heading font-black text-xl sm:text-2xl text-[#0f2c20] tracking-tight">
          Save your favorite plants &amp; guides
        </h3>
        <p className="text-xs sm:text-[13px] text-[#475550] leading-relaxed">
          Bookmark Philippine medicinal plants, preparations, and herbal products so you can easily return to them anytime.
        </p>
      </div>

      {/* Primary & Secondary Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <Link
          href="/community/herbal-guide"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1a4b36] text-white text-xs sm:text-sm font-black shadow-xs transition-all active:scale-95"
        >
          <span>Explore Plants</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/community/ask"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#f6faf7] text-[#0f2c20] border border-[#dde6df] text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95"
        >
          <span>Ask NaturAide</span>
        </Link>
      </div>
    </div>
  );
}

