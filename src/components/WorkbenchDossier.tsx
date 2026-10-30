"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu, 
  Dna, 
  FlaskConical, 
  BarChart3, 
  Layers, 
  Sparkles, 
  ChevronRight, 
  Filter, 
  ShieldCheck, 
  Sprout, 
  Bot, 
  Download,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { FEATURED_PLANTS, MedicinalPlant } from "@/data/plantData";
import { PlantModal } from "./PlantModal";

export function WorkbenchDossier() {
  const [activeTab, setActiveTab] = useState<"docking" | "phytochem" | "clinical" | "preparation">("docking");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedPlant, setSelectedPlant] = useState<MedicinalPlant | null>(null);
  const [aiPromptIdx, setAiPromptIdx] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const categories = [
    { id: "all", label: "All Curated Taxa" },
    { id: "adaptogen", label: "Adaptogens & Stress" },
    { id: "anti-inflammatory", label: "Anti-Inflammatory" },
    { id: "cognitive", label: "Cognitive & Nootropics" },
    { id: "metabolic", label: "Metabolic & Glycemic" },
  ];

  const filteredPlants =
    activeCategory === "all"
      ? FEATURED_PLANTS
      : FEATURED_PLANTS.filter((p) => p.category === activeCategory);

  const aiPrompts = [
    {
      query: "Analyze synergistic neuroprotection of Bacopa + Withania.",
      result: "Synergy Index: 1.42 (High). AChE inhibition (-7.8 kcal/mol) coupled with hippocampal BDNF up-regulation (+44%). No CYP2D6 competitive conflict.",
      confidence: "94.8% Confidence",
    },
    {
      query: "Screen Curcuminoids against TNF-α with Piperine co-formulation.",
      result: "Docking Affinity: -8.8 kcal/mol. Piperine co-administration inhibits intestinal glucuronidation, yielding +2000% bioavailability enhancement.",
      confidence: "99.1% Confidence",
    },
    {
      query: "Evaluate metabolic AMPK activation and CYP3A4 risk of Berberine.",
      result: "Direct Thr172 AMPK phosphorylation. Safe within 500-1500mg/day. Moderate reversible CYP3A4 inhibition; avoid with statins and in pregnancy.",
      confidence: "96.4% Confidence",
    },
  ];

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 900);
  };

  return (
    <section id="workbench" className="py-24 bg-[#faf9f5] relative overflow-hidden border-t border-[#dde6df]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-[#ccfbf1] border border-[#99f6e4] px-3.5 py-1.5 rounded-full mb-3">
            <Cpu className="w-3.5 h-3.5 text-[#0f766e]" />
            <span className="text-xs font-bold text-[#0f766e] uppercase tracking-wide">
              Research Workbench & Botanical Dossiers
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            Empirical Workbench & Curated Plant Monograph Index
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475550] leading-relaxed">
            Interact with computational in-silico screening tools, explore verified phytochemical spectra, and inspect peer-reviewed plant monographs.
          </p>
        </div>

        {/* Part 1: Interactive Workbench Terminal */}
        <div className="bg-[#121815] text-[#edf2ee] rounded-3xl border border-[#2f3a35] shadow-2xl overflow-hidden mb-16">
          {/* Workbench Top Bar */}
          <div className="bg-[#0b120f] px-5 py-3 border-b border-[#1f2924] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-[#9cb5a1] pl-2 border-l border-[#24332c]">
                natureaide-core/workbench v3.4.1
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#16221c] px-3 py-1 rounded-lg border border-[#23352b] text-xs font-mono">
              <span className="text-[#0d9488]">Taxon:</span>
              <span className="text-white italic">Zingiber officinale</span>
              <span className="text-[#6b7c76]">|</span>
              <span className="text-[#14b8a6]">Ligand: [6]-Gingerol</span>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="flex items-center gap-1.5 text-xs bg-[#0d9488] hover:bg-[#14b8a6] text-white px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
              <span>{isSimulating ? "Computing Docking..." : "Re-Calculate Docking"}</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="bg-[#151f1a] px-4 sm:px-6 border-b border-[#24332c] flex overflow-x-auto gap-2">
            {[
              { id: "docking", label: "In-Silico Docking Analysis", icon: Dna },
              { id: "phytochem", label: "Phytochemical Fingerprint (HPLC)", icon: FlaskConical },
              { id: "clinical", label: "Clinical Evidence (GRADE)", icon: BarChart3 },
              { id: "preparation", label: "Community Preparation Protocol", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? "border-[#14b8a6] text-white bg-[#1c2a23]"
                      : "border-transparent text-[#9cb5a1] hover:text-white hover:bg-[#19251f]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#14b8a6]" : "text-[#78997f]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Workbench Body */}
          <div className="p-5 sm:p-7 bg-[#121815]">
            <AnimatePresence mode="wait">
              {activeTab === "docking" && (
                <motion.div
                  key="docking"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-[#18231d] p-3.5 rounded-2xl border border-[#27382f]">
                      <span className="text-[11px] font-mono text-[#78997f]">Target Protein</span>
                      <p className="text-sm font-bold text-white mt-0.5">COX-2 (Cyclooxygenase-2)</p>
                      <span className="text-[10px] font-mono text-[#0d9488]">PDB: 5KIR | Human Isoform</span>
                    </div>

                    <div className="bg-[#18231d] p-3.5 rounded-2xl border border-[#27382f]">
                      <span className="text-[11px] font-mono text-[#78997f]">Binding Affinity</span>
                      <p className="text-base sm:text-lg font-mono font-extrabold text-[#14b8a6] mt-0.5">-8.64 kcal/mol</p>
                      <span className="text-[10px] text-emerald-400">High Thermodynamic Stability</span>
                    </div>

                    <div className="bg-[#18231d] p-3.5 rounded-2xl border border-[#27382f]">
                      <span className="text-[11px] font-mono text-[#78997f]">Inhibition Constant (Ki)</span>
                      <p className="text-base sm:text-lg font-mono font-extrabold text-white mt-0.5">462.8 nM</p>
                      <span className="text-[10px] text-[#9cb5a1]">Sub-micromolar Potency</span>
                    </div>

                    <div className="bg-[#18231d] p-3.5 rounded-2xl border border-[#27382f]">
                      <span className="text-[11px] font-mono text-[#78997f]">RMSD Conformation Fit</span>
                      <p className="text-base sm:text-lg font-mono font-extrabold text-white mt-0.5">0.82 Å</p>
                      <span className="text-[10px] text-teal-300">Optimal Active Site Fitting</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-7 bg-[#0b100d] rounded-2xl border border-[#24332c] p-4 flex flex-col justify-between min-h-[220px]">
                      <div className="flex items-center justify-between text-xs text-[#9cb5a1] mb-2">
                        <span className="font-mono flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          Simulated Active Pocket: Catalytic Hydrophobic Cleft
                        </span>
                        <span className="font-mono text-[#0d9488]">AutoDock Vina Engine</span>
                      </div>

                      <div className="py-4 flex items-center justify-center">
                        <svg className="w-full max-w-sm h-36 text-[#14b8a6]" viewBox="0 0 300 130">
                          <path
                            d="M 20 70 Q 70 15 150 25 T 280 80 Q 220 120 140 110 T 20 70"
                            fill="none"
                            stroke="#1e3a2b"
                            strokeWidth="2.5"
                            strokeDasharray="4 4"
                          />
                          <line x1="85" y1="40" x2="135" y2="65" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
                          <line x1="210" y1="45" x2="165" y2="65" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
                          <circle cx="85" cy="40" r="6" fill="#f59e0b" />
                          <text x="50" y="32" fill="#fcd34d" fontSize="9" fontFamily="monospace">Arg120 (H-Bond)</text>
                          <circle cx="210" cy="45" r="6" fill="#f59e0b" />
                          <text x="215" y="40" fill="#fcd34d" fontSize="9" fontFamily="monospace">Tyr355 (H-Bond)</text>
                          <rect x="130" y="55" width="40" height="20" rx="5" fill="#14b8a6" fillOpacity="0.4" stroke="#5eead4" strokeWidth="2" />
                          <text x="135" y="69" fill="#ffffff" fontSize="9" fontWeight="bold">[6]-Gingerol</text>
                        </svg>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#78997f] pt-2 border-t border-[#1a2820]">
                        <span>H-Bond Distances: 2.18 Å & 2.42 Å</span>
                        <span className="font-mono text-[#0d9488]">Auto-Optimized Docking</span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-3">
                      <div className="bg-[#18231d] p-4 rounded-2xl border border-[#27382f] text-xs">
                        <span className="text-[10px] font-mono uppercase text-[#78997f] block mb-2">Key Interacting Residues</span>
                        <div className="space-y-1.5">
                          <div className="flex justify-between p-2 rounded-lg bg-[#111a14]">
                            <span className="font-mono text-amber-300">Arg120</span>
                            <span className="text-[#9cb5a1]">Phenolic -OH Bond</span>
                            <span className="font-mono text-emerald-400 font-bold">-2.4 kcal</span>
                          </div>
                          <div className="flex justify-between p-2 rounded-lg bg-[#111a14]">
                            <span className="font-mono text-amber-300">Tyr355</span>
                            <span className="text-[#9cb5a1]">Alkyl Carbonyl Bond</span>
                            <span className="font-mono text-emerald-400 font-bold">-1.9 kcal</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#18231d] p-3.5 rounded-2xl border border-[#27382f] text-xs">
                        <span className="text-emerald-400 font-bold block mb-1">Pharmacological Action</span>
                        <p className="text-[#9cb5a1] leading-relaxed">
                          Selective suppression of pro-inflammatory PGE2 without the gastric ulceration risk of synthetic NSAIDs.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "phytochem" && (
                <motion.div
                  key="phytochem"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#18231d] p-5 rounded-2xl border border-[#27382f] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Reverse Phase HPLC Chromatogram</h4>
                      <p className="text-xs text-[#78997f]">C18 column (250 x 4.6 mm, 5 µm) | Standardized Purity: 98.4%</p>
                    </div>
                    <span className="text-xs font-mono text-[#0d9488] bg-[#0c1c16] px-2.5 py-1 rounded-md border border-[#1b3d30]">
                      Validated Spectrum
                    </span>
                  </div>

                  <div className="bg-[#0b100d] p-3 rounded-xl border border-[#23352b]">
                    <svg className="w-full h-28" viewBox="0 0 600 110">
                      <line x1="30" y1="90" x2="570" y2="90" stroke="#374151" strokeWidth="1" />
                      <path
                        d="M 30 90 L 140 90 Q 155 10 170 90 L 260 90 Q 275 35 290 90 L 370 90 Q 380 60 390 90 L 460 90 Q 470 25 480 90 L 570 90"
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth="2.5"
                      />
                      <text x="145" y="15" fill="#5eead4" fontSize="10" fontFamily="monospace">[6]-Gingerol (8.4m)</text>
                      <text x="260" y="35" fill="#9cb5a1" fontSize="9" fontFamily="monospace">[8]-Gingerol (14.2m)</text>
                      <text x="450" y="25" fill="#9cb5a1" fontSize="9" fontFamily="monospace">[6]-Shogaol (24.6m)</text>
                    </svg>
                  </div>
                </motion.div>
              )}

              {activeTab === "clinical" && (
                <motion.div
                  key="clinical"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#18231d] p-5 rounded-2xl border border-[#27382f] space-y-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-md">
                      GRADE Certainty: High (18 Double-Blind RCTs)
                    </span>
                    <span className="text-xs font-mono text-[#14b8a6]">p &lt; 0.001</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111a14] border border-[#24352b] flex justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">Osteoarthritis & Knee Joint Pain</p>
                      <p className="text-[#78997f] text-[11px]">Mean VAS pain reduction: -28.4 mm vs placebo</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">SMD: -0.78</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111a14] border border-[#24352b] flex justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">Anti-Emetic (Cochrane Reviewed)</p>
                      <p className="text-[#78997f] text-[11px]">1,000 mg/day divided standard</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">SMD: -0.92</span>
                  </div>
                </motion.div>
              )}

              {activeTab === "preparation" && (
                <motion.div
                  key="preparation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#18231d] p-5 rounded-2xl border border-[#27382f] space-y-3 text-xs"
                >
                  <h4 className="text-sm font-bold text-white">Standardized Decoction Protocol</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-[#111a14] rounded-xl border border-[#24352b]">
                      <span className="font-bold text-[#14b8a6] block mb-1">Preparation Ratios</span>
                      <p className="text-[#dde6df]">10-15g sliced fresh rhizome per 500mL purified water. Simmer covered on low heat 15-20 min.</p>
                    </div>
                    <div className="p-3.5 bg-[#111a14] rounded-xl border border-[#24352b]">
                      <span className="font-bold text-amber-400 block mb-1">Safety Contraindications</span>
                      <p className="text-[#dde6df]">Caution with high-dose warfarin or anticoagulants. Safe in pregnancy at ≤1g/day divided doses.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Part 2: Curated Medicinal Plant Monograph Cards */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-heading font-extrabold text-[#0f2c20]">
                Featured Botanical Monographs
              </h3>
              <p className="text-xs sm:text-sm text-[#475550]">
                Filter by therapeutic domain and inspect verified evidence dossiers.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    activeCategory === cat.id
                      ? "bg-[#0f2c20] text-white border-[#0f2c20]"
                      : "bg-white text-[#2f3a35] border-[#dde6df] hover:border-[#9cb5a1]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Plant Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPlants.map((plant) => (
              <div
                key={plant.id}
                className="bg-white rounded-3xl p-5 border border-[#dde6df] hover:border-[#0d9488] shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-[#78997f] uppercase">{plant.family}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold bg-[#edf2ee] text-[#1e5c44] px-2 py-0.5 rounded-full border border-[#c4d4c7]">
                        GRADE {plant.evidenceGrade}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-teal-50 text-[#0f766e] px-2 py-0.5 rounded-full border border-teal-200">
                        {plant.dockingScore}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-lg font-heading font-extrabold text-[#0f2c20] italic group-hover:text-[#0d9488] transition-colors">
                    {plant.scientificName}
                  </h4>
                  <p className="text-xs text-[#475550] mb-3">Common: {plant.commonName}</p>

                  <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#dde6df]/80 mb-3 space-y-1 text-xs">
                    <div className="flex justify-between text-[#2f3a35]">
                      <span className="text-[#6b7c76]">Active Compound:</span>
                      <span className="font-semibold truncate max-w-[150px]">{plant.activeCompounds[0]}</span>
                    </div>
                    <div className="flex justify-between text-[#2f3a35]">
                      <span className="text-[#6b7c76]">Target:</span>
                      <span className="font-semibold truncate max-w-[150px]">{plant.primaryTargets[0]}</span>
                    </div>
                    <div className="flex justify-between text-[#2f3a35]">
                      <span className="text-[#6b7c76]">Clinical Trials:</span>
                      <span className="font-bold text-[#0f2c20]">{plant.clinicalTrialsCount} Studies</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlant(plant)}
                  className="w-full py-2 rounded-xl text-xs font-bold text-[#0f2c20] bg-[#faf9f5] group-hover:bg-[#0f2c20] group-hover:text-white border border-[#dde6df] group-hover:border-[#0f2c20] transition-all flex items-center justify-center gap-1"
                >
                  <span>Inspect Full Monograph</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Part 3: AI Bio-Intelligence Quick Query */}
        <div className="mt-14 bg-gradient-to-br from-white to-[#f0fdfa]/60 rounded-3xl p-6 border border-[#99f6e4] shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0f2c20]">
                  NaturAide Bio-Intelligence Query Simulator
                </h4>
                <p className="text-[11px] text-[#475550]">
                  Grounded strictly in PubMed, ChEMBL, and Kew botanical records.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {aiPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setAiPromptIdx(idx)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors border ${
                    aiPromptIdx === idx
                      ? "bg-[#0f2c20] text-white border-[#0f2c20]"
                      : "bg-white text-[#2f3a35] border-[#dde6df] hover:border-[#9cb5a1]"
                  }`}
                >
                  Prompt {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#ccfbf1] text-xs space-y-1.5">
            <p className="font-semibold text-[#0f2c20]">
              &ldquo;{aiPrompts[aiPromptIdx].query}&rdquo;
            </p>
            <p className="text-[#3b4741] leading-relaxed">
              {aiPrompts[aiPromptIdx].result}
            </p>
            <span className="inline-block text-[10px] font-mono font-bold text-[#0d9488] bg-[#f0fdfa] px-2 py-0.5 rounded border border-[#ccfbf1] mt-1">
              {aiPrompts[aiPromptIdx].confidence}
            </span>
          </div>
        </div>

      </div>

      {/* Monograph Detail Modal */}
      <PlantModal plant={selectedPlant} onClose={() => setSelectedPlant(null)} />
    </section>
  );
}
