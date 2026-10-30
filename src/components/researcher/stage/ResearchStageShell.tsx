"use client";

import React from "react";
import { motion } from "framer-motion";

interface ResearchStageShellProps {
  children: React.ReactNode;
  contextPanel?: React.ReactNode;
  className?: string;
}

export default function ResearchStageShell({
  children,
  contextPanel,
  className = "",
}: ResearchStageShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex-1 w-full min-w-0 max-w-none space-y-6 pb-24 ${className}`}
    >
      {contextPanel && (
        <div className="w-full min-w-0">
          {contextPanel}
        </div>
      )}
      <div className="w-full min-w-0 space-y-6">
        {children}
      </div>
    </motion.div>
  );
}
