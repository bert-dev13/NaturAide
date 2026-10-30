"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Cpu, 
  Bot, 
  Send, 
  ArrowRight, 
  Dna, 
  ShieldAlert, 
  CheckCircle2, 
  FileCheck,
  RefreshCw
} from "lucide-react";

export function AiEngine() {
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);

  const demoScenarios = [
    {
      query: "Analyze synergistic neuroprotection of Bacopa monnieri combined with Withania somnifera.",
      result: {
        headline: "Synergy Index: 1.42 (Moderate-High Synergistic Potentiation)",
        targets: [
          { name: "Acetylcholinesterase (AChE) Inhibition", value: "Bacoside A (-7.8 kcal/mol)", note: "Preserves synaptic acetylcholine" },
          { name: "BDNF Up-regulation", value: "Withanolide A (+44% expression)", note: "Promotes hippocampal neurogenesis" },
        ],
        interactionSafety: "Safe co-administration. No competitive CYP2D6 inhibition detected. Mild additive GABAergic relaxation.",
        confidence: "94.8% based on 28 peer-reviewed preclinical & clinical trials",
      },
    },
    {
      query: "Screen Curcuminoids against human TNF-α and identify bioavailability enhancers.",
      result: {
        headline: "Docking Affinity: -8.8 kcal/mol | Piperine Co-crystallization Recommended",
        targets: [
          { name: "TNF-α Receptor Binding Pocket", value: "Bisdemethoxycurcumin (-8.4 kcal/mol)", note: "Suppresses pro-inflammatory signaling cascade" },
          { name: "Intestinal Glucuronidation Inhibitor", value: "Piperine 5mg (+2000% bioavailability)", note: "Inhibits UDP-glucuronosyltransferase" },
        ],
        interactionSafety: "Moderate alert: May transiently elevate serum concentrations of CYP3A4 substrate drugs.",
        confidence: "99.1% based on 118 published clinical pharmacokinetic assays",
      },
    },
    {
      query: "Predict potential hepatotoxicity or CYP450 enzyme risks for high-dose Berberine.",
      result: {
        headline: "Metabolic Safety Profile: Safe within 500-1500mg/day Therapeutic Window",
        targets: [
          { name: "CYP3A4 Inhibition", value: "Moderate reversible inhibition (Ki = 14.2 µM)", note: "Monitor with statins, macrolides, cyclosporine" },
          { name: "AMPK Activation", value: "Direct phosphorylation at Thr172", note: "Enhances insulin sensitivity and lipid clearance" },
        ],
        interactionSafety: "Contraindicated in pregnancy due to bilirubin displacement (kernicterus risk).",
        confidence: "96.4% based on 52 clinical pharmacokinetic trials",
      },
    },
  ];

  const current = demoScenarios[selectedPromptIdx];

  return (
    <section className="py-24 bg-[#faf9f5] relative overflow-hidden border-t border-[#dde6df]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#ccfbf1] border border-[#99f6e4] px-3.5 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#0f766e]" />
            <span className="text-xs font-bold text-[#0f766e] uppercase tracking-wide">
              Bio-Intelligence Engine
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            AI-Assisted Herbal Synthesis & Formulation Discovery
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475550] leading-relaxed">
            Harness machine learning models trained specifically on phytochemistry, pharmacokinetics, and clinical trials to synthesize thousands of botanical papers in seconds.
          </p>
        </div>

        {/* Interactive AI Demonstration Workbench */}
        <div className="bg-white rounded-3xl border border-[#dde6df] shadow-xl overflow-hidden max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="bg-[#0f2c20] text-white p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1e5c44] text-[#ccfbf1] flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base sm:text-lg">
                  NatureAide Bio-Intelligence Engine
                </h3>
                <p className="text-xs text-[#9cb5a1]">
                  Fine-tuned on PubMed, Kew POWO, ChEMBL, and WHO Monographs
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold bg-[#1e5c44] text-[#ccfbf1] px-3 py-1.5 rounded-lg border border-[#297a5b]">
              Model: BioPhyto-70B v2.1
            </span>
          </div>

          {/* Prompt Selector Pills */}
          <div className="p-4 sm:p-6 bg-[#f6f8f6] border-b border-[#dde6df]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78997f] block mb-2.5">
              Select an Empirical Research Query to Simulate:
            </span>
            <div className="flex flex-wrap gap-2">
              {demoScenarios.map((scenario, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPromptIdx(idx)}
                  className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition-all border text-left ${
                    selectedPromptIdx === idx
                      ? "bg-[#0f2c20] text-white border-[#0f2c20] shadow-sm"
                      : "bg-white text-[#2f3a35] border-[#dde6df] hover:border-[#9cb5a1]"
                  }`}
                >
                  {scenario.query.slice(0, 48)}...
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Query & Structured Output Display */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* User Query Simulation */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df]">
              <div className="w-7 h-7 rounded-lg bg-[#0f2c20] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                Q
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase text-[#78997f]">Natural Language Research Prompt</span>
                <p className="text-sm sm:text-base font-semibold text-[#0f2c20] mt-0.5">
                  &ldquo;{current.query}&rdquo;
                </p>
              </div>
            </div>

            {/* AI Synthesized Output Card */}
            <motion.div
              key={selectedPromptIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-[#f0fdfa]/80 to-[#f6f8f6] border border-[#99f6e4] space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0d9488]" />
                  <h4 className="text-sm sm:text-base font-bold text-[#0f2c20]">
                    {current.result.headline}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-[#0d9488] bg-white px-2.5 py-1 rounded-md border border-[#99f6e4]">
                  {current.result.confidence}
                </span>
              </div>

              {/* Target Pathways */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {current.result.targets.map((tgt, tIdx) => (
                  <div key={tIdx} className="p-3.5 rounded-xl bg-white border border-[#ccfbf1] shadow-xs">
                    <span className="text-[11px] font-mono text-[#0f766e] font-bold block">{tgt.name}</span>
                    <p className="text-xs font-bold text-[#0f2c20] mt-0.5">{tgt.value}</p>
                    <p className="text-[11px] text-[#6b7c76] mt-1">{tgt.note}</p>
                  </div>
                ))}
              </div>

              {/* Herb-Drug Interaction & Safety Warning */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    Pharmacokinetic & Interaction Guardrail
                  </span>
                  <p className="text-xs text-amber-950 mt-0.5 leading-relaxed">
                    {current.result.interactionSafety}
                  </p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Engine Capabilities Footer */}
          <div className="px-6 py-4 bg-[#f6f8f6] border-t border-[#dde6df] flex flex-wrap items-center justify-between text-xs text-[#475550] gap-4">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0d9488]" />
                Zero Hallucination Grounding
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0d9488]" />
                Auto-Cited Primary DOI Links
              </span>
            </div>
            <a
              href="#workbench"
              className="text-xs font-semibold text-[#0f2c20] hover:text-[#0d9488] flex items-center gap-1 transition-colors"
            >
              <span>Explore AI Model Specifications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
