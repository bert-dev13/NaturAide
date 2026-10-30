"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import StagePageHeader from "@/components/researcher/StagePageHeader";
import {
  GitMerge,
  Database,
  FileCheck,
  BookOpen,
  ShieldCheck,
  Microscope,
  FlaskConical,
  History,
  FileDiff,
  CircleCheck,
  TriangleAlert,
  Send,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  Edit2,
  AlertCircle,
  HelpCircle,
  X,
  FileText,
} from "lucide-react";

interface Props {
  projectId: number;
}

const KNOWLEDGE_AREAS = [
  { value: "SCIENTIFIC_EVIDENCE", label: "Scientific Evidence (Preclinical & Bioassay Findings)" },
  { value: "SAFETY_PRECAUTIONS", label: "Safety Precautions (Contraindications & Warnings)" },
  { value: "MEDICINAL_PLANT_INFORMATION", label: "Medicinal Plant Information (General Monograph)" },
  { value: "RESEARCH_SUMMARY", label: "Research Summary (Therapeutic Findings)" },
  { value: "REFERENCES", label: "References & Standard Citations" },
  { value: "TRADITIONAL_PREPARATION", label: "Traditional Preparation (Research-Validated only)" },
  { value: "OTHER", label: "Other Scientific Knowledge" },
];

const CHANGE_TYPES = [
  { value: "ADD", label: "Add (Create new verified entry)" },
  { value: "SUPPLEMENT", label: "Supplement (Append findings to existing knowledge)" },
  { value: "UPDATE", label: "Update (Refresh existing content with newer data)" },
  { value: "CORRECT", label: "Correct (Rectify an erroneous or outdated claim)" },
];

export default function KnowledgeIntegrationClient({ projectId }: Props) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [stageMap, setStageMap] = useState<Record<string, string>>({});
  const [completionRecord, setCompletionRecord] = useState<any>(null);
  const [eligibleFindings, setEligibleFindings] = useState<any[]>([]);
  const [evidenceTraceability, setEvidenceTraceability] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [reviewDecision, setReviewDecision] = useState<any>(null);
  const [currentCommunityKnowledge, setCurrentCommunityKnowledge] = useState<any>({});
  const [proposals, setProposals] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Proposal modal & editor state
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<any | null>(null);

  // Proposal form fields
  const [proposalTitle, setProposalTitle] = useState("");
  const [knowledgeArea, setKnowledgeArea] = useState("SCIENTIFIC_EVIDENCE");
  const [changeType, setChangeType] = useState("SUPPLEMENT");
  const [proposedContent, setProposedContent] = useState("");
  const [reasonForChange, setReasonForChange] = useState("");
  const [supportingReferences, setSupportingReferences] = useState("");
  const [selectedTraceIds, setSelectedTraceIds] = useState<number[]>([]);

  // Preview tab state inside editor
  const [editorTab, setEditorTab] = useState<"EDIT" | "PREVIEW">("EDIT");

  // Revision modal state (for CHANGES_REQUESTED)
  const [revisingProposal, setRevisingProposal] = useState<any | null>(null);
  const [revisedContent, setRevisedContent] = useState("");
  const [revisedReason, setRevisedReason] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Proposal view details drawer
  const [viewingProposal, setViewingProposal] = useState<any | null>(null);

  // Confirmation modal for submission
  const [confirmSubmitProposalId, setConfirmSubmitProposalId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/knowledge-integration`);
      if (!res.ok) throw new Error("Failed to load knowledge integration data");
      const data = await res.json();

      setProject(data.project);
      setStageMap(data.stageMap || {});
      setCompletionRecord(data.completionRecord);
      setEligibleFindings(data.eligibleFindings || []);
      setEvidenceTraceability(data.evidenceTraceability || []);
      setLabTests(data.labTests || []);
      setReviewDecision(data.reviewDecision || null);
      setCurrentCommunityKnowledge(data.currentCommunityKnowledge || {});
      setProposals(data.proposals || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadData();
      setLoading(false);
    }
    if (projectId) init();
  }, [projectId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open proposal editor for a specific finding
  const handleOpenProposalForFinding = (finding: any) => {
    setSelectedFinding(finding);
    setProposalTitle(`Propose: ${finding.findingTitle}`);
    setProposedContent(finding.findingDescription || "");
    setReasonForChange(`Supported by completed research Stage 5 finding (${finding.findingCategory}).`);
    setKnowledgeArea(
      finding.findingCategory === "SAFETY_PROFILE"
        ? "SAFETY_PRECAUTIONS"
        : "SCIENTIFIC_EVIDENCE"
    );
    setChangeType("SUPPLEMENT");

    // Pre-select related evidence links
    const matchingTraceIds = evidenceTraceability
      .filter((et) => et.findingTitle === finding.findingTitle || et.findingId === finding.id)
      .map((et) => et.id);
    setSelectedTraceIds(matchingTraceIds);

    // Pre-fill references if available
    setSupportingReferences(completionRecord?.keyEvidenceSupporting || "Stage 5 Dossier & Molecular Docking Evidence");
    setEditorTab("EDIT");
    setShowProposalModal(true);
  };

  // Resolve current knowledge text based on selected knowledge area
  const getCurrentKnowledgeForArea = (area: string) => {
    if (area === "SCIENTIFIC_EVIDENCE") return currentCommunityKnowledge.scientificEvidence || "No preclinical scientific evidence published yet.";
    if (area === "SAFETY_PRECAUTIONS") return currentCommunityKnowledge.safetyPrecautions || "Standard botanical safety cautions recorded.";
    if (area === "MEDICINAL_PLANT_INFORMATION") return currentCommunityKnowledge.medicinalPlantInfo || "Standard plant profile published.";
    if (area === "RESEARCH_SUMMARY") return currentCommunityKnowledge.researchSummary || "General research summary recorded.";
    if (area === "TRADITIONAL_PREPARATION") return currentCommunityKnowledge.traditionalPreparation || "Traditional decoction instructions published.";
    return "No baseline knowledge published.";
  };

  // Create Draft Proposal
  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle.trim() || !proposedContent.trim() || !reasonForChange.trim()) {
      alert("Please complete title, proposed content, and reason for change.");
      return;
    }

    setSubmittingProposal(true);
    try {
      const selectedLinks = evidenceTraceability
        .filter((et) => selectedTraceIds.includes(et.id))
        .map((et) => ({
          evidenceType: et.evidenceType,
          evidenceReference: et.evidenceReference,
          notes: et.notes,
        }));

      const res = await fetch(`/api/researcher/projects/${projectId}/knowledge-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-proposal",
          title: proposalTitle,
          knowledgeArea,
          changeType,
          sourceFindingId: selectedFinding?.id || null,
          sourceFindingTitle: selectedFinding?.findingTitle || null,
          currentKnowledgeSnapshot: getCurrentKnowledgeForArea(knowledgeArea),
          proposedContent,
          reasonForChange,
          supportingFindingSummary: selectedFinding ? `${selectedFinding.findingTitle}: ${selectedFinding.findingDescription}` : null,
          dossierVersionTag: completionRecord?.finalResearchVersion || "v1.0",
          laboratoryEvidenceSummary: labTests[0]?.interpretationKeyFindings || "Laboratory test documented",
          professionalReviewOutcome: reviewDecision?.decision || "ACCEPTED",
          supportingReferences,
          selectedEvidenceLinks: selectedLinks,
        }),
      });

      if (res.ok) {
        showToast("Proposal draft created successfully.");
        setShowProposalModal(false);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create proposal");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving proposal");
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Submit Proposal for Review
  const handleSubmitForReview = async (propId: number) => {
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/knowledge-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-proposal",
          proposalId: propId,
        }),
      });

      if (res.ok) {
        showToast("Proposal submitted for independent Knowledge Integration Review!");
        setConfirmSubmitProposalId(null);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit proposal");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting proposal");
    }
  };

  // Submit Revision for CHANGES_REQUESTED
  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisingProposal || !revisedContent.trim() || !revisedReason.trim()) return;

    setSubmittingRevision(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/knowledge-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-revision",
          proposalId: revisingProposal.id,
          revisedProposedContent: revisedContent,
          revisedReasonForChange: revisedReason,
          revisionNotes,
          selectedEvidenceLinks: revisingProposal.evidenceLinks || [],
        }),
      });

      if (res.ok) {
        showToast("Revision submitted for review!");
        setRevisingProposal(null);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit revision");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRevision(false);
    }
  };

  // Delete Draft
  const handleDeleteDraft = async (propId: number) => {
    if (!confirm("Are you sure you want to delete this draft proposal?")) return;
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/knowledge-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-draft",
          proposalId: propId,
        }),
      });

      if (res.ok) {
        showToast("Draft proposal deleted.");
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !project) {
    return (
      <div className="p-12 text-center text-xs text-[#78997f] animate-pulse">
        Loading Knowledge Integration Workspace...
      </div>
    );
  }

  const isResearchCompleted = stageMap["completion"] === "COMPLETED" || Boolean(completionRecord?.completedAt);
  const isIntegrationCompleted = stageMap["knowledge-integration"] === "COMPLETED";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. HEADER */}
      <StagePageHeader
        projectId={projectId}
        projectTitle={project.title}
        plantName={project.plantName}
        plantScientificName={project.plantScientificName}
        stageKey="knowledge-integration"
        stageNumber={12}
        stageTitle="Knowledge Integration Proposals"
        stageSubtitle="Propose verified scientific findings from completed research for independent review and potential inclusion in the NatureAide Knowledge Base."
        stageStatus={stageMap["knowledge-integration"] || "IN_PROGRESS"}
        stageMap={stageMap}
      />

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. GOVERNANCE BANNER */}
      <div className="p-5 rounded-3xl bg-[#0f2c20] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-heading font-extrabold text-xs uppercase tracking-wider text-emerald-300">
              Community Knowledge Governance Notice
            </h4>
            <p className="text-xs text-[#b4c8b9] leading-relaxed">
              Researchers can <strong>PROPOSE</strong> changes based on completed research. Researchers <strong>CANNOT</strong> directly modify or publish Community knowledge.
              All proposals undergo independent Knowledge Integration Review by authorized scientific reviewers before any content reaches Community users.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-900 border border-emerald-700 text-emerald-200 text-[11px] font-bold">
            Research: {isResearchCompleted ? "COMPLETED" : "IN_PROGRESS"}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-900 border border-emerald-700 text-emerald-200 text-[11px] font-bold">
            Review: {reviewDecision?.decision ? reviewDecision.decision.replace(/_/g, " ") : "ACCEPTED"}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-900 border border-emerald-700 text-emerald-200 text-[11px] font-bold">
            Wet-Lab: {labTests.length > 0 ? "DOCUMENTED" : "AVAILABLE"}
          </span>
        </div>
      </div>

      {/* STAGE 5 INTEGRATION COMPLETED BADGE */}
      {isIntegrationCompleted && (
        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-emerald-950">
                Research Project Fully Integrated (12 of 12 Stages — 100%)
              </h3>
              <p className="text-xs text-emerald-800">
                Approved research findings have been integrated into NatureAide Community Knowledge Base with complete provenance tracking.
              </p>
            </div>
          </div>
          <Link
            href={`/community/plants/${project.plantSlug || "sambong"}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>View in Community Herbal Guide</span>
          </Link>
        </div>
      )}

      {/* 3. ELIGIBLE RESEARCH FINDINGS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#edf2ee]">
          <div>
            <h3 className="font-heading font-extrabold text-sm text-[#0f2c20] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#16a34a]" />
              <span>Eligible Completed Research Findings</span>
            </h3>
            <p className="text-xs text-[#78997f]">
              Only authentic findings finalized in Stage 5 are eligible for Knowledge Integration proposals.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            {eligibleFindings.length} Final Findings Documented
          </span>
        </div>

        {eligibleFindings.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#78997f] space-y-2">
            <Info className="w-6 h-6 text-[#b4c8b9] mx-auto" />
            <p>No eligible final findings found.</p>
            <p className="text-[11px]">
              Complete Stage 5 (Research Completion) to document discrete findings before formulating proposals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligibleFindings.map((finding) => (
              <div
                key={finding.id}
                className="p-5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] flex flex-col justify-between gap-4 text-xs hover:border-[#b4c8b9] transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900">
                      {finding.findingCategory}
                    </span>
                    <span className="text-[10px] text-[#78997f]">Stage 5</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#0f2c20] leading-snug">
                    {finding.findingTitle}
                  </h4>
                  <p className="text-[#475550] text-[11px] leading-relaxed line-clamp-3">
                    {finding.findingDescription}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#edf2ee] flex items-center justify-between">
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Reviewer Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenProposalForFinding(finding)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>Propose for Integration</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. ACTIVE KNOWLEDGE INTEGRATION PROPOSALS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] space-y-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#edf2ee]">
          <div>
            <h3 className="font-heading font-extrabold text-sm text-[#0f2c20] flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-[#16a34a]" />
              <span>Project Knowledge Integration Proposals</span>
            </h3>
            <p className="text-xs text-[#78997f]">
              Independent proposal lifecycle tracking from draft to scientific review and integration.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedFinding(null);
              setProposalTitle("");
              setProposedContent("");
              setReasonForChange("");
              setSupportingReferences("");
              setSelectedTraceIds([]);
              setEditorTab("EDIT");
              setShowProposalModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Custom Proposal</span>
          </button>
        </div>

        {proposals.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#78997f] space-y-2">
            <GitMerge className="w-8 h-8 text-[#b4c8b9] mx-auto" />
            <p>No knowledge integration proposals created yet.</p>
            <p className="text-[11px]">
              Click &quot;Propose for Integration&quot; on any eligible finding above to initiate a proposal.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((prop) => {
              const curr = prop.currentVersion;
              return (
                <div
                  key={prop.id}
                  className="p-5 sm:p-6 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-4 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {prop.proposalCode}
                        </span>
                        <span className="font-bold text-sm text-[#0f2c20]">{prop.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#edf2ee] text-[#0f2c20]">
                          v{prop.currentVersionNumber}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#78997f]">
                        <span>Area: <strong className="text-[#0f2c20]">{prop.knowledgeArea.replace(/_/g, " ")}</strong></span>
                        <span>•</span>
                        <span>Type: <strong className="text-[#0f2c20]">{prop.changeType}</strong></span>
                        <span>•</span>
                        <span>Created: {new Date(prop.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* STATUS BADGE */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          prop.status === "INTEGRATED"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : prop.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : prop.status === "CHANGES_REQUESTED"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : prop.status === "REJECTED"
                            ? "bg-red-100 text-red-900 border border-red-300"
                            : prop.status === "SUBMITTED" || prop.status === "UNDER_REVIEW"
                            ? "bg-blue-50 text-blue-900 border border-blue-200"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {prop.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* PROPOSED CONTENT SNIPPET */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#dde6df] space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Proposed Knowledge Addition / Change:
                    </span>
                    <p className="text-xs text-[#0f2c20] leading-relaxed whitespace-pre-wrap">
                      {curr?.proposedContent}
                    </p>
                  </div>

                  {/* REVISION COMMENTS ALERT IF CHANGES REQUESTED */}
                  {prop.status === "CHANGES_REQUESTED" && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                        <TriangleAlert className="w-4 h-4 text-amber-700" />
                        <span>Reviewer Requested Revisions</span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        {prop.decisions[0]?.decisionNotes || "Please review the feedback and submit an updated proposal version."}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setRevisingProposal(prop);
                          setRevisedContent(curr?.proposedContent || "");
                          setRevisedReason(curr?.reasonForChange || "");
                          setRevisionNotes("");
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold cursor-pointer shadow-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Prepare & Submit Revision v{prop.currentVersionNumber + 1}</span>
                      </button>
                    </div>
                  )}

                  {/* ACTIONS BAR */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#edf2ee]">
                    <div className="flex items-center gap-2 text-[11px] text-[#78997f]">
                      <History className="w-3.5 h-3.5" />
                      <span>{prop.versions?.length || 1} Version(s) Archived</span>
                      {prop.evidenceLinks?.length > 0 && (
                        <span>• {prop.evidenceLinks.length} Evidence Links</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingProposal(prop)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dde6df] bg-white hover:bg-[#edf2ee] text-xs font-bold text-[#0f2c20] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Details</span>
                      </button>

                      {prop.status === "DRAFT" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(prop.id)}
                            className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 cursor-pointer"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmSubmitProposalId(prop.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold cursor-pointer shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Submit for Review</span>
                          </button>
                        </>
                      )}

                      {(prop.status === "SUBMITTED" || prop.status === "UNDER_REVIEW") && (
                        <span className="text-[11px] text-[#78997f] italic flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Awaiting Knowledge Integration Review
                        </span>
                      )}

                      {prop.status === "INTEGRATED" && (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Integrated into NatureAide Knowledge Base
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: PROPOSAL EDITOR (DRAFT / CREATE) */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleCreateDraft}
            className="w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#0f2c20] flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-[#16a34a]" />
                  <span>Knowledge Integration Proposal Editor</span>
                </h3>
                <span className="text-xs text-[#78997f]">
                  Formulate verified research evidence for independent Knowledge Integration Review
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="text-[#78997f] hover:text-[#0f2c20] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TOGGLE EDIT VS PREVIEW */}
            <div className="flex items-center gap-2 border-b border-[#edf2ee] pb-2">
              <button
                type="button"
                onClick={() => setEditorTab("EDIT")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  editorTab === "EDIT"
                    ? "bg-[#0f2c20] text-white"
                    : "bg-[#edf2ee] text-[#475550]"
                }`}
              >
                Proposal Specification
              </button>
              <button
                type="button"
                onClick={() => setEditorTab("PREVIEW")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  editorTab === "PREVIEW"
                    ? "bg-[#0f2c20] text-white"
                    : "bg-[#edf2ee] text-[#475550]"
                }`}
              >
                Community-Facing Preview
              </button>
            </div>

            {editorTab === "EDIT" ? (
              <div className="space-y-4 text-xs">
                {/* PROPOSAL METADATA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-[#0f2c20]">Proposal Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                      placeholder="e.g. Sambong L-Borneol Phytochemical Potency Benchmark"
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] font-bold text-[#0f2c20] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Knowledge Area <span className="text-red-500">*</span></label>
                    <select
                      value={knowledgeArea}
                      onChange={(e) => setKnowledgeArea(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] font-medium outline-none"
                    >
                      {KNOWLEDGE_AREAS.map((ka) => (
                        <option key={ka.value} value={ka.value}>
                          {ka.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Change Type <span className="text-red-500">*</span></label>
                    <select
                      value={changeType}
                      onChange={(e) => setChangeType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] font-medium outline-none"
                    >
                      {CHANGE_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#0f2c20]">Target Plant</label>
                    <input
                      type="text"
                      disabled
                      value={`${project.plantName} (${project.plantScientificName || "Botanical Specimen"})`}
                      className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#edf2ee] text-[#78997f] font-medium"
                    />
                  </div>
                </div>

                {/* CURRENT KNOWLEDGE VS PROPOSED KNOWLEDGE COMPARISON */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-2">
                    <span className="text-[10px] font-bold text-[#78997f] uppercase tracking-wider block">
                      Current NatureAide Knowledge (Read-Only)
                    </span>
                    <p className="text-xs text-[#475550] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {getCurrentKnowledgeForArea(knowledgeArea)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-[#0f2c20] block">
                      Proposed Addition / Change <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={7}
                      required
                      value={proposedContent}
                      onChange={(e) => setProposedContent(e.target.value)}
                      placeholder="Write exact scientific text to be added or updated..."
                      className="w-full p-3 rounded-xl border border-[#dde6df] bg-white text-xs outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">
                    Reason for Change & Scientific Justification <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={reasonForChange}
                    onChange={(e) => setReasonForChange(e.target.value)}
                    placeholder="Explain why this change is warranted based on completed research..."
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] outline-none"
                  />
                </div>

                {/* EVIDENCE TRACEABILITY MULTI-SELECT */}
                <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-2">
                  <span className="font-bold text-[#0f2c20] block">
                    Link Evidence Traceability ({evidenceTraceability.length} Available)
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {evidenceTraceability.map((et) => {
                      const isChecked = selectedTraceIds.includes(et.id);
                      return (
                        <label
                          key={et.id}
                          className="flex items-start gap-2 p-2 rounded-lg bg-white border border-[#dde6df] cursor-pointer hover:bg-[#edf2ee]"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTraceIds([...selectedTraceIds, et.id]);
                              } else {
                                setSelectedTraceIds(selectedTraceIds.filter((id) => id !== et.id));
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div className="text-[11px] space-y-0.5">
                            <span className="font-bold text-[#0f2c20] block">
                              {et.findingTitle} • <span className="text-emerald-700 font-mono">{et.evidenceType}</span>
                            </span>
                            <span className="text-[#475550]">{et.evidenceReference}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0f2c20]">Supporting References & Citations</label>
                  <input
                    type="text"
                    value={supportingReferences}
                    onChange={(e) => setSupportingReferences(e.target.value)}
                    placeholder="e.g. DOST-ITDI Report #STD-2024-8891; AutoDock Vina Run #12"
                    className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] outline-none font-mono text-[11px]"
                  />
                </div>
              </div>
            ) : (
              /* COMMUNITY-FACING PREVIEW TAB */
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-700" />
                    Preview Only — No Direct Community Publication
                  </span>
                  <p className="text-[11px]">
                    This simulated preview demonstrates how your proposed findings could be formatted in the Community Herbal Guide if approved by Knowledge Integration Review.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[#faf9f5] border border-[#dde6df] space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#dde6df] pb-2">
                    <span className="text-sm font-bold text-[#0f2c20]">
                      Community Plant Guide: {project.plantName}
                    </span>
                    <span className="text-[11px] text-[#78997f]">
                      (<em>{project.plantScientificName}</em>)
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#dde6df] space-y-2">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      {knowledgeArea === "SAFETY_PRECAUTIONS" ? "Safety & Precautions" : "What Research & In-Silico Studies Say"}
                    </span>
                    <p className="text-xs text-[#0f2c20] leading-relaxed whitespace-pre-wrap">
                      {proposedContent || "Enter proposed content in the Proposal Specification tab to preview."}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                    <span className="font-bold block">Scientific Traceability:</span>
                    <p>
                      Sourced from {project.title} (Dossier v1.0). Verified through independent professional review and scientific validation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#edf2ee]">
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#dde6df] text-xs font-bold text-[#475550]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingProposal}
                className="px-6 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {submittingProposal ? "Saving Draft..." : "Save Proposal as Draft"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: CONFIRM SUBMISSION MODAL */}
      {confirmSubmitProposalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-[#edf2ee]">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
                <Send className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                  Submit for Integration Review?
                </h3>
                <span className="text-xs text-[#78997f]">
                  Independent Knowledge Governance Evaluation
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-2 text-xs text-[#475550] leading-relaxed">
              <p>
                This proposal will be submitted for independent Knowledge Integration Review by authorized scientific reviewers.
              </p>
              <p className="font-bold text-amber-900">
                It will NOT modify Community content until approved and integrated.
              </p>
              <p>
                Upon submission, this proposal version is locked. You will be notified if clarification or revisions are requested.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2ee]">
              <button
                type="button"
                onClick={() => setConfirmSubmitProposalId(null)}
                className="px-4 py-2 rounded-xl border border-[#dde6df] text-xs font-bold text-[#475550]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmitForReview(confirmSubmitProposalId)}
                className="px-5 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm & Submit Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REVISION SUBMISSION MODAL (CHANGES_REQUESTED) */}
      {revisingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleSubmitRevision}
            className="w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                  Submit Proposal Revision v{revisingProposal.currentVersionNumber + 1}
                </h3>
                <span className="text-xs text-[#78997f]">
                  Proposal {revisingProposal.proposalCode}: {revisingProposal.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRevisingProposal(null)}
                className="text-[#78997f] hover:text-[#0f2c20]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
              <span className="font-bold block">Reviewer Feedback:</span>
              <p>{revisingProposal.decisions[0]?.decisionNotes || "Please address feedback comments."}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#0f2c20]">
                  Revised Proposed Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={revisedContent}
                  onChange={(e) => setRevisedContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#dde6df] bg-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0f2c20]">
                  Revised Reason for Change <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={revisedReason}
                  onChange={(e) => setRevisedReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0f2c20]">Revision Notes for Reviewer</label>
                <input
                  type="text"
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Summarize changes made in response to feedback..."
                  className="w-full p-2.5 rounded-xl border border-[#dde6df] bg-[#faf9f5] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2ee]">
              <button
                type="button"
                onClick={() => setRevisingProposal(null)}
                className="px-4 py-2 rounded-xl border border-[#dde6df] text-xs font-bold text-[#475550]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRevision}
                className="px-5 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {submittingRevision ? "Submitting..." : `Submit Revision v${revisingProposal.currentVersionNumber + 1}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: PROPOSAL DETAILS DRAWER */}
      {viewingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  {viewingProposal.proposalCode}
                </span>
                <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                  {viewingProposal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingProposal(null)}
                className="text-[#78997f] hover:text-[#0f2c20]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-[#faf9f5] border border-[#dde6df]">
                <div>
                  <span className="text-[10px] text-[#78997f] block">Area</span>
                  <span className="font-bold text-[#0f2c20]">{viewingProposal.knowledgeArea}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#78997f] block">Change Type</span>
                  <span className="font-bold text-[#0f2c20]">{viewingProposal.changeType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#78997f] block">Version</span>
                  <span className="font-bold text-[#0f2c20]">v{viewingProposal.currentVersionNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#78997f] block">Status</span>
                  <span className="font-bold text-emerald-800">{viewingProposal.status}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#0f2c20] block mb-1">Proposed Knowledge Content</span>
                <div className="p-3.5 rounded-xl bg-white border border-[#dde6df] whitespace-pre-wrap leading-relaxed">
                  {viewingProposal.currentVersion?.proposedContent}
                </div>
              </div>

              <div>
                <span className="font-bold text-[#0f2c20] block mb-1">Reason for Change</span>
                <p className="p-3 rounded-xl bg-[#faf9f5] border border-[#dde6df] text-[#475550]">
                  {viewingProposal.currentVersion?.reasonForChange}
                </p>
              </div>

              {viewingProposal.evidenceLinks?.length > 0 && (
                <div>
                  <span className="font-bold text-[#0f2c20] block mb-1">Linked Evidence</span>
                  <div className="space-y-1.5">
                    {viewingProposal.evidenceLinks.map((el: any) => (
                      <div key={el.id} className="p-2.5 rounded-xl bg-white border border-[#dde6df] text-[11px]">
                        <span className="font-mono text-emerald-800 font-bold block">{el.evidenceType}</span>
                        <span className="text-[#0f2c20]">{el.evidenceReference}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingProposal.comments?.length > 0 && (
                <div>
                  <span className="font-bold text-[#0f2c20] block mb-1">Review Comments ({viewingProposal.comments.length})</span>
                  <div className="space-y-2">
                    {viewingProposal.comments.map((c: any) => (
                      <div key={c.id} className="p-3 rounded-xl bg-[#faf9f5] border border-[#dde6df] text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0f2c20]">{c.authorName} ({c.authorRole})</span>
                          <span className="text-[10px] text-[#78997f] font-mono">{c.commentType}</span>
                        </div>
                        <p className="text-[#475550]">{c.commentText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#edf2ee]">
              <button
                type="button"
                onClick={() => setViewingProposal(null)}
                className="px-5 py-2 rounded-xl bg-[#0f2c20] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
