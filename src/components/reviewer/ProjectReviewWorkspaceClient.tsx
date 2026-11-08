"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  FileText,
  Download,
  ExternalLink,
  Sprout,
  Dna,
  Activity,
  ShieldAlert,
  Save,
  Lock,
  GitCompare,
  Layers,
  Loader2,
  ShieldCheck,
  RefreshCw,
  ClipboardCheck,
  MessageSquare,
  Eye,
  Plus,
  User,
} from "lucide-react";
import { useReviewerProject } from "@/context/ReviewerProjectContext";
import {
  normalizeReviewAreaKey,
  type ExpertReviewAreaKey,
} from "@/lib/expert-review-areas";
import ReviewerProjectOverviewTab from "./workspace/ReviewerProjectOverviewTab";
import ReviewerFormulationRdSection from "./workspace/ReviewerFormulationRdSection";
import ReviewerInSilicoSection from "./workspace/ReviewerInSilicoSection";
import ReviewerSubmissionSection from "./workspace/ReviewerSubmissionSection";
import ReviewerSpecialtyEvaluationSection from "./workspace/ReviewerSpecialtyEvaluationSection";
import ReviewerFloatingActionBar from "./workspace/ReviewerFloatingActionBar";

export type ReviewerTabId =
  | "overview"
  | "section1"
  | "section2"
  | "section3"
  | "evaluation";

export interface ProjectReviewWorkspaceClientProps {
  projectId: number;
  initialSpecialty?: string;
  initialTab?: ReviewerTabId;
}

export default function ProjectReviewWorkspaceClient({
  projectId,
  initialSpecialty,
  initialTab = "section1",
}: ProjectReviewWorkspaceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setActiveProject } = useReviewerProject();

  // Tab State
  const tabFromQuery = (searchParams?.get("tab") as ReviewerTabId) || initialTab;
  const [activeTab, setActiveTab] = useState<ReviewerTabId>(tabFromQuery);

  // Specialty State
  const specialtyFromQuery = searchParams?.get("specialty") || initialSpecialty || "formulation";
  const [activeSpecialtyKey, setActiveSpecialtyKey] = useState<string>(
    normalizeReviewAreaKey(specialtyFromQuery)
  );

  // Synchronize activeTab with URL query changes (e.g. sidebar navigation clicks)
  useEffect(() => {
    const qTab = (searchParams?.get("tab") as ReviewerTabId) || initialTab;
    if (qTab && qTab !== activeTab) {
      setActiveTab(qTab);
    }
  }, [searchParams, initialTab, activeTab]);

  // Synchronize activeSpecialtyKey with URL query changes
  useEffect(() => {
    const qSpecialty = searchParams?.get("specialty");
    if (qSpecialty) {
      const normalized = normalizeReviewAreaKey(qSpecialty);
      if (normalized && normalized !== activeSpecialtyKey) {
        setActiveSpecialtyKey(normalized);
      }
    }
  }, [searchParams, activeSpecialtyKey]);

  // Data Loading State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Review Form & Feedback State
  const [commentsByArea, setCommentsByArea] = useState<Record<string, string>>({});
  const [checklistByArea, setChecklistByArea] = useState<Record<string, Record<string, boolean>>>({});
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState<string | null>(null);

  // Version Comparison
  const [showVersionCompare, setShowVersionCompare] = useState(false);

  // Step Navigation State across Sections
  const initialStepParam = searchParams?.get("step") ? parseInt(searchParams.get("step")!, 10) : null;
  const [section1Step, setSection1Step] = useState(
    initialTab === "section1" && initialStepParam ? Math.min(6, Math.max(1, initialStepParam)) : 1
  );
  const [section2Step, setSection2Step] = useState(
    initialTab === "section2" && initialStepParam ? Math.min(8, Math.max(1, initialStepParam)) : 1
  );
  const [section3Step, setSection3Step] = useState(
    initialTab === "section3" && initialStepParam ? Math.min(2, Math.max(1, initialStepParam)) : 1
  );

  useEffect(() => {
    const s = searchParams?.get("step");
    if (s) {
      const stepNum = parseInt(s, 10);
      if (!isNaN(stepNum) && stepNum >= 1) {
        if (activeTab === "section1") setSection1Step(Math.min(6, stepNum));
        if (activeTab === "section2") setSection2Step(Math.min(8, stepNum));
        if (activeTab === "section3") setSection3Step(Math.min(2, stepNum));
      }
    }
  }, [searchParams, activeTab]);

  // Approved Steps per Section (loaded directly from MySQL)
  const [approvedSteps, setApprovedSteps] = useState<{
    section1: number[];
    section2: number[];
    section3: number[];
  }>({
    section1: [],
    section2: [],
    section3: [],
  });

  // Load saved approved steps from MySQL API (with localStorage instant cache)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`natureaide_approved_steps_${projectId}`);
      if (saved) {
        setApprovedSteps(JSON.parse(saved));
      }
    } catch (e) {
      // fallback
    }

    // Always fetch authoritative approved steps from MySQL
    fetch(`/api/reviewer/projects/${projectId}/steps`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.approvedSteps) {
          setApprovedSteps(data.approvedSteps);
          try {
            localStorage.setItem(
              `natureaide_approved_steps_${projectId}`,
              JSON.stringify(data.approvedSteps)
            );
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, [projectId]);

  const handleToggleApproveStep = async (
    sectionKey: "section1" | "section2" | "section3",
    stepNum: number
  ) => {
    // Once approved, steps cannot be unapproved
    if (approvedSteps[sectionKey]?.includes(stepNum)) {
      return;
    }

    // 1. Optimistic UI update (add step only)
    setApprovedSteps((prev) => {
      const curList = prev[sectionKey] || [];
      if (curList.includes(stepNum)) return prev;
      const updated = [...curList, stepNum];
      const nextState = { ...prev, [sectionKey]: updated };
      try {
        localStorage.setItem(
          `natureaide_approved_steps_${projectId}`,
          JSON.stringify(nextState)
        );
      } catch (e) {}
      return nextState;
    });

    // 2. Persist to MySQL database (always explicit approve)
    try {
      const res = await fetch(`/api/reviewer/projects/${projectId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionKey,
          stepNumber: stepNum,
          isApproved: true,
          submissionId: data?.activeSubmission?.id,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.approvedSteps) {
          setApprovedSteps(json.approvedSteps);
          try {
            localStorage.setItem(
              `natureaide_approved_steps_${projectId}`,
              JSON.stringify(json.approvedSteps)
            );
          } catch (e) {}
        }

        // Notify sidebar & other reviewer panels in real time
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("natureaide:review-updated", {
              detail: { projectId },
            })
          );
          window.dispatchEvent(
            new CustomEvent("natureaide:project-updated", {
              detail: { projectId },
            })
          );
        }
      }
    } catch (err) {
      console.error("Failed to persist step approval to database:", err);
    }
  };

  // Sync tab with URL
  const handleTabChange = (tab: ReviewerTabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const loadFeedback = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviewer/projects/${projectId}/feedback`);
      if (res.ok) {
        const json = await res.json();
        setFeedbackList(json.feedback || []);
      }
    } catch (e) {
      console.error("Failed to fetch reviewer feedback:", e);
    }
  }, [projectId]);

  const loadWorkspace = useCallback(
    async (submissionId?: number) => {
      setLoading(true);
      setError(null);
      try {
        const url = submissionId
          ? `/api/reviewer/projects/${projectId}?submissionId=${submissionId}`
          : `/api/reviewer/projects/${projectId}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load project review workspace");
        }
        setData(json);

        if (json.approvedStepsBySection) {
          setApprovedSteps(json.approvedStepsBySection);
          try {
            localStorage.setItem(
              `natureaide_approved_steps_${projectId}`,
              JSON.stringify(json.approvedStepsBySection)
            );
          } catch (e) {}
        }

        // Prepopulate comments & checklist
        const commentsMap: Record<string, string> = {};
        const checklistMap: Record<string, Record<string, boolean>> = {};

        if (json.specialties) {
          json.specialties.forEach((spec: any) => {
            commentsMap[spec.areaKey] = spec.review?.comments || "";
            checklistMap[spec.areaKey] = spec.review?.checklist || {};
          });
        }

        setCommentsByArea(commentsMap);
        setChecklistByArea(checklistMap);

        if (json.feedback) {
          setFeedbackList(json.feedback);
        }

        // Sync with global Reviewer context
        if (json.project) {
          setActiveProject({
            id: json.project.id,
            title: json.project.title,
            plantName: json.project.plantName,
            plantScientificName: json.project.plantScientificName,
            status: json.project.overallReviewStatus,
            stages: (json.specialties || []).map((s: any) => ({
              stageNumber: s.order,
              stageName: s.label,
              areaKey: s.areaKey,
              professionalExpert: s.professionTitle,
              expertise: s.shortLabel,
              status: s.status,
              statusLabel: s.status,
              reviewerName: s.reviewerName,
              approvedAt: s.review?.submittedAt,
            })),
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load workspace");
      } finally {
        setLoading(false);
      }
    },
    [projectId, setActiveProject]
  );

  useEffect(() => {
    loadWorkspace();
    loadFeedback();
  }, [loadWorkspace, loadFeedback]);

  // Handle Reviewer Decision Actions (Draft, Request Revisions, Approve)
  const handleReviewAction = async (
    action: "save_draft" | "request_revisions" | "approve",
    targetAreaKey?: string
  ) => {
    setActionFeedback(null);
    const keyToUse = targetAreaKey || activeSpecialtyKey;
    const activeSpecialty = data?.specialties?.find(
      (s: any) => s.areaKey === keyToUse
    ) || data?.specialties?.[0];

    if (!activeSpecialty) return;

    const currentComments = commentsByArea[activeSpecialty.areaKey] || "";
    const currentChecklist = checklistByArea[activeSpecialty.areaKey] || {};

    if (action === "request_revisions" && currentComments.trim().length < 10) {
      setActionFeedback({
        type: "error",
        text: "Please provide meaningful evaluation comments (at least 10 characters) explaining the required revisions.",
      });
      return;
    }

    setIsSubmittingAction(`${action}_${activeSpecialty.areaKey}`);
    try {
      const res = await fetch(`/api/reviewer/projects/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          areaKey: activeSpecialty.areaKey,
          submissionId: data?.activeSubmission?.id,
          comments: currentComments.trim(),
          checklist: currentChecklist,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit review action");
      }

      setActionFeedback({
        type: "success",
        text: json.message || "Review updated successfully.",
      });

      // When approving a section, mark all its steps as approved as well
      if (action === "approve") {
        const secKey =
          activeSpecialty.areaKey === "formulation" || activeSpecialty.areaKey === "pharmacognosy"
            ? "section1"
            : activeSpecialty.areaKey === "bioinformatics"
            ? "section2"
            : "section3";
        const allNums =
          secKey === "section1"
            ? [1, 2, 3, 4, 5, 6]
            : secKey === "section2"
            ? [1, 2, 3, 4, 5, 6, 7, 8]
            : [1, 2, 3, 4];
        setApprovedSteps((prev) => {
          const nextState = { ...prev, [secKey]: allNums };
          try {
            localStorage.setItem(
              `natureaide_approved_steps_${projectId}`,
              JSON.stringify(nextState)
            );
          } catch (e) {}
          return nextState;
        });
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("natureaide:review-updated", {
            detail: { projectId },
          })
        );
      }

      await loadWorkspace(data?.activeSubmission?.id);
      await loadFeedback();
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        text: err.message || "Could not complete review action",
      });
    } finally {
      setIsSubmittingAction(null);
    }
  };

  // Feedback actions (Delete / Resolve)
  const handleDeleteFeedback = async (id: number) => {
    try {
      const res = await fetch(`/api/reviewer/feedback/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedbackList((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete feedback:", e);
    }
  };

  const handleResolveFeedback = async (id: number) => {
    try {
      const res = await fetch(`/api/reviewer/revisions/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESOLVE" }),
      });
      if (res.ok) {
        setFeedbackList((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: "RESOLVED", resolvedAt: new Date().toISOString() }
              : f
          )
        );
        setActionFeedback({
          type: "success",
          text: "Revision marked as resolved! The researcher has been notified.",
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("natureaide:revisions-updated", { detail: { feedbackId: id } })
          );
          window.dispatchEvent(
            new CustomEvent("natureaide:review-updated", { detail: { projectId } })
          );
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setActionFeedback({
          type: "error",
          text: errJson.error || "Failed to mark revision as resolved.",
        });
      }
    } catch (e) {
      console.error("Failed to resolve feedback:", e);
      setActionFeedback({
        type: "error",
        text: "Error communicating with server to resolve revision.",
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1440px] mx-auto py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-700">Loading review workspace…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-[1440px] mx-auto py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 space-y-3">
          <p className="font-bold text-base">Unable to load Research Review Workspace</p>
          <p className="text-xs">{error || "Project not found"}</p>
          <Link
            href="/reviewer/projects"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:bg-slate-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Review Queue</span>
          </Link>
        </div>
      </div>
    );
  }

  const {
    project,
    activeSubmission,
    submissionVersions,
    specialties,
    dossier,
    compiledOverview,
  } = data;

  const currentSpecialty =
    specialties.find((s: any) => s.areaKey === activeSpecialtyKey) || specialties[0] || null;

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-4 pb-28">
      {/* Compact navy workspace hero */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-blue-500/20 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(7,25,48,0.55)] sm:px-5 space-y-2.5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-blue-400/12 blur-3xl" />

        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-2.5">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Link
              href="/reviewer/projects"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Review queue</span>
            </Link>
            <span className="text-blue-300/40">·</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              Evaluation workspace
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
              <Eye className="w-3 h-3 text-blue-300" />
              Read-only
            </span>

            {submissionVersions && submissionVersions.length > 1 && (
              <select
                value={activeSubmission?.id || ""}
                onChange={(e) => loadWorkspace(Number(e.target.value))}
                className="cursor-pointer rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white focus:outline-none"
                aria-label="Select submission version"
              >
                {submissionVersions.map((v: any) => (
                  <option key={v.id} value={v.id} className="bg-[#071930] text-white">
                    Version {v.versionTag} (Round {v.reviewRound})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="relative min-w-0 space-y-2">
          <h1 className="text-lg font-semibold tracking-tight truncate sm:text-xl">{project.title}</h1>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-blue-100/85">
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5">
              <User className="w-3 h-3 text-blue-300 shrink-0" />
              <strong className="text-white font-medium">{project.researcherName}</strong>
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5">
              <Sprout className="w-3 h-3 text-emerald-300 shrink-0" />
              <strong className="text-white font-medium">{project.plantName}</strong>
              <em className="text-emerald-200/80 font-serif text-[10px]">
                ({project.plantScientificName || "Vitex negundo L."})
              </em>
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono">
              <Layers className="w-3 h-3 text-blue-300 shrink-0" />
              {activeSubmission?.versionTag || "v1.0"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-100">
              <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />
              {project.overallReviewStatus || "Under review"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE TAB CONTENT AREA */}
      <div>
        {activeTab === "overview" && (
          <ReviewerProjectOverviewTab
            project={project}
            dossier={dossier}
            specialties={specialties}
            activeSubmission={activeSubmission}
            onNavigateTab={handleTabChange}
            feedbackCount={feedbackList.length}
          />
        )}

        {activeTab === "section1" && (
          <ReviewerFormulationRdSection
            project={project}
            dossier={dossier}
            feedbackList={feedbackList}
            activeStep={section1Step}
            onStepChange={setSection1Step}
            approvedSteps={approvedSteps.section1}
            onToggleApproveStep={(step) => handleToggleApproveStep("section1", step)}
            onNavigateTab={handleTabChange}
            onRefreshFeedback={loadFeedback}
            onDeleteFeedback={handleDeleteFeedback}
            onResolveFeedback={handleResolveFeedback}
          />
        )}

        {activeTab === "section2" && (
          <ReviewerInSilicoSection
            project={project}
            dossier={dossier}
            feedbackList={feedbackList}
            activeStep={section2Step}
            onStepChange={setSection2Step}
            approvedSteps={approvedSteps.section2}
            onToggleApproveStep={(step) => handleToggleApproveStep("section2", step)}
            onNavigateTab={handleTabChange}
            onRefreshFeedback={loadFeedback}
            onDeleteFeedback={handleDeleteFeedback}
            onResolveFeedback={handleResolveFeedback}
          />
        )}

        {activeTab === "section3" && (
          <ReviewerSubmissionSection
            project={project}
            dossier={dossier}
            compiledOverview={compiledOverview}
            submission={activeSubmission}
            feedbackList={feedbackList}
            activeStep={section3Step}
            onStepChange={setSection3Step}
            approvedSteps={approvedSteps.section3}
            onToggleApproveStep={(step) => handleToggleApproveStep("section3", step)}
            onNavigateTab={handleTabChange}
            onRefreshFeedback={loadFeedback}
            onDeleteFeedback={handleDeleteFeedback}
            onResolveFeedback={handleResolveFeedback}
          />
        )}

        {activeTab === "evaluation" && (
          <ReviewerSpecialtyEvaluationSection
            specialties={specialties}
            activeSpecialtyKey={activeSpecialtyKey}
            onSelectSpecialty={setActiveSpecialtyKey}
            commentsByArea={commentsByArea}
            checklistByArea={checklistByArea}
            onChangeComments={(area, text) =>
              setCommentsByArea((prev) => ({ ...prev, [area]: text }))
            }
            onToggleCriterion={(area, crit) =>
              setChecklistByArea((prev) => {
                const cur = prev[area] || {};
                return { ...prev, [area]: { ...cur, [crit]: !cur[crit] } };
              })
            }
            onSubmitAction={handleReviewAction}
            isSubmittingAction={isSubmittingAction}
            actionFeedback={actionFeedback}
            activeSubmission={activeSubmission}
            onNavigateTab={handleTabChange}
            approvedStepsBySection={approvedSteps}
            onToggleApproveStep={handleToggleApproveStep}
          />
        )}
      </div>

      {/* 4. FLOATING REVIEWER NAVIGATION BAR */}
      {(() => {
        const currentStep =
          activeTab === "section1"
            ? section1Step
            : activeTab === "section2"
            ? section2Step
            : activeTab === "section3"
            ? section3Step
            : 1;

        const totalSteps =
          activeTab === "section1" ? 6 : activeTab === "section2" ? 8 : activeTab === "section3" ? 2 : 1;

        const currentSectionKey: "section1" | "section2" | "section3" | null =
          activeTab === "section1"
            ? "section1"
            : activeTab === "section2"
            ? "section2"
            : activeTab === "section3"
            ? "section3"
            : null;

        const approvedStepsForCurrentSection = currentSectionKey
          ? approvedSteps[currentSectionKey] || []
          : [];

        const isCurrentStepApproved = approvedStepsForCurrentSection.includes(currentStep);
        const approvedStepsCount = approvedStepsForCurrentSection.length;
        const approvedStepsPercent =
          totalSteps > 0 ? Math.round((approvedStepsCount / totalSteps) * 100) : 0;

        const handlePrevStep = () => {
          if (activeTab === "section1") setSection1Step((p) => Math.max(1, p - 1));
          else if (activeTab === "section2") setSection2Step((p) => Math.max(1, p - 1));
          else if (activeTab === "section3") setSection3Step((p) => Math.max(1, p - 1));
        };

        const handleNextStep = () => {
          if (activeTab === "section1") {
            if (section1Step < 6) {
              setSection1Step((p) => p + 1);
            } else {
              setSection2Step(1);
              handleTabChange("section2");
            }
          } else if (activeTab === "section2") {
            if (section2Step < 8) {
              setSection2Step((p) => p + 1);
            } else {
              setSection3Step(1);
              handleTabChange("section3");
            }
          } else if (activeTab === "section3") {
            if (section3Step < 2) {
              setSection3Step((p) => p + 1);
            } else {
              handleTabChange("evaluation");
            }
          }
        };

        const handleToggleApproveCurrentStep = () => {
          if (currentSectionKey) {
            handleToggleApproveStep(currentSectionKey, currentStep);
          }
        };

        return (
          <ReviewerFloatingActionBar
            currentSectionTitle={
              activeTab === "overview"
                ? "Overview & Dossier"
                : activeTab === "section1"
                ? "Section 1: Formulation R&D"
                : activeTab === "section2"
                ? "Section 2: In-Silico Docking"
                : activeTab === "section3"
                ? "Section 3: Paper Submission"
                : activeTab === "evaluation"
                ? "Multidisciplinary Review Panel"
                : "Review Findings & Revisions"
            }
            versionTag={activeSubmission?.versionTag || "v1.0"}
            overallStatus={project.overallReviewStatus || "Under Review"}
            specialtyLabel={currentSpecialty?.label || "Pharmacognosy"}
            activeTab={activeTab}
            currentStep={currentStep}
            totalSteps={totalSteps}
            isCurrentStepApproved={isCurrentStepApproved}
            approvedStepsCount={approvedStepsCount}
            approvedStepsPercent={approvedStepsPercent}
            onPrevStep={handlePrevStep}
            onNextStep={handleNextStep}
            onToggleApproveCurrentStep={handleToggleApproveCurrentStep}
          />
        );
      })()}
    </div>
  );
}
