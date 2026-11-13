"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Sprout,
  Package,
  Beaker,
  Boxes,
  Layers,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import BotanicalStep1Section, {
  type LiteratureItem,
  type PhytochemicalItem,
  type PlantRecord,
} from "@/components/researcher/formulation-rd/BotanicalStep1Section";
import ProductSelectionStep2Section from "@/components/researcher/formulation-rd/ProductSelectionStep2Section";
import ExtractionStep3Section, {
  type ExtractionState,
} from "@/components/researcher/formulation-rd/ExtractionStep3Section";
import MaterialsStep4Section from "@/components/researcher/formulation-rd/MaterialsStep4Section";
import FormulationStep5Section, {
  type FormulationState,
} from "@/components/researcher/formulation-rd/FormulationStep5Section";
import BatchAnalysisStep6Section from "@/components/researcher/formulation-rd/BatchAnalysisStep6Section";
import ReviewerStepFeedbackSection from "./ReviewerStepFeedbackSection";
import { isFeedbackBelongsToStep } from "@/lib/feedback-step-filter";

export interface ReviewerFormulationRdSectionProps {
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

/** Matches researcher Section 1 six-step workflow (read-only). */
const FORMULATION_STEPS = [
  {
    num: 1,
    title: "Plant Information",
    shortTitle: "Plant Information",
    icon: Sprout,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Pharmacognosist & Taxonomist",
  },
  {
    num: 2,
    title: "Product Selection",
    shortTitle: "Product Selection",
    icon: Package,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Pharmaceutical Development Scientist",
  },
  {
    num: 3,
    title: "Extraction",
    shortTitle: "Extraction",
    icon: Beaker,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Phytochemist & Extraction Chemist",
  },
  {
    num: 4,
    title: "Ingredients",
    shortTitle: "Ingredients",
    icon: Boxes,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Formulation Chemist",
  },
  {
    num: 5,
    title: "Formulation Development",
    shortTitle: "Formulation Development",
    icon: Layers,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Senior Formulation Scientist",
  },
  {
    num: 6,
    title: "Batch Analysis",
    shortTitle: "Batch Analysis",
    icon: Activity,
    roleNumber: "01",
    roleName: "Formulation Science & Pharmacognosy",
    roleProfession: "Quality Control / Quality Assurance Analyst",
  },
];

const noopAsync = async () => {};
const noop = () => {};

function buildExtraction(plantData: any): ExtractionState {
  return {
    extractionMethod: plantData?.extractionMethod || "",
    plantMaterialMass: plantData?.plantMaterialMass || "",
    extractionSolvent: plantData?.extractionSolvent || "",
    solventConcentration: plantData?.solventConcentration || "",
    solventRatio: plantData?.solventRatio || "",
    extractionTemperature: plantData?.extractionTemperature || "",
    extractionDuration: plantData?.extractionDuration || "",
    extractYieldPercent: plantData?.extractYieldPercent || "",
    extractFractionName: plantData?.extractFractionName || "",
    extractionReferences: plantData?.extractionReferences || "",
    recoveredDryMass: plantData?.recoveredDryMass || "",
  };
}

function buildFormulationState(
  formulation: any,
  productSelection: any,
  plantName: string,
  components: any[]
): FormulationState {
  return {
    formulationName:
      formulation?.formulationName ||
      (productSelection?.deliveryFormat
        ? `${plantName} ${productSelection.deliveryFormat}`
        : plantName || "Formulation"),
    formulationCode: formulation?.formulationCode || "",
    dosageFormType:
      formulation?.dosageFormType || productSelection?.deliveryFormat || "",
    totalTargetMassVolume: formulation?.totalTargetMassVolume || "",
    targetBatchSize: formulation?.targetBatchSize || "",
    formulationReferences: formulation?.formulationReferences || "",
    notes: formulation?.notes || "",
    versionNumber:
      formulation?.currentVersionNumber ||
      formulation?.versionNumber ||
      "v1.0",
    components: (components || []).map((c: any) => ({
      ...c,
      ingredientName: c.ingredientName || c.componentName || "Component",
      concentrationValue: Number(
        c.concentrationValue ?? c.quantity ?? c.percentage ?? 0
      ),
      concentrationUnit: c.concentrationUnit || c.unit || "% w/w",
      roleOrFunction: c.roleOrFunction || c.roleInFormulation || "Compounding Agent",
    })),
  };
}

export default function ReviewerFormulationRdSection({
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
}: ReviewerFormulationRdSectionProps) {
  const [internalActiveStep, setInternalActiveStep] = useState(1);
  const activeStep = controlledStep !== undefined ? controlledStep : internalActiveStep;
  const setActiveStep = (stepOrFn: any) => {
    const nextVal = typeof stepOrFn === "function" ? stepOrFn(activeStep) : stepOrFn;
    const clamped = Math.min(6, Math.max(1, Number(nextVal) || 1));
    if (onStepChange) onStepChange(clamped);
    setInternalActiveStep(clamped);
  };

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<any>(null);

  useEffect(() => {
    if (!project?.id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetch(`/api/reviewer/projects/${project.id}/formulation-workspace`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "Failed to load Section 1 workspace");
        return json;
      })
      .then((json) => {
        if (!cancelled) setWorkspace(json?.data || null);
      })
      .catch((err: any) => {
        if (!cancelled) setLoadError(err?.message || "Failed to load Section 1 workspace");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  // Fallback from dossier while / if live workspace is unavailable
  const dossierPlantData = dossier?.section1?.plantData || dossier?.plantData || {};
  const dossierProduct =
    dossier?.section1?.productSelection || dossier?.productSelection || null;
  const dossierMaterials: any[] =
    dossier?.section1?.materials || dossier?.materials || [];
  const dossierFormulations = dossier?.section1?.formulations || dossier?.formulations;
  const dossierFormulation = Array.isArray(dossierFormulations)
    ? dossierFormulations[0]
    : dossierFormulations || null;
  const dossierComponents: any[] =
    dossierFormulation?.components?.length > 0
      ? dossierFormulation.components
      : dossier?.section1?.components || dossier?.components || [];
  const dossierBatches: any[] =
    dossier?.section1?.batchAnalyses || dossier?.batchAnalyses || [];

  const wsProject = workspace?.project || {
    id: project.id,
    title: project.title,
    plantName: project.plantName,
    plantScientificName: project.plantScientificName,
    plantId: project.plantId,
  };
  const plantData = workspace?.plantData || dossierPlantData;
  const allPlants: PlantRecord[] = workspace?.allPlants || [];
  const verifiedPlant: PlantRecord = workspace?.verifiedPlantDetails || {
    id: String(wsProject.plantId || project.id),
    slug: String(wsProject.plantId || project.id),
    commonName: wsProject.plantName || project.plantName || "Unspecified Plant",
    scientificName: wsProject.plantScientificName || project.plantScientificName || "Not documented",
    family: plantData?.family || "Not documented",
    localNames: plantData?.localNames || "Not documented",
    category: "Medicinal Plant",
    isPitahc: false,
    documentedParts: plantData?.partsStudied
      ? String(plantData.partsStudied).split(",").map((s: string) => s.trim())
      : ["Leaves"],
    imageUrl: "/images/placeholder-plant.jpg",
    botanicalSynonyms: "Not documented",
    traditionalUses: plantData?.traditionalUses || "Not documented",
    traditionalPreparations: plantData?.ethnobotanicalNotes || "Not documented",
  };
  const verifiedPhytochemicals: PhytochemicalItem[] =
    workspace?.verifiedPhytochemicals || [];
  const studyCompoundNames: string[] =
    workspace?.initialStudyCompoundNames ||
    (dossier?.compounds || []).map((c: any) => c.compoundName).filter(Boolean);
  const scientificLiterature: LiteratureItem[] =
    workspace?.scientificLiterature || [];
  const linkedLiteratureIds: string[] =
    workspace?.initialLinkedLiteratureIds || [];
  const linkedLiterature = workspace?.linkedLiterature || [];
  const productSelection = workspace?.productSelection || dossierProduct || {
    productType: "",
    deliveryFormat: "",
    targetIndications: "",
    intendedPopulation: "",
    packagingType: "",
    rationale: "",
  };
  const materials = workspace?.materials || dossierMaterials;
  const formulation = workspace?.formulation || dossierFormulation;
  const components = workspace?.components?.length
    ? workspace.components
    : dossierComponents;
  const batches = workspace?.batches?.length ? workspace.batches : dossierBatches;

  const extraction = useMemo(() => buildExtraction(plantData), [plantData]);
  const formulationState = useMemo(
    () =>
      buildFormulationState(
        formulation,
        productSelection,
        wsProject.plantName || project.plantName || "",
        components
      ),
    [formulation, productSelection, wsProject.plantName, project.plantName, components]
  );

  const currentStepConfig = FORMULATION_STEPS[activeStep - 1];
  const stepFeedback = feedbackList.filter((f) =>
    isFeedbackBelongsToStep(f, "section1", activeStep, currentStepConfig.title)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
        {FORMULATION_STEPS.map((step) => {
          const Icon = step.icon;
          const isCurrent = activeStep === step.num;
          const isStepApproved = approvedSteps.includes(step.num);
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveStep(step.num)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
                isCurrent
                  ? "bg-emerald-700 text-white font-semibold shadow-xs"
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

      {stepFeedback.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-amber-900 font-bold border-b border-amber-200/80 pb-2.5">
            <span className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Reviewer Findings on Step {activeStep} ({stepFeedback.length}):
              </span>
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
                f.recommendation.trim().toLowerCase() !==
                  (f.comment || "").trim().toLowerCase();

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
                              ? "bg-teal-100 text-teal-900"
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
                      <strong className="text-slate-900">Required Action:</strong>{" "}
                      {f.recommendation}
                    </div>
                  )}
                  {f.researcherReply && (
                    <div className="p-3 rounded-lg bg-teal-50/80 border border-teal-200 text-teal-950 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
                        <span>✓ Researcher Resubmission / Implementation Note:</span>
                      </div>
                      <p className="text-xs text-teal-950 leading-relaxed font-medium">
                        {f.researcherReply}
                      </p>
                    </div>
                  )}
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

      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-blue-400/25 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3 text-white text-xs shadow-[0_8px_20px_-14px_rgba(7,25,48,0.45)]">
          <div className="flex items-center gap-2.5 flex-wrap z-10">
            <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Role 01: {currentStepConfig.roleName}
            </span>
            <span className="text-slate-200 flex items-center gap-1.5">
              Specialist:{" "}
              <strong className="text-white font-semibold px-2 py-0.5 rounded bg-white/10 border border-white/15">
                {currentStepConfig.roleProfession}
              </strong>
            </span>
            <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200">
              Read-only
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 z-10 self-start sm:self-auto">
            {approvedSteps.includes(activeStep) ? (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs bg-emerald-500 text-white border border-emerald-400 opacity-95 cursor-default select-none"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Step {activeStep} Approved ✓</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleApproveStep && onToggleApproveStep(activeStep)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 cursor-pointer active:scale-95 transition-all"
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Approve Step {activeStep}</span>
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Formulation R&amp;D records…
          </div>
        )}

        {!loading && loadError && !workspace && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-900">
            {loadError}. Showing dossier snapshot where available.
          </div>
        )}

        {!loading && (
          <>
            {activeStep === 1 && (
              <BotanicalStep1Section
                project={wsProject}
                allPlants={allPlants}
                verifiedPlant={verifiedPlant}
                plantData={plantData}
                onUpdatePlantData={noop}
                verifiedPhytochemicals={verifiedPhytochemicals}
                studyCompoundNames={studyCompoundNames}
                onToggleStudyCompound={noopAsync}
                scientificLiterature={scientificLiterature}
                linkedLiteratureIds={linkedLiteratureIds}
                onToggleLiteratureReference={noopAsync}
                isSaving={false}
                onSave={noopAsync}
                onSelectPlant={noopAsync}
                readOnly
              />
            )}

            {activeStep === 2 && (
              <ProductSelectionStep2Section
                project={wsProject}
                plantData={plantData}
                verifiedPlant={verifiedPlant}
                linkedLiterature={linkedLiterature}
                productSelection={productSelection}
                onChange={noop}
                onSave={noopAsync}
                isSaving={false}
                readOnly
              />
            )}

            {activeStep === 3 && (
              <ExtractionStep3Section
                project={wsProject}
                productSelection={productSelection}
                extraction={extraction}
                onChange={noop}
                onSave={noopAsync}
                isSaving={false}
                scientificLiterature={scientificLiterature}
                linkedLiterature={linkedLiterature}
                onToggleLiteratureReference={noopAsync}
                readOnly
              />
            )}

            {activeStep === 4 && (
              <MaterialsStep4Section
                project={wsProject}
                productSelection={productSelection}
                extraction={extraction}
                verifiedPhytochemicals={verifiedPhytochemicals}
                materials={materials}
                onSaveMaterial={noopAsync}
                onDeleteMaterial={noopAsync}
                onRefreshMaterials={noopAsync}
                isSaving={false}
                readOnly
              />
            )}

            {activeStep === 5 && (
              <FormulationStep5Section
                project={wsProject}
                productSelection={productSelection}
                extraction={extraction}
                materials={materials}
                scientificLiterature={scientificLiterature}
                linkedLiterature={linkedLiterature}
                formulation={formulationState}
                onChange={noop}
                onSave={noopAsync}
                isSaving={false}
                readOnly
              />
            )}

            {activeStep === 6 && (
              <BatchAnalysisStep6Section
                projectId={project.id}
                plantName={wsProject.plantName || project.plantName || ""}
                plantScientificName={
                  wsProject.plantScientificName || project.plantScientificName
                }
                formulationCode={formulationState.formulationCode || "—"}
                formulationName={formulationState.formulationName}
                dosageFormType={formulationState.dosageFormType || "—"}
                targetBatchSize={formulationState.targetBatchSize || "—"}
                versionNumber={formulationState.versionNumber}
                components={formulationState.components}
                materials={materials}
                batches={batches}
                onBatchesChange={noop}
                literatureReferences={scientificLiterature}
                isSaving={false}
                onSaveDraft={noopAsync}
                saveStatus="idle"
                readOnly
              />
            )}
          </>
        )}
      </div>

      <ReviewerStepFeedbackSection
        projectId={project.id}
        submissionId={project.activeSubmissionId}
        sectionKey="section1"
        sectionTitle="Section 1: Formulation R&D"
        stepNumber={activeStep}
        stepTitle={currentStepConfig.title}
        roleProfession={currentStepConfig.roleProfession}
        isApproved={approvedSteps.includes(activeStep)}
        onToggleApprove={() => onToggleApproveStep && onToggleApproveStep(activeStep)}
        onRefreshFeedback={onRefreshFeedback}
        onDeleteFeedback={onDeleteFeedback}
        onResolveFeedback={onResolveFeedback}
      />

    </div>
  );
}
