"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import ResearcherNavSections from "./ResearcherNavSections";

export default function ResearcherHeader({
  user,
}: {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#dde6df] px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-[#0f2c20] hover:bg-[#f6f8f6] border border-[#dde6df] cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand on Top Bar */}
          <Link href="/researcher" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-white p-0.5 border border-[#dde6df] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <span className="font-heading font-extrabold text-base tracking-tight text-[#0f2c20]">
              NaturAide <span className="text-xs font-bold text-emerald-700">Lab</span>
            </span>
          </Link>

          {/* Desktop Breadcrumbs / Context */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-[#6b7c76]">
            <span className="font-bold text-[#1e5c44]">Scientific Research Platform</span>
            <span>/</span>
            <span className="font-medium text-[#131b17]">Workbench</span>
          </div>
        </div>

        {/* Quick Actions Header Right */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/researcher/assistant"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold text-emerald-950 bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-300/70 shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ask NatureAide</span>
            <span className="sm:hidden">Assistant</span>
          </Link>

          <Link
            href="/researcher/projects?new=true"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold text-white bg-[#0f2c20] hover:bg-[#1e5c44] shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>New Research</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#dde6df]">
            <Link
              href="/researcher/profile"
              className="flex items-center gap-2 text-xs font-bold text-[#0f2c20] hover:text-emerald-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#edf2ee] text-[#1e5c44] flex items-center justify-center font-bold text-xs border border-[#dde6df]">
                {user.name.charAt(0)}
              </div>
              <span className="hidden md:inline">{user.name}</span>
            </Link>
          </div>

          <LogoutButton
            iconOnly
            className="p-2 rounded-xl text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
          />
        </div>
      </header>

      {/* MOBILE DRAWER / SHEET */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-[290px] max-w-[85vw] bg-gradient-to-b from-[#092218] via-[#0d2a1f] to-[#071a12] text-white border-r border-[#1a4a37]/60 p-4 sm:p-5 flex flex-col justify-between shadow-2xl h-full animate-in slide-in-from-left duration-200">
            {/* Drawer Header (shrink-0) */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white p-1 border border-white/20 shrink-0 shadow-xs">
                  <Image
                    src="/images/nature-logo.png"
                    alt="NaturAide Logo"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <span className="font-heading font-extrabold text-base text-white">
                  NaturAide
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Start New Research Action (shrink-0) */}
            <div className="py-3 shrink-0">
              <Link
                href="/researcher/projects?new=true"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#072015] font-heading font-extrabold text-xs shadow-md shadow-emerald-950/40"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>+ Start New Research</span>
              </Link>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto pr-1 pb-3 custom-scrollbar">
              <ResearcherNavSections onNavigate={() => setMobileOpen(false)} />
            </div>

            {/* User Profile & Sign Out Footer (shrink-0) */}
            <div className="pt-3 border-t border-white/10 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-emerald-300/80 font-semibold uppercase">Investigator</p>
                </div>
                <Link
                  href="/researcher/profile"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs font-bold text-emerald-400 hover:underline"
                >
                  Profile
                </Link>
              </div>
              <LogoutButton
                label="Sign Out"
                className="w-full justify-center py-2 px-3 rounded-xl text-xs font-bold text-rose-200 bg-rose-950/60 border border-rose-800 hover:bg-rose-900/80"
              />
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
