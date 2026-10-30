"use client";

import React, { useState } from "react";
import { Info, HelpCircle } from "lucide-react";

export interface StageHelpTooltipProps {
  content: React.ReactNode;
  title?: string;
  className?: string;
  variant?: "inline" | "button";
}

export default function StageHelpTooltip({
  content,
  title,
  className = "",
  variant = "inline",
}: StageHelpTooltipProps) {
  const [open, setOpen] = useState(false);

  if (variant === "button") {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
        >
          <Info className="w-3 h-3 text-[#16a34a]" />
          <span>{title || "Help"}</span>
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-full mt-1.5 z-50 w-72 p-3 bg-white rounded-xl border border-[#dde6df] shadow-lg text-xs text-[#33413b] leading-relaxed animate-fadeIn">
              {title && (
                <p className="font-bold text-[#0f2c20] mb-1 pb-1 border-b border-[#edf2ee]">
                  {title}
                </p>
              )}
              {content}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center group ${className}`}>
      <button
        type="button"
        className="text-slate-400 hover:text-[#16a34a] transition-colors p-0.5 rounded-full"
        aria-label="More information"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-64 p-2.5 bg-[#0f2c20] text-white rounded-xl shadow-xl text-[11px] leading-snug pointer-events-none">
        {title && <p className="font-bold text-emerald-300 mb-0.5">{title}</p>}
        <div>{content}</div>
      </div>
    </div>
  );
}
