"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Package,
  Sparkles,
  Search,
  Check,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  Layers,
  FlaskConical,
  ShieldAlert,
  Loader2,
  X,
  Droplets,
  Pill,
  Plus,
} from "lucide-react";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_FORMAT_PRESETS,
  TARGET_APPLICATIONS,
  TARGET_POPULATIONS,
  PACKAGING_OPTIONS,
  ProductFormatPreset,
  ProductRoute,
  recommendProductFormats,
  generateScientificRationale,
  ScoredPreset,
} from "@/lib/product-format-catalog";

interface Props {
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
    researchObjective?: string;
  };
  plantData?: any;
  verifiedPlant?: any;
  linkedLiterature?: any[];
  productSelection: {
    productType: string;
    deliveryFormat: string;
    targetIndications: string;
    intendedPopulation: string;
    packagingType: string;
    rationale: string;
  };
  onChange: (updated: any) => void;
  onSave: () => Promise<void> | void;
  isSaving: boolean;
}

function getFormatIcon(name?: string) {
  const f = (name || "").toLowerCase();
  if (f.includes("hydrogel") || f.includes("gel") || f.includes("spray") || f.includes("lotion")) return Droplets;
  if (f.includes("cream") || f.includes("ointment")) return Layers;
  if (f.includes("syrup") || f.includes("solution") || f.includes("suspension") || f.includes("tea")) return FlaskConical;
  if (f.includes("capsule") || f.includes("tablet")) return Pill;
  if (f.includes("soap")) return Sparkles;
  return Package;
}

export default function ProductSelectionStep2Section({
  project,
  plantData,
  verifiedPlant,
  linkedLiterature = [],
  productSelection,
  onChange,
  onSave,
  isSaving,
}: Props) {
  // Format Search & Dropdown State
  const [formatSearch, setFormatSearch] = useState<string>("");
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Target Applications Dropdown State
  const [isAppDropdownOpen, setIsAppDropdownOpen] = useState<boolean>(false);
  const [appSearchQuery, setAppSearchQuery] = useState<string>("");
  const [customAppInput, setCustomAppInput] = useState<string>("");
  const appDropdownRef = useRef<HTMLDivElement>(null);

  // Field change tracking (track if user has modified preset values)
  const [modifiedFields, setModifiedFields] = useState<Record<string, boolean>>({
    productType: false,
    deliveryFormat: false,
    targetIndications: false,
    intendedPopulation: false,
    packagingType: false,
    rationale: false,
  });

  // Overwrite confirmation modal / alert
  const [pendingPreset, setPendingPreset] = useState<ProductFormatPreset | null>(null);

  // AI Rationale Refinement State
  const [isAiRefining, setIsAiRefining] = useState<boolean>(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const rationaleTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize rationale textarea so all text displays completely without vertical scrolling
  useEffect(() => {
    if (rationaleTextareaRef.current) {
      rationaleTextareaRef.current.style.height = "auto";
      rationaleTextareaRef.current.style.height = `${Math.max(180, rationaleTextareaRef.current.scrollHeight)}px`;
    }
  }, [productSelection.rationale]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFormatDropdownOpen(false);
      }
      if (appDropdownRef.current && !appDropdownRef.current.contains(event.target as Node)) {
        setIsAppDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute focus-aware recommendations
  const scoredRecommendations = useMemo(() => {
    const partsArray: string[] = [];
    if (plantData?.partsStudied) {
      try {
        const parsed = JSON.parse(plantData.partsStudied);
        if (Array.isArray(parsed)) partsArray.push(...parsed);
      } catch {
        partsArray.push(...plantData.partsStudied.split(",").map((s: string) => s.trim()));
      }
    } else if (verifiedPlant?.documentedParts) {
      partsArray.push(...verifiedPlant.documentedParts);
    }

    return recommendProductFormats({
      plantName: verifiedPlant?.commonName || project.plantName,
      plantScientificName: verifiedPlant?.scientificName || project.plantScientificName,
      plantParts: partsArray,
      traditionalUses: plantData?.traditionalUses || verifiedPlant?.traditionalUses,
      traditionalPreparations: plantData?.ethnobotanicalNotes || verifiedPlant?.traditionalPreparations,
      researchTitle: project.title,
      researchObjective: project.researchObjective,
    });
  }, [project, plantData, verifiedPlant]);

  // Current selected preset if matched
  const currentPreset = useMemo(() => {
    const curFormat = (productSelection.deliveryFormat || "").toLowerCase();
    if (!curFormat) return null;
    return (
      PRODUCT_FORMAT_PRESETS.find(
        (p) =>
          p.name.toLowerCase() === curFormat ||
          p.dosageForm.toLowerCase() === curFormat
      ) || null
    );
  }, [productSelection.deliveryFormat]);

  // Filtered presets for searchable dropdown
  const filteredPresets = useMemo(() => {
    if (!formatSearch.trim()) return PRODUCT_FORMAT_PRESETS;
    const q = formatSearch.toLowerCase();
    return PRODUCT_FORMAT_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.route.toLowerCase().includes(q) ||
        p.defaultIndications.some((ind) => ind.toLowerCase().includes(q))
    );
  }, [formatSearch]);

  // Current route
  const currentRoute: ProductRoute = useMemo(() => {
    if (currentPreset) return currentPreset.route;
    const cat = (productSelection.productType || "").toLowerCase();
    const fmt = (productSelection.deliveryFormat || "").toLowerCase();
    if (cat.includes("oral") || fmt.includes("syrup") || fmt.includes("tea") || fmt.includes("capsule") || fmt.includes("tablet")) {
      return "Oral";
    }
    if (cat.includes("topical") || fmt.includes("cream") || fmt.includes("gel") || fmt.includes("ointment") || fmt.includes("spray")) {
      return "Topical";
    }
    return "Other";
  }, [currentPreset, productSelection.productType, productSelection.deliveryFormat]);

  // Available dosage forms filtered by category
  const filteredDosageForms = useMemo(() => {
    const cat = productSelection.productType;
    if (cat === "Topical Research Formulation" || cat === "Cosmetic Research Formulation") {
      return PRODUCT_FORMAT_PRESETS.filter((p) => p.route === "Topical");
    }
    if (cat === "Oral Research Formulation" || cat === "Phytopharmaceutical Research Product") {
      return PRODUCT_FORMAT_PRESETS.filter((p) => p.route === "Oral");
    }
    return PRODUCT_FORMAT_PRESETS;
  }, [productSelection.productType]);

  // Selected target applications parsed as array of chips
  const selectedApplicationList = useMemo(() => {
    if (!productSelection.targetIndications) return [];
    return productSelection.targetIndications
      .split(/[,;]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [productSelection.targetIndications]);

  // Filtered target applications for dropdown
  const filteredTargetApplications = useMemo(() => {
    if (!appSearchQuery.trim()) return TARGET_APPLICATIONS;
    const q = appSearchQuery.toLowerCase();
    return TARGET_APPLICATIONS.filter((app) => app.label.toLowerCase().includes(q));
  }, [appSearchQuery]);

  // Check if vulnerable population is selected
  const isVulnerablePopulation = useMemo(() => {
    const pop = (productSelection.intendedPopulation || "").toLowerCase();
    return pop.includes("pediatric") || pop.includes("adolescent") || pop.includes("infant") || pop.includes("child");
  }, [productSelection.intendedPopulation]);

  // Handle Preset Selection
  const applyPresetDirectly = (preset: ProductFormatPreset, overwriteModified = true) => {
    const updated: any = { ...productSelection };

    if (overwriteModified || !modifiedFields.productType) {
      updated.productType = preset.category;
    }
    if (overwriteModified || !modifiedFields.deliveryFormat) {
      updated.deliveryFormat = preset.dosageForm;
    }
    if (overwriteModified || !modifiedFields.targetIndications) {
      updated.targetIndications = preset.indicationSummary;
    }
    if (overwriteModified || !modifiedFields.intendedPopulation) {
      updated.intendedPopulation = preset.defaultPopulation;
    }
    if (overwriteModified || !modifiedFields.packagingType) {
      updated.packagingType = preset.defaultPackaging;
    }
    if (overwriteModified || !modifiedFields.rationale) {
      const partsArray = verifiedPlant?.documentedParts || (plantData?.partsStudied ? [plantData.partsStudied] : ["Leaves"]);
      updated.rationale = generateScientificRationale({
        plantName: verifiedPlant?.commonName || project.plantName,
        plantScientificName: verifiedPlant?.scientificName || project.plantScientificName,
        deliveryFormat: preset.dosageForm,
        productType: preset.category,
        targetIndications: preset.indicationSummary,
        intendedPopulation: preset.defaultPopulation,
        packagingType: preset.defaultPackaging,
        plantParts: partsArray,
      });
    }

    onChange(updated);
    if (overwriteModified) {
      setModifiedFields({
        productType: false,
        deliveryFormat: false,
        targetIndications: false,
        intendedPopulation: false,
        packagingType: false,
        rationale: false,
      });
    }
    setPendingPreset(null);
    setIsFormatDropdownOpen(false);
  };

  const handleSelectPreset = (preset: ProductFormatPreset) => {
    const hasAnyCustomModifications = Object.values(modifiedFields).some(Boolean);
    if (hasAnyCustomModifications) {
      setPendingPreset(preset);
    } else {
      applyPresetDirectly(preset, true);
    }
  };

  // Field change helper
  const handleFieldChange = (field: keyof typeof productSelection, value: string) => {
    setModifiedFields((prev) => ({ ...prev, [field]: true }));
    onChange({ ...productSelection, [field]: value });
  };

  // Toggle/Remove Target Application Tag
  const toggleApplicationTag = (label: string) => {
    let updatedList: string[];
    if (selectedApplicationList.includes(label)) {
      updatedList = selectedApplicationList.filter((item) => item !== label);
    } else {
      updatedList = [...selectedApplicationList, label];
    }
    handleFieldChange("targetIndications", updatedList.join(", "));
  };

  const addCustomApplication = () => {
    const clean = customAppInput.trim();
    if (!clean) return;
    if (!selectedApplicationList.includes(clean)) {
      const updatedList = [...selectedApplicationList, clean];
      handleFieldChange("targetIndications", updatedList.join(", "));
    }
    setCustomAppInput("");
  };

  // AI Refine Rationale
  const handleAiRefineRationale = async () => {
    setIsAiRefining(true);
    setAiNotice(null);
    try {
      const partsArray = verifiedPlant?.documentedParts || (plantData?.partsStudied ? [plantData.partsStudied] : ["Leaves"]);
      const res = await fetch(`/api/researcher/projects/${project.id}/product-selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-ai-rationale",
          plantName: plantData?.commonName || verifiedPlant?.commonName || project.plantName,
          plantScientificName: plantData?.scientificName || verifiedPlant?.scientificName || project.plantScientificName,
          deliveryFormat: productSelection.deliveryFormat,
          productType: productSelection.productType,
          targetIndications: productSelection.targetIndications,
          intendedPopulation: productSelection.intendedPopulation,
          packagingType: productSelection.packagingType,
          plantParts: partsArray,
          researchObjective: project.researchObjective,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate AI rationale");

      if (data.rationale) {
        handleFieldChange("rationale", data.rationale);
        setAiNotice("AI refined scientific rationale generated!");
      }
    } catch (err: any) {
      setAiNotice(`Rationale notice: ${err.message || "Using template generator."}`);
    } finally {
      setIsAiRefining(false);
    }
  };

  // Reset rationale to preset default
  const handleRestorePresetRationale = () => {
    const partsArray = verifiedPlant?.documentedParts || (plantData?.partsStudied ? [plantData.partsStudied] : ["Leaves"]);
    const standardRationale = generateScientificRationale({
      plantName: verifiedPlant?.commonName || project.plantName,
      plantScientificName: verifiedPlant?.scientificName || project.plantScientificName,
      deliveryFormat: productSelection.deliveryFormat,
      productType: productSelection.productType,
      targetIndications: productSelection.targetIndications,
      intendedPopulation: productSelection.intendedPopulation,
      packagingType: productSelection.packagingType,
      plantParts: partsArray,
    });
    handleFieldChange("rationale", standardRationale);
    setModifiedFields((prev) => ({ ...prev, rationale: false }));
    setAiNotice(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
      {/* ===================================================================== */}
      {/* 1. COMPACT BOTANICAL CONTEXT ROW                                       */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-900">{verifiedPlant?.commonName || project.plantName}</span>
          <span className="text-[11px] text-slate-500 italic font-medium">
            ({verifiedPlant?.scientificName || project.plantScientificName || "Binomial unassigned"})
          </span>
          {verifiedPlant?.family && (
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              {verifiedPlant.family}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>
            Parts: <strong className="text-slate-700">{plantData?.partsStudied || verifiedPlant?.documentedParts?.join(", ") || "Leaves"}</strong>
          </span>
          <span>•</span>
          <span>
            Linked References: <strong className="text-slate-700">{linkedLiterature.length}</strong>
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. COMPACT RECOMMENDED FORMATS & SEARCHABLE DROPDOWN                  */}
      {/* ===================================================================== */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recommended Formats Aligned With Research Focus</span>
          </span>

          {/* Browse All Formats Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>Browse All Formats ({PRODUCT_FORMAT_PRESETS.length})</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isFormatDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isFormatDropdownOpen && (
              <div className="absolute right-0 z-40 mt-1 w-72 sm:w-80 bg-white rounded-xl border border-slate-200 shadow-xl p-2 text-xs space-y-2 animate-in fade-in duration-100">
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search format (e.g. hydrogel, capsule, syrup)..."
                    value={formatSearch}
                    onChange={(e) => setFormatSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100">
                  {(["Topical", "Oral", "Other"] as ProductRoute[]).map((groupRoute) => {
                    const groupPresets = filteredPresets.filter((p) => p.route === groupRoute);
                    if (groupPresets.length === 0) return null;

                    return (
                      <div key={groupRoute} className="pt-1 first:pt-0">
                        <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded">
                          {groupRoute} Formulations
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          {groupPresets.map((preset) => {
                            const isCurrent =
                              Boolean(productSelection.deliveryFormat) &&
                              productSelection.deliveryFormat.toLowerCase() === preset.dosageForm.toLowerCase();
                            const Icon = getFormatIcon(preset.name);
                            return (
                              <div
                                key={preset.id}
                                onClick={() => handleSelectPreset(preset)}
                                className={`px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                                  isCurrent ? "bg-emerald-50 text-emerald-950 font-semibold" : "hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{preset.name}</span>
                                </div>
                                {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Small Selectable Recommendation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {scoredRecommendations.slice(0, 4).map((item: ScoredPreset, idx: number) => {
            const isSelected =
              Boolean(productSelection.deliveryFormat) &&
              productSelection.deliveryFormat.toLowerCase() === item.preset.dosageForm.toLowerCase();
            const Icon = getFormatIcon(item.preset.name);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(item.preset)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500 font-semibold shadow-2xs"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs truncate">{item.preset.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERWRITE CONFIRMATION ALERT */}
      {pendingPreset && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-2 animate-in fade-in duration-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-900 leading-snug">
                You have modified some fields. Apply <strong>{pendingPreset.name}</strong> defaults, or keep your custom edits?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingPreset(null)}
              className="text-amber-700 hover:text-amber-950"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => applyPresetDirectly(pendingPreset, false)}
              className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100 text-[11px]"
            >
              Keep My Edits
            </button>
            <button
              type="button"
              onClick={() => applyPresetDirectly(pendingPreset, true)}
              className="px-3 py-1 rounded-md bg-emerald-700 text-white font-semibold hover:bg-emerald-800 text-[11px] shadow-2xs"
            >
              Apply Preset Defaults
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. PRODUCT SPECIFICATIONS (CLEAN TWO-COLUMN FORM)                      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
        {/* LEFT COLUMN: Category, Dosage Form, Population */}
        <div className="space-y-3">
          {/* Product Category Dropdown */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Product Category
            </label>
            <select
              value={productSelection.productType}
              onChange={(e) => handleFieldChange("productType", e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Dosage Form Dropdown (Filtered) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Dosage Form
              </label>
              <span className="text-[10px] font-medium text-slate-400">
                {productSelection.deliveryFormat}
              </span>
            </div>
            <select
              value={
                filteredDosageForms.some((f) => f.dosageForm === productSelection.deliveryFormat)
                  ? productSelection.deliveryFormat
                  : "Custom"
              }
              onChange={(e) => {
                if (e.target.value === "Custom") {
                  handleFieldChange("deliveryFormat", "Custom Formulation");
                } else {
                  const match = PRODUCT_FORMAT_PRESETS.find((p) => p.dosageForm === e.target.value);
                  if (match) {
                    handleSelectPreset(match);
                  } else {
                    handleFieldChange("deliveryFormat", e.target.value);
                  }
                }
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {filteredDosageForms.map((df) => (
                <option key={df.id} value={df.dosageForm}>
                  {df.dosageForm} ({df.route})
                </option>
              ))}
              <option value="Custom">Custom / Other Dosage Form...</option>
            </select>
            {productSelection.deliveryFormat.includes("Custom") && (
              <input
                type="text"
                placeholder="Enter custom format name..."
                value={productSelection.deliveryFormat}
                onChange={(e) => handleFieldChange("deliveryFormat", e.target.value)}
                className="mt-1.5 w-full px-2.5 py-1 rounded-lg border border-slate-300 text-xs"
              />
            )}
          </div>

          {/* Target Population Dropdown */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Intended Target Population
            </label>
            <select
              value={
                TARGET_POPULATIONS.some((p) => p.label === productSelection.intendedPopulation)
                  ? productSelection.intendedPopulation
                  : "custom"
              }
              onChange={(e) => {
                if (e.target.value === "custom") {
                  handleFieldChange("intendedPopulation", "Custom Population Specification");
                } else {
                  handleFieldChange("intendedPopulation", e.target.value);
                }
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {TARGET_POPULATIONS.map((pop) => (
                <option key={pop.id} value={pop.label}>
                  {pop.label}
                </option>
              ))}
              <option value="custom">Other / Custom Population...</option>
            </select>

            {/* Compact Pediatric / High-Risk Safety Notice */}
            {isVulnerablePopulation && (
              <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px] flex items-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong>Special Population Caution:</strong> Pediatric/vulnerable cohorts require strict excipient limits (e.g. propylene glycol thresholds) and institutional ethics (IRB) review prior to in-vivo protocols.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Target Applications, Packaging */}
        <div className="space-y-3">
          {/* Target Applications (Searchable Multi-Select + Removable Chips) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Target Applications
              </label>
              <span className="text-[10px] text-slate-400">
                {selectedApplicationList.length} selected
              </span>
            </div>

            {/* Dropdown Selector */}
            <div className="relative" ref={appDropdownRef}>
              <button
                type="button"
                onClick={() => setIsAppDropdownOpen(!isAppDropdownOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-emerald-500 text-slate-700 text-xs cursor-pointer shadow-2xs"
              >
                <span className="text-slate-500">
                  {selectedApplicationList.length > 0
                    ? `${selectedApplicationList.length} application(s) selected`
                    : "Select target applications..."}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAppDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isAppDropdownOpen && (
                <div className="absolute left-0 right-0 z-40 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl p-2 text-xs space-y-1.5 animate-in fade-in duration-100">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter applications..."
                      value={appSearchQuery}
                      onChange={(e) => setAppSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {filteredTargetApplications.map((app) => {
                      const isSelected = selectedApplicationList.includes(app.label);
                      return (
                        <div
                          key={app.id}
                          onClick={() => toggleApplicationTag(app.label)}
                          className={`px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-50 text-emerald-950 font-semibold" : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {isSelected ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5" />}
                            <span>{app.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">({app.category})</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Application */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add custom application..."
                      value={customAppInput}
                      onChange={(e) => setCustomAppInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomApplication();
                        }
                      }}
                      className="flex-1 px-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={addCustomApplication}
                      className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Application Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5 min-h-6">
              {selectedApplicationList.length > 0 ? (
                selectedApplicationList.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-medium shadow-2xs"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => toggleApplicationTag(tag)}
                      className="text-emerald-700 hover:text-rose-600 p-0.5 rounded-full hover:bg-emerald-100 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400 italic">No applications tagged yet.</span>
              )}
            </div>
          </div>

          {/* Packaging & Container Dropdown */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Packaging &amp; Container Specification
            </label>
            <select
              value={
                (PACKAGING_OPTIONS[currentRoute] || []).includes(productSelection.packagingType)
                  ? productSelection.packagingType
                  : "custom"
              }
              onChange={(e) => {
                if (e.target.value === "custom") {
                  handleFieldChange("packagingType", "Custom Laboratory Packaging");
                } else {
                  handleFieldChange("packagingType", e.target.value);
                }
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {(PACKAGING_OPTIONS[currentRoute] || PACKAGING_OPTIONS.Topical).map((pack) => (
                <option key={pack} value={pack}>
                  {pack}
                </option>
              ))}
              <option value="custom">Other / Custom Packaging...</option>
            </select>
            <input
              type="text"
              placeholder="Packaging details / barrier notes..."
              value={productSelection.packagingType}
              onChange={(e) => handleFieldChange("packagingType", e.target.value)}
              className="mt-1.5 w-full px-2.5 py-1 rounded-lg border border-slate-300 text-xs"
            />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. SCIENTIFIC RATIONALE (EXPANDED EDITABLE TEXTAREA WITH AI ASSIST)    */}
      {/* ===================================================================== */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block font-bold text-slate-800 text-sm tracking-tight">
            Delivery System Scientific Rationale
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestorePresetRationale}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              title="Reset rationale to baseline catalog preset"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleAiRefineRationale}
              disabled={isAiRefining}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-semibold shadow-2xs disabled:opacity-50 cursor-pointer transition-colors"
              title="Enhance rationale with scientific formulation literature"
            >
              {isAiRefining ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              )}
              <span>AI Assist: Refine</span>
            </button>
          </div>
        </div>

        {aiNotice && (
          <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between shadow-2xs">
            <span className="font-medium">{aiNotice}</span>
            <button
              type="button"
              onClick={() => setAiNotice(null)}
              className="text-teal-600 hover:text-teal-800 font-bold ml-2 cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
        )}

        <textarea
          ref={rationaleTextareaRef}
          rows={7}
          value={productSelection.rationale}
          onChange={(e) => handleFieldChange("rationale", e.target.value)}
          placeholder="Document scientific rationale for delivery route, vehicle characteristics, active partitioning, barrier protection, and required quality/safety testing (pH, viscosity, microbial purity)..."
          className="w-full min-h-[180px] p-3.5 rounded-xl border border-slate-300 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-inner resize-y transition-all"
        />

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Review and approve before saving. Unverified therapeutic efficacy claims are prohibited.</span>
          <span className="font-mono text-slate-500 font-medium">{productSelection.rationale?.length || 0} chars</span>
        </div>
      </div>
    </div>
  );
}
