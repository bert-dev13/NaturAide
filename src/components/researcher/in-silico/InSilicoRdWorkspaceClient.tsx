// src/components/researcher/in-silico/InSilicoRdWorkspaceClient.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
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

  // Refresh docking workspace data
  const refreshWorkspace = async () => {
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/docking`);
      if (res.ok) {
        const data = await res.json();
        if (data.workspace) setWorkspace(data.workspace);
      }
    } catch {}
  };

  // Poll workspace if any docking job is active or preparing
  useEffect(() => {
    const activeStatuses = ["QUEUED", "PREPARING", "DOCKING", "PROCESSING", "RUNNING"];
    const hasActiveJob =
      Boolean(workspace?.busy) ||
      workspace?.runs?.some((r: any) => activeStatuses.includes(String(r.jobStatus).toUpperCase())) ||
      workspace?.jobs?.some((j: any) => activeStatuses.includes(String(j.status).toUpperCase()) || j.active) ||
      workspace?.targets?.some((t: any) => t.prepStatus === "PREPARING" || t.status === "PREPARING");

    if (!hasActiveJob) return;

    const interval = setInterval(() => {
      refreshWorkspace();
    }, 2500);

    return () => clearInterval(interval);
  }, [workspace]);

  // Load structure files for 2D/3D visualization when selectedRunId changes
  useEffect(() => {
    const completedRuns = (workspace?.runs || []).filter(
      (r: any) => r.jobStatus === "COMPLETED" || r.bindingAffinity !== null
    );

    if (!selectedRunId && completedRuns.length > 0) {
      setSelectedRunId(completedRuns[0].id);
      return;
    }

    if (!selectedRunId) return;

    const loadStructures = async () => {
      setIsLoadingStructures(true);
      try {
        const res = await fetch(
          `/api/researcher/projects/${project.id}/docking/structure-files?runId=${selectedRunId}`
        );
        if (res.ok) {
          const data = await res.json();
          setStructureData({
            receptorPdb: data.receptorPdb || "",
            ligandPdbqt: data.ligandPdbqt || "",
            interactions: data.interactions || null,
          });
        }
      } catch (err) {
        console.error("Error loading structure files:", err);
      } finally {
        setIsLoadingStructures(false);
      }
    };

    loadStructures();
  }, [selectedRunId, workspace]);

  // ---------------------------------------------------------------------------
  // STEP 2 TARGET HANDLERS
  // ---------------------------------------------------------------------------
  const handleAddTarget = async (pdbId: string) => {
    setIsAddingTarget(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/docking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-target", pdbId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add target");
      if (data.workspace) setWorkspace(data.workspace);
      setMessage({ text: `Target protein (${pdbId.toUpperCase()}) added and receptor preparation initiated!`, type: "success" });
    } catch (e: any) {
      setMessage({ text: e.message, type: "error" });
    } finally {
      setIsAddingTarget(false);
    }
  };

  const handleRemoveTarget = async (targetId: number) => {
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/docking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-target", targetId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.workspace) setWorkspace(data.workspace);
      }
    } catch {}
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

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      {/* 1. TOP HEADER & COMPACT STEP NAVIGATION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Link
                  href={`/researcher/projects/${project.id}`}
                  className="text-slate-500 hover:text-teal-700 flex items-center gap-1 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Workspace Hub
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  Section 2 / Step 0{activeStep} of 08
                </span>
                <span className="text-slate-300">•</span>
                {/* Computational Status Indicator */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  {activeRunningCount > 0 ? (
                    <span className="flex items-center gap-1 text-blue-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Running ({activeRunningCount} jobs)...
                    </span>
                  ) : isSaving ? (
                    <span className="flex items-center gap-1 text-amber-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Saving...
                    </span>
                  ) : message?.type === "success" ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Saved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      Draft / Ready
                    </span>
                  )}
                </div>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-600" />
                {STEPS[activeStep - 1].title}
              </h1>

              {/* Compact 8-segment progress bar */}
              <div className="flex items-center gap-1 pt-0.5 max-w-sm">
                {STEPS.map((step) => {
                  const isFilled = step.number <= activeStep;
                  return (
                    <div
                      key={step.number}
                      className={`h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
                        isFilled ? "bg-teal-600" : "bg-slate-200"
                      }`}
                      onClick={() => setActiveStep(step.number)}
                      title={`Step ${step.number}: ${step.title}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* 8 Step Switcher (Responsive) */}
          <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1 border-t border-slate-100 pt-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCurrent = activeStep === step.number;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActiveStep(step.number)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-teal-700 text-white font-semibold shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>
                    {step.number}. {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. BODY WORKSPACE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Active Step Reviewer Revision Banner */}
        <ResearcherStepRevisionBanner
          projectId={project.id}
          sectionKey="section2"
          sectionTitle="Section 2: In-Silico Molecular Docking"
          stepNumber={activeStep}
          stepTitle={STEPS[activeStep - 1]?.title || `Step ${activeStep}`}
        />

        {/* STEP 1: PHYTOCHEMICAL SELECTION */}
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

        {/* STEP 2: TARGET PROTEIN SELECTION */}
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

        {/* STEP 3: IN-SILICO SCREENING */}
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

        {/* STEP 4: MOLECULAR DOCKING EXECUTION */}
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

        {/* STEP 5: BINDING AFFINITY RESULTS */}
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

        {/* STEP 6: 2D INTERACTION DIAGRAMS */}
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

        {/* STEP 7: 3D MOLECULAR VISUALIZATION */}
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

        {/* STEP 8: RESULTS & INTERPRETATION */}
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
            onProceedToSection3={() => router.push(`/researcher/projects/${project.id}/submission`)}
          />
        )}
      </div>

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
