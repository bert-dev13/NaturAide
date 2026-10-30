"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Globe } from "lucide-react";

export function SimpleFooter() {
  const currentYear = 2026;

  const links = [
    { label: "Community", href: "#users" },
    { label: "Researchers", href: "#users" },
    { label: "Health Professionals", href: "#users" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ];

  return (
    <footer className="bg-[#faf8f5] text-[#2d3a33] pt-14 pb-12 border-t border-[#e2ebe4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top: Logo & Simple Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-10 border-b border-[#e2ebe4]">
          {/* NaturAide Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-white p-0.5 border border-[#e2ebe4] shadow-2xs">
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide logo"
                width={32}
                height={32}
                className="object-contain w-full h-full"
              />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-[#143d2b]">
              NaturAide
            </span>
          </Link>

          {/* Clean Simple Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold text-[#4a5a50]">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-[#143d2b] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Short Medical & Educational Disclaimer */}
        <div className="my-8 p-4 sm:p-5 rounded-2xl bg-white border border-[#e2ebe4] text-xs leading-relaxed text-[#5a6a60] flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            NaturAide provides educational and research information and does not replace professional medical advice. Always consult a qualified healthcare professional regarding any medical condition or before starting any herbal regimen.
          </p>
        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#78a386] gap-2">
          <p>© {currentYear} NaturAide. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-[#16a34a]" />
            Evidence-Based Herbal Research for Everyone
          </p>
        </div>

      </div>
    </footer>
  );
}
