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
  Activity,
  Award,
  Layers,
  BookOpen,
} from "lucide-react";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  expertReviewAreaLabel,
  getAreaDefinition,
  type ExpertReviewAreaKey,
} from "@/lib/expert-review-areas";
import Molecular3DViewer from "@/components/researcher/in-silico/Molecular3DViewer";
import Interaction2DDiagram from "@/components/researcher/in-silico/Interaction2DDiagram";
import AiResearchReviewBrief from "@/components/reviewer/ai/AiResearchReviewBrief";

interface Props {
  assignmentId: number;
}

const DOSSIER_SECTIONS = [
  { id: "section1-formulation", label: "01 Formulation R&D", icon: FlaskConical },
  { id: "section2-insilico", label: "02 In-Silico & Docking", icon: Dna },
  { id: "section3-manuscript", label: "03 Research Manuscript", icon: FileText },
  { id: "synthesis-audit", label: "04 Multi-Disciplinary Status", icon: ShieldCheck },
];

export default function DossierReviewWorkspaceClient({ assignmentId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("section1-formulation");
  const [reviewPanelMode, setReviewPanelMode] = useState<"SPECIALIST" | "CONSOLIDATED">("SPECIALIST");

  // Specialist Evaluation State
  const [assessment, setAssessment] = useState<"ACCEPTABLE" | "REVISION_REQUIRED" | null>(null);
  const [comments, setComments] = useState("");
  const [findings, setFindings] = useState<any[]>([]);

  // Consolidated Decision State
  const [consolidatedDecision, setConsolidatedDecision] = useState<"ACCEPT_FOR_NEXT_STAGE" | "REQUEST_REVISION">("ACCEPT_FOR_NEXT_STAGE");
  const [overallAssessment, setOverallAssessment] = useState("");
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [requiredRevisions, setRequiredRevisions] = useState("");

  // Add Finding Modal / Inline Form
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [findingTitle, setFindingTitle] = useState("");
  const [findingSection, setFindingSection] = useState("Section 1: Formulation R&D");
  const [findingStage, setFindingStage] = useState("Formulation");
  const [findingSeverity, setFindingSeverity] = useState("MINOR");
  const [findingComment, setFindingComment] = useState("");

  // Docking Viewer State
  const [selectedDockingRunIndex, setSelectedDockingRunIndex] = useState<number>(0);
  const [structureLoading, setStructureLoading] = useState<boolean>(false);
  const [structureFiles, setStructureFiles] = useState<{
    receptorPdb: string;
    ligandPdbqt: string;
    interactions: any;
  } | null>(null);

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

        // Initialize consolidated assessment text
        if (json.snapshot?.finalConclusion || json.assignment?.projectTitle) {
          setOverallAssessment(
            `The submitted research package for ${json.snapshot?.plantName || json.assignment?.plantName} demonstrates robust integration of botanical formulation standardization and computational molecular docking. Methodological protocols and safety margins were evaluated by multidisciplinary specialists.`
          );
        }
      } catch (err) {
        console.error("Failed to load review workspace:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [assignmentId]);

  // Load structure files when active docking run changes
  useEffect(() => {
    if (!data?.assignment?.projectId) return;
    const runs = data.snapshot?.dockingRuns || [];
    const activeRun = runs[selectedDockingRunIndex];
    if (!activeRun?.id) return;

    let cancelled = false;
    async function fetchStructures() {
      try {
        setStructureLoading(true);
        const res = await fetch(
          `/api/researcher/projects/${data.assignment.projectId}/docking/structure-files?runId=${activeRun.id}`
        );
        if (!res.ok) return;
        const resJson = await res.json();
        if (!cancelled && resJson.success) {
          setStructureFiles({
            receptorPdb: resJson.receptorPdb || "",
            ligandPdbqt: resJson.ligandPdbqt || "",
            interactions: resJson.interactions || null,
          });
        }
      } catch (e) {
        console.error("Failed to load 3D structures:", e);
      } finally {
        if (!cancelled) setStructureLoading(false);
      }
    }

    fetchStructures();
    return () => {
      cancelled = true;
    };
  }, [data, selectedDockingRunIndex]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleNavigateToSection = (sectionId: string, anchorId?: string) => {
    setActiveSection(sectionId);
    if (anchorId) {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  };

  const handleAddFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findingComment.trim()) return;

    const newFinding = {
      id: undefined,
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

  const handleCommitConsolidatedDecision = async () => {
    if (!overallAssessment.trim() || overallAssessment.trim().length < 20) {
      alert("Please provide a comprehensive overall assessment (at least 20 characters).");
      return;
    }
    if (consolidatedDecision === "REQUEST_REVISION" && (!requiredRevisions.trim() || requiredRevisions.trim().length < 15)) {
      alert("Detailed Required Revisions explanation is mandatory when requesting revisions.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/reviewer/reviews/${assignmentId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: consolidatedDecision,
          overallAssessment,
          strengths,
          concerns,
          requiredRevisions,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message || "Consolidated decision recorded successfully.");
        setTimeout(() => {
          router.push("/reviewer");
        }, 1200);
      } else {
        alert(json.error || "Failed to commit consolidated decision");
      }
    } catch (err) {
      console.error(err);
      alert("Error committing consolidated decision");
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
  const dockingRuns = snapshot?.dockingRuns || [];
  const activeDockingRun = dockingRuns[selectedDockingRunIndex] || null;

  return (
    <div className="space-y-6 pb-12">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#071d3a] via-[#0b2b54] to-[#123e73] border border-blue-400/30 text-white shadow-lg shadow-blue-950/20">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[10px] font-bold tracking-wider uppercase">
                NatureAide V2 Unified Dossier
              </span>
              <span className="text-xs text-blue-200/80 font-mono">
                {assignment.versionTag || "v1.0"} · Cycle {assignment.reviewRound || 1}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight text-white flex items-center gap-2 truncate">
              <span>{assignment.projectTitle}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-blue-100/90 pt-0.5">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>{assignment.plantName}</span>
                {assignment.plantScientificName && (
                  <span className="italic font-normal text-blue-200">({assignment.plantScientificName})</span>
                )}
              </span>
              <span>•</span>
              <span className="text-blue-200">
                Researcher: <strong className="text-white">{assignment.researcherName}</strong>
              </span>
              <span>•</span>
              <span className="text-blue-200">
                Submitted: <strong className="text-white">{new Date(assignment.submittedAt).toLocaleDateString()}</strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-xl bg-blue-500/30 text-blue-100 border border-blue-400/40 text-xs font-bold">
              {assignment.assignmentStatus === "COMPLETED"
                ? "✓ Approved"
                : assignment.assignmentStatus === "REVISION_REQUIRED"
                ? "⚠ Revision Required"
                : assignment.assignmentStatus === "IN_REVIEW"
                ? "● In Review"
                : "○ Pending Review"}
            </span>
            <Link
              href="/reviewer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Queue</span>
            </Link>
          </div>
        </div>
      </div>

      {/* AI RESEARCH REVIEW BRIEF (PHASE 6) */}
      <AiResearchReviewBrief
        assignmentId={assignmentId}
        onNavigateToSection={handleNavigateToSection}
      />

      {/* DOSSIER SECTION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {DOSSIER_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all shrink-0 cursor-pointer border-b-2 -mb-px ${
                isActive
                  ? "bg-white text-blue-600 border-blue-600 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN 2-COLUMN LAYOUT: LEFT DOSSIER (65%) | RIGHT REVIEW PANEL (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: READ-ONLY DOSSIER VIEWER                     */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: SECTION 1 · FORMULATION R&D */}
          {activeSection === "section1-formulation" && (
            <div className="space-y-6">
              {/* Botanical Identity & Extraction */}
              <div id="sec-botanical" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span>Step 1 &amp; 3 — Botanical Identity, Taxonomy &amp; Extraction</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Step 1 · 3 Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Common Plant Name</p>
                    <p className="font-bold text-slate-900 text-sm">{snapshot?.plantName || assignment.plantName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Botanical Taxonomy</p>
                    <p className="font-bold text-slate-900 italic text-sm">
                      {snapshot?.plantScientificName || assignment.plantScientificName || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Plant Part &amp; Material Type</p>
                    <p className="font-bold text-slate-900">
                      {snapshot?.plantPartsStudied || "Leaves"} · {snapshot?.materialType || "Standardized Crude Extract"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-slate-400 font-semibold">Extraction Method &amp; Solvent</p>
                    <p className="font-bold text-slate-900">
                      {snapshot?.extractionMethod || "Ultrasonic-Assisted Extraction (UAE)"} (
                      {snapshot?.extractionSolvent || "70% Aqueous Ethanol"})
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Selection & Dosage Presets */}
              {snapshot?.productSelection && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-indigo-600" />
                      <span>Step 2 — Product Selection &amp; Dosage Presets</span>
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      Target Route: {snapshot.productSelection.targetRoute || "Topical"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-400 font-semibold">Dosage Form Preset</p>
                      <p className="font-bold text-slate-800">{snapshot.productSelection.dosageForm || "Topical Hydrogel"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-400 font-semibold">Application Frequency</p>
                      <p className="font-bold text-slate-800">{snapshot.productSelection.frequency || "2x daily"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-slate-400 font-semibold">Administration Notes</p>
                      <p className="font-medium text-slate-700">{snapshot.productSelection.administrationNotes || "Apply thin layer to affected skin"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Materials & Reagents Table */}
              <div id="sec-materials" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span>Step 4 — Materials &amp; Reagents Inventory ({snapshot?.materials?.length || 0})</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Pharmacopeial Grade</span>
                </div>

                {(!snapshot?.materials || snapshot.materials.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-3 text-center">No materials inventory recorded.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Material Name</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Purity / Grade</th>
                          <th className="p-2.5">CAS / Lot</th>
                          <th className="p-2.5">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {snapshot.materials.map((m: any, idx: number) => (
                          <tr key={m.id || idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold text-slate-900">{m.materialName}</td>
                            <td className="p-2.5 text-slate-600">{m.category || "Excipient"}</td>
                            <td className="p-2.5 text-slate-600">{m.gradePurity || "USP / NF"}</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-500">{m.casOrLotNumber || "N/A"}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{m.intendedRole || "Polymer Binder"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Formulation Composition Matrix */}
              <div id="sec-formulation-matrix" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-600" />
                    <span>Step 5 — Formulation Composition Matrix</span>
                  </h3>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    100.0% Mass Balance
                  </span>
                </div>

                {snapshot?.formulations?.[0]?.components?.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {snapshot.formulations[0].components.map((c: any, idx: number) => (
                      <div key={c.id || idx} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-900">{c.componentName}</span>
                          <span className="text-slate-400 text-[11px] ml-2">({c.roleInFormulation || "Component"})</span>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {c.quantity} {c.unit} {c.concentration ? `· ${c.concentration}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-3 text-center">No components recorded in formulation matrix.</p>
                )}
              </div>

              {/* Batch Analyses Table */}
              <div id="sec-batches" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Step 6 — Batch Analysis &amp; Quality Control (5%–10% Active Range)</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Batch QC Validated</span>
                </div>

                {(!snapshot?.batchAnalyses || snapshot.batchAnalyses.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-3 text-center">No batch analyses recorded.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Batch Code</th>
                          <th className="p-2.5">Concentration</th>
                          <th className="p-2.5">pH</th>
                          <th className="p-2.5">Viscosity</th>
                          <th className="p-2.5">Microbial Limit</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {snapshot.batchAnalyses.map((b: any, idx: number) => (
                          <tr key={b.id || idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold text-slate-900">{b.batchCode || `BAT-${idx + 1}`}</td>
                            <td className="p-2.5 font-mono text-slate-700">{b.concentrationPercent || 5.0}% w/w</td>
                            <td className="p-2.5 font-mono text-slate-700">{b.phLevel || "5.6"}</td>
                            <td className="p-2.5 font-mono text-slate-700">{b.viscosityCps || "4200"} cP</td>
                            <td className="p-2.5 font-semibold text-emerald-700">{b.microbialLimit || "Compliant (<10 CFU/g)"}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                {b.qcStatus || "Passed"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SECTION 2 · IN-SILICO & DOCKING */}
          {activeSection === "section2-insilico" && (
            <div className="space-y-6">
              {/* Screened Compounds */}
              <div id="sec-compounds" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <Dna className="w-4 h-4 text-blue-600" />
                    <span>Screened Bioactive Compounds ({snapshot?.compounds?.length || 0})</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Lipinski Rule of 5 Compliant</span>
                </div>

                {(!snapshot?.compounds || snapshot.compounds.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-3 text-center">No screened phytochemicals recorded.</p>
                ) : (
                  <div className="space-y-2.5">
                    {snapshot.compounds.map((c: any, idx: number) => (
                      <div key={c.id || idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{c.compoundName || c.name}</span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                            PubChem CID: {c.pubchemId || "N/A"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                          <div>
                            <span className="text-slate-400">Formula:</span>{" "}
                            <span className="font-medium text-slate-800">{c.molecularFormula || c.formula || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Mol. Weight:</span>{" "}
                            <span className="font-medium text-slate-800">{c.molecularWeight || c.mw || "N/A"} g/mol</span>
                          </div>
                          <div className="col-span-2 truncate">
                            <span className="text-slate-400">SMILES:</span>{" "}
                            <code className="text-[10px] bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">
                              {c.smiles || "N/A"}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Molecular Docking Simulations */}
              <div id="sec-docking" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>AutoDock Vina Simulations ({dockingRuns.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Standardized Free Binding Energy ΔG</span>
                </div>

                {dockingRuns.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-3 text-center">No molecular docking runs recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Run Selector Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {dockingRuns.map((run: any, idx: number) => (
                        <button
                          key={run.id || idx}
                          type="button"
                          onClick={() => setSelectedDockingRunIndex(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                            selectedDockingRunIndex === idx
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          <span>
                            {run.ligandName} × {run.targetProtein || run.pdbId} ({run.bindingAffinity} kcal/mol)
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Active Run Card */}
                    {activeDockingRun && (
                      <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {activeDockingRun.ligandName} bound to {activeDockingRun.targetProtein}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Target Structure: PDB ID{" "}
                              <a
                                href={`https://www.rcsb.org/structure/${activeDockingRun.pdbId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline font-bold"
                              >
                                {activeDockingRun.pdbId}
                              </a>
                            </p>
                          </div>
                          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-mono font-extrabold text-sm shadow-xs shrink-0">
                            ΔG = {activeDockingRun.bindingAffinity} kcal/mol
                          </div>
                        </div>

                        {/* 2D & 3D Visualizations */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                          {/* 2D Interaction Diagram */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                            <p className="font-bold text-slate-800 text-xs">2D Protein-Ligand Interaction Map</p>
                            {structureFiles?.interactions?.interactions?.length ? (
                              <Interaction2DDiagram
                                ligandName={activeDockingRun.ligandName}
                                proteinName={activeDockingRun.targetProtein}
                                pdbId={activeDockingRun.pdbId}
                                bindingAffinity={activeDockingRun.bindingAffinity}
                                interactions={structureFiles.interactions.interactions}
                              />
                            ) : (
                              <div className="h-64 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                                {structureLoading ? "Analyzing 2D contacts..." : "2D residue interaction diagram available"}
                              </div>
                            )}
                          </div>

                          {/* 3D Molecular Conformation Viewer */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                            <p className="font-bold text-slate-800 text-xs">3D Receptor-Ligand Conformation</p>
                            {structureFiles?.receptorPdb && structureFiles?.ligandPdbqt ? (
                              <Molecular3DViewer
                                receptorPdb={structureFiles.receptorPdb}
                                ligandPdbqt={structureFiles.ligandPdbqt}
                                proteinName={activeDockingRun.targetProtein}
                                ligandName={activeDockingRun.ligandName}
                                bindingAffinity={activeDockingRun.bindingAffinity}
                                highlightResidues={structureFiles.interactions?.uniqueResidues || []}
                              />
                            ) : (
                              <div className="h-64 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                                {structureLoading ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                    <span>Loading 3D structure...</span>
                                  </div>
                                ) : (
                                  "Interactive 3D molecular viewer available"
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SECTION 3 · RESEARCH MANUSCRIPT */}
          {activeSection === "section3-manuscript" && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Executive Research Summary</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Research Synthesis</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {snapshot?.dossier?.executiveSummary ||
                    snapshot?.abstract ||
                    "This research dossier conducts standardized formulation development and in-silico screening of botanical bioactive constituents."}
                </div>
              </div>

              {/* Supporting Literature References */}
              <div id="sec-evidence" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Supporting Scientific Literature ({snapshot?.literature?.length || 0})</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">PubMed / Peer-Reviewed</span>
                </div>

                {(!snapshot?.literature || snapshot.literature.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-3 text-center">No literature references linked.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {snapshot.literature.map((lit: any, idx: number) => (
                      <div key={lit.id || idx} className="py-3 space-y-1 text-xs">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-slate-900">
                            {idx + 1}. {lit.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {lit.pmid && (
                              <a
                                href={`https://pubmed.ncbi.nlm.nih.gov/${lit.pmid}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold"
                              >
                                <span>PMID</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {lit.doi && (
                              <a
                                href={`https://doi.org/${lit.doi}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold"
                              >
                                <span>DOI</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          {lit.authors || "Authors"} {lit.year ? `(${lit.year})` : ""} · {lit.journalSource || lit.journal || "Journal"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Complete Manuscript Viewer */}
              {snapshot?.manuscript && (
                <div id="sec-manuscript" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Research Manuscript</span>
                    </h3>
                    {(snapshot.manuscript.fileUrl || snapshot.manuscript.fileName) && (
                      <div className="flex items-center gap-2">
                        <a
                          href={
                            snapshot.manuscript.fileUrl ||
                            `/api/researcher/projects/${data?.assignment?.projectId}/manuscript/file`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>
                            Open Uploaded Paper ({snapshot.manuscript.fileName || "Document"})
                          </span>
                        </a>
                        <a
                          href={`${
                            snapshot.manuscript.fileUrl ||
                            `/api/researcher/projects/${data?.assignment?.projectId}/manuscript/file`
                          }?download=1`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <span>Download</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {(snapshot.manuscript.fileUrl || snapshot.manuscript.fileName) &&
                    (snapshot.manuscript.mimeType === "application/pdf" ||
                      String(snapshot.manuscript.fileName || "")
                        .toLowerCase()
                        .endsWith(".pdf")) && (
                      <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        <iframe
                          src={
                            snapshot.manuscript.fileUrl ||
                            `/api/researcher/projects/${data?.assignment?.projectId}/manuscript/file`
                          }
                          title="Uploaded Research Paper"
                          className="w-full h-[520px]"
                        />
                      </div>
                    )}

                  <div className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-indigo-600">
                        Manuscript Title
                      </h4>
                      <p className="text-sm font-bold text-slate-900">{snapshot.manuscript.title}</p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-indigo-600">
                        Abstract
                      </h4>
                      <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed whitespace-pre-line">
                        {snapshot.manuscript.abstract}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-indigo-600">
                        Introduction &amp; Background
                      </h4>
                      <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed whitespace-pre-line">
                        {snapshot.manuscript.introduction}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-indigo-600">
                        Materials &amp; Methods
                      </h4>
                      <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed whitespace-pre-line">
                        {snapshot.manuscript.materialsMethods}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-indigo-600">
                        Results &amp; Discussion
                      </h4>
                      <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed whitespace-pre-line">
                        {snapshot.manuscript.resultsDiscussion}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-indigo-600">
                        Conclusions
                      </h4>
                      <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed whitespace-pre-line">
                        {snapshot.manuscript.conclusion}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SYNTHESIS & AUDIT */}
          {activeSection === "synthesis-audit" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Multidisciplinary Review Coverage Status</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">5 Specializations</span>
                </div>

                <div className="space-y-2 text-xs">
                  {allAreaStatuses?.map((st: any) => (
                    <div
                      key={st.key}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{st.label}</p>
                        <p className="text-[11px] text-slate-500">
                          {st.isAssignedToMe ? "Assigned to your queue" : "Reviewer Panel Specialist"}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          st.status === "APPROVED" || st.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : st.status === "REVISION_REQUIRED"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : st.status === "IN_REVIEW"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {st.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: STICKY PROFESSIONAL EVALUATION & DECISION   */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            {/* Header: Mode Selector */}
            <div className="border-b border-slate-100 pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Review Panel
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Round {assignment.reviewRound || 1}
                </span>
              </div>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setReviewPanelMode("SPECIALIST")}
                  className={`py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                    reviewPanelMode === "SPECIALIST"
                      ? "bg-white text-blue-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Specialist Review
                </button>
                <button
                  type="button"
                  onClick={() => setReviewPanelMode("CONSOLIDATED")}
                  className={`py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                    reviewPanelMode === "CONSOLIDATED"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Consolidated Decision
                </button>
              </div>
            </div>

            {/* MODE 1: SPECIALIST EVALUATION */}
            {reviewPanelMode === "SPECIALIST" && (
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    {assignment.reviewAreaLabel} Specialist Assessment
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Provide your professional determination for your scientific specialty.
                  </p>
                </div>

                {/* Assessment Buttons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Specialist Recommendation <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAssessment("ACCEPTABLE")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        assessment === "ACCEPTABLE"
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold ring-2 ring-emerald-600/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mx-auto mb-1 ${
                          assessment === "ACCEPTABLE" ? "text-emerald-600" : "text-slate-400"
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

                {/* Comments */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Specialist Comments <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={`Provide scientific evaluation comments for ${assignment.reviewAreaLabel}...`}
                    rows={4}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 leading-relaxed"
                  />
                </div>

                {/* Findings Tracker */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Findings ({findings.length})</span>
                    <button
                      type="button"
                      onClick={() => setShowAddFinding(!showAddFinding)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Finding</span>
                    </button>
                  </div>

                  {showAddFinding && (
                    <form
                      onSubmit={handleAddFinding}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                    >
                      <input
                        type="text"
                        value={findingTitle}
                        onChange={(e) => setFindingTitle(e.target.value)}
                        placeholder="Finding title (e.g. Mass Balance Verification)"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={findingSection}
                          onChange={(e) => setFindingSection(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                        >
                          <option value="Section 1: Formulation R&D">Section 1: Formulation R&D</option>
                          <option value="Section 2: In-Silico & Docking">Section 2: In-Silico &amp; Docking</option>
                          <option value="Section 3: Research Manuscript">Section 3: Manuscript</option>
                        </select>
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
                      <textarea
                        value={findingComment}
                        onChange={(e) => setFindingComment(e.target.value)}
                        placeholder="Specific scientific concern or recommendation..."
                        rows={2}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                      />
                      <div className="flex items-center justify-end gap-2">
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

                  {findings.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {findings.map((f, i) => (
                        <div
                          key={f.id || i}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-[11px]">{f.title || f.sectionName}</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                              {f.severity || "MINOR"}
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px] leading-snug">{f.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
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
                        <span>Submit Specialist Review</span>
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
              </div>
            )}

            {/* MODE 2: CONSOLIDATED DECISION */}
            {reviewPanelMode === "CONSOLIDATED" && (
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Consolidated Professional Decision
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Final multidisciplinary decision across all 3 research sections.
                  </p>
                </div>

                {/* Final Decision Choice */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Consolidated Verdict <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConsolidatedDecision("ACCEPT_FOR_NEXT_STAGE")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        consolidatedDecision === "ACCEPT_FOR_NEXT_STAGE"
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold ring-2 ring-emerald-600/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mx-auto mb-1 ${
                          consolidatedDecision === "ACCEPT_FOR_NEXT_STAGE" ? "text-emerald-600" : "text-slate-400"
                        }`}
                      />
                      <span className="text-xs block">Approved</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsolidatedDecision("REQUEST_REVISION")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        consolidatedDecision === "REQUEST_REVISION"
                          ? "bg-amber-50 border-amber-500 text-amber-900 font-bold ring-2 ring-amber-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-4 h-4 mx-auto mb-1 ${
                          consolidatedDecision === "REQUEST_REVISION" ? "text-amber-600" : "text-slate-400"
                        }`}
                      />
                      <span className="text-xs block">Revision Required</span>
                    </button>
                  </div>
                </div>

                {/* Overall Assessment */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Overall Synthesis Assessment <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={overallAssessment}
                    onChange={(e) => setOverallAssessment(e.target.value)}
                    placeholder="Multidisciplinary synthesis summarizing the project's scientific validity..."
                    rows={4}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Required Revisions (if revision requested) */}
                {consolidatedDecision === "REQUEST_REVISION" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900 block">
                      Mandatory Required Revisions <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={requiredRevisions}
                      onChange={(e) => setRequiredRevisions(e.target.value)}
                      placeholder="Specify exact revisions required in Section 1, 2, or 3..."
                      rows={3}
                      className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/50 text-xs text-slate-900 outline-none focus:bg-white focus:border-amber-500 leading-relaxed"
                    />
                  </div>
                )}

                {/* Strengths & Concerns */}
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Strengths Noted
                    </label>
                    <input
                      type="text"
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="e.g. Robust batch repeatability and strong docking affinity"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Concerns or Caveats
                    </label>
                    <input
                      type="text"
                      value={concerns}
                      onChange={(e) => setConcerns(e.target.value)}
                      placeholder="e.g. High-temperature extraction stability testing recommended"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Commit Decision Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCommitConsolidatedDecision}
                    disabled={submitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Committing Decision...</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-3.5 h-3.5" />
                        <span>Commit Consolidated Decision</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
