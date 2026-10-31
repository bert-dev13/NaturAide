"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookmarkCheck, Loader2, Sparkles } from "lucide-react";
import { SavedGuide2DIcon } from "./SavedIcons2D";
import { CardArrow2DIcon } from "../plants/PlantsIcons2D";
import { SavedGuideItem } from "./types";
import SavedGuideModal from "./SavedGuideModal";

interface SavedGuideCardProps {
  guide: SavedGuideItem;
  onRemove: (id: string | number) => Promise<void>;
}

export default function SavedGuideCard({ guide, onRemove }: SavedGuideCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [removing, setRemoving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (removing) return;

    setRemoving(true);
    try {
      await onRemove(guide.id);
    } finally {
      setRemoving(false);
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  return (
    <>
      <motion.div
        whileHover={
          shouldReduceMotion
            ? {}
            : {
                y: -4,
                transition: { type: "spring", stiffness: 350, damping: 24 },
              }
        }
        className="group rounded-2xl bg-white border border-[#dde6df] hover:border-amber-400 shadow-[0_2px_10px_-2px_rgba(15,44,32,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(245,158,11,0.16)] transition-all duration-200 overflow-hidden flex flex-col justify-between"
      >
        {/* 1. Guide Header Banner */}
        <div
          onClick={handleOpenModal}
          className="relative h-32 sm:h-36 w-full bg-gradient-to-br from-[#fef9ee] via-[#fffdfa] to-[#f4fbf6] flex items-center justify-center p-4 border-b border-[#edf2ee] overflow-hidden cursor-pointer"
        >
          {/* Large 2D Guide Icon Watermark */}
          <div className="w-16 h-16 rounded-2xl bg-amber-100/80 border border-amber-300/50 flex items-center justify-center shadow-xs group-hover:scale-106 transition-transform">
            <SavedGuide2DIcon className="w-8 h-8" />
          </div>

          {/* Top-Left: Category Tag */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 text-[10px] font-black uppercase tracking-wider shadow-2xs border border-amber-300/40">
              {guide.category || "Preparation Guide"}
            </span>
          </div>

          {/* Top-Right: Warm Gold Active Bookmark Button */}
          <motion.button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            whileTap={shouldReduceMotion ? {} : { scale: 0.85 }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
            aria-label={`Remove ${guide.title} from saved guides`}
            title={`Remove ${guide.title} from saved guides`}
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-amber-950 ring-2 ring-white/90 shadow-xs cursor-pointer transition-all active:scale-90"
          >
            {removing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-950" />
            ) : (
              <BookmarkCheck className="w-4 h-4 fill-amber-950 text-amber-950" />
            )}
          </motion.button>
        </div>

        {/* 2. Content Body */}
        <div
          onClick={handleOpenModal}
          className="p-3 sm:p-3.5 space-y-2 flex-1 flex flex-col justify-between cursor-pointer"
        >
          <div className="space-y-1">
            <h3 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] line-clamp-1 group-hover:text-amber-900 transition-colors leading-tight">
              {guide.title}
            </h3>

            {guide.plantName && (
              <p className="text-[11px] text-[#52796f] truncate font-medium">
                Herbal Plant: {guide.plantName}
              </p>
            )}

            <p className="text-xs text-[#52796f] line-clamp-1 font-medium leading-relaxed">
              {guide.description || "Step-by-step traditional herbal preparation guide."}
            </p>
          </div>

          {/* 3. Footer Action Button */}
          <div className="pt-2 border-t border-[#edf2ee]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal();
              }}
              className="w-full flex items-center justify-between text-xs font-black text-[#0f2c20] group-hover:text-amber-900 transition-colors py-0.5 group/btn cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                View Recipe Steps
              </span>
              <div className="flex items-center gap-1 transition-transform group-hover/btn:translate-x-1 duration-200">
                <CardArrow2DIcon className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Interactive Recipe Steps Modal */}
      <SavedGuideModal
        guide={guide}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
