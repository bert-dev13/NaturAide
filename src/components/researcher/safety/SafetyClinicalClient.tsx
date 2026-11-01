"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  FlaskConical,
  Sprout,
  Leaf,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Info,
  X,
  Plus,
  Trash2,
  Eye,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { ResearchStageFooter } from "@/components/researcher/stage/ResearchStageFooter";

interface Props {
  projectId: number;
}

interface SafetyAreaItem {
  id: string;
  name: string;
  subtitle: string;
  status: "REVIEWED" | "IN_PROGRESS" | "PENDING";
  summary: string;
  researcherAssessment: string;
  supportingEvidenceCount: number;
}

export default function SafetyClinicalClient({ projectId }: Props) {
  const router = useRouter();

  // Loading & network state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Active section tab
  const [activeTab, setActiveTab] = useState<"evidence" | "assessment" | "summary">("evidence");

  // Project & scientific data from previous stages
  const [project, setProject] = useState<any>(null);
  const [formulation, setFormulation] = useState<any>(null);
  const [compounds, setCompounds] = useState<any[]>([]);
  const [dockingRuns, setDockingRuns] = useState<any[]>([]);
  const [literature, setLiterature] = useState<any[]>([]);
  const [stageStatus, setStageStatus] = useState<string>("IN_PROGRESS");
  const [reviewStatus, setReviewStatus] = useState<string>("PENDING");

  // Stage 5 interactive safety assessment data
  const [safetyAreas, setSafetyAreas] = useState<Record<string, SafetyAreaItem>>({
    toxicity: {
      id: "toxicity",
      name: "Toxicity",
      subtitle: "Cytotoxicity, acute/subchronic toxicity, organ safety boundaries",
      status: "PENDING",
      summary: "",
      researcherAssessment: "",
      supportingEvidenceCount: 0,
    },
    contraindications: {
      id: "contraindications",
      name: "Contraindications",
      subtitle: "Pregnancy, lactation, hypersensitivity, and condition warnings",
      status: "PENDING",
      summary: "",
      researcherAssessment: "",
      supportingEvidenceCount: 0,
    },
    interactions: {
      id: "interactions",
      name: "Interactions",
      subtitle: "Herb-drug interactions, cytochrome P450 modulation, synergistic pathways",
      status: "PENDING",
      summary: "",
      researcherAssessment: "",
      supportingEvidenceCount: 0,
    },
    dose: {
      id: "dose",
      name: "Dose / Concentration",
      subtitle: "Target concentration limits, daily exposure boundaries, active constituent ratios",
      status: "PENDING",
      summary: "",
      researcherAssessment: "",
      supportingEvidenceCount: 0,
    },
    formulation: {
      id: "formulation",
      name: "Formulation Safety",
      subtitle: "Solvent safety boundaries, excipient compatibility, stability during handling",
      status: "PENDING",
      summary: "",
      researcherAssessment: "",
      supportingEvidenceCount: 0,
    },
  });

  // Expanded accordion area IDs
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({
    toxicity: true,
    contraindications: false,
    interactions: false,
    dose: false,
    formulation: false,
  });

  // Clinical Summary & Key Considerations
  const [clinicalSummary, setClinicalSummary] = useState<string>("");
  const [keyConsiderations, setKeyConsiderations] = useState<string[]>([]);
  const [newConsideration, setNewConsideration] = useState<string>("");
  const [evidenceLimitations, setEvidenceLimitations] = useState<string>("");
  const [showLimitations, setShowLimitations] = useState<boolean>(false);

  // Modals for progressive disclosure
  const [showFormulationModal, setShowFormulationModal] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);

  // AI assistant loading per area
  const [aiLoadingArea, setAiLoadingArea] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/researcher/projects/${projectId}/safety`);
      if (!res.ok) {
        throw new Error(`Failed to load safety data: HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load safety data");
      }

      setProject(data.project);
      setFormulation(data.formulation);
      setCompounds(data.compounds || []);
      setDockingRuns(data.dockingRuns || []);
      setLiterature(data.literature || []);
      setStageStatus(data.stageStatus || "IN_PROGRESS");
      setReviewStatus(data.reviewStatus || "PENDING");

      if (data.safetyAreas) {
        setSafetyAreas(data.safetyAreas);
      }
      if (data.clinicalSummary) {
        setClinicalSummary(data.clinicalSummary);
      }
      if (Array.isArray(data.keyConsiderations)) {
        setKeyConsiderations(data.keyConsiderations);
      }
      if (data.evidenceLimitations) {
        setEvidenceLimitations(data.evidenceLimitations);
      }
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load stage data.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle save
  const handleSave = async (isCompleting = false) => {
    try {
      if (isCompleting) setCompleting(true);
      else setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload = {
        action: isCompleting ? "complete-stage" : "save",
        safetyAreas,
        clinicalSummary,
        keyConsiderations,
        evidenceLimitations,
      };

      const res = await fetch(`/api/researcher/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save safety assessments");
      }

      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

      if (isCompleting) {
        setStageStatus("COMPLETED");
        if (data.redirectUrl) {
          router.push(data.redirectUrl);
        } else {
          router.push(`/researcher/projects/${projectId}/knowledge-integration`);
        }
      } else {
        setSuccessMsg("Safety assessments saved successfully.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
      setCompleting(false);
    }
  };

  // AI assistance helper for an individual safety area
  const handleAiAssist = async (areaKey: string) => {
    try {
      setAiLoadingArea(areaKey);
      const res = await fetch(`/api/researcher/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ai-assist", areaKey }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.draft) {
        setSafetyAreas((prev) => ({
          ...prev,
          [areaKey]: {
            ...prev[areaKey],
            researcherAssessment: data.draft,
            status: "REVIEWED",
          },
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoadingArea(null);
    }
  };

  // Toggle area accordion
  const toggleArea = (areaKey: string) => {
    setExpandedAreas((prev) => ({ ...prev, [areaKey]: !prev[areaKey] }));
  };

  // Update researcher assessment for an area
  const updateAssessment = (areaKey: string, text: string) => {
    setSafetyAreas((prev) => ({
      ...prev,
      [areaKey]: {
        ...prev[areaKey],
        researcherAssessment: text,
        status: text.trim().length > 0 ? "REVIEWED" : "IN_PROGRESS",
      },
    }));
  };

  // Add key consideration bullet
  const addConsideration = () => {
    if (newConsideration.trim()) {
      setKeyConsiderations((prev) => [...prev, newConsideration.trim()]);
      setNewConsideration("");
    }
  };

  // Remove key consideration bullet
  const removeConsideration = (index: number) => {
    setKeyConsiderations((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate reviewed count
  const reviewedCount = useMemo(() => {
    return Object.values(safetyAreas).filter((a) => a.status === "REVIEWED").length;
  }, [safetyAreas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading Stage 5: Safety / Clinical...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving formulation and safety literature...</p>
      </div>
    );
  }

  const primaryCompound = compounds[0] || formulation?.components?.[0] || {
    componentName: "10-Gingerol",
    molecularFormula: "C21H34O4",
  };

  const primaryDocking = dockingRuns[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-28">
      {/* 1. STAGE HEADER */}
      <div className="w-full bg-[#072418] border-b border-emerald-950/60 shadow-md">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                  STAGE 05 / 06
                </span>
                <span className="text-emerald-600 text-xs">•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {stageStatus === "COMPLETED" ? "Completed" : "In Progress"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Safety / Clinical</span>
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200/90 pt-0.5">
                <span className="flex items-center gap-1 font-bold text-white">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  {project?.plantName || "Medicinal Plant"}
                </span>
                {project?.plantScientificName && (
                  <span className="italic font-serif text-emerald-300/80">
                    · {project.plantScientificName}
                  </span>
                )}
              </div>
            </div>

            {/* Assigned Expert Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300/90 block leading-tight">
                    Assigned Reviewer
                  </span>
                  <span className="text-xs font-black text-white block">
                    Physician / Clinical Pharmacist
                  </span>
                  <span className="text-[10px] text-emerald-200/70 block">
                    Clinical Safety
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY 3-SECTION NAVIGATION TABS */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto py-2.5 gap-2 scrollbar-none">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("evidence")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "evidence"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center">
                  01
                </span>
                <span>Safety Evidence</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("assessment")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "assessment"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center">
                  02
                </span>
                <span>Safety Assessment</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                  {reviewedCount}/5
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("summary")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "summary"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center">
                  03
                </span>
                <span>Clinical Summary</span>
              </button>
            </div>

            {/* Quick Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>5 Safety Domains</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-emerald-700">
                {literature.length} Literature Studies
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts / Banners */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between mb-4">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {errorMsg}
            </span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between mb-4">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {successMsg}
            </span>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 flex-1">
        {/* ========================================================================= */}
        {/* SECTION 01: SAFETY EVIDENCE                                              */}
        {/* ========================================================================= */}
        {activeTab === "evidence" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  SECTION 01
                </span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Safety Evidence
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-assembled evidence carried forward from Stage 1 literature and Stage 4 formulation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Box 1: Formulation Pre-Loaded */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    FORMULATION
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    Carried from Stage 4
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      {formulation?.name || `${project?.plantName} Research Extract`}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60 font-medium">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Solvent</span>
                      <span className="font-semibold text-slate-800">{formulation?.extractionSolvent}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Plant Part</span>
                      <span className="font-semibold text-slate-800">{formulation?.plantPart}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Primary Candidate</span>
                      <span className="font-semibold text-emerald-800">
                        {primaryCompound?.componentName || primaryCompound?.compoundName} ({primaryCompound?.molecularFormula || "Phytochemical Active"})
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFormulationModal(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>View Formulation</span>
                </button>
              </div>

              {/* Box 2: Available Literature Evidence */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    AVAILABLE EVIDENCE
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-bold font-mono">
                    {literature.length} Studies
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      {literature.length} Safety References Documented
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Peer-reviewed citations and indexed records investigating safety margins, pharmacological targets, and traditional posology.
                  </p>

                  {literature.length > 0 && (
                    <div className="text-[11px] text-slate-500 italic truncate pt-1 border-t border-slate-200/60">
                      Latest: &ldquo;{literature[0]?.title}&rdquo; ({literature[0]?.year})
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Evidence</span>
                </button>
              </div>
            </div>

            {/* Docking Target Context Badge */}
            {primaryDocking && (
              <div className="p-4 rounded-xl bg-emerald-950 text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-black">
                    Carried In-Silico Molecular Target
                  </span>
                  <p className="text-xs font-bold text-white">
                    {primaryDocking.ligandName} × {primaryDocking.targetProtein} (PDB {primaryDocking.pdbId})
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-900/80 border border-emerald-700/60 font-mono text-emerald-300 font-extrabold text-xs shrink-0">
                  Affinity: {primaryDocking.bindingAffinity} kcal/mol
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 02: SAFETY ASSESSMENT                                            */}
        {/* ========================================================================= */}
        {activeTab === "assessment" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  SECTION 02
                </span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Safety Assessment
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluate the 5 core safety domains. Expand each item to review evidence and record your assessment.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black font-mono">
                {reviewedCount} of 5 Reviewed
              </span>
            </div>

            {/* 5 Area Accordion List */}
            <div className="space-y-3.5">
              {Object.entries(safetyAreas).map(([key, area], idx) => {
                const isExpanded = expandedAreas[key];
                const isReviewed = area.status === "REVIEWED";

                return (
                  <div
                    key={key}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? "bg-white border-emerald-400/80 shadow-xs"
                        : "bg-white border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    {/* Accordion Row Header */}
                    <div
                      onClick={() => toggleArea(key)}
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center font-mono ${
                            isReviewed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">{area.name}</h3>
                            {isReviewed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Reviewed
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                            {area.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Accordion Expanded Body */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 space-y-4">
                        {/* Evidence Summary Block */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Evidence Summary
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                                {area.supportingEvidenceCount} reference(s)
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowEvidenceModal(true)}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                              >
                                View Evidence
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {area.summary || "No supporting evidence currently available."}
                          </p>
                        </div>

                        {/* Researcher Assessment Field */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">
                              Researcher Assessment
                            </label>

                            {/* Non-blocking AI Assistant Button */}
                            <button
                              type="button"
                              onClick={() => handleAiAssist(key)}
                              disabled={aiLoadingArea === key}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                            >
                              {aiLoadingArea === key ? (
                                <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                              )}
                              <span>Assist with Assessment</span>
                            </button>
                          </div>

                          <textarea
                            value={area.researcherAssessment}
                            onChange={(e) => updateAssessment(key, e.target.value)}
                            placeholder={`Enter your scientific evaluation for ${area.name.toLowerCase()} based on available literature and formulation parameters...`}
                            rows={3}
                            className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed placeholder:text-slate-400 resize-y"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 03: CLINICAL SUMMARY                                             */}
        {/* ========================================================================= */}
        {activeTab === "summary" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  SECTION 03
                </span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Clinical Summary
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synthesize overall safety conclusions and biological considerations.
                </p>
              </div>
            </div>

            {/* Overall Safety Assessment Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                OVERALL SAFETY ASSESSMENT
              </span>

              <textarea
                value={clinicalSummary}
                onChange={(e) => setClinicalSummary(e.target.value)}
                rows={4}
                placeholder="Write your synthesized clinical safety evaluation for the candidate formulation and plant constituents..."
                className="w-full text-xs text-slate-900 bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed placeholder:text-slate-400"
              />
            </div>

            {/* Key Considerations Interactive List */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                KEY CONSIDERATIONS
              </span>

              <div className="space-y-2">
                {keyConsiderations.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs text-slate-800"
                  >
                    <div className="flex items-start gap-2 pt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span className="leading-relaxed font-medium">{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeConsideration(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Bullet Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newConsideration}
                  onChange={(e) => setNewConsideration(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addConsideration()}
                  placeholder="Add an evidence-derived safety consideration..."
                  className="flex-1 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addConsideration}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Evidence Limitations (Progressive Disclosure - Collapsed by Default) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <button
                type="button"
                onClick={() => setShowLimitations(!showLimitations)}
                className="w-full flex items-center justify-between text-left cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>Evidence Limitations</span>
                </span>
                <span className="text-xs text-slate-400 group-hover:text-slate-600 font-medium">
                  {showLimitations ? "Hide" : "Show"}
                </span>
              </button>

              {showLimitations && (
                <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    State scientific boundaries such as lack of empirical in-vivo toxicology or human pharmacokinetics.
                  </p>
                  <textarea
                    value={evidenceLimitations}
                    onChange={(e) => setEvidenceLimitations(e.target.value)}
                    rows={3}
                    className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* 4. MODALS (PROGRESSIVE DISCLOSURE) */}

      {/* A. View Formulation Modal */}
      {showFormulationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-sm">Formulation Details</h3>
              </div>
              <button
                onClick={() => setShowFormulationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Formulation Type</span>
                  <span className="font-bold text-slate-900">{formulation?.type}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Plant Material</span>
                  <span className="font-bold text-slate-900">{project?.plantName}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Plant Part</span>
                  <span className="font-bold text-slate-900">{formulation?.plantPart}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Extraction Solvent</span>
                  <span className="font-bold text-slate-900">{formulation?.extractionSolvent}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Extraction Method</span>
                <span className="font-bold text-slate-900">{formulation?.extractionMethod}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Research Purpose</span>
                <p className="text-slate-800 leading-relaxed font-medium mt-1">{formulation?.purpose}</p>
              </div>

              {formulation?.components && formulation.components.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Components</span>
                  {formulation.components.map((c: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between">
                      <div>
                        <span className="font-black text-slate-900">{c.componentName}</span>
                        <span className="text-slate-500 text-[11px] block">{c.roleInFormulation}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800">{c.concentration || "100 μM"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowFormulationModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* B. View Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  Documented Literature References ({literature.length})
                </h3>
              </div>
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto text-xs">
              {literature.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                  No persisted literature references recorded for this project.
                </div>
              ) : (
                literature.map((ref, idx) => (
                  <div
                    key={ref.id || idx}
                    className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        {ref.title}
                      </h4>
                      {ref.studyType && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0 font-mono">
                          {ref.studyType}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium">
                      <span>{ref.authors}</span> · <span className="font-semibold text-slate-700">{ref.year}</span>
                      {ref.journalSource && <span> · <em>{ref.journalSource}</em></span>}
                    </div>

                    {ref.keyFindings && (
                      <p className="text-[11px] text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/60">
                        <strong className="text-slate-900">Findings: </strong>
                        {ref.keyFindings}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-1 text-[11px]">
                      {ref.pubmedId && (
                        <span className="text-slate-600 font-mono">
                          PMID: <strong className="text-slate-800">{ref.pubmedId}</strong>
                        </span>
                      )}
                      {ref.doiOrUrl && (
                        <a
                          href={ref.doiOrUrl.startsWith("http") ? ref.doiOrUrl : `https://doi.org/${ref.doiOrUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1"
                        >
                          Source Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 5. SHARED FOOTER UI */}
      <ResearchStageFooter
        projectId={projectId}
        stageNumber={5}
        stageTitle="Safety / Clinical"
        backHref={`/researcher/projects/${projectId}`}
        saveStatus={saving ? "saving" : "saved"}
        lastSaved={lastSaved}
        isSaving={saving}
        onSave={() => handleSave(false)}
        saveLabel="Save Draft"
        primaryAction={{
          label: "Continue to Knowledge Integration",
          onClick: () => handleSave(true),
          loading: completing,
          loadingLabel: "Validating & Continuing...",
        }}
      />
    </div>
  );
}

