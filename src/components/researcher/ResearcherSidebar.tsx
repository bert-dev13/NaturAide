"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, ChevronLeft, ChevronRight, Database, ArrowRight } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import ResearcherNavSections from "./ResearcherNavSections";

export default function ResearcherSidebar({
  user,
}: {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex flex-col justify-between bg-gradient-to-b from-[#092218] via-[#0d2a1f] to-[#071a12] text-white border-r border-[#1a4a37]/60 h-screen sticky top-0 transition-all duration-300 z-30 select-none shadow-xl shrink-0 ${
        collapsed ? "w-20 px-2.5 py-4" : "w-[290px] px-4 py-5"
      }`}
    >
      {/* ================================================== */}
      {/* TOP SECTION: BRAND & MAIN NAV                      */}
      {/* ================================================== */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* LOGO & BRAND HEADER (Stable Top) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 shrink-0">
          <Link
            href="/researcher"
            className="flex items-center gap-3 overflow-hidden group"
            title="NaturAide Research Platform"
          >
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center shadow-md shadow-black/25 group-hover:scale-105 transition-transform">
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide Logo"
                width={28}
                height={28}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-extrabold text-[20px] tracking-tight text-white flex items-center gap-1.5 leading-tight">
                  NaturAide
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                </span>
                <span className="text-[10px] font-bold text-emerald-300/90 tracking-widest uppercase">
                  Research Platform
                </span>
              </div>
            )}
          </Link>

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 border border-white/10"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* PRIMARY ACTION: START NEW RESEARCH CTA */}
        <div className="mb-4 shrink-0">
          <Link
            href="/researcher/projects?new=true"
            className={`flex items-center justify-center gap-2 rounded-xl font-heading font-extrabold transition-all shadow-md shadow-emerald-950/40 ${
              collapsed
                ? "w-10 h-10 mx-auto bg-gradient-to-r from-emerald-500 to-teal-400 text-[#072015] hover:from-emerald-400 hover:to-teal-300"
                : "w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-[#072015] hover:from-emerald-400 hover:to-teal-300 text-xs tracking-wide"
            }`}
            title="Start New Research"
          >
            <PlusCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
            {!collapsed && <span>+ Start New Research</span>}
          </Link>
        </div>

        {/* INDEPENDENT SCROLLABLE NAVIGATION LIST */}
        <div className="flex-1 overflow-y-auto pr-1 pb-2 custom-scrollbar">
          <ResearcherNavSections collapsed={collapsed} />
        </div>
      </div>

      {/* ================================================== */}
      {/* BOTTOM SECTION: PROFILE CARD & SYSTEM STATUS       */}
      {/* ================================================== */}
      <div className="pt-3 border-t border-white/10 shrink-0 space-y-2.5">
        {!collapsed ? (
          <div className="space-y-2">
            {/* User Profile Card */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/10 border border-white/15 hover:border-emerald-500/40 transition-colors shadow-xs backdrop-blur-xs">
              <Link
                href="/researcher/profile"
                className="flex items-center gap-2.5 min-w-0 flex-1 group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/25 text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-400/40 ring-2 ring-emerald-500/20 group-hover:scale-105 transition-transform">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                    {user.name}
                  </p>
                  <div className="flex items-center justify-between pr-1">
                    <span className="text-[10px] text-emerald-300/80 font-bold tracking-wider uppercase truncate">
                      Investigator
                    </span>
                    <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Profile <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </Link>
              <LogoutButton
                iconOnly
                className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer border border-rose-500/30"
              />
            </div>

            {/* System Status Pill */}
            <div className="flex items-center justify-between px-2 text-[10px] text-emerald-400/80 font-medium">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>MySQL Active</span>
              </span>
              <span className="text-[9px] text-emerald-300/60 font-mono">v1.0 Lab</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/researcher/profile"
              className="w-9 h-9 rounded-full bg-emerald-500/25 text-emerald-300 font-extrabold text-xs flex items-center justify-center border border-emerald-400/40 hover:scale-105 transition-transform shadow-xs"
              title={`${user.name} (Researcher Profile)`}
            >
              {user.name.charAt(0).toUpperCase()}
            </Link>
            <LogoutButton
              iconOnly
              className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-lg border border-rose-500/30"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
