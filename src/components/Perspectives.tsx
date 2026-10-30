"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Microscope, 
  Stethoscope, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Dna, 
  ShieldCheck, 
  Smartphone, 
  FlaskConical, 
  BookOpen, 
  Sliders,
  AlertTriangle,
  BadgeCheck,
  Activity,
  Layers
} from "lucide-react";

export function Perspectives() {
  const [activeTab, setActiveTab] = useState<"community" | "researchers" | "experts">("community");
  const [decoctionServings, setDecoctionServings] = useState(2);

  const perspectives = [
    {
      id: "community",
      title: "Community & Practitioners",
      role: "Traditional Knowledge & Daily Guidance",
      icon: Users,
      badge: "Community Perspective",
      badgeColor: "bg-[#e8f3ec] text-[#1e5c44] border-[#c2dcc8]",
      headline: "Access trusted medicinal plant profiles, safe preparation guidance, and herb-drug alerts.",
      description:
        "Everyday wellness seekers, traditional herbalists, and naturopathic practitioners get clear, evidence-backed information directly on mobile and web — preventing toxic solvent errors and unsafe prescription conflicts.",
      features: [
        {
          title: "Verified Preparation Protocols",
          desc: "Step-by-step decoction, tea infusion, and poultice ratios standardized for safe home extraction.",
        },
        {
          title: "Herb-Drug Interaction Checker",
          desc: "Instant contraindication warnings against pharmaceuticals, anticoagulants, and antihypertensives.",
        },
        {
          title: "Ethnobotanical Heritage Archive",
          desc: "Document traditional and indigenous herbal usages with ethical provenance attribution.",
        },
      ],
      metrics: [
        { label: "Community Guides", value: "3,800+" },
        { label: "Safety Index Verifications", value: "99.8%" },
        { label: "Interaction Alerts", value: "1,200+" },
      ],
      ctaText: "Explore Community Guides",
      ctaLink: "#workbench",
    },
    {
      id: "researchers",
      title: "Bioscience Researchers & Labs",
      role: "In-Silico Docking & Research Integration",
      icon: Microscope,
      badge: "Researcher Perspective",
      badgeColor: "bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4]",
      headline: "Conduct structured herbal research, literature review, in-silico analysis, and professional dossier review.",
      description:
        "Pharmacognosists and biochemists leverage computational screening to identify active secondary metabolites, simulate 3D molecular docking against human proteins, and formulate standardized laboratory extraction protocols.",
      features: [
        {
          title: "In-Silico Molecular Docking",
          desc: "High-throughput AutoDock Vina calculations with binding energy (kcal/mol) and active residue mapping.",
        },
        {
          title: "Phytochemical Fingerprint Matrix",
          desc: "HPLC-MS and UV-vis spectrum library cross-referencing pure isolates, alkaloids, and flavonoids.",
        },
        {
          title: "Formulation & Synergy Modeling",
          desc: "Algorithmic synergy index calculation to detect bioactive compound potentiators in herbal extracts.",
        },
      ],
      metrics: [
        { label: "Docking Simulations", value: "18,500+" },
        { label: "Human Targets", value: "640+" },
        { label: "Bioassay Logs", value: "142,000+" },
      ],
      ctaText: "Launch Researcher Workbench",
      ctaLink: "#workbench",
    },
    {
      id: "experts",
      title: "Health Professionals & Reviewers",
      role: "Evidence Appraisal & Clinical Consensus",
      icon: Stethoscope,
      badge: "Clinical Reviewer Perspective",
      badgeColor: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
      headline: "Review scientific evidence, safety margins, research findings, and clinical claims.",
      description:
        "Medical doctors, clinical toxicologists, and pharmacologists systematically review trial quality using GRADE criteria, evaluate adverse reaction registries, and sign off on verified therapeutic monographs.",
      features: [
        {
          title: "GRADE Evidence Synthesis",
          desc: "Systematic grading of randomized clinical trials and observational human cohort studies.",
        },
        {
          title: "Dual 4-Eye Review Consensus",
          desc: "Requires independent sign-offs from both a primary pharmacognosist and a secondary clinical toxicologist.",
        },
        {
          title: "Toxicology & Safety Clearinghouse",
          desc: "Evaluation of hepatic safety, renal clearance, pediatric windows, and maternal precautions.",
        },
      ],
      metrics: [
        { label: "Board Certified Reviewers", value: "480+" },
        { label: "Monographs Approved", value: "320+" },
        { label: "Consensus Rate", value: "98.4%" },
      ],
      ctaText: "View Reviewer Criteria",
      ctaLink: "#governance",
    },
  ];

  const current = perspectives.find((p) => p.id === activeTab) || perspectives[0];

  return (
    <section id="perspectives" className="py-24 bg-[#faf9f5] relative overflow-hidden border-t border-[#dde6df]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-[#edf2ee] border border-[#dde6df] px-3.5 py-1.5 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#0d9488]" />
            <span className="text-xs font-bold text-[#164533] uppercase tracking-wide">
              Ecosystem Triad
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            One Platform. Three Perspectives.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475550] leading-relaxed">
            NatureAide harmonizes community wellness, computational laboratory research, and certified clinical review under one rigorous standard.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {perspectives.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? "bg-[#0f2c20] text-white border-[#0f2c20] shadow-md shadow-[#0f2c20]/15 scale-[1.02]"
                    : "bg-white text-[#2f3a35] border-[#dde6df] hover:border-[#9cb5a1] hover:bg-[#edf2ee]/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#ccfbf1]" : "text-[#1e5c44]"}`} />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Perspective Details Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="bg-white rounded-3xl border border-[#dde6df] shadow-xl overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              
              {/* Left Column: Simulated Interactive Role HUD */}
              <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-[#f6f8f6] via-[#faf9f5] to-[#edf2ee]/40 border-b lg:border-b-0 lg:border-r border-[#dde6df] flex flex-col justify-between">
                
                {/* HUD Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6] animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-wider text-[#1e5c44] font-bold">
                      Interactive Role Preview
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${current.badgeColor}`}>
                    {current.badge}
                  </span>
                </div>

                {/* Perspective View 1: Community App Interface Simulation */}
                {activeTab === "community" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="bg-white rounded-2xl p-5 border border-[#dde6df] shadow-md">
                      <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-[#0d9488]" />
                          <span className="text-xs font-bold text-[#0f2c20]">NaturAide Citizen Mobile Guide</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Active Monograph: Zingiber
                        </span>
                      </div>

                      {/* Interactive Dose Slider */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#475550]">Standard Decoction Servings:</span>
                          <span className="font-bold font-mono text-[#0f2c20] bg-[#edf2ee] px-2 py-0.5 rounded">
                            {decoctionServings} cups ({(decoctionServings * 6).toFixed(0)}g fresh rhizome)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="4"
                          value={decoctionServings}
                          onChange={(e) => setDecoctionServings(parseInt(e.target.value))}
                          className="w-full accent-[#0d9488] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-[#78997f]">
                          <span>1 cup (mild)</span>
                          <span>2 cups (therapeutic)</span>
                          <span>4 cups (max daily safe)</span>
                        </div>
                      </div>

                      {/* Safety Alert Badge */}
                      <div className="mt-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex items-start gap-2 text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Herb-Drug Interaction Check: Clear</span>
                          <span className="text-[11px] text-amber-800">
                            No CYP3A4 conflicts detected at this dosage level. Avoid if taking high-dose warfarin.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-[#dde6df] flex items-center justify-between text-xs text-[#2f3a35]">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0d9488]" />
                        Ethnobotanical Voucher ID #KEW-POWO-8914
                      </span>
                      <span className="font-mono text-[#0d9488] font-bold">Verified</span>
                    </div>
                  </motion.div>
                )}

                {/* Perspective View 2: Researcher In-Silico Docking View */}
                {activeTab === "researchers" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="bg-[#121815] text-white rounded-2xl p-5 border border-[#2f3a35] shadow-md">
                      <div className="flex items-center justify-between pb-3 border-b border-[#24332c] text-xs font-mono">
                        <span className="text-[#14b8a6]">AutoDock Vina Engine v1.2</span>
                        <span className="text-emerald-400">RMSD: 0.82 Å</span>
                      </div>

                      <div className="py-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#9cb5a1]">Ligand Compound:</span>
                          <span className="font-mono text-white font-bold">[6]-Gingerol (MW: 294.38)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#9cb5a1]">Target Protein:</span>
                          <span className="font-mono text-[#2dd4bf] font-bold">COX-2 (PDB: 5KIR)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#9cb5a1]">Binding Affinity (ΔG):</span>
                          <span className="font-mono text-emerald-400 font-extrabold text-sm">-8.64 kcal/mol</span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#0c120f] rounded-xl border border-[#24332c] text-[11px] font-mono text-[#9cb5a1] space-y-1">
                        <div className="text-amber-400">&gt; Hydrogen Bond: Arg120 (-2.4 kcal)</div>
                        <div className="text-amber-400">&gt; Hydrogen Bond: Tyr355 (-1.9 kcal)</div>
                        <div className="text-teal-300">&gt; Hydrophobic stabilization: Val523</div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-[#dde6df] flex items-center justify-between text-xs text-[#2f3a35]">
                      <span className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-[#0d9488]" />
                        HPLC-DAD Peak Veracity Standard
                      </span>
                      <span className="font-mono text-[#0d9488] font-bold">98.4% Purity</span>
                    </div>
                  </motion.div>
                )}

                {/* Perspective View 3: Expert Reviewer GRADE View */}
                {activeTab === "experts" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="bg-white rounded-2xl p-5 border border-[#dde6df] shadow-md space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
                        <span className="text-xs font-bold text-[#0f2c20]">GRADE Evidence Appraisal Matrix</span>
                        <span className="text-xs font-mono font-bold bg-[#0f2c20] text-white px-2 py-0.5 rounded">
                          Level A+
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between p-2 rounded-lg bg-[#faf9f5] border border-[#dde6df]">
                          <span className="font-semibold text-[#0f2c20]">Human RCTs Evaluated</span>
                          <span className="font-mono text-[#0d9488] font-bold">18 Studies (n=1,420)</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-lg bg-[#faf9f5] border border-[#dde6df]">
                          <span className="font-semibold text-[#0f2c20]">Cochrane Risk of Bias</span>
                          <span className="font-mono text-emerald-700 font-bold">Low Risk</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-lg bg-[#faf9f5] border border-[#dde6df]">
                          <span className="font-semibold text-[#0f2c20]">Consensus Reviewers</span>
                          <span className="font-mono text-[#0f2c20] font-bold">2 MDs + 2 PhD Pharmacognosists</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-teal-950 flex items-center justify-between">
                        <span>4-Eye Consensus Protocol Signed</span>
                        <BadgeCheck className="w-4 h-4 text-teal-700" />
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-[#dde6df] flex items-center justify-between text-xs text-[#2f3a35]">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#0d9488]" />
                        Official DOI Minted & Published
                      </span>
                      <span className="font-mono text-[#0d9488] font-bold">10.1038/s41598</span>
                    </div>
                  </motion.div>
                )}

                {/* Bottom Trust Line */}
                <div className="pt-4 border-t border-[#dde6df] flex items-center justify-between text-[11px] text-[#78997f]">
                  <span>Scientific Veracity Checked</span>
                  <span className="font-mono font-bold text-[#0f2c20]">Reproducible 99.4%</span>
                </div>

              </div>

              {/* Right Column: Perspective Copy & Feature Highlights */}
              <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${current.badgeColor}`}>
                      {current.badge}
                    </span>
                    <span className="text-xs text-[#6b7c76] font-medium">
                      {current.role}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#0f2c20] leading-snug mb-3">
                    {current.headline}
                  </h3>

                  <p className="text-sm text-[#475550] leading-relaxed mb-6">
                    {current.description}
                  </p>

                  <div className="space-y-3.5 mb-8">
                    {current.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#0f2c20]">
                            {feat.title}
                          </h4>
                          <p className="text-xs text-[#6b7c76] mt-0.5 leading-relaxed">
                            {feat.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metrics Bar & Action */}
                <div className="pt-6 border-t border-[#dde6df] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    {current.metrics.map((m, idx) => (
                      <div key={idx}>
                        <p className="font-heading font-extrabold text-base sm:text-lg text-[#0f2c20]">
                          {m.value}
                        </p>
                        <p className="text-[10px] text-[#6b7c76]">
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <a
                    href={current.ctaLink}
                    className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#0f2c20] hover:bg-[#164533] px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    <span>{current.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
