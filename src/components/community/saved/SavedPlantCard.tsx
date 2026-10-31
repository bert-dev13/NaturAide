"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookmarkCheck, Loader2 } from "lucide-react";
import RecordImage from "@/components/community/RecordImage";
import {
  VerifiedSealBadge2DIcon,
  CardArrow2DIcon,
  AllPlants2DIcon,
} from "../plants/PlantsIcons2D";
import { SavedPlantItem } from "./types";

interface SavedPlantCardProps {
  plant: SavedPlantItem;
  onRemove: (id: string | number) => Promise<void>;
}

export default function SavedPlantCard({ plant, onRemove }: SavedPlantCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (removing) return;

    setRemoving(true);
    try {
      await onRemove(plant.id);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <motion.div
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              y: -4,
              transition: { type: "spring", stiffness: 350, damping: 24 },
            }
      }
      className="group rounded-2xl bg-white border border-[#dde6df] hover:border-emerald-400 shadow-[0_2px_10px_-2px_rgba(15,44,32,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(5,150,105,0.16)] transition-all duration-200 overflow-hidden flex flex-col justify-between"
    >
      {/* 1. Plant Photograph Area */}
      <div className="relative h-36 sm:h-40 w-full bg-[#edf2ee] overflow-hidden">
        <RecordImage
          kind="plant"
          src={plant.imageUrl}
          alt={plant.commonName}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover group-hover:scale-105 transition-transform duration-400 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2c20]/90 via-[#0f2c20]/20 to-transparent pointer-events-none" />

        {/* Top-Left: 2D Verified Seal Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            title="Recognized Philippine medicinal plant"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-2xs border border-emerald-400/30"
          >
            <VerifiedSealBadge2DIcon className="w-3 h-3" />
            <span>Verified</span>
          </span>
        </div>

        {/* Top-Right: Warm Gold Active Bookmark Button with Unsave Feedback */}
        <motion.button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          whileTap={shouldReduceMotion ? {} : { scale: 0.85 }}
          whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
          aria-label={`Remove ${plant.commonName} from saved items`}
          title={`Remove ${plant.commonName} from saved items`}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-amber-950 ring-2 ring-white/90 shadow-xs cursor-pointer transition-all active:scale-90"
        >
          {removing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-950" />
          ) : (
            <BookmarkCheck className="w-4 h-4 fill-amber-950 text-amber-950" />
          )}
        </motion.button>

        {/* Bottom plant name & scientific watermark */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 text-white drop-shadow-sm space-y-0.5">
          <h3 className="font-heading font-black text-base sm:text-lg tracking-tight uppercase leading-none group-hover:text-emerald-200 transition-colors truncate">
            {plant.commonName}
          </h3>
          <p className="text-[11px] text-emerald-100/90 italic truncate font-medium">
            {plant.scientificName}
          </p>
        </div>
      </div>

      {/* 2. Compact Content Body */}
      <div className="p-3 sm:p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Category Chip */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border border-emerald-200/80 bg-emerald-50 text-emerald-950 shadow-2xs">
              <AllPlants2DIcon className="w-3 h-3" />
              <span>{plant.category || "Medicinal Herb"}</span>
            </span>
          </div>

          {/* Minimal 1-Line Traditional Use */}
          <p className="text-xs text-[#52796f] line-clamp-1 font-medium leading-relaxed">
            {plant.simpleUse || "Recognized Philippine traditional remedy."}
          </p>
        </div>

        {/* 3. Footer Action Link */}
        <div className="pt-2 border-t border-[#edf2ee]">
          <Link
            href={`/community/plants/${plant.slug || plant.id}`}
            className="flex items-center justify-between text-xs font-black text-[#0f2c20] group-hover:text-emerald-800 transition-colors py-0.5 group/btn"
          >
            <span>View Plant</span>
            <div className="flex items-center gap-1 transition-transform group-hover/btn:translate-x-1 duration-200">
              <CardArrow2DIcon className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
