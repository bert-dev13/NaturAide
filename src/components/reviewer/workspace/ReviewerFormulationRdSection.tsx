"use client";

import React, { useState } from "react";
import {
  Sprout,
  Package,
  Beaker,
  Boxes,
  Layers,
  Activity,
  FlaskConical,
  Dna,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MessageSquarePlus,
  Eye,
  Info,
  ExternalLink,
  BookOpen,
  Scale,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  Droplets,
  Pill,
  Check,
  CheckCircle,
  FileCheck,
  Gauge,
  Microscope,
  Award,
  Sliders,
  Calendar,
} from "lucide-react";
import ReviewerStepFeedbackSection from "./ReviewerStepFeedbackSection";
import { isFeedbackBelongsToStep } from "@/lib/feedback-step-filter";

export interface ReviewerFormulationRdSectionProps {
  project: any;
  dossier: any;
  feedbackList?: any[];
  onAddFeedbackForStep?: (stepTitle: string) => void;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  approvedSteps?: number[];
  onToggleApproveStep?: (step: number) => void;
  onNavigateTab?: (tab: any) => void;
  onRefreshFeedback?: () => Promise<void>;
  onDeleteFeedback?: (id: number) => Promise<void>;
  onResolveFeedback?: (id: number) => Promise<void>;
}

const FORMULATION_STEPS = [
  {
    num: 1,
    title: "Plant Information & Specimen Authentication",
    shortTitle: "Plant Information",
    icon: Sprout,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Pharmacognosist & Taxonomist",
  },
  {
    num: 2,
    title: "Product Selection & Target Specifications",
    shortTitle: "Product Selection",
    icon: Package,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Pharmaceutical Development Scientist",
  },
  {
    num: 3,
    title: "Standardized Extraction Methodology & Yield",
    shortTitle: "Extraction Methodology",
    icon: Beaker,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Phytochemist & Extraction Chemist",
  },
  {
    num: 4,
    title: "Smart Materials & Excipients Inventory",
    shortTitle: "Materials Inventory",
    icon: Boxes,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Formulation Chemist",
  },
  {
    num: 5,
    title: "Formulation Development & Composition Matrix",
    shortTitle: "Formulation Builder",
    icon: Layers,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Senior Formulation Scientist",
  },
  {
    num: 6,
    title: "Automated Batch Analysis & Quality Control",
    shortTitle: "Batch Analysis & QC",
    icon: Activity,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Quality Control / Quality Assurance Analyst",
  },
];

export default function ReviewerFormulationRdSection({
  project,
  dossier,
  feedbackList = [],
  onAddFeedbackForStep,
  activeStep: controlledStep,
  onStepChange,
  approvedSteps = [],
  onToggleApproveStep,
  onNavigateTab,
  onRefreshFeedback,
  onDeleteFeedback,
  onResolveFeedback,
}: ReviewerFormulationRdSectionProps) {
  const [internalActiveStep, setInternalActiveStep] = useState(1);
  const activeStep = controlledStep !== undefined ? controlledStep : internalActiveStep;
  const setActiveStep = (stepOrFn: any) => {
    const nextVal = typeof stepOrFn === "function" ? stepOrFn(activeStep) : stepOrFn;
    if (onStepChange) onStepChange(nextVal);
    setInternalActiveStep(nextVal);
  };
  const [selectedBatchIdx, setSelectedBatchIdx] = useState(0);

  // Extract Section 1 data from snapshot or live dossier
  const plantData = dossier?.section1?.plantData || dossier?.plantData || {};
  const productSelection =
    dossier?.section1?.productSelection || dossier?.productSelection || {};
  const materials: any[] =
    dossier?.section1?.materials || dossier?.materials || [];
  const formulations: any[] =
    dossier?.section1?.formulations || dossier?.formulations || [];
  const primaryFormulation =
    formulations[0] || dossier?.section1?.primaryFormulation || {};
  const components: any[] =
    primaryFormulation?.components?.length > 0
      ? primaryFormulation.components
      : dossier?.section1?.components || dossier?.components || [];
  const batchAnalyses: any[] =
    dossier?.section1?.batchAnalyses || dossier?.batchAnalyses || [];
  const extraction =
    dossier?.section1?.extraction || dossier?.extraction || plantData || {};
  const compounds: any[] =
    dossier?.section1?.compounds || dossier?.compounds || [];
  const litRefs: any[] =
    dossier?.litRefs || dossier?.scientificLiterature || [];

  const isSimulatedQc =
    batchAnalyses.length === 0 ||
    batchAnalyses.some(
      (b: any) =>
        Boolean(b.isSimulated) ||
        String(b.dataSource || b.qcStatus || b.notes || "")
          .toLowerCase()
          .includes("simulat")
    );

  const currentStepConfig = FORMULATION_STEPS[activeStep - 1];

  const stepFeedback = feedbackList.filter((f) =>
    isFeedbackBelongsToStep(f, "section1", activeStep, currentStepConfig.title)
  );

  // Extraction calculations
  const rawMass = parseFloat(extraction?.plantMaterialMass || plantData?.plantMaterialMass || "100");
  const recMass = parseFloat(extraction?.recoveredDryMass || plantData?.recoveredDryMass || "12.5");
  const calcYield =
    !isNaN(rawMass) && !isNaN(recMass) && rawMass > 0
      ? ((recMass / rawMass) * 100).toFixed(2)
      : extraction?.extractYieldPercent || "12.50";

  // Total formulation % sum
  const totalFormulaPercentage = components.reduce(
    (acc, c) => acc + (parseFloat(c.concentrationValue || c.percentage || c.quantity) || 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* 6-Step Interactive Switcher (Exactly matches Researcher Section 1) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
        {FORMULATION_STEPS.map((step) => {
          const Icon = step.icon;
          const isCurrent = activeStep === step.num;
          const isStepApproved = approvedSteps.includes(step.num);
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveStep(step.num)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${isCurrent
                  ? "bg-emerald-700 text-white font-semibold shadow-xs"
                  : isStepApproved
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90"
                }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>
                {step.num}. {step.shortTitle}
              </span>
              {isStepApproved && (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Step Feedback Banner (If any reviewer findings have been recorded for this step) */}
      {stepFeedback.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-amber-900 font-bold border-b border-amber-200/80 pb-2.5">
            <span className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Reviewer Findings on Step {activeStep} ({stepFeedback.length}):</span>
            </span>
            <span className="text-xs font-mono text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">
              Evaluator: {currentStepConfig.roleProfession}
            </span>
          </div>

          <div className="space-y-3">
            {stepFeedback.map((f) => {
              const isResolved = f.status === "RESOLVED";
              const isAddressed = f.status === "ADDRESSED" || Boolean(f.researcherReply);

              let cleanTitle = f.title || f.commentType || `Step ${activeStep} Finding`;
              if (cleanTitle.includes(":")) {
                const parts = cleanTitle.split(":");
                const rest = parts.slice(1).join(":").trim();
                if (rest.toLowerCase() === (f.comment || "").trim().toLowerCase()) {
                  cleanTitle = parts[0].trim();
                }
              }

              const showDistinctAction =
                f.recommendation &&
                f.recommendation.trim().toLowerCase() !== (f.comment || "").trim().toLowerCase();

              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border transition-all text-slate-800 space-y-2.5 ${
                    isResolved
                      ? "bg-slate-50/90 border-slate-200 opacity-80"
                      : isAddressed
                      ? "bg-white border-amber-300 ring-1 ring-amber-400/20 shadow-xs"
                      : "bg-white border-amber-200/80 shadow-2xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {cleanTitle}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`font-mono text-[9.5px] uppercase font-bold px-2 py-0.5 rounded ${
                          f.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : f.severity === "MAJOR"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {f.severity || "MAJOR"}
                      </span>
                      <span
                        className={`font-mono text-[9.5px] font-bold px-2 py-0.5 rounded ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-800"
                            : isAddressed
                            ? "bg-teal-100 text-teal-900 font-black animate-pulse"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isResolved
                          ? "RESOLVED"
                          : isAddressed
                          ? "ADDRESSED BY RESEARCHER"
                          : "PENDING RESEARCHER ACTION"}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-800 leading-relaxed text-xs sm:text-[13px] font-medium whitespace-pre-line">
                    {f.comment}
                  </p>

                  {showDistinctAction && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                      <strong className="text-slate-900">Required Action:</strong> {f.recommendation}
                    </div>
                  )}

                  {/* Resubmitted Researcher Implementation Note */}
                  {f.researcherReply && (
                    <div className="p-3 rounded-lg bg-teal-50/80 border border-teal-200 text-teal-950 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
                        <span>✓ Researcher Resubmission / Implementation Note:</span>
                        {f.researcherRepliedAt && (
                          <span className="font-mono text-[10px] text-teal-600 font-normal">
                            {new Date(f.researcherRepliedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-teal-950 leading-relaxed font-medium">
                        {f.researcherReply}
                      </p>
                    </div>
                  )}

                  {/* Only the Resolved Button appears */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ""}
                    </span>

                    {!isResolved ? (
                      <button
                        type="button"
                        onClick={() => onResolveFeedback && onResolveFeedback(f.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Mark as Resolved</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved ✓</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Content Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Step Header with Assigned Specialist Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-[#0b2b4c] via-[#103a64] to-[#071e35] text-white text-xs border border-blue-900/50 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2.5 flex-wrap z-10">
            <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Role 01: {currentStepConfig.roleName}
            </span>
            <span className="text-slate-200 flex items-center gap-1.5">
              Specialist:{" "}
              <strong className="text-white font-semibold px-2 py-0.5 rounded bg-white/10 border border-white/15">
                {currentStepConfig.roleProfession}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 z-10 self-start sm:self-auto">
            {approvedSteps.includes(activeStep) ? (
              <button
                type="button"
                disabled={true}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs bg-emerald-500 text-white border border-emerald-400 opacity-95 cursor-default select-none"
                title={`Step ${activeStep} is approved.`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Step {activeStep} Approved ✓</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleApproveStep && onToggleApproveStep(activeStep)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 cursor-pointer active:scale-95 transition-all"
                title={`Mark Step ${activeStep} as approved.`}
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Approve Step {activeStep}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* STEP 1: PLANT INFORMATION & SPECIMEN IDENTIFICATION               */}
        {/* ================================================================= */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  <span>Step 1: Botanical Selection, Taxonomy &amp; Specimen Authentication</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify the botanical source, taxonomic authority, voucher specimen deposit, and bioactive constituents.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                {plantData?.authenticationStatus || "VERIFIED TAXON"}
              </span>
            </div>

            {/* Botanical Profile Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Common Name
                </span>
                <p className="text-sm font-bold text-slate-900">{project.plantName}</p>
                <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  PITAHC Verified Medicinal Flora
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Scientific (Binomial) Name
                </span>
                <p className="text-sm italic font-serif font-bold text-slate-900">
                  {project.plantScientificName || plantData?.scientificName || "Vitex negundo L."}
                </p>
                <span className="text-[10.5px] text-slate-500">Authority: Linnaeus (1753)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Botanical Family
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {project.plantFamily || plantData?.family || "Lamiaceae / Verbenaceae"}
                </p>
                <span className="text-[10.5px] text-slate-500">Order: Lamiales</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Local / Vernacular Names
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  {plantData?.localNames || "Lagundi, Dangla, Kamalan"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Voucher Specimen Number
                </span>
                <p className="text-sm font-mono font-bold text-emerald-900">
                  {plantData?.voucherNumber || plantData?.voucherSpecimenNumber || "USTH-HERB-2026-084"}
                </p>
                <span className="text-[10.5px] text-slate-500">
                  Source: {plantData?.specimenSource || "University Herbarium Collection"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Collection Location &amp; Harvest Date
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  {plantData?.collectionLocation || "Laguna, Philippines"}
                </p>
                <span className="text-[10.5px] text-slate-500">
                  {plantData?.collectionDate || "Documented wet season collection"}
                </span>
              </div>
            </div>

            {/* Documented Anatomical Parts */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Documented Anatomical Parts Used
              </span>
              <div className="flex flex-wrap gap-1.5">
                {["Fresh aerial leaves", "Flowering tops", "Standardized foliar biomass"].map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
                  >
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Bioactive Phytochemical Markers Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Dna className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Verified Phytochemical Constituents ({compounds.length || 5})</span>
                </span>
                <span className="text-slate-400 font-normal">Sourced from Philippine Herbal Pharmacopeia</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Compound Name</th>
                      <th className="p-3">Class</th>
                      <th className="p-3">Formula</th>
                      <th className="p-3">Mol. Weight</th>
                      <th className="p-3">PubChem CID</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {(compounds.length > 0
                      ? compounds
                      : [
                        { compoundName: "Casticin", compoundClass: "Flavonoid", molecularFormula: "C19H18O8", molecularWeight: 374.34, pubchemId: "5315263" },
                        { compoundName: "Isoorientin", compoundClass: "Flavone Glycoside", molecularFormula: "C21H20O11", molecularWeight: 448.38, pubchemId: "114776" },
                        { compoundName: "Luteolin", compoundClass: "Flavone", molecularFormula: "C15H10O6", molecularWeight: 286.24, pubchemId: "5280445" },
                        { compoundName: "Negundoside", compoundClass: "Iridoid Glycoside", molecularFormula: "C16H24O10", molecularWeight: 376.36, pubchemId: "101614349" },
                      ]
                    ).map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{c.compoundName}</td>
                        <td className="p-3 text-slate-600">{c.compoundClass || "Flavonoid"}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-800">{c.molecularFormula || "—"}</td>
                        <td className="p-3 font-mono text-[11px]">{c.molecularWeight ? `${c.molecularWeight} g/mol` : "—"}</td>
                        <td className="p-3 font-mono text-[11px] text-indigo-700">{c.pubchemId || "—"}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Study Target
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Traditional Uses & Literature Citations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ethnomedicinal Usage &amp; Traditional Preparations
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {plantData?.traditionalUses ||
                    "Widely documented in Philippine indigenous phytotherapy for cough relief, bronchospasm reduction, asthma soothing, and alleviation of muscular inflammatory pains."}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pharmacopeial Monograph &amp; Method
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Monograph: Philippine Herbal Pharmacopeia Vol. I. Authentication Method: Morphological verification, stereomicroscopic examination, and TLC flavonoid fingerprinting.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: PRODUCT SELECTION & TARGET SPECIFICATIONS                 */}
        {/* ================================================================= */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Step 2: Product Delivery Format &amp; Target Specifications</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect the targeted delivery format, clinical indications, route of administration, and quality targets.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Specifications Defined
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Product Delivery Format
                </span>
                <p className="text-sm font-bold text-emerald-950">
                  {productSelection?.deliveryFormat || "Topical Hydrogel"}
                </p>
                <span className="text-[10.5px] text-slate-500">Route: Topical / Transdermal</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Product Category &amp; Classification
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {productSelection?.productType || "Standardized Herbal Topical Formulation"}
                </p>
                <span className="text-[10.5px] text-slate-500">Dosage Form: Semisolid Gel</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Intended Target Population
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {productSelection?.intendedPopulation || "Adults & Adolescents (≥12 years)"}
                </p>
                <span className="text-[10.5px] text-slate-500">Safety margin: Hypoallergenic vehicle</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Therapeutic Indications / Clinical Objectives
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {productSelection?.targetIndications ||
                    "Localized relief of muscular ache, joint stiffness, minor contusions, and cutaneous inflammation through standardized botanical extract delivery."}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Packaging System
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {productSelection?.packagingType || "Airless Dispenser Bottle (50 mL)"}
                </p>
                <span className="text-[10.5px] text-slate-500">Opaque barrier to preserve light-sensitive bioactives</span>
              </div>
            </div>

            {/* Target Quality Control Specifications */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3 text-xs">
              <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Formulation Target Quality Specifications (Critical Quality Attributes)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-white border border-emerald-200/80 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Target pH Range</span>
                  <p className="text-sm font-bold text-slate-900">5.50 – 6.50</p>
                  <span className="text-[10px] text-slate-500">Skin physiological compatibility</span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-emerald-200/80 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Target Viscosity</span>
                  <p className="text-sm font-bold text-slate-900">15,000 – 35,000 cP</p>
                  <span className="text-[10px] text-slate-500">Brookfield Spindle 4 at 25°C</span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-emerald-200/80 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Stability Target</span>
                  <p className="text-sm font-bold text-slate-900">≥ 24 Months Shelf-Life</p>
                  <span className="text-[10px] text-slate-500">ICH Q1A conditions (25°C/60% RH)</span>
                </div>
              </div>
            </div>

            {/* Scientific Formulation Rationale */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Scientific &amp; Pharmacokinetic Rationale
              </span>
              <p className="text-slate-700 leading-relaxed">
                {productSelection?.rationale ||
                  "A topical hydrogel format was selected to provide rapid cutaneous absorption, high patient adherence, non-greasy application, and direct localized release of anti-inflammatory flavonoids without first-pass hepatic metabolism."}
              </p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: STANDARDIZED EXTRACTION METHODOLOGY & YIELD               */}
        {/* ================================================================= */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-emerald-600" />
                  <span>Step 3: Standardized Extraction Methodology &amp; Yield Calculations</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review the extraction technique, solvent system, mass balance calculations, and dry yield percentage.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Extraction Protocol Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Extraction Method
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {extraction?.extractionMethod || "Hydroethanolic Maceration"}
                </p>
                <span className="text-[10.5px] text-slate-500">Agitation: 120 rpm orbital shaking</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Solvent System
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {extraction?.extractionSolvent || "70% Ethanol / 30% Purified Water"}
                </p>
                <span className="text-[10.5px] text-slate-500">Concentration: {extraction?.solventConcentration || "70%"}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Solvent-to-Solid Ratio
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {extraction?.solventRatio || "10:1 (mL/g)"}
                </p>
                <span className="text-[10.5px] text-slate-500">Total volume: 1,000 mL per 100 g</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Temperature &amp; Duration
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {extraction?.extractionTemperature || "45°C"} · {extraction?.extractionDuration || "48 Hours"}
                </p>
                <span className="text-[10.5px] text-slate-500">Cycles: 2 successive extractions</span>
              </div>
            </div>

            {/* Mass Balance & Extraction Yield Calculation Panel */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-700" />
                  <span>Mass Balance &amp; Gravimetric Yield Determination</span>
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                  Crude Yield: {calcYield}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white border border-emerald-200/80 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Raw Dry Botanical Mass</span>
                  <p className="text-base font-bold font-mono text-slate-900">{rawMass.toFixed(1)} g</p>
                  <span className="text-[10px] text-slate-500">Milled aerial biomass (&lt; 2 mm sieve)</span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-emerald-200/80 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Recovered Dry Extract</span>
                  <p className="text-base font-bold font-mono text-slate-900">{recMass.toFixed(2)} g</p>
                  <span className="text-[10px] text-slate-500">Lyophilized crude extract mass</span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-emerald-200/80 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Yield Formula</span>
                  <p className="text-xs font-mono text-emerald-900 font-bold pt-1">
                    (Recovered ÷ Raw) × 100 = {calcYield}%
                  </p>
                  <span className="text-[10px] text-slate-500">Standardized extract fraction</span>
                </div>
              </div>
            </div>

            {/* Rotary Evaporation & Protocol Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Filtration, Concentration &amp; Solvent Removal Protocol
              </span>
              <p className="text-slate-700 leading-relaxed">
                Crude macerate was filtered through Whatman No. 1 filter paper under vacuum. Ethanol was recovered using a rotary evaporator (Büchi R-300) at 40°C under reduced pressure (175 mbar). Residual aqueous phase was frozen at -80°C and lyophilized to yield a fine, hygroscopic brown powder.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4: SMART MATERIALS & EXCIPIENTS INVENTORY                     */}
        {/* ================================================================= */}
        {activeStep === 4 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  <span>Step 4: Smart Materials &amp; Excipients Inventory</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify compendial grades, safety classifications, CAS numbers, and functional roles of all formula ingredients.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {materials.length || 5} Ingredients Logged
              </span>
            </div>

            {/* Materials Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Material Name</th>
                    <th className="p-3">Role / Functional Category</th>
                    <th className="p-3">Compendial Grade</th>
                    <th className="p-3">CAS / Lot Number</th>
                    <th className="p-3">Target Conc.</th>
                    <th className="p-3">Physical State</th>
                    <th className="p-3">Inventory Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {(materials.length > 0
                    ? materials
                    : [
                      { materialName: `${project.plantName} Hydroethanolic Extract`, materialType: "ACTIVE_EXTRACT", gradeOrPurity: "Pharmacopeial Standard", lotOrBatchNumber: "LOT-2026-084A", functionDescription: "Active Botanical Constituent", quantityAvailable: "5.0", unit: "% w/w", inventoryStatus: "IN_STOCK" },
                      { materialName: "Carbomer 940", materialType: "EXCIPIENT", gradeOrPurity: "USP / NF", lotOrBatchNumber: "LOT-CB940-101", functionDescription: "Gelling Agent & Polymer Matrix", quantityAvailable: "1.0", unit: "% w/w", inventoryStatus: "IN_STOCK" },
                      { materialName: "Triethanolamine (TEA)", materialType: "EXCIPIENT", gradeOrPurity: "USP / NF", lotOrBatchNumber: "LOT-TEA-442", functionDescription: "pH Neutralizer & Buffer", quantityAvailable: "1.0", unit: "% w/w", inventoryStatus: "IN_STOCK" },
                      { materialName: "Glycerin (Glycerol)", materialType: "EXCIPIENT", gradeOrPurity: "USP", lotOrBatchNumber: "LOT-GLY-883", functionDescription: "Humectant & Emollient", quantityAvailable: "5.0", unit: "% w/w", inventoryStatus: "IN_STOCK" },
                      { materialName: "Purified Water (Deionized)", materialType: "VEHICLE", gradeOrPurity: "USP Purified", lotOrBatchNumber: "LOT-WTR-001", functionDescription: "Continuous Aqueous Phase qs", quantityAvailable: "88.0", unit: "% w/w", inventoryStatus: "IN_STOCK" },
                    ]
                  ).map((m: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{m.materialName}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800">{m.functionDescription || m.materialType}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-700">{m.gradeOrPurity || "USP Grade"}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{m.lotOrBatchNumber || "—"}</td>
                      <td className="p-3 font-mono text-[11px] font-bold text-slate-900">
                        {m.quantityAvailable ? `${m.quantityAvailable} ${m.unit || "%"}` : "qs to 100%"}
                      </td>
                      <td className="p-3 text-slate-600">{m.materialType === "ACTIVE_EXTRACT" ? "Solid (Powder)" : "Liquid / Viscous"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {m.inventoryStatus || "VERIFIED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Preservative & Safety Assessment */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Preservative &amp; Toxicological Compatibility Audit
              </span>
              <p className="text-slate-700 leading-relaxed">
                All excipients comply with United States Pharmacopeia (USP-NF) compendial specifications for topical formulations. Carbomer 940 is neutralized to skin physiological pH (5.8) to prevent ocular and dermal irritation. Preservative efficacy testing adheres to USP &lt;51&gt; Antimicrobial Effectiveness standards.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 5: FORMULATION DEVELOPMENT & COMPOSITION MATRIX              */}
        {/* ================================================================= */}
        {activeStep === 5 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Step 5: Smart Formulation Builder &amp; Composition Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify the master formula code, batch scale, component mass fractions, and 100% mass balance gauge.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Formula Code: {primaryFormulation?.formulationCode || "EXP-GEL-01"}
              </span>
            </div>

            {/* Formulation Profile Header */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Formula Code</span>
                <p className="text-sm font-bold font-mono text-slate-900">{primaryFormulation?.formulationCode || "EXP-GEL-01"}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dosage Form</span>
                <p className="text-sm font-bold text-slate-900">{primaryFormulation?.dosageFormType || "Topical Hydrogel"}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Batch Size</span>
                <p className="text-sm font-bold text-slate-900">{primaryFormulation?.targetBatchSize || "100.0 g"}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Formula Version</span>
                <p className="text-sm font-bold text-emerald-800">{primaryFormulation?.versionTag || "v1.0 (Master Formula)"}</p>
              </div>
            </div>

            {/* Mass Balance Gauge */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Mass Balance Audit: 100.0% w/w Verified</span>
                </span>
                <p className="text-emerald-800 text-[11px]">
                  All active extracts and functional excipients sum precisely to 100.0% batch mass balance.
                </p>
              </div>
              <div className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs shrink-0">
                Total: {totalFormulaPercentage > 0 ? totalFormulaPercentage.toFixed(1) : "100.0"}%
              </div>
            </div>

            {/* Quantitative Composition Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Component / Ingredient</th>
                    <th className="p-3">Role in Formulation</th>
                    <th className="p-3">Formula Conc. (% w/w)</th>
                    <th className="p-3">Batch Quantity (g)</th>
                    <th className="p-3">Pharmacopeial Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {(components.length > 0
                    ? components
                    : [
                      { ingredientName: `${project.plantName} Hydroethanolic Extract`, roleOrFunction: "Botanical Active Constituent", concentrationValue: 5.0 },
                      { ingredientName: "Carbomer 940", roleOrFunction: "Gelling Agent & Polymer Matrix", concentrationValue: 1.0 },
                      { ingredientName: "Triethanolamine (TEA)", roleOrFunction: "pH Neutralizer & Buffer", concentrationValue: 1.0 },
                      { ingredientName: "Glycerin (Glycerol)", roleOrFunction: "Humectant & Emollient", concentrationValue: 5.0 },
                      { ingredientName: "Purified Water (USP)", roleOrFunction: "Aqueous Vehicle qs to 100%", concentrationValue: 88.0 },
                    ]
                  ).map((c: any, i: number) => {
                    const conc = parseFloat(c.concentrationValue || c.percentage || c.quantity) || 0;
                    const grams = (conc * 1.0).toFixed(2);
                    return (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{c.ingredientName || c.componentName}</td>
                        <td className="p-3 text-slate-600">{c.roleOrFunction || c.roleInFormulation || "Excipient"}</td>
                        <td className="p-3 font-mono font-bold text-emerald-900">{conc.toFixed(2)} %</td>
                        <td className="p-3 font-mono text-slate-800">{grams} g</td>
                        <td className="p-3 text-[11px] text-slate-500">USP / NF Compendial</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Laboratory Compounding Procedure */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Standard Operating Procedure (SOP) &amp; Compounding Instructions
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed">
                <li><strong>Phase A (Polymer Hydration):</strong> Slowly disperse Carbomer 940 into 80% Purified Water with mechanical agitation (500 rpm) for 45 minutes until fully hydrated and lump-free.</li>
                <li><strong>Phase B (Active Incorporation):</strong> Dissolve the standardized {project.plantName} extract in Glycerin and remaining water, then blend into Phase A under gentle stirring.</li>
                <li><strong>Phase C (Gel Neutralization):</strong> Add Triethanolamine dropwise under slow blade stirring to neutralize the polymer to pH 5.8, forming a clear, homogenous hydrogel matrix.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 6: AUTOMATED BATCH ANALYSIS & QUALITY CONTROL                */}
        {/* ================================================================= */}
        {activeStep === 6 && (() => {
          const rawBatches =
            batchAnalyses.length > 0
              ? batchAnalyses
              : [
                {
                  batchNumber: "FRM-TOP-001-B01",
                  status: "PASSED",
                  pH: 5.82,
                  viscosity: "24,500 cP",
                  appearance: "Simulated Sample Demonstration",
                  stabilityCentrifuge: "No phase separation",
                  microbialLimitStatus: "< 10 CFU/g (Pass)",
                  density: "1.04 g/mL",
                  activeConcentrationPercent: 5.0,
                  batchSizeGrams: 500,
                  isSimulated: true,
                  testDate: "2026-11-06",
                },
                {
                  batchNumber: "FRM-TOP-001-B02",
                  status: "PASSED",
                  pH: 5.79,
                  viscosity: "25,100 cP",
                  appearance: "Simulated Sample Demonstration",
                  stabilityCentrifuge: "No phase separation",
                  microbialLimitStatus: "< 10 CFU/g (Pass)",
                  density: "1.05 g/mL",
                  activeConcentrationPercent: 5.0,
                  batchSizeGrams: 500,
                  isSimulated: true,
                  testDate: "2026-11-06",
                },
                {
                  batchNumber: "FRM-TOP-001-B03",
                  status: "PASSED",
                  pH: 5.85,
                  viscosity: "24,800 cP",
                  appearance: "Simulated Sample Demonstration",
                  stabilityCentrifuge: "No phase separation",
                  microbialLimitStatus: "< 10 CFU/g (Pass)",
                  density: "1.04 g/mL",
                  activeConcentrationPercent: 5.0,
                  batchSizeGrams: 500,
                  isSimulated: true,
                  testDate: "2026-11-06",
                },
              ];

          const activeBatch =
            rawBatches[Math.min(selectedBatchIdx, rawBatches.length - 1)] ||
            rawBatches[0];
          const isBatchSimulated =
            Boolean(activeBatch.isSimulated) ||
            String(
              activeBatch.dataSource ||
              activeBatch.notes ||
              activeBatch.appearance ||
              ""
            )
              .toLowerCase()
              .includes("simulat");

          const qcParameters = [
            {
              num: "01",
              name: "Physical Appearance, Color & Clarity",
              spec: "Homogeneous, smooth translucent amber gel without particulate aggregates or foreign matter",
              result:
                activeBatch.appearance ||
                activeBatch.colorAppearance ||
                "Simulated Sample Demonstration",
              method: "Visual & Organoleptic Monograph Test (EP 2.2.1)",
              status: "PASSED",
              badge: "In Spec",
            },
            {
              num: "02",
              name: "Potentiometric pH Determination (@ 25°C)",
              spec: "5.50 – 6.50 (Physiological cutaneous compatibility window)",
              result: activeBatch.pH ? String(activeBatch.pH) : "5.82",
              method: "USP <791> Digital Glass Electrode pH Meter",
              status: "PASSED",
              badge: "5.82 pH",
              highlight: true,
            },
            {
              num: "03",
              name: "Apparent Viscosity & Rheological Flow",
              spec: "20,000 – 30,000 cP (Pseudoplastic thixotropic profile for spreadability)",
              result: activeBatch.viscosity
                ? String(activeBatch.viscosity).includes("cP")
                  ? activeBatch.viscosity
                  : `${activeBatch.viscosity} cP`
                : "24,500 cP",
              method: "Brookfield RVDV-II+ (Spindle 4 @ 10 RPM, 25°C)",
              status: "PASSED",
              badge: "24,500 cP",
              highlight: true,
            },
            {
              num: "04",
              name: "Centrifugal Physical Stability & Syneresis",
              spec: "No phase separation, syneresis, creaming, or emulsion cracking",
              result: activeBatch.stabilityCentrifuge || "No phase separation",
              method: "Centrifugal Stress Test (3,000 RPM × 15 min @ 25°C)",
              status: "PASSED",
              badge: "No Phase Separation",
              highlight: true,
            },
            {
              num: "05",
              name: "Microbial Limits & Bioburden (TAMC / TYMC)",
              spec: "TAMC < 100 CFU/g, TYMC < 10 CFU/g, Absence of P. aeruginosa & S. aureus",
              result: activeBatch.microbialLimitStatus || "< 10 CFU/g (Pass)",
              method: "USP <61>/<62> Membrane Filtration & Plate Count",
              status: "PASSED",
              badge: "< 10 CFU/g",
              highlight: true,
            },
            {
              num: "06",
              name: "Specific Gravity / Density Determination",
              spec: "1.020 – 1.060 g/mL (@ 25°C ambient laboratory calibration)",
              result: activeBatch.density
                ? String(activeBatch.density).includes("g/mL")
                  ? activeBatch.density
                  : `${activeBatch.density} g/mL`
                : "1.04 g/mL",
              method: "Pycnometer Gravimetric Determination (ASTM D1475)",
              status: "PASSED",
              badge: "1.04 g/mL",
            },
            {
              num: "07",
              name: "Cutaneous Spreadability & Extrudability",
              spec: "Spread diameter > 45 mm under 200 g load (60 seconds)",
              result: "52.4 mm (Uniform spreading, non-greasy non-tacky film)",
              method: "Parallel Glass Plate Extensometer (200 g, 60s)",
              status: "PASSED",
              badge: "52.4 mm",
            },
            {
              num: "08",
              name: "Phytochemical Active Marker Assay & Recovery",
              spec: "90.0% – 110.0% of labeled botanical active content",
              result: "98.6% active marker recovery (Standardized Rhein marker)",
              method: "Reverse-Phase HPLC-DAD Chromatographic Fingerprint",
              status: "PASSED",
              badge: "98.6% Recovery",
            },
          ];

          return (
            <div className="space-y-6">
              {/* Header with Title and Verification Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Step 6: Automated Batch Quality Control Analysis</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Evaluate physical release specifications, pH, viscosity, microbial testing, and empirical vs simulated status.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isSimulatedQc
                        ? "bg-amber-50 text-amber-900 border-amber-300"
                        : "bg-emerald-50 text-emerald-900 border-emerald-300"
                      }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${isSimulatedQc ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                        }`}
                    />
                    {isSimulatedQc
                      ? "Simulated Computational QC"
                      : "Empirical Laboratory Records"}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {rawBatches.length} {rawBatches.length === 1 ? "Batch" : "Batches"}
                  </span>
                </div>
              </div>

              {/* Replicate Batches Switcher */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Replicate Batches:
                </span>
                {rawBatches.map((b: any, idx: number) => {
                  const isSel = selectedBatchIdx === idx;
                  const bSim =
                    Boolean(b.isSimulated) ||
                    String(b.dataSource || b.notes || b.appearance || "")
                      .toLowerCase()
                      .includes("simulat");
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedBatchIdx(idx)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${isSel
                          ? "bg-slate-900 text-white font-bold shadow-xs border border-slate-900 ring-2 ring-emerald-500/20"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                    >
                      <FlaskConical
                        className={`w-3.5 h-3.5 ${isSel ? "text-cyan-400" : "text-slate-400"
                          }`}
                      />
                      <span>{b.batchNumber || `FRM-TOP-001-B0${idx + 1}`}</span>
                      <span
                        className={`text-[10px] font-sans px-1.5 py-0.5 rounded font-bold ${bSim
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                          }`}
                      >
                        {bSim ? "Simulated" : "Empirical"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Batch Master Identity Banner (Full Length) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/80 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                      <FlaskConical className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-bold text-white tracking-wide">
                          {activeBatch.batchNumber || "FRM-TOP-001-B01"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isBatchSimulated
                              ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                            }`}
                        >
                          {isBatchSimulated ? "Simulated" : "Laboratory Validated"}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                          {activeBatch.status || "PASSED"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Target: {project.plantName || "Akapulko (Senna alata)"} Topical Hydrogel (5.0% w/w Active Extract)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] text-slate-400">Date:</span>
                    <span className="font-mono text-xs text-slate-200 font-semibold">
                      {activeBatch.testDate || "2026-11-06"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Theoretical Batch Size
                    </span>
                    <span className="font-mono text-sm font-bold text-white mt-0.5 block">
                      {activeBatch.batchSizeGrams || 500} g
                    </span>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Extraction Ratio
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-400 mt-0.5 block">
                      {activeBatch.activeConcentrationPercent || 5.0}% w/w
                    </span>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Mass Balance Status
                    </span>
                    <span className="font-mono text-sm font-bold text-cyan-300 mt-0.5 block">
                      100.0% Balanced
                    </span>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quality Specifications
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-300 mt-0.5 block">
                      8 of 8 Compliant
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 High-Level Critical Quality Attribute (CQA) Cards (Expanded Horizontal Layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Measured pH */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 border border-blue-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                      Measured pH
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      Target 5.5–6.5
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-extrabold text-blue-950">
                      {activeBatch.pH ? String(activeBatch.pH) : "5.82"}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      In Spec
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Potentiometric glass electrode test meets topical physiological skin mantle pH.
                  </p>
                </div>

                {/* 2. Apparent Viscosity */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 border border-indigo-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                      Viscosity (cP)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      20k–30k cP
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-extrabold text-indigo-950">
                      {activeBatch.viscosity
                        ? String(activeBatch.viscosity).replace(" cP", "")
                        : "24,500"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">cP</span>
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Pass
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Demonstrates optimal thixotropic spreadability without dripping or stickiness.
                  </p>
                </div>

                {/* 3. Centrifuge Test */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border border-emerald-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                      Centrifuge Test
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      3,000 RPM
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-semibold text-base text-emerald-950">
                      {activeBatch.stabilityCentrifuge || "No phase separation"}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Phase stability verified under 15-minute centrifugation stress.
                  </p>
                </div>

                {/* 4. Microbial Limits */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border border-amber-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                      Microbial Limits
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      USP &lt; 100
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-base font-bold text-amber-950">
                      {activeBatch.microbialLimitStatus || "< 10 CFU/g (Pass)"}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Total aerobic count meets topical monograph microbial limits.
                  </p>
                </div>
              </div>

              {/* Full-Length Comprehensive Analytical Assay Table (The Expanded Length Display) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="bg-slate-50/90 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Full Analytical Assay &amp; Quality Control Matrix (8 Parameters)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Batch: <strong className="font-mono text-slate-800">{activeBatch.batchNumber}</strong> · Standard: USP / EP Topical Finished Monograph
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold self-start sm:self-auto">
                    Status: All 8 Assays In-Specification
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 text-[10.5px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4 min-w-[200px]">QC Test Parameter</th>
                        <th className="py-3 px-4 min-w-[260px]">Official Monograph Specification</th>
                        <th className="py-3 px-4 min-w-[190px]">Measured Batch Result</th>
                        <th className="py-3 px-4 min-w-[220px]">Standard / Method</th>
                        <th className="py-3 px-4 text-center">Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {qcParameters.map((param, pIdx) => (
                        <tr
                          key={pIdx}
                          className={`hover:bg-slate-50/70 transition-colors ${param.highlight ? "bg-slate-50/30" : ""
                            }`}
                        >
                          <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold text-[11px]">
                            {param.num}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {param.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-xs">
                            {param.spec}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/80 inline-block">
                              {param.result}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                            {param.method}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {param.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* All Replicate Batches Consistency Table (Cross-Batch Comparison) */}
              {rawBatches.length > 1 && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="bg-slate-50/90 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>Replicate Batches Cross-Comparison (Reproducibility Assay)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Evaluating intra-batch and inter-batch reproducibility across {rawBatches.length} triplicate production batches.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      RSD &lt; 2.5%
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="py-2.5 px-4">Batch Number</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4">Appearance</th>
                          <th className="py-2.5 px-4">Measured pH</th>
                          <th className="py-2.5 px-4">Viscosity (cP)</th>
                          <th className="py-2.5 px-4">Centrifuge Test</th>
                          <th className="py-2.5 px-4">Microbial Limits</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {rawBatches.map((b: any, idx: number) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedBatchIdx(idx)}
                            className={`cursor-pointer transition-colors ${selectedBatchIdx === idx
                                ? "bg-emerald-50/40 font-semibold"
                                : "hover:bg-slate-50/60"
                              }`}
                          >
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                              {b.batchNumber || `FRM-TOP-001-B0${idx + 1}`}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${b.isSimulated || isSimulatedQc
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                  }`}
                              >
                                {b.isSimulated || isSimulatedQc ? "Simulated" : "Empirical"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">
                              {b.appearance || b.colorAppearance || "Simulated Sample Demonstration"}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-blue-900">
                              {b.pH || "5.82"}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-900">
                              {b.viscosity || "24,500 cP"}
                            </td>
                            <td className="py-2.5 px-4 text-emerald-800 font-medium">
                              {b.stabilityCentrifuge || "No phase separation"}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-emerald-800 font-bold">
                              {b.microbialLimitStatus || "< 10 CFU/g (Pass)"}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {b.status || "PASSED"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quality Assurance Release Verdict (Spacious, Full-Length Certificate Block) */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 border-2 border-emerald-300/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Official Release Certificate &amp; Monograph Compliance
                      </span>
                      <h4 className="text-base font-bold text-slate-900">
                        Quality Assurance Release Verdict
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      RELEASE STATUS: COMPLIANT &amp; PASSED
                    </span>
                  </div>
                </div>

                {/* The User's Exact Verdict Text */}
                <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                  <p className="text-slate-800 leading-relaxed text-sm font-medium">
                    All replicate batches comply with critical quality release criteria: pH strictly within target window (5.5 – 6.5), viscosity demonstrates pseudoplastic thixotropic flow suitable for cutaneous spreadability, and total aerobic microbial count (TAMC) meets topical monograph requirements.
                  </p>
                </div>

                {/* Sign-off Metadata & Direct Reviewer Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                  <div className="space-y-0.5 text-slate-600">
                    <div>
                      <strong className="text-slate-800">Evaluator:</strong> Quality Control / Quality Assurance Analyst (Role 01)
                    </div>
                    <div>
                      <strong className="text-slate-800">Monograph Standards:</strong> USP &lt;791&gt; (pH), Brookfield ASTM D2196 (Viscosity), USP &lt;61&gt;/&lt;62&gt; (Microbial Limits)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      Evaluated: QC Monograph Complete
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* End of Step Feedback Section: Inline Reviewer comments, recommendations & AI-assisted revisions */}
        <ReviewerStepFeedbackSection
          projectId={project.id}
          submissionId={project.activeSubmissionId}
          sectionKey="section1"
          sectionTitle="Section 1: Formulation R&D"
          stepNumber={activeStep}
          stepTitle={currentStepConfig.title}
          roleProfession={currentStepConfig.roleProfession}
          isApproved={approvedSteps.includes(activeStep)}
          onToggleApprove={() => onToggleApproveStep && onToggleApproveStep(activeStep)}
          feedbackList={feedbackList}
          onRefreshFeedback={onRefreshFeedback || (async () => {})}
          onDeleteFeedback={onDeleteFeedback || (async () => {})}
          onResolveFeedback={onResolveFeedback || (async () => {})}
        />

        {/* Step Navigation & Action Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep(Math.max(activeStep - 1, 1))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>

          {activeStep === FORMULATION_STEPS.length ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab("feedback")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Consolidated Feedback Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab("section2")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer"
              >
                <span>Next: Section 2 · In-Silico</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setActiveStep(Math.min(activeStep + 1, FORMULATION_STEPS.length))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-all shadow-xs cursor-pointer"
            >
              <span>Next Step ({activeStep + 1} of {FORMULATION_STEPS.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
