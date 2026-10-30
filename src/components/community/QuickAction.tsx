"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface QuickActionProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  badge?: string;
}

export default function QuickAction({
  href,
  title,
  description,
  icon,
  iconBgColor = "bg-emerald-100 text-emerald-900",
  badge,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 p-4 rounded-3xl bg-white border border-[#dde6df] hover:border-emerald-500 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] group cursor-pointer"
    >
      <div
        className={`w-12 h-12 rounded-2xl ${iconBgColor} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="font-heading font-extrabold text-[#0f2c20] text-sm sm:text-base tracking-tight leading-snug">
            {title}
          </h3>
          {badge && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-[#52796f] line-clamp-2 mt-0.5 font-medium">
          {description}
        </p>
      </div>

      <div className="w-8 h-8 rounded-full bg-[#faf9f5] flex items-center justify-center text-[#78997f] group-hover:text-[#0f2c20] group-hover:bg-emerald-50 shrink-0 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
