"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, ChevronLeft, ChevronRight, Database, ArrowRight, LogOut } from "lucide-react";
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
      className={`hidden lg:flex flex-col justify-between bg-[#091f16] text-white border-r border-[#143827] h-screen sticky top-0 transition-all duration-200 z-30 select-none shadow-sm shrink-0 ${
        collapsed ? "w-20 px-3 py-4" : "w-[280px] px-4 py-5"
      }`}
    >
      {/* ================================================== */}
      {/* TOP SECTION: BRAND & MAIN NAV                      */}
      {/* ================================================== */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* LOGO & BRAND HEADER */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-900/50 shrink-0">
          <Link
            href="/researcher"
            className="flex items-center gap-3 overflow-hidden group"
            title="NaturAide Research Platform"
          >
            <div className="w-9 h-9 rounded-lg bg-white p-1.5 shrink-0 flex items-center justify-center shadow-xs">
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide Logo"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-base tracking-tight text-white leading-tight">
                  NaturAide
                </span>
                <span className="text-[10px] font-medium text-emerald-400/80 tracking-widest uppercase">
                  Research Platform
                </span>
              </div>
            )}
          </Link>

          {/* Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-emerald-400/80 hover:text-white hover:bg-emerald-900/40 transition-colors cursor-pointer shrink-0 border border-emerald-800/40"
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
            className={`flex items-center justify-center gap-2 rounded-lg font-medium transition-colors shadow-xs ${
              collapsed
                ? "w-10 h-10 mx-auto bg-emerald-600 hover:bg-emerald-500 text-white"
                : "w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            }`}
            title="Start New Research"
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
            {!collapsed && <span>Start New Research</span>}
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
      <div className="pt-3 border-t border-emerald-900/50 shrink-0 space-y-2">
        {!collapsed ? (
          <div className="space-y-2">
            {/* User Profile Card */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60 transition-colors">
              <Link
                href="/researcher/profile"
                className="flex items-center gap-2.5 min-w-0 flex-1 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-900/80 text-emerald-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-emerald-700/50">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider truncate">
                    Investigator
                  </p>
                </div>
              </Link>
              <LogoutButton
                iconOnly
                className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              />
            </div>

            {/* System Status Pill */}
            <div className="flex items-center justify-between px-2 text-[10px] text-emerald-400/60 font-mono">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-500" />
                <span>MySQL Active</span>
              </span>
              <span>v1.0 Lab</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/researcher/profile"
              className="w-9 h-9 rounded-lg bg-emerald-900/80 text-emerald-300 font-semibold text-xs flex items-center justify-center border border-emerald-700/50 hover:bg-emerald-800 transition-colors"
              title={`${user.name} (Researcher Profile)`}
            >
              {user.name.charAt(0).toUpperCase()}
            </Link>
            <LogoutButton
              iconOnly
              className="p-1.5 text-slate-400 hover:text-rose-300 rounded-lg"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
