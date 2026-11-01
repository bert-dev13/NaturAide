"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, ArrowRight, X, ShieldCheck } from "lucide-react";

export interface ReviewDecisionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: "APPROVED" | "REVISION_REQUIRED";
  stageNumber: number;
  stageTitle: string;
  discipline: string;
  professionTitle?: string;
  cycle: number;
  projectId: number;
  recommendationsCount?: number;
}

export default function ReviewDecisionSuccessModal({
  isOpen,
  onClose,
  decision,
  stageNumber,
  stageTitle,
  discipline,
  professionTitle,
  cycle,
  projectId,
  recommendationsCount = 1,
}: ReviewDecisionSuccessModalProps) {
  if (!isOpen) return null;

  const isApproved = decision === "APPROVED";
  const dossierUrl = `/reviewer/projects/${projectId}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-3xl bg-white border border-[#dde6df] shadow-2xl p-6 sm:p-7 space-y-5 text-slate-900 z-10"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top animated icon badge */}
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isApproved
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20"
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="w-6 h-6 animate-in zoom-in-75 duration-300" />
              ) : (
                <AlertTriangle className="w-6 h-6 animate-in zoom-in-75 duration-300" />
              )}
            </div>

            <div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded border ${
                  isApproved
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-900 border-amber-200"
                }`}
              >
                {isApproved ? "Stage Approved" : "Revision Required"}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading tracking-tight mt-0.5">
                {isApproved ? "Stage Approved Successfully" : "Revision Request Submitted"}
              </h3>
            </div>
          </div>

          {/* Dynamic description & discipline card */}
          <div className="space-y-3 text-xs leading-relaxed text-slate-600">
            <p className="font-medium text-slate-700">
              {isApproved ? (
                <>
                  <strong className="text-slate-900">{stageTitle}</strong> has been approved for professional validation.
                </>
              ) : (
                <>
                  Your professional review for <strong className="text-slate-900">{stageTitle}</strong> has been returned to the researcher.
                </>
              )}
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800">{discipline} Review</span>
                <span className="font-mono text-slate-500 font-semibold">Cycle {cycle}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {isApproved
                  ? "Your professional assessment and scientific endorsement have been recorded."
                  : `${recommendationsCount} recommendation${recommendationsCount === 1 ? " requires" : "s require"} researcher attention.`}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <Link
              href={dossierUrl}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0b2447] hover:bg-[#123668] text-white text-xs font-bold transition-all shadow-md shadow-blue-950/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Back to Project Dossier</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

