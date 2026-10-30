"use client";

import React, { useState } from "react";
import Link from "next/link";
import RecordImage from "@/components/community/RecordImage";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  ExternalLink,
  Flame,
  Droplets,
  Layers,
  Sparkles,
  Bot,
  Clock,
  Check,
  Leaf,
  ChevronRight,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { formatPrepTypeLabel } from "./PreparationCatalogClient";

export interface PreparationMaterial {
  id: number;
  material_name: string;
  amount: string | null;
  unit: string | null;
  notes: string | null;
}

export interface PreparationStep {
  id: number;
  step_number: number;
  instruction: string;
}

export interface PreparationPrecaution {
  id: number;
  precaution: string;
}

export interface PreparationReference {
  id: number;
  source_type: string;
  source_title: string;
  organization_or_authors: string;
  publication_year: number | null;
  doi_or_pmid: string | null;
  source_url: string | null;
  verified_at: string | null;
}

export interface DetailedPreparation {
  id: string;
  title: string;
  preparation_type: string;
  plant_part_used: string;
  traditional_use_context: string;
  description: string;
  administration_instructions: string | null;
  when_to_seek_guidance: string | null;
  materials: PreparationMaterial[];
  steps: PreparationStep[];
  precautions: PreparationPrecaution[];
  references: PreparationReference[];
}

export interface PlantDetails {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  imageUrl: string | null;
  category: string;
  simpleUse: string;
  is_pitahc: number | boolean;
}

interface IndividualPreparationViewProps {
  plant: PlantDetails;
  preparations: DetailedPreparation[];
  isProfessionalGuidanceRequired: boolean;
  backHref?: string;
  backLabel?: string;
  initialMethodIndex?: number;
}

export function formatSourceTypeBadge(type: string): { label: string; className: string } {
  switch (type) {
    case "DOH_GUIDANCE":
      return {
        label: "DOH Guidance",
        className: "bg-emerald-800 text-white border-emerald-600/40",
      };
    case "PITAHC_RESOURCE":
      return {
        label: "PITAHC Resource",
        className: "bg-teal-800 text-white border-teal-600/40",
      };
    case "WHO_RESOURCE":
      return {
        label: "WHO Resource",
        className: "bg-blue-800 text-white border-blue-600/40",
      };
    case "PEER_REVIEWED_RESEARCH":
      return {
        label: "Peer-Reviewed Research",
        className: "bg-purple-800 text-white border-purple-600/40",
      };
    case "INSTITUTIONAL_PUBLICATION":
      return {
        label: "Institutional Publication",
        className: "bg-slate-800 text-white border-slate-600/40",
      };
    default:
      return {
        label: "Authoritative Reference",
        className: "bg-emerald-900 text-white border-emerald-700/40",
      };
  }
}

function getPrepTypeMeta(type: string) {
  const clean = (type || "").toLowerCase();
  if (clean.includes("poultice")) {
    return {
      icon: Layers,
      color: "text-emerald-700",
      bgColor: "bg-emerald-100",
      shortSummary: "Topical / External compress",
    };
  }
  if (clean.includes("juice") || clean.includes("infusion")) {
    return {
      icon: Droplets,
      color: "text-teal-700",
      bgColor: "bg-teal-100",
      shortSummary: "Fresh juice extraction / Cold infusion",
    };
  }
  return {
    icon: Flame,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    shortSummary: "Boiled in water • Oral tea",
  };
}

export default function IndividualPreparationView({
  plant,
  preparations,
  isProfessionalGuidanceRequired,
  backHref,
  backLabel,
  initialMethodIndex = 0,
}: IndividualPreparationViewProps) {
  // Method selection state
  const safeInitial =
    initialMethodIndex >= 0 && initialMethodIndex < preparations.length
      ? initialMethodIndex
      : 0;
  const [selectedPrepIndex, setSelectedPrepIndex] = useState(safeInitial);

  // Progressive disclosure workflow step (1: What You Need, 2: Instructions, 3: Application & Safety)
  const [flowStep, setFlowStep] = useState<1 | 2 | 3>(1);

  // Sub-step index for instructions in Step 2
  const [instructionIndex, setInstructionIndex] = useState<number>(0);

  // Toggle to view all instructions in list format if preferred
  const [showAllInstructions, setShowAllInstructions] = useState<boolean>(false);

  // User checklist state for materials (preserved across Next/Back navigation)
  const [checkedMaterials, setCheckedMaterials] = useState<Record<string, boolean>>({});

  if (!preparations || preparations.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-[#dde6df] text-center space-y-4 shadow-2xs">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="font-heading font-extrabold text-lg text-[#0f2c20]">
          Verified Preparation Under Review
        </h2>
        <p className="text-sm text-[#52796f] max-w-md mx-auto">
          Preparation documentation for {plant.commonName} is currently undergoing botanical and bibliographic verification.
        </p>
        <Link
          href={backHref || `/community/plants/${plant.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2c20] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel || `← Back to ${plant.commonName}`}</span>
        </Link>
      </div>
    );
  }

  const currentPrep = preparations[selectedPrepIndex] || preparations[0];
  const hasMultiple = preparations.length > 1;

  const toggleMaterialCheck = (matId: number | string) => {
    setCheckedMaterials((prev) => ({
      ...prev,
      [matId]: !prev[matId],
    }));
  };

  const handleSelectMethod = (idx: number) => {
    setSelectedPrepIndex(idx);
    setFlowStep(1);
    setInstructionIndex(0);
  };

  return (
    <div className="space-y-5 pb-16 max-w-3xl mx-auto">
      {/* 1. TOP NAVIGATION / BACK LINK */}
      <div className="flex items-center justify-between">
        <Link
          href={backHref || `/community/plants/${plant.slug}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1e5c44] hover:text-[#0f2c20] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel || `← Back to ${plant.commonName}`}</span>
        </Link>

        <Link
          href="/community/herbal-guide"
          className="text-xs font-semibold text-[#52796f] hover:text-[#0f2c20] underline underline-offset-4"
        >
          Herbal Guide
        </Link>
      </div>

      {/* HEALTH SCREENING NOTICE IF PROFESSIONAL GUIDANCE REQUIRED */}
      {isProfessionalGuidanceRequired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-extrabold text-amber-900">
              Educational Purpose Notice (Health Screening Active)
            </p>
            <p className="text-amber-800 leading-relaxed">
              This guide is displayed strictly for botanical education and historical documentation.
              Because your personal health screening requires medical consultation, do NOT prepare or ingest
              herbal remedies without clearance from your attending physician.
            </p>
          </div>
        </div>
      )}

      {/* 2. COMPACT HEADER CARD: IMAGE, BOTANICAL BADGES, PLANT NAME */}
      <div className="bg-white rounded-3xl border border-[#dde6df] overflow-hidden shadow-xs relative">
        <div className="relative h-40 sm:h-48 w-full bg-[#f4f7f5]">
          <RecordImage
            kind="plant"
            src={plant.imageUrl}
            alt={plant.commonName}
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f2c20]/90 via-[#0f2c20]/40 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-900/90 backdrop-blur-xs text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1.5 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>DOH / PITAHC Medicinal Plant</span>
            </span>

            <span className="px-2.5 py-1 rounded-full bg-[#0f2c20]/80 backdrop-blur-xs text-emerald-300 text-[11px] font-extrabold flex items-center gap-1 border border-emerald-600/30">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>Step-by-Step Guide</span>
            </span>
          </div>

          {/* Plant Identity in Header */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                Documented Traditional Preparation
              </span>
            </div>
            <h1 className="font-heading font-black text-xl sm:text-2xl tracking-tight uppercase">
              {plant.commonName}
            </h1>
            <p className="text-white/85 italic text-xs sm:text-sm font-medium">
              {plant.scientificName}
            </p>
          </div>
        </div>

        {/* Current Active Preparation Header Bar */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#f0f6f2] to-[#faf9f5] border-t border-[#dde6df] flex flex-wrap items-center justify-between gap-2.5">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-black text-[#52796f] uppercase tracking-wider block">
              Active Selection
            </span>
            <h2 className="text-sm sm:text-base font-heading font-black text-[#0f2c20] truncate">
              {hasMultiple ? `Method ${selectedPrepIndex + 1}: ${currentPrep.title}` : currentPrep.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/community/ask?preparation=${currentPrep.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-800 to-[#0f2c20] text-emerald-100 hover:text-white text-xs font-black shadow-xs transition-transform active:scale-95 border border-emerald-700/50"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ask NaturAide</span>
            </Link>
            <span className="px-2.5 py-1 rounded-xl bg-[#0f2c20] text-emerald-300 text-xs font-black tracking-wide uppercase shadow-2xs border border-emerald-800">
              {formatPrepTypeLabel(currentPrep.preparation_type)}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. PROMINENT METHOD 1 / METHOD 2 VISIBILITY (IMMEDIATE AT TOP)       */}
      {/* ==================================================================== */}
      {hasMultiple && (
        <section className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#52796f] block">
                Available Options
              </span>
              <h2 className="text-sm sm:text-base font-heading font-extrabold text-[#0f2c20]">
                How would you like to continue?
              </h2>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 shrink-0">
              {preparations.length} Methods
            </span>
          </div>

          {/* Equal visual importance compact selector cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {preparations.map((prep, idx) => {
              const isSelected = selectedPrepIndex === idx;
              const meta = getPrepTypeMeta(prep.preparation_type);
              const IconComp = meta.icon;
              const cleanTitle = prep.title.split("/")[0].trim();

              return (
                <div
                  key={prep.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-2.5 ${
                    isSelected
                      ? "bg-gradient-to-br from-[#0f2c20] to-[#174332] text-white border-[#0f2c20] shadow-sm ring-2 ring-emerald-500/30"
                      : "bg-[#faf9f5] text-[#3d4a45] border-[#dde6df] hover:border-emerald-400 hover:bg-emerald-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-white/15 text-emerald-300" : `${meta.bgColor} ${meta.color}`
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider block ${
                            isSelected ? "text-emerald-300" : "text-[#52796f]"
                          }`}
                        >
                          Method {idx + 1}
                        </span>
                        <h3 className="font-heading font-extrabold text-xs sm:text-sm line-clamp-1">
                          {cleanTitle}
                        </h3>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-extrabold shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Short Explanation */}
                  <p
                    className={`text-[11px] leading-relaxed line-clamp-2 ${
                      isSelected ? "text-emerald-100/90" : "text-[#52796f]"
                    }`}
                  >
                    {prep.traditional_use_context || meta.shortSummary}
                  </p>

                  {/* Clear Action Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectMethod(idx)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500 text-[#0f2c20] font-black shadow-xs hover:bg-emerald-400"
                        : "bg-white border border-[#dde6df] text-[#0f2c20] hover:bg-emerald-100/60 font-extrabold"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Selected Method {idx + 1}</span>
                      </>
                    ) : (
                      <>
                        <span>Start Method {idx + 1}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 4. PROGRESSIVE DISCLOSURE WIZARD: STEP X OF 3                        */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        {/* Step Progress Indicator Bar */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#dde6df] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#52796f]">
            <span className="text-[#0f2c20]">
              Step {flowStep} of 3
            </span>
            <span className="text-emerald-800">
              {flowStep === 1 && "What You Need & Overview"}
              {flowStep === 2 && `Preparation Instructions (${currentPrep.steps.length} Steps)`}
              {flowStep === 3 && "Application & Safety Guidance"}
            </span>
          </div>

          {/* Visual Step Bar */}
          <div className="w-full h-2 rounded-full bg-[#e2ebe4] overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${(flowStep / 3) * 100}%` }}
            />
          </div>

          {/* Step Pill Selectors for Direct Jumping */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
            <button
              type="button"
              onClick={() => setFlowStep(1)}
              className={`py-1.5 px-2 rounded-xl text-center font-bold transition-all cursor-pointer truncate ${
                flowStep === 1
                  ? "bg-[#0f2c20] text-emerald-300 shadow-2xs font-extrabold"
                  : "bg-[#faf9f5] text-[#52796f] hover:text-[#0f2c20]"
              }`}
            >
              1. Materials
            </button>
            <button
              type="button"
              onClick={() => setFlowStep(2)}
              className={`py-1.5 px-2 rounded-xl text-center font-bold transition-all cursor-pointer truncate ${
                flowStep === 2
                  ? "bg-[#0f2c20] text-emerald-300 shadow-2xs font-extrabold"
                  : "bg-[#faf9f5] text-[#52796f] hover:text-[#0f2c20]"
              }`}
            >
              2. Instructions
            </button>
            <button
              type="button"
              onClick={() => setFlowStep(3)}
              className={`py-1.5 px-2 rounded-xl text-center font-bold transition-all cursor-pointer truncate ${
                flowStep === 3
                  ? "bg-[#0f2c20] text-emerald-300 shadow-2xs font-extrabold"
                  : "bg-[#faf9f5] text-[#52796f] hover:text-[#0f2c20]"
              }`}
            >
              3. Application & Safety
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* STEP 1: WHAT YOU NEED (MATERIALS & OVERVIEW)                       */}
        {/* ------------------------------------------------------------------ */}
        {flowStep === 1 && (
          <div className="space-y-4">
            {/* Quick 2-Tile Overview */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-white border border-[#dde6df] shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-[#52796f] uppercase tracking-wider block">
                    Part Used
                  </span>
                  <p className="font-black text-[#0f2c20] text-xs truncate">
                    {currentPrep.plant_part_used}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#dde6df] shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Droplets className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-[#52796f] uppercase tracking-wider block">
                    Formulation
                  </span>
                  <p className="font-black text-[#0f2c20] text-xs capitalize truncate">
                    {currentPrep.preparation_type.replace(/_/g, " ").toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Documented Traditional Use Context */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-[#0f2c20]">
                <Coffee className="w-4 h-4 text-emerald-800 shrink-0" />
                <h3 className="font-heading font-extrabold text-sm sm:text-base">
                  Documented Traditional Context
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#3d4a45] leading-relaxed">
                {currentPrep.traditional_use_context}
              </p>
            </div>

            {/* Materials & Measurements Checklist */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-800" />
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                    What You Need
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {currentPrep.materials.length} {currentPrep.materials.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              <p className="text-xs text-[#52796f]">
                Gather the verified ingredients below before beginning preparation. Tap each item to mark it ready:
              </p>

              {currentPrep.materials.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {currentPrep.materials.map((mat, i) => {
                    const matKey = `${currentPrep.id}_mat_${mat.id || i}`;
                    const isChecked = Boolean(checkedMaterials[matKey]);
                    const hasExactAmount = mat.amount && mat.amount.trim() !== "";

                    return (
                      <button
                        key={mat.id || i}
                        type="button"
                        onClick={() => toggleMaterialCheck(matKey)}
                        className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                          isChecked
                            ? "bg-emerald-50/80 border-emerald-500/80 text-[#0f2c20]"
                            : "bg-[#faf9f5] border-[#dde6df] text-[#3d4a45] hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors border ${
                              isChecked
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white border-[#dde6df]"
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </span>
                          <span
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isChecked ? "line-through text-[#52796f]" : "text-[#0f2c20]"
                            }`}
                          >
                            {mat.material_name}
                          </span>
                        </div>

                        <div className="shrink-0">
                          {hasExactAmount ? (
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-white border border-[#dde6df] text-[#0f2c20] font-black text-xs">
                              {mat.amount} {mat.unit || ""}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#52796f] italic">
                              As needed
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#52796f] italic bg-[#faf9f5] p-3 rounded-2xl">
                  Specific preparation quantities are not documented by the source.
                </p>
              )}
            </div>

            {/* Step 1 Next Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setFlowStep(2)}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0f2c20] hover:bg-[#164a35] active:scale-[0.98] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <span>Continue to Step-by-Step Instructions (Step 2 of 3)</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: STEP-BY-STEP INSTRUCTIONS                                  */}
        {/* ------------------------------------------------------------------ */}
        {flowStep === 2 && (
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-800" />
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                    Step-by-Step Instructions
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Instruction {instructionIndex + 1} of {currentPrep.steps.length}
                </span>
              </div>

              {/* Sub-step indicator pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {currentPrep.steps.map((s, idx) => (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => {
                      setInstructionIndex(idx);
                      setShowAllInstructions(false);
                    }}
                    className={`py-1 px-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      instructionIndex === idx && !showAllInstructions
                        ? "bg-[#0f2c20] text-emerald-300 shadow-2xs scale-105"
                        : "bg-[#faf9f5] border border-[#dde6df] text-[#52796f] hover:bg-emerald-50"
                    }`}
                  >
                    Step {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAllInstructions(!showAllInstructions)}
                  className={`py-1 px-2.5 rounded-xl text-[11px] font-bold transition-all shrink-0 ml-auto cursor-pointer ${
                    showAllInstructions
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "text-[#52796f] hover:text-[#0f2c20]"
                  }`}
                >
                  {showAllInstructions ? "Show Step-by-Step" : "View All Steps"}
                </button>
              </div>

              {/* Active Step Focused Card */}
              {!showAllInstructions ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#faf9f5] via-white to-emerald-50/30 border border-[#dde6df] space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300/60">
                      Step {instructionIndex + 1} of {currentPrep.steps.length}
                    </span>
                    <span className="text-[11px] font-semibold text-[#52796f]">
                      {currentPrep.title.split("/")[0].trim()}
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0f2c20] text-emerald-300 flex items-center justify-center font-heading font-black text-sm shrink-0 shadow-2xs">
                      {instructionIndex + 1}
                    </div>
                    <p className="text-sm sm:text-base text-[#0f2c20] font-medium leading-relaxed pt-0.5">
                      {currentPrep.steps[instructionIndex]?.instruction}
                    </p>
                  </div>

                  {/* Sub-step navigation */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#f0f4f1]">
                    <button
                      type="button"
                      onClick={() => setInstructionIndex(Math.max(0, instructionIndex - 1))}
                      disabled={instructionIndex === 0}
                      className="px-3 py-1.5 rounded-xl border border-[#dde6df] text-xs font-bold text-[#0f2c20] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
                    >
                      ← Previous Step
                    </button>

                    <button
                      type="button"
                      onClick={() => setInstructionIndex(Math.min(currentPrep.steps.length - 1, instructionIndex + 1))}
                      disabled={instructionIndex >= currentPrep.steps.length - 1}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                    >
                      Next Step →
                    </button>
                  </div>
                </div>
              ) : (
                /* All Steps List Format (progressive toggle) */
                <div className="space-y-2.5">
                  {currentPrep.steps.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] flex items-start gap-3 text-xs sm:text-sm text-[#3d4a45]"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#0f2c20] text-emerald-300 flex items-center justify-center font-heading font-black text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 font-medium leading-relaxed">
                        {s.instruction}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Back / Next Flow Navigation */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFlowStep(1)}
                className="px-4 py-3 rounded-2xl border border-[#dde6df] bg-white hover:bg-[#faf9f5] text-xs sm:text-sm font-bold text-[#0f2c20] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Materials</span>
              </button>

              <button
                type="button"
                onClick={() => setFlowStep(3)}
                className="px-5 py-3 rounded-2xl bg-[#0f2c20] hover:bg-[#164a35] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <span>Continue to Application & Safety (Step 3 of 3)</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 3: APPLICATION, SAFETY GUIDANCE & CITATIONS                   */}
        {/* ------------------------------------------------------------------ */}
        {flowStep === 3 && (
          <div className="space-y-4">
            {/* Administration / Application instructions */}
            {currentPrep.administration_instructions && (
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-2">
                <h3 className="font-heading font-extrabold text-xs sm:text-sm text-[#0f2c20] uppercase tracking-wider">
                  How It Is Traditionally Applied / Administered
                </h3>
                <p className="text-xs sm:text-sm text-[#3d4a45] leading-relaxed bg-[#f8faf8] p-3.5 rounded-2xl border border-emerald-100">
                  {currentPrep.administration_instructions}
                </p>
              </div>
            )}

            {/* Important Precautions */}
            {currentPrep.precautions.length > 0 && (
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-rose-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                  <h3 className="font-heading font-extrabold text-sm sm:text-base">
                    Important Source-Backed Precautions
                  </h3>
                </div>

                <div className="space-y-2">
                  {currentPrep.precautions.map((p, i) => (
                    <div
                      key={p.id || i}
                      className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/60 flex items-start gap-2.5 text-xs text-rose-950"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-medium">{p.precaution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* When to Seek Medical Guidance */}
            {currentPrep.when_to_seek_guidance && (
              <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-950 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-extrabold text-amber-900 text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>When to Seek Medical Attention</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                  {currentPrep.when_to_seek_guidance}
                </p>
              </div>
            )}

            {/* Clinical Evidence & Literature References */}
            {currentPrep.references.length > 0 && (
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#0f2c20]">
                    <BookOpen className="w-4 h-4 text-emerald-800" />
                    <h3 className="font-heading font-extrabold text-sm sm:text-base">
                      Documented Sources & References
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#52796f]">
                    {currentPrep.references.length} Verified
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentPrep.references.map((ref, idx) => {
                    const badge = formatSourceTypeBadge(ref.source_type);
                    return (
                      <div
                        key={ref.id || idx}
                        className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-1.5 text-xs hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          {ref.publication_year && (
                            <span className="text-[11px] font-bold text-[#52796f]">
                              {ref.publication_year}
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-[#0f2c20] leading-snug">
                          {ref.source_title}
                        </p>

                        <p className="text-[11px] text-[#52796f]">
                          {ref.organization_or_authors}
                        </p>

                        {ref.source_url && (
                          <a
                            href={ref.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 pt-1"
                          >
                            <span>View Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ask NaturAide Assistant Consultation Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-900 to-[#0f2c20] text-white shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-300" />
                <h3 className="font-heading font-extrabold text-sm sm:text-base">
                  Have questions about this preparation?
                </h3>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Ask NaturAide provides grounded answers regarding precautions, preparation steps, and scientific evidence for {plant.commonName}.
              </p>
              <Link
                href={`/community/ask?preparation=${currentPrep.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0f2c20] hover:bg-emerald-50 text-xs font-black shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <span>Consult Ask NaturAide</span>
                <ChevronRight className="w-4 h-4 text-emerald-800" />
              </Link>
            </div>

            {/* Back to Steps & Complete Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFlowStep(2)}
                className="px-4 py-3 rounded-2xl border border-[#dde6df] bg-white hover:bg-[#faf9f5] text-xs sm:text-sm font-bold text-[#0f2c20] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Instructions</span>
              </button>

              {hasMultiple ? (
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (selectedPrepIndex + 1) % preparations.length;
                    handleSelectMethod(nextIdx);
                  }}
                  className="px-5 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <span>Switch to Method {((selectedPrepIndex + 1) % preparations.length) + 1}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </button>
              ) : (
                <Link
                  href={`/community/plants/${plant.slug}`}
                  className="px-5 py-3 rounded-2xl bg-[#0f2c20] hover:bg-[#164a35] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Finished Guide</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
