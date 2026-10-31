"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import RecordImage from "@/components/community/RecordImage";
import { HerbalPlantItem } from "@/components/community/HerbalGuideClient";
import {
  VerifiedSealBadge2DIcon,
  PrepTeapot2DIcon,
  CardArrow2DIcon,
  Respiratory2DIcon,
  Skin2DIcon,
  Digestion2DIcon,
  Urinary2DIcon,
  BloodSugar2DIcon,
  PainComfort2DIcon,
  JointUric2DIcon,
  AllPlants2DIcon,
} from "./PlantsIcons2D";

interface PlantsDirectoryCardProps {
  plant: HerbalPlantItem;
  initialSaved?: boolean;
}

// Map plant category to visual accent and 2D icon
function getCategoryVisuals(category: string, plantName: string) {
  const cat = (category || "").toLowerCase();
  const name = (plantName || "").toLowerCase();

  if (cat.includes("respiratory") || name.includes("lagundi")) {
    return {
      badgeBg: "bg-emerald-50 text-emerald-950 border-emerald-200/80",
      glowHover: "hover:shadow-[0_8px_24px_-4px_rgba(5,150,105,0.16)]",
      borderColor: "hover:border-emerald-400",
      icon: <Respiratory2DIcon className="w-3 h-3" />,
    };
  }

  if (cat.includes("kidney") || cat.includes("urinary") || name.includes("sambong")) {
    return {
      badgeBg: "bg-sky-50 text-sky-950 border-sky-200/80",
      glowHover: "hover:shadow-[0_8px_24px_-4px_rgba(2,132,199,0.16)]",
      borderColor: "hover:border-sky-400",
      icon: <Urinary2DIcon className="w-3 h-3" />,
    };
  }

  if (cat.includes("skin") || name.includes("akapulko")) {
    return {
      badgeBg: "bg-fuchsia-50 text-fuchsia-950 border-fuchsia-200/80",
      glowHover: "hover:shadow-[0_8px_24px_-4px_rgba(192,38,211,0.16)]",
      borderColor: "hover:border-fuchsia-400",
      icon: <Skin2DIcon className="w-3 h-3" />,
    };
  }

  if (cat.includes("digestive") || name.includes("tsaang") || name.includes("bayabas") || name.includes("luya")) {
    return {
      badgeBg: "bg-amber-50 text-amber-950 border-amber-200/80",
      glowHover: "hover:shadow-[0_8px_24px_-4px_rgba(217,119,6,0.16)]",
      borderColor: "hover:border-amber-400",
      icon: <Digestion2DIcon className="w-3 h-3" />,
    };
  }

  if (cat.includes("blood sugar") || name.includes("ampalaya")) {
    return {
      badgeBg: "bg-lime-50 text-lime-950 border-lime-200/80",
      glowHover: "hover:shadow-[0_8px_24px_-4px_rgba(101,163,13,0.16)]",
      borderColor: "hover:border-lime-400",
      icon: <BloodSugar2DIcon className="w-3 h-3" />,
    };
  }

  if (cat.includes("pain") || name.includes("yerba")) {
    return {
      badgeBg: "bg-purple-50 text-purple-950 border-purple-200/80",
      glowHover: "hover:shadow-[0_8px_24px_-4px_rgba(124,58,237,0.16)]",
      borderColor: "hover:border-purple-400",
      icon: <PainComfort2DIcon className="w-3 h-3" />,
    };
  }

  if (cat.includes("joint") || cat.includes("uric") || name.includes("ulasimang") || name.includes("pansit")) {
    return {
      badgeBg: "bg-teal-50 text-teal-950 border-teal-200/80",
      glowHover: "hover:shadow-[0_8px_24px_-4px_rgba(13,148,136,0.16)]",
      borderColor: "hover:border-teal-400",
      icon: <JointUric2DIcon className="w-3 h-3" />,
    };
  }

  return {
    badgeBg: "bg-emerald-50 text-emerald-950 border-emerald-200/80",
    glowHover: "hover:shadow-[0_8px_24px_-4px_rgba(16,185,129,0.16)]",
    borderColor: "hover:border-emerald-400",
    icon: <AllPlants2DIcon className="w-3 h-3" />,
  };
}

export default function PlantsDirectoryCard({
  plant,
  initialSaved = false,
}: PlantsDirectoryCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  const visuals = getCategoryVisuals(plant.category, plant.commonName);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;

    setSaving(true);
    try {
      const res = await fetch("/api/community/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "plant", id: plant.id }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSaved(data.saved);
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    } finally {
      setSaving(false);
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
      className={`group rounded-2xl bg-white border border-[#dde6df] ${visuals.borderColor} shadow-[0_2px_10px_-2px_rgba(15,44,32,0.05)] ${visuals.glowHover} transition-all duration-200 overflow-hidden flex flex-col justify-between`}
    >
      {/* 1. Compact Plant Photograph Area */}
      <div className="relative h-36 sm:h-40 w-full bg-[#edf2ee] overflow-hidden">
        <RecordImage
          kind="plant"
          src={plant.imageUrl}
          alt={plant.commonName}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover group-hover:scale-105 transition-transform duration-400 ease-out"
        />
        {/* Soft Botanical Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2c20]/90 via-[#0f2c20]/20 to-transparent pointer-events-none" />

        {/* Top-Left: Compact 2D Verified Seal Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            title="Recognized Philippine medicinal plant"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-2xs border border-emerald-400/30"
          >
            <VerifiedSealBadge2DIcon className="w-3 h-3" />
            <span>Verified</span>
          </span>
        </div>

        {/* Top-Right: Compact Interactive Bookmark Button */}
        <motion.button
          type="button"
          onClick={handleToggleBookmark}
          disabled={saving}
          whileTap={shouldReduceMotion ? {} : { scale: 0.88 }}
          whileHover={shouldReduceMotion ? {} : { scale: 1.06 }}
          aria-label={isSaved ? "Remove from Saved" : "Save Plant"}
          title={isSaved ? "Saved" : "Save Plant"}
          className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90 ${
            isSaved
              ? "bg-amber-400 text-amber-950 ring-2 ring-white/90"
              : "bg-white/90 backdrop-blur-md text-[#2b4c3f] hover:bg-white hover:text-[#0f2c20]"
          }`}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-800" />
          ) : isSaved ? (
            <BookmarkCheck className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
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

      {/* 2. Compact Body Content with Minimal Text */}
      <div className="p-3 sm:p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Metadata Row: Category Tag + Preparation Method Count */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border shadow-2xs ${visuals.badgeBg}`}
            >
              <span className="shrink-0">{visuals.icon}</span>
              <span>{plant.category || "Medicinal Herb"}</span>
            </span>

            {plant.prepCount > 0 && (
              <span
                title={`${plant.prepCount} documented methods`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-950 text-[10px] font-bold border border-orange-200/60"
              >
                <PrepTeapot2DIcon className="w-3 h-3" />
                <span>{plant.prepCount} prep</span>
              </span>
            )}
          </div>

          {/* Minimal 1-Line Traditional Use */}
          <p className="text-xs text-[#52796f] line-clamp-1 font-medium leading-relaxed">
            {plant.simpleUse || "Recognized Philippine traditional remedy."}
          </p>
        </div>

        {/* 3. Streamlined Footer Action Link */}
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
