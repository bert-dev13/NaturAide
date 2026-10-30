"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  FlaskConical, 
  Users, 
  Sparkles, 
  GraduationCap, 
  Lock, 
  Globe2, 
  ShieldAlert, 
  Sprout, 
  CheckCircle2, 
  FileText,
  HeartHandshake
} from "lucide-react";

export function GovernanceAndCta() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const currentYear = 2026;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  const workflowSteps = [
    {
      step: "01",
      title: "Ethnobotanical Intake",
      desc: "Document traditional preparation recipes, folk indications, and botanical vouchers with ethical attribution.",
    },
    {
      step: "02",
      title: "In-Silico Docking",
      desc: "Screen bioactive secondary metabolites against human receptor targets via AutoDock Vina calculations.",
    },
    {
      step: "03",
      title: "Laboratory Standardization",
      desc: "Validate extract fingerprints via HPLC-MS, cytotoxicity assays, and heavy metal toxicology clearance.",
    },
    {
      step: "04",
      title: "Double-Blind Review",
      desc: "Dual independent sign-offs by certified pharmacologists to publish immutable open-access monographs.",
    },
  ];

  const footerSections = [
    {
      title: "Scientific Platform",
      links: [
        { label: "Botanical Taxa Index", href: "#workbench" },
        { label: "In-Silico Docking Cluster", href: "#workbench" },
        { label: "HPLC Spectral Library", href: "#workbench" },
        { label: "Bioassay Target Mapping", href: "#workbench" },
      ],
    },
    {
      title: "Evidence & Standards",
      links: [
        { label: "GRADE Evidence Framework", href: "#governance" },
        { label: "WHO Monograph Crosswalk", href: "#hero" },
        { label: "COPE Peer-Review Protocol", href: "#governance" },
        { label: "Nagoya Protocol Adherence", href: "#" },
      ],
    },
    {
      title: "Community & Practice",
      links: [
        { label: "Preparation & Decoction Ratios", href: "#perspectives" },
        { label: "Herb-Drug Interaction Check", href: "#perspectives" },
        { label: "Ethnobotanical Heritage Log", href: "#perspectives" },
        { label: "Community Forum & Notes", href: "#" },
      ],
    },
    {
      title: "Governance & Ethics",
      links: [
        { label: "Conflict of Interest Registry", href: "#" },
        { label: "Editorial & Review Board", href: "#governance" },
        { label: "Terms of Scientific Use", href: "#" },
        { label: "Privacy Policy", href: "#" },
      ],
    },
  ];

  return (
    <section id="governance" className="pt-20 pb-12 bg-white relative overflow-hidden border-t border-[#dde6df]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#f4ece0] border border-[#ecdcc8] px-3.5 py-1.5 rounded-full mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0f2c20]" />
            <span className="text-xs font-bold text-[#0f2c20] uppercase tracking-wide">
              Scientific Pipeline & Consensus
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            From Traditional Knowledge to Scientific Evidence
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475550] leading-relaxed">
            Our 4-stage empirical pathway bridges centuries of botanical practice with computational precision and double-blind clinical consensus.
          </p>
        </div>

        {/* 4-Step Pipeline Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {workflowSteps.map((st, idx) => (
            <div
              key={idx}
              className="bg-[#faf9f5] p-5 rounded-3xl border border-[#dde6df] hover:border-[#0d9488] transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-mono font-bold text-[#0d9488] bg-[#ccfbf1] px-2.5 py-1 rounded-md inline-block mb-3">
                  STAGE {st.step}
                </span>
                <h4 className="text-base font-heading font-bold text-[#0f2c20] mb-1.5">
                  {st.title}
                </h4>
                <p className="text-xs text-[#6b7c76] leading-relaxed">
                  {st.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#dde6df]/80 flex items-center justify-between text-[11px] font-medium text-[#164533]">
                <span>Verified Deliverable</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0d9488]" />
              </div>
            </div>
          ))}
        </div>

        {/* Dual CTA Callout Banner */}
        <div className="bg-gradient-to-br from-[#0f2c20] via-[#164533] to-[#091a13] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden mb-20 border border-[#297a5b]/40">
          <div className="absolute inset-0 molecular-grid opacity-15 pointer-events-none" />
          
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ccfbf1] bg-white/10 px-3 py-1 rounded-full border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#14b8a6]" />
              Join the Herbal Bioscience Initiative
            </span>

            <h3 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">
              Begin Exploring Evidence-Based Herbal Medicine Today
            </h3>

            <p className="text-sm sm:text-base text-[#c4d4c7] max-w-2xl mx-auto leading-relaxed">
              Whether you are looking for safe community preparation advice or seeking high-throughput computational tools for natural product screening — NatureAide provides the gold standard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-left">
              <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center mb-3">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-heading font-bold text-white mb-1">
                    For Community & Practitioners
                  </h4>
                  <p className="text-xs text-[#c4d4c7] leading-relaxed mb-4">
                    Access free peer-reviewed monographs, safe traditional recipes, and instant herb-drug interaction alerts.
                  </p>
                </div>
                <a
                  href="#workbench"
                  className="inline-flex items-center justify-between text-xs font-semibold text-white bg-white/20 hover:bg-white/30 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <span>Explore Public Monographs</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#ccfbf1]" />
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-[#14b8a6] text-[#0f2c20] flex items-center justify-center mb-3">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-heading font-bold text-white mb-1">
                    For Bioscience Researchers & Labs
                  </h4>
                  <p className="text-xs text-[#c4d4c7] leading-relaxed mb-4">
                    Request research credentials for in-silico AutoDock screening, HPLC spectral exports, and collaboration.
                  </p>
                </div>
                <a
                  href="#workbench"
                  className="inline-flex items-center justify-between text-xs font-semibold text-[#0f2c20] bg-[#14b8a6] hover:bg-[#2dd4bf] px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                >
                  <span>Request Workbench Access</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0f2c20]" />
                </a>
              </div>
            </div>

            {/* Newsletter Dispatch */}
            <div className="pt-6 border-t border-white/10 max-w-lg mx-auto">
              <p className="text-xs text-[#ccfbf1] mb-2.5 font-medium">
                Subscribe to Monthly Botanical Research & Monograph Dispatches
              </p>
              {subscribed ? (
                <div className="p-2.5 rounded-xl bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-[#14b8a6]" />
                  <span>Thank you! You are subscribed to NatureAide dispatches.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your institutional email..."
                    className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/60 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-[#14b8a6]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-[#0f2c20] hover:bg-[#edf2ee] rounded-xl text-xs font-bold transition-colors shrink-0"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Footer & Medical Disclaimer */}
        <div className="pt-10 border-t border-[#dde6df]">
          {/* Footer Brand Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-[#edf2ee]">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white shadow-xs p-0.5 border border-[#dde6df]">
                <Image
                  src="/images/nature-logo.png"
                  alt="NatureAide logo"
                  width={36}
                  height={36}
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-[#0f2c20]">
                NatureAide
              </span>
            </Link>
            <p className="text-xs text-[#6b7c76] max-w-md">
              The premier open-science botanical research platform connecting ancestral herbal knowledge, in-silico computational chemistry, and double-blind clinical evidence.
            </p>
          </div>

          {/* Footer Navigation Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10">
            {footerSections.map((sec, idx) => (
              <div key={idx} className="space-y-2.5">
                <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0f2c20]">
                  {sec.title}
                </h5>
                <ul className="space-y-1.5 text-xs text-[#6b7c76]">
                  {sec.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <a href={link.href} className="hover:text-[#0d9488] transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Prominent Medical & Educational Disclaimer */}
          <div className="p-5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] text-xs leading-relaxed text-[#6b7c76] mb-8">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#0f2c20] block mb-1">
                  Medical, Regulatory & Educational Disclaimer
                </span>
                <p>
                  NatureAide is an academic, biomedical, and ethnobotanical research indexing platform. Botanical monographs, in-silico docking scores, and traditional preparation guidance are provided strictly for academic research and educational inquiry. This platform does not provide medical advice, diagnosis, or prescription treatments. Always consult a qualified physician or healthcare professional before taking herbal supplements or modifying any medication regimen.
                </p>
              </div>
            </div>
          </div>

          {/* Copyright & System Status */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6b7c76] gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>BioDock Cluster Operational: 99.98%</span>
              <span>•</span>
              <span>© {currentYear} NatureAide Initiative. Open Access CC BY-NC 4.0.</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Globe2 className="w-3 h-3 text-[#0d9488]" />
                Kew & ChEMBL Compliant
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#0d9488]" />
                Immutable Provenance
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
