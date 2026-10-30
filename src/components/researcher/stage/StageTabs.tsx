"use client";

import React from "react";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
}

export interface StageTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function StageTabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: StageTabsProps) {
  return (
    <div className={`w-full overflow-x-auto scrollbar-none pb-0.5 ${className}`}>
      <div className="flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#dde6df] shadow-xs w-max min-w-full sm:min-w-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          const badgeStr = String(tab.badge ?? "");
          const isVerifiedOrComplete =
            badgeStr === "Verified" || badgeStr === "Complete";
          const isPendingOrDraft =
            badgeStr === "Pending" || badgeStr === "Draft";

          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "text-[#0f2c20] shadow-xs"
                  : "text-[#52645d] hover:text-[#0f2c20] hover:bg-[#f4f7f4]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeStageTab"
                  className="absolute inset-0 bg-emerald-50/90 rounded-xl shadow-xs border border-emerald-300"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-2">
                {Icon && (
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                )}
                <span className={isActive ? "font-extrabold text-[#0f2c20]" : "font-semibold"}>
                  {tab.label}
                </span>

                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-2xs ${
                      isVerifiedOrComplete
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : isPendingOrDraft
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : isActive
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
