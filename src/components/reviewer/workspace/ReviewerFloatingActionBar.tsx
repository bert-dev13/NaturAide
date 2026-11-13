"use client";

import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

export interface ReviewerFloatingActionBarProps {
  currentSectionTitle: string;
  versionTag: string;
  overallStatus: string;
  specialtyLabel: string;
  activeTab: string;
  currentStep: number;
  totalSteps: number;
  currentStepTitle?: string;
  isCurrentStepApproved: boolean;
  approvedStepsCount: number;
  approvedStepsPercent: number;
  onPrevStep: () => void;
  onNextStep: () => void;
  onToggleApproveCurrentStep: () => void;
}

export default function ReviewerFloatingActionBar({
  currentSectionTitle,
  versionTag,
  overallStatus,
  specialtyLabel,
  activeTab,
  currentStep,
  totalSteps,
  currentStepTitle,
  isCurrentStepApproved,
  approvedStepsCount,
  approvedStepsPercent,
  onPrevStep,
  onNextStep,
  onToggleApproveCurrentStep,
}: ReviewerFloatingActionBarProps) {
  const isSectionStepMode =
    activeTab === "section1" || activeTab === "section2" || activeTab === "section3";

  return (
    <aside
      aria-label="Reviewer navigation bar"
      style={{ left: "var(--sidebar-width, 0px)" }}
      className="fixed bottom-3 right-0 z-40 px-3 sm:px-5 pointer-events-none flex flex-col items-center justify-end transition-[left] duration-200"
    >
      <div className="pointer-events-auto max-w-5xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-2 rounded-xl border border-blue-400/25 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-3 sm:px-4 py-2 text-white shadow-[0_12px_28px_-18px_rgba(7,25,48,0.55)] backdrop-blur-md">
        {/* Left: Section, Step Info & Approval Progress Percentage */}
        <div className="flex items-center gap-3 min-w-0 w-full md:w-auto justify-between md:justify-start">
          <div className="shrink-0 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
            {versionTag}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate block">
                {currentSectionTitle}
              </span>
              {isSectionStepMode && (
                <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-md bg-white/10 text-blue-200 border border-white/10 font-bold">
                  Step {currentStep} of {totalSteps}
                </span>
              )}
            </div>

            {/* Approval Progress Percentage */}
            {isSectionStepMode ? (
              <div className="flex items-center gap-2.5 mt-0.5">
                <div className="w-24 sm:w-32 h-1.5 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      approvedStepsPercent === 100
                        ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                        : approvedStepsPercent > 0
                        ? "bg-blue-400"
                        : "bg-white/20"
                    }`}
                    style={{ width: `${Math.max(approvedStepsPercent, 2)}%` }}
                  />
                </div>
                <span className="text-[10.5px] font-mono font-bold text-emerald-300">
                  {approvedStepsPercent}% Approved ({approvedStepsCount}/{totalSteps})
                </span>
              </div>
            ) : (
              <p className="text-[10.5px] text-slate-400">
                {specialtyLabel} · {overallStatus}
              </p>
            )}
          </div>
        </div>

        {/* Right: Step Navigation Controls */}
        {isSectionStepMode && (
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={onPrevStep}
              disabled={currentStep <= 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Go back to previous step"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Previous Step</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <button
              type="button"
              onClick={onToggleApproveCurrentStep}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isCurrentStepApproved
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400 shadow-emerald-950/40"
                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 hover:border-emerald-300"
              }`}
              title={
                isCurrentStepApproved
                  ? `Step ${currentStep} is approved.`
                  : `Mark Step ${currentStep} as approved.`
              }
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  isCurrentStepApproved ? "text-white" : "text-emerald-400"
                }`}
              />
              <span>
                {isCurrentStepApproved ? `Step Approved` : `Approve Step`}
              </span>
            </button>

            <button
              type="button"
              onClick={onNextStep}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/50 transition-all cursor-pointer"
              title={
                currentStep >= totalSteps
                  ? activeTab === "section3"
                    ? "Proceed to Centralized Feedback & Revision Console"
                    : "Proceed to next section"
                  : "Proceed to next step"
              }
            >
              <span className="hidden sm:inline">
                {currentStep >= totalSteps
                  ? activeTab === "section3"
                    ? "Consolidated Feedback"
                    : "Next Section"
                  : "Next Step"}
              </span>
              <span className="sm:hidden">
                {currentStep >= totalSteps
                  ? activeTab === "section3"
                    ? "Feedback"
                    : "Next"
                  : "Next"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
