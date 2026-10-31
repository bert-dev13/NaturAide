"use client";

import React from "react";
import Link from "next/link";
import {
  Bookmark2DIcon,
  BotChat2DIcon,
  PlantBook2DIcon,
} from "./ProfileIcons2D";
import { ChevronRight } from "lucide-react";

interface ActivityTilesProps {
  savedCount?: number | null;
}

export default function ProfileActivityTiles({ savedCount }: ActivityTilesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#719184]">
          Quick Access & Activity
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Saved Library */}
        <Link
          href="/community/my-guide"
          className="group relative p-4 rounded-2xl bg-white border border-[#dde6df] hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-800 shadow-2xs group-hover:scale-110 transition-transform">
                <Bookmark2DIcon size={20} />
              </div>
              {savedCount !== null && savedCount !== undefined ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200">
                  {savedCount} {savedCount === 1 ? "item" : "items"}
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-[#78997f] group-hover:translate-x-1 transition-transform" />
              )}
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-sm text-[#0f2c20] group-hover:text-emerald-800 transition-colors">
                My Saved Guides
              </h4>
              <p className="text-xs text-[#52796f] line-clamp-1 mt-0.5">
                Saved plants & remedies
              </p>
            </div>
          </div>
        </Link>

        {/* Ask NaturAide */}
        <Link
          href="/community/ask"
          className="group relative p-4 rounded-2xl bg-white border border-[#dde6df] hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-700 shadow-2xs group-hover:scale-110 transition-transform">
                <BotChat2DIcon size={20} />
              </div>
              <ChevronRight className="w-4 h-4 text-[#78997f] group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-sm text-[#0f2c20] group-hover:text-purple-900 transition-colors">
                Ask NaturAide
              </h4>
              <p className="text-xs text-[#52796f] line-clamp-1 mt-0.5">
                AI herbal assistant
              </p>
            </div>
          </div>
        </Link>

        {/* Plant Directory */}
        <Link
          href="/community/herbal-guide"
          className="group relative p-4 rounded-2xl bg-white border border-[#dde6df] hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800 shadow-2xs group-hover:scale-110 transition-transform">
                <PlantBook2DIcon size={20} />
              </div>
              <ChevronRight className="w-4 h-4 text-[#78997f] group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-sm text-[#0f2c20] group-hover:text-emerald-800 transition-colors">
                Herbal Directory
              </h4>
              <p className="text-xs text-[#52796f] line-clamp-1 mt-0.5">
                Philippine plants & science
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

