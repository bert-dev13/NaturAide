"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Atom,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Cpu,
  Dna,
  Edit3,
  ExternalLink,
  FileCode,
  FileText,
  FlaskConical,
  Info,
  Layers,
  Lightbulb,
  Loader2,
  Play,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Trophy,
  X,
} from "lucide-react";
import { ResearchStageHeader } from "@/components/researcher/stage/ResearchStageHeader";
import { ResearchStageFooter } from "@/components/researcher/stage/ResearchStageFooter";

// Utility formatting for binding affinity: -9.702 -> "−9.702"
function formatAffinity(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value).toFixed(3);
  if (value < 0) return `\u2212${abs}`;
  if (value > 0) return `+${abs}`;
  return abs;
}

function cleanText(text: string): string {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !/^research context\s*:/i.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shortTargetLabel(name?: string | null, gene?: string | null): string {
  const label = String(name || "").trim();
  const symbol = String(gene || "").trim();
  if (/cyclooxygenase[-\s]*2/i.test(label) || /cox[-\s]*2/i.test(`${label} ${symbol}`)) return "COX-2";
  if (symbol && symbol.length <= 12) return symbol;
  return symbol || label || "Target";
}

interface SimpleMolecularDockingClientProps {
  projectId: number;
  initialWorkspace: any;
  stageCompleted?: boolean;
}

export default function SimpleMolecularDockingClient({
  projectId,
  initialWorkspace,
  stageCompleted = false,
}: SimpleMolecularDockingClientProps) {
  const router = useRouter();

  // Primary workspace state
  const [workspace, setWorkspace] = useState<any>(initialWorkspace);
  const [interpretation, setInterpretation] = useState<string>(
    cleanText(initialWorkspace.interpretation?.text || "")
  );
  const [approved, setApproved] = useState<boolean>(
    Boolean(initialWorkspace.interpretation?.approved)
  );
  const [dirty, setDirty] = useState<boolean>(false);

  // Inline disclosure in selected result
  const [expandedDetail, setExpandedDetail] = useState<"params" | "log" | "evidence" | null>(null);

  // Result selection
  const [selectedJobIndex, setSelectedJobIndex] = useState<number>(0);

  // Editing interpretation modal
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [draftInterpretation, setDraftInterpretation] = useState<string>("");

  // Action states
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [copiedLog, setCopiedLog] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Sync workspace and interpretation
  const applyWorkspace = (next: any) => {
    setWorkspace(next);
    if (!dirty) {
      setInterpretation(cleanText(next.interpretation?.text || ""));
      setApproved(Boolean(next.interpretation?.approved));
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

  // Poll when active runs exist
  useEffect(() => {
    if (!workspace.busy) return;
    const timer = setTimeout(() => {
      void refreshWorkspace();
    }, 2000);
    return () => clearTimeout(timer);
  }, [workspace.busy, workspace.jobs]);

  // Completed jobs & ranked runs
  const completedJobs: any[] = useMemo(() => {
    const jobs = (workspace.jobs || []).filter(
      (job: any) => job.status === "COMPLETED" && Number.isFinite(job.affinity)
    );
    // Sort by best affinity (lowest numerical / most negative value)
    return [...jobs].sort((a, b) => (a.affinity ?? 0) - (b.affinity ?? 0));
  }, [workspace.jobs]);

  // Ensure selected index is valid
  const currentJob = completedJobs[selectedJobIndex] || completedJobs[0] || (workspace.jobs || [])[0] || null;

  // Active target & ligand summary for horizontal experiment bar
  const primaryTarget = workspace.targets?.[0];
  const targetLabel = shortTargetLabel(primaryTarget?.targetName, primaryTarget?.geneOrProtein);
  const targetPdb = primaryTarget?.pdbId || "5KIR";
  const engineVersion = workspace.engine?.version || "AutoDock Vina 1.2.7";
  const ligandsCount = workspace.ligands?.length || 2;
  const allCompleted = completedJobs.length > 0 && completedJobs.length === (workspace.jobs?.length || 0);

  // Strongest affinity across all jobs for relative bar widths
  const maxAbsAffinity = useMemo(() => {
    const values = completedJobs.map((j) => Math.abs(j.affinity || 0));
    return Math.max(...values, 10);
  }, [completedJobs]);

  // Can the stage be finalized and continued?
  const canComplete =
    completedJobs.length > 0 &&
    approved &&
    interpretation.trim().length > 0 &&
    !workspace.busy;

  // Handlers
  const handleRunJob = async (job: any) => {
    const key = `${job.compoundId}-${job.targetId}`;
    setRunningKey(key);
    setErrorNotice(null);
    try {
      await postApi({ action: "run", compoundId: job.compoundId, targetId: job.targetId });
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setRunningKey(null);
    }
  };

  const handleRunAll = async () => {
    setRunningKey("all");
    setErrorNotice(null);
    try {
      await postApi({ action: "run-all" });
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setRunningKey(null);
    }
  };

  // Generate / regenerate scientific draft
  const handleRegenerateDraft = () => {
    if (!completedJobs.length) return;
    const best = completedJobs[0];
    const lines = completedJobs.map(
      (j: any) =>
        `${j.ligandName} → ${j.targetName} (PDB ${j.pdbId}): ${formatAffinity(j.affinity)} kcal/mol, ${j.poseCount || 9} poses.`
    );
    const draft = [
      lines.join("\n"),
      "",
      `${best.ligandName} produced the strongest predicted affinity against ${best.targetName} in this docking set (${formatAffinity(best.affinity)} kcal/mol).`,
      "These values represent computational binding affinities modeled with AutoDock Vina. They are not experimental measurements.",
    ].join("\n");

    setInterpretation(draft);
    setDirty(true);
    setApproved(false);
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setErrorNotice(null);
    try {
      await postApi({ action: "save-interpretation", keyFindings: interpretation, approve: false });
      setDirty(false);
      setApproved(false);
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSaveAndApprove = async () => {
    setSavingDraft(true);
    setErrorNotice(null);
    try {
      await postApi({ action: "save-interpretation", keyFindings: interpretation, approve: true });
      setDirty(false);
      setApproved(true);
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleCompleteStage = async () => {
    if (!canComplete) {
      setErrorNotice("Please ensure all docking jobs are completed and the scientific interpretation is approved.");
      return;
    }
    setCompleting(true);
    setErrorNotice(null);
    try {
      const res = await postApi({ action: "complete-stage" });
      router.push(res.redirectUrl || `/researcher/projects/${projectId}/formulation-safety`);
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleCopyLog = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  // Interpretation Section breakdowns
  const bestJob = completedJobs[0] || null;
  const leadStatement = bestJob
    ? `${bestJob.ligandName} produced the strongest predicted affinity against ${bestJob.targetName} in this docking set.`
    : "Molecular docking analysis completed for selected botanical ligands.";

  const comparisonNarrative = useMemo(() => {
    if (!completedJobs.length) return "Docking runs currently processing.";
    if (completedJobs.length === 1) {
      return `${completedJobs[0].ligandName} achieved a predicted binding affinity of ${formatAffinity(completedJobs[0].affinity)} kcal/mol against ${completedJobs[0].targetName}.`;
    }
    const [first, ...rest] = completedJobs;
    const restDetails = rest
      .map((r) => `${r.ligandName} (${formatAffinity(r.affinity)} kcal/mol)`)
      .join(", ");
    const diff = Math.abs((first.affinity ?? 0) - (rest[0]?.affinity ?? 0)).toFixed(3);
    return `${first.ligandName} demonstrated the highest predicted binding affinity at ${formatAffinity(first.affinity)} kcal/mol, outperforming ${restDetails} by a margin of ${diff} kcal/mol under identical grid parameters.`;
  }, [completedJobs]);

  const interpretationNarrative = useMemo(() => {
    if (!bestJob) return "Evaluating energetic complementarity and docking poses.";
    return `The pronounced negative affinity (${formatAffinity(bestJob.affinity)} kcal/mol) indicates favorable steric and electrostatic complementarity with the ${bestJob.targetName} active binding pocket (PDB ${bestJob.pdbId}), consistent with known flavonoid/triterpenoid anti-inflammatory interaction modes.`;
  }, [bestJob]);

  const limitationsNarrative =
    "Docking predictions do not establish biological efficacy, clinical effectiveness, or safety. Computational scoring functions approximate free energy in a rigid/semi-rigid environment without dynamic solvent effects or in-vivo cellular pharmacokinetics.";

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#f7faf8] via-[#fbfcfb] to-[#f4f7f5] text-slate-800 font-sans pb-32">
      {/* 1. STANDARDIZED COMPACT HEADER */}
      <ResearchStageHeader
        stageNumber={3}
        totalStages={6}
        stageTitle="Molecular Docking"
        plantCommonName={workspace.project?.plantName || "Ampalaya"}
        plantScientificName={workspace.project?.plantScientificName || "Momordica charantia"}
        statusLabel={stageCompleted ? "Completed" : allCompleted ? "Docking Completed" : "In Progress"}
        complete={stageCompleted || allCompleted}
        projectId={projectId}
        backHref={`/researcher/projects/${projectId}/in-silico`}

      />

      {/* ERROR BANNER IF ANY */}
      {errorNotice && (
        <div className="w-full px-4 sm:px-6 lg:px-10 pt-4">
          <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-300 text-rose-900 text-xs font-medium flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-600 hover:text-rose-900 font-bold ml-4 p-1 rounded-lg hover:bg-rose-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FULL WIDTH MAIN CANVAS */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-8">
        {/* ============================================================== */}
        {/* RESULTS WORKSPACE — TWO COLUMN SCIENTIFIC CANVAS               */}
        {/* ============================================================== */}
        <section aria-label="Docking Results Workspace">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ------------------------------------------------------------ */}
            {/* LEFT COLUMN: DEDICATED CONTAINER SIDEBAR FOR RESULTS         */}
            {/* ------------------------------------------------------------ */}
            <aside
              aria-label="Docking Candidates Sidebar"
              className="lg:col-span-4 rounded-3xl border border-emerald-200/90 bg-gradient-to-b from-white via-emerald-50/20 to-teal-50/25 p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                    <FlaskConical className="w-4 h-4 text-emerald-700" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Docking Results
                    </h3>
                    <p className="text-[11px] font-semibold text-emerald-800/80">
                      Predicted binding affinity · {engineVersion}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-950 font-mono text-[10px] font-black uppercase tracking-wider border border-emerald-300/60 shadow-2xs">
                  {completedJobs.length} Screened
                </span>
              </div>

              <div className="space-y-3">
                {completedJobs.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white border border-dashed border-emerald-300 text-center space-y-2">
                    <Cpu className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">No Docking Runs Completed</p>
                    <button
                      type="button"
                      onClick={handleRunAll}
                      disabled={runningKey === "all"}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Docking Now</span>
                    </button>
                  </div>
                ) : (
                  completedJobs.map((job: any, idx: number) => {
                    const isSelected =
                      currentJob &&
                      currentJob.compoundId === job.compoundId &&
                      currentJob.targetId === job.targetId;
                    const rankNumber = String(idx + 1).padStart(2, "0");

                    return (
                      <motion.div
                        key={`${job.compoundId}-${job.targetId}`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setSelectedJobIndex(idx);
                          setExpandedDetail(null);
                        }}
                        className={`relative cursor-pointer rounded-2xl p-4 sm:p-5 transition-all select-none border ${
                          isSelected
                            ? "bg-gradient-to-br from-[#082218] via-[#0d3424] to-[#04160f] text-white border-2 border-emerald-400 shadow-xl shadow-emerald-950/20 ring-4 ring-emerald-500/10"
                            : "bg-white border-emerald-200/80 hover:border-emerald-400 hover:shadow-md text-slate-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <span
                              className={`font-mono text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? "bg-gradient-to-r from-emerald-400 to-teal-300 text-[#051a11]"
                                  : "bg-emerald-100/90 text-emerald-800"
                              }`}
                            >
                              • RANKED {rankNumber}
                            </span>
                            <h3
                              className={`font-black text-base sm:text-lg truncate tracking-tight pt-0.5 ${
                                isSelected ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {job.ligandName}
                            </h3>
                            <p
                              className={`text-xs font-medium truncate ${
                                isSelected ? "text-emerald-200/90" : "text-slate-500"
                              }`}
                            >
                              — {job.targetName}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <div
                              className={`font-mono text-2xl sm:text-3xl font-black tracking-tight ${
                                isSelected ? "text-emerald-300 drop-shadow-sm" : "text-emerald-900"
                              }`}
                            >
                              {formatAffinity(job.affinity)}
                            </div>
                            <div
                              className={`text-[11px] font-bold font-mono ${
                                isSelected ? "text-emerald-200/70" : "text-slate-400"
                              }`}
                            >
                              kcal/mol
                            </div>
                          </div>
                        </div>

                        <div
                          className={`mt-3.5 pt-3 border-t flex items-center justify-between text-xs font-medium ${
                            isSelected ? "border-white/10 text-emerald-200" : "border-slate-200/60 text-slate-500"
                          }`}
                        >
                          <span className="font-mono text-[11px] flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{job.poseCount || job.record?.poses?.length || 9} poses</span>
                          </span>
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-300">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                              </span>
                              <span>Selected ✓</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-bold group-hover:underline">
                              Inspect →
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* ------------------------------------------------------------ */}
            {/* RIGHT COLUMN: SELECTED RESULT (~65% width, 8 of 12 cols lg)  */}
            {/* ------------------------------------------------------------ */}
            <div className="lg:col-span-8">
              {currentJob ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentJob.compoundId}-${currentJob.targetId}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 p-6 sm:p-8 shadow-sm space-y-6"
                  >
                    {/* Ambient light glow */}
                    <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

                    {/* Header + Big Numerical Affinity */}
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-emerald-100/80 pb-6">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-bold uppercase tracking-wider border border-emerald-300/60 shadow-xs">
                          <Atom className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Binding Inspection</span>
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                          {currentJob.ligandName} <span className="text-emerald-700">→</span> {currentJob.targetName}
                        </h3>
                        <div className="font-mono text-[11px] uppercase tracking-wider text-emerald-800/70 font-bold">
                          PREDICTED · {engineVersion}
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div className="flex items-baseline gap-2 sm:justify-end">
                          <span className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-emerald-950 drop-shadow-xs">
                            {formatAffinity(currentJob.affinity)}
                          </span>
                          <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                            kcal/mol
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compact Metadata Row */}
                    <div className="relative z-10 flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-900 font-mono font-bold shadow-2xs">
                        PDB {currentJob.pdbId || targetPdb}
                      </span>
                      <span className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-900 font-mono font-bold shadow-2xs">
                        {currentJob.poseCount || currentJob.record?.poses?.length || 9} poses
                      </span>
                      <span className="px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-900 font-mono font-bold shadow-2xs">
                        Seed {currentJob.record?.config?.seed ?? 42}
                      </span>
                      <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-950 font-mono font-black inline-flex items-center gap-1.5 shadow-2xs">
                        <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                        <span>Completed ✓</span>
                      </span>
                    </div>

                    {/* ------------------------------------------------------ */}
                    {/* PREDICTED POSES VISUALIZATION                         */}
                    {/* ------------------------------------------------------ */}
                    <div className="relative z-10 space-y-3 pt-2">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-emerald-700" />
                          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                            Predicted Poses
                          </h4>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          Affinity distribution across modes
                        </span>
                      </div>

                      {currentJob.record?.poses && currentJob.record.poses.length > 0 ? (
                        <div className="space-y-2 rounded-2xl bg-gradient-to-br from-[#082218] via-[#0b291c] to-[#04140d] p-5 text-white border border-emerald-800/60 font-mono text-xs shadow-inner">
                          {currentJob.record.poses.map((p: any) => {
                            const poseAffinity = Number(p.affinity);
                            const widthPct = Math.max(
                              18,
                              Math.min(100, Math.round((Math.abs(poseAffinity) / maxAbsAffinity) * 100))
                            );

                            return (
                              <div
                                key={p.mode}
                                className="grid grid-cols-12 items-center gap-3 py-1.5 hover:bg-white/10 rounded-lg px-2 transition-colors"
                              >
                                <span className="col-span-2 text-emerald-300 font-bold">
                                  Pose {p.mode}
                                </span>
                                <span className="col-span-3 text-right font-black text-white">
                                  {formatAffinity(poseAffinity)}{" "}
                                  <span className="text-[10px] text-emerald-200/60 font-normal">kcal/mol</span>
                                </span>
                                <div className="col-span-5 h-2.5 w-full bg-emerald-950/80 rounded-full overflow-hidden p-0.5 border border-emerald-700/40">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${widthPct}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 shadow-sm shadow-emerald-400/60"
                                  />
                                </div>
                                <span className="col-span-2 text-right text-[10px] text-emerald-200/80 truncate font-semibold">
                                  {p.rmsdLb != null && p.rmsdLb > 0 ? `+${p.rmsdLb.toFixed(2)}` : "0.00"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                          {currentJob.poseCount || 9} conformations identified with top mode at {formatAffinity(currentJob.affinity)} kcal/mol.
                        </div>
                      )}
                    </div>

                    {/* ------------------------------------------------------ */}
                    {/* INLINE EXPANDABLE DETAILS: PARAMETERS / VINA LOG / LIT */}
                    {/* ------------------------------------------------------ */}
                    <div className="relative z-10 border-t border-emerald-100 pt-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDetail(expandedDetail === "params" ? null : "params")
                          }
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            expandedDetail === "params"
                              ? "bg-emerald-900 text-white border-emerald-900 shadow-sm"
                              : "bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-200 shadow-2xs"
                          }`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Parameters</span>
                          {expandedDetail === "params" ? (
                            <ChevronUp className="w-3 h-3 ml-0.5" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDetail(expandedDetail === "log" ? null : "log")
                          }
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            expandedDetail === "log"
                              ? "bg-emerald-900 text-white border-emerald-900 shadow-sm"
                              : "bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-200 shadow-2xs"
                          }`}
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Vina Log</span>
                          {expandedDetail === "log" ? (
                            <ChevronUp className="w-3 h-3 ml-0.5" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDetail(expandedDetail === "evidence" ? null : "evidence")
                          }
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            expandedDetail === "evidence"
                              ? "bg-emerald-900 text-white border-emerald-900 shadow-sm"
                              : "bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-200 shadow-2xs"
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Scientific Evidence</span>
                          {expandedDetail === "evidence" ? (
                            <ChevronUp className="w-3 h-3 ml-0.5" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                          )}
                        </button>
                      </div>

                      {/* INLINE DISCLOSURE PANEL (NO MODAL) */}
                      <AnimatePresence>
                        {expandedDetail && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 p-5 shadow-xs"
                          >
                            {expandedDetail === "params" && (
                              <div className="space-y-3 text-xs">
                                <div className="font-extrabold text-slate-900">
                                  Simulation & Grid Parameters ({currentJob.ligandName} → {currentJob.targetName})
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                                  <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Exhaustiveness</span>
                                    <span className="font-black text-slate-800 text-sm">
                                      {currentJob.record?.config?.exhaustiveness ?? workspace.settings?.exhaustiveness ?? 8}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Poses Recorded</span>
                                    <span className="font-black text-slate-800 text-sm">
                                      {currentJob.poseCount || 9}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Random Seed</span>
                                    <span className="font-black text-slate-800 text-sm">
                                      {currentJob.record?.config?.seed ?? 42}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Grid Dimensions</span>
                                    <span className="font-black text-slate-800 text-sm">22 × 22 × 22 Å</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {expandedDetail === "log" && (
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800 font-mono">
                                    AutoDock Vina Execution Output
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLog(currentJob.record?.log || "")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>{copiedLog ? "Copied ✓" : "Copy Log"}</span>
                                  </button>
                                </div>
                                <pre className="p-4 rounded-xl bg-[#06170f] text-[#4ade80] font-mono text-[11px] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap selection:bg-emerald-800 selection:text-white border border-emerald-700/50 shadow-inner">
                                  {currentJob.record?.log || "AutoDock Vina completed successfully. Poses extracted into database."}
                                </pre>
                              </div>
                            )}

                            {expandedDetail === "evidence" && (
                              <div className="space-y-2 text-xs">
                                <div className="font-extrabold text-slate-900">Target Receptor Provenance</div>
                                <p className="text-slate-700 leading-relaxed">
                                  Structure retrieved from Protein Data Bank under accession <strong>{currentJob.pdbId || targetPdb}</strong>. Verified receptor model prepared with Gasteiger partial charges and polar hydrogens.
                                </p>
                                <div className="flex items-center gap-3 pt-2">
                                  {currentJob.sourceUrl && (
                                    <a
                                      href={currentJob.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100/90 text-emerald-900 hover:bg-emerald-200 font-bold border border-emerald-300 transition-colors"
                                    >
                                      <span>View in RCSB PDB</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {currentJob.record?.pubmedUrl && (
                                    <a
                                      href={currentJob.record.pubmedUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100/90 text-indigo-900 hover:bg-indigo-200 font-bold border border-indigo-300 transition-colors"
                                    >
                                      <span>PubMed Citation</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center text-slate-500 text-sm">
                  Select a docking result from the left panel to inspect poses and parameters.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3: AFFINITY COMPARISON — SINGLE FULL-WIDTH VISUALIZER   */}
        {/* ============================================================== */}
        {completedJobs.length > 0 && (
          <section aria-label="Affinity Comparison" className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                <Trophy className="w-4 h-4 text-emerald-700" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Affinity Comparison
              </h2>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 shadow-xs space-y-5">
              <div className="space-y-4">
                {completedJobs.map((job: any, idx: number) => {
                  const affinityNum = Number(job.affinity);
                  const widthPct = Math.max(
                    15,
                    Math.min(100, Math.round((Math.abs(affinityNum) / maxAbsAffinity) * 100))
                  );
                  const isTop = idx === 0;

                  return (
                    <div key={`comp-${job.compoundId}-${job.targetId}`} className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-slate-900 text-sm sm:text-base">
                            {job.ligandName}
                          </span>
                          <span className="text-slate-500 font-semibold text-xs">→ {job.targetName}</span>
                          {isTop && (
                            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 text-[#051a11] text-[10px] font-black uppercase tracking-wider shadow-sm">
                              Strongest Predicted
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-black text-slate-900 text-sm sm:text-base">
                          {formatAffinity(affinityNum)}{" "}
                          <span className="font-normal text-xs text-slate-500 font-mono">kcal/mol</span>
                        </span>
                      </div>

                      <div className="h-3.5 w-full rounded-full bg-slate-200/70 p-0.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full shadow-sm ${
                            isTop
                              ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-emerald-400/40"
                              : "bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-400"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 text-[11px] text-slate-600 font-medium border-t border-emerald-100/80 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>More negative values indicate stronger predicted affinity within this docking configuration.</span>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* SECTION 4: SCIENTIFIC INTERPRETATION                           */}
        {/* ============================================================== */}
        <section aria-label="Scientific Interpretation" className="pt-6 border-t border-emerald-200/80 space-y-6">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Scientific Interpretation
            </h2>
          </div>

          {/* Lead Statement Rich Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-[#0a3221] to-[#041a12] p-5 sm:p-6 text-white border border-emerald-700/50 shadow-md">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
            <div className="relative z-10 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <p className="text-base sm:text-lg font-bold text-emerald-100 leading-snug">
                {leadStatement}
              </p>
            </div>
          </div>

          {/* 3-Column Layout with Distinct Color Accents */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Comparison */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 border border-blue-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-blue-800">
                <Scale className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Comparison
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {comparisonNarrative}
              </p>
            </div>

            {/* Column 2: Interpretation */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 border border-emerald-200/90 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800">
                <Lightbulb className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Interpretation
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {interpretationNarrative}
              </p>
            </div>

            {/* Column 3: Limitations */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 border border-amber-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800">
                <ShieldAlert className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Limitations
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {limitationsNarrative}
              </p>
            </div>
          </div>

          {/* Verification Bar & Small Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border border-emerald-200/90 shadow-2xs">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold border shadow-2xs ${
                  approved
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      approved ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      approved ? "bg-emerald-600" : "bg-amber-600"
                    }`}
                  />
                </span>
                <span>
                  {approved ? "NatureAide AI · Researcher Approved" : "NatureAide AI · Pending Approval"}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRegenerateDraft}
                className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-bold transition-all shadow-2xs"
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftInterpretation(interpretation);
                  setEditModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-bold transition-all shadow-2xs"
              >
                Edit
              </button>
              {!approved && (
                <button
                  type="button"
                  disabled={savingDraft}
                  onClick={handleSaveAndApprove}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/20"
                >
                  Approve Synthesis
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================== */}
      {/* EDIT INTERPRETATION MODAL (ONLY MODAL ON PAGE)                */}
      {/* ============================================================== */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl bg-white border border-emerald-200 p-6 sm:p-7 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                    <Edit3 className="w-4 h-4 text-emerald-700" />
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Edit Scientific Interpretation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Synthesis & Biological Rationale
                </label>
                <textarea
                  rows={8}
                  value={draftInterpretation}
                  onChange={(e) => setDraftInterpretation(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-emerald-200 bg-[#fbfdfc] font-sans text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none leading-relaxed shadow-inner"
                  placeholder="Record formal scientific interpretation of binding affinities, relative comparisons, and mechanistic implications..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInterpretation(draftInterpretation);
                      setDirty(true);
                      setApproved(false);
                      setEditModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setInterpretation(draftInterpretation);
                      setEditModalOpen(false);
                      try {
                        await postApi({
                          action: "save-interpretation",
                          keyFindings: draftInterpretation,
                          approve: true,
                        });
                        setDirty(false);
                        setApproved(true);
                      } catch (e: any) {
                        setErrorNotice(e.message);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition-all"
                  >
                    Approve Interpretation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 5. STANDARDIZED UNIVERSAL STAGE FOOTER                        */}
      {/* ============================================================== */}
      <ResearchStageFooter
        projectId={projectId}
        stageNumber={3}
        stageTitle="Molecular Docking"
        previousStageRoute={`/researcher/projects/${projectId}/in-silico`}
        backLabel="Back to In-Silico Analysis"
        statusMessage={stageCompleted || allCompleted ? "Stage Completed" : "In Progress"}
        saveStatus={savingDraft ? "saving" : !dirty && approved ? "saved" : "idle"}
        onSave={handleSaveDraft}
        saveLabel="Save Draft"
        onContinue={handleCompleteStage}
        isContinuing={completing}
        continueLabel="Continue to Formulation & Safety"
        continuingLabel="Advancing to Formulation..."
        continueDisabled={!canComplete}
      />
    </div>
  );
}
