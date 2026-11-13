"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
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
  FlaskConical,
  Sparkles,
  Scale,
  ShieldCheck,
  Filter,
  X,
  ExternalLink,
  Tag,
  Building2,
  Wand2,
  CheckSquare,
  Square,
  ChevronRight,
  AlertCircle,
  FileCheck2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Beaker,
  Leaf,
  CheckCircle2,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  MATERIAL_TYPES,
  MaterialTypeKey,
  MaterialPresetItem,
  COMMON_UNITS,
  SIMPLE_INGREDIENT_ROLES,
  SimpleIngredientRoleKey,
  getAllMaterialPresets,
  resolveSimpleIngredientRole,
} from "@/lib/materials-catalog";
import { MaterialRecommendation } from "@/lib/materials-ai-service";

/** Display-only role labels — underlying scientific roles stay unchanged. */
function simplifyRoleLabel(role?: string | null): string {
  const r = (role || "").toLowerCase();
  if (!r) return "Ingredient";
  if (
    r.includes("active botanical") ||
    r.includes("therapeutic constituent") ||
    r.includes("botanical active")
  ) {
    return "Main Ingredient";
  }
  if (r.includes("gelling") || r.includes("matrix builder") || r.includes("stiffening")) {
    return "Gelling Agent";
  }
  if (r.includes("ph neutral") || r.includes("ph adjust") || r.includes("crosslinking")) {
    return "pH Adjuster";
  }
  if (
    r.includes("humectant") ||
    r.includes("plasticizer") ||
    r.includes("moisturizer") ||
    r.includes("emollient") ||
    r.includes("levigating")
  ) {
    return "Moisturizer";
  }
  if (
    r.includes("hydrophilic vehicle") ||
    r.includes("aqueous phase") ||
    r.includes("diluent") ||
    r.includes("continuous") ||
    r.includes("ointment base") ||
    r.includes("occlusive") ||
    r.includes("binder")
  ) {
    return "Base Ingredient";
  }
  if (r.includes("preservative") || r.includes("antimicrobial")) return "Preservative";
  if (
    r.includes("analytical") ||
    r.includes("reference standard") ||
    r.includes("chemical reference")
  ) {
    return "Testing Reference";
  }
  if (r.includes("emulsif")) return "Emulsifier";
  if (r.includes("extraction solvent") || r.includes("solvent")) return "Solvent";
  if (r.includes("lubricant") || r.includes("glidant") || r.includes("sweetener")) {
    return "Processing Aid";
  }
  return role || "Ingredient";
}

function simplifyCategoryLabel(type?: string | null): string {
  switch (type) {
    case "ACTIVE_BOTANICAL":
      return "Main Ingredient";
    case "EXCIPIENT":
      return "Helper Ingredient";
    case "SOLVENT":
      return "Solvent";
    case "PRESERVATIVE":
      return "Preservative";
    case "ANALYTICAL_STANDARD":
      return "Testing Reference";
    default:
      return "Ingredient";
  }
}

function simplifyInventoryStatus(mat: {
  inventoryStatus?: string;
  quantityAvailable?: string | number | null;
}): "Suggested" | "Added" | "Available" {
  const hasStock =
    mat.quantityAvailable != null && String(mat.quantityAvailable).trim() !== "";
  if (hasStock && mat.inventoryStatus !== "PLANNED") return "Available";
  return "Added";
}

export interface MaterialItem {
  id: number;
  projectId?: number;
  materialType: string;
  materialName: string;
  gradeOrPurity?: string;
  supplierOrSource?: string | null;
  lotOrBatchNumber?: string | null;
  storageConditions?: string | null;
  functionDescription?: string | null;
  quantityAvailable?: string | number | null;
  unit?: string | null;
  inventoryStatus?: string;
  source?: string;
  extractFractionId?: string | null;
  scientificJustification?: string | null;
  compatibilityNotes?: string | null;
  updatedAt?: string;
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
    targetApplications?: string;
    intendedPopulation?: string;
  };
  extraction?: {
    extractFractionName?: string;
    extractionMethod?: string;
    extractionSolvent?: string;
    solventConcentration?: string;
  };
  verifiedPhytochemicals?: any[];
  materials: MaterialItem[];
  onSaveMaterial: (material: any, editingId: number | null) => Promise<boolean | void>;
  onDeleteMaterial: (materialId: number) => Promise<boolean | void>;
  onRefreshMaterials?: () => Promise<void>;
  isSaving: boolean;
  /** Reviewer / read-only mode: hide AI suggest, add/edit/delete controls */
  readOnly?: boolean;
}

export default function MaterialsStep4Section({
  project,
  productSelection,
  extraction,
  verifiedPhytochemicals = [],
  materials = [],
  onSaveMaterial,
  onDeleteMaterial,
  onRefreshMaterials,
  isSaving,
  readOnly = false,
}: Props) {
  // Inventory Table Search & Type Filter
  const [tableSearch, setTableSearch] = useState("");
  const [tableTypeFilter, setTableTypeFilter] = useState<string>("ALL");

  // Editing state
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);

  // Manual Form State (simplified Add Ingredient)
  const [formType, setFormType] = useState<MaterialTypeKey>("EXCIPIENT");
  const [formName, setFormName] = useState("");
  const [formRoleKey, setFormRoleKey] = useState<SimpleIngredientRoleKey>("GELLING");
  const [formCustomRole, setFormCustomRole] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formUnit, setFormUnit] = useState("g");
  const [formSource, setFormSource] = useState<"CUSTOM" | "CATALOG_PRESET">("CUSTOM");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Dropdown visibility states
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
  const nameDropdownRef = useRef<HTMLDivElement>(null);

  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  // Detail Modal State
  const [selectedDetailMaterial, setSelectedDetailMaterial] = useState<MaterialItem | null>(null);

  // Form validation / error
  const [formError, setFormError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // =========================================================================
  // AI MATERIALS ASSISTANT STATE
  // =========================================================================
  const [aiRecommendations, setAiRecommendations] = useState<MaterialRecommendation[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedRecIds, setSelectedRecIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
    importedCount?: number;
    skippedCount?: number;
  } | null>(null);
  const [expandedRecIds, setExpandedRecIds] = useState<Set<string>>(new Set());
  const [aiProvenance, setAiProvenance] = useState<"ai" | "deterministic" | null>(null);

  // Normalized set of existing material names in inventory for fast duplicate detection
  const existingMaterialNamesNormalized = useMemo(() => {
    return new Set(materials.map((m) => (m.materialName || "").toLowerCase().trim()));
  }, [materials]);

  // Close name/unit dropdowns on outside click
  useEffect(() => {
    const ac = new AbortController();
    document.addEventListener(
      "mousedown",
      (event: MouseEvent) => {
        const target = event.target as Node;
        if (nameDropdownRef.current && !nameDropdownRef.current.contains(target)) {
          setIsNameDropdownOpen(false);
        }
        if (unitDropdownRef.current && !unitDropdownRef.current.contains(target)) {
          setIsUnitDropdownOpen(false);
        }
      },
      { signal: ac.signal }
    );
    return () => ac.abort();
  }, []);

  const allCatalogPresets = useMemo(
    () =>
      getAllMaterialPresets({
        plantName: project.plantName,
        extractFractionName: extraction?.extractFractionName,
        verifiedPhytochemicals,
      }),
    [project.plantName, extraction?.extractFractionName, verifiedPhytochemicals]
  );

  // Autocomplete suggestions across full catalog (only when typing)
  const filteredCatalogPresets = useMemo(() => {
    const q = formName.trim().toLowerCase();
    if (!q) return [];
    return allCatalogPresets
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.suggestedRole.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allCatalogPresets, formName]);

  const duplicateMatches = useMemo(() => {
    const q = formName.trim().toLowerCase();
    if (!q) return [];
    return materials.filter((m) => {
      if (editingMaterialId && m.id === editingMaterialId) return false;
      return (m.materialName || "").trim().toLowerCase() === q;
    });
  }, [materials, formName, editingMaterialId]);

  const nearDuplicateMatches = useMemo(() => {
    const q = formName.trim().toLowerCase();
    if (q.length < 3) return [];
    return materials
      .filter((m) => {
        if (editingMaterialId && m.id === editingMaterialId) return false;
        const name = (m.materialName || "").trim().toLowerCase();
        return name !== q && (name.includes(q) || q.includes(name));
      })
      .slice(0, 3);
  }, [materials, formName, editingMaterialId]);

  const resolvedRoleOption = useMemo(
    () => SIMPLE_INGREDIENT_ROLES.find((r) => r.key === formRoleKey) || SIMPLE_INGREDIENT_ROLES[1],
    [formRoleKey]
  );

  const resolvedFunctionDescription =
    formRoleKey === "OTHER"
      ? formCustomRole.trim()
      : resolvedRoleOption.functionDescription;

  const isFormValid =
    formName.trim().length > 0 &&
    resolvedFunctionDescription.length > 0 &&
    (formRoleKey !== "OTHER" || formCustomRole.trim().length > 0);

  // Preset Selection Handler for manual form
  const handleSelectPreset = (preset: MaterialPresetItem) => {
    if (readOnly) return;
    setFormName(preset.name);
    setFormType(preset.type);
    setFormUnit(preset.suggestedUnit);
    setSelectedPresetId(preset.id);
    setFormSource("CATALOG_PRESET");
    const mapped = resolveSimpleIngredientRole(preset.type, preset.suggestedRole);
    setFormRoleKey(mapped.key);
    setFormCustomRole(mapped.key === "OTHER" ? preset.suggestedRole : "");
    setIsNameDropdownOpen(false);
    setIsDirty(true);
    setFormError(null);
  };

  const resetManualFormFields = () => {
    setFormType("EXCIPIENT");
    setFormName("");
    setFormRoleKey("GELLING");
    setFormCustomRole("");
    setFormQuantity("");
    setFormUnit("g");
    setFormSource("CUSTOM");
    setSelectedPresetId(null);
    setFormError(null);
    setFormSuccess(null);
  };

  // Open Manual Add Modal for a fresh entry
  const handleOpenManualAddModal = () => {
    if (readOnly) return;
    setEditingMaterialId(null);
    resetManualFormFields();
    setIsManualFormOpen(true);
  };

  // Start Editing a Material in Modal
  const handleStartEditing = (mat: MaterialItem) => {
    if (readOnly) return;
    setEditingMaterialId(mat.id);
    setFormType((mat.materialType as MaterialTypeKey) || "EXCIPIENT");
    setFormName(mat.materialName);
    setFormQuantity(
      mat.quantityAvailable != null && String(mat.quantityAvailable).trim() !== ""
        ? String(mat.quantityAvailable)
        : ""
    );
    setFormUnit(mat.unit || "g");
    const mapped = resolveSimpleIngredientRole(mat.materialType, mat.functionDescription);
    setFormRoleKey(mapped.key);
    setFormCustomRole(mapped.customLabel);
    setFormSource(
      mat.source === "CATALOG_PRESET" || mat.source === "AI_RECOMMENDATION"
        ? "CATALOG_PRESET"
        : "CUSTOM"
    );
    setSelectedPresetId(null);
    setFormError(null);
    setFormSuccess(null);
    setIsManualFormOpen(true);
  };

  // Close Manual / Edit Modal
  const handleCancelEditing = () => {
    setEditingMaterialId(null);
    resetManualFormFields();
    setIsManualFormOpen(false);
    setIsNameDropdownOpen(false);
    setIsUnitDropdownOpen(false);
  };

  // Submit Manual Material Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!formName.trim()) {
      setFormError("Ingredient name is required.");
      return;
    }
    if (!resolvedFunctionDescription) {
      setFormError("Role is required.");
      return;
    }

    setFormError(null);
    setFormSuccess(null);

    // Preserve any previously stored grade/supplier/lot/storage without exposing them in the UI
    const existing =
      editingMaterialId != null
        ? materials.find((m) => m.id === editingMaterialId)
        : null;

    const materialPayload = {
      materialType: formRoleKey === "OTHER" ? formType || "EXCIPIENT" : resolvedRoleOption.materialType,
      materialName: formName.trim(),
      gradeOrPurity: existing?.gradeOrPurity ?? null,
      supplierOrSource: existing?.supplierOrSource ?? null,
      lotOrBatchNumber: existing?.lotOrBatchNumber ?? null,
      storageConditions: existing?.storageConditions ?? null,
      functionDescription: resolvedFunctionDescription,
      quantityAvailable: formQuantity.trim() || null,
      unit: formUnit || "g",
      inventoryStatus: formQuantity.trim() ? "AVAILABLE" : "PLANNED",
      source: formSource === "CATALOG_PRESET" && selectedPresetId ? "CATALOG_PRESET" : "CUSTOM",
    };

    const success = await onSaveMaterial(materialPayload, editingMaterialId);
    if (success !== false) {
      setFormSuccess(
        editingMaterialId ? "Ingredient updated." : "Ingredient added to My Ingredients."
      );
      setIsDirty(false);
      if (onRefreshMaterials) await onRefreshMaterials();
      // Brief success flash then close
      window.setTimeout(() => {
        handleCancelEditing();
      }, 450);
    } else {
      setFormError("Could not save ingredient. Please try again.");
    }
  };

  // =========================================================================
  // AI MATERIALS RECOMMENDATION HANDLERS
  // =========================================================================
  const handleFetchAiRecommendations = async () => {
    if (readOnly) return;
    setIsLoadingAi(true);
    setAiError(null);
    setImportFeedback(null);

    try {
      const payload = {
        plantName: project.plantName,
        plantScientificName: project.plantScientificName,
        extractionMethod: extraction?.extractionMethod,
        extractionSolvent: extraction?.extractionSolvent,
        solventConcentration: extraction?.solventConcentration,
        extractFractionName: extraction?.extractFractionName,
        productType: productSelection?.productType,
        deliveryFormat: productSelection?.deliveryFormat,
        targetApplications: productSelection?.targetApplications,
        intendedPopulation: productSelection?.intendedPopulation,
      };

      const res = await fetch(`/api/researcher/projects/${project.id}/materials/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate AI material recommendations");

      const recs: MaterialRecommendation[] = Array.isArray(data.recommendations) ? data.recommendations : [];
      setAiRecommendations(recs);
      setAiProvenance(data.provenance || "ai");

      // Pre-select all recommendations that are NOT already in the inventory
      const initialSelected = new Set<string>();
      recs.forEach((rec) => {
        const norm = rec.materialName.toLowerCase().trim();
        if (!existingMaterialNamesNormalized.has(norm)) {
          initialSelected.add(rec.id);
        }
      });
      setSelectedRecIds(initialSelected);
    } catch (err: any) {
      console.error("AI recommendation error:", err);
      setAiError(err.message || "Unable to generate recommendations. Please try again.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Toggle selection for a single recommendation
  const handleToggleSelect = (recId: string, isAlreadyInInventory: boolean) => {
    if (readOnly) return;
    if (isAlreadyInInventory) return;
    setSelectedRecIds((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) {
        next.delete(recId);
      } else {
        next.add(recId);
      }
      return next;
    });
  };

  // Select all non-duplicate recommendations
  const handleSelectAll = () => {
    if (readOnly) return;
    const next = new Set<string>();
    aiRecommendations.forEach((rec) => {
      const norm = rec.materialName.toLowerCase().trim();
      if (!existingMaterialNamesNormalized.has(norm)) {
        next.add(rec.id);
      }
    });
    setSelectedRecIds(next);
  };

  // Deselect all
  const handleDeselectAll = () => {
    if (readOnly) return;
    setSelectedRecIds(new Set());
  };

  // Toggle expandable details card
  const handleToggleExpand = (recId: string) => {
    setExpandedRecIds((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) {
        next.delete(recId);
      } else {
        next.add(recId);
      }
      return next;
    });
  };

  // Bulk Import Selected Materials
  const handleImportSelected = async () => {
    if (readOnly) return;
    const selectedList = aiRecommendations.filter((rec) => selectedRecIds.has(rec.id));
    if (selectedList.length === 0) return;

    setIsImporting(true);
    setImportFeedback(null);

    try {
      const payloadMaterials = selectedList.map((rec) => ({
        materialType: rec.materialType,
        materialName: rec.materialName,
        gradeOrPurity: rec.suggestedGrade,
        functionDescription: rec.functionalRole,
        unit: rec.suggestedUnit || "g",
        extractFractionId: rec.extractFractionId || null,
        scientificJustification: rec.scientificJustification,
        compatibilityNotes: rec.compatibilityNotes,
        supplierOrSource: null,
        lotOrBatchNumber: null,
        quantityAvailable: null,
      }));

      const res = await fetch(`/api/researcher/projects/${project.id}/materials/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materials: payloadMaterials }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import materials");

      setImportFeedback({
        type: "success",
        message: data.message || `Successfully imported ${data.importedCount || selectedList.length} materials.`,
        importedCount: data.importedCount,
        skippedCount: data.skippedCount,
      });

      // Clear selection
      setSelectedRecIds(new Set());

      // Refresh inventory table
      if (onRefreshMaterials) {
        await onRefreshMaterials();
      }
    } catch (err: any) {
      console.error("Import error:", err);
      setImportFeedback({
        type: "error",
        message: err.message || "Failed to import selected materials.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered Materials list (category = materialType; search = name + role)
  const filteredMaterials = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return materials.filter((m) => {
      const matchesType = tableTypeFilter === "ALL" || m.materialType === tableTypeFilter;
      if (!matchesType) return false;
      if (!q) return true;
      const roleLabel = simplifyRoleLabel(m.functionDescription).toLowerCase();
      const categoryLabel = simplifyCategoryLabel(m.materialType).toLowerCase();
      return (
        (m.materialName || "").toLowerCase().includes(q) ||
        (m.functionDescription || "").toLowerCase().includes(q) ||
        roleLabel.includes(q) ||
        categoryLabel.includes(q)
      );
    });
  }, [materials, tableTypeFilter, tableSearch]);

  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (openActionMenuId == null) return;
    function closeMenu() {
      setOpenActionMenuId(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("keydown", onKey);
    };
  }, [openActionMenuId]);

  const activeBotanicalCount = materials.filter((m) => m.materialType === "ACTIVE_BOTANICAL").length;
  const excipientCount = materials.filter((m) => m.materialType === "EXCIPIENT").length;
  const solventCount = materials.filter((m) => m.materialType === "SOLVENT").length;
  const preservativeCount = materials.filter((m) => m.materialType === "PRESERVATIVE").length;
  const analyticalCount = materials.filter((m) => m.materialType === "ANALYTICAL_STANDARD").length;

  const currentDosageForm = productSelection?.deliveryFormat || "Topical Hydrogel";
  const currentExtractionMethod = extraction?.extractionMethod || "Standardized Extraction";
  const currentExtractId = extraction?.extractFractionName || "AKP-EXT-001";
  const easeOut = [0.22, 1, 0.36, 1] as const;

  const inventoryFilters = [
    { key: "ALL", label: "All", count: materials.length },
    { key: "ACTIVE_BOTANICAL", label: "Main", count: activeBotanicalCount },
    { key: "EXCIPIENT", label: "Helpers", count: excipientCount },
    { key: "SOLVENT", label: "Solvents", count: solventCount },
    { key: "PRESERVATIVE", label: "Preservatives", count: preservativeCount },
    { key: "ANALYTICAL_STANDARD", label: "Testing", count: analyticalCount },
  ];

  return (
    <div className="space-y-4">
      {/* A. Your Formulation */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-600" />
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-800">
            <Leaf className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
              Your Formulation
            </p>
            <h2 className="truncate text-sm font-bold text-[#0f2c20]">{project.plantName}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6d7f76]">
              <span className="font-semibold text-[#52645d]">{currentDosageForm}</span>
              <span className="font-mono text-[#52645d]">{currentExtractId}</span>
              <span className="truncate text-[#8aa094]">{currentExtractionMethod}</span>
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-900">
            {materials.length} added
          </span>
        </div>
      </motion.section>

      {/* B. Suggested Ingredients */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="flex flex-col gap-3 border-b border-[#e8f0eb] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-sm font-bold tracking-tight text-[#0f2c20]">
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              Suggested Ingredients
            </h3>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              Based on {project.plantName} · {currentDosageForm}
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleFetchAiRecommendations}
              disabled={isLoadingAi || isImporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            >
              <Wand2 className={`h-3.5 w-3.5 ${isLoadingAi ? "animate-spin" : ""}`} />
              {isLoadingAi
                ? "Suggesting..."
                : aiRecommendations.length > 0
                  ? "Regenerate Suggestions"
                  : "Suggest Ingredients"}
            </button>
          )}
        </div>

        <AnimatePresence>
          {aiError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{aiError}</span>
              </div>
              <button type="button" onClick={() => setAiError(null)} className="p-1 text-rose-500 hover:text-rose-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {importFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs ${
                importFeedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {importFeedback.type === "success" ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span className="font-medium">{importFeedback.message}</span>
              </div>
              <button type="button" onClick={() => setImportFeedback(null)} className="p-1 text-[#8aa094] hover:text-[#52645d]">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoadingAi && (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="animate-pulse space-y-2 rounded-2xl border border-[#e8f0eb] bg-[#f7faf8] p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded bg-[#d7e4dc]" />
                  <div className="h-4 w-16 rounded bg-emerald-100" />
                </div>
                <div className="h-3 w-36 rounded bg-[#d7e4dc]" />
                <div className="h-8 w-full rounded bg-[#e8f0eb]" />
              </div>
            ))}
          </div>
        )}

        {!isLoadingAi && aiRecommendations.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-300/80 bg-[#f7faf8] px-4 py-8 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Wand2 className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-[#0f2c20]">
              Get ingredient suggestions for {project.plantName}
            </p>
            {!readOnly && (
              <button
                type="button"
                onClick={handleFetchAiRecommendations}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Suggest Ingredients
              </button>
            )}
          </div>
        )}

        {!isLoadingAi && aiRecommendations.length > 0 && (
          <div className="space-y-3">
            {!readOnly && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e8f0eb] bg-[#f7faf8] px-3 py-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-semibold text-[#0f2c20]">Choose Ingredients</span>
                <span className="text-[#c5d4cb]">|</span>
                <button type="button" onClick={handleSelectAll} className="font-semibold text-emerald-800 hover:underline">
                  Select All
                </button>
                <button type="button" onClick={handleDeselectAll} className="font-semibold text-[#6d7f76] hover:underline">
                  Clear Selection
                </button>
                <span className="text-[#8aa094]">
                  <span className="font-bold text-emerald-800">{selectedRecIds.size}</span> selected
                </span>
              </div>
              <button
                type="button"
                onClick={handleImportSelected}
                disabled={selectedRecIds.size === 0 || isImporting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isImporting ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    Add Selected Ingredients
                    {selectedRecIds.size > 0 ? ` (${selectedRecIds.size})` : ""}
                  </>
                )}
              </button>
            </div>
            )}

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {aiRecommendations.map((rec, idx) => {
                const norm = rec.materialName.toLowerCase().trim();
                const isAlreadyInInventory = existingMaterialNamesNormalized.has(norm);
                const isSelected = selectedRecIds.has(rec.id);
                const isExpanded = expandedRecIds.has(rec.id);

                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.24), ease: easeOut }}
                    onClick={
                      readOnly
                        ? undefined
                        : () => handleToggleSelect(rec.id, isAlreadyInInventory)
                    }
                    className={`flex flex-col justify-between gap-2 rounded-2xl border p-3.5 text-left transition ${
                      readOnly ? "border-[#d7e4dc]/90 bg-white" : "cursor-pointer"
                    } ${
                      isAlreadyInInventory
                        ? "cursor-default border-[#e8f0eb] bg-[#f7faf8] opacity-75"
                        : isSelected
                          ? "border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-400/40 shadow-sm"
                          : readOnly
                            ? "border-[#d7e4dc]/90 bg-white"
                            : "border-[#d7e4dc]/90 bg-white hover:border-emerald-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          {!readOnly && (
                            <input
                              type="checkbox"
                              checked={isSelected || isAlreadyInInventory}
                              disabled={isAlreadyInInventory}
                              onChange={() => {}}
                              className="mt-0.5 cursor-pointer rounded text-emerald-600 focus:ring-emerald-500 disabled:cursor-default"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-bold leading-tight text-[#0f2c20]">
                              {rec.materialName}
                            </span>
                            <span className="block truncate text-[10px] font-medium text-[#6d7f76]">
                              {simplifyRoleLabel(rec.functionalRole)}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="whitespace-nowrap rounded-md border border-[#d7e4dc] bg-[#f7faf8] px-1.5 py-0.5 text-[9px] font-bold text-[#52645d]">
                            {simplifyCategoryLabel(rec.materialType)}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                              isAlreadyInInventory
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {isAlreadyInInventory ? "Added" : "Suggested"}
                          </span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-1.5 overflow-hidden border-t border-[#e8f0eb] pt-1.5 text-[10px] text-[#6d7f76]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {rec.materialType === "ACTIVE_BOTANICAL" && (
                              <p className="font-mono text-[10px] text-emerald-800">
                                Extract: {rec.extractFractionId || currentExtractId}
                              </p>
                            )}
                            <div>
                              <span className="block font-bold text-[#52645d]">Purpose</span>
                              <p>{rec.functionalRole}</p>
                            </div>
                            {rec.scientificJustification && (
                              <div>
                                <span className="block font-bold text-[#52645d]">Details</span>
                                <p>{rec.scientificJustification}</p>
                              </div>
                            )}
                            {rec.compatibilityNotes && (
                              <div>
                                <span className="block font-bold text-[#52645d]">Notes</span>
                                <p>{rec.compatibilityNotes}</p>
                              </div>
                            )}
                            <div className="flex items-center justify-between font-mono text-[9px] text-[#8aa094]">
                              <span>{rec.suggestedGrade}</span>
                              <span>{rec.suggestedUnit}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-end border-t border-[#e8f0eb] pt-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpand(rec.id);
                        }}
                        className="font-semibold text-emerald-800 hover:text-emerald-950"
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.section>

      {/* C. My Ingredients — compact library list */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: easeOut }}
        className="space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="inline-flex flex-wrap items-baseline gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
            My Ingredients
            <span className="text-[11px] font-medium text-[#8aa094]">
              {filteredMaterials.length}
              {tableSearch || tableTypeFilter !== "ALL"
                ? ` shown · ${materials.length} total`
                : materials.length === 1
                  ? " ingredient"
                  : " ingredients"}
            </span>
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search name or role"
                className="w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] py-1.5 pl-8 pr-8 text-[11px] text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 sm:w-48"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8aa094] hover:text-[#52645d]"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={handleOpenManualAddModal}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800"
              >
                <Plus className="h-3 w-3" />
                Add Ingredient
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {inventoryFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTableTypeFilter(f.key)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                tableTypeFilter === f.key
                  ? "bg-[#0f2c20] text-white"
                  : "bg-[#f3f7f4] text-[#52645d] hover:bg-[#e8f0eb]"
              }`}
            >
              {f.label}
              <span
                className={`tabular-nums ${
                  tableTypeFilter === f.key ? "text-white/70" : "text-[#8aa094]"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {filteredMaterials.length > 0 ? (
          <ul className="divide-y divide-[#eef3ef]">
              {filteredMaterials.map((mat) => {
                const status = simplifyInventoryStatus(mat);
                const hasStock =
                  mat.quantityAvailable != null && String(mat.quantityAvailable).trim() !== "";
                const roleLabel = simplifyRoleLabel(mat.functionDescription);
                const menuOpen = openActionMenuId === mat.id;

                return (
                  <li
                    key={mat.id}
                    className="group relative flex items-start gap-2 py-2.5 first:pt-1 last:pb-1"
                  >
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-[13px] font-semibold leading-snug text-[#0f2c20]">
                        {mat.materialName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#6d7f76]">
                        <span>{roleLabel}</span>
                        <span className="mx-1.5 text-[#c5d4cb]">·</span>
                        <span
                          className={
                            status === "Available"
                              ? "font-medium text-emerald-800"
                              : "text-[#6d7f76]"
                          }
                        >
                          {status}
                        </span>
                      </p>
                      {hasStock && (
                        <p className="mt-0.5 font-mono text-[10px] text-[#8aa094]">
                          {mat.quantityAvailable} {mat.unit || "g"}
                        </p>
                      )}
                    </div>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuId(menuOpen ? null : mat.id);
                        }}
                        className="rounded-lg p-1.5 text-[#8aa094] transition hover:bg-[#f3f7f4] hover:text-[#52645d]"
                        aria-label={`Actions for ${mat.materialName}`}
                        aria-expanded={menuOpen}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuOpen && (
                        <div
                          role="menu"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-xl border border-[#d7e4dc] bg-white py-1 shadow-lg"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              setSelectedDetailMaterial(mat);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-[#52645d] hover:bg-[#f7faf8]"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#8aa094]" />
                            View Details
                          </button>
                          {!readOnly && (
                            <>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleStartEditing(mat);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-[#52645d] hover:bg-[#f7faf8]"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-[#8aa094]" />
                                Edit
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  onDeleteMaterial(mat.id);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-[#f7faf8] px-4 py-10 text-center">
            <Boxes className="h-7 w-7 text-[#c5d4cb]" />
            <p className="text-xs font-bold text-[#52645d]">
              {materials.length === 0 ? "No ingredients yet" : "No matching ingredients"}
            </p>
            <p className="max-w-xs text-[11px] text-[#8aa094]">
              {materials.length === 0
                ? "Add suggested ingredients above, or register one manually."
                : "Try another category filter or clear search."}
            </p>
            {materials.length === 0 && !readOnly && (
              <button
                type="button"
                onClick={handleOpenManualAddModal}
                className="mt-1 inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800"
              >
                <Plus className="h-3 w-3" />
                Add Ingredient
              </button>
            )}
          </div>
        )}
      </motion.section>

      {/* Add / Edit material modal */}
      {!readOnly && (isManualFormOpen || editingMaterialId !== null) && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs sm:items-center sm:p-6"
          onClick={handleCancelEditing}
        >
          <div
            id="material-input-form"
            onClick={(e) => e.stopPropagation()}
            className="my-4 flex w-full max-w-md flex-col rounded-2xl border border-[#d7e4dc] bg-white shadow-2xl sm:my-0"
          >
            <div className="flex items-center justify-between border-b border-[#e8f0eb] px-5 py-3.5">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#0f2c20]">
                  {editingMaterialId ? "Edit Ingredient" : "Add Ingredient"}
                </h2>
                <p className="truncate text-[11px] text-[#8aa094]">
                  Type any name · catalog suggestions optional
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelEditing}
                className="rounded-lg p-1.5 text-[#8aa094] transition hover:bg-[#f7faf8] hover:text-[#52645d]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex flex-col">
              <div className="space-y-3.5 px-5 py-4">
                {formError && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-medium text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] font-medium text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {formSuccess}
                  </div>
                )}

                {/* Ingredient name + autocomplete */}
                <div className="relative z-30 space-y-1.5" ref={nameDropdownRef}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Ingredient name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      const next = e.target.value;
                      setFormName(next);
                      setFormSource("CUSTOM");
                      setSelectedPresetId(null);
                      setIsNameDropdownOpen(next.trim().length > 0);
                      setIsDirty(true);
                      setFormError(null);
                    }}
                    onFocus={() => {
                      if (formName.trim()) setIsNameDropdownOpen(true);
                      setIsUnitDropdownOpen(false);
                    }}
                    placeholder="e.g. Carbomer 940 or your custom extract"
                    autoComplete="off"
                    className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2.5 text-sm font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                  {isNameDropdownOpen && filteredCatalogPresets.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[#d7e4dc] bg-white shadow-2xl">
                      <p className="border-b border-[#e8f0eb] bg-[#f7faf8] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#8aa094]">
                        Suggestions · optional
                      </p>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCatalogPresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-emerald-50"
                          >
                            <span className="truncate font-semibold text-[#0f2c20]">
                              {preset.name}
                            </span>
                            <span className="shrink-0 rounded-md bg-[#f7faf8] px-1.5 py-0.5 text-[10px] text-[#8aa094]">
                              {preset.suggestedRole}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {duplicateMatches.length > 0 && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        Possible match already in My Ingredients:{" "}
                        <strong>{duplicateMatches[0].materialName}</strong>. You can still save a
                        custom entry if this is intentional.
                      </span>
                    </div>
                  )}
                  {duplicateMatches.length === 0 && nearDuplicateMatches.length > 0 && (
                    <p className="text-[11px] text-[#8aa094]">
                      Similar: {nearDuplicateMatches.map((m) => m.materialName).join(", ")}
                    </p>
                  )}
                  {formSource === "CUSTOM" && formName.trim() && filteredCatalogPresets.length === 0 && (
                    <p className="text-[11px] text-emerald-800">
                      Will save as a custom ingredient for this project.
                    </p>
                  )}
                </div>

                {/* Role dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formRoleKey}
                    onChange={(e) => {
                      const key = e.target.value as SimpleIngredientRoleKey;
                      setFormRoleKey(key);
                      const opt = SIMPLE_INGREDIENT_ROLES.find((r) => r.key === key);
                      if (opt && key !== "OTHER") {
                        setFormType(opt.materialType);
                        setFormCustomRole("");
                      }
                      setIsDirty(true);
                    }}
                    className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2.5 text-sm font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  >
                    {SIMPLE_INGREDIENT_ROLES.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {formRoleKey === "OTHER" && (
                    <input
                      type="text"
                      value={formCustomRole}
                      onChange={(e) => {
                        setFormCustomRole(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Describe the custom role"
                      className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 text-sm text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    />
                  )}
                </div>

                {/* Optional stock */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Stock quantity{" "}
                    <span className="font-medium normal-case tracking-normal text-[#a3b5ac]">
                      optional
                    </span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formQuantity}
                      onChange={(e) => {
                        setFormQuantity(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. 500"
                      className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2.5 font-mono text-sm font-bold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    />
                    <div className="relative w-24 shrink-0" ref={unitDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                      setIsNameDropdownOpen(false);
                      setIsUnitDropdownOpen(!isUnitDropdownOpen);
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-[#d5e3da] bg-[#f7faf8] px-2.5 py-2.5 font-mono text-sm font-bold text-[#0f2c20]"
                      >
                        {formUnit}
                        <ChevronDown className="h-3.5 w-3.5 text-[#8aa094]" />
                      </button>
                      {isUnitDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-44 w-28 overflow-y-auto rounded-xl border border-[#d7e4dc] bg-white p-1 shadow-2xl">
                          {COMMON_UNITS.map((unitStr) => (
                            <button
                              key={unitStr}
                              type="button"
                              onClick={() => {
                                setFormUnit(unitStr);
                                setIsUnitDropdownOpen(false);
                                setIsDirty(true);
                              }}
                              className={`w-full rounded-lg px-2.5 py-1.5 text-left font-mono text-xs ${
                                formUnit === unitStr
                                  ? "bg-emerald-50 font-bold text-emerald-900"
                                  : "hover:bg-[#f7faf8]"
                              }`}
                            >
                              {unitStr}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#8aa094]">
                    Leave blank to register without stock (status: Added).
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#e8f0eb] bg-[#f7faf8] px-5 py-3">
                <span className="text-[11px] text-[#8aa094]">
                  {formQuantity.trim()
                    ? `Available · ${formQuantity} ${formUnit}`
                    : "No stock · Added"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    disabled={isSaving}
                    className="rounded-xl border border-[#d7e4dc] bg-white px-4 py-2 text-xs font-semibold text-[#52645d] hover:bg-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !isFormValid}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        {editingMaterialId ? "Save changes" : "Add Ingredient"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. MATERIAL SPECIFICATION MODAL (WHEN CLICKING DETAILS)               */}
      {/* ===================================================================== */}
      {selectedDetailMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Ingredient Details
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedDetailMaterial.materialName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailMaterial(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                  <span className="font-semibold text-slate-800">
                    {simplifyCategoryLabel(selectedDetailMaterial.materialType)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                  <span className="font-semibold text-slate-800">
                    {simplifyInventoryStatus(selectedDetailMaterial)}
                  </span>
                  {selectedDetailMaterial.quantityAvailable != null &&
                    String(selectedDetailMaterial.quantityAvailable).trim() !== "" && (
                      <span className="mt-0.5 block font-mono text-[10px] text-slate-500">
                        {selectedDetailMaterial.quantityAvailable}{" "}
                        {selectedDetailMaterial.unit || "g"}
                      </span>
                    )}
                </div>
              </div>

              {selectedDetailMaterial.extractFractionId && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Extraction Reference
                  </span>
                  <span className="font-mono font-bold text-emerald-900 text-xs">
                    {selectedDetailMaterial.extractFractionId}
                  </span>
                </div>
              )}

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Purpose</span>
                <p className="font-semibold text-slate-800">
                  {simplifyRoleLabel(selectedDetailMaterial.functionDescription)}
                </p>
                {selectedDetailMaterial.functionDescription && (
                  <p className="text-[10px] text-slate-500">
                    {selectedDetailMaterial.functionDescription}
                  </p>
                )}
              </div>

              {selectedDetailMaterial.scientificJustification && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Scientific Justification</span>
                  <p className="text-slate-700 leading-relaxed">{selectedDetailMaterial.scientificJustification}</p>
                </div>
              )}

              {selectedDetailMaterial.compatibilityNotes && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Compatibility Notes</span>
                  <p className="text-slate-700 leading-relaxed">{selectedDetailMaterial.compatibilityNotes}</p>
                </div>
              )}

            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetailMaterial(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
