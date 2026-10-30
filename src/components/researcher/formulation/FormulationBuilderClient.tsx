"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Save,
  Check,
  ChevronRight,
  ShieldCheck,
  FileText,
  Paperclip,
  Activity,
  Star,
  Info,
  X,
  Eye,
  Sliders,
  History,
  Tag,
  Package,
  Boxes,
  Thermometer,
  Clock,
  Sparkles,
} from "lucide-react";

import {
  ResearchStageShell,
  StageHeader,
  StageSection,
  StageStatusBadge,
  StageActionBar,
  StageEmptyState,
  StageSummary,
  StageTabs,
  StageHelpTooltip,
} from "@/components/researcher/stage";

export interface FormulationOverviewData {
  id?: number;
  projectId: number;
  formulationName: string;
  formulationCode?: string;
  formulationType: string;
  researchPurpose: string;
  dosageFormType?: string;
  researcherRationale?: string;
  notes?: string;
  currentVersionNumber?: string;
  status?: string;
}

export interface FormulationVersionItem {
  id: number;
  formulationId: number;
  projectId: number;
  versionNumber: string;
  versionTag?: string;
  changeSummary?: string;
  createdByResearcherId: number;
  isCurrentVersion: number | boolean;
  createdAt: string;
}

export interface FormulationComponentItem {
  id: number;
  formulationId: number;
  versionId: number;
  projectId: number;
  componentName: string;
  roleInFormulation: string;
  sourceMaterial?: string;
  quantity?: string;
  unit?: string;
  concentration?: string;
  puritySpecification?: string;
  sourceReference?: string;
  notes?: string;
  createdAt: string;
}

export interface FormulationStepItem {
  id: number;
  formulationId: number;
  versionId: number;
  projectId: number;
  stepNumber: number;
  procedureText: string;
  equipment?: string;
  processingCondition?: string;
  temperature?: string;
  duration?: string;
  otherParameters?: string;
  researcherNotes?: string;
  supportingFileUrl?: string;
  createdAt: string;
}

export interface FormulationBatchItem {
  id: number;
  formulationId: number;
  versionId: number;
  projectId: number;
  batchId: string;
  preparationDate?: string;
  preparedBy?: string;
  batchSize?: string;
  storageConditions?: string;
  physicalObservations?: string;
  stabilityObservations?: string;
  supportingFileUrl?: string;
  createdAt: string;
}

export interface FormulationRationaleData {
  componentSelectionRationale?: string;
  literatureSupport?: string;
  previousStagesInfluence?: string;
  knownLimitations?: string;
  validationQuestions?: string;
}

interface FormulationBuilderClientProps {
  projectId: number;
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
    currentStage: string;
    status: string;
  };
  plantData?: {
    plantPartUsed?: string;
    traditionalPreparationNotes?: string;
    specimenSource?: string;
  } | null;
  compounds: Array<{ id: number; compoundName: string; molecularFormula?: string; plantSource?: string }>;
  initialFormulation: FormulationOverviewData | null;
  initialVersions: FormulationVersionItem[];
  initialActiveVersion: FormulationVersionItem | null;
  initialComponents: FormulationComponentItem[];
  initialSteps: FormulationStepItem[];
  initialBatches: FormulationBatchItem[];
  initialRationale: FormulationRationaleData | null;
}

const FORMULATION_TYPES = [
  "Standardized Extract",
  "Aqueous Decoction / Solution",
  "Suspension",
  "Topical Gel / Ointment",
  "Topical Cream",
  "Capsule Prototype",
  "Tablet Prototype",
  "Lyophilized Powder",
  "Experimental Mixture",
  "Other",
] as const;

const COMPONENT_ROLES = [
  "Active Phytochemical Extract",
  "Primary Solvent / Vehicle",
  "Co-Solvent",
  "Binder / Excipient",
  "Emulsifier / Surfactant",
  "Viscosity Enhancer / Gelling Agent",
  "Stabilizer / Antioxidant",
  "Disintegrant",
  "Buffering Agent",
  "Other Functional Component",
] as const;

export default function FormulationBuilderClient({
  projectId,
  project,
  plantData,
  compounds,
  initialFormulation,
  initialVersions,
  initialActiveVersion,
  initialComponents,
  initialSteps,
  initialBatches,
  initialRationale,
}: FormulationBuilderClientProps) {
  const router = useRouter();

  // Active tab
  const [activeTab, setActiveTab] = useState<string>("overview");

  // State
  const [formulation, setFormulation] = useState<FormulationOverviewData | null>(initialFormulation);
  const [versions, setVersions] = useState<FormulationVersionItem[]>(initialVersions);
  const [activeVersion, setActiveVersion] = useState<FormulationVersionItem | null>(initialActiveVersion);
  const [components, setComponents] = useState<FormulationComponentItem[]>(initialComponents);
  const [steps, setSteps] = useState<FormulationStepItem[]>(initialSteps);
  const [batches, setBatches] = useState<FormulationBatchItem[]>(initialBatches);

  // Overview Form Fields
  const [formName, setFormName] = useState(formulation?.formulationName || `${project.plantName} Experimental Extract`);
  const [formCode, setFormCode] = useState(formulation?.formulationCode || `FORM-${project.id}-01`);
  const [formType, setFormType] = useState(formulation?.formulationType || FORMULATION_TYPES[0]);
  const [researchPurpose, setResearchPurpose] = useState(
    formulation?.researchPurpose || "Investigate bioactivity and extraction yield of standardized botanical constituents."
  );
  const [dosageFormType, setDosageFormType] = useState(formulation?.dosageFormType || "");
  const [researcherRationale, setResearcherRationale] = useState(formulation?.researcherRationale || "");
  const [overviewNotes, setOverviewNotes] = useState(formulation?.notes || "");
  const [savingOverview, setSavingOverview] = useState(false);

  // Rationale Fields
  const [compSelectionRationale, setCompSelectionRationale] = useState(
    initialRationale?.componentSelectionRationale || ""
  );
  const [litSupport, setLitSupport] = useState(initialRationale?.literatureSupport || "");
  const [prevStagesInfluence, setPrevStagesInfluence] = useState(
    initialRationale?.previousStagesInfluence || ""
  );
  const [knownLimitations, setKnownLimitations] = useState(initialRationale?.knownLimitations || "");
  const [validationQuestions, setValidationQuestions] = useState(
    initialRationale?.validationQuestions || ""
  );
  const [savingRationale, setSavingRationale] = useState(false);

  // Modals
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [isCompleteConfirmationOpen, setIsCompleteConfirmationOpen] = useState(false);

  // Component Form State
  const [cName, setCName] = useState("");
  const [cRole, setCRole] = useState<string>(COMPONENT_ROLES[0]);
  const [cSource, setCSource] = useState("");
  const [cQty, setCQty] = useState("");
  const [cUnit, setCUnit] = useState("mg/mL");
  const [cConc, setCConc] = useState("");
  const [cPurity, setCPurity] = useState("");
  const [cNotes, setCNotes] = useState("");
  const [submittingComp, setSubmittingComp] = useState(false);

  // Step Form State
  const [sNumber, setSNumber] = useState(steps.length + 1);
  const [sProcedure, setSProcedure] = useState("");
  const [sEquipment, setSEquipment] = useState("");
  const [sTemp, setSTemp] = useState("");
  const [sDuration, setSDuration] = useState("");
  const [sParams, setSParams] = useState("");
  const [sFileUrl, setSFileUrl] = useState<string | null>(null);
  const [uploadingStepFile, setUploadingStepFile] = useState(false);
  const [submittingStep, setSubmittingStep] = useState(false);

  // Batch Form State
  const [bId, setBId] = useState(`BATCH-${project.id}-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-01`);
  const [bDate, setBDate] = useState(new Date().toISOString().slice(0, 10));
  const [bPreparer, setBPreparer] = useState("Lead Researcher");
  const [bSize, setBSize] = useState("100 mL");
  const [bStorage, setBStorage] = useState("4°C protected from light");
  const [bPhysicalObs, setBPhysicalObs] = useState("");
  const [bStabilityObs, setBStabilityObs] = useState("");
  const [bFileUrl, setBFileUrl] = useState<string | null>(null);
  const [uploadingBatchFile, setUploadingBatchFile] = useState(false);
  const [submittingBatch, setSubmittingBatch] = useState(false);

  // New Version Form State
  const [vNumber, setVNumber] = useState("v1.1");
  const [vTag, setVTag] = useState("Excipient Optimization");
  const [vSummary, setVSummary] = useState("");
  const [submittingVersion, setSubmittingVersion] = useState(false);

  // UI state
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [completingStage, setCompletingStage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Upload handler
  const handleUploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "step" | "batch"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "step") setUploadingStepFile(true);
    if (type === "batch") setUploadingBatchFile(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      if (type === "step") {
        setSFileUrl(data.url);
        showToast("Step documentation attached");
      } else {
        setBFileUrl(data.url);
        showToast("Batch quality report attached");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to upload file", "error");
    } finally {
      if (type === "step") setUploadingStepFile(false);
      if (type === "batch") setUploadingBatchFile(false);
    }
  };

  // Save Overview
  const handleSaveOverview = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim()) {
      showToast("Formulation name is required", "error");
      return;
    }

    setSavingOverview(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/formulation`, {
        method: formulation?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formulationName: formName.trim(),
          formulationCode: formCode.trim(),
          formulationType: formType,
          researchPurpose: researchPurpose.trim(),
          dosageFormType: dosageFormType.trim() || undefined,
          researcherRationale: researcherRationale.trim() || undefined,
          notes: overviewNotes.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save formulation concept");

      const saved = await res.json();
      setFormulation(saved);
      setLastSaved(new Date().toISOString());
      showToast("Formulation concept saved");
    } catch (err: any) {
      showToast(err.message || "Failed to save overview", "error");
    } finally {
      setSavingOverview(false);
    }
  };

  // Save Component
  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) {
      showToast("Component name is required", "error");
      return;
    }

    setSubmittingComp(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/formulation/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: activeVersion?.id,
          componentName: cName.trim(),
          roleInFormulation: cRole,
          sourceMaterial: cSource.trim() || undefined,
          quantity: cQty.trim() || undefined,
          unit: cUnit.trim() || undefined,
          concentration: cConc.trim() || undefined,
          puritySpecification: cPurity.trim() || undefined,
          notes: cNotes.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save ingredient component");

      const created = await res.json();
      setComponents([...components, created]);

      // Reset
      setCName("");
      setCSource("");
      setCQty("");
      setCConc("");
      setCPurity("");
      setCNotes("");
      setIsAddComponentOpen(false);

      showToast("Component added to formulation recipe");
    } catch (err: any) {
      showToast(err.message || "Failed to add component", "error");
    } finally {
      setSubmittingComp(false);
    }
  };

  // Delete Component
  const handleDeleteComponent = async (componentId: number) => {
    if (!confirm("Remove this component from the recipe?")) return;

    try {
      const res = await fetch(
        `/api/researcher/projects/${projectId}/formulation/components?id=${componentId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete component");

      setComponents(components.filter((c) => c.id !== componentId));
      showToast("Component removed");
    } catch (err: any) {
      showToast(err.message || "Failed to delete component", "error");
    }
  };

  // Save Step
  const handleSaveStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sProcedure.trim()) {
      showToast("Procedure text is required", "error");
      return;
    }

    setSubmittingStep(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/formulation/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: activeVersion?.id,
          stepNumber: sNumber,
          procedureText: sProcedure.trim(),
          equipment: sEquipment.trim() || undefined,
          temperature: sTemp.trim() || undefined,
          duration: sDuration.trim() || undefined,
          otherParameters: sParams.trim() || undefined,
          supportingFileUrl: sFileUrl || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save SOP step");

      const created = await res.json();
      setSteps([...steps, created]);

      // Reset
      setSProcedure("");
      setSEquipment("");
      setSTemp("");
      setSDuration("");
      setSParams("");
      setSFileUrl(null);
      setSNumber(steps.length + 2);
      setIsAddStepOpen(false);

      showToast("SOP step added");
    } catch (err: any) {
      showToast(err.message || "Failed to save step", "error");
    } finally {
      setSubmittingStep(false);
    }
  };

  // Delete Step
  const handleDeleteStep = async (stepId: number) => {
    if (!confirm("Remove this step from the preparation procedure?")) return;

    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/formulation/steps?id=${stepId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete step");

      setSteps(steps.filter((s) => s.id !== stepId));
      showToast("Step removed");
    } catch (err: any) {
      showToast(err.message || "Failed to delete step", "error");
    }
  };

  // Save Batch
  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bId.trim()) {
      showToast("Batch ID is required", "error");
      return;
    }

    setSubmittingBatch(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/formulation/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: activeVersion?.id,
          batchId: bId.trim(),
          preparationDate: bDate,
          preparedBy: bPreparer.trim() || undefined,
          batchSize: bSize.trim() || undefined,
          storageConditions: bStorage.trim() || undefined,
          physicalObservations: bPhysicalObs.trim() || undefined,
          stabilityObservations: bStabilityObs.trim() || undefined,
          supportingFileUrl: bFileUrl || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to record pilot batch");

      const created = await res.json();
      setBatches([created, ...batches]);

      // Reset
      setBPhysicalObs("");
      setBStabilityObs("");
      setBFileUrl(null);
      setIsAddBatchOpen(false);

      showToast("Pilot batch logged");
    } catch (err: any) {
      showToast(err.message || "Failed to record batch", "error");
    } finally {
      setSubmittingBatch(false);
    }
  };

  // Delete Batch
  const handleDeleteBatch = async (batchDbId: number) => {
    if (!confirm("Remove this batch record?")) return;

    try {
      const res = await fetch(
        `/api/researcher/projects/${projectId}/formulation/batches?id=${batchDbId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete batch");

      setBatches(batches.filter((b) => b.id !== batchDbId));
      showToast("Batch record removed");
    } catch (err: any) {
      showToast(err.message || "Failed to delete batch", "error");
    }
  };

  // Save Rationale
  const handleSaveRationale = async () => {
    setSavingRationale(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/formulation/rationale`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentSelectionRationale: compSelectionRationale.trim() || undefined,
          literatureSupport: litSupport.trim() || undefined,
          previousStagesInfluence: prevStagesInfluence.trim() || undefined,
          knownLimitations: knownLimitations.trim() || undefined,
          validationQuestions: validationQuestions.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save formulation rationale");

      setLastSaved(new Date().toISOString());
      showToast("Formulation rationale saved");
    } catch (err: any) {
      showToast(err.message || "Failed to save rationale", "error");
    } finally {
      setSavingRationale(false);
    }
  };

  // Create New Version
  const handleCreateNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vNumber.trim()) {
      showToast("Version number is required", "error");
      return;
    }

    setSubmittingVersion(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/formulation/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionNumber: vNumber.trim(),
          versionTag: vTag.trim() || undefined,
          changeSummary: vSummary.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create formulation version");

      const created = await res.json();
      setVersions([...versions, created]);
      setActiveVersion(created);
      setIsNewVersionModalOpen(false);

      showToast(`Formulation ${created.versionNumber} activated`);
    } catch (err: any) {
      showToast(err.message || "Failed to create version", "error");
    } finally {
      setSubmittingVersion(false);
    }
  };

  // Complete Stage 6
  const handleCompleteStage = async () => {
    setCompletingStage(true);
    try {
      // 1. Save overview & rationale
      await handleSaveOverview();
      await handleSaveRationale();

      // 2. Advance stage
      const res = await fetch(`/api/researcher/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-stage",
          stageNumber: 6,
          nextStage: "safety",
        }),
      });

      if (!res.ok) throw new Error("Failed to complete Stage 6");

      showToast("Stage 6 - Formulation Builder completed! Advancing to Safety Assessment...");
      setIsCompleteConfirmationOpen(false);

      router.push(`/researcher/projects/${projectId}/safety`);
    } catch (err: any) {
      showToast(err.message || "Failed to complete stage", "error");
    } finally {
      setCompletingStage(false);
    }
  };

  // Requirements checklist
  const checklist = {
    hasFormulation: Boolean(formulation?.id || formName),
    hasComponents: components.length > 0,
    hasSteps: steps.length > 0,
    hasBatches: batches.length > 0,
    hasRationale: Boolean(compSelectionRationale && compSelectionRationale.trim().length > 10),
  };

  const isChecklistComplete =
    checklist.hasFormulation &&
    checklist.hasComponents &&
    checklist.hasSteps &&
    checklist.hasBatches &&
    checklist.hasRationale;

  const stageStatus =
    project.currentStage === "formulation" || project.currentStage === "6"
      ? "IN_PROGRESS"
      : "COMPLETED";

  const stageTabsList = [
    { id: "overview", label: "Product Concept", icon: Package },
    { id: "components", label: "Recipe & Excipients", icon: FlaskConical, badge: components.length },
    { id: "steps", label: "SOP & Processing", icon: Sliders, badge: steps.length },
    { id: "batches", label: "Pilot Batches", icon: Boxes, badge: batches.length },
    { id: "rationale", label: "Formulation Rationale", icon: FileText },
  ];

  const summaryRequirements = [
    {
      id: "concept",
      label: "Dosage Form Defined",
      met: checklist.hasFormulation,
      hint: "Set extract type and delivery form",
    },
    {
      id: "recipe",
      label: "Components & Excipients",
      met: checklist.hasComponents,
      hint: "Add bioactive extract & excipients",
    },
    {
      id: "sop",
      label: "Standard Operating Procedure",
      met: checklist.hasSteps,
      hint: "Specify extraction temperature & duration",
    },
    {
      id: "batch",
      label: "Pilot Batch / Scale-Up",
      met: checklist.hasBatches,
      hint: "Record test batch and stability notes",
    },
    {
      id: "rationale",
      label: "Scientific Rationale",
      met: checklist.hasRationale,
      hint: "Document link to In-Silico & Docking",
    },
  ];

  const summaryMetrics = [
    { label: "Active Version", value: activeVersion?.versionNumber || "v1.0", icon: Tag },
    { label: "Formulation Components", value: components.length, icon: FlaskConical },
    { label: "SOP Processing Steps", value: steps.length, icon: Sliders },
    { label: "Pilot Batches", value: batches.length, icon: Boxes },
  ];

  return (
    <ResearchStageShell
      contextPanel={
        <StageSummary
          stageNumber={6}
          stageTitle="Formulation Builder"
          stageStatus={stageStatus}
          requirements={summaryRequirements}
          metrics={summaryMetrics}
          nextStepText="Translate in-silico botanical hits into standardized extraction protocols and dosage prototypes for safety screening."
        />
      }
    >
      {/* TOAST FEEDBACK */}
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
            ) : toastType === "info" ? (
              <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. UNIVERSAL STAGE HEADER */}
      <StageHeader
        projectId={projectId}
        projectTitle={project.title}
        plantName={project.plantName}
        plantScientificName={project.plantScientificName}
        stageNumber={6}
        stageTitle="Formulation Builder"
        stageSubtitle="Botanical Recipe & Standard Operating Procedures"
        stageStatus={stageStatus}
        isSaving={savingOverview || savingRationale}
        lastSaved={lastSaved}
        onSave={() => {
          handleSaveOverview();
          handleSaveRationale();
        }}
        canAdvance={isChecklistComplete}
        onAdvance={() => setIsCompleteConfirmationOpen(true)}
        advanceLabel="Complete Stage 6"
        isAdvancing={completingStage}
        guideContent={
          <div className="space-y-1.5 text-xs text-[#475550]">
            <p>
              <strong>Scientific Objective:</strong> Engineer a reproducible formulation composition,
              specifying active plant extract concentrations, excipient vehicles, and extraction steps.
            </p>
            <p>
              <strong>Regulatory Integrity:</strong> Ensure all components follow pharmacopeial purity guidelines
              prior to toxicology assessment in Stage 07.
            </p>
          </div>
        }
      />

      {/* 2. STAGE TABS */}
      <StageTabs
        tabs={stageTabsList}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      {/* ========================================================
          TAB 1: PRODUCT CONCEPT
          ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <StageSection
            title="Botanical Formulation Concept & Specifications"
            subtitle="Define intended delivery format, therapeutic target, and formulation codes"
            icon={Package}
            action={
              <button
                type="button"
                onClick={handleSaveOverview}
                disabled={savingOverview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>{savingOverview ? "Saving..." : "Save Concept"}</span>
              </button>
            }
          >
            <form onSubmit={handleSaveOverview} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    Formulation Prototype Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sambong Hydro-Ethanolic Standardized Extract"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Formulation Code</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. FORM-SAM-01"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs font-mono text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Formulation Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  >
                    {FORMULATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Dosage Form Delivery Mode</label>
                  <input
                    type="text"
                    value={dosageFormType}
                    onChange={(e) => setDosageFormType(e.target.value)}
                    placeholder="e.g. Oral syrup, Hard gelatin capsule, Topical cream"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0f2c20]">Research Purpose & Target Indication</label>
                  <StageHelpTooltip content="Define the therapeutic rationale and clinical translation target for this prototype." />
                </div>
                <textarea
                  rows={3}
                  value={researchPurpose}
                  onChange={(e) => setResearchPurpose(e.target.value)}
                  placeholder="Describe target health application, target population, and therapeutic hypothesis..."
                  className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0f2c20]">Formulation Rationale & Design Notes</label>
                <textarea
                  rows={2}
                  value={researcherRationale}
                  onChange={(e) => setResearcherRationale(e.target.value)}
                  placeholder="Key considerations for excipients, solvent ratios, or extraction temperature..."
                  className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                />
              </div>
            </form>
          </StageSection>
        </div>
      )}

      {/* ========================================================
          TAB 2: RECIPE & EXCIPIENTS
          ======================================================== */}
      {activeTab === "components" && (
        <div className="space-y-6">
          <StageSection
            title="Quantitative Formulation Recipe"
            subtitle={`${components.length} active botanicals and excipients configured`}
            icon={FlaskConical}
            action={
              <button
                type="button"
                onClick={() => setIsAddComponentOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-300" />
                <span>Add Component</span>
              </button>
            }
          >
            {components.length === 0 ? (
              <StageEmptyState
                icon={FlaskConical}
                title="No recipe components added"
                description="Add the botanical extract and supporting pharmaceutical excipients (binders, stabilizers, vehicles)."
                action={{
                  label: "Add Active Component",
                  onClick: () => setIsAddComponentOpen(true),
                }}
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#dde6df]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#faf9f5] text-[10px] font-extrabold uppercase tracking-wider text-[#78997f] border-b border-[#dde6df]">
                    <tr>
                      <th className="px-4 py-3">Component / Material</th>
                      <th className="px-4 py-3">Functional Role</th>
                      <th className="px-4 py-3">Quantity / Concentration</th>
                      <th className="px-4 py-3">Purity / Grade</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2ee] bg-white">
                    {components.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#0f2c20]">{c.componentName}</div>
                          {c.sourceMaterial && (
                            <span className="text-[10px] text-[#78997f]">
                              Source: {c.sourceMaterial}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                            {c.roleInFormulation}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-[#0f2c20]">
                          {c.quantity} {c.unit} {c.concentration ? `(${c.concentration})` : ""}
                        </td>
                        <td className="px-4 py-3 text-[#475550]">
                          {c.puritySpecification || "USP/NF Grade"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteComponent(c.id)}
                            className="p-1.5 rounded-lg border border-[#dde6df] text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </StageSection>
        </div>
      )}

      {/* ========================================================
          TAB 3: SOP & PROCESSING STEPS
          ======================================================== */}
      {activeTab === "steps" && (
        <div className="space-y-6">
          <StageSection
            title="Standard Operating Procedure (SOP) Protocol"
            subtitle={`${steps.length} sequential preparation & extraction steps documented`}
            icon={Sliders}
            action={
              <button
                type="button"
                onClick={() => setIsAddStepOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-300" />
                <span>Add SOP Step</span>
              </button>
            }
          >
            {steps.length === 0 ? (
              <StageEmptyState
                icon={Sliders}
                title="No processing steps recorded"
                description="Document sequential operations: maceration, rotary evaporation, filtration, mixing."
                action={{
                  label: "Add Step 1",
                  onClick: () => setIsAddStepOpen(true),
                }}
              />
            ) : (
              <div className="space-y-3">
                {steps
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-white border border-[#dde6df] flex items-start gap-3 hover:border-emerald-300 transition-all"
                    >
                      <div className="w-7 h-7 rounded-xl bg-[#0f2c20] text-emerald-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {s.stepNumber}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0f2c20] leading-relaxed">
                          {s.procedureText}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#78997f]">
                          {s.equipment && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#faf9f5] border border-[#dde6df] text-[#0f2c20]">
                              Equipment: {s.equipment}
                            </span>
                          )}
                          {s.temperature && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#faf9f5] border border-[#dde6df] text-[#0f2c20] flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-rose-500" />
                              {s.temperature}
                            </span>
                          )}
                          {s.duration && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#faf9f5] border border-[#dde6df] text-[#0f2c20] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              {s.duration}
                            </span>
                          )}
                          {s.supportingFileUrl && (
                            <a
                              href={s.supportingFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1"
                            >
                              <Paperclip className="w-3 h-3" />
                              Attachment
                            </a>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteStep(s.id)}
                        className="p-1.5 rounded-lg border border-[#dde6df] text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </StageSection>
        </div>
      )}

      {/* ========================================================
          TAB 4: PILOT BATCHES
          ======================================================== */}
      {activeTab === "batches" && (
        <div className="space-y-6">
          <StageSection
            title="Pilot Batches & Stability Observations"
            subtitle={`${batches.length} test batches evaluated for physical appearance, pH, and precipitation`}
            icon={Boxes}
            action={
              <button
                type="button"
                onClick={() => setIsAddBatchOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-300" />
                <span>Log Batch</span>
              </button>
            }
          >
            {batches.length === 0 ? (
              <StageEmptyState
                icon={Boxes}
                title="No pilot batches logged"
                description="Record test batch yield, physical organoleptic observations, and stability tests."
                action={{
                  label: "Log Test Batch",
                  onClick: () => setIsAddBatchOpen(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {batches.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-white border border-[#dde6df] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#0f2c20]">
                            {b.batchId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#0f2c20] text-[10px] font-bold">
                            {b.batchSize || "Standard Batch"}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#78997f]">
                          Prepared on {b.preparationDate || "Recent"} by {b.preparedBy || "Researcher"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteBatch(b.id)}
                        className="p-1.5 rounded-lg border border-[#dde6df] text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {b.storageConditions && (
                        <div className="p-2 rounded-xl bg-[#faf9f5] border border-[#dde6df] text-[11px]">
                          <span className="font-bold text-[#0f2c20]">Storage: </span>
                          <span className="text-[#475550]">{b.storageConditions}</span>
                        </div>
                      )}

                      {b.physicalObservations && (
                        <div className="text-[#475550] line-clamp-2">
                          <span className="font-bold text-[#0f2c20]">Appearance: </span>
                          {b.physicalObservations}
                        </div>
                      )}

                      {b.stabilityObservations && (
                        <div className="text-[#475550] line-clamp-2">
                          <span className="font-bold text-[#0f2c20]">Stability: </span>
                          {b.stabilityObservations}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StageSection>
        </div>
      )}

      {/* ========================================================
          TAB 5: FORMULATION RATIONALE
          ======================================================== */}
      {activeTab === "rationale" && (
        <div className="space-y-6">
          <StageSection
            title="Scientific Formulation Rationale"
            subtitle="Document how prior in-silico screening informed vehicle choice, stability, and dosage"
            icon={FileText}
            action={
              <button
                type="button"
                onClick={handleSaveRationale}
                disabled={savingRationale}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>{savingRationale ? "Saving..." : "Save Rationale"}</span>
              </button>
            }
          >
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0f2c20]">
                    1. Component Selection Rationale <span className="text-rose-500">*</span>
                  </label>
                  <StageHelpTooltip content="Explain why specific extraction solvents, concentrations, and excipients were chosen." />
                </div>
                <textarea
                  rows={4}
                  value={compSelectionRationale}
                  onChange={(e) => setCompSelectionRationale(e.target.value)}
                  placeholder="e.g. 70% hydro-ethanolic extraction was chosen based on high yield of blumeatin and flavonoid solubility profiles..."
                  className="w-full p-3 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">2. Influence of Prior Stages</label>
                  <textarea
                    rows={3}
                    value={prevStagesInfluence}
                    onChange={(e) => setPrevStagesInfluence(e.target.value)}
                    placeholder="How did Stage 04 (In-Silico) and Stage 05 (Docking) dictate active compound preservation?"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">3. Key Literature Precedents</label>
                  <textarea
                    rows={3}
                    value={litSupport}
                    onChange={(e) => setLitSupport(e.target.value)}
                    placeholder="Cite relevant pharmacopeia or clinical herbal extraction monographs..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">4. Known Formulation Limitations</label>
                  <textarea
                    rows={2}
                    value={knownLimitations}
                    onChange={(e) => setKnownLimitations(e.target.value)}
                    placeholder="e.g. Susceptibility to photo-oxidation, precipitation over 30 days..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">5. Questions for Validation & Clinical Translation</label>
                  <textarea
                    rows={2}
                    value={validationQuestions}
                    onChange={(e) => setValidationQuestions(e.target.value)}
                    placeholder="Hypotheses and questions to address during Stage 5 Research Integration..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </StageSection>
        </div>
      )}

      {/* 3. STICKY ACTION BAR */}
      <StageActionBar
        stageNumber={6}
        stageTitle="Formulation Builder"
        isSaving={savingOverview || savingRationale}
        lastSaved={lastSaved}
        onSave={() => {
          handleSaveOverview();
          handleSaveRationale();
        }}
        primaryAction={{
          label: isChecklistComplete ? "Complete Stage 6 →" : "Fulfill Requirements",
          onClick: () => setIsCompleteConfirmationOpen(true),
          disabled: !isChecklistComplete || completingStage,
          loading: completingStage,
        }}
      />

      {/* ========================================================
          MODAL 1: ADD COMPONENT MODAL
          ======================================================== */}
      <AnimatePresence>
        {isAddComponentOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#dde6df] shadow-2xl p-6 sm:p-7 max-w-xl w-full my-8 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-[#16a34a]">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                      Add Formulation Component
                    </h3>
                    <p className="text-xs text-[#78997f]">
                      Add active botanical extract or excipient ingredient
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddComponentOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-[#475550]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveComponent} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    Component Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="e.g. Standardized Sambong Extract (0.5% Blumeatin)"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Role in Formulation</label>
                    <select
                      value={cRole}
                      onChange={(e) => setCRole(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    >
                      {COMPONENT_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Source Material</label>
                    <input
                      type="text"
                      value={cSource}
                      onChange={(e) => setCSource(e.target.value)}
                      placeholder="e.g. Dried leaves (Batangas)"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Quantity</label>
                    <input
                      type="text"
                      value={cQty}
                      onChange={(e) => setCQty(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs font-mono text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Unit</label>
                    <input
                      type="text"
                      value={cUnit}
                      onChange={(e) => setCUnit(e.target.value)}
                      placeholder="mg, mL, %, w/v"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Concentration / %</label>
                    <input
                      type="text"
                      value={cConc}
                      onChange={(e) => setCConc(e.target.value)}
                      placeholder="e.g. 10% w/w"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs font-mono text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Purity / Grade Specification</label>
                  <input
                    type="text"
                    value={cPurity}
                    onChange={(e) => setCPurity(e.target.value)}
                    placeholder="e.g. Analytical Grade, USP Standard"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2ee]">
                  <button
                    type="button"
                    onClick={() => setIsAddComponentOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#475550] hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingComp}
                    className="px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingComp ? "Adding..." : "Add Component"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 2: ADD STEP MODAL
          ======================================================== */}
      <AnimatePresence>
        {isAddStepOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#dde6df] shadow-2xl p-6 sm:p-7 max-w-xl w-full my-8 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-[#16a34a]">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                      Add SOP Processing Step
                    </h3>
                    <p className="text-xs text-[#78997f]">
                      Specify extraction, mixing, or packaging parameters
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddStepOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-[#475550]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStep} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1 col-span-1">
                    <label className="font-bold text-[#0f2c20]">Step #</label>
                    <input
                      type="number"
                      value={sNumber}
                      onChange={(e) => setSNumber(parseInt(e.target.value) || 1)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs font-mono font-bold text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>

                  <div className="space-y-1 col-span-3">
                    <label className="font-bold text-[#0f2c20]">Equipment / Instrument</label>
                    <input
                      type="text"
                      value={sEquipment}
                      onChange={(e) => setSEquipment(e.target.value)}
                      placeholder="e.g. Ultrasonic bath, Rotary evaporator"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    Procedure Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={sProcedure}
                    onChange={(e) => setSProcedure(e.target.value)}
                    placeholder="Macerate dried botanical powder in 70% ethanol at 1:10 w/v ratio under constant stirring..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Operating Temperature</label>
                    <input
                      type="text"
                      value={sTemp}
                      onChange={(e) => setSTemp(e.target.value)}
                      placeholder="e.g. 45°C ± 2°C"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Duration</label>
                    <input
                      type="text"
                      value={sDuration}
                      onChange={(e) => setSDuration(e.target.value)}
                      placeholder="e.g. 120 minutes"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2ee]">
                  <button
                    type="button"
                    onClick={() => setIsAddStepOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#475550] hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStep}
                    className="px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingStep ? "Adding..." : "Add SOP Step"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 3: ADD BATCH MODAL
          ======================================================== */}
      <AnimatePresence>
        {isAddBatchOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#dde6df] shadow-2xl p-6 sm:p-7 max-w-xl w-full my-8 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-[#16a34a]">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                      Log Pilot Batch
                    </h3>
                    <p className="text-xs text-[#78997f]">
                      Record batch size, physical inspection, and storage conditions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddBatchOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-[#475550]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBatch} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">
                      Batch Identifier <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bId}
                      onChange={(e) => setBId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs font-mono font-bold text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Batch Scale / Volume</label>
                    <input
                      type="text"
                      value={bSize}
                      onChange={(e) => setBSize(e.target.value)}
                      placeholder="e.g. 250 mL, 50 capsules"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Preparation Date</label>
                    <input
                      type="date"
                      value={bDate}
                      onChange={(e) => setBDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Prepared By</label>
                    <input
                      type="text"
                      value={bPreparer}
                      onChange={(e) => setBPreparer(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Storage Conditions</label>
                  <input
                    type="text"
                    value={bStorage}
                    onChange={(e) => setBStorage(e.target.value)}
                    placeholder="e.g. 4°C protected from light, amber glass vial"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Physical Organoleptic Appearance</label>
                  <textarea
                    rows={2}
                    value={bPhysicalObs}
                    onChange={(e) => setBPhysicalObs(e.target.value)}
                    placeholder="Color, clarity, viscosity, odor..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2ee]">
                  <button
                    type="button"
                    onClick={() => setIsAddBatchOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#475550] hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBatch}
                    className="px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingBatch ? "Logging..." : "Log Pilot Batch"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 4: STAGE COMPLETION CONFIRMATION MODAL
          ======================================================== */}
      <AnimatePresence>
        {isCompleteConfirmationOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#dde6df] shadow-2xl p-6 sm:p-7 max-w-md w-full space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-base text-[#0f2c20]">
                    Complete Stage 6
                  </h4>
                  <p className="text-xs text-[#78997f]">
                    Progress to Safety Assessment
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#475550] leading-relaxed">
                Complete Formulation Builder and proceed to Safety Assessment? Your formulation
                recipe, component percentages, and SOP will be analyzed for toxicity and contraindications.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteConfirmationOpen(false)}
                  disabled={completingStage}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#475550] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteStage}
                  disabled={completingStage}
                  className="px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {completingStage ? "Finalizing..." : "Complete & Continue"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ResearchStageShell>
  );
}
