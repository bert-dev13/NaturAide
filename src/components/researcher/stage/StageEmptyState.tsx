"use client";

import React from "react";
import { type LucideIcon, Plus } from "lucide-react";

export interface StageEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export default function StageEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: StageEmptyStateProps) {
  const ActionIcon = action?.icon || Plus;

  return (
    <div
      className={`p-6 sm:p-8 rounded-2xl border border-dashed border-[#cddad1] bg-[#faf9f5]/70 text-center flex flex-col items-center justify-center space-y-2.5 transition-all ${className}`}
    >
      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
        <Icon className="w-5 h-5" />
      </div>

      <div className="space-y-0.5 max-w-sm">
        <h3 className="text-xs sm:text-sm font-bold text-[#0f2c20]">{title}</h3>
        {description && (
          <p className="text-[11px] text-[#52645d] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
        >
          <ActionIcon className="w-3.5 h-3.5 text-emerald-300" />
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}
