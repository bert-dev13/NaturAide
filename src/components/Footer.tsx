"use client";

import React from "react";
import Link from "next/link";
import { 
  Sprout, 
  Atom, 
  ShieldAlert, 
  ExternalLink, 
  CheckCircle2,
  Lock,
  Globe2
} from "lucide-react";

export function Footer() {
  const currentYear = 2026;

  const footerSections = [
    {
      title: "Scientific Platform",
      links: [
        { label: "Botanical Taxa Index", href: "#plants" },
        { label: "In-Silico Docking Cluster", href: "#workbench" },
        { label: "HPLC & MS Spectral Library", href: "#workbench" },
        { label: "Bioassay Target Mapping", href: "#workbench" },
        { label: "Public GraphQL & REST API", href: "#" },
      ],
    },
    {
      title: "Research & Evidence",
      links: [
        { label: "GRADE Evidence Standard", href: "#workflow" },
        { label: "WHO Monograph Crosswalk", href: "#evidence" },
        { label: "COPE Review Protocol", href: "#reviewers" },
        { label: "Institutional Partnerships", href: "#" },
        { label: "Open Access Policy", href: "#" },
      ],
    },
    {
      title: "Community & Practice",
      links: [
        { label: "Decoction & Tincture Guides", href: "#perspectives" },
        { label: "Herb-Drug Interaction Check", href: "#perspectives" },
        { label: "Ethnobotanical Heritage Log", href: "#perspectives" },
        { label: "Practitioner Directory", href: "#" },
        { label: "Community Forum", href: "#" },
      ],
    },
    {
      title: "Governance & Ethics",
      links: [
        { label: "Nagoya Protocol Compliance", href: "#" },
        { label: "COI & Funding Transparency", href: "#evidence" },
        { label: "Editorial & Review Board", href: "#reviewers" },
        { label: "Terms of Scientific Use", href: "#" },
        { label: "Privacy Policy", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-[#121815] text-[#edf2ee] pt-20 pb-12 border-t border-[#1f2924] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Links & Branding */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-16 border-b border-[#24332c]">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1e5c44] to-[#0f2c20] text-[#ccfbf1] flex items-center justify-center border border-[#297a5b]/50">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
                NaturAide
                <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" />
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-[#9cb5a1] leading-relaxed max-w-sm">
              The premier open-science botanical research platform connecting ancestral herbal knowledge, in-silico computational chemistry, and double-blind clinical evidence.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18231d] text-emerald-400 text-xs font-mono border border-[#27382f]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Cluster Operational: 99.98%
              </span>
            </div>
          </div>

          {/* Categorized Link Columns */}
          {footerSections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-white">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <a
                      href={link.href}
                      className="text-xs text-[#9cb5a1] hover:text-[#14b8a6] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Prominent Medical & Educational Disclaimer */}
        <div className="my-10 p-6 rounded-2xl bg-[#0b100d] border border-[#223028] text-xs leading-relaxed text-[#78997f]">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-bold text-white uppercase tracking-wider text-[11px]">
                Medical, Regulatory & Educational Disclaimer
              </p>
              <p>
                NaturAide is an academic, biomedical, and scientific research indexing platform. Information published across this platform — including botanical monographs, in-silico molecular docking scores, chemical formulas, and traditional preparation guides — is strictly for scientific research, educational exploration, and academic inquiry.
              </p>
              <p>
                This platform does NOT provide clinical medical diagnoses, prescribe medical treatments, or endorse self-medication. Herbal preparations possess active biochemical compounds that may interact with prescription pharmaceuticals or cause adverse reactions. Always seek the advice of a board-certified physician, clinical pharmacologist, or licensed healthcare professional before initiating any herbal regimen.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Standards */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6b7c76] gap-4">
          <p>© {currentYear} NaturAide Bioscience Research Initiative. Open Access under CC BY-NC 4.0.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[#9cb5a1]">
              <Globe2 className="w-3.5 h-3.5 text-[#14b8a6]" />
              Kew POWO & ChEMBL Compliant
            </span>
            <span className="flex items-center gap-1.5 text-[#9cb5a1]">
              <Lock className="w-3.5 h-3.5 text-[#14b8a6]" />
              Cryptographic Citation Veracity
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
