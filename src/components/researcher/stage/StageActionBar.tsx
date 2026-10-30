"use client";

import React from "react";
import { Clock, CheckCircle2, AlertCircle, Loader2, Save, ChevronRight } from "lucide-react";

export interface StageActionBarProps {
  stageNumber: number;
  stageTitle: string;
  isSaving?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  lastSaved?: string | null;
  onSave?: () => void;
  saveLabel?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ElementType;
  };
  secondaryActions?: React.ReactNode;
  className?: string;
}

export default function StageActionBar({
  stageNumber,
  stageTitle,
  isSaving = false,
  saveStatus,
  lastSaved,
  onSave,
  saveLabel = "Save Draft",
  primaryAction,
  secondaryActions,
  className = "",
}: StageActionBarProps) {
  const currentSaveStatus = isSaving ? "saving" : saveStatus || (lastSaved ? "saved" : "idle");

  return (
    <div
      className={`sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-[#dde6df] rounded-2xl p-3 sm:p-4 shadow-md flex flex-wrap items-center justify-between gap-3 transition-all ${className}`}
    >
      {/* Left: Stage info & Save feedback */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#0f2c20] text-emerald-300 font-mono text-[11px] font-extrabold flex items-center justify-center shrink-0">
            {String(stageNumber).padStart(2, "0")}
          </span>
          <span className="text-xs font-bold text-[#0f2c20] truncate hidden sm:inline">
            {stageTitle}
          </span>
        </div>

        {/* Save State feedback */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {currentSaveStatus === "saving" && (
            <span className="flex items-center gap-1 text-teal-700 font-medium">
              <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
              <span>Saving...</span>
            </span>
          )}
          {currentSaveStatus === "saved" && (
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>
                Saved
                {lastSaved ? ` ${new Date(lastSaved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
              </span>
            </span>
          )}
          {currentSaveStatus === "error" && (
            <span className="flex items-center gap-1 text-rose-700 font-medium">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>Error saving</span>
            </span>
          )}
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {secondaryActions}

        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dde6df] bg-white hover:bg-[#f6f8f6] text-xs font-bold text-[#0f2c20] transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600" />
            <span>{saveLabel}</span>
          </button>
        )}

        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {primaryAction.loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : primaryAction.icon ? (
              <primaryAction.icon className="w-3.5 h-3.5 text-emerald-400" />
            ) : null}
            <span>{primaryAction.label}</span>
            {!primaryAction.loading && !primaryAction.icon && (
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
