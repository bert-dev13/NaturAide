"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface StageSectionProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ElementType;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "tinted" | "cream" | "highlight";
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  noPadding?: boolean;
  className?: string;
}

export default function StageSection({
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  variant = "default",
  children,
  collapsible = false,
  defaultExpanded = true,
  noPadding = false,
  className = "",
}: StageSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  let bgClass = "bg-white border-[#dde6df]";
  if (variant === "tinted") {
    bgClass = "bg-emerald-50/30 border-emerald-200/80";
  } else if (variant === "cream") {
    bgClass = "bg-[#faf9f5] border-[#dde6df]";
  } else if (variant === "highlight") {
    bgClass = "bg-white border-emerald-300 ring-2 ring-emerald-100";
  }

  const hasHeader = Boolean(title || subtitle || Icon || badge || action || collapsible);

  return (
    <section
      className={`rounded-2xl border shadow-xs overflow-hidden transition-all ${bgClass} ${className}`}
    >
      {hasHeader && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#f0f4f1] ${
            collapsible ? "cursor-pointer select-none" : ""
          }`}
          onClick={collapsible ? () => setExpanded(!expanded) : undefined}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {title && (
                  <h2 className="text-sm sm:text-base font-bold text-[#0f2c20] truncate">
                    {title}
                  </h2>
                )}
                {badge && <div>{badge}</div>}
              </div>
              {subtitle && (
                <p className="text-xs text-[#52645d] leading-relaxed truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div
            className="flex items-center gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {action && <div>{action}</div>}
            {collapsible && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label={expanded ? "Collapse section" : "Expand section"}
              >
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {collapsible ? (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={noPadding ? "" : "p-4 sm:p-6"}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div className={noPadding ? "" : "p-4 sm:p-6"}>{children}</div>
      )}
    </section>
  );
}
