"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Search,
  Calendar,
  Leaf,
  ArrowRight,
  FileCheck2,
  FolderCheck,
  ShieldCheck,
  Sparkles,
  FlaskConical,
  FileText,
  ChevronRight,
  X,
} from "lucide-react";
import type { CompletedResearchListItem } from "@/lib/research-approval-completion-service";

interface Props {
  completedProjects: CompletedResearchListItem[];
}

export default function CompletedResearchListClient({ completedProjects }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return completedProjects;
    return completedProjects.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.plantName.toLowerCase().includes(q) ||
        (item.scientificName && item.scientificName.toLowerCase().includes(q)) ||
        (item.dosageForm && item.dosageForm.toLowerCase().includes(q)) ||
        item.approvedVersionTag.toLowerCase().includes(q)
    );
  }, [completedProjects, searchQuery]);

  const manuscriptCount = useMemo(() => {
    return completedProjects.filter((p) => p.hasManuscript || p.manuscriptFileName).length;
  }, [completedProjects]);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      {/* Container matching My Research Workspace */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 1. TOP HEADER BANNER (Deep Forest Emerald Theme with Animated Accents) */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full bg-gradient-to-br from-[#0f2c20] via-[#14392a] to-[#0a1e16] rounded-2xl border border-emerald-900/60 p-6 sm:p-7 shadow-lg shadow-emerald-950/20 text-white relative overflow-hidden"
        >
          {/* Decorative ambient glowing circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-xs">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Multidisciplinary Archive</span>
                </span>
                <span className="hidden sm:inline-flex text-xs font-medium text-emerald-400/80 bg-emerald-900/40 border border-emerald-700/40 rounded-full px-2.5 py-0.5 items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Compendial Standard</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <span>Completed Research</span>
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </h1>
              <p className="text-sm text-emerald-100/80 leading-relaxed">
                Officially completed research dossiers that have received all 3 professional reviewer role approvals (Section 1, 2, and 3) and passed full structural, formulation, and clinical verification.
              </p>
            </div>

            {/* Stat Pill */}
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              <div className="px-4 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-sm text-white font-mono">{completedProjects.length}</span>
                <span className="text-emerald-300">
                  Completed {completedProjects.length === 1 ? "Project" : "Projects"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. STATS SUMMARY TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Archived Dossiers
              </span>
              <p className="text-2xl font-bold font-mono text-slate-900">{completedProjects.length}</p>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                100% Peer-Approved
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Award className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Panel Approval Rate
              </span>
              <p className="text-2xl font-bold font-mono text-emerald-700">3 of 3 Roles</p>
              <span className="text-[11px] text-slate-500">Formulation · In-Silico · Paper</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Research Manuscripts
              </span>
              <p className="text-2xl font-bold font-mono text-slate-900">{manuscriptCount}</p>
              <span className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                <FileCheck2 className="w-3 h-3 text-indigo-600" />
                Compendial PDF attached
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
          </motion.div>
        </div>

        {/* 3. SEARCH & CONTROLS TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by research title, medicinal plant, dosage form, or version tag..."
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 px-1 shrink-0">
            <span>
              Showing <strong className="text-slate-800">{filteredProjects.length}</strong> of{" "}
              {completedProjects.length}
            </span>
          </div>
        </div>

        {/* 4. COMPLETED RESEARCH CARD LIST */}
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <FolderCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-base font-bold text-slate-900">
                {completedProjects.length === 0
                  ? "No completed research projects in the archive yet"
                  : "No matching completed research found"}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {completedProjects.length === 0
                  ? "When all 3 multidisciplinary reviewer roles approve your research dossier and you finalize Section 3 Step 4, your verified project will be permanently archived here."
                  : "Try clearing your search query or entering different botanical names or keywords."}
              </p>
            </div>
            {completedProjects.length === 0 ? (
              <div className="pt-2">
                <Link
                  href="/researcher/projects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm hover:shadow"
                >
                  <span>Go to My Research Projects</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Clear Search Query
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3.5">
            <AnimatePresence>
              {filteredProjects.map((item, index) => (
                <motion.div
                  key={item.projectId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.05, duration: 0.25 }}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden"
                >
                  {/* Left emerald accent border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-emerald-600" />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pl-1.5">
                    {/* Left: Title, Badges, Botanical & Scientific Info */}
                    <div className="space-y-3 min-w-0 flex-1">
                      {/* Top Badges Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-300 font-mono text-[11px] font-bold">
                          {item.approvedVersionTag}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Dossier #{item.projectId}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold flex items-center gap-1">
                          <Award className="w-3 h-3 text-emerald-600" />
                          <span>Verified Multidisciplinary</span>
                        </span>
                      </div>

                      {/* Project Title */}
                      <div>
                        <Link
                          href={`/researcher/completed/${item.projectId}`}
                          className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight flex items-center gap-2"
                        >
                          <span className="truncate">{item.title}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                      </div>

                      {/* Scientific & Botanical Metadata Grid */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 pt-0.5">
                        {/* Botanical Specimen */}
                        <div className="inline-flex items-center gap-1.5 font-semibold text-emerald-900 bg-emerald-50/70 border border-emerald-200/80 rounded-lg px-2.5 py-1">
                          <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item.plantName}</span>
                          {item.scientificName && (
                            <span className="font-normal italic text-emerald-700/80">({item.scientificName})</span>
                          )}
                        </div>

                        {/* Dosage Form / Delivery Format */}
                        {item.dosageForm && (
                          <div className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                            <FlaskConical className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{item.dosageForm}</span>
                          </div>
                        )}

                        {/* Completion Date */}
                        <div className="inline-flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span suppressHydrationWarning>
                            Completed on{" "}
                            {new Date(item.completedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "UTC",
                            })}
                          </span>
                        </div>

                        {/* Manuscript Attached */}
                        {item.manuscriptFileName && (
                          <div className="inline-flex items-center gap-1.5 font-medium text-indigo-900 bg-indigo-50/70 border border-indigo-200/70 rounded-lg px-2.5 py-1">
                            <FileCheck2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[220px] font-mono text-[11px]">{item.manuscriptFileName}</span>
                          </div>
                        )}
                      </div>

                      {/* 3 Multidisciplinary Role Approvals Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Role 01: Formulation R&amp;D</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Role 02: In-Silico Docking</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Role 03: Clinical Pharmacology</span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Approval Counter Badge + Vibrant Green Action Button */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                      <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{item.approvalStatusLabel}</span>
                      </div>

                      <Link
                        href={`/researcher/completed/${item.projectId}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
                      >
                        <span>View Research</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
