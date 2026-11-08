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
  const easeOut = [0.22, 1, 0.36, 1] as const;

  const inventoryFilters = [
    { key: "ALL", label: "All", count: materials.length },
    { key: "ACTIVE_BOTANICAL", label: "Botanical", count: activeBotanicalCount },
    { key: "EXCIPIENT", label: "Excipients", count: excipientCount },
    { key: "SOLVENT", label: "Solvents", count: solventCount },
    { key: "PRESERVATIVE", label: "Preservative", count: preservativeCount },
    { key: "ANALYTICAL_STANDARD", label: "Analytical", count: analyticalCount },
  ];

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
            <Boxes className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">Materials &amp; Excipients</span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
            {materials.length} cataloged
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          {isSaving ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              Saving...
            </span>
          ) : isDirty ? (
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
            onClick={handleOpenManualAddModal}
            className="inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-[#f7faf8] px-2.5 py-1 text-[11px] font-semibold text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50"
          >
            <Plus className="h-3 w-3" />
            Manual Add
          </button>
        </div>
      </motion.div>

      {/* Project context */}
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
              <h2 className="text-sm font-semibold text-[#0f2c20]">{project.plantName}</h2>
              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                <span className="font-semibold text-[#52645d]">{currentDosageForm}</span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                <span className="font-mono text-[#52645d]">{currentExtractId}</span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                {currentExtractionMethod}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Suggest" },
              { n: "2", label: "Select & add" },
              { n: "3", label: "Review inventory" },
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

      {/* 1. AI Suggest */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="flex flex-col gap-3 border-b border-[#e8f0eb] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                1
              </span>
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              Suggest compatible materials
            </h3>
            <p className="mt-1 text-[11px] text-[#8aa094]">
              Grounded in {project.plantName}, {currentExtractionMethod}, and {currentDosageForm}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {aiProvenance && (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                {aiProvenance === "ai" ? "AI Grounded" : "Compendial"}
              </span>
            )}
            <button
              type="button"
              onClick={handleFetchAiRecommendations}
              disabled={isLoadingAi || isImporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            >
              <Wand2 className={`h-3.5 w-3.5 ${isLoadingAi ? "animate-spin" : ""}`} />
              {isLoadingAi
                ? "Analyzing..."
                : aiRecommendations.length > 0
                  ? "Regenerate"
                  : "AI Suggest Materials"}
            </button>
          </div>
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
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-300/80 bg-[linear-gradient(180deg,#f7faf8_0%,#ffffff_100%)] px-4 py-8 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Wand2 className="h-5 w-5" />
            </div>
            <div className="max-w-md space-y-1">
              <p className="text-sm font-semibold text-[#0f2c20]">
                Build a starter inventory for {project.plantName}
              </p>
              <p className="text-[11px] leading-relaxed text-[#8aa094]">
                One click suggests botanical actives, gelling agents, vehicles, preservatives, and
                analytical standards matched to this hydrogel protocol.
              </p>
            </div>
            <button
              type="button"
              onClick={handleFetchAiRecommendations}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Start with AI Suggest
            </button>
            <p className="text-[10px] text-[#8aa094]">
              Or use <button type="button" onClick={handleOpenManualAddModal} className="font-semibold text-emerald-800 underline-offset-2 hover:underline">Manual Add</button> for a single known material.
            </p>
          </div>
        )}

        {!isLoadingAi && aiRecommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e8f0eb] bg-[#f7faf8] px-3 py-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                  2
                </span>
                <span className="font-semibold text-[#0f2c20]">Select candidates to add</span>
                <span className="text-[#c5d4cb]">|</span>
                <button type="button" onClick={handleSelectAll} className="font-semibold text-emerald-800 hover:underline">
                  Select All
                </button>
                <button type="button" onClick={handleDeselectAll} className="font-semibold text-[#6d7f76] hover:underline">
                  Clear
                </button>
                <span className="text-[#8aa094]">
                  <span className="font-bold text-emerald-800">{selectedRecIds.size}</span> of{" "}
                  {aiRecommendations.length} selected
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
                    Importing...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    Add {selectedRecIds.size > 0 ? selectedRecIds.size : ""} to Inventory
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {aiRecommendations.map((rec, idx) => {
                const norm = rec.materialName.toLowerCase().trim();
                const isAlreadyInInventory = existingMaterialNamesNormalized.has(norm);
                const isSelected = selectedRecIds.has(rec.id);
                const isExpanded = expandedRecIds.has(rec.id);
                const typeSpec = MATERIAL_TYPES.find((t) => t.key === rec.materialType);

                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.24), ease: easeOut }}
                    onClick={() => handleToggleSelect(rec.id, isAlreadyInInventory)}
                    className={`flex cursor-pointer flex-col justify-between gap-2 rounded-2xl border p-3.5 text-left transition ${
                      isAlreadyInInventory
                        ? "cursor-default border-[#e8f0eb] bg-[#f7faf8] opacity-75"
                        : isSelected
                          ? "border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-400/40 shadow-sm"
                          : "border-[#d7e4dc]/90 bg-white hover:border-emerald-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected || isAlreadyInInventory}
                            disabled={isAlreadyInInventory}
                            onChange={() => {}}
                            className="mt-0.5 cursor-pointer rounded text-emerald-600 focus:ring-emerald-500 disabled:cursor-default"
                          />
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-bold leading-tight text-[#0f2c20]">
                              {rec.materialName}
                            </span>
                            <span className="block truncate text-[10px] font-medium text-[#8aa094]">
                              {rec.functionalRole}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${
                              typeSpec?.badgeClass || "border-[#d7e4dc] bg-[#f7faf8] text-[#52645d]"
                            }`}
                          >
                            {typeSpec?.label || rec.materialType}
                          </span>
                          {isAlreadyInInventory && (
                            <span className="rounded bg-[#e8f0eb] px-1.5 py-0.5 text-[8px] font-bold text-[#52645d]">
                              In Inventory
                            </span>
                          )}
                        </div>
                      </div>

                      {rec.materialType === "ACTIVE_BOTANICAL" && (
                        <div className="space-y-0.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-2 text-[10px] text-emerald-900">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Linked Extract</span>
                            <span className="font-mono font-bold text-emerald-800">
                              {rec.extractFractionId || currentExtractId}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-emerald-700">
                            <Beaker className="h-2.5 w-2.5" />
                            {extraction?.extractionSolvent || "Hydroethanolic"}
                          </div>
                        </div>
                      )}

                      <p className="line-clamp-2 text-[11px] leading-relaxed text-[#6d7f76]">
                        {rec.scientificJustification}
                      </p>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-1 overflow-hidden border-t border-[#e8f0eb] pt-1.5 text-[10px] text-[#6d7f76]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div>
                              <span className="block font-bold text-[#52645d]">Compatibility</span>
                              <p>{rec.compatibilityNotes}</p>
                            </div>
                            <div className="flex items-center justify-between font-mono text-[9px] text-[#8aa094]">
                              <span>{rec.suggestedGrade}</span>
                              <span>{rec.suggestedUnit}</span>
                            </div>
                            {rec.supportingReferences?.[0] && (
                              <p className="truncate italic text-[#8aa094]">{rec.supportingReferences[0]}</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#e8f0eb] pt-1.5 text-[10px] text-[#8aa094]">
                      <span className="font-medium">Planned · unverified</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpand(rec.id);
                        }}
                        className="font-semibold text-emerald-800 hover:text-emerald-950"
                      >
                        {isExpanded ? "Hide" : "Details"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-start gap-1.5 rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5 text-[10px] text-[#8aa094]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c5d4cb]" />
              <span>
                Suggestions are for research scoping. Confirm stability and QC on the bench before
                clinical claims.
              </span>
            </div>
          </div>
        )}
      </motion.section>

      {/* 3. Inventory */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: easeOut }}
        className="space-y-2 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
              3
            </span>
            Project inventory
            <span className="font-medium normal-case tracking-normal text-[#8aa094]">
              · {filteredMaterials.length}/{materials.length}
            </span>
          </h3>
          <div className="relative">
            <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-[#8aa094]" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search name, lot, supplier..."
              className="w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] py-1 pl-7 pr-7 text-[11px] text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 sm:w-52"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => setTableSearch("")}
                className="absolute right-1.5 top-1.5 text-[#8aa094] hover:text-[#52645d]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {inventoryFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTableTypeFilter(f.key)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                tableTypeFilter === f.key
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "border border-[#d7e4dc] bg-[#f7faf8] text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50"
              }`}
            >
              {f.label}
              <span
                className={`rounded px-1 py-0.5 text-[9px] font-bold tabular-nums ${
                  tableTypeFilter === f.key ? "bg-white/20 text-white" : "bg-white text-[#8aa094]"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {filteredMaterials.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-[#d7e4dc]/90">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_6.5rem_7rem_minmax(0,1fr)_4.5rem] gap-2 border-b border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#8aa094] md:grid">
              <span>Material</span>
              <span>Status</span>
              <span>Stock</span>
              <span>Supplier / lot</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-[#e8f0eb]">
              <AnimatePresence mode="popLayout">
                {filteredMaterials.map((mat) => {
                  const typeSpec = MATERIAL_TYPES.find((t) => t.key === mat.materialType);
                  const isPlanned = mat.inventoryStatus === "PLANNED" || !mat.quantityAvailable;

                  return (
                    <motion.div
                      key={mat.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: easeOut }}
                      className="grid grid-cols-1 items-center gap-1.5 bg-white px-2.5 py-1.5 transition hover:bg-[#f7faf8] md:grid-cols-[minmax(0,1.4fr)_6.5rem_7rem_minmax(0,1fr)_4.5rem] md:gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-xs font-semibold text-[#0f2c20]">
                            {mat.materialName}
                          </span>
                          <span
                            className={`shrink-0 rounded border px-1 py-0.5 text-[8px] font-bold ${
                              typeSpec?.badgeClass ||
                              "border-[#d7e4dc] bg-[#f7faf8] text-[#52645d]"
                            }`}
                          >
                            {typeSpec?.label || mat.materialType}
                          </span>
                        </div>
                        <p className="truncate text-[10px] text-[#8aa094]">
                          {mat.functionDescription || "Compounding component"}
                          {mat.gradeOrPurity ? ` · ${mat.gradeOrPurity}` : ""}
                        </p>
                      </div>

                      <div>
                        {isPlanned ? (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                            <Clock className="h-2.5 w-2.5" />
                            Planned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">
                            <Check className="h-2.5 w-2.5" />
                            In stock
                          </span>
                        )}
                      </div>

                      <div className="font-mono text-[11px] font-bold text-[#0f2c20]">
                        {isPlanned
                          ? <span className="font-sans text-[10px] font-medium text-amber-700">Pending</span>
                          : `${mat.quantityAvailable} ${mat.unit || "g"}`}
                      </div>

                      <div className="min-w-0 text-[11px]">
                        <span className="block truncate font-medium text-[#52645d]">
                          {mat.supplierOrSource || "Unassigned"}
                        </span>
                        <span className="block truncate font-mono text-[10px] text-[#8aa094]">
                          {mat.lotOrBatchNumber || "Lot pending"}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailMaterial(mat)}
                          className="rounded p-1 text-[#8aa094] transition hover:bg-emerald-50 hover:text-emerald-800"
                          title="View details"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditing(mat)}
                          className="rounded p-1 text-[#8aa094] transition hover:bg-emerald-50 hover:text-emerald-800"
                          title="Edit Material"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMaterial(mat.id)}
                          className="rounded p-1 text-[#8aa094] transition hover:bg-rose-50 hover:text-rose-600"
                          title="Remove Material"
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
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] py-8 text-center">
            <Boxes className="h-7 w-7 text-[#c5d4cb]" />
            <p className="text-xs font-bold text-[#52645d]">
              {materials.length === 0 ? "Inventory is empty" : "No matches for this filter"}
            </p>
            <p className="text-[11px] text-[#8aa094]">
              {materials.length === 0
                ? "Start with AI Suggest, or add one material manually."
                : "Try another type filter or clear search."}
            </p>
            {materials.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchAiRecommendations}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  <Wand2 className="h-3 w-3" />
                  AI Suggest
                </button>
                <button
                  type="button"
                  onClick={handleOpenManualAddModal}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#d7e4dc] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#52645d] hover:border-emerald-400"
                >
                  <Plus className="h-3 w-3 text-emerald-700" />
                  Manual Add
                </button>
              </div>
            )}
          </div>
        )}
      </motion.section>

      {/* Add / Edit material modal */}
      {(isManualFormOpen || editingMaterialId !== null) && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs sm:items-center sm:p-6"
          onClick={handleCancelEditing}
        >
          <div
            id="material-input-form"
            onClick={(e) => e.stopPropagation()}
            className="my-4 flex w-full max-w-2xl flex-col rounded-2xl border border-[#d7e4dc] bg-white shadow-2xl sm:my-0"
          >
            <div className="flex items-center justify-between border-b border-[#e8f0eb] px-5 py-3.5">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#0f2c20]">
                  {editingMaterialId ? "Edit material" : "Add material"}
                </h2>
                <p className="truncate text-[11px] text-[#8aa094]">
                  {project.plantName} · {currentDosageForm}
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
              <div className="space-y-4 px-5 py-4 pb-8">
                {formError && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-medium text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {formError}
                  </div>
                )}

                {/* Type pills */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MATERIAL_TYPES.map((t) => {
                      const isActive = formType === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          title={t.description}
                          onClick={() => {
                            setFormType(t.key);
                            setIsDirty(true);
                          }}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                            isActive
                              ? "bg-emerald-700 text-white"
                              : "border border-[#d7e4dc] bg-[#f7faf8] text-[#52645d] hover:border-emerald-400"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name — full width so preset menu doesn't cover Role */}
                <div className="relative z-30 space-y-1.5" ref={nameDropdownRef}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Material name <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        setNameSearchQuery(e.target.value);
                        setIsDirty(true);
                      }}
                      onFocus={() => {
                        setIsNameDropdownOpen(true);
                        setIsGradeDropdownOpen(false);
                        setIsUnitDropdownOpen(false);
                      }}
                      placeholder="Type or pick a preset"
                      className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 text-sm font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsGradeDropdownOpen(false);
                        setIsUnitDropdownOpen(false);
                        setIsNameDropdownOpen(!isNameDropdownOpen);
                      }}
                      className={`shrink-0 rounded-xl border px-3 transition ${
                        isNameDropdownOpen
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-[#d5e3da] bg-white text-[#8aa094] hover:bg-[#f7faf8]"
                      }`}
                      title="Browse presets"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  {isNameDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[#d7e4dc] bg-white shadow-2xl">
                      <div className="border-b border-[#e8f0eb] bg-[#f7faf8] p-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#8aa094]" />
                          <input
                            type="text"
                            value={nameSearchQuery}
                            onChange={(e) => setNameSearchQuery(e.target.value)}
                            placeholder="Search presets..."
                            className="w-full rounded-lg border border-[#d5e3da] bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {filteredCatalogPresets.length > 0 ? (
                          filteredCatalogPresets.map((preset) => (
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
                          ))
                        ) : (
                          <p className="px-3 py-4 text-center text-xs text-[#8aa094]">
                            No presets — keep typing a custom name
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Role — below name so dropdown never covers it */}
                <div className="space-y-1.5" ref={roleDropdownRef}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Role
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => {
                      setFormRole(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Gelling Agent"
                    className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 text-sm text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* Grade + stock */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="relative z-20 space-y-1.5" ref={gradeDropdownRef}>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Grade
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNameDropdownOpen(false);
                        setIsUnitDropdownOpen(false);
                        setIsGradeDropdownOpen(!isGradeDropdownOpen);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 text-left text-sm font-semibold text-[#0f2c20]"
                    >
                      <span className="truncate">{formGrade}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#8aa094]" />
                    </button>
                    {isGradeDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-[#d7e4dc] bg-white p-1.5 shadow-2xl">
                        {COMMON_GRADES.map((gradeStr) => (
                          <button
                            key={gradeStr}
                            type="button"
                            onClick={() => {
                              setFormGrade(gradeStr);
                              setIsGradeDropdownOpen(false);
                              setIsDirty(true);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs ${
                              formGrade === gradeStr
                                ? "bg-emerald-50 font-bold text-emerald-900"
                                : "text-[#52645d] hover:bg-[#f7faf8]"
                            }`}
                          >
                            {gradeStr}
                            {formGrade === gradeStr && (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Stock{" "}
                      <span className="font-medium normal-case tracking-normal">
                        (blank = Planned)
                      </span>
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={formQuantity}
                        onChange={(e) => {
                          setFormQuantity(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="e.g. 500"
                        className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 font-mono text-sm font-bold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                      />
                      <div className="relative w-24 shrink-0" ref={unitDropdownRef}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNameDropdownOpen(false);
                            setIsGradeDropdownOpen(false);
                            setIsUnitDropdownOpen(!isUnitDropdownOpen);
                          }}
                          className="flex w-full items-center justify-between rounded-xl border border-[#d5e3da] bg-[#f7faf8] px-2.5 py-2 font-mono text-sm font-bold text-[#0f2c20]"
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
                  </div>
                </div>

                {/* Traceability */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5" ref={supplierDropdownRef}>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={formSupplier}
                      onChange={(e) => {
                        setFormSupplier(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Optional"
                      className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 text-sm text-[#0f2c20] outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Lot #
                    </label>
                    <input
                      type="text"
                      value={formLot}
                      onChange={(e) => {
                        setFormLot(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Optional"
                      className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 font-mono text-sm text-[#0f2c20] outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Storage
                    </label>
                    <input
                      type="text"
                      value={formStorage}
                      onChange={(e) => {
                        setFormStorage(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="15–25°C dry"
                      className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 text-sm text-[#0f2c20] outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#e8f0eb] bg-[#f7faf8] px-5 py-3">
                <span className="text-[11px] text-[#8aa094]">
                  {formQuantity.trim()
                    ? `In stock · ${formQuantity} ${formUnit}`
                    : "Status: Planned"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    disabled={isSaving}
                    className="rounded-xl border border-[#d7e4dc] bg-white px-4 py-2 text-xs font-semibold text-[#52645d] hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        {editingMaterialId ? "Save" : "Add"}
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
