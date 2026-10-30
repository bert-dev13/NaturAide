"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  Dna, 
  FlaskConical, 
  Sparkles, 
  Globe2, 
  Database, 
  FileCheck2, 
  Award,
  CheckCircle2,
  Activity,
  Atom,
  ChevronRight
} from "lucide-react";

export function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const suggestedQueries = [
    "Withania somnifera (Ashwagandha)",
    "Curcumin & NF-κB binding",
    "Berberine AMPK activation",
    "Centella asiatica BDNF synthesis",
  ];

  const credentials = [
    { icon: Globe2, label: "Kew Gardens POWO", sub: "Accepted Nomenclature" },
    { icon: Database, label: "ChEMBL & PubChem", sub: "Bioactivity Records" },
    { icon: FileCheck2, label: "WHO Monographs", sub: "Standardized Baseline" },
    { icon: Award, label: "GRADE Framework", sub: "Evidence Certainty" },
    { icon: ShieldCheck, label: "COPE Protocol", sub: "Peer Review Integrity" },
  ];

  return (
    <section id="hero" className="relative min-h-[92vh] flex flex-col justify-between pt-32 pb-16 overflow-hidden">
      
      {/* BACKGROUND IMAGE WITH ATMOSPHERIC FILTER & OPACITY */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/images/hero.png"
          alt="NatureAide botanical research landscape with biodome and mountains"
          fill
          priority
          className="object-cover object-center transform scale-105 filter brightness-90 contrast-110 transition-transform duration-1000 ease-out"
          sizes="100vw"
        />

        {/* Sophisticated Multi-Stop Dark Botanical Gradient & Frosted Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06140e]/90 via-[#0a2318]/78 to-[#071710]/95 backdrop-blur-[2px]" />

        {/* Subtle Radial Glow Spotlights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-radial from-[#14b8a6]/20 via-transparent to-transparent pointer-events-none blur-3xl" />
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-[#2dd4bf]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle Molecular Grid Lines */}
        <div className="absolute inset-0 molecular-grid opacity-30 pointer-events-none" />
      </div>

      {/* HERO MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading, Subtitle, Search Bar, CTAs */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full shadow-lg"
            >
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#14b8a6] ring-4 ring-[#14b8a6]/30 animate-pulse" />
              <span className="text-xs font-bold text-[#ccfbf1] tracking-wide uppercase">
                Evidence-Based Herbal Bioscience
              </span>
              <span className="text-white/40">|</span>
              <span className="text-xs font-medium text-white/90">
                WHO & Kew Gardens Aligned
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-extrabold text-white tracking-tight leading-[1.08]"
            >
              Where Nature Meets{" "}
              <span className="relative whitespace-nowrap">
                <span className="bg-gradient-to-r from-[#5eead4] via-[#2dd4bf] to-[#a7f3d0] bg-clip-text text-transparent drop-shadow-sm">
                  Scientific Evidence.
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full text-[#14b8a6]/50"
                  height="10"
                  viewBox="0 0 200 10"
                  fill="none"
                >
                  <path
                    d="M1 7C50 2 150 2 199 7"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg lg:text-xl text-[#d1e0d7] max-w-2xl leading-relaxed font-normal"
            >
              NatureAide bridges ancestral ethnobotanical wisdom, in-silico computational chemistry,
              laboratory bioassays, and certified peer review into one transparent research platform.
            </motion.p>

            {/* Interactive Query Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="max-w-2xl pt-2"
            >
              <div className="bg-[#0b1b14]/85 backdrop-blur-xl rounded-2xl p-2.5 sm:p-3 border border-white/20 shadow-2xl focus-within:border-[#14b8a6] focus-within:ring-2 focus-within:ring-[#14b8a6]/25 transition-all">
                <div className="flex items-center gap-2.5 px-2">
                  <Search className="w-5 h-5 text-[#14b8a6] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Query botanical taxa, phytochemical isolates, or receptor targets..."
                    className="w-full text-xs sm:text-sm text-white placeholder-white/50 bg-transparent outline-none"
                  />
                  <a
                    href="#workbench"
                    className="shrink-0 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:from-[#2dd4bf] hover:to-[#14b8a6] text-[#06140e] font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Analyze</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Suggested query chips */}
                <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 px-2">
                  <span className="text-[11px] font-medium text-white/60">Try querying:</span>
                  {suggestedQueries.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSearchQuery(item)}
                      className="text-[11px] font-medium text-[#ccfbf1] bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-lg border border-white/10 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Quick Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <a
                href="#workbench"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#06140e] bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] hover:from-[#2dd4bf] hover:to-[#5eead4] px-5 py-3 rounded-xl shadow-lg shadow-teal-900/30 transition-all hover:translate-y-[-1px]"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Launch Research Workbench</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#perspectives"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 rounded-xl backdrop-blur-md transition-all"
              >
                <span>Explore Three Perspectives</span>
                <ChevronRight className="w-4 h-4 text-[#ccfbf1]" />
              </a>
            </motion.div>

          </div>

          {/* Right Column: Floating High-Tech Evidence HUD Cards */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* HUD Card 1: In-Silico Docking */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="bg-[#0b1e16]/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden group hover:border-[#14b8a6]/50 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#14b8a6]/20 border border-[#14b8a6]/30 text-[#2dd4bf] flex items-center justify-center shrink-0">
                  <Dna className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#14b8a6] font-bold">
                      In-Silico Docking
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-[#14b8a6]/20 text-[#2dd4bf] px-2 py-0.5 rounded-full border border-[#14b8a6]/30">
                      -8.9 kcal/mol
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    Curcumin → NF-κB p65
                  </h4>
                  <p className="text-xs text-[#a3b8ad] mt-0.5 leading-relaxed">
                    Arg33 active catalytic cleft binding with sub-micromolar inhibitory stability.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* HUD Card 2: Clinical GRADE Consensus */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="bg-[#0b1e16]/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden group hover:border-[#14b8a6]/50 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                      Clinical GRADE Review
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Grade A+
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    Multi-Specialist Sign-Off
                  </h4>
                  <div className="flex items-center justify-between text-xs text-[#a3b8ad] mt-1">
                    <span>Pharmacognosy & Toxicological Consensus</span>
                    <span className="font-mono text-emerald-300 font-bold">98.4%</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-400 to-[#14b8a6] h-full rounded-full" style={{ width: "98.4%" }} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* HUD Card 3: Database Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="bg-[#0b1e16]/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white/20 shadow-2xl grid grid-cols-3 gap-2 text-center"
            >
              <div>
                <p className="font-heading font-extrabold text-lg sm:text-xl text-white">1,420+</p>
                <p className="text-[10px] text-[#a3b8ad]">Plant Taxa</p>
              </div>
              <div className="border-x border-white/10">
                <p className="font-heading font-extrabold text-lg sm:text-xl text-[#2dd4bf]">18,500+</p>
                <p className="text-[10px] text-[#a3b8ad]">Bioassays</p>
              </div>
              <div>
                <p className="font-heading font-extrabold text-lg sm:text-xl text-emerald-300">480+</p>
                <p className="text-[10px] text-[#a3b8ad]">Reviewers</p>
              </div>
            </motion.div>

          </div>

        </div>
      </div>

      {/* INTEGRATED TRUST STRIP AT HERO BASE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mt-12">
        <div className="pt-6 border-t border-white/15">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {credentials.map((cred, idx) => {
              const Icon = cred.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-[#2dd4bf] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{cred.label}</p>
                    <p className="text-[10px] text-[#a3b8ad] truncate">{cred.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </section>
  );
}
