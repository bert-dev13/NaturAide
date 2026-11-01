"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Droplets,
  ExternalLink,
  FileText,
  FlaskConical,
  Info,
  Leaf,
  Loader2,
  Pill,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Eye,
  Sliders,
  FileCheck,
} from "lucide-react";
import ResearchStageFooter from "@/components/researcher/stage/ResearchStageFooter";

// Reusable Research Section wrapper matching Stages 1-3
function ResearchSection({
  id,
  number,
  icon: Icon,
  title,
  subtitle,
  children,
  headerAction,
}: {
  id: string;
  number: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-3xl border border-[#dde6df] bg-white p-5 sm:p-7 shadow-2xs space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#edf2ee]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-200/60">
            {number}
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-heading font-extrabold text-[#0f2c20] tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-[#6b7c76]">{subtitle}</p>
          </div>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      {children}
    </section>
  );
}

// Centered Modal matching Stages 1-3
function CenteredModal({
  title,
  subtitle,
  children,
  onClose,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-[#dde6df] shadow-2xl p-6 sm:p-7 space-y-4 text-slate-900`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
          <div>
            <h3 className="text-sm font-black text-[#0f2c20] uppercase tracking-wider">{title}</h3>
            {subtitle && <p className="text-xs text-[#78997f]">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </motion.div>
    </div>
  );
}

const FORMULATION_TYPES = [
  "Research Extract",
  "Standardized Extract",
  "Aqueous Decoction",
  "Hydroalcoholic Tincture",
  "Suspension Prototype",
  "Solid Dose / Capsule Filling",
];

const COMMON_PLANT_PARTS = [
  "Leaves",
  "Rhizome",
  "Root",
  "Aerial Parts",
  "Bark / Stem",
  "Seeds",
  "Whole Plant",
  "Flowers / Inflorescence",
];

const COMMON_SOLVENTS = [
  "80% Aqueous Ethanol",
  "70% Aqueous Ethanol",
  "95% Ethanol",
  "Distilled Water (Aqueous)",
  "Methanol",
  "Hydroalcoholic (50:50)",
  "Ethyl Acetate",
];

const COMMON_METHODS = [
  "Cold Maceration + Rotary Evaporation",
  "Soxhlet Extraction",
  "Ultrasonic-Assisted Extraction (UAE)",
  "Decoction (Boiling Aqueous)",
  "Percolation",
  "Supercritical Fluid Extraction (SFE)",
];

const COMMON_UNITS = ["mg/g", "µg/mL", "% w/w", "mg/dose", "mg/mL", "ppm"];

const COMMON_ROLES = [
  "Bioactive Marker Fraction",
  "Primary Active Constituent",
  "Standardized Phytochemical Marker",
  "Secondary Active Fraction",
];

interface FormulationSafetyClientProps {
  projectId: number;
  project: any;
  plantData: any;
  compounds: any[];
  dockingRuns?: any[];
  initialFormulation?: any;
  initialComponents?: any[];
  initialSteps?: any[];
  stageStatus?: string;
  reviewStatus?: string;
  reviewerFeedback?: any[];
}

export default function FormulationSafetyClient({
  projectId,
  project,
  plantData,
  compounds = [],
  dockingRuns = [],
  initialFormulation,
  initialComponents = [],
  initialSteps = [],
  stageStatus: initialStageStatus = "IN_PROGRESS",
  reviewStatus: initialReviewStatus = "NOT_SUBMITTED",
  reviewerFeedback = [],
}: FormulationSafetyClientProps) {
  const router = useRouter();

  // Active anchor for one-scroll tabs
  const [activeAnchor, setActiveAnchor] = useState<string>("sec-formulation");

  // Section 01: Formulation inputs
  const [formulationType, setFormulationType] = useState<string>(
    initialFormulation?.formulationType || "Research Extract"
  );
  const [plantPart, setPlantPart] = useState<string>(
    plantData?.partsStudied || "Leaves"
  );
  const [extractionSolvent, setExtractionSolvent] = useState<string>(
    plantData?.extractionSolvent || "80% Aqueous Ethanol"
  );
  const [extractionMethod, setExtractionMethod] = useState<string>(
    plantData?.extractionMethod || "Cold Maceration + Rotary Evaporation"
  );
  const [purpose, setPurpose] = useState<string>(
    initialFormulation?.researchPurpose ||
      `Investigate candidate anti-inflammatory and antioxidant botanical extract formulation enriched in standardized phytochemical fractions.`
  );
  const [formulationName, setFormulationName] = useState<string>(
    initialFormulation?.formulationName || `${project.plantName || "Botanical"} Research Extract`
  );

  // Section 02: Candidate compounds carried forward
  const candidateCompounds = useMemo(() => {
    // Stage 2/3 candidates: compounds selected for docking or present in compounds list
    const candidates = compounds.filter(
      (c) => Number(c.selectedForDocking) === 1 || compounds.length <= 3
    );
    return candidates.length > 0 ? candidates : compounds.slice(0, 3);
  }, [compounds]);

  // Map existing component values
  const [compositionData, setCompositionData] = useState<
    Record<
      string,
      {
        amount: string;
        unit: string;
        concentration: string;
        preparationRole: string;
        notes: string;
      }
    >
  >(() => {
    const map: Record<string, any> = {};
    for (const comp of candidateCompounds) {
      const existing = initialComponents.find(
        (c: any) =>
          c.componentName?.toLowerCase() === comp.compoundName?.toLowerCase() ||
          c.id === comp.id
      );
      map[comp.compoundName] = {
        amount: existing?.quantity || "",
        unit: existing?.unit || "mg/g",
        concentration: existing?.concentration || "",
        preparationRole: existing?.roleInFormulation || "Bioactive Marker Fraction",
        notes: existing?.notes || "",
      };
    }
    return map;
  });

  // Section 03: Documentation
  const [notes, setNotes] = useState<string>(
    initialFormulation?.notes ||
      `Cold maceration performed under controlled ambient temperature (22-25°C) shielded from direct light. Solvent removed under reduced pressure to preserve heat-labile bioactive marker fractions.`
  );

  // Step-by-step SOP
  const [sopSteps, setSopSteps] = useState<
    Array<{ stepNumber: number; text: string; equipment?: string; duration?: string; temperature?: string }>
  >(() => {
    if (initialSteps.length > 0) {
      return initialSteps.map((s: any, idx: number) => ({
        stepNumber: s.stepNumber || idx + 1,
        text: s.procedureText || s.text || "",
        equipment: s.equipment || "",
        duration: s.duration || "",
        temperature: s.temperature || "",
      }));
    }
    // Default standard operating procedure based on selected plant & method
    return [
      {
        stepNumber: 1,
        text: `Weigh dried and authenticated ${project.plantName || "plant"} ${plantPart.toLowerCase() || "material"}. Grind to coarse powder (mesh size 40-60).`,
        equipment: "Analytical Balance & Laboratory Mill",
        duration: "30 min",
        temperature: "Room Temperature (22-25°C)",
      },
      {
        stepNumber: 2,
        text: `Macerate ground plant material with ${extractionSolvent || "80% Aqueous Ethanol"} in a 1:10 (w/v) ratio with intermittent mechanical agitation.`,
        equipment: "Maceration Flask & Orbital Shaker",
        duration: "48 hours",
        temperature: "Room Temperature (shielded from light)",
      },
      {
        stepNumber: 3,
        text: "Filter the extract suspension through Whatman No. 1 filter paper under vacuum. Collect clear filtrate.",
        equipment: "Büchner Funnel & Vacuum Pump",
        duration: "45 min",
        temperature: "22-25°C",
      },
      {
        stepNumber: 4,
        text: "Concentrate the filtrate to dryness using rotary evaporator at 40°C under reduced pressure. Store crude extract in amber glass vial at -20°C.",
        equipment: "Rotary Evaporator & Vacuum Bath",
        duration: "2-3 hours",
        temperature: "40°C",
      },
    ];
  });

  // SOP Modal & State
  const [showSopModal, setShowSopModal] = useState<boolean>(false);
  const [newStepText, setNewStepText] = useState<string>("");

  // Save & Stage Progression State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [completingStage, setCompletingStage] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Review states
  const [stageStatus, setStageStatus] = useState<string>(initialStageStatus);
  const [reviewStatus, setReviewStatus] = useState<string>(initialReviewStatus);

  const isStageCompleted = stageStatus === "COMPLETED";
  const isReviewApproved = reviewStatus === "APPROVED" || reviewStatus === "ACCEPTED";
  const isReviewPending = reviewStatus === "PENDING";
  const isUnderReview = reviewStatus === "IN_REVIEW";
  const isRevisionRequired = reviewStatus === "REVISION_REQUIRED" || stageStatus === "REVISION_REQUIRED";
  const isReviewLocked = isUnderReview;

  // Scrollspy to update active tab
  useEffect(() => {
    const sections = ["sec-formulation", "sec-composition", "sec-documentation"];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveAnchor(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Map docking affinities to candidate compounds
  const compoundDockingMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const run of dockingRuns) {
      const name = (run.ligandName || "").trim().toLowerCase();
      if (!map.has(name) && run.bindingAffinity) {
        map.set(name, run);
      }
    }
    return map;
  }, [dockingRuns]);

  // Update composition field
  const handleCompositionChange = (
    compoundName: string,
    field: "amount" | "unit" | "concentration" | "preparationRole" | "notes",
    val: string
  ) => {
    setCompositionData((prev) => ({
      ...prev,
      [compoundName]: {
        ...prev[compoundName],
        [field]: val,
      },
    }));
  };

  // Add SOP step
  const handleAddSopStep = () => {
    if (!newStepText.trim()) return;
    setSopSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        text: newStepText.trim(),
        equipment: "Standard Laboratory Apparatus",
        duration: "As needed",
        temperature: "Room Temperature",
      },
    ]);
    setNewStepText("");
  };

  // Remove SOP step
  const handleRemoveSopStep = (index: number) => {
    setSopSteps((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      return updated.map((item, idx) => ({ ...item, stepNumber: idx + 1 }));
    });
  };

  // Build payload
  const buildPayload = () => {
    const compoundList = candidateCompounds.map((c) => ({
      compoundId: c.id,
      compoundName: c.compoundName,
      amount: compositionData[c.compoundName]?.amount || "",
      unit: compositionData[c.compoundName]?.unit || "mg/g",
      concentration: compositionData[c.compoundName]?.concentration || "",
      preparationRole: compositionData[c.compoundName]?.preparationRole || "Bioactive Marker Fraction",
      notes: compositionData[c.compoundName]?.notes || "",
    }));

    return {
      formulationType,
      plantPart,
      extractionSolvent,
      extractionMethod,
      purpose,
      formulationName,
      plantName: project.plantName,
      compounds: compoundList,
      notes,
      sopSteps: sopSteps.map((s) => ({
        stepNumber: s.stepNumber,
        procedureText: s.text,
        equipment: s.equipment,
        duration: s.duration,
        temperature: s.temperature,
      })),
    };
  };

  // Save Draft Action
  const handleSaveDraft = async (silent = false) => {
    if (isReviewLocked) return;
    setIsSaving(true);
    setErrorNotice(null);
    try {
      const payload = {
        action: "save-draft",
        ...buildPayload(),
      };

      const res = await fetch(`/api/researcher/projects/${projectId}/formulation-safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save formulation draft.");

      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastSaved(`Saved at ${timeStr}`);
      if (!silent) {
        setSuccessNotice("Formulation development saved successfully.");
        setTimeout(() => setSuccessNotice(null), 3000);
      }
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to save formulation draft.");
    } finally {
      setIsSaving(false);
    }
  };

  // Complete Stage & Continue
  const handleCompleteAndContinue = async () => {
    if (completingStage) return;

    // Inline validation checks
    if (!plantPart.trim()) {
      setErrorNotice("Plant Part is required to complete Formulation Development.");
      document.getElementById("sec-formulation")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!extractionSolvent.trim()) {
      setErrorNotice("Extraction Solvent is required to complete Formulation Development.");
      document.getElementById("sec-formulation")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!extractionMethod.trim()) {
      setErrorNotice("Extraction Method is required to complete Formulation Development.");
      document.getElementById("sec-formulation")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!purpose.trim()) {
      setErrorNotice("Formulation Purpose is required to complete Formulation Development.");
      document.getElementById("sec-formulation")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setCompletingStage(true);
    setErrorNotice(null);

    try {
      const payload = {
        action: "complete-stage",
        ...buildPayload(),
      };

      const res = await fetch(`/api/researcher/projects/${projectId}/formulation-safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete Stage 4.");

      setStageStatus("COMPLETED");
      setReviewStatus("PENDING");
      setSuccessNotice("Stage 4 completed! Formulation review queued. Moving to Stage 5...");

      const targetUrl = data.redirectUrl || `/researcher/projects/${projectId}/completion-integration`;
      setTimeout(() => {
        router.push(targetUrl);
      }, 500);
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to complete Stage 4.");
      setCompletingStage(false);
    }
  };

  // Optional AI helper for summary notes
  const handleAssistSummary = () => {
    const topCompound = candidateCompounds[0]?.compoundName || "active phytochemicals";
    const generated = `Standardized ${formulationType.toLowerCase()} prepared from authenticated ${project.plantName || "medicinal plant"} ${plantPart.toLowerCase()}. Extraction conducted via ${extractionMethod} utilizing ${extractionSolvent}. Formulated to deliver quantified concentrations of ${topCompound} while maintaining phytochemical integrity. SOP validated for reproducible extraction yield and laboratory bench compounding.`;
    setNotes(generated);
    setSuccessNotice("Formulation summary notes generated.");
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <div className="w-full max-w-full space-y-8 px-2 pt-6 pb-28 font-sans sm:px-4 lg:px-6">
      {/* ============================================================== */}
      {/* 1. STAGES 1-3 STYLE LUXURY COMPACT EMERALD HEADER              */}
      {/* ============================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-2.5"
      >
        <div className="flex items-center justify-between px-0.5">
          <Link
            href={`/researcher/projects/${projectId}/docking`}
            className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#52645d] hover:text-[#0f2c20] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 transition-transform group-hover:-translate-x-1" />
            <span>Back to Stage 3 (Molecular Docking)</span>
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-emerald-700/40 bg-gradient-to-br from-[#072418] via-[#0d3626] to-[#041910] p-6 text-white shadow-xl shadow-emerald-950/20">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-2xl" />
          <div className="pointer-events-none absolute left-1/3 -bottom-12 h-36 w-36 rounded-full bg-teal-400/10 blur-2xl" />

          <div className="relative z-10 space-y-2">
            <span className="font-mono text-[10px] font-black tracking-widest text-emerald-300 uppercase block">
              STAGE 04 / 06
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-2xs">
              Formulation Development
            </h1>
            <p className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-medium">
              <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-extrabold text-emerald-300">
                {project.plantName || "Botanical Specimen"}
              </span>
              {project.plantScientificName && (
                <span className="font-serif italic text-emerald-100/80">
                  · {project.plantScientificName}
                </span>
              )}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              {isReviewApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold backdrop-blur-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Professionally Approved</span>
                  <span className="text-emerald-400/60">·</span>
                  <span className="text-white">Pharmacist / Pharmaceutical Scientist · Formulation</span>
                </span>
              ) : isUnderReview ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 font-bold backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Under Professional Review</span>
                  <span className="text-blue-300/60">·</span>
                  <span className="text-white">Pharmacist / Pharmaceutical Scientist · Formulation</span>
                </span>
              ) : isReviewPending ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 font-bold backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Review Queued</span>
                  <span className="text-blue-300/60">·</span>
                  <span className="text-white">Pharmacist / Pharmaceutical Scientist · Formulation</span>
                </span>
              ) : isRevisionRequired ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold backdrop-blur-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Revision Required</span>
                  <span className="text-amber-300/60">·</span>
                  <span className="text-white">Pharmacist / Pharmaceutical Scientist · Formulation</span>
                </span>
              ) : isStageCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold backdrop-blur-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Research Completed</span>
                  <span className="text-emerald-400/60">·</span>
                  <span className="text-white">Pharmacist / Pharmaceutical Scientist · Formulation</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-slate-200 font-semibold backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>In Progress</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-white">Pharmacist / Pharmaceutical Scientist · Formulation</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ERROR & SUCCESS NOTICES */}
      <div className="w-full space-y-2">
        {errorNotice && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-600 hover:text-rose-900 font-bold p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* STICKY TAB NAVIGATION (3 SECTIONS)                             */}
      {/* ============================================================== */}
      <div className="sticky top-4 z-20 flex w-full justify-center">
        <div className="flex items-center gap-1 sm:gap-2 rounded-full border border-[#dde6df] bg-white/95 p-1.5 shadow-lg backdrop-blur-md">
          <a
            href="#sec-formulation"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeAnchor === "sec-formulation"
                ? "bg-[#0f2c20] text-emerald-300 shadow-sm"
                : "text-[#52645d] hover:text-[#0f2c20] hover:bg-slate-100"
            }`}
          >
            <span>01 Formulation</span>
          </a>
          <a
            href="#sec-composition"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeAnchor === "sec-composition"
                ? "bg-[#0f2c20] text-emerald-300 shadow-sm"
                : "text-[#52645d] hover:text-[#0f2c20] hover:bg-slate-100"
            }`}
          >
            <span>02 Composition</span>
          </a>
          <a
            href="#sec-documentation"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeAnchor === "sec-documentation"
                ? "bg-[#0f2c20] text-emerald-300 shadow-sm"
                : "text-[#52645d] hover:text-[#0f2c20] hover:bg-slate-100"
            }`}
          >
            <span>03 Documentation</span>
          </a>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 01: FORMULATION                                        */}
      {/* ============================================================== */}
      <ResearchSection
        id="sec-formulation"
        number="01"
        icon={FlaskConical}
        title="Formulation"
        subtitle="Botanical extract architecture & preparation parameters"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Formulation Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0f2c20] block">
              Formulation Type <span className="text-emerald-700">*</span>
            </label>
            <select
              value={formulationType}
              onChange={(e) => setFormulationType(e.target.value)}
              disabled={isReviewLocked}
              className="w-full p-3 rounded-xl border border-[#dde6df] bg-white text-xs font-bold text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
            >
              {FORMULATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#78997f]">Target pharmaceutical or herbal preparation delivery format</p>
          </div>

          {/* Plant Material (Preloaded from Project) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0f2c20] block">
              Plant Material
            </label>
            <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-extrabold text-[#0f2c20]">{project.plantName}</span>
                {project.plantScientificName && (
                  <span className="text-xs font-serif italic text-emerald-800">· {project.plantScientificName}</span>
                )}
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase px-2 py-0.5 rounded bg-white border border-emerald-200">
                Stage 1 Specimen
              </span>
            </div>
            <p className="text-[11px] text-[#78997f]">Authenticated specimen carried forward from Stage 1</p>
          </div>

          {/* Plant Part */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0f2c20] block">
              Plant Part <span className="text-emerald-700">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={COMMON_PLANT_PARTS.includes(plantPart) ? plantPart : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") setPlantPart(e.target.value);
                }}
                disabled={isReviewLocked}
                className="w-1/2 p-3 rounded-xl border border-[#dde6df] bg-white text-xs font-bold text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              >
                {COMMON_PLANT_PARTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="custom">Other (Specify)</option>
              </select>
              <input
                type="text"
                value={plantPart}
                onChange={(e) => setPlantPart(e.target.value)}
                disabled={isReviewLocked}
                placeholder="Specific plant anatomical part..."
                className="w-1/2 p-3 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-medium"
              />
            </div>
            <p className="text-[11px] text-[#78997f]">Plant anatomical part used for extraction (e.g. Leaves, Rhizome)</p>
          </div>

          {/* Extraction Solvent */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0f2c20] block">
              Extraction Solvent <span className="text-emerald-700">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={COMMON_SOLVENTS.includes(extractionSolvent) ? extractionSolvent : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") setExtractionSolvent(e.target.value);
                }}
                disabled={isReviewLocked}
                className="w-1/2 p-3 rounded-xl border border-[#dde6df] bg-white text-xs font-bold text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              >
                {COMMON_SOLVENTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="custom">Other (Specify)</option>
              </select>
              <input
                type="text"
                value={extractionSolvent}
                onChange={(e) => setExtractionSolvent(e.target.value)}
                disabled={isReviewLocked}
                placeholder="Solvent composition & ratio..."
                className="w-1/2 p-3 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-medium"
              />
            </div>
            <p className="text-[11px] text-[#78997f]">Liquid medium utilized for secondary metabolite recovery</p>
          </div>

          {/* Extraction Method */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#0f2c20] block">
              Extraction Method <span className="text-emerald-700">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={COMMON_METHODS.includes(extractionMethod) ? extractionMethod : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") setExtractionMethod(e.target.value);
                }}
                disabled={isReviewLocked}
                className="sm:w-1/2 p-3 rounded-xl border border-[#dde6df] bg-white text-xs font-bold text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              >
                {COMMON_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="custom">Other (Specify)</option>
              </select>
              <input
                type="text"
                value={extractionMethod}
                onChange={(e) => setExtractionMethod(e.target.value)}
                disabled={isReviewLocked}
                placeholder="Method specification (e.g. Maceration, Soxhlet)..."
                className="sm:w-1/2 p-3 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-medium"
              />
            </div>
            <p className="text-[11px] text-[#78997f]">Compounding technique and separation physical parameters</p>
          </div>

          {/* Research Purpose */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#0f2c20] block">
              Formulation Purpose & Intended Scope <span className="text-emerald-700">*</span>
            </label>
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={isReviewLocked}
              placeholder="Describe the therapeutic objective, experimental target, and expected phytochemical enrichment..."
              className="w-full p-3.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none leading-relaxed font-sans"
            />
            <p className="text-[11px] text-[#78997f]">Formulation rationale, indication scope, and target efficacy delivery</p>
          </div>
        </div>
      </ResearchSection>

      {/* ============================================================== */}
      {/* SECTION 02: COMPOSITION                                        */}
      {/* ============================================================== */}
      <ResearchSection
        id="sec-composition"
        number="02"
        icon={Droplets}
        title="Composition"
        subtitle="Active phytochemical fractions carried forward from Stage 2 & Stage 3"
      >
        <div className="space-y-4">
          {candidateCompounds.length === 0 ? (
            <div className="p-8 rounded-2xl bg-amber-50/60 border border-amber-200 text-amber-900 text-center space-y-2">
              <Info className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="text-xs font-bold">No Candidate Phytochemicals Selected Yet</p>
              <p className="text-[11px] text-amber-800 max-w-md mx-auto">
                Candidate compounds screened in Stage 2 (In-Silico) and docked in Stage 3 flow automatically into Stage 4 composition.
              </p>
              <Link
                href={`/researcher/projects/${projectId}/in-silico`}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 underline pt-1"
              >
                <span>Select Candidate Compounds in Stage 2 →</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {candidateCompounds.map((compound) => {
                const name = compound.compoundName;
                const state = compositionData[name] || {
                  amount: "",
                  unit: "mg/g",
                  concentration: "",
                  preparationRole: "Bioactive Marker Fraction",
                  notes: "",
                };
                const dockingInfo = compoundDockingMap.get(name.toLowerCase());

                return (
                  <div
                    key={compound.id || name}
                    className="p-5 rounded-2xl border border-[#dde6df] bg-gradient-to-br from-emerald-50/20 via-[#fcfdfc] to-white shadow-2xs space-y-3.5 hover:border-emerald-300 transition-all"
                  >
                    {/* Compound Title & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#edf2ee]">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-900 font-bold text-xs border border-emerald-200">
                          <Pill className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-[#0f2c20]">{name}</h4>
                            {compound.molecularFormula && (
                              <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {compound.molecularFormula}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#78997f] font-semibold">
                            Source: Stage 2 Candidate → Stage 3 Docking
                          </span>
                        </div>
                      </div>

                      {/* Docking Affinity Badge */}
                      {dockingInfo && (
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <span className="font-mono text-[11px] font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">
                            AutoDock Vina: {Number(dockingInfo.bindingAffinity).toFixed(2)} kcal/mol
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Inputs: Amount/Concentration & Preparation Role */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Amount */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#0f2c20]">
                          Amount / Quantity
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={state.amount}
                            onChange={(e) => handleCompositionChange(name, "amount", e.target.value)}
                            disabled={isReviewLocked}
                            placeholder="e.g. 300"
                            className="w-2/3 p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-medium"
                          />
                          <select
                            value={state.unit}
                            onChange={(e) => handleCompositionChange(name, "unit", e.target.value)}
                            disabled={isReviewLocked}
                            className="w-1/3 p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs font-bold text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                          >
                            {COMMON_UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Concentration / Yield */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#0f2c20]">
                          Target Concentration / Yield
                        </label>
                        <input
                          type="text"
                          value={state.concentration}
                          onChange={(e) => handleCompositionChange(name, "concentration", e.target.value)}
                          disabled={isReviewLocked}
                          placeholder="e.g. 15.5% w/w or 50 µg/mL"
                          className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-medium"
                        />
                      </div>

                      {/* Preparation Role */}
                      <div className="space-y-1 sm:col-span-2 md:col-span-1">
                        <label className="text-[11px] font-bold text-[#0f2c20]">
                          Preparation / Functional Role
                        </label>
                        <select
                          value={state.preparationRole}
                          onChange={(e) => handleCompositionChange(name, "preparationRole", e.target.value)}
                          disabled={isReviewLocked}
                          className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs font-bold text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                        >
                          {COMMON_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ResearchSection>

      {/* ============================================================== */}
      {/* SECTION 03: DOCUMENTATION                                      */}
      {/* ============================================================== */}
      <ResearchSection
        id="sec-documentation"
        number="03"
        icon={FileCheck}
        title="Formulation Documentation"
        subtitle="Compounding standard operating procedure & formulation summary"
      >
        <div className="space-y-5">
          {/* RESEARCHER FORMULATION NOTES */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0f2c20] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Formulation Notes & Compounding Observations</span>
              </label>
              <button
                type="button"
                onClick={handleAssistSummary}
                disabled={isReviewLocked}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Assist with Formulation Summary</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReviewLocked}
              placeholder="Record your preparation parameters, stability observations, storage conditions, and bench compounding notes..."
              className="w-full p-3.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none leading-relaxed font-sans"
            />
          </div>

          {/* STANDARD OPERATING PROCEDURE (SOP) */}
          <div className="p-5 rounded-2xl border border-[#dde6df] bg-[#fbfcfb] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#edf2ee]">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                  Standard Operating Procedure (SOP)
                </h4>
                <p className="text-[11px] text-[#78997f]">
                  Step-by-step extraction and laboratory bench preparation protocol ({sopSteps.length} steps defined)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSopModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#dde6df] hover:bg-emerald-50 text-xs font-bold text-[#0f2c20] hover:text-emerald-900 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                <span>View Full Protocol</span>
              </button>
            </div>

            {/* List of steps */}
            <div className="space-y-2.5">
              {sopSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#e7eee9] text-xs"
                >
                  <span className="font-mono text-[10px] font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                    Step {step.stepNumber}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-[#0f2c20] font-medium leading-relaxed">{step.text}</p>
                    {(step.equipment || step.duration || step.temperature) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[#78997f]">
                        {step.equipment && <span>Equipment: <strong className="text-[#0f2c20]">{step.equipment}</strong></span>}
                        {step.duration && <span>Duration: <strong className="text-[#0f2c20]">{step.duration}</strong></span>}
                        {step.temperature && <span>Temp: <strong className="text-[#0f2c20]">{step.temperature}</strong></span>}
                      </div>
                    )}
                  </div>
                  {!isReviewLocked && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSopStep(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Step Input */}
            {!isReviewLocked && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSopStep();
                    }
                  }}
                  placeholder="Add additional extraction or compounding step..."
                  className="flex-1 p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSopStep}
                  disabled={!newStepText.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#163f2e] text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* FORMULATION SUMMARY CARD */}
          <div className="rounded-2xl border border-emerald-700/30 bg-gradient-to-br from-[#072418] via-[#0d3626] to-[#041910] p-6 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden space-y-4">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/15 blur-xl" />
            <div className="relative z-10 space-y-3">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                Formulation Architecture Summary
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs">
                  <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Plant Material</span>
                  <strong className="text-white font-black text-sm block mt-0.5 truncate">{project.plantName}</strong>
                  <span className="text-[11px] text-emerald-200/80">Part: {plantPart}</span>
                </div>

                <div className="p-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs">
                  <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Solvent & Ratio</span>
                  <strong className="text-white font-black text-sm block mt-0.5 truncate">{extractionSolvent}</strong>
                  <span className="text-[11px] text-emerald-200/80">Format: {formulationType}</span>
                </div>

                <div className="p-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs">
                  <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Extraction Method</span>
                  <strong className="text-white font-black text-sm block mt-0.5 truncate">{extractionMethod}</strong>
                  <span className="text-[11px] text-emerald-200/80">Cold macerated</span>
                </div>

                <div className="p-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs">
                  <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Active Constituents</span>
                  <strong className="text-white font-black text-sm block mt-0.5 truncate">
                    {candidateCompounds[0]?.compoundName || "Candidate Compounds"}
                  </strong>
                  <span className="text-[11px] text-emerald-200/80">
                    {candidateCompounds.length} compound{candidateCompounds.length === 1 ? "" : "s"} carried forward
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ResearchSection>

      {/* ============================================================== */}
      {/* STANDARDIZED RESEARCH STAGE FOOTER (Stages 1-6)                 */}
      {/* ============================================================== */}
      <ResearchStageFooter
        projectId={projectId}
        stageNumber={4}
        stageTitle="Formulation Development"
        backHref={`/researcher/projects/${projectId}`}
        backLabel="Back to Project"
        lastSaved={lastSaved}
        isSaving={isSaving}
        onSave={() => handleSaveDraft()}
        primaryAction={{
          label: "Continue to Safety / Clinical",
          onClick: handleCompleteAndContinue,
          loading: completingStage,
          loadingLabel: "Advancing to Safety / Clinical...",
          disabled: completingStage,
        }}
      />

      {/* ============================================================== */}
      {/* SOP PROTOCOL PREVIEW MODAL                                     */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showSopModal && (
          <CenteredModal
            title="STANDARD OPERATING PROCEDURE (SOP)"
            subtitle={`${project.plantName} Extract Preparation Protocol`}
            onClose={() => setShowSopModal(false)}
            maxWidth="max-w-3xl"
          >
            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                <h4 className="font-black text-sm text-[#0f2c20]">
                  Protocol: {formulationName}
                </h4>
                <p className="text-[#52645d]">
                  Standard extraction and compounding specification for laboratory batch research.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Material</span>
                    <strong className="text-[#0f2c20]">{project.plantName} ({plantPart})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Solvent</span>
                    <strong className="text-[#0f2c20]">{extractionSolvent}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Method</span>
                    <strong className="text-[#0f2c20]">{extractionMethod}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-black text-xs uppercase tracking-wider text-slate-700">
                  Step-by-Step Laboratory Procedure
                </h5>
                <ol className="space-y-2.5">
                  {sopSteps.map((step) => (
                    <li
                      key={step.stepNumber}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-[#0f2c20]">
                        <span>Step {step.stepNumber}</span>
                        {step.duration && (
                          <span className="font-mono text-[10px] text-slate-500">{step.duration}</span>
                        )}
                      </div>
                      <p className="text-slate-800 leading-relaxed font-medium">{step.text}</p>
                      {(step.equipment || step.temperature) && (
                        <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500">
                          {step.equipment && <span>Equipment: {step.equipment}</span>}
                          {step.temperature && <span>Temp: {step.temperature}</span>}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#edf2ee]">
                <button
                  type="button"
                  onClick={() => setShowSopModal(false)}
                  className="px-5 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#163f2e] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Close Protocol
                </button>
              </div>
            </div>
          </CenteredModal>
        )}
      </AnimatePresence>
    </div>
  );
}
