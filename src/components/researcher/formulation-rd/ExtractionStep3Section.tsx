"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beaker,
  Search,
  Check,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  FlaskConical,
  Sparkles,
  Info,
  Clock,
  Scale,
  ShieldAlert,
  ExternalLink,
  BookOpen,
  X,
  Calculator,
  Thermometer,
  ChevronRight,
} from "lucide-react";
import {
  EXTRACTION_METHODS,
  ExtractionMethodPreset,
  SOLVENT_SYSTEMS,
  SolventSystemSpec,
  SOLVENT_CONCENTRATION_OPTIONS,
  SOLVENT_RATIO_OPTIONS,
  SOLVENT_RATIO_PRESETS,
  SolventRatioPreset,
  EXTRACTION_DURATION_PRESETS,
  matchExtractionDurationPreset,
  formatMethodDefaultDuration,
  parseSolventRatio,
  isSolventConcentrationMeaningful,
  checkSolventCompatibility,
  calculateSolventVolume,
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
}

export default function ExtractionStep3Section({
  project,
  productSelection,
  extraction,
  onChange,
  onSave,
  isSaving,
  scientificLiterature = [],
  linkedLiterature = [],
  onToggleLiteratureReference,
}: Props) {
  // Method Dropdown & Search State
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const [methodSearch, setMethodSearch] = useState("");
  const methodDropdownRef = useRef<HTMLDivElement>(null);

  // Solvent Dropdown & Search State
  const [isSolventDropdownOpen, setIsSolventDropdownOpen] = useState(false);
  const [solventSearch, setSolventSearch] = useState("");
  const solventDropdownRef = useRef<HTMLDivElement>(null);

  // Ratio Dropdown & Custom State
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
  const ratioDropdownRef = useRef<HTMLDivElement>(null);

  // Concentration Dropdown & Custom State
  const [isConcDropdownOpen, setIsConcDropdownOpen] = useState(false);
  const concDropdownRef = useRef<HTMLDivElement>(null);

  // Duration Dropdown & Custom State
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const durationDropdownRef = useRef<HTMLDivElement>(null);

  // Literature Abstract Modal
  const [selectedLitModal, setSelectedLitModal] = useState<LiteratureItem | null>(null);
  const [litSearch, setLitSearch] = useState("");
  const [litVisibleCount, setLitVisibleCount] = useState(6);

  // Overwrite Confirmation Modal
  const [pendingMethod, setPendingMethod] = useState<ExtractionMethodPreset | null>(null);

  // Field change tracking to avoid overwriting user edits without confirmation
  const [modifiedFields, setModifiedFields] = useState<Record<string, boolean>>({
    extractionMethod: false,
    plantMaterialMass: false,
    extractionSolvent: false,
    solventConcentration: false,
    solventRatio: false,
    extractionTemperature: false,
    extractionDuration: false,
    extractYieldPercent: false,
    extractFractionName: false,
    recoveredDryMass: false,
  });

  const [isDirty, setIsDirty] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target as Node)) {
        setIsMethodDropdownOpen(false);
      }
      if (solventDropdownRef.current && !solventDropdownRef.current.contains(event.target as Node)) {
        setIsSolventDropdownOpen(false);
      }
      if (ratioDropdownRef.current && !ratioDropdownRef.current.contains(event.target as Node)) {
        setIsRatioDropdownOpen(false);
      }
      if (concDropdownRef.current && !concDropdownRef.current.contains(event.target as Node)) {
        setIsConcDropdownOpen(false);
      }
      if (durationDropdownRef.current && !durationDropdownRef.current.contains(event.target as Node)) {
        setIsDurationDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Matched current method preset
  const currentMethodPreset = useMemo(() => {
    if (!extraction.extractionMethod) return null;
    const m = extraction.extractionMethod.toLowerCase();
    return (
      EXTRACTION_METHODS.find(
        (preset) =>
          preset.name.toLowerCase() === m ||
          m.includes(preset.name.toLowerCase()) ||
          preset.id.toLowerCase() === m
      ) || null
    );
  }, [extraction.extractionMethod]);

  // Filtered methods for searchable dropdown
  const filteredMethods = useMemo(() => {
    if (!methodSearch.trim()) return EXTRACTION_METHODS;
    const q = methodSearch.toLowerCase();
    return EXTRACTION_METHODS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.suggestedSolvents.some((s) => s.toLowerCase().includes(q))
    );
  }, [methodSearch]);

  // Matched current solvent spec
  const currentSolventSpec = useMemo(() => {
    if (!extraction.extractionSolvent) return null;
    const s = extraction.extractionSolvent.toLowerCase();
    return (
      SOLVENT_SYSTEMS.find(
        (spec) =>
          spec.name.toLowerCase() === s ||
          s.includes(spec.name.toLowerCase()) ||
          spec.id.toLowerCase() === s
      ) || null
    );
  }, [extraction.extractionSolvent]);

  // Filtered solvents for searchable dropdown
  const filteredSolvents = useMemo(() => {
    if (!solventSearch.trim()) return SOLVENT_SYSTEMS;
    const q = solventSearch.toLowerCase();
    return SOLVENT_SYSTEMS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.safetyClass.toLowerCase().includes(q) ||
        s.boilingPoint.toLowerCase().includes(q)
    );
  }, [solventSearch]);

  // Compatibility & Safety Checks
  const compatibilityResult = useMemo(() => {
    return checkSolventCompatibility(
      extraction.extractionMethod,
      extraction.extractionSolvent,
      productSelection?.productType || productSelection?.deliveryFormat
    );
  }, [extraction.extractionMethod, extraction.extractionSolvent, productSelection]);

  // Numeric mass parsing
  const numericPlantMass = useMemo(() => {
    const raw = extraction.plantMaterialMass || "";
    const trimmed = raw.trim();
    if (!trimmed) return 0;
    if (trimmed.includes("-")) return -1;
    const match = trimmed.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }, [extraction.plantMaterialMass]);

  // Numeric recovered mass parsing - only parse if user has actually entered a value (avoid populating unmeasured values)
  const numericRecoveredDryMass = useMemo(() => {
    if (extraction.recoveredDryMass === undefined || extraction.recoveredDryMass === null || extraction.recoveredDryMass === "") {
      return null;
    }
    const raw = String(extraction.recoveredDryMass).trim();
    if (!raw) return null;
    if (raw.includes("-")) return -1;
    const match = raw.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }, [extraction.recoveredDryMass]);

  // Automatic Solvent Volume Calculation with full structured details
  const volumeResult = useMemo(() => {
    return calculateSolventVolumeDetails(numericPlantMass, extraction.solventRatio);
  }, [numericPlantMass, extraction.solventRatio]);

  const calculatedSolventVolume = volumeResult.volumeMl;

  // Matched current solvent ratio preset (if any)
  const currentRatioPreset = useMemo(() => {
    const raw = (extraction.solventRatio || "").trim().toLowerCase();
    if (!raw) return null;
    return (
      SOLVENT_RATIO_PRESETS.find(
        (p) =>
          p.ratioText.toLowerCase() === raw ||
          raw.startsWith(p.ratioText.toLowerCase()) ||
          p.label.toLowerCase() === raw ||
          p.id.toLowerCase() === raw ||
          (raw.includes(":") && parseSolventRatio(raw).ratioMlPerG === p.ratioValue && (raw === `${p.ratioValue}:1` || raw === `1:${p.ratioValue}`))
      ) || null
    );
  }, [extraction.solventRatio]);

  const isCustomRatio = useMemo(() => {
    const raw = (extraction.solventRatio || "").trim();
    if (!raw) return false;
    if (raw.toLowerCase().startsWith("custom")) return true;
    return currentRatioPreset === null;
  }, [extraction.solventRatio, currentRatioPreset]);

  const currentDurationPreset = useMemo(
    () => matchExtractionDurationPreset(extraction.extractionDuration || ""),
    [extraction.extractionDuration]
  );

  const isCustomDuration = useMemo(() => {
    const raw = (extraction.extractionDuration || "").trim();
    if (!raw) return false;
    if (raw.toLowerCase().startsWith("custom")) return true;
    return currentDurationPreset === null;
  }, [extraction.extractionDuration, currentDurationPreset]);

  // Automatic Crude Extract Yield Calculation
  const yieldResult = useMemo(() => {
    return calculateExtractYield(numericRecoveredDryMass, numericPlantMass);
  }, [numericRecoveredDryMass, numericPlantMass]);

  // Numeric temperature parsing & scientific validation
  const numericTemperature = useMemo(() => {
    const raw = extraction.extractionTemperature || "";
    const match = raw.match(/(-?\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }, [extraction.extractionTemperature]);

  const temperatureValidationWarning = useMemo(() => {
    if (numericTemperature === null) return null;
    const m = (extraction.extractionMethod || "").toLowerCase();
    const s = (extraction.extractionSolvent || "").toLowerCase();

    if (m.includes("cold") && numericTemperature > 35) {
      return "Cold maceration is compendially defined at controlled ambient temperature (15–25°C). Operating above 35°C accelerates thermal degradation of heat-sensitive flavonoids; consider reclassifying as Hot Maceration.";
    }
    if ((s.includes("ethanol") || s.includes("aqueous ethanol")) && numericTemperature > 78.3 && !m.includes("reflux") && !m.includes("soxhlet")) {
      return "Atmospheric boiling point of ethanol is 78.3°C. Heating above this threshold requires a sealed reflux condenser or specialized pressurized vessel to avoid solvent loss and fire hazards.";
    }
    if (s.includes("distilled water") && numericTemperature > 100) {
      return "Distilled water boils at 100°C under atmospheric pressure. Temperatures above 100°C require an autoclave or pressurized reactor.";
    }
    return null;
  }, [numericTemperature, extraction.extractionMethod, extraction.extractionSolvent]);

  // Auto-generate fraction ID if empty or default
  useEffect(() => {
    if (!extraction.extractFractionName || extraction.extractFractionName.includes("Standardized Polyphenolic")) {
      const generatedId = generateExtractFractionId(project.plantName, extraction.extractFractionName);
      if (generatedId !== extraction.extractFractionName) {
        onChange({
          ...extraction,
          extractFractionName: generatedId,
        });
      }
    }
  }, [project.plantName]);

  // Generic Field Change Handler
  const handleFieldChange = (field: keyof ExtractionState, value: any) => {
    setModifiedFields((prev) => ({ ...prev, [field]: true }));
    setIsDirty(true);
    onChange({
      ...extraction,
      [field]: value,
    });
  };

  // Plant Material Mass change
  const handleMassChange = (newMassStr: string) => {
    setModifiedFields((prev) => ({ ...prev, plantMaterialMass: true }));
    setIsDirty(true);

    const match = newMassStr.match(/(\d+(\.\d+)?)/);
    const num = match ? parseFloat(match[1]) : 0;
    const updatedYield = calculateExtractYield(numericRecoveredDryMass, num);
    const updatedYieldStr =
      updatedYield.yieldPercent !== null
        ? `${updatedYield.yieldPercent}% w/w`
        : numericRecoveredDryMass !== null
        ? ""
        : extraction.extractYieldPercent;

    onChange({
      ...extraction,
      plantMaterialMass: newMassStr,
      extractYieldPercent: updatedYieldStr,
    });
  };

  // Recovered Dry Mass change
  const handleRecoveredDryMassChange = (newDryMassStr: string) => {
    setModifiedFields((prev) => ({ ...prev, recoveredDryMass: true, extractYieldPercent: true }));
    setIsDirty(true);

    const cleanNum = newDryMassStr.trim();
    const dryNum = cleanNum === "" ? null : parseFloat(cleanNum);
    const updatedYield = calculateExtractYield(dryNum, numericPlantMass);
    const updatedYieldStr = updatedYield.yieldPercent !== null ? `${updatedYield.yieldPercent}% w/w` : "";

    onChange({
      ...extraction,
      recoveredDryMass: newDryMassStr,
      extractYieldPercent: updatedYieldStr,
    });
  };

  // Preset Selection with Overwrite Protection
  const handleSelectMethodPreset = (preset: ExtractionMethodPreset) => {
    const hasModifications =
      modifiedFields.extractionSolvent ||
      modifiedFields.solventRatio ||
      modifiedFields.extractionTemperature ||
      modifiedFields.extractionDuration;

    if (hasModifications && extraction.extractionMethod !== preset.name) {
      setPendingMethod(preset);
      return;
    }

    applyMethodPreset(preset);
  };

  const applyMethodPreset = (preset: ExtractionMethodPreset) => {
    setIsMethodDropdownOpen(false);
    setPendingMethod(null);
    setIsDirty(true);

    const newExtraction: ExtractionState = {
      ...extraction,
      extractionMethod: preset.name,
      extractionSolvent: preset.defaultSolvent,
      solventConcentration: preset.defaultConcentration,
      solventRatio: preset.defaultRatio,
      extractionTemperature: `${preset.defaultTemperature}°C`,
      extractionDuration: formatMethodDefaultDuration(preset),
    };

    setModifiedFields({
      extractionMethod: false,
      plantMaterialMass: modifiedFields.plantMaterialMass,
      extractionSolvent: false,
      solventConcentration: false,
      solventRatio: false,
      extractionTemperature: false,
      extractionDuration: false,
      extractYieldPercent: modifiedFields.extractYieldPercent,
      extractFractionName: modifiedFields.extractFractionName,
      recoveredDryMass: modifiedFields.recoveredDryMass,
    });

    onChange(newExtraction);
  };

  const handleRestorePresetDefaults = () => {
    if (currentMethodPreset) {
      applyMethodPreset(currentMethodPreset);
    }
  };

  // Linked literature IDs
  const linkedLitIds = useMemo(() => {
    const set = new Set<string>();
    linkedLiterature.forEach((l) => {
      if (l.scientificReferenceId) set.add(String(l.scientificReferenceId));
      if (l.pubmedId) set.add(String(l.pubmedId));
      if (l.title) set.add(String(l.title));
    });
    return set;
  }, [linkedLiterature]);

  const filteredLitList = useMemo(() => {
    if (!litSearch.trim()) return scientificLiterature;
    const q = litSearch.toLowerCase();
    return scientificLiterature.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.authors && l.authors.toLowerCase().includes(q)) ||
        (l.journalOrPublisher && l.journalOrPublisher.toLowerCase().includes(q))
    );
  }, [scientificLiterature, litSearch]);

  useEffect(() => {
    setLitVisibleCount(6);
  }, [litSearch]);

  const visibleLitList = filteredLitList.slice(0, litVisibleCount);

  const isConcentrationVisible = isSolventConcentrationMeaningful(extraction.extractionSolvent);

  return (
    <div className="space-y-4">
      {/* Compact status strip — step chrome lives in parent workspace header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d7e4dc]/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex items-center gap-2 text-[11px] text-[#6d7f76]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Beaker className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">Extraction Methodology &amp; Yield</span>
          {currentMethodPreset && (
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
              {currentMethodPreset.typicalYieldRange} typical
            </span>
          )}
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
          {currentMethodPreset && (
            <button
              type="button"
              onClick={handleRestorePresetDefaults}
              className="inline-flex items-center gap-1 rounded-xl border border-[#d7e4dc] bg-[#f7faf8] px-2.5 py-1 text-[11px] font-semibold text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Defaults
            </button>
          )}
        </div>
      </motion.div>

      {/* ===================================================================== */}
      {/* 2. EXTRACTION METHOD SELECTOR (SEARCHABLE DROPDOWN & PRESET ADVISORY)  */}
      {/* ===================================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04 }}
        className="space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="block font-bold text-slate-800 text-xs sm:text-sm">
              Extraction Method / Technique <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Select standardized extraction protocol or configure custom experimental parameters.
            </p>
          </div>

          {currentMethodPreset && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              {currentMethodPreset.typicalYieldRange} typical yield
            </span>
          )}
        </div>

        {/* Searchable Method Dropdown */}
        <div className="relative" ref={methodDropdownRef}>
          <button
            type="button"
            onClick={() => setIsMethodDropdownOpen(!isMethodDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-slate-400 text-left text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2 truncate">
              <FlaskConical className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{extraction.extractionMethod || "Select Extraction Method..."}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </button>

          {isMethodDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-30 overflow-hidden max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={methodSearch}
                    onChange={(e) => setMethodSearch(e.target.value)}
                    placeholder="Search extraction techniques (e.g. UAE, Maceration, Soxhlet)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100">
                {filteredMethods.map((preset) => {
                  const isSelected =
                    currentMethodPreset?.id === preset.id ||
                    Boolean(extraction.extractionMethod && extraction.extractionMethod.toLowerCase().includes(preset.name.toLowerCase()));

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectMethodPreset(preset)}
                      className={`w-full p-2.5 text-left transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected ? "bg-emerald-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isSelected ? "text-emerald-900" : "text-slate-800"}`}>
                            {preset.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {preset.defaultTemperature}°C • {formatMethodDefaultDuration(preset)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{preset.description}</p>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Method Principle & Scientific Advisory Note */}
        {currentMethodPreset && (
          <div className="space-y-1 rounded-xl border border-[#e8f0eb] bg-[linear-gradient(145deg,#f4f8f5_0%,#ffffff_55%)] p-3 text-xs text-[#52645d]">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0f2c20]">
              <Info className="h-3.5 w-3.5 text-emerald-700" />
              <span>Scientific Mechanism</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#52645d]">{currentMethodPreset.principles}</p>
            <p className="pt-1 text-[10px] italic text-[#8aa094]">
              Operating parameters below are literature-derived suggestions and must be verified experimentally.
            </p>
          </div>
        )}
      </motion.div>

      {/* ===================================================================== */}
      {/* 3. TWO-COLUMN PARAMETER FIELDS (SOLVENT, RATIO, CONDITIONS, YIELD)    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* COLUMN 1: SOLVENT SYSTEM & MATERIAL RATIO */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="space-y-3.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
        >
          <div className="flex items-center gap-2 border-b border-[#e8f0eb] pb-2">
            <FlaskConical className="h-4 w-4 text-emerald-700" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              Menstruum &amp; Solvent Ratio
            </h2>
          </div>

          {/* Solvent System Searchable Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700 text-xs">
                Extraction Solvent System <span className="text-rose-500">*</span>
              </label>
              {currentSolventSpec && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    currentSolventSpec.safetyClass.includes("Class 3") || currentSolventSpec.safetyClass.includes("GRAS")
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {currentSolventSpec.safetyClass}
                </span>
              )}
            </div>

            <div className="relative" ref={solventDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSolventDropdownOpen(!isSolventDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-slate-400 text-left text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer shadow-2xs"
              >
                <span className="truncate">{extraction.extractionSolvent || "Select Solvent System..."}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
              </button>

              {isSolventDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-30 overflow-hidden max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <input
                      type="text"
                      value={solventSearch}
                      onChange={(e) => setSolventSearch(e.target.value)}
                      placeholder="Search solvents..."
                      className="w-full px-2.5 py-1 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>

                  <div className="overflow-y-auto divide-y divide-slate-100">
                    {filteredSolvents.map((sol) => (
                      <button
                        key={sol.id}
                        type="button"
                        onClick={() => {
                          handleFieldChange("extractionSolvent", sol.name);
                          setIsSolventDropdownOpen(false);
                          if (!sol.isConcentrationMeaningful) {
                            handleFieldChange("solventConcentration", sol.defaultConcentrations[0] || "100%");
                          }
                        }}
                        className={`w-full p-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          extraction.extractionSolvent === sol.name ? "bg-emerald-50 text-emerald-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold block">{sol.name}</span>
                          <span className="text-[10px] text-slate-400 block">
                            BP: {sol.boilingPoint} • {sol.safetyClass}
                          </span>
                        </div>
                        {extraction.extractionSolvent === sol.name && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Incompatibility / Toxicity warnings */}
            {compatibilityResult.warnings.length > 0 && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Incompatibility Alert:</span>
                  {compatibilityResult.warnings.map((w: string, idx: number) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              </div>
            )}

            {compatibilityResult.cautions.length > 0 && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Safety Consideration:</span>
                  {compatibilityResult.cautions.map((c: string, idx: number) => (
                    <p key={idx}>{c}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Solvent Concentration (Shown conditionally when meaningful) */}
          {isConcentrationVisible && (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 text-xs">
                Solvent Concentration (% v/v)
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1" ref={concDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsConcDropdownOpen(!isConcDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs"
                  >
                    <span>{extraction.solventConcentration || "Select Concentration..."}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isConcDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-30 py-1">
                      {SOLVENT_CONCENTRATION_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (opt === "Custom") {
                              handleFieldChange("solventConcentration", "Custom % v/v");
                            } else {
                              handleFieldChange("solventConcentration", opt);
                            }
                            setIsConcDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            extraction.solventConcentration === opt ? "bg-emerald-50 text-emerald-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>{opt}</span>
                          {extraction.solventConcentration === opt && <Check className="w-3 h-3 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {Boolean(extraction.solventConcentration && extraction.solventConcentration.toLowerCase().includes("custom")) && (
                  <input
                    type="text"
                    value={extraction.solventConcentration}
                    onChange={(e) => handleFieldChange("solventConcentration", e.target.value)}
                    placeholder="e.g. 65% v/v"
                    className="w-28 px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                )}
              </div>
            </div>
          )}

          {/* Plant Starting Mass & Ratio Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 text-xs">
                Plant Starting Mass (g) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={extraction.plantMaterialMass}
                  onChange={(e) => handleMassChange(e.target.value)}
                  placeholder="100.0"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-400">Dry milled botanical powder</span>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 text-xs">
                Solvent Ratio (mL/g) <span className="text-rose-500">*</span>
              </label>
              <div className="relative" ref={ratioDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsRatioDropdownOpen(!isRatioDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs"
                >
                  <span className="truncate">
                    {currentRatioPreset
                      ? currentRatioPreset.label
                      : extraction.solventRatio
                      ? (isCustomRatio ? `Custom (${extraction.solventRatio})` : extraction.solventRatio)
                      : "1:10 (w/v)"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {isRatioDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl z-30 py-1 max-h-64 overflow-y-auto">
                    {SOLVENT_RATIO_PRESETS.map((preset) => {
                      const isSelected =
                        currentRatioPreset?.id === preset.id ||
                        extraction.solventRatio === preset.ratioText ||
                        extraction.solventRatio === preset.label;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            handleFieldChange("solventRatio", preset.ratioText);
                            setIsRatioDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            isSelected ? "bg-emerald-50 text-emerald-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div>
                            <span className="font-semibold block">{preset.label}</span>
                            <span className="text-[10px] text-slate-400 block">{preset.description}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange("solventRatio", "Custom");
                        setIsRatioDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isCustomRatio ? "bg-emerald-50 text-emerald-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <span className="font-semibold block">Custom Ratio</span>
                        <span className="text-[10px] text-slate-400 block">Specify custom menstruum proportion</span>
                      </div>
                      {isCustomRatio && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  </div>
                )}
              </div>

              {isCustomRatio && (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={extraction.solventRatio === "Custom" ? "" : extraction.solventRatio}
                    onChange={(e) => handleFieldChange("solventRatio", e.target.value)}
                    placeholder="e.g. 1:12 or 12 mL/g"
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">mL/g</span>
                </div>
              )}

              <span className="text-[10px] text-slate-400">mL menstruum per g dry plant</span>
            </div>
          </div>

          {/* Automatic Solvent Volume Calculation Card */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between gap-3 shadow-2xs transition-colors ${
              volumeResult.isValid ? "bg-emerald-50/60 border-emerald-200/80" : "bg-amber-50/70 border-amber-200/80"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calculator
                className={`w-4 h-4 shrink-0 ${volumeResult.isValid ? "text-emerald-700" : "text-amber-700"}`}
              />
              <div className="min-w-0">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    volumeResult.isValid ? "text-emerald-800" : "text-amber-800"
                  }`}
                >
                  Calculated Menstruum Volume
                </span>
                {volumeResult.isValid ? (
                  <span className="text-xs text-emerald-700 font-mono truncate block">
                    {volumeResult.startingMassGrams.toLocaleString()} g × {volumeResult.ratioMlPerG} mL/g ({volumeResult.formattedRatio} w/v)
                  </span>
                ) : (
                  <span className="text-xs text-amber-700 font-medium truncate block">
                    {volumeResult.error || "Please enter valid starting mass and ratio"}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`text-sm sm:text-base font-black font-mono block ${
                  volumeResult.isValid ? "text-emerald-900" : "text-amber-900"
                }`}
              >
                {volumeResult.volumeMl.toLocaleString()} mL
              </span>
              <span
                className={`text-[10px] font-medium ${
                  volumeResult.isValid ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                ({volumeResult.volumeLiters.toFixed(2)} L)
              </span>
            </div>
          </div>
        </motion.div>

        {/* COLUMN 2: OPERATING CONDITIONS & YIELD VALIDATION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="space-y-3.5 rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
        >
          <div className="flex items-center gap-2 border-b border-[#e8f0eb] pb-2">
            <Scale className="h-4 w-4 text-teal-700" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              Operating Parameters &amp; Yield
            </h2>
          </div>

          {/* Operating Temp & Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 text-xs">
                Operating Temperature (°C) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Thermometer className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={extraction.extractionTemperature}
                  onChange={(e) => handleFieldChange("extractionTemperature", e.target.value)}
                  placeholder="e.g. 25°C"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-400">Controlled bath or vessel temperature</span>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700 text-xs">
                Extraction Duration <span className="text-rose-500">*</span>
              </label>
              <div className="relative" ref={durationDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDurationDropdownOpen(!isDurationDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate font-mono">
                      {currentDurationPreset
                        ? currentDurationPreset.label
                        : extraction.extractionDuration
                          ? isCustomDuration
                            ? `Custom (${extraction.extractionDuration})`
                            : extraction.extractionDuration
                          : "Select duration"}
                    </span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </button>

                {isDurationDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                    {EXTRACTION_DURATION_PRESETS.map((preset) => {
                      const isSelected = currentDurationPreset?.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            handleFieldChange("extractionDuration", preset.value);
                            setIsDurationDropdownOpen(false);
                          }}
                          className={`flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-emerald-50 font-bold text-emerald-800"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <span className="block font-semibold font-mono">{preset.label}</span>
                            <span className="block text-[10px] font-normal text-slate-400">
                              {preset.description}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          )}
                        </button>
                      );
                    })}

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange(
                          "extractionDuration",
                          isCustomDuration && extraction.extractionDuration
                            ? extraction.extractionDuration
                            : "Custom"
                        );
                        setIsDurationDropdownOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                        isCustomDuration
                          ? "bg-emerald-50 font-bold text-emerald-800"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <span className="block font-semibold">Custom Duration</span>
                        <span className="block text-[10px] font-normal text-slate-400">
                          Specify experimental contact time
                        </span>
                      </div>
                      {isCustomDuration && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isCustomDuration && (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={
                      extraction.extractionDuration === "Custom"
                        ? ""
                        : extraction.extractionDuration ?? ""
                    }
                    onChange={(e) => handleFieldChange("extractionDuration", e.target.value)}
                    placeholder="e.g. 90 minutes or 3 hours"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="shrink-0 font-mono text-[10px] text-slate-400">time</span>
                </div>
              )}

              <span className="text-[10px] text-slate-400">Total contact / cavitation duration</span>
            </div>
          </div>

          {/* Temperature Validation Warning */}
          {temperatureValidationWarning && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{temperatureValidationWarning}</span>
            </div>
          )}

          {/* Recovered Dry Extract Mass Input */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700 text-xs">
                Recovered Dry Extract Mass (g)
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Rotary evaporated dry residue</span>
            </div>

            <div className="relative">
              <Scale className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={extraction.recoveredDryMass || ""}
                onChange={(e) => handleRecoveredDryMassChange(e.target.value)}
                placeholder="Enter measured dry extract mass (e.g. 14.2)"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              * Must be weighed after complete solvent removal (lyophilization / rotary evaporation). Do not enter wet mass.
            </p>
          </div>

          {/* Automatic Yield Calculation Card */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Crude Extract Yield (% w/w)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                (Recovered Dry Mass ÷ Starting Mass) × 100
              </span>
            </div>

            <div className="flex items-center justify-between">
              {yieldResult.yieldPercent !== null ? (
                <div className="flex items-center gap-2">
                  <span className={`text-base sm:text-lg font-black font-mono ${yieldResult.isValid ? "text-emerald-700" : "text-rose-600"}`}>
                    {yieldResult.yieldPercent}% w/w
                  </span>
                  {yieldResult.isValid && currentMethodPreset && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800 font-medium">
                      Baseline: {currentMethodPreset.typicalYieldRange}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending measurement (enter recovered dry mass above)</span>
                </div>
              )}

              <input
                type="hidden"
                value={extraction.extractYieldPercent}
              />
            </div>

            {/* Error or validation alert */}
            {yieldResult.error && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>{yieldResult.error}</span>
              </div>
            )}
          </div>

          {/* Standardized Extract Fraction Identifier */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700 text-xs">
                Extract Fraction Identifier <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-700">Project Lot Standard</span>
            </div>
            <input
              type="text"
              value={extraction.extractFractionName}
              onChange={(e) => handleFieldChange("extractFractionName", e.target.value)}
              placeholder="e.g. AKP-EXT-001"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-[#8aa094]">
              Unique standardized extract accession ID carried forward to materials compounding.
            </span>
          </div>
        </motion.div>
      </div>

      {/* ===================================================================== */}
      {/* 4. SUPPORTING SCIENTIFIC REFERENCES (VISIBLE DIRECTLY ON PAGE)         */}
      {/* ===================================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.16 }}
        className="space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-700" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
                Supporting Extraction Literature
              </h2>
            </div>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              {scientificLiterature.length} references · showing {visibleLitList.length} of{" "}
              {filteredLitList.length}
            </p>
          </div>

          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
            <input
              type="text"
              value={litSearch}
              onChange={(e) => setLitSearch(e.target.value)}
              placeholder="Filter references..."
              className="h-9 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] pl-8 pr-2.5 text-xs outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {visibleLitList.length > 0 ? (
          <div className="space-y-2">
            {visibleLitList.map((lit) => (
              <div
                key={lit.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#e8f0eb] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] p-3 transition hover:border-emerald-300"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#0f2c20]">
                    {lit.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#8aa094]">
                    <span>{lit.authors || "Botanical Research Group"}</span>
                    <span>·</span>
                    <span>{lit.journalOrPublisher || "Scientific Source"}</span>
                    {lit.publicationYear && (
                      <>
                        <span>·</span>
                        <span>{lit.publicationYear}</span>
                      </>
                    )}
                    {lit.doi && (
                      <a
                        href={`https://doi.org/${lit.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-semibold text-emerald-800 hover:underline"
                      >
                        DOI
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLitModal(lit)}
                  className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-emerald-800 hover:underline"
                >
                  Details
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            ))}
            {litVisibleCount < filteredLitList.length && (
              <button
                type="button"
                onClick={() => setLitVisibleCount((n) => n + 6)}
                className="w-full rounded-xl border border-[#d7e4dc] bg-[#f7faf8] py-2.5 text-xs font-semibold text-[#0f2c20] hover:border-emerald-400 hover:bg-emerald-50"
              >
                Show more ({filteredLitList.length - litVisibleCount} remaining)
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] p-6 text-center text-xs text-[#8aa094]">
            No scientific references found matching &ldquo;{litSearch}&rdquo;.
          </div>
        )}

        <div className="border-t border-[#e8f0eb] pt-3">
          <label className="mb-1.5 block text-[11px] font-semibold text-[#52645d]">
            Compendial Reference Summary Note
          </label>
          <input
            type="text"
            value={extraction.extractionReferences ?? ""}
            onChange={(e) => handleFieldChange("extractionReferences", e.target.value)}
            placeholder="e.g. Philippine Herbal Pharmacopeia (2024); WHO Guidelines on Good Agricultural and Collection Practices (GACP)."
            className="h-10 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 text-xs text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          />
        </div>
      </motion.div>

      {/* ===================================================================== */}
      {/* 5. OVERWRITE CONFIRMATION MODAL                                       */}
      {/* ===================================================================== */}
      {pendingMethod && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Update Extraction Parameters to {pendingMethod.name}?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You have customized existing solvent, temperature, ratio, or duration parameters. Selecting this preset will update operating suggestions to the standard catalog defaults for {pendingMethod.name}.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Suggested Solvent:</span>
                <span className="font-semibold text-slate-800">{pendingMethod.defaultSolvent} ({pendingMethod.defaultConcentration})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operating Temperature:</span>
                <span className="font-semibold text-slate-800">{pendingMethod.defaultTemperature}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-800">{formatMethodDefaultDuration(pendingMethod)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingMethod(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Keep Current Values
              </button>
              <button
                type="button"
                onClick={() => applyMethodPreset(pendingMethod)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Apply Preset Suggestions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. LITERATURE ABSTRACT & DETAILS MODAL                                */}
      {/* ===================================================================== */}
      {selectedLitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1 pr-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {selectedLitModal.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedLitModal.authors} • {selectedLitModal.journalOrPublisher} ({selectedLitModal.publicationYear})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLitModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Study Abstract &amp; Extraction Findings
                </span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedLitModal.shortSummary || "No detailed abstract provided in citation record."}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {selectedLitModal.studyType && (
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Study Type</span>
                    <p className="font-medium text-slate-800">{selectedLitModal.studyType}</p>
                  </div>
                )}
                {selectedLitModal.verification_source && (
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Source Scope</span>
                    <p className="font-medium text-slate-800">{selectedLitModal.verification_source}</p>
                  </div>
                )}
                {selectedLitModal.plantOrIngredientStudied && (
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Botanical Focus</span>
                    <p className="font-medium text-slate-800">{selectedLitModal.plantOrIngredientStudied}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                {selectedLitModal.doi && (
                  <a
                    href={`https://doi.org/${selectedLitModal.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open DOI Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {selectedLitModal.pubmedId && (
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${selectedLitModal.pubmedId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View on PubMed</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLitModal(null)}
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
