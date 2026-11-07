"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
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
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  BookOpen,
  FolderGit2,
  Microscope,
  Check,
  Lock,
  MessageSquare,
  ChevronRight,
  Award,
  Hash,
} from "lucide-react";
import {
  normalizeReviewAreaKey,
  getAreaDefinition,
  type ExpertReviewAreaKey,
} from "@/lib/expert-review-areas";
import ConsolidatedProfessionalReviewForm, {
  type ReviewRecommendation,
  type RecommendationType,
  type AiSuggestion,
} from "./ConsolidatedProfessionalReviewForm";
import ReviewerStageFooter from "./ReviewerStageFooter";
import ReviewDecisionSuccessModal from "./ReviewDecisionSuccessModal";

interface Props {
  role: string;
  initialProjectId?: number | null;
  initialAssignmentId?: number | null;
}

const STAGE_CONFIGS: Record<
  string,
  {
    stageNumber: number;
    stageTitle: string;
    discipline: string;
    professionTitle: string;
    icon: React.ElementType;
    sections: Array<{ id: string; number: string; title: string }>;
  }
> = {
  pharmacognosy: {
    stageNumber: 1,
    stageTitle: "Plant & Literature Research",
    discipline: "Pharmacognosy",
    professionTitle: "Pharmacist / Pharmacognosist",
    icon: Leaf,
    sections: [
      { id: "sec-identity", number: "01", title: "Plant Identity" },
      { id: "sec-material", number: "02", title: "Research Material" },
      { id: "sec-extraction", number: "03", title: "Extraction" },
      { id: "sec-literature", number: "04", title: "Literature" },
      { id: "sec-synthesis", number: "05", title: "Synthesis" },
    ],
  },
  bioinformatics: {
    stageNumber: 2,
    stageTitle: "In-Silico Analysis",
    discipline: "Bioinformatics",
    professionTitle: "Bioinformatician / Computational Scientist",
    icon: Dna,
    sections: [
      { id: "sec-compounds", number: "01", title: "Screened Compounds" },
      { id: "sec-screening", number: "02", title: "Screening & ADMET" },
      { id: "sec-targets", number: "03", title: "Target Selection & PDB" },
      { id: "sec-docking-prep", number: "04", title: "Docking Setup" },
      { id: "sec-synthesis", number: "05", title: "Computational Synthesis" },
    ],
  },
  pharmacology: {
    stageNumber: 3,
    stageTitle: "Molecular Docking",
    discipline: "Pharmacology",
    professionTitle: "Pharmacologist",
    icon: Pill,
    sections: [
      { id: "sec-setup", number: "01", title: "Docking Setup & Grid" },
      { id: "sec-results", number: "02", title: "Docking Runs & Energetics" },
      { id: "sec-interpretation", number: "03", title: "Pharmacological Interpretation" },
    ],
  },
  formulation: {
    stageNumber: 4,
    stageTitle: "Formulation Development",
    discipline: "Formulation",
    professionTitle: "Pharmacist / Pharmaceutical Scientist",
    icon: FlaskConical,
    sections: [
      { id: "sec-design", number: "01", title: "Formulation Prototype" },
      { id: "sec-protocol", number: "02", title: "Maceration Protocol" },
      { id: "sec-stability", number: "03", title: "Dosage Form & Stability" },
    ],
  },
  clinical_safety: {
    stageNumber: 5,
    stageTitle: "Safety / Clinical",
    discipline: "Clinical Safety",
    professionTitle: "Physician / Clinical Pharmacist",
    icon: Stethoscope,
    sections: [
      { id: "sec-safety-evidence", number: "01", title: "Pre-assembled Evidence" },
      { id: "sec-safety-assessment", number: "02", title: "Toxicological Assessment" },
      { id: "sec-safety-summary", number: "03", title: "Clinical Safety Synthesis" },
    ],
  },
};

export default function RoleCheckingWorkspaceClient({
  role,
  initialProjectId,
  initialAssignmentId,
}: Props) {
  const router = useRouter();
  const roleKey = normalizeReviewAreaKey(role);
  const stageConfig = STAGE_CONFIGS[roleKey] || STAGE_CONFIGS.pharmacognosy;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeAnchor, setActiveAnchor] = useState<string>(stageConfig.sections[0]?.id || "");

  // Review states
  const [overallAssessment, setOverallAssessment] = useState("");
  const [recommendations, setRecommendations] = useState<ReviewRecommendation[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    decision: "APPROVED" | "REVISION_REQUIRED";
    recommendationsCount?: number;
  }>({
    isOpen: false,
    decision: "APPROVED",
    recommendationsCount: 0,
  });

  const isApproved =
    data?.review?.assessment === "ACCEPTABLE" ||
    data?.activeAssignment?.assignmentStatus === "COMPLETED" ||
    data?.activeAssignment?.assignmentStatus === "APPROVED";
  const isResubmitted = data?.activeAssignment?.assignmentStatus === "RESUBMITTED";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadWorkspace = async (assignmentId?: number | null) => {
    try {
      setLoading(true);
      let url = `/api/reviewer/checking/${roleKey}`;
      const params = new URLSearchParams();
      if (assignmentId) params.append("assignmentId", assignmentId.toString());
      else if (initialAssignmentId) params.append("assignmentId", initialAssignmentId.toString());
      else if (initialProjectId) params.append("projectId", initialProjectId.toString());

      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load reviewer workspace");
      const json = await res.json();
      setData(json);

      // Load existing review assessment and findings if available
      if (json.review?.comments) {
        setOverallAssessment(json.review.comments);
      } else {
        setOverallAssessment("");
      }

      if (Array.isArray(json.findings)) {
        const mappedRecs: ReviewRecommendation[] = json.findings
          .filter((f: any) => f.comment && f.comment.trim().length > 0)
          .map((f: any) => {
            let t: RecommendationType = "Correction";
            const ct = (f.commentType || "").toUpperCase();
            if (ct === "GENERAL_COMMENT") t = "Recommendation";
            else if (ct === "SAFETY_CONCERN") t = "Scientific Concern";
            else if (ct === "CLARIFICATION_NEEDED") t = "Clarification";

            return {
              id: f.id,
              type: t,
              section: f.sectionName || stageConfig.sections[0]?.title || "Stage Section",
              field: f.title && f.title !== f.sectionName ? f.title : undefined,
              comment: f.comment,
            };
          });
        setRecommendations(mappedRecs);
      }

      // Initialize AI review assistance suggestions based on role
      if (roleKey === "formulation") {
        setAiSuggestions([
          {
            id: "ai-fam-1",
            title: "Taxonomic Family Consistency Check",
            section: "Plant Identity",
            field: "Botanical Family",
            type: "Correction",
            description:
              "Confirm botanical family taxonomy against the Philippine Pharmacopeia and PITAHC authenticated monograph.",
          },
        ]);
      } else if (roleKey === "bioinformatics") {
        setAiSuggestions([
          {
            id: "ai-bio-1",
            title: "Lipinski Rule Violations Check",
            section: "Screening & ADMET",
            field: "Drug-Likeness Rules",
            type: "Scientific Concern",
            description:
              "Evaluate whether high molecular weight phytochemical constituents comply with oral bioavailability filters.",
          },
        ]);
      } else if (roleKey === "pharmacology") {
        setAiSuggestions([
          {
            id: "ai-dock-1",
            title: "Binding Energy Threshold Check",
            section: "Docking Runs & Energetics",
            field: "Affinity Score",
            type: "Recommendation",
            description:
              "Standard benchmark: candidate ligands with binding affinities more negative than -7.0 kcal/mol exhibit robust target inhibition.",
          },
        ]);
      }
    } catch (err) {
      console.error("Load reviewer workspace error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace(initialAssignmentId);
  }, [roleKey, initialAssignmentId, initialProjectId]);

  // Inline comment helper
  const handleAddInlineComment = (sectionTitle: string, fieldName: string) => {
    if (isApproved) {
      showToast("This stage is already approved and finalized in read-only mode.");
      return;
    }

    let alreadyExists = false;
    setRecommendations((prev) => {
      const exists = prev.some(
        (r) =>
          r.section.toLowerCase() === sectionTitle.toLowerCase() &&
          (r.field || "").toLowerCase() === fieldName.toLowerCase()
      );
      if (exists) {
        alreadyExists = true;
        return prev;
      }
      return [
        ...prev,
        {
          type: "Correction",
          section: sectionTitle,
          field: fieldName,
          comment: `Please verify and update ${fieldName} according to standard scientific reference criteria.`,
        },
      ];
    });

    // Smooth scroll to consolidated review at the bottom
    const el = document.getElementById("sec-professional-review");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    showToast(
      alreadyExists
        ? `Recommendation for ${fieldName} already exists below.`
        : `Added comment recommendation for ${fieldName}.`
    );
  };

  // Submit Handler: Request Revision
  const handleRequestRevision = async () => {
    if (!data?.activeAssignment) return;

    const cleanComments = overallAssessment.trim();
    if (!cleanComments || cleanComments.length < 10) {
      showToast("Overall professional review assessment is required (minimum 10 characters).");
      const el =
        document.getElementById("reviewer-overall-assessment") ||
        document.getElementById("sec-professional-review");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        if ("focus" in el) (el as HTMLElement).focus();
      }
      return;
    }

    if (recommendations.length === 0) {
      showToast("Please add at least one specific recommendation/correction before requesting revisions.");
      const el = document.getElementById("sec-professional-review");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        `/api/reviewer/reviews/${data.activeAssignment.assignmentId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessment: "REVISION_REQUIRED",
            comments: cleanComments,
            recommendations,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || "Failed to submit revision request.");
        return;
      }

      showToast("Revision request successfully submitted. Researcher has been notified.");

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("natureaide:review-updated", {
            detail: {
              projectId: data.activeAssignment.projectId,
              stageNumber: stageConfig.stageNumber,
              status: "REVISION_REQUIRED",
            },
          })
        );
      }

      setSuccessModal({
        isOpen: true,
        decision: "REVISION_REQUIRED",
        recommendationsCount: recommendations.length,
      });

      await loadWorkspace(data.activeAssignment.assignmentId);
    } catch (err: any) {
      console.error("Request revision error:", err);
      showToast(err.message || "Failed to submit revision request.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Handler: Approve Stage
  const handleApproveStage = async () => {
    if (!data?.activeAssignment) return;

    const cleanComments =
      overallAssessment.trim() ||
      `${stageConfig.discipline} evidence verified and acceptable.`;

    if (!cleanComments || cleanComments.length < 10) {
      showToast("Overall professional review assessment is required (minimum 10 characters).");
      const el =
        document.getElementById("reviewer-overall-assessment") ||
        document.getElementById("sec-professional-review");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        if ("focus" in el) (el as HTMLElement).focus();
      }
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        `/api/reviewer/reviews/${data.activeAssignment.assignmentId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessment: "ACCEPTABLE",
            comments: cleanComments,
            recommendations,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || "Failed to approve stage.");
        return;
      }

      showToast(`${stageConfig.discipline} approved successfully! Researcher notified.`);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("natureaide:review-updated", {
            detail: {
              projectId: data.activeAssignment.projectId,
              stageNumber: stageConfig.stageNumber,
              status: "APPROVED",
            },
          })
        );
      }

      setSuccessModal({
        isOpen: true,
        decision: "APPROVED",
        recommendationsCount: 0,
      });

      await loadWorkspace(data.activeAssignment.assignmentId);
    } catch (err: any) {
      console.error("Approve stage error:", err);
      showToast(err.message || "Failed to approve stage.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-none space-y-6 pb-12 font-sans animate-in fade-in duration-300">
        <div className="w-full bg-[#0b2447] rounded-xl border border-blue-900/60 p-6 sm:p-7 shadow-sm text-white">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-blue-900/60 rounded" />
            <div className="h-8 w-64 bg-blue-900/60 rounded" />
            <div className="h-4 w-96 bg-blue-900/60 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const activeAssignment = data?.activeAssignment;
  const snapshot = data?.snapshot || {};

  const plantName = activeAssignment?.plantName || snapshot?.plantName || "Botanical Subject";
  const plantScientificName =
    activeAssignment?.plantScientificName || snapshot?.plantScientificName || "";
  const researcherName = activeAssignment?.researcherName || "Researcher";
  const cycle = activeAssignment?.reviewRound || 1;

  // Previous recommendations from earlier cycle for resubmission view
  const previousFindings = data?.findings || [];

  return (
    <div className="w-full max-w-none space-y-6 pb-16 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER BANNER (NAVY BLUE THEME)                          */}
      {/* ============================================================== */}
      <div className="w-full bg-[#0b2447] rounded-xl border border-blue-900/60 p-6 sm:p-7 shadow-sm text-white relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <Link
              href={
                activeAssignment?.projectId
                  ? `/reviewer/projects/${activeAssignment.projectId}`
                  : "/reviewer/projects"
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-200/80 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Project Dossier</span>
            </Link>

            <span className="text-xs font-mono font-medium text-blue-300 bg-blue-950/80 border border-blue-800/40 px-2.5 py-0.5 rounded">
              Cycle {cycle} · {stageConfig.discipline}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700/50">
                  {stageConfig.discipline.toUpperCase()} REVIEW
                </span>
                <span className="text-blue-300">·</span>
                <span className="text-xs text-blue-200">
                  Researcher: <strong className="text-white font-medium">{researcherName}</strong>
                </span>
                <span className="text-blue-300">·</span>
                <span className="text-xs text-blue-200">
                  Assigned Professional: <strong className="text-white font-medium">{stageConfig.professionTitle}</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-snug">
                {plantName}{" "}
                {plantScientificName && (
                  <span className="italic text-blue-200/80 text-xl font-normal font-serif">
                    ({plantScientificName})
                  </span>
                )}
              </h1>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/reviewer/assistant"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Ask NatureAide</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. REVISION RESUBMISSION VIEW (IF ACTIVE)                      */}
      {/* ============================================================== */}
      {isResubmitted && previousFindings.length > 0 && (
        <div className="w-full rounded-2xl bg-blue-50/90 border-2 border-blue-300/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-950 font-heading">
                  REVISION RESUBMITTED · Cycle {cycle}
                </h3>
                <p className="text-xs text-blue-800">
                  Researcher has submitted corrections for {previousFindings.length} previous recommendation(s).
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold uppercase tracking-wider">
              Pending Re-evaluation
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-blue-200/70">
            {previousFindings.slice(0, 3).map((f: any, idx: number) => (
              <div
                key={`prev-finding-${f.id || idx}-${idx}`}
                className="p-3 bg-white rounded-xl border border-blue-100 text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">
                    {f.sectionName} · {f.title || f.sectionName}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium">
                    Changes Resubmitted
                  </span>
                </div>
                <p className="text-slate-600">
                  <strong className="text-slate-700 font-medium">Reviewer Note:</strong> &ldquo;{f.comment}&rdquo;
                </p>
                {f.researcherReply && (
                  <p className="text-blue-900 bg-blue-50/60 p-2 rounded border border-blue-100/70 text-[11.5px]">
                    <strong className="text-blue-950 font-semibold">Researcher Update:</strong> {f.researcherReply}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. STICKY ANCHOR NAVIGATION (CONTINUOUS ONE-PAGE SCROLL)        */}
      {/* ============================================================== */}
      <div className="sticky top-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {stageConfig.sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setActiveAnchor(sec.id);
                document.getElementById(sec.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAnchor === sec.id
                  ? "bg-[#0b2447] text-blue-200 shadow-2xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/60"
              }`}
            >
              <span className="font-mono text-[10px] opacity-75">{sec.number}</span>
              <span>{sec.title}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              document.getElementById("sec-professional-review")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Professional Review</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. SCROLLABLE STAGE CONTENT (READ-ONLY RESEARCHER DATA)         */}
      {/* ============================================================== */}
      <div className="space-y-6">
        {/* STAGE 1: FORMULATION & BOTANICAL VIEW */}
        {roleKey === "formulation" && (
          <div className="space-y-6">
            {/* Section 01: Plant Identity */}
            <section
              id="sec-identity"
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">01</span>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    Plant Identity &amp; Voucher Specimen
                  </h2>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Plant Identity", "Botanical Specimen")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Common Name</span>
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleAddInlineComment("Plant Identity", "Common Name")}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Comment
                      </button>
                    )}
                  </div>
                  <span className="font-semibold text-slate-900 block mt-1">{plantName}</span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Scientific Name</span>
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleAddInlineComment("Plant Identity", "Scientific Name")}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Comment
                      </button>
                    )}
                  </div>
                  <span className="font-semibold text-slate-900 italic block mt-1">
                    {plantScientificName || "Not specified"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Botanical Family</span>
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleAddInlineComment("Plant Identity", "Botanical Family")}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Comment
                      </button>
                    )}
                  </div>
                  <span className="font-semibold text-slate-900 block mt-1">
                    {snapshot.plantFamily || snapshot.botanicalFamily || "Documented family"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Voucher Specimen Number</span>
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleAddInlineComment("Plant Identity", "Voucher Specimen Number")}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Comment
                      </button>
                    )}
                  </div>
                  <span className="font-mono font-semibold text-slate-800 block mt-1">
                    {snapshot.voucherSpecimenNumber || "Verified Voucher Specimen"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Authentication Method</span>
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleAddInlineComment("Plant Identity", "Authentication Method")}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Comment
                      </button>
                    )}
                  </div>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {snapshot.authenticationMethod || "Macro-morphological & Taxonomic Key"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Collection Location</span>
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleAddInlineComment("Plant Identity", "Collection Location")}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Comment
                      </button>
                    )}
                  </div>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {snapshot.collectionLocation || "Luzon / Standard Regional Herbarium"}
                  </span>
                </div>
              </div>
            </section>

            {/* Section 02: Research Material */}
            <section
              id="sec-material"
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">02</span>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    Research Material &amp; Plant Parts
                  </h2>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Research Material", "Plant Parts Studied")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Plant Parts Studied</span>
                  <span className="font-semibold text-slate-900 block mt-1">
                    {snapshot.plantPartsStudied || "Leaves"}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Material Type</span>
                  <span className="font-semibold text-slate-900 block mt-1">
                    {snapshot.materialType || "Crude Standardized Extract"}
                  </span>
                </div>
                <div className="sm:col-span-2 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Selection Rationale</span>
                  <p className="text-slate-700 leading-relaxed mt-1">
                    {snapshot.selectionRationale || "Selected based on historical pharmacological precedent and traditional posology."}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 03: Extraction */}
            <section
              id="sec-extraction"
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">03</span>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    Extraction Protocol &amp; Solvent
                  </h2>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Extraction", "Extraction Solvent")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Extraction Method</span>
                  <span className="font-semibold text-slate-900 block mt-1">
                    {snapshot.extractionMethod || "Cold Maceration with Rotary Evaporation"}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Solvent</span>
                  <span className="font-semibold text-slate-900 block mt-1">
                    {snapshot.extractionSolvent || "80% Aqueous Ethanol"}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Extract Fraction</span>
                  <span className="font-semibold text-slate-900 block mt-1">
                    {snapshot.extractFractionName || "Total Ethanolic Fraction"}
                  </span>
                </div>
              </div>
            </section>

            {/* Section 04: Literature */}
            <section
              id="sec-literature"
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">04</span>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    Supporting Literature References ({snapshot.literature?.length || 0})
                  </h2>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Literature", "Peer-Reviewed References")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(snapshot.literature || []).slice(0, 5).map((ref: any, idx: number) => (
                  <div
                    key={`checking-lit-${ref.id || idx}-${idx}`}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">{ref.authors || "Primary Investigator et al."} ({ref.year || "2024"})</span>
                      {ref.pubmedId && (
                        <span className="font-mono text-slate-400">PMID: {ref.pubmedId}</span>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-900 leading-snug">{ref.title}</h4>
                    {ref.keyFindings && (
                      <p className="text-slate-600 text-[11.5px] leading-relaxed pt-1">
                        {ref.keyFindings}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Section 05: Synthesis */}
            <section
              id="sec-synthesis"
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">05</span>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    Research Synthesis
                  </h2>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Synthesis", "Research Synthesis")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed">
                {snapshot.stage1Synthesis?.keyFindings ||
                  snapshot.stage1Synthesis?.summary ||
                  "Botanical identification, authenticated voucher specimen, and extraction protocol verify that this plant extract conforms to standardized pharmacognostical quality."}
              </div>
            </section>
          </div>
        )}

        {/* STAGE 2: BIOINFORMATICS VIEW */}
        {roleKey === "bioinformatics" && (
          <div className="space-y-6">
            <section
              id="sec-compounds"
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">01</span>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    Screened Phytochemical Compounds ({snapshot.compounds?.length || 0})
                  </h2>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Screened Compounds", "Candidate Metabolites")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(snapshot.compounds || []).map((c: any, idx: number) => (
                  <div
                    key={`checking-compound-${c.id || idx}-${idx}`}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{c.compoundName}</span>
                      {c.pubchemId && (
                        <span className="font-mono text-[10px] text-slate-400">CID: {c.pubchemId}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div>Formula: <span className="font-mono font-medium">{c.molecularFormula || "—"}</span></div>
                      <div>MW: <span className="font-mono font-medium">{c.molecularWeight || "—"} g/mol</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              id="sec-screening"
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">02</span>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    ADMET &amp; Physicochemical Screening Results
                  </h2>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Screening & ADMET", "Lipinski Rule Compliance")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600">
                Computational evaluation of oral drug-likeness rules (Lipinski, Veber) and pharmacokinetic permeability.
              </p>
            </section>
          </div>
        )}

        {/* STAGE 3: PHARMACOLOGY / DOCKING VIEW */}
        {roleKey === "pharmacology" && (
          <div className="space-y-6">
            <section
              id="sec-setup"
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">01</span>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    Docking Setup &amp; Simulation Grid
                  </h2>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Docking Setup", "Receptor Target")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600">
                AutoDock Vina simulation grid coordinates, box dimensions, and receptor validation parameters.
              </p>
            </section>

            <section
              id="sec-results"
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">02</span>
                  <h2 className="text-base font-bold text-slate-900 font-heading">
                    Docking Energetics &amp; Binding Affinity
                  </h2>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Docking Results", "Binding Affinity")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(snapshot.dockingRuns || []).map((run: any, idx: number) => (
                  <div
                    key={`checking-dock-${run.id || idx}-${idx}`}
                    className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-900">{run.compoundName || `Ligand ${idx + 1}`}</span>
                    <span className="font-mono font-bold text-blue-700">{run.affinity || run.bindingAffinity || -7.2} kcal/mol</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* STAGE 4: FORMULATION SUBMISSION REVIEW */}
        {roleKey === "formulation" && (
          <div className="space-y-6">
            {/* Overview Card */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Stage 04 Submission
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      Target Delivery: {snapshot?.formulation?.dosageFormType || snapshot?.formulation?.formulationType || "Topical Hydrogel"}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 font-heading mt-1">
                    {snapshot?.formulation?.formulationName || "Formulation Development Prototype"}
                  </h2>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Formulation Design", "Formulation Architecture")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer self-start sm:self-auto"
                  >
                    + Add Comment
                  </button>
                )}
              </div>

              {snapshot?.formulation?.researchPurpose && (
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <strong className="text-slate-900">Research Purpose:</strong> {snapshot.formulation.researchPurpose}
                </div>
              )}
            </section>

            {/* Formulation Composition Matrix */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Proposed Formulation Composition Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Active botanical extracts, excipients, binders, and evidence-grounded concentrations
                  </p>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment("Formulation Composition", "Component Excipients")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>

              {snapshot?.formulation?.components && snapshot.formulation.components.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Component</th>
                        <th className="py-2.5 px-3">Role in Formulation</th>
                        <th className="py-2.5 px-3">Proposed Concentration</th>
                        <th className="py-2.5 px-3">Scientific Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {snapshot.formulation.components.map((c: any, i: number) => {
                        const isRequires = String(c.concentration || "").toLowerCase().includes("requires");
                        return (
                          <tr key={c.id || i} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{c.componentName}</span>
                                {c.isAiSuggested ? (
                                  <span className="px-1.5 py-0.2 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[9px] font-bold">
                                    AI Suggested
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-medium">
                              {c.roleInFormulation || "Component"}
                            </td>
                            <td className="py-2.5 px-3">
                              {isRequires ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold">
                                  Requires Experimental Validation
                                </span>
                              ) : (
                                <span className="font-mono text-xs font-bold text-emerald-900">
                                  {c.concentration || c.quantity || "N/A"}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs">
                              {c.notes || c.sourceReference || "Standard formulation excipient."}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  No composition components documented yet.
                </p>
              )}
            </section>

            {/* Scientific Rationale & Compounding Protocol */}
            {(snapshot?.formulation?.researcherRationale || (snapshot?.formulation?.steps && snapshot.formulation.steps.length > 0)) && (
              <section className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    Scientific Rationale & Compounding Protocol
                  </h3>
                  {!isApproved && (
                    <button
                      type="button"
                      onClick={() => handleAddInlineComment("Scientific Rationale", "SOP Protocol")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      + Add Comment
                    </button>
                  )}
                </div>

                {snapshot?.formulation?.researcherRationale && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">Formulation Rationale:</h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                      {snapshot.formulation.researcherRationale}
                    </p>
                  </div>
                )}

                {snapshot?.formulation?.steps && snapshot.formulation.steps.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-800">Compounding SOP Steps:</h4>
                    <div className="space-y-1.5">
                      {snapshot.formulation.steps.map((st: any) => (
                        <div key={st.stepNumber || st.id} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {st.stepNumber}
                          </span>
                          <span className="leading-relaxed">{st.procedureText || st.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* SECTION 3: CLINICAL SAFETY & PAPER SUBMISSION REVIEW */}
        {roleKey === "pharmacology" && (
          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  {stageConfig.stageTitle} Submission Data
                </h2>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => handleAddInlineComment(stageConfig.stageTitle, "Clinical Safety Protocol")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + Add Comment
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600">
                Verified research dossier records submitted by {researcherName}. Review the clinical safety assessment below.
              </p>
            </section>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. ONE CONSOLIDATED PROFESSIONAL REVIEW FORM                   */}
      {/* ============================================================== */}
      <ConsolidatedProfessionalReviewForm
        professionTitle={stageConfig.professionTitle}
        discipline={stageConfig.discipline}
        stageTitle={stageConfig.stageTitle}
        sections={stageConfig.sections}
        overallAssessment={overallAssessment}
        onChangeOverallAssessment={setOverallAssessment}
        recommendations={recommendations}
        onAddRecommendation={(rec) =>
          setRecommendations((prev) => {
            const exists = prev.some(
              (r) =>
                r.section.toLowerCase() === rec.section.toLowerCase() &&
                (r.field || "").toLowerCase() === (rec.field || "").toLowerCase() &&
                r.comment.trim().toLowerCase() === rec.comment.trim().toLowerCase()
            );
            if (exists) return prev;
            return [...prev, rec];
          })
        }
        onUpdateRecommendation={(idx, rec) =>
          setRecommendations((prev) => prev.map((item, i) => (i === idx ? rec : item)))
        }
        onRemoveRecommendation={(idx) =>
          setRecommendations((prev) => prev.filter((_, i) => i !== idx))
        }
        aiSuggestions={aiSuggestions}
        onDismissAiSuggestion={(id) =>
          setAiSuggestions((prev) => prev.filter((s) => s.id !== id))
        }
        isReadOnly={isApproved}
      />

      {/* ============================================================== */}
      {/* 6. ONE CONSISTENT REVIEWER FOOTER                              */}
      {/* ============================================================== */}
      <ReviewerStageFooter
        stageNumber={stageConfig.stageNumber}
        stageTitle={stageConfig.stageTitle}
        cycle={cycle}
        discipline={stageConfig.discipline}
        reviewStatus={
          isApproved
            ? "APPROVED"
            : activeAssignment?.assignmentStatus === "REVISION_REQUIRED"
            ? "REVISION_REQUIRED"
            : isResubmitted
            ? "REVISION_RESUBMITTED"
            : "IN_REVIEW"
        }
        reviewerName={
          data?.review?.reviewerName ||
          data?.assignedReviewerName ||
          activeAssignment?.assignedReviewerName ||
          "Professional Reviewer"
        }
        approvedAt={data?.review?.submittedAt || activeAssignment?.completedAt || null}
        onRequestRevision={handleRequestRevision}
        onApprove={handleApproveStage}
        isSubmitting={submitting}
        isApproved={isApproved}
        isResubmitted={isResubmitted}
      />

      {/* ============================================================== */}
      {/* 7. REVIEW DECISION SUCCESS MODAL                               */}
      {/* ============================================================== */}
      <ReviewDecisionSuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal((prev) => ({ ...prev, isOpen: false }))}
        decision={successModal.decision}
        stageNumber={stageConfig.stageNumber}
        stageTitle={stageConfig.stageTitle}
        discipline={stageConfig.discipline}
        professionTitle={stageConfig.professionTitle}
        cycle={cycle}
        projectId={activeAssignment?.projectId || 0}
        recommendationsCount={successModal.recommendationsCount}
      />
    </div>
  );
}
