"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Sprout,
  Package,
  Beaker,
  Boxes,
  FlaskConical,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  AlertTriangle,
  Info,
  BookOpen,
  Scale,
  Calculator,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Dna,
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
  const [productSelection, setProductSelection] = useState(
    initialProductSelection || {
      productType: "Herbal Formulation",
      deliveryFormat: "Topical Hydrogel",
      targetIndications: "Topical anti-inflammatory, localized muscular comfort and barrier protection",
      intendedPopulation: "Adults aged 18-65 without open dermatological lesions",
      packagingType: "Airless pump dispenser, UV-protected 50g container",
      rationale:
        "Hydrogel vehicle maximizes transdermal hydration, bio-adhesion, and active secondary metabolite partitioning without greasy residue.",
    }
  );

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
      initialPlantData?.extractionReferences ||
      "Philippine Herbal Pharmacopeia (2024); WHO Guidelines on Good Agricultural and Collection Practices (GACP).",
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
    initialFormulation?.formulationName || `${project.plantName} 5% Topical Comfort Gel`
  );
  const [dosageFormType, setDosageFormType] = useState(
    initialFormulation?.dosageFormType || "Topical Hydrogel"
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

  const [components, setComponents] = useState<any[]>(
    initialComponents.length > 0
      ? initialComponents.map((c: any) => ({
          ...c,
          ingredientName: c.ingredientName || c.componentName || "Component",
          roleOrFunction: c.roleOrFunction || c.roleInFormulation || "Compounding Agent",
        }))
      : [
          {
            id: 1,
            componentType: "ACTIVE_EXTRACT",
            ingredientName: `${project.plantName} Hydroethanolic Extract`,
            concentrationValue: 5.0,
            concentrationUnit: "% w/w",
            minConcentration: 3.0,
            maxConcentration: 10.0,
            roleOrFunction: "Botanical Active Constituent",
            notes: "Standardized active crude extract",
          },
          {
            id: 2,
            componentType: "EXCIPIENT",
            ingredientName: "Carbomer 940",
            concentrationValue: 1.0,
            concentrationUnit: "% w/w",
            minConcentration: 0.5,
            maxConcentration: 2.0,
            roleOrFunction: "Gelling Agent & Aqueous Matrix Builder",
            notes: "USP Grade synthetic polyacrylic polymer",
          },
          {
            id: 3,
            componentType: "EXCIPIENT",
            ingredientName: "Triethanolamine (TEA)",
            concentrationValue: 1.0,
            concentrationUnit: "% w/w",
            minConcentration: 0.5,
            maxConcentration: 1.5,
            roleOrFunction: "Neutralizing Agent & pH Adjuster",
            notes: "Neutralizes polymer carbomers to pH 5.5-6.5",
            isPhAdjuster: true,
          },
          {
            id: 4,
            componentType: "EXCIPIENT",
            ingredientName: "Glycerin",
            concentrationValue: 5.0,
            concentrationUnit: "% w/w",
            minConcentration: 2.0,
            maxConcentration: 10.0,
            roleOrFunction: "Humectant & Emollient",
            notes: "Prevents gel drying out and provides smooth spreadability",
          },
          {
            id: 5,
            componentType: "VEHICLE",
            ingredientName: "Purified Water (USP)",
            concentrationValue: 88.0,
            concentrationUnit: "% w/w",
            minConcentration: 75.0,
            maxConcentration: 95.0,
            roleOrFunction: "Aqueous continuous vehicle qs to 100%",
            notes: "Freshly deionized, microbial-tested",
            isVehicle: true,
          },
        ]
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
    { number: 4, title: "Materials", icon: Boxes },
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
          extractionReferences: extraction.extractionReferences,
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
      setMessage({ text: "Material inventory record saved successfully!", type: "success" });
      return true;
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save material", type: "error" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMaterial = async (matId: number): Promise<boolean> => {
    if (!confirm("Are you sure you want to remove this material from inventory?")) return false;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/materials?materialId=${matId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete material");
      setMaterials(materials.filter((m) => m.id !== matId));
      setMessage({ text: "Material removed from inventory.", type: "success" });
      return true;
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to delete material.", type: "error" });
      return false;
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
      setMessage({ text: "Formulation composition matrix saved!", type: "success" });
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
        setMessage({ text: "Materials inventory verified for formulation compounding.", type: "success" });
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
    <div className="min-h-screen bg-slate-50/50 pb-32">
      {/* 1. TOP HEADER & COMPACT STEP NAVIGATION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Link
                  href={`/researcher/projects/${project.id}`}
                  className="text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Workspace Hub
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  Section 1 / Step 0{activeStep} of 06
                </span>
                <span className="text-slate-300">•</span>
                {/* Small Saved / Unsaved indicator */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  {isSaving ? (
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
                      Draft
                    </span>
                  )}
                </div>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                {STEPS[activeStep - 1].title}
              </h1>

              {/* Compact 6-segment progress bar */}
              <div className="flex items-center gap-1.5 pt-0.5 max-w-xs">
                {STEPS.map((step) => {
                  const isFilled = step.number <= activeStep;
                  return (
                    <div
                      key={step.number}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        isFilled ? "bg-emerald-600" : "bg-slate-200"
                      }`}
                      title={`Step ${step.number}: ${step.title}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/researcher/projects/${project.id}/in-silico`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <span>Proceed to Section 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 6 Step Switcher */}
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCurrent = activeStep === step.number;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActiveStep(step.number)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-emerald-700 text-white font-semibold shadow-xs"
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

      {/* 2. MAIN BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-32">
        {/* Alerts / Feedback Banner */}
        {message && (
          <div
            className={`mb-6 p-3.5 rounded-xl text-xs font-medium flex items-center justify-between ${
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
          sectionKey="section1"
          sectionTitle="Section 1: Formulation R&D"
          stepNumber={activeStep}
          stepTitle={STEPS[activeStep - 1]?.title || `Step ${activeStep}`}
        />

        {/* ================================================================ */}
        {/* STEP 1: PLANT INFORMATION, TAXONOMY & SPECIMEN AUTHENTICATION    */}
        {/* ================================================================ */}
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

        {/* ================================================================ */}
        {/* STEP 2: PRODUCT SELECTION & TARGET SPECIFICATIONS                 */}
        {/* ================================================================ */}
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

        {/* ================================================================ */}
        {/* STEP 3: STANDARDIZED EXTRACTION METHODOLOGY & YIELD CALCULATIONS */}
        {/* ================================================================ */}
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

        {/* ================================================================ */}
        {/* STEP 4: SMART MATERIALS INVENTORY                                */}
        {/* ================================================================ */}
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

        {/* ================================================================ */}
        {/* STEP 5: SMART FORMULATION BUILDER                                */}
        {/* ================================================================ */}
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

        {/* ================================================================ */}
        {/* STEP 6: BATCH ANALYSIS (SMART GENERATOR & QUALITY CONTROL)       */}
        {/* ================================================================ */}
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
      </div>

      {/* Centralized Sticky Footer Step Navigation */}
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
