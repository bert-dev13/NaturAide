"use client";

import React from "react";
import { 
  Award, 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight,
  Stethoscope,
  Microscope,
  FileCheck2,
  BookOpen
} from "lucide-react";
import { EXPERT_REVIEWERS } from "@/data/plantData";

export function ExpertReviewers() {
  const reviewerDomains = [
    {
      title: "Pharmacognosy & Phytochemistry",
      icon: Microscope,
      desc: "Isolation, structural elucidation (NMR, MS), and quantification of secondary plant metabolites.",
    },
    {
      title: "Clinical Toxicology & Safety",
      icon: ShieldCheck,
      desc: "Therapeutic window evaluation, organ-specific toxicity margins, and CYP450 drug interaction screening.",
    },
    {
      title: "Ethnobotany & Indigenous Knowledge",
      icon: BookOpen,
      desc: "Provenance attribution, ethical Nagoya Protocol adherence, and traditional decoction documentation.",
    },
    {
      title: "Integrative Clinical Medicine",
      icon: Stethoscope,
      desc: "Double-blind randomized controlled trial appraisal and GRADE evidence certainty synthesis.",
    },
  ];

  return (
    <section id="reviewers" className="py-24 bg-[#faf9f5] relative overflow-hidden border-t border-[#dde6df]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#f4ece0] border border-[#ecdcc8] px-3.5 py-1.5 rounded-full mb-4">
            <Award className="w-3.5 h-3.5 text-[#0f2c20]" />
            <span className="text-xs font-bold text-[#0f2c20] uppercase tracking-wide">
              Peer Review Board & Accreditation
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            Independent Scientific Peer Review Panels
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475550] leading-relaxed">
            Every herbal monograph undergoes rigorous double-blind evaluation by certified academic pharmacologists, clinicians, and ethnobotanists before publication.
          </p>
        </div>

        {/* 4 Core Review Disciplines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {reviewerDomains.map((dom, idx) => {
            const Icon = dom.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-[#dde6df] shadow-xs hover:border-[#9cb5a1] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#edf2ee] text-[#1e5c44] flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#0f2c20] leading-snug mb-1.5">
                  {dom.title}
                </h3>
                <p className="text-xs text-[#6b7c76] leading-relaxed">
                  {dom.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Optional featured profiles — only when role cards are configured (no hardcoded doctor names) */}
        {EXPERT_REVIEWERS.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {EXPERT_REVIEWERS.map((rev, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-[#dde6df] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f2c20] to-[#1e5c44] text-[#ccfbf1] font-heading font-extrabold flex items-center justify-center text-sm shadow-sm">
                      {rev.avatarText}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d9488] block">
                        Board Certified
                      </span>
                      <h4 className="text-sm font-bold text-[#0f2c20] leading-tight">
                        {rev.name}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-[#164533] mb-1">
                    {rev.role}
                  </p>
                  <p className="text-[11px] text-[#6b7c76] leading-relaxed mb-3">
                    {rev.institution}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#edf2ee] flex items-center justify-between text-xs">
                  <span className="text-[#6b7c76]">Verified Monograph Sign-Offs</span>
                  <span className="font-mono font-bold text-[#0f2c20]">{rev.verifiedReviews}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4-Eye Review Process Callout */}
        <div className="bg-gradient-to-br from-[#edf2ee] to-white rounded-3xl p-6 sm:p-8 border border-[#c4d4c7] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#0d9488]" />
              <h3 className="text-lg sm:text-xl font-heading font-bold text-[#0f2c20]">
                The NatureAide 4-Eye Consensus Protocol
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#475550] leading-relaxed">
              No claim or dosage instruction is approved without dual independent sign-off from both a primary pharmacognosy reviewer and a secondary clinical toxicologist.
            </p>
          </div>

          <button
            onClick={() => alert("Reviewer accreditation portal opening soon.")}
            className="shrink-0 px-5 py-3 rounded-xl bg-[#0f2c20] hover:bg-[#164533] text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4 text-[#ccfbf1]" />
            <span>Apply to Join Reviewer Board</span>
          </button>
        </div>

      </div>
    </section>
  );
}
