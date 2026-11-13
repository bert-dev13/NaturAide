"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beaker,
  Search,
  Check,
  ChevronDown,
  AlertTriangle,
  FlaskConical,
  X,
  Calculator,
  Thermometer,
  Clock,
  Scale,
} from "lucide-react";
import {
  EXTRACTION_METHODS,
  ExtractionMethodPreset,
  SOLVENT_RATIO_PRESETS,
  matchExtractionDurationPreset,
  formatMethodDefaultDuration,
  calculateSolventVolumeDetails,
  calculateExtractYield,
  generateExtractFractionId,
} from "@/lib/extraction-catalog";
import { LiteratureItem } from "@/components/researcher/formulation-rd/BotanicalStep1Section";

export interface ExtractionState {
  extractionMethod: string;
  plantMaterialMass: string;
  extractionSolvent: string;
  solventConcentration: string;
  solventRatio: string;
  extractionTemperature: string;
  extractionDuration: string;
  extractYieldPercent: string;
  extractFractionName: string;
  extractionReferences: string;
  recoveredDryMass?: string;
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
  };
  extraction: ExtractionState;
  onChange: (updated: ExtractionState) => void;
  onSave: () => Promise<boolean | void>;
  isSaving: boolean;
  scientificLiterature?: LiteratureItem[];
  linkedLiterature?: any[];
  onToggleLiteratureReference?: (lit: LiteratureItem) => Promise<void> | void;
  /** Reviewer / read-only mode: disable parameter edits and method browser */
  readOnly?: boolean;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

const fieldClass =
  "h-9 w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] px-3 text-xs font-medium text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15";

const calcBoxClass =
  "rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2.5";

/** Simplified method labels → catalog presets (all catalog methods remain via Browse). */
const SIMPLE_METHODS = [
  {
    label: "Ultrasonic-Assisted Extraction (UAE)",
    presetId: "uae",
    match: (name: string) =>
      /ultrasound|ultrasonic|uae/i.test(name),
  },
  {
    label: "Maceration",
    presetId: "cold_maceration",
    match: (name: string) => /maceration/i.test(name),
  },
  {
    label: "Soxhlet Extraction",
    presetId: "soxhlet",
    match: (name: string) => /soxhlet/i.test(name),
  },
  {
    label: "Decoction",
    presetId: "decoction",
    match: (name: string) => /decoction/i.test(name),
  },
  {
    label: "Infusion",
    presetId: "infusion",
    match: (name: string) => /infusion/i.test(name),
  },
  {
    label: "Reflux Extraction",
    presetId: "reflux",
    match: (name: string) => /reflux/i.test(name),
  },
  {
    label: "Percolation",
    presetId: "percolation",
    match: (name: string) => /percolation/i.test(name),
  },
  {
    label: "Other",
    presetId: "custom",
    match: (name: string) => /other|custom/i.test(name),
  },
] as const;

/** Simplified solvent systems → stored solvent + concentration. */
const SIMPLE_SOLVENTS = [
  {
    key: "etoh100",
    label: "100% Ethanol",
    store: "Ethanol",
    concentration: "100% v/v",
    match: (s: string, c: string) =>
      (/^ethanol$/i.test(s.trim()) && /100|95/.test(c)) ||
      /100%\s*ethanol/i.test(s),
  },
  {
    key: "etoh70",
    label: "70% Ethanol / 30% Water",
    store: "70% Ethanol / 30% USP Deionized Water",
    concentration: "70% v/v",
    match: (s: string, c: string) =>
      /70%\s*ethanol/i.test(s) ||
      (/ethanol.?water|ethanol–water|ethanol-water/i.test(s) && /70/.test(c)),
  },
  {
    key: "etoh50",
    label: "50% Ethanol / 50% Water",
    store: "50% Ethanol / 50% Water",
    concentration: "50% v/v",
    match: (s: string, c: string) =>
      /50%\s*ethanol/i.test(s) ||
      (/ethanol.?water|ethanol–water|ethanol-water/i.test(s) && /50/.test(c)),
  },
  {
    key: "etoh30",
    label: "30% Ethanol / 70% Water",
    store: "30% Ethanol / 70% Water",
    concentration: "30% v/v",
    match: (s: string, c: string) =>
      /30%\s*ethanol/i.test(s) ||
      (/ethanol.?water|ethanol–water|ethanol-water/i.test(s) && /30/.test(c)),
  },
  {
    key: "water",
    label: "100% Deionized Water",
    store: "Distilled Water",
    concentration: "0%",
    match: (s: string) =>
      /distilled water|deionized water|^water$/i.test(s) &&
      !/ethanol/i.test(s),
  },
  {
    key: "other",
    label: "Other",
    store: "Other / Custom",
    concentration: "Custom",
    match: () => false,
  },
] as const;

const SIMPLE_RATIOS = ["1:5", "1:10", "1:15", "1:20", "1:25"] as const;

const SIMPLE_TEMPERATURES = [25, 35, 45, 50, 60, 70] as const;

const SIMPLE_DURATIONS = [
  { label: "15 minutes", value: "15 minutes", minutes: 15 },
  { label: "30 minutes", value: "30 minutes", minutes: 30 },
  { label: "45 minutes", value: "45 minutes", minutes: 45 },
  { label: "60 minutes", value: "60 minutes", minutes: 60 },
  { label: "90 minutes", value: "90 minutes", minutes: 90 },
  { label: "120 minutes", value: "120 minutes", minutes: 120 },
] as const;

function parseNumericMass(raw: string): number {
  const trimmed = (raw || "").trim();
  if (!trimmed || trimmed.includes("-")) return 0;
  const match = trimmed.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function formatMassDisplay(raw: string): string {
  const n = parseNumericMass(raw);
  if (!n) return "";
  return String(n);
}

function resolveMethodSelect(methodName: string): string {
  const hit = SIMPLE_METHODS.find((m) => m.match(methodName || ""));
  if (hit) return hit.label;
  if (!methodName) return SIMPLE_METHODS[0].label;
  return "Other";
}

function resolveSolventKey(solvent: string, concentration: string): string {
  for (const opt of SIMPLE_SOLVENTS) {
    if (opt.key === "other") continue;
    if (opt.match(solvent || "", concentration || "")) return opt.key;
  }
  // Legacy catalog solvent name without explicit % label
  if (/ethanol.?water|ethanol–water|ethanol-water/i.test(solvent || "")) {
    return "etoh70";
  }
  if (!solvent) return "etoh70";
  return "other";
}

function resolveRatioSelect(ratio: string): string {
  const raw = (ratio || "").trim();
  for (const r of SIMPLE_RATIOS) {
    if (raw === r || raw.startsWith(r) || raw.includes(r)) return r;
  }
  const preset = SOLVENT_RATIO_PRESETS.find(
    (p) =>
      raw === p.ratioText ||
      raw.startsWith(p.ratioText) ||
      raw === p.label
  );
  if (preset && (SIMPLE_RATIOS as readonly string[]).includes(preset.ratioText)) {
    return preset.ratioText;
  }
  // Map nearby legacy ratios onto closest simplified option
  const m = raw.match(/1:(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n === 8 || n === 12) return n < 12 ? "1:10" : "1:15";
  }
  return SIMPLE_RATIOS[1];
}

function resolveTempSelect(temp: string): string {
  const match = (temp || "").match(/(-?\d+(\.\d+)?)/);
  if (!match) return "45";
  const n = Math.round(parseFloat(match[1]));
  if ((SIMPLE_TEMPERATURES as readonly number[]).includes(n)) return String(n);
  return "custom";
}

function resolveDurationSelect(duration: string): string {
  const matched = matchExtractionDurationPreset(duration || "");
  if (matched) {
    const simple = SIMPLE_DURATIONS.find((d) => d.minutes === matched.minutes);
    if (simple) return simple.value;
  }
  const simpleDirect = SIMPLE_DURATIONS.find(
    (d) =>
      d.value.toLowerCase() === (duration || "").trim().toLowerCase() ||
      d.label.toLowerCase() === (duration || "").trim().toLowerCase()
  );
  if (simpleDirect) return simpleDirect.value;
  if (!duration) return "45 minutes";
  return "custom";
}

export default function ExtractionStep3Section({
  project,
  extraction,
  onChange,
  readOnly = false,
}: Props) {
  const selectFieldClass = readOnly
    ? `${fieldClass} cursor-default bg-[#f8fbf9]`
    : fieldClass;
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const [methodSearch, setMethodSearch] = useState("");
  const methodDropdownRef = useRef<HTMLDivElement>(null);

  const [customMethod, setCustomMethod] = useState("");
  const [customSolvent, setCustomSolvent] = useState("");
  const [customConcentration, setCustomConcentration] = useState("");
  const [customTemperature, setCustomTemperature] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [fractionManual, setFractionManual] = useState(false);

  const [pendingMethod, setPendingMethod] = useState<ExtractionMethodPreset | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Record<string, boolean>>({
    extractionSolvent: false,
    solventConcentration: false,
    solventRatio: false,
    extractionTemperature: false,
    extractionDuration: false,
    plantMaterialMass: false,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target as Node)) {
        setIsMethodDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMethods = useMemo(() => {
    if (!methodSearch.trim()) return EXTRACTION_METHODS;
    const q = methodSearch.toLowerCase();
    return EXTRACTION_METHODS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }, [methodSearch]);

  const methodSelectValue = useMemo(
    () => resolveMethodSelect(extraction.extractionMethod || ""),
    [extraction.extractionMethod]
  );

  const solventKey = useMemo(
    () =>
      resolveSolventKey(
        extraction.extractionSolvent || "",
        extraction.solventConcentration || ""
      ),
    [extraction.extractionSolvent, extraction.solventConcentration]
  );

  const ratioSelect = useMemo(
    () => resolveRatioSelect(extraction.solventRatio || ""),
    [extraction.solventRatio]
  );

  const tempSelect = useMemo(
    () => resolveTempSelect(extraction.extractionTemperature || ""),
    [extraction.extractionTemperature]
  );

  const durationSelect = useMemo(
    () => resolveDurationSelect(extraction.extractionDuration || ""),
    [extraction.extractionDuration]
  );

  const numericPlantMass = useMemo(
    () => parseNumericMass(extraction.plantMaterialMass || ""),
    [extraction.plantMaterialMass]
  );

  const numericRecoveredDryMass = useMemo(() => {
    if (
      extraction.recoveredDryMass === undefined ||
      extraction.recoveredDryMass === null ||
      extraction.recoveredDryMass === ""
    ) {
      return null;
    }
    const raw = String(extraction.recoveredDryMass).trim();
    if (!raw || raw.includes("-")) return raw.includes("-") ? -1 : null;
    const match = raw.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }, [extraction.recoveredDryMass]);

  const volumeResult = useMemo(
    () => calculateSolventVolumeDetails(numericPlantMass, extraction.solventRatio),
    [numericPlantMass, extraction.solventRatio]
  );

  const yieldResult = useMemo(
    () => calculateExtractYield(numericRecoveredDryMass, numericPlantMass),
    [numericRecoveredDryMass, numericPlantMass]
  );

  useEffect(() => {
    if (methodSelectValue === "Other" && extraction.extractionMethod) {
      const isSimple = SIMPLE_METHODS.some(
        (m) => m.label !== "Other" && m.match(extraction.extractionMethod)
      );
      if (!isSimple) setCustomMethod(extraction.extractionMethod);
    }
  }, [methodSelectValue, extraction.extractionMethod]);

  useEffect(() => {
    if (solventKey === "other" && extraction.extractionSolvent) {
      setCustomSolvent(extraction.extractionSolvent);
      setCustomConcentration(extraction.solventConcentration || "");
    }
  }, [solventKey, extraction.extractionSolvent, extraction.solventConcentration]);

  useEffect(() => {
    if (tempSelect === "custom" && extraction.extractionTemperature) {
      setCustomTemperature(extraction.extractionTemperature);
    }
  }, [tempSelect, extraction.extractionTemperature]);

  useEffect(() => {
    if (durationSelect === "custom" && extraction.extractionDuration) {
      setCustomDuration(extraction.extractionDuration);
    }
  }, [durationSelect, extraction.extractionDuration]);

  // Auto-generate fraction ID for empty / default descriptive names
  useEffect(() => {
    if (readOnly) return;
    if (fractionManual) return;
    if (
      !extraction.extractFractionName ||
      extraction.extractFractionName.includes("Standardized Polyphenolic")
    ) {
      const generatedId = generateExtractFractionId(
        project.plantName,
        extraction.extractFractionName
      );
      if (generatedId !== extraction.extractFractionName) {
        onChange({ ...extraction, extractFractionName: generatedId });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.plantName, fractionManual]);

  const handleFieldChange = (field: keyof ExtractionState, value: string) => {
    if (readOnly) return;
    if (field in modifiedFields) {
      setModifiedFields((prev) => ({ ...prev, [field]: true }));
    }
    onChange({ ...extraction, [field]: value });
  };

  const applyMethodPreset = (preset: ExtractionMethodPreset, overwrite = true) => {
    if (readOnly) return;
    setIsMethodDropdownOpen(false);
    setPendingMethod(null);

    const next: ExtractionState = { ...extraction, extractionMethod: preset.name };

    if (overwrite || !modifiedFields.extractionSolvent) {
      // Prefer simplified solvent mapping from preset defaults
      if (preset.defaultSolvent === "Ethanol–Water" || preset.defaultSolvent === "Ethanol-Water") {
        const conc = preset.defaultConcentration || "70%";
        if (conc.startsWith("70")) {
          next.extractionSolvent = "70% Ethanol / 30% USP Deionized Water";
          next.solventConcentration = "70% v/v";
        } else if (conc.startsWith("50")) {
          next.extractionSolvent = "50% Ethanol / 50% Water";
          next.solventConcentration = "50% v/v";
        } else if (conc.startsWith("30")) {
          next.extractionSolvent = "30% Ethanol / 70% Water";
          next.solventConcentration = "30% v/v";
        } else {
          next.extractionSolvent = "70% Ethanol / 30% USP Deionized Water";
          next.solventConcentration = "70% v/v";
        }
      } else if (preset.defaultSolvent === "Ethanol") {
        next.extractionSolvent = "Ethanol";
        next.solventConcentration = "100% v/v";
      } else if (
        preset.defaultSolvent === "Distilled Water" ||
        /water/i.test(preset.defaultSolvent)
      ) {
        next.extractionSolvent = "Distilled Water";
        next.solventConcentration = "0%";
      } else {
        next.extractionSolvent = preset.defaultSolvent;
        next.solventConcentration = preset.defaultConcentration;
      }
    }

    if (overwrite || !modifiedFields.solventRatio) {
      const ratio = preset.defaultRatio || "1:10";
      next.solventRatio = resolveRatioSelect(ratio);
    }
    if (overwrite || !modifiedFields.extractionTemperature) {
      const t = preset.defaultTemperature;
      next.extractionTemperature = (SIMPLE_TEMPERATURES as readonly number[]).includes(t)
        ? `${t}°C`
        : `${t}°C`;
    }
    if (overwrite || !modifiedFields.extractionDuration) {
      const formatted = formatMethodDefaultDuration(preset);
      const simple = SIMPLE_DURATIONS.find(
        (d) => d.minutes === matchExtractionDurationPreset(formatted)?.minutes
      );
      next.extractionDuration = simple?.value || formatted;
    }

    if (overwrite) {
      setModifiedFields({
        extractionSolvent: false,
        solventConcentration: false,
        solventRatio: false,
        extractionTemperature: false,
        extractionDuration: false,
        plantMaterialMass: modifiedFields.plantMaterialMass,
      });
    }

    onChange(next);
  };

  const handleSelectCatalogMethod = (preset: ExtractionMethodPreset) => {
    if (readOnly) return;
    const hasMods = Object.entries(modifiedFields).some(
      ([k, v]) => v && k !== "plantMaterialMass"
    );
    if (hasMods && extraction.extractionMethod !== preset.name) {
      setPendingMethod(preset);
      return;
    }
    applyMethodPreset(preset, true);
  };

  const handleSimpleMethodChange = (label: string) => {
    if (readOnly) return;
    if (label === "Other") {
      handleFieldChange(
        "extractionMethod",
        customMethod.trim() || "Other / Custom"
      );
      return;
    }
    const simple = SIMPLE_METHODS.find((m) => m.label === label);
    const preset = EXTRACTION_METHODS.find((p) => p.id === simple?.presetId);
    if (preset) handleSelectCatalogMethod(preset);
  };

  const handleSolventKeyChange = (key: string) => {
    if (readOnly) return;
    const opt = SIMPLE_SOLVENTS.find((s) => s.key === key);
    if (!opt) return;
    if (opt.key === "other") {
      setModifiedFields((prev) => ({
        ...prev,
        extractionSolvent: true,
        solventConcentration: true,
      }));
      onChange({
        ...extraction,
        extractionSolvent: customSolvent.trim() || "Other / Custom",
        solventConcentration: customConcentration.trim() || "Custom",
      });
      return;
    }
    setModifiedFields((prev) => ({
      ...prev,
      extractionSolvent: true,
      solventConcentration: true,
    }));
    onChange({
      ...extraction,
      extractionSolvent: opt.store,
      solventConcentration: opt.concentration,
    });
  };

  const handleMassChange = (raw: string) => {
    if (readOnly) return;
    const cleaned = raw.replace(/[^\d.]/g, "");
    const n = cleaned === "" ? 0 : parseFloat(cleaned);
    if (cleaned !== "" && (isNaN(n) || n < 0)) return;

    setModifiedFields((prev) => ({ ...prev, plantMaterialMass: true }));
    const massStr = cleaned === "" ? "" : `${cleaned} g`;
    const updatedYield = calculateExtractYield(
      numericRecoveredDryMass,
      cleaned === "" ? 0 : n
    );
    onChange({
      ...extraction,
      plantMaterialMass: massStr,
      extractYieldPercent:
        updatedYield.yieldPercent !== null
          ? `${updatedYield.yieldPercent}% w/w`
          : extraction.extractYieldPercent,
    });
  };

  const handleRatioChange = (ratio: string) => {
    if (readOnly) return;
    setModifiedFields((prev) => ({ ...prev, solventRatio: true }));
    onChange({ ...extraction, solventRatio: ratio });
  };

  const handleTempChange = (value: string) => {
    if (readOnly) return;
    setModifiedFields((prev) => ({ ...prev, extractionTemperature: true }));
    if (value === "custom") {
      onChange({
        ...extraction,
        extractionTemperature: customTemperature.trim() || "Custom",
      });
      return;
    }
    onChange({ ...extraction, extractionTemperature: `${value}°C` });
  };

  const handleDurationChange = (value: string) => {
    if (readOnly) return;
    setModifiedFields((prev) => ({ ...prev, extractionDuration: true }));
    if (value === "custom") {
      onChange({
        ...extraction,
        extractionDuration: customDuration.trim() || "Custom",
      });
      return;
    }
    onChange({ ...extraction, extractionDuration: value });
  };

  const handleRecoveredDryMassChange = (raw: string) => {
    if (readOnly) return;
    const cleaned = raw.replace(/[^\d.]/g, "");
    const dryNum = cleaned === "" ? null : parseFloat(cleaned);
    if (cleaned !== "" && (dryNum === null || isNaN(dryNum) || dryNum < 0)) return;

    const updatedYield = calculateExtractYield(dryNum, numericPlantMass);
    onChange({
      ...extraction,
      recoveredDryMass: cleaned,
      extractYieldPercent:
        updatedYield.yieldPercent !== null ? `${updatedYield.yieldPercent}% w/w` : "",
    });
  };

  const concentrationEditable = solventKey === "other";

  return (
    <div className="space-y-4">
      {/* 1. Extraction Method */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Beaker className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-bold tracking-tight text-[#0f2c20]">
              Extraction Method
            </h3>
          </div>
          {!readOnly && (
          <div className="relative" ref={methodDropdownRef}>
            <button
              type="button"
              onClick={() => setIsMethodDropdownOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-50"
            >
              <Search className="h-3 w-3" />
              Browse All ({EXTRACTION_METHODS.length})
              <ChevronDown
                className={`h-3 w-3 transition ${isMethodDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {isMethodDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 z-40 mt-1.5 w-72 space-y-2 rounded-xl border border-[#d7e4dc] bg-white p-2.5 shadow-xl sm:w-80"
                >
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
                    <input
                      type="text"
                      placeholder="Search method..."
                      value={methodSearch}
                      onChange={(e) => setMethodSearch(e.target.value)}
                      className="h-8 w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] pl-8 pr-2 text-xs outline-none focus:border-emerald-600"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 space-y-0.5 overflow-y-auto">
                    {filteredMethods.map((preset) => {
                      const isCurrent =
                        extraction.extractionMethod?.toLowerCase() ===
                          preset.name.toLowerCase() ||
                        resolveMethodSelect(extraction.extractionMethod || "") ===
                          SIMPLE_METHODS.find((m) => m.presetId === preset.id)?.label;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectCatalogMethod(preset)}
                          className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition ${
                            isCurrent
                              ? "bg-emerald-50 font-semibold text-emerald-950"
                              : "text-[#52645d] hover:bg-[#f4f8f5]"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <FlaskConical className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                            <span className="truncate">{preset.name}</span>
                          </span>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}
        </div>

        <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
          Extraction Method / Technique <span className="text-rose-500">*</span>
        </label>
        <select
          value={methodSelectValue}
          onChange={(e) => handleSimpleMethodChange(e.target.value)}
          className={selectFieldClass}
          disabled={readOnly}
        >
          {SIMPLE_METHODS.map((m) => (
            <option key={m.label} value={m.label}>
              {m.label}
            </option>
          ))}
        </select>
        {methodSelectValue === "Other" && !readOnly && (
          <input
            type="text"
            placeholder="Custom extraction method..."
            value={customMethod}
            onChange={(e) => {
              setCustomMethod(e.target.value);
              handleFieldChange(
                "extractionMethod",
                e.target.value || "Other / Custom"
              );
            }}
            className={`mt-1.5 ${fieldClass}`}
          />
        )}
      </motion.section>

      <AnimatePresence>
        {pendingMethod && !readOnly && (
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
                  Apply <strong>{pendingMethod.name}</strong> defaults, or keep your parameter edits?
                </p>
              </div>
              <button type="button" onClick={() => setPendingMethod(null)}>
                <X className="h-3.5 w-3.5 text-amber-700" />
              </button>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => applyMethodPreset(pendingMethod, false)}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-950"
              >
                Keep My Edits
              </button>
              <button
                type="button"
                onClick={() => applyMethodPreset(pendingMethod, true)}
                className="rounded-lg bg-[#0f2c20] px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Apply Defaults
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Extraction Parameters */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.03, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <h3 className="mb-3 text-sm font-bold tracking-tight text-[#0f2c20]">
          Extraction Parameters
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Solvent */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Extraction Solvent System
            </label>
            <select
              value={solventKey}
              onChange={(e) => handleSolventKeyChange(e.target.value)}
              className={selectFieldClass}
              disabled={readOnly}
            >
              {SIMPLE_SOLVENTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            {solventKey === "other" && !readOnly && (
              <input
                type="text"
                placeholder="Custom solvent system..."
                value={customSolvent}
                onChange={(e) => {
                  setCustomSolvent(e.target.value);
                  handleFieldChange(
                    "extractionSolvent",
                    e.target.value || "Other / Custom"
                  );
                }}
                className={`mt-1.5 ${fieldClass}`}
              />
            )}
          </div>

          {/* Concentration */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Solvent Concentration
            </label>
            {concentrationEditable ? (
              <input
                type="text"
                value={
                  customConcentration || extraction.solventConcentration || ""
                }
                onChange={(e) => {
                  if (readOnly) return;
                  setCustomConcentration(e.target.value);
                  handleFieldChange("solventConcentration", e.target.value);
                }}
                readOnly={readOnly}
                placeholder="e.g. 70% v/v"
                className={selectFieldClass}
              />
            ) : (
              <div className="flex h-9 items-center rounded-lg border border-[#eef4f0] bg-[#f7faf8] px-3 text-xs font-medium text-[#0f2c20]">
                {extraction.solventConcentration || "—"}
              </div>
            )}
          </div>

          {/* Starting mass */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Plant Starting Mass <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={formatMassDisplay(extraction.plantMaterialMass || "")}
                onChange={(e) => handleMassChange(e.target.value)}
                readOnly={readOnly}
                placeholder="100"
                className={`${selectFieldClass} pr-10`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#8aa094]">
                g
              </span>
            </div>
          </div>

          {/* Ratio */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Solvent Ratio (mL/g)
            </label>
            <select
              value={ratioSelect}
              onChange={(e) => handleRatioChange(e.target.value)}
              className={selectFieldClass}
              disabled={readOnly}
            >
              {SIMPLE_RATIOS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calculated menstruum */}
        <div className={`mt-3 ${calcBoxClass}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Calculator className="h-4 w-4 shrink-0 text-emerald-700" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Calculated Menstruum Volume
                </p>
                {volumeResult.isValid ? (
                  <p className="truncate font-mono text-[11px] text-emerald-700">
                    {volumeResult.startingMassGrams.toLocaleString()} g ×{" "}
                    {volumeResult.ratioMlPerG} mL/g
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-800">
                    {volumeResult.error || "Enter mass and ratio"}
                  </p>
                )}
              </div>
            </div>
            <p className="shrink-0 font-mono text-sm font-black text-emerald-950">
              {volumeResult.isValid
                ? `${volumeResult.volumeMl.toLocaleString()} mL`
                : "—"}
            </p>
          </div>
        </div>

        {/* Temp + Duration */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#52645d]">
              <Thermometer className="h-3 w-3" />
              Operating Temperature (°C)
            </label>
            <select
              value={tempSelect}
              onChange={(e) => handleTempChange(e.target.value)}
              className={selectFieldClass}
              disabled={readOnly}
            >
              {SIMPLE_TEMPERATURES.map((t) => (
                <option key={t} value={String(t)}>
                  {t}°C
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {tempSelect === "custom" && !readOnly && (
              <input
                type="text"
                placeholder="e.g. 78°C"
                value={customTemperature}
                onChange={(e) => {
                  setCustomTemperature(e.target.value);
                  handleFieldChange("extractionTemperature", e.target.value);
                }}
                className={`mt-1.5 ${fieldClass}`}
              />
            )}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#52645d]">
              <Clock className="h-3 w-3" />
              Extraction Duration
            </label>
            <select
              value={durationSelect}
              onChange={(e) => handleDurationChange(e.target.value)}
              className={selectFieldClass}
              disabled={readOnly}
            >
              {SIMPLE_DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {durationSelect === "custom" && !readOnly && (
              <input
                type="text"
                placeholder="e.g. 3 hours"
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  handleFieldChange("extractionDuration", e.target.value);
                }}
                className={`mt-1.5 ${fieldClass}`}
              />
            )}
          </div>
        </div>
      </motion.section>

      {/* 3. Extract Measurement */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.06, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-teal-700" />
          <h3 className="text-sm font-bold tracking-tight text-[#0f2c20]">
            Extract Measurement
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Recovered Dry Extract Mass (g)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={extraction.recoveredDryMass ?? ""}
                onChange={(e) => handleRecoveredDryMassChange(e.target.value)}
                readOnly={readOnly}
                placeholder="0.00"
                className={`${selectFieldClass} pr-10`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#8aa094]">
                g
              </span>
            </div>
            <p className="mt-1 flex items-start gap-1 text-[10px] text-amber-800">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              Measure after complete solvent removal. Do not enter wet mass.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#52645d]">
              Crude Extract Yield (%)
            </label>
            <div className={calcBoxClass}>
              <p className="font-mono text-sm font-black text-emerald-950">
                {yieldResult.yieldPercent !== null
                  ? `${yieldResult.yieldPercent}% w/w`
                  : "—"}
              </p>
              {yieldResult.yieldPercent !== null && numericPlantMass > 0 && (
                <p className="mt-0.5 font-mono text-[10px] text-emerald-700">
                  ({numericRecoveredDryMass} g ÷ {numericPlantMass} g) × 100
                </p>
              )}
              {yieldResult.error && (
                <p className="mt-1 text-[10px] text-amber-800">{yieldResult.error}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#52645d]">
                Extract Fraction Identifier
              </label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setFractionManual((v) => !v)}
                  className="text-[10px] font-semibold text-emerald-800 hover:underline"
                >
                  {fractionManual ? "Auto" : "Edit"}
                </button>
              )}
            </div>
            <input
              type="text"
              value={extraction.extractFractionName || ""}
              readOnly={readOnly || !fractionManual}
              onChange={(e) => {
                if (readOnly) return;
                setFractionManual(true);
                handleFieldChange("extractFractionName", e.target.value);
              }}
              className={`${selectFieldClass} font-mono ${
                !readOnly && fractionManual ? "" : "cursor-default bg-[#f7faf8]"
              }`}
            />
          </div>
        </div>
      </motion.section>
    </div>
  );
}
