"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import RecordImage from "@/components/community/RecordImage";

interface PlantItem {
  id: number | string;
  slug: string;
  commonName: string;
  scientificName?: string;
  category?: string;
  simpleUse?: string;
  badge?: string;
  imageUrl?: string;
  safetyNote?: string;
}

interface FeaturedPlantsSectionProps {
  plants: PlantItem[];
}

export default function FeaturedPlantsSection({ plants }: FeaturedPlantsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading font-black text-lg sm:text-xl text-[#0f2c20] tracking-tight">
            Featured Medicinal Plants
          </h2>
          <p className="text-xs sm:text-sm text-[#52796f] font-medium">
            Explore Philippine medicinal plants with documented traditional uses and scientific references.
          </p>
        </div>

        {/* View All Plants Desktop Link & Scroll Arrows */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/community/herbal-guide?tab=plants"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>View All Plants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full border border-[#dce7e0] bg-white hover:bg-emerald-50 text-[#0f2c20] flex items-center justify-center transition-colors shadow-2xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full border border-[#dce7e0] bg-white hover:bg-emerald-50 text-[#0f2c20] flex items-center justify-center transition-colors shadow-2xs active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Plants Carousel */}
      {plants.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 pt-1 -mx-3.5 px-3.5 sm:-mx-6 sm:px-6 snap-x snap-mandatory scrollbar-none"
        >
          {plants.map((plant) => (
            <div key={plant.id} className="snap-start shrink-0">
              <Link
                href={`/community/plants/${plant.slug || plant.id}`}
                className="group block w-[260px] sm:w-[280px] rounded-[20px] bg-white border border-[#dde6df] hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all overflow-hidden cursor-pointer select-none"
              >
                {/* 1. Large Plant Photograph with Zoom */}
                <div className="relative h-44 w-full bg-[#f0f4f1] overflow-hidden">
                  <RecordImage
                    kind="plant"
                    src={plant.imageUrl}
                    alt={plant.commonName}
                    sizes="(max-width: 640px) 260px, 280px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Subtle Verified Indicator Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900/90 backdrop-blur-md text-white text-[10px] font-extrabold shadow-2xs border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      <span>PITAHC Verified</span>
                    </span>
                  </div>

                  {/* Scientific Name watermark overlay */}
                  <div className="absolute bottom-2 left-3 right-3 z-10 text-white drop-shadow-sm">
                    <h3 className="font-heading font-black text-lg tracking-tight uppercase leading-none">
                      {plant.commonName}
                    </h3>
                    {plant.scientificName && (
                      <p className="text-[11px] text-emerald-100 italic truncate mt-0.5">
                        {plant.scientificName}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Card Content */}
                <div className="p-4 space-y-2.5">
                  {/* Category Pill */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] font-bold border border-emerald-200/60">
                      {plant.category || "Medicinal Herb"}
                    </span>
                  </div>

                  {/* Short Documented Use */}
                  <p className="text-xs text-[#475550] line-clamp-2 leading-relaxed min-h-[2rem] font-medium">
                    {plant.simpleUse || "Documented traditional remedy recognized by the Department of Health."}
                  </p>

                  {/* View Plant Link */}
                  <div className="pt-1 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-950">
                    <span>View Plant</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-700 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-[20px] bg-white border border-[#dde6df] text-center space-y-2 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Leaf className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
            No medicinal plants cataloged yet
          </h3>
          <p className="text-xs text-[#52796f] max-w-sm mx-auto">
            Botanical researchers have not yet published plant profiles to the database.
          </p>
        </div>
      )}

      {/* Mobile-only View All Link */}
      <div className="sm:hidden pt-1 text-center">
        <Link
          href="/community/herbal-guide?tab=plants"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 hover:text-emerald-950"
        >
          <span>View All Plants</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
