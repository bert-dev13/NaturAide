"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StagePageHeader from "@/components/researcher/StagePageHeader";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Lock,
  History,
  FileCheck2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  Leaf,
  Library,
  Cpu,
  Dna,
  FlaskConical,
  ShieldAlert,
  HelpCircle,
  Eye,
  X,
  ExternalLink,
  UserCheck,
  Building2,
  ArrowRight,
  Info,
} from "lucide-react";

interface Props {
  projectId: number;
}

export default function ProfessionalReviewClient({ projectId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [stageMap, setStageMap] = useState<Record<string, string>>({});
  const [readiness, setReadiness] = useState<Record<string, boolean>>({});
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [isReadyForReview, setIsReadyForReview] = useState(false);
  const [dossierPreview, setDossierPreview] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [latestSubmission, setLatestSubmission] = useState<any>(null);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  // Submission Form state
  const [preferredSpecialty, setPreferredSpecialty] = useState("PHARMACIST");
  const [messageToReviewers, setMessageToReviewers] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [viewingSnapshot, setViewingSnapshot] = useState<any | null>(null);

  // Accordion open sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    safetyFlags: true,
    formulation: false,
    safety: false,
    literature: false,
    inSilico: false,
    docking: false,
    plantData: false,
    evidenceReview: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/researcher/projects/${projectId}/review`);
      if (!res.ok) throw new Error("Failed to load review readiness");
      const json = await res.json();
      setProject(json.project);
      setStageMap(json.stageMap || {});
      setReadiness(json.readiness || {});
      setMissingItems(json.missingItems || []);
      setIsReadyForReview(json.isReadyForReview || false);
      setDossierPreview(json.dossierPreview || null);
      setSubmissions(json.submissions || []);
      setLatestSubmission(json.latestSubmission || null);
      setAvailableSpecialties(json.availableSpecialties || ["PHARMACIST"]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  const handleSubmitDossier = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredSpecialty,
          messageToReviewers,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowConfirmModal(false);
        setMessageToReviewers("");
        await loadData();
      } else {
        alert(data.error || "Failed to submit research dossier");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting research dossier");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="p-12 text-center text-xs text-[#78997f] animate-pulse">
        Verifying Stages 1–7 Dossier Readiness & Frozen Snapshot...
      </div>
    );
  }

  const checklistItems = [
    { key: "evidenceReview", label: "Evidence Review & Baseline Hypotheses", path: "evidence" },
    { key: "plantResearch", label: "Botanical Characterization & Phytochemistry", path: "plant-research" },
    { key: "literature", label: "Literature References & Citations", path: "literature" },
    { key: "inSilico", label: "In-Silico ADMET & Target Predictions", path: "in-silico" },
    { key: "docking", label: "Molecular Docking & Affinity Calculations", path: "docking" },
    { key: "formulation", label: "Formulation Builder & Standardized Preparation", path: "formulation" },
    { key: "safety", label: "Safety Assessment & Risk Register", path: "safety" },
    { key: "hasActiveFormulation", label: "Active Formulation Version (v1.0+)", path: "formulation" },
    { key: "safetyLinkedToFormulation", label: "Safety Assessment Linked to Active Formulation", path: "safety" },
    { key: "hasObjective", label: "Clear Research Objective & Question", path: "" },
  ];

  const safetyFlags = dossierPreview?.safetyFlags || {};
  const hasSafetyFlags =
    (safetyFlags.highCriticalConcerns?.length || 0) > 0 ||
    (safetyFlags.escalatedComponents?.length || 0) > 0 ||
    Boolean(safetyFlags.unresolvedQuestions);

  const isUnderReview = project.status === "UNDER_REVIEW" || stageMap["review"] === "UNDER_REVIEW";

  return (
    <div className="space-y-6">
      <StagePageHeader
        projectId={projectId}
        projectTitle={project.title}
        plantName={project.plantName}
        plantScientificName={project.plantScientificName}
        stageKey="review"
        stageNumber={8}
        stageTitle="Professional Review"
        stageSubtitle="Submit your completed research dossier for independent professional evaluation."
        stageStatus={stageMap["review"] || (isUnderReview ? "UNDER_REVIEW" : "NOT_STARTED")}
        stageMap={stageMap}
        nextStageKey="revisions"
      />

      {/* INDEPENDENT REVIEW BANNER */}
      <div className="p-4 rounded-2xl bg-[#0f2c20] text-white text-xs space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-teal-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Independent Scientific Governance & Separation of Duties</span>
        </div>
        <p className="text-[11px] text-teal-100/90 leading-relaxed font-normal">
          NatureAide adheres to strict non-clinical research integrity. <strong>Researchers cannot self-approve their own research.</strong> Submitting your project compiles an <strong>immutable frozen snapshot</strong> (e.g. Dossier v1.0) queued for independent peer evaluation by verified health professionals.
        </p>
      </div>

      {/* POST-SUBMISSION STATUS BANNER (IF SUBMITTED) */}
      {isUnderReview && latestSubmission && (
        <div className="p-5 rounded-3xl bg-white border-2 border-emerald-500/50 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Lock className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    Dossier {latestSubmission.versionTag} — Under Professional Review
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-950 uppercase tracking-wider">
                    {latestSubmission.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-[#78997f]">
                  Submitted on {new Date(latestSubmission.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    const snap =
                      typeof latestSubmission.snapshotData === "string"
                        ? JSON.parse(latestSubmission.snapshotData)
                        : latestSubmission.snapshotData;
                    setViewingSnapshot({ ...snap, versionTag: latestSubmission.versionTag });
                  } catch (e) {
                    setViewingSnapshot(dossierPreview);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#faf9f5] hover:bg-[#edf2ee] border border-[#dde6df] text-xs font-bold text-[#0f2c20] cursor-pointer transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-teal-700" />
                <span>View Submitted Snapshot</span>
              </button>

              <Link
                href={`/researcher/projects/${projectId}/revisions`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4a37] text-white text-xs font-bold transition-colors"
              >
                <span>Track Reviewer Panel</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#dde6df] text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#475550]">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Assigned Reviewer:{" "}
                <strong className="text-[#0f2c20]">
                  {latestSubmission.reviewerName || "Verified NatureAide Reviewer Panel"}
                </strong>{" "}
                {latestSubmission.reviewerSpecialty && `(${latestSubmission.reviewerSpecialty})`}
              </span>
            </div>
            <span className="text-[11px] text-[#78997f]">
              Modifications to active research stages will not affect this submitted dossier.
            </span>
          </div>
        </div>
      )}

      {/* READINESS & SUBMISSION CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHECKLIST (LEFT 2 COLS) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#dde6df] space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
            <div>
              <h2 className="text-base font-heading font-extrabold text-[#0f2c20] flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#16a34a]" />
                <span>Review Readiness Validation</span>
              </h2>
              <p className="text-xs text-[#78997f]">
                Automated validation of real database records from Stages 1 through 7.
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isReadyForReview
                  ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                  : "bg-amber-100 text-amber-950 border border-amber-300"
              }`}
            >
              {isReadyForReview ? "✓ Submission Ready" : "Submission Not Ready"}
            </span>
          </div>

          {!isReadyForReview && missingItems.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
              <span className="font-bold text-amber-950 block">Pending Stage Requirements:</span>
              <ul className="list-disc pl-4 text-amber-900 text-[11px] space-y-0.5">
                {missingItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {checklistItems.map((item, idx) => {
              const isDone = Boolean(readiness[item.key]);
              return (
                <div
                  key={item.key}
                  className="p-3 rounded-2xl bg-[#faf9f5] border border-[#dde6df] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span className="font-medium text-[#0f2c20] truncate">
                      {idx + 1}. {item.label}
                    </span>
                  </div>

                  {item.path && !isDone && (
                    <Link
                      href={`/researcher/projects/${projectId}/${item.path}`}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0"
                    >
                      Complete
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* SUBMISSION FORM OR STATUS */}
          <div className="pt-4 border-t border-[#edf2ee] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0f2c20]">
                  Preferred Reviewer Specialty
                </label>
                <select
                  value={preferredSpecialty}
                  onChange={(e) => setPreferredSpecialty(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs font-medium text-[#0f2c20] outline-none"
                >
                  {availableSpecialties.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#78997f]">
                  Indicates preferred panel discipline. System role remains REVIEWER.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0f2c20]">
                  Submission Round / Version Target
                </label>
                <div className="p-2.5 rounded-xl bg-[#faf9f5] border border-[#dde6df] text-xs font-bold text-[#0f2c20]">
                  Research Dossier v{(submissions.length || 0) + 1}.0
                </div>
                <p className="text-[10px] text-[#78997f]">
                  Creates an immutable frozen snapshot. Previous versions remain preserved.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">
                Message to Peer Reviewers (Optional)
              </label>
              <textarea
                rows={2}
                value={messageToReviewers}
                onChange={(e) => setMessageToReviewers(e.target.value)}
                placeholder="Highlight specific methodological considerations, critical toxicity concerns, or formulation specifics..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-[#78997f]">
                Stage 8 remains <strong>UNDER_REVIEW</strong> until a verified reviewer submits a formal decision.
              </span>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting || !isReadyForReview}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1a4a37] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Submit for Professional Review</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COL: SUBMISSION HISTORY & PRESERVED VERSIONS */}
        <div className="p-6 rounded-3xl bg-[#faf9f5] border border-[#dde6df] space-y-4 h-fit">
          <div className="flex items-center gap-2 pb-3 border-b border-[#dde6df]">
            <History className="w-4 h-4 text-[#16a34a]" />
            <h3 className="font-heading font-extrabold text-xs text-[#0f2c20] uppercase tracking-wider">
              Immutable Version History
            </h3>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#78997f] space-y-2">
              <FileCheck2 className="w-8 h-8 text-[#b4c8b9] mx-auto" />
              <p className="font-bold text-[#0f2c20]">No dossiers submitted yet</p>
              <p className="text-[11px]">
                Upon submission, a locked snapshot will be archived here permanently.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#dde6df] space-y-2 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#0f2c20]">
                      Dossier Snapshot {sub.versionTag}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                      {sub.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {sub.messageToReviewers && (
                    <p className="text-[11px] text-[#475550] italic line-clamp-2">
                      &quot;{sub.messageToReviewers}&quot;
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-[#78997f] pt-1 border-t border-[#edf2ee]">
                    <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const snap =
                            typeof sub.snapshotData === "string"
                              ? JSON.parse(sub.snapshotData)
                              : sub.snapshotData;
                          setViewingSnapshot({ ...snap, versionTag: sub.versionTag });
                        } catch (e) {
                          setViewingSnapshot(dossierPreview);
                        }
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                    >
                      View Snapshot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ITEMS REQUIRING PROFESSIONAL REVIEW (SAFETY FLAGS) */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde6df] space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-base font-heading font-extrabold text-[#0f2c20]">
                Items Requiring Professional Review
              </h2>
              <p className="text-xs text-[#78997f]">
                Critical safety flags, escalated component considerations, and research uncertainties surfaced from Stages 6 & 7.
              </p>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            Reviewer Focus
          </span>
        </div>

        {hasSafetyFlags ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* High/Critical Concerns */}
            {safetyFlags.highCriticalConcerns?.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>High / Critical Safety Concerns ({safetyFlags.highCriticalConcerns.length})</span>
                </span>
                <div className="space-y-1.5">
                  {safetyFlags.highCriticalConcerns.map((c: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-white border border-rose-100 text-xs">
                      <div className="flex items-center justify-between font-bold text-[#0f2c20]">
                        <span>{c.concernTitle}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-900">
                          {c.severity}
                        </span>
                      </div>
                      {c.affectedComponent && (
                        <p className="text-[11px] text-[#78997f]">Component: {c.affectedComponent}</p>
                      )}
                      {c.researcherNotes && (
                        <p className="text-[11px] text-[#475550] mt-1">{c.researcherNotes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Escalated Components */}
            {safetyFlags.escalatedComponents?.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Components Escalated for Panel Evaluation</span>
                </span>
                <div className="space-y-1.5">
                  {safetyFlags.escalatedComponents.map((c: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-white border border-amber-100 text-xs">
                      <div className="font-bold text-[#0f2c20]">{c.componentName}</div>
                      {c.knownConcern && (
                        <p className="text-[11px] text-[#475550]">Concern: {c.knownConcern}</p>
                      )}
                      {c.researcherAssessment && (
                        <p className="text-[11px] text-[#78997f] italic mt-0.5">Assessment: {c.researcherAssessment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unresolved Questions & Limitations */}
            {safetyFlags.unresolvedQuestions && (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5 md:col-span-2">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-700" />
                  <span>Unresolved Safety Questions & Evidence Gaps</span>
                </span>
                <p className="text-xs text-[#0f2c20] leading-relaxed whitespace-pre-wrap">
                  {safetyFlags.unresolvedQuestions}
                </p>
                {safetyFlags.evidenceLimitations && (
                  <p className="text-[11px] text-[#475550] pt-1 border-t border-blue-100">
                    <strong>Evidence Limitations:</strong> {safetyFlags.evidenceLimitations}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df] text-xs text-[#78997f] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No high or critical safety flags recorded in Stage 7 assessment.</span>
          </div>
        )}
      </div>

      {/* RESEARCH DOSSIER PREVIEW (REAL STAGES 1-7 DATA) */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde6df] space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
          <div>
            <h2 className="text-base font-heading font-extrabold text-[#0f2c20] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#16a34a]" />
              <span>Research Dossier Full Preview</span>
            </h2>
            <p className="text-xs text-[#78997f]">
              Expand sections to inspect the compiled multi-stage research data prior to freezing.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* 1. Overview */}
          <div className="rounded-2xl border border-[#dde6df] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("overview")}
              className="w-full p-4 bg-[#faf9f5] hover:bg-[#edf2ee] flex items-center justify-between text-xs font-bold text-[#0f2c20] text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-700" />
                <span>1. Research Overview & Scope</span>
              </div>
              {openSections.overview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSections.overview && (
              <div className="p-4 bg-white text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#faf9f5] border border-[#edf2ee]">
                    <span className="text-[10px] text-[#78997f] font-bold uppercase block">Research Objective</span>
                    <p className="text-[#0f2c20] font-medium">{project.researchObjective || "None specified"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#faf9f5] border border-[#edf2ee]">
                    <span className="text-[10px] text-[#78997f] font-bold uppercase block">Research Question</span>
                    <p className="text-[#0f2c20] font-medium">{project.researchQuestion || "None specified"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Plant Research */}
          <div className="rounded-2xl border border-[#dde6df] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("plantData")}
              className="w-full p-4 bg-[#faf9f5] hover:bg-[#edf2ee] flex items-center justify-between text-xs font-bold text-[#0f2c20] text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>2. Plant / Specimen Botanical Data</span>
              </div>
              {openSections.plantData ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSections.plantData && (
              <div className="p-4 bg-white text-xs space-y-2">
                {dossierPreview?.plantData ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-xl bg-[#faf9f5]">
                      <span className="text-[10px] text-[#78997f] font-bold block">Scientific Binomial</span>
                      <span className="italic font-bold text-[#0f2c20]">{dossierPreview.plantData.scientificName}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#faf9f5]">
                      <span className="text-[10px] text-[#78997f] font-bold block">Botanical Family</span>
                      <span className="font-semibold text-[#0f2c20]">{dossierPreview.plantData.family || "N/A"}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#faf9f5]">
                      <span className="text-[10px] text-[#78997f] font-bold block">Parts Studied</span>
                      <span className="text-[#0f2c20]">{dossierPreview.plantData.partsStudied || "N/A"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#78997f]">No botanical plant data recorded.</p>
                )}
              </div>
            )}
          </div>

          {/* 3. Evidence Review */}
          <div className="rounded-2xl border border-[#dde6df] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("evidenceReview")}
              className="w-full p-4 bg-[#faf9f5] hover:bg-[#edf2ee] flex items-center justify-between text-xs font-bold text-[#0f2c20] text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>3. Evidence Review & Baseline Hypotheses</span>
              </div>
              {openSections.evidenceReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSections.evidenceReview && (
              <div className="p-4 bg-white text-xs space-y-2">
                {dossierPreview?.evidenceReview ? (
                  <div className="space-y-2">
                    <p className="text-[#0f2c20] leading-relaxed">
                      <strong>Background:</strong> {dossierPreview.evidenceReview.background}
                    </p>
                    <p className="text-[#475550]">
                      <strong>Traditional Knowledge:</strong> {dossierPreview.evidenceReview.traditionalKnowledge}
                    </p>
                  </div>
                ) : (
                  <p className="text-[#78997f]">No evidence review logged.</p>
                )}
              </div>
            )}
          </div>

          {/* 4. Literature */}
          <div className="rounded-2xl border border-[#dde6df] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("literature")}
              className="w-full p-4 bg-[#faf9f5] hover:bg-[#edf2ee] flex items-center justify-between text-xs font-bold text-[#0f2c20] text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4 text-emerald-700" />
                <span>4. Literature Synthesis & Citations ({dossierPreview?.literature?.length || 0})</span>
              </div>
              {openSections.literature ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSections.literature && (
              <div className="p-4 bg-white text-xs space-y-2">
                {dossierPreview?.literature?.length > 0 ? (
                  dossierPreview.literature.map((lit: any) => (
                    <div key={lit.id} className="p-2.5 rounded-xl bg-[#faf9f5] border border-[#edf2ee] space-y-1">
                      <div className="flex items-center justify-between font-bold text-[#0f2c20]">
                        <span>{lit.title}</span>
                        <span className="text-[10px] text-[#78997f]">{lit.year}</span>
                      </div>
                      <p className="text-[11px] text-[#78997f]">{lit.authors} — {lit.journalSource}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#78997f]">No literature references.</p>
                )}
              </div>
            )}
          </div>

          {/* 5. Formulation */}
          <div className="rounded-2xl border border-[#dde6df] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("formulation")}
              className="w-full p-4 bg-[#faf9f5] hover:bg-[#edf2ee] flex items-center justify-between text-xs font-bold text-[#0f2c20] text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-700" />
                <span>
                  5. Active Formulation Prototype: {dossierPreview?.formulation?.version?.versionTag || "v1.0"}
                </span>
              </div>
              {openSections.formulation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSections.formulation && (
              <div className="p-4 bg-white text-xs space-y-3">
                {dossierPreview?.formulation?.overview ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-[#faf9f5]">
                        <span className="text-[10px] text-[#78997f] block font-bold">Formulation Name</span>
                        <span className="font-bold text-[#0f2c20]">{dossierPreview.formulation.overview.formulationName}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#faf9f5]">
                        <span className="text-[10px] text-[#78997f] block font-bold">Formulation Type</span>
                        <span className="text-[#0f2c20]">{dossierPreview.formulation.overview.formulationType}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#faf9f5]">
                        <span className="text-[10px] text-[#78997f] block font-bold">Active Version</span>
                        <span className="font-extrabold text-teal-800">{dossierPreview.formulation.version?.versionTag}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-[#0f2c20] text-[11px] block">Components ({dossierPreview.formulation.components?.length || 0}):</span>
                      <div className="rounded-xl border border-[#dde6df] overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#faf9f5] text-[10px] text-[#78997f]">
                            <tr>
                              <th className="p-2">Component</th>
                              <th className="p-2">Role</th>
                              <th className="p-2">Quantity</th>
                              <th className="p-2">Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#edf2ee]">
                            {(dossierPreview.formulation.components || []).map((c: any) => (
                              <tr key={c.id}>
                                <td className="p-2 font-bold text-[#0f2c20]">{c.componentName}</td>
                                <td className="p-2 text-[#78997f]">{c.roleInFormulation}</td>
                                <td className="p-2 text-[#0f2c20]">{c.quantity ? `${c.quantity} ${c.unit}` : "Documented"}</td>
                                <td className="p-2 text-[#78997f]">{c.sourceMaterial || "Plant"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[#78997f]">No formulation data documented.</p>
                )}
              </div>
            )}
          </div>

          {/* 6. Safety Assessment */}
          <div className="rounded-2xl border border-[#dde6df] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("safety")}
              className="w-full p-4 bg-[#faf9f5] hover:bg-[#edf2ee] flex items-center justify-between text-xs font-bold text-[#0f2c20] text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-700" />
                <span>6. Safety Assessment & Risk Register</span>
              </div>
              {openSections.safety ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSections.safety && (
              <div className="p-4 bg-white text-xs space-y-3">
                {dossierPreview?.safety?.assessment ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#faf9f5]">
                      <span className="font-bold text-[#0f2c20] block">Toxicity Evidence</span>
                      <p className="text-[#475550]">{dossierPreview.safety.assessment.toxicityEvidence || "No evidence identified"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#faf9f5]">
                      <span className="font-bold text-[#0f2c20] block">Contraindications</span>
                      <p className="text-[#475550]">{dossierPreview.safety.assessment.potentialContraindications || "None documented"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#faf9f5]">
                      <span className="font-bold text-[#0f2c20] block">Herb-Drug Interactions</span>
                      <p className="text-[#475550]">{dossierPreview.safety.assessment.herbDrugInteractions || "None documented"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#faf9f5]">
                      <span className="font-bold text-[#0f2c20] block">Population Considerations</span>
                      <p className="text-[#475550]">{dossierPreview.safety.assessment.populationConsiderations || "None documented"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#78997f]">No safety assessment documented.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-700" />
                <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                  Submit Research Dossier for Professional Review?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-[#78997f] hover:text-[#0f2c20]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
              <span className="font-bold block text-amber-900">
                Immutable Snapshot Creation Warning:
              </span>
              <p className="text-[11px] leading-relaxed">
                Submitting creates an <strong>immutable frozen snapshot</strong> (Dossier v{(submissions.length || 0) + 1}.0) of your research stages 1 through 7.
              </p>
              <p className="text-[11px] leading-relaxed">
                Future edits to your project will <strong>not</strong> alter this submitted dossier. An independent health professional reviewer matching <strong>{preferredSpecialty.replace(/_/g, " ")}</strong> will evaluate the locked research.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-[#dde6df] text-xs font-bold text-[#0f2c20] hover:bg-[#faf9f5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDossier}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4a37] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>{submitting ? "Compiling Snapshot..." : "Confirm & Submit Dossier"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW FROZEN SNAPSHOT MODAL */}
      {viewingSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#edf2ee] flex items-center justify-between bg-[#faf9f5]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700" />
                <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                  Locked Research Snapshot {viewingSnapshot.versionTag || "v1.0"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSnapshot(null)}
                className="text-[#78997f] hover:text-[#0f2c20]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-xs">
                This is an immutable historical record preserved at submission. It cannot be altered by subsequent researcher activity.
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#0f2c20] uppercase text-[10px] tracking-wider">Project Identity:</h4>
                <div className="p-3 rounded-xl bg-[#faf9f5] border border-[#edf2ee]">
                  <p className="font-bold text-sm text-[#0f2c20]">{viewingSnapshot.project?.title}</p>
                  <p className="text-[#78997f]">{viewingSnapshot.project?.plantName} ({viewingSnapshot.project?.plantScientificName})</p>
                </div>
              </div>

              {viewingSnapshot.formulations && viewingSnapshot.formulations[0] && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[#0f2c20] uppercase text-[10px] tracking-wider">Frozen Formulation:</h4>
                  <div className="p-3 rounded-xl bg-[#faf9f5] border border-[#edf2ee] space-y-1">
                    <p className="font-bold text-[#0f2c20]">
                      {viewingSnapshot.formulations[0].formulationName} (Version {viewingSnapshot.formulations[0].versionNumber})
                    </p>
                    <p className="text-[#78997f]">Type: {viewingSnapshot.formulations[0].formulationType}</p>
                  </div>
                </div>
              )}

              {viewingSnapshot.safety && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[#0f2c20] uppercase text-[10px] tracking-wider">Frozen Safety Assessment:</h4>
                  <div className="p-3 rounded-xl bg-[#faf9f5] border border-[#edf2ee] space-y-1">
                    <p className="text-[#475550]">Toxicity: {viewingSnapshot.safety.toxicityEvidence || "Documented"}</p>
                    <p className="text-[#475550]">Contraindications: {viewingSnapshot.safety.contraindications || "None documented"}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#edf2ee] flex justify-end bg-[#faf9f5]">
              <button
                type="button"
                onClick={() => setViewingSnapshot(null)}
                className="px-4 py-2 rounded-xl bg-[#0f2c20] text-white text-xs font-bold"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
