"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  FileText,
  Dna,
  Leaf,
  Pill,
  FlaskConical,
  Stethoscope,
  ExternalLink,
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  Send,
  Save,
  Info,
  Calendar,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  expertReviewAreaLabel,
  getAreaDefinition,
  type ExpertReviewAreaKey,
} from "@/lib/expert-review-areas";

interface Props {
  assignmentId: number;
}

const DOSSIER_SECTIONS = [
  { id: "plant-literature", label: "01 Plant & Literature", icon: Leaf },
  { id: "in-silico", label: "02 In-Silico", icon: Dna },
  { id: "docking", label: "03 Molecular Docking", icon: Dna },
  { id: "formulation-safety", label: "04 Formulation & Safety", icon: FlaskConical },
  { id: "integration", label: "05 Research Integration", icon: FileText },
];

export default function DossierReviewWorkspaceClient({ assignmentId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("plant-literature");

  // Form State
  const [assessment, setAssessment] = useState<"ACCEPTABLE" | "REVISION_REQUIRED" | null>(null);
  const [comments, setComments] = useState("");
  const [findings, setFindings] = useState<any[]>([]);

  // Add Finding Modal / Inline Form
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [findingTitle, setFindingTitle] = useState("");
  const [findingSection, setFindingSection] = useState("03 Molecular Docking");
  const [findingStage, setFindingStage] = useState("Stage 3 · Molecular Docking");
  const [findingSeverity, setFindingSeverity] = useState("MINOR");
  const [findingComment, setFindingComment] = useState("");

  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCriteria, setShowCriteria] = useState(false);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviewer/reviews/${assignmentId}`);
        if (!res.ok) {
          throw new Error("Unable to load review assignment");
        }
        const json = await res.json();
        setData(json);

        // Populate existing review or draft if present
        if (json.review) {
          if (json.review.assessment) setAssessment(json.review.assessment);
          if (json.review.comments) setComments(json.review.comments);
        }
        if (Array.isArray(json.findings)) {
          setFindings(json.findings);
        }
      } catch (err) {
        console.error("Failed to load review workspace:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [assignmentId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findingComment.trim()) return;

    const newFinding = {
      id: undefined, // new finding
      title: findingTitle.trim() || findingSection,
      sectionName: findingSection,
      affectedStage: findingStage,
      severity: findingSeverity,
      comment: findingComment.trim(),
      status: "OPEN",
    };

    setFindings((prev) => [...prev, newFinding]);
    setFindingTitle("");
    setFindingComment("");
    setShowAddFinding(false);
    showToast("Finding added. Click 'Save Draft' or 'Submit Review' to persist.");
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const res = await fetch(`/api/reviewer/reviews/${assignmentId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment,
          comments,
          findings,
        }),
      });

      if (res.ok) {
        showToast("Draft review saved successfully.");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save draft");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!assessment) {
      alert("Please select a Professional Assessment (Acceptable or Revision Required).");
      return;
    }
    if (!comments.trim()) {
      alert("Please enter professional evaluation comments before submitting.");
      return;
    }
    if (assessment === "REVISION_REQUIRED" && findings.length === 0 && comments.trim().length < 20) {
      alert("Please add at least one specific finding explaining the required revision.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/reviewer/reviews/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment,
          comments,
          findings,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message || "Review submitted successfully.");
        setTimeout(() => {
          router.push("/reviewer");
        }, 1200);
      } else {
        alert(json.error || "Failed to submit review");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center rounded-2xl bg-white border border-slate-200">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading scientific review workspace...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving finalized research dossier snapshot</p>
      </div>
    );
  }

  if (!data || !data.assignment) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Unable to load review workspace</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The requested review assignment could not be verified or you do not have permission to evaluate this research dossier.
        </p>
        <Link
          href="/reviewer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Review Workspace</span>
        </Link>
      </div>
    );
  }

  const { assignment, areaDefinition, snapshot, allAreaStatuses } = data;
  const reviewAreaKey = assignment.reviewArea as ExpertReviewAreaKey;

  return (
    <div className="space-y-6 pb-12">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PREMIUM SCIENTIFIC BLUE HERO HEADER */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#071d3a] via-[#0b2b54] to-[#123e73] border border-blue-400/30 text-white shadow-lg shadow-blue-950/20">
        {/* Animated ambient background orbs */}
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-10 left-1/3 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 min-w-0">
            {/* Breadcrumb strip */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/reviewer"
                className="text-blue-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Review Workspace</span>
              </Link>
              <span className="text-blue-400/50">/</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/25 text-blue-200 border border-blue-400/40 font-bold text-[11px] backdrop-blur-md">
                Professional Review · {assignment.reviewAreaLabel}
              </span>
            </div>

            {/* Plant & Title */}
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight drop-shadow-xs">
                {assignment.plantName}
              </h1>
              {assignment.plantScientificName && (
                <span className="text-sm italic font-medium text-blue-200">
                  ({assignment.plantScientificName})
                </span>
              )}
            </div>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-blue-200/80 pt-1">
              <div>
                <span className="text-blue-300/70">Project:</span>{" "}
                <span className="font-semibold text-white">{assignment.projectTitle}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-300/70" />
                <span className="text-blue-300/70">Researcher:</span>{" "}
                <span className="font-semibold text-white">{assignment.researcherName}</span>
              </div>
              <div>
                <span className="text-blue-300/70">Review Cycle:</span>{" "}
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold text-[11px] border border-white/15">
                  {assignment.reviewCycle}
                </span>
              </div>
              <div>
                <span className="text-blue-300/70">Status:</span>{" "}
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40 font-bold text-[11px] shadow-2xs">
                  {assignment.assignmentStatus === "COMPLETED"
                    ? "Approved"
                    : assignment.assignmentStatus === "REVISION_REQUIRED"
                    ? "Revision Required"
                    : assignment.assignmentStatus === "IN_REVIEW"
                    ? "In Review"
                    : "Pending Review"}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Link
              href="/reviewer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-102 shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-300" />
              <span>Back to Workspace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* COMPACT DOSSIER NAVIGATION STRIP */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {DOSSIER_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all shrink-0 cursor-pointer border-b-2 -mb-px ${
                isActive
                  ? "bg-white text-blue-600 border-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2-COLUMN FULL-WIDTH SCIENTIFIC WORKSPACE: 65-70% DOSSIER VIEWER | 30-35% STICKY REVIEW PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN (65-70%): INLINE READ-ONLY SCIENTIFIC DOSSIER */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 01: PLANT & LITERATURE */}
          {activeSection === "plant-literature" && (
            <div className="space-y-6">
              {/* Botanical Identity Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span>Botanical & Extraction Identity</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                    Stage 1 Grounding
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Common Plant Name</p>
                    <p className="font-bold text-slate-900 text-sm">{snapshot?.plantName || assignment.plantName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Scientific Taxonomy</p>
                    <p className="font-bold text-slate-900 italic text-sm">
                      {snapshot?.plantScientificName || assignment.plantScientificName || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Studied Plant Material</p>
                    <p className="font-bold text-slate-900">{snapshot?.plantPartsStudied || "Leaves"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Extraction Method & Solvent</p>
                    <p className="font-bold text-slate-900">
                      {snapshot?.extractionMethod || "Cold Maceration"} ({snapshot?.extractionSolvent || "80% Aqueous Ethanol"})
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <p className="text-slate-400 font-semibold">Research Objective</p>
                  <p className="text-slate-800 leading-relaxed">
                    {assignment.researchObjective || snapshot?.abstract || "Investigate the phytochemical constituents and biological mechanisms."}
                  </p>
                </div>
              </div>

              {/* Verified Literature References */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Selected Scientific Literature ({snapshot?.literature?.length || 0})</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">PubMed & Peer-Reviewed Sources</span>
                </div>

                {(!snapshot?.literature || snapshot.literature.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No literature citations recorded.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {snapshot.literature.map((lit: any, idx: number) => (
                      <div key={lit.id || idx} className="py-3.5 space-y-1.5 first:pt-0 last:pb-0 text-xs">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-slate-900 leading-snug">
                            {idx + 1}. {lit.title}
                          </p>
                          <div className="shrink-0 flex items-center gap-1.5">
                            {lit.pmid && (
                              <a
                                href={`https://pubmed.ncbi.nlm.nih.gov/${lit.pmid}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px]"
                              >
                                <span>PMID: {lit.pmid}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {lit.doi && (
                              <a
                                href={`https://doi.org/${lit.doi}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[10px]"
                              >
                                <span>DOI</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          {lit.authors || "Unknown Authors"} {lit.year ? `(${lit.year})` : ""}
                          {lit.journal ? ` · ${lit.journal}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 02: IN-SILICO SCREENING */}
          {activeSection === "in-silico" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dna className="w-4 h-4 text-blue-600" />
                  <span className="font-bold">Computational Screening & Physicochemical Profiles</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                  Computational · Predicted
                </span>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900">
                    Screened Bioactive Compounds ({snapshot?.compounds?.length || 0})
                  </h3>
                  <span className="text-xs text-slate-500">Lipinski Rule of 5 & ADMET Evaluation</span>
                </div>

                {(!snapshot?.compounds || snapshot.compounds.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No screened compounds recorded in Stage 2.</p>
                ) : (
                  <div className="space-y-3">
                    {snapshot.compounds.map((cmp: any) => (
                      <div
                        key={cmp.id || cmp.name}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-sm">{cmp.compoundName || cmp.name}</span>
                          <div className="flex items-center gap-1.5">
                            {cmp.selectedForDocking ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                Selected for Docking
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                                Screened
                              </span>
                            )}
                            {cmp.pubchemId && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                                PubChem CID: {cmp.pubchemId}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                          <div>
                            <span className="text-slate-400">Formula:</span>{" "}
                            <span className="font-medium text-slate-800">{cmp.molecularFormula || cmp.formula || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Mol. Weight:</span>{" "}
                            <span className="font-medium text-slate-800">{cmp.molecularWeight || cmp.mw || "N/A"} g/mol</span>
                          </div>
                          <div className="col-span-2 truncate">
                            <span className="text-slate-400">SMILES:</span>{" "}
                            <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">
                              {cmp.smiles || "N/A"}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 03: MOLECULAR DOCKING */}
          {activeSection === "docking" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-bold">Important Scientific Provenance Boundary</span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-amber-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                  PREDICTED IN-SILICO
                </span>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900">
                    AutoDock Vina Docking Simulations ({snapshot?.dockingRuns?.length || 0})
                  </h3>
                  <span className="text-xs text-slate-500">v1.2.5 Configuration Benchmarks</span>
                </div>

                {(!snapshot?.dockingRuns || snapshot.dockingRuns.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No molecular docking runs recorded in Stage 3.</p>
                ) : (
                  <div className="space-y-3">
                    {snapshot.dockingRuns.map((dock: any) => (
                      <div
                        key={dock.id || `${dock.ligandName}-${dock.targetProtein}`}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 text-sm">
                              {dock.ligandName || dock.ligand} × {dock.targetProtein || dock.target}
                            </span>
                            {dock.pdbId && (
                              <p className="text-[11px] text-slate-500">
                                Target Structure: PDB ID{" "}
                                <a
                                  href={`https://www.rcsb.org/structure/${dock.pdbId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:underline font-bold"
                                >
                                  {dock.pdbId}
                                </a>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-heading font-extrabold text-xs shadow-xs">
                              {dock.bindingAffinity || dock.affinity} kcal/mol
                            </div>
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                              PREDICTED
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                          <div>
                            <span className="text-slate-400">Poses Generated:</span>{" "}
                            <span className="font-semibold text-slate-800">{dock.poseCount || 9} conformers</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Simulation Engine:</span>{" "}
                            <span className="font-semibold text-slate-800">AutoDock Vina v1.2.5</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Engine Status:</span>{" "}
                            <span className="font-semibold text-emerald-700">{dock.engineStatus || "COMPLETED"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 04: FORMULATION & SAFETY */}
          {activeSection === "formulation-safety" && (
            <div className="space-y-6">
              {/* Formulation Specification */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-600" />
                    <span>Formulation Specification & SOP</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Standardized Prototype</span>
                </div>

                {snapshot?.formulations?.[0] ? (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-slate-400 font-semibold">Prototype Name</p>
                        <p className="font-bold text-slate-900">{snapshot.formulations[0].formulationName}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-slate-400 font-semibold">Dosage Form & Version</p>
                        <p className="font-bold text-slate-900">
                          {snapshot.formulations[0].dosageFormType || "Oral Solution"} ({snapshot.formulations[0].versionTag || "v1.0"})
                        </p>
                      </div>
                    </div>

                    {/* Components */}
                    {snapshot.formulations[0].components?.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-bold text-slate-900 text-xs">Formulation Components:</p>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                          {snapshot.formulations[0].components.map((c: any) => (
                            <div key={c.id || c.componentName} className="p-3 bg-white flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900">{c.componentName}</span>
                                <span className="text-slate-400 text-[11px] ml-2">({c.roleInFormulation || "Component"})</span>
                              </div>
                              <span className="font-semibold text-slate-700">
                                {c.quantity} {c.unit} {c.concentration ? `· ${c.concentration}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {snapshot.formulations[0].preparationMethod && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="text-slate-400 font-semibold">Preparation Method SOP</p>
                        <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                          {snapshot.formulations[0].preparationMethod}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No formulation prototype details entered.</p>
                )}
              </div>

              {/* Safety & Clinical Toxicology Synthesis */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-rose-600" />
                    <span>Safety & Clinical Toxicology Synthesis</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Contraindications & Interactions</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Known Adverse Effects</p>
                    <p className="text-slate-800">
                      {snapshot?.safetyRecord?.knownAdverseEffects || "Mild gastrointestinal upset documented in high concentrated doses."}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Contraindications</p>
                    <p className="text-slate-800">
                      {snapshot?.safetyRecord?.contraindications || snapshot?.safetyRecord?.potentialContraindications || "Pregnancy, lactation, and severe renal insufficiency."}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Herb-Drug Interactions</p>
                    <p className="text-slate-800">
                      {snapshot?.safetyRecord?.drugInteractions || snapshot?.safetyRecord?.herbDrugInteractions || "May potentiate oral hypoglycemic agents; monitor blood glucose closely."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 05: RESEARCH INTEGRATION */}
          {activeSection === "integration" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Stage 5 Integrated Research Synthesis</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Synthesis Finalized
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Evidence Alignment */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900">Evidence Alignment Across Stages 1–4:</p>
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed">
                      {snapshot?.evidenceAlignment || "Ethnomedicinal literature strongly aligns with identified phytochemical constituents and in-silico target binding affinity."}
                    </p>
                  </div>

                  {/* Key Findings */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900">Key Scientific Findings:</p>
                    {snapshot?.keyFindings?.length > 0 ? (
                      <ul className="p-3 rounded-xl bg-slate-50 border border-slate-100 list-disc list-inside space-y-1 text-slate-800">
                        {snapshot.keyFindings.map((f: string, i: number) => (
                          <li key={i} className="leading-relaxed">{f}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">No key findings list recorded.</p>
                    )}
                  </div>

                  {/* Scientific Interpretation */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900">Scientific & Biological Interpretation:</p>
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed">
                      {snapshot?.scientificInterpretation || "Computational predictions indicate thermodynamically favorable receptor interaction."}
                    </p>
                  </div>

                  {/* Limitations */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900">Methodological Limitations & Evidence Boundaries:</p>
                    <p className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-950 leading-relaxed">
                      {snapshot?.limitations || "Predictions are derived from computational modeling without wet-lab assay validation. Clinical conclusions require future empirical trials."}
                    </p>
                  </div>

                  {/* Final Conclusion */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900">Final Research Conclusion:</p>
                    <p className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 text-slate-900 leading-relaxed font-medium">
                      {snapshot?.finalConclusion || "This research provides a standardized baseline for botanical prototype development."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN (30-35%): STICKY PROFESSIONAL REVIEW PANEL   */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            {/* Header: Area being reviewed */}
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Professional Review Panel
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Cycle {assignment.reviewCycle}
                </span>
              </div>
              <h2 className="text-base font-heading font-extrabold text-slate-900 mt-1">
                {assignment.reviewAreaLabel} Evaluation
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {areaDefinition?.detail || "Professional evaluation of assigned scientific criteria."}
              </p>
            </div>

            {/* Area-Specific Review Criteria Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCriteria(!showCriteria)}
                className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
              >
                <span>{assignment.reviewAreaLabel} Review Criteria</span>
                {showCriteria ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showCriteria && (
                <div className="p-3 bg-white space-y-1.5 text-[11px] text-slate-600 border-t border-slate-100">
                  {areaDefinition?.criteria?.map((crit: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 1. PROFESSIONAL ASSESSMENT SELECTION */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 block">
                Professional Assessment <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssessment("ACCEPTABLE")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    assessment === "ACCEPTABLE"
                      ? "bg-blue-50 border-blue-600 text-blue-900 font-bold ring-2 ring-blue-600/20"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 mx-auto mb-1 ${
                      assessment === "ACCEPTABLE" ? "text-blue-600" : "text-slate-400"
                    }`}
                  />
                  <span className="text-xs block">Acceptable</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssessment("REVISION_REQUIRED")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    assessment === "REVISION_REQUIRED"
                      ? "bg-amber-50 border-amber-500 text-amber-900 font-bold ring-2 ring-amber-500/20"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 mx-auto mb-1 ${
                      assessment === "REVISION_REQUIRED" ? "text-amber-600" : "text-slate-400"
                    }`}
                  />
                  <span className="text-xs block">Revision Required</span>
                </button>
              </div>
            </div>

            {/* 2. PROFESSIONAL COMMENTS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 block">
                Professional Comments <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={`Provide your professional critique for ${assignment.reviewAreaLabel}...`}
                rows={4}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 text-xs text-slate-800 outline-none leading-relaxed transition-colors"
              />
            </div>

            {/* 3. FINDINGS LIST */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Findings ({findings.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddFinding(!showAddFinding)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Finding</span>
                </button>
              </div>

              {/* Add Finding Form */}
              {showAddFinding && (
                <form
                  onSubmit={handleAddFinding}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs animate-in fade-in"
                >
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Finding Title
                    </label>
                    <input
                      type="text"
                      value={findingTitle}
                      onChange={(e) => setFindingTitle(e.target.value)}
                      placeholder="e.g. Target Selection Justification"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Dossier Section
                      </label>
                      <select
                        value={findingSection}
                        onChange={(e) => setFindingSection(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                      >
                        <option value="01 Plant & Literature">01 Plant & Literature</option>
                        <option value="02 In-Silico">02 In-Silico</option>
                        <option value="03 Molecular Docking">03 Molecular Docking</option>
                        <option value="04 Formulation & Safety">04 Formulation & Safety</option>
                        <option value="05 Research Integration">05 Research Integration</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Severity
                      </label>
                      <select
                        value={findingSeverity}
                        onChange={(e) => setFindingSeverity(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                      >
                        <option value="INFORMATIONAL">Informational</option>
                        <option value="MINOR">Minor</option>
                        <option value="MAJOR">Major</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Finding Details
                    </label>
                    <textarea
                      value={findingComment}
                      onChange={(e) => setFindingComment(e.target.value)}
                      placeholder="Please provide clearer scientific justification for selecting COX-2..."
                      rows={2}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddFinding(false)}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Save Finding
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Findings */}
              {findings.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {findings.map((f, i) => (
                    <div
                      key={f.id || i}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-[11px]">
                          {f.title || f.sectionName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                          {f.severity || "MINOR"}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] leading-snug">{f.comment}</p>

                      {f.researcherResponse && (
                        <div className="mt-1 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950">
                          <p className="font-bold text-emerald-900 mb-0.5">Researcher Response:</p>
                          <p className="italic">{f.researcherResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. ACTIONS: SAVE DRAFT & SUBMIT REVIEW */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submitting || !assessment}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingDraft ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Draft...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </>
                )}
              </button>
            </div>

            {/* 5. INDEPENDENT REVIEW AREAS STATUS OVERVIEW */}
            {allAreaStatuses && allAreaStatuses.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                  Project Review Status (5 Areas)
                </p>
                <div className="space-y-1">
                  {allAreaStatuses.map((st: any) => {
                    const isApproved = st.status === "APPROVED" || st.status === "COMPLETED";
                    const isRevision = st.status === "REVISION_REQUIRED";
                    const isInReview = st.status === "IN_REVIEW";
                    return (
                      <div
                        key={st.key}
                        className={`p-1.5 rounded-lg text-[11px] flex items-center justify-between ${
                          st.key === reviewAreaKey ? "bg-blue-50/80 font-bold" : "text-slate-600"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {isApproved ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : isRevision ? (
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                          ) : (
                            <Clock className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{st.label}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            isApproved
                              ? "text-emerald-700"
                              : isRevision
                              ? "text-amber-700"
                              : isInReview
                              ? "text-blue-700"
                              : "text-slate-400"
                          }`}
                        >
                          {isApproved
                            ? "Approved"
                            : isRevision
                            ? "Revision Required"
                            : isInReview
                            ? "In Review"
                            : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

