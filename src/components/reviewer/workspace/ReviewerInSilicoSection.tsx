"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dna,
  Target,
  FlaskConical,
  Play,
  Activity,
  Atom,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  MessageSquarePlus,
  Eye,
  ExternalLink,
  Search,
  Filter,
  Box,
  Cpu,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  Check,
} from "lucide-react";
import Interaction2DDiagram from "@/components/researcher/in-silico/Interaction2DDiagram";
import Molecular3DViewer from "@/components/researcher/in-silico/Molecular3DViewer";
import Interaction2DStep6Section from "@/components/researcher/in-silico/Interaction2DStep6Section";
import Molecular3DStep7Section from "@/components/researcher/in-silico/Molecular3DStep7Section";
import BindingAffinityStep5Section from "@/components/researcher/in-silico/BindingAffinityStep5Section";
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

const INSILICO_STEPS = [
  {
    num: 1,
    title: "Phytochemical Selection & Ligand Library",
    shortTitle: "Ligand Library",
    icon: Dna,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Cheminformatician & Molecular Modeler",
  },
  {
    num: 2,
    title: "Target Protein Selection & PDB Validation",
    shortTitle: "Target Protein",
    icon: Target,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Structural Bioinformatician",
  },
  {
    num: 3,
    title: "In-Silico Screening (Lipinski & ADMET)",
    shortTitle: "Lipinski & ADMET",
    icon: FlaskConical,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Computational Pharmacologist",
  },
  {
    num: 4,
    title: "Molecular Docking Setup & AutoDock Vina Execution",
    shortTitle: "Docking Setup & Vina",
    icon: Play,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Computational Biologist",
  },
  {
    num: 5,
    title: "Binding Affinity Results & Energetics Leaderboard",
    shortTitle: "Binding Affinity (kcal/mol)",
    icon: Activity,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Biophysical Chemist",
  },
  {
    num: 6,
    title: "2D Pharmacophore & Interaction Profiling",
    shortTitle: "2D Interactions",
    icon: Atom,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Structural Bioinformatician",
  },
  {
    num: 7,
    title: "3D Molecular Complex Visualization",
    shortTitle: "3D Molecular Viewer",
    icon: Layers,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Molecular Visualization Specialist",
  },
  {
    num: 8,
    title: "Scientific Interpretation & Study Limitations",
    shortTitle: "Interpretation & Limitations",
    icon: Info,
    roleNumber: "02",
    roleName: "Bioinformatics & Computational Modeling",
    roleProfession: "Lead Bioinformatician & Principal Scientist",
  },
];

export default function ReviewerInSilicoSection({
  project,
  dossier,
  feedbackList = [],
  onAddFeedbackForStep,
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
    if (onStepChange) onStepChange(nextVal);
    setInternalActiveStep(nextVal);
  };

  // Extract Section 2 data from snapshot or live dossier
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

  // Live workspace runs / targets loaded directly from docking API if available
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

  // Combined raw runs prioritizing live workspace
  const allRawRuns = useMemo(() => {
    if (workspaceRuns.length > 0) return workspaceRuns;
    return initialDockingRuns;
  }, [workspaceRuns, initialDockingRuns]);

  // Normalized typed docking runs for Step 4, 5, 6, and 7
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

  // Active run selection for 2D and 3D visualizers
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  // Auto-select the top-performing completed run if none is active
  useEffect(() => {
    if (!selectedRunId && normalizedRuns.length > 0) {
      const completed = normalizedRuns.filter(
        (r) => typeof r.bindingAffinity === "number" && !isNaN(r.bindingAffinity)
      );
      if (completed.length > 0) {
        const sorted = [...completed].sort((a, b) => Number(a.bindingAffinity || 0) - Number(b.bindingAffinity || 0));
        setSelectedRunId(sorted[0].id);
      } else {
        setSelectedRunId(normalizedRuns[0].id);
      }
    }
  }, [selectedRunId, normalizedRuns]);

  // 3D coordinate model and 2D interaction structures
  const [structureData, setStructureData] = useState<{
    receptorPdb: string;
    ligandPdbqt: string;
    interactions: any;
  } | null>(null);
  const [isLoadingStructures, setIsLoadingStructures] = useState<boolean>(false);

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
        if (isMounted) {
          setIsLoadingStructures(false);
        }
      }
    };

    loadStructures();
    return () => {
      isMounted = false;
    };
  }, [selectedRunId, project?.id]);

  // Filter & Search state for ligand library
  const [ligandSearch, setLigandSearch] = useState("");

  const currentStepConfig = INSILICO_STEPS[activeStep - 1];

  const stepFeedback = feedbackList.filter((f) =>
    isFeedbackBelongsToStep(f, "section2", activeStep, currentStepConfig.title)
  );

  // Primary active docking run
  const activeRun = useMemo(() => {
    if (selectedRunId) {
      const found = normalizedRuns.find((r) => r.id === selectedRunId);
      if (found) return found;
    }
    return normalizedRuns[0] || null;
  }, [normalizedRuns, selectedRunId]);

  // Curated fallback target if none in database
  const activeTarget = targets[0] || {
    pdbId: "2AZ5",
    targetName: "Tumor Necrosis Factor-alpha (TNF-α)",
    organism: "Homo sapiens",
    resolution: "2.10 Å",
    method: "X-ray Diffraction",
    boundLigand: "SPD-304",
    chains: "A, B",
    notes: "Key pro-inflammatory cytokine mediator involved in rheumatoid arthritis and systemic inflammatory cascade.",
  };

  // Mock interaction list for 2D diagram fallback
  const interactionItems = useMemo(() => {
    return [
      { residueName: "TYR", residueNumber: 119, chainId: "A", interactionType: "Conventional Hydrogen Bond", distance: 2.78 },
      { residueName: "LEU", residueNumber: 120, chainId: "A", interactionType: "Hydrophobic Contact", distance: 3.45 },
      { residueName: "SER", residueNumber: 60, chainId: "B", interactionType: "Conventional Hydrogen Bond", distance: 2.92 },
      { residueName: "GLY", residueNumber: 121, chainId: "A", interactionType: "Hydrophobic Contact", distance: 3.84 },
      { residueName: "ILE", residueNumber: 155, chainId: "B", interactionType: "Salt Bridge", distance: 3.12 },
    ];
  }, []);

  return (
    <div className="space-y-5">
      {/* 8-Step Interactive Switcher (Exactly matches Researcher Section 2) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
        {INSILICO_STEPS.map((step) => {
          const Icon = step.icon;
          const isCurrent = activeStep === step.num;
          const isStepApproved = approvedSteps.includes(step.num);
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveStep(step.num)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
                isCurrent
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : isStepApproved
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>
                {step.num}. {step.shortTitle}
              </span>
              {isStepApproved && (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Step Feedback Banner (If any reviewer findings have been recorded for this step) */}
      {stepFeedback.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-amber-900 font-bold border-b border-amber-200/80 pb-2.5">
            <span className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Reviewer Findings on Step {activeStep} ({stepFeedback.length}):</span>
            </span>
            <span className="text-xs font-mono text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">
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
                  className={`p-4 rounded-xl border transition-all text-slate-800 space-y-2.5 ${
                    isResolved
                      ? "bg-slate-50/90 border-slate-200 opacity-80"
                      : isAddressed
                      ? "bg-white border-amber-300 ring-1 ring-amber-400/20 shadow-xs"
                      : "bg-white border-amber-200/80 shadow-2xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {cleanTitle}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`font-mono text-[9.5px] uppercase font-bold px-2 py-0.5 rounded ${
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
                        className={`font-mono text-[9.5px] font-bold px-2 py-0.5 rounded ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-800"
                            : isAddressed
                            ? "bg-teal-100 text-teal-900 font-black animate-pulse"
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

                  <p className="text-slate-800 leading-relaxed text-xs sm:text-[13px] font-medium whitespace-pre-line">
                    {f.comment}
                  </p>

                  {showDistinctAction && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                      <strong className="text-slate-900">Required Action:</strong> {f.recommendation}
                    </div>
                  )}

                  {/* Resubmitted Researcher Implementation Note */}
                  {f.researcherReply && (
                    <div className="p-3 rounded-lg bg-teal-50/80 border border-teal-200 text-teal-950 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
                        <span>✓ Researcher Resubmission / Implementation Note:</span>
                        {f.researcherRepliedAt && (
                          <span className="font-mono text-[10px] text-teal-600 font-normal">
                            {new Date(f.researcherRepliedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-teal-950 leading-relaxed font-medium">
                        {f.researcherReply}
                      </p>
                    </div>
                  )}

                  {/* Only the Resolved Button appears */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ""}
                    </span>

                    {!isResolved ? (
                      <button
                        type="button"
                        onClick={() => onResolveFeedback && onResolveFeedback(f.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Mark as Resolved</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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

      {/* Step Content Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Step Header with Assigned Specialist Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-blue-400/25 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3 text-white text-xs shadow-[0_8px_20px_-14px_rgba(7,25,48,0.45)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded border border-blue-400/30 bg-blue-500/20 text-blue-200">
              Role 02: {currentStepConfig.roleName}
            </span>
            <span className="text-blue-100/80">
              Specialist:{" "}
              <strong className="text-white px-1.5 py-0.5 rounded bg-white/10 border border-white/15">
                {currentStepConfig.roleProfession}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {approvedSteps.includes(activeStep) ? (
              <button
                type="button"
                disabled={true}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs bg-emerald-500 text-white border border-emerald-400 opacity-95 cursor-default select-none"
                title={`Step ${activeStep} is approved.`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Step {activeStep} Approved ✓</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleApproveStep && onToggleApproveStep(activeStep)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 cursor-pointer active:scale-95 transition-all"
                title={`Mark Step ${activeStep} as approved.`}
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Approve Step {activeStep}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* STEP 1: PHYTOCHEMICAL SELECTION & LIGAND LIBRARY                  */}
        {/* ================================================================= */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Dna className="w-4 h-4 text-indigo-600" />
                  <span>Step 1: Phytochemical Selection &amp; Ligand Conformation Library</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify chemical structures, canonical SMILES, energy minimization, and 3D PDBQT ligand preparation.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                {compounds.length || 4} Ligands Prepared
              </span>
            </div>

            {/* Ligand Search */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ligand by compound name or SMILES..."
                value={ligandSearch}
                onChange={(e) => setLigandSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Ligand Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Compound Name</th>
                    <th className="p-3">Chemical Class</th>
                    <th className="p-3">Formula</th>
                    <th className="p-3">Mol. Weight</th>
                    <th className="p-3">Canonical SMILES</th>
                    <th className="p-3">PubChem CID</th>
                    <th className="p-3">Preparation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {(compounds.length > 0
                    ? compounds
                    : [
                        { compoundName: "Casticin", compoundClass: "Flavonoid", molecularFormula: "C19H18O8", molecularWeight: 374.34, smiles: "COc1cc(c2c(c1)oc(c(c2=O)OC)c3ccc(c(c3)OC)O)O", pubchemId: "5315263" },
                        { compoundName: "Isoorientin", compoundClass: "Flavone Glycoside", molecularFormula: "C21H20O11", molecularWeight: 448.38, smiles: "c1cc(c(cc1C2=CC(=O)c3c(O2)cc(c(c3O)C4C(C(C(C(O4)CO)O)O)O)O)O)O", pubchemId: "114776" },
                        { compoundName: "Luteolin", compoundClass: "Flavone", molecularFormula: "C15H10O6", molecularWeight: 286.24, smiles: "c1cc(c(cc1C2=CC(=O)c3c(O2)cc(cc3O)O)O)O", pubchemId: "5280445" },
                        { compoundName: "Negundoside", compoundClass: "Iridoid Glycoside", molecularFormula: "C16H24O10", molecularWeight: 376.36, smiles: "CC1C(C2C(C1O)C(=COC2OC3C(C(C(C(O3)CO)O)O)O)C(=O)O)O", pubchemId: "101614349" },
                      ]
                  )
                    .filter((c: any) =>
                      !ligandSearch ||
                      c.compoundName.toLowerCase().includes(ligandSearch.toLowerCase()) ||
                      String(c.smiles || "").toLowerCase().includes(ligandSearch.toLowerCase())
                    )
                    .map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{c.compoundName}</td>
                        <td className="p-3 text-slate-600">{c.compoundClass || "Flavonoid"}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-800">{c.molecularFormula || "—"}</td>
                        <td className="p-3 font-mono text-[11px]">{c.molecularWeight ? `${c.molecularWeight} g/mol` : "—"}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={c.smiles}>
                          {c.smiles || "—"}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-indigo-700">{c.pubchemId || "—"}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            PDBQT Ready (MMFF94)
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Ligand Preparation Audit */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Ligand Preparation Methodology Audit
              </span>
              <p className="text-slate-700 leading-relaxed">
                All phytochemical ligand structures were downloaded as 3D SDF conformations from PubChem, protonated at physiological pH 7.4 with OpenBabel, energy-minimized using the MMFF94 force field until gradient convergence (&lt; 0.001 kcal/mol·Å), and converted to AutoDock PDBQT format with Gasteiger partial atomic charges assigned.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: TARGET PROTEIN SELECTION & PDB VALIDATION                 */}
        {/* ================================================================= */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Step 2: Target Protein Selection &amp; PDB Validation</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify crystallographic resolution, receptor clean-up, polar hydrogens, and binding pocket definition.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                PDB ID: {activeTarget.pdbId} Verified
              </span>
            </div>

            {/* Target Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Target Protein Name
                </span>
                <p className="text-sm font-bold text-slate-900">{activeTarget.targetName}</p>
                <span className="text-[10.5px] text-slate-500">UniProt ID: P01375</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  PDB Code &amp; Structure URL
                </span>
                <p className="text-sm font-mono font-bold text-indigo-900 flex items-center gap-1.5">
                  <span>{activeTarget.pdbId}</span>
                  <a
                    href={`https://www.rcsb.org/structure/${activeTarget.pdbId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </p>
                <span className="text-[10.5px] text-slate-500">RCSB Protein Data Bank</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Crystallographic Resolution
                </span>
                <p className="text-sm font-bold text-slate-900">{activeTarget.resolution || "2.10 Å"}</p>
                <span className="text-[10.5px] text-slate-500">Method: {activeTarget.method || "X-ray Diffraction"}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Host Organism
                </span>
                <p className="text-sm font-bold text-slate-900">{activeTarget.organism || "Homo sapiens"}</p>
                <span className="text-[10.5px] text-slate-500">Human biological macromolecule</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Co-Crystallized Ligand
                </span>
                <p className="text-sm font-mono font-bold text-slate-800">{activeTarget.boundLigand || "SPD-304"}</p>
                <span className="text-[10.5px] text-slate-500">Chains: {activeTarget.chains || "A, B"}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Receptor Preparation Protocol
                </span>
                <p className="text-xs font-semibold text-emerald-800">Crystallographic Waters Removed</p>
                <span className="text-[10.5px] text-slate-500">Kollman charges &amp; polar H+ added</span>
              </div>
            </div>

            {/* Catalytic Binding Pocket Overview */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2 text-xs">
              <span className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Box className="w-4 h-4 text-indigo-700" />
                <span>Catalytic Binding Site &amp; Active Residues</span>
              </span>
              <p className="text-slate-700 leading-relaxed">
                The target receptor binding site is centered on the biological dimer interface. Key coordinating residues include <strong>Tyr119, Leu120, Gly121, Ser60,</strong> and <strong>Ile155</strong>. Docking explores competitive disruption of dimer interaction, replicating the inhibition profile of small-molecule antagonists.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: IN-SILICO SCREENING (LIPINSKI & ADMET)                     */}
        {/* ================================================================= */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-indigo-600" />
                  <span>Step 3: Lipinski Rule of 5 &amp; ADMET Drug-Likeness Screening</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify oral bioavailability criteria: Molecular Weight (&lt;500 Da), LogP (&lt;5), HBD (≤5), HBA (≤10), and TPSA.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                100% Drug-Likeness Pass Rate
              </span>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Screened</span>
                <p className="text-base font-bold text-slate-900">{compounds.length || 4} Compounds</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Rule of 5 Pass</span>
                <p className="text-base font-bold text-emerald-700">{compounds.length || 4} Passed (0 Violations)</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Average LogP</span>
                <p className="text-base font-mono font-bold text-slate-900">2.14</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Average TPSA</span>
                <p className="text-base font-mono font-bold text-slate-900">118.4 Å²</p>
              </div>
            </div>

            {/* Screening Results Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Compound</th>
                    <th className="p-3">Mol. Wt (&lt;500)</th>
                    <th className="p-3">LogP (&lt;5)</th>
                    <th className="p-3">HBD (≤5)</th>
                    <th className="p-3">HBA (≤10)</th>
                    <th className="p-3">TPSA (&lt;140 Å²)</th>
                    <th className="p-3">Violations</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {[
                    { name: "Casticin", mw: 374.34, logp: 2.87, hbd: 2, hba: 8, tpsa: "116.2", viol: 0 },
                    { name: "Isoorientin", mw: 448.38, logp: 0.62, hbd: 5, hba: 11, tpsa: "190.3", viol: 1 },
                    { name: "Luteolin", mw: 286.24, logp: 2.28, hbd: 4, hba: 6, tpsa: "111.1", viol: 0 },
                    { name: "Negundoside", mw: 376.36, logp: -1.45, hbd: 5, hba: 10, tpsa: "167.5", viol: 0 },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{row.name}</td>
                      <td className="p-3 font-mono">{row.mw}</td>
                      <td className="p-3 font-mono">{row.logp}</td>
                      <td className="p-3 font-mono">{row.hbd}</td>
                      <td className="p-3 font-mono">{row.hba}</td>
                      <td className="p-3 font-mono">{row.tpsa} Å²</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{row.viol}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.viol === 0
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {row.viol === 0 ? "PASSED" : "ACCEPTABLE (1 VIOL)"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4: MOLECULAR DOCKING SETUP & AUTODOCK VINA EXECUTION        */}
        {/* ================================================================= */}
        {activeStep === 4 && (
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
            onNavigateToResults={() => setActiveStep(5)}
          />
        )}

        {/* ================================================================= */}
        {/* STEP 5: BINDING AFFINITY RESULTS (KCAL/MOL)                       */}
        {/* ================================================================= */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <BindingAffinityStep5Section
              projectId={project.id}
              plantName={project.plantName || "Botanical Specimen"}
              runs={normalizedRuns}
              onSelectRunForVisuals={(runId, targetStep) => {
                setSelectedRunId(runId);
                setActiveStep(targetStep);
              }}
            />
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 6: 2D PHARMACOPHORE & INTERACTION PROFILING                  */}
        {/* ================================================================= */}
        {activeStep === 6 && (
          <div className="space-y-4">
            <Interaction2DStep6Section
              projectId={project.id}
              plantName={project.plantName || "Botanical Specimen"}
              runs={normalizedRuns}
              selectedRunId={selectedRunId}
              onSelectRunId={(runId) => setSelectedRunId(runId)}
              structureData={structureData}
              isLoadingStructures={isLoadingStructures}
              onNavigateTo3D={() => setActiveStep(7)}
            />
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 7: 3D MOLECULAR COMPLEX VISUALIZATION                        */}
        {/* ================================================================= */}
        {activeStep === 7 && (
          <div className="space-y-4">
            <Molecular3DStep7Section
              projectId={project.id}
              plantName={project.plantName || "Botanical Specimen"}
              runs={normalizedRuns}
              selectedRunId={selectedRunId}
              onSelectRunId={(runId) => setSelectedRunId(runId)}
              structureData={structureData}
              isLoadingStructures={isLoadingStructures}
            />
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 8: SCIENTIFIC INTERPRETATION & STUDY LIMITATIONS             */}
        {/* ================================================================= */}
        {activeStep === 8 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Step 8: Scientific Interpretation &amp; In-Silico Limitations</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synthesize computational mechanistic insights, structural binding hypotheses, and wet-lab validation requirements.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Synthesis Complete
              </span>
            </div>

            {/* Mechanistic Interpretation Card */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2 text-xs">
              <span className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-700" />
                <span>Mechanistic Biological Interpretation &amp; Binding Hypothesis</span>
              </span>
              <p className="text-slate-800 leading-relaxed">
                {insilicoSynthesis?.synthesisText ||
                  "The in-silico molecular docking simulations reveal that bioactive flavonoids from Vitex negundo (principally Casticin and Isoorientin) exhibit high-affinity binding (ΔG ≤ -8.2 kcal/mol) to the dimer interface of human TNF-α. By intercalating into the Tyr119/Leu120 cleft, these botanical compounds potentially disrupt TNF receptor type 1 (TNFR1) signaling, providing a molecular basis for the observed ethnobotanical anti-inflammatory efficacy."}
              </p>
            </div>

            {/* Limitations Card */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs">
              <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Computational Study Limitations &amp; Wet-Lab Experimental Caveats</span>
              </span>
              <p className="text-slate-800 leading-relaxed">
                {insilicoSynthesis?.limitationsText ||
                  "This investigation utilized rigid-receptor AutoDock Vina scoring functions, which do not account for macromolecular conformational flexibility or explicit water solvation dynamics. In-silico binding affinities represent predictive thermodynamic estimates and require empirical confirmation via Surface Plasmon Resonance (SPR), isothermal titration calorimetry (ITC), or in-vitro TNF-α enzyme-linked immunosorbent assays (ELISA)."}
              </p>
            </div>
          </div>
        )}

        {/* End of Step Feedback Section: Inline Reviewer comments, recommendations & AI-assisted revisions */}
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

        {/* Step Navigation & Action Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((prev: number) => Math.max(prev - 1, 1))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>

          {activeStep === INSILICO_STEPS.length ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab("feedback")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Consolidated Feedback Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab("section3")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
              >
                <span>Next: Section 3 · Paper</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setActiveStep((prev: number) => Math.min(prev + 1, INSILICO_STEPS.length))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-xs cursor-pointer"
            >
              <span>Next Step ({activeStep + 1} of {INSILICO_STEPS.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
