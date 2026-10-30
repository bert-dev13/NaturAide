"use client";

import React from "react";

interface ConcernChipProps {
  label: string;
  selected?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

export default function ConcernChip({
  label,
  selected = false,
  onClick,
  icon,
}: ConcernChipProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 select-none active:scale-95 shadow-2xs ${
        selected
          ? "bg-[#0f2c20] text-white shadow-xs ring-2 ring-emerald-500/30"
          : "bg-white text-[#3d4a45] border border-[#dde6df] hover:border-emerald-600 hover:text-[#0f2c20]"
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
