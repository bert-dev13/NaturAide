"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FileText,
  Filter,
  Eye,
  Edit3,
  Trash2,
  X,
  Sparkles,
  Layers,
  Save,
  HelpCircle,
  ChevronRight,
  User,
  Microscope,
  Database,
  Cpu,
  Building,
  Calendar,
  Paperclip,
  Tag,
  Dna,
  FlaskConical,
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

interface LiteratureReferenceItem {
  id: number;
  projectId: number;
  scientificReferenceId?: string;
  sourceType: "VERIFIED_NATUREAIDE" | "EXTERNAL_SOURCE" | "MANUAL_ENTRY" | "UPLOADED_DOCUMENT";
  title: string;
  authors: string;
  year: number;
  journalSource: string;
  doiOrUrl?: string;
  studyType: string;
  plantOrCompound?: string;
  keyFindings?: string;
  limitations?: string;
  researchNotes?: string;
  tags?: string;
  pubmedId?: string;
  documentUrl?: string;
  studyDesign?: string;
  plantPart?: string;
  researchMethods?: string;
  experimentalModel?: string;
  evidenceScope?: string;
  relevanceToCurrentResearch?: string;
  matrixCompleted?: boolean | number;
  createdAt: string;
}

interface LiteratureSynthesisData {
  keyFindings?: string;
  areasOfAgreement?: string;
  conflictingFindings?: string;
  evidenceLimitations?: string;
  remainingGaps?: string;
  relevanceToQuestion?: string;
}

interface LiteratureCounts {
  selectedReferences: number;
  humanStudies: number;
  laboratoryStudies: number;
  reviews: number;
  computationalStudies: number;
  safetyEvidence: number;
}

interface LiteratureManagementClientProps {
  projectId: number;
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
    researchQuestion?: string;
    researchObjective?: string;
    currentStage: string;
    status: string;
  };
  initialReferences: LiteratureReferenceItem[];
  initialSynthesis: LiteratureSynthesisData;
  initialCounts: LiteratureCounts;
}

const EVIDENCE_SCOPES = [
  "Human Study",
  "Laboratory / In-Vitro",
  "Animal / In-Vivo",
  "Review",
  "Computational / In-Silico",
  "Traditional / Ethnomedicinal",
  "Safety",
  "Other",
] as const;

export default function LiteratureManagementClient({
  projectId,
  project,
  initialReferences,
  initialSynthesis,
  initialCounts,
}: LiteratureManagementClientProps) {
  const router = useRouter();

  // Active tab
  const [activeTab, setActiveTab] = useState<string>("library");

  // State
  const [references, setReferences] = useState<LiteratureReferenceItem[]>(initialReferences);
  const [counts, setCounts] = useState<LiteratureCounts>(initialCounts);

  // Synthesis form fields
  const [keyFindings, setKeyFindings] = useState(initialSynthesis.keyFindings || "");
  const [areasOfAgreement, setAreasOfAgreement] = useState(initialSynthesis.areasOfAgreement || "");
  const [conflictingFindings, setConflictingFindings] = useState(initialSynthesis.conflictingFindings || "");
  const [evidenceLimitations, setEvidenceLimitations] = useState(initialSynthesis.evidenceLimitations || "");
  const [remainingGaps, setRemainingGaps] = useState(initialSynthesis.remainingGaps || "");
  const [relevanceToQuestion, setRelevanceToQuestion] = useState(initialSynthesis.relevanceToQuestion || "");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  // Modals
  const [selectedReferenceForDetail, setSelectedReferenceForDetail] = useState<LiteratureReferenceItem | null>(null);
  const [matrixTargetRef, setMatrixTargetRef] = useState<LiteratureReferenceItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCompleteConfirmationOpen, setIsCompleteConfirmationOpen] = useState(false);

  // Matrix form fields (for matrix editor modal)
  const [matrixStudyDesign, setMatrixStudyDesign] = useState("");
  const [matrixPlantOrCompound, setMatrixPlantOrCompound] = useState("");
  const [matrixPlantPart, setMatrixPlantPart] = useState("");
  const [matrixResearchMethods, setMatrixResearchMethods] = useState("");
  const [matrixExperimentalModel, setMatrixExperimentalModel] = useState("");
  const [matrixEvidenceScope, setMatrixEvidenceScope] = useState<string>("Laboratory / In-Vitro");
  const [matrixKeyFindings, setMatrixKeyFindings] = useState("");
  const [matrixLimitations, setMatrixLimitations] = useState("");
  const [matrixRelevance, setMatrixRelevance] = useState("");
  const [matrixNotes, setMatrixNotes] = useState("");
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Add reference modal fields
  const [newTitle, setNewTitle] = useState("");
  const [newAuthors, setNewAuthors] = useState("");
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newJournal, setNewJournal] = useState("");
  const [newStudyType, setNewStudyType] = useState("In-Vitro");
  const [newDoiOrUrl, setNewDoiOrUrl] = useState("");
  const [newPubmedId, setNewPubmedId] = useState("");
  const [newScope, setNewScope] = useState("Laboratory / In-Vitro");
  const [newSourceType, setNewSourceType] = useState<
    "EXTERNAL_SOURCE" | "MANUAL_ENTRY" | "UPLOADED_DOCUMENT"
  >("EXTERNAL_SOURCE");
  const [submittingNew, setSubmittingNew] = useState(false);

  // UI state
  const [savingSynthesis, setSavingSynthesis] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [completingStage, setCompletingStage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Recalculate dynamic counts
  const recalculateCounts = (items: LiteratureReferenceItem[]) => {
    let human = 0;
    let lab = 0;
    let rev = 0;
    let comp = 0;
    let safety = 0;

    for (const ref of items) {
      const st = (ref.studyType || "").toLowerCase();
      const scope = (ref.evidenceScope || "").toLowerCase();
      const tags = (ref.tags || "").toLowerCase();

      if (
        st.includes("clinical") ||
        st.includes("human") ||
        st.includes("in-vivo") ||
        st.includes("patient") ||
        scope.includes("human") ||
        scope.includes("animal")
      ) {
        human++;
      }
      if (
        st.includes("in-vitro") ||
        st.includes("bioactivity") ||
        st.includes("extraction") ||
        st.includes("screening") ||
        st.includes("assay") ||
        scope.includes("laboratory") ||
        scope.includes("in-vitro")
      ) {
        lab++;
      }
      if (st.includes("review") || st.includes("systematic") || scope.includes("review")) {
        rev++;
      }
      if (
        st.includes("in-silico") ||
        st.includes("docking") ||
        st.includes("computational") ||
        scope.includes("computational")
      ) {
        comp++;
      }
      if (st.includes("safety") || st.includes("toxic") || tags.includes("safety") || scope.includes("safety")) {
        safety++;
      }
    }

    setCounts({
      selectedReferences: items.length,
      humanStudies: human,
      laboratoryStudies: lab,
      reviews: rev,
      computationalStudies: comp,
      safetyEvidence: safety,
    });
  };

  // Open Matrix Editor
  const handleOpenMatrixEditor = (ref: LiteratureReferenceItem) => {
    setMatrixTargetRef(ref);
    setMatrixStudyDesign(ref.studyDesign || "");
    setMatrixPlantOrCompound(ref.plantOrCompound || project.plantName);
    setMatrixPlantPart(ref.plantPart || "");
    setMatrixResearchMethods(ref.researchMethods || "");
    setMatrixExperimentalModel(ref.experimentalModel || "");
    setMatrixEvidenceScope(ref.evidenceScope || "Laboratory / In-Vitro");
    setMatrixKeyFindings(ref.keyFindings || "");
    setMatrixLimitations(ref.limitations || "");
    setMatrixRelevance(ref.relevanceToCurrentResearch || "");
    setMatrixNotes(ref.researchNotes || "");
  };

  // Save Matrix Data
  const handleSaveMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matrixTargetRef) return;

    setSavingMatrix(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/literature?id=${matrixTargetRef.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyDesign: matrixStudyDesign,
          plantOrCompound: matrixPlantOrCompound,
          plantPart: matrixPlantPart,
          researchMethods: matrixResearchMethods,
          experimentalModel: matrixExperimentalModel,
          evidenceScope: matrixEvidenceScope,
          keyFindings: matrixKeyFindings,
          limitations: matrixLimitations,
          relevanceToCurrentResearch: matrixRelevance,
          researchNotes: matrixNotes,
          matrixCompleted: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to save matrix extraction");

      const updated = references.map((r) =>
        r.id === matrixTargetRef.id
          ? {
              ...r,
              studyDesign: matrixStudyDesign,
              plantOrCompound: matrixPlantOrCompound,
              plantPart: matrixPlantPart,
              researchMethods: matrixResearchMethods,
              experimentalModel: matrixExperimentalModel,
              evidenceScope: matrixEvidenceScope,
              keyFindings: matrixKeyFindings,
              limitations: matrixLimitations,
              relevanceToCurrentResearch: matrixRelevance,
              researchNotes: matrixNotes,
              matrixCompleted: true,
            }
          : r
      );

      setReferences(updated);
      recalculateCounts(updated);
      setMatrixTargetRef(null);
      showToast("Literature matrix updated");
    } catch (err: any) {
      showToast(err.message || "Failed to update matrix", "error");
    } finally {
      setSavingMatrix(false);
    }
  };

  // Save Evidence Synthesis
  const handleSaveSynthesis = async () => {
    setSavingSynthesis(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/literature-synthesis`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyFindings,
          areasOfAgreement,
          conflictingFindings,
          evidenceLimitations,
          remainingGaps,
          relevanceToQuestion,
        }),
      });

      if (!res.ok) throw new Error("Failed to save evidence synthesis");

      setLastSaved(new Date().toISOString());
      showToast("Evidence synthesis saved");
    } catch (err: any) {
      showToast(err.message || "Failed to save synthesis", "error");
    } finally {
      setSavingSynthesis(false);
    }
  };

  // Add Reference
  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Title is required", "error");
      return;
    }

    setSubmittingNew(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/literature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: newSourceType,
          title: newTitle.trim(),
          authors: newAuthors.trim() || undefined,
          year: newYear ? parseInt(newYear, 10) : undefined,
          journalSource: newJournal.trim() || undefined,
          studyType: newStudyType,
          doiOrUrl: newDoiOrUrl.trim() || undefined,
          pubmedId: newPubmedId.trim() || undefined,
          evidenceScope: newScope,
          plantOrCompound: project.plantName,
        }),
      });

      if (!res.ok) throw new Error("Failed to create literature entry");

      const created = await res.json();
      const updated = [created, ...references];
      setReferences(updated);
      recalculateCounts(updated);

      // Reset form
      setNewTitle("");
      setNewAuthors("");
      setNewJournal("");
      setNewDoiOrUrl("");
      setNewPubmedId("");
      setIsAddModalOpen(false);

      showToast("Paper reference added to library");
    } catch (err: any) {
      showToast(err.message || "Failed to add reference", "error");
    } finally {
      setSubmittingNew(false);
    }
  };

  // Remove Reference
  const handleRemoveReference = async (refId: number) => {
    if (!confirm("Are you sure you want to remove this paper from your literature library?")) {
      return;
    }

    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/literature?id=${refId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete reference");

      const updated = references.filter((r) => r.id !== refId);
      setReferences(updated);
      recalculateCounts(updated);
      showToast("Reference removed");
    } catch (err: any) {
      showToast(err.message || "Failed to delete reference", "error");
    }
  };

  // Complete Stage 3
  const handleCompleteStage = async () => {
    setCompletingStage(true);
    try {
      // 1. Save synthesis with COMPLETED status
      await fetch(`/api/researcher/projects/${projectId}/literature-synthesis`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyFindings,
          areasOfAgreement,
          conflictingFindings,
          evidenceLimitations,
          remainingGaps,
          relevanceToQuestion,
          status: "COMPLETED",
        }),
      });

      // 2. Advance stage
      const res = await fetch(`/api/researcher/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-stage",
          stageNumber: 3,
          nextStage: "in-silico",
        }),
      });

      if (!res.ok) throw new Error("Failed to complete Stage 3");

      showToast("Stage 3 - Literature & Evidence completed! Advancing to In-Silico Analysis...");
      setIsCompleteConfirmationOpen(false);

      router.push(`/researcher/projects/${projectId}/in-silico`);
    } catch (err: any) {
      showToast(err.message || "Failed to complete stage", "error");
    } finally {
      setCompletingStage(false);
    }
  };

  // Filtered References
  const filteredReferences = references.filter((ref) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ref.title.toLowerCase().includes(q) ||
      (ref.authors && ref.authors.toLowerCase().includes(q)) ||
      (ref.journalSource && ref.journalSource.toLowerCase().includes(q)) ||
      (ref.keyFindings && ref.keyFindings.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (scopeFilter === "ALL") return true;
    const st = (ref.studyType || "").toLowerCase();
    const scope = (ref.evidenceScope || "").toLowerCase();

    if (scopeFilter === "HUMAN")
      return st.includes("clinical") || st.includes("human") || scope.includes("human");
    if (scopeFilter === "LAB")
      return st.includes("in-vitro") || scope.includes("laboratory") || scope.includes("in-vitro");
    if (scopeFilter === "REVIEWS")
      return st.includes("review") || scope.includes("review");
    if (scopeFilter === "COMPUTATIONAL")
      return st.includes("in-silico") || scope.includes("computational");
    if (scopeFilter === "SAFETY")
      return st.includes("safety") || st.includes("toxic") || scope.includes("safety");

    return true;
  });

  // Checklist
  const checklist = {
    hasEnoughReferences: references.length >= 2,
    hasKeyFindings: Boolean(keyFindings && keyFindings.trim().length > 15),
    hasAgreement: Boolean(areasOfAgreement && areasOfAgreement.trim().length > 10),
    hasLimitations: Boolean(evidenceLimitations && evidenceLimitations.trim().length > 10),
  };

  const isChecklistComplete =
    checklist.hasEnoughReferences &&
    checklist.hasKeyFindings &&
    checklist.hasAgreement &&
    checklist.hasLimitations;

  const stageStatus =
    project.currentStage === "literature" || project.currentStage === "3"
      ? "IN_PROGRESS"
      : "COMPLETED";

  const matrixCompletedCount = references.filter((r) => r.matrixCompleted).length;

  const stageTabsList = [
    {
      id: "library",
      label: "Scientific Library",
      icon: BookOpen,
      badge: references.length,
    },
    {
      id: "synthesis",
      label: "Evidence Synthesis",
      icon: FileText,
      badge: isChecklistComplete ? "Ready" : "Pending",
    },
  ];

  const summaryRequirements = [
    {
      id: "refs",
      label: "Scientific Papers Cataloged (≥ 2)",
      met: checklist.hasEnoughReferences,
      hint: "Add minimum 2 peer-reviewed literature references",
    },
    {
      id: "findings",
      label: "Core Empirical Findings Synthesized",
      met: checklist.hasKeyFindings,
      hint: "Document consensus findings across papers",
    },
    {
      id: "agreement",
      label: "Consensus & Agreement Articulated",
      met: checklist.hasAgreement,
      hint: "Identify areas of scientific concord",
    },
    {
      id: "limitations",
      label: "Literature Limitations Documented",
      met: checklist.hasLimitations,
      hint: "Detail methodological boundaries and gaps",
    },
  ];

  const summaryMetrics = [
    { label: "Total Papers", value: counts.selectedReferences, icon: BookOpen },
    { label: "Clinical / Human", value: counts.humanStudies, icon: User },
    { label: "In-Vitro / Lab", value: counts.laboratoryStudies, icon: Microscope },
    { label: "Matrix Extracted", value: `${matrixCompletedCount}/${references.length}`, icon: Layers },
  ];

  return (
    <ResearchStageShell
      contextPanel={
        <StageSummary
          stageNumber={3}
          stageTitle="Literature & Evidence"
          stageStatus={stageStatus}
          requirements={summaryRequirements}
          metrics={summaryMetrics}
          nextStepText="Extract matrix variables for each paper, draft literature synthesis, and proceed to In-Silico Analysis."
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
        stageNumber={3}
        stageTitle="Literature & Evidence"
        stageSubtitle="Scientific Synthesis"
        stageStatus={stageStatus}
        isSaving={savingSynthesis}
        lastSaved={lastSaved}
        onSave={handleSaveSynthesis}
        canAdvance={isChecklistComplete}
        onAdvance={() => setIsCompleteConfirmationOpen(true)}
        advanceLabel="Complete Stage 3"
        isAdvancing={completingStage}
        guideContent={
          <div className="space-y-1.5 text-xs text-[#475550]">
            <p>
              <strong>Objective:</strong> Systematically structure cataloged botanical studies into a
              rigorous scientific matrix, assessing study design, experimental models, assay parameters,
              and evidence synthesis.
            </p>
            <p>
              <strong>Scientific Provenance:</strong> Peer-reviewed citations provide validation basis
              for computational target hypothesis in subsequent Stage 04 & 05 modeling.
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
          TAB 1: SCIENTIFIC LIBRARY & MATRIX VIEW
          ======================================================== */}
      {activeTab === "library" && (
        <div className="space-y-6">
          {/* Scientific KPI Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Papers", value: counts.selectedReferences, icon: BookOpen, color: "text-[#0f2c20]" },
              { label: "Clinical / Human", value: counts.humanStudies, icon: User, color: "text-blue-700" },
              { label: "In-Vitro / Lab", value: counts.laboratoryStudies, icon: Microscope, color: "text-emerald-700" },
              { label: "Reviews", value: counts.reviews, icon: FileText, color: "text-purple-700" },
              { label: "Computational", value: counts.computationalStudies, icon: Cpu, color: "text-teal-700" },
              { label: "Safety Records", value: counts.safetyEvidence, icon: ShieldCheck, color: "text-amber-700" },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-[#dde6df] shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[#78997f]">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className={`font-heading font-black text-xl sm:text-2xl ${kpi.color}`}>
                    {kpi.value}
                  </div>
                </div>
              );
            })}
          </div>

          <StageSection
            title="Scientific Literature Catalog"
            subtitle={`${references.length} papers in project library`}
            icon={BookOpen}
            action={
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-300" />
                <span>Add Study</span>
              </button>
            }
          >
            {/* Search & Scope Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search studies by title, authors, or journal..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#dde6df] bg-white text-xs font-medium text-[#0f2c20] placeholder-slate-400 focus:outline-none focus:border-[#16a34a]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  {[
                    { id: "ALL", label: "All Papers" },
                    { id: "HUMAN", label: "Human / Clinical" },
                    { id: "LAB", label: "In-Vitro / Lab" },
                    { id: "REVIEWS", label: "Reviews" },
                    { id: "COMPUTATIONAL", label: "Computational" },
                    { id: "SAFETY", label: "Safety" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setScopeFilter(filter.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        scopeFilter === filter.id
                          ? "bg-[#0f2c20] text-emerald-300 font-bold shadow-2xs"
                          : "bg-[#faf9f5] text-[#52645d] border border-[#dde6df] hover:border-[#16a34a]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table / Card List */}
              {filteredReferences.length === 0 ? (
                <StageEmptyState
                  icon={BookOpen}
                  title="No literature references match criteria"
                  description="Adjust search filter or add new scientific references to your library."
                  action={{
                    label: "Add Study",
                    onClick: () => setIsAddModalOpen(true),
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {filteredReferences.map((ref) => (
                    <div
                      key={ref.id}
                      className="p-4 rounded-2xl bg-white border border-[#dde6df] hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StageStatusBadge status={ref.sourceType} size="sm" />
                          <span className="text-[11px] font-mono text-[#78997f] font-bold">
                            {ref.year}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#faf9f5] border border-[#dde6df] text-[10px] font-medium text-[#0f2c20]">
                            {ref.studyType}
                          </span>
                          {ref.matrixCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              <span>Matrix Documented</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                              Matrix Pending
                            </span>
                          )}
                        </div>

                        <h4
                          onClick={() => setSelectedReferenceForDetail(ref)}
                          className="font-bold text-xs sm:text-sm text-[#0f2c20] hover:text-[#16a34a] cursor-pointer truncate max-w-2xl leading-snug"
                          title={ref.title}
                        >
                          {ref.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#52645d]">
                          {ref.authors && <span className="truncate max-w-xs">{ref.authors}</span>}
                          {ref.journalSource && (
                            <>
                              <span>&bull;</span>
                              <span className="italic truncate max-w-xs">{ref.journalSource}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenMatrixEditor(ref)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Extract Matrix Variables"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Matrix</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedReferenceForDetail(ref)}
                          className="p-1.5 rounded-lg border border-[#dde6df] text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {ref.doiOrUrl && (
                          <a
                            href={ref.doiOrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[#dde6df] text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Open DOI / Source URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveReference(ref.id)}
                          className="p-1.5 rounded-lg border border-[#dde6df] text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                          title="Remove Paper"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StageSection>
        </div>
      )}

      {/* ========================================================
          TAB 2: EVIDENCE SYNTHESIS & CONSENSUS
          ======================================================== */}
      {activeTab === "synthesis" && (
        <div className="space-y-6">
          <StageSection
            title="Scientific Evidence Synthesis & Consensus Analysis"
            subtitle="Synthesize empirical patterns, methodological boundaries, and consensus across cataloged literature"
            icon={FileText}
            action={
              <button
                type="button"
                onClick={handleSaveSynthesis}
                disabled={savingSynthesis}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>{savingSynthesis ? "Saving..." : "Save Synthesis"}</span>
              </button>
            }
          >
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0f2c20]">
                    1. Core Empirical Findings (Cross-Study Synthesis) <span className="text-rose-500">*</span>
                  </label>
                  <StageHelpTooltip content="Summarize verified active compounds, observed pharmacological endpoints, and therapeutic dosages across all analyzed papers." />
                </div>
                <textarea
                  rows={4}
                  value={keyFindings}
                  onChange={(e) => setKeyFindings(e.target.value)}
                  placeholder="Synthesize consistent bioactivities, observed IC50 values, and molecular endpoints..."
                  className="w-full p-3 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    2. Areas of Scientific Agreement / Consensus <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={areasOfAgreement}
                    onChange={(e) => setAreasOfAgreement(e.target.value)}
                    placeholder="Where do multiple authors and methodologies agree on mechanism or efficacy?"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    3. Conflicting or Inconclusive Findings
                  </label>
                  <textarea
                    rows={3}
                    value={conflictingFindings}
                    onChange={(e) => setConflictingFindings(e.target.value)}
                    placeholder="Note discrepancies in observed potency, extraction yields, or contradictory bioactivity reports..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    4. Methodological Boundaries & Limitations <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={evidenceLimitations}
                    onChange={(e) => setEvidenceLimitations(e.target.value)}
                    placeholder="Document sample size constraints, lack of in-vivo validation, or non-standardized extraction methods..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    5. Remaining Gaps & Relevance to Inquiry
                  </label>
                  <textarea
                    rows={3}
                    value={relevanceToQuestion}
                    onChange={(e) => setRelevanceToQuestion(e.target.value)}
                    placeholder="How this literature foundation directly informs your upcoming In-Silico and docking simulations..."
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
        stageNumber={3}
        stageTitle="Literature & Evidence"
        isSaving={savingSynthesis}
        lastSaved={lastSaved}
        onSave={handleSaveSynthesis}
        primaryAction={{
          label: isChecklistComplete ? "Complete Stage 3 →" : "Fulfill Requirements",
          onClick: () => setIsCompleteConfirmationOpen(true),
          disabled: !isChecklistComplete || completingStage,
          loading: completingStage,
        }}
      />

      {/* ========================================================
          MODAL 1: MATRIX EXTRACTION EDITOR MODAL
          ======================================================== */}
      <AnimatePresence>
        {matrixTargetRef && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#dde6df] shadow-2xl p-6 sm:p-7 max-w-2xl w-full my-8 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-[#16a34a]">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                      Literature Matrix Extraction
                    </h3>
                    <p className="text-xs text-[#78997f] truncate max-w-md">
                      {matrixTargetRef.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMatrixTargetRef(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-[#475550]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMatrix} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Study Design</label>
                    <input
                      type="text"
                      value={matrixStudyDesign}
                      onChange={(e) => setMatrixStudyDesign(e.target.value)}
                      placeholder="e.g. Randomized controlled trial, Bioassay-guided fractionation"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Evidence Scope</label>
                    <select
                      value={matrixEvidenceScope}
                      onChange={(e) => setMatrixEvidenceScope(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    >
                      {EVIDENCE_SCOPES.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Plant Part Studied</label>
                    <input
                      type="text"
                      value={matrixPlantPart}
                      onChange={(e) => setMatrixPlantPart(e.target.value)}
                      placeholder="e.g. Fresh leaves, Rhizome essential oil"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Experimental Model / Cell Line</label>
                    <input
                      type="text"
                      value={matrixExperimentalModel}
                      onChange={(e) => setMatrixExperimentalModel(e.target.value)}
                      placeholder="e.g. RAW 264.7 macrophages, Wistar albino rats"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Key Extracted Findings</label>
                  <textarea
                    rows={2}
                    value={matrixKeyFindings}
                    onChange={(e) => setMatrixKeyFindings(e.target.value)}
                    placeholder="Essential quantitative results, IC50 concentrations, or observed bioactivities..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Identified Limitations</label>
                    <textarea
                      rows={2}
                      value={matrixLimitations}
                      onChange={(e) => setMatrixLimitations(e.target.value)}
                      placeholder="e.g. High doses used, no positive control..."
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Relevance to Project</label>
                    <textarea
                      rows={2}
                      value={matrixRelevance}
                      onChange={(e) => setMatrixRelevance(e.target.value)}
                      placeholder="e.g. Corroborates bioactivity of luteolin target..."
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2ee]">
                  <button
                    type="button"
                    onClick={() => setMatrixTargetRef(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#475550] hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMatrix}
                    className="px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {savingMatrix ? "Saving Matrix..." : "Save Matrix Variables"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 2: ADD REFERENCE MODAL
          ======================================================== */}
      <AnimatePresence>
        {isAddModalOpen && (
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
                      Add Literature Reference
                    </h3>
                    <p className="text-xs text-[#78997f]">
                      Catalog a new peer-reviewed paper to your library
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-[#475550]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddReference} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    Study / Paper Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Comparative phytochemical profiling of Sambong..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-[#0f2c20]">Authors</label>
                    <input
                      type="text"
                      value={newAuthors}
                      onChange={(e) => setNewAuthors(e.target.value)}
                      placeholder="e.g. Author A., Author B. et al."
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Publication Year</label>
                    <input
                      type="number"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Journal / Source</label>
                    <input
                      type="text"
                      value={newJournal}
                      onChange={(e) => setNewJournal(e.target.value)}
                      placeholder="e.g. Phytomedicine"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Methodology Type</label>
                    <select
                      value={newStudyType}
                      onChange={(e) => setNewStudyType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    >
                      <option value="In-Vitro">In-Vitro</option>
                      <option value="In-Vivo">In-Vivo</option>
                      <option value="Clinical Trial">Clinical Trial</option>
                      <option value="In-Silico">In-Silico</option>
                      <option value="Systematic Review">Systematic Review</option>
                      <option value="Safety Study">Safety & Toxicology</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">DOI or URL</label>
                    <input
                      type="text"
                      value={newDoiOrUrl}
                      onChange={(e) => setNewDoiOrUrl(e.target.value)}
                      placeholder="https://doi.org/..."
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">PubMed ID (PMID)</label>
                    <input
                      type="text"
                      value={newPubmedId}
                      onChange={(e) => setNewPubmedId(e.target.value)}
                      placeholder="e.g. 34567890"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-white text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2ee]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#475550] hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingNew}
                    className="px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingNew ? "Adding Reference..." : "Add to Library"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL 3: FULL REFERENCE DETAILS MODAL
          ======================================================== */}
      <AnimatePresence>
        {selectedReferenceForDetail && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#dde6df] shadow-2xl p-6 sm:p-7 max-w-xl w-full space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#edf2ee] pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StageStatusBadge status={selectedReferenceForDetail.sourceType} size="sm" />
                    <span className="text-[11px] font-mono text-[#78997f] font-bold">
                      {selectedReferenceForDetail.year}
                    </span>
                  </div>
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20] leading-snug">
                    {selectedReferenceForDetail.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReferenceForDetail(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-[#475550]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[#475550]">
                <div>
                  <span className="font-bold text-[#0f2c20]">Authors: </span>
                  <span>{selectedReferenceForDetail.authors || "Not specified"}</span>
                </div>

                <div>
                  <span className="font-bold text-[#0f2c20]">Journal: </span>
                  <span className="italic">{selectedReferenceForDetail.journalSource}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="font-bold text-[#0f2c20]">Study Type: </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#faf9f5] border border-[#dde6df] font-semibold text-[#0f2c20]">
                      {selectedReferenceForDetail.studyType}
                    </span>
                  </div>
                  {selectedReferenceForDetail.pubmedId && (
                    <div>
                      <span className="font-bold text-[#0f2c20]">PMID: </span>
                      <span className="font-mono">{selectedReferenceForDetail.pubmedId}</span>
                    </div>
                  )}
                </div>

                {selectedReferenceForDetail.keyFindings && (
                  <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-1">
                    <span className="font-bold text-[#0f2c20]">Extracted Key Findings:</span>
                    <p className="leading-relaxed text-[#475550]">
                      {selectedReferenceForDetail.keyFindings}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#edf2ee]">
                {selectedReferenceForDetail.doiOrUrl ? (
                  <a
                    href={selectedReferenceForDetail.doiOrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#dde6df] hover:border-[#16a34a] text-xs font-bold text-[#0f2c20]"
                  >
                    <span>Open External Article</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#16a34a]" />
                  </a>
                ) : (
                  <span className="text-xs text-[#78997f]">No external URL on file</span>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedReferenceForDetail(null)}
                  className="px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
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
                    Complete Stage 3
                  </h4>
                  <p className="text-xs text-[#78997f]">
                    Progress to In-Silico Analysis
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#475550] leading-relaxed">
                Complete Literature & Evidence and continue to In-Silico Analysis? Your literature
                matrix variables and cross-study synthesis will be finalized.
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
