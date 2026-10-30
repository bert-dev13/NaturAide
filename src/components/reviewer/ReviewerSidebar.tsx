"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Clock,
  FileCheck2,
  RotateCcw,
  CheckCircle2,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Leaf,
  Dna,
  Pill,
  FlaskConical,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { normalizeReviewAreaKey, type ExpertReviewAreaKey } from "@/lib/expert-review-areas";

const AREA_ICON_MAP: Record<ExpertReviewAreaKey, LucideIcon> = {
  pharmacognosy: Leaf,
  bioinformatics: Dna,
  pharmacology: Pill,
  formulation: FlaskConical,
  clinical_safety: Stethoscope,
};

interface AssignedArea {
  key: ExpertReviewAreaKey;
  label: string;
  shortLabel: string;
  professionTitle?: string;
  checkingTitle?: string;
}

const PERMANENT_ROLES = [
  {
    key: "pharmacognosy",
    profession: "Pharmacist / Pharmacognosist",
    specialization: "Pharmacognosy",
    icon: Leaf,
  },
  {
    key: "bioinformatics",
    profession: "Bioinformatician / Computational Biologist",
    specialization: "Bioinformatics",
    icon: Dna,
  },
  {
    key: "pharmacology",
    profession: "Pharmacologist",
    specialization: "Pharmacology",
    icon: Pill,
  },
  {
    key: "formulation",
    profession: "Pharmacist / Pharmaceutical Scientist",
    specialization: "Formulation",
    icon: FlaskConical,
  },
  {
    key: "clinical_safety",
    profession: "Physician / Clinical Pharmacist",
    specialization: "Clinical Safety",
    icon: Stethoscope,
  },
];

export default function ReviewerSidebar({
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
  const [assignedAreas, setAssignedAreas] = useState<AssignedArea[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams?.get("status")?.toUpperCase();

  useEffect(() => {
    async function loadAreas() {
      try {
        const res = await fetch("/api/reviewer/areas");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.areas)) {
            setAssignedAreas(data.areas);
          }
        }
      } catch (err) {
        console.error("Failed to load reviewer areas in sidebar:", err);
      }
    }
    loadAreas();
  }, []);

  const isWorkspaceActive =
    (pathname === "/reviewer" || pathname === "/reviewer/reviews") &&
    !currentStatus &&
    !pathname.includes("/checking");

  return (
    <aside
      className={`hidden lg:flex flex-col justify-between shrink-0 transition-all duration-300 border-r border-[#1e3a5f]/60 bg-gradient-to-b from-[#07172b] via-[#0b2447] to-[#051121] text-white ${
        collapsed ? "w-20 px-2.5 py-4" : "w-[290px] px-4 py-5"
      } h-screen sticky top-0 select-none shadow-xl z-30`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* LOGO & BRAND HEADER */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 shrink-0">
          <Link
            href="/reviewer"
            className="flex items-center gap-3 overflow-hidden group min-w-0"
            title="NatureAide Professional"
          >
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center shadow-md shadow-blue-950/40 group-hover:scale-105 transition-transform">
              <Image
                src="/images/nature-logo.png"
                alt="NatureAide Logo"
                width={28}
                height={28}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-extrabold text-[20px] tracking-tight text-white flex items-center gap-1.5 leading-tight">
                  NatureAide
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)] animate-pulse" />
                </span>
                <span className="text-[10px] font-bold text-blue-300/90 tracking-wider uppercase whitespace-nowrap">
                  SCIENTIFIC REVIEW PLATFORM
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 border border-white/10"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* NAVIGATION SECTIONS */}
        <div className="flex-1 overflow-y-auto pr-1 pb-2 space-y-5 custom-scrollbar">
          {/* SECTION: MAIN */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1">
                <p className="text-[10px] font-extrabold tracking-wider text-blue-300/80 uppercase">
                  MAIN
                </p>
              </div>
            )}
            <Link
              href="/reviewer"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-heading font-bold text-xs transition-all ${
                isWorkspaceActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Review Workspace"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-blue-300" />
              {!collapsed && <span>Review Workspace</span>}
            </Link>
          </div>

          {/* SECTION: MY PROFESSIONAL ROLES */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1">
                <p className="text-[10px] font-extrabold tracking-wider text-blue-300/80 uppercase">
                  MY PROFESSIONAL ROLES
                </p>
              </div>
            )}
            {PERMANENT_ROLES.map((roleItem) => {
              const Icon = roleItem.icon;
              const isRoleActive =
                pathname === `/reviewer/checking/${roleItem.key}` ||
                pathname === `/professional/reviews/${roleItem.key}`;

              return (
                <Link
                  key={roleItem.key}
                  href={`/reviewer/checking/${roleItem.key}`}
                  className={`group flex items-start gap-2.5 px-3 py-2 rounded-xl transition-all ${
                    isRoleActive
                      ? "bg-blue-500/20 text-white border-l-2 border-blue-400 font-bold shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                  title={`${roleItem.profession} · ${roleItem.specialization} Checking`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-colors ${
                      isRoleActive ? "text-blue-300" : "text-slate-400 group-hover:text-blue-300"
                    }`}
                  />
                  {!collapsed && (
                    <div className="flex flex-col min-w-0 text-left">
                      <span
                        className={`text-[11.5px] font-bold leading-snug break-words ${
                          isRoleActive ? "text-white" : "text-slate-200 group-hover:text-white"
                        }`}
                      >
                        {roleItem.profession}
                      </span>
                      <span
                        className={`text-[10px] tracking-wide mt-0.5 leading-none ${
                          isRoleActive
                            ? "text-blue-300 font-semibold"
                            : "text-blue-300/70 group-hover:text-blue-300"
                        }`}
                      >
                        {roleItem.specialization}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* SECTION: REVIEWS */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1">
                <p className="text-[10px] font-extrabold tracking-wider text-blue-300/80 uppercase">
                  REVIEWS
                </p>
              </div>
            )}

            <Link
              href="/reviewer?status=PENDING"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStatus === "PENDING"
                  ? "bg-blue-500/20 text-blue-200 border-l-2 border-blue-400 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Pending Reviews"
            >
              <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              {!collapsed && <span>Pending</span>}
            </Link>

            <Link
              href="/reviewer?status=IN_REVIEW"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStatus === "IN_REVIEW"
                  ? "bg-blue-500/20 text-blue-200 border-l-2 border-blue-400 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="In Review"
            >
              <FileCheck2 className="w-3.5 h-3.5 shrink-0 text-blue-400" />
              {!collapsed && <span>In Review</span>}
            </Link>

            <Link
              href="/reviewer/revisions"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === "/reviewer/revisions"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Revisions"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              {!collapsed && <span>Revisions</span>}
            </Link>

            <Link
              href="/reviewer/completed"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === "/reviewer/completed" || currentStatus === "COMPLETED"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Completed Reviews"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              {!collapsed && <span>Completed</span>}
            </Link>
          </div>

          {/* SECTION: AI */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1">
                <p className="text-[10px] font-extrabold tracking-wider text-blue-300/80 uppercase">
                  AI
                </p>
              </div>
            )}
            <Link
              href="/reviewer/assistant"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === "/reviewer/assistant"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Ask NatureAide"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-sky-400" />
              {!collapsed && <span>Ask NatureAide</span>}
            </Link>
          </div>

          {/* SECTION: ACCOUNT */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1">
                <p className="text-[10px] font-extrabold tracking-wider text-blue-300/80 uppercase">
                  ACCOUNT
                </p>
              </div>
            )}
            <Link
              href="/reviewer/profile"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === "/reviewer/profile"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Professional Profile"
            >
              <User className="w-3.5 h-3.5 shrink-0 text-blue-300" />
              {!collapsed && <span>Profile</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: GENERAL PROFESSIONAL REVIEWER & LOGOUT */}
      <div className="pt-3 border-t border-white/10 shrink-0 space-y-2.5">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/10 border border-white/15">
              <Link
                href="/reviewer/profile"
                className="flex items-center gap-2.5 min-w-0 flex-1 group"
                title="Professional Reviewer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/40">
                  <ShieldCheck className="w-4 h-4 text-blue-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                    Professional Reviewer
                  </p>
                  <span className="text-[10px] text-blue-300/80 font-bold tracking-wider uppercase truncate block">
                    Scientific Review Platform
                  </span>
                </div>
              </Link>
            </div>
            <LogoutButton className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 transition-colors cursor-pointer" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/reviewer/profile"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-300 transition-colors"
              title="Professional Reviewer"
            >
              <ShieldCheck className="w-5 h-5 text-blue-300" />
            </Link>
            <LogoutButton iconOnly className="w-10 h-10 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-400/30 flex items-center justify-center transition-colors cursor-pointer" />
          </div>
        )}
      </div>
    </aside>
  );
}
