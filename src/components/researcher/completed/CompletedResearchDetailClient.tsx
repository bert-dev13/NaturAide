"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Calendar,
  Leaf,
  FileText,
  Download,
  Eye,
  Cpu,
  History,
  Lock,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { CompletedResearchDetail } from "@/lib/research-approval-completion-service";

interface Props {
  detail: CompletedResearchDetail;
}

export default function CompletedResearchDetailClient({ detail }: Props) {
  const [openSection, setOpenSection] = useState<
    "summary" | "computational" | "history" | null
  >("summary");

  const toggleSection = (key: "summary" | "computational" | "history") => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const manuscriptViewUrl = `/api/researcher/projects/${detail.projectId}/manuscript/file`;
  const manuscriptDownloadUrl = `/api/researcher/projects/${detail.projectId}/manuscript/file?download=1`;

  // Avoid duplicate scientific name if already present in plantName
  const showScientificName =
    detail.scientificName &&
    !detail.plantName.toLowerCase().includes(detail.scientificName.toLowerCase());

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      {/* Header Banner (Matching Forest Emerald Design Language & Broad Max Width) */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full bg-gradient-to-br from-[#0f2c20] via-[#14392a] to-[#0a1e16] rounded-2xl border border-emerald-900/60 p-6 sm:p-7 shadow-lg shadow-emerald-950/20 text-white relative overflow-hidden space-y-4"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top navigation row */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/10 pb-3">
            <Link
              href="/researcher/completed"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Completed Research Archive</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified Dossier</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-200 border border-emerald-500/40 font-semibold shadow-xs">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Read-Only Completed Dossier ({detail.approvedVersionTag})</span>
              </span>
            </div>
          </div>

          {/* Title & Badge */}
          <div className="relative z-10 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Completed Multidisciplinary Research Dossier</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {detail.title}
            </h1>
          </div>

          {/* Metadata Row */}
          <div className="relative z-10 flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-emerald-100/90">
            <span className="inline-flex items-center gap-1.5 font-semibold bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-700/60 text-white shadow-2xs">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plant: {detail.plantName}</span>
              {showScientificName && (
                <span className="font-normal italic text-emerald-300">({detail.scientificName})</span>
              )}
            </span>

            {detail.dosageForm && (
              <span className="inline-flex items-center gap-1 bg-emerald-900/50 px-3 py-1.5 rounded-lg border border-emerald-700/50 text-emerald-200">
                Formulation: <strong className="text-white ml-1">{detail.dosageForm}</strong>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 text-emerald-300/90 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span suppressHydrationWarning>
                Completion Date:{" "}
                <strong className="text-white font-mono">
                  {new Date(detail.completedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </strong>
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold ml-auto text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Panel Verified</span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* Main Content (Wide Container matching all major dashboard views) */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 1. Professional Review Summary Card */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Professional Review
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified across all five multidisciplinary review specialties.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {detail.approvalState.approvedCount} of {detail.approvalState.totalSpecialties}{" "}
                Approved
              </span>
            </span>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
            {detail.approvalState.specialties.map((spec) => (
              <div
                key={spec.areaKey}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-slate-400">{spec.code}</span>
                  <span className="font-bold text-slate-900">{spec.specialty}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 inline-flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>{spec.reviewerName || spec.roleTitle}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {spec.decisionDate && (
                    <span suppressHydrationWarning className="text-slate-400 font-mono text-[11px]">
                      {new Date(spec.decisionDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{spec.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Research Documents & Action Controls */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Research Documents
            </h2>
            <p className="text-xs text-slate-500">
              Access your locked research summary, final manuscript, computational results, and review history.
            </p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
            {/* Row 1: View Research Summary */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    Research Summary
                  </div>
                  <div className="text-xs text-slate-500">
                    Complete executive research synthesis ({detail.approvedVersionTag})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleSection("summary")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>View Research Summary</span>
                {openSection === "summary" ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Row 2: View or Download Research Paper */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    Research Paper Manuscript
                  </div>
                  <div className="text-xs text-slate-500">
                    {detail.manuscript?.fileName || "Approved Research Manuscript"}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {detail.manuscript?.hasFile ? (
                  <>
                    <a
                      href={manuscriptViewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>View Research Paper</span>
                    </a>
                    <a
                      href={manuscriptDownloadUrl}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Research Paper</span>
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 italic">No file attached</span>
                )}
              </div>
            </div>

            {/* Row 3: View Computational Results */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    Computational Results
                  </div>
                  <div className="text-xs text-slate-500">
                    {detail.computationalResults.phytochemicalsCount} phytochemicals ·{" "}
                    {detail.computationalResults.dockingCount} completed docking runs
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleSection("computational")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <Cpu className="w-3.5 h-3.5 text-teal-600" />
                <span>View Computational Results</span>
                {openSection === "computational" ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Row 4: View Professional Review History */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    Professional Review History
                  </div>
                  <div className="text-xs text-slate-500">
                    {detail.approvalState.submissionHistory.length} submission{" "}
                    {detail.approvalState.submissionHistory.length === 1 ? "version" : "versions"} &amp;
                    reviewer decisions
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleSection("history")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <History className="w-3.5 h-3.5 text-amber-600" />
                <span>View Professional Review History</span>
                {openSection === "history" ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* EXPANDED SECTION A: RESEARCH SUMMARY                              */}
        {/* ================================================================= */}
        {openSection === "summary" && (
          <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Saved Research Summary ({detail.approvedVersionTag})
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Read-Only Record
              </span>
            </div>
            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
              {detail.executiveSummary || "No executive research summary recorded."}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* EXPANDED SECTION B: COMPUTATIONAL RESULTS                         */}
        {/* ================================================================= */}
        {openSection === "computational" && (
          <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                In-Silico Screening &amp; Molecular Docking Results
              </h3>
              <span className="text-xs font-semibold text-teal-700">
                {detail.computationalResults.phytochemicalsCount} Compounds ·{" "}
                {detail.computationalResults.dockingCount} Docking Runs
              </span>
            </div>

            {/* Selected Phytochemicals */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Selected Phytochemicals &amp; Lipinski Screening
              </h4>
              {detail.computationalResults.screenings.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <th className="py-2 px-3 font-semibold">Compound</th>
                        <th className="py-2 px-3 font-semibold">MW (g/mol)</th>
                        <th className="py-2 px-3 font-semibold">LogP</th>
                        <th className="py-2 px-3 font-semibold">TPSA</th>
                        <th className="py-2 px-3 font-semibold">Lipinski</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.computationalResults.screenings.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {s.compoundName}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {s.molecularWeight ?? "—"}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {s.logP ?? "—"}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {s.tpsa ?? "—"}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                s.passedLipinski
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {s.passedLipinski ? "Pass" : "Violation"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detail.computationalResults.phytochemicals.map((p) => (
                    <span
                      key={p.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Molecular Docking Results */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Top Molecular Docking Complexes
              </h4>
              {detail.computationalResults.dockingResults.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <th className="py-2 px-3 font-semibold">Ligand</th>
                        <th className="py-2 px-3 font-semibold">Target Protein</th>
                        <th className="py-2 px-3 font-semibold">PDB ID</th>
                        <th className="py-2 px-3 font-semibold">Affinity (kcal/mol)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.computationalResults.dockingResults.slice(0, 15).map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {d.ligandName}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{d.targetName}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {d.pdbId || "—"}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                            {d.bindingAffinity !== null ? `${d.bindingAffinity} kcal/mol` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No docking runs recorded.</p>
              )}
            </div>

            {/* Scientific Interpretation */}
            {detail.computationalResults.scientificInterpretation?.overallFindings && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Scientific Interpretation
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {detail.computationalResults.scientificInterpretation.overallFindings}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ================================================================= */}
        {/* EXPANDED SECTION C: PROFESSIONAL REVIEW HISTORY                   */}
        {/* ================================================================= */}
        {openSection === "history" && (
          <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Professional Review &amp; Submission History
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {detail.approvalState.submissionHistory.length}{" "}
                {detail.approvalState.submissionHistory.length === 1 ? "Version" : "Versions"}
              </span>
            </div>

            <div className="space-y-4">
              {detail.approvalState.submissionHistory.map((sub) => (
                <div
                  key={sub.submissionId}
                  className="rounded-xl border border-slate-200/80 p-4 space-y-3 bg-slate-50/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono text-xs font-bold">
                        {sub.versionTag}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Submission Round {sub.versionNumber}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-semibold text-emerald-700">
                        {sub.status}
                      </span>
                    </div>

                    {sub.submittedAt && (
                      <span suppressHydrationWarning className="text-[11px] font-mono text-slate-500">
                        Submitted{" "}
                        {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-slate-200/60 bg-white rounded-lg border border-slate-200/70 px-3">
                    {sub.specialties.map((sp) => (
                      <div key={sp.areaKey} className="py-2.5 space-y-1 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-400">
                              {sp.code}
                            </span>
                            <span className="font-bold text-slate-900">{sp.specialty}</span>
                            {sp.reviewerName && (
                              <span className="text-slate-500">({sp.reviewerName})</span>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              sp.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : sp.status === "Revision Required"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {sp.status}
                          </span>
                        </div>
                        {sp.comments && (
                          <p className="text-slate-600 pl-6">&ldquo;{sp.comments}&rdquo;</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

