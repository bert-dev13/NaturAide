"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StagePageHeader from "@/components/researcher/StagePageHeader";
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ClipboardCheck,
  AlertCircle,
  FileEdit,
  Send,
  Lock,
  History,
  FileCheck2,
  UserCheck,
  Building2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileDiff,
  BookOpen,
  HelpCircle,
  Info,
  Save,
  Check,
  X,
  Plus,
} from "lucide-react";

interface Props {
  projectId: number;
}

const SECTION_PATHS: Record<string, string> = {
  overview: "",
  "evidence-review": "evidence",
  "plant-research": "plant-research",
  literature: "literature",
  "in-silico": "in-silico",
  docking: "docking",
  formulation: "formulation",
  safety: "safety",
  references: "literature",
  "supporting-files": "formulation",
};

export default function ResearcherRevisionsClient({ projectId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [stageMap, setStageMap] = useState<Record<string, string>>({});
  const [latestSubmission, setLatestSubmission] = useState<any>(null);
  const [latestDecision, setLatestDecision] = useState<any>(null);
  const [currentCycle, setCurrentCycle] = useState<any>(null);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({
    critical: 0,
    major: 0,
    minor: 0,
    informational: 0,
    total: 0,
    addressed: 0,
    open: 0,
  });
  const [historicalSnapshot, setHistoricalSnapshot] = useState<any>(null);
  const [currentWorkingState, setCurrentWorkingState] = useState<any>(null);
  const [resubmissionReadiness, setResubmissionReadiness] = useState<any>({
    isReadyForResubmission: false,
    missingRequirements: [],
  });

  // Response form draft state per feedback id
  const [draftResponses, setDraftResponses] = useState<
    Record<
      number,
      {
        researcherReply: string;
        responseAction: string;
        responseDescription: string;
        affectedStage: string;
        supportingFileUrl: string;
      }
    >
  >({});
  const [savingFeedbackId, setSavingFeedbackId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Resubmission modal state
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [revisionSummary, setRevisionSummary] = useState("");
  const [resubmitting, setResubmitting] = useState(false);

  // Tab filter: ALL | OPEN | ADDRESSED | CRITICAL_MAJOR
  const [filterTab, setFilterTab] = useState<"ALL" | "OPEN" | "ADDRESSED" | "CRITICAL_MAJOR">("ALL");

  // Toggle comparison drawer
  const [showComparison, setShowComparison] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/researcher/projects/${projectId}/revisions`);
      if (!res.ok) throw new Error("Failed to load revisions");
      const json = await res.json();

      setProject(json.project);
      setStageMap(json.stageMap || {});
      setLatestSubmission(json.latestSubmission || null);
      setLatestDecision(json.latestDecision || null);
      setCurrentCycle(json.currentCycle || null);
      setFeedbackList(json.feedback || []);
      setCounts(json.counts || {});
      setHistoricalSnapshot(json.historicalSnapshot || null);
      setCurrentWorkingState(json.currentWorkingState || null);
      setResubmissionReadiness(json.resubmissionReadiness || {});

      // Initialize response drafts
      const drafts: Record<number, any> = {};
      for (const item of json.feedback || []) {
        drafts[item.id] = {
          researcherReply: item.researcherReply || "",
          responseAction: item.responseAction || "CHANGE_MADE",
          responseDescription: item.responseDescription || "",
          affectedStage: item.affectedStage || item.sectionName || "safety",
          supportingFileUrl: item.supportingFileUrl || "",
        };
      }
      setDraftResponses(drafts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  const handleSaveResponse = async (feedbackId: number) => {
    setSavingFeedbackId(feedbackId);
    try {
      const draft = draftResponses[feedbackId] || {
        researcherReply: "",
        responseAction: "CHANGE_MADE",
        responseDescription: "",
        affectedStage: "",
        supportingFileUrl: "",
      };

      const res = await fetch(`/api/researcher/projects/${projectId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-response",
          feedbackId,
          researcherReply: draft.researcherReply,
          responseAction: draft.responseAction,
          responseDescription: draft.responseDescription,
          affectedStage: draft.affectedStage,
          supportingFileUrl: draft.supportingFileUrl,
          status: "ADDRESSED",
        }),
      });

      if (res.ok) {
        setToastMessage("Researcher response saved & marked as ADDRESSED.");
        setTimeout(() => setToastMessage(null), 3000);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save response");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving response");
    } finally {
      setSavingFeedbackId(null);
    }
  };

  const handleResubmitDossier = async () => {
    if (!revisionSummary || revisionSummary.trim().length < 15) {
      alert("Please provide a thorough Revision Summary (at least 15 characters) describing the improvements made.");
      return;
    }

    setResubmitting(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resubmit",
          revisionSummary,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowResubmitModal(false);
        setToastMessage(`Dossier ${data.nextTag} resubmitted for professional review!`);
        setTimeout(() => setToastMessage(null), 4000);
        router.push(`/researcher/projects/${projectId}/review`);
      } else {
        alert(data.error || "Failed to resubmit dossier");
      }
    } catch (err) {
      console.error(err);
      alert("Error during resubmission");
    } finally {
      setResubmitting(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="p-12 text-center text-xs text-[#78997f] animate-pulse">
        Loading Reviewer Feedback & Revision Records...
      </div>
    );
  }

  // Filter feedback items
  const filteredFeedback = feedbackList.filter((item) => {
    if (filterTab === "OPEN") return item.status === "OPEN";
    if (filterTab === "ADDRESSED") return item.status === "ADDRESSED" || item.status === "RESOLVED";
    if (filterTab === "CRITICAL_MAJOR") {
      return item.severity === "CRITICAL" || item.severity === "MAJOR";
    }
    return true;
  });

  const progressPercent = counts.total > 0 ? Math.round((counts.addressed / counts.total) * 100) : 100;
  const reviewerName = latestDecision?.reviewerName || currentCycle?.reviewerName || "Verified Health Professional Reviewer";
  const reviewerSpecialty = latestDecision?.reviewerSpecialty || currentCycle?.reviewerSpecialty || "Pharmacist";
  const currentVersionTag = latestSubmission?.versionTag || "v1.0";

  return (
    <div className="space-y-6">
      <StagePageHeader
        projectId={projectId}
        projectTitle={project.title}
        plantName={project.plantName}
        plantScientificName={project.plantScientificName}
        stageKey="revisions"
        stageNumber={9}
        stageTitle="Professional Review Feedback & Revisions"
        stageSubtitle="Address comments from external reviewers without altering historical submitted snapshots."
        stageStatus={stageMap["revisions"] || "IN_PROGRESS"}
        stageMap={stageMap}
        nextStageKey="laboratory"
      />

      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BANNER: REVIEW CYCLE & REVIEWER IDENTITY */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#092218] text-teal-300 text-xs font-extrabold uppercase tracking-wider">
                Review Cycle: {currentVersionTag}
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold uppercase tracking-wider">
                {latestDecision?.decision?.replace(/_/g, " ") || "REVISION REQUESTED"}
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold">
                Round {latestSubmission?.reviewRound || 1}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#0f2c20]">
              Professional Peer Evaluation & Required Revisions
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#78997f]">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Evaluated By: <strong className="text-[#0f2c20]">{reviewerName}</strong> ({reviewerSpecialty.replace(/_/g, " ")})
                </span>
              </span>

              {latestDecision?.decidedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Decision Date: {new Date(latestDecision.decidedAt).toLocaleDateString()}</span>
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#faf9f5] hover:bg-[#edf2ee] border border-[#dde6df] text-xs font-bold text-[#0f2c20] transition-colors cursor-pointer"
            >
              <FileDiff className="w-4 h-4 text-teal-700" />
              <span>{showComparison ? "Hide Version Diff" : "Compare Research Diff"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResubmitModal(true)}
              disabled={!resubmissionReadiness.isReadyForResubmission}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4a37] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resubmit for Review</span>
            </button>
          </div>
        </div>

        {/* REVIEWER OVERALL ASSESSMENT & REQUIRED REVISIONS BANNER */}
        {(latestDecision?.requiredRevisions || latestDecision?.overallAssessment || currentCycle?.reviewerSummary) && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Reviewer Overall Revision Instructions:</span>
            </div>
            <p className="text-xs leading-relaxed text-[#0f2c20] whitespace-pre-wrap">
              {latestDecision?.requiredRevisions || latestDecision?.overallAssessment || currentCycle?.reviewerSummary}
            </p>
            {latestDecision?.strengths && (
              <p className="text-[11px] text-[#475550] pt-1 border-t border-amber-200">
                <strong>Documented Strengths:</strong> {latestDecision.strengths}
              </p>
            )}
          </div>
        )}
      </div>

      {/* METRIC COUNTS & PROGRESS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#dde6df] space-y-1">
          <span className="text-[10px] text-[#78997f] font-bold uppercase block">Total Comments</span>
          <div className="text-2xl font-heading font-extrabold text-[#0f2c20]">{counts.total}</div>
          <span className="text-[10px] text-[#78997f]">{counts.addressed} addressed</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-1">
          <span className="text-[10px] text-rose-900 font-bold uppercase block">Critical Flags</span>
          <div className="text-2xl font-heading font-extrabold text-rose-950">{counts.critical}</div>
          <span className="text-[10px] text-rose-700">Must address</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
          <span className="text-[10px] text-amber-900 font-bold uppercase block">Major Concerns</span>
          <div className="text-2xl font-heading font-extrabold text-amber-950">{counts.major}</div>
          <span className="text-[10px] text-amber-700">Must address</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
          <span className="text-[10px] text-blue-900 font-bold uppercase block">Minor Points</span>
          <div className="text-2xl font-heading font-extrabold text-blue-950">{counts.minor}</div>
          <span className="text-[10px] text-blue-700">Clarifications</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-emerald-900 font-bold uppercase block">Response Progress</span>
          <div className="text-2xl font-heading font-extrabold text-emerald-950">{progressPercent}%</div>
          <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* VERSION DIFF COMPARISON (PREVIOUS IMMUTABLE VS CURRENT WORKING) */}
      {showComparison && (
        <div className="p-6 rounded-3xl bg-white border border-[#dde6df] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
            <div className="flex items-center gap-2">
              <FileDiff className="w-5 h-5 text-teal-700" />
              <div>
                <h2 className="text-base font-heading font-extrabold text-[#0f2c20]">
                  Research Version Comparison (Locked {currentVersionTag} vs Live Working State)
                </h2>
                <p className="text-xs text-[#78997f]">
                  Dossier {currentVersionTag} remains completely immutable. Any edits in live stages will form Dossier v{(latestSubmission?.reviewRound || 1) + 1}.0.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowComparison(false)}
              className="text-[#78997f] hover:text-[#0f2c20]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Frozen snapshot */}
            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-2">
              <div className="flex items-center justify-between font-bold text-[#0f2c20] pb-1 border-b border-[#edf2ee]">
                <span>Submitted Frozen Snapshot ({currentVersionTag})</span>
                <span className="px-2 py-0.5 rounded-md bg-[#092218] text-teal-300 text-[10px]">IMMUTABLE</span>
              </div>
              <p>
                <strong>Formulation:</strong>{" "}
                {historicalSnapshot?.formulations?.[0]?.formulationName || "Documented"} (
                {historicalSnapshot?.formulations?.[0]?.versionNumber || "v1.0"})
              </p>
              <p>
                <strong>Literature Citations:</strong> {historicalSnapshot?.literature?.length || 0} studies
              </p>
              <p>
                <strong>Docking Poses:</strong> {historicalSnapshot?.docking?.length || 0} runs
              </p>
              <p>
                <strong>Safety Assessment:</strong>{" "}
                {historicalSnapshot?.safety?.concerns?.length || 0} risk concerns cataloged
              </p>
            </div>

            {/* Current working state */}
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-[#0f2c20] pb-1 border-b border-teal-200">
                <span>Current Working Research State (Next Version)</span>
                <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px]">EDITABLE</span>
              </div>
              <p>
                <strong>Formulation:</strong>{" "}
                {currentWorkingState?.formulation?.name || "Active"} ({currentWorkingState?.formulation?.version || "Working"})
              </p>
              <p>
                <strong>Literature Citations:</strong> {currentWorkingState?.literatureCount || 0} studies
              </p>
              <p>
                <strong>Docking Poses:</strong> {currentWorkingState?.dockingCount || 0} runs
              </p>
              <p>
                <strong>Safety Profile:</strong> Documented in Stage 7 workspace
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW COMMENTS & ACTIONABLE RESPONSE FORMS */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde6df] space-y-6 shadow-sm">
        {/* TABS HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#edf2ee]">
          <div>
            <h2 className="text-base font-heading font-extrabold text-[#0f2c20] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-700" />
              <span>Reviewer Feedback & Researcher Action Plans</span>
            </h2>
            <p className="text-xs text-[#78997f]">
              Review each expert comment, describe the methodology adjustments made, and open related research stages.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#faf9f5] border border-[#dde6df] text-xs font-bold">
            {[
              { id: "ALL", label: `All (${counts.total})` },
              { id: "OPEN", label: `Pending (${counts.open})` },
              { id: "ADDRESSED", label: `Addressed (${counts.addressed})` },
              { id: "CRITICAL_MAJOR", label: `Critical/Major (${counts.critical + counts.major})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  filterTab === tab.id
                    ? "bg-[#0f2c20] text-white shadow-2xs"
                    : "text-[#475550] hover:text-[#0f2c20] hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FEEDBACK CARDS */}
        {filteredFeedback.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#78997f] space-y-2 border-2 border-dashed border-[#edf2ee] rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-[#0f2c20]">No feedback comments match this filter</p>
            <p className="text-[11px]">All comments in this category have been addressed.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredFeedback.map((fb, idx) => {
              const draft = draftResponses[fb.id] || {
                researcherReply: "",
                responseAction: "CHANGE_MADE",
                responseDescription: "",
                affectedStage: fb.sectionName,
                supportingFileUrl: "",
              };

              const relatedStagePath = SECTION_PATHS[fb.sectionName] || "";
              const isAddressed = fb.status === "ADDRESSED" || fb.status === "RESOLVED";

              return (
                <div
                  key={fb.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    isAddressed
                      ? "bg-emerald-50/30 border-emerald-200"
                      : fb.severity === "CRITICAL"
                      ? "bg-rose-50/40 border-rose-300"
                      : "bg-[#faf9f5] border-[#dde6df]"
                  }`}
                >
                  {/* TOP ROW: Section, Severity, Comment Type, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#dde6df] text-[11px] font-bold text-[#0f2c20] capitalize">
                        Section: {fb.sectionName.replace(/-/g, " ")}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          fb.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-950 border border-rose-300"
                            : fb.severity === "MAJOR"
                            ? "bg-amber-100 text-amber-950 border border-amber-300"
                            : fb.severity === "MINOR"
                            ? "bg-blue-100 text-blue-950 border border-blue-300"
                            : "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {fb.severity}
                      </span>

                      <span className="text-[11px] font-bold text-[#78997f]">
                        {fb.commentType.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isAddressed
                            ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                            : "bg-amber-100 text-amber-950 border border-amber-300"
                        }`}
                      >
                        {isAddressed ? "✓ Addressed" : "Action Required"}
                      </span>

                      {relatedStagePath && (
                        <Link
                          href={`/researcher/projects/${projectId}/${relatedStagePath}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white hover:bg-[#edf2ee] border border-[#dde6df] text-xs font-bold text-teal-800 transition-colors"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Open Stage</span>
                          <ExternalLink className="w-3 h-3 text-[#78997f]" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* REVIEWER COMMENT & RECOMMENDATION (READ-ONLY) */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#edf2ee] space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-[#78997f] uppercase block">
                        Reviewer Observation ({fb.reviewerDisplayName || "Reviewer"}):
                      </span>
                      <p className="text-[#0f2c20] font-medium leading-relaxed whitespace-pre-wrap">
                        {fb.comment}
                      </p>
                    </div>

                    {fb.recommendation && (
                      <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-100 space-y-0.5">
                        <span className="text-[10px] font-bold text-teal-950 uppercase block">
                          Reviewer Recommendation:
                        </span>
                        <p className="text-teal-900">{fb.recommendation}</p>
                      </div>
                    )}

                    {fb.referenceLink && (
                      <p className="text-[11px] text-[#78997f]">
                        Evidence Link:{" "}
                        <a
                          href={fb.referenceLink.startsWith("http") ? fb.referenceLink : `https://${fb.referenceLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-800 font-bold underline inline-flex items-center gap-0.5"
                        >
                          <span>{fb.referenceLink}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    )}
                  </div>

                  {/* RESEARCHER RESPONSE FORM */}
                  <div className="p-4 rounded-xl bg-white/80 border border-[#dde6df] space-y-3 text-xs">
                    <span className="font-heading font-extrabold text-[11px] text-[#0f2c20] uppercase tracking-wider block">
                      Researcher Response & Action Record
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#475550]">Action Taken</label>
                        <select
                          value={draft.responseAction}
                          onChange={(e) =>
                            setDraftResponses((prev) => ({
                              ...prev,
                              [fb.id]: { ...prev[fb.id], responseAction: e.target.value },
                            }))
                          }
                          className="w-full p-2 rounded-lg border border-[#dde6df] bg-[#faf9f5] text-xs font-medium text-[#0f2c20] outline-none"
                        >
                          <option value="CHANGE_MADE">Change Made in Project</option>
                          <option value="CLARIFICATION_PROVIDED">Clarification Provided</option>
                          <option value="ADDITIONAL_EVIDENCE_ADDED">Additional Evidence Added</option>
                          <option value="NO_CHANGE_WITH_JUSTIFICATION">No Change (With Scientific Justification)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#475550]">Affected Stage</label>
                        <input
                          type="text"
                          value={draft.affectedStage}
                          onChange={(e) =>
                            setDraftResponses((prev) => ({
                              ...prev,
                              [fb.id]: { ...prev[fb.id], affectedStage: e.target.value },
                            }))
                          }
                          placeholder="e.g. Safety Assessment, Formulation Builder"
                          className="w-full p-2 rounded-lg border border-[#dde6df] bg-[#faf9f5] text-xs text-[#0f2c20] outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#475550]">
                        Explanation of Revision / Scientific Rationale *
                      </label>
                      <textarea
                        rows={2}
                        value={draft.researcherReply}
                        onChange={(e) =>
                          setDraftResponses((prev) => ({
                            ...prev,
                            [fb.id]: { ...prev[fb.id], researcherReply: e.target.value },
                          }))
                        }
                        placeholder="Detail the exact updates made to the formulation, literature citations, or safety parameters..."
                        className="w-full p-2.5 rounded-lg border border-[#dde6df] bg-[#faf9f5] text-xs text-[#0f2c20] outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-[#78997f]">
                        {fb.researcherRepliedAt
                          ? `Last updated ${new Date(fb.researcherRepliedAt).toLocaleString()}`
                          : "Draft pending save"}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleSaveResponse(fb.id)}
                        disabled={savingFeedbackId === fb.id || !draft.researcherReply?.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1a4a37] text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 text-teal-300" />
                        <span>{savingFeedbackId === fb.id ? "Saving..." : "Save Response"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RESUBMISSION READINESS & ACTION CARD */}
      <div className="p-6 rounded-3xl bg-[#faf9f5] border border-[#dde6df] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dde6df]">
          <div>
            <h2 className="text-base font-heading font-extrabold text-[#0f2c20] flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-700" />
              <span>Resubmission Readiness Checklist</span>
            </h2>
            <p className="text-xs text-[#78997f]">
              Before compiling Dossier v{(latestSubmission?.reviewRound || 1) + 1}.0, ensure all required feedback is addressed.
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              resubmissionReadiness.isReadyForResubmission
                ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                : "bg-amber-100 text-amber-950 border border-amber-300"
            }`}
          >
            {resubmissionReadiness.isReadyForResubmission ? "✓ Ready to Resubmit" : "Pending Actions"}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            {counts.critical + counts.major === 0 || resubmissionReadiness.unaddressedCriticalOrMajorCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="font-medium text-[#0f2c20]">
              All Critical and Major reviewer comments have documented researcher responses.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-[#0f2c20]">
              Previous Dossier {currentVersionTag} remains completely immutable and archived.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-[#0f2c20]">
              Resubmission will be delivered directly to the same assigned reviewer ({reviewerName}).
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#dde6df] flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-[#78997f]">
            Resubmission transitions Stage 8 back to <strong>UNDER_REVIEW</strong>.
          </span>

          <button
            type="button"
            onClick={() => setShowResubmitModal(true)}
            disabled={!resubmissionReadiness.isReadyForResubmission}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1a4a37] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resubmit for Professional Review</span>
          </button>
        </div>
      </div>

      {/* RESUBMISSION MODAL */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-700" />
                <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                  Resubmit Dossier for Professional Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResubmitModal(false)}
                className="text-[#78997f] hover:text-[#0f2c20]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 space-y-1">
                <span className="font-bold block text-teal-900">
                  New Immutable Snapshot Creation:
                </span>
                <p className="text-[11px] leading-relaxed">
                  A new locked snapshot <strong>v{(latestSubmission?.reviewRound || 1) + 1}.0</strong> will be compiled from your current working research state. Dossier {currentVersionTag} remains preserved permanently.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0f2c20] block">
                  Overall Revision Summary for Reviewer *
                </label>
                <textarea
                  rows={4}
                  value={revisionSummary}
                  onChange={(e) => setRevisionSummary(e.target.value)}
                  placeholder="Summarize the core changes made across formulation, toxicology assessments, and additional literature citations..."
                  className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResubmitModal(false)}
                className="px-4 py-2 rounded-xl border border-[#dde6df] text-xs font-bold text-[#0f2c20] hover:bg-[#faf9f5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResubmitDossier}
                disabled={resubmitting || !revisionSummary.trim()}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4a37] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>{resubmitting ? "Compiling..." : "Confirm & Resubmit Dossier"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
