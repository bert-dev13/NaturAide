"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Sprout,
  ShieldCheck,
  Calendar,
  MapPin,
  Tag,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Save,
  Check,
  ChevronRight,
  Database,
  Building,
  User,
  FlaskConical,
  Layers,
  FileCheck,
} from "lucide-react";

import {
  ResearchStageShell,
  StageHeader,
  StageSection,
  StageStatusBadge,
  StageActionBar,
  StageSummary,
  StageTabs,
  StageHelpTooltip,
} from "@/components/researcher/stage";

interface PlantResearchClientProps {
  projectId: number;
  project: {
    id: number;
    title: string;
    currentStage: string;
    status: string;
  };
  verifiedPlant: {
    id?: number | null;
    commonName: string;
    scientificName?: string | null;
    family?: string | null;
    synonyms?: string | null;
    localNames?: string | null;
    partsUsed?: string | null;
    sourceOrg?: string | null;
    sourceUrl?: string | null;
    isVerified?: boolean;
    imageUrl?: string | null;
    category?: string | null;
    therapeuticUses?: string | null;
    precautions?: string | null;
    activeCompounds?: string | null;
  };
  initialPlantData: {
    partsStudied?: string;
    specimenSource?: string;
    collectionDate?: string;
    collectionLocation?: string;
    sampleIdentifier?: string;
    authenticationMethod?: string;
    authenticatedBy?: string;
    voucherSpecimenNumber?: string;
    storageHandlingNotes?: string;
    supportingDocumentUrl?: string | null;
    materialType?: string;
    extractionMethod?: string;
    extractionSolvent?: string;
    extractFractionName?: string;
    authenticationStatus?: string;
    selectionRationale?: string;
    relevantCharacteristics?: string;
    additionalBotanicalNotes?: string;
    status?: string;
  };
}

export default function PlantResearchClient({
  projectId,
  project,
  verifiedPlant,
  initialPlantData,
}: PlantResearchClientProps) {
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>("identity");

  // Specimen documentation fields
  const [partsStudied, setPartsStudied] = useState(
    initialPlantData.partsStudied || verifiedPlant.partsUsed || "Leaves"
  );
  const [specimenSource, setSpecimenSource] = useState(
    initialPlantData.specimenSource || ""
  );
  const [collectionDate, setCollectionDate] = useState(
    initialPlantData.collectionDate || ""
  );
  const [collectionLocation, setCollectionLocation] = useState(
    initialPlantData.collectionLocation || ""
  );
  const [sampleIdentifier, setSampleIdentifier] = useState(
    initialPlantData.sampleIdentifier || ""
  );
  const [authenticationMethod, setAuthenticationMethod] = useState(
    initialPlantData.authenticationMethod || "Macro-morphological & Taxonomic Key"
  );
  const [authenticatedBy, setAuthenticatedBy] = useState(
    initialPlantData.authenticatedBy || ""
  );
  const [voucherSpecimenNumber, setVoucherSpecimenNumber] = useState(
    initialPlantData.voucherSpecimenNumber || ""
  );
  const [storageHandlingNotes, setStorageHandlingNotes] = useState(
    initialPlantData.storageHandlingNotes || ""
  );
  const [supportingDocumentUrl, setSupportingDocumentUrl] = useState<string | null>(
    initialPlantData.supportingDocumentUrl || null
  );

  // Material fields
  const [materialType, setMaterialType] = useState<string>(
    initialPlantData.materialType || "Crude Extract"
  );
  const [extractionMethod, setExtractionMethod] = useState(
    initialPlantData.extractionMethod || ""
  );
  const [extractionSolvent, setExtractionSolvent] = useState(
    initialPlantData.extractionSolvent || ""
  );
  const [extractFractionName, setExtractFractionName] = useState(
    initialPlantData.extractFractionName || ""
  );

  // Authentication Status
  const [authenticationStatus, setAuthenticationStatus] = useState<string>(
    initialPlantData.authenticationStatus || "NOT_DOCUMENTED"
  );

  // Researcher Notes
  const [selectionRationale, setSelectionRationale] = useState(
    initialPlantData.selectionRationale || ""
  );
  const [relevantCharacteristics, setRelevantCharacteristics] = useState(
    initialPlantData.relevantCharacteristics || ""
  );
  const [additionalBotanicalNotes, setAdditionalBotanicalNotes] = useState(
    initialPlantData.additionalBotanicalNotes || ""
  );

  // UI state
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [isCompleteConfirmationOpen, setIsCompleteConfirmationOpen] = useState(false);
  const [completingStage, setCompletingStage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Upload Supporting Document
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setSupportingDocumentUrl(data.url);
      setUploadedDocName(file.name);
      showToast("Authentication document attached");
    } catch (err: any) {
      showToast(err.message || "Failed to upload file", "error");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Save Plant Research Data
  const handleSaveData = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/plant-research`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partsStudied,
          specimenSource,
          collectionDate,
          collectionLocation,
          sampleIdentifier,
          authenticationMethod,
          authenticatedBy,
          voucherSpecimenNumber,
          storageHandlingNotes,
          supportingDocumentUrl,
          materialType,
          extractionMethod,
          extractionSolvent,
          extractFractionName,
          authenticationStatus,
          selectionRationale,
          relevantCharacteristics,
          additionalBotanicalNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save plant research data");
      }

      setLastSaved(new Date().toISOString());
      showToast("Botanical & specimen data saved");
    } catch (err: any) {
      showToast(err.message || "Failed to save data", "error");
    } finally {
      setSaving(false);
    }
  };

  // Complete Stage 2
  const handleCompleteStage = async () => {
    setCompletingStage(true);
    try {
      // 1. Save data with COMPLETED status
      await fetch(`/api/researcher/projects/${projectId}/plant-research`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partsStudied,
          specimenSource,
          collectionDate,
          collectionLocation,
          sampleIdentifier,
          authenticationMethod,
          authenticatedBy,
          voucherSpecimenNumber,
          storageHandlingNotes,
          supportingDocumentUrl,
          materialType,
          extractionMethod,
          extractionSolvent,
          extractFractionName,
          authenticationStatus,
          selectionRationale,
          relevantCharacteristics,
          additionalBotanicalNotes,
          status: "COMPLETED",
        }),
      });

      // 2. Advance project stage
      const res = await fetch(`/api/researcher/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-stage",
          stageNumber: 2,
          nextStage: "literature",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to complete Stage 2");
      }

      showToast("Stage 2 - Plant Research completed! Advancing to Literature & Evidence...");
      setIsCompleteConfirmationOpen(false);

      router.push(`/researcher/projects/${projectId}/literature`);
    } catch (err: any) {
      showToast(err.message || "Failed to complete stage", "error");
    } finally {
      setCompletingStage(false);
    }
  };

  // Readiness Checklist
  const checklist = {
    hasParts: Boolean(partsStudied && partsStudied.trim().length > 0),
    hasMaterial: Boolean(materialType && materialType.trim().length > 0),
    hasAuthMethod: Boolean(authenticationMethod && authenticationMethod.trim().length > 0),
    hasRationale: Boolean(selectionRationale && selectionRationale.trim().length > 5),
  };

  const isChecklistComplete =
    checklist.hasParts &&
    checklist.hasMaterial &&
    checklist.hasAuthMethod &&
    checklist.hasRationale;

  const stageStatus =
    project.currentStage === "plant-research" || project.currentStage === "2"
      ? "IN_PROGRESS"
      : "COMPLETED";

  const stageTabsList = [
    { id: "identity", label: "Botanical Identity", icon: Sprout },
    { id: "specimen", label: "Specimen Provenance", icon: MapPin },
    { id: "material", label: "Material & Extraction", icon: FlaskConical },
    { id: "authentication", label: "Authentication & Voucher", icon: ShieldCheck },
    { id: "rationale", label: "Selection Rationale", icon: FileText },
  ];

  const summaryRequirements = [
    {
      id: "parts",
      label: "Specimen Part Documented",
      met: checklist.hasParts,
      hint: "Specify plant anatomical part (e.g. Leaves, Bark)",
    },
    {
      id: "material",
      label: "Material & Extraction Protocol",
      met: checklist.hasMaterial,
      hint: "Define material form (e.g. Crude Extract, Fraction)",
    },
    {
      id: "auth",
      label: "Authentication Method Established",
      met: checklist.hasAuthMethod,
      hint: "Document taxonomic key or macroscopic analysis",
    },
    {
      id: "rationale",
      label: "Selection Rationale Articulated",
      met: checklist.hasRationale,
      hint: "Record scientific reasons for choosing this specimen",
    },
  ];

  const summaryMetrics = [
    { label: "Specimen", value: verifiedPlant.commonName, icon: Leaf },
    { label: "Part Studied", value: partsStudied || "Pending", icon: Tag },
    { label: "Material Type", value: materialType || "Pending", icon: FlaskConical },
    { label: "Auth Status", value: authenticationStatus.replace(/_/g, " "), icon: ShieldCheck },
  ];

  return (
    <ResearchStageShell
      contextPanel={
        <StageSummary
          stageNumber={2}
          stageTitle="Plant Research"
          stageStatus={stageStatus}
          requirements={summaryRequirements}
          metrics={summaryMetrics}
          nextStepText="Record specimen provenance and extraction parameters, then advance to Literature & Evidence."
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
        plantName={verifiedPlant.commonName}
        plantScientificName={verifiedPlant.scientificName || undefined}
        stageNumber={2}
        stageTitle="Plant Research"
        stageSubtitle="Botanical Characterization"
        stageStatus={stageStatus}
        isSaving={saving}
        lastSaved={lastSaved}
        onSave={handleSaveData}
        canAdvance={isChecklistComplete}
        onAdvance={() => setIsCompleteConfirmationOpen(true)}
        advanceLabel="Complete Stage 2"
        isAdvancing={completingStage}
        guideContent={
          <div className="space-y-1.5 text-xs text-[#475550]">
            <p>
              <strong>Objective:</strong> Rigorously characterize botanical classification, specimen
              origin, collection location, anatomical part, and botanical authentication method.
            </p>
            <p>
              <strong>Scientific Provenance:</strong> Stored botanical baselines adhere to authoritative
              taxonomic databases. Every botanical study must document an unambiguous specimen lineage.
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
          TAB 1: BOTANICAL IDENTITY HERO & ATTRIBUTES
          ======================================================== */}
      {activeTab === "identity" && (
        <div className="space-y-6">
          <StageSection
            title="Authoritative Botanical Record"
            subtitle="Authoritative NaturAide botanical profile for this investigation"
            icon={Sprout}
            badge={<StageStatusBadge status="VERIFIED_NATURAIDE" size="sm" />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Plant Image & Core Badging */}
              <div className="lg:col-span-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df] p-4 text-center space-y-3">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-emerald-50/60 border border-[#dde6df] flex items-center justify-center">
                  {verifiedPlant.imageUrl ? (
                    <Image
                      src={verifiedPlant.imageUrl}
                      alt={verifiedPlant.commonName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                  ) : (
                    <Leaf className="w-16 h-16 text-emerald-600/60" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-[#0f2c20]">
                    {verifiedPlant.commonName}
                  </h3>
                  {verifiedPlant.scientificName && (
                    <p className="text-xs italic text-[#16a34a] font-serif">
                      {verifiedPlant.scientificName}
                    </p>
                  )}
                </div>

                {verifiedPlant.family && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold">
                    Family: {verifiedPlant.family}
                  </span>
                )}
              </div>

              {/* Botanical Attributes Grid */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {verifiedPlant.family && (
                  <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#78997f]">
                      Taxonomic Family
                    </span>
                    <p className="font-semibold text-[#0f2c20]">{verifiedPlant.family}</p>
                  </div>
                )}

                {verifiedPlant.localNames && (
                  <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#78997f]">
                      Local / Common Vernacular
                    </span>
                    <p className="font-semibold text-[#0f2c20]">{verifiedPlant.localNames}</p>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78997f]">
                    Primary Anatomical Parts Used
                  </span>
                  <p className="font-semibold text-[#0f2c20]">
                    {verifiedPlant.partsUsed || "Leaves, aerial parts"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78997f]">
                    Key Bioactive Compounds
                  </span>
                  <p className="font-semibold text-[#0f2c20] line-clamp-2">
                    {verifiedPlant.activeCompounds || "Flavonoids, sesquiterpenes, volatile oils"}
                  </p>
                </div>

                {verifiedPlant.sourceOrg && (
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <Building className="w-3 h-3 text-emerald-600" />
                      <span>Authoritative Botanical Baseline Source</span>
                    </span>
                    <p className="text-xs font-semibold text-[#0f2c20]">
                      {verifiedPlant.sourceOrg}
                    </p>
                  </div>
                )}

                {verifiedPlant.therapeuticUses && (
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#78997f]">
                      Documented Therapeutic Indications
                    </span>
                    <p className="leading-relaxed text-[#475550]">
                      {verifiedPlant.therapeuticUses}
                    </p>
                  </div>
                )}

                {verifiedPlant.precautions && (
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span>Known Safety Precautions</span>
                    </span>
                    <p className="leading-relaxed text-amber-900">
                      {verifiedPlant.precautions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </StageSection>
        </div>
      )}

      {/* ========================================================
          TAB 2: SPECIMEN PROVENANCE
          ======================================================== */}
      {activeTab === "specimen" && (
        <div className="space-y-6">
          <StageSection
            title="Specimen Origin & Collection Metadata"
            subtitle="Document where, when, and how your laboratory specimen was obtained"
            icon={MapPin}
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    Specimen Anatomical Part Studied <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={partsStudied}
                    onChange={(e) => setPartsStudied(e.target.value)}
                    placeholder="e.g. Mature Leaves, Rhizome, Aerial flowering tops"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Specimen Source / Vendor</label>
                  <input
                    type="text"
                    value={specimenSource}
                    onChange={(e) => setSpecimenSource(e.target.value)}
                    placeholder="e.g. Wild harvested, Certified botanical garden, UP Herbarium"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Collection Date</label>
                  <input
                    type="date"
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    Collection Location / Geographic Coordinates
                  </label>
                  <input
                    type="text"
                    value={collectionLocation}
                    onChange={(e) => setCollectionLocation(e.target.value)}
                    placeholder="e.g. Mount Makiling Forest Reserve, Laguna, Philippines (14.133° N, 121.196° E)"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    Sample / Laboratory Batch Identifier
                  </label>
                  <input
                    type="text"
                    value={sampleIdentifier}
                    onChange={(e) => setSampleIdentifier(e.target.value)}
                    placeholder="e.g. SMP-BB-2026-001"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] font-mono focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Storage & Handling Conditions</label>
                  <input
                    type="text"
                    value={storageHandlingNotes}
                    onChange={(e) => setStorageHandlingNotes(e.target.value)}
                    placeholder="e.g. Shade-dried, stored in airtight amber desiccator at 4°C"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>
            </div>
          </StageSection>
        </div>
      )}

      {/* ========================================================
          TAB 3: MATERIAL & EXTRACTION
          ======================================================== */}
      {activeTab === "material" && (
        <div className="space-y-6">
          <StageSection
            title="Botanical Material Preparation & Extraction"
            subtitle="Define preparation form, extraction solvents, and fraction specifications"
            icon={FlaskConical}
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    Investigated Material Form <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  >
                    <option value="Crude Extract">Crude Extract (Total Extraction)</option>
                    <option value="Fraction">Semi-purified Fraction</option>
                    <option value="Isolated Compound">Isolated Pure Phytochemical</option>
                    <option value="Whole Dried Plant">Whole Dried Plant Material</option>
                    <option value="Powdered Plant">Coarsely / Micronized Powder</option>
                    <option value="Essential Oil">Distilled Essential Oil</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Extraction Method / Technique</label>
                  <input
                    type="text"
                    value={extractionMethod}
                    onChange={(e) => setExtractionMethod(e.target.value)}
                    placeholder="e.g. Maceration, Soxhlet extraction, Ultrasound-assisted"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Extraction Solvent / System</label>
                  <input
                    type="text"
                    value={extractionSolvent}
                    onChange={(e) => setExtractionSolvent(e.target.value)}
                    placeholder="e.g. 70% Ethanol, Water (Decoction), Ethyl Acetate"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Fraction / Extract Designation</label>
                  <input
                    type="text"
                    value={extractFractionName}
                    onChange={(e) => setExtractFractionName(e.target.value)}
                    placeholder="e.g. Ethyl acetate fraction (BB-EtOAc-F2)"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>
            </div>
          </StageSection>
        </div>
      )}

      {/* ========================================================
          TAB 4: AUTHENTICATION & VOUCHER
          ======================================================== */}
      {activeTab === "authentication" && (
        <div className="space-y-6">
          <StageSection
            title="Taxonomic Authentication & Voucher Specimen"
            subtitle="Document scientific authentication verification and attach voucher certificates"
            icon={ShieldCheck}
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    Authentication Method <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={authenticationMethod}
                    onChange={(e) => setAuthenticationMethod(e.target.value)}
                    placeholder="e.g. Morphological taxonomic key, DNA barcoding (ITS2 / matK)"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Authentication Status</label>
                  <select
                    value={authenticationStatus}
                    onChange={(e) => setAuthenticationStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  >
                    <option value="NOT_DOCUMENTED">Not Documented</option>
                    <option value="SELF_AUTHENTICATED">Taxonomically Verified by Research Team</option>
                    <option value="EXPERT_AUTHENTICATED">Verified by Professional Botanist / Herbarium</option>
                    <option value="MOLECULARLY_VERIFIED">DNA Barcode Verified</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Authenticated By (Botanist / Institution)</label>
                  <input
                    type="text"
                    value={authenticatedBy}
                    onChange={(e) => setAuthenticatedBy(e.target.value)}
                    placeholder="e.g. Herbarium curator, Museum of Natural History, UPLB"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Voucher Specimen Number / Herbarium Code</label>
                  <input
                    type="text"
                    value={voucherSpecimenNumber}
                    onChange={(e) => setVoucherSpecimenNumber(e.target.value)}
                    placeholder="e.g. CAHUP-10294"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] font-mono focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>

              {/* Supporting Document / Voucher Attachment */}
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-2">
                <label className="font-bold text-[#0f2c20] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Attach Voucher Photo or Herbarium Certification</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  disabled={uploadingDoc}
                  className="block w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-900 hover:file:bg-emerald-200"
                />
                {(uploadedDocName || supportingDocumentUrl) && (
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Attached: {uploadedDocName || "Voucher Document on File"}</span>
                    {supportingDocumentUrl && (
                      <a
                        href={supportingDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-700 hover:underline flex items-center gap-0.5 ml-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </StageSection>
        </div>
      )}

      {/* ========================================================
          TAB 5: SELECTION RATIONALE & NOTES
          ======================================================== */}
      {activeTab === "rationale" && (
        <div className="space-y-6">
          <StageSection
            title="Specimen Selection Rationale & Field Observations"
            subtitle="Explain why this botanical species was selected and record distinguishing characteristics"
            icon={FileText}
          >
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0f2c20]">
                    Selection Rationale <span className="text-rose-500">*</span>
                  </label>
                  <StageHelpTooltip content="Explain traditional use, known pharmacological promise, or agricultural accessibility justifying this plant's selection." />
                </div>
                <textarea
                  rows={3}
                  value={selectionRationale}
                  onChange={(e) => setSelectionRationale(e.target.value)}
                  placeholder="Describe why this botanical species was selected for this investigation..."
                  className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] leading-relaxed focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0f2c20]">
                  Distinguishing Morphological / Phytochemical Characteristics
                </label>
                <textarea
                  rows={3}
                  value={relevantCharacteristics}
                  onChange={(e) => setRelevantCharacteristics(e.target.value)}
                  placeholder="Record aroma, leaf pubescence, venation, chemical marker profile, etc."
                  className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] leading-relaxed focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0f2c20]">
                  Additional Field or Taxonomic Notes
                </label>
                <textarea
                  rows={2}
                  value={additionalBotanicalNotes}
                  onChange={(e) => setAdditionalBotanicalNotes(e.target.value)}
                  placeholder="Any supplementary observations regarding cultivation, climate, or harvest..."
                  className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] leading-relaxed focus:outline-none focus:border-[#16a34a]"
                />
              </div>
            </div>
          </StageSection>
        </div>
      )}

      {/* 3. STICKY ACTION BAR */}
      <StageActionBar
        stageNumber={2}
        stageTitle="Plant Research"
        isSaving={saving}
        lastSaved={lastSaved}
        onSave={handleSaveData}
        primaryAction={{
          label: isChecklistComplete ? "Complete Stage 2 →" : "Fulfill Requirements",
          onClick: () => setIsCompleteConfirmationOpen(true),
          disabled: !isChecklistComplete || completingStage,
          loading: completingStage,
        }}
      />

      {/* ========================================================
          MODAL: STAGE COMPLETION CONFIRMATION MODAL
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
                    Complete Stage 2
                  </h4>
                  <p className="text-xs text-[#78997f]">
                    Progress to Literature & Evidence
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#475550] leading-relaxed">
                Complete Plant Research and continue to Literature & Evidence? Your botanical
                identity, specimen provenance, extraction specifications, and authentication
                records will be locked into the research dossier.
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
