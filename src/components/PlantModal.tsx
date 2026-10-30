"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Dna, 
  ShieldCheck, 
  AlertTriangle, 
  FlaskConical, 
  BookOpen, 
  CheckCircle2, 
  Activity,
  HeartHandshake
} from "lucide-react";
import { MedicinalPlant } from "@/data/plantData";

interface PlantModalProps {
  plant: MedicinalPlant | null;
  onClose: () => void;
}

export function PlantModal({ plant, onClose }: PlantModalProps) {
  if (!plant) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl border border-[#dde6df] shadow-2xl max-w-2xl w-full overflow-hidden my-8"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#0f2c20] to-[#164533] text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold bg-[#14b8a6]/20 text-[#ccfbf1] border border-[#14b8a6]/40 px-2.5 py-0.5 rounded-full">
                {plant.family} Family
              </span>
              <span className="text-xs bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-700">
                GRADE {plant.evidenceGrade}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-heading font-extrabold italic tracking-tight">
              {plant.scientificName}
            </h3>
            <p className="text-sm text-[#ccfbf1] font-sans font-medium mt-0.5">
              Common Name: {plant.commonName}
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Summary */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#78997f] mb-1.5">
                Pharmacological Monograph Summary
              </h4>
              <p className="text-sm text-[#2f3a35] leading-relaxed">
                {plant.summary}
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 bg-[#faf9f5] p-4 rounded-2xl border border-[#dde6df]">
              <div>
                <span className="text-[11px] text-[#6b7c76]">In-Silico Docking</span>
                <p className="text-sm font-mono font-bold text-[#0d9488]">{plant.dockingScore}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#6b7c76]">Clinical Trials</span>
                <p className="text-sm font-bold text-[#0f2c20]">{plant.clinicalTrialsCount} Human Studies</p>
              </div>
              <div>
                <span className="text-[11px] text-[#6b7c76]">Safety Index</span>
                <p className="text-sm font-mono font-bold text-emerald-700">{plant.safetyIndex} / 10</p>
              </div>
            </div>

            {/* Active Compounds & Biological Targets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#f6f8f6] border border-[#dde6df]">
                <h5 className="text-xs font-bold uppercase text-[#1e5c44] flex items-center gap-1.5 mb-2.5">
                  <FlaskConical className="w-4 h-4 text-[#0d9488]" />
                  Active Phytochemicals
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {plant.activeCompounds.map((comp, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium bg-white text-[#0f2c20] px-2.5 py-1 rounded-lg border border-[#c4d4c7]"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#f6f8f6] border border-[#dde6df]">
                <h5 className="text-xs font-bold uppercase text-[#1e5c44] flex items-center gap-1.5 mb-2.5">
                  <Dna className="w-4 h-4 text-[#0d9488]" />
                  Biological Receptor Targets
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {plant.primaryTargets.map((target, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium bg-white text-[#0f2c20] px-2.5 py-1 rounded-lg border border-[#c4d4c7]"
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Preparation Guidance */}
            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df]">
              <h5 className="text-xs font-bold uppercase text-[#0f2c20] flex items-center gap-1.5 mb-1.5">
                <HeartHandshake className="w-4 h-4 text-[#164533]" />
                Traditional & Community Preparation Protocol
              </h5>
              <p className="text-xs sm:text-sm text-[#475550] leading-relaxed">
                {plant.preparationType}
              </p>
              <p className="text-xs text-[#78997f] mt-1 italic">
                Ethnobotanical Context: {plant.traditionalUse}
              </p>
            </div>

            {/* Safety & Contraindications */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
              <h5 className="text-xs font-bold uppercase text-amber-900 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Clinical Contraindications & Warnings
              </h5>
              <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                {plant.contraindications.map((contra, idx) => (
                  <li key={idx}>{contra}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-6 bg-[#f6f8f6] border-t border-[#dde6df] flex items-center justify-between">
            <span className="text-xs text-[#6b7c76]">
              Peer-Reviewed by Pharmacognosy Board
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#0f2c20] text-white text-xs font-semibold hover:bg-[#164533] transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
