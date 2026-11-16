"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout,
  Package,
  Beaker,
  Boxes,
  FlaskConical,
  Activity,
  ArrowRight,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import BotanicalStep1Section, {
  PlantRecord,
  PhytochemicalItem,
  LiteratureItem,
} from "@/components/researcher/formulation-rd/BotanicalStep1Section";
import ProductSelectionStep2Section from "@/components/researcher/formulation-rd/ProductSelectionStep2Section";
import ExtractionStep3Section from "@/components/researcher/formulation-rd/ExtractionStep3Section";
import MaterialsStep4Section from "@/components/researcher/formulation-rd/MaterialsStep4Section";
import FormulationStep5Section, {
  FormulationState,
} from "@/components/researcher/formulation-rd/FormulationStep5Section";
import BatchAnalysisStep6Section from "@/components/researcher/formulation-rd/BatchAnalysisStep6Section";
import ResearchStepFooterNav from "@/components/researcher/ResearchStepFooterNav";
import ResearcherStepRevisionBanner from "@/components/researcher/ResearcherStepRevisionBanner";
import ResearchSectionWorkspaceHeader from "@/components/researcher/ResearchSectionWorkspaceHeader";

interface Props {
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
    plantId?: string;
    researchObjective?: string;
    researchQuestion?: string;
  };
  initialStep?: number;
  plantData: any;
  allPlants?: PlantRecord[];
  verifiedPlantDetails?: any;
  verifiedPhytochemicals: any[];
  initialStudyCompoundNames?: string[];
  scientificLiterature?: LiteratureItem[];
  linkedLiterature: any[];
  initialLinkedLiteratureIds?: string[];
  productSelection: any;
  materials: any[];
  formulation: any;
  formulationVersions: any[];
  components: any[];
  batches: any[];
}

export default function FormulationRdWorkspaceClient({
  project,
  initialStep = 1,
  plantData: initialPlantData,
  allPlants = [],
  verifiedPlantDetails,
  verifiedPhytochemicals: initialVerifiedPhytochemicals = [],
  initialStudyCompoundNames = [],
  scientificLiterature = [],
  linkedLiterature = [],
  initialLinkedLiteratureIds = [],
  productSelection: initialProductSelection,
  materials: initialMaterials = [],
  formulation: initialFormulation,
  formulationVersions: initialVersions = [],
  components: initialComponents = [],
  batches: initialBatches = [],
}: Props) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number>(initialStep || 1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [pendingDeleteMaterial, setPendingDeleteMaterial] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 6) {
      setActiveStep(initialStep);
    }
  }, [initialStep]);

  // ---------------------------------------------------------------------------
  // STEP 1: PLANT INFORMATION & SPECIMEN IDENTITY
  // ---------------------------------------------------------------------------
  const [currentProject, setCurrentProject] = useState({
    ...project,
  });

  const [verifiedPlant, setVerifiedPlant] = useState<PlantRecord>(
    verifiedPlantDetails || {
      id: project.plantId || "lagundi",
      slug: project.plantId || "lagundi",
      commonName: project.plantName,
      scientificName: project.plantScientificName || "Unassigned",
      family: initialPlantData?.family || "Not documented",
      localNames: initialPlantData?.localNames || "Not documented",
      category: "Medicinal Flora",
      isPitahc: true,
      documentedParts: ["Leaves"],
      imageUrl: "/images/plants/lagundi.jpg",
      botanicalSynonyms: "Not documented",
      traditionalUses: initialPlantData?.traditionalUses || "Not documented",
      traditionalPreparations: initialPlantData?.ethnobotanicalNotes || "Not documented",
      safetyNotes: "Not documented",
      pharmacopeiaStatus: "Philippine Herbal Pharmacopeia",
      suggestedAuthenticationMethod: "Morphological verification & stereomicroscopy",
    }
  );

  const [plantData, setPlantData] = useState(
    initialPlantData || {
      commonName: project.plantName,
      scientificName: project.plantScientificName || "",
      family: verifiedPlantDetails?.family || "Not documented",
      localNames: verifiedPlantDetails?.localNames || "Not documented",
      partsStudied: verifiedPlantDetails?.documentedParts
        ? verifiedPlantDetails.documentedParts.join(", ")
        : "Leaves",
      specimenSource: "",
      voucherSpecimenNumber: "",
      authenticationStatus: "NOT_DOCUMENTED", // Default: NOT_DOCUMENTED
      collectionLocation: "",
      collectionDate: "",
      authenticatedBy: "",
      authenticationMethod:
        verifiedPlantDetails?.suggestedAuthenticationMethod ||
        "Morphological verification & stereomicroscopic examination",
      traditionalUses: verifiedPlantDetails?.traditionalUses || "Not documented",
      ethnobotanicalNotes: verifiedPlantDetails?.traditionalPreparations || "Not documented",
    }
  );

  const [verifiedCompounds, setVerifiedCompounds] = useState<PhytochemicalItem[]>(
    initialVerifiedPhytochemicals || []
  );
  const [studyCompoundNames, setStudyCompoundNames] = useState<string[]>(
    initialStudyCompoundNames || []
  );
  const [literatureList, setLiteratureList] = useState<LiteratureItem[]>(
    scientificLiterature || []
  );
  const [linkedLiteratureIds, setLinkedLiteratureIds] = useState<string[]>(
    initialLinkedLiteratureIds || []
  );

  // Switch plant species from searchable dropdown
  const handleSelectPlant = async (plant: PlantRecord) => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/plants/search?id=${plant.id}&projectId=${project.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load plant details");
      }

      const pData = data.plant;
      setVerifiedPlant(pData);
      setVerifiedCompounds(data.phytochemicals || []);
      setLiteratureList(data.literature || []);
      if (data.studyCompoundNames) setStudyCompoundNames(data.studyCompoundNames);
      if (data.linkedLiteratureIds) setLinkedLiteratureIds(data.linkedLiteratureIds);

      setCurrentProject((prev) => ({
        ...prev,
        plantId: pData.id,
        plantName: pData.commonName,
        plantScientificName: pData.scientificName,
      }));

      // Update botanical identity while strictly preserving laboratory specimen records
      setPlantData((prev: any) => ({
        ...prev,
        commonName: pData.commonName,
        scientificName: pData.scientificName,
        family: pData.family,
        localNames: pData.localNames,
        traditionalUses: pData.traditionalUses || prev.traditionalUses,
        ethnobotanicalNotes: pData.traditionalPreparations || prev.ethnobotanicalNotes,
        partsStudied: prev.partsStudied || (pData.documentedParts ? pData.documentedParts.join(", ") : "Leaves"),
      }));

      // Persist to backend
      await fetch(`/api/researcher/projects/${project.id}/plant-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-plant",
          plantId: pData.id,
          commonName: pData.commonName,
          scientificName: pData.scientificName,
        }),
      });

      setMessage({
        text: `Switched plant to ${pData.commonName} (${pData.scientificName}). Botanical taxonomy and compounds updated.`,
        type: "success",
      });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to switch plant", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStudyCompound = async (comp: PhytochemicalItem) => {
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/plant-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-study-compound",
          compound: comp,
          plantName: verifiedPlant?.commonName || currentProject.plantName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update compound");

      setStudyCompoundNames(data.studyCompoundNames || []);
      setMessage({ text: data.message, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update study compound", type: "error" });
    }
  };

  const handleToggleLiteratureReference = async (lit: LiteratureItem) => {
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/plant-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-literature-reference",
          reference: lit,
          plantName: verifiedPlant?.commonName || currentProject.plantName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update reference");

      setLinkedLiteratureIds(data.linkedLiteratureIds || []);
      setMessage({ text: data.message, type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update literature link", type: "error" });
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2: PRODUCT SELECTION & TARGET SPECIFICATIONS
  // ---------------------------------------------------------------------------
  const [productSelection, setProductSelection] = useState(() => {
    const defaults = {
      productType: "Herbal Formulation",
      deliveryFormat: "Topical Hydrogel",
      targetIndications:
        "Topical anti-inflammatory, localized muscular comfort and barrier protection",
      intendedPopulation: "Adults aged 18-65 without open dermatological lesions",
      packagingType: "Airless pump dispenser, UV-protected 50g container",
      rationale:
        "Hydrogel vehicle maximizes transdermal hydration, bio-adhesion, and active secondary metabolite partitioning without greasy residue.",
    };
    if (!initialProductSelection) return defaults;
    return {
      ...defaults,
      ...initialProductSelection,
      // DB nulls must not reach controlled inputs/textareas
      productType: initialProductSelection.productType ?? defaults.productType,
      deliveryFormat: initialProductSelection.deliveryFormat ?? defaults.deliveryFormat,
      targetIndications:
        initialProductSelection.targetIndications ?? defaults.targetIndications,
      intendedPopulation:
        initialProductSelection.intendedPopulation ?? defaults.intendedPopulation,
      packagingType: initialProductSelection.packagingType ?? defaults.packagingType,
      rationale: initialProductSelection.rationale ?? "",
    };
  });

  // ---------------------------------------------------------------------------
  // STEP 3: STANDARDIZED EXTRACTION PARAMETERS
  // ---------------------------------------------------------------------------
  const [extraction, setExtraction] = useState({
    extractionMethod:
      initialPlantData?.extractionMethod || "Ultrasonic-Assisted Hydroethanolic Extraction (UAE)",
    plantMaterialMass: initialPlantData?.plantMaterialMass || "100.0 g (Dry powdered leaves)",
    extractionSolvent:
      initialPlantData?.extractionSolvent || "70% Ethanol / 30% USP Deionized Water",
    solventConcentration: initialPlantData?.solventConcentration || "70% v/v",
    solventRatio: initialPlantData?.solventRatio || "1:10 (w/v) [100 g in 1000 mL]",
    extractionTemperature: initialPlantData?.extractionTemperature || "45°C",
    extractionDuration: initialPlantData?.extractionDuration || "45 minutes",
    extractYieldPercent: initialPlantData?.extractYieldPercent || "14.2% w/w crude dry yield",
    extractFractionName:
      initialPlantData?.extractFractionName ||
      "Standardized Polyphenolic / Terpenoid Hydroethanolic Fraction",
    extractionReferences:
      initialPlantData?.extractionReferences ??
      "Philippine Herbal Pharmacopeia (2024); WHO Guidelines on Good Agricultural and Collection Practices (GACP).",
    recoveredDryMass: initialPlantData?.recoveredDryMass ?? "",
  });

  // Extraction calculation helpers
  const calculatedSolventVolume = useMemo(() => {
    const massMatch = extraction.plantMaterialMass.match(/(\d+(\.\d+)?)/);
    const massNum = massMatch ? parseFloat(massMatch[1]) : 100;
    const ratioMatch = extraction.solventRatio.match(/1:(\d+)/);
    const ratioNum = ratioMatch ? parseFloat(ratioMatch[1]) : 10;
    return `${(massNum * ratioNum).toFixed(0)} mL`;
  }, [extraction.plantMaterialMass, extraction.solventRatio]);

  // ---------------------------------------------------------------------------
  // STEP 4: MATERIALS & REAGENTS INVENTORY
  // ---------------------------------------------------------------------------
  const [materials, setMaterials] = useState<any[]>(initialMaterials);

  // ---------------------------------------------------------------------------
  // STEP 5: FORMULATION DEVELOPMENT & COMPOSITION MATRIX
  // ---------------------------------------------------------------------------
  const [formulationName, setFormulationName] = useState(
    initialFormulation?.formulationName ||
      `${project.plantName} ${initialProductSelection?.deliveryFormat || "Topical Hydrogel"}`
  );
  const [dosageFormType, setDosageFormType] = useState(
    initialFormulation?.dosageFormType ||
      initialProductSelection?.deliveryFormat ||
      "Topical Hydrogel"
  );
  const [formulationCode, setFormulationCode] = useState(
    initialFormulation?.formulationCode || "FRM-TOP-001"
  );
  const [totalTargetMassVolume, setTotalTargetMassVolume] = useState(
    initialFormulation?.totalTargetMassVolume || "100 g"
  );
  const [targetBatchSize, setTargetBatchSize] = useState(
    initialFormulation?.targetBatchSize || "500 g"
  );
  const [formulationReferences, setFormulationReferences] = useState(
    initialFormulation?.formulationReferences ||
      "USP <1151> Pharmaceutical Dosage Forms; Handbook of Pharmaceutical Excipients (9th Ed)."
  );
  const [formulationNotes, setFormulationNotes] = useState(
    initialFormulation?.notes ||
      "Preliminary compounding matrix. Neutralization with TEA required to achieve physiological dermal pH (5.5)."
  );
  const [versionNumber, setVersionNumber] = useState(
    initialFormulation?.currentVersionNumber || "v1.0"
  );

  // No hardcoded recipe seed — composition comes from saved rows, templates, AI Assist,
  // or explicit "Add from My Ingredients" (never auto-inserts testing references).
  const [components, setComponents] = useState<any[]>(
    initialComponents.length > 0
      ? initialComponents.map((c: any) => ({
          ...c,
          ingredientName: c.ingredientName || c.componentName || "Component",
          roleOrFunction: c.roleOrFunction || c.roleInFormulation || "Compounding Agent",
        }))
      : []
  );

  // Formulation total concentration sum
  const totalConcentrationSum = useMemo(() => {
    return components.reduce((acc, c) => acc + (parseFloat(c.concentrationValue) || 0), 0);
  }, [components]);

  const formulationState: FormulationState = useMemo(() => ({
    formulationName,
    formulationCode,
    dosageFormType,
    totalTargetMassVolume,
    targetBatchSize,
    formulationReferences,
    notes: formulationNotes,
    versionNumber,
    components,
  }), [
    formulationName,
    formulationCode,
    dosageFormType,
    totalTargetMassVolume,
    targetBatchSize,
    formulationReferences,
    formulationNotes,
    versionNumber,
    components,
  ]);

  const handleFormulationChange = (updated: FormulationState) => {
    if (updated.formulationName !== undefined) setFormulationName(updated.formulationName);
    if (updated.formulationCode !== undefined) setFormulationCode(updated.formulationCode);
    if (updated.dosageFormType !== undefined) setDosageFormType(updated.dosageFormType);
    if (updated.totalTargetMassVolume !== undefined) setTotalTargetMassVolume(updated.totalTargetMassVolume);
    if (updated.targetBatchSize !== undefined) setTargetBatchSize(updated.targetBatchSize);
    if (updated.formulationReferences !== undefined) setFormulationReferences(updated.formulationReferences);
    if (updated.notes !== undefined) setFormulationNotes(updated.notes);
    if (updated.versionNumber !== undefined) setVersionNumber(updated.versionNumber);
    if (updated.components !== undefined) setComponents(updated.components);
  };

  // ---------------------------------------------------------------------------
  // STEP 6: BATCH ANALYSIS & CONCENTRATION SERIES
  // ---------------------------------------------------------------------------
  const [batches, setBatches] = useState<any[]>(initialBatches);

  const STEPS = [
    { number: 1, title: "Plant Information", icon: Sprout },
    { number: 2, title: "Product Selection", icon: Package },
    { number: 3, title: "Extraction", icon: Beaker },
    { number: 4, title: "Ingredients", icon: Boxes },
    { number: 5, title: "Formulation Development", icon: FlaskConical },
    { number: 6, title: "Batch Analysis", icon: Activity },
  ];

  // ---------------------------------------------------------------------------
  // PERSISTENCE HANDLERS
  // ---------------------------------------------------------------------------
  const handleSaveStep1 = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/plant-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          plantId: verifiedPlant?.id || currentProject.plantId,
          commonName: verifiedPlant?.commonName || currentProject.plantName,
          scientificName: verifiedPlant?.scientificName || currentProject.plantScientificName,
          family: plantData.family || verifiedPlant?.family,
          localNames: plantData.localNames || verifiedPlant?.localNames,
          partsStudied: plantData.partsStudied,
          voucherSpecimenNumber: plantData.voucherSpecimenNumber,
          specimenSource: plantData.specimenSource,
          collectionLocation: plantData.collectionLocation,
          collectionDate: plantData.collectionDate,
          authenticationMethod: plantData.authenticationMethod,
          authenticatedBy: plantData.authenticatedBy,
          traditionalUses: plantData.traditionalUses || verifiedPlant?.traditionalUses,
          ethnobotanicalNotes: plantData.ethnobotanicalNotes || verifiedPlant?.traditionalPreparations,
          authenticationStatus: plantData.authenticationStatus || "NOT_DOCUMENTED",
        }),
      });
      if (!res.ok) throw new Error("Failed to save plant information");
      setMessage({ text: "Botanical taxonomy and experimental plant parts saved successfully!", type: "success" });
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStep2 = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/product-selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productSelection),
      });
      if (!res.ok) throw new Error("Failed to save product selection");
      setMessage({ text: "Product specifications saved!", type: "success" });
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStep3 = async (): Promise<boolean> => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/plant-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...plantData,
          extractionMethod: extraction.extractionMethod,
          plantMaterialMass: extraction.plantMaterialMass,
          extractionSolvent: extraction.extractionSolvent,
          solventConcentration: extraction.solventConcentration,
          solventRatio: extraction.solventRatio,
          extractionTemperature: extraction.extractionTemperature,
          extractionDuration: extraction.extractionDuration,
          extractYieldPercent: extraction.extractYieldPercent,
          extractFractionName: extraction.extractFractionName,
          // Preserve historical references without requiring UI entry on this step.
          extractionReferences: extraction.extractionReferences,
          // Client measurement used for yield; persisted via extractYieldPercent.
          recoveredDryMass: extraction.recoveredDryMass || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to save extraction parameters");
      setMessage({ text: "Standardized extraction parameters saved!", type: "success" });
      return true;
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save", type: "error" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMaterial = async (
    materialPayload: any,
    editingId: number | null = null
  ): Promise<boolean> => {
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = editingId ? { ...materialPayload, id: editingId } : materialPayload;
      const res = await fetch(`/api/researcher/projects/${project.id}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save material");

      if (editingId) {
        setMaterials(materials.map((m) => (m.id === editingId ? { ...materialPayload, id: editingId } : m)));
      } else {
        setMaterials([...materials, { ...materialPayload, id: data.id }]);
      }
      setMessage({
        text: editingId ? "Ingredient updated." : "Ingredient added to My Ingredients.",
        type: "success",
      });
      return true;
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save ingredient", type: "error" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMaterial = async (matId: number): Promise<boolean> => {
    const mat = materials.find((m) => m.id === matId);
    setPendingDeleteMaterial({
      id: matId,
      name: mat?.materialName || "this ingredient",
    });
    return false;
  };

  const confirmDeleteMaterial = async () => {
    if (!pendingDeleteMaterial) return;
    const matId = pendingDeleteMaterial.id;
    setPendingDeleteMaterial(null);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/materials?materialId=${matId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove ingredient");
      }
      setMaterials(materials.filter((m) => m.id !== matId));
      setMessage({ text: "Ingredient removed from My Ingredients.", type: "success" });
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to remove ingredient.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshMaterials = async () => {
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/materials`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.materials)) {
          setMaterials(data.materials);
        }
      }
    } catch (err) {
      console.error("Failed to refresh materials:", err);
    }
  };

  const handleSaveStep5 = async (): Promise<boolean> => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/formulation-matrix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formulationName,
          formulationCode,
          dosageFormType,
          totalTargetMassVolume,
          targetBatchSize,
          formulationReferences,
          notes: formulationNotes,
          versionNumber,
          components,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save formulation");
      setMessage({ text: "Formulation recipe saved!", type: "success" });
      return true;
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save formulation", type: "error" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Component Matrix Table operations
  const handleUpdateComponent = (index: number, field: string, value: any) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const handleAddComponentRow = () => {
    setComponents([
      ...components,
      {
        id: Date.now(),
        componentType: "EXCIPIENT",
        ingredientName: "New Compounding Excipient",
        concentrationValue: 1.0,
        concentrationUnit: "% w/w",
        minConcentration: 0.1,
        maxConcentration: 5.0,
        roleOrFunction: "Stabilizer / Preservative",
        notes: "",
      },
    ]);
  };

  const handleRemoveComponentRow = (index: number) => {
    setComponents(components.filter((_, idx) => idx !== index));
  };

  const handleSaveStep6 = async (): Promise<boolean> => {
    setIsSaving(true);
    setMessage(null);
    try {
      setMessage({ text: "Batch analysis & quality control records saved!", type: "success" });
      return true;
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save batch analysis", type: "error" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveActiveStep = async (): Promise<boolean | void> => {
    switch (activeStep) {
      case 1:
        await handleSaveStep1();
        return true;
      case 2:
        await handleSaveStep2();
        return true;
      case 3:
        return await handleSaveStep3();
      case 4:
        setMessage({ text: "Ingredients saved for formulation.", type: "success" });
        return true;
      case 5:
        return await handleSaveStep5();
      case 6:
        return await handleSaveStep6();
      default:
        return true;
    }
  };

  return (
    <div className="w-full max-w-none space-y-4 pb-32 text-slate-800">
      <ResearchSectionWorkspaceHeader
        projectId={project.id}
        sectionLabel="Formulation R&D"
        steps={STEPS}
        activeStep={activeStep}
        onStepChange={setActiveStep}
        statusLabel={isSaving ? "Saving..." : message?.type === "success" ? "Saved" : "Draft"}
        statusVariant={isSaving ? "saving" : message?.type === "success" ? "saved" : "draft"}
        proceedSlot={
          activeStep === 6 ? (
            <Link
              href={`/researcher/projects/${project.id}/in-silico`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-[#091a13] shadow-sm transition hover:bg-emerald-300"
            >
              Proceed to Section 2
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null
        }
      />

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

      <AnimatePresence>
        {pendingDeleteMaterial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0f2c20]/45 p-4 backdrop-blur-[2px]"
            onClick={() => !isSaving && setPendingDeleteMaterial(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-ingredient-title"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="delete-ingredient-title"
                    className="text-base font-bold tracking-tight text-[#0f2c20]"
                  >
                    Remove ingredient?
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#52645d]">
                    Remove{" "}
                    <span className="font-semibold text-[#0f2c20]">
                      {pendingDeleteMaterial.name}
                    </span>{" "}
                    from My Ingredients? This cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setPendingDeleteMaterial(null)}
                  className="rounded-lg p-1 text-[#8aa094] transition hover:bg-[#f4f8f5] hover:text-[#52645d]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setPendingDeleteMaterial(null)}
                  className="rounded-xl border border-[#d7e4dc] bg-white px-3.5 py-2 text-sm font-semibold text-[#52645d] transition hover:bg-[#f7faf8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={confirmDeleteMaterial}
                  className="rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                >
                  {isSaving ? "Removing…" : "Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ResearcherStepRevisionBanner
        projectId={project.id}
        sectionKey="section1"
        sectionTitle="Section 1: Formulation R&D"
        stepNumber={activeStep}
        stepTitle={STEPS[activeStep - 1]?.title || `Step ${activeStep}`}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeStep === 1 && (
            <BotanicalStep1Section
              project={currentProject}
              allPlants={allPlants}
              verifiedPlant={verifiedPlant}
              plantData={plantData}
              onUpdatePlantData={setPlantData}
              verifiedPhytochemicals={verifiedCompounds}
              studyCompoundNames={studyCompoundNames}
              onToggleStudyCompound={handleToggleStudyCompound}
              scientificLiterature={literatureList}
              linkedLiteratureIds={linkedLiteratureIds}
              onToggleLiteratureReference={handleToggleLiteratureReference}
              isSaving={isSaving}
              onSave={handleSaveStep1}
              onSelectPlant={handleSelectPlant}
            />
          )}

          {activeStep === 2 && (
            <ProductSelectionStep2Section
              project={currentProject}
              plantData={plantData}
              verifiedPlant={verifiedPlant}
              linkedLiterature={literatureList}
              productSelection={productSelection}
              onChange={setProductSelection}
              onSave={handleSaveStep2}
              isSaving={isSaving}
            />
          )}

          {activeStep === 3 && (
            <ExtractionStep3Section
              project={currentProject}
              productSelection={productSelection}
              extraction={extraction}
              onChange={setExtraction}
              onSave={handleSaveStep3}
              isSaving={isSaving}
              scientificLiterature={scientificLiterature}
              linkedLiterature={linkedLiterature}
              onToggleLiteratureReference={handleToggleLiteratureReference}
            />
          )}

          {activeStep === 4 && (
            <MaterialsStep4Section
              project={currentProject}
              productSelection={productSelection}
              extraction={extraction}
              verifiedPhytochemicals={verifiedCompounds}
              materials={materials}
              onSaveMaterial={handleSaveMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onRefreshMaterials={handleRefreshMaterials}
              isSaving={isSaving}
            />
          )}

          {activeStep === 5 && (
            <FormulationStep5Section
              project={currentProject}
              productSelection={productSelection}
              extraction={extraction}
              materials={materials}
              scientificLiterature={scientificLiterature}
              linkedLiterature={linkedLiterature}
              formulation={formulationState}
              onChange={handleFormulationChange}
              onSave={handleSaveStep5}
              onRefreshMaterials={handleRefreshMaterials}
              isSaving={isSaving}
            />
          )}

          {activeStep === 6 && (
            <BatchAnalysisStep6Section
              projectId={project.id}
              plantName={project.plantName}
              plantScientificName={project.plantScientificName}
              formulationCode={formulationCode || "EXP-GEL"}
              formulationName={formulationName}
              dosageFormType={dosageFormType || productSelection.deliveryFormat || "Topical Hydrogel"}
              targetBatchSize={targetBatchSize}
              versionNumber={versionNumber}
              components={components}
              materials={materials}
              batches={batches}
              onBatchesChange={setBatches}
              literatureReferences={scientificLiterature}
              isSaving={isSaving}
              onSaveDraft={handleSaveActiveStep}
              saveStatus={
                isSaving
                  ? "saving"
                  : message?.type === "success"
                    ? "saved"
                    : message?.type === "error"
                      ? "error"
                      : "idle"
              }
              onProceedToInSilico={() => router.push(`/researcher/projects/${project.id}/in-silico`)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <ResearchStepFooterNav
        projectId={project.id}
        sectionNumber={1}
        sectionTitle="Section 1: Formulation R&D"
        steps={STEPS}
        activeStep={activeStep}
        onStepChange={setActiveStep}
        onSaveDraft={handleSaveActiveStep}
        isSaving={isSaving}
        saveStatus={
          isSaving
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
