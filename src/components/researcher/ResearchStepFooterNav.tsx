"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";

export interface ResearchStepItem {
  number: number;
  title: string;
  icon?: any;
}

export interface ResearchStepFooterNavProps {
  projectId: number;
  /** Display section number in the 4-section workspace (1–3 use this footer; 4 is approval). */
  sectionNumber: 1 | 2 | 3 | 4;
  sectionTitle: string;
  steps: ResearchStepItem[];
  activeStep: number;
  onStepChange: (stepNumber: number) => void;
  onSaveDraft?: () => Promise<boolean | void>;
  onSubmitFinal?: () => Promise<void> | void;
  canSubmitFinal?: boolean;
  isSaving?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "unsaved" | "error";
  saveMessage?: string;
  isStepComplete?: boolean;
  /** When true, Next Step is disabled (e.g. required selection missing). */
  disableNext?: boolean;
  /** Short explanation shown when Next is disabled. */
  nextDisabledReason?: string;
  nextLabelOverride?: { full: string; short: string };
  className?: string;
}

export default function ResearchStepFooterNav({
  projectId,
  sectionNumber,
  sectionTitle,
  steps,
  activeStep,
  onStepChange,
  onSaveDraft,
  onSubmitFinal,
  canSubmitFinal = true,
  isSaving: externalIsSaving = false,
  saveStatus: externalSaveStatus,
  saveMessage,
  isStepComplete = false,
  disableNext = false,
  nextDisabledReason,
  nextLabelOverride,
  className = "",
}: ResearchStepFooterNavProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [localStatus, setLocalStatus] = useState<"idle" | "saving" | "saved" | "unsaved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentStep = steps.find((s) => s.number === activeStep) || steps[0];
  const totalSteps = steps.length;
  const isFirstStepOfSection = activeStep === 1;
  const isLastStepOfSection = activeStep === totalSteps;

  const isSaving = externalIsSaving || isNavigating || localStatus === "saving";
  const currentStatus = externalSaveStatus || localStatus;

  // Compute label for Previous button
  const getPrevLabel = () => {
    if (isFirstStepOfSection) {
      if (sectionNumber === 1) return { full: "Previous Step", short: "Prev" };
      if (sectionNumber === 2) return { full: "Back to Section 1", short: "Sec 1" };
      if (sectionNumber === 3) return { full: "Back to Section 2", short: "Sec 2" };
      if (sectionNumber === 4) return { full: "Back to Section 3", short: "Sec 3" };
    }
    return { full: "Previous Step", short: "Prev" };
  };

  // Compute label for Next button
  const getNextLabel = () => {
    if (nextLabelOverride) return nextLabelOverride;
    if (isLastStepOfSection) {
      if (sectionNumber === 1) return { full: "Proceed to Section 2 →", short: "Sec 2 →" };
      if (sectionNumber === 2) return { full: "Proceed to Section 3 →", short: "Sec 3 →" };
      if (sectionNumber === 3) return { full: "Proceed to Section 4 →", short: "Sec 4 →" };
    }
    return { full: "Next Step", short: "Next" };
  };

  const isPrevDisabled = isFirstStepOfSection && sectionNumber === 1;

  // Handle explicit Save Draft action
  const handleManualSave = async () => {
    if (isSaving || !onSaveDraft) return;
    setErrorMessage(null);
    setLocalStatus("saving");
    try {
      const res = await onSaveDraft();
      if (res === false) {
        setLocalStatus("error");
        setErrorMessage("Save failed. Please review form entries.");
      } else {
        setLocalStatus("saved");
        setTimeout(() => setLocalStatus("idle"), 2500);
      }
    } catch (err: any) {
      setLocalStatus("error");
      setErrorMessage(err.message || "Failed to save draft.");
    }
  };

  // Handle Navigation with Auto-Save
  const handleNavigate = async (direction: "prev" | "next") => {
    if (isSaving || isNavigating) return;
    setErrorMessage(null);
    setIsNavigating(true);

    try {
      // Auto-save current form before navigating if save handler is supplied
      if (onSaveDraft) {
        setLocalStatus("saving");
        const saveRes = await onSaveDraft();
        if (saveRes === false) {
          setLocalStatus("error");
          setErrorMessage("Please resolve errors before moving to another step.");
          setIsNavigating(false);
          return;
        }
        setLocalStatus("saved");
      }

      // Execute navigation
      if (direction === "prev") {
        if (isFirstStepOfSection) {
          if (sectionNumber === 2) {
            router.push(`/researcher/projects/${projectId}/formulation-rd?step=6`);
          } else if (sectionNumber === 3) {
            router.push(`/researcher/projects/${projectId}/in-silico`);
          }
        } else {
          onStepChange(activeStep - 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        if (isLastStepOfSection) {
          if (sectionNumber === 1) {
            router.push(`/researcher/projects/${projectId}/in-silico`);
          } else if (sectionNumber === 2) {
            router.push(`/researcher/projects/${projectId}/submission`);
          } else if (sectionNumber === 3) {
            // Paper Submission last step → submit / approval
            if (onSubmitFinal) {
              await onSubmitFinal();
            } else {
              const submitTarget =
                document.getElementById("final-submission-card") ||
                document.getElementById("submission-action-card") ||
                document.getElementById("review-complete-research");
              if (submitTarget) {
                submitTarget.scrollIntoView({ behavior: "smooth", block: "center" });
              } else {
                router.push(`/researcher/projects/${projectId}/completion`);
              }
            }
          }
        } else {
          onStepChange(activeStep + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch (err: any) {
      setLocalStatus("error");
      setErrorMessage(err.message || "Navigation halted due to save error.");
    } finally {
      setIsNavigating(false);
    }
  };

  const prevText = getPrevLabel();
  const nextText = getNextLabel();

  return (
    <aside
      aria-label="Workflow step navigation"
      style={{ left: "var(--sidebar-width, 0px)" }}
      className={`fixed bottom-4 right-0 z-40 px-3 sm:px-6 pointer-events-none flex flex-col items-center justify-end gap-2 transition-[left] duration-200 ${className}`}
    >
      {/* Actionable Error Toast if auto-save fails */}
      {errorMessage && (
        <div className="pointer-events-auto bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-1.5 rounded-lg shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-lg">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="truncate">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-auto shrink-0 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Floating Footer Surface (Centered within Main Workspace) */}
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 px-3 sm:px-5 py-2.5 max-w-5xl w-full mx-auto flex items-center justify-between gap-2 sm:gap-4 transition-all">
        {/* Left: Step Information & Status Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Step Pill */}
          <div className="shrink-0 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
            {activeStep}/{totalSteps}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 truncate block">
                {currentStep.title}
              </span>

              {/* Status Indicator */}
              <div className="hidden md:flex items-center gap-1 shrink-0 text-[11px]">
                {isSaving ? (
                  <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    <span>Saving...</span>
                  </span>
                ) : currentStatus === "saved" ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Saved</span>
                  </span>
                ) : currentStatus === "unsaved" ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Unsaved</span>
                  </span>
                ) : currentStatus === "error" ? (
                  <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>Save error</span>
                  </span>
                ) : isStepComplete ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Complete</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                    <span>Draft</span>
                  </span>
                )}
              </div>
            </div>

            {/* Compact Mini Progress Dots */}
            <div className="hidden sm:flex items-center gap-1 mt-1">
              {steps.map((st) => {
                const isPassed = st.number < activeStep;
                const isCurrent = st.number === activeStep;
                return (
                  <button
                    key={st.number}
                    type="button"
                    onClick={() => {
                      if (!isSaving) onStepChange(st.number);
                    }}
                    title={`Step ${st.number}: ${st.title}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      isCurrent
                        ? "w-6 bg-emerald-600"
                        : isPassed
                        ? "w-2.5 bg-emerald-300 hover:bg-emerald-400"
                        : "w-2 bg-slate-200 hover:bg-slate-300"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Previous, Save Draft, and Next Step Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Previous Step Button */}
          <button
            type="button"
            onClick={() => handleNavigate("prev")}
            disabled={isPrevDisabled || isSaving}
            className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isPrevDisabled
                ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs hover:border-slate-300 cursor-pointer active:scale-98"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{prevText.full}</span>
            <span className="sm:hidden">{prevText.short}</span>
          </button>

          {/* Save Draft Button */}
          {onSaveDraft && (
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#edf5f0] hover:bg-[#e2eee7] text-[#0f2c20] border border-emerald-200/80 shadow-2xs transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              ) : (
                <Save className="w-3.5 h-3.5 text-emerald-800" />
              )}
              <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save Draft"}</span>
              <span className="sm:hidden">{isSaving ? "..." : "Save"}</span>
            </button>
          )}

          {/* Next Step Button / Section Transition Button */}
          <div className="flex flex-col items-end gap-0.5">
            <button
              type="button"
              onClick={() => handleNavigate("next")}
              disabled={
                isSaving ||
                disableNext ||
                (isLastStepOfSection && sectionNumber === 3 && !canSubmitFinal)
              }
              title={disableNext ? nextDisabledReason || "Complete this step to continue" : undefined}
              className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-98 disabled:cursor-not-allowed disabled:opacity-50 ${
                isLastStepOfSection && sectionNumber === 3
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-[#0f2c20] hover:bg-[#164533] text-white"
              }`}
            >
              {isLastStepOfSection && sectionNumber === 3 ? (
                <ClipboardCheck className="w-3.5 h-3.5" />
              ) : null}
              <span className="hidden sm:inline">{nextText.full}</span>
              <span className="sm:hidden">{nextText.short}</span>
              {!(isLastStepOfSection && sectionNumber === 3) && (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
            {disableNext && nextDisabledReason ? (
              <span className="hidden max-w-[14rem] text-right text-[10px] font-medium text-amber-700 sm:block">
                {nextDisabledReason}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

