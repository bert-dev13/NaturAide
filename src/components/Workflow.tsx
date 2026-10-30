"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Scroll, 
  Dna, 
  FlaskConical, 
  FileCheck2, 
  ArrowRight, 
  ChevronRight,
  Sparkles,
  Layers,
  CheckCircle2,
  Cpu
} from "lucide-react";

export function Workflow() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      stepNumber: "01",
      title: "Ethnobotanical Intake & Provenance",
      subtitle: "Ancestral Knowledge Verification",
      icon: Scroll,
      color: "from-amber-600 to-amber-700",
      lightBg: "bg-amber-50 text-amber-800 border-amber-200",
      description:
        "Documentation of traditional preparation methods, plant parts used, historical formulations, and indigenous origin with ethical benefit-sharing agreements.",
      details: [
        "Botanical voucher herbarium specimen cross-check",
        "Traditional preparation ratios (aqueous vs. lipid vs. decoction)",
        "Historical safety precedent & regional harvest seasonal tracking",
      ],
      output: "Standardized Ethnobotanical Dossier",
    },
    {
      stepNumber: "02",
      title: "Phytochemical Profiling & In-Silico Docking",
      subtitle: "Computational Molecular Screening",
      icon: Dna,
      color: "from-[#0d9488] to-[#0f766e]",
      lightBg: "bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4]",
      description:
        "High-throughput computational simulation matching identified secondary metabolites (alkaloids, flavonoids, terpenes) against human biological receptor targets.",
      details: [
        "Binding energy (kcal/mol) and RMSD stability scoring",
        "ADMET (Absorption, Distribution, Metabolism, Excretion, Toxicity) prediction",
        "Receptor active site docking 3D ligand conformation modeling",
      ],
      output: "In-Silico Affinity Matrix & Target Ranking",
    },
    {
      stepNumber: "03",
      title: "Laboratory Standardization & In-Vitro Assays",
      subtitle: "Wet-Lab Quality & Bioactivity Assays",
      icon: FlaskConical,
      color: "from-[#1e5c44] to-[#164533]",
      lightBg: "bg-[#edf2ee] text-[#1e5c44] border-[#c4d4c7]",
      description:
        "Validation of active compound concentrations via chromatographic fingerprints, cell culture bioassays, and strict safety toxicology clearance.",
      details: [
        "HPLC-DAD & LC-MS/MS chemical fingerprinting",
        "In-vitro cell viability (MTT assays) & IC50 anti-inflammatory benchmarks",
        "Heavy metal, microbial, and pesticide residue purity thresholds",
      ],
      output: "Standardized Extract Specification & Assay Logs",
    },
    {
      stepNumber: "04",
      title: "Double-Blind Clinical Review & Monograph",
      subtitle: "Peer-Reviewed Open Consensus",
      icon: FileCheck2,
      color: "from-[#0f2c20] to-[#091a13]",
      lightBg: "bg-[#f4ece0] text-[#164533] border-[#ecdcc8]",
      description:
        "Certified pharmacologists, toxicologists, and clinicians evaluate trials using GRADE standards to author an immutable, citable scientific herbal monograph.",
      details: [
        "COPE-compliant independent reviewer sign-offs (4-Eye protocol)",
        "GRADE evidence certainty grading (High / Moderate / Low)",
        "Official DOI minting & living open-access monograph publishing",
      ],
      output: "Official NaturAide Certified Monograph",
    },
  ];

  return (
    <section id="workflow" className="py-24 bg-white relative overflow-hidden border-t border-[#dde6df]">
      {/* Decorative subtle molecular backdrop */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#f4ece0] border border-[#ecdcc8] px-3.5 py-1.5 rounded-full mb-4">
            <Cpu className="w-3.5 h-3.5 text-[#0d9488]" />
            <span className="text-xs font-bold text-[#0f2c20] uppercase tracking-wide">
              Scientific Pipeline
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            From Traditional Knowledge to Scientific Evidence
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475550] leading-relaxed">
            Our 4-stage empirical pathway bridges centuries of folk medicine with computational precision, rigorous chromatography, and double-blind clinical consensus.
          </p>
        </div>

        {/* Interactive Step Navigator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`text-left p-5 rounded-2xl border transition-all duration-200 relative ${
                  isSelected
                    ? "bg-[#0f2c20] text-white border-[#0f2c20] shadow-lg shadow-[#0f2c20]/15"
                    : "bg-[#faf9f5] text-[#131b17] border-[#dde6df] hover:border-[#9cb5a1] hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    isSelected ? "bg-[#1e5c44] text-[#ccfbf1]" : "bg-[#dde6df] text-[#2f3a35]"
                  }`}>
                    STAGE {step.stepNumber}
                  </span>
                  <Icon className={`w-5 h-5 ${isSelected ? "text-[#14b8a6]" : "text-[#78997f]"}`} />
                </div>
                <h3 className="font-heading font-bold text-sm sm:text-base leading-snug">
                  {step.title}
                </h3>
                <p className={`text-xs mt-1 truncate ${isSelected ? "text-[#ccfbf1]" : "text-[#6b7c76]"}`}>
                  {step.subtitle}
                </p>
                {isSelected && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0f2c20] rotate-45 hidden lg:block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Detailed Stage View */}
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-[#faf9f5] to-[#f4ece0]/40 rounded-3xl p-6 sm:p-10 border border-[#dde6df] shadow-md"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Stage Details */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono font-bold text-[#0d9488] bg-[#ccfbf1] px-2.5 py-1 rounded-full border border-[#99f6e4]">
                  Phase {steps[activeStep].stepNumber} of 04
                </span>
                <span className="text-xs font-medium text-[#6b7c76]">
                  {steps[activeStep].subtitle}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#0f2c20] mb-4">
                {steps[activeStep].title}
              </h3>
              
              <p className="text-base text-[#475550] leading-relaxed mb-6">
                {steps[activeStep].description}
              </p>

              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1e5c44]">
                  Rigorous Verification Criteria:
                </p>
                {steps[activeStep].details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#0d9488] shrink-0" />
                    <span className="text-sm text-[#2f3a35] font-medium">{detail}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#dde6df] flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-[#78997f]">Deliverable Output:</span>
                  <p className="text-sm font-bold text-[#0f2c20]">{steps[activeStep].output}</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#0d9488] bg-teal-50 px-2 py-1 rounded">
                  Status: Standardized
                </span>
              </div>
            </div>

            {/* Right Visual Flow Diagram Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#dde6df] shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#78997f] mb-4">
                Pipeline Progression Matrix
              </h4>

              <div className="space-y-3">
                {steps.map((s, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                      idx === activeStep
                        ? "bg-[#edf2ee] border-[#1e5c44] font-bold text-[#0f2c20]"
                        : idx < activeStep
                        ? "bg-white border-[#dde6df] text-[#78997f]"
                        : "bg-white border-dashed border-[#dde6df] text-[#6b7c76]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx <= activeStep ? "bg-[#0f2c20] text-white" : "bg-[#dde6df] text-[#6b7c76]"
                      }`}>
                        {idx + 1}
                      </span>
                      <span>{s.title}</span>
                    </div>
                    {idx === activeStep ? (
                      <span className="text-[10px] bg-[#0d9488] text-white px-1.5 py-0.5 rounded font-medium">
                        Active Step
                      </span>
                    ) : idx < activeStep ? (
                      <span className="text-emerald-700 font-medium">Completed</span>
                    ) : (
                      <span className="text-[#6b7c76]">Queued</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-[#edf2ee] flex items-center justify-between">
                <span className="text-xs text-[#6b7c76]">Reproducibility Score</span>
                <span className="text-xs font-bold font-mono text-[#0f2c20]">99.4% Validated</span>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
