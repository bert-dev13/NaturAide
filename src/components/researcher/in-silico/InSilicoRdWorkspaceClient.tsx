// src/components/researcher/in-silico/InSilicoRdWorkspaceClient.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Dna,
  Target,
  FlaskConical,
  Activity,
  Layers,
  ArrowRight,
  ArrowLeft,
  Play,
  Atom,
  Info,
  X,
} from "lucide-react";
import PhytochemicalSelectorModal from "./PhytochemicalSelectorModal";
import ResearchStepFooterNav from "@/components/researcher/ResearchStepFooterNav";

// 8 Modular Step Section Components
import PhytochemicalStep1Section from "./PhytochemicalStep1Section";
import TargetProteinStep2Section from "./TargetProteinStep2Section";
import ScreeningStep3Section from "./ScreeningStep3Section";
import DockingExecutionStep4Section from "./DockingExecutionStep4Section";
import BindingAffinityStep5Section from "./BindingAffinityStep5Section";
import Interaction2DStep6Section from "./Interaction2DStep6Section";
import Molecular3DStep7Section from "./Molecular3DStep7Section";
import InterpretationStep8Section from "./InterpretationStep8Section";
import type { LiteratureReferenceItem } from "./ScientificReferencesSection";
import ResearcherStepRevisionBanner from "@/components/researcher/ResearcherStepRevisionBanner";

interface Props {
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
    researchObjective?: string;
  };
  compounds: any[];
  screenResults: any[];
  dockingWorkspace: any;
  synthesis: any;
  availableCompounds: any[];
  scientificLiterature?: LiteratureReferenceItem[];
  initialStep?: number;
}

export default function InSilicoRdWorkspaceClient({
  project,
  compounds: initialCompounds = [],
  screenResults: initialScreenResults = [],
  dockingWorkspace: initialDockingWorkspace,
  synthesis: initialSynthesis,
  availableCompounds = [],
  scientificLiterature = [],
  initialStep = 1,
}: Props) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number>(initialStep || 1);

  useEffect(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 8) {
      setActiveStep(initialStep);
    }
  }, [initialStep]);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal controls
  const [showPhytoModal, setShowPhytoModal] = useState<boolean>(false);

  // 1. Phytochemicals State
  const [compounds, setCompounds] = useState<any[]>(initialCompounds);

  // 2. Target Proteins & Docking Workspace State
  const [workspace, setWorkspace] = useState<any>(initialDockingWorkspace || { targets: [], runs: [] });
  const [isAddingTarget, setIsAddingTarget] = useState<boolean>(false);

  // 3. In-Silico Screening Results State
  const [screenResults, setScreenResults] = useState<any[]>(initialScreenResults);
  const [isScreening, setIsScreening] = useState<boolean>(false);

  // 4. Molecular Docking Running State
  const [isRunningDocking, setIsRunningDocking] = useState<boolean>(false);
  const [exhaustiveness, setExhaustiveness] = useState<number>(
    workspace?.settings?.exhaustiveness || 8
  );
  const [numModes, setNumModes] = useState<number>(workspace?.settings?.numModes || 9);

  // 5, 6, 7. Active Run for 2D/3D Visualization
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [structureData, setStructureData] = useState<{
    receptorPdb: string;
    ligandPdbqt: string;
    interactions: any;
  } | null>(null);
  const [isLoadingStructures, setIsLoadingStructures] = useState<boolean>(false);

  // 8. Computational Interpretation & Synthesis State (empty unless saved in MySQL)
  const [synthesisText, setSynthesisText] = useState<string>(
    initialSynthesis?.keyFindings || ""
  );
  const [limitationsText, setLimitationsText] = useState<string>(
    initialSynthesis?.potentialLimitations || ""
  );

  const STEPS = [
    { number: 1, title: "Phytochemical Selection", icon: Dna },
    { number: 2, title: "Target Protein Selection", icon: Target },
    { number: 3, title: "In-Silico Screening", icon: FlaskConical },
    { number: 4, title: "Molecular Docking Execution", icon: Play },
    { number: 5, title: "Binding Affinity Results", icon: Activity },
    { number: 6, title: "2D Interaction Visualization", icon: Atom },
    { number: 7, title: "3D Molecular Visualization", icon: Layers },
    { number: 8, title: "Results & Interpretation", icon: Info },
  ];

  // Refresh docking workspace data (quiet — no banner / remount)
  const refreshWorkspace = async () => {
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/docking`);
      if (res.ok) {
        const data = await res.json();
        if (data.workspace) setWorkspace(data.workspace);
      }
    } catch {}
  };

  // Poll only while jobs are active; depend on a cheap flag so checkbox toggles
  // don't tear down / recreate the interval every render.
  const hasActiveDockingJob = useMemo(() => {
    const activeStatuses = ["QUEUED", "PREPARING", "DOCKING", "PROCESSING", "RUNNING"];
    return (
      Boolean(workspace?.busy) ||
      workspace?.runs?.some((r: any) =>
        activeStatuses.includes(String(r.jobStatus).toUpperCase())
      ) ||
      workspace?.jobs?.some(
        (j: any) =>
          activeStatuses.includes(String(j.status).toUpperCase()) || j.active
      ) ||
      workspace?.targets?.some(
        (t: any) => t.prepStatus === "PREPARING" || t.status === "PREPARING"
      )
    );
  }, [workspace]);

  useEffect(() => {
    if (!hasActiveDockingJob) return;
    const interval = setInterval(() => {
      refreshWorkspace();
    }, 2500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveDockingJob, project.id]);

  // Load structure files only when the selected run changes (not on every
  // workspace poll / target checkbox update).
  useEffect(() => {
    const completedRuns = (workspace?.runs || []).filter(
      (r: any) => r.jobStatus === "COMPLETED" || r.bindingAffinity !== null
    );

    if (!selectedRunId && completedRuns.length > 0) {
      setSelectedRunId(completedRuns[0].id);
      return;
    }

    if (!selectedRunId) return;
    // Skip heavy structure fetch while browsing earlier steps
    if (activeStep < 6) return;

    let cancelled = false;
    const loadStructures = async () => {
      setIsLoadingStructures(true);
      try {
        const res = await fetch(
          `/api/researcher/projects/${project.id}/docking/structure-files?runId=${selectedRunId}`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setStructureData({
          receptorPdb: data.receptorPdb || "",
          ligandPdbqt: data.ligandPdbqt || "",
          interactions: data.interactions || null,
        });
      } catch (err) {
        console.error("Error loading structure files:", err);
      } finally {
        if (!cancelled) setIsLoadingStructures(false);
      }
    };

    loadStructures();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRunId, activeStep, project.id]);

  // ---------------------------------------------------------------------------
  // STEP 2 TARGET HANDLERS — optimistic, no success-banner layout jump
  // ---------------------------------------------------------------------------
  const handleAddTarget = async (pdbId: string) => {
    const clean = pdbId.toUpperCase();
    if ((workspace?.targets || []).some((t: any) => String(t.pdbId).toUpperCase() === clean)) {
      return;
    }

    setIsAddingTarget(true);
    // Optimistic row so the checkbox sticks immediately
    const optimisticId = -Date.now();
    setWorkspace((prev: any) => ({
      ...prev,
      targets: [
        ...(prev?.targets || []),
        {
          id: optimisticId,
          pdbId: clean,
          targetName: clean,
          prepStatus: "PREPARING",
          _optimistic: true,
        },
      ],
    }));

    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/docking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-target", pdbId: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add target");
      if (data.workspace) setWorkspace(data.workspace);
    } catch (e: any) {
      // Roll back optimistic row
      setWorkspace((prev: any) => ({
        ...prev,
        targets: (prev?.targets || []).filter((t: any) => t.id !== optimisticId),
      }));
      setMessage({ text: e.message || "Failed to add target", type: "error" });
    } finally {
      setIsAddingTarget(false);
    }
  };

  const handleRemoveTarget = async (targetId: number) => {
    const previous = workspace;
    // Optimistic remove — checkbox clears instantly
    setWorkspace((prev: any) => ({
      ...prev,
      targets: (prev?.targets || []).filter((t: any) => t.id !== targetId),
    }));

    // Local-only optimistic rows never hit the API
    if (targetId < 0) return;

    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/docking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-target", targetId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.workspace) setWorkspace(data.workspace);
      } else {
        setWorkspace(previous);
        const data = await res.json().catch(() => ({}));
        setMessage({
          text: data.error || "Failed to remove target",
          type: "error",
        });
      }
    } catch {
      setWorkspace(previous);
      setMessage({ text: "Failed to remove target", type: "error" });
    }
  };

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // STEP 3 SCREENING HANDLERS
  // ---------------------------------------------------------------------------
  const handleRunScreening = async () => {
    if (compounds.length === 0) {
      alert("Please select at least one phytochemical compound first.");
      return;
    }
    setIsScreening(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-screening" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Screening failed");

      // Refetch screening results and compounds
      const resScr = await fetch(`/api/researcher/projects/${project.id}/in-silico`);
      if (resScr.ok) {
        const dScr = await resScr.json();
        if (dScr.results) setScreenResults(dScr.results);
        if (dScr.compounds) setCompounds(dScr.compounds);
      }
      setMessage({
        text: `Computational screening completed for ${data.count || compounds.length} compound(s)!`,
        type: "success",
      });
    } catch (e: any) {
      setMessage({ text: e.message || "Screening failed", type: "error" });
    } finally {
      setIsScreening(false);
    }
  };

  const handleToggleDocking = async (compoundId: number, selected: boolean) => {
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-docking",
          compoundId,
          selectedForDocking: selected,
        }),
      });
      if (res.ok) {
        setCompounds((prev: any[]) =>
          prev.map((c) => (c.id === compoundId ? { ...c, selectedForDocking: selected ? 1 : 0 } : c))
        );
      }
    } catch (e) {
      console.error("Failed to toggle docking candidate:", e);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 4 DOCKING HANDLERS
  // ---------------------------------------------------------------------------
  const handleRunAllDocking = async () => {
    if (isRunningDocking) return;
    setIsRunningDocking(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/docking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-all" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start docking");
      if (data.workspace) setWorkspace(data.workspace);
      setMessage({
        text: "Molecular docking started! Running AutoDock Vina calculations in the background...",
        type: "success",
      });
    } catch (e: any) {
      setMessage({ text: e.message, type: "error" });
    } finally {
      setIsRunningDocking(false);
    }
  };

  const handleRetryFailedDocking = async () => {
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/docking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry-failed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to retry failed docking jobs");
      if (data.workspace) setWorkspace(data.workspace);
      setMessage({
        text: "Retrying failed docking combinations...",
        type: "success",
      });
    } catch (e: any) {
      setMessage({ text: e.message, type: "error" });
    }
  };

  const handleRunSingleDocking = async (compoundId: number, targetId: number) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/docking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", compoundId, targetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start docking combination");
      if (data.workspace) setWorkspace(data.workspace);
    } catch (e: any) {
      setMessage({ text: e.message, type: "error" });
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 8 INTERPRETATION HANDLERS
  // ---------------------------------------------------------------------------
  const handleSaveSynthesis = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-synthesis",
          keyFindings: synthesisText,
          potentialLimitations: limitationsText,
          overallConclusion: synthesisText,
        }),
      });
      if (!res.ok) throw new Error("Failed to save computational interpretation");
      setMessage({ text: "In-Silico computational synthesis saved successfully!", type: "success" });
    } catch (e: any) {
      setMessage({ text: e.message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveActiveStep = async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (activeStep === 8) {
        await handleSaveSynthesis();
        return true;
      }
      const res = await fetch(`/api/researcher/projects/${project.id}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-draft",
          step: activeStep,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed to save Step ${activeStep} draft`);
      }
      setMessage({ text: `Step ${activeStep} specifications saved to database.`, type: "success" });
      return true;
    } catch (e: any) {
      setMessage({ text: e.message || "Save error", type: "error" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Active running jobs count
  const activeRunningCount = useMemo(() => {
    const activeStatuses = ["QUEUED", "PREPARING", "DOCKING", "PROCESSING", "RUNNING"];
    if (workspace?.jobs?.length) {
      return workspace.jobs.filter(
        (j: any) => activeStatuses.includes(String(j.status).toUpperCase()) || j.active
      ).length;
    }
    return (workspace?.runs || []).filter((r: any) =>
      activeStatuses.includes(String(r.jobStatus).toUpperCase())
    ).length;
  }, [workspace]);

  const ActiveIcon = STEPS[activeStep - 1]?.icon || Cpu;

  return (
    <div className="w-full max-w-none space-y-5 pb-32 text-slate-800">
      {/* Compact workspace header — matches Section 1 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(15,44,32,0.55)] sm:px-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-emerald-200/80">
                <Link
                  href={`/researcher/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 transition hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Workspace Hub
                </Link>
                <span className="text-emerald-700">/</span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                  Section 2 · Step {String(activeStep).padStart(2, "0")} / 08
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    activeRunningCount > 0
                      ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                      : isSaving
                        ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                        : message?.type === "success"
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                          : "border-white/15 bg-white/5 text-emerald-100/80"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      activeRunningCount > 0
                        ? "animate-pulse bg-sky-300"
                        : isSaving
                          ? "animate-pulse bg-amber-300"
                          : message?.type === "success"
                            ? "bg-emerald-300"
                            : "bg-slate-300"
                    }`}
                  />
                  {activeRunningCount > 0
                    ? `Running (${activeRunningCount})`
                    : isSaving
                      ? "Saving..."
                      : message?.type === "success"
                        ? "Saved"
                        : "Draft"}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200">
                  <ActiveIcon className="h-4 w-4" />
                </span>
                <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {STEPS[activeStep - 1].title}
                </h1>
              </div>
              <div className="mt-2 flex max-w-lg items-center gap-1">
                {STEPS.map((step) => (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => setActiveStep(step.number)}
                    title={`Step ${step.number}: ${step.title}`}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      step.number <= activeStep ? "bg-emerald-400" : "bg-white/15 hover:bg-white/25"
                    }`}
                  />
                ))}
              </div>
            </div>

            <Link
              href={`/researcher/projects/${project.id}/submission`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
            >
              Proceed to Section 3
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCurrent = activeStep === step.number;
              const isDone = step.number < activeStep;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActiveStep(step.number)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    isCurrent
                      ? "bg-emerald-400 text-[#091a13] shadow-sm"
                      : isDone
                        ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                        : "border border-white/10 bg-white/5 text-emerald-100/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="font-mono text-[10px] opacity-80">{step.number}</span>
                  <span className="hidden lg:inline">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-medium ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="rounded-md p-1 text-current/60 hover:bg-black/5 hover:text-current"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ResearcherStepRevisionBanner
        projectId={project.id}
        sectionKey="section2"
        sectionTitle="Section 2: In-Silico Molecular Docking"
        stepNumber={activeStep}
        stepTitle={STEPS[activeStep - 1]?.title || `Step ${activeStep}`}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeStep === 1 && (
            <PhytochemicalStep1Section
              projectId={project.id}
              plantName={project.plantName}
              compounds={compounds}
              availableCompounds={availableCompounds}
              onCompoundsChange={setCompounds}
              onOpenAddModal={() => setShowPhytoModal(true)}
              onRefreshWorkspace={refreshWorkspace}
            />
          )}

          {activeStep === 2 && (
            <TargetProteinStep2Section
              projectId={project.id}
              plantName={project.plantName}
              plantScientificName={project.plantScientificName}
              researchObjective={project.researchObjective}
              compounds={compounds}
              targets={workspace?.targets || []}
              onAddTarget={handleAddTarget}
              onRemoveTarget={handleRemoveTarget}
              isAddingTarget={isAddingTarget}
            />
          )}

          {activeStep === 3 && (
            <ScreeningStep3Section
              projectId={project.id}
              compounds={compounds}
              screenResults={screenResults}
              onRunScreening={handleRunScreening}
              isScreening={isScreening}
              onToggleDocking={handleToggleDocking}
              onNextStep={() => setActiveStep(4)}
            />
          )}

          {activeStep === 4 && (
            <DockingExecutionStep4Section
              projectId={project.id}
              plantName={project.plantName}
              workspace={workspace}
              compounds={compounds}
              onRunAllDocking={handleRunAllDocking}
              onRetryFailed={handleRetryFailedDocking}
              onRunSingleDocking={handleRunSingleDocking}
              onNavigateToResults={() => setActiveStep(5)}
              isRunningDocking={isRunningDocking}
              exhaustiveness={exhaustiveness}
              onExhaustivenessChange={setExhaustiveness}
              numModes={numModes}
              onNumModesChange={setNumModes}
              onSelectRunForVisuals={(runId, targetStep) => {
                setSelectedRunId(runId);
                setActiveStep(targetStep);
              }}
            />
          )}

          {activeStep === 5 && (
            <BindingAffinityStep5Section
              projectId={project.id}
              plantName={project.plantName}
              runs={workspace?.runs || []}
              onSelectRunForVisuals={(runId, targetStep) => {
                setSelectedRunId(runId);
                setActiveStep(targetStep);
              }}
            />
          )}

          {activeStep === 6 && (
            <Interaction2DStep6Section
              projectId={project.id}
              plantName={project.plantName}
              runs={workspace?.runs || []}
              selectedRunId={selectedRunId}
              onSelectRunId={setSelectedRunId}
              structureData={structureData}
              isLoadingStructures={isLoadingStructures}
              onNavigateTo3D={() => setActiveStep(7)}
            />
          )}

          {activeStep === 7 && (
            <Molecular3DStep7Section
              projectId={project.id}
              plantName={project.plantName}
              runs={workspace?.runs || []}
              selectedRunId={selectedRunId}
              onSelectRunId={setSelectedRunId}
              structureData={structureData}
              isLoadingStructures={isLoadingStructures}
            />
          )}

          {activeStep === 8 && (
            <InterpretationStep8Section
              projectId={project.id}
              plantName={project.plantName}
              compoundsCount={compounds.length}
              targetsCount={workspace?.targets?.length || 0}
              completedRunsCount={
                (workspace?.runs || []).filter((r: any) => r.bindingAffinity !== null).length
              }
              topRuns={(workspace?.runs || []).filter((r: any) => r.bindingAffinity !== null)}
              synthesisText={synthesisText}
              onSynthesisTextChange={setSynthesisText}
              limitationsText={limitationsText}
              onLimitationsTextChange={setLimitationsText}
              onSaveSynthesis={handleSaveSynthesis}
              isSaving={isSaving}
              onProceedToSection3={() =>
                router.push(`/researcher/projects/${project.id}/submission`)
              }
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Phytochemical Selector Modal */}
      {showPhytoModal && (
        <PhytochemicalSelectorModal
          isOpen={showPhytoModal}
          projectId={project.id}
          plantName={project.plantName}
          plantScientificName={project.plantScientificName}
          existingCompoundNames={compounds.map((c) => c.compoundName)}
          onClose={() => setShowPhytoModal(false)}
          onCompoundAdded={async (newComp: any) => {
            setCompounds([...compounds, newComp]);
            setShowPhytoModal(false);
            refreshWorkspace();
          }}
        />
      )}

      {/* Centralized Sticky Footer Step Navigation */}
      <ResearchStepFooterNav
        projectId={project.id}
        sectionNumber={2}
        sectionTitle="Section 2: In-Silico Analysis & Molecular Docking"
        steps={STEPS}
        activeStep={activeStep}
        onStepChange={setActiveStep}
        onSaveDraft={handleSaveActiveStep}
        isSaving={isSaving || isRunningDocking}
        saveStatus={
          isSaving || isRunningDocking
            ? "saving"
            : message?.type === "success"
            ? "saved"
            : message?.type === "error"
            ? "error"
            : "idle"
        }
      />
    </div>
  );
}
