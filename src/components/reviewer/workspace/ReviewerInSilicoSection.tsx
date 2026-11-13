"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Target,
  FlaskConical,
  Play,
  Activity,
  Atom,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Check,
} from "lucide-react";
import Interaction2DStep6Section from "@/components/researcher/in-silico/Interaction2DStep6Section";
import Molecular3DStep7Section from "@/components/researcher/in-silico/Molecular3DStep7Section";
import BindingAffinityStep5Section from "@/components/researcher/in-silico/BindingAffinityStep5Section";
import InterpretationStep8Section from "@/components/researcher/in-silico/InterpretationStep8Section";
import type { DockingRunItem } from "@/components/researcher/in-silico/DockingExecutionStep4Section";
import ReviewerDockingExecutionStep4 from "./ReviewerDockingExecutionStep4";
import ReviewerStepFeedbackSection from "./ReviewerStepFeedbackSection";
import { isFeedbackBelongsToStep } from "@/lib/feedback-step-filter";

export interface ReviewerInSilicoSectionProps {
  project: any;
  dossier: any;
  feedbackList?: any[];
  onAddFeedbackForStep?: (stepTitle: string) => void;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  approvedSteps?: number[];
  onToggleApproveStep?: (step: number) => void;
  onNavigateTab?: (tab: any) => void;
  onRefreshFeedback?: () => Promise<void>;
  onDeleteFeedback?: (id: number) => Promise<void>;
  onResolveFeedback?: (id: number) => Promise<void>;
}

/** Matches researcher Section 2 seven-step workflow (read-only). */
const INSILICO_STEPS = [
  {
    num: 1,
    title: "Target Protein Selection",
    shortTitle: "Target Protein",
    icon: Target,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Structural Bioinformatician",
  },
  {
    num: 2,
    title: "In-Silico Screening",
    shortTitle: "Screening",
    icon: FlaskConical,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Computational Pharmacologist",
  },
  {
    num: 3,
    title: "Molecular Docking Execution",
    shortTitle: "Docking",
    icon: Play,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Computational Biologist",
  },
  {
    num: 4,
    title: "Binding Affinity Results",
    shortTitle: "Binding Affinity",
    icon: Activity,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Biophysical Chemist",
  },
  {
    num: 5,
    title: "2D Interaction Visualization",
    shortTitle: "2D Interactions",
    icon: Atom,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Structural Bioinformatician",
  },
  {
    num: 6,
    title: "3D Molecular Visualization",
    shortTitle: "3D Viewer",
    icon: Layers,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Molecular Visualization Specialist",
  },
  {
    num: 7,
    title: "Results & Interpretation",
    shortTitle: "Interpretation",
    icon: Info,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Lead Bioinformatician",
  },
];

function parseScreenMetrics(res: any) {
  let metrics: any = {};
  if (res?.detailedMetrics) {
    try {
      metrics =
        typeof res.detailedMetrics === "string"
          ? JSON.parse(res.detailedMetrics)
          : res.detailedMetrics;
    } catch {
      metrics = {};
    }
  }
  const prop = metrics.physicochemicalProperties || {};
  const lip = metrics.drugLikeness?.lipinskiRuleOfFive || {};
  const fmt = (v: any) =>
    v === null || v === undefined || v === "" || v === "Unavailable" ? "—" : String(v);
  return {
    mw: fmt(res?.molecularWeight ?? prop.molecularWeight?.value),
    logP: fmt(res?.logP ?? prop.logP?.value),
    tpsa: fmt(res?.tpsa ?? prop.tpsa?.value),
    hbd: fmt(res?.hBondDonors ?? prop.hBondDonors?.value),
    hba: fmt(res?.hBondAcceptors ?? prop.hBondAcceptors?.value),
    viol: fmt(res?.lipinskiViolations ?? lip.violations),
    status: res?.engineStatus || metrics.status || "Recorded",
  };
}

export default function ReviewerInSilicoSection({
  project,
  dossier,
  feedbackList = [],
  activeStep: controlledStep,
  onStepChange,
  approvedSteps = [],
  onToggleApproveStep,
  onNavigateTab,
  onRefreshFeedback,
  onDeleteFeedback,
  onResolveFeedback,
}: ReviewerInSilicoSectionProps) {
  const [internalActiveStep, setInternalActiveStep] = useState(1);
  const activeStep = controlledStep !== undefined ? controlledStep : internalActiveStep;
  const setActiveStep = (stepOrFn: any) => {
    const nextVal = typeof stepOrFn === "function" ? stepOrFn(activeStep) : stepOrFn;
    const clamped = Math.min(7, Math.max(1, Number(nextVal) || 1));
    if (onStepChange) onStepChange(clamped);
    setInternalActiveStep(clamped);
  };

  const compounds: any[] =
    dossier?.section2?.compounds || dossier?.compounds || [];
  const targets: any[] =
    dossier?.section2?.targets ||
    dossier?.targets ||
    dossier?.dockingTargets ||
    dossier?.targetList ||
    [];
  const initialDockingRuns: any[] =
    dossier?.section2?.dockingRuns || dossier?.dockingRuns || [];
  const insilicoResults: any[] =
    dossier?.section2?.insilicoResults || dossier?.insilicoResults || [];
  const insilicoSynthesis =
    dossier?.section2?.insilicoSynthesis || dossier?.insilicoSynthesis || {};

  const [workspaceRuns, setWorkspaceRuns] = useState<any[]>([]);
  const [workspaceTargets, setWorkspaceTargets] = useState<any[]>([]);

  useEffect(() => {
    if (!project?.id) return;
    fetch(`/api/researcher/projects/${project.id}/docking`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.workspace?.runs && Array.isArray(data.workspace.runs) && data.workspace.runs.length > 0) {
          setWorkspaceRuns(data.workspace.runs);
        }
        if (data?.workspace?.targets && Array.isArray(data.workspace.targets)) {
          setWorkspaceTargets(data.workspace.targets);
        }
      })
      .catch(() => {});
  }, [project?.id]);

  const effectiveTargets = useMemo(() => {
    if (workspaceTargets.length > 0) return workspaceTargets;
    return targets;
  }, [workspaceTargets, targets]);

  const allRawRuns = useMemo(() => {
    if (workspaceRuns.length > 0) return workspaceRuns;
    return initialDockingRuns;
  }, [workspaceRuns, initialDockingRuns]);

  const normalizedRuns: DockingRunItem[] = useMemo(() => {
    return allRawRuns.map((r: any) => ({
      id: Number(r.id),
      compoundId: Number(r.compoundId || 0),
      targetId: r.targetId ? Number(r.targetId) : undefined,
      ligandName: r.ligandName || "Botanical Ligand",
      targetProtein: r.targetProtein || r.targetName || `Receptor (${r.pdbId || ""})`,
      pdbId: r.pdbId || "TARGET",
      jobStatus: r.jobStatus || r.engineStatus || "COMPLETED",
      engineStatus: r.engineStatus || r.jobStatus || "COMPLETED",
      bindingAffinity:
        r.bindingAffinity !== null && r.bindingAffinity !== undefined
          ? parseFloat(r.bindingAffinity)
          : null,
      rmsdLb: r.rmsdLb !== undefined ? Number(r.rmsdLb) : 0,
      rmsdUb: r.rmsdUb !== undefined ? Number(r.rmsdUb) : 0,
      poseCount: r.poseCount || 9,
      exhaustiveness: r.exhaustiveness != null ? Number(r.exhaustiveness) : undefined,
      vinaVersion: r.vinaVersion || "AutoDock Vina",
      errorMessage: r.errorMessage || r.error || null,
      startedAt: r.startedAt ? String(r.startedAt) : undefined,
      createdAt: r.createdAt ? String(r.createdAt) : undefined,
      completedAt: r.completedAt ? String(r.completedAt) : undefined,
    }));
  }, [allRawRuns]);

  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedRunId && normalizedRuns.length > 0) {
      const completed = normalizedRuns.filter(
        (r) => typeof r.bindingAffinity === "number" && !isNaN(r.bindingAffinity)
      );
      if (completed.length > 0) {
        const sorted = [...completed].sort(
          (a, b) => Number(a.bindingAffinity || 0) - Number(b.bindingAffinity || 0)
        );
        setSelectedRunId(sorted[0].id);
      } else {
        setSelectedRunId(normalizedRuns[0].id);
      }
    }
  }, [selectedRunId, normalizedRuns]);

  const [structureData, setStructureData] = useState<{
    receptorPdb: string;
    ligandPdbqt: string;
    interactions: any;
  } | null>(null);
  const [isLoadingStructures, setIsLoadingStructures] = useState(false);

  useEffect(() => {
    if (!selectedRunId || !project?.id) return;
    let isMounted = true;
    const loadStructures = async () => {
      setIsLoadingStructures(true);
      try {
        const res = await fetch(
          `/api/researcher/projects/${project.id}/docking/structure-files?runId=${selectedRunId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStructureData({
              receptorPdb: data.receptorPdb || "",
              ligandPdbqt: data.ligandPdbqt || "",
              interactions: data.interactions || null,
            });
          }
        }
      } catch (err) {
        console.error("Error loading structure files in reviewer:", err);
      } finally {
        if (isMounted) setIsLoadingStructures(false);
      }
    };
    loadStructures();
    return () => {
      isMounted = false;
    };
  }, [selectedRunId, project?.id]);

  const currentStepConfig = INSILICO_STEPS[activeStep - 1] || INSILICO_STEPS[0];

  const stepFeedback = feedbackList.filter((f) =>
    isFeedbackBelongsToStep(f, "section2", activeStep, currentStepConfig.title)
  );

  const screenByCompound = useMemo(() => {
    const byId = new Map<number, any>();
    const byName = new Map<string, any>();
    for (const r of insilicoResults) {
      if (r.compoundId) byId.set(Number(r.compoundId), r);
      if (r.compoundName) byName.set(String(r.compoundName).trim().toLowerCase(), r);
    }
    return { byId, byName };
  }, [insilicoResults]);

  const screeningRows = useMemo(() => {
    if (compounds.length > 0) {
      return compounds.map((c: any) => {
        const res =
          screenByCompound.byId.get(Number(c.id)) ||
          screenByCompound.byName.get(String(c.compoundName || "").trim().toLowerCase());
        return { compound: c, metrics: parseScreenMetrics(res), hasResult: Boolean(res) };
      });
    }
    return insilicoResults.map((r: any) => ({
      compound: {
        compoundName: r.compoundName,
        molecularFormula: r.molecularFormula,
        molecularWeight: r.molecularWeight,
      },
      metrics: parseScreenMetrics(r),
      hasResult: true,
    }));
  }, [compounds, insilicoResults, screenByCompound]);

  const completedRuns = useMemo(
    () =>
      normalizedRuns.filter(
        (r) => r.bindingAffinity !== null && r.bindingAffinity !== undefined
      ),
    [normalizedRuns]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 pb-1">
        {INSILICO_STEPS.map((step) => {
          const Icon = step.icon;
          const isCurrent = activeStep === step.num;
          const isStepApproved = approvedSteps.includes(step.num);
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveStep(step.num)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                isCurrent
                  ? "bg-blue-600 font-semibold text-white shadow-xs"
                  : isStepApproved
                    ? "border border-emerald-300 bg-emerald-50 font-semibold text-emerald-800"
                    : "border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>
                {step.num}. {step.shortTitle}
              </span>
              {isStepApproved && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />}
            </button>
          );
        })}
      </div>

      {stepFeedback.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs shadow-xs sm:p-5">
          <div className="flex flex-col justify-between gap-1.5 border-b border-amber-200/80 pb-2.5 font-bold text-amber-900 sm:flex-row sm:items-center">
            <span className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Reviewer Findings on Step {activeStep} ({stepFeedback.length}):
              </span>
            </span>
            <span className="rounded-md border border-amber-200 bg-amber-100/70 px-2 py-0.5 font-mono text-xs text-amber-800">
              Evaluator: {currentStepConfig.roleProfession}
            </span>
          </div>
          <div className="space-y-3">
            {stepFeedback.map((f) => {
              const isResolved = f.status === "RESOLVED";
              const isAddressed = f.status === "ADDRESSED" || Boolean(f.researcherReply);
              let cleanTitle = f.title || f.commentType || `Step ${activeStep} Finding`;
              if (cleanTitle.includes(":")) {
                const parts = cleanTitle.split(":");
                const rest = parts.slice(1).join(":").trim();
                if (rest.toLowerCase() === (f.comment || "").trim().toLowerCase()) {
                  cleanTitle = parts[0].trim();
                }
              }
              const showDistinctAction =
                f.recommendation &&
                f.recommendation.trim().toLowerCase() !== (f.comment || "").trim().toLowerCase();

              return (
                <div
                  key={f.id}
                  className={`space-y-2.5 rounded-xl border p-4 text-slate-800 transition-all ${
                    isResolved
                      ? "border-slate-200 bg-slate-50/90 opacity-80"
                      : isAddressed
                        ? "border-amber-300 bg-white shadow-xs ring-1 ring-amber-400/20"
                        : "border-amber-200/80 bg-white shadow-2xs"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-2 sm:flex-row sm:items-center">
                    <span className="text-xs font-bold text-slate-900 sm:text-sm">{cleanTitle}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase ${
                          f.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : f.severity === "MAJOR"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {f.severity || "MAJOR"}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[9.5px] font-bold ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-800"
                            : isAddressed
                              ? "animate-pulse bg-teal-100 font-black text-teal-900"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isResolved
                          ? "RESOLVED"
                          : isAddressed
                            ? "ADDRESSED BY RESEARCHER"
                            : "PENDING RESEARCHER ACTION"}
                      </span>
                    </div>
                  </div>
                  <p className="whitespace-pre-line text-xs font-medium leading-relaxed text-slate-800 sm:text-[13px]">
                    {f.comment}
                  </p>
                  {showDistinctAction && (
                    <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-2.5 text-xs text-slate-700">
                      <strong className="text-slate-900">Required Action:</strong> {f.recommendation}
                    </div>
                  )}
                  {f.researcherReply && (
                    <div className="space-y-1 rounded-lg border border-teal-200 bg-teal-50/80 p-3 text-teal-950">
                      <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
                        <span>✓ Researcher Resubmission / Implementation Note:</span>
                        {f.researcherRepliedAt && (
                          <span className="font-mono text-[10px] font-normal text-teal-600">
                            {new Date(f.researcherRepliedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium leading-relaxed text-teal-950">
                        {f.researcherReply}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="font-mono text-[10px] text-slate-400">
                      {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ""}
                    </span>
                    {!isResolved ? (
                      <button
                        type="button"
                        onClick={() => onResolveFeedback && onResolveFeedback(f.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
                      >
                        <Check className="h-3.5 w-3.5 text-white" />
                        <span>Mark as Resolved</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Resolved ✓</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7">
        <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-blue-400/25 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3 text-xs text-white shadow-[0_8px_20px_-14px_rgba(7,25,48,0.45)] sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-blue-400/30 bg-blue-500/20 px-2 py-0.5 font-mono text-[10.5px] font-bold text-blue-200">
              Role 02: {currentStepConfig.roleName}
            </span>
            <span className="text-blue-100/80">
              Specialist:{" "}
              <strong className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-white">
                {currentStepConfig.roleProfession}
              </strong>
            </span>
            <span className="rounded border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-blue-100">
              Section 2 · Step {activeStep}/7
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            {approvedSteps.includes(activeStep) ? (
              <button
                type="button"
                disabled
                className="inline-flex cursor-default select-none items-center gap-1.5 rounded-lg border border-emerald-400 bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white opacity-95 shadow-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                <span>Step {activeStep} Approved ✓</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleApproveStep && onToggleApproveStep(activeStep)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
              >
                <Check className="h-3.5 w-3.5 text-white" />
                <span>Approve Step {activeStep}</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 1 — Target Protein Selection */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Target className="h-4 w-4 text-blue-600" />
                Target Protein Selection
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Selected PDB structures from the researcher&apos;s project records.
              </p>
            </div>
            {effectiveTargets.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No target proteins recorded for this project.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {effectiveTargets.map((t: any, i: number) => (
                  <div
                    key={t.id || t.pdbId || i}
                    className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {t.targetName || "Unnamed target"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      {t.pdbId && (
                        <a
                          href={`https://www.rcsb.org/structure/${t.pdbId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-[#0f2c20] px-2 py-0.5 font-mono font-bold text-emerald-100"
                        >
                          {String(t.pdbId).toUpperCase()}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <span>{t.organism || "Organism not recorded"}</span>
                    </div>
                    {(t.geneOrProtein || t.resolution) && (
                      <p className="text-[11px] text-slate-500">
                        {[t.geneOrProtein, t.resolution].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — In-Silico Screening */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FlaskConical className="h-4 w-4 text-blue-600" />
                In-Silico Screening
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                ADMET / physicochemical records from the researcher&apos;s screening runs.
              </p>
            </div>
            {screeningRows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No screening records available for this project.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="p-3">Compound</th>
                      <th className="p-3">MW</th>
                      <th className="p-3">LogP</th>
                      <th className="p-3">TPSA</th>
                      <th className="p-3">HBD</th>
                      <th className="p-3">HBA</th>
                      <th className="p-3">Lipinski</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {screeningRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-900">
                          {row.compound.compoundName || "Unnamed"}
                        </td>
                        <td className="p-3 font-mono">{row.metrics.mw}</td>
                        <td className="p-3 font-mono">{row.metrics.logP}</td>
                        <td className="p-3 font-mono">{row.metrics.tpsa}</td>
                        <td className="p-3 font-mono">{row.metrics.hbd}</td>
                        <td className="p-3 font-mono">{row.metrics.hba}</td>
                        <td className="p-3 font-mono">{row.metrics.viol}</td>
                        <td className="p-3">
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {row.hasResult ? row.metrics.status : "Not screened"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Molecular Docking */}
        {activeStep === 3 && (
          <ReviewerDockingExecutionStep4
            projectId={project.id}
            plantName={project.plantName || "Botanical Specimen"}
            plantScientificName={project.plantScientificName}
            compounds={compounds}
            targets={effectiveTargets}
            runs={normalizedRuns}
            onSelectRunForVisuals={(runId, targetStep) => {
              setSelectedRunId(runId);
              setActiveStep(targetStep);
            }}
            onNavigateToResults={() => setActiveStep(4)}
          />
        )}

        {/* Step 4 — Binding Affinity */}
        {activeStep === 4 && (
          <BindingAffinityStep5Section
            projectId={project.id}
            plantName={project.plantName || "Botanical Specimen"}
            runs={normalizedRuns}
            onSelectRunForVisuals={(runId, targetStep) => {
              setSelectedRunId(runId);
              setActiveStep(targetStep);
            }}
          />
        )}

        {/* Step 5 — 2D */}
        {activeStep === 5 && (
          <Interaction2DStep6Section
            projectId={project.id}
            plantName={project.plantName || "Botanical Specimen"}
            runs={normalizedRuns}
            selectedRunId={selectedRunId}
            onSelectRunId={setSelectedRunId}
            structureData={structureData}
            isLoadingStructures={isLoadingStructures}
            onNavigateTo3D={() => setActiveStep(6)}
          />
        )}

        {/* Step 6 — 3D */}
        {activeStep === 6 && (
          <Molecular3DStep7Section
            projectId={project.id}
            plantName={project.plantName || "Botanical Specimen"}
            runs={normalizedRuns}
            selectedRunId={selectedRunId}
            onSelectRunId={setSelectedRunId}
            structureData={structureData}
            isLoadingStructures={isLoadingStructures}
            onNavigateTo2D={() => setActiveStep(5)}
          />
        )}

        {/* Step 7 — Interpretation (read-only shared component) */}
        {activeStep === 7 && (
          <InterpretationStep8Section
            projectId={project.id}
            plantName={project.plantName || "Botanical Specimen"}
            compoundsCount={compounds.length || screeningRows.length}
            targetsCount={effectiveTargets.length}
            completedRunsCount={completedRuns.length}
            topRuns={completedRuns}
            allRuns={normalizedRuns}
            synthesisText={
              insilicoSynthesis?.keyFindings ||
              insilicoSynthesis?.synthesisText ||
              ""
            }
            onSynthesisTextChange={() => {}}
            limitationsText={
              insilicoSynthesis?.potentialLimitations ||
              insilicoSynthesis?.limitationsText ||
              ""
            }
            onLimitationsTextChange={() => {}}
            onSaveSynthesis={async () => true}
            isSaving={false}
            readOnly
            onSelectRunForVisuals={(runId, targetStep) => {
              setSelectedRunId(runId);
              setActiveStep(targetStep);
            }}
          />
        )}

        <ReviewerStepFeedbackSection
          projectId={project.id}
          submissionId={project.activeSubmissionId}
          sectionKey="section2"
          sectionTitle="Section 2: In-Silico Molecular Docking"
          stepNumber={activeStep}
          stepTitle={currentStepConfig.title}
          roleProfession={currentStepConfig.roleProfession}
          isApproved={approvedSteps.includes(activeStep)}
          onToggleApprove={() => onToggleApproveStep && onToggleApproveStep(activeStep)}
          feedbackList={feedbackList}
          onRefreshFeedback={onRefreshFeedback || (async () => {})}
          onDeleteFeedback={onDeleteFeedback || (async () => {})}
          onResolveFeedback={onResolveFeedback || (async () => {})}
        />

      </div>
    </div>
  );
}
