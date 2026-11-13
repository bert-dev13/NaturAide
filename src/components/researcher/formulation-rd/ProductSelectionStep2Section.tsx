"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Check,
  AlertTriangle,
  Layers,
  FlaskConical,
  ShieldAlert,
  X,
  Droplets,
  Pill,
  Leaf,
  BookOpen,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  PRODUCT_FORMAT_PRESETS,
  TARGET_POPULATIONS,
  ProductFormatPreset,
  ProductRoute,
  generateScientificRationale,
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
  /** Reviewer / read-only mode: hide format browser and disable specification edits */
  readOnly?: boolean;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

const fieldClass =
  "h-9 w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] px-3 text-xs font-medium text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15";

/** Simplified UI labels → stored productType values (existing catalog / DB strings). */
const SIMPLE_CATEGORIES = [
  { label: "Herbal Formulation", value: "Herbal Formulation" },
  { label: "Herbal Cosmetic", value: "Cosmetic Research Formulation" },
  { label: "Herbal Supplement", value: "Oral Research Formulation" },
  { label: "Other", value: "Other / Custom" },
] as const;

/** Simplified UI labels → stored intendedPopulation values. */
const SIMPLE_POPULATIONS = [
  { label: "Adults", value: "Adults (18–65 years)" },
  { label: "Children", value: "Pediatric Population (2–11 years)" },
  { label: "Older Adults", value: "Older Adults (65+ years)" },
  { label: "General Population", value: "General Population (Excluding Infants)" },
  { label: "Other", value: "Other / Custom Population Specification" },
] as const;

/** Chip UI → stored application tags (compatible with existing TARGET_APPLICATIONS labels). */
const SIMPLE_APPLICATIONS = [
  { short: "Anti-inflammatory", value: "Anti-inflammatory research" },
  { short: "Antioxidant", value: "Antioxidant formulation research" },
  { short: "Antimicrobial", value: "Topical antimicrobial research" },
  { short: "Wound Care", value: "Wound-care formulation research" },
  { short: "Skin Protection", value: "Skin-barrier formulation research" },
  { short: "Moisturizing", value: "Moisturizing research" },
  { short: "Digestive Health", value: "Gastrointestinal formulation research" },
] as const;

/** Short packaging choices → canonical stored packaging strings by route. */
const SIMPLE_PACKAGING = [
  {
    key: "bottle",
    label: "Bottle",
    values: {
      Topical: "HDPE Pump Dispenser Bottle (150 mL)",
      Oral: "Type III Amber Glass Bottle (120 mL) with Calibrated Cup",
      Other: "Opaque Amber PET Gargle Bottle (250 mL) with Dose Cap",
    },
  },
  {
    key: "jar",
    label: "Jar",
    values: {
      Topical: "Wide-Mouth Amber Glass Jar (60 g)",
      Oral: "Laboratory Screw-Cap Glass Vial (15 mL)",
      Other: "Sealed Sterile Research Container (50 mL)",
    },
  },
  {
    key: "tube",
    label: "Tube",
    values: {
      Topical: "Laminated Aluminum-Plastic Tube (30 g)",
      Oral: "Laboratory Screw-Cap Glass Vial (15 mL)",
      Other: "Sealed Laboratory Sample Vial with PTFE Septum (20 mL)",
    },
  },
  {
    key: "sachet",
    label: "Sachet",
    values: {
      Topical: "Laboratory Sample Amber Vial (20 mL)",
      Oral: "Multi-Layer Foil Sachet (5 g single dose)",
      Other: "Airtight Foil-Lined Pouch for Powder (100 g)",
    },
  },
  {
    key: "airless",
    label: "Airless Pump",
    values: {
      Topical: "Airless Pump Bottle (50 mL)",
      Oral: "Pharmaceutical Amber PET Bottle (60 mL)",
      Other: "Custom Laboratory Research Packaging",
    },
  },
  {
    key: "spray",
    label: "Spray Bottle",
    values: {
      Topical: "Fine-Mist Spray Dispenser Bottle (100 mL)",
      Oral: "Sealed Amber Dropper Bottle (30 mL)",
      Other: "Custom Laboratory Research Packaging",
    },
  },
  { key: "other", label: "Other", values: { Topical: "", Oral: "", Other: "" } },
] as const;

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

function resolvePackagingKey(packagingType: string, route: ProductRoute): string {
  const current = packagingType || "";
  for (const opt of SIMPLE_PACKAGING) {
    if (opt.key === "other") continue;
    const canonical = opt.values[route];
    if (canonical && current === canonical) return opt.key;
    const anyMatch = Object.values(opt.values).some((v) => v && current === v);
    if (anyMatch) return opt.key;
    if (current.toLowerCase().includes(opt.label.toLowerCase())) return opt.key;
  }
  if (!current) return "bottle";
  return "other";
}

function resolveCategorySelect(productType: string): string {
  if (!productType) return "Herbal Formulation";
  if (SIMPLE_CATEGORIES.some((c) => c.value === productType)) return productType;
  if (productType === "Topical Research Formulation") return "Herbal Formulation";
  if (productType === "Phytopharmaceutical Research Product") {
    return "Oral Research Formulation";
  }
  return "Other / Custom";
}

function mapPresetCategoryToSimple(category: string): string {
  if (category === "Cosmetic Research Formulation") return "Cosmetic Research Formulation";
  if (
    category === "Oral Research Formulation" ||
    category === "Phytopharmaceutical Research Product"
  ) {
    return "Oral Research Formulation";
  }
  if (category === "Herbal Formulation" || category === "Topical Research Formulation") {
    return "Herbal Formulation";
  }
  if (category === "Other / Custom") return "Other / Custom";
  return category;
}

export default function ProductSelectionStep2Section({
  project,
  plantData,
  verifiedPlant,
  linkedLiterature = [],
  productSelection,
  onChange,
  readOnly = false,
}: Props) {
  const selectFieldClass = readOnly
    ? `${fieldClass} cursor-default bg-[#f8fbf9]`
    : fieldClass;

  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const [customAppInput, setCustomAppInput] = useState("");
  const [showCustomApp, setShowCustomApp] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [customPopulation, setCustomPopulation] = useState("");
  const [customPackaging, setCustomPackaging] = useState("");
  const appsDropdownRef = useRef<HTMLDivElement>(null);

  const [modifiedFields, setModifiedFields] = useState<Record<string, boolean>>({
    productType: false,
    deliveryFormat: false,
    targetIndications: false,
    intendedPopulation: false,
    packagingType: false,
    rationale: false,
  });

  const [pendingPreset, setPendingPreset] = useState<ProductFormatPreset | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        appsDropdownRef.current &&
        !appsDropdownRef.current.contains(event.target as Node)
      ) {
        setAppsDropdownOpen(false);
        setShowCustomApp(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      cat.includes("cosmetic") ||
      fmt.includes("cream") ||
      fmt.includes("gel") ||
      fmt.includes("ointment") ||
      fmt.includes("spray")
    ) {
      return "Topical";
    }
    return "Other";
  }, [currentPreset, productSelection.productType, productSelection.deliveryFormat]);

  const selectedApplicationList = useMemo(() => {
    if (!productSelection.targetIndications) return [];
    return productSelection.targetIndications
      .split(/[,;]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [productSelection.targetIndications]);

  const knownAppValues = useMemo(
    () => new Set(SIMPLE_APPLICATIONS.map((a) => a.value)),
    []
  );

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

  const categorySelectValue = useMemo(
    () => resolveCategorySelect(productSelection.productType || ""),
    [productSelection.productType]
  );

  const populationSelectValue = useMemo(() => {
    const match = SIMPLE_POPULATIONS.find((p) => p.value === productSelection.intendedPopulation);
    if (match) return match.value;
    const legacy = TARGET_POPULATIONS.find(
      (p) => p.label === productSelection.intendedPopulation
    );
    if (legacy) {
      const mapped = SIMPLE_POPULATIONS.find((p) => p.value === legacy.label);
      if (mapped) return mapped.value;
    }
    if (!productSelection.intendedPopulation) return SIMPLE_POPULATIONS[0].value;
    return "Other / Custom Population Specification";
  }, [productSelection.intendedPopulation]);

  const packagingKey = useMemo(
    () => resolvePackagingKey(productSelection.packagingType || "", currentRoute),
    [productSelection.packagingType, currentRoute]
  );

  const dosageFormSelectValue = useMemo(() => {
    if (
      PRODUCT_FORMAT_PRESETS.some((f) => f.dosageForm === productSelection.deliveryFormat)
    ) {
      return productSelection.deliveryFormat;
    }
    if (!productSelection.deliveryFormat) {
      return PRODUCT_FORMAT_PRESETS[0]?.dosageForm || "";
    }
    return "__custom__";
  }, [productSelection.deliveryFormat]);

  useEffect(() => {
    if (categorySelectValue === "Other / Custom" && productSelection.productType) {
      const isPrimary = SIMPLE_CATEGORIES.some(
        (c) => c.value === productSelection.productType && c.label !== "Other"
      );
      if (!isPrimary && productSelection.productType !== "Other / Custom") {
        setCustomCategory(productSelection.productType);
      }
    }
  }, [categorySelectValue, productSelection.productType]);

  useEffect(() => {
    if (
      populationSelectValue === "Other / Custom Population Specification" &&
      productSelection.intendedPopulation &&
      !SIMPLE_POPULATIONS.some(
        (p) =>
          p.value === productSelection.intendedPopulation && p.label !== "Other"
      )
    ) {
      setCustomPopulation(productSelection.intendedPopulation);
    }
  }, [populationSelectValue, productSelection.intendedPopulation]);

  useEffect(() => {
    if (packagingKey === "other" && productSelection.packagingType) {
      setCustomPackaging(productSelection.packagingType);
    }
  }, [packagingKey, productSelection.packagingType]);

  const applyPresetDirectly = (preset: ProductFormatPreset, overwriteModified = true) => {
    if (readOnly) return;
    const updated: any = { ...productSelection };

    if (overwriteModified || !modifiedFields.productType) {
      updated.productType = mapPresetCategoryToSimple(preset.category);
    }
    if (overwriteModified || !modifiedFields.deliveryFormat) {
      updated.deliveryFormat = preset.dosageForm;
    }
    if (overwriteModified || !modifiedFields.targetIndications) {
      const chipMatches = preset.defaultIndications.filter((ind) =>
        SIMPLE_APPLICATIONS.some((a) => a.value === ind)
      );
      updated.targetIndications =
        chipMatches.length > 0 ? chipMatches.join(", ") : preset.indicationSummary;
    }
    if (overwriteModified || !modifiedFields.intendedPopulation) {
      updated.intendedPopulation = preset.defaultPopulation;
    }
    if (overwriteModified || !modifiedFields.packagingType) {
      updated.packagingType = preset.defaultPackaging;
    }
    // Preserve rationale column for historical/downstream use without showing it in the UI.
    if (overwriteModified || !modifiedFields.rationale) {
      const partsArray =
        verifiedPlant?.documentedParts ||
        (plantData?.partsStudied ? [plantData.partsStudied] : ["Leaves"]);
      updated.rationale = generateScientificRationale({
        plantName: verifiedPlant?.commonName || project.plantName,
        plantScientificName:
          verifiedPlant?.scientificName || project.plantScientificName,
        deliveryFormat: updated.deliveryFormat || preset.dosageForm,
        productType: updated.productType,
        targetIndications: updated.targetIndications,
        intendedPopulation: updated.intendedPopulation || preset.defaultPopulation,
        packagingType: updated.packagingType || preset.defaultPackaging,
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
  };

  const handleSelectPreset = (preset: ProductFormatPreset) => {
    if (readOnly) return;
    const hasAnyCustomModifications = Object.values(modifiedFields).some(Boolean);
    if (hasAnyCustomModifications) {
      setPendingPreset(preset);
    } else {
      applyPresetDirectly(preset, true);
    }
  };

  const handleFieldChange = (field: keyof typeof productSelection, value: string) => {
    if (readOnly) return;
    setModifiedFields((prev) => ({ ...prev, [field]: true }));
    onChange({ ...productSelection, [field]: value });
  };

  const handleFormatDropdownChange = (presetId: string) => {
    if (readOnly || !presetId) return;
    const preset = PRODUCT_FORMAT_PRESETS.find((p) => p.id === presetId);
    if (preset) handleSelectPreset(preset);
  };

  const toggleApplicationTag = (value: string) => {
    if (readOnly) return;
    const updatedList = selectedApplicationList.includes(value)
      ? selectedApplicationList.filter((item) => item !== value)
      : [...selectedApplicationList, value];
    handleFieldChange("targetIndications", updatedList.join(", "));
  };

  const addCustomApplication = () => {
    if (readOnly) return;
    const clean = customAppInput.trim();
    if (!clean) return;
    if (!selectedApplicationList.includes(clean)) {
      handleFieldChange("targetIndications", [...selectedApplicationList, clean].join(", "));
    }
    setCustomAppInput("");
    setShowCustomApp(false);
  };

  const customApplications = selectedApplicationList.filter(
    (item) => !knownAppValues.has(item)
  );

  const selectedApplicationLabels = selectedApplicationList.map((value) => {
    const known = SIMPLE_APPLICATIONS.find((a) => a.value === value);
    return known?.short || value;
  });

  const formatSelectValue = currentPreset?.id || "";

  const handleDosageFormChange = (value: string) => {
    if (readOnly) return;
    if (value === "__custom__") {
      handleFieldChange("deliveryFormat", "Custom Formulation");
      return;
    }
    // Update dosage form only — do not overwrite category/population/packaging/apps.
    setModifiedFields((prev) => ({ ...prev, deliveryFormat: true }));
    onChange({ ...productSelection, deliveryFormat: value });
  };

  const handleCategoryChange = (value: string) => {
    if (readOnly) return;
    if (value === "Other / Custom") {
      handleFieldChange("productType", customCategory.trim() || "Other / Custom");
    } else {
      handleFieldChange("productType", value);
      setCustomCategory("");
    }
  };

  const handlePopulationChange = (value: string) => {
    if (readOnly) return;
    if (value === "Other / Custom Population Specification") {
      handleFieldChange(
        "intendedPopulation",
        customPopulation.trim() || "Other / Custom Population Specification"
      );
    } else {
      handleFieldChange("intendedPopulation", value);
      setCustomPopulation("");
    }
  };

  const defaultCustomPackaging =
    currentRoute === "Topical"
      ? "Custom Topical Packaging"
      : currentRoute === "Oral"
        ? "Custom Oral Packaging"
        : "Custom Laboratory Research Packaging";

  const handlePackagingKeyChange = (key: string) => {
    if (readOnly) return;
    if (key === "other") {
      handleFieldChange(
        "packagingType",
        customPackaging.trim() || defaultCustomPackaging
      );
      return;
    }
    const opt = SIMPLE_PACKAGING.find((p) => p.key === key);
    if (!opt || opt.key === "other") return;
    handleFieldChange("packagingType", opt.values[currentRoute]);
    setCustomPackaging("");
  };

  const plantImage = verifiedPlant?.imageUrl || null;
  const plantCommon = verifiedPlant?.commonName || project.plantName;
  const plantSci =
    verifiedPlant?.scientificName || project.plantScientificName || "Unassigned";

  return (
    <div className="space-y-4">
      {/* Compact plant summary */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-600" />
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#d7e4dc] bg-[#edf5f0]">
            {plantImage ? (
              <Image src={plantImage} alt={plantCommon} fill sizes="48px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-emerald-700">
                <Leaf className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-[#0f2c20]">{plantCommon}</h2>
            <p className="truncate text-xs italic text-[#6d7f76]">{plantSci}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#8aa094]">
              {verifiedPlant?.family && <span>{verifiedPlant.family}</span>}
              <span>Parts: {plantPartsLabel}</span>
              <span className="inline-flex items-center gap-0.5">
                <BookOpen className="h-3 w-3" />
                {linkedLiterature.length} refs
              </span>
            </p>
          </div>
        </div>
      </motion.section>

      {/* Product Format + Target Applications (combined) */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.03, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Product Format dropdown */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#52645d]">
              <Package className="h-3.5 w-3.5 text-emerald-700" />
              Product Format
            </label>
            <select
              value={formatSelectValue}
              onChange={(e) => handleFormatDropdownChange(e.target.value)}
              className={selectFieldClass}
              disabled={readOnly}
            >
              <option value="">
                {productSelection.deliveryFormat && !formatSelectValue
                  ? productSelection.deliveryFormat
                  : "Select product format…"}
              </option>
              {(["Topical", "Oral", "Other"] as ProductRoute[]).map((groupRoute) => {
                const groupPresets = PRODUCT_FORMAT_PRESETS.filter((p) => p.route === groupRoute);
                if (groupPresets.length === 0) return null;
                return (
                  <optgroup key={groupRoute} label={groupRoute}>
                    {groupPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {!formatSelectValue && productSelection.deliveryFormat ? (
              <p className="mt-1 text-[10px] text-[#8aa094]">
                Current: {productSelection.deliveryFormat}
              </p>
            ) : null}
          </div>

          {/* Target Applications dropdown */}
          <div ref={appsDropdownRef} className="relative">
            <label className="mb-1.5 block text-[11px] font-semibold text-[#52645d]">
              Target Applications
            </label>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && setAppsDropdownOpen((o) => !o)}
              className={`${selectFieldClass} flex items-center justify-between gap-2 text-left ${
                readOnly ? "" : "cursor-pointer"
              }`}
            >
              <span className="truncate">
                {selectedApplicationList.length > 0
                  ? `${selectedApplicationList.length} selected`
                  : "Select applications…"}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-[#8aa094] transition ${
                  appsDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {appsDropdownOpen && !readOnly && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 z-40 mt-1.5 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-[#d7e4dc] bg-white p-2 shadow-xl"
                >
                  {SIMPLE_APPLICATIONS.map((app) => {
                    const selected = selectedApplicationList.includes(app.value);
                    return (
                      <button
                        key={app.value}
                        type="button"
                        onClick={() => toggleApplicationTag(app.value)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                          selected
                            ? "bg-emerald-50 font-semibold text-emerald-950"
                            : "text-[#52645d] hover:bg-[#f4f8f5]"
                        }`}
                      >
                        <span>{app.short}</span>
                        {selected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      </button>
                    );
                  })}

                  {customApplications.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleApplicationTag(tag)}
                      className="flex w-full items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-2 text-left text-xs font-semibold text-emerald-950"
                    >
                      <span>{tag}</span>
                      <X className="h-3.5 w-3.5 text-emerald-700" />
                    </button>
                  ))}

                  {!showCustomApp ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomApp(true)}
                      className="w-full rounded-lg border border-dashed border-[#c5d4cb] px-2.5 py-2 text-left text-xs font-semibold text-[#6d7f76] hover:border-emerald-400"
                    >
                      Other / Custom…
                    </button>
                  ) : (
                    <div className="space-y-1.5 rounded-lg border border-[#e8f0eb] p-2">
                      <input
                        type="text"
                        value={customAppInput}
                        onChange={(e) => setCustomAppInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomApplication();
                          }
                        }}
                        placeholder="Custom application…"
                        className="h-8 w-full rounded-lg border border-[#d5e3da] px-2.5 text-xs outline-none focus:border-emerald-600"
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={addCustomApplication}
                          className="rounded-lg bg-[#0f2c20] px-2.5 py-1 text-[11px] font-semibold text-white"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomApp(false);
                            setCustomAppInput("");
                          }}
                          className="text-[11px] font-semibold text-[#8aa094]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {selectedApplicationLabels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedApplicationLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-3 text-[10px] text-[#8aa094]">
          Intended research applications — not established therapeutic claims.
        </p>
      </motion.section>

      <AnimatePresence>
        {pendingPreset && !readOnly && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <p className="text-amber-950">
                  Apply <strong>{pendingPreset.name}</strong> defaults, or keep your edits?
                </p>
              </div>
              <button type="button" onClick={() => setPendingPreset(null)}>
                <X className="h-3.5 w-3.5 text-amber-700" />
              </button>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => applyPresetDirectly(pendingPreset, false)}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-950"
              >
                Keep My Edits
              </button>
              <button
                type="button"
                onClick={() => applyPresetDirectly(pendingPreset, true)}
                className="rounded-lg bg-[#0f2c20] px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Apply Defaults
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Details: Category, Dosage Form, Population, Packaging */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.06, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <h3 className="mb-3 text-sm font-bold tracking-tight text-[#0f2c20]">Product Details</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 1. Category */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Product Category
            </label>
            <select
              value={categorySelectValue}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={selectFieldClass}
              disabled={readOnly}
            >
              {SIMPLE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {categorySelectValue === "Other / Custom" && !readOnly && (
              <input
                type="text"
                placeholder="Custom category..."
                value={customCategory}
                onChange={(e) => {
                  setCustomCategory(e.target.value);
                  handleFieldChange("productType", e.target.value || "Other / Custom");
                }}
                className={`mt-1.5 ${fieldClass}`}
              />
            )}
          </div>

          {/* 2. Dosage Form */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Dosage Form
            </label>
            <select
              value={dosageFormSelectValue}
              onChange={(e) => handleDosageFormChange(e.target.value)}
              className={selectFieldClass}
              disabled={readOnly}
            >
              {PRODUCT_FORMAT_PRESETS.map((df) => (
                <option key={df.id} value={df.dosageForm}>
                  {df.dosageForm}
                </option>
              ))}
              <option value="__custom__">Other / Custom...</option>
            </select>
            {dosageFormSelectValue === "__custom__" && !readOnly && (
              <input
                type="text"
                placeholder="Custom dosage form..."
                value={productSelection.deliveryFormat || ""}
                onChange={(e) =>
                  handleFieldChange(
                    "deliveryFormat",
                    e.target.value || "Custom Formulation"
                  )
                }
                className={`mt-1.5 ${fieldClass}`}
              />
            )}
          </div>

          {/* 3. Population */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Target Population
            </label>
            <select
              value={populationSelectValue}
              onChange={(e) => handlePopulationChange(e.target.value)}
              className={selectFieldClass}
              disabled={readOnly}
            >
              {SIMPLE_POPULATIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {populationSelectValue === "Other / Custom Population Specification" && !readOnly && (
              <input
                type="text"
                placeholder="Custom population..."
                value={customPopulation}
                onChange={(e) => {
                  setCustomPopulation(e.target.value);
                  handleFieldChange(
                    "intendedPopulation",
                    e.target.value || "Other / Custom Population Specification"
                  );
                }}
                className={`mt-1.5 ${fieldClass}`}
              />
            )}
            <AnimatePresence>
              {isVulnerablePopulation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1.5 overflow-hidden"
                >
                  <div className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[10px] text-rose-900">
                    <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
                    Pediatric cohorts require extra safety review.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. Packaging */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Packaging &amp; Container
            </label>
            <select
              value={packagingKey}
              onChange={(e) => handlePackagingKeyChange(e.target.value)}
              className={selectFieldClass}
              disabled={readOnly}
            >
              {SIMPLE_PACKAGING.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
            {packagingKey === "other" && !readOnly && (
              <input
                type="text"
                placeholder="Custom packaging..."
                value={customPackaging}
                onChange={(e) => {
                  setCustomPackaging(e.target.value);
                  handleFieldChange(
                    "packagingType",
                    e.target.value || defaultCustomPackaging
                  );
                }}
                className={`mt-1.5 ${fieldClass}`}
              />
            )}
          </div>
        </div>
      </motion.section>

    </div>
  );
}
