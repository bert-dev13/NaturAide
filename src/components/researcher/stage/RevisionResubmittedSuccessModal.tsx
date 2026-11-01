"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, ArrowRight } from "lucide-react";

export interface RevisionResubmittedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  stageNumber: number;
  stageTitle: string;
  discipline: string;
  profession: string;
  reviewCycle: number;
  reviewerName?: string | null;
  addressedCount?: number;
}

export default function RevisionResubmittedSuccessModal({
  isOpen,
  onClose,
  projectId,
  stageNumber,
  stageTitle,
  discipline,
  profession,
  reviewCycle,
  reviewerName,
  addressedCount = 1,
}: RevisionResubmittedSuccessModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const revisionsUrl = `/researcher/projects/${projectId}/revisions`;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        {/* Full-viewport overlay covering header/navbar/sidebar/footer */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity cursor-pointer"
          aria-hidden="true"
        />

        <div className="relative z-10 flex min-h-screen items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto relative w-full max-w-md rounded-3xl bg-white border border-[#dde6df] shadow-2xl p-6 sm:p-7 space-y-5 text-slate-900 my-auto"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Top Check Icon */}
            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-emerald-400/20 animate-ping pointer-events-none" />
              </div>

              <div className="space-y-1 pt-2">
                <h3 className="text-lg font-black text-[#0f2c20] tracking-tight">
                  Revision Resubmitted Successfully
                </h3>
                <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
                  Your corrections for <strong>{stageTitle}</strong> have been submitted for professional review.
                </p>
              </div>
            </div>

            {/* Dynamic Review Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                  {discipline} Review
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  Cycle {reviewCycle || 1}
                </span>
              </div>

              <div className="pt-1">
                <p className="text-xs font-bold text-[#0f2c20]">{profession}</p>
                {reviewerName && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Assigned Reviewer: <span className="font-semibold text-slate-700">{reviewerName}</span>
                  </p>
                )}
              </div>

              {addressedCount > 0 && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Recommendations addressed:</span>
                  <span className="font-mono font-bold text-emerald-700">{addressedCount}</span>
                </div>
              )}
            </div>

            {/* Reassurance text */}
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              The assigned professional reviewer can now evaluate your updated research.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <Link
                href={revisionsUrl}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#164130] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>View Review Status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
