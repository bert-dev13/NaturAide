"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Atom,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Cpu,
  Dna,
  Download,
  FileCheck,
  FileText,
  FlaskConical,
  FolderGit2,
  Layers,
  Leaf,
  Lock,
  Microscope,
  MoreHorizontal,
  Network,
  Play,
  Route,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  type LucideIcon,
} from "lucide-react";
import { WORKFLOW_STAGES, getStageByKey, getStageUrl, type WorkflowStage } from "@/lib/workflow-stages";
import { ResearchSection, WORKSPACE_PRIMARY_BTN, WORKSPACE_SECONDARY_BTN } from "@/components/researcher/stage/ResearchWorkspaceUI";

interface ProjectData {
  id: number;
  title: string;
  researchObjective?: string;
  researchQuestion?: string;
  status: string;
  currentStage: string;
  progressPercent: number;
  plantName: string;
  plantScientificName?: string;
  createdAt: string;
}

interface StageRecord {
  stageKey: string;
  status: string;
}

interface ActivityRecord {
  actionType: string;
  description: string;
  createdAt: string;
}

interface Props {
  project: ProjectData;
  stages: StageRecord[];
  activities: ActivityRecord[];
  linkedStudies: number;
  openRevisionsCount?: number;
}

const FOCUS: Record<string, string> = {
  "plant-literature": "Investigate botanical identity, traditional ethnobotanical uses, and peer-reviewed scientific literature.",
  "in-silico": "Screen bioactive secondary metabolites and evaluate computational ADME / Lipinski drug-likeness criteria.",
  docking: "Perform AutoDock Vina molecular docking calculations to model receptor binding affinity and poses.",
  "formulation-safety": "Standardize extraction parameters, SOP preparation steps, and bioactive marker composition.",
  safety: "Evaluate preclinical and clinical safety evidence, toxicity boundaries, contraindications, and interactions.",
  "knowledge-integration": "Synthesize multi-stage scientific findings, alignment, limitations, and final research dossier.",
  "completion-integration": "Evaluate preclinical and clinical safety evidence, toxicity boundaries, contraindications, and interactions.",
  "expert-review": "Synthesize multi-stage scientific findings, alignment, limitations, and final research dossier.",
};

const STAGE_ICONS: Record<number, LucideIcon> = {
  1: Sprout,
  2: Cpu,
  3: Network,
  4: FlaskConical,
  5: ShieldCheck,
  6: CheckCircle2,
};

const STAGE_LABELS: Record<number, string> = {
  1: "Plant & Literature Research",
  2: "In-Silico Analysis",
  3: "Molecular Docking",
  4: "Formulation Development",
  5: "Safety / Clinical",
  6: "Knowledge Integration",
};

const OUTPUTS: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "plant-literature", label: "Literature", icon: BookOpen },
  { key: "in-silico", label: "In-Silico", icon: Atom },
  { key: "docking", label: "Docking", icon: Network },
  { key: "formulation-safety", label: "Formulation", icon: FlaskConical },
  { key: "safety", label: "Safety", icon: ShieldCheck },
  { key: "knowledge-integration", label: "Integration", icon: FileText },
];

function statusWord(status?: string) {
  if (status === "COMPLETED") return "Complete";
  if (status === "IN_PROGRESS" || status === "UNDER_REVIEW" || status === "SUBMITTED") return "In Progress";
  return "Upcoming";
}

function projectStatusLabel(status: string) {
  const value = (status || "").toUpperCase();
  if (value === "COMPLETED") return "Completed";
  if (value === "UNDER_REVIEW" || value === "READY_FOR_REVIEW") return "Under Review";
  if (value === "REVISION_REQUIRED" || value === "REVISIONS") return "Revisions";
  return "Active";
}

function startedLabel(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ResearchWorkspaceClient({
  project,
  stages,
  activities,
  linkedStudies,
  openRevisionsCount = 0,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [objective, setObjective] = useState(project.researchObjective || "");
  const [question, setQuestion] = useState(project.researchQuestion || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const stageStatus = useMemo(() => {
    const map: Record<string, string> = {};
    for (const stage of stages) map[stage.stageKey] = stage.status;
    return map;
  }, [stages]);

  const completedCount = WORKFLOW_STAGES.filter((stage) => stageStatus[stage.key] === "COMPLETED").length;
  const progress = Math.round((completedCount / WORKFLOW_STAGES.length) * 100);

  const current = useMemo(() => {
    const byKey = getStageByKey(project.currentStage);
    if (byKey && stageStatus[byKey.key] !== "COMPLETED") {
      return byKey;
    }
    const inProgress = WORKFLOW_STAGES.find(
      (stage) => stageStatus[stage.key] === "IN_PROGRESS" || stageStatus[stage.key] === "UNDER_REVIEW"
    );
    if (inProgress) return inProgress;
    const firstUncompleted = WORKFLOW_STAGES.find((stage) => stageStatus[stage.key] !== "COMPLETED");
    if (firstUncompleted) return firstUncompleted;
    return WORKFLOW_STAGES[WORKFLOW_STAGES.length - 1];
  }, [project.currentStage, stageStatus]);

  const currentIndex = Math.max(0, WORKFLOW_STAGES.findIndex((stage) => stage.key === current?.key));
  const continueHref = current ? getStageUrl(project.id, current.key) : getStageUrl(project.id, "plant-literature");
  const dossierHref = `/researcher/projects/${project.id}/knowledge-integration`;
  const isProjectCompleted = project.status === "COMPLETED" || completedCount === 6;

  function isStageAccessible(stage?: WorkflowStage, index?: number) {
    if (!stage) return false;
    if (stageStatus[stage.key] === "COMPLETED" || (current && stage.key === current.key)) return true;
    if (index === 0) return true;
    if (typeof index === "number" && index > 0 && WORKFLOW_STAGES[index - 1]) {
      return stageStatus[WORKFLOW_STAGES[index - 1].key] === "COMPLETED";
    }
    return false;
  }

  async function saveSnapshot() {
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch(`/api/researcher/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          researchObjective: objective.trim(),
          researchQuestion: question.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The project details could not be saved.");
      setEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The project details could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-none space-y-7 pb-28 pt-2 font-sans">
      {/* ============================================================== */}
      {/* 1. UNIFIED PROJECT WORKSPACE HEADER                            */}
      {/* ============================================================== */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-xl border border-emerald-900/60 bg-[#0f2c20] p-6 text-white shadow-sm"
      >
        <div className="relative z-10 space-y-4">
          {/* Top Bar: Label, Status, and Options */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-emerald-900/60">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-500/30">
                <FolderGit2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Project Workspace</span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-200">
                <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">{project.plantName || "Botanical Specimen"}</span>
                {project.plantScientificName && (
                  <span className="italic text-emerald-300/80 font-normal">({project.plantScientificName})</span>
                )}
              </span>
            </div>

            {/* Right Status Badge & Options Menu */}
            <div className="flex items-center gap-2.5 shrink-0">
              {openRevisionsCount > 0 && (
                <Link
                  href={`/researcher/projects/${project.id}/revisions`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/25 border border-amber-400/60 text-amber-300 hover:bg-amber-500/35 transition-colors shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Revisions ({openRevisionsCount})</span>
                </Link>
              )}

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{projectStatusLabel(project.status)}</span>
              </span>

              <div className="relative">
                <button
                  type="button"
                  aria-label="Project options"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                  className="rounded-lg border border-emerald-800/60 bg-emerald-950/60 p-2 text-emerald-300 hover:text-white hover:bg-emerald-900/60 transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1 text-slate-900 shadow-xl">
                    <button
                      type="button"
                      className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors"
                      onClick={() => {
                        setMenuOpen(false);
                        setEditing(true);
                        document.getElementById("research-snapshot")?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    >
                      Edit objectives
                    </button>
                    <Link
                      href={dossierHref}
                      className="block rounded-md px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      View Dossier
                    </Link>
                    {openRevisionsCount > 0 && (
                      <Link
                        href={`/researcher/projects/${project.id}/revisions`}
                        className="block rounded-md px-3 py-2 text-left text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors border-t border-slate-100"
                        onClick={() => setMenuOpen(false)}
                      >
                        Revisions ({openRevisionsCount})
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project Title & Overall Progress */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 max-w-3xl">
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                {project.title}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 line-clamp-1">
                Integrated botanical, computational, and safety evidence pipeline
              </p>
            </div>

            {/* Overall Progress Widget */}
            <div className="flex items-center gap-3.5 rounded-lg border border-emerald-800/60 bg-emerald-950/70 px-4 py-2.5 shadow-xs shrink-0">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-4 text-xs font-medium text-emerald-200">
                  <span>{completedCount} of 6 stages completed</span>
                  <span className="font-mono font-semibold text-white">{progress}%</span>
                </div>
                <div className="w-44 h-1.5 rounded-full bg-emerald-950 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* REVISIONS REQUIRED BANNER */}
      {openRevisionsCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/95 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 block font-mono">
                {openRevisionsCount} Professional Recommendation{openRevisionsCount > 1 ? "s" : ""} Require Attention
              </span>
              <span className="text-xs text-amber-800 font-medium">
                Professional reviewers have requested revisions across research stages. Please inspect and address the requested corrections.
              </span>
            </div>
          </div>
          <Link
            href={`/researcher/projects/${project.id}/revisions`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#164130] text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <span>Open Revisions Page</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CORE: 6-STAGE RESEARCH JOURNEY                              */}
      {/* ============================================================== */}
      <section
        id="research-journey"
        aria-label="6-Stage Research Journey"
        className="rounded-3xl border border-[#dde6df] bg-white p-5 sm:p-7 shadow-2xs space-y-5"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#edf2ee]">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
              <Route className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-[#0f2c20] tracking-tight">
                Research Journey
              </h2>
              <p className="text-xs text-[#6b7c76]">
                Sequential scientific validation pipeline across 6 standardized stages
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f6f8f6] border border-[#dde6df] text-xs font-bold text-[#0f2c20] self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Current Focus: Stage {current?.number || 1} of 6 · {current?.label || "Plant & Literature"}</span>
          </div>
        </div>

        {/* Desktop Interactive 6-Stage Timeline */}
        <div className="hidden md:block">
          <ol className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {WORKFLOW_STAGES.map((stage, index) => {
              const isCompleted = stageStatus[stage.key] === "COMPLETED";
              const isCurrent = stage.key === current?.key;
              const isAccessible = isStageAccessible(stage, index);
              const StageIconComponent = STAGE_ICONS[stage.number] || Sparkles;

              const stageContent = (
                <motion.div
                  whileHover={isAccessible ? { y: -2 } : undefined}
                  className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200 h-full ${
                    isCurrent
                      ? "bg-gradient-to-b from-emerald-50/70 via-white to-white border-2 border-emerald-600 shadow-md ring-4 ring-emerald-500/10"
                      : isCompleted
                      ? "bg-[#fbfdfb] border-[#dde6df] hover:border-emerald-300 hover:shadow-2xs"
                      : "bg-[#f8faf8]/70 border-[#e8eee9] opacity-75"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Stage Badge + Status */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        Stage {String(stage.number).padStart(2, "0")}
                      </span>

                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/80">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>Done</span>
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-950 bg-emerald-200/80 px-2 py-0.5 rounded-full border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>

                    {/* Icon + Title */}
                    <div className="flex flex-col items-center text-center space-y-2 py-1">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-emerald-600 text-white shadow-2xs group-hover:scale-105"
                            : isCurrent
                            ? "bg-[#0f2c20] text-emerald-300 ring-4 ring-emerald-100 shadow-md"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <StageIconComponent className="w-5 h-5" />
                        )}
                      </div>

                      <span className="text-xs font-bold text-[#0f2c20] leading-snug min-h-[2.25rem] flex items-center justify-center">
                        {STAGE_LABELS[stage.number]}
                      </span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="pt-2">
                    <div
                      className={`h-1 w-full rounded-full transition-all ${
                        isCompleted
                          ? "bg-emerald-500"
                          : isCurrent
                          ? "bg-[#0f2c20] h-1.5"
                          : "bg-slate-200"
                      }`}
                    />
                  </div>
                </motion.div>
              );

              return (
                <li key={stage.key} className="h-full">
                  {isAccessible ? (
                    <Link href={getStageUrl(project.id, stage.key)} className="block h-full">
                      {stageContent}
                    </Link>
                  ) : (
                    <div className="h-full">{stageContent}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Mobile Vertical Progression Trail */}
        <ol className="space-y-2 md:hidden pt-1">
          {WORKFLOW_STAGES.map((stage, index) => {
            const isCompleted = stageStatus[stage.key] === "COMPLETED";
            const isCurrent = stage.key === current?.key;
            const isAccessible = isStageAccessible(stage, index);
            const StageIconComponent = STAGE_ICONS[stage.number] || Sparkles;

            const mobileRow = (
              <div
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? "bg-gradient-to-r from-emerald-50/70 via-white to-white border-2 border-emerald-600 shadow-sm"
                    : isCompleted
                    ? "bg-white border-emerald-200 shadow-2xs"
                    : "bg-[#f8faf8]/80 border-slate-200 opacity-70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-[#0f2c20] text-emerald-300 ring-2 ring-emerald-400"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5 stroke-[2.5]" /> : <StageIconComponent className="h-5 w-5" />}
                  </span>
                  <div>
                    <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      Stage {String(stage.number).padStart(2, "0")}
                    </span>
                    <span className="text-xs font-bold text-[#0c2e1f]">
                      {STAGE_LABELS[stage.number]}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CircleCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Completed</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-950 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>Current</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <li key={stage.key}>
                {isAccessible ? (
                  <Link href={getStageUrl(project.id, stage.key)} className="block">
                    {mobileRow}
                  </Link>
                ) : (
                  mobileRow
                )}
              </li>
            );
          })}
        </ol>

        {/* Current Stage Primary CTA Bar */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0a2318] via-[#0f2c20] to-[#164533] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md shadow-emerald-950/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">
                {isProjectCompleted ? "Research Finalized" : "Active Stage Focus"}
              </span>
              <span className="text-xs text-emerald-200/80 font-medium">
                Stage {current?.number || 1} of 6
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold tracking-tight text-white">
              {isProjectCompleted
                ? "All 6 Stages Completed · Research Dossier Finalized"
                : `${String(current?.number || 1).padStart(2, "0")} — ${STAGE_LABELS[current?.number || 1]}`}
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl">
              {isProjectCompleted
                ? "This scientific research dossier has fulfilled all 6 stages of the NatureAide validation workflow and passed professional review."
                : FOCUS[current?.key || "plant-literature"]}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={isProjectCompleted ? dossierHref : continueHref}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 px-5 py-2.5 text-xs font-black text-[#051a11] shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{isProjectCompleted ? "View Final Dossier" : "Continue Research"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CURRENT RESEARCH SNAPSHOT & OBJECTIVES                      */}
      {/* ============================================================== */}
      <ResearchSection
        id="research-snapshot"
        icon={Target}
        title="Research Objectives &amp; Focus"
        delay={0.1}
        action={!editing ? <button type="button" className={WORKSPACE_SECONDARY_BTN} onClick={() => setEditing(true)}>Edit</button> : undefined}
      >
        {editing ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#78997f]">Objective</span>
              <textarea
                className="mt-1 w-full rounded-xl border border-[#dde6df] bg-white px-3 py-2 text-sm text-[#0c2419] outline-none focus:border-emerald-500"
                rows={3}
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#78997f]">Research Question</span>
              <textarea
                className="mt-1 w-full rounded-xl border border-[#dde6df] bg-white px-3 py-2 text-sm text-[#0c2419] outline-none focus:border-emerald-500"
                rows={3}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
            </label>
            <div className="flex items-center gap-2 md:col-span-2">
              <button type="button" className={WORKSPACE_PRIMARY_BTN} disabled={saving} onClick={() => void saveSnapshot()}>
                {saving ? "Saving..." : "Save Details"}
              </button>
              <button type="button" className={WORKSPACE_SECONDARY_BTN} onClick={() => setEditing(false)}>
                Cancel
              </button>
              {saveError && <span className="text-xs font-semibold text-rose-800">{saveError}</span>}
            </div>
          </div>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Target, label: "Objective", value: objective.trim() || "Evaluate phytochemical and therapeutic efficacy" },
              { icon: Activity, label: "Research Question", value: question.trim() || "What active constituents mediate primary bioactivity?" },
              { icon: Calendar, label: "Started", value: startedLabel(project.createdAt) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-emerald-100 bg-[#f7faf8] px-4 py-3">
                <dt className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#78997f]">
                  <item.icon className="h-3.5 w-3.5 text-emerald-700" />
                  {item.label}
                </dt>
                <dd className="mt-1 text-xs sm:text-sm font-semibold leading-relaxed text-[#0f2c20]">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </ResearchSection>

      {/* ============================================================== */}
      {/* 4. RESEARCH OUTPUTS                                            */}
      {/* ============================================================== */}
      <div className="w-full">
        <ResearchSection icon={FlaskConical} title="Research Outputs" delay={0.14} compact>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {OUTPUTS.map((output) => {
              const stage = WORKFLOW_STAGES.find((item) => item.key === output.key) || getStageByKey(output.key);
              const index = WORKFLOW_STAGES.findIndex((item) => item.key === output.key);
              const state = statusWord(stageStatus[output.key]);
              const open = isStageAccessible(stage, index);
              const Icon = output.icon;

              const cardBody = (
                <div className="flex h-full items-center gap-2.5 rounded-2xl border border-emerald-100/80 bg-white/95 p-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm">
                  <span className="rounded-xl bg-emerald-100 p-2 text-emerald-800">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-[#0f2c20] truncate">{output.label}</span>
                    <span
                      className={`text-[11px] font-bold ${
                        state === "Complete"
                          ? "text-emerald-700"
                          : state === "In Progress"
                          ? "text-amber-700"
                          : "text-slate-400"
                      }`}
                    >
                      {state}
                    </span>
                  </div>
                </div>
              );

              return (
                <li key={output.key}>
                  {open ? <Link href={getStageUrl(project.id, output.key)}>{cardBody}</Link> : cardBody}
                </li>
              );
            })}
          </ul>
        </ResearchSection>
      </div>
    </div>
  );
}
