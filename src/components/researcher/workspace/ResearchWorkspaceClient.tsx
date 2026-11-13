"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Cpu,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  FolderKanban,
  Award,
  Leaf,
  ChevronDown,
} from "lucide-react";
import { V2SectionProgress } from "@/lib/v2-progress-service";

interface ProjectData {
  id: number;
  title: string;
  researchObjective?: string;
  researchQuestion?: string;
  status: string;
  currentStage?: string;
  progressPercent: number;
  plantName: string;
  plantScientificName?: string;
  updatedAt?: string;
  createdAt: string;
}

interface ActivityRecord {
  actionType: string;
  description: string;
  createdAt: string;
}

interface FormulationOverview {
  formulationName?: string;
  dosageFormType?: string;
  formulationType?: string;
  componentsCount?: number;
}

interface Props {
  project: ProjectData;
  v2Progress: V2SectionProgress;
  activities: ActivityRecord[];
  linkedStudies: number;
  openRevisionsCount?: number;
  formulationOverview?: FormulationOverview | null;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

type SectionTone = {
  key: string;
  accent: string;
  soft: string;
  border: string;
  bar: string;
  iconWrap: string;
  ring: string;
  cta: string;
  glow: string;
};

const SECTION_TONES: Record<string, SectionTone> = {
  emerald: {
    key: "emerald",
    accent: "text-emerald-900",
    soft: "bg-emerald-50",
    border: "border-emerald-200/80",
    bar: "bg-emerald-500",
    iconWrap: "bg-emerald-600 text-white",
    ring: "ring-emerald-500/20",
    cta: "bg-[#0f2c20] hover:bg-[#164533] text-white",
    glow: "from-emerald-500/15 via-transparent to-transparent",
  },
  teal: {
    key: "teal",
    accent: "text-teal-900",
    soft: "bg-teal-50",
    border: "border-teal-200/80",
    bar: "bg-teal-500",
    iconWrap: "bg-teal-600 text-white",
    ring: "ring-teal-500/20",
    cta: "bg-teal-800 hover:bg-teal-700 text-white",
    glow: "from-teal-500/15 via-transparent to-transparent",
  },
  amber: {
    key: "amber",
    accent: "text-amber-950",
    soft: "bg-amber-50",
    border: "border-amber-200/80",
    bar: "bg-amber-500",
    iconWrap: "bg-amber-600 text-white",
    ring: "ring-amber-500/20",
    cta: "bg-amber-800 hover:bg-amber-700 text-white",
    glow: "from-amber-500/15 via-transparent to-transparent",
  },
  forest: {
    key: "forest",
    accent: "text-[#0f2c20]",
    soft: "bg-[#edf5f0]",
    border: "border-[#c5d8cc]",
    bar: "bg-[#0f2c20]",
    iconWrap: "bg-[#0f2c20] text-emerald-200",
    ring: "ring-[#0f2c20]/15",
    cta: "bg-[#0f2c20] hover:bg-[#164533] text-white",
    glow: "from-[#0f2c20]/10 via-transparent to-transparent",
  },
};

function CircularProgress({
  percent,
  size = 68,
  stroke = 6,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(167,243,208,0.2)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#workspaceProgressGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.85, ease: easeOut, delay: 0.15 }}
        />
        <defs>
          <linearGradient id="workspaceProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="55%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-mono text-base font-bold tabular-nums leading-none text-white"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.25 }}
        >
          {clamped}
          <span className="text-[10px] font-semibold text-emerald-200/80">%</span>
        </motion.span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#d7e4dc] bg-white px-2 py-0.5 text-[10px] font-bold text-[#6d7f76]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#c5d4cb]" />
      Not Started
    </span>
  );
}

export default function ResearchWorkspaceClient({
  project,
  v2Progress,
  activities,
  openRevisionsCount = 0,
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const continueRoute = useMemo(() => {
    if (v2Progress.section1.status !== "COMPLETED") {
      return `/researcher/projects/${project.id}/formulation-rd`;
    }
    if (v2Progress.section2.status !== "COMPLETED") {
      return `/researcher/projects/${project.id}/in-silico`;
    }
    return `/researcher/projects/${project.id}/submission`;
  }, [project.id, v2Progress]);

  const isProjectCompleted =
    project.status === "COMPLETED" ||
    (v2Progress?.overallStatus && v2Progress.overallStatus.toLowerCase() === "completed");

  const section4Status =
    v2Progress.section4?.status ||
    (v2Progress.overallStatus === "Completed"
      ? "COMPLETED"
      : v2Progress.section3.status === "COMPLETED"
        ? "IN_PROGRESS"
        : "NOT_STARTED");

  const sections = [
    {
      key: "s1",
      num: "01",
      label: "Section 1",
      title: "Formulation Research & Development",
      href: `/researcher/projects/${project.id}/formulation-rd`,
      cta: "Open Section",
      icon: Layers,
      tone: SECTION_TONES.emerald,
      status: v2Progress.section1.status,
      done: v2Progress.section1.completedSteps,
      total: v2Progress.section1.totalSteps,
      progressPercent: v2Progress.section1.progressPercent,
      steps: v2Progress.section1.steps,
      stepHref: null as string | null,
      progressLabel: "Steps",
    },
    {
      key: "s2",
      num: "02",
      label: "Section 2",
      title: "In-Silico Analysis",
      href: `/researcher/projects/${project.id}/in-silico`,
      cta: "Open Section",
      icon: Cpu,
      tone: SECTION_TONES.teal,
      status: v2Progress.section2.status,
      done: v2Progress.section2.completedSteps,
      total: v2Progress.section2.totalSteps,
      progressPercent: v2Progress.section2.progressPercent,
      steps: v2Progress.section2.steps,
      stepHref: null as string | null,
      progressLabel: "Steps",
    },
    {
      key: "s3",
      num: "03",
      label: "Section 3",
      title: "Research Paper Submission",
      href: `/researcher/projects/${project.id}/submission`,
      cta: "Open Section",
      icon: FileCheck2,
      tone: SECTION_TONES.amber,
      status: v2Progress.section3.status,
      done: v2Progress.section3.completedSteps,
      total: v2Progress.section3.totalSteps,
      progressPercent: v2Progress.section3.progressPercent,
      steps: v2Progress.section3.steps,
      stepHref: `/researcher/projects/${project.id}/submission`,
      progressLabel: "Steps",
    },
    {
      key: "s4",
      num: "04",
      label: "Section 4",
      title: "Professional Approval & Research Completion",
      href: `/researcher/projects/${project.id}/completion`,
      cta: "Track Approval",
      icon: Award,
      tone: SECTION_TONES.forest,
      status: section4Status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
      done: v2Progress.approvedSpecialtiesCount ?? v2Progress.section4?.completedSteps ?? 0,
      total: 3,
      progressPercent: v2Progress.section4?.progressPercent,
      steps:
        v2Progress.section4?.steps ||
        [
          {
            stepKey: "formulation-review",
            title: "Formulation Science & Pharmacognosy",
            completed: (v2Progress.approvedSpecialtiesCount ?? 0) >= 1,
            detail: "Section 1 formulation & pharmacognosy approval",
          },
          {
            stepKey: "insilico-review",
            title: "Bioinformatics & In-Silico Modeling",
            completed: (v2Progress.approvedSpecialtiesCount ?? 0) >= 2,
            detail: "Section 2 molecular docking & target approval",
          },
          {
            stepKey: "clinical-review",
            title: "Clinical Pharmacology & Paper Review",
            completed: (v2Progress.approvedSpecialtiesCount ?? 0) >= 3,
            detail: "Section 3 clinical review & manuscript verification",
          },
        ],
      stepHref: `/researcher/projects/${project.id}/completion`,
      progressLabel: "Approvals",
    },
  ];

  const completedSectionCount = sections.filter((s) => s.status === "COMPLETED").length;
  const progressPercent = v2Progress.overallProgressPercent;

  const toggleSteps = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative w-full max-w-none space-y-5 pb-12 text-slate-800">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-36 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.07),_transparent_60%)]"
      />

      {/* Brand strip */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="relative flex items-center justify-between gap-3"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#d7e4dc] bg-white shadow-[0_1px_2px_rgba(15,44,32,0.06)]">
            <Image
              src="/images/nature-logo.png"
              alt="NaturAide"
              width={22}
              height={22}
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="font-heading text-[15px] font-bold tracking-tight text-[#0f2c20]">
              NaturAide
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700/80">
              Research Platform
            </p>
          </div>
        </div>

        <Link
          href="/researcher/projects"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#d7e4dc] bg-white/80 px-2 py-1 text-[11px] font-semibold text-[#52645d] transition hover:border-emerald-300 hover:text-[#0f2c20]"
        >
          <FolderKanban className="h-3.5 w-3.5 text-emerald-700" />
          My Research
        </Link>
      </motion.div>

      {/* Project header */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="relative overflow-hidden rounded-2xl border border-[#0f2c20]/12 bg-[linear-gradient(135deg,#0b2419_0%,#0f2c20_42%,#134032_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-20px_rgba(15,44,32,0.55)] sm:px-5 sm:py-4"
      >
        <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-28 w-28 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-emerald-200/75">
              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono font-bold text-emerald-100">
                #{project.id}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 font-semibold text-emerald-100/90">
                {v2Progress.overallStatus}
              </span>
              {project.updatedAt && (
                <span className="inline-flex items-center gap-1 text-emerald-200/70">
                  <Clock className="h-3 w-3" />
                  <span suppressHydrationWarning>
                    {new Date(project.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="max-w-3xl text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
                {project.title}
              </h1>
              <p className="inline-flex max-w-2xl flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-emerald-100/90 sm:text-[13px]">
                <Leaf className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                <span className="font-semibold text-white">{project.plantName}</span>
                {project.plantScientificName ? (
                  <span className="italic text-emerald-200/80">
                    ({project.plantScientificName})
                  </span>
                ) : null}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {openRevisionsCount > 0 && (
                <Link
                  href={`/researcher/projects/${project.id}/revisions`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-500/25"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                  {openRevisionsCount} Revision{openRevisionsCount > 1 ? "s" : ""}
                </Link>
              )}
              {isProjectCompleted ? (
                <Link
                  href={`/researcher/completed/${project.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
                >
                  <Award className="h-3.5 w-3.5" />
                  View Completed Dossier
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <Link
                  href={continueRoute}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
                >
                  Continue Research
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Completion overview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.08, ease: easeOut }}
            className="flex shrink-0 items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-950/35 px-3 py-2.5 backdrop-blur-sm"
          >
            <CircularProgress percent={progressPercent} size={68} stroke={6} />
            <div className="min-w-[6.5rem] space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-200/80">
                Completion
              </p>
              <p className="text-xs font-semibold text-white">
                {completedSectionCount}
                <span className="font-medium text-emerald-200/75">/{sections.length}</span>
                <span className="ml-1 font-medium text-emerald-200/65">sections</span>
              </p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-emerald-950/80">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(completedSectionCount / Math.max(sections.length, 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.7, ease: easeOut, delay: 0.2 }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Objective — only when present */}
      {project.researchObjective ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-[#d7e4dc]/90 bg-white/90 px-4 py-3.5 text-sm leading-relaxed text-[#52645d] shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
        >
          <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8aa094]">
            Objective
          </span>
          {project.researchObjective}
        </motion.div>
      ) : null}

      {/* Four research sections */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3 px-0.5">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-[#0f2c20] sm:text-base">
              Research Sections
            </h2>
            <p className="mt-0.5 text-xs text-[#8aa094]">
              {completedSectionCount}/{sections.length} complete
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const tone = section.tone;
            const pct =
              typeof (section as any).progressPercent === "number"
                ? (section as any).progressPercent
                : section.total > 0
                  ? Math.round((section.done / section.total) * 100)
                  : 0;
            const expanded = Boolean(expandedSections[section.key]);
            const isComplete = section.status === "COMPLETED";
            const isActive = section.status === "IN_PROGRESS";

            return (
              <motion.article
                key={section.key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: 0.08 + index * 0.05, ease: easeOut }}
                className={`group relative overflow-hidden rounded-3xl border bg-white shadow-[0_1px_2px_rgba(15,44,32,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(15,44,32,0.3)] ${
                  isComplete
                    ? "border-emerald-200/90"
                    : isActive
                      ? `${tone.border} ring-1 ${tone.ring}`
                      : "border-[#d7e4dc]/90"
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.glow} opacity-80`}
                />
                <div className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} />

                <div className="relative flex h-full flex-col gap-4 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <span
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${tone.iconWrap}`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.1} />
                      </span>
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-mono text-[11px] font-bold uppercase tracking-[0.14em] ${tone.accent}`}
                          >
                            {section.label}
                          </span>
                          <StatusBadge status={section.status} />
                        </div>
                        <h3 className="text-base font-bold leading-snug tracking-tight text-[#0f2c20] sm:text-lg">
                          {section.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-[#6d7f76]">
                        {section.done}/{section.total} {section.progressLabel.toLowerCase()}
                      </span>
                      <span className="font-mono text-[11px] font-bold tabular-nums text-[#0f2c20]">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#eef4f0]">
                      <motion.div
                        className={`h-full rounded-full ${tone.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.65, ease: easeOut, delay: 0.12 + index * 0.04 }}
                      />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <Link
                      href={section.href}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm transition ${tone.cta}`}
                    >
                      {section.cta}
                      <ArrowRight className="h-3.5 w-3.5 opacity-90" />
                    </Link>

                    {section.steps.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleSteps(section.key)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-white px-3 py-2.5 text-xs font-semibold text-[#52645d] transition hover:border-emerald-300 hover:text-[#0f2c20]"
                        aria-expanded={expanded}
                      >
                        Steps
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: easeOut }}
                        className="overflow-hidden"
                      >
                        <ul className="space-y-1.5 border-t border-[#eef4f0] pt-3">
                          {section.steps.map((st, idx) => {
                            const className = `flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs transition ${
                              st.completed
                                ? `${tone.soft} ${tone.border}`
                                : "border-[#eef4f0] bg-[#fbfcfb] text-[#52645d]"
                            }`;
                            const inner = (
                              <>
                                {st.completed ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                ) : (
                                  <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-[#c5d4cb] text-[9px] font-bold text-[#8aa094]">
                                    {idx + 1}
                                  </span>
                                )}
                                <span className="min-w-0 flex-1 truncate font-semibold text-[#0f2c20]">
                                  {st.title}
                                </span>
                                {"progressPercent" in st &&
                                typeof (st as { progressPercent?: number }).progressPercent ===
                                  "number" ? (
                                  <span
                                    className={`shrink-0 font-mono text-[10px] font-bold tabular-nums ${
                                      st.completed ? "text-emerald-700" : "text-[#8aa094]"
                                    }`}
                                  >
                                    {(st as { progressPercent: number }).progressPercent}%
                                  </span>
                                ) : null}
                              </>
                            );

                            return (
                              <li key={st.stepKey}>
                                {section.stepHref ? (
                                  <Link
                                    href={
                                      section.key === "s3"
                                        ? `${section.stepHref}?step=${idx + 1}`
                                        : section.stepHref
                                    }
                                    className={`${className} hover:border-emerald-300`}
                                  >
                                    {inner}
                                  </Link>
                                ) : (
                                  <div className={className}>{inner}</div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* Activity */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.28, ease: easeOut }}
        className="overflow-hidden rounded-3xl border border-[#d7e4dc]/90 bg-white shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#eef4f0] px-5 py-3.5">
          <h2 className="text-sm font-bold tracking-tight text-[#0f2c20]">
            Recent Research Activity
          </h2>
          <span className="text-[11px] font-medium text-[#8aa094]">
            {activities.length} event{activities.length === 1 ? "" : "s"}
          </span>
        </div>

        {activities.length > 0 ? (
          <div className="divide-y divide-[#eef4f0]">
            {activities.map((act, index) => (
              <div
                key={`${act.actionType}-${act.createdAt}-${index}`}
                className="flex flex-col gap-1.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      {act.actionType}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#52645d]">{act.description}</p>
                </div>
                <span
                  suppressHydrationWarning
                  className="shrink-0 font-mono text-[10px] text-[#8aa094]"
                >
                  {new Date(act.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "UTC",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-7 text-center text-xs text-[#8aa094]">No activity recorded yet.</p>
        )}
      </motion.section>
    </div>
  );
}
