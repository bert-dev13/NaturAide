"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FlaskConical,
  Droplets,
  Layers,
  ShieldAlert,
  RotateCcw,
  X,
  Loader2,
  BookOpen,
  Info,
} from "lucide-react";
import type { FormulationProposal } from "@/lib/formulation-ai-service";

interface AiFormulationProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (proposal: FormulationProposal) => void;
  isGenerating: boolean;
  generationStep: number;
  proposal: FormulationProposal | null;
  error: string | null;
  onRegenerate: () => void;
  plantName: string;
}

const GENERATION_STEPS = [
  "Synthesizing Stage 1 Botanical Specimen & Solvent Parameters...",
  "Correlating Stage 2 Phytochemical Screening & ADMET Properties...",
  "Evaluating Stage 3 Target Protein Docking Affinities...",
  "Formulating Evidence-Based Excipients, Binders & Delivery Matrix...",
];

export default function AiFormulationProposalModal({
  isOpen,
  onClose,
  onApply,
  isGenerating,
  generationStep,
  proposal,
  error,
  onRegenerate,
  plantName,
}: AiFormulationProposalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Viewport Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isGenerating ? undefined : onClose}
        className="fixed inset-0 bg-[#072418]/70 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white border border-emerald-700/20 shadow-2xl overflow-hidden font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-[#072418] via-[#0d3626] to-[#041910] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 p-0.5 shadow-md flex items-center justify-center text-[#072418]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  AI Formulation Assistant
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-200">
                  Preliminary Hypothesis
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                AI-Assisted Preliminary Formulation Proposal
              </h3>
            </div>
          </div>
          {!isGenerating && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-emerald-300/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-xs text-[#0f2c20]">
          {/* GENERATING STATE */}
          {isGenerating && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 animate-pulse">
                  <FlaskConical className="w-10 h-10" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
              </div>

              <div className="space-y-2 max-w-md">
                <h4 className="text-base font-black text-[#0f2c20]">
                  Synthesizing Scientific Formulation for {plantName}
                </h4>
                <p className="text-xs text-[#52645d] leading-relaxed">
                  Integrating botanical extraction parameters, screened phytochemical fractions, and target protein docking affinities into an evidence-based formulation matrix.
                </p>
              </div>

              {/* Step indicator */}
              <div className="w-full max-w-md space-y-2.5 pt-2">
                {GENERATION_STEPS.map((stepText, idx) => {
                  const isDone = idx < generationStep;
                  const isCurrent = idx === generationStep;
                  return (
                    <div
                      key={stepText}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                        isCurrent
                          ? "bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold"
                          : isDone
                          ? "bg-white text-emerald-800"
                          : "text-slate-400 opacity-60"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className="text-xs">{stepText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {!isGenerating && error && (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-4 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-black text-sm text-rose-900">Formulation Generation Failed</h4>
                <p className="text-xs text-rose-800/90 leading-relaxed max-w-lg mx-auto">{error}</p>
              </div>
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Generation</span>
              </button>
            </div>
          )}

          {/* PROPOSAL DISPLAY */}
          {!isGenerating && !error && proposal && (
            <div className="space-y-6">
              {/* Scientific Integrity Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>PRELIMINARY AI RESEARCH HYPOTHESIS</span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  {proposal.disclaimer || "NatureAide strictly adheres to scientific integrity: AI-generated formulation suggestions are preliminary hypotheses and do NOT constitute laboratory-validated or clinically approved formulations."}
                </p>
              </div>

              {/* Formulation Overview Header Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 border border-emerald-200/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-800">
                      Proposed Formulation Architecture
                    </span>
                    <h4 className="text-lg font-black text-[#0f2c20]">
                      {proposal.formulationName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xs">
                      {proposal.dosageFormType}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#52645d] leading-relaxed">
                  <strong className="text-[#0f2c20]">Active Extract:</strong> {proposal.targetExtractDescription}
                </p>
              </div>

              {/* Proposed Composition Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>Proposed Composition Matrix ({proposal.components.length} Components)</span>
                  </h5>
                  <span className="text-[10px] font-medium text-[#78997f]">
                    Evidence-grounded excipients & bioactive extracts
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[#0f2c20] font-black text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Component</th>
                        <th className="py-3 px-4">Functional Role</th>
                        <th className="py-3 px-4">Proposed Concentration</th>
                        <th className="py-3 px-4">Scientific Rationale</th>
                        <th className="py-3 px-4">Evidence Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {proposal.components.map((comp, idx) => {
                        const isRequiresValidation = comp.evidenceStatus === "REQUIRES_EXPERIMENTAL_VALIDATION" ||
                          comp.proposedConcentration.toLowerCase().includes("requires");

                        return (
                          <tr key={`${comp.componentName}-${idx}`} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-[#0f2c20] whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{comp.componentName}</span>
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                                    Active
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#52645d] font-medium">
                              {comp.roleInFormulation}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isRequiresValidation ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 font-bold text-[10px]">
                                  <Info className="w-3 h-3 text-amber-700 shrink-0" />
                                  <span>Concentration Requires Experimental Validation</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono font-bold text-xs">
                                  {comp.proposedConcentration}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#52645d] leading-relaxed max-w-xs">
                              {comp.scientificRationale}
                            </td>
                            <td className="py-3 px-4 text-[#78997f] text-[11px] whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[150px]" title={comp.sourceReference}>
                                  {comp.sourceReference || "Monograph Standards"}
                                </span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Scientific Rationale Narrative */}
              {proposal.scientificRationale && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>Scientific Rationale & Delivery Mechanism</span>
                  </h5>
                  <p className="text-xs text-[#52645d] leading-relaxed whitespace-pre-line">
                    {proposal.scientificRationale}
                  </p>
                </div>
              )}

              {/* Compatibility & Limitations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {proposal.compatibilityConsiderations && (
                  <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-1.5">
                    <h6 className="font-black text-xs text-teal-950 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-teal-700" />
                      <span>Excipient Compatibility</span>
                    </h6>
                    <p className="text-xs text-teal-900/90 leading-relaxed">
                      {proposal.compatibilityConsiderations}
                    </p>
                  </div>
                )}

                {proposal.safetyAndLimitations && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                    <h6 className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                      <span>Preclinical Validation Limitations</span>
                    </h6>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      {proposal.safetyAndLimitations}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!isGenerating && proposal && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#52645d] hover:text-[#0f2c20] px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerate Proposal</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-[#52645d] hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => onApply(proposal)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-950/10 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply to Formulation Composition</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
