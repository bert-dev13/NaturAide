"use client";

import React, { useState, useEffect, useId } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  CheckCircle2,
  Circle,
  Clock,
  ShieldAlert,
  Sparkles,
  Info,
  ExternalLink,
  ChefHat,
  Utensils,
  Leaf,
  Archive,
  ArrowRight,
} from "lucide-react";
import { SavedGuide2DIcon } from "./SavedIcons2D";
import { SavedGuideItem } from "./types";

interface SavedGuideModalProps {
  guide: SavedGuideItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedGuideModal({
  guide,
  isOpen,
  onClose,
}: SavedGuideModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const headingId = useId();

  // Reset checklist state whenever guide changes
  useEffect(() => {
    if (guide) {
      setCheckedIngredients({});
      setCompletedSteps({});
    }
  }, [guide?.id]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!guide) return null;

  // Parse lines helper
  const parseList = (text?: string | null): string[] => {
    if (!text) return [];
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\d+[\.\)]\s*/, ""));
  };

  const ingredientsList = parseList(guide.whatYouNeed);
  const stepsList = parseList(guide.preparationSteps);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedStepsCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = stepsList.length > 0
    ? Math.round((completedStepsCount / stepsList.length) * 100)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#071610]/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 14 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#dde6df] overflow-hidden my-auto max-h-[90vh] flex flex-col z-10"
          >
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-[#fbf7ed] via-[#fffdf9] to-[#f2f8f4] p-5 sm:p-6 border-b border-[#e5ebe7] shrink-0">
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close recipe details"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#2d4739] hover:text-[#0f2c20] border border-[#d6e0d9] flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300/60 flex items-center justify-center shrink-0 shadow-2xs">
                  <SavedGuide2DIcon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 text-[10px] font-black uppercase tracking-wider border border-amber-300/50">
                      {guide.category || "Traditional Recipe"}
                    </span>
                    {guide.plantName && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-300/40">
                        <Leaf className="w-3 h-3 text-emerald-700" />
                        {guide.plantName}
                      </span>
                    )}
                  </div>
                  <h2
                    id={headingId}
                    className="font-heading font-black text-lg sm:text-xl text-[#0f2c20] leading-snug"
                  >
                    {guide.title}
                  </h2>
                </div>
              </div>

              {guide.description && (
                <p className="mt-3 text-xs sm:text-sm text-[#475550] leading-relaxed bg-white/80 p-3 rounded-2xl border border-amber-200/50">
                  {guide.description}
                </p>
              )}
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* SECTION 1: WHAT YOU NEED / INGREDIENTS */}
              {ingredientsList.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-amber-700" />
                      <h3 className="font-heading font-black text-sm text-[#0f2c20] uppercase tracking-wider">
                        What You Need (Ingredients & Utensils)
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#52796f] font-medium">
                      Tap items to check off
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ingredientsList.map((item, idx) => {
                      const isChecked = Boolean(checkedIngredients[idx]);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleIngredient(idx)}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isChecked
                              ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                              : "bg-[#fcfbf9] border-[#e2ebe4] text-[#2d4739] hover:border-amber-300 hover:bg-white"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#8ca395]" />
                            )}
                          </div>
                          <span
                            className={`text-xs font-semibold leading-tight ${
                              isChecked ? "line-through text-emerald-800/80" : ""
                            }`}
                          >
                            {item}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: STEP-BY-STEP PREPARATION */}
              {stepsList.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-emerald-700" />
                      <h3 className="font-heading font-black text-sm text-[#0f2c20] uppercase tracking-wider">
                        Preparation Steps
                      </h3>
                    </div>
                    {stepsList.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#e2ebe4] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-[#52796f]">
                          {completedStepsCount}/{stepsList.length} done
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {stepsList.map((step, idx) => {
                      const isDone = Boolean(completedSteps[idx]);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleStep(idx)}
                          className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                            isDone
                              ? "bg-emerald-50/50 border-emerald-300 text-[#0f2c20]"
                              : "bg-white border-[#dde6df] hover:border-amber-300 shadow-2xs"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-colors ${
                              isDone
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-amber-100 text-amber-950 border border-amber-300/50"
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p
                              className={`text-xs sm:text-sm font-medium leading-relaxed ${
                                isDone ? "text-emerald-950 font-semibold" : "text-[#1e3b2b]"
                              }`}
                            >
                              {step}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: IMPORTANT REMINDERS & STORAGE */}
              {(guide.importantReminders || guide.storageGuidance) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guide.importantReminders && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>Important Reminders</span>
                      </div>
                      <p className="text-xs text-amber-950/90 leading-relaxed font-medium">
                        {guide.importantReminders}
                      </p>
                    </div>
                  )}

                  {guide.storageGuidance && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-[#f2f8f4] border border-emerald-200/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                        <Archive className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Storage & Shelf-Life</span>
                      </div>
                      <p className="text-xs text-emerald-950/90 leading-relaxed font-medium">
                        {guide.storageGuidance}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: SAFETY & PRECAUTIONS ADVISORY */}
              {guide.safetyInformation && (
                <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200/80 flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                      Safety & Precaution Advisory
                    </p>
                    <p className="text-xs text-rose-900 leading-relaxed">
                      {guide.safetyInformation}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-[#fafbf9] border-t border-[#e5ebe7] flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                {guide.plantSlug && (
                  <Link
                    href={`/community/plants/${guide.plantSlug}/preparation`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition-colors"
                  >
                    <span>Full Plant Preparations</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {guide.plantSlug && (
                  <Link
                    href={`/community/plants/${guide.plantSlug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#edf2ee] text-[#2d4739] border border-[#d6e0d9] text-xs font-bold transition-colors"
                  >
                    <span>Plant Monograph</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4b36] text-white text-xs font-bold transition-all shadow-xs cursor-pointer ml-auto"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

