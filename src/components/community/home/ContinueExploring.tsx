"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookmarkCheck } from "lucide-react";
import RecordImage from "@/components/community/RecordImage";

interface SavedItemPreview {
  id: number | string;
  imageUrl?: string;
  image_path?: string;
  commonName?: string;
  name?: string;
}

interface ContinueExploringProps {
  totalSavedCount: number;
  savedPlants?: SavedItemPreview[];
  savedProducts?: SavedItemPreview[];
}

export default function ContinueExploring({
  totalSavedCount,
  savedPlants = [],
  savedProducts = [],
}: ContinueExploringProps) {
  // Hide section completely if no saved items exist
  if (!totalSavedCount || totalSavedCount <= 0) {
    return null;
  }

  // Combine up to 3 thumbnails
  const previewItems: { id: string | number; img: string; name: string }[] = [];

  for (const plant of savedPlants) {
    if (previewItems.length >= 3) break;
    if (plant.imageUrl) {
      previewItems.push({
        id: `plant-${plant.id}`,
        img: plant.imageUrl,
        name: plant.commonName || "Plant",
      });
    }
  }

  for (const prod of savedProducts) {
    if (previewItems.length >= 3) break;
    const src = prod.image_path || prod.imageUrl;
    if (src) {
      previewItems.push({
        id: `prod-${prod.id}`,
        img: src,
        name: prod.name || "Product",
      });
    }
  }

  return (
    <section className="w-full">
      <div className="p-4 sm:p-5 rounded-[22px] bg-white border border-[#dde6df] hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Info & Thumbnails */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
            <BookmarkCheck className="w-5 h-5 text-amber-700" />
          </div>

          <div className="min-w-0">
            <h3 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] tracking-tight">
              Continue Exploring
            </h3>
            <p className="text-xs text-[#52796f] font-medium">
              You have {totalSavedCount} saved {totalSavedCount === 1 ? "guide" : "guides"}
            </p>
          </div>

          {/* Tiny thumbnails stack */}
          {previewItems.length > 0 && (
            <div className="hidden sm:flex items-center -space-x-2 ml-2">
              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-[#eaf2ec] shadow-2xs shrink-0"
                  title={item.name}
                >
                  <RecordImage
                    kind="plant"
                    src={item.img}
                    alt={item.name}
                    sizes="32px"
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: CTA Button */}
        <Link
          href="/community/my-guide"
          className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4b36] active:scale-95 text-white text-xs font-black transition-all shadow-2xs shrink-0"
        >
          <span>View Saved</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
        </Link>
      </div>
    </section>
  );
}

