"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Leaf,
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

const easeOut = [0.22, 1, 0.36, 1] as const;

const fieldClass =
  "h-10 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 text-xs font-medium text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15";

function getFormatIcon(name?: string) {
  const f = (name || "").toLowerCase();
  if (f.includes("hydrogel") || f.includes("gel") || f.includes("spray") || f.includes("lotion"))
    return Droplets;
  if (f.includes("cream") || f.includes("ointment")) return Layers;
  if (
    f.includes("syrup") ||
    f.includes("solution") ||
    f.includes("suspension") ||
    f.includes("tea")
  )
    return FlaskConical;
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
}: Props) {
  const [formatSearch, setFormatSearch] = useState("");
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isAppDropdownOpen, setIsAppDropdownOpen] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [customAppInput, setCustomAppInput] = useState("");
  const appDropdownRef = useRef<HTMLDivElement>(null);

  const [modifiedFields, setModifiedFields] = useState<Record<string, boolean>>({
    productType: false,
    deliveryFormat: false,
    targetIndications: false,
    intendedPopulation: false,
    packagingType: false,
    rationale: false,
  });

  const [pendingPreset, setPendingPreset] = useState<ProductFormatPreset | null>(null);
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const rationaleTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (rationaleTextareaRef.current) {
      rationaleTextareaRef.current.style.height = "auto";
      rationaleTextareaRef.current.style.height = `${Math.max(
        180,
        rationaleTextareaRef.current.scrollHeight
      )}px`;
    }
  }, [productSelection.rationale]);

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
      traditionalPreparations:
        plantData?.ethnobotanicalNotes || verifiedPlant?.traditionalPreparations,
      researchTitle: project.title,
      researchObjective: project.researchObjective,
    });
  }, [project, plantData, verifiedPlant]);

  const currentPreset = useMemo(() => {
    const curFormat = (productSelection.deliveryFormat || "").toLowerCase();
    if (!curFormat) return null;
    return (
      PRODUCT_FORMAT_PRESETS.find(
        (p) =>
          p.name.toLowerCase() === curFormat || p.dosageForm.toLowerCase() === curFormat
      ) || null
    );
  }, [productSelection.deliveryFormat]);

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

  const currentRoute: ProductRoute = useMemo(() => {
    if (currentPreset) return currentPreset.route;
    const cat = (productSelection.productType || "").toLowerCase();
    const fmt = (productSelection.deliveryFormat || "").toLowerCase();
    if (
      cat.includes("oral") ||
      fmt.includes("syrup") ||
      fmt.includes("tea") ||
      fmt.includes("capsule") ||
      fmt.includes("tablet")
    ) {
      return "Oral";
    }
    if (
      cat.includes("topical") ||
      fmt.includes("cream") ||
      fmt.includes("gel") ||
      fmt.includes("ointment") ||
      fmt.includes("spray")
    ) {
      return "Topical";
    }
    return "Other";
  }, [currentPreset, productSelection.productType, productSelection.deliveryFormat]);

  const filteredDosageForms = useMemo(() => {
    const cat = productSelection.productType;
    if (cat === "Topical Research Formulation" || cat === "Cosmetic Research Formulation") {
      return PRODUCT_FORMAT_PRESETS.filter((p) => p.route === "Topical");
    }
    if (
      cat === "Oral Research Formulation" ||
      cat === "Phytopharmaceutical Research Product"
    ) {
      return PRODUCT_FORMAT_PRESETS.filter((p) => p.route === "Oral");
    }
    return PRODUCT_FORMAT_PRESETS;
  }, [productSelection.productType]);

  const selectedApplicationList = useMemo(() => {
    if (!productSelection.targetIndications) return [];
    return productSelection.targetIndications
      .split(/[,;]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [productSelection.targetIndications]);

  const filteredTargetApplications = useMemo(() => {
    if (!appSearchQuery.trim()) return TARGET_APPLICATIONS;
    const q = appSearchQuery.toLowerCase();
    return TARGET_APPLICATIONS.filter((app) => app.label.toLowerCase().includes(q));
  }, [appSearchQuery]);

  const isVulnerablePopulation = useMemo(() => {
    const pop = (productSelection.intendedPopulation || "").toLowerCase();
    return (
      pop.includes("pediatric") ||
      pop.includes("adolescent") ||
      pop.includes("infant") ||
      pop.includes("child")
    );
  }, [productSelection.intendedPopulation]);

  const plantPartsLabel =
    plantData?.partsStudied || verifiedPlant?.documentedParts?.join(", ") || "Leaves";

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
      const partsArray =
        verifiedPlant?.documentedParts ||
        (plantData?.partsStudied ? [plantData.partsStudied] : ["Leaves"]);
      updated.rationale = generateScientificRationale({
        plantName: verifiedPlant?.commonName || project.plantName,
        plantScientificName:
          verifiedPlant?.scientificName || project.plantScientificName,
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

  const handleFieldChange = (field: keyof typeof productSelection, value: string) => {
    setModifiedFields((prev) => ({ ...prev, [field]: true }));
    onChange({ ...productSelection, [field]: value });
  };

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

  const handleAiRefineRationale = async () => {
    setIsAiRefining(true);
    setAiNotice(null);
    try {
      const partsArray =
        verifiedPlant?.documentedParts ||
        (plantData?.partsStudied ? [plantData.partsStudied] : ["Leaves"]);
      const res = await fetch(`/api/researcher/projects/${project.id}/product-selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-ai-rationale",
          plantName:
            plantData?.commonName || verifiedPlant?.commonName || project.plantName,
          plantScientificName:
            plantData?.scientificName ||
            verifiedPlant?.scientificName ||
            project.plantScientificName,
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
        setAiNotice("AI refined scientific rationale generated.");
      }
    } catch (err: any) {
      setAiNotice(`Rationale notice: ${err.message || "Using template generator."}`);
    } finally {
      setIsAiRefining(false);
    }
  };

  const handleRestorePresetRationale = () => {
    const partsArray =
      verifiedPlant?.documentedParts ||
      (plantData?.partsStudied ? [plantData.partsStudied] : ["Leaves"]);
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
    <div className="space-y-4">
      {/* Botanical context */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-300" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Leaf className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-sm font-semibold text-[#0f2c20]">
                  {verifiedPlant?.commonName || project.plantName}
                </h2>
                <span className="text-xs italic text-[#6d7f76]">
                  ({verifiedPlant?.scientificName || project.plantScientificName || "Unassigned"})
                </span>
                {verifiedPlant?.family && (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-900">
                    {verifiedPlant.family}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                Parts: <span className="font-semibold text-[#52645d]">{plantPartsLabel}</span>
                <span className="mx-1.5 text-[#d7e4dc]">·</span>
                Linked refs:{" "}
                <span className="font-semibold text-[#52645d]">{linkedLiterature.length}</span>
              </p>
            </div>
          </div>
          {productSelection.deliveryFormat && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11px] font-bold text-teal-900">
              <Package className="h-3.5 w-3.5" />
              {productSelection.deliveryFormat}
            </span>
          )}
        </div>
      </motion.section>

      {/* Recommended formats */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              Recommended Formats
            </h3>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              Aligned with botanical focus and research objective
            </p>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-[#f7faf8] px-3 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              <Search className="h-3 w-3" />
              Browse All ({PRODUCT_FORMAT_PRESETS.length})
              <ChevronDown
                className={`h-3 w-3 transition ${isFormatDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {isFormatDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 z-40 mt-1.5 w-72 space-y-2 rounded-2xl border border-[#d7e4dc] bg-white p-2.5 shadow-xl sm:w-80"
                >
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
                    <input
                      type="text"
                      placeholder="Search format..."
                      value={formatSearch}
                      onChange={(e) => setFormatSearch(e.target.value)}
                      className="h-9 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] pl-8 pr-2 text-xs outline-none focus:border-emerald-600"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                    {(["Topical", "Oral", "Other"] as ProductRoute[]).map((groupRoute) => {
                      const groupPresets = filteredPresets.filter((p) => p.route === groupRoute);
                      if (groupPresets.length === 0) return null;
                      return (
                        <div key={groupRoute}>
                          <p className="rounded-lg bg-[#f7faf8] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                            {groupRoute}
                          </p>
                          {groupPresets.map((preset) => {
                            const isCurrent =
                              Boolean(productSelection.deliveryFormat) &&
                              productSelection.deliveryFormat.toLowerCase() ===
                                preset.dosageForm.toLowerCase();
                            const Icon = getFormatIcon(preset.name);
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleSelectPreset(preset)}
                                className={`mt-0.5 flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-xs transition ${
                                  isCurrent
                                    ? "bg-emerald-50 font-semibold text-emerald-950"
                                    : "text-[#52645d] hover:bg-[#f4f8f5]"
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-1.5">
                                  <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                                  <span className="truncate">{preset.name}</span>
                                </span>
                                {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {scoredRecommendations.slice(0, 4).map((item: ScoredPreset, idx: number) => {
            const isSelected =
              Boolean(productSelection.deliveryFormat) &&
              productSelection.deliveryFormat.toLowerCase() ===
                item.preset.dosageForm.toLowerCase();
            const Icon = getFormatIcon(item.preset.name);
            return (
              <motion.button
                key={item.preset.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 + idx * 0.04 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPreset(item.preset)}
                className={`flex items-center justify-between gap-2 rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? "border-emerald-500 bg-[linear-gradient(165deg,#ecfdf5_0%,#ffffff_70%)] text-emerald-950 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
                    : "border-[#e8f0eb] bg-[#fbfdfb] text-[#0f2c20] hover:border-emerald-300 hover:bg-emerald-50/40"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate text-xs font-semibold">{item.preset.name}</span>
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      <AnimatePresence>
        {pendingPreset && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <p className="leading-snug text-amber-950">
                  You have modified some fields. Apply{" "}
                  <strong>{pendingPreset.name}</strong> defaults, or keep your custom edits?
                </p>
              </div>
              <button type="button" onClick={() => setPendingPreset(null)}>
                <X className="h-3.5 w-3.5 text-amber-700" />
              </button>
            </div>
            <div className="mt-2.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => applyPresetDirectly(pendingPreset, false)}
                className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-950 hover:bg-amber-100"
              >
                Keep My Edits
              </button>
              <button
                type="button"
                onClick={() => applyPresetDirectly(pendingPreset, true)}
                className="rounded-xl bg-[#0f2c20] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#164533]"
              >
                Apply Preset Defaults
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Specs form */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
          Product Specifications
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#52645d]">
                Product Category
              </label>
              <select
                value={productSelection.productType}
                onChange={(e) => handleFieldChange("productType", e.target.value)}
                className={fieldClass}
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-[#52645d]">
                  Dosage Form
                </label>
                <span className="font-mono text-[10px] text-[#8aa094]">
                  {productSelection.deliveryFormat}
                </span>
              </div>
              <select
                value={
                  filteredDosageForms.some(
                    (f) => f.dosageForm === productSelection.deliveryFormat
                  )
                    ? productSelection.deliveryFormat
                    : "Custom"
                }
                onChange={(e) => {
                  if (e.target.value === "Custom") {
                    handleFieldChange("deliveryFormat", "Custom Formulation");
                  } else {
                    const match = PRODUCT_FORMAT_PRESETS.find(
                      (p) => p.dosageForm === e.target.value
                    );
                    if (match) handleSelectPreset(match);
                    else handleFieldChange("deliveryFormat", e.target.value);
                  }
                }}
                className={fieldClass}
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
                  className={`mt-2 ${fieldClass}`}
                />
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#52645d]">
                Intended Target Population
              </label>
              <select
                value={
                  TARGET_POPULATIONS.some(
                    (p) => p.label === productSelection.intendedPopulation
                  )
                    ? productSelection.intendedPopulation
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    handleFieldChange(
                      "intendedPopulation",
                      "Custom Population Specification"
                    );
                  } else {
                    handleFieldChange("intendedPopulation", e.target.value);
                  }
                }}
                className={fieldClass}
              >
                {TARGET_POPULATIONS.map((pop) => (
                  <option key={pop.id} value={pop.label}>
                    {pop.label}
                  </option>
                ))}
                <option value="custom">Other / Custom Population...</option>
              </select>

              <AnimatePresence>
                {isVulnerablePopulation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-900">
                      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                      <span className="leading-snug">
                        <strong>Special Population Caution:</strong> Pediatric/vulnerable
                        cohorts require strict excipient limits and IRB review prior to
                        in-vivo protocols.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-[#52645d]">
                  Target Applications
                </label>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
                  {selectedApplicationList.length} selected
                </span>
              </div>

              <div className="relative" ref={appDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsAppDropdownOpen(!isAppDropdownOpen)}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 text-xs text-[#52645d] transition hover:border-emerald-400"
                >
                  <span>
                    {selectedApplicationList.length > 0
                      ? `${selectedApplicationList.length} application(s) selected`
                      : "Select target applications..."}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-[#8aa094] transition ${
                      isAppDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isAppDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute left-0 right-0 z-40 mt-1.5 space-y-2 rounded-2xl border border-[#d7e4dc] bg-white p-2.5 shadow-xl"
                    >
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
                        <input
                          type="text"
                          placeholder="Filter applications..."
                          value={appSearchQuery}
                          onChange={(e) => setAppSearchQuery(e.target.value)}
                          className="h-9 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] pl-8 pr-2 text-xs outline-none focus:border-emerald-600"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 space-y-0.5 overflow-y-auto">
                        {filteredTargetApplications.map((app) => {
                          const isSelected = selectedApplicationList.includes(app.label);
                          return (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => toggleApplicationTag(app.label)}
                              className={`flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-xs transition ${
                                isSelected
                                  ? "bg-emerald-50 font-semibold text-emerald-950"
                                  : "text-[#52645d] hover:bg-[#f4f8f5]"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                {isSelected ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <span className="w-3.5" />
                                )}
                                {app.label}
                              </span>
                              <span className="font-mono text-[10px] text-[#8aa094]">
                                {app.category}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 border-t border-[#e8f0eb] pt-2">
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
                          className="h-8 flex-1 rounded-lg border border-[#d5e3da] px-2 text-xs outline-none focus:border-emerald-600"
                        />
                        <button
                          type="button"
                          onClick={addCustomApplication}
                          className="rounded-lg bg-[#0f2c20] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#164533]"
                        >
                          Add
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-2 flex min-h-7 flex-wrap gap-1.5">
                {selectedApplicationList.length > 0 ? (
                  selectedApplicationList.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-900"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => toggleApplicationTag(tag)}
                        className="rounded p-0.5 hover:bg-emerald-100 hover:text-rose-600"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] italic text-[#8aa094]">
                    No applications tagged yet.
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#52645d]">
                Packaging &amp; Container
              </label>
              <select
                value={
                  (PACKAGING_OPTIONS[currentRoute] || []).includes(
                    productSelection.packagingType
                  )
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
                className={fieldClass}
              >
                {(PACKAGING_OPTIONS[currentRoute] || PACKAGING_OPTIONS.Topical).map(
                  (pack) => (
                    <option key={pack} value={pack}>
                      {pack}
                    </option>
                  )
                )}
                <option value="custom">Other / Custom Packaging...</option>
              </select>
              <input
                type="text"
                placeholder="Packaging details / barrier notes..."
                value={productSelection.packagingType}
                onChange={(e) => handleFieldChange("packagingType", e.target.value)}
                className={`mt-2 ${fieldClass}`}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Rationale */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              Delivery System Scientific Rationale
            </h3>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              Document route, vehicle, partitioning, and QC requirements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestorePresetRationale}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-white px-3 py-1.5 text-xs font-semibold text-[#52645d] transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleAiRefineRationale}
              disabled={isAiRefining}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 transition hover:bg-teal-100 disabled:opacity-50"
            >
              {isAiRefining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI Assist: Refine
            </button>
          </div>
        </div>

        <AnimatePresence>
          {aiNotice && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-900"
            >
              <span>{aiNotice}</span>
              <button type="button" onClick={() => setAiNotice(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          ref={rationaleTextareaRef}
          rows={7}
          value={productSelection.rationale ?? ""}
          onChange={(e) => handleFieldChange("rationale", e.target.value)}
          placeholder="Document scientific rationale for delivery route, vehicle characteristics, active partitioning, barrier protection, and required quality/safety testing (pH, viscosity, microbial purity)..."
          className="min-h-[180px] w-full resize-y rounded-2xl border border-[#d5e3da] bg-[#fbfdfb] p-3.5 text-xs leading-relaxed text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 sm:text-sm"
        />

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#8aa094]">
          <span>Review before saving. Unverified therapeutic efficacy claims are prohibited.</span>
          <span className="shrink-0 font-mono font-medium tabular-nums text-[#6d7f76]">
            {productSelection.rationale?.length || 0} chars
          </span>
        </div>
      </motion.section>
    </div>
  );
}
