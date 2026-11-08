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
  FlaskConical,
  FileText,
  X,
  ExternalLink,
} from "lucide-react";
import type { CompletedResearchListItem } from "@/lib/research-approval-completion-service";

interface Props {
  completedProjects: CompletedResearchListItem[];
}

const REVIEWER_ROLES = [
  { key: "formulation", short: "Formulation", label: "Role 01 · Formulation R&D" },
  { key: "insilico", short: "In-Silico", label: "Role 02 · In-Silico Docking" },
  { key: "clinical", short: "Clinical", label: "Role 03 · Clinical Pharmacology" },
] as const;

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
        item.approvedVersionTag.toLowerCase().includes(q) ||
        String(item.projectId).includes(q)
    );
  }, [completedProjects, searchQuery]);

  const manuscriptCount = useMemo(
    () => completedProjects.filter((p) => p.hasManuscript || p.manuscriptFileName).length,
    [completedProjects]
  );

  return (
    <div className="w-full max-w-none space-y-6 pb-12 text-slate-800">
      {/* 1. Compact header — matches Projects / Revisions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(15,44,32,0.55)] sm:px-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-28 w-28 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/35 bg-teal-500/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-teal-100">
                <Award className="h-3 w-3 text-teal-200" />
                Verified Archive
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-100/80">
                Compendial Standard
              </span>
            </div>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Completed Research
            </h1>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-emerald-100/75">
              Peer-approved dossiers with all 3 reviewer roles certified.
            </p>
          </div>

          <Link
            href="/researcher/projects"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300 active:bg-emerald-500"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Projects</span>
          </Link>
        </div>
      </motion.div>

      {/* 2. Compact metrics */}
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5">
        {[
          {
            key: "dossiers",
            label: "Archived Dossiers",
            value: completedProjects.length,
            hint: completedProjects.length === 1 ? "Completed project" : "Completed projects",
            icon: Award,
            surface: "bg-[linear-gradient(145deg,#f4f8f5_0%,#ffffff_45%,#eef5f1_100%)]",
            bar: "from-[#0f2c20] to-emerald-400",
            valueClass: "text-[#0f2c20]",
            iconWrap: "bg-[#0f2c20] text-emerald-200",
            glow: "bg-emerald-400/20",
          },
          {
            key: "panel",
            label: "Panel Approval",
            value: "100%",
            hint: "3 of 3 roles",
            icon: ShieldCheck,
            surface: "bg-[linear-gradient(145deg,#f0fdfa_0%,#ffffff_45%,#ecfeff_100%)]",
            bar: "from-teal-500 to-cyan-300",
            valueClass: "text-teal-900",
            iconWrap: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white",
            glow: "bg-teal-400/25",
          },
          {
            key: "manuscripts",
            label: "Manuscripts",
            value: manuscriptCount,
            hint: "Formulation · In-Silico · Paper",
            icon: FileText,
            surface: "bg-[linear-gradient(145deg,#ecfdf5_0%,#ffffff_45%,#f0fdfa_100%)]",
            bar: "from-emerald-500 to-teal-300",
            valueClass: "text-emerald-900",
            iconWrap: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
            glow: "bg-emerald-400/25",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.04 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 ${stat.surface} p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(15,44,32,0.35)]`}
            >
              <div className={`absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r ${stat.bar}`} />
              <div className={`pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl ${stat.glow}`} />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6d7f76]">
                    {stat.label}
                  </p>
                  <p className={`mt-1.5 text-2xl font-semibold tabular-nums leading-none tracking-tight sm:text-[1.7rem] ${stat.valueClass}`}>
                    {stat.value}
                  </p>
                  <p className="mt-1.5 truncate text-[11px] font-medium text-[#8aa094]">{stat.hint}</p>
                </div>
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${stat.iconWrap}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Search toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, plant, dosage form, or version tag..."
            className="h-11 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] pl-10 pr-9 text-sm text-[#0f2c20] placeholder:text-[#8aa094] outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8aa094] hover:bg-[#edf5f0] hover:text-[#0f2c20]"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="shrink-0 px-1 text-xs font-medium text-[#6d7f76]">
          Showing <span className="font-semibold text-[#0f2c20]">{filteredProjects.length}</span> of{" "}
          {completedProjects.length}
        </p>
      </div>

      {/* 4. Dossier list */}
      {filteredProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#d7e4dc] bg-white p-10 text-center shadow-xs"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#d7e4dc] bg-[#f4f8f5] text-emerald-800">
            <FolderCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-[#0f2c20]">
            {completedProjects.length === 0 ? "No completed dossiers yet" : "No matching dossiers"}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#6d7f76]">
            {completedProjects.length === 0
              ? "Fully approved research will appear here after all three reviewer roles certify the dossier."
              : "Try a different plant name, title, or version tag."}
          </p>
          <div className="mt-4">
            {completedProjects.length === 0 ? (
              <Link
                href="/researcher/projects"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2c20] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#164533]"
              >
                My Research Projects
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-xl bg-[#edf5f0] px-4 py-2 text-xs font-semibold text-[#0f2c20] transition hover:bg-[#e2eee7]"
              >
                Clear search
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filteredProjects.map((item, index) => {
              const plantLabel = item.scientificName
                ? `${item.plantName} (${item.scientificName})`
                : item.plantName;

              return (
                <motion.article
                  key={item.projectId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
                  whileHover={{ y: -2 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-teal-200/70 bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] shadow-[0_1px_2px_rgba(15,44,32,0.04)] transition-all duration-300 hover:border-emerald-300/80 hover:shadow-[0_18px_34px_-22px_rgba(15,44,32,0.3)]"
                >
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-teal-600 via-teal-400 to-cyan-300" />

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
                        {item.approvedVersionTag}
                      </span>
                      <span className="rounded-md border border-[#d7e4dc] bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5f7468]">
                        Dossier #{item.projectId}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified Multidisciplinary
                      </span>
                    </div>

                    <div>
                      <Link
                        href={`/researcher/completed/${item.projectId}`}
                        className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#0f2c20] transition-colors hover:text-emerald-800"
                      >
                        {item.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span
                          className="inline-flex max-w-full items-center gap-1 truncate rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2 py-1 font-semibold text-emerald-900"
                          title={plantLabel}
                        >
                          <Leaf className="h-3 w-3 shrink-0 text-emerald-700" />
                          <span className="truncate">
                            {item.plantName}
                            {item.scientificName ? (
                              <span className="font-medium italic text-emerald-800/80">
                                {" "}
                                ({item.scientificName})
                              </span>
                            ) : null}
                          </span>
                        </span>
                        {item.dosageForm && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-[#d7e4dc] bg-white px-2 py-1 font-medium text-[#52645d]">
                            <FlaskConical className="h-3 w-3 text-teal-700" />
                            {item.dosageForm}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto space-y-2.5 rounded-xl border border-[#e8f0eb] bg-white/80 p-3">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#6d7f76]">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3" />
                          <span suppressHydrationWarning>
                            Completed{" "}
                            {new Date(item.completedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "UTC",
                            })}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-teal-800">
                          <CheckCircle2 className="h-3 w-3" />
                          {item.approvalStatusLabel || "3 of 3 Approved"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {REVIEWER_ROLES.map((role) => (
                          <div
                            key={role.key}
                            className="flex items-center gap-1.5 rounded-md bg-emerald-50/90 px-2 py-1 text-[10px] font-semibold text-emerald-900"
                            title={role.label}
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-emerald-600" />
                            <span className="truncate">{role.label}</span>
                          </div>
                        ))}
                      </div>

                      {item.manuscriptFileName ? (
                        <p className="inline-flex max-w-full items-center gap-1 truncate text-[11px] font-medium text-[#52645d]">
                          <FileCheck2 className="h-3 w-3 shrink-0 text-emerald-700" />
                          <span className="truncate font-mono">{item.manuscriptFileName}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] font-medium text-[#8aa094]">No manuscript attached</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[#e8f0eb] bg-[#f7faf8]/90 px-4 py-3">
                    <span className="text-[11px] font-medium text-[#8aa094]">Archive dossier</span>
                    <Link
                      href={`/researcher/completed/${item.projectId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                    >
                      View Research
                      <ArrowRight className="h-3.5 w-3.5 text-teal-100" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
