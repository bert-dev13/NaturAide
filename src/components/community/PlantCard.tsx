"use client";

import React from "react";
import Link from "next/link";
import RecordImage from "@/components/community/RecordImage";
import { ChevronRight, ShieldAlert, Sparkles, Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";

interface PlantCardProps {
  id: string | number;
  slug: string;
  commonName: string;
  scientificName?: string;
  category?: string;
  simpleUse?: string;
  badge?: string;
  imageUrl?: string;
  safetyNote?: string;
  isSaved?: boolean;
  onToggleSave?: (e: React.MouseEvent, plantId: string) => void;
  horizontal?: boolean;
}

export function getNormalizedPlantBadge(rawBadge?: string): { label: string; className: string } {
  if (!rawBadge) {
    return {
      label: "DOH/PITAHC Medicinal Plant",
      className: "bg-emerald-800 text-white border border-emerald-600/40 shadow-xs",
    };
  }
  const lower = rawBadge.toLowerCase().trim();
  if (lower.includes("pitahc") || lower.includes("doh")) {
    return {
      label: "DOH/PITAHC Medicinal Plant",
      className: "bg-emerald-800 text-white border border-emerald-600/40 shadow-xs",
    };
  }
  if (lower.includes("expert") || lower.includes("reviewed")) {
    return {
      label: "Expert Reviewed",
      className: "bg-emerald-700 text-white border border-emerald-600/40 shadow-xs",
    };
  }
  if (lower.includes("evidence") || lower.includes("backed") || lower.includes("scientific")) {
    return {
      label: "Scientific Evidence Available",
      className: "bg-teal-700 text-white border border-teal-600/40 shadow-xs",
    };
  }
  if (lower.includes("traditional") || lower.includes("favorite") || lower.includes("use") || lower.includes("folk")) {
    return {
      label: "Traditional Use",
      className: "bg-amber-700 text-white border border-amber-600/40 shadow-xs",
    };
  }
  return {
    label: "DOH/PITAHC Medicinal Plant",
    className: "bg-emerald-800 text-white border border-emerald-600/40 shadow-xs",
  };
}

export default function PlantCard({
  id,
  slug,
  commonName,
  scientificName,
  category,
  simpleUse,
  badge,
  imageUrl,
  safetyNote,
  isSaved,
  onToggleSave,
  horizontal = false,
}: PlantCardProps) {
  const verifiedBadge = getNormalizedPlantBadge(badge);

  if (horizontal) {
    // Horizontally scrollable carousel card for Home Screen
    return (
      <Link
        href={`/community/plants/${slug || id}`}
        className="block shrink-0 w-[270px] sm:w-[290px] bg-white rounded-3xl overflow-hidden border border-[#dde6df] hover:border-emerald-500 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]"
      >
        <div className="relative h-40 w-full bg-[#edf2ee] overflow-hidden">
          <RecordImage
            kind="plant"
            src={imageUrl}
            alt={commonName}
            sizes="(max-width: 640px) 270px, 290px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-1.5 z-10">
            {verifiedBadge && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${verifiedBadge.className}`}>
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>{verifiedBadge.label}</span>
              </span>
            )}
          </div>

          <div className="absolute bottom-2.5 left-3 right-3">
            <h3 className="font-heading font-extrabold text-white text-base sm:text-lg tracking-tight uppercase truncate drop-shadow-sm">
              {commonName}
            </h3>
            {scientificName && (
              <p className="text-white/90 italic text-xs truncate">
                {scientificName}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {simpleUse && (
            <p className="text-xs text-[#475550] line-clamp-2 leading-relaxed min-h-[2rem]">
              {simpleUse}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1e5c44] group-hover:text-emerald-700">
              <span>View Plant Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>

            {safetyNote && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                <ShieldAlert className="w-3 h-3 text-amber-600" />
                <span>Precautions</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Standard full-width mobile card for Finder and Guide lists
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-[#dde6df] hover:border-emerald-500 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
      <div>
        <Link href={`/community/plants/${slug || id}`} className="block">
          <div className="relative h-48 sm:h-56 w-full bg-[#edf2ee] overflow-hidden">
            <RecordImage
              kind="plant"
              src={imageUrl}
              alt={commonName}
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            {/* Badges */}
            <div className="absolute top-3.5 left-3.5 right-14 flex flex-wrap items-center gap-1.5 z-10">
              {verifiedBadge && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${verifiedBadge.className}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{verifiedBadge.label}</span>
                </span>
              )}
            </div>

            {/* Bookmark save toggle */}
            {onToggleSave && (
              <button
                onClick={(e) => onToggleSave(e, String(id))}
                aria-label={isSaved ? "Remove from saved" : "Save plant"}
                className={`absolute top-3.5 right-3.5 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-90 ${
                  isSaved
                    ? "bg-emerald-600 text-white"
                    : "bg-white/90 backdrop-blur-md text-[#0f2c20] hover:bg-white"
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </button>
            )}

            {/* Plant names overlay */}
            <div className="absolute bottom-3.5 left-4 right-4">
              <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl tracking-tight uppercase drop-shadow-md">
                {commonName}
              </h3>
              {scientificName && (
                <p className="text-white/95 italic text-sm font-medium drop-shadow-sm mt-0.5">
                  {scientificName}
                </p>
              )}
            </div>
          </div>
        </Link>

        <div className="p-4 sm:p-5 space-y-3.5">
          {simpleUse && (
            <p className="text-sm sm:text-base text-[#3d4a45] leading-relaxed line-clamp-3">
              {simpleUse}
            </p>
          )}

          {safetyNote && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs sm:text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span className="leading-snug">{safetyNote}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 pt-0">
        <Link
          href={`/community/plants/${slug || id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-sm sm:text-base font-extrabold transition-colors shadow-xs active:scale-[0.98]"
        >
          <span>View Plant Details</span>
          <ChevronRight className="w-4 h-4 text-emerald-300" />
        </Link>
      </div>
    </div>
  );
}