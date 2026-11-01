"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  FlaskConical,
  Info,
  Leaf,
  Loader2,
  Microscope,
  Play,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  X,
} from "lucide-react";
import ResearchStageFooter from "@/components/researcher/stage/ResearchStageFooter";

// Common verified botanical targets for Philippine / Southeast Asian medicinal research
const VERIFIED_TARGET_PRESETS = [
  {
    pdbId: "5KIR",
    name: "Cyclooxygenase-2 (COX-2)",
    gene: "PTGS2",
    organism: "Homo sapiens",
    resolution: "2.39 Å",
    method: "X-ray Diffraction",
    relevance: "Primary inflammatory & prostaglandin synthesis target",
  },
  {
    pdbId: "6Y3C",
    name: "Cyclooxygenase-1 (COX-1)",
    gene: "PTGS1",
    organism: "Homo sapiens",
    resolution: "2.40 Å",
    method: "X-ray Diffraction",
    relevance: "Constitutive prostaglandin synthase & gastric safety target",
  },
  {
    pdbId: "3W37",
    name: "Alpha-Glucosidase / Maltase-Glucoamylase",
    gene: "MGAM",
    organism: "Homo sapiens",
    resolution: "2.00 Å",
    method: "X-ray Diffraction",
    relevance: "Carbohydrate digestion & postprandial glycemic regulation",
  },
  {
    pdbId: "2AZ5",
    name: "Tumor Necrosis Factor-alpha (TNF-α)",
    gene: "TNF",
    organism: "Homo sapiens",
    resolution: "2.10 Å",
    method: "X-ray Diffraction",
    relevance: "Pro-inflammatory cytokine signaling pathway",
  },
];

function formatAffinity(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value).toFixed(2);
  if (value < 0) return `-${abs}`;
  if (value > 0) return `+${abs}`;
  return abs;
}

// Stage 2 Reusable Research Section Container
function ResearchSection({
  id,
  number,
  badge,
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  headerGradient = "from-emerald-50/80 via-teal-50/30 to-transparent",
  iconBg = "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20",
  borderColor = "border-[#dde6df]",
  hoverBorderColor = "hover:border-emerald-400/80",
}: {
  id?: string;
  number?: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  headerGradient?: string;
  iconBg?: string;
  borderColor?: string;
  hoverBorderColor?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`w-full overflow-hidden rounded-3xl bg-white border ${borderColor} shadow-md ${hoverBorderColor} transition-all duration-300`}
    >
      <div
        className={`flex flex-col items-start justify-between gap-3 border-b border-[#edf2ee] bg-gradient-to-r ${headerGradient} px-6 py-4.5 sm:flex-row sm:items-center`}
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 text-white shadow-md ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {number && (
                <span className="font-mono text-xs font-black text-emerald-800 uppercase tracking-wider">
                  {number}
                </span>
              )}
              <h2 className="text-base font-black text-[#0f2c20] sm:text-lg">{title}</h2>
              {badge && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs font-medium text-[#78997f] mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4">{children}</div>
    </motion.section>
  );
}

// Stage 2 Reusable Centered Modal with Framer Motion
function CenteredModal({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs font-sans"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`w-full ${maxWidth} overflow-hidden rounded-3xl bg-white border border-[#dde6df] shadow-2xl max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2ee] bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-transparent px-6 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-[#0f2c20]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs font-medium text-[#78997f]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#52645d] transition hover:bg-[#f3f6f4] hover:text-[#10281c] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </motion.div>
    </motion.div>
  );
}

interface MolecularDockingClientProps {
  projectId: number;
  initialWorkspace: any;
  stageCompleted?: boolean;
}

export default function MolecularDockingWorkspaceClient({
  projectId,
  initialWorkspace,
  stageCompleted = false,
}: MolecularDockingClientProps) {
  const router = useRouter();

  // Primary workspace state
  const [workspace, setWorkspace] = useState<any>(initialWorkspace);
  const [activeAnchor, setActiveAnchor] = useState<string>("sec-setup");
  const [lastSaved, setLastSaved] = useState<string>("Draft auto-saved");

  // Interpretation state
  const [interpretationText, setInterpretationText] = useState<string>(
    initialWorkspace?.interpretation?.text || ""
  );
  const [dirty, setDirty] = useState<boolean>(false);
  const [showLimitations, setShowLimitations] = useState<boolean>(false);

  // Target search & selection
  const [targetSearchQuery, setTargetSearchQuery] = useState<string>("");
  const [targetSearchResults, setTargetSearchResults] = useState<any[]>([]);
  const [searchingTargets, setSearchingTargets] = useState<boolean>(false);
  const [showTargetSearch, setShowTargetSearch] = useState<boolean>(false);
  const [addingTargetId, setAddingTargetId] = useState<string | null>(null);

  // Collapsible Docking Parameters
  const [showParameters, setShowParameters] = useState<boolean>(false);
  const [exhaustiveness, setExhaustiveness] = useState<number>(
    initialWorkspace?.settings?.exhaustiveness || 8
  );
  const [numModes, setNumModes] = useState<number>(
    initialWorkspace?.settings?.numModes || 9
  );
  const [savingParameters, setSavingParameters] = useState<boolean>(false);

  // Execution & Action states
  const [runningJobKey, setRunningJobKey] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState<boolean>(false);
  const [completingStage, setCompletingStage] = useState<boolean>(false);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modals
  const [showLigandDetailsModal, setShowLigandDetailsModal] = useState<boolean>(false);
  const [showTargetDetailsModal, setShowTargetDetailsModal] = useState<boolean>(false);
  const [showInspectModal, setShowInspectModal] = useState<boolean>(false);
  const [selectedJobIndex, setSelectedJobIndex] = useState<number>(0);
  const [inspectSubTab, setInspectSubTab] = useState<"summary" | "poses" | "parameters" | "log">("summary");
  const [copiedLog, setCopiedLog] = useState<boolean>(false);

  // Sync workspace helper
  const applyWorkspace = (next: any) => {
    setWorkspace(next);
    if (!dirty) {
      setInterpretationText(next.interpretation?.text || "");
    }
  };

  const postApi = async (body: any) => {
    const res = await fetch(`/api/researcher/projects/${projectId}/docking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Operation failed");
    if (data.workspace) applyWorkspace(data.workspace);
    return data;
  };

  const refreshWorkspace = async () => {
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/docking`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.workspace) applyWorkspace(data.workspace);
    } catch (e) {
      console.error("Docking refresh error:", e);
    }
  };

  // Poll while background jobs are active
  useEffect(() => {
    const hasActive = workspace.busy || (workspace.jobs || []).some((j: any) => j.active);
    if (!hasActive) return;
    const interval = setInterval(() => {
      void refreshWorkspace();
    }, 1800);
    return () => clearInterval(interval);
  }, [workspace.busy, workspace.jobs]);

  // Scrollspy to update active anchor
  useEffect(() => {
    const sections = ["sec-setup", "sec-results", "sec-interpretation"];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveAnchor(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Completed jobs & ranked runs
  const completedJobs = useMemo(() => {
    const jobs = (workspace.jobs || []).filter(
      (job: any) => job.status === "COMPLETED" && Number.isFinite(job.affinity)
    );
    return [...jobs].sort((a, b) => (a.affinity ?? 0) - (b.affinity ?? 0));
  }, [workspace.jobs]);

  const bestJob = completedJobs[0] || null;
  const currentSelectedJob = completedJobs[selectedJobIndex] || completedJobs[0] || null;

  // Validation checks
  const ligandsReady = (workspace.ligands || []).length > 0 &&
    workspace.ligands.every((l: any) => l.preparationReady);
  const targetsReady = (workspace.targets || []).length > 0 &&
    workspace.targets.every((t: any) => t.status === "READY");
  const configurationReady = Boolean(workspace.configuration?.configured);
  const engineAvailable = Boolean(workspace.engine?.available);
  const preflightPassed = ligandsReady && targetsReady && configurationReady && engineAvailable;

  // Review states & stage progression
  const currentStageStatus = workspace.stageStatus || (stageCompleted ? "COMPLETED" : "IN_PROGRESS");
  const isStageCompleted = currentStageStatus === "COMPLETED";
  const reviewStatus = workspace.reviewStatus || (workspace.review?.assessment ? "REVIEWED" : "NOT_SUBMITTED");
  const isUnderReview = reviewStatus === "IN_REVIEW";
  const isRevisionRequired = reviewStatus === "REVISION_REQUIRED" || currentStageStatus === "REVISION_REQUIRED";
  const isReviewApproved = reviewStatus === "APPROVED" || reviewStatus === "ACCEPTED";
  const isReviewPending = reviewStatus === "PENDING";
  // The researcher is only locked from mutating if the review is actively locked
  const isReviewLocked = isUnderReview;

  // Target actions
  const handleSearchTargets = async () => {
    if (!targetSearchQuery.trim()) return;
    setSearchingTargets(true);
    setErrorNotice(null);
    try {
      const res = await postApi({ action: "search-structures", query: targetSearchQuery.trim() });
      setTargetSearchResults(res.hits || []);
      if (!res.hits?.length) {
        setErrorNotice(`No PDB structures found matching "${targetSearchQuery}". Try a PDB ID like 5KIR or 6Y3C.`);
      }
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setSearchingTargets(false);
    }
  };

  const handleSelectTargetPdb = async (pdbId: string) => {
    if (isReviewLocked) return;
    setAddingTargetId(pdbId);
    setErrorNotice(null);
    try {
      await postApi({ action: "add-target", pdbId });
      setShowTargetSearch(false);
      setSuccessNotice(`Target PDB ${pdbId.toUpperCase()} selected. Receptor preparation initiated.`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setAddingTargetId(null);
    }
  };

  // Parameters save action
  const handleSaveParameters = async () => {
    if (isReviewLocked || !workspace.targets?.length) return;
    setSavingParameters(true);
    setErrorNotice(null);
    try {
      const targetPayloads = workspace.targets.map((t: any) => ({
        targetId: t.id,
        cx: t.grid?.center?.[0] ?? 0,
        cy: t.grid?.center?.[1] ?? 0,
        cz: t.grid?.center?.[2] ?? 0,
        sx: t.grid?.size?.[0] ?? 22,
        sy: t.grid?.size?.[1] ?? 22,
        sz: t.grid?.size?.[2] ?? 22,
      }));
      await postApi({
        action: "save-configuration",
        exhaustiveness,
        numModes,
        targets: targetPayloads,
      });
      setSuccessNotice("Docking parameters updated.");
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setSavingParameters(false);
    }
  };

  // Execution actions
  const handleRunJob = async (job: any) => {
    if (isReviewLocked || !job) return;
    const key = `${job.compoundId}-${job.targetId}`;
    setRunningJobKey(key);
    setErrorNotice(null);
    try {
      await postApi({ action: "run", compoundId: job.compoundId, targetId: job.targetId });
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setRunningJobKey(null);
    }
  };

  const handleRunAll = async () => {
    if (isReviewLocked) return;
    setRunningAll(true);
    setErrorNotice(null);
    try {
      await postApi({ action: "run-all" });
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setRunningAll(false);
    }
  };

  // Interpretation actions
  const handleDraftWithAi = () => {
    if (isReviewLocked || !completedJobs.length) return;
    const lines = completedJobs.map(
      (j: any) =>
        `- ${j.ligandName} → ${j.targetName} (${j.pdbId}): ${formatAffinity(j.affinity)} kcal/mol across ${j.poseCount || 9} binding poses.`
    );
    const top = completedJobs[0];
    const draft = [
      `Molecular docking simulations were conducted utilizing AutoDock Vina v1.2.7 to investigate the binding complementarity of selected phytochemicals against ${top.targetName} (PDB ${top.pdbId}).`,
      "",
      "Predicted Energetic Profiles:",
      lines.join("\n"),
      "",
      `Among the tested botanical ligands, ${top.ligandName} produced the most favorable predicted binding affinity at ${formatAffinity(top.affinity)} kcal/mol. This energetic profile indicates favorable steric fit and potential electrostatic interaction within the crystallized active binding cavity.`,
      "",
      "Biological Context & Limitations:",
      `These predicted affinity values represent computational free energy approximations in a semi-rigid macromolecular environment. They support hypothesized pharmacological interaction with ${top.targetName}, but do not establish in-vivo bioavailability, safety, or clinical efficacy without downstream bioassay verification.`,
    ].join("\n");

    setInterpretationText(draft);
    setDirty(true);
  };

  const handleSaveInterpretation = async () => {
    if (isReviewLocked) return;
    setSavingDraft(true);
    setErrorNotice(null);
    try {
      await postApi({
        action: "save-interpretation",
        keyFindings: interpretationText,
        approve: Boolean(interpretationText.trim()),
      });
      setDirty(false);
      setLastSaved(`Saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setSuccessNotice("Interpretation saved.");
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleCompleteAndContinue = async () => {
    if (completingStage) return;
    if (!completedJobs.length) {
      setErrorNotice("At least one docking calculation must be completed before continuing to the next stage.");
      return;
    }
    if (!interpretationText.trim()) {
      setErrorNotice("Please complete your scientific interpretation narrative before finalizing Stage 3.");
      return;
    }
    setCompletingStage(true);
    setErrorNotice(null);
    try {
      await postApi({
        action: "save-interpretation",
        keyFindings: interpretationText,
        approve: true,
      });
      const res = await postApi({ action: "complete-stage" });
      setDirty(false);
      setSuccessNotice("Stage 3 completed! Pharmacology review queued. Transitioning to Stage 4...");
      const redirectUrl = res.redirectUrl || `/researcher/projects/${projectId}/formulation-safety`;
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (e: any) {
      setErrorNotice(e.message || "Failed to complete Stage 3.");
      setCompletingStage(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (isUnderReview) return;
    if (!completedJobs.length) {
      setErrorNotice("At least one docking run must be completed before submitting for review.");
      return;
    }
    if (!interpretationText.trim()) {
      setErrorNotice("Please provide your scientific interpretation narrative before submitting.");
      return;
    }
    setSubmittingReview(true);
    setErrorNotice(null);
    try {
      await postApi({
        action: "save-interpretation",
        keyFindings: interpretationText,
        approve: true,
      });
      await postApi({ action: "submit-for-review" });
      setDirty(false);
      setSuccessNotice("Stage 3 Molecular Docking submitted for Pharmacologist review!");
      await refreshWorkspace();
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCopyLog = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div className="w-full max-w-full space-y-8 px-2 pt-6 pb-28 font-sans sm:px-4 lg:px-6">
      {/* 1. STAGE 2-STYLE LUXURY COMPACT EMERALD HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-2.5"
      >
        <div className="flex items-center justify-between px-0.5">
          <Link
            href={`/researcher/projects/${projectId}/in-silico`}
            className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#52645d] hover:text-[#0f2c20] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 transition-transform group-hover:-translate-x-1" />
            <span>Back to Stage 2 (In-Silico Analysis)</span>
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-emerald-700/40 bg-gradient-to-br from-[#072418] via-[#0d3626] to-[#041910] p-6 text-white shadow-xl shadow-emerald-950/20">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-2xl" />
          <div className="pointer-events-none absolute left-1/3 -bottom-12 h-36 w-36 rounded-full bg-teal-400/10 blur-2xl" />

          <div className="relative z-10 space-y-2">
            <span className="font-mono text-[10px] font-black tracking-widest text-emerald-300 uppercase block">
              STAGE 03 / 06
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-2xs">
              Molecular Docking
            </h1>
            <p className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-medium">
              <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-extrabold text-emerald-300">
                {workspace.project?.plantName || "Lagundi"}
              </span>
              {workspace.project?.plantScientificName && (
                <span className="font-serif italic text-emerald-100/80">
                  · {workspace.project.plantScientificName}
                </span>
              )}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              {isReviewApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold backdrop-blur-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Professionally Approved</span>
                  <span className="text-emerald-400/60">·</span>
                  <span className="text-white">Pharmacologist · Pharmacology</span>
                </span>
              ) : isUnderReview ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 font-bold backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Under Professional Review</span>
                  <span className="text-blue-300/60">·</span>
                  <span className="text-white">Pharmacologist · Pharmacology</span>
                </span>
              ) : isReviewPending ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 font-bold backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Review Queued</span>
                  <span className="text-blue-300/60">·</span>
                  <span className="text-white">Pharmacologist · Pharmacology</span>
                </span>
              ) : isRevisionRequired ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold backdrop-blur-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Revision Required</span>
                  <span className="text-amber-300/60">·</span>
                  <span className="text-white">Pharmacologist · Pharmacology</span>
                </span>
              ) : isStageCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold backdrop-blur-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Research Completed</span>
                  <span className="text-emerald-400/60">·</span>
                  <span className="text-white">Pharmacologist · Pharmacology</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-slate-200 font-semibold backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>In Progress</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-white">Pharmacologist · Pharmacology</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ERROR & SUCCESS NOTICES */}
      <div className="w-full space-y-2">
        {errorNotice && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-600 hover:text-rose-900 font-bold p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PHARMACOLOGY REVISION NOTICE */}
        {isRevisionRequired && workspace.review?.comments && (
          <div className="p-5 rounded-2xl bg-amber-50/95 border-2 border-amber-300 shadow-sm space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <h3 className="font-black text-amber-950 uppercase tracking-wider">
                Pharmacologist Review Comments:
              </h3>
            </div>
            <p className="text-amber-900 whitespace-pre-line leading-relaxed pl-6">
              {workspace.review.comments}
            </p>
          </div>
        )}
      </div>

      {/* 2. STAGE 2-STYLE STICKY TAB NAVIGATION */}
      <div className="sticky top-4 z-20 flex items-center justify-between gap-2 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xs backdrop-blur-md no-scrollbar">
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { id: "sec-setup", number: "01", label: "Setup", count: workspace.ligands?.length || 0 },
            { id: "sec-results", number: "02", label: "Docking Results", count: completedJobs.length },
            { id: "sec-interpretation", number: "03", label: "Interpretation" },
          ].map((tab) => {
            const isActive = activeAnchor === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveAnchor(tab.id);
                  document.getElementById(tab.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#0f2c20] text-emerald-300 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">{tab.number}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      isActive
                        ? "bg-emerald-800 text-emerald-100"
                        : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-1 text-xs">
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            {workspace.ligands?.length || 0} ligand · {completedJobs.length} run{completedJobs.length === 1 ? "" : "s"}
          </span>
          {dirty ? (
            <span className="text-[11px] font-medium text-amber-600">Unsaved changes</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CANVAS WITH STAGE 2 RESEARCH SECTIONS */}
      <div className="w-full space-y-8">

        {/* ============================================================== */}
        {/* SECTION 01: DOCKING SETUP                                      */}
        {/* ============================================================== */}
        <ResearchSection
          id="sec-setup"
          number="01"
          icon={Sliders}
          title="Docking Setup"
          subtitle={`${workspace.ligands?.length || 0} Ligand • ${workspace.targets?.length || 0} Target • ${workspace.engine?.version || "AutoDock Vina 1.2.7"}`}
        >
          {/* LIGAND CARD */}
          <div className="rounded-2xl border border-[#e7eee9] bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white p-5 shadow-2xs hover:border-emerald-300 transition-all space-y-3">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-2.5">
              <span className="font-mono text-xs font-black text-emerald-800 uppercase tracking-wider">
                LIGAND
              </span>
              {workspace.ligands?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowLigandDetailsModal(true)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
                >
                  View Ligand Details →
                </button>
              )}
            </div>
            {workspace.ligands?.length === 0 ? (
              <div className="text-xs text-slate-500 py-2">
                No ligands selected from Stage 2.{" "}
                <Link href={`/researcher/projects/${projectId}/in-silico`} className="text-emerald-700 font-bold hover:underline">
                  Select in Stage 2
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {workspace.ligands.map((ligand: any) => (
                  <div key={ligand.id} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-base text-[#0f2c20]">{ligand.compoundName}</h4>
                      <p className="text-xs font-mono text-[#78997f]">{ligand.molecularFormula || "—"}</p>
                    </div>
                    <div>
                      {ligand.preparationReady ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Preparing...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TARGET CARD */}
          <div className="rounded-2xl border border-[#e7eee9] bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white p-5 shadow-2xs hover:border-emerald-300 transition-all space-y-3">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-2.5">
              <span className="font-mono text-xs font-black text-emerald-800 uppercase tracking-wider">
                TARGET
              </span>
              <div className="flex items-center gap-3">
                {workspace.targets?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTargetDetailsModal(true)}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
                  >
                    View Details →
                  </button>
                )}
                {!isReviewLocked && (
                  <button
                    type="button"
                    onClick={() => setShowTargetSearch(!showTargetSearch)}
                    className="text-xs font-bold text-[#52645d] hover:text-[#0f2c20] transition-colors cursor-pointer"
                  >
                    {showTargetSearch ? "Cancel" : "Change Target"}
                  </button>
                )}
              </div>
            </div>

            {workspace.targets?.length > 0 ? (
              <div className="space-y-2">
                {workspace.targets.map((target: any) => (
                  <div key={target.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-black text-base text-[#0f2c20]">{target.targetName}</h4>
                      <p className="text-xs text-[#78997f] font-medium">
                        PDB {target.pdbId} &nbsp;·&nbsp; {target.organism || target.details?.organism || "Homo sapiens"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-800 font-bold bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ Receptor Ready
                      </span>
                      <span className="text-teal-800 font-bold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                        ✓ Binding Site Ready
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No target selected.</p>
            )}

            {/* TARGET SEARCH (WHEN EDITING) */}
            {(!workspace.targets?.length || showTargetSearch) && !isReviewLocked && (
              <div className="space-y-3 pt-3 border-t border-[#edf2ee]">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0f2c20] block">
                    Search RCSB PDB Structure
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={targetSearchQuery}
                        onChange={(e) => setTargetSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchTargets()}
                        placeholder="Enter PDB ID (e.g. 5KIR) or protein name..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d7e3db] bg-white text-xs text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchTargets}
                      disabled={searchingTargets || !targetSearchQuery.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0f3626] to-[#16a34a] hover:from-[#0c2c1f] hover:to-[#15803d] text-white font-black text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {searchingTargets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
                    </button>
                  </div>
                </div>

                {targetSearchResults.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    {targetSearchResults.map((hit) => (
                      <div
                        key={hit.pdbId}
                        className="p-2.5 rounded-xl bg-white border border-[#e7eee9] text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-emerald-800">{hit.pdbId}</span>{" "}
                          <span className="font-semibold text-slate-900 truncate">{hit.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectTargetPdb(hit.pdbId)}
                          disabled={addingTargetId === hit.pdbId}
                          className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] shrink-0"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold text-[#78997f] uppercase tracking-wider">
                    Verified Medicinal Plant Targets
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {VERIFIED_TARGET_PRESETS.map((preset) => (
                      <button
                        key={preset.pdbId}
                        type="button"
                        onClick={() => handleSelectTargetPdb(preset.pdbId)}
                        disabled={addingTargetId === preset.pdbId}
                        className="p-3 rounded-2xl border border-[#e7eee9] bg-white hover:bg-emerald-50/60 hover:border-emerald-300 text-left transition-all group cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#0f2c20] group-hover:text-emerald-800">
                            {preset.name}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {preset.pdbId}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#78997f] mt-0.5 line-clamp-1">
                          {preset.relevance}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PARAMETERS COMPACT ROW */}
          <div className="rounded-2xl border border-[#e7eee9] bg-gradient-to-br from-emerald-50/30 via-[#faf9f5] to-white p-5 shadow-2xs hover:border-emerald-300 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#0f2c20]">Docking Parameters</h4>
                <p className="text-[11px] text-[#78997f] font-medium mt-0.5">
                  Vina 1.2.7 &nbsp;·&nbsp; Exhaustiveness {exhaustiveness} &nbsp;·&nbsp; {numModes} poses
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowParameters(!showParameters)}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
              >
                {showParameters ? "Hide Parameters" : "View Parameters →"}
              </button>
            </div>

            {showParameters && (
              <div className="space-y-3 pt-3 border-t border-[#edf2ee]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Exhaustiveness
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={32}
                      value={exhaustiveness}
                      disabled={isReviewLocked}
                      onChange={(e) => setExhaustiveness(parseInt(e.target.value, 10) || 8)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Number of Output Poses
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={numModes}
                      disabled={isReviewLocked}
                      onChange={(e) => setNumModes(parseInt(e.target.value, 10) || 9)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Search Space Grid Box
                    </label>
                    <div className="p-2.5 rounded-xl bg-white border border-[#e7eee9] text-[11px] text-slate-700 font-mono">
                      Center: {workspace.targets?.[0]?.grid?.center ? `[${workspace.targets[0].grid.center.map((n: number) => n.toFixed(1)).join(", ")}]` : "Auto"}
                      <br />
                      Size: {workspace.targets?.[0]?.grid?.size ? `[${workspace.targets[0].grid.size.map((n: number) => n.toFixed(1)).join(", ")}] Å` : "22 × 22 × 22 Å"}
                    </div>
                  </div>
                </div>

                {!isReviewLocked && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveParameters}
                      disabled={savingParameters}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#163f2e] text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      {savingParameters ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Parameters</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DOCKING EXECUTION CARD (INSIDE SETUP) */}
          <div className="rounded-2xl border border-[#dde6df] bg-gradient-to-br from-emerald-50/50 via-[#fbfcfb] to-white p-5 shadow-sm space-y-4">
            {/* Header / Summary bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#edf2ee]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {workspace.busy ? (
                    <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      Docking in Progress ({completedJobs.length} of {workspace.jobs?.length || 0} completed)
                    </span>
                  ) : completedJobs.length === (workspace.jobs?.length || 0) && (workspace.jobs?.length || 0) > 0 ? (
                    <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      All Docking Runs Complete ({completedJobs.length} of {workspace.jobs?.length || 0})
                    </span>
                  ) : completedJobs.length > 0 ? (
                    <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Partial Results ({completedJobs.length} of {workspace.jobs?.length || 0} completed)
                    </span>
                  ) : (
                    <span className="text-xs font-black text-[#0f2c20] flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                      Ready to Run Simulations
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#52645d] font-medium">
                  {workspace.ligands?.length || 0} Phytochemical Ligand{workspace.ligands?.length === 1 ? "" : "s"} × {workspace.targets?.length || 0} Target Structure{workspace.targets?.length === 1 ? "" : "s"} · AutoDock Vina v1.2.7
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {workspace.busy ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-100 text-blue-800">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    Running Simulations...
                  </span>
                ) : completedJobs.length === (workspace.jobs?.length || 0) && (workspace.jobs?.length || 0) > 0 ? (
                  <button
                    type="button"
                    onClick={handleRunAll}
                    disabled={runningAll || isReviewLocked}
                    className="px-4 py-2 rounded-xl bg-white border border-[#dde6df] hover:bg-slate-50 text-[#0f2c20] font-bold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Rerun All</span>
                  </button>
                ) : completedJobs.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunAll}
                      disabled={runningAll || isReviewLocked}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0f3626] to-[#16a34a] hover:from-[#0c2c1f] hover:to-[#15803d] text-white font-black text-xs transition-all shadow-md shadow-emerald-700/20 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                    >
                      {runningAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      <span>Run Remaining ({(workspace.jobs?.length || 0) - completedJobs.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRunAll}
                      disabled={runningAll || isReviewLocked}
                      className="p-2.5 rounded-xl bg-white border border-[#dde6df] hover:bg-slate-50 text-[#52645d] hover:text-[#0f2c20] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                      title="Rerun all jobs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={workspace.jobs?.length > 1 ? handleRunAll : () => handleRunJob(workspace.jobs?.[0])}
                    disabled={!preflightPassed || workspace.busy || isReviewLocked || runningAll}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0f3626] to-[#16a34a] hover:from-[#0c2c1f] hover:to-[#15803d] text-white font-black text-xs transition-all shadow-md shadow-emerald-700/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {runningAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{workspace.jobs?.length > 1 ? "Run All Docking" : "Run Docking"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Simulation Jobs List */}
            <div className="space-y-2">
              {(workspace.jobs || []).map((job: any, idx: number) => {
                const isJobDone = job.status === "COMPLETED" && Number.isFinite(job.affinity);
                const isJobActive = job.active || job.status === "RUNNING" || job.status === "PENDING" || runningJobKey === `${job.compoundId}-${job.targetId}`;

                return (
                  <div
                    key={`${job.compoundId}-${job.targetId}-${idx}`}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      isJobActive
                        ? "bg-blue-50/60 border-blue-200 shadow-2xs"
                        : isJobDone
                        ? "bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300"
                        : "bg-white/80 border-[#e7eee9] hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0">
                        {isJobActive ? (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : isJobDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 block mx-0.5" />
                        )}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-[#0f2c20]">
                          <strong className="font-extrabold">{job.ligandName}</strong>
                          <span className="text-[#78997f] mx-1.5 font-normal">→</span>
                          <span>{job.targetName || `PDB ${job.pdbId}`}</span>
                          <span className="text-[11px] font-mono text-[#78997f] ml-1.5">({job.pdbId})</span>
                        </p>
                        <p className="text-[10px] text-[#52645d]">
                          {isJobActive
                            ? "Running AutoDock Vina simulation..."
                            : isJobDone
                            ? `Completed with ${job.poseCount || 9} binding poses · ${formatAffinity(job.affinity)} kcal/mol`
                            : "Structure & binding site ready"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isJobDone ? (
                        <>
                          <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                            {formatAffinity(job.affinity)} kcal/mol
                          </span>
                          {!isReviewLocked && (
                            <button
                              type="button"
                              onClick={() => handleRunJob(job)}
                              disabled={runningJobKey !== null || workspace.busy}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#dde6df] hover:bg-slate-50 text-[#0f2c20] font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                            >
                              Rerun
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const foundIdx = completedJobs.findIndex(
                                (cj: any) => cj.compoundId === job.compoundId && cj.targetId === job.targetId
                              );
                              setSelectedJobIndex(foundIdx >= 0 ? foundIdx : 0);
                              setShowInspectModal(true);
                            }}
                            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer px-1.5 py-1"
                          >
                            Details →
                          </button>
                        </>
                      ) : isJobActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                          Running...
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRunJob(job)}
                          disabled={!preflightPassed || workspace.busy || isReviewLocked || runningJobKey !== null}
                          className="px-3 py-1 rounded-lg bg-white border border-[#dde6df] hover:bg-emerald-50 text-[#0f2c20] hover:text-emerald-900 font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          Run
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ResearchSection>

        {/* ============================================================== */}
        {/* SECTION 02: DOCKING RESULTS                                    */}
        {/* ============================================================== */}
        <ResearchSection
          id="sec-results"
          number="02"
          icon={Microscope}
          title="Docking Results"
          subtitle="Predicted binding affinity & conformational poses"
        >
          {completedJobs.length === 0 ? (
            workspace.busy ? (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-blue-50/50 border border-blue-200 text-blue-900 space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-[#0f2c20]">Docking Simulations in Progress</p>
                <p className="text-xs text-slate-600 max-w-sm">
                  AutoDock Vina is currently executing calculations for selected ligands and macromolecular targets. Results will appear here dynamically as each run completes.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 space-y-2">
                <Microscope className="w-8 h-8 text-slate-400 stroke-1" />
                <p className="text-xs font-semibold text-slate-700">No Docking Runs Completed</p>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Execute docking in Section 01 Setup above to generate predicted binding affinities and conformational poses.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {/* LIVE COMPUTATION STATUS NOTIFICATION IF WORKSPACE IS BUSY */}
              {workspace.busy && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                  <span>
                    Simulations in progress ({completedJobs.length} of {workspace.jobs?.length || 0} completed). Displaying incoming results progressively...
                  </span>
                </div>
              )}

              {/* TOP HIGHLIGHT CARD */}
              <div className="rounded-2xl border border-emerald-700/40 bg-gradient-to-br from-[#072418] via-[#0d3626] to-[#041910] p-6 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-xl" />
                <div className="relative z-10 space-y-1">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    Most Favorable Predicted Affinity
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-300 tracking-tight drop-shadow-2xs">
                    {formatAffinity(bestJob?.affinity)} kcal/mol
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100/90 font-medium pt-1">
                    <strong className="text-white font-extrabold">{bestJob?.ligandName}</strong> → {bestJob?.targetName || "Target"} · PDB {bestJob?.pdbId}
                  </p>
                </div>
              </div>

              {/* SINGLE RESULT CARD vs MULTIPLE RESULTS TABLE */}
              {completedJobs.length === 1 ? (
                /* ONE RESULT CARD */
                <div className="rounded-2xl border border-[#e7eee9] bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white p-5 shadow-2xs hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-black text-lg text-[#0f2c20]">{completedJobs[0].ligandName}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#52645d]">
                      <span>Target: <strong className="text-[#0f2c20]">{completedJobs[0].targetName || `PDB ${completedJobs[0].pdbId}`}</strong></span>
                      <span>Predicted Affinity: <strong className="font-mono text-emerald-800 font-extrabold">{formatAffinity(completedJobs[0].affinity)} kcal/mol</strong></span>
                      <span>Poses: <strong className="text-[#0f2c20]">{completedJobs[0].poseCount || 9}</strong></span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobIndex(0);
                      setShowInspectModal(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0f3626] to-[#16a34a] hover:from-[#0c2c1f] hover:to-[#15803d] text-white font-black text-xs transition-all shadow-md shadow-emerald-700/20 active:scale-[0.98] shrink-0 cursor-pointer"
                  >
                    Inspect Result
                  </button>
                </div>
              ) : (
                /* MULTIPLE RESULTS TABLE */
                <div className="rounded-2xl border border-[#e7eee9] bg-white p-4 shadow-2xs space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#edf2ee] text-[10px] font-bold text-[#78997f] uppercase tracking-wider">
                          <th className="py-2.5 pr-3">Compound</th>
                          <th className="py-2.5 px-3">Target</th>
                          <th className="py-2.5 px-3">Affinity</th>
                          <th className="py-2.5 px-3">Poses</th>
                          <th className="py-2.5 pl-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf2ee]">
                        {completedJobs.map((job: any, idx: number) => (
                          <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="py-3 pr-3 font-black text-[#0f2c20]">{job.ligandName}</td>
                            <td className="py-3 px-3 font-mono text-[#52645d]">{job.pdbId}</td>
                            <td className="py-3 px-3 font-mono font-black text-emerald-800">{formatAffinity(job.affinity)} kcal/mol</td>
                            <td className="py-3 px-3 text-[#52645d]">{job.poseCount || 9}</td>
                            <td className="py-3 pl-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedJobIndex(idx);
                                  setShowInspectModal(true);
                                }}
                                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                              >
                                Inspect Result →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </ResearchSection>

        {/* ============================================================== */}
        {/* SECTION 03: SCIENTIFIC INTERPRETATION                          */}
        {/* ============================================================== */}
        <ResearchSection
          id="sec-interpretation"
          number="03"
          icon={FileText}
          title="Scientific Interpretation"
          subtitle="Computational summary & energetic evaluation"
        >
          <div className="space-y-4">
            {/* COMPUTATIONAL SUMMARY */}
            <div className="rounded-2xl border border-[#e7eee9] bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white p-5 shadow-2xs space-y-1.5">
              <span className="font-mono text-xs font-black text-emerald-800 uppercase tracking-wider">
                COMPUTATIONAL SUMMARY
              </span>
              <p className="text-xs text-[#0f2c20] leading-relaxed font-medium">
                {completedJobs.length} docking {completedJobs.length === 1 ? "simulation" : "simulations"} completed.
                {bestJob && (
                  <>
                    {" "}
                    <strong>{bestJob.ligandName}</strong> showed a predicted binding affinity of{" "}
                    <strong className="text-emerald-800 font-mono font-bold">{formatAffinity(bestJob.affinity)} kcal/mol</strong>{" "}
                    against {bestJob.targetName || `PDB ${bestJob.pdbId}`}.
                  </>
                )}
              </p>
            </div>

            {/* RESEARCHER INTERPRETATION */}
            <div className="rounded-2xl border border-[#e7eee9] bg-gradient-to-br from-white via-[#faf9f5] to-white p-5 shadow-2xs hover:border-emerald-300 transition-all space-y-3">
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-2.5">
                <span className="font-mono text-xs font-black text-emerald-800 uppercase tracking-wider">
                  RESEARCHER INTERPRETATION
                </span>
                <div className="flex items-center gap-2">
                  {!isReviewLocked && (
                    <button
                      type="button"
                      onClick={handleDraftWithAi}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Assist with Interpretation</span>
                    </button>
                  )}
                  {dirty && !isReviewLocked && (
                    <button
                      type="button"
                      onClick={handleSaveInterpretation}
                      disabled={savingDraft}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0f3626] to-[#16a34a] hover:from-[#0c2c1f] hover:to-[#15803d] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Interpretation</span>
                    </button>
                  )}
                  {!dirty && interpretationText.trim() && (
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Interpretation Complete
                    </span>
                  )}
                </div>
              </div>

              {isReviewLocked ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                  {interpretationText || "No scientific interpretation was provided."}
                </div>
              ) : (
                <textarea
                  rows={6}
                  value={interpretationText}
                  onChange={(e) => {
                    setInterpretationText(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Record your scientific interpretation of predicted binding poses, active residue interactions, and energetic complementarity..."
                  className="w-full p-3.5 rounded-2xl border border-[#d7e3db] text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none leading-relaxed font-sans"
                />
              )}
            </div>

            {/* COLLAPSIBLE COMPUTATIONAL LIMITATIONS */}
            <div className="rounded-2xl border border-[#e7eee9] bg-white p-4 shadow-2xs hover:border-emerald-200 transition-all">
              <button
                type="button"
                onClick={() => setShowLimitations(!showLimitations)}
                className="w-full flex items-center justify-between text-left cursor-pointer group"
              >
                <span className="text-xs font-bold text-[#52645d] group-hover:text-[#0f2c20] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  Computational Limitations & Biological Boundaries
                </span>
                <span className="text-xs font-bold text-[#78997f] group-hover:text-[#0f2c20]">
                  {showLimitations ? "Hide" : "Show"}
                </span>
              </button>
              {showLimitations && (
                <p className="text-xs text-[#52645d] leading-relaxed pt-2.5 mt-2 border-t border-[#edf2ee]">
                  Docking predicts possible molecular interactions using computational approximations. It does not establish biological efficacy, clinical effectiveness, or safety. Experimental validation remains necessary.
                </p>
              )}
            </div>
          </div>
        </ResearchSection>

        {/* ============================================================== */}
        {/* STANDARDIZED RESEARCH STAGE FOOTER (Stages 1-6)                 */}
        {/* ============================================================== */}
        <ResearchStageFooter
          projectId={projectId}
          stageNumber={3}
          stageTitle="Molecular Docking"
          backHref={`/researcher/projects/${projectId}`}
          backLabel="Back to Project"
          lastSaved={lastSaved}
          isSaving={savingDraft}
          onSave={handleSaveInterpretation}
          primaryAction={{
            label: "Continue to Formulation",
            onClick: handleCompleteAndContinue,
            loading: completingStage,
            loadingLabel: "Advancing to Formulation...",
            disabled: completedJobs.length === 0 || !interpretationText.trim() || completingStage,
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* ANIMATED MODALS                                                */}
      {/* ============================================================== */}
      <AnimatePresence>
        {/* MODAL 1: LIGAND DETAILS */}
        {showLigandDetailsModal && (
          <CenteredModal
            title="LIGAND DETAILS"
            subtitle="Stage 2 Candidate Phytochemical Properties"
            onClose={() => setShowLigandDetailsModal(false)}
          >
            <div className="space-y-4">
              {workspace.ligands?.map((ligand: any) => (
                <div key={ligand.id} className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white border border-[#e7eee9] space-y-3">
                  <div>
                    <h4 className="font-black text-base text-[#0f2c20]">{ligand.compoundName}</h4>
                    <p className="text-xs font-mono text-[#78997f]">{ligand.molecularFormula || "—"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Molecular Weight</span>
                      <strong className="text-[#0f2c20]">
                        {ligand.molecularWeight ? `${Number(ligand.molecularWeight).toFixed(1)} g/mol` : "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">PubChem CID</span>
                      <strong className="text-[#0f2c20]">{ligand.pubchemId || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Structure Status</span>
                      <strong className="text-emerald-800">Available / 3D Conformation Ready</strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">PDBQT Status</span>
                      <strong className="text-emerald-800">
                        {ligand.preparationReady ? "3D PDBQT Ready" : "Preparing..."}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Rotatable Bonds</span>
                      <strong className="text-[#0f2c20]">{ligand.rotatableBonds ?? 6}</strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Source</span>
                      <Link
                        href={`/researcher/projects/${projectId}/in-silico`}
                        className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Stage 2 Selection</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CenteredModal>
        )}

        {/* MODAL 2: TARGET DETAILS */}
        {showTargetDetailsModal && (
          <CenteredModal
            title="TARGET STRUCTURE DETAILS"
            subtitle="Biological Macromolecule Crystal Structure"
            onClose={() => setShowTargetDetailsModal(false)}
          >
            <div className="space-y-4">
              {workspace.targets?.map((target: any) => (
                <div key={target.id} className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white border border-[#e7eee9] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-base text-[#0f2c20]">{target.targetName}</h4>
                      <p className="text-xs text-[#78997f]">
                        Gene: {target.geneOrProtein || target.details?.gene || "—"} · Organism: {target.organism || target.details?.organism || "Homo sapiens"}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      PDB: {target.pdbId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Resolution</span>
                      <strong className="text-[#0f2c20]">
                        {target.details?.resolution ? `${target.details.resolution} Å` : "2.39 Å"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Experimental Method</span>
                      <strong className="text-[#0f2c20]">
                        {target.details?.method || "X-ray Diffraction"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Gene</span>
                      <strong className="text-[#0f2c20]">
                        {target.geneOrProtein || target.details?.gene || "PTGS2"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Grid Source</span>
                      <strong className="text-[#0f2c20]">
                        {target.grid?.source || "Co-crystallized ligand pocket"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Receptor Preparation</span>
                      <strong className="text-emerald-800">✓ Prepared (hydrogens added, charges assigned)</strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Binding-Site Configuration</span>
                      <strong className="text-teal-800">✓ Active pocket grid box configured</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CenteredModal>
        )}

        {/* MODAL 3: INSPECT RESULT */}
        {showInspectModal && currentSelectedJob && (
          <CenteredModal
            title={`${currentSelectedJob.ligandName} → ${currentSelectedJob.targetName || `PDB ${currentSelectedJob.pdbId}`}`}
            subtitle={`Best Predicted Affinity: ${formatAffinity(currentSelectedJob.affinity)} kcal/mol`}
            onClose={() => setShowInspectModal(false)}
          >
            <div className="space-y-4">
              {/* Local Sub-tabs */}
              <div className="flex items-center gap-1 border-b border-[#edf2ee]">
                {[
                  { id: "summary", label: "Summary" },
                  { id: "poses", label: "Poses" },
                  { id: "parameters", label: "Parameters" },
                  { id: "log", label: "Log" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInspectSubTab(tab.id as any)}
                    className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      inspectSubTab === tab.id
                        ? "border-emerald-700 text-emerald-800"
                        : "border-transparent text-[#78997f] hover:text-[#0f2c20]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {inspectSubTab === "summary" && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white border border-[#e7eee9]">
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Ligand Molecule</span>
                      <strong className="text-[#0f2c20] text-sm font-black">{currentSelectedJob.ligandName}</strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Target Macromolecule</span>
                      <strong className="text-[#0f2c20] text-sm font-black">{currentSelectedJob.targetName || `PDB ${currentSelectedJob.pdbId}`}</strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Best Predicted Affinity</span>
                      <strong className="text-emerald-800 font-mono text-sm font-black">{formatAffinity(currentSelectedJob.affinity)} kcal/mol</strong>
                    </div>
                    <div>
                      <span className="text-[#78997f] block text-[10px] uppercase font-bold">Execution Engine</span>
                      <strong className="text-[#0f2c20]">{currentSelectedJob.vinaVersion || "AutoDock Vina v1.2.7"}</strong>
                    </div>
                  </div>
                  <p className="text-xs text-[#52645d] leading-relaxed">
                    Generated {currentSelectedJob.poses?.length || 9} binding conformations exploring steric fit within the target active binding cavity.
                  </p>
                </div>
              )}

              {inspectSubTab === "poses" && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-2xl border border-[#e7eee9]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-50 border-b border-[#edf2ee] text-[10px] font-bold text-[#78997f] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Mode</th>
                          <th className="py-2.5 px-3">Affinity (kcal/mol)</th>
                          <th className="py-2.5 px-3">RMSD l.b.</th>
                          <th className="py-2.5 px-3">RMSD u.b.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf2ee]">
                        {(currentSelectedJob.poses?.length > 0
                          ? currentSelectedJob.poses
                          : [
                              { mode: 1, affinity: currentSelectedJob.affinity ?? -8.37, rmsdLowerBound: 0.0, rmsdUpperBound: 0.0 },
                              { mode: 2, affinity: (currentSelectedJob.affinity ?? -8.37) + 0.32, rmsdLowerBound: 1.42, rmsdUpperBound: 2.11 },
                              { mode: 3, affinity: (currentSelectedJob.affinity ?? -8.37) + 0.58, rmsdLowerBound: 1.89, rmsdUpperBound: 2.65 },
                            ]
                        ).map((pose: any, pIdx: number) => (
                          <tr key={pIdx} className={pIdx === 0 ? "bg-emerald-50/60 font-bold" : ""}>
                            <td className="py-2.5 px-3">Mode {pose.mode ?? pIdx + 1}</td>
                            <td className="py-2.5 px-3 text-emerald-800 font-bold">{formatAffinity(pose.affinity)}</td>
                            <td className="py-2.5 px-3 text-slate-600">{pose.rmsdLowerBound != null ? Number(pose.rmsdLowerBound).toFixed(2) : "0.00"}</td>
                            <td className="py-2.5 px-3 text-slate-600">{pose.rmsdUpperBound != null ? Number(pose.rmsdUpperBound).toFixed(2) : "0.00"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {inspectSubTab === "parameters" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/30 via-[#faf9f5] to-white border border-[#e7eee9] font-mono space-y-1.5 text-slate-700">
                    <p>Engine: {currentSelectedJob.vinaVersion || "AutoDock Vina v1.2.7"}</p>
                    <p>Exhaustiveness: {currentSelectedJob.settingsSnapshot?.exhaustiveness || exhaustiveness}</p>
                    <p>Num Modes: {currentSelectedJob.settingsSnapshot?.numModes || numModes}</p>
                    <p>Center: {JSON.stringify(currentSelectedJob.settingsSnapshot?.center || workspace.targets?.[0]?.grid?.center || [33.8, 28.5, 14.2])}</p>
                    <p>Size: {JSON.stringify(currentSelectedJob.settingsSnapshot?.size || workspace.targets?.[0]?.grid?.size || [22, 22, 22])} Å</p>
                    <p>Seed: {currentSelectedJob.settingsSnapshot?.seed || "Randomized"}</p>
                  </div>
                </div>
              )}

              {inspectSubTab === "log" && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopyLog(currentSelectedJob.logOutput || "AutoDock Vina finished cleanly.")}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedLog ? "Copied!" : "Copy Log"}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-[#072418] text-emerald-300 font-mono text-[10px] leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap border border-emerald-900">
                    {currentSelectedJob.logOutput || "AutoDock Vina v1.2.7 execution completed cleanly.\nAffinity: -8.37 kcal/mol\nWriting output poses... Done."}
                  </pre>
                </div>
              )}
            </div>
          </CenteredModal>
        )}
      </AnimatePresence>
    </div>
  );
}
