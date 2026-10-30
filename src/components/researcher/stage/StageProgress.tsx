"use client";

import React from "react";
import { motion } from "framer-motion";

interface StageProgressProps {
  currentStageNumber: number;
  totalStages?: number;
  className?: string;
  showText?: boolean;
}

export default function StageProgress({
  currentStageNumber,
  totalStages = 12,
  className = "",
  showText = true,
}: StageProgressProps) {
  const clamped = Math.max(1, Math.min(totalStages, currentStageNumber));
  const percent = Math.round((clamped / totalStages) * 100);

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showText && (
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#475550]">
          <span>
            Stage <strong className="text-[#0f2c20] font-extrabold">{clamped}</strong> of {totalStages}
          </span>
          <span className="font-mono text-[#16a34a]">{percent}%</span>
        </div>
      )}
      <div className="h-1.5 w-full bg-[#e8eee9] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
