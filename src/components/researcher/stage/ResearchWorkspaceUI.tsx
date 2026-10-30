"use client";

/**
 * Shared research-workspace UI primitives.
 * The class names intentionally mirror those used by Stage 2 (In-Silico Analysis)
 * so later stages render with the identical visual system.
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, ExternalLink, Loader2, Save, type LucideIcon } from "lucide-react";

export const STAGE_PAGE_CLASS = "w-full max-w-full px-2 sm:px-4 lg:px-6 py-6 space-y-8 font-sans";

/* ------------------------------ Header ------------------------------ */

export { ResearchStageHeader } from "./ResearchStageHeader";
export type { ResearchStageHeaderProps } from "./ResearchStageHeader";

export function HeaderMetric({ label, value, accent = false }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-emerald-300/80 font-medium">{label}:</span>
      <span className={`font-mono font-black text-base ${accent ? "text-emerald-400" : "text-white"}`}>{value}</span>
    </div>
  );
}

export function HeaderDivider() {
  return <div className="h-4 w-px bg-white/20 hidden sm:block" />;
}

/* ------------------------------ Section ------------------------------ */

export const WORKSPACE_PRIMARY_BTN =
  "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100";

export const WORKSPACE_SECONDARY_BTN =
  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs transition-all disabled:opacity-50";

export const WORKSPACE_INPUT =
  "w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs outline-none focus:border-emerald-500";

export const WORKSPACE_TEXTAREA =
  "w-full px-4 py-3 rounded-2xl bg-white border border-[#dde6df] focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-xs sm:text-sm text-[#0c2419] leading-relaxed resize-y placeholder:text-slate-400 font-normal outline-none transition-all shadow-inner";

interface SectionProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  innerRef?: React.Ref<HTMLElement>;
  delay?: number;
  compact?: boolean;
  id?: string;
}

export function ResearchSection({ icon: Icon, title, subtitle, badge, action, children, innerRef, delay = 0.05, compact = false, id }: SectionProps) {
  return (
    <motion.section
      id={id}
      ref={innerRef as any}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="w-full rounded-3xl bg-white border border-[#dde6df] shadow-md hover:border-emerald-400/80 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden"
    >
      <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-transparent border-b border-[#edf2ee] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#0f2c20]">{title}</h2>
              {badge && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 font-mono text-[10px] font-black uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-[#52645d] mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={compact ? "space-y-3 px-4 py-3 sm:px-5 sm:py-4" : "space-y-6 p-6"}>{children}</div>
    </motion.section>
  );
}

export function SubHeading({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-[#0c2419] uppercase tracking-wider font-mono text-[11px]">{children}</h3>
      {hint && <span className="font-mono text-[10px] text-slate-500">{hint}</span>}
    </div>
  );
}

/* ------------------------------ Rows ------------------------------ */

export function ScientificRow({
  icon: Icon,
  title,
  meta,
  badge,
  badgeTone = "emerald",
  actions,
  children,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  badgeTone?: "emerald" | "slate" | "amber" | "rose";
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const tone =
    badgeTone === "emerald"
      ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
      : badgeTone === "amber"
        ? "bg-amber-100 text-amber-950 border border-amber-300"
        : badgeTone === "rose"
          ? "bg-rose-100 text-rose-950 border border-rose-300"
          : "bg-slate-100 text-slate-800 border border-slate-300";
  const details = React.Children.toArray(children).filter(Boolean);
  return (
    <div className="rounded-2xl border border-[#e2eae4] bg-white hover:bg-slate-50/70 hover:border-emerald-300 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-[#0f2c20] truncate">{title}</div>
            {meta && <div className="font-mono text-[11px] text-[#697d72]">{meta}</div>}
          </div>
          {badge && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${tone}`}>
              {badge}
            </span>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {details.length > 0 && <div className="px-4 pb-4 border-t border-[#edf2ee] pt-3 bg-slate-50/50 rounded-b-2xl">{details}</div>}
    </div>
  );
}

export function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
    >
      {children}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function EmptyResearchState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-8 text-center border-2 border-dashed border-emerald-200/80 rounded-2xl bg-emerald-50/30 space-y-3">
      <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-700">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#0c2419]">{title}</h3>
      {description && <p className="text-xs text-[#52645d] max-w-md mx-auto">{description}</p>}
      {action}
    </div>
  );
}

/* ------------------------------ Bottom actions ------------------------------ */

export function StageBottomActions({
  stageNumber,
  error,
  saving,
  completing,
  onSave,
  onComplete,
  completingLabel,
  completeDisabled = false,
}: {
  stageNumber: number;
  error?: string | null;
  saving: boolean;
  completing: boolean;
  onSave: () => void;
  onComplete: () => void;
  completingLabel?: string;
  completeDisabled?: boolean;
}) {
  return (
    <div className="sticky bottom-4 z-30 w-full rounded-2xl bg-[#082218]/95 backdrop-blur-md p-4 text-white border border-emerald-800/60 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[11px] font-bold">
          Stage {stageNumber} of 6
        </span>
        {error && (
          <span className="text-rose-300 text-xs font-semibold animate-pulse">{error}</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto sm:justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || completing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          onClick={onComplete}
          disabled={completing || completeDisabled}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#051a11] font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {completing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#051a11]" />
              <span>{completingLabel || "Advancing..."}</span>
            </>
          ) : (
            <>
              <span>Complete &amp; Continue</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export { ResearchStageFooter } from "./ResearchStageFooter";
