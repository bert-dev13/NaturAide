import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  seeAllHref,
  seeAllLabel = "See All",
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#52796f] mt-0.5 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-extrabold text-[#1e5c44] hover:text-emerald-700 shrink-0 pb-0.5 active:scale-95 transition-all"
        >
          <span>{seeAllLabel}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
