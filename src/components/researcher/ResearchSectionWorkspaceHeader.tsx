"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";

export type ResearchSectionWorkspaceStep = {
  number: number;
  title: string;
  /** When set, step is navigated via Link instead of onStepChange */
  href?: string;
  /** Optional override; defaults to number < activeStep */
  done?: boolean;
};

export type ResearchSectionStatusVariant =
  | "draft"
  | "saving"
  | "saved"
  | "running"
  | "warning"
  | "error"
  | "success";

interface Props {
  projectId: number;
  /** e.g. "Formulation R&D", "In-Silico Analysis" */
  sectionLabel: string;
  steps: ResearchSectionWorkspaceStep[];
  activeStep: number;
  onStepChange?: (stepNumber: number) => void;
  statusLabel?: string;
  statusVariant?: ResearchSectionStatusVariant;
  /** Override the large title; defaults to the active step title */
  title?: string;
  subtitle?: string | null;
  /** Right-side CTA (Proceed link/button, Sync, etc.) */
  proceedSlot?: React.ReactNode;
  /** Use first word of step titles under circles (Section 1 style). Default true. */
  shortStepLabels?: boolean;
}

const STATUS_STYLES: Record<
  ResearchSectionStatusVariant,
  { pill: string; dot: string }
> = {
  draft: {
    pill: "border-white/15 bg-white/5 text-emerald-100/85",
    dot: "bg-slate-300",
  },
  saving: {
    pill: "border-amber-400/40 bg-amber-500/15 text-amber-100",
    dot: "animate-pulse bg-amber-300",
  },
  saved: {
    pill: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
    dot: "bg-emerald-300",
  },
  success: {
    pill: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
    dot: "bg-emerald-300",
  },
  running: {
    pill: "border-sky-400/40 bg-sky-500/15 text-sky-100",
    dot: "animate-pulse bg-sky-300",
  },
  warning: {
    pill: "border-rose-400/40 bg-rose-500/15 text-rose-100",
    dot: "bg-rose-300",
  },
  error: {
    pill: "border-rose-400/40 bg-rose-500/15 text-rose-100",
    dot: "bg-rose-300",
  },
};

function stepShortLabel(title: string) {
  return title.split(/\s+/)[0] || title;
}

export default function ResearchSectionWorkspaceHeader({
  projectId,
  sectionLabel,
  steps,
  activeStep,
  onStepChange,
  statusLabel = "Draft",
  statusVariant = "draft",
  title,
  subtitle,
  proceedSlot,
  shortStepLabels = true,
}: Props) {
  const totalSteps = steps.length;
  const active = steps.find((s) => s.number === activeStep) || steps[0];
  const heading = title || active?.title || sectionLabel;
  const styles = STATUS_STYLES[statusVariant] || STATUS_STYLES.draft;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/researcher/projects/${projectId}`}
          className="group flex min-w-0 items-center gap-2.5"
          title="NaturAide Research Platform"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d7e4dc] bg-white shadow-sm ring-1 ring-emerald-500/10">
            <Image
              src="/images/nature-logo.png"
              alt="NaturAide"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="font-heading text-base font-bold tracking-tight text-[#0f2c20] group-hover:text-emerald-900 sm:text-lg">
              NaturAide
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700/80">
              Research Platform
            </p>
          </div>
        </Link>

        <Link
          href={`/researcher/projects/${projectId}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#d7e4dc] bg-white px-2 py-1 text-[11px] font-semibold text-[#52645d] transition hover:border-emerald-300 hover:text-[#0f2c20]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Project</span>
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#0f2c20]/12 bg-[linear-gradient(135deg,#0b2419_0%,#0f2c20_50%,#134032_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-20px_rgba(15,44,32,0.55)] sm:px-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-emerald-400/12 blur-3xl" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-emerald-200/75">
              <span>
                Step {activeStep} of {totalSteps} · {sectionLabel}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-semibold ${styles.pill}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                {statusLabel}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {heading}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-[11px] text-emerald-200/70">{subtitle}</p>
            ) : null}
          </div>

          {proceedSlot ? <div className="shrink-0">{proceedSlot}</div> : null}
        </div>

        <div className="relative mt-4 overflow-x-auto pb-0.5 scrollbar-none">
          <div
            className={`flex items-center justify-between gap-0 ${
              totalSteps >= 6 ? "min-w-[28rem] sm:min-w-0" : "min-w-[16rem] sm:min-w-0"
            }`}
          >
            {steps.map((step, idx) => {
              const isCurrent = activeStep === step.number;
              const isDone =
                typeof step.done === "boolean" ? step.done && !isCurrent : step.number < activeStep;
              const label = shortStepLabels ? stepShortLabel(step.title) : step.title;
              const circleClass = isCurrent
                ? "bg-emerald-400 text-[#091a13] shadow-sm ring-2 ring-emerald-300/40"
                : isDone
                  ? "bg-emerald-500/90 text-white"
                  : "border border-white/20 bg-white/10 text-emerald-100/70 group-hover:bg-white/15";
              const labelClass = isCurrent
                ? "text-white"
                : isDone
                  ? "text-emerald-200/90"
                  : "text-emerald-100/55";

              const inner = (
                <>
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ${circleClass}`}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : step.number}
                  </span>
                  <span
                    className={`hidden max-w-[4.5rem] truncate text-center text-[9px] font-semibold sm:block ${labelClass}`}
                  >
                    {label}
                  </span>
                </>
              );

              return (
                <React.Fragment key={step.number}>
                  {step.href ? (
                    <Link
                      href={step.href}
                      title={step.title}
                      className="group relative z-[1] flex shrink-0 flex-col items-center gap-1"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStepChange?.(step.number)}
                      title={step.title}
                      className="group relative z-[1] flex shrink-0 flex-col items-center gap-1"
                    >
                      {inner}
                    </button>
                  )}
                  {idx < steps.length - 1 && (
                    <div
                      className={`mx-1 h-0.5 min-w-[0.75rem] flex-1 rounded-full ${
                        step.number < activeStep ? "bg-emerald-400/80" : "bg-white/15"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
