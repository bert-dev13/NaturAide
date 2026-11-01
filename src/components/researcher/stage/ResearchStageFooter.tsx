"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  Loader2,
  Eye,
  Clock,
} from "lucide-react";

export interface ResearchStageFooterProps {
  projectId: number;
  stageNumber: number; // 1 to 6
  stageTitle?: string;

  // Left action: Back (Pure navigation only)
  previousStageRoute?: string;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;

  // Center status: Saved / Unsaved / Stage status
  statusMessage?: React.ReactNode;
  lastSaved?: string | null;
  isSaving?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";

  // Revision mode
  isRevisionMode?: boolean;
  onResubmitRevision?: () => void;
  isResubmitting?: boolean;
  resubmitLabel?: string;
  reviewStatus?: string | null;

  // Save Draft action
  onSave?: () => void;
  saveLabel?: string;

  // Secondary Action (e.g., Preview Protocol/Dossier)
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
    disabled?: boolean;
  };
  customActions?: React.ReactNode;

  // Continue / Advance Action
  onContinue?: () => void;
  isContinuing?: boolean;
  continueLabel?: string;
  continuingLabel?: string;
  continueDisabled?: boolean;

  // Legacy/Unified primaryAction wrapper (supported for full backwards compatibility)
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
  4: "Formulation Development",
  5: "Safety / Clinical",
  6: "Knowledge Integration",
};

const DEFAULT_CONTINUE_LABELS: Record<number, string> = {
  1: "Continue to In-Silico Analysis",
  2: "Continue to Molecular Docking",
  3: "Continue to Formulation",
  4: "Continue to Safety / Clinical",
  5: "Continue to Knowledge Integration",
  6: "Complete Research",
};

const DEFAULT_CONTINUING_LABELS: Record<number, string> = {
  1: "Advancing to In-Silico...",
  2: "Advancing to Molecular Docking...",
  3: "Advancing to Formulation...",
  4: "Advancing to Safety / Clinical...",
  5: "Advancing to Knowledge Integration...",
  6: "Completing Research...",
};

const PREV_STAGE_ROUTES: Record<number, string> = {
  1: "",
  2: "plant-literature",
  3: "in-silico",
  4: "docking",
  5: "formulation-safety",
  6: "safety",
};

const PREV_STAGE_LABELS: Record<number, string> = {
  1: "Back to Project",
  2: "Back to Plant & Literature Research",
  3: "Back to In-Silico Analysis",
  4: "Back to Molecular Docking",
  5: "Back to Formulation Development",
  6: "Back to Safety / Clinical",
};

export function ResearchStageFooter({
  projectId,
  stageNumber,
  stageTitle,
  previousStageRoute,
  backHref,
  onBack,
  backLabel: propBackLabel,
  statusMessage,
  lastSaved,
  isSaving = false,
  saveStatus,
  isRevisionMode = false,
  onResubmitRevision,
  isResubmitting = false,
  resubmitLabel = "Resubmit Revision",
  reviewStatus,
  onSave,
  saveLabel = "Save Draft",
  secondaryAction,
  customActions,
  onContinue,
  isContinuing = false,
  continueLabel,
  continuingLabel,
  continueDisabled = false,
  primaryAction,
  className = "",
}: ResearchStageFooterProps) {
  const router = useRouter();

  const title = stageTitle || DEFAULT_TITLES[stageNumber] || `Stage ${stageNumber}`;

  // Deterministic canonical previous route
  const canonicalPreviousRoute =
    previousStageRoute ||
    backHref ||
    (PREV_STAGE_ROUTES[stageNumber]
      ? `/researcher/projects/${projectId}/${PREV_STAGE_ROUTES[stageNumber]}`
      : `/researcher/projects/${projectId}`);

  const canonicalBackLabel =
    propBackLabel || PREV_STAGE_LABELS[stageNumber] || "Back to Project";

  // Compute continuing / loading state exclusively from continue props
  const effectiveIsContinuing = Boolean(isContinuing || primaryAction?.loading);
  const effectiveOnContinue = onContinue || primaryAction?.onClick;
  const effectiveContinueLabel =
    continueLabel || primaryAction?.label || DEFAULT_CONTINUE_LABELS[stageNumber] || "Continue";
  const effectiveContinuingLabel =
    continuingLabel ||
    primaryAction?.loadingLabel ||
    DEFAULT_CONTINUING_LABELS[stageNumber] ||
    "Advancing...";
  const effectiveContinueDisabled = Boolean(
    continueDisabled || primaryAction?.disabled || effectiveIsContinuing
  );

  const currentSaveStatus = isSaving ? "saving" : saveStatus || (lastSaved ? "saved" : "idle");

  // =========================================================================
  // EXPLICIT SEPARATE ACTION HANDLERS WITH DEV LOGGING
  // Back NEVER touches continue, save, validation, or stage advancement.
  // =========================================================================
  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[ResearchStageFooter] BACK_CLICK", {
      stageNumber,
      targetRoute: canonicalPreviousRoute,
    });
    if (onBack) {
      onBack();
    } else {
      router.push(canonicalPreviousRoute);
    }
  };

  const handleSaveDraft = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[ResearchStageFooter] SAVE_CLICK", { stageNumber });
    if (onSave) {
      onSave();
    }
  };

  const handleContinueAdvancement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[ResearchStageFooter] CONTINUE_CLICK", { stageNumber });
    if (effectiveOnContinue) {
      effectiveOnContinue();
    }
  };

  const handleResubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[ResearchStageFooter] RESUBMIT_CLICK", { stageNumber });
    if (onResubmitRevision) {
      onResubmitRevision();
    }
  };

  return (
    <footer
      className={`sticky bottom-3 z-30 w-full rounded-2xl border border-[#dde6df] bg-white/95 px-4 py-3 shadow-xl shadow-emerald-950/5 backdrop-blur-xl sm:px-5 sm:py-3.5 transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        {/* ========================================================
            LEFT: BACK BUTTON (PURE NAVIGATION ONLY, TYPE="BUTTON")
            ======================================================== */}
        <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={handleBack}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-[#0f2c20] shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-700 transition-transform group-hover:-translate-x-0.5" />
            <span>{canonicalBackLabel}</span>
          </button>

          {/* Mobile Center Display */}
          <div className="sm:hidden font-mono text-[11px] font-black uppercase tracking-wider text-[#0f2c20]">
            Stage {stageNumber} of 6
          </div>
        </div>

        {/* ========================================================
            CENTER: STAGE X OF 6 · STAGE NAME + STATUS
            ======================================================== */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-[#52645d] text-center min-w-0">
          <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#0f2c20] truncate">
            Stage {stageNumber} of 6 · {title}
          </span>

          {currentSaveStatus === "saving" ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-teal-700 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
              <span>Saving...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lastSaved || "Saved"}</span>
            </span>
          )}
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                secondaryAction.onClick();
              }}
              disabled={secondaryAction.disabled}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-xs font-bold text-emerald-950 shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {secondaryAction.icon ? (
                <secondaryAction.icon className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {/* Save Draft Button (type="button") */}
          {onSave && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#dde6df] bg-white hover:bg-slate-50 text-xs font-bold text-[#0f2c20] shadow-2xs transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Save className="w-3.5 h-3.5 text-[#52645d]" />
              )}
              <span>{isSaving ? "Saving..." : saveLabel}</span>
            </button>
          )}

          {/* Revision Resubmitted State */}
          {reviewStatus === "REVISION_RESUBMITTED" ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200/90 text-blue-900 text-xs font-bold font-mono shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Revision Resubmitted · Awaiting Professional Review</span>
            </div>
          ) : isRevisionMode && onResubmitRevision ? (
            <button
              type="button"
              onClick={handleResubmit}
              disabled={isResubmitting || isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
              {isResubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Resubmitting Revision...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-amber-200" />
                  <span>{resubmitLabel}</span>
                  <ArrowRight className="w-4 h-4 text-amber-200" />
                </>
              )}
            </button>
          ) : (
            /* Primary Action Button (Advancement, strictly type="button") */
            (effectiveOnContinue || primaryAction?.href) && (
              <button
                type="button"
                onClick={
                  primaryAction?.href && !effectiveOnContinue
                    ? (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(primaryAction.href!);
                      }
                    : handleContinueAdvancement
                }
                disabled={effectiveContinueDisabled}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                {effectiveIsContinuing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{effectiveContinuingLabel}</span>
                  </>
                ) : (
                  <>
                    {primaryAction?.icon && <primaryAction.icon className="w-4 h-4" />}
                    <span>{effectiveContinueLabel}</span>
                    {!(primaryAction?.hideArrow) && (
                      <ArrowRight className="w-4 h-4 text-emerald-200" />
                    )}
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </footer>
  );
}

export default ResearchStageFooter;
