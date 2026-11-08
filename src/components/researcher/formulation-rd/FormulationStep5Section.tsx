"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Search,
  Check,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Info,
  Package,
  Layers,
  Sparkles,
  Scale,
  ShieldCheck,
  X,
  BookOpen,
  Send,
  Loader2,
  Bot,
  User,
  Sliders,
  CheckCircle2,
  Calculator,
  CheckSquare,
  Square,
  Wand2,
  Clock,
  ArrowDown,
  ShieldAlert,
  FileCheck2,
  ChevronUp,
  RefreshCw,
  Leaf,
  ChevronRight,
  Beaker,
} from "lucide-react";
import {
  FORMULATION_TEMPLATES,
  FormulationTemplate,
  matchFormulationTemplate,
  generateFormulationCode,
} from "@/lib/formulation-templates";
import { MaterialItem } from "./MaterialsStep4Section";
import { LiteratureItem } from "./BotanicalStep1Section";
import {
  FormulationProposal,
  FormulationRecommendedIngredient,
  findInventoryMatch,
  normalizeMaterialName,
} from "@/lib/formulation-ai-service";

export interface FormulationComponentItem {
  id: string | number;
  componentType: "ACTIVE_EXTRACT" | "EXCIPIENT" | "VEHICLE" | "PRESERVATIVE" | string;
  ingredientName: string;
  concentrationValue: number;
  concentrationUnit?: string;
  minConcentration?: number;
  maxConcentration?: number;
  roleOrFunction?: string;
  notes?: string;
  gradeOrPurity?: string;
  supplierOrSource?: string;
  lotOrBatchNumber?: string;
  isVehicle?: boolean;
  isPhAdjuster?: boolean;
  materialId?: number;
  inventoryStatus?: string;
  isConcentrationSupported?: boolean;
  sourceReference?: string;
  isAiSuggested?: boolean;
}

export interface FormulationState {
  formulationName: string;
  formulationCode: string;
  dosageFormType: string;
  totalTargetMassVolume: string;
  targetBatchSize: string;
  formulationReferences: string;
  notes: string;
  versionNumber: string;
  components: FormulationComponentItem[];
}

interface Props {
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
  };
  productSelection?: {
    productType?: string;
    deliveryFormat?: string;
    targetIndications?: string;
    intendedPopulation?: string;
  };
  extraction?: {
    extractFractionName?: string;
    extractionMethod?: string;
    extractionSolvent?: string;
    solventConcentration?: string;
  };
  materials?: MaterialItem[];
  scientificLiterature?: LiteratureItem[];
  linkedLiterature?: any[];
  formulation: FormulationState;
  onChange: (updated: FormulationState) => void;
  onSave: () => Promise<boolean | void>;
  onRefreshMaterials?: () => Promise<void>;
  isSaving: boolean;
}

export default function FormulationStep5Section({
  project,
  productSelection,
  extraction,
  materials = [],
  scientificLiterature = [],
  linkedLiterature = [],
  formulation,
  onChange,
  onSave,
  onRefreshMaterials,
  isSaving,
}: Props) {
  // Template Selection & Dropdown State
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const [pendingTemplate, setPendingTemplate] = useState<FormulationTemplate | null>(null);

  // Per-Ingredient Details Modal State
  const [selectedComponentModalIdx, setSelectedComponentModalIdx] = useState<number | null>(null);

  // Add Component Dropdown State
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const addDropdownRef = useRef<HTMLDivElement>(null);

  // AI Formulation Proposal Panel State
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiProposal, setAiProposal] = useState<FormulationProposal | null>(null);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<Set<string>>(new Set());
  const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildFeedback, setBuildFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [highlightedRowNames, setHighlightedRowNames] = useState<Set<string>>(new Set());
  const [addingToInventoryId, setAddingToInventoryId] = useState<string | null>(null);
  const [addedInventorySuccess, setAddedInventorySuccess] = useState<Record<string, boolean>>({});
  const [aiError, setAiError] = useState<string | null>(null);

  const [isDirty, setIsDirty] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setIsAddDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Current matched template
  const currentTemplate = useMemo(() => {
    return matchFormulationTemplate(formulation.dosageFormType || productSelection?.deliveryFormat || "");
  }, [formulation.dosageFormType, productSelection?.deliveryFormat]);

  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) return FORMULATION_TEMPLATES;
    const q = templateSearch.toLowerCase();
    return FORMULATION_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.dosageFormat.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [templateSearch]);

  // Numeric Target Batch Size in grams
  const numericBatchSizeGrams = useMemo(() => {
    const raw = formulation.targetBatchSize || "500";
    const match = raw.match(/(\d+(\.\d+)?)/);
    const num = match ? parseFloat(match[1]) : 500;
    const isKg = raw.toLowerCase().includes("kg");
    return isKg ? num * 1000 : num;
  }, [formulation.targetBatchSize]);

  // Total Concentration Sum
  const totalConcentrationSum = useMemo(() => {
    return formulation.components.reduce(
      (acc, c) => acc + (parseFloat(String(c.concentrationValue)) || 0),
      0
    );
  }, [formulation.components]);

  const isBalanced = useMemo(() => {
    return Math.abs(totalConcentrationSum - 100.0) < 0.05;
  }, [totalConcentrationSum]);

  const isOver100 = totalConcentrationSum > 100.05;
  const isUnder100 = totalConcentrationSum < 99.95;

  // Active Botanical in matrix with 0 concentration
  const unassignedBotanicalWarning = useMemo(() => {
    return formulation.components.find(
      (c) =>
        (c.componentType === "ACTIVE_EXTRACT" || c.componentType === "ACTIVE_BOTANICAL") &&
        (parseFloat(String(c.concentrationValue)) || 0) <= 0
    );
  }, [formulation.components]);

  // Handle generic header field changes
  const handleFieldChange = (field: keyof FormulationState, value: any) => {
    setIsDirty(true);
    onChange({
      ...formulation,
      [field]: value,
    });
  };

  // Component Matrix updates
  const handleUpdateComponent = (index: number, field: keyof FormulationComponentItem, value: any) => {
    setIsDirty(true);
    const updated = [...formulation.components];
    updated[index] = { ...updated[index], [field]: value };
    onChange({
      ...formulation,
      components: updated,
    });
  };

  const handleRemoveComponent = (index: number) => {
    setIsDirty(true);
    const updated = formulation.components.filter((_, idx) => idx !== index);
    onChange({
      ...formulation,
      components: updated,
    });
  };

  // Add Component from Inventory or Preset
  const handleAddComponentFromSource = (item: {
    name: string;
    type: string;
    role: string;
    grade?: string;
    supplier?: string;
    lot?: string;
    materialId?: number;
    suggestedConcentration?: number;
    isVehicle?: boolean;
    inventoryStatus?: string;
  }) => {
    setIsDirty(true);
    setIsAddDropdownOpen(false);

    const newComponent: FormulationComponentItem = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ingredientName: item.name,
      componentType: item.type === "ACTIVE_BOTANICAL" ? "ACTIVE_EXTRACT" : item.type,
      concentrationValue: item.suggestedConcentration || 1.0,
      concentrationUnit: "% w/w",
      minConcentration: item.suggestedConcentration ? Math.max(0.1, Number((item.suggestedConcentration * 0.5).toFixed(1))) : 0.1,
      maxConcentration: item.suggestedConcentration ? Number((item.suggestedConcentration * 2.0).toFixed(1)) : 5.0,
      roleOrFunction: item.role,
      gradeOrPurity: item.grade || "USP / NF",
      supplierOrSource: item.supplier || "",
      lotOrBatchNumber: item.lot || "",
      notes: item.lot ? `Inventory Lot: ${item.lot} (${item.supplier || "Internal Depot"})` : "",
      isVehicle: Boolean(item.isVehicle || (item.role || "").toLowerCase().includes("vehicle")),
      materialId: item.materialId,
      inventoryStatus: item.inventoryStatus,
    };

    onChange({
      ...formulation,
      components: [...formulation.components, newComponent],
    });
  };

  // Balance with Vehicle (q.s. to 100%)
  const handleBalanceWithVehicle = () => {
    const vehicleIdx = formulation.components.findIndex(
      (c) =>
        c.isVehicle ||
        c.componentType === "VEHICLE" ||
        (c.ingredientName || "").toLowerCase().includes("water") ||
        (c.roleOrFunction || "").toLowerCase().includes("vehicle")
    );

    if (vehicleIdx === -1) {
      // Create vehicle row if none exists
      const nonVehicleSum = formulation.components.reduce(
        (acc, c) => acc + (parseFloat(String(c.concentrationValue)) || 0),
        0
      );
      const needed = Number(Math.max(0, 100.0 - nonVehicleSum).toFixed(2));
      const vehicleItem: FormulationComponentItem = {
        id: `vehicle-${Date.now()}`,
        ingredientName: "Purified Water (USP)",
        componentType: "VEHICLE",
        concentrationValue: needed,
        concentrationUnit: "% w/w",
        roleOrFunction: "Aqueous Vehicle (q.s. to 100%)",
        isVehicle: true,
      };

      setIsDirty(true);
      onChange({
        ...formulation,
        components: [...formulation.components, vehicleItem],
      });
      return;
    }

    const nonVehicleSum = formulation.components.reduce((acc, c, idx) => {
      if (idx === vehicleIdx) return acc;
      return acc + (parseFloat(String(c.concentrationValue)) || 0);
    }, 0);

    const neededVehicleConcentration = Number(Math.max(0, 100.0 - nonVehicleSum).toFixed(2));

    const updated = [...formulation.components];
    updated[vehicleIdx] = {
      ...updated[vehicleIdx],
      concentrationValue: neededVehicleConcentration,
      isVehicle: true,
      roleOrFunction: `${(updated[vehicleIdx].roleOrFunction || "Aqueous Vehicle").replace(/\(q\.s\..*?\)/i, "").trim()} (q.s. to 100%)`,
    };

    setIsDirty(true);
    onChange({
      ...formulation,
      components: updated,
    });
  };

  // Apply Template with Confirmation
  const handleSelectTemplate = (template: FormulationTemplate) => {
    if (formulation.components.length > 0) {
      setPendingTemplate(template);
      setIsTemplateDropdownOpen(false);
      return;
    }
    applyTemplate(template);
  };

  const applyTemplate = (template: FormulationTemplate) => {
    setPendingTemplate(null);
    setIsTemplateDropdownOpen(false);
    setIsDirty(true);

    const templateItems = template.components(project.plantName, extraction?.extractFractionName);
    const newComponents: FormulationComponentItem[] = templateItems.map((item, idx) => ({
      id: `tmpl-${Date.now()}-${idx}`,
      ingredientName: item.ingredientName,
      componentType: item.componentType,
      concentrationValue: item.suggestedConcentration,
      concentrationUnit: item.concentrationUnit,
      minConcentration: item.minConcentration,
      maxConcentration: item.maxConcentration,
      roleOrFunction: item.roleOrFunction,
      notes: item.notes,
      isVehicle: item.isVehicle,
    }));

    onChange({
      ...formulation,
      formulationName: `${project.plantName} 5% ${template.name}`,
      dosageFormType: template.dosageFormat,
      formulationCode: generateFormulationCode(template.dosageFormat, formulation.formulationCode),
      targetBatchSize: template.typicalBatchSize,
      components: newComponents,
    });
  };

  // ---------------------------------------------------------------------------
  // AI FORMULATION PROPOSAL HANDLERS
  // ---------------------------------------------------------------------------
  const handleToggleAiPanel = () => {
    const nextState = !isAiPanelOpen;
    setIsAiPanelOpen(nextState);
    if (nextState && !aiProposal) {
      handleFetchAiProposal();
    }
  };

  const handleFetchAiProposal = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/formulation/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dosageFormType: formulation.dosageFormType || productSelection?.deliveryFormat || "Topical Hydrogel",
          targetIndications: productSelection?.targetIndications,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate AI formulation proposal");

      if (data.proposal && Array.isArray(data.proposal.components)) {
        setAiProposal(data.proposal);
        // Default: select all candidate ingredients
        const allIds = new Set<string>(data.proposal.components.map((c: any) => c.id));
        setSelectedIngredientIds(allIds);
      }
    } catch (err: any) {
      setAiError(err.message || "Could not retrieve formulation proposal.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleIngredientSelect = (id: string) => {
    setSelectedIngredientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!aiProposal) return;
    const all = new Set<string>(aiProposal.components.map((c) => c.id));
    setSelectedIngredientIds(all);
  };

  const handleDeselectAll = () => {
    setSelectedIngredientIds(new Set());
  };

  // Quick Add uncataloged recommended ingredient to Step 4 Planned Inventory
  const handleAddToPlannedInventory = async (ing: FormulationRecommendedIngredient) => {
    setAddingToInventoryId(ing.id);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/materials/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materials: [
            {
              materialType: ing.componentType === "ACTIVE_EXTRACT" ? "ACTIVE_BOTANICAL" : ing.componentType,
              materialName: ing.ingredientName,
              gradeOrPurity: "USP / NF / Compendial Grade",
              functionDescription: ing.functionalRole,
              scientificJustification: ing.scientificRationale,
              extractFractionId: ing.extractFractionId || null,
              unit: "g",
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add ingredient to inventory");

      setAddedInventorySuccess((prev) => ({ ...prev, [ing.id]: true }));
      // Refresh project materials
      if (onRefreshMaterials) {
        await onRefreshMaterials();
      }
    } catch (err: any) {
      alert(`Could not add to inventory: ${err.message}`);
    } finally {
      setAddingToInventoryId(null);
    }
  };

  // Match a recommendation to an existing component in the matrix
  const findExistingComponentIndex = (
    ing: FormulationRecommendedIngredient,
    existingList: FormulationComponentItem[]
  ): number => {
    const ingNorm = normalizeMaterialName(ing.ingredientName || ing.componentName);
    const plantNorm = normalizeMaterialName(project.plantName);

    return existingList.findIndex((c) => {
      const cNorm = normalizeMaterialName(c.ingredientName);
      if (cNorm && ingNorm && cNorm === ingNorm) return true;

      // Active extract / botanical match
      if (
        (ing.componentType === "ACTIVE_EXTRACT" || ing.componentType === "ACTIVE_BOTANICAL") &&
        (c.componentType === "ACTIVE_EXTRACT" || c.componentType === "ACTIVE_BOTANICAL")
      ) {
        if (plantNorm && (cNorm.includes(plantNorm) || ingNorm.includes(plantNorm))) return true;
        if (cNorm.includes("extract") || ingNorm.includes("extract")) return true;
      }

      // Synonym match
      if ((cNorm.includes("carbomer") || cNorm.includes("carbopol")) && (ingNorm.includes("carbomer") || ingNorm.includes("carbopol"))) return true;
      if ((cNorm.includes("triethanolamine") || cNorm === "tea") && (ingNorm.includes("triethanolamine") || ingNorm === "tea")) return true;
      if ((cNorm.includes("water") || cNorm.includes("aqua")) && (ingNorm.includes("water") || ingNorm.includes("aqua"))) return true;
      if ((cNorm.includes("glycerin") || cNorm.includes("glycerol")) && (ingNorm.includes("glycerin") || ingNorm.includes("glycerol"))) return true;
      if (cNorm.includes("phenoxyethanol") && ingNorm.includes("phenoxyethanol")) return true;

      return false;
    });
  };

  // Rebalance Vehicle (Purified Water) within a component list
  const rebalanceVehicleInList = (list: FormulationComponentItem[]): FormulationComponentItem[] => {
    const vehicleIdx = list.findIndex(
      (c) =>
        c.isVehicle ||
        c.componentType === "VEHICLE" ||
        (c.ingredientName || "").toLowerCase().includes("water")
    );
    if (vehicleIdx === -1) return list;

    const nonVehicleSum = list.reduce(
      (acc, c, idx) => (idx === vehicleIdx ? acc : acc + (parseFloat(String(c.concentrationValue)) || 0)),
      0
    );
    const vehicleConc = Number(Math.max(0, 100.0 - nonVehicleSum).toFixed(2));
    const nextList = [...list];
    nextList[vehicleIdx] = {
      ...nextList[vehicleIdx],
      concentrationValue: vehicleConc,
      isVehicle: true,
    };
    return nextList;
  };

  // Primary Action: Build / Merge Selected Formulation into Matrix (Non-destructive)
  const handleBuildSelectedFormulation = () => {
    if (!aiProposal) return;
    if (selectedIngredientIds.size === 0) {
      setBuildFeedback({
        type: "error",
        message: "Please select at least one ingredient using checkboxes to build into the formulation matrix.",
      });
      return;
    }

    setIsBuilding(true);
    setBuildFeedback(null);

    try {
      const selectedComponents = aiProposal.components.filter((c) => selectedIngredientIds.has(c.id));
      const currentList = [...formulation.components];
      let addedCount = 0;
      let updatedCount = 0;
      const touchedNames = new Set<string>();

      for (let i = 0; i < selectedComponents.length; i++) {
        const ing = selectedComponents[i];
        const ingName = ing.ingredientName || ing.componentName || "Component";
        touchedNames.add(ingName);

        const liveMatch = findInventoryMatch(ingName, ing.componentType, materials, project.plantName);
        const hasStock = Boolean(liveMatch && liveMatch.quantityAvailable != null && Number(liveMatch.quantityAvailable) > 0);
        const invStatus = hasStock ? "AVAILABLE" : liveMatch ? "PLANNED" : "NOT_IN_INVENTORY";

        const existingIdx = findExistingComponentIndex(ing, currentList);

        if (existingIdx >= 0) {
          // Update existing component metadata while preserving researcher-entered values
          const prev = currentList[existingIdx];
          currentList[existingIdx] = {
            ...prev,
            ingredientName: prev.ingredientName || ingName,
            roleOrFunction: ing.functionalRole || prev.roleOrFunction,
            materialId: liveMatch?.id || prev.materialId,
            inventoryStatus: invStatus || prev.inventoryStatus,
            isVehicle: ing.isVehicle || prev.isVehicle,
            isPhAdjuster: ing.isPhAdjuster || prev.isPhAdjuster,
            notes: prev.notes || ing.scientificRationale || "",
            sourceReference: ing.sourceReference || prev.sourceReference,
            isAiSuggested: true,
          };
          updatedCount++;
        } else {
          // Append new component
          let initConc = 0;
          if (ing.isVehicle) {
            initConc = 0; // will be calculated by rebalanceVehicleInList
          } else if (ing.isConcentrationSupported && ing.suggestedConcentration !== null) {
            initConc = ing.suggestedConcentration;
          } else {
            initConc = 0.0;
          }

          const newComp: FormulationComponentItem = {
            id: `build-${Date.now()}-${i}`,
            ingredientName: ingName,
            componentType: ing.componentType,
            concentrationValue: initConc,
            concentrationUnit: "% w/w",
            minConcentration: initConc > 0 ? Number(Math.max(0.1, initConc * 0.5).toFixed(1)) : 0.1,
            maxConcentration: initConc > 0 ? Number((initConc * 2.0).toFixed(1)) : 5.0,
            roleOrFunction: ing.functionalRole,
            notes: ing.scientificRationale,
            sourceReference: ing.sourceReference,
            isVehicle: ing.isVehicle,
            isPhAdjuster: ing.isPhAdjuster,
            materialId: liveMatch?.id,
            inventoryStatus: invStatus,
            isConcentrationSupported: ing.isConcentrationSupported,
            isAiSuggested: true,
          };
          currentList.push(newComp);
          addedCount++;
        }
      }

      // Auto-balance continuous vehicle (Purified Water)
      const balancedList = rebalanceVehicleInList(currentList);

      setIsDirty(true);
      onChange({
        ...formulation,
        formulationName: aiProposal.formulationName || formulation.formulationName,
        dosageFormType: aiProposal.dosageFormType || formulation.dosageFormType,
        formulationCode: generateFormulationCode(aiProposal.dosageFormType, formulation.formulationCode),
        formulationReferences: Array.isArray(aiProposal.supportingReferences)
          ? aiProposal.supportingReferences.join("; ")
          : (formulation.formulationReferences || ""),
        notes: formulation.notes
          ? `${formulation.notes}\n\n[AI Compatibility]: ${aiProposal.compatibilityConsiderations}`
          : aiProposal.compatibilityConsiderations,
        components: balancedList,
      });

      // Highlight imported rows and trigger feedback
      setHighlightedRowNames(touchedNames);
      setTimeout(() => setHighlightedRowNames(new Set()), 4000);

      const unassignedActives = balancedList.filter(
        (c) =>
          (c.componentType === "ACTIVE_EXTRACT" || c.componentType === "ACTIVE_BOTANICAL") &&
          (parseFloat(String(c.concentrationValue)) || 0) <= 0
      );

      let msg = "";
      if (addedCount > 0 && updatedCount > 0) {
        msg = `${addedCount} ingredient${addedCount > 1 ? "s" : ""} added, ${updatedCount} existing ingredient${updatedCount > 1 ? "s" : ""} updated in the composition matrix.`;
      } else if (addedCount > 0) {
        msg = `${addedCount} ingredient${addedCount > 1 ? "s" : ""} successfully added to the composition matrix.`;
      } else {
        msg = `All ${updatedCount} selected ingredient${updatedCount > 1 ? "s are" : " is"} already in the composition matrix. Existing concentrations preserved.`;
      }

      if (unassignedActives.length > 0) {
        msg += " Complete the required active botanical concentrations.";
      }

      setBuildFeedback({
        type: "success",
        message: msg,
      });

      // Smooth scroll to composition matrix
      setTimeout(() => {
        const el = document.getElementById("composition-matrix");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err: any) {
      setBuildFeedback({
        type: "error",
        message: `Failed to build formulation: ${err.message}`,
      });
    } finally {
      setIsBuilding(false);
    }
  };

  // Secondary Action: Replace existing matrix with selected AI proposal (Destructive with confirmation)
  const executeReplaceMatrix = () => {
    if (!aiProposal) return;
    setIsConfirmingReplace(false);
    setIsBuilding(true);

    try {
      const selectedComponents = aiProposal.components.filter((c) => selectedIngredientIds.has(c.id));
      const touchedNames = new Set<string>();

      const replacedList: FormulationComponentItem[] = selectedComponents.map((ing, idx) => {
        const ingName = ing.ingredientName || ing.componentName || "Component";
        touchedNames.add(ingName);
        const liveMatch = findInventoryMatch(ingName, ing.componentType, materials, project.plantName);
        const hasStock = Boolean(liveMatch && liveMatch.quantityAvailable != null && Number(liveMatch.quantityAvailable) > 0);
        const invStatus = hasStock ? "AVAILABLE" : liveMatch ? "PLANNED" : "NOT_IN_INVENTORY";

        let conc = 0;
        if (!ing.isVehicle && ing.isConcentrationSupported && ing.suggestedConcentration !== null) {
          conc = ing.suggestedConcentration;
        }

        return {
          id: `build-${Date.now()}-${idx}`,
          ingredientName: ingName,
          componentType: ing.componentType,
          concentrationValue: conc,
          concentrationUnit: "% w/w",
          minConcentration: conc > 0 ? Number(Math.max(0.1, conc * 0.5).toFixed(1)) : 0.1,
          maxConcentration: conc > 0 ? Number((conc * 2.0).toFixed(1)) : 5.0,
          roleOrFunction: ing.functionalRole,
          notes: ing.scientificRationale,
          sourceReference: ing.sourceReference,
          isVehicle: ing.isVehicle,
          isPhAdjuster: ing.isPhAdjuster,
          materialId: liveMatch?.id,
          inventoryStatus: invStatus,
          isConcentrationSupported: ing.isConcentrationSupported,
          isAiSuggested: true,
        };
      });

      const balanced = rebalanceVehicleInList(replacedList);

      setIsDirty(true);
      onChange({
        ...formulation,
        formulationName: aiProposal.formulationName || formulation.formulationName,
        dosageFormType: aiProposal.dosageFormType || formulation.dosageFormType,
        formulationCode: generateFormulationCode(aiProposal.dosageFormType, formulation.formulationCode),
        formulationReferences: Array.isArray(aiProposal.supportingReferences)
          ? aiProposal.supportingReferences.join("; ")
          : (formulation.formulationReferences || ""),
        notes: formulation.notes
          ? `${formulation.notes}\n\n[AI Compatibility]: ${aiProposal.compatibilityConsiderations}`
          : aiProposal.compatibilityConsiderations,
        components: balanced,
      });

      setHighlightedRowNames(touchedNames);
      setTimeout(() => setHighlightedRowNames(new Set()), 4000);

      setBuildFeedback({
        type: "success",
        message: `Composition matrix replaced with ${balanced.length} selected ingredients. Please enter active botanical concentration.`,
      });

      setTimeout(() => {
        const el = document.getElementById("composition-matrix");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err: any) {
      setBuildFeedback({
        type: "error",
        message: `Failed to replace matrix: ${err.message}`,
      });
    } finally {
      setIsBuilding(false);
    }
  };

  const easeOut = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="space-y-4">
      {/* Compact status strip — step chrome lives in parent workspace header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d7e4dc]/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex items-center gap-2 text-[11px] text-[#6d7f76]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <FlaskConical className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">Formulation Development</span>
          <span
            className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
              isBalanced
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : isOver100
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {totalConcentrationSum.toFixed(1)}% / 100%
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          {isDirty ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-800">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleAiPanel}
            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition ${
              isAiPanelOpen
                ? "border-emerald-600 bg-emerald-700 text-white"
                : "border-[#d7e4dc] bg-[#f7faf8] text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            {isAiPanelOpen ? "Close AI" : "AI Assist"}
          </button>
        </div>
      </motion.div>

      {/* Project context + how-to */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-300" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Leaf className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#0f2c20]">
                {project.plantName}
                {project.plantScientificName ? (
                  <span className="ml-1.5 text-xs font-normal italic text-[#6d7f76]">
                    ({project.plantScientificName})
                  </span>
                ) : null}
              </h2>
              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                <span className="font-semibold text-[#52645d]">
                  {formulation.dosageFormType || "Topical Hydrogel"}
                </span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                <span className="font-mono text-[#52645d]">
                  {formulation.formulationCode || "FRM-TOP-001"}
                </span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                Master batch {formulation.targetBatchSize || "500 g"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Pick template" },
              { n: "2", label: "Build matrix" },
              { n: "3", label: "Balance to 100%" },
            ].map((step, idx) => (
              <span
                key={step.n}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#52645d]"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-md bg-emerald-600 text-[9px] font-bold text-white">
                  {step.n}
                </span>
                {step.label}
                {idx < 2 && <ChevronRight className="h-3 w-3 text-[#c5d4cb]" />}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 1. Template + identity */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="space-y-3.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                1
              </span>
              <Sliders className="h-3.5 w-3.5 text-emerald-700" />
              Formulation architecture
            </h3>
            <p className="mt-1 text-[11px] text-[#8aa094]">
              Choose a pharmacopeial vehicle template, then refine name, code, and batch size.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#52645d]">
            Compendial Formulation Template
          </label>
          <div className="relative" ref={templateDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2.5 text-left text-xs font-semibold text-[#0f2c20] shadow-sm transition hover:border-emerald-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15 sm:text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {currentTemplate.route}
                </span>
                <span className="truncate">{currentTemplate.name}</span>
                <span className="hidden truncate text-[11px] font-normal text-[#8aa094] sm:inline">
                  — {currentTemplate.description}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#8aa094] transition ${isTemplateDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {isTemplateDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-full left-0 right-0 z-30 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-[#d7e4dc] bg-white shadow-xl"
                >
                  <div className="sticky top-0 border-b border-[#e8f0eb] bg-[#f7faf8] p-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#8aa094]" />
                      <input
                        type="text"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search formulation templates..."
                        className="w-full rounded-xl border border-[#d5e3da] bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-600"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-[#e8f0eb]">
                    {filteredTemplates.map((tmpl, idx) => (
                      <button
                        key={`tmpl-${tmpl.id}-${idx}`}
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl)}
                        className="flex w-full items-start justify-between gap-3 p-3 text-left text-xs transition hover:bg-emerald-50/60"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-[#0f2c20]">{tmpl.name}</span>
                            <span className="rounded-md bg-[#f7faf8] px-1.5 py-0.5 text-[10px] font-medium text-[#6d7f76]">
                              {tmpl.dosageFormat}
                            </span>
                          </div>
                          <p className="line-clamp-1 text-[11px] text-[#8aa094]">{tmpl.description}</p>
                        </div>
                        {currentTemplate.id === tmpl.id && (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#52645d]">Formulation Name</label>
            <input
              type="text"
              value={formulation.formulationName}
              onChange={(e) => handleFieldChange("formulationName", e.target.value)}
              placeholder="e.g. Akapulko 5% Topical Hydrogel"
              className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 text-xs font-semibold text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#52645d]">Code &amp; Version</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={formulation.formulationCode}
                onChange={(e) => handleFieldChange("formulationCode", e.target.value)}
                placeholder="FRM-TOP-001"
                className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-2.5 py-2 font-mono text-xs text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              />
              <span className="inline-flex items-center rounded-xl border border-[#d7e4dc] bg-[#f7faf8] px-2.5 py-2 font-mono text-xs font-bold text-[#52645d]">
                {formulation.versionNumber || "v1.0"}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#52645d]">Dosage Format</label>
            <input
              type="text"
              value={formulation.dosageFormType}
              onChange={(e) => handleFieldChange("dosageFormType", e.target.value)}
              placeholder="Topical Hydrogel"
              className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 text-xs text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#52645d]">Target Batch Size</label>
              <span className="font-mono text-[10px] text-emerald-700">Master Batch</span>
            </div>
            <input
              type="text"
              value={formulation.targetBatchSize}
              onChange={(e) => handleFieldChange("targetBatchSize", e.target.value)}
              placeholder="500 g"
              className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 font-mono text-xs font-bold text-emerald-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>
        </div>
      </motion.section>

      {/* 2. AI Formulation Assist panel */}
      <AnimatePresence>
      {isAiPanelOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: easeOut }}
          className="space-y-3.5 rounded-2xl border border-emerald-200/80 bg-[linear-gradient(180deg,#f0faf5_0%,#ffffff_40%)] p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
        >
          <div className="flex flex-col gap-3 border-b border-emerald-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                      2
                    </span>
                    {aiProposal ? aiProposal.formulationName : "AI Formulation Assist"}
                  </h3>
                  {aiProposal && (
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      {selectedIngredientIds.size} of {aiProposal.components.length} selected
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[#8aa094]">
                  Select recommended ingredients, then build them into the composition matrix below.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleFetchAiProposal}
                disabled={isAiLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 disabled:opacity-50"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isAiLoading ? "animate-spin" : ""}`} />
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => setIsAiPanelOpen(false)}
                className="rounded-xl p-1.5 text-[#8aa094] transition hover:bg-emerald-50 hover:text-[#52645d]"
                title="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isAiLoading && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <p className="text-xs font-semibold text-slate-700">
                Grounding compendial formulation matrix with Stage 1–4 project parameters...
              </p>
              <span className="text-[11px] text-slate-400">
                Cross-referencing plant identity, extraction solvent, dosage form, and current inventory stock.
              </span>
            </div>
          )}

          {/* Error Message */}
          {aiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold">Recommendation Generation Error:</span> {aiError}
              </div>
            </div>
          )}

          {/* Proposal Content Deck */}
          {!isAiLoading && aiProposal && (
            <div className="space-y-3">
              {/* Scientific Rationale Alert Banner */}
              <div className="p-3 rounded-lg bg-white/90 border border-teal-200/80 text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-teal-900 text-[11px] uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                  <span>Scientific Rationale &amp; Evidence Limitations</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {aiProposal.scientificRationale}
                </p>
                <div className="pt-1 text-[10px] text-amber-800 font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>
                    Provisional computational design. Active extract concentrations require bench validation. No therapeutic claims implied.
                  </span>
                </div>
              </div>

              {/* Selection Controls Toolbar */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select All</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    <span>Deselect All</span>
                  </button>
                </div>

                <span className="text-[11px] font-medium text-slate-500">
                  Checkboxes control ingredients imported into Step 5
                </span>
              </div>

              {/* Recommended Ingredients Table */}
              <div className="overflow-x-auto border border-teal-200/60 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-teal-50/50 text-slate-700 border-b border-teal-100 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">Select</th>
                      <th className="py-2 px-3">Ingredient Name &amp; Role</th>
                      <th className="py-2 px-3">Provisional Concentration</th>
                      <th className="py-2 px-3">Inventory Status (Step 4)</th>
                      <th className="py-2 px-3">Scientific Rationale &amp; References</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiProposal.components.map((ing, idx) => {
                      const isSelected = selectedIngredientIds.has(ing.id);
                      const isAdding = addingToInventoryId === ing.id;
                      const hasJustAdded = addedInventorySuccess[ing.id];

                      const liveMatch = findInventoryMatch(
                        ing.ingredientName || ing.componentName,
                        ing.componentType,
                        materials,
                        project.plantName
                      );
                      const hasStock = Boolean(
                        liveMatch &&
                        liveMatch.quantityAvailable != null &&
                        Number(liveMatch.quantityAvailable) > 0
                      );
                      const liveStatus: "AVAILABLE" | "PLANNED" | "NOT_IN_INVENTORY" = hasStock
                        ? "AVAILABLE"
                        : (liveMatch || hasJustAdded)
                        ? "PLANNED"
                        : "NOT_IN_INVENTORY";

                      return (
                        <tr
                          key={`rec-${ing.id || ing.ingredientName || "ing"}-${idx}`}
                          onClick={() => handleToggleIngredientSelect(ing.id)}
                          className={`hover:bg-teal-50/40 transition-colors cursor-pointer ${
                            isSelected ? "bg-teal-50/20" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleIngredientSelect(ing.id)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer w-4 h-4"
                            />
                          </td>

                          {/* Ingredient Name & Role (Clean, without references) */}
                          <td className="py-2.5 px-3">
                            <div className="space-y-1 min-w-[190px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {ing.ingredientName}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    ing.componentType === "ACTIVE_EXTRACT"
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                      : ing.isVehicle
                                      ? "bg-cyan-50 text-cyan-800 border border-cyan-200"
                                      : ing.isPhAdjuster
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : "bg-purple-50 text-purple-800 border border-purple-200"
                                  }`}
                                >
                                  {ing.functionalRole}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Provisional Concentration */}
                          <td className="py-2.5 px-3">
                            {!ing.isConcentrationSupported ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>Requires Researcher Input</span>
                                </span>
                                {ing.isPhAdjuster && (
                                  <span className="text-[10px] text-slate-500 block">q.s. to pH 5.5–6.5</span>
                                )}
                              </div>
                            ) : ing.isVehicle ? (
                              <span className="font-mono font-bold text-cyan-800 text-xs">
                                q.s. to 100% w/w
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  {ing.suggestedConcentration}% w/w
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {ing.suggestedConcentrationRange}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Inventory Match Status (Live Step 4 Sync) */}
                          <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                            {liveStatus === "AVAILABLE" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verified Stock</span>
                              </span>
                            ) : liveStatus === "PLANNED" ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                title={liveMatch?.materialName ? `Matched Step 4: ${liveMatch.materialName}` : "Planned Inventory"}
                              >
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Planned Inventory</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-medium">Missing</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddToPlannedInventory(ing)}
                                  disabled={isAdding}
                                  className="text-[10px] px-2 py-0.5 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-semibold rounded border border-slate-300 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                  title="Add to Step 4 Planned Inventory"
                                >
                                  {isAdding ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5" />}
                                  <span>+ Add to Planned</span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Scientific Rationale & References */}
                          <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-sm">
                            <p className="leading-relaxed">{ing.scientificRationale}</p>
                            {ing.sourceReference && (
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                                <BookOpen className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate" title={ing.sourceReference}>
                                  {ing.sourceReference}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Panel Footer / Build Formulation Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-teal-100">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>
                    Building will merge selected items into the matrix, auto-balance continuous vehicle (q.s.), and compute batch masses.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBuildSelectedFormulation}
                    disabled={selectedIngredientIds.size === 0 || isBuilding}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isBuilding ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Building formulation...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Build Selected Formulation ({selectedIngredientIds.size})</span>
                      </>
                    )}
                  </button>

                  {formulation.components.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingReplace(true)}
                      disabled={selectedIngredientIds.size === 0 || isBuilding}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
                      title="Replace entire existing matrix with the selected AI ingredients (requires confirmation)"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-500" />
                      <span>Replace Matrix</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* 3. Composition matrix */}
      <motion.section
        id="composition-matrix"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: easeOut }}
        className="scroll-mt-6 space-y-2 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <AnimatePresence>
          {buildFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs ${
                buildFeedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : buildFeedback.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-sky-200 bg-sky-50 text-sky-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {buildFeedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : buildFeedback.type === "error" ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                ) : (
                  <Info className="h-4 w-4 shrink-0 text-sky-600" />
                )}
                <span className="font-semibold">{buildFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setBuildFeedback(null)}
                className="rounded p-0.5 text-[#8aa094] hover:text-[#52645d]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                3
              </span>
              Composition matrix
              <span
                className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold normal-case tracking-normal ${
                  isBalanced
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : isOver100
                      ? "border-rose-200 bg-rose-50 text-rose-800"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {totalConcentrationSum.toFixed(2)}% / 100%
              </span>
              <span className="font-medium normal-case tracking-normal text-[#8aa094]">
                · {formulation.components.length} · {numericBatchSizeGrams.toLocaleString()} g
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
            <button
              type="button"
              onClick={handleBalanceWithVehicle}
              className="inline-flex items-center gap-1 rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2.5 py-1 text-[11px] font-semibold text-[#52645d] transition hover:border-emerald-400 hover:bg-emerald-50"
              title="Automatically calculate remaining vehicle percentage to reach exactly 100%"
            >
              <Calculator className="h-3 w-3 text-emerald-700" />
              Balance q.s.
            </button>

            <div className="relative" ref={addDropdownRef}>
              <button
                type="button"
                onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Plus className="h-3 w-3" />
                Add
                <ChevronDown className="h-3 w-3" />
              </button>

              {isAddDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-2xl z-30 w-80 max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 bg-slate-50">
                    <input
                      type="text"
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                      placeholder="Search ingredient or material catalog..."
                      className="w-full px-2.5 py-1 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>

                  {/* Section 1: Cataloged Inventory Materials from Step 4 */}
                  {materials.length > 0 && (
                    <div>
                      <div className="px-3 py-1 bg-emerald-50/70 text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                        <span>Project Materials Inventory (Step 4)</span>
                        <span>{materials.length} available</span>
                      </div>
                      {materials
                        .filter((m) => !ingredientSearch.trim() || (m.materialName || "").toLowerCase().includes(ingredientSearch.toLowerCase()))
                        .map((mat, idx) => {
                          const isPlanned = mat.inventoryStatus === "PLANNED" || mat.quantityAvailable == null;
                          return (
                            <button
                              key={`mat-${mat.id ?? "item"}-${idx}`}
                              type="button"
                              onClick={() =>
                                handleAddComponentFromSource({
                                  name: mat.materialName,
                                  type: mat.materialType,
                                  role: mat.functionDescription || "Compounding Agent",
                                  grade: mat.gradeOrPurity,
                                  supplier: mat.supplierOrSource || undefined,
                                  lot: mat.lotOrBatchNumber || undefined,
                                  materialId: mat.id,
                                  inventoryStatus: mat.inventoryStatus || (isPlanned ? "PLANNED" : "AVAILABLE"),
                                  suggestedConcentration: mat.materialType === "ACTIVE_BOTANICAL" ? 5.0 : 1.0,
                                })
                              }
                              className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 transition-colors flex items-start justify-between gap-2 cursor-pointer"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-800 truncate">{mat.materialName}</span>
                                  {isPlanned ? (
                                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                                      Planned (Theoretical)
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                      Verified Stock
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                  <span className="font-semibold text-emerald-700">{mat.materialType}</span>
                                  <span>•</span>
                                  <span>
                                    {mat.quantityAvailable != null
                                      ? `Stock: ${mat.quantityAvailable} ${mat.unit || "g"}`
                                      : "Stock: Unmeasured (Planned)"}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {mat.lotOrBatchNumber ? `Lot: ${mat.lotOrBatchNumber}` : "Lot: Pending"}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}

                  {/* Section 2: Standard Compendial Excipients */}
                  <div>
                    <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Compendial Excipient Presets
                    </div>
                    {[
                      { name: "Carbomer 940", type: "EXCIPIENT", role: "Gelling Agent", conc: 1.0 },
                      { name: "Glycerin", type: "EXCIPIENT", role: "Humectant", conc: 5.0 },
                      { name: "Propylene Glycol", type: "EXCIPIENT", role: "Cosolvent / Penetration Enhancer", conc: 3.0 },
                      { name: "Triethanolamine (TEA)", type: "EXCIPIENT", role: "pH Adjuster", conc: 1.0 },
                      { name: "Phenoxyethanol", type: "PRESERVATIVE", role: "Antimicrobial Preservative", conc: 0.8 },
                      { name: "Purified Water (USP)", type: "VEHICLE", role: "Continuous Vehicle (q.s. to 100%)", conc: 80.0, isVehicle: true },
                    ]
                      .filter((p) => !ingredientSearch.trim() || p.name.toLowerCase().includes(ingredientSearch.toLowerCase()))
                      .map((preset, idx) => (
                        <button
                          key={`preset-${preset.name}-${idx}`}
                          type="button"
                          onClick={() =>
                            handleAddComponentFromSource({
                              name: preset.name,
                              type: preset.type,
                              role: preset.role,
                              suggestedConcentration: preset.conc,
                              isVehicle: preset.isVehicle,
                            })
                          }
                          className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800">{preset.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{preset.role}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] ${
            unassignedBotanicalWarning || (!isBalanced && !isOver100)
              ? "border-amber-200 bg-amber-50/80 text-amber-900"
              : isOver100
                ? "border-rose-200 bg-rose-50/80 text-rose-900"
                : "border-emerald-200 bg-emerald-50/80 text-emerald-900"
          }`}
        >
          <div className="flex min-w-0 items-center gap-1.5 font-semibold">
            {unassignedBotanicalWarning ? (
              <>
                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                <span className="truncate">
                  Enter % for <strong>{unassignedBotanicalWarning.ingredientName}</strong>
                </span>
              </>
            ) : isBalanced ? (
              <>
                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                <span className="truncate">Balanced at 100% — ready for batch analysis</span>
              </>
            ) : isOver100 ? (
              <>
                <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600" />
                <span className="truncate">
                  Over by {(totalConcentrationSum - 100.0).toFixed(2)}%
                </span>
              </>
            ) : (
              <>
                <Info className="h-3 w-3 shrink-0 text-amber-600" />
                <span className="truncate">
                  {(100.0 - totalConcentrationSum).toFixed(2)}% left — Balance q.s.
                </span>
              </>
            )}
          </div>
          <span className="shrink-0 font-mono text-[#6d7f76]">
            {numericBatchSizeGrams.toLocaleString()} g
          </span>
        </div>

        {formulation.components.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] py-8 text-center">
            <Layers className="h-7 w-7 text-[#c5d4cb]" />
            <p className="text-xs font-bold text-[#52645d]">Composition matrix is empty</p>
            <p className="text-[11px] text-[#8aa094]">Use AI Assist or Add from inventory / presets.</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleToggleAiPanel}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                <Sparkles className="h-3 w-3" />
                AI Assist
              </button>
              <button
                type="button"
                onClick={() => setIsAddDropdownOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#d7e4dc] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#52645d]"
              >
                <Plus className="h-3 w-3 text-emerald-700" />
                Add
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#d7e4dc]/90">
            <div className="hidden grid-cols-[minmax(0,1fr)_7.5rem_5.5rem_4.25rem] gap-2 border-b border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#8aa094] sm:grid">
              <span>Ingredient</span>
              <span>% w/w</span>
              <span>Batch g</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-[#e8f0eb]">
              <AnimatePresence mode="popLayout">
                {formulation.components.map((comp, idx) => {
                  const numericConc = parseFloat(String(comp.concentrationValue)) || 0;
                  const calculatedGrams = Number(
                    ((numericBatchSizeGrams * numericConc) / 100).toFixed(2)
                  );
                  const plantClean = project?.plantName
                    ? project.plantName.trim().toLowerCase()
                    : "";
                  const ingredientClean = (comp.ingredientName || "").trim().toLowerCase();
                  const isBotanicalActive =
                    comp.componentType === "ACTIVE_EXTRACT" ||
                    comp.componentType === "ACTIVE_BOTANICAL" ||
                    Boolean(
                      plantClean && ingredientClean && ingredientClean.includes(plantClean)
                    );
                  const isHighlighted = highlightedRowNames.has(comp.ingredientName || "");

                  return (
                    <motion.div
                      key={`comp-${comp.id ?? "row"}-${idx}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: easeOut }}
                      className={`grid grid-cols-1 items-center gap-1.5 px-2.5 py-1.5 transition sm:grid-cols-[minmax(0,1fr)_7.5rem_5.5rem_4.25rem] sm:gap-2 ${
                        isHighlighted
                          ? "bg-emerald-50/80"
                          : "bg-white hover:bg-[#f7faf8]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <input
                            type="text"
                            value={comp.ingredientName || ""}
                            onChange={(e) =>
                              handleUpdateComponent(idx, "ingredientName", e.target.value)
                            }
                            className="min-w-0 flex-1 truncate border-b border-transparent bg-transparent text-xs font-semibold text-[#0f2c20] outline-none hover:border-[#d7e4dc] focus:border-emerald-600"
                          />
                          {isBotanicalActive ? (
                            <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[8px] font-bold text-emerald-800">
                              Active
                            </span>
                          ) : comp.isVehicle ? (
                            <span className="shrink-0 rounded border border-sky-200 bg-sky-50 px-1 py-0.5 text-[8px] font-bold text-sky-800">
                              Vehicle
                            </span>
                          ) : null}
                          {comp.inventoryStatus === "PLANNED" && (
                            <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[8px] font-semibold text-amber-800">
                              Planned
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[10px] text-[#8aa094]">
                          {comp.roleOrFunction ||
                            (isBotanicalActive ? "Botanical Active" : "Compounding Agent")}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={
                            comp.concentrationValue !== undefined &&
                            comp.concentrationValue !== null
                              ? comp.concentrationValue
                              : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            handleUpdateComponent(idx, "concentrationValue", val);
                          }}
                          className={`w-full rounded-md border px-1.5 py-1 font-mono text-[11px] font-bold outline-none focus:border-emerald-600 sm:w-[4.5rem] ${
                            numericConc === 0 && isBotanicalActive
                              ? "border-amber-300 bg-amber-50 text-amber-900"
                              : "border-[#d5e3da] bg-[#fbfdfb] text-[#0f2c20]"
                          }`}
                        />
                        <span className="shrink-0 text-[10px] font-semibold text-[#8aa094]">%</span>
                      </div>

                      <div className="font-mono text-[11px] font-bold text-[#0f2c20]">
                        {numericConc > 0 ? (
                          `${calculatedGrams.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} g`
                        ) : isBotanicalActive ? (
                          <span className="font-sans text-[10px] italic font-medium text-amber-700">
                            Pending
                          </span>
                        ) : comp.isPhAdjuster ? (
                          <span className="font-sans text-[10px] italic font-medium text-[#8aa094]">
                            q.s.
                          </span>
                        ) : (
                          "0.00 g"
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => setSelectedComponentModalIdx(idx)}
                          className="rounded p-1 text-[#8aa094] transition hover:bg-emerald-50 hover:text-emerald-800"
                          title="View / Edit ingredient details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(idx)}
                          className="rounded p-1 text-[#8aa094] transition hover:bg-rose-50 hover:text-rose-600"
                          title="Remove ingredient"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.section>



      {/* ===================================================================== */}
      {/* 6. PER-INGREDIENT DETAILS MODAL                                       */}
      {/* ===================================================================== */}
      {selectedComponentModalIdx !== null && formulation.components[selectedComponentModalIdx] && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ingredient Advanced Specification
                </span>
                <h3 className="text-sm sm:base font-bold text-slate-900 mt-0.5">
                  {formulation.components[selectedComponentModalIdx].ingredientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComponentModalIdx(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Classification</label>
                  <select
                    value={formulation.components[selectedComponentModalIdx].componentType}
                    onChange={(e) =>
                      handleUpdateComponent(selectedComponentModalIdx, "componentType", e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="ACTIVE_EXTRACT">ACTIVE_EXTRACT (Botanical Active)</option>
                    <option value="EXCIPIENT">EXCIPIENT (Matrix Builder)</option>
                    <option value="VEHICLE">VEHICLE (Continuous Phase)</option>
                    <option value="PRESERVATIVE">PRESERVATIVE (Antimicrobial)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grade / Compendial Purity</label>
                  <input
                    type="text"
                    value={formulation.components[selectedComponentModalIdx].gradeOrPurity || ""}
                    onChange={(e) =>
                      handleUpdateComponent(selectedComponentModalIdx, "gradeOrPurity", e.target.value)
                    }
                    placeholder="e.g. USP / NF, Analytical Grade"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pharmaceutical Function &amp; Mechanism</label>
                <input
                  type="text"
                  value={formulation.components[selectedComponentModalIdx].roleOrFunction || ""}
                  onChange={(e) =>
                    handleUpdateComponent(selectedComponentModalIdx, "roleOrFunction", e.target.value)
                  }
                  placeholder="e.g. Viscosity builder, neutralizing agent, barrier protectant"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Linked Supplier / Source</label>
                  <input
                    type="text"
                    value={formulation.components[selectedComponentModalIdx].supplierOrSource || ""}
                    onChange={(e) =>
                      handleUpdateComponent(selectedComponentModalIdx, "supplierOrSource", e.target.value)
                    }
                    placeholder="e.g. Lubrizol, Sigma-Aldrich"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Linked Lot / Accession</label>
                  <input
                    type="text"
                    value={formulation.components[selectedComponentModalIdx].lotOrBatchNumber || ""}
                    onChange={(e) =>
                      handleUpdateComponent(selectedComponentModalIdx, "lotOrBatchNumber", e.target.value)
                    }
                    placeholder="e.g. LOT-2026-X1"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scientific Compatibility &amp; Bench Notes</label>
                <textarea
                  rows={2}
                  value={formulation.components[selectedComponentModalIdx].notes || ""}
                  onChange={(e) =>
                    handleUpdateComponent(selectedComponentModalIdx, "notes", e.target.value)
                  }
                  placeholder="Compounding order, shear sensitivity, compatibility observations..."
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedComponentModalIdx(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. TEMPLATE OVERWRITE CONFIRMATION MODAL                              */}
      {/* ===================================================================== */}
      {pendingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Switch to {pendingTemplate.name} Template?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your composition matrix currently contains {formulation.components.length} ingredients. Loading the {pendingTemplate.name} template will replace existing components with the standardized template matrix.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingTemplate(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Keep Current Matrix
              </button>
              <button
                type="button"
                onClick={() => applyTemplate(pendingTemplate)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Apply New Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. AI FORMULATION REPLACE CONFIRMATION MODAL                          */}
      {/* ===================================================================== */}
      {isConfirmingReplace && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Replace Entire Formulation Matrix?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your composition matrix currently contains {formulation.components.length} ingredients. Replacing with the AI selection will clear existing ingredients and load only the {selectedIngredientIds.size} chosen formulation ingredients.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingReplace(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeReplaceMatrix}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Yes, Replace Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
