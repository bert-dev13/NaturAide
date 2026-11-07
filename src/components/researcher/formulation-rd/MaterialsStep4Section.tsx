"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
} from "lucide-react";
import {
  MATERIAL_TYPES,
  MaterialTypeKey,
  MaterialPresetItem,
  EXCIPIENT_PRESETS,
  SOLVENT_PRESETS,
  PRESERVATIVE_PRESETS,
  COMMON_GRADES,
  COMMON_UNITS,
  FUNCTIONAL_ROLES,
  CURATED_SUPPLIERS,
  getActiveBotanicalPresets,
  getAnalyticalStandardPresets,
} from "@/lib/materials-catalog";
import { MaterialRecommendation } from "@/lib/materials-ai-service";

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
}: Props) {
  // Inventory Table Search & Type Filter
  const [tableSearch, setTableSearch] = useState("");
  const [tableTypeFilter, setTableTypeFilter] = useState<string>("ALL");

  // Editing state
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);

  // Manual Form State
  const [formType, setFormType] = useState<MaterialTypeKey>("EXCIPIENT");
  const [formName, setFormName] = useState("");
  const [formGrade, setFormGrade] = useState<string>("USP / NF (Compendial Grade)");
  const [formSupplier, setFormSupplier] = useState("");
  const [formLot, setFormLot] = useState("");
  const [formQuantity, setFormQuantity] = useState("500");
  const [formUnit, setFormUnit] = useState("g");
  const [formRole, setFormRole] = useState("Gelling Agent");
  const [formStorage, setFormStorage] = useState("Cool, dry place (15-25°C)");
  const [customPurityNote, setCustomPurityNote] = useState("");
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);

  // Dropdown visibility states
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
  const [nameSearchQuery, setNameSearchQuery] = useState("");
  const nameDropdownRef = useRef<HTMLDivElement>(null);

  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
  const gradeDropdownRef = useRef<HTMLDivElement>(null);

  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
      if (nameDropdownRef.current && !nameDropdownRef.current.contains(event.target as Node)) {
        setIsNameDropdownOpen(false);
      }
      if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target as Node)) {
        setIsGradeDropdownOpen(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute all available preset items for current selected Material Type
  const catalogPresetsForCurrentType = useMemo(() => {
    switch (formType) {
      case "ACTIVE_BOTANICAL":
        return getActiveBotanicalPresets(project.plantName, extraction?.extractFractionName);
      case "EXCIPIENT":
        return EXCIPIENT_PRESETS;
      case "SOLVENT":
        return SOLVENT_PRESETS;
      case "PRESERVATIVE":
        return PRESERVATIVE_PRESETS;
      case "ANALYTICAL_STANDARD":
        return getAnalyticalStandardPresets(verifiedPhytochemicals);
      default:
        return [];
    }
  }, [formType, project.plantName, extraction?.extractFractionName, verifiedPhytochemicals]);

  // Filtered preset options based on nameSearchQuery
  const filteredCatalogPresets = useMemo(() => {
    if (!nameSearchQuery.trim()) return catalogPresetsForCurrentType;
    const q = nameSearchQuery.toLowerCase();
    return catalogPresetsForCurrentType.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.suggestedRole.toLowerCase().includes(q)
    );
  }, [catalogPresetsForCurrentType, nameSearchQuery]);

  // Existing unique suppliers across saved materials + curated list
  const availableSuppliers = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.supplierOrSource && m.supplierOrSource.trim()) {
        set.add(m.supplierOrSource.trim());
      }
    });
    CURATED_SUPPLIERS.forEach((s) => set.add(s));
    return Array.from(set);
  }, [materials]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchQuery.trim()) return availableSuppliers;
    const q = supplierSearchQuery.toLowerCase();
    return availableSuppliers.filter((s) => s.toLowerCase().includes(q));
  }, [availableSuppliers, supplierSearchQuery]);

  // Preset Selection Handler for manual form
  const handleSelectPreset = (preset: MaterialPresetItem) => {
    setFormName(preset.name);
    setFormRole(preset.suggestedRole);
    setFormUnit(preset.suggestedUnit);
    setFormGrade(preset.suggestedGrade);
    setIsNameDropdownOpen(false);
    setIsDirty(true);
  };

  // Open Manual Add Modal for a fresh entry
  const handleOpenManualAddModal = () => {
    setEditingMaterialId(null);
    setFormType("EXCIPIENT");
    setFormName("");
    setFormGrade("USP / NF (Compendial Grade)");
    setFormSupplier("");
    setFormLot("");
    setFormQuantity("500");
    setFormUnit("g");
    setFormRole("Gelling Agent");
    setFormStorage("Cool, dry place (15-25°C)");
    setFormError(null);
    setIsManualFormOpen(true);
  };

  // Start Editing a Material in Modal
  const handleStartEditing = (mat: MaterialItem) => {
    setEditingMaterialId(mat.id);
    setFormType((mat.materialType as MaterialTypeKey) || "EXCIPIENT");
    setFormName(mat.materialName);
    setFormGrade(mat.gradeOrPurity || "USP / NF (Compendial Grade)");
    setFormSupplier(mat.supplierOrSource || "");
    setFormLot(mat.lotOrBatchNumber || "");
    setFormQuantity(String(mat.quantityAvailable ?? ""));
    setFormUnit(mat.unit || "g");
    setFormRole(mat.functionDescription || "Compounding Agent");
    setFormStorage(mat.storageConditions || "Cool, dry place (15-25°C)");
    setFormError(null);
    setIsManualFormOpen(true);
  };

  // Close Manual / Edit Modal
  const handleCancelEditing = () => {
    setEditingMaterialId(null);
    setFormName("");
    setFormSupplier("");
    setFormLot("");
    setFormQuantity("500");
    setFormRole("Gelling Agent");
    setFormError(null);
    setIsManualFormOpen(false);
    setIsTypeDropdownOpen(false);
    setIsNameDropdownOpen(false);
    setIsGradeDropdownOpen(false);
    setIsUnitDropdownOpen(false);
  };

  // Submit Manual Material Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Material Name is required. Please select a preset or enter a name.");
      return;
    }

    setFormError(null);
    const materialPayload = {
      materialType: formType,
      materialName: formName.trim(),
      gradeOrPurity: formGrade,
      supplierOrSource: formSupplier.trim() || null,
      lotOrBatchNumber: formLot.trim() || null,
      storageConditions: formStorage,
      functionDescription: formRole.trim(),
      quantityAvailable: formQuantity.trim() || null,
      unit: formUnit,
      inventoryStatus: formQuantity.trim() ? "AVAILABLE" : "PLANNED",
      source: "MANUAL",
    };

    const success = await onSaveMaterial(materialPayload, editingMaterialId);
    if (success !== false) {
      handleCancelEditing();
      setIsDirty(false);
      if (onRefreshMaterials) await onRefreshMaterials();
    }
  };

  // =========================================================================
  // AI MATERIALS RECOMMENDATION HANDLERS
  // =========================================================================
  const handleFetchAiRecommendations = async () => {
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

  // Filtered Materials Table
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesType = tableTypeFilter === "ALL" || m.materialType === tableTypeFilter;
      const matchesSearch =
        !tableSearch.trim() ||
        m.materialName.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (m.supplierOrSource && m.supplierOrSource.toLowerCase().includes(tableSearch.toLowerCase())) ||
        (m.lotOrBatchNumber && m.lotOrBatchNumber.toLowerCase().includes(tableSearch.toLowerCase())) ||
        (m.functionDescription && m.functionDescription.toLowerCase().includes(tableSearch.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [materials, tableTypeFilter, tableSearch]);

  const activeBotanicalCount = materials.filter((m) => m.materialType === "ACTIVE_BOTANICAL").length;
  const excipientCount = materials.filter((m) => m.materialType === "EXCIPIENT").length;
  const solventCount = materials.filter((m) => m.materialType === "SOLVENT").length;
  const preservativeCount = materials.filter((m) => m.materialType === "PRESERVATIVE").length;
  const analyticalCount = materials.filter((m) => m.materialType === "ANALYTICAL_STANDARD").length;

  const currentDosageForm = productSelection?.deliveryFormat || "Topical Hydrogel";
  const currentExtractionMethod = extraction?.extractionMethod || "Standardized Extraction";
  const currentExtractId = extraction?.extractFractionName || "AKP-EXT-001";

  return (
    <div className="space-y-4">
      {/* ===================================================================== */}
      {/* 1. MINIMAL STEP HEADER                                                */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase">
              Section 1 / Step 04 of 06
            </span>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-emerald-600 shrink-0" />
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                Materials &amp; Excipients Inventory
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Context Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">{project.plantName}</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">{currentDosageForm}</span>
              <span>•</span>
              <span className="font-mono text-slate-500 text-[11px]">{currentExtractId}</span>
            </div>

            {/* Saved Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {isDirty ? (
                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved Changes
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. AI MATERIALS ASSISTANT & ONE-CLICK IMPORT (PRIMARY FAST-PATH)       */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-br from-emerald-900/5 via-white to-slate-50 rounded-xl border border-emerald-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-600 text-white shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                AI Materials Assistant
              </h2>
              {aiProvenance && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100/70 text-emerald-800 uppercase tracking-wider">
                  {aiProvenance === "ai" ? "AI Grounded" : "Compendial Baseline"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Contextual candidate materials grounded in your plant identity ({project.plantName}), extraction protocol ({currentExtractionMethod}), and dosage form ({currentDosageForm}).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleFetchAiRecommendations}
              disabled={isLoadingAi || isImporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isLoadingAi ? "animate-spin" : ""}`} />
              <span>
                {isLoadingAi
                  ? "Analyzing Scoping Data..."
                  : aiRecommendations.length > 0
                  ? "Regenerate Suggestions"
                  : "AI Suggest Materials"}
              </span>
            </button>
          </div>
        </div>

        {/* AI Error Alert */}
        {aiError && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{aiError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAiError(null)}
              className="text-rose-500 hover:text-rose-700 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Import Feedback Banner */}
        {importFeedback && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 border ${
              importFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {importFeedback.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{importFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setImportFeedback(null)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* LOADING SKELETON */}
        {isLoadingAi && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-white/70 space-y-2 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-28" />
                  <div className="h-4 bg-emerald-100 rounded w-16" />
                </div>
                <div className="h-3 bg-slate-200 rounded w-36" />
                <div className="h-8 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE (Before click) */}
        {!isLoadingAi && aiRecommendations.length === 0 && (
          <div className="py-5 px-4 text-center rounded-xl bg-white border border-dashed border-emerald-300 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 max-w-md mx-auto">
              <p className="text-xs font-bold text-slate-800">
                Generate Smart Materials for {project.plantName} {currentDosageForm}
              </p>
              <p className="text-[11px] text-slate-500">
                Click <strong>AI Suggest Materials</strong> to automatically evaluate compatible botanical extracts, excipients, continuous vehicles, and analytical standards.
              </p>
            </div>
            <button
              type="button"
              onClick={handleFetchAiRecommendations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Suggest Materials</span>
            </button>
          </div>
        )}

        {/* RECOMMENDATIONS ACTIVE CONTENT */}
        {!isLoadingAi && aiRecommendations.length > 0 && (
          <div className="space-y-2.5">
            {/* Action Bar: Select All, Count, Import Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-100/80">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                >
                  Deselect All
                </button>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] font-medium text-slate-600">
                  <span className="font-bold text-emerald-800">{selectedRecIds.size}</span> of{" "}
                  {aiRecommendations.length} selected
                </span>
              </div>

              <button
                type="button"
                onClick={handleImportSelected}
                disabled={selectedRecIds.size === 0 || isImporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing to Inventory...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      Add {selectedRecIds.size > 0 ? `${selectedRecIds.size} ` : ""}Selected to Inventory
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {aiRecommendations.map((rec) => {
                const norm = rec.materialName.toLowerCase().trim();
                const isAlreadyInInventory = existingMaterialNamesNormalized.has(norm);
                const isSelected = selectedRecIds.has(rec.id);
                const isExpanded = expandedRecIds.has(rec.id);
                const typeSpec = MATERIAL_TYPES.find((t) => t.key === rec.materialType);

                return (
                  <div
                    key={rec.id}
                    onClick={() => handleToggleSelect(rec.id, isAlreadyInInventory)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      isAlreadyInInventory
                        ? "bg-slate-50/80 border-slate-200 opacity-75 cursor-default"
                        : isSelected
                        ? "bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                    }`}
                  >
                    <div className="space-y-1.5">
                      {/* Top Row: Checkbox, Name & Type Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected || isAlreadyInInventory}
                            disabled={isAlreadyInInventory}
                            onChange={() => {}} // handled by card onClick
                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-default"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs block truncate leading-tight">
                              {rec.materialName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block truncate">
                              {rec.functionalRole}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap ${
                              typeSpec?.badgeClass || "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {typeSpec?.label || rec.materialType}
                          </span>
                          {isAlreadyInInventory && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-200 text-slate-700">
                              In Inventory
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Active Botanical Link Info */}
                      {rec.materialType === "ACTIVE_BOTANICAL" && (
                        <div className="p-1.5 rounded-lg bg-emerald-100/60 border border-emerald-200/80 text-[10px] text-emerald-900 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Linked Extract ID:</span>
                            <span className="font-mono font-bold text-emerald-800">
                              {rec.extractFractionId || currentExtractId}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-700 text-[9px]">
                            <span>Method: {extraction?.extractionMethod || "Standardized"}</span>
                            <span>•</span>
                            <span>Solvent: {extraction?.extractionSolvent || "Hydroethanolic"}</span>
                          </div>
                        </div>
                      )}

                      {/* Scientific Justification */}
                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        {rec.scientificJustification}
                      </p>

                      {/* Expandable Compatibility & References */}
                      {isExpanded && (
                        <div
                          className="pt-1.5 border-t border-slate-100 space-y-1 text-[10px] text-slate-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div>
                            <span className="font-bold text-slate-700 block">Compatibility Considerations:</span>
                            <p className="text-slate-600">{rec.compatibilityNotes}</p>
                          </div>
                          <div className="flex items-center justify-between text-slate-400 font-mono text-[9px]">
                            <span>Suggested Grade: {rec.suggestedGrade}</span>
                            <span>Unit: {rec.suggestedUnit}</span>
                          </div>
                          {rec.supportingReferences && rec.supportingReferences.length > 0 && (
                            <div className="pt-0.5">
                              <span className="font-bold text-slate-700 block">Compendial Reference:</span>
                              <span className="italic text-slate-500 block truncate">
                                {rec.supportingReferences[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Status & Expand Toggle */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span className="font-mono font-medium text-slate-500">
                        Status: Planned (Unverified)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpand(rec.id);
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scientific Disclaimer */}
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Candidate materials are recommended for research scoping. Actual formulation stability, organoleptic profile, and clinical efficacy must be confirmed through bench compounding and quality control testing.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. CURRENT PROJECT MATERIALS INVENTORY TABLE                          */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        {/* Table Header & Search Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800">
              Project Materials Inventory ({materials.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search materials, lots, suppliers..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs w-48 sm:w-56 focus:outline-none focus:border-emerald-500"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
              {[
                { key: "ALL", label: `All (${materials.length})` },
                { key: "ACTIVE_BOTANICAL", label: `Botanical (${activeBotanicalCount})` },
                { key: "EXCIPIENT", label: `Excipients (${excipientCount})` },
                { key: "SOLVENT", label: `Solvents (${solventCount})` },
                { key: "PRESERVATIVE", label: `Preservative (${preservativeCount})` },
                { key: "ANALYTICAL_STANDARD", label: `Analytical (${analyticalCount})` },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTableTypeFilter(f.key)}
                  className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    tableTypeFilter === f.key
                      ? "bg-emerald-600 text-white font-semibold shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleOpenManualAddModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Manual Add</span>
            </button>
          </div>
        </div>

        {/* Inventory Records Table */}
        {filteredMaterials.length > 0 ? (
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Grade / Specification</th>
                  <th className="py-2.5 px-3">Stock on Hand</th>
                  <th className="py-2.5 px-3">Supplier &amp; Lot</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((mat) => {
                  const typeSpec = MATERIAL_TYPES.find((t) => t.key === mat.materialType);
                  const isPlanned = mat.inventoryStatus === "PLANNED" || !mat.quantityAvailable;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{mat.materialName}</span>
                          <span className="text-[10px] text-slate-500 font-medium block truncate max-w-xs">
                            {mat.functionDescription || "Compounding component"}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            typeSpec?.badgeClass || "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {typeSpec?.label || mat.materialType}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        <span className="font-medium">{mat.gradeOrPurity || "Compendial Grade"}</span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isPlanned ? (
                          <span className="font-sans text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Planned (Pending Receipt)
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50/70 px-2 py-0.5 rounded border border-emerald-200/60">
                            {mat.quantityAvailable} {mat.unit || "g"}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 min-w-40">
                        <div className="space-y-0.5">
                          <span className="text-slate-800 font-medium block truncate max-w-48">
                            {mat.supplierOrSource || "Unassigned"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            Lot: {mat.lotOrBatchNumber || "Pending"}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isPlanned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            Planned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            Verified Stock
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailMaterial(mat)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer"
                          title="View Material Specification"
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEditing(mat)}
                          className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Edit Material"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteMaterial(mat.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Remove Material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <Boxes className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-700">No Materials in Inventory</p>
              <p className="text-[11px] text-slate-400">
                Use the AI Materials Assistant above to generate suggestions, or click Manual Add.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenManualAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Manual Add Material</span>
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 4. MANUAL ADD / EDIT MATERIAL MODAL (ENHANCED & ENLARGED UI)          */}
      {/* ===================================================================== */}
      {(isManualFormOpen || editingMaterialId !== null) && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={handleCancelEditing}
        >
          <div
            id="material-input-form"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-white to-slate-50/60 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  {editingMaterialId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                      {editingMaterialId ? "Update Inventory Record" : "Materials & Excipients Inventory"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {project.plantName} ({currentDosageForm})
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingMaterialId ? "Edit Cataloged Material" : "Add Material to Inventory"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelEditing}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* SECTION A: MATERIAL CLASSIFICATION SELECTOR CARDS (No overlapping dropdown!) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                      1. Material Classification Type <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Select category to load curated pharmacopeial presets
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {MATERIAL_TYPES.map((t) => {
                      const isActive = formType === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => {
                            setFormType(t.key);
                            setIsTypeDropdownOpen(false);
                            setIsDirty(true);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                            isActive
                              ? "bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                              : "bg-slate-50/60 border-slate-200 hover:bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs font-bold leading-tight ${
                                isActive ? "text-emerald-950" : "text-slate-800"
                              }`}
                            >
                              {t.label}
                            </span>
                            {isActive && (
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 line-clamp-2 leading-snug">
                            {t.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION B: MATERIAL IDENTITY & CURATED PRESETS */}
                <div
                  className={`p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3.5 relative ${
                    isNameDropdownOpen ? "z-40" : "z-10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                      2. Material Identity &amp; Functional Role <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {catalogPresetsForCurrentType.length} curated presets available
                    </span>
                  </div>

                  {/* Quick-Select Preset Chips */}
                  {catalogPresetsForCurrentType.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-slate-500 block">
                        Quick-fill from curated {MATERIAL_TYPES.find((t) => t.key === formType)?.label} catalog:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {catalogPresetsForCurrentType.map((preset) => {
                          const isSelectedPreset =
                            formName.trim().toLowerCase() === preset.name.toLowerCase();
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectPreset(preset)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                isSelectedPreset
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : "bg-white hover:bg-emerald-50/70 text-slate-700 border-slate-200/90 hover:border-emerald-300"
                              }`}
                              title={`${preset.suggestedRole} — ${preset.description}`}
                            >
                              <span>{preset.name}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded ${
                                  isSelectedPreset
                                    ? "bg-emerald-700 text-emerald-50"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {preset.suggestedRole}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Material Name Input + Searchable Preset Dropdown */}
                    <div className="space-y-1.5 relative z-30" ref={nameDropdownRef}>
                      <label className="block font-semibold text-slate-700 text-xs">
                        Material Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => {
                            setFormName(e.target.value);
                            setNameSearchQuery(e.target.value);
                            setIsDirty(true);
                          }}
                          onFocus={() => {
                            setIsGradeDropdownOpen(false);
                            setIsUnitDropdownOpen(false);
                          }}
                          placeholder="Enter custom material name or click a preset above..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsGradeDropdownOpen(false);
                            setIsUnitDropdownOpen(false);
                            setIsNameDropdownOpen(!isNameDropdownOpen);
                          }}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${
                            isNameDropdownOpen
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                              : "border-slate-300 bg-white hover:bg-slate-50 text-slate-600"
                          }`}
                          title="Search preset catalog"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isNameDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 overflow-hidden max-h-56 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                          <div className="p-2 border-b border-slate-100 bg-slate-50">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                              <input
                                type="text"
                                value={nameSearchQuery}
                                onChange={(e) => setNameSearchQuery(e.target.value)}
                                placeholder={`Search ${filteredCatalogPresets.length} curated presets...`}
                                className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="overflow-y-auto divide-y divide-slate-100">
                            {filteredCatalogPresets.length > 0 ? (
                              filteredCatalogPresets.map((preset) => (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => handleSelectPreset(preset)}
                                  className="w-full p-2.5 text-left hover:bg-emerald-50/70 transition-colors cursor-pointer space-y-0.5"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-slate-800 text-xs">{preset.name}</span>
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 shrink-0">
                                      {preset.suggestedRole}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 line-clamp-1">{preset.description}</p>
                                </button>
                              ))
                            ) : (
                              <div className="p-3 text-center text-xs text-slate-400">
                                No matching presets. You can type any custom material name directly.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Functional Role */}
                    <div className="space-y-1.5" ref={roleDropdownRef}>
                      <label className="block font-semibold text-slate-700 text-xs">
                        Functional Role in Formulation <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formRole}
                        onChange={(e) => {
                          setFormRole(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="e.g. Primary Gelling Agent, Humectant, Vehicle"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION C: SPECIFICATION, STOCK, SUPPLIER & STORAGE */}
                <div className="space-y-3">
                  <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                    3. Quality Specification, Stock &amp; Traceability
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Grade / Compendial Standard */}
                    <div className="space-y-1.5 relative z-20" ref={gradeDropdownRef}>
                      <label className="block font-semibold text-slate-700 text-xs">
                        Grade / Compendial Standard
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNameDropdownOpen(false);
                          setIsUnitDropdownOpen(false);
                          setIsGradeDropdownOpen(!isGradeDropdownOpen);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:border-slate-400 text-left text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs"
                      >
                        <span className="truncate">{formGrade}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                            isGradeDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isGradeDropdownOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 p-1.5 divide-y divide-slate-100 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                          {COMMON_GRADES.map((gradeStr) => (
                            <button
                              key={gradeStr}
                              type="button"
                              onClick={() => {
                                setFormGrade(gradeStr);
                                setIsGradeDropdownOpen(false);
                                setIsDirty(true);
                              }}
                              className={`w-full px-3 py-2 text-left rounded-lg text-xs cursor-pointer flex items-center justify-between ${
                                formGrade === gradeStr
                                  ? "bg-emerald-50 text-emerald-900 font-bold"
                                  : "hover:bg-slate-50 text-slate-700 font-medium"
                              }`}
                            >
                              <span>{gradeStr}</span>
                              {formGrade === gradeStr && (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Available Stock & Unit */}
                    <div className="space-y-1.5 relative z-20">
                      <label className="block font-semibold text-slate-700 text-xs">
                        Stock on Hand &amp; Measurement Unit
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={formQuantity}
                          onChange={(e) => {
                            setFormQuantity(e.target.value);
                            setIsDirty(true);
                          }}
                          placeholder="e.g. 500 (leave blank if Planned)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs"
                        />

                        <div className="relative w-32 shrink-0" ref={unitDropdownRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsNameDropdownOpen(false);
                              setIsGradeDropdownOpen(false);
                              setIsUnitDropdownOpen(!isUnitDropdownOpen);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold font-mono text-slate-800 cursor-pointer shadow-2xs"
                          >
                            <span>{formUnit}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                                isUnitDropdownOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isUnitDropdownOpen && (
                            <div className="absolute bottom-full right-0 mb-1.5 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 p-1 w-32 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                              {COMMON_UNITS.map((unitStr) => (
                                <button
                                  key={unitStr}
                                  type="button"
                                  onClick={() => {
                                    setFormUnit(unitStr);
                                    setIsUnitDropdownOpen(false);
                                    setIsDirty(true);
                                  }}
                                  className={`w-full px-3 py-1.5 text-left text-xs font-mono rounded-lg cursor-pointer flex items-center justify-between ${
                                    formUnit === unitStr
                                      ? "bg-emerald-50 text-emerald-900 font-bold"
                                      : "hover:bg-slate-50 text-slate-700"
                                  }`}
                                >
                                  <span>{unitStr}</span>
                                  {formUnit === unitStr && (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supplier, Lot Number & Storage Conditions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Supplier / Source */}
                    <div className="space-y-1.5" ref={supplierDropdownRef}>
                      <label className="block font-semibold text-slate-700 text-xs">
                        Supplier / Internal Depot
                      </label>
                      <input
                        type="text"
                        value={formSupplier}
                        onChange={(e) => {
                          setFormSupplier(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="e.g. Sigma-Aldrich, Internal Depot"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs"
                      />
                    </div>

                    {/* Lot / Accession Number */}
                    <div className="space-y-1.5">
                      <label className="block font-semibold text-slate-700 text-xs">
                        Lot / Batch Accession Number
                      </label>
                      <input
                        type="text"
                        value={formLot}
                        onChange={(e) => {
                          setFormLot(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="e.g. LOT-2026-C940-01"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs"
                      />
                    </div>

                    {/* Storage Conditions */}
                    <div className="space-y-1.5">
                      <label className="block font-semibold text-slate-700 text-xs">
                        Storage &amp; Handling Conditions
                      </label>
                      <input
                        type="text"
                        value={formStorage}
                        onChange={(e) => {
                          setFormStorage(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="e.g. Cool, dry place (15-25°C)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80 rounded-b-2xl shrink-0">
                <span className="text-[11px] text-slate-500">
                  {formQuantity.trim()
                    ? `Inventory status will be recorded as Verified Stock (${formQuantity} ${formUnit}).`
                    : "Inventory status will be recorded as Planned (Pending Receipt)."}
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{editingMaterialId ? "Update Material Record" : "Add Material to Inventory"}</span>
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
                  Material Specification Dossier
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Material Type</span>
                  <span className="font-semibold text-slate-800">{selectedDetailMaterial.materialType}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Stock on Hand</span>
                  {selectedDetailMaterial.inventoryStatus === "PLANNED" || !selectedDetailMaterial.quantityAvailable ? (
                    <span className="font-semibold text-amber-800">Planned / Pending Receipt</span>
                  ) : (
                    <span className="font-mono font-bold text-emerald-800">
                      {selectedDetailMaterial.quantityAvailable} {selectedDetailMaterial.unit}
                    </span>
                  )}
                </div>
              </div>

              {selectedDetailMaterial.extractFractionId && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Linked Extract Fraction
                  </span>
                  <span className="font-mono font-bold text-emerald-900 text-xs">
                    {selectedDetailMaterial.extractFractionId}
                  </span>
                </div>
              )}

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Functional Role</span>
                <p className="font-semibold text-slate-800">{selectedDetailMaterial.functionDescription || "N/A"}</p>
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

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Grade / Specification</span>
                  <span className="font-medium text-slate-800">{selectedDetailMaterial.gradeOrPurity || "USP / NF"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Lot / Accession</span>
                  <span className="font-mono text-slate-800">{selectedDetailMaterial.lotOrBatchNumber || "Pending"}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Supplier / Source</span>
                <p className="font-medium text-slate-800">{selectedDetailMaterial.supplierOrSource || "Unassigned"}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Storage &amp; Handling</span>
                <p className="text-slate-700">{selectedDetailMaterial.storageConditions || "Cool, dry place (15-25°C)"}</p>
              </div>
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
