"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Sprout,
  FlaskConical,
  Dna,
  Package,
  Layers,
  Activity,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Target,
  FileCheck2,
} from "lucide-react";

export interface ReviewerProjectOverviewTabProps {
  project: any;
  dossier: any;
  specialties: any[];
  activeSubmission: any;
  onNavigateTab: (tabId: any) => void;
  feedbackCount?: number;
}

export default function ReviewerProjectOverviewTab({
  project,
  dossier,
  specialties,
  activeSubmission,
  onNavigateTab,
  feedbackCount = 0,
}: ReviewerProjectOverviewTabProps) {
  const approvedCount = specialties.filter((s) => s.status === "Approved").length;

  return (
    <div className="space-y-6">
      {/* 1. Multidisciplinary Evaluation Status Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(7,25,48,0.55)] sm:px-5 space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3">
          <div className="min-w-0 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              Multidisciplinary evaluation
            </span>
            <h2 className="text-lg font-semibold tracking-tight truncate sm:text-xl">
              {project.title}
            </h2>
            <p className="text-[11px] text-blue-100/80">
              <strong className="text-white">{project.researcherName}</strong>
              {" · "}
              <strong className="text-white">{project.plantName}</strong>{" "}
              <span className="italic font-serif text-blue-100/70">
                ({project.plantScientificName || "Vitex negundo L."})
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            <span className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[11px] font-bold text-blue-100">
              {activeSubmission?.versionTag || "v1.0"}
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                approvedCount === 3
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                  : "bg-blue-500/20 text-blue-200 border-blue-400/40"
              }`}
            >
              {approvedCount} of 3 Roles Approved
            </span>
          </div>
        </div>

        {/* 3 Professional Reviewer Roles Progress Tracker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          {specialties.map((spec) => {
            const isApproved = spec.status === "Approved";
            const isRevision = spec.status === "Revision Required";
            return (
              <button
                key={spec.areaKey}
                type="button"
                onClick={() => onNavigateTab("evaluation")}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10.5px] text-slate-400 font-bold">{spec.number}</span>
                    <span className="text-[10px] uppercase font-semibold text-blue-200">
                      {spec.order === 1 ? "Section 1" : spec.order === 2 ? "Section 2" : "Section 3"}
                    </span>
                  </div>
                  {isApproved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isRevision ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white text-xs truncate">{spec.label}</p>
                  <p className="text-[11px] text-blue-100/80 truncate font-medium">{spec.professionTitle}</p>
                  <p className="text-[10px] text-slate-300 truncate mt-0.5">{spec.status}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Research Sections Quick-Access Cards (Section 1, 2, 3) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Scientific Dossier Sections &amp; Assigned Professional Reviewers
          </h3>
          <span className="text-xs text-slate-500">
            Click any section below to review full steps in read-only mode
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Section 1 Formulation R&D */}
          <div
            onClick={() => onNavigateTab("section1")}
            className="group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Sprout className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                  Role 1 Assigned
                </span>
              </div>
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">
                  Section 1 · 8 Steps
                </span>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Formulation R&amp;D
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Botanical specimen verification, hydroethanolic extraction yield, excipient inventory, dosage form, batch analysis, and safety evaluation.
              </p>
              <div className="pt-2 text-[11px] font-medium text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                <span className="font-bold">Assigned Evaluator:</span> Formulation Scientist &amp; Pharmacognosist
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Review 8 Steps</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Section 2 In-Silico Molecular Docking */}
          <div
            onClick={() => onNavigateTab("section2")}
            className="group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Dna className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-full border border-indigo-200">
                  Role 2 Assigned
                </span>
              </div>
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-700">
                  Section 2 · 8 Steps
                </span>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  In-Silico Molecular Docking
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                RCSB target protein selection, ligand preparation, grid box parameters, AutoDock Vina binding affinities, and 2D interaction maps.
              </p>
              <div className="pt-2 text-[11px] font-medium text-indigo-900 bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                <span className="font-bold">Assigned Evaluator:</span> Bioinformatician &amp; Computational Scientist
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-700">
              <span>Review 8 Steps</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Section 3 Research Paper & Manuscript */}
          <div
            onClick={() => onNavigateTab("section3")}
            className="group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-400 transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 px-2.5 py-1 rounded-full border border-purple-200">
                  Role 3 Assigned
                </span>
              </div>
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-purple-700">
                  Section 3 · 4 Steps
                </span>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Paper &amp; Manuscript
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submitted research manuscript (PDF/DOCX preview), executive summary abstract, version snapshots, and multidisciplinary approval history.
              </p>
              <div className="pt-2 text-[11px] font-medium text-purple-900 bg-purple-50/70 p-2 rounded-lg border border-purple-100">
                <span className="font-bold">Assigned Evaluator:</span> Clinical Pharmacologist &amp; Medical Reviewer
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-700">
              <span>Review Paper</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Executive Abstract & Objectives */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-indigo-600" />
          <span>Research Summary Abstract &amp; Scientific Objectives</span>
        </h3>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed">
          {dossier?.executiveSummary ||
            dossier?.abstract ||
            "This scientific study explores the phytochemistry, in-silico molecular docking mechanisms, and topical pharmaceutical formulation of Vitex negundo L. (Lagundi). The research validates bioactivities against pro-inflammatory cytokine targets while developing a physically stable, standardized hydrogel delivery vehicle."}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-bold block">
              Research Objective
            </span>
            <p className="font-semibold text-slate-900">
              {project.researchObjective ||
                "Develop and standardize a stable topical phytotherapeutic formulation supported by computational molecular docking against inflammatory cytokine mediators."}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-bold block">
              Research Question
            </span>
            <p className="font-semibold text-slate-900">
              {project.researchQuestion ||
                "Do the bioactive flavonoids in the ethanolic leaf extract exhibit high-affinity binding to pro-inflammatory target proteins while maintaining topical formulation stability?"}
            </p>
          </div>
        </div>
      </div>

      {/* 4. PROFESSIONAL ROLE PAGE ASSIGNMENT MATRIX */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Professional Role Page &amp; Section Assignment Matrix</span>
            </h3>
            <p className="text-xs text-slate-500">
              Every section and step of this research is assigned to a specific professional expert role for specialized evaluation.
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
            5 Professional Roles Assigned
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Role 1: Pharmacognosy */}
          <div className="p-4 rounded-xl border border-emerald-200/90 bg-emerald-50/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Role 01 · Pharmacognosy
                </span>
                <span className="text-[10.5px] font-bold text-emerald-700">4 Pages Assigned</span>
              </div>
              <p className="text-xs font-bold text-slate-900">Pharmacognosist / Herbal Evaluator</p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li
                  onClick={() => onNavigateTab("section1")}
                  className="flex items-center gap-1.5 hover:text-emerald-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Section 1 Step 1: Botanical Specimen &amp; Voucher</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section1")}
                  className="flex items-center gap-1.5 hover:text-emerald-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Section 1 Step 2: Extraction &amp; Solvent Optimization</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section1")}
                  className="flex items-center gap-1.5 hover:text-emerald-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Section 1 Step 3: Bioactive Constituents Screening</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section3")}
                  className="flex items-center gap-1.5 hover:text-emerald-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Section 3 Step 2: Manuscript Botanical Evaluation</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("evaluation")}
              className="w-full py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer text-center"
            >
              Open Pharmacognosy Evaluation →
            </button>
          </div>

          {/* Role 2: Bioinformatics */}
          <div className="p-4 rounded-xl border border-indigo-200/90 bg-indigo-50/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
                  Role 02 · Bioinformatics
                </span>
                <span className="text-[10.5px] font-bold text-indigo-700">5 Pages Assigned</span>
              </div>
              <p className="text-xs font-bold text-slate-900">Bioinformatician / Computational Scientist</p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li
                  onClick={() => onNavigateTab("section2")}
                  className="flex items-center gap-1.5 hover:text-indigo-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>Section 2 Step 1: Target Protein Selection &amp; PDB</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section2")}
                  className="flex items-center gap-1.5 hover:text-indigo-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>Section 2 Step 2: Ligand Library &amp; Lipinski Rule of 5</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section2")}
                  className="flex items-center gap-1.5 hover:text-indigo-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>Section 2 Step 3: Screening &amp; Grid Box Coordinates</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section2")}
                  className="flex items-center gap-1.5 hover:text-indigo-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>Section 2 Step 4: Molecular Docking Logs (Vina)</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section2")}
                  className="flex items-center gap-1.5 hover:text-indigo-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>Section 2 Step 7: Pharmacophore 2D Interaction Maps</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("evaluation")}
              className="w-full py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-300 transition-colors cursor-pointer text-center"
            >
              Open Bioinformatics Evaluation →
            </button>
          </div>

          {/* Role 3: Pharmacology */}
          <div className="p-4 rounded-xl border border-purple-200/90 bg-purple-50/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300">
                  Role 03 · Pharmacology
                </span>
                <span className="text-[10.5px] font-bold text-purple-700">4 Pages Assigned</span>
              </div>
              <p className="text-xs font-bold text-slate-900">Pharmacologist / Medical Researcher</p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li
                  onClick={() => onNavigateTab("section2")}
                  className="flex items-center gap-1.5 hover:text-purple-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>Section 2 Step 5: Binding Energy &amp; Affinity Ranking</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section2")}
                  className="flex items-center gap-1.5 hover:text-purple-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>Section 2 Step 6: Molecular Interactions &amp; H-Bonds</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section2")}
                  className="flex items-center gap-1.5 hover:text-purple-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>Section 2 Step 8: Scientific Results Interpretation</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section3")}
                  className="flex items-center gap-1.5 hover:text-purple-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>Section 3 Step 2: Pharmacological Paper Appraisal</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("evaluation")}
              className="w-full py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 transition-colors cursor-pointer text-center"
            >
              Open Pharmacology Evaluation →
            </button>
          </div>

          {/* Role 4: Formulation Science */}
          <div className="p-4 rounded-xl border border-blue-200/90 bg-blue-50/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-300">
                  Role 04 · Formulation Science
                </span>
                <span className="text-[10.5px] font-bold text-blue-700">4 Pages Assigned</span>
              </div>
              <p className="text-xs font-bold text-slate-900">Pharmaceutical Scientist / Formulation Chemist</p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li
                  onClick={() => onNavigateTab("section1")}
                  className="flex items-center gap-1.5 hover:text-blue-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>Section 1 Step 4: Materials &amp; Excipients Inventory</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section1")}
                  className="flex items-center gap-1.5 hover:text-blue-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>Section 1 Step 5: Formulation Composition &amp; Builder</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section1")}
                  className="flex items-center gap-1.5 hover:text-blue-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>Section 1 Step 6: Batch Analysis &amp; QC (pH, Viscosity)</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section1")}
                  className="flex items-center gap-1.5 hover:text-blue-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>Section 1 Step 7: Laboratory Protocol &amp; SOP</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("evaluation")}
              className="w-full py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 transition-colors cursor-pointer text-center"
            >
              Open Formulation Evaluation →
            </button>
          </div>

          {/* Role 5: Clinical Safety */}
          <div className="p-4 rounded-xl border border-rose-200/90 bg-rose-50/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-900 border border-rose-300">
                  Role 05 · Clinical Safety
                </span>
                <span className="text-[10.5px] font-bold text-rose-700">4 Pages Assigned</span>
              </div>
              <p className="text-xs font-bold text-slate-900">Clinical Pharmacist / Toxicologist / Physician</p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li
                  onClick={() => onNavigateTab("section1")}
                  className="flex items-center gap-1.5 hover:text-rose-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Section 1 Step 8: Safety &amp; Toxicity Evaluation</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section1")}
                  className="flex items-center gap-1.5 hover:text-rose-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Section 1 Step 8: Dermal Irritation Index (PDII)</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section1")}
                  className="flex items-center gap-1.5 hover:text-rose-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Section 1 Step 8: Preservative Efficacy (USP &lt;51&gt;)</span>
                </li>
                <li
                  onClick={() => onNavigateTab("section3")}
                  className="flex items-center gap-1.5 hover:text-rose-700 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Section 3 Step 2: Clinical Risk Evaluation in Paper</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("evaluation")}
              className="w-full py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 transition-colors cursor-pointer text-center"
            >
              Open Clinical Safety Evaluation →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

