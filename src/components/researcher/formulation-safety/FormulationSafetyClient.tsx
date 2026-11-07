"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import ResearcherReviewFeedbackPanel from "@/components/researcher/stage/ResearcherReviewFeedbackPanel";
import RevisionResubmittedSuccessModal from "@/components/researcher/stage/RevisionResubmittedSuccessModal";
import AiFormulationProposalModal from "./AiFormulationProposalModal";
import AiFormulationAssistantPanel from "./AiFormulationAssistantPanel";
import FormulationCompositionTable, { type FormulationComponentItem } from "./FormulationCompositionTable";
import FormulationRationaleSection from "./FormulationRationaleSection";
import type { FormulationProposal } from "@/lib/formulation-ai-service";

// Reusable Research Section wrapper matching Stages 1-3
function ResearchSection({
  id,
  number,
  badge,
  icon: Icon,
  title,
  subtitle,
  children,
  headerAction,
  headerGradient = "from-emerald-50/80 via-teal-50/30 to-transparent",
  iconBg = "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20",
}: {
  id: string;
  number: string;
  badge?: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  headerGradient?: string;
  iconBg?: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 w-full overflow-hidden rounded-3xl bg-white border border-[#dde6df] shadow-md hover:border-emerald-400/80 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
    >
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edf2ee] bg-gradient-to-r ${headerGradient} px-6 py-4.5`}>
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 text-white shadow-md ${iconBg} shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black text-emerald-800 uppercase tracking-wider">
                {number}
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#0f2c20] tracking-tight">
                {title}
              </h2>
              {badge && (
                <span className="rounded-full bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shadow-2xs">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-[#78997f] mt-0.5">{subtitle}</p>
          </div>
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
      <div className="p-5 sm:p-7 space-y-6">{children}</div>
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
  initialRationale?: any;
  literature?: any[];
  stageStatus?: string;
  reviewStatus?: string;
  reviewerFeedback?: any[];
  overallAssessment?: string | null;
  reviewerName?: string | null;
  approvedAt?: string | null;
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
  initialRationale,
  literature = [],
  stageStatus: initialStageStatus = "IN_PROGRESS",
  reviewStatus: initialReviewStatus = "NOT_SUBMITTED",
  reviewerFeedback = [],
  overallAssessment,
  reviewerName,
  approvedAt,
}: FormulationSafetyClientProps) {
  const router = useRouter();

  const [currentReviewStatus, setCurrentReviewStatus] = useState<string | null>(initialReviewStatus || null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    discipline: string;
    profession: string;
    reviewerName?: string | null;
    reviewCycle: number;
    addressedCount: number;
  }>({
    discipline: "Formulation",
    profession: "Pharmacist / Pharmaceutical Scientist",
    reviewerName: reviewerName || null,
    reviewCycle: 1,
    addressedCount: 1,
  });

  const openReviewFeedback = React.useMemo(() => {
    return (reviewerFeedback || []).filter((f: any) => {
      const st = (f.status || "OPEN").toUpperCase();
      return st === "OPEN" || st === "IN_REVIEW";
    });
  }, [reviewerFeedback]);

  const isRevisionMode = Boolean(
    currentReviewStatus === "REVISION_REQUIRED" ||
      (openReviewFeedback.length > 0 && currentReviewStatus !== "REVISION_RESUBMITTED" && currentReviewStatus !== "APPROVED")
  );

  const [resubmitting, setResubmitting] = useState(false);

  const handleResubmitRevision = async () => {
    try {
      setResubmitting(true);
      await handleSaveDraft();

      const res = await fetch(`/api/researcher/projects/${projectId}/resubmit-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleKey: "formulation",
          stageNumber: 4,
          changesSummary: "Updated formulation design, extraction parameters, and dosage form stability.",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to resubmit revision");

      setCurrentReviewStatus("REVISION_RESUBMITTED");
      setSuccessModalData({
        discipline: json.discipline || "Formulation",
        profession: json.profession || "Pharmacist / Pharmaceutical Scientist",
        reviewerName: json.reviewerName || reviewerName || null,
        reviewCycle: json.reviewCycle || 1,
        addressedCount: reviewerFeedback?.length || 1,
      });
      setShowSuccessModal(true);

      window.dispatchEvent(
        new CustomEvent("natureaide:revisions-updated", {
          detail: { projectId, stageNumber: 4, status: "REVISION_RESUBMITTED" },
        })
      );
      window.dispatchEvent(new CustomEvent("natureaide:project-updated", { detail: { projectId } }));

      router.refresh();
    } catch (err: any) {
      console.error("Resubmit revision error:", err);
    } finally {
      setResubmitting(false);
    }
  };

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
  const [customTypeActive, setCustomTypeActive] = useState<boolean>(false);
  const [customPartActive, setCustomPartActive] = useState<boolean>(false);
  const [customSolventActive, setCustomSolventActive] = useState<boolean>(false);
  const [customMethodActive, setCustomMethodActive] = useState<boolean>(false);
  const [purpose, setPurpose] = useState<string>(
    initialFormulation?.researchPurpose ||
      `Investigate candidate anti-inflammatory and antioxidant botanical extract formulation enriched in standardized phytochemical fractions.`
  );
  const [formulationName, setFormulationName] = useState<string>(
    initialFormulation?.formulationName || `${project.plantName || "Botanical"} Research Extract`
  );
  const [dosageFormType, setDosageFormType] = useState<string>(
    initialFormulation?.dosageFormType || initialFormulation?.formulationType || "Topical Hydrogel"
  );
  const [scientificRationale, setScientificRationale] = useState<string>(
    initialRationale?.componentSelectionRationale || initialFormulation?.researcherRationale || ""
  );
  const [compatibilityConsiderations, setCompatibilityConsiderations] = useState<string>(
    initialRationale?.literatureSupport || ""
  );
  const [safetyAndLimitations, setSafetyAndLimitations] = useState<string>(
    initialRationale?.knownLimitations || ""
  );
  const [aiProposal, setAiProposal] = useState<FormulationProposal | null>(() => {
    if (initialFormulation?.aiProposalJson) {
      try {
        return typeof initialFormulation.aiProposalJson === "string"
          ? JSON.parse(initialFormulation.aiProposalJson)
          : initialFormulation.aiProposalJson;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);

  // Comprehensive Formulation Components List
  const [componentsList, setComponentsList] = useState<FormulationComponentItem[]>(() => {
    if (Array.isArray(initialComponents) && initialComponents.length > 0) {
      return initialComponents.map((c: any) => ({
        id: c.id,
        componentName: c.componentName,
        roleInFormulation: c.roleInFormulation || "Active Herbal Ingredient",
        quantity: c.quantity || "",
        unit: c.unit || "% w/w",
        proposedConcentration: c.concentration || "Concentration Requires Experimental Validation",
        scientificRationale: c.notes || "",
        sourceReference: c.sourceReference || "",
        isAiSuggested: Boolean(c.isAiSuggested),
        evidenceStatus: c.evidenceStatus || (String(c.concentration || "").toLowerCase().includes("requires") ? "REQUIRES_EXPERIMENTAL_VALIDATION" : "SUPPORTED"),
      }));
    }

    // Default seed component from plant details
    return [
      {
        componentName: `${project.plantName || "Botanical"} ${plantData?.partsStudied || "Leaf"} Extract (${plantData?.extractionSolvent || "70% Aqueous Ethanol"})`,
        roleInFormulation: "Active Herbal Ingredient",
        proposedConcentration: "Concentration Requires Experimental Validation",
        evidenceStatus: "REQUIRES_EXPERIMENTAL_VALIDATION",
        scientificRationale: `Standardized extract prepared via ${plantData?.extractionMethod || "Maceration"}. Carries candidate bioactives identified in Stage 2.`,
        sourceReference: "Stage 1 Plant Specification",
        isAiSuggested: false,
      },
    ];
  });

  // AI Generation Handler
  const handleTriggerAiGeneration = async () => {
    setIsAiModalOpen(true);
    setIsGeneratingAi(true);
    setGenerationStep(0);
    setAiError(null);

    const t1 = setTimeout(() => setGenerationStep(1), 700);
    const t2 = setTimeout(() => setGenerationStep(2), 1600);
    const t3 = setTimeout(() => setGenerationStep(3), 2500);

    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/formulation/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dosageFormType,
          plantPart,
          extractionSolvent,
          extractionMethod,
          purpose,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate formulation proposal.");

      setAiProposal(data.proposal);
    } catch (err: any) {
      setAiError(err.message || "Failed to generate formulation proposal.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsGeneratingAi(false);
    }
  };

  // Apply AI Proposal Handler
  const handleApplyProposal = (prop: FormulationProposal) => {
    if (!prop) return;
    setFormulationName(prop.formulationName);
    setDosageFormType(prop.dosageFormType);
    if (prop.scientificRationale) {
      setScientificRationale(prop.scientificRationale);
    }
    if (prop.compatibilityConsiderations) {
      setCompatibilityConsiderations(prop.compatibilityConsiderations);
    }
    if (prop.safetyAndLimitations) {
      setSafetyAndLimitations(prop.safetyAndLimitations);
    }
    if (Array.isArray(prop.components) && prop.components.length > 0) {
      setComponentsList(
        prop.components.map((c, i) => ({
          id: `ai-${Date.now()}-${i}`,
          componentName: c.componentName,
          roleInFormulation: c.roleInFormulation,
          proposedConcentration: c.proposedConcentration,
          scientificRationale: c.scientificRationale,
          sourceReference: c.sourceReference,
          isAiSuggested: true,
          evidenceStatus: c.evidenceStatus,
        }))
      );
    }
    setIsAiModalOpen(false);
    setSuccessNotice("AI Formulation Proposal applied to composition matrix.");
    setTimeout(() => setSuccessNotice(null), 4000);
  };

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

  // Save & Stage Progression State (strictly separated)
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Guarantee clean initial navigation state: never activate loading on load or back navigation
  useEffect(() => {
    setIsContinuing(false);
    setIsSaving(false);
    return () => {
      setIsContinuing(false);
      setIsSaving(false);
    };
  }, []);

  // Pure Back navigation handler (NEVER triggers stage completion or advancement)
  const handleBack = useCallback(() => {
    console.log("[FormulationSafetyClient] BACK_CLICK - Pure navigation to Molecular Docking");
    router.push(`/researcher/projects/${projectId}/docking`);
  }, [projectId, router]);

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
      dosageFormType,
      plantPart,
      extractionSolvent,
      extractionMethod,
      purpose,
      formulationName,
      scientificRationale,
      compatibilityConsiderations,
      safetyAndLimitations,
      plantName: project.plantName,
      components: componentsList,
      compounds: compoundList,
      notes,
      aiProposal,
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

  // Complete Stage & Continue (triggered ONLY by explicit user click on Continue)
  const handleCompleteAndContinue = async () => {
    if (isContinuing || isSaving) return;

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

    setIsContinuing(true);
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

      const targetUrl = data.redirectUrl || `/researcher/projects/${projectId}/safety`;
      setTimeout(() => {
        router.push(targetUrl);
      }, 500);
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to complete Stage 4.");
    } finally {
      setIsContinuing(false);
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
        <div className="flex flex-wrap items-center justify-between gap-3 px-0.5">
          <div className="flex items-center gap-2.5 text-xs">
            <Link
              href={`/researcher/projects/${projectId}`}
              className="group inline-flex items-center gap-1.5 font-bold text-[#52645d] hover:text-[#0f2c20] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 transition-transform group-hover:-translate-x-1" />
              <span>Back to Project</span>
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href={`/researcher/projects/${projectId}/docking`}
              className="font-semibold text-[#52645d] hover:text-[#0f2c20] transition-colors"
            >
              Stage 3: Molecular Docking
            </Link>
          </div>

          {!isReviewLocked && (
            <button
              type="button"
              onClick={handleTriggerAiGeneration}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI Formulation</span>
            </button>
          )}
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

      {/* Formulation Review Revision & Feedback Panel */}
      <ResearcherReviewFeedbackPanel
        projectId={projectId}
        stageTitle="Stage 4 · Formulation Development"
        discipline="Formulation"
        overallAssessment={overallAssessment}
        reviewStatus={currentReviewStatus}
        recommendations={openReviewFeedback.length > 0 ? openReviewFeedback : reviewerFeedback || []}
        reviewerName={reviewerName}
        approvedAt={approvedAt}
      />

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
      {/* 2. STAGE 2/3-STYLE STICKY TAB NAVIGATION                        */}
      {/* ============================================================== */}
      <div className="sticky top-4 z-20 flex items-center justify-between gap-2 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xs backdrop-blur-md no-scrollbar">
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { id: "sec-formulation", number: "01", label: "Formulation", count: 1 },
            { id: "sec-composition", number: "02", label: "Composition", count: candidateCompounds.length },
            { id: "sec-documentation", number: "03", label: "Documentation", count: sopSteps.length },
          ].map((tab) => {
            const isActive = activeAnchor === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveAnchor(tab.id);
                  document.getElementById(tab.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#0f2c20] text-emerald-300 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">{tab.number}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      isActive
                        ? "bg-emerald-800 text-emerald-100"
                        : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-1 text-xs">
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            {candidateCompounds.length} compound{candidateCompounds.length === 1 ? "" : "s"} · {sopSteps.length} step{sopSteps.length === 1 ? "" : "s"}
          </span>
          {isSaving ? (
            <span className="text-[11px] font-medium text-amber-600">Saving...</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 01: FORMULATION                                        */}
      {/* ============================================================== */}
      <ResearchSection
        id="sec-formulation"
        number="01"
        badge="Extract Specification"
        icon={FlaskConical}
        title="Formulation Architecture"
        subtitle="Botanical extract specification, specimen provenance & solvent parameters"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Formulation Type Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-emerald-400 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:bg-white transition-all shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                <span>Formulation Type <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                Format
              </span>
            </div>
            <p className="text-xs text-[#78997f]">
              Target pharmaceutical or herbal preparation delivery format.
            </p>
            <div className="space-y-2 pt-0.5">
              <div className="relative">
                <select
                  value={FORMULATION_TYPES.includes(formulationType) ? formulationType : (customTypeActive || formulationType ? "__custom__" : "")}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setCustomTypeActive(true);
                    } else {
                      setCustomTypeActive(false);
                      setFormulationType(e.target.value);
                    }
                  }}
                  disabled={isReviewLocked}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#0f2c20] hover:border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none shadow-2xs transition-all cursor-pointer"
                >
                  <option value="" disabled>Select formulation type...</option>
                  {FORMULATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="__custom__">Custom Formulation Format...</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {(customTypeActive || (!FORMULATION_TYPES.includes(formulationType) && formulationType !== "")) && (
                <input
                  type="text"
                  value={formulationType}
                  onChange={(e) => setFormulationType(e.target.value)}
                  disabled={isReviewLocked}
                  placeholder="Enter custom formulation format..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-[#0f2c20] focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-2xs"
                />
              )}
            </div>
          </div>

          {/* Plant Material (Preloaded from Stage 1) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white border border-emerald-200/90 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>Botanical Specimen</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase px-2.5 py-0.5 rounded-full bg-white border border-emerald-300 shadow-2xs">
                Stage 1 Verified
              </span>
            </div>
            <p className="text-xs text-[#78997f]">
              Authenticated botanical specimen and verified provenance carried forward from Stage 1.
            </p>
            <div className="p-3 sm:p-3.5 rounded-xl border border-emerald-200/80 bg-white/90 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-[#0f2c20] truncate">{project.plantName}</h3>
                  {project.plantScientificName && (
                    <p className="text-[11px] font-serif italic text-emerald-800 truncate">
                      {project.plantScientificName}
                    </p>
                  )}
                </div>
              </div>
              {plantData?.specimenSource && (
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5 border-t border-emerald-100/60">
                  <span className="font-bold text-[#0f2c20] shrink-0">Provenance:</span>
                  <span className="truncate">{plantData.specimenSource}</span>
                </div>
              )}
            </div>
          </div>

          {/* Plant Part */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-emerald-400 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:bg-white transition-all shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>Plant Anatomical Part <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                Organ
              </span>
            </div>
            <p className="text-xs text-[#78997f]">
              Plant anatomical organ harvested for extraction.
            </p>
            <div className="space-y-2 pt-0.5">
              <div className="relative">
                <select
                  value={
                    COMMON_PLANT_PARTS.some((p) => p.toLowerCase() === plantPart.toLowerCase())
                      ? COMMON_PLANT_PARTS.find((p) => p.toLowerCase() === plantPart.toLowerCase())
                      : customPartActive || plantPart
                      ? "__custom__"
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setCustomPartActive(true);
                    } else {
                      setCustomPartActive(false);
                      setPlantPart(e.target.value);
                    }
                  }}
                  disabled={isReviewLocked}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#0f2c20] hover:border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none shadow-2xs transition-all cursor-pointer"
                >
                  <option value="" disabled>Select plant anatomical part...</option>
                  {COMMON_PLANT_PARTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="__custom__">Custom Specification...</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {(customPartActive ||
                (!COMMON_PLANT_PARTS.some((p) => p.toLowerCase() === plantPart.toLowerCase()) &&
                  plantPart !== "")) && (
                <input
                  type="text"
                  value={plantPart}
                  onChange={(e) => setPlantPart(e.target.value)}
                  disabled={isReviewLocked}
                  placeholder="Enter exact anatomical part specification..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-[#0f2c20] focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-2xs"
                />
              )}
            </div>
          </div>

          {/* Extraction Solvent */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-emerald-400 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:bg-white transition-all shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-emerald-600" />
                <span>Extraction Solvent & Ratio <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                Solvent
              </span>
            </div>
            <p className="text-xs text-[#78997f]">
              Medium utilized for phytochemical recovery and metabolite solubility.
            </p>
            <div className="space-y-2 pt-0.5">
              <div className="relative">
                <select
                  value={
                    COMMON_SOLVENTS.some((s) => s.toLowerCase() === extractionSolvent.toLowerCase())
                      ? COMMON_SOLVENTS.find((s) => s.toLowerCase() === extractionSolvent.toLowerCase())
                      : customSolventActive || extractionSolvent
                      ? "__custom__"
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setCustomSolventActive(true);
                    } else {
                      setCustomSolventActive(false);
                      setExtractionSolvent(e.target.value);
                    }
                  }}
                  disabled={isReviewLocked}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#0f2c20] hover:border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none shadow-2xs transition-all cursor-pointer"
                >
                  <option value="" disabled>Select extraction solvent & ratio...</option>
                  {COMMON_SOLVENTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="__custom__">Custom Solvent / Ratio...</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {(customSolventActive ||
                (!COMMON_SOLVENTS.some((s) => s.toLowerCase() === extractionSolvent.toLowerCase()) &&
                  extractionSolvent !== "")) && (
                <input
                  type="text"
                  value={extractionSolvent}
                  onChange={(e) => setExtractionSolvent(e.target.value)}
                  disabled={isReviewLocked}
                  placeholder="e.g. 80% Aqueous Ethanol (1:10 w/v)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-[#0f2c20] focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-2xs"
                />
              )}
            </div>
          </div>

          {/* Extraction Method */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-emerald-400 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:bg-white transition-all shadow-2xs space-y-2.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Extraction & Compounding Technique <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                Methodology
              </span>
            </div>
            <p className="text-xs text-[#78997f]">
              Physical separation technique, maceration protocol, or extraction methodology.
            </p>
            <div className="space-y-2 pt-0.5">
              <div className="relative">
                <select
                  value={
                    COMMON_METHODS.find((m) => {
                      const mClean = m.toLowerCase().replace(/\s*\+\s*/g, " with ");
                      const curClean = extractionMethod.toLowerCase().replace(/\s*\+\s*/g, " with ");
                      return mClean === curClean;
                    }) ||
                    (customMethodActive || extractionMethod ? "__custom__" : "")
                  }
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setCustomMethodActive(true);
                    } else {
                      setCustomMethodActive(false);
                      setExtractionMethod(e.target.value);
                    }
                  }}
                  disabled={isReviewLocked}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#0f2c20] hover:border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none shadow-2xs transition-all cursor-pointer"
                >
                  <option value="" disabled>Select extraction & compounding technique...</option>
                  {COMMON_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="__custom__">Custom Technique / Protocol...</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {(customMethodActive ||
                (!COMMON_METHODS.some(
                  (m) =>
                    m.toLowerCase().replace(/\s*\+\s*/g, " with ") ===
                    extractionMethod.toLowerCase().replace(/\s*\+\s*/g, " with ")
                ) &&
                  extractionMethod !== "")) && (
                <input
                  type="text"
                  value={extractionMethod}
                  onChange={(e) => setExtractionMethod(e.target.value)}
                  disabled={isReviewLocked}
                  placeholder="e.g. Cold Maceration (48h) + Rotary Evaporation at 40°C..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-[#0f2c20] focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-2xs"
                />
              )}
            </div>
          </div>

          {/* Research Purpose */}
          <div className="p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-emerald-400 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:bg-white transition-all shadow-2xs space-y-2.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Formulation Purpose & Intended Scope <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                Rationale
              </span>
            </div>
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={isReviewLocked}
              placeholder="Describe the therapeutic objective, experimental target, and expected phytochemical enrichment..."
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none leading-relaxed font-sans shadow-2xs"
            />
            <p className="text-[11px] text-[#78997f]">Formulation rationale, indication scope, and target efficacy delivery</p>
          </div>
        </div>
      </ResearchSection>

      {/* ============================================================== */}
      {/* SECTION 02: FORMULATION COMPOSITION & EXCIPIENT MATRIX         */}
      {/* ============================================================== */}
      <ResearchSection
        id="sec-composition"
        number="02"
        badge={`${componentsList.length} Component${componentsList.length === 1 ? "" : "s"}`}
        icon={Droplets}
        title="Formulation Composition & Excipient Matrix"
        subtitle="Active botanical extracts, pharmaceutical excipients, binders, and evidence-grounded concentrations"
        headerAction={
          !isReviewLocked && (
            <button
              type="button"
              onClick={handleTriggerAiGeneration}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Formulation Proposal</span>
            </button>
          )
        }
      >
        <div className="space-y-6">
          <FormulationCompositionTable
            components={componentsList}
            onChangeComponents={setComponentsList}
            isReadOnly={isReviewLocked}
            onOpenAiGenerator={handleTriggerAiGeneration}
            plantName={project.plantName}
          />

          <FormulationRationaleSection
            scientificRationale={scientificRationale}
            onChangeScientificRationale={setScientificRationale}
            compatibilityConsiderations={compatibilityConsiderations}
            onChangeCompatibilityConsiderations={setCompatibilityConsiderations}
            safetyAndLimitations={safetyAndLimitations}
            onChangeSafetyAndLimitations={setSafetyAndLimitations}
            literature={literature}
            isReadOnly={isReviewLocked}
          />
        </div>
      </ResearchSection>

      {/* ============================================================== */}
      {/* SECTION 03: DOCUMENTATION                                      */}
      {/* ============================================================== */}
      <ResearchSection
        id="sec-documentation"
        number="03"
        badge="SOP & Protocol"
        icon={FileCheck}
        title="Formulation Documentation & SOP"
        subtitle="Compounding standard operating procedure, stability notes & formulation architecture summary"
      >
        <div className="space-y-6">
          {/* RESEARCHER FORMULATION NOTES */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#dde6df] shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#edf2ee]">
              <label className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Formulation Notes & Compounding Observations</span>
              </label>
              <button
                type="button"
                onClick={handleAssistSummary}
                disabled={isReviewLocked}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Assist with Formulation Summary</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReviewLocked}
              placeholder="Record your preparation parameters, stability observations, storage conditions, and bench compounding notes..."
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none leading-relaxed font-sans shadow-2xs"
            />
          </div>

          {/* STANDARD OPERATING PROCEDURE (SOP) */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[#dde6df] bg-slate-50/60 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#edf2ee]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-[#0f2c20] uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-700" />
                    <span>Standard Operating Procedure (SOP)</span>
                  </h4>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {sopSteps.length} Steps Defined
                  </span>
                </div>
                <p className="text-xs text-[#78997f]">
                  Step-by-step extraction and laboratory bench preparation protocol
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSopModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#dde6df] hover:bg-emerald-50 text-xs font-bold text-[#0f2c20] hover:text-emerald-900 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
              >
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>View Full Protocol</span>
              </button>
            </div>

            {/* List of steps */}
            <div className="space-y-2.5">
              {sopSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#e7eee9] text-xs shadow-2xs hover:border-emerald-300 transition-all"
                >
                  <span className="font-mono text-[11px] font-black text-white bg-gradient-to-br from-emerald-600 to-teal-700 px-2.5 py-1 rounded-lg shrink-0 mt-0.5 shadow-2xs">
                    Step {step.stepNumber}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-[#0f2c20] font-bold leading-relaxed">{step.text}</p>
                    {(step.equipment || step.duration || step.temperature) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#78997f] pt-0.5">
                        {step.equipment && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            Equipment: <strong className="text-[#0f2c20]">{step.equipment}</strong>
                          </span>
                        )}
                        {step.duration && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            Duration: <strong className="text-[#0f2c20]">{step.duration}</strong>
                          </span>
                        )}
                        {step.temperature && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            Temp: <strong className="text-[#0f2c20]">{step.temperature}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!isReviewLocked && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSopStep(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                      title="Remove step"
                    >
                      <Trash2 className="w-4 h-4" />
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
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-[#0f2c20] focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none shadow-2xs font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddSopStep}
                  disabled={!newStepText.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#163f2e] text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* FORMULATION SUMMARY CARD (Luxury Stage 2/3 style) */}
          <div className="rounded-3xl border border-emerald-600/30 bg-gradient-to-br from-[#072418] via-[#0d3626] to-[#041910] p-6 sm:p-7 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden space-y-4">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/15 blur-2xl" />
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-teal-400/15 blur-2xl" />
            <div className="relative z-10 space-y-3.5">
              <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-300 block">
                Formulation Architecture Summary
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all">
                  <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Plant Specimen</span>
                  <strong className="text-white font-black text-sm block mt-1 truncate">{project.plantName}</strong>
                  <span className="text-xs text-emerald-200/90 font-medium mt-0.5 block truncate">Part: {plantPart || "Unspecified"}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all">
                  <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Solvent & Format</span>
                  <strong className="text-white font-black text-sm block mt-1 truncate">{extractionSolvent || "Unspecified"}</strong>
                  <span className="text-xs text-emerald-200/90 font-medium mt-0.5 block truncate">Type: {formulationType}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all">
                  <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Extraction Method</span>
                  <strong className="text-white font-black text-sm block mt-1 truncate">{extractionMethod || "Unspecified"}</strong>
                  <span className="text-xs text-emerald-200/90 font-medium mt-0.5 block truncate">Cold Macerated</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all">
                  <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Active Constituents</span>
                  <strong className="text-white font-black text-sm block mt-1 truncate">
                    {candidateCompounds[0]?.compoundName || "Candidate Compounds"}
                  </strong>
                  <span className="text-xs text-emerald-200/90 font-medium mt-0.5 block truncate">
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
        previousStageRoute={`/researcher/projects/${projectId}/docking`}
        onBack={handleBack}
        backLabel="Back to Molecular Docking"
        lastSaved={lastSaved}
        isSaving={isSaving}
        onSave={() => handleSaveDraft()}
        saveLabel="Save Draft"
        isRevisionMode={isRevisionMode}
        onResubmitRevision={handleResubmitRevision}
        isResubmitting={resubmitting}
        reviewStatus={currentReviewStatus}
        onContinue={handleCompleteAndContinue}
        isContinuing={isContinuing}
        continueLabel="Continue to Safety / Clinical"
        continuingLabel="Advancing to Safety / Clinical..."
        continueDisabled={isContinuing || isRevisionMode}
      />

      {/* Revision Resubmitted Success Confirmation Modal */}
      <AiFormulationProposalModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApply={handleApplyProposal}
        isGenerating={isGeneratingAi}
        generationStep={generationStep}
        proposal={aiProposal}
        error={aiError}
        onRegenerate={handleTriggerAiGeneration}
        plantName={project.plantName}
      />

      <RevisionResubmittedSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        projectId={projectId}
        stageNumber={4}
        stageTitle="Stage 4 · Formulation Development"
        discipline={successModalData.discipline}
        profession={successModalData.profession}
        reviewCycle={successModalData.reviewCycle}
        reviewerName={successModalData.reviewerName}
        addressedCount={successModalData.addressedCount}
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
