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
  Trash2,
  Edit2,
  Info,
  Package,
  Layers,
  Sparkles,
  Scale,
  X,
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
  ArrowDown,
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
  /** Reviewer / read-only mode: hide AI assist, matrix editors, add/remove */
  readOnly?: boolean;
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
  isSaving,
  readOnly = false,
}: Props) {
  // Template Selection & Dropdown State
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const [pendingTemplate, setPendingTemplate] = useState<FormulationTemplate | null>(null);

  // Per-Ingredient Details Modal State
  const [selectedComponentModalIdx, setSelectedComponentModalIdx] = useState<number | null>(null);

  // Select-from-inventory control (no ingredient creation on this page)
  const inventorySelectRef = useRef<HTMLSelectElement>(null);

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
  const [aiError, setAiError] = useState<string | null>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [customBatchOpen, setCustomBatchOpen] = useState(false);
  const [expandedIngredientIdx, setExpandedIngredientIdx] = useState<number | null>(null);
  const [pendingBalance, setPendingBalance] = useState<{
    vehicleIdx: number | null;
    vehicleName: string;
    currentConc: number;
    proposedConc: number;
    nonVehicleSum: number;
  } | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const didSyncDefaults = useRef(false);

  const BATCH_PRESETS = ["100 g", "250 g", "500 g", "1,000 g"] as const;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Inherit dosage format from Product Selection; suggest name/code without forcing researcher entry.
  useEffect(() => {
    if (didSyncDefaults.current) return;
    didSyncDefaults.current = true;
    const format =
      productSelection?.deliveryFormat || formulation.dosageFormType || "Topical Hydrogel";
    const suggestedName = `${project.plantName} ${format}`.trim();
    const next: FormulationState = { ...formulation };
    let changed = false;

    if (productSelection?.deliveryFormat && formulation.dosageFormType !== productSelection.deliveryFormat) {
      next.dosageFormType = productSelection.deliveryFormat;
      changed = true;
    }
    if (
      !formulation.formulationName ||
      /5%\s+Topical Comfort Gel/i.test(formulation.formulationName)
    ) {
      next.formulationName = suggestedName;
      changed = true;
    }
    if (!formulation.formulationCode || formulation.formulationCode === "FRM-TOP-001") {
      const generated = generateFormulationCode(format, formulation.formulationCode);
      if (generated !== formulation.formulationCode) {
        next.formulationCode = generated;
        changed = true;
      }
    }
    if (changed) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const batchSelectValue = useMemo(() => {
    const raw = (formulation.targetBatchSize || "").trim();
    if ((BATCH_PRESETS as readonly string[]).includes(raw)) return raw;
    if (raw === "1000 g" || raw === "1000g") return "1,000 g";
    return "custom";
  }, [formulation.targetBatchSize]);

  useEffect(() => {
    setCustomBatchOpen(batchSelectValue === "custom");
  }, [batchSelectValue]);

  function simplifyPurpose(role?: string | null, componentType?: string): string {
    const r = (role || "").toLowerCase();
    if (componentType === "ACTIVE_EXTRACT" || componentType === "ACTIVE_BOTANICAL") {
      return "Main Ingredient";
    }
    if (r.includes("vehicle") || componentType === "VEHICLE") return "Base Ingredient";
    if (r.includes("gelling") || r.includes("matrix")) return "Gelling Agent";
    if (r.includes("preserv")) return "Preservative";
    if (r.includes("humectant") || r.includes("emollient") || r.includes("moistur")) {
      return "Moisturizer";
    }
    if (r.includes("ph") || r.includes("neutral")) return "pH Adjuster";
    if (r.includes("solvent") || r.includes("cosolvent")) return "Solvent";
    if (r.includes("emulsif")) return "Emulsifier";
    return role || "Ingredient";
  }

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
  const hasInvalidConcentrations = formulation.components.some((c) => {
    const v = parseFloat(String(c.concentrationValue));
    return Number.isNaN(v) || v < 0;
  });

  const totalCalculatedWeightGrams = useMemo(() => {
    return formulation.components.reduce((acc, c) => {
      const conc = parseFloat(String(c.concentrationValue)) || 0;
      if (conc <= 0) return acc;
      return acc + (numericBatchSizeGrams * conc) / 100;
    }, 0);
  }, [formulation.components, numericBatchSizeGrams]);

  const compositionStatusLabel = hasInvalidConcentrations
    ? "Invalid values"
    : isBalanced
      ? "Balanced"
      : isOver100
        ? "Above 100%"
        : "Below 100%";

  // Active Botanical in matrix with 0 concentration
  const unassignedBotanicalWarning = useMemo(() => {
    return formulation.components.find(
      (c) =>
        (c.componentType === "ACTIVE_EXTRACT" || c.componentType === "ACTIVE_BOTANICAL") &&
        (parseFloat(String(c.concentrationValue)) || 0) <= 0
    );
  }, [formulation.components]);

  function findVehicleIndex(components: FormulationComponentItem[]) {
    return components.findIndex(
      (c) =>
        c.isVehicle ||
        c.componentType === "VEHICLE" ||
        (c.ingredientName || "").toLowerCase().includes("water") ||
        (c.roleOrFunction || "").toLowerCase().includes("vehicle") ||
        (c.roleOrFunction || "").toLowerCase().includes("q.s")
    );
  }

  // Handle generic header field changes
  const handleFieldChange = (field: keyof FormulationState, value: any) => {
    if (readOnly) return;
    setIsDirty(true);
    onChange({
      ...formulation,
      [field]: value,
    });
  };

  // Component Matrix updates
  const handleUpdateComponent = (index: number, field: keyof FormulationComponentItem, value: any) => {
    if (readOnly) return;
    setIsDirty(true);
    const updated = [...formulation.components];
    updated[index] = { ...updated[index], [field]: value };
    onChange({
      ...formulation,
      components: updated,
    });
  };

  const handleRemoveComponent = (index: number) => {
    if (readOnly) return;
    const name = formulation.components[index]?.ingredientName || "this ingredient";
    if (!confirm(`Remove “${name}” from the composition?`)) return;
    setIsDirty(true);
    const updated = formulation.components.filter((_, idx) => idx !== index);
    onChange({
      ...formulation,
      components: updated,
    });
    if (expandedIngredientIdx === index) setExpandedIngredientIdx(null);
  };

  /** Add a row from My Ingredients only (never registers a new inventory ingredient). */
  const handleSelectInventoryIngredient = (materialId: number) => {
    if (readOnly) return;
    const mat = materials.find((m) => m.id === materialId);
    if (!mat) return;

    const nameNorm = (mat.materialName || "").trim().toLowerCase();
    const alreadyExists = formulation.components.some((c) => {
      if (c.materialId != null && c.materialId === mat.id) return true;
      return (c.ingredientName || "").trim().toLowerCase() === nameNorm;
    });
    if (alreadyExists) {
      setBuildFeedback({
        type: "info",
        message: `“${mat.materialName}” is already in the composition. Edit its percentage instead.`,
      });
      if (inventorySelectRef.current) inventorySelectRef.current.value = "";
      return;
    }

    setIsDirty(true);
    const suggested =
      mat.materialType === "ACTIVE_BOTANICAL" ? 5.0 : 1.0;
    const newComponent: FormulationComponentItem = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ingredientName: mat.materialName,
      componentType:
        mat.materialType === "ACTIVE_BOTANICAL" ? "ACTIVE_EXTRACT" : mat.materialType,
      concentrationValue: suggested,
      concentrationUnit: "% w/w",
      minConcentration: Math.max(0.1, Number((suggested * 0.5).toFixed(1))),
      maxConcentration: Number((suggested * 2.0).toFixed(1)),
      roleOrFunction: mat.functionDescription || "Compounding Agent",
      gradeOrPurity: mat.gradeOrPurity || "",
      supplierOrSource: mat.supplierOrSource || "",
      lotOrBatchNumber: mat.lotOrBatchNumber || "",
      notes: mat.lotOrBatchNumber
        ? `Inventory Lot: ${mat.lotOrBatchNumber} (${mat.supplierOrSource || "Internal Depot"})`
        : "",
      isVehicle: Boolean(
        (mat.functionDescription || "").toLowerCase().includes("vehicle") ||
          ((mat.materialName || "").toLowerCase().includes("water") &&
            (mat.materialType === "SOLVENT" || mat.materialType === "EXCIPIENT"))
      ),
      materialId: mat.id,
      inventoryStatus: mat.inventoryStatus,
    };

    onChange({
      ...formulation,
      components: [...formulation.components, newComponent],
    });
    if (inventorySelectRef.current) inventorySelectRef.current.value = "";
  };

  const availableInventoryIngredients = useMemo(() => {
    return materials.filter((mat) => {
      const nameNorm = (mat.materialName || "").trim().toLowerCase();
      return !formulation.components.some((c) => {
        if (c.materialId != null && c.materialId === mat.id) return true;
        return (c.ingredientName || "").trim().toLowerCase() === nameNorm;
      });
    });
  }, [materials, formulation.components]);

  /** Preview q.s. balance — never apply until researcher confirms. */
  const handleRequestBalanceTo100 = () => {
    if (readOnly) return;
    setBalanceError(null);

    const vehicleIdx = findVehicleIndex(formulation.components);
    if (vehicleIdx === -1) {
      const nonVehicleSum = formulation.components.reduce(
        (acc, c) => acc + (parseFloat(String(c.concentrationValue)) || 0),
        0
      );
      if (nonVehicleSum >= 100.05) {
        setBalanceError(
          "Composition already meets or exceeds 100% and no q.s. base/vehicle ingredient is designated. Adjust percentages manually."
        );
        return;
      }
      if (formulation.components.length === 0) {
        setBalanceError("Add ingredients before balancing the composition.");
        return;
      }
      const proposed = Number(Math.max(0, 100.0 - nonVehicleSum).toFixed(2));
      setPendingBalance({
        vehicleIdx: null,
        vehicleName: "Purified Water (USP)",
        currentConc: 0,
        proposedConc: proposed,
        nonVehicleSum,
      });
      return;
    }

    const nonVehicleSum = formulation.components.reduce((acc, c, idx) => {
      if (idx === vehicleIdx) return acc;
      return acc + (parseFloat(String(c.concentrationValue)) || 0);
    }, 0);

    if (nonVehicleSum > 100.05) {
      setBalanceError(
        `Other ingredients already total ${nonVehicleSum.toFixed(2)}%. Reduce those percentages before balancing the vehicle.`
      );
      return;
    }

    const proposed = Number(Math.max(0, 100.0 - nonVehicleSum).toFixed(2));
    const current = parseFloat(String(formulation.components[vehicleIdx].concentrationValue)) || 0;
    setPendingBalance({
      vehicleIdx,
      vehicleName: formulation.components[vehicleIdx].ingredientName || "Vehicle",
      currentConc: current,
      proposedConc: proposed,
      nonVehicleSum,
    });
  };

  const handleConfirmBalance = () => {
    if (readOnly || !pendingBalance) return;
    const { vehicleIdx, proposedConc } = pendingBalance;

    if (vehicleIdx === -1 || vehicleIdx === null) {
      const vehicleItem: FormulationComponentItem = {
        id: `vehicle-${Date.now()}`,
        ingredientName: "Purified Water (USP)",
        componentType: "VEHICLE",
        concentrationValue: proposedConc,
        concentrationUnit: "% w/w",
        roleOrFunction: "Aqueous Vehicle (q.s. to 100%)",
        isVehicle: true,
      };
      setIsDirty(true);
      onChange({
        ...formulation,
        components: [...formulation.components, vehicleItem],
      });
    } else {
      const updated = [...formulation.components];
      updated[vehicleIdx] = {
        ...updated[vehicleIdx],
        concentrationValue: proposedConc,
        isVehicle: true,
        roleOrFunction: `${(updated[vehicleIdx].roleOrFunction || "Aqueous Vehicle")
          .replace(/\(q\.s\..*?\)/i, "")
          .trim()} (q.s. to 100%)`,
      };
      setIsDirty(true);
      onChange({
        ...formulation,
        components: updated,
      });
    }
    setPendingBalance(null);
  };

  // Apply Template with Confirmation
  const handleSelectTemplate = (template: FormulationTemplate) => {
    if (readOnly) return;
    if (formulation.components.length > 0) {
      setPendingTemplate(template);
      setIsTemplateDropdownOpen(false);
      return;
    }
    applyTemplate(template);
  };

  const applyTemplate = (template: FormulationTemplate) => {
    if (readOnly) return;
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
      formulationName: `${project.plantName} ${template.name}`,
      dosageFormType: template.dosageFormat || productSelection?.deliveryFormat || formulation.dosageFormType,
      formulationCode: generateFormulationCode(template.dosageFormat, formulation.formulationCode),
      targetBatchSize: template.typicalBatchSize,
      components: newComponents,
    });
  };

  // ---------------------------------------------------------------------------
  // AI FORMULATION PROPOSAL HANDLERS
  // ---------------------------------------------------------------------------
  const handleToggleAiPanel = () => {
    if (readOnly) return;
    const nextState = !isAiPanelOpen;
    setIsAiPanelOpen(nextState);
    if (nextState && !aiProposal) {
      handleFetchAiProposal();
    }
  };

  const handleFetchAiProposal = async () => {
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
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

  const fieldClass =
    "h-9 w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] px-3 text-xs font-medium text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15";

  const readOnlyFieldClass = readOnly
    ? `${fieldClass} cursor-default bg-[#f8fbf9]`
    : fieldClass;

  const inheritedFormat =
    productSelection?.deliveryFormat || formulation.dosageFormType || "Topical Hydrogel";

  return (
    <div className="space-y-4">
      {/* A. Formulation Details */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
            <FlaskConical className="h-4 w-4 text-emerald-700" />
            Formulation Details
          </h3>
          {!readOnly && (
            <button
              type="button"
              onClick={handleToggleAiPanel}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                isAiPanelOpen
                  ? "border-emerald-600 bg-emerald-700 text-white"
                  : "border-[#d7e4dc] bg-[#f7faf8] text-[#52645d] hover:border-emerald-400"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              AI Assist
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Formulation Name
            </label>
            <input
              type="text"
              value={formulation.formulationName}
              onChange={(e) => handleFieldChange("formulationName", e.target.value)}
              readOnly={readOnly}
              placeholder={`${project.plantName} ${inheritedFormat}`}
              className={readOnlyFieldClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Formulation Template
            </label>
            {readOnly ? (
              <div className={`${readOnlyFieldClass} flex items-center`}>
                <span className="truncate">{currentTemplate.name}</span>
              </div>
            ) : (
            <div className="relative" ref={templateDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                className={`${fieldClass} flex items-center justify-between gap-2 text-left`}
              >
                <span className="truncate">{currentTemplate.name}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-[#8aa094] transition ${
                    isTemplateDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isTemplateDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-[#d7e4dc] bg-white shadow-xl"
                  >
                    <div className="sticky top-0 border-b border-[#eef4f0] bg-[#f7faf8] p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#8aa094]" />
                        <input
                          type="text"
                          value={templateSearch}
                          onChange={(e) => setTemplateSearch(e.target.value)}
                          placeholder="Search templates..."
                          className="h-8 w-full rounded-lg border border-[#d5e3da] bg-white pl-8 pr-2 text-xs outline-none focus:border-emerald-600"
                          autoFocus
                        />
                      </div>
                    </div>
                    {filteredTemplates.map((tmpl, idx) => (
                      <button
                        key={`tmpl-${tmpl.id}-${idx}`}
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs ${
                          currentTemplate.id === tmpl.id
                            ? "bg-emerald-50 font-semibold text-emerald-950"
                            : "text-[#52645d] hover:bg-[#f4f8f5]"
                        }`}
                      >
                        <span className="truncate">{tmpl.name}</span>
                        {currentTemplate.id === tmpl.id && (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}
            <p className="mt-1 truncate text-[10px] text-[#8aa094]">
              Format from Product Selection: {inheritedFormat}
            </p>
          </div>
        </div>
      </motion.section>

      {/* 2. AI Formulation Assist panel */}
      <AnimatePresence>
      {!readOnly && isAiPanelOpen && (
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
                  <h3 className="inline-flex items-center gap-1.5 text-sm font-bold tracking-tight text-[#0f2c20]">
                    {aiProposal ? aiProposal.formulationName : "AI Assist Suggestions"}
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
              {/* Selection Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
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
                  {selectedIngredientIds.size} of {aiProposal.components.length} selected
                </span>
              </div>

              {/* Recommended Ingredients Table — Select | Name & Role | Concentration */}
              <div className="overflow-x-auto border border-[#d7e4dc] rounded-xl bg-white shadow-2xs">
                <table className="w-full min-w-[320px] text-left text-xs">
                  <thead className="bg-[#f3f8f5] text-[#3d5248] border-b border-[#e0ebe4] font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2 px-2 sm:px-3 w-10 text-center">Select</th>
                      <th className="py-2 px-2 sm:px-3">Ingredient Name &amp; Role</th>
                      <th className="py-2 px-2 sm:px-3 whitespace-nowrap">Provisional Concentration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef4f0]">
                    {aiProposal.components.map((ing, idx) => {
                      const isSelected = selectedIngredientIds.has(ing.id);

                      return (
                        <tr
                          key={`rec-${ing.id || ing.ingredientName || "ing"}-${idx}`}
                          onClick={() => handleToggleIngredientSelect(ing.id)}
                          className={`hover:bg-[#f3f8f5]/80 transition-colors cursor-pointer ${
                            isSelected ? "bg-[#eef6f1]" : ""
                          }`}
                        >
                          <td className="py-2 px-2 sm:px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleIngredientSelect(ing.id)}
                              className="rounded border-slate-300 text-[#1a5c3a] focus:ring-[#1a5c3a] cursor-pointer w-4 h-4"
                              aria-label={`Select ${ing.ingredientName}`}
                            />
                          </td>

                          <td className="py-2 px-2 sm:px-3">
                            <div className="min-w-0 max-w-[16rem] sm:max-w-none">
                              <p className="font-semibold text-[#0f2c20] text-xs sm:text-sm leading-snug truncate sm:whitespace-normal">
                                {ing.ingredientName}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#6b7f74] leading-snug">
                                {ing.functionalRole}
                              </p>
                            </div>
                          </td>

                          <td className="py-2 px-2 sm:px-3 whitespace-nowrap">
                            {!ing.isConcentrationSupported ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Requires researcher input</span>
                                </span>
                                {ing.isPhAdjuster && (
                                  <span className="text-[10px] text-[#6b7f74] block">q.s. to pH 5.5–6.5</span>
                                )}
                              </div>
                            ) : ing.isVehicle ? (
                              <span className="font-mono font-semibold text-[#0f2c20] text-xs">
                                q.s. to 100% w/w
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="font-mono font-semibold text-[#0f2c20] text-xs">
                                  {ing.suggestedConcentration}% w/w
                                </span>
                                {ing.suggestedConcentrationRange ? (
                                  <span className="text-[10px] text-[#8aa094] block">
                                    {ing.suggestedConcentrationRange}
                                  </span>
                                ) : null}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#e0ebe4]">
                <p className="text-[10px] text-[#6b7f74]">
                  Selected ingredients merge into the recipe; continuous vehicle balances to 100% (q.s.).
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBuildSelectedFormulation}
                    disabled={selectedIngredientIds.size === 0 || isBuilding}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a5c3a] hover:bg-[#154a2f] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
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

      {/* B. Ingredients & Composition — recipe builder */}
      <motion.section
        id="composition-matrix"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: easeOut }}
        className="scroll-mt-6 space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <AnimatePresence>
          {buildFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 text-xs ${
                buildFeedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : buildFeedback.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-sky-200 bg-sky-50 text-sky-900"
              }`}
            >
              <span className="font-semibold">{buildFeedback.message}</span>
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

        {balanceError && (
          <div className="flex items-start justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>{balanceError}</span>
            </div>
            <button type="button" onClick={() => setBalanceError(null)} className="text-amber-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-bold tracking-tight text-[#0f2c20]">
              Ingredients &amp; Composition
            </h3>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              Edit % w/w — batch weight updates from target size
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[8.5rem]">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                Target batch size
              </label>
              <select
                value={batchSelectValue}
                disabled={readOnly}
                onChange={(e) => {
                  if (readOnly) return;
                  const v = e.target.value;
                  if (v === "custom") {
                    setCustomBatchOpen(true);
                    if ((BATCH_PRESETS as readonly string[]).includes(formulation.targetBatchSize)) {
                      handleFieldChange("targetBatchSize", "750 g");
                    }
                  } else {
                    setCustomBatchOpen(false);
                    handleFieldChange("targetBatchSize", v);
                  }
                }}
                className="h-9 w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] px-2.5 text-xs font-semibold text-[#0f2c20] outline-none focus:border-emerald-600"
              >
                {BATCH_PRESETS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
              {customBatchOpen && (
                <input
                  type="text"
                  inputMode="decimal"
                  value={formulation.targetBatchSize}
                  onChange={(e) => handleFieldChange("targetBatchSize", e.target.value)}
                  placeholder="e.g. 750 g"
                  className="mt-1 h-8 w-full rounded-lg border border-[#d5e3da] bg-white px-2.5 font-mono text-xs outline-none focus:border-emerald-600"
                />
              )}
            </div>

            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={handleRequestBalanceTo100}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2.5 text-[11px] font-semibold text-[#52645d] transition hover:border-emerald-400 hover:bg-emerald-50"
                  title="Adjust q.s. vehicle to reach 100% (confirmation required)"
                >
                  <Calculator className="h-3 w-3 text-emerald-700" />
                  Balance to 100%
                </button>

                <div className="min-w-[11rem]">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    My Ingredients
                  </label>
                  <select
                    ref={inventorySelectRef}
                    defaultValue=""
                    disabled={availableInventoryIngredients.length === 0}
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10);
                      if (!Number.isNaN(id)) handleSelectInventoryIngredient(id);
                    }}
                    className="h-9 w-full max-w-[14rem] rounded-lg border border-[#d5e3da] bg-[#fbfdfb] px-2.5 text-xs font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                    title={
                      materials.length === 0
                        ? "Register ingredients in Ingredients & Materials first"
                        : availableInventoryIngredients.length === 0
                          ? "All My Ingredients are already in this composition"
                          : "Select an existing inventory ingredient"
                    }
                  >
                    <option value="" disabled>
                      {materials.length === 0
                        ? "No inventory yet"
                        : availableInventoryIngredients.length === 0
                          ? "All selected"
                          : "Select ingredient…"}
                    </option>
                    {availableInventoryIngredients.map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.materialName}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {unassignedBotanicalWarning && (
          <p className="text-[11px] font-medium text-amber-800">
            Enter a concentration for {unassignedBotanicalWarning.ingredientName}.
          </p>
        )}

        {formulation.components.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-[#f7faf8] py-10 text-center">
            <Layers className="h-7 w-7 text-[#c5d4cb]" />
            <p className="text-xs font-bold text-[#52645d]">No ingredients in this formulation</p>
            <p className="max-w-sm text-[11px] text-[#8aa094]">
              Select ingredients from My Ingredients above
              {materials.length === 0
                ? ", or register them first in Ingredients & Materials (Step 4)"
                : ""}
              . Templates and AI Assist can also build the recipe.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e8f0eb]">
            <table className="w-full min-w-[32rem] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-auto" />
                <col className="w-[7.5rem]" />
                <col className="w-[6.5rem]" />
                <col className="w-[5rem]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#e8f0eb] bg-[#f7faf8] text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                  <th className="px-3 py-2 font-bold">Ingredient</th>
                  <th className="px-2 py-2 text-right font-bold">Concentration (% w/w)</th>
                  <th className="px-2 py-2 text-right font-bold">Batch Weight (g)</th>
                  <th className="px-2 py-2 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {formulation.components.map((comp, idx) => {
                    const numericConc = parseFloat(String(comp.concentrationValue));
                    const safeConc = Number.isFinite(numericConc) ? numericConc : 0;
                    const calculatedGrams = Number(
                      ((numericBatchSizeGrams * Math.max(0, safeConc)) / 100).toFixed(2)
                    );
                    const isHighlighted = highlightedRowNames.has(comp.ingredientName || "");
                    const isExpanded = expandedIngredientIdx === idx;

                    return (
                      <tr
                        key={`comp-${comp.id ?? "row"}-${idx}`}
                        className={`border-b border-[#eef3ef] last:border-0 ${
                          isHighlighted ? "bg-emerald-50/70" : "bg-white hover:bg-[#fbfdfb]"
                        }`}
                      >
                        <td className="max-w-0 px-3 py-2 align-top">
                          <div className="flex min-w-0 items-start gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedIngredientIdx((cur) => (cur === idx ? null : idx))
                              }
                              className="mt-0.5 shrink-0 rounded p-0.5 text-[#c5d4cb] transition hover:bg-[#eef4f0] hover:text-emerald-700"
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? "Hide details" : "View details"}
                            >
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${
                                  isExpanded ? "rotate-180 text-emerald-700" : ""
                                }`}
                              />
                            </button>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="truncate text-[13px] font-semibold leading-snug text-[#0f2c20]">
                                {comp.ingredientName || "Untitled ingredient"}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-[#8aa094]">
                                {simplifyPurpose(comp.roleOrFunction, comp.componentType)}
                              </p>
                              {isExpanded && (
                                <div className="mt-2 space-y-1 break-words rounded-lg bg-[#f7faf8] px-2.5 py-2 text-[11px] leading-relaxed text-[#52645d]">
                                  <p className="whitespace-normal">
                                    <span className="font-semibold text-[#8aa094]">Role: </span>
                                    {comp.roleOrFunction || "—"}
                                  </p>
                                  {comp.gradeOrPurity ? (
                                    <p className="whitespace-normal">
                                      <span className="font-semibold text-[#8aa094]">Grade: </span>
                                      {comp.gradeOrPurity}
                                    </p>
                                  ) : null}
                                  {comp.notes ? (
                                    <p className="whitespace-normal">{comp.notes}</p>
                                  ) : null}
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedComponentModalIdx(idx)}
                                      className="mt-1 font-semibold text-emerald-800 hover:underline"
                                    >
                                      Edit details
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            readOnly={readOnly}
                            value={
                              comp.concentrationValue !== undefined &&
                              comp.concentrationValue !== null
                                ? comp.concentrationValue
                                : ""
                            }
                            onChange={(e) => {
                              if (readOnly) return;
                              const raw = e.target.value;
                              if (raw === "") {
                                handleUpdateComponent(idx, "concentrationValue", 0);
                                return;
                              }
                              const val = parseFloat(raw);
                              if (!Number.isFinite(val)) return;
                              handleUpdateComponent(
                                idx,
                                "concentrationValue",
                                Math.max(0, val)
                              );
                            }}
                            className={`ml-auto w-[4.75rem] rounded-md border px-2 py-1.5 text-right font-mono text-[12px] font-bold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 ${
                              readOnly
                                ? "cursor-default border-[#e8f0eb] bg-[#f8fbf9]"
                                : "border-[#d5e3da] bg-[#fbfdfb] text-[#0f2c20]"
                            }`}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle text-right font-mono text-[12px] font-semibold tabular-nums text-[#0f2c20]">
                          {safeConc > 0
                            ? calculatedGrams.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0.00"}
                        </td>
                        <td className="px-2 py-2 align-middle text-right">
                          {!readOnly && (
                            <div className="inline-flex items-center justify-end gap-0.5">
                              <button
                                type="button"
                                onClick={() => setSelectedComponentModalIdx(idx)}
                                className="rounded p-1.5 text-[#8aa094] transition hover:bg-emerald-50 hover:text-emerald-800"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveComponent(idx)}
                                className="rounded p-1.5 text-[#8aa094] transition hover:bg-rose-50 hover:text-rose-600"
                                title="Remove"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#d7e4dc] bg-[#f7faf8]">
                  <td colSpan={4} className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                      <p
                        className={`font-mono font-bold tabular-nums ${
                          hasInvalidConcentrations
                            ? "text-rose-800"
                            : isBalanced
                              ? "text-emerald-900"
                              : isOver100
                                ? "text-rose-800"
                                : "text-amber-900"
                        }`}
                      >
                        {totalConcentrationSum.toFixed(2)}%
                        <span className="mx-1.5 font-sans font-normal text-[#c5d4cb]">·</span>
                        {totalCalculatedWeightGrams.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        g
                        <span className="mx-1.5 font-sans font-normal text-[#c5d4cb]">·</span>
                        <span className="font-sans font-semibold">{compositionStatusLabel}</span>
                      </p>
                      {isBalanced && !hasInvalidConcentrations && !unassignedBotanicalWarning && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ready for batch analysis
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
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

      {/* Balance to 100% confirmation */}
      {pendingBalance && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div>
              <h3 className="text-sm font-bold text-[#0f2c20]">Confirm Balance to 100%</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#52645d]">
                Other ingredients total{" "}
                <strong className="font-mono">{pendingBalance.nonVehicleSum.toFixed(2)}%</strong>.
                The q.s. vehicle will be set so the composition reaches 100%. Other ingredient
                percentages will not change.
              </p>
            </div>
            <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] px-3 py-2.5 text-xs text-[#0f2c20]">
              <p className="font-semibold">{pendingBalance.vehicleName}</p>
              <p className="mt-1 font-mono text-[12px]">
                {pendingBalance.vehicleIdx == null ? (
                  <>
                    Add at <strong>{pendingBalance.proposedConc.toFixed(2)}%</strong>
                  </>
                ) : (
                  <>
                    {pendingBalance.currentConc.toFixed(2)}% →{" "}
                    <strong>{pendingBalance.proposedConc.toFixed(2)}%</strong>
                  </>
                )}
              </p>
              <p className="mt-1 text-[11px] text-[#8aa094]">
                ≈{" "}
                {(
                  (numericBatchSizeGrams * pendingBalance.proposedConc) /
                  100
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                g at current batch size
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingBalance(null)}
                className="rounded-lg border border-[#d7e4dc] bg-white px-3 py-1.5 text-xs font-semibold text-[#52645d]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBalance}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Apply balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. TEMPLATE OVERWRITE CONFIRMATION MODAL                              */}
      {/* ===================================================================== */}
      {pendingTemplate && !readOnly && (
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
      {isConfirmingReplace && !readOnly && (
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
