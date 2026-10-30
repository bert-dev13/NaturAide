"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dna,
  Download,
  Eye,
  FileCheck,
  FileText,
  FlaskConical,
  History,
  Info,
  Leaf,
  Loader2,
  Lock,
  MessageSquare,
  Microscope,
  Pill,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";

import { EXPERT_REVIEW_AREAS, expertReviewAreaLabel, type ExpertReviewAreaKey } from "@/lib/expert-review-areas";
import {
  ResearchSection,
  ResearchStageHeader,
  STAGE_PAGE_CLASS,
  WORKSPACE_PRIMARY_BTN,
  WORKSPACE_SECONDARY_BTN,
  WORKSPACE_TEXTAREA,
} from "@/components/researcher/stage/ResearchWorkspaceUI";
import { ResearchStageFooter } from "@/components/researcher/stage/ResearchStageFooter";

interface Props {
  projectId: number;
}

type Phase = "prepare" | "review" | "revisions" | "approved";

const AREA_META: Record<
  string,
  { label: string; icon: LucideIcon; stageName: string; stagePath: string; description: string }
> = {
  pharmacognosy: {
    label: "Pharmacognosy",
    icon: Leaf,
    stageName: "Stage 1 · Plant & Literature",
    stagePath: "plant-literature",
    description: "Plant identity, phytochemicals, extraction and literature",
  },
  bioinformatics: {
    label: "Bioinformatics",
    icon: Dna,
    stageName: "Stage 2 & 3 · In-Silico & Docking",
    stagePath: "in-silico",
    description: "In-silico screening and molecular docking",
  },
  pharmacology: {
    label: "Pharmacology",
    icon: Pill,
    stageName: "Stage 4 · Formulation & Safety",
    stagePath: "formulation-safety",
    description: "Mechanism, activity and safety evidence",
  },
  pharmacy: {
    label: "Formulation",
    icon: FlaskConical,
    stageName: "Stage 4 · Formulation & Safety",
    stagePath: "formulation-safety",
    description: "Preparation, formulation and concentration",
  },
  clinical: {
    label: "Clinical",
    icon: Stethoscope,
    stageName: "Stage 4 & 5 · Safety & Integration",
    stagePath: "formulation-safety",
    description: "Contraindications, interactions and clinical relevance",
  },
};

function formatDate(isoString?: string | null): string {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export default function ExpertReviewClient({ projectId }: Props) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Data state
  const [project, setProject] = useState<any>(null);
  const [stageMap, setStageMap] = useState<Record<string, string>>({});
  const [isReadyForReview, setIsReadyForReview] = useState(false);
  const [readiness, setReadiness] = useState<Record<string, boolean>>({});
  const [latestSubmission, setLatestSubmission] = useState<any>(null);
  const [latestDecision, setLatestDecision] = useState<any>(null);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({ total: 0, open: 0, addressed: 0 });
  const [dossier, setDossier] = useState<any>(null);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [coverageAreas, setCoverageAreas] = useState<any[]>([]);
  const [approvalStats, setApprovalStats] = useState<any>(null);

  // UI state
  const [messageToReviewer, setMessageToReviewer] = useState("");
  const [revisionSummary, setRevisionSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Response inputs per feedback ID
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [savingFeedbackId, setSavingFeedbackId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/researcher/projects/${projectId}/expert-review`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to fetch Stage 6 data (${res.status})`);
      }
      const data = await res.json();
      setProject(data.project);
      setStageMap(data.stageMap || {});
      setIsReadyForReview(Boolean(data.isReadyForReview));
      setReadiness(data.readiness || {});
      setLatestSubmission(data.latestSubmission);
      setLatestDecision(data.latestDecision);
      setFeedbackList(data.feedbackList || []);
      setCounts(data.counts || { total: 0, open: 0, addressed: 0 });
      setDossier(data.dossier);
      setReviewHistory(data.reviewHistory || []);
      setCoverageAreas(data.coverageAreas || []);
      setApprovalStats(data.approvalStats || null);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to load review workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Determine current phase
  let phase: Phase = "prepare";
  if (approvalStats?.isFullyApproved || latestDecision?.decision === "ACCEPT_FOR_NEXT_STAGE" || project?.status === "COMPLETED") {
    phase = "approved";
  } else if (approvalStats?.revisionCount > 0 || latestDecision?.decision === "REQUEST_REVISION" || latestSubmission?.status === "REVISION_REQUESTED") {
    phase = "revisions";
  } else if (latestSubmission) {
    phase = "review";
  }

  // Handle Initial Submission
  const handleSubmitDossier = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/expert-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          messageToReviewers: messageToReviewer.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setShowSubmitModal(false);
      setMessageToReviewer("");
      setActionSuccessMsg("Dossier successfully submitted for professional review.");
      await fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Resubmission after revisions
  const handleResubmitDossier = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/expert-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resubmit",
          revisionSummary: revisionSummary.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resubmission failed");
      setShowResubmitModal(false);
      setRevisionSummary("");
      setActionSuccessMsg("Revised dossier successfully resubmitted for review.");
      await fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Resubmission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Response to Feedback
  const handleSaveResponse = async (feedbackId: number) => {
    const replyText = replyInputs[feedbackId]?.trim();
    if (!replyText) return;
    setSavingFeedbackId(feedbackId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/expert-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-response",
          feedbackId,
          researcherReply: replyText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save response");
      setReplyInputs((prev) => ({ ...prev, [feedbackId]: "" }));
      await fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to save response");
    } finally {
      setSavingFeedbackId(null);
    }
  };

  // Handle Mark as Addressed
  const handleMarkAddressed = async (feedbackId: number) => {
    setSavingFeedbackId(feedbackId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/expert-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark-addressed",
          feedbackId,
          note: replyInputs[feedbackId]?.trim() || "Addressed and verified by researcher.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark addressed");
      setReplyInputs((prev) => ({ ...prev, [feedbackId]: "" }));
      await fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to mark addressed");
    } finally {
      setSavingFeedbackId(null);
    }
  };

  // Export Dossier Text
  const handleExportDossier = () => {
    if (!dossier || !project) return;
    const lines = [
      `# NatureAide Complete Research Dossier`,
      `Project: ${project.title}`,
      `Plant: ${project.plantName} (${project.plantScientificName || "N/A"})`,
      `Date Generated: ${new Date().toLocaleDateString()}`,
      `Review Status: ${phase.toUpperCase()}`,
      ``,
      `## 1. Botanical Material & Extraction`,
      `- Parts Studied: ${dossier.plantPartsStudied || "Leaves"}`,
      `- Extraction Method: ${dossier.extractionMethod || "Cold Maceration"}`,
      `- Solvent: ${dossier.extractionSolvent || "Aqueous Ethanol"}`,
      `- Material Type: ${dossier.materialType || "Crude Extract"}`,
      ``,
      `## 2. Evidence Overview`,
      `- Stage 1 (Plant & Literature): ${dossier.stages?.stage1?.count || 0} Supporting Studies`,
      `- Stage 2 (In-Silico Analysis): ${dossier.stages?.stage2?.count || 0} Screened Compounds`,
      `- Stage 3 (Molecular Docking): ${dossier.stages?.stage3?.count || 0} Docking Runs`,
      `- Stage 4 (Formulation & Safety): ${dossier.stages?.stage4?.prototype || "Extract Prototype"} (${dossier.stages?.stage4?.dosageForm || "Oral Solution"})`,
      ``,
      `## 3. Approved Research Synthesis`,
      `### Evidence Alignment`,
      `${dossier.evidenceAlignment || "Alignment established across stages."}`,
      ``,
      `### Key Findings`,
      ...(dossier.keyFindings || []).map((f: string) => `- ${f}`),
      ``,
      `### Scientific Interpretation`,
      `${dossier.scientificInterpretation || "Multi-stage findings validated."}`,
      ``,
      `### Limitations & Gaps`,
      `${dossier.limitations || "None noted."}`,
      ``,
      `### Final Conclusion`,
      `${dossier.finalConclusion || "Research synthesis verified."}`,
      ``,
      `## 4. Professional Scientific Review Record`,
      `- Overall Status: ${phase === "approved" ? "APPROVED (5/5 Scientific Disciplines Verified)" : phase.toUpperCase()}`,
      `- Review Cycle: Cycle ${latestSubmission?.reviewRound || 1}`,
      `- Approval Date: ${latestDecision?.decidedAt ? new Date(latestDecision.decidedAt).toLocaleDateString() : new Date().toLocaleDateString()}`,
      `- Pharmacognosy Review: ${coverageAreas.find((a: any) => a.key === "pharmacognosy")?.isApproved ? "Approved ✓" : "Pending / In Progress"}`,
      `- Bioinformatics Review: ${coverageAreas.find((a: any) => a.key === "bioinformatics")?.isApproved ? "Approved ✓" : "Pending / In Progress"}`,
      `- Pharmacology Review: ${coverageAreas.find((a: any) => a.key === "pharmacology")?.isApproved ? "Approved ✓" : "Pending / In Progress"}`,
      `- Formulation Review: ${coverageAreas.find((a: any) => a.key === "pharmacy")?.isApproved ? "Approved ✓" : "Pending / In Progress"}`,
      `- Clinical Safety Review: ${coverageAreas.find((a: any) => a.key === "clinical")?.isApproved ? "Approved ✓" : "Pending / In Progress"}`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NatureAide_Dossier_${project.plantName || "Research"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={STAGE_PAGE_CLASS}>
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="font-mono text-xs uppercase tracking-wider text-[#52645d]">
            Loading Stage 6 Professional Review Workspace...
          </p>
        </div>
      </div>
    );
  }

  const openRevisionsCount = counts.open || 0;
  const canResubmit = phase === "revisions" && openRevisionsCount === 0;

  return (
    <div className={STAGE_PAGE_CLASS}>
      {/* ========================================================
          PAGE HEADER (System shared with Stages 1–5)
          ======================================================== */}
      <ResearchStageHeader
        projectId={projectId}
        stageNumber={6}
        stageTitle={phase === "approved" ? "Research Professionally Reviewed" : "Final Professional Review"}
        plantCommonName={project?.plantName}
        plantScientificName={project?.plantScientificName}
        statusLabel={
          phase === "prepare"
            ? isReadyForReview
              ? "Ready to Submit"
              : "Prerequisites Incomplete"
            : phase === "review"
            ? "Under Review"
            : phase === "revisions"
            ? `${openRevisionsCount} Revision${openRevisionsCount === 1 ? "" : "s"} Requested`
            : "Approved"
        }
        complete={phase === "approved"}
        contextualAction={
          <button
            type="button"
            onClick={() => setShowDossierModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-emerald-200 hover:text-white text-xs font-bold backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>{phase === "approved" ? "Final Dossier" : "Preview Dossier"}</span>
          </button>
        }
      />

      {/* Global Alerts */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================
          PROGRESS TRACKER (Submitted -> Scientific Review -> Revisions -> Final Decision)
          ======================================================== */}
      {phase !== "prepare" && (
        <div className="rounded-3xl border border-[#dde6df] bg-white p-5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                id: "submitted",
                label: "Submitted",
                desc: formatDate(latestSubmission?.submittedAt),
                isDone: true,
                isActive: phase === "review" && !latestDecision,
              },
              {
                id: "review",
                label: "Scientific Review",
                desc: phase === "review" ? "In evaluation" : "5 areas evaluated",
                isDone: phase === "approved" || phase === "revisions",
                isActive: phase === "review",
              },
              {
                id: "revisions",
                label: "Revisions",
                desc:
                  phase === "revisions"
                    ? `${openRevisionsCount} open`
                    : phase === "approved"
                    ? "Addressed"
                    : "None requested",
                isDone: phase === "approved",
                isActive: phase === "revisions",
                accent: phase === "revisions",
              },
              {
                id: "decision",
                label: "Final Decision",
                desc: phase === "approved" ? "Approved" : "Pending completion",
                isDone: phase === "approved",
                isActive: phase === "approved",
              },
            ].map((step, idx) => {
              const activeClass = step.isActive
                ? step.accent
                  ? "border-amber-400 bg-amber-50/70 text-amber-950 ring-2 ring-amber-300"
                  : "border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-300"
                : step.isDone
                ? "border-emerald-200 bg-[#f7faf8] text-[#0f2c20]"
                : "border-slate-200 bg-slate-50/50 text-slate-400";

              return (
                <div key={idx} className={`p-3.5 rounded-2xl border transition-all ${activeClass}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider">
                      0{idx + 1}
                    </span>
                    {step.isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="mt-2 font-black text-xs">{step.label}</div>
                  <div className="mt-0.5 text-[11px] opacity-80 truncate">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          REVIEW STATUS BAR (When submitted, under review, revisions, or approved)
          ======================================================== */}
      {phase !== "prepare" && (
        <div className="rounded-3xl border border-[#dde6df] bg-[#f7faf8] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 text-xs">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#697d72]">Submitted</span>
              <p className="font-bold text-[#0f2c20] mt-0.5">{formatDate(latestSubmission?.submittedAt)}</p>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#697d72]">Review Cycle</span>
              <p className="font-mono font-bold text-[#0f2c20] mt-0.5">
                Cycle {latestSubmission?.reviewRound || 1}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#697d72]">Review Coverage</span>
              <p className="font-bold text-emerald-800 mt-0.5">5 scientific areas</p>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#697d72]">Open Comments</span>
              <p className={`font-mono font-bold mt-0.5 ${openRevisionsCount > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                {openRevisionsCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDossierModal(true)}
              className={WORKSPACE_SECONDARY_BTN}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-700" />
              <span>{phase === "approved" ? "View Final Dossier" : "View Dossier"}</span>
            </button>
            <button
              type="button"
              onClick={handleExportDossier}
              className={WORKSPACE_SECONDARY_BTN}
            >
              <Download className="w-3.5 h-3.5 text-slate-700" />
              <span>Export Dossier</span>
            </button>
            {reviewHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className={WORKSPACE_SECONDARY_BTN}
              >
                <History className="w-3.5 h-3.5 text-indigo-700" />
                <span>History</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          AGGREGATED PROFESSIONAL REVIEW (5 SCIENTIFIC AREAS)
          ======================================================== */}
      {phase !== "prepare" && coverageAreas.length > 0 && (
        <div className="rounded-3xl border border-[#dde6df] bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#dde6df] pb-3">
            <div>
              <h3 className="font-heading font-black text-base text-[#0f2c20]">
                Professional Review
              </h3>
              <p className="text-xs text-[#52645d]">
                Independent peer evaluation across five authorized scientific disciplines
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-950 border border-emerald-200 text-xs font-bold">
              {approvalStats?.progressText || `${coverageAreas.filter((a: any) => a.isApproved).length} of 5 professional reviews approved`}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {coverageAreas.map((area: any) => {
              const isApproved = area.isApproved;
              const isRevision = area.isRevisionRequired;
              const isInReview = area.isInReview;

              return (
                <div
                  key={area.key}
                  className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                    isApproved
                      ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                      : isRevision
                      ? "bg-amber-50/80 border-amber-300 text-amber-950"
                      : isInReview
                      ? "bg-blue-50/70 border-blue-300 text-blue-950"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{area.label}</span>
                    {isApproved && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                    {isRevision && <TriangleAlert className="w-3.5 h-3.5 text-amber-600" />}
                    {isInReview && <Clock className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div className="text-[11px] font-bold">
                    {isApproved ? (
                      <span className="text-emerald-700">Approved ✓</span>
                    ) : isRevision ? (
                      <span className="text-amber-700">Revision Requested</span>
                    ) : isInReview ? (
                      <span className="text-blue-700">In Review</span>
                    ) : (
                      <span className="text-slate-500">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          PHASE A: PRE-SUBMISSION (Only 3 clean sections)
          ======================================================== */}
      {phase === "prepare" && (
        <div className="space-y-8">
          {/* 01 — Final Research Dossier Summary */}
          <ResearchSection
            icon={FileCheck}
            title="01 — Final Research Dossier"
            subtitle="Complete multi-stage scientific evidence integrated from Stages 1–5"
            badge="5 Stages Integrated"
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDossierModal(true)}
                  className={WORKSPACE_SECONDARY_BTN}
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preview Dossier</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportDossier}
                  className={WORKSPACE_SECONDARY_BTN}
                >
                  <Download className="w-3.5 h-3.5 text-slate-700" />
                  <span>Export Dossier</span>
                </button>
              </div>
            }
          >
            {/* Visual completion summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {
                  stage: "Stage 1",
                  name: "Plant & Literature",
                  desc: `${dossier?.stages?.stage1?.count || 0} studies`,
                  done: readiness.stage1 ?? true,
                },
                {
                  stage: "Stage 2",
                  name: "In-Silico Analysis",
                  desc: `${dossier?.stages?.stage2?.count || 0} compounds`,
                  done: readiness.stage2 ?? true,
                },
                {
                  stage: "Stage 3",
                  name: "Molecular Docking",
                  desc: `${dossier?.stages?.stage3?.count || 0} AutoDock runs`,
                  done: readiness.stage3 ?? true,
                },
                {
                  stage: "Stage 4",
                  name: "Formulation & Safety",
                  desc: dossier?.stages?.stage4?.prototype || "Extract Prototype",
                  done: readiness.stage4 ?? true,
                },
                {
                  stage: "Stage 5",
                  name: "Research Integration",
                  desc: "Synthesis Approved",
                  done: readiness.stage5 ?? true,
                },
              ].map((st, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl border border-emerald-200 bg-[#f7faf8] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black uppercase text-[#697d72]">
                      {st.stage}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 font-black text-xs text-[#0f2c20]">{st.name}</div>
                  <div className="mt-0.5 text-[11px] text-[#52645d] truncate">{st.desc}</div>
                </div>
              ))}
            </div>

            {/* Dossier Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-sm text-[#0f2c20]">Complete Research Dossier</h4>
                <p className="text-xs text-[#52645d] mt-0.5">
                  5 research stages integrated · Ready for independent professional evaluation.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDossierModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-950 font-bold text-xs shadow-2xs hover:bg-emerald-50 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preview Dossier</span>
                </button>
              </div>
            </div>
          </ResearchSection>

          {/* 02 — Professional Review Coverage */}
          <ResearchSection
            icon={ShieldCheck}
            title="02 — Professional Review Coverage"
            subtitle="Evaluated by independent NatureAide Professional Reviewer across 5 key scientific domains"
            badge="5 Scientific Areas"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {EXPERT_REVIEW_AREAS.map((area) => {
                const meta = AREA_META[area.key] || {
                  label: area.shortLabel,
                  icon: ShieldCheck,
                  description: area.detail,
                };
                const IconComponent = meta.icon;

                return (
                  <div
                    key={area.key}
                    className="p-4 rounded-2xl border border-[#dde6df] bg-[#f7faf8] hover:border-emerald-300 hover:bg-white transition-all flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-black text-xs text-[#0f2c20]">{meta.label}</span>
                    </div>
                    <p className="text-[11px] text-[#52645d] leading-relaxed line-clamp-2">
                      {meta.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </ResearchSection>

          {/* 03 — Submission */}
          <ResearchSection
            icon={Send}
            title="03 — Submission"
            subtitle="Submit complete research dossier to the NatureAide Professional Review panel"
          >
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#dde6df] space-y-2">
                <h4 className="font-black text-sm text-[#0f2c20]">Ready for Professional Review</h4>
                <p className="text-xs text-[#52645d] leading-relaxed">
                  Your completed research dossier will be submitted to the NatureAide Professional Review
                  account for evaluation across all five scientific areas. Once submitted, the dossier enters
                  formal review.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-emerald-800">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Complete dossier snapshot
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Research synthesis approved
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Five review areas included
                  </span>
                </div>
              </div>

              {/* Message to Reviewer */}
              <div>
                <label className="block text-xs font-black text-[#0f2c20] uppercase tracking-wider mb-1.5">
                  Message to Reviewer <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <textarea
                  value={messageToReviewer}
                  onChange={(e) => setMessageToReviewer(e.target.value)}
                  placeholder="Add context or notes for the professional reviewer..."
                  rows={3}
                  className={WORKSPACE_TEXTAREA}
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  disabled={!isReadyForReview || submitting}
                  className={WORKSPACE_PRIMARY_BTN}
                >
                  <span>Submit for Professional Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </ResearchSection>
        </div>
      )}

      {/* ========================================================
          PHASE B: UNDER REVIEW
          ======================================================== */}
      {phase === "review" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 via-emerald-50/50 to-white shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-teal-900 font-black text-sm">
              <Clock className="w-5 h-5 text-teal-600 animate-pulse" />
              <span>Dossier Currently Under Independent Review</span>
            </div>
            <p className="text-xs text-[#52645d] leading-relaxed max-w-3xl">
              The professional reviewer is currently evaluating your submitted research dossier across all five
              scientific areas: Pharmacognosy, Bioinformatics, Pharmacology, Formulation, and Clinical Safety.
              You will be notified as feedback or requested revisions are registered.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDossierModal(true)}
                className={WORKSPACE_SECONDARY_BTN}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                <span>Preview Submitted Dossier</span>
              </button>
              <button
                type="button"
                onClick={handleExportDossier}
                className={WORKSPACE_SECONDARY_BTN}
              >
                <Download className="w-3.5 h-3.5 text-slate-700" />
                <span>Export Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PHASE C: REVISIONS WORKSPACE & FEEDBACK
          ======================================================== */}
      {(phase === "revisions" || feedbackList.length > 0) && (
        <div className="space-y-6">
          {phase === "revisions" && (
            <div
              className={`p-5 rounded-3xl border ${
                openRevisionsCount > 0
                  ? "border-amber-300 bg-amber-50/80 text-amber-950"
                  : "border-emerald-300 bg-emerald-50/80 text-emerald-950"
              } shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-3">
                {openRevisionsCount > 0 ? (
                  <TriangleAlert className="w-6 h-6 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                )}
                <div>
                  <h3 className="font-black text-sm">
                    {openRevisionsCount > 0
                      ? `${openRevisionsCount} Revision${openRevisionsCount === 1 ? "" : "s"} Requested`
                      : "All Revisions Addressed"}
                  </h3>
                  <p className="text-xs opacity-90 mt-0.5">
                    {openRevisionsCount > 0
                      ? "Please respond to reviewer comments and update related stages where necessary."
                      : "All requested revisions have been addressed. You can now resubmit the revised dossier."}
                  </p>
                </div>
              </div>

              {canResubmit && (
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(true)}
                  className={WORKSPACE_PRIMARY_BTN}
                >
                  <span>Resubmit Revised Dossier</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Feedback grouped by scientific areas */}
          <ResearchSection
            icon={MessageSquare}
            title="Professional Feedback"
            subtitle="Comments and revision requests organized across the five scientific review areas"
            badge={`${feedbackList.length} Comments`}
          >
            {feedbackList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#697d72] bg-[#f7faf8] rounded-2xl border border-[#dde6df]">
                No comments registered yet.
              </div>
            ) : (
              <div className="space-y-5">
                {EXPERT_REVIEW_AREAS.map((area) => {
                  const areaComments = feedbackList.filter(
                    (f) =>
                      f.sectionKey === area.key ||
                      f.sectionName?.toLowerCase().includes(area.key) ||
                      f.affectedSection?.toLowerCase().includes(area.key)
                  );
                  if (areaComments.length === 0) return null;

                  const meta = AREA_META[area.key] || {
                    label: area.shortLabel,
                    icon: ShieldCheck,
                    stageName: "Related Stage",
                    stagePath: "completion-integration",
                  };
                  const IconComp = meta.icon;

                  return (
                    <div key={area.key} className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-[#dde6df]">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-mono text-xs font-black uppercase tracking-wider text-[#0f2c20]">
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-[#697d72] font-semibold">
                          ({areaComments.length})
                        </span>
                      </div>

                      <div className="space-y-3">
                        {areaComments.map((fb) => {
                          const isAddressed = fb.status === "ADDRESSED" || Boolean(fb.researcherResponse);
                          const isSavingThis = savingFeedbackId === fb.id;

                          return (
                            <div
                              key={fb.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                isAddressed
                                  ? "border-emerald-200 bg-[#f7faf8]"
                                  : "border-amber-200 bg-white shadow-xs"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono text-[10px] font-black uppercase">
                                      {meta.label}
                                    </span>
                                    {fb.severity && (
                                      <span
                                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                                          fb.severity.toLowerCase() === "critical"
                                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                                            : fb.severity.toLowerCase() === "major"
                                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                                            : "bg-sky-100 text-sky-800 border border-sky-300"
                                        }`}
                                      >
                                        {fb.severity} Severity
                                      </span>
                                    )}
                                    {fb.title && (
                                      <h5 className="font-bold text-xs text-[#0f2c20]">
                                        {fb.title}
                                      </h5>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-[#52645d]">
                                    <span className="font-medium">
                                      Section: {fb.sectionName || fb.affectedSection || meta.label}
                                    </span>
                                    {fb.referenceLink && (
                                      <>
                                        <span>•</span>
                                        <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                          Evidence: {fb.referenceLink}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                                      isAddressed
                                        ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                                        : "bg-amber-100 text-amber-950 border border-amber-300"
                                    }`}
                                  >
                                    {isAddressed ? "Addressed ✓" : "Revision Requested"}
                                  </span>
                                  <Link
                                    href={`/researcher/projects/${projectId}/${meta.stagePath}`}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                                  >
                                    <span>Open Related Research</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>

                              {/* Reviewer Comment / Finding */}
                              <div className="my-2 space-y-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#52645d] block">
                                  Reviewer Finding:
                                </span>
                                <blockquote className="p-3 rounded-xl bg-slate-50 border-l-4 border-amber-400 text-xs text-[#33463e] italic leading-relaxed">
                                  {fb.comment || fb.commentText}
                                </blockquote>
                              </div>

                              {/* Requested Action */}
                              {fb.recommendation && (
                                <div className="mb-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                                  <div className="font-bold text-[11px] text-amber-900 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Requested Action:</span>
                                  </div>
                                  <p className="leading-relaxed pl-5">{fb.recommendation}</p>
                                </div>
                              )}

                              {/* Researcher Reply Display */}
                              {isAddressed && fb.researcherResponse && (
                                <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-800">
                                    <Check className="w-3 h-3" />
                                    <span>Researcher Response:</span>
                                  </div>
                                  <p className="leading-relaxed pl-4.5">{fb.researcherResponse}</p>
                                </div>
                              )}

                              {/* Response Form when unaddressed */}
                              {!isAddressed && (
                                <div className="mt-3 pt-3 border-t border-[#edf2ee] space-y-2">
                                  <textarea
                                    value={replyInputs[fb.id] || ""}
                                    onChange={(e) =>
                                      setReplyInputs((prev) => ({ ...prev, [fb.id]: e.target.value }))
                                    }
                                    placeholder="Write response or explanation of revisions made..."
                                    rows={2}
                                    className={WORKSPACE_TEXTAREA}
                                  />
                                  <div className="flex items-center justify-between">
                                    <Link
                                      href={`/researcher/projects/${projectId}/${meta.stagePath}`}
                                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                                    >
                                      <span>Open Related Research ({meta.stageName})</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </Link>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleMarkAddressed(fb.id)}
                                        disabled={isSavingThis}
                                        className={WORKSPACE_SECONDARY_BTN}
                                      >
                                        <span>Mark Addressed</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveResponse(fb.id)}
                                        disabled={isSavingThis || !replyInputs[fb.id]?.trim()}
                                        className={WORKSPACE_PRIMARY_BTN}
                                      >
                                        {isSavingThis ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Send className="w-3.5 h-3.5" />
                                        )}
                                        <span>Respond</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ResearchSection>
        </div>
      )}

      {/* ========================================================
          PHASE D: FINAL APPROVAL
          ======================================================== */}
      {phase === "approved" && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-[#082218] text-white shadow-xl text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">Research Professionally Reviewed</h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl mx-auto mt-1">
                Your research dossier has received independent professional approval across all 5 scientific
                areas. This research project is now officially complete.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2 text-left">
              <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-[10px] uppercase font-mono text-emerald-200">Final Decision</span>
                <p className="font-black text-sm text-white mt-0.5">Approved</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-[10px] uppercase font-mono text-emerald-200">Review Cycle</span>
                <p className="font-black text-sm text-white mt-0.5">
                  Cycle {latestSubmission?.reviewRound || 1}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-[10px] uppercase font-mono text-emerald-200">Coverage</span>
                <p className="font-black text-sm text-white mt-0.5">5 / 5 Areas</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-[10px] uppercase font-mono text-emerald-200">Approved Date</span>
                <p className="font-black text-sm text-white mt-0.5 truncate">
                  {formatDate(latestDecision?.decidedAt || project?.completedAt)}
                </p>
              </div>
            </div>

            {/* 5/5 Professional Review Coverage Breakdown */}
            <div className="max-w-2xl mx-auto pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-left">
                {[
                  { key: "pharmacognosy", label: "Pharmacognosy" },
                  { key: "bioinformatics", label: "Bioinformatics" },
                  { key: "pharmacology", label: "Pharmacology" },
                  { key: "pharmacy", label: "Formulation" },
                  { key: "clinical", label: "Clinical Safety" },
                ].map((item) => (
                  <div key={item.key} className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                    <span className="text-[10px] font-bold text-emerald-200 block truncate">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span className="text-xs font-black text-white">Approved</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(latestDecision?.overallAssessment || latestDecision?.additionalRecommendations) && (
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 max-w-2xl mx-auto text-left text-xs text-emerald-100 leading-relaxed">
                <span className="font-bold block text-white mb-1">Reviewer Assessment & Remarks:</span>
                <p>{latestDecision.overallAssessment || latestDecision.additionalRecommendations}</p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDossierModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-black text-xs shadow-md hover:bg-emerald-50 transition-all"
              >
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>View Final Dossier</span>
              </button>
              <button
                type="button"
                onClick={handleExportDossier}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 border border-white/25 text-white font-black text-xs hover:bg-white/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Dossier</span>
              </button>
              {reviewHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 border border-white/25 text-white font-black text-xs hover:bg-white/25 transition-all"
                >
                  <History className="w-4 h-4" />
                  <span>Review History</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SHARED FOOTER COMPONENT (Standardized across all stages)
          ======================================================== */}
      <ResearchStageFooter
        projectId={projectId}
        stageNumber={6}
        stageTitle="Final Professional Review"
        backHref={`/researcher/projects/${projectId}/completion-integration`}
        backLabel="Back to Stage 5"
        statusMessage={
          phase === "prepare"
            ? isReadyForReview
              ? "Dossier Ready for Submission"
              : "Prerequisites Incomplete"
            : phase === "review"
            ? "Waiting for Review Panel"
            : phase === "revisions"
            ? openRevisionsCount > 0
              ? `${openRevisionsCount} revision${openRevisionsCount === 1 ? "" : "s"} require attention`
              : "Revisions Addressed · Ready to Resubmit"
            : "Final Approval Recorded"
        }
        secondaryAction={{
          label: phase === "approved" ? "View Final Dossier" : "Preview Dossier",
          onClick: () => setShowDossierModal(true),
          icon: Eye,
        }}
        primaryAction={
          phase === "prepare"
            ? {
                label: "Submit for Professional Review",
                onClick: () => setShowSubmitModal(true),
                disabled: !isReadyForReview || submitting,
                loading: submitting,
                icon: Send,
              }
            : phase === "revisions" && canResubmit
            ? {
                label: "Resubmit Revised Dossier",
                onClick: () => setShowResubmitModal(true),
                disabled: submitting,
                loading: submitting,
                icon: Send,
              }
            : undefined
        }
      />

      {/* ========================================================
          CONFIRMATION MODAL: SUBMIT DOSSIER
          ======================================================== */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#dde6df] shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0f2c20]">Submit Final Research Dossier?</h3>
                  <p className="text-xs text-[#52645d]">Stage 6 · Final Professional Review</p>
                </div>
              </div>

              <p className="text-xs text-[#33463e] leading-relaxed">
                Once submitted, the dossier enters professional review. The NatureAide Professional Review
                panel will evaluate the evidence across all five scientific domains. You can respond to
                comments and requested revisions directly from this stage.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#52645d] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#0f2c20]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>5 Stages Included in Snapshot</span>
                </div>
                <p className="text-[11px]">
                  Plant & Literature · In-Silico Analysis · Molecular Docking · Formulation & Safety · Research
                  Integration
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitDossier}
                  disabled={submitting}
                  className={WORKSPACE_PRIMARY_BTN}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Dossier</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          CONFIRMATION MODAL: RESUBMIT REVISED DOSSIER
          ======================================================== */}
      <AnimatePresence>
        {showResubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#dde6df] shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0f2c20]">Resubmit Revised Dossier?</h3>
                  <p className="text-xs text-[#52645d]">
                    Begin Review Cycle {(latestSubmission?.reviewRound || 1) + 1}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#33463e] leading-relaxed">
                All requested revisions have been addressed. This will create the next review cycle and send
                the updated dossier to the professional reviewer for re-evaluation.
              </p>

              <div>
                <label className="block text-xs font-black text-[#0f2c20] uppercase tracking-wider mb-1.5">
                  Summary of Revisions Made <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <textarea
                  value={revisionSummary}
                  onChange={(e) => setRevisionSummary(e.target.value)}
                  placeholder="Explain how comments and revisions were addressed..."
                  rows={3}
                  className={WORKSPACE_TEXTAREA}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResubmitDossier}
                  disabled={submitting}
                  className={WORKSPACE_PRIMARY_BTN}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resubmitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Resubmit Dossier</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          COMPLETE ORGANIZED DOSSIER MODAL
          ======================================================== */}
      <AnimatePresence>
        {showDossierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-[#dde6df] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#e2eae4] flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-transparent">
                <div>
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Complete Research Dossier
                  </span>
                  <h3 className="text-xl font-black text-[#0f2c20]">
                    {project?.title || "Research Project"}
                  </h3>
                  <p className="text-xs text-[#52645d] mt-0.5">
                    {project?.plantName} · {project?.plantScientificName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDossierModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#33463e]">
                {/* Multi-Stage Metrics */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#0f2c20] mb-2">
                    Multi-Stage Research Summary (Stages 1–5)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200">
                      <div className="text-[10px] font-black text-teal-800">STAGE 1 · LITERATURE</div>
                      <div className="font-mono text-base font-black text-teal-950 mt-1">
                        {dossier?.stages?.stage1?.count || 0}
                      </div>
                      <div className="text-[11px] text-teal-900/80">Supporting Studies</div>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                      <div className="text-[10px] font-black text-indigo-800">STAGE 2 · IN-SILICO</div>
                      <div className="font-mono text-base font-black text-indigo-950 mt-1">
                        {dossier?.stages?.stage2?.count || 0}
                      </div>
                      <div className="text-[11px] text-indigo-900/80">Compounds Screened</div>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                      <div className="text-[10px] font-black text-purple-800">STAGE 3 · DOCKING</div>
                      <div className="font-mono text-base font-black text-purple-950 mt-1">
                        {dossier?.stages?.stage3?.count || 0}
                      </div>
                      <div className="text-[11px] text-purple-900/80">Docking Runs</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                      <div className="text-[10px] font-black text-amber-800">STAGE 4 · PROTOTYPE</div>
                      <div className="text-xs font-black text-amber-950 mt-1 truncate">
                        {dossier?.stages?.stage4?.prototype || "Extract Prototype"}
                      </div>
                      <div className="text-[11px] text-amber-900/80">Safety Profile Reviewed</div>
                    </div>
                  </div>
                </div>

                {/* Botanical Material */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#0f2c20] mb-2">
                    Botanical Material & Extraction Specification
                  </h4>
                  <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#e2eae4] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[#697d72] text-[10px] uppercase font-bold">Parts Studied</span>
                      <p className="font-bold text-[#0f2c20] mt-0.5">{dossier?.plantPartsStudied || "Leaves"}</p>
                    </div>
                    <div>
                      <span className="text-[#697d72] text-[10px] uppercase font-bold">Material Type</span>
                      <p className="font-bold text-[#0f2c20] mt-0.5">{dossier?.materialType || "Crude Extract"}</p>
                    </div>
                    <div>
                      <span className="text-[#697d72] text-[10px] uppercase font-bold">Solvent</span>
                      <p className="font-bold text-[#0f2c20] mt-0.5">{dossier?.extractionSolvent || "Aqueous Ethanol"}</p>
                    </div>
                    <div>
                      <span className="text-[#697d72] text-[10px] uppercase font-bold">Method</span>
                      <p className="font-bold text-[#0f2c20] mt-0.5">{dossier?.extractionMethod || "Cold Maceration"}</p>
                    </div>
                  </div>
                </div>

                {/* Approved Research Synthesis */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#0f2c20] mb-2">
                    Approved Research Synthesis (Stage 5)
                  </h4>
                  <div className="space-y-3 p-4 rounded-2xl bg-[#f7faf8] border border-[#e2eae4]">
                    <div>
                      <span className="font-bold text-[#0f2c20] text-xs">Evidence Alignment:</span>
                      <p className="mt-0.5 leading-relaxed">
                        {dossier?.evidenceAlignment || "Evidence alignment verified across literature, in-silico, docking, and safety."}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-[#0f2c20] text-xs">Key Findings:</span>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        {(dossier?.keyFindings || []).map((f: string, i: number) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-[#0f2c20] text-xs">Scientific Interpretation:</span>
                      <p className="mt-0.5 leading-relaxed">
                        {dossier?.scientificInterpretation || "Multi-stage evidence interpreted."}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-[#0f2c20] text-xs">Limitations & Evidence Gaps:</span>
                      <p className="mt-0.5 leading-relaxed whitespace-pre-line">
                        {dossier?.limitations || "No critical limitations noted."}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                      <span className="font-bold text-xs">Final Conclusion:</span>
                      <p className="mt-0.5 leading-relaxed font-medium">
                        {dossier?.finalConclusion || "Research synthesis verified."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Professional Scientific Review Record */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#0f2c20] mb-2">
                    Professional Scientific Review Record (5 Disciplines)
                  </h4>
                  <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#e2eae4] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#e2eae4]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs text-[#0f2c20]">
                          {phase === "approved"
                            ? "5 of 5 Professional Reviews Approved"
                            : "Independent Peer Evaluation Status"}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-200">
                        Cycle {latestSubmission?.reviewRound || 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                      {[
                        { key: "pharmacognosy", label: "Pharmacognosy", desc: "Botanical identity & extracts" },
                        { key: "bioinformatics", label: "Bioinformatics", desc: "In-silico screening & docking" },
                        { key: "pharmacology", label: "Pharmacology", desc: "Mechanism & bioactivity" },
                        { key: "pharmacy", label: "Formulation", desc: "Prototype & stability" },
                        { key: "clinical", label: "Clinical Safety", desc: "Dosage safety & contraindications" },
                      ].map((item) => {
                        const area = coverageAreas.find((a: any) => a.key === item.key);
                        const isApp = area?.isApproved || phase === "approved";

                        return (
                          <div
                            key={item.key}
                            className={`p-2.5 rounded-xl border text-xs ${
                              isApp
                                ? "bg-white border-emerald-200 text-emerald-950"
                                : "bg-white border-[#e2eae4] text-[#33463e]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-[#0f2c20]">{item.label}</span>
                              {isApp && <Check className="w-3 h-3 text-emerald-600" />}
                            </div>
                            <div className="text-[10px] text-[#697d72] mt-0.5">{item.desc}</div>
                            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                              <span
                                className={`text-[9px] font-bold uppercase font-mono px-1.5 py-0.5 rounded ${
                                  isApp
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {isApp ? "Approved" : "Pending"}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                R{latestSubmission?.reviewRound || 1}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#e2eae4] flex items-center justify-between bg-[#f7faf8]">
                <button
                  type="button"
                  onClick={handleExportDossier}
                  className={WORKSPACE_SECONDARY_BTN}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Markdown</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDossierModal(false)}
                  className={WORKSPACE_PRIMARY_BTN}
                >
                  <span>Close Preview</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          REVIEW HISTORY MODAL
          ======================================================== */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-[#dde6df] shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-[#e2eae4] flex items-center justify-between bg-[#f7faf8]">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-700" />
                  <h3 className="font-black text-base text-[#0f2c20]">Review Cycle History</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {reviewHistory.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-4 rounded-2xl border border-[#dde6df] bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0f2c20]">
                          Cycle {h.reviewRound || 1}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-[10px] text-slate-500">{h.versionTag}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          h.status === "ACCEPTED_FOR_NEXT_STAGE"
                            ? "bg-emerald-100 text-emerald-950"
                            : h.status === "REVISION_REQUESTED"
                            ? "bg-amber-100 text-amber-950"
                            : "bg-teal-100 text-teal-950"
                        }`}
                      >
                        {h.status === "ACCEPTED_FOR_NEXT_STAGE"
                          ? "Approved"
                          : h.status === "REVISION_REQUESTED"
                          ? "Revisions Requested"
                          : "Under Review"}
                      </span>
                    </div>

                    <p className="text-[#697d72] text-[11px]">Submitted: {formatDate(h.submittedAt)}</p>

                    {h.messageToReviewers && (
                      <p className="text-[#33463e]">
                        <span className="font-bold">Researcher Note:</span> {h.messageToReviewers}
                      </p>
                    )}

                    {(h.overallAssessment || h.additionalRecommendations || h.requiredRevisions) && (
                      <div className="p-2.5 rounded-xl bg-white border border-[#dde6df] text-[#0f2c20]">
                        <span className="font-bold block text-[11px] text-emerald-800">
                          Reviewer Decision ({formatDate(h.decidedAt)}):
                        </span>
                        <p className="mt-0.5">
                          {h.overallAssessment || h.additionalRecommendations || h.requiredRevisions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[#e2eae4] flex justify-end bg-[#f7faf8]">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className={WORKSPACE_PRIMARY_BTN}
                >
                  <span>Close</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
