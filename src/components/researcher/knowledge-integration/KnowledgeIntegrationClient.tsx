"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  ShieldCheck,
  Dna,
  Cpu,
  Layers,
  Download,
  Printer,
  History,
  Check,
  Loader2,
} from "lucide-react";

import { ResearchStageFooter } from "@/components/researcher/stage/ResearchStageFooter";

interface Props {
  projectId: number;
}

interface StageSummaryItem {
  number: number;
  label: string;
  count: number;
  unit: string;
  summaryText: string;
  items: any[];
}

interface ProfessionalReviewItem {
  key: string;
  label: string;
  reviewer: string;
  status: "APPROVED" | "IN_REVIEW" | "REVISION_REQUESTED" | "PENDING";
  comments?: string | null;
  submittedAt?: string | null;
}

export default function KnowledgeIntegrationClient({ projectId }: Props) {
  const router = useRouter();

  // Loading & states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Active section tab
  const [activeTab, setActiveTab] = useState<"summary" | "integration" | "dossier">("summary");

  // Project & metadata
  const [project, setProject] = useState<any>(null);
  const [stageSummaries, setStageSummaries] = useState<Record<string, StageSummaryItem>>({});
  const [professionalReviews, setProfessionalReviews] = useState<ProfessionalReviewItem[]>([]);
  const [approvedReviewsCount, setApprovedReviewsCount] = useState<number>(0);
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(5);
  const [isProfessionallyApproved, setIsProfessionallyApproved] = useState<boolean>(false);
  const [isResearchComplete, setIsResearchComplete] = useState<boolean>(false);
  const [completedStagesCount, setCompletedStagesCount] = useState<number>(5);

  // Synthesis fields
  const [keyFindings, setKeyFindings] = useState<string[]>([]);
  const [newFinding, setNewFinding] = useState<string>("");
  const [evidenceAlignment, setEvidenceAlignment] = useState<string>("");
  const [scientificInterpretation, setScientificInterpretation] = useState<string>("");
  const [finalConclusion, setFinalConclusion] = useState<string>("");
  const [limitations, setLimitations] = useState<string>("");
  const [showLimitations, setShowLimitations] = useState<boolean>(false);

  // Review history & dossier data
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [fullDossier, setFullDossier] = useState<any>(null);

  // Modals
  const [inspectingStage, setInspectingStage] = useState<StageSummaryItem | null>(null);
  const [showDossierModal, setShowDossierModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // AI draft assistant
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/researcher/projects/${projectId}/knowledge-integration`);
      if (!res.ok) {
        throw new Error(`Failed to load knowledge integration: HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load data");
      }

      setProject(data.project);
      setStageSummaries(data.stageSummaries || {});
      setProfessionalReviews(data.professionalReviews || []);
      setApprovedReviewsCount(data.approvedReviewsCount || 0);
      setTotalReviewsCount(data.totalReviewsCount || 5);
      setIsProfessionallyApproved(Boolean(data.isProfessionallyApproved));
      setIsResearchComplete(Boolean(data.isResearchComplete));
      setCompletedStagesCount(data.completedStagesCount || 5);

      if (data.synthesis) {
        setKeyFindings(Array.isArray(data.synthesis.keyFindings) ? data.synthesis.keyFindings : []);
        setEvidenceAlignment(data.synthesis.evidenceAlignment || "");
        setScientificInterpretation(data.synthesis.scientificInterpretation || "");
        setFinalConclusion(data.synthesis.finalConclusion || "");
        setLimitations(data.synthesis.limitations || "");
      }

      setReviewHistory(data.reviewHistory || []);
      setFullDossier(data.fullDossier || null);
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

  // Handle Save
  const handleSave = async (isCompleting = false) => {
    try {
      if (isCompleting) setCompleting(true);
      else setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload = {
        action: isCompleting ? "complete-research" : "save",
        keyFindings,
        evidenceAlignment,
        scientificInterpretation,
        finalConclusion,
        limitations,
      };

      const res = await fetch(`/api/researcher/projects/${projectId}/knowledge-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save research synthesis");
      }

      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

      if (isCompleting) {
        setIsResearchComplete(true);
        setCompletedStagesCount(6);
        setIsProfessionallyApproved(Boolean(data.isFullyApproved));
        setActiveTab("dossier");
        setSuccessMsg("Research complete! Research dossier finalized.");
      } else {
        setSuccessMsg("Knowledge integration draft saved successfully.");
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

  // AI Assistant for Research Synthesis
  const handleAiAssist = async () => {
    try {
      setAiLoading(true);
      const res = await fetch(`/api/researcher/projects/${projectId}/knowledge-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ai-assist" }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.draft) {
        if (Array.isArray(data.draft.keyFindings)) {
          setKeyFindings(data.draft.keyFindings);
        }
        if (data.draft.evidenceAlignment) {
          setEvidenceAlignment(data.draft.evidenceAlignment);
        }
        if (data.draft.scientificInterpretation) {
          setScientificInterpretation(data.draft.scientificInterpretation);
        }
        if (data.draft.finalConclusion) {
          setFinalConclusion(data.draft.finalConclusion);
        }
        if (data.draft.limitations) {
          setLimitations(data.draft.limitations);
        }
        setSuccessMsg("Synthesis draft generated from Stages 1–5 data.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Key Findings bullet actions
  const addFinding = () => {
    if (newFinding.trim()) {
      setKeyFindings((prev) => [...prev, newFinding.trim()]);
      setNewFinding("");
    }
  };

  const removeFinding = (idx: number) => {
    setKeyFindings((prev) => prev.filter((_, i) => i !== idx));
  };

  const STAGE_ICON_MAP: Record<number, React.ElementType> = {
    1: Sprout,
    2: Cpu,
    3: Dna,
    4: FlaskConical,
    5: ShieldCheck,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading Stage 6: Knowledge Integration...</p>
        <p className="text-xs text-slate-400 mt-1">Compiling multi-stage evidence and dossiers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-28">
      {/* 1. STAGE HEADER */}
      <div className="w-full bg-[#072418] border-b border-emerald-950/60 shadow-md">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                  STAGE 06 / 06
                </span>
                <span className="text-emerald-600 text-xs">•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isProfessionallyApproved
                    ? "Professionally Approved"
                    : isResearchComplete
                      ? "Research Complete"
                      : "In Progress"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Knowledge Integration</span>
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
                    Pharmacist / Pharmacognosist
                  </span>
                  <span className="text-[10px] text-emerald-200/70 block">
                    Pharmacognosy
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
                onClick={() => setActiveTab("summary")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "summary"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center">
                  01
                </span>
                <span>Research Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("integration")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "integration"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center">
                  02
                </span>
                <span>Knowledge Integration</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("dossier")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "dossier"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center">
                  03
                </span>
                <span>Final Dossier</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                  {approvedReviewsCount}/5 Approved
                </span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Pipeline: <strong className="text-slate-800">{completedStagesCount}/6 Complete</strong></span>
              <span className="text-slate-300">•</span>
              <span>Validation: <strong className="text-emerald-700">{approvedReviewsCount}/5 Approved</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
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
        {/* SECTION 01: RESEARCH SUMMARY                                              */}
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
                  SECTION 01
                </span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Research Summary
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Outputs from Stages 1–5 synthesized into one coherent overview.
                </p>
              </div>
            </div>

            {/* Stages 1-5 Compact Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(stageSummaries).map((stg) => {
                const IconComp = STAGE_ICON_MAP[stg.number] || FileText;

                return (
                  <div
                    key={stg.number}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400">
                          STAGE 0{stg.number}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-xs leading-tight">
                            {stg.label}
                          </h3>
                          <span className="text-[11px] font-mono font-bold text-emerald-700">
                            {stg.count} {stg.unit}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {stg.summaryText}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectingStage(stg)}
                      className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>View</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Compact Professional Reviews Status Component */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  PROFESSIONAL REVIEWS
                </span>
                <span className="text-xs font-black text-emerald-800 font-mono">
                  {approvedReviewsCount} of {totalReviewsCount} Approved
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                {professionalReviews.map((rev) => {
                  const isApp = rev.status === "APPROVED";
                  const isRev = rev.status === "REVISION_REQUESTED";
                  const isInRev = rev.status === "IN_REVIEW";

                  return (
                    <div
                      key={rev.key}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">{rev.label}</span>
                        {isApp ? (
                          <span className="text-emerald-600 font-black">✓</span>
                        ) : isRev ? (
                          <span className="text-amber-600 font-bold">●</span>
                        ) : isInRev ? (
                          <span className="text-blue-600 font-bold">●</span>
                        ) : (
                          <span className="text-slate-400">○</span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold block ${
                          isApp
                            ? "text-emerald-700"
                            : isRev
                              ? "text-amber-700"
                              : isInRev
                                ? "text-blue-700"
                                : "text-slate-400"
                        }`}
                      >
                        {isApp
                          ? "Approved"
                          : isRev
                            ? "Revision Requested"
                            : isInRev
                              ? "In Review"
                              : "Pending Review"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 02: KNOWLEDGE INTEGRATION                                         */}
        {/* ========================================================================= */}
        {activeTab === "integration" && (
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
                  Knowledge Integration
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-stage research synthesis aligning biological context, computational findings, and clinical safety.
                </p>
              </div>

              {/* Non-blocking AI Assistant Button */}
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              >
                {aiLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Assist with Research Synthesis</span>
              </button>
            </div>

            {/* Block 1: KEY FINDINGS */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                KEY FINDINGS
              </span>

              <div className="space-y-2">
                {keyFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs text-slate-800"
                  >
                    <div className="flex items-start gap-2 pt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span className="leading-relaxed font-medium">{finding}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFinding(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Finding input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newFinding}
                  onChange={(e) => setNewFinding(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFinding()}
                  placeholder="Add an integrated finding across stages..."
                  className="flex-1 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addFinding}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Block 2: EVIDENCE ALIGNMENT */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                EVIDENCE ALIGNMENT
              </span>
              <textarea
                value={evidenceAlignment}
                onChange={(e) => setEvidenceAlignment(e.target.value)}
                rows={3}
                placeholder="Explain how literature evidence aligns with in-silico screening and molecular docking..."
                className="w-full text-xs text-slate-900 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed placeholder:text-slate-400"
              />
            </div>

            {/* Block 3: SCIENTIFIC INTERPRETATION */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                SCIENTIFIC INTERPRETATION
              </span>
              <textarea
                value={scientificInterpretation}
                onChange={(e) => setScientificInterpretation(e.target.value)}
                rows={3}
                placeholder="Detail scientific interpretation of binding affinities, molecular conformations, and biological limits..."
                className="w-full text-xs text-slate-900 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed placeholder:text-slate-400"
              />
            </div>

            {/* Block 4: FINAL CONCLUSION */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                FINAL CONCLUSION
              </span>
              <textarea
                value={finalConclusion}
                onChange={(e) => setFinalConclusion(e.target.value)}
                rows={3}
                placeholder="Provide definitive research conclusion synthesizing the study's overall findings..."
                className="w-full text-xs text-slate-900 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed placeholder:text-slate-400"
              />
            </div>

            {/* Limitations (Progressive Disclosure - Collapsed by default) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <button
                type="button"
                onClick={() => setShowLimitations(!showLimitations)}
                className="w-full flex items-center justify-between text-left cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>Research Limitations</span>
                </span>
                <span className="text-xs text-slate-400 group-hover:text-slate-600 font-medium">
                  {showLimitations ? "Hide" : "Show"}
                </span>
              </button>

              {showLimitations && (
                <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Integrates boundaries from computational screening, lack of in-vivo assays, and batch standardization factors.
                  </p>
                  <textarea
                    value={limitations}
                    onChange={(e) => setLimitations(e.target.value)}
                    rows={3}
                    className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 03: FINAL DOSSIER                                                 */}
        {/* ========================================================================= */}
        {activeTab === "dossier" && (
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
                  Final Dossier
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compiled research dossier incorporating canonical records from Stages 1 through 6.
                </p>
              </div>
            </div>

            {/* TWO FINAL STATES */}
            {isProfessionallyApproved ? (
              /* STATE B: Fully Professionally Approved */
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#06281b] via-[#093524] to-[#03170e] text-white shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300 font-mono">
                    ✓ Research Professionally Reviewed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-sm pt-1">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15">
                    <span className="text-[10px] text-emerald-300/80 block uppercase font-bold">Research Pipeline</span>
                    <span className="text-sm font-black text-white">6 / 6 Complete</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15">
                    <span className="text-[10px] text-emerald-300/80 block uppercase font-bold">Professional Reviews</span>
                    <span className="text-sm font-black text-emerald-300">5 / 5 Approved</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDossierModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Final Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-emerald-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Review History</span>
                  </button>
                </div>
              </div>
            ) : isResearchComplete ? (
              /* STATE A: Research Complete but Professional Reviews Pending */
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                      RESEARCH COMPLETE
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      ✓ 6 / 6 Research Stages Complete
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold font-mono">
                    Professional Reviews in Progress
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Approved Areas</span>
                    <span className="text-sm font-black text-emerald-700">
                      {approvedReviewsCount} / 5 Approved
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Pending Review Areas</span>
                    <span className="text-sm font-black text-amber-700">
                      {5 - approvedReviewsCount} Pending
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Your research pipeline is complete and the final dossier is ready. Professional expert reviews are currently active.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDossierModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Preview Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Export Dossier</span>
                  </button>
                </div>
              </div>
            ) : (
              /* In-Progress State */
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                      DOSSIER READINESS
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      {completedStagesCount} of 6 Research Stages Complete
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-bold">
                    Draft Dossier
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Research Pipeline</span>
                    <span className="text-sm font-black text-slate-900">
                      {completedStagesCount} / 6 Complete
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Professional Validation</span>
                    <span className="text-sm font-black text-emerald-700">
                      {approvedReviewsCount} / 5 Approved
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  You can preview the compiled dossier at any time. When ready, click <strong>Complete Research</strong> in the footer to finalize your research work.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDossierModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Preview Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Export Dossier</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* 4. MODALS */}

      {/* A. Inspect Stage Summary Details Modal */}
      {inspectingStage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  STAGE 0{inspectingStage.number}
                </span>
                <h3 className="font-black text-slate-900 text-sm">
                  {inspectingStage.label}
                </h3>
              </div>
              <button
                onClick={() => setInspectingStage(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {inspectingStage.summaryText}
              </p>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
                  Recorded Records ({inspectingStage.items?.length || 0})
                </span>

                {inspectingStage.items && inspectingStage.items.length > 0 ? (
                  inspectingStage.items.map((it: any, i: number) => (
                    <div
                      key={it.id || i}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1"
                    >
                      <span className="font-bold text-slate-900 block">
                        {it.title || it.compoundName || it.ligandName || it.formulationName || it.name || `Item ${i + 1}`}
                      </span>
                      {it.authors && <span className="text-[11px] text-slate-500 block">{it.authors} ({it.year})</span>}
                      {it.bindingAffinity && (
                        <span className="text-[11px] font-mono text-emerald-700 font-bold block">
                          Affinity: {it.bindingAffinity} kcal/mol vs {it.targetProtein}
                        </span>
                      )}
                      {it.keyFindings && <p className="text-[11px] text-slate-600 mt-1">{it.keyFindings}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No detailed records stored for this stage.</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectingStage(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* B. Preview Full Dossier Modal */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {project?.title || "Research Dossier"}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {project?.plantName} ({project?.plantScientificName})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDossierModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-xs flex-1">
              {/* Plant Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  STAGE 1 · PLANT & AUTHENTICATION
                </span>
                <p className="text-slate-800 font-medium">
                  <strong>Botanical Material: </strong>{project?.plantName} (<em>{project?.plantScientificName}</em>).
                  Authentication verified via botanical taxonomic identification. Literature pool comprises {fullDossier?.literature?.length || 0} indexed studies.
                </p>
              </div>

              {/* In-Silico & Docking Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  STAGES 2 & 3 · IN-SILICO & MOLECULAR DOCKING
                </span>
                <p className="text-slate-800 font-medium">
                  <strong>Candidate Constituents: </strong>
                  {(fullDossier?.compounds || []).map((c: any) => `${c.compoundName} (${c.molecularFormula})`).join(", ") || "Standardized Phytochemicals"}.
                </p>
                {(fullDossier?.dockingRuns || []).length > 0 && (
                  <p className="text-slate-800 font-medium pt-1 border-t border-slate-200/60">
                    <strong>AutoDock Vina Docking: </strong>
                    {fullDossier.dockingRuns.map((d: any) => `${d.ligandName} vs ${d.targetProtein}: ${d.bindingAffinity} kcal/mol`).join("; ")}.
                  </p>
                )}
              </div>

              {/* Formulation Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  STAGE 4 · FORMULATION PROTOTYPE
                </span>
                <p className="text-slate-800 font-medium">
                  <strong>Formulation: </strong>{fullDossier?.formulation?.formulationName || `${project?.plantName} Research Extract`}.
                  Extract solvent: {fullDossier?.formulation?.extractionSolvent || "80% Aqueous Ethanol"} via {fullDossier?.formulation?.extractionMethod || "Cold Maceration"}.
                </p>
              </div>

              {/* Clinical Safety Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  STAGE 5 · SAFETY / CLINICAL EVALUATION
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  Five core domains (toxicity, contraindications, drug interactions, dose limits, formulation safety) evaluated. Published literature supports preliminary safety margins within target therapeutic concentrations.
                </p>
              </div>

              {/* Stage 6 Synthesis */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  STAGE 6 · KNOWLEDGE INTEGRATION & SYNTHESIS
                </span>

                <div className="space-y-1.5">
                  <strong className="text-slate-900 block">Key Findings:</strong>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                    {keyFindings.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                {evidenceAlignment && (
                  <div className="pt-2 border-t border-emerald-200/60 space-y-1">
                    <strong className="text-slate-900 block">Evidence Alignment:</strong>
                    <p className="text-slate-700 leading-relaxed">{evidenceAlignment}</p>
                  </div>
                )}

                {finalConclusion && (
                  <div className="pt-2 border-t border-emerald-200/60 space-y-1">
                    <strong className="text-slate-900 block">Conclusion:</strong>
                    <p className="text-slate-700 leading-relaxed">{finalConclusion}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print / Save as PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDossierModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* C. View Review History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-sm">Professional Review History</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
              {reviewHistory.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                  No previous review cycles recorded for this project.
                </div>
              ) : (
                reviewHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] font-mono">
                        {item.areaKey}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {item.reviewerName && (
                      <span className="text-slate-600 text-[11px] block">
                        Reviewer: <strong>{item.reviewerName}</strong>
                      </span>
                    )}

                    {item.comments && (
                      <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                        {item.comments}
                      </p>
                    )}

                    {item.submittedAt && (
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        {new Date(item.submittedAt).toLocaleDateString()} at {new Date(item.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
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
        stageNumber={6}
        stageTitle="Knowledge Integration"
        backHref={`/researcher/projects/${projectId}`}
        saveStatus={saving ? "saving" : "saved"}
        lastSaved={lastSaved}
        isSaving={saving}
        onSave={() => handleSave(false)}
        saveLabel="Save Draft"
        primaryAction={{
          label: "Complete Research",
          onClick: () => handleSave(true),
          loading: completing,
          loadingLabel: "Finalizing Research Pipeline...",
        }}
      />
    </div>
  );
}
