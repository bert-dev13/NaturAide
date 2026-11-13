"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import ResearcherNavSections from "./ResearcherNavSections";
import { useLiveDisplayName } from "@/hooks/useLiveDisplayName";

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
  const { name: userName, initial } = useLiveDisplayName(user?.name || "");
  const [collapsed, setCollapsed] = useState(false);

  React.useEffect(() => {
    const updateSidebarVar = () => {
      if (window.innerWidth < 1024) {
        document.documentElement.style.setProperty("--sidebar-width", "0px");
      } else {
        document.documentElement.style.setProperty(
          "--sidebar-width",
          collapsed ? "80px" : "280px"
        );
      }
    };
    updateSidebarVar();
    window.addEventListener("resize", updateSidebarVar);
    return () => window.removeEventListener("resize", updateSidebarVar);
  }, [collapsed]);

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
        <div className="flex items-center justify-between pb-5 mb-4 border-b border-emerald-900/50 shrink-0">
          <Link
            href="/researcher"
            className="flex items-center gap-3.5 overflow-hidden group"
            title="NaturAide Research Platform"
          >
            <div
              className={`rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center shadow-md ring-1 ring-emerald-400/20 transition group-hover:ring-emerald-300/40 ${
                collapsed ? "w-10 h-10" : "w-11 h-11"
              }`}
            >
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide Logo"
                width={collapsed ? 28 : 32}
                height={collapsed ? 28 : 32}
                className="object-contain"
                priority
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-[1.2rem] font-bold tracking-tight text-white leading-none">
                  NaturAide
                </span>
                <span className="mt-1 text-[10px] font-semibold text-emerald-300/90 tracking-[0.18em] uppercase">
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
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
                    {userName}
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
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/researcher/profile"
              className="w-9 h-9 rounded-lg bg-emerald-900/80 text-emerald-300 font-semibold text-xs flex items-center justify-center border border-emerald-700/50 hover:bg-emerald-800 transition-colors"
              title={`${userName} (Researcher Profile)`}
            >
              {initial}
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
