"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Eye,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface ResearchStageFooterProps {
  projectId: number;
  stageNumber: number; // 1 to 6
  stageTitle?: string;
  // Left action: Back
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  // Center status: Saved / Unsaved / Stage status
  statusMessage?: React.ReactNode;
  lastSaved?: string | null;
  isSaving?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  // Right actions: Secondary & Save Draft
  onSave?: () => void;
  saveLabel?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
    disabled?: boolean;
  };
  customActions?: React.ReactNode;
  // Right action: Primary Continue
  primaryAction?: {
    label?: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    icon?: React.ElementType;
    hideArrow?: boolean;
    href?: string;
  };
  className?: string;
}

const DEFAULT_TITLES: Record<number, string> = {
  1: "Plant & Literature Research",
  2: "In-Silico Analysis",
  3: "Molecular Docking",
  4: "Formulation & Safety",
  5: "Research Integration",
  6: "Final Professional Review",
};

const DEFAULT_CONTINUE_LABELS: Record<number, string> = {
  1: "Continue to In-Silico Analysis",
  2: "Continue to Molecular Docking",
  3: "Continue to Formulation & Safety",
  4: "Continue to Research Integration",
  5: "Finalize & Continue to Professional Review",
  6: "Submit Final Dossier for Professional Review",
};

const DEFAULT_BACK_URLS: Record<number, (pid: number) => string> = {
  1: (pid) => `/researcher/projects/${pid}`,
  2: (pid) => `/researcher/projects/${pid}/plant-literature`,
  3: (pid) => `/researcher/projects/${pid}/in-silico`,
  4: (pid) => `/researcher/projects/${pid}/docking`,
  5: (pid) => `/researcher/projects/${pid}/formulation-safety`,
  6: (pid) => `/researcher/projects/${pid}/completion-integration`,
};

export function ResearchStageFooter({
  projectId,
  stageNumber,
  stageTitle,
  backHref,
  onBack,
  backLabel = "Back",
  statusMessage,
  lastSaved,
  isSaving = false,
  saveStatus,
  onSave,
  saveLabel = "Save Draft",
  secondaryAction,
  customActions,
  primaryAction,
  className = "",
}: ResearchStageFooterProps) {
  const title = stageTitle || DEFAULT_TITLES[stageNumber] || `Stage ${stageNumber}`;
  const effectiveBackHref = backHref || (DEFAULT_BACK_URLS[stageNumber] ? DEFAULT_BACK_URLS[stageNumber](projectId) : undefined);
  const primaryLabel = primaryAction?.label || DEFAULT_CONTINUE_LABELS[stageNumber] || "Continue";

  const currentSaveStatus = isSaving ? "saving" : saveStatus || (lastSaved ? "saved" : "idle");

  return (
    <footer
      className={`sticky bottom-3 z-30 w-full rounded-2xl border border-[#dde6df] bg-white/95 px-4 py-3 shadow-xl shadow-emerald-950/5 backdrop-blur-xl sm:px-5 sm:py-3.5 transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        {/* ========================================================
            LEFT: BACK BUTTON / LINK
            ======================================================== */}
        <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-[#0f2c20] shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-700 transition-transform group-hover:-translate-x-0.5" />
              <span>{backLabel}</span>
            </button>
          ) : effectiveBackHref ? (
            <Link
              href={effectiveBackHref}
              className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-[#0f2c20] shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-700 transition-transform group-hover:-translate-x-0.5" />
              <span>{backLabel}</span>
            </Link>
          ) : (
            <div className="w-4" />
          )}

          {/* Mobile Center Display */}
          <div className="sm:hidden font-mono text-[11px] font-black uppercase tracking-wider text-[#0f2c20]">
            Stage {stageNumber} of 6
          </div>
        </div>

        {/* ========================================================
            CENTER: STAGE X OF 6 · STAGE NAME + STATUS
            ======================================================== */}
        <div className="hidden sm:flex items-center gap-2.5 text-xs text-[#52645d] text-center min-w-0">
          <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#0f2c20] truncate">
            Stage {stageNumber} of 6 · {title}
          </span>

          {/* Status info */}
          {statusMessage ? (
            <>
              <span className="text-slate-300">|</span>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                {statusMessage}
              </div>
            </>
          ) : currentSaveStatus === "saving" ? (
            <>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-medium">
                <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                <span>Saving...</span>
              </span>
            </>
          ) : currentSaveStatus === "saved" && lastSaved ? (
            <>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Saved</span>
              </span>
            </>
          ) : null}
        </div>

        {/* ========================================================
            RIGHT: SECONDARY ACTIONS, SAVE DRAFT, CONTINUE
            ======================================================== */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {customActions}

          {/* Optional Secondary Action (e.g. Preview Dossier) */}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-xs font-bold text-emerald-950 shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {secondaryAction.icon ? (
                <secondaryAction.icon className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {/* Save Draft Button */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#dde6df] bg-white hover:bg-slate-50 text-xs font-bold text-[#0f2c20] shadow-2xs transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Save className="w-3.5 h-3.5 text-[#52645d]" />
              )}
              <span>{isSaving ? "Saving..." : saveLabel}</span>
            </button>
          )}

          {/* Primary Action Button (or Direct Link when finished) */}
          {primaryAction &&
            (primaryAction.href && !primaryAction.onClick ? (
              <Link
                href={primaryAction.href}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
                <span>{primaryLabel}</span>
                {!primaryAction.hideArrow && <ArrowRight className="w-4 h-4 text-emerald-200" />}
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shrink-0"
              >
                {primaryAction.loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{primaryAction.loadingLabel || "Processing..."}</span>
                  </>
                ) : (
                  <>
                    {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
                    <span>{primaryLabel}</span>
                    {!primaryAction.hideArrow && <ArrowRight className="w-4 h-4 text-emerald-200" />}
                  </>
                )}
              </button>
            ))}
        </div>
      </div>
    </footer>
  );
}

export default ResearchStageFooter;
