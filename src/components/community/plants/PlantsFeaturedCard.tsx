"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import RecordImage from "@/components/community/RecordImage";
import { HerbalPlantItem } from "@/components/community/HerbalGuideClient";

interface PlantsFeaturedCardProps {
  plant?: HerbalPlantItem;
}

export default function PlantsFeaturedCard({ plant }: PlantsFeaturedCardProps) {
  if (!plant) return null;

  return (
    <section className="w-full">
      <Link
        href={`/community/plants/${plant.slug || plant.id}`}
        className="group block rounded-2xl bg-gradient-to-br from-[#ebf7f0] via-[#f3faf5] to-[#fbf8f0] border border-[#d2e4d7] shadow-[0_4px_16px_-4px_rgba(15,44,32,0.05)] hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden p-3 sm:p-4"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          {/* Compact Image */}
          <div className="relative w-full sm:w-40 md:w-44 h-32 sm:h-28 rounded-xl overflow-hidden bg-[#edf2ee] shrink-0 border border-[#d2e4d7]">
            <RecordImage
              kind="plant"
              src={plant.imageUrl}
              alt={plant.commonName}
              sizes="(max-width: 640px) 100vw, 176px"
              className="object-cover group-hover:scale-105 transition-transform duration-400"
            />
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/90 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" />
                <span>Featured</span>
              </span>
            </div>
          </div>

          {/* Plant Content */}
          <div className="flex-1 space-y-1.5 text-center sm:text-left min-w-0">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 text-[10px] font-bold border border-emerald-300/40">
              <Sparkles className="w-2.5 h-2.5 text-emerald-700" />
              <span>Plant to Explore</span>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-heading font-black text-base sm:text-lg text-[#0f2c20] tracking-tight uppercase leading-snug group-hover:text-emerald-900 transition-colors truncate">
                {plant.commonName}
              </h3>
              <p className="text-[11px] text-[#52796f] italic truncate">
                {plant.scientificName}
              </p>
            </div>

            <p className="text-xs text-[#475550] line-clamp-1 font-medium">
              {plant.simpleUse || "Documented Philippine medicinal remedy recognized by the Department of Health."}
            </p>

            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 group-hover:text-emerald-950">
                <span>Explore Plant</span>
                <ArrowRight className="w-3 h-3 text-emerald-700 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
