"use client";

import CompactStageNav from "@/components/researcher/CompactStageNav";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  FileText,
  CheckCircle2,
  Cpu,
  BookOpen,
  FlaskConical,
  Beaker,
  Layers,
  Save,
  Plus,
  Trash2,
  X,
  ExternalLink,
  History,
  Eye,
  Info,
  Check,
  Baby,
  Pill,
  ChevronRight,
} from "lucide-react";
import SupportingLiteratureAccordion from "@/components/researcher/evidence/SupportingLiteratureAccordion";

export interface SurfacedEvidenceData {
  stage1?: {
    traditionalUses?: string;
    clinicalEvidence?: string;
    safetyConsiderations?: string;
    contraindications?: string;
    baselineEvidenceSummary?: string;
  } | null;
  stage3: Array<{
    id: number;
    title: string;
    authors?: string;
    journal?: string;
    year?: number;
    studyType?: string;
    keyFindings?: string;
    evidenceLevel?: string;
  }>;
  stage4: Array<{
    id: number;
    compoundName: string;
    analysisCategory?: string;
    predictionType: string;
    resultSummary: string;
    detailedMetrics?: string;
    engineTool?: string;
    engineVersion?: string;
    resultProvenance: string;
    createdAt: string;
  }>;
  stage5: Array<{
    id: number;
    ligandName?: string;
    targetProtein?: string;
    pdbId?: string | null;
    bindingAffinity?: string;
    units?: string | null;
    resultProvenance?: string;
    jobStatus?: string | null;
    vinaVersion?: string | null;
  }>;
  plantPrecautions?: string | null;
}

export interface SafetyAssessmentSectionsData {
  id?: number;
  knownSafetyEvidence?: string;
  toxicityEvidence?: string;
  potentialContraindications?: string;
  herbDrugInteractions?: string;
  populationConsiderations?: string;
  ingredientSpecificConcerns?: string;
  doseConcentrationConcerns?: string;
  knownAdverseEffects?: string;
  evidenceGaps?: string;
  additionalSafetyNotes?: string;
  status?: string;
}

export interface ComponentAssessmentItem {
  id?: number;
  componentId?: number;
  componentName: string;
  knownConcern?: string;
  supportingEvidence?: string;
  potentialInteraction?: string;
  researcherAssessment?: string;
  needsProfessionalReview: boolean | number;
}

export interface SafetyConcernItem {
  id: number;
  concernTitle: string;
  category: string;
  affectedComponent?: string;
  evidenceOrReference?: string;
  severity: "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  evidenceStatus: "SUPPORTED" | "LIMITED" | "UNKNOWN";
  researcherNotes?: string;
  createdAt: string;
}

export interface SafetySummaryData {
  overallEvidenceSummary?: string;
  majorIdentifiedConcerns?: string;
  evidenceLimitations?: string;
  unresolvedSafetyQuestions?: string;
  itemsRequiringReview?: string;
  recommendedNextActions?: string;
}

interface SafetyAssessmentClientProps {
  projectId: number;
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
    currentStage: string;
    status: string;
  };
  formulation: {
    id: number;
    formulationName: string;
    formulationType: string;
    currentVersionNumber?: string;
  } | null;
  activeVersion: {
    id: number;
    versionNumber: string;
    versionTag?: string;
  } | null;
  components: Array<{
    id: number;
    componentName: string;
    roleInFormulation: string;
    quantity?: string;
    unit?: string;
    concentration?: string;
  }>;
  surfacedEvidence: SurfacedEvidenceData;
  initialSafetyAssessment: SafetyAssessmentSectionsData | null;
  initialComponentAssessments: ComponentAssessmentItem[];
  initialConcerns: SafetyConcernItem[];
  initialSummary: SafetySummaryData | null;
}

const CONCERN_CATEGORIES = [
  "Toxicological / Organ Toxicity",
  "Herb–Drug Interaction",
  "Contraindication",
  "Special Population (Pregnancy / Pediatric / Geriatric)",
  "Allergenic / Hypersensitivity",
  "Concentration / Dose Threshold",
  "Quality / Degradation Risk",
  "Other Safety Concern",
] as const;

export default function SafetyAssessmentClient({
  projectId,
  project,
  formulation,
  activeVersion,
  components,
  surfacedEvidence,
  initialSafetyAssessment,
  initialComponentAssessments,
  initialConcerns,
  initialSummary,
}: SafetyAssessmentClientProps) {
  const router = useRouter();

  // Active tab: evidence | sections | componentReview | concernRegister | summary
  const [activeTab, setActiveTab] = useState<
    "evidence" | "sections" | "componentReview" | "concernRegister" | "summary"
  >("evidence");

  // State
  const [safetyAssessment, setSafetyAssessment] = useState<SafetyAssessmentSectionsData | null>(
    initialSafetyAssessment
  );
  const [componentAssessments, setComponentAssessments] = useState<ComponentAssessmentItem[]>(
    initialComponentAssessments
  );
  const [concerns, setConcerns] = useState<SafetyConcernItem[]>(initialConcerns);

  // Sections State
  const [knownSafetyEvidence, setKnownSafetyEvidence] = useState(
    initialSafetyAssessment?.knownSafetyEvidence || ""
  );
  const [toxicityEvidence, setToxicityEvidence] = useState(
    initialSafetyAssessment?.toxicityEvidence || ""
  );
  const [potentialContraindications, setPotentialContraindications] = useState(
    initialSafetyAssessment?.potentialContraindications || ""
  );
  const [herbDrugInteractions, setHerbDrugInteractions] = useState(
    initialSafetyAssessment?.herbDrugInteractions || ""
  );
  const [populationConsiderations, setPopulationConsiderations] = useState(
    initialSafetyAssessment?.populationConsiderations || ""
  );
  const [ingredientSpecificConcerns, setIngredientSpecificConcerns] = useState(
    initialSafetyAssessment?.ingredientSpecificConcerns || ""
  );
  const [doseConcentrationConcerns, setDoseConcentrationConcerns] = useState(
    initialSafetyAssessment?.doseConcentrationConcerns || ""
  );
  const [knownAdverseEffects, setKnownAdverseEffects] = useState(
    initialSafetyAssessment?.knownAdverseEffects || ""
  );
  const [evidenceGaps, setEvidenceGaps] = useState(
    initialSafetyAssessment?.evidenceGaps || ""
  );
  const [additionalSafetyNotes, setAdditionalSafetyNotes] = useState(
    initialSafetyAssessment?.additionalSafetyNotes || ""
  );
  const [savingSections, setSavingSections] = useState(false);

  // Summary State
  const [overallSummary, setOverallSummary] = useState(
    initialSummary?.overallEvidenceSummary || ""
  );
  const [majorConcerns, setMajorConcerns] = useState(
    initialSummary?.majorIdentifiedConcerns || ""
  );
  const [evidenceLimitations, setEvidenceLimitations] = useState(
    initialSummary?.evidenceLimitations || ""
  );
  const [unresolvedQuestions, setUnresolvedQuestions] = useState(
    initialSummary?.unresolvedSafetyQuestions || ""
  );
  const [itemsRequiringReview, setItemsRequiringReview] = useState(
    initialSummary?.itemsRequiringReview || ""
  );
  const [nextActions, setNextActions] = useState(
    initialSummary?.recommendedNextActions || ""
  );
  const [savingSummary, setSavingSummary] = useState(false);

  // Modals
  const [isAddConcernModalOpen, setIsAddConcernModalOpen] = useState(false);
  const [selectedCompForEdit, setSelectedCompForEdit] = useState<any | null>(null);
  const [isCompleteConfirmationOpen, setIsCompleteConfirmationOpen] = useState(false);

  // New Concern Form State
  const [concernTitle, setConcernTitle] = useState("");
  const [concernCategory, setConcernCategory] = useState<string>(CONCERN_CATEGORIES[0]);
  const [concernAffectedComp, setConcernAffectedComp] = useState(components[0]?.componentName || "");
  const [concernEvidence, setConcernEvidence] = useState("");
  const [concernSeverity, setConcernSeverity] = useState<
    "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
  >("LOW");
  const [concernEvidenceStatus, setConcernEvidenceStatus] = useState<
    "SUPPORTED" | "LIMITED" | "UNKNOWN"
  >("LIMITED");
  const [concernNotes, setConcernNotes] = useState("");
  const [submittingConcern, setSubmittingConcern] = useState(false);

  // Component Assessment Form in Drawer
  const [compKnownConcern, setCompKnownConcern] = useState("");
  const [compSupportingEvidence, setCompSupportingEvidence] = useState("");
  const [compPotentialInteraction, setCompPotentialInteraction] = useState("");
  const [compResearcherAssessment, setCompResearcherAssessment] = useState("");
  const [compNeedsReview, setCompNeedsReview] = useState(false);
  const [savingCompAssessment, setSavingCompAssessment] = useState(false);

  // Feedback
  const [completingStage, setCompletingStage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Save Sections
  const handleSaveSections = async () => {
    try {
      setSavingSections(true);
      const res = await fetch(`/api/researcher/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-sections",
          versionId: activeVersion?.id || null,
          knownSafetyEvidence,
          toxicityEvidence,
          potentialContraindications,
          herbDrugInteractions,
          populationConsiderations,
          ingredientSpecificConcerns,
          doseConcentrationConcerns,
          knownAdverseEffects,
          evidenceGaps,
          additionalSafetyNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save safety sections");

      setSafetyAssessment({
        id: data.assessmentId,
        knownSafetyEvidence,
        toxicityEvidence,
        potentialContraindications,
        herbDrugInteractions,
        populationConsiderations,
        ingredientSpecificConcerns,
        doseConcentrationConcerns,
        knownAdverseEffects,
        evidenceGaps,
        additionalSafetyNotes,
        status: "IN_PROGRESS",
      });

      showToast("Safety assessment sections saved.");
    } catch (err: any) {
      showToast(err.message || "Error saving sections", "error");
    } finally {
      setSavingSections(false);
    }
  };

  // Open Component Assessment Drawer
  const handleOpenComponentReview = (comp: any) => {
    setSelectedCompForEdit(comp);
    const existing = componentAssessments.find(
      (ca) => ca.componentId === comp.id || ca.componentName === comp.componentName
    );
    if (existing) {
      setCompKnownConcern(existing.knownConcern || "");
      setCompSupportingEvidence(existing.supportingEvidence || "");
      setCompPotentialInteraction(existing.potentialInteraction || "");
      setCompResearcherAssessment(existing.researcherAssessment || "");
      setCompNeedsReview(Boolean(existing.needsProfessionalReview));
    } else {
      setCompKnownConcern("");
      setCompSupportingEvidence("");
      setCompPotentialInteraction("");
      setCompResearcherAssessment("");
      setCompNeedsReview(false);
    }
  };

  // Save Component Assessment
  const handleSaveComponentAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompForEdit) return;

    try {
      setSavingCompAssessment(true);
      const res = await fetch(`/api/researcher/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-component-assessment",
          versionId: activeVersion?.id || null,
          componentId: selectedCompForEdit.id,
          componentName: selectedCompForEdit.componentName,
          knownConcern: compKnownConcern,
          supportingEvidence: compSupportingEvidence,
          potentialInteraction: compPotentialInteraction,
          researcherAssessment: compResearcherAssessment,
          needsProfessionalReview: compNeedsReview,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save component assessment");

      const updatedList = [
        ...componentAssessments.filter(
          (ca) =>
            ca.componentId !== selectedCompForEdit.id &&
            ca.componentName !== selectedCompForEdit.componentName
        ),
        {
          id: data.insertedId || Date.now(),
          componentId: selectedCompForEdit.id,
          componentName: selectedCompForEdit.componentName,
          knownConcern: compKnownConcern,
          supportingEvidence: compSupportingEvidence,
          potentialInteraction: compPotentialInteraction,
          researcherAssessment: compResearcherAssessment,
          needsProfessionalReview: compNeedsReview,
        },
      ];

      setComponentAssessments(updatedList);
      setSelectedCompForEdit(null);
      showToast(`Component assessment for ${selectedCompForEdit.componentName} saved.`);
    } catch (err: any) {
      showToast(err.message || "Error saving component review", "error");
    } finally {
      setSavingCompAssessment(false);
    }
  };

  // Add Concern
  const handleAddConcern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concernTitle.trim()) {
      showToast("Concern title is required.", "error");
      return;
    }

    try {
      setSubmittingConcern(true);
      const res = await fetch(`/api/researcher/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-concern",
          versionId: activeVersion?.id || null,
          concernTitle,
          category: concernCategory,
          affectedComponent: concernAffectedComp,
          evidenceOrReference: concernEvidence,
          severity: concernSeverity,
          evidenceStatus: concernEvidenceStatus,
          researcherNotes: concernNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record concern");

      const newConcern: SafetyConcernItem = {
        id: data.insertedId || Date.now(),
        concernTitle: concernTitle.trim(),
        category: concernCategory,
        affectedComponent: concernAffectedComp.trim() || undefined,
        evidenceOrReference: concernEvidence.trim() || undefined,
        severity: concernSeverity,
        evidenceStatus: concernEvidenceStatus,
        researcherNotes: concernNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      setConcerns([newConcern, ...concerns]);
      setIsAddConcernModalOpen(false);

      // Reset
      setConcernTitle("");
      setConcernEvidence("");
      setConcernNotes("");
      setConcernSeverity("LOW");
      setConcernEvidenceStatus("LIMITED");

      showToast(`Safety concern "${newConcern.concernTitle}" recorded.`);
    } catch (err: any) {
      showToast(err.message || "Error adding concern", "error");
    } finally {
      setSubmittingConcern(false);
    }
  };

  // Delete Concern
  const handleDeleteConcern = async (concernId: number) => {
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-concern",
          concernId,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete concern");
      setConcerns(concerns.filter((c) => c.id !== concernId));
      showToast("Concern removed.");
    } catch (err: any) {
      showToast(err.message || "Error deleting concern", "error");
    }
  };

  // Save Summary
  const handleSaveSummary = async () => {
    try {
      setSavingSummary(true);
      const res = await fetch(`/api/researcher/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-summary",
          versionId: activeVersion?.id || null,
          overallEvidenceSummary: overallSummary,
          majorIdentifiedConcerns: majorConcerns,
          evidenceLimitations,
          unresolvedSafetyQuestions: unresolvedQuestions,
          itemsRequiringReview: itemsRequiringReview,
          recommendedNextActions: nextActions,
        }),
      });

      if (!res.ok) throw new Error("Failed to save safety summary");
      showToast("Researcher safety summary saved.");
    } catch (err: any) {
      showToast(err.message || "Error saving summary", "error");
    } finally {
      setSavingSummary(false);
    }
  };

  // Dynamic Checklist Calculation
  const hasVersion = Boolean(activeVersion && activeVersion.versionNumber);
  const hasEvidence = Boolean(
    surfacedEvidence.stage1?.safetyConsiderations ||
      surfacedEvidence.stage3.length > 0 ||
      surfacedEvidence.stage4.length > 0 ||
      knownSafetyEvidence.trim().length > 0 ||
      toxicityEvidence.trim().length > 0
  );
  const hasComponentAssessment =
    componentAssessments.length > 0 || components.length === 0;
  const hasConcernsDocumented =
    concerns.length > 0 || knownAdverseEffects.trim().length > 0;
  const hasEvidenceGaps = evidenceGaps.trim().length > 0;
  const hasSummary = Boolean(
    overallSummary.trim().length > 0 && itemsRequiringReview.trim().length > 0
  );

  const checklist = {
    hasVersion,
    hasEvidence,
    hasComponentAssessment,
    hasConcernsDocumented,
    hasEvidenceGaps,
    hasSummary,
  };

  const isChecklistComplete =
    checklist.hasVersion &&
    checklist.hasEvidence &&
    checklist.hasComponentAssessment &&
    checklist.hasConcernsDocumented &&
    checklist.hasEvidenceGaps &&
    checklist.hasSummary;

  // Complete Stage 7
  const handleCompleteStage = async () => {
    if (!isChecklistComplete) {
      showToast("Please satisfy all items in the safety assessment checklist first.", "error");
      return;
    }

    try {
      setCompletingStage(true);
      // Auto-save summary and sections first
      await fetch(`/api/researcher/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-sections",
          versionId: activeVersion?.id || null,
          knownSafetyEvidence,
          toxicityEvidence,
          potentialContraindications,
          herbDrugInteractions,
          populationConsiderations,
          ingredientSpecificConcerns,
          doseConcentrationConcerns,
          knownAdverseEffects,
          evidenceGaps,
          additionalSafetyNotes,
        }),
      });

      await fetch(`/api/researcher/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-summary",
          versionId: activeVersion?.id || null,
          overallEvidenceSummary: overallSummary,
          majorIdentifiedConcerns: majorConcerns,
          evidenceLimitations,
          unresolvedSafetyQuestions: unresolvedQuestions,
          itemsRequiringReview: itemsRequiringReview,
          recommendedNextActions: nextActions,
        }),
      });

      const res = await fetch(`/api/researcher/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-stage",
          versionId: activeVersion?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete Stage 4");

      setIsCompleteConfirmationOpen(false);
      showToast("Formulation & Safety completed. Continuing to Research Integration.");

      setTimeout(() => {
        router.push(`/researcher/projects/${projectId}/laboratory`);
      }, 1200);
    } catch (err: any) {
      showToast(err.message || "Stage completion error", "error");
    } finally {
      setCompletingStage(false);
    }
  };

  // Severity badge renderer
  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-900 border border-rose-300">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-100 text-orange-900 border border-orange-300">
            HIGH
          </span>
        );
      case "MODERATE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
            MODERATE
          </span>
        );
      case "INFORMATIONAL":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-900 border border-sky-300">
            INFORMATIONAL
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-300">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${
              toastType === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : toastType === "info"
                ? "bg-sky-50 text-sky-800 border-sky-200"
                : "bg-emerald-50 text-emerald-900 border-emerald-200"
            }`}
          >
            {toastType === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="space-y-4">
        <CompactStageNav
          projectId={projectId}
          projectTitle={project.title}
          stageNumber={5}
          stageKey="formulation-safety"
        />

        {/* Title Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#0f2c20] text-emerald-300 text-[11px] font-extrabold tracking-widest uppercase">
                STAGE 5
              </span>
              <span className="text-xs text-[#78997f]">Toxicological & Pre-Clinical Safety Dossier</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-700" />
                <span>Evaluating Formulation {activeVersion?.versionNumber || "v1.0"}</span>
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
            Comprehensive Safety & Risk Assessment
          </h1>

          <p className="text-xs sm:text-sm text-[#475550] max-w-3xl leading-relaxed">
            &ldquo;Document available safety evidence, potential contraindications, herb–drug interactions,
            and research uncertainties before formal submission to Stage 8 Professional Review. Does not
            declare clinical safety or human approval.&rdquo;
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-[#78997f]">Specimen:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#16a34a] font-bold border border-emerald-200">
              {project.plantName}
            </span>
            <span className="text-[#78997f]">Formulation Evaluated:</span>
            <span className="font-bold text-[#0f2c20]">
              {formulation?.formulationName || "Default Prototype"} ({activeVersion?.versionNumber || "v1.0"})
            </span>
            <span className="text-[#78997f]">Documented Concerns:</span>
            <span className="font-bold text-amber-700">{concerns.length}</span>
            <span className="text-[#78997f]">Evidence Status:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-300">
              SAFETY ASSESSMENT DOCUMENTED
            </span>
          </div>
        </div>
      </div>

      {/* SCIENTIFIC INTEGRITY CRITICAL BANNER */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">Critical Scientific Disclaimer:</span>
          <p className="text-[11px] leading-relaxed">
            NatureAide does <strong>NOT</strong> provide a simplistic binary &quot;SAFE / UNSAFE&quot; designation,
            nor does it authorize human consumption. Safety status is logged as{" "}
            <span className="font-mono font-bold">SAFETY ASSESSMENT DOCUMENTED</span>. Professional Reviewers
            in Stage 8 will inspect this exact locked version before any validation can proceed.
          </p>
        </div>
      </div>

      {/* 5 WORKSPACE NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold bg-white p-2 rounded-2xl border border-[#dde6df] shadow-2xs">
        {[
          { id: "evidence", label: "1. Surfaced Evidence & Computational Findings" },
          { id: "sections", label: "2. Safety Assessment Sections" },
          {
            id: "componentReview",
            label: "3. Formulation Component Review",
            count: components.length,
          },
          { id: "concernRegister", label: "4. Risk / Concern Register", count: concerns.length },
          { id: "summary", label: "5. Safety Summary" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-[#0f2c20] text-white shadow-xs font-extrabold"
                : "text-[#475550] hover:text-[#0f2c20] hover:bg-[#faf9f5]"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-[#475550]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SURFACED EVIDENCE & COMPUTATIONAL FINDINGS                         */}
      {/* ========================================================================= */}
      {activeTab === "evidence" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#edf2ee] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#16a34a]" />
                <h2 className="font-heading font-extrabold text-lg text-[#0f2c20]">
                  Surfaced Multi-Stage Safety Evidence
                </h2>
              </div>
              <p className="text-xs text-[#78997f]">
                Aggregated empirical, literature, and computational safety data across Stages 1–5.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Supporting Peer-Reviewed Safety Literature */}
            <SupportingLiteratureAccordion
              projectId={projectId}
              stageKey="formulation-safety"
              resultType="SAFETY"
              compound={project.plantName}
              endpoint="toxicity OR safety OR adverse effects"
              defaultExpanded={true}
            />
            {/* COMPUTATIONAL FINDINGS SEPARATE CARD */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-300 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#0f2c20]" />
                  <span className="font-heading font-extrabold text-sm text-[#0f2c20] tracking-wide uppercase">
                    Computational Safety Findings (Stage 4 In-Silico)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  COMPUTATIONAL PREDICTION — NOT CLINICAL EVIDENCE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Warning:</strong> Computational toxicity and ADME predictions are algorithmic
                research models. They do NOT establish human clinical safety and must never be conflated
                with empirical toxicology.
              </div>

              {surfacedEvidence.stage4.length === 0 ? (
                <p className="text-xs text-[#78997f] italic">
                  No computational toxicity records logged in Stage 4.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {surfacedEvidence.stage4.map((res) => (
                    <div
                      key={res.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0f2c20] text-sm">{res.compoundName}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-800">
                          {res.resultProvenance}
                        </span>
                      </div>

                      <p className="text-[#475550]">{res.resultSummary}</p>

                      <div className="pt-1 text-[11px] text-[#78997f] flex justify-between border-t border-slate-100">
                        <span>Engine: {res.engineTool || "In-Silico Engine"}</span>
                        <span>{new Date(res.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {surfacedEvidence.stage5?.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-300 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    Stage 3 Docking Results
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    PREDICTED
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {surfacedEvidence.stage5.map((run) => {
                    const vina = run.resultProvenance === "NATUREAIDE_VINA";
                    return (
                      <div key={run.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                        <p className="font-bold text-[#0f2c20]">
                          {run.ligandName} {"\u2192"} {run.targetProtein}
                          {run.pdbId ? ` \u00b7 PDB ${run.pdbId}` : ""}
                        </p>
                        <p className="font-mono">{run.bindingAffinity} {run.units || "kcal/mol"}</p>
                        <p className="text-[11px] text-slate-500">
                          {vina
                            ? `NatureAide \u00b7 ${run.vinaVersion || "AutoDock Vina"} \u00b7 PREDICTED`
                            : "Externally Generated"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STAGE 1 & NATUREAIDE REPOSITORY PRECAUTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-3">
                <div className="flex items-center justify-between border-b border-[#dde6df] pb-2">
                  <span className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    Stage 1 Evidence Review Precedents
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    LITERATURE / TRADITIONAL
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[#78997f] font-semibold block">Safety Considerations:</span>
                    <p className="text-[#0f2c20]">
                      {surfacedEvidence.stage1?.safetyConsiderations ||
                        "No documented adverse effects flagged during Stage 1 review."}
                    </p>
                  </div>

                  <div>
                    <span className="text-[#78997f] font-semibold block">Documented Contraindications:</span>
                    <p className="text-[#0f2c20]">
                      {surfacedEvidence.stage1?.contraindications ||
                        "None recorded during baseline review."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-3">
                <div className="flex items-center justify-between border-b border-[#dde6df] pb-2">
                  <span className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    Verified Botanical Precautions
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    VERIFIED NATUREAIDE SOURCE
                  </span>
                </div>

                <p className="text-[#0f2c20] leading-relaxed">
                  {surfacedEvidence.plantPrecautions ||
                    `Standard pharmacological precautions apply to ${project.plantName}. Monitor for organoleptic hypersensitivity or concurrent diuretic medication interactions.`}
                </p>
              </div>
            </div>

            {/* STAGE 3 LITERATURE CITATIONS */}
            <div className="p-5 rounded-2xl bg-white border border-[#dde6df] space-y-3">
              <span className="font-heading font-extrabold text-sm text-[#0f2c20] block">
                Stage 3 Curated Research Literature ({surfacedEvidence.stage3.length} studies)
              </span>

              {surfacedEvidence.stage3.length === 0 ? (
                <p className="text-xs text-[#78997f] italic">
                  No peer-reviewed publications linked in Stage 3.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {surfacedEvidence.stage3.map((study) => (
                    <div
                      key={study.id}
                      className="p-3.5 rounded-xl bg-[#faf9f5] border border-[#dde6df] space-y-1"
                    >
                      <span className="font-bold text-[#0f2c20] line-clamp-2">{study.title}</span>
                      <p className="text-[11px] text-[#78997f]">
                        {study.journal} ({study.year}) — {study.evidenceLevel || "In-Vitro / In-Vivo"}
                      </p>
                      {study.keyFindings && (
                        <p className="text-[11px] text-[#475550] line-clamp-2 italic">
                          &quot;{study.keyFindings}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SAFETY ASSESSMENT SECTIONS                                        */}
      {/* ========================================================================= */}
      {activeTab === "sections" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#edf2ee] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#16a34a]" />
                <h2 className="font-heading font-extrabold text-lg text-[#0f2c20]">
                  Core Safety & Toxicological Evaluation Sections
                </h2>
              </div>
              <p className="text-xs text-[#78997f]">
                Authoritative researcher evaluation across toxicological, pharmacodynamic, and clinical dimensions.
              </p>
            </div>

            <button
              onClick={handleSaveSections}
              disabled={savingSections}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{savingSections ? "Saving..." : "Save Safety Sections"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#0f2c20] flex items-center gap-1.5">
                <span>Known Safety Evidence & Tolerability</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={knownSafetyEvidence}
                onChange={(e) => setKnownSafetyEvidence(e.target.value)}
                placeholder="Synthesize documented safety data, human tolerability studies, or historical ethnobotanical consumption evidence..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Toxicity Evidence (LD50 / Cytotoxicity)</label>
              <textarea
                rows={3}
                value={toxicityEvidence}
                onChange={(e) => setToxicityEvidence(e.target.value)}
                placeholder="Acute and sub-chronic oral toxicity findings in animal models, IC50 cytotoxicity limits, Ames test mutagenicity..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Potential Contraindications</label>
              <textarea
                rows={3}
                value={potentialContraindications}
                onChange={(e) => setPotentialContraindications(e.target.value)}
                placeholder="Underlying medical conditions, renal or hepatic impairment, bleeding disorders..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">
                Potential Herb–Drug & Ingredient Interactions
              </label>
              <textarea
                rows={3}
                value={herbDrugInteractions}
                onChange={(e) => setHerbDrugInteractions(e.target.value)}
                placeholder="CYP450 enzyme inhibition, P-glycoprotein induction, concurrent antihypertensive or anticoagulant interactions..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">
                Population Considerations (Pregnancy, Lactation, Pediatric, Geriatric)
              </label>
              <textarea
                rows={3}
                value={populationConsiderations}
                onChange={(e) => setPopulationConsiderations(e.target.value)}
                placeholder="Embryotoxicity data, teratogenicity, precautions for elderly or pediatric demographics..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Ingredient-Specific Concerns</label>
              <textarea
                rows={3}
                value={ingredientSpecificConcerns}
                onChange={(e) => setIngredientSpecificConcerns(e.target.value)}
                placeholder="Specific risks associated with individual phytochemicals, excipients, or extraction solvents..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">
                Dose/Concentration-Related Concerns (only when research data exists)
              </label>
              <textarea
                rows={3}
                value={doseConcentrationConcerns}
                onChange={(e) => setDoseConcentrationConcerns(e.target.value)}
                placeholder="Thresholds where bioactivity transitions to cellular stress or adverse reactions; NOAEL levels..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#0f2c20] flex items-center gap-1.5">
                <span>Known Adverse Effects</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={knownAdverseEffects}
                onChange={(e) => setKnownAdverseEffects(e.target.value)}
                placeholder="Documented side effects: gastrointestinal discomfort, allergic contact dermatitis, mild diuresis..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#0f2c20] flex items-center gap-1.5">
                <span>Evidence Gaps & Unknowns</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={evidenceGaps}
                onChange={(e) => setEvidenceGaps(e.target.value)}
                placeholder="Critical areas lacking verified empirical data (e.g. chronic carcinogenicity, high-dose human pharmacokinetic clearance)..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#0f2c20]">Additional Safety Notes</label>
              <input
                type="text"
                value={additionalSafetyNotes}
                onChange={(e) => setAdditionalSafetyNotes(e.target.value)}
                placeholder="e.g. Batch extraction uses USP grade ethanol; all solvent evaporated to <0.5% limit."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FORMULATION COMPONENT REVIEW                                      */}
      {/* ========================================================================= */}
      {activeTab === "componentReview" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#edf2ee] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Beaker className="w-5 h-5 text-[#16a34a]" />
                <h2 className="font-heading font-extrabold text-lg text-[#0f2c20]">
                  Formulation Component Safety Assessment ({components.length})
                </h2>
              </div>
              <p className="text-xs text-[#78997f]">
                Evaluates each component in version{" "}
                <span className="font-mono font-bold">{activeVersion?.versionNumber || "v1.0"}</span>{" "}
                for specific risks, interactions, and reviewer escalation flags.
              </p>
            </div>
          </div>

          {components.length === 0 ? (
            <div className="p-8 text-center bg-[#faf9f5] rounded-2xl border border-dashed border-[#dde6df] space-y-3">
              <Beaker className="w-8 h-8 text-[#78997f] mx-auto opacity-50" />
              <p className="text-xs font-bold text-[#0f2c20]">No Stage 6 components found.</p>
              <p className="text-[11px] text-[#78997f]">
                Add formulation ingredients in Stage 6 to perform component-by-component safety review.
              </p>
              <Link
                href={`/researcher/projects/${projectId}/formulation`}
                className="inline-block px-4 py-2 rounded-xl bg-[#0f2c20] text-white text-xs font-bold"
              >
                Go to Stage 6 Formulation
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {components.map((comp) => {
                const assessment = componentAssessments.find(
                  (ca) => ca.componentId === comp.id || ca.componentName === comp.componentName
                );

                return (
                  <div
                    key={comp.id}
                    className="p-5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] hover:border-[#16a34a] transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {comp.roleInFormulation}
                        </span>

                        {assessment?.needsProfessionalReview ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            <span>Escalated to Reviewer</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Standard Review
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                        {comp.componentName}
                      </h3>

                      {comp.quantity && (
                        <p className="font-mono text-xs text-[#78997f]">
                          Quantity in formulation: {comp.quantity} {comp.unit}
                        </p>
                      )}

                      {assessment?.knownConcern && (
                        <div className="p-2.5 rounded-xl bg-white border border-[#dde6df] text-xs space-y-1">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                            Identified Concern:
                          </span>
                          <p className="text-[#0f2c20]">{assessment.knownConcern}</p>
                        </div>
                      )}

                      {assessment?.researcherAssessment && (
                        <p className="text-xs text-[#475550] bg-white p-2.5 rounded-xl border border-[#dde6df]">
                          <span className="text-[10px] font-bold text-[#78997f] block uppercase">
                            Assessment:
                          </span>
                          {assessment.researcherAssessment}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#dde6df] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#78997f]">
                        {assessment ? "Assessment recorded" : "Pending assessment"}
                      </span>

                      <button
                        onClick={() => handleOpenComponentReview(comp)}
                        className="inline-flex items-center gap-1 font-bold text-[#1e5c44] hover:text-[#0f2c20] cursor-pointer"
                      >
                        <span>{assessment ? "Edit Assessment" : "Assess Safety"}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RISK / CONCERN REGISTER                                           */}
      {/* ========================================================================= */}
      {activeTab === "concernRegister" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#edf2ee] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#16a34a]" />
                <h2 className="font-heading font-extrabold text-lg text-[#0f2c20]">
                  Structured Risk & Concern Register ({concerns.length})
                </h2>
              </div>
              <p className="text-xs text-[#78997f]">
                Categorized hazards, severity grading, evidence support status, and researcher notes.
              </p>
            </div>

            <button
              onClick={() => setIsAddConcernModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Log Safety Concern</span>
            </button>
          </div>

          {concerns.length === 0 ? (
            <div className="p-8 text-center bg-[#faf9f5] rounded-2xl border border-dashed border-[#dde6df] space-y-3">
              <ShieldCheck className="w-8 h-8 text-[#78997f] mx-auto opacity-50" />
              <p className="text-xs font-bold text-[#0f2c20]">No safety concerns logged in register.</p>
              <p className="text-[11px] text-[#78997f]">
                Log potential toxicities, drug interactions, or formulation degradation hazards.
              </p>
              <button
                onClick={() => setIsAddConcernModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white border border-[#dde6df] text-xs font-bold text-[#0f2c20] hover:border-[#16a34a]"
              >
                + Log First Concern
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {concerns.map((con) => (
                <div
                  key={con.id}
                  className="p-5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] hover:border-[#16a34a] transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {renderSeverityBadge(con.severity)}
                      <span className="font-heading font-extrabold text-sm text-[#0f2c20]">
                        {con.concernTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-[#dde6df] text-[#0f2c20]">
                        Status: {con.evidenceStatus}
                      </span>
                      <button
                        onClick={() => handleDeleteConcern(con.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                        title="Delete concern"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-[#475550]">
                    <div>
                      <span className="text-[#78997f]">Category: </span>
                      <span className="font-semibold">{con.category}</span>
                    </div>
                    {con.affectedComponent && (
                      <div>
                        <span className="text-[#78997f]">Affected Component: </span>
                        <span className="font-semibold">{con.affectedComponent}</span>
                      </div>
                    )}
                    {con.evidenceOrReference && (
                      <div className="col-span-3">
                        <span className="text-[#78997f]">Evidence / Reference: </span>
                        <span className="font-semibold">{con.evidenceOrReference}</span>
                      </div>
                    )}
                  </div>

                  {con.researcherNotes && (
                    <p className="text-xs text-[#0f2c20] bg-white p-2.5 rounded-xl border border-[#dde6df]">
                      <span className="text-[10px] font-bold text-[#78997f] block uppercase">
                        Researcher Notes:
                      </span>
                      {con.researcherNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SAFETY SUMMARY                                                    */}
      {/* ========================================================================= */}
      {activeTab === "summary" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#edf2ee] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#16a34a]" />
                <h2 className="font-heading font-extrabold text-lg text-[#0f2c20]">
                  Researcher Safety Summary & Review Dossier
                </h2>
              </div>
              <p className="text-xs text-[#78997f]">
                Final pre-review synthesis sealing unresolved questions and professional panel escalation items.
              </p>
            </div>

            <button
              onClick={handleSaveSummary}
              disabled={savingSummary}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{savingSummary ? "Saving Summary..." : "Save Safety Summary"}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20] flex items-center gap-1.5">
                <span>Overall Safety Evidence Summary</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={overallSummary}
                onChange={(e) => setOverallSummary(e.target.value)}
                placeholder="High-level synthesis of evidence weight, historical usage safety margin, and experimental prototype risks..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Major Identified Concerns</label>
              <textarea
                rows={2}
                value={majorConcerns}
                onChange={(e) => setMajorConcerns(e.target.value)}
                placeholder="Key potential toxicological or clinical hazards that warrant close attention..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Evidence Limitations</label>
              <textarea
                rows={2}
                value={evidenceLimitations}
                onChange={(e) => setEvidenceLimitations(e.target.value)}
                placeholder="Scope limitations in animal models, lack of clinical pharmacokinetic studies, solvent residue uncertainties..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Unresolved Safety Questions</label>
              <textarea
                rows={2}
                value={unresolvedQuestions}
                onChange={(e) => setUnresolvedQuestions(e.target.value)}
                placeholder="Specific scientific queries that current data cannot answer with confidence..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20] flex items-center gap-1.5">
                <span>Items Requiring Professional Review (Stage 8 Focus)</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={itemsRequiringReview}
                onChange={(e) => setItemsRequiringReview(e.target.value)}
                placeholder="Explicit issues directed to external toxicologists, pharmacologists, or peer reviewers for formal evaluation..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">
                Recommended Next Research Actions (in Stages 9–10)
              </label>
              <textarea
                rows={2}
                value={nextActions}
                onChange={(e) => setNextActions(e.target.value)}
                placeholder="In-vitro cytotoxicity MTT assays, Ames bacterial mutagenicity test, wet-lab HPLC validation..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none focus:border-[#16a34a]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 7 COMPLETION CHECKLIST & FOOTER                                    */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#edf2ee] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#16a34a]" />
              <h2 className="font-heading font-extrabold text-base text-[#0f2c20]">
                Stage 7 Completion Checklist
              </h2>
            </div>
            <p className="text-xs text-[#78997f]">
              Rigorous verification before locking dossier snapshot for Stage 8 Professional Review
            </p>
          </div>

          <button
            onClick={() => setIsCompleteConfirmationOpen(true)}
            disabled={!isChecklistComplete || completingStage}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isChecklistComplete
                ? "bg-[#0f2c20] hover:bg-[#1e5c44] text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>Complete Stage 7 & Submit to Review</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              checklist.hasVersion
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {checklist.hasVersion ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-bold">Formulation version identified</span>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              checklist.hasEvidence
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {checklist.hasEvidence ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-bold">Available safety evidence reviewed</span>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              checklist.hasComponentAssessment
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {checklist.hasComponentAssessment ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-bold">Components assessed</span>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              checklist.hasConcernsDocumented
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {checklist.hasConcernsDocumented ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-bold">Known concerns documented</span>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              checklist.hasEvidenceGaps
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {checklist.hasEvidenceGaps ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-bold">Evidence gaps documented</span>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              checklist.hasSummary
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {checklist.hasSummary ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-bold">Safety summary & review items complete</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER: EDIT COMPONENT SAFETY ASSESSMENT                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedCompForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg h-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto border-l border-[#dde6df]"
            >
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#78997f]">
                    Component Safety Assessment
                  </span>
                  <h3 className="font-heading font-extrabold text-lg text-[#0f2c20]">
                    {selectedCompForEdit.componentName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCompForEdit(null)}
                  className="p-1 rounded-full text-[#78997f] hover:text-[#0f2c20] hover:bg-[#faf9f5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveComponentAssessment} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#0f2c20]">Known Safety Concerns</label>
                  <textarea
                    rows={2}
                    value={compKnownConcern}
                    onChange={(e) => setCompKnownConcern(e.target.value)}
                    placeholder="Potential toxicity, mucocutaneous irritation, volatility..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#0f2c20]">Supporting Empirical Evidence</label>
                  <textarea
                    rows={2}
                    value={compSupportingEvidence}
                    onChange={(e) => setCompSupportingEvidence(e.target.value)}
                    placeholder="Published LD50, in-vitro cytotoxicity IC50, or pharmacopeial limits..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#0f2c20]">Potential Herb–Drug Interactions</label>
                  <textarea
                    rows={2}
                    value={compPotentialInteraction}
                    onChange={(e) => setCompPotentialInteraction(e.target.value)}
                    placeholder="Synergistic effect with other components or prescription drugs..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#0f2c20]">Researcher Assessment</label>
                  <textarea
                    rows={3}
                    value={compResearcherAssessment}
                    onChange={(e) => setCompResearcherAssessment(e.target.value)}
                    placeholder="Researcher rationale on why this ingredient concentration is justifiable and safe for the experimental protocol..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-900 block">
                      Escalate to Professional Reviewer?
                    </span>
                    <span className="text-[11px] text-amber-700">
                      Flags this component for specific examination in Stage 8.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={compNeedsReview}
                    onChange={(e) => setCompNeedsReview(e.target.checked)}
                    className="w-4 h-4 accent-[#0f2c20] cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-[#edf2ee] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCompForEdit(null)}
                    className="px-4 py-2 rounded-xl border border-[#dde6df] font-bold text-[#475550]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCompAssessment}
                    className="px-5 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {savingCompAssessment ? "Saving..." : "Save Assessment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ADD CONCERN TO REGISTER                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddConcernModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl border border-[#dde6df] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#16a34a]" />
                  <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                    Log Risk / Safety Concern
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddConcernModalOpen(false)}
                  className="text-[#78997f] hover:text-[#0f2c20]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddConcern} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0f2c20]">
                    Concern Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={concernTitle}
                    onChange={(e) => setConcernTitle(e.target.value)}
                    placeholder="e.g. Mild diuresis in high dosages; Potential CYP3A4 inhibition"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0f2c20]">Concern Category</label>
                    <select
                      value={concernCategory}
                      onChange={(e) => setConcernCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none font-bold"
                    >
                      {CONCERN_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0f2c20]">Affected Component</label>
                    <input
                      type="text"
                      value={concernAffectedComp}
                      onChange={(e) => setConcernAffectedComp(e.target.value)}
                      placeholder="e.g. Active Extract or Volatile Terpenes"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0f2c20]">Severity Level</label>
                    <select
                      value={concernSeverity}
                      onChange={(e) => setConcernSeverity(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none font-bold"
                    >
                      <option value="INFORMATIONAL">INFORMATIONAL</option>
                      <option value="LOW">LOW</option>
                      <option value="MODERATE">MODERATE</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0f2c20]">Evidence Status</label>
                    <select
                      value={concernEvidenceStatus}
                      onChange={(e) => setConcernEvidenceStatus(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none font-bold"
                    >
                      <option value="SUPPORTED">SUPPORTED (Published data)</option>
                      <option value="LIMITED">LIMITED (Theoretical or QSAR)</option>
                      <option value="UNKNOWN">UNKNOWN (Under investigation)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0f2c20]">Evidence or Reference Source</label>
                  <input
                    type="text"
                    value={concernEvidence}
                    onChange={(e) => setConcernEvidence(e.target.value)}
                    placeholder="e.g. Phytomedicine 2019; SwissADME hepatotoxicity prediction"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0f2c20]">Researcher Notes / Mitigation</label>
                  <textarea
                    rows={2}
                    value={concernNotes}
                    onChange={(e) => setConcernNotes(e.target.value)}
                    placeholder="Action taken to mitigate risk in formulation design..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2ee]">
                  <button
                    type="button"
                    onClick={() => setIsAddConcernModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#dde6df] text-xs font-bold text-[#475550]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingConcern}
                    className="px-5 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {submittingConcern ? "Saving..." : "Log Concern"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: COMPLETE STAGE 7 CONFIRMATION                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCompleteConfirmationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl border border-[#dde6df]"
            >
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-[#0f2c20]">
                  Submit Safety Assessment to Stage 8 Review?
                </h3>
                <p className="text-xs text-[#475550] leading-relaxed">
                  You are marking Stage 7 as <strong>COMPLETED</strong>. A formal locked snapshot of this
                  research dossier (including formulation{" "}
                  <strong className="font-mono text-[#0f2c20]">{activeVersion?.versionNumber || "v1.0"}</strong>,
                  safety concerns, and unresolved questions) will be submitted to{" "}
                  <strong>Stage 8: Professional Review</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#78997f]">Formulation Version:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {activeVersion?.versionNumber || "v1.0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78997f]">Components Reviewed:</span>
                  <span className="font-bold text-[#0f2c20]">{componentAssessments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78997f]">Registered Concerns:</span>
                  <span className="font-bold text-amber-700">{concerns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78997f]">Next Workflow Stage:</span>
                  <span className="font-bold text-emerald-800">Stage 8: Professional Review</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteConfirmationOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#dde6df] text-xs font-bold text-[#475550]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteStage}
                  disabled={completingStage}
                  className="px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {completingStage ? "Submitting..." : "Submit to Stage 8"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}