"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  ShieldCheck,
  Info,
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
  accent: string;
  bar: string;
  iconWrap: string;
  badge: string;
  stepDone: string;
  cta: string;
};

const SECTION_TONES: Record<string, SectionTone> = {
  emerald: {
    accent: "text-emerald-800",
    bar: "from-emerald-600 via-emerald-400 to-teal-300",
    iconWrap: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    badge: "text-emerald-800",
    stepDone: "bg-emerald-50/80 border-emerald-200/80",
    cta: "bg-[#0f2c20] hover:bg-[#164533] text-white",
  },
  teal: {
    accent: "text-teal-800",
    bar: "from-teal-600 via-teal-400 to-cyan-300",
    iconWrap: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white",
    badge: "text-teal-800",
    stepDone: "bg-teal-50/80 border-teal-200/80",
    cta: "bg-teal-700 hover:bg-teal-600 text-white",
  },
  slate: {
    accent: "text-[#0f2c20]",
    bar: "from-[#0f2c20] via-emerald-500 to-teal-300",
    iconWrap: "bg-[#0f2c20] text-emerald-200",
    badge: "text-[#0f2c20]",
    stepDone: "bg-[#edf5f0] border-[#d7e4dc]",
    cta: "bg-[#0f2c20] hover:bg-[#164533] text-white",
  },
};

export default function ResearchWorkspaceClient({
  project,
  v2Progress,
  activities,
  openRevisionsCount = 0,
}: Props) {
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

  const renderSectionStatusBadge = (status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED") => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
            Completed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
            <Clock className="h-3 w-3 text-amber-600" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-[#d7e4dc] bg-white px-2 py-0.5 text-[10px] font-bold text-[#6d7f76]">
            Not Started
          </span>
        );
    }
  };

  const sections = [
    {
      key: "s1",
      num: "Section 1",
      title: "Formulation Research & Development",
      desc: "Specimen authentication, dosage format, extraction, excipient matrix, and batch QC.",
      href: `/researcher/projects/${project.id}/formulation-rd`,
      cta: "Open Section",
      icon: Layers,
      tone: SECTION_TONES.emerald,
      status: v2Progress.section1.status,
      done: v2Progress.section1.completedSteps,
      total: v2Progress.section1.totalSteps,
      steps: v2Progress.section1.steps,
      stepHref: null as string | null,
      progressLabel: "Steps completed",
      cols: "sm:grid-cols-2 xl:grid-cols-3",
    },
    {
      key: "s2",
      num: "Section 2",
      title: "In-Silico Analysis",
      desc: "Phytochemical library, target selection, ADMET, docking, and interaction visualization.",
      href: `/researcher/projects/${project.id}/in-silico`,
      cta: "Open Section",
      icon: Cpu,
      tone: SECTION_TONES.teal,
      status: v2Progress.section2.status,
      done: v2Progress.section2.completedSteps,
      total: v2Progress.section2.totalSteps,
      steps: v2Progress.section2.steps,
      stepHref: null as string | null,
      progressLabel: "Steps completed",
      cols: "sm:grid-cols-2 xl:grid-cols-4",
    },
    {
      key: "s3",
      num: "Section 3",
      title: "Research Paper Submission",
      desc: "Multi-stage summary, manuscript upload, and dossier submission for expert review.",
      href: `/researcher/projects/${project.id}/submission`,
      cta: "Open Section",
      icon: FileCheck2,
      tone: SECTION_TONES.slate,
      status: v2Progress.section3.status,
      done: v2Progress.section3.completedSteps,
      total: v2Progress.section3.totalSteps,
      steps: v2Progress.section3.steps,
      stepHref: `/researcher/projects/${project.id}/submission`,
      progressLabel: "Steps completed",
      cols: "sm:grid-cols-2 xl:grid-cols-3",
    },
    {
      key: "s4",
      num: "Section 4",
      title: "Professional Approval & Research Completion",
      desc: "Panel review across Formulation, Bioinformatics, and Clinical Pharmacology.",
      href: `/researcher/projects/${project.id}/completion`,
      cta: "Track Approval",
      icon: Award,
      tone: SECTION_TONES.emerald,
      status: section4Status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
      done: v2Progress.approvedSpecialtiesCount ?? v2Progress.section4?.completedSteps ?? 0,
      total: 3,
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
      progressLabel: "Panel Approvals",
      cols: "sm:grid-cols-2 xl:grid-cols-3",
    },
  ];

  return (
    <div className="w-full max-w-none space-y-6 pb-12 text-slate-800">
      {/* 1. Compact project header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(15,44,32,0.55)] sm:px-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-28 w-28 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] font-medium text-emerald-200/80">
              <Link
                href="/researcher/projects"
                className="inline-flex items-center gap-1.5 transition hover:text-white"
              >
                <FolderKanban className="h-3.5 w-3.5 text-emerald-300" />
                My Research
              </Link>
              <span className="text-emerald-700">/</span>
              <span className="truncate font-semibold text-white">{project.title}</span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-200">
                #{project.id}
              </span>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {openRevisionsCount > 0 && (
                <Link
                  href={`/researcher/projects/${project.id}/revisions`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/25"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                  {openRevisionsCount} Revision{openRevisionsCount > 1 ? "s" : ""}
                </Link>
              )}
              {isProjectCompleted ? (
                <Link
                  href={`/researcher/completed/${project.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
                >
                  <Award className="h-3.5 w-3.5" />
                  View Completed Dossier
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <Link
                  href={continueRoute}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
                >
                  Continue Research
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {project.title}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                    isProjectCompleted
                      ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                      : "border-white/15 bg-white/5 text-emerald-100/90"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                  {v2Progress.overallStatus}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-emerald-100/80">
                <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 font-semibold text-white">
                  <Leaf className="h-3 w-3 text-emerald-300" />
                  {project.plantName}
                  {project.plantScientificName ? (
                    <span className="font-medium italic text-emerald-200/80">
                      ({project.plantScientificName})
                    </span>
                  ) : null}
                </span>
                {project.updatedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-300" />
                    <span suppressHydrationWarning>
                      Updated{" "}
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
            </div>

            <div className="w-full shrink-0 rounded-xl border border-emerald-400/25 bg-emerald-950/40 p-2.5 md:w-64">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-[0.12em] text-emerald-200/90">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  Completion
                </span>
                <span className="rounded border border-emerald-500/30 bg-emerald-800/50 px-1.5 py-0.5 font-mono text-xs font-bold text-white">
                  {v2Progress.overallProgressPercent}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-950">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${v2Progress.overallProgressPercent}%` }}
                  transition={{ duration: 0.7, ease: easeOut, delay: 0.1 }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Objective */}
      {project.researchObjective && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex items-start gap-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
            <Info className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6d7f76]">
              Research Objective
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#52645d]">{project.researchObjective}</p>
          </div>
        </motion.div>
      )}

      {/* Sections */}
      <div className="space-y-3.5">
        <div className="flex flex-col gap-1 px-0.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              Research Sections
            </h2>
            <p className="mt-0.5 text-xs text-[#8aa094]">
              Complete all sections before final manuscript submission.
            </p>
          </div>
          <p className="text-[11px] font-medium text-[#6d7f76]">
            {sections.filter((s) => s.status === "COMPLETED").length} of {sections.length} complete
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3.5">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const tone = section.tone;
            return (
              <motion.article
                key={section.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.08 + index * 0.05, ease: easeOut }}
                className="group relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] shadow-[0_1px_2px_rgba(15,44,32,0.04)] transition-all duration-300 hover:border-emerald-300/70 hover:shadow-[0_18px_34px_-22px_rgba(15,44,32,0.28)]"
              >
                <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${tone.bar}`} />

                <div className="flex flex-col gap-3.5 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${tone.iconWrap}`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${tone.badge}`}>
                            {section.num}
                          </span>
                          {renderSectionStatusBadge(section.status)}
                        </div>
                        <h3 className="mt-1 text-[15px] font-semibold leading-snug text-[#0f2c20]">
                          {section.title}
                        </h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#6d7f76]">{section.desc}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 sm:pt-0.5">
                      <div className="hidden text-right sm:block">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-[#8aa094]">
                          {section.progressLabel}
                        </p>
                        <p className="font-mono text-sm font-bold tabular-nums text-[#0f2c20]">
                          {section.done} / {section.total}
                        </p>
                      </div>
                      <Link
                        href={section.href}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition ${tone.cta}`}
                      >
                        {section.cta}
                        <ArrowRight className="h-3.5 w-3.5 opacity-80" />
                      </Link>
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 gap-2 ${section.cols}`}>
                    {section.steps.map((st, idx) => {
                      const content = (
                        <>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="truncate text-[11px] font-semibold text-[#0f2c20]">
                              {idx + 1}. {st.title}
                            </span>
                            {st.completed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            ) : (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#c5d4cb]" />
                            )}
                          </div>
                          <p className="truncate text-[10px] text-[#8aa094]">{st.detail}</p>
                        </>
                      );

                      const className = `rounded-xl border p-2.5 text-left transition ${
                        st.completed
                          ? tone.stepDone
                          : "border-[#e8f0eb] bg-white/70 text-[#52645d]"
                      } ${section.stepHref ? "hover:border-emerald-300" : ""}`;

                      if (section.stepHref) {
                        return (
                          <Link
                            key={st.stepKey}
                            href={
                              section.key === "s3"
                                ? `${section.stepHref}?step=${idx + 1}`
                                : section.stepHref
                            }
                            className={`block ${className}`}
                          >
                            {content}
                          </Link>
                        );
                      }

                      return (
                        <div key={st.stepKey} className={className}>
                          {content}
                        </div>
                      );
                    })}
                  </div>
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
        className="overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#e8f0eb] px-4 py-3 sm:px-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
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
                className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
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
          <p className="px-4 py-6 text-center text-xs text-[#8aa094] sm:px-5">
            No activity recorded yet.
          </p>
        )}
      </motion.section>
    </div>
  );
}
