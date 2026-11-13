// src/components/researcher/formulation-rd/BatchAnalysisStep6Section.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  RotateCcw,
  Sparkles,
  Beaker,
  ChevronDown,
  Info,
} from "lucide-react";
import {
  BatchQcMeasurement,
  buildDeterministicQcSuggestions,
} from "@/lib/batch-ai-service";
import { LiteratureItem } from "./BotanicalStep1Section";

/** Compact display name for QC rows (full scientific name retained in data). */
function shortQcTestName(test: BatchQcMeasurement): string {
  const id = test.id;
  if (id === "qc-appearance") return "Appearance";
  if (id === "qc-ph") return "pH";
  if (id === "qc-viscosity") return "Viscosity";
  if (id === "qc-spreadability") return "Spreadability";
  if (id === "qc-active-assay") return "Active Marker Recovery";
  if (id === "qc-microbial-limits") return "Microbial Enumeration";
  if (id === "qc-specified-pathogens") return "Specified Dermal Pathogens";
  if (id === "qc-centrifuge-stability") return "Accelerated Physical Stability";
  if (id === "qc-density") return "Density";
  return test.testName;
}

/** Short criteria for the table; full text remains available via details. */
function shortAcceptanceCriteria(test: BatchQcMeasurement): string {
  const raw = (test.acceptanceCriteria || "").trim();
  if (!raw) return "—";
  // Drop trailing parenthetical gloss when the numeric/scientific limit remains.
  const withoutParen = raw.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (withoutParen.length > 0 && withoutParen.length < raw.length) return withoutParen;
  if (raw.length <= 72) return raw;
  return `${raw.slice(0, 70).trim()}…`;
}

function resultUnitLabel(test: BatchQcMeasurement): string | null {
  const id = test.id;
  if (id === "qc-ph") return "pH";
  if (id === "qc-viscosity") return "cP";
  if (id === "qc-spreadability") return "mm";
  if (id === "qc-active-assay") return "%";
  if (id === "qc-microbial-limits") return test.measurementUnit || "CFU/g";
  if (id === "qc-density") return "g/mL";
  return null;
}

function resolveInputType(test: BatchQcMeasurement): "number" | "text" | "select" {
  // Prefer researcher-facing input kinds from the simplified Lab QC brief.
  if (test.id === "qc-appearance" || test.id === "qc-centrifuge-stability") return "text";
  if (test.id === "qc-specified-pathogens") return "select";
  if (
    test.id === "qc-ph" ||
    test.id === "qc-viscosity" ||
    test.id === "qc-spreadability" ||
    test.id === "qc-active-assay" ||
    test.id === "qc-density"
  ) {
    return "number";
  }
  if (test.id === "qc-microbial-limits") return "text";
  if (test.inputType) return test.inputType;
  return "text";
}

export interface BatchRecord {
  id: number;
  projectId: number;
  formulationId?: number | null;
  batchNumber: string;
  testDate?: string | Date | null;
  appearance?: string | null;
  colorAppearance?: string | null;
  pH?: number | null;
  viscosity?: string | null;
  density?: string | null;
  stabilityCentrifuge?: string | null;
  microbialLimitStatus?: string | null;
  assayMethod?: string | null;
  assayResults?: string | null;
  status: string;
  notes?: string | null;
  activeConcentrationPercent: number;
  batchSizeGrams: number;
  activeIngredientMass?: number | null;
  excipientMassSum?: number | null;
  massBalanceStatus?: string | null;
  stabilityObservations?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface BatchAnalysisStep6Props {
  projectId: number;
  plantName: string;
  plantScientificName?: string;
  formulationCode?: string;
  formulationName?: string;
  dosageFormType?: string;
  targetBatchSize?: string | number;
  versionNumber?: string;
  components: any[];
  materials?: any[];
  batches: BatchRecord[];
  onBatchesChange: (newBatches: BatchRecord[]) => void;
  literatureReferences?: LiteratureItem[];
  isSaving: boolean;
  onSaveDraft: () => Promise<boolean | void>;
  saveStatus: "idle" | "saving" | "saved" | "error";
  onProceedToInSilico?: () => void;
  /** Reviewer / read-only mode: hide simulate/analyze and disable QC entry */
  readOnly?: boolean;
}

// Illustrative sample demonstration values (Non-empirical preview).
// Numeric tests store value only — units are shown beside the input.
const SAMPLE_QC_VALUES: Record<string, string> = {
  "qc-appearance": "Homogeneous translucent amber gel",
  "qc-ph": "5.42",
  "qc-viscosity": "3250",
  "qc-spreadability": "53",
  "qc-active-assay": "98.4",
  "qc-microbial-limits": "TAMC 12 CFU/g; TYMC <10 CFU/g",
  "qc-specified-pathogens": "Absent in 1.0 g (Pass)",
  "qc-centrifuge-stability": "No phase separation observed (Pass)",
  "qc-density": "1.045",
};

function getSampleValueForTest(test: BatchQcMeasurement): string {
  if (SAMPLE_QC_VALUES[test.id]) return SAMPLE_QC_VALUES[test.id];
  const nameLower = test.testName.toLowerCase();
  if (nameLower.includes("appearance") || nameLower.includes("color")) return "Homogeneous translucent amber gel";
  if (nameLower.includes("ph")) return "5.42";
  if (nameLower.includes("viscosity")) return "3250";
  if (nameLower.includes("spreadability")) return "53";
  if (nameLower.includes("assay") || nameLower.includes("recovery")) return "98.4";
  if (nameLower.includes("microbial") || nameLower.includes("tamc")) return "TAMC 12 CFU/g; TYMC <10 CFU/g";
  if (nameLower.includes("pathogen")) return "Absent in 1.0 g (Pass)";
  if (nameLower.includes("centrifuge") || nameLower.includes("stability")) return "No phase separation observed (Pass)";
  if (nameLower.includes("density")) return "1.045";
  return "Compliant (Simulated Sample)";
}

export default function BatchAnalysisStep6Section({
  projectId,
  plantName,
  plantScientificName,
  formulationCode = "EXP-GEL",
  formulationName,
  dosageFormType = "Topical Hydrogel",
  targetBatchSize = 500,
  versionNumber = "v1.0",
  components = [],
  materials = [],
  batches = [],
  onBatchesChange,
  isSaving,
  saveStatus,
  readOnly = false,
}: BatchAnalysisStep6Props) {
  // Parse numeric default batch size (e.g. "500 g" -> 500)
  const parsedDefaultBatchSize = useMemo(() => {
    if (typeof targetBatchSize === "number") return targetBatchSize;
    const match = String(targetBatchSize).match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 500;
  }, [targetBatchSize]);

  // =========================================================================
  // 1. SELECTED BATCH & BATCH STATE MANAGEMENT
  // =========================================================================
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(() => {
    return batches.length > 0 ? batches[0].id : null;
  });

  // Keep selectedBatchId valid when batches prop updates
  useEffect(() => {
    if (batches.length > 0) {
      if (selectedBatchId === null || !batches.some((b) => b.id === selectedBatchId)) {
        setSelectedBatchId(batches[0].id);
      }
    }
  }, [batches, selectedBatchId]);

  const selectedBatch = useMemo(() => {
    if (batches.length === 0) return null;
    return batches.find((b) => b.id === selectedBatchId) || batches[0];
  }, [batches, selectedBatchId]);

  const batchNumber = useMemo(() => {
    if (selectedBatch?.batchNumber) return selectedBatch.batchNumber;
    return `${formulationCode}-B01`;
  }, [selectedBatch, formulationCode]);

  const formVersion = useMemo(() => {
    return versionNumber || "v1.0";
  }, [versionNumber]);

  const batchSizeGrams = useMemo(() => {
    if (selectedBatch?.batchSizeGrams) {
      const num = Number(selectedBatch.batchSizeGrams);
      if (!isNaN(num) && num > 0) return num;
    }
    return parsedDefaultBatchSize;
  }, [selectedBatch, parsedDefaultBatchSize]);

  // Synchronized active components from Step 5
  const [activeComponents, setActiveComponents] = useState<any[]>(() => {
    return Array.isArray(components) && components.length > 0 ? components : [];
  });

  useEffect(() => {
    if (Array.isArray(components) && components.length > 0) {
      setActiveComponents(components);
    }
  }, [components]);

  // =========================================================================
  // 2. CONCENTRATION UNIFICATION (ZERO MISMATCH GUARANTEE)
  // =========================================================================
  const currentActivePct = useMemo(() => {
    // 1. If batch record has activeConcentrationPercent
    if (selectedBatch?.activeConcentrationPercent) {
      const num = Number(selectedBatch.activeConcentrationPercent);
      if (!isNaN(num) && num > 0) return num;
    }

    // 2. If batchNumber contains an explicit concentration code (e.g. BATCH-10PCT)
    if (selectedBatch?.batchNumber) {
      const codeMatch = selectedBatch.batchNumber.match(/(\d+(\.\d+)?)PCT/i);
      if (codeMatch) return parseFloat(codeMatch[1]);
    }

    // 3. Fallback to active constituent concentration from Step 5 components
    const activeComp = activeComponents.find(
      (c) =>
        c.componentType === "ACTIVE" ||
        c.componentType === "ACTIVE_EXTRACT" ||
        (c.roleOrFunction || c.roleInFormulation || c.role || "").toLowerCase().includes("active") ||
        (c.componentName || c.ingredientName || c.name || "").toLowerCase().includes("extract")
    );
    if (activeComp) {
      const raw = activeComp.concentrationValue ?? activeComp.concentration ?? activeComp.targetPercentage;
      const num = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
      if (!isNaN(num) && num > 0) return num;
    }

    return 5.0;
  }, [selectedBatch, activeComponents]);

  // Friendly dosage form name (e.g. Hydrogel)
  const displayDosageForm = useMemo(() => {
    const dt = dosageFormType || "Topical Hydrogel";
    if (dt.toLowerCase().includes("hydrogel")) return "Hydrogel";
    if (dt.toLowerCase().includes("cream")) return "Cream";
    if (dt.toLowerCase().includes("ointment")) return "Ointment";
    if (dt.toLowerCase().includes("syrup")) return "Syrup";
    return dt;
  }, [dosageFormType]);

  // =========================================================================
  // 3. AUTOMATIC BATCH RECIPE CALCULATION & VEHICLE REBALANCING
  // =========================================================================
  const normalizedIngredients = useMemo(() => {
    if (!Array.isArray(activeComponents) || activeComponents.length === 0) {
      return [];
    }

    // Identify active and vehicle components
    let activeIdx = activeComponents.findIndex(
      (c) =>
        c.componentType === "ACTIVE" ||
        c.componentType === "ACTIVE_EXTRACT" ||
        (c.roleOrFunction || c.roleInFormulation || c.role || "").toLowerCase().includes("active") ||
        (c.componentName || c.ingredientName || c.name || "").toLowerCase().includes("extract")
    );
    if (activeIdx === -1) activeIdx = 0;

    let vehicleIdx = activeComponents.findIndex(
      (c, idx) =>
        idx !== activeIdx &&
        (c.componentType === "VEHICLE" ||
          c.isVehicle ||
          (c.roleOrFunction || c.roleInFormulation || c.role || "").toLowerCase().includes("vehicle") ||
          (c.roleOrFunction || c.roleInFormulation || c.role || "").toLowerCase().includes("q.s") ||
          (c.componentName || c.ingredientName || c.name || "").toLowerCase().includes("water"))
    );

    // Sum fixed excipients
    let fixedExcipientsSum = 0;
    activeComponents.forEach((c, idx) => {
      if (idx !== activeIdx && idx !== vehicleIdx) {
        const raw = c.concentrationValue ?? c.concentration ?? c.targetPercentage ?? 0;
        const val = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/[^0-9.]/g, "")) || 0;
        fixedExcipientsSum += val;
      }
    });

    const mapped = activeComponents.map((c, idx) => {
      const name = c.componentName || c.ingredientName || c.name || `Ingredient ${idx + 1}`;
      const role = c.roleOrFunction || c.roleInFormulation || c.role || "Compounding Excipient";
      const type = c.componentType || c.type || "EXCIPIENT";

      let targetPct = 0;
      if (idx === activeIdx) {
        targetPct = currentActivePct;
      } else if (idx === vehicleIdx) {
        targetPct = Math.max(0, 100.0 - currentActivePct - fixedExcipientsSum);
      } else {
        const raw = c.concentrationValue ?? c.concentration ?? c.targetPercentage ?? 0;
        targetPct = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/[^0-9.]/g, "")) || 0;
      }

      const targetMass = (batchSizeGrams * targetPct) / 100;

      return {
        id: c.id || idx + 1,
        name,
        role,
        type,
        targetPercentage: targetPct,
        targetMassGrams: targetMass,
        actualPercentage: null,
        actualMassGrams: null,
        status: "Planned",
      };
    });

    // Drop empty / duplicate zero rows so the recipe stays readable
    return mapped.filter((ing) => ing.targetPercentage > 0.001 || ing.targetMassGrams > 0.001);
  }, [activeComponents, currentActivePct, batchSizeGrams]);

  // Mass balance validation sums
  const totalRecipePercentage = useMemo(() => {
    return normalizedIngredients.reduce((sum, ing) => sum + ing.targetPercentage, 0);
  }, [normalizedIngredients]);

  const totalRecipeMass = useMemo(() => {
    return normalizedIngredients.reduce((sum, ing) => sum + ing.targetMassGrams, 0);
  }, [normalizedIngredients]);

  const activeMass = useMemo(() => {
    return (batchSizeGrams * currentActivePct) / 100;
  }, [batchSizeGrams, currentActivePct]);

  // =========================================================================
  // 4. QUALITY CONTROL: INDEPENDENT REAL & SAMPLE DATA STATES
  // =========================================================================
  // Default compendial tests template
  const defaultQcTests = useMemo<BatchQcMeasurement[]>(() => {
    const defaults = buildDeterministicQcSuggestions({
      projectId,
      plantName,
      dosageFormType,
      targetBatchSize: parsedDefaultBatchSize,
    });
    return defaults.map((d) => ({
      id: d.id,
      testName: d.testName,
      category: d.category,
      purpose: d.purpose,
      measurementUnit: d.measurementUnit,
      recommendedMethod: d.recommendedMethod,
      scientificReference: d.scientificReference,
      acceptanceCriteria: d.acceptanceCriteria,
      measuredValue: "", // STRICTLY EMPTY BY DEFAULT
      status: "Ready" as const,
      analystNotes: "",
      isCustom: false,
      inputType: d.inputType,
      defaultOptions: d.defaultOptions,
    }));
  }, [projectId, plantName, dosageFormType, parsedDefaultBatchSize]);

  // Actual Laboratory Results state (strictly empirical, user entered or DB restored)
  const [realQcTests, setRealQcTests] = useState<BatchQcMeasurement[]>(defaultQcTests);

  // Simulated Sample Results state (independent demonstration values)
  const [sampleQcTests, setSampleQcTests] = useState<BatchQcMeasurement[] | null>(null);

  // Active mode indicator
  const [isSampleMode, setIsSampleMode] = useState<boolean>(false);
  const [sampleNotification, setSampleNotification] = useState<string | null>(null);
  const [expandedCriteriaId, setExpandedCriteriaId] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisIsSimulated, setAnalysisIsSimulated] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rehydrate real measurements & report from selected batch
  useEffect(() => {
    if (selectedBatch && selectedBatch.notes) {
      try {
        const parsed = JSON.parse(selectedBatch.notes);
        if (Array.isArray(parsed.qcMeasurements) && parsed.qcMeasurements.length > 0) {
          // If notes were saved from a simulated demo run, keep real inputs clean
          if (parsed.report?.isSimulated || parsed.isSimulated) {
            setAnalysisResult(parsed.report?.shortSummary || parsed.report?.aiInterpretation || null);
            setAnalysisIsSimulated(true);
          } else {
            // Merge UI metadata from catalog defaults without overwriting saved results
            const merged = parsed.qcMeasurements.map((saved: BatchQcMeasurement) => {
              const fallback = defaultQcTests.find((d) => d.id === saved.id);
              return {
                ...saved,
                inputType: saved.inputType || fallback?.inputType,
                defaultOptions: saved.defaultOptions || fallback?.defaultOptions,
                acceptanceCriteria: saved.acceptanceCriteria || fallback?.acceptanceCriteria || "",
                measurementUnit: saved.measurementUnit || fallback?.measurementUnit || "",
              };
            });
            setRealQcTests(merged);
            if (parsed.report?.shortSummary) {
              setAnalysisResult(parsed.report.shortSummary);
            } else if (parsed.report?.aiInterpretation) {
              setAnalysisResult(parsed.report.aiInterpretation);
            }
            setAnalysisIsSimulated(false);
          }
        }
      } catch {}
    } else {
      setAnalysisResult(null);
      setAnalysisIsSimulated(false);
    }
  }, [selectedBatch, defaultQcTests]);

  // The active measurements currently displayed in the table
  const displayedQcTests = useMemo(() => {
    if (isSampleMode && sampleQcTests && sampleQcTests.length > 0) {
      return sampleQcTests;
    }
    return realQcTests;
  }, [isSampleMode, sampleQcTests, realQcTests]);

  // Real laboratory test count
  const realTestedCount = useMemo(
    () => realQcTests.filter((t) => t.measuredValue && t.measuredValue.trim().length > 0).length,
    [realQcTests]
  );

  // Sample test count
  const sampleTestedCount = useMemo(
    () => (sampleQcTests ? sampleQcTests.filter((t) => t.measuredValue && t.measuredValue.trim().length > 0).length : 0),
    [sampleQcTests]
  );

  const activeTestedCount = isSampleMode ? sampleTestedCount : realTestedCount;
  const totalCount = displayedQcTests.length;

  // Generate Sample Results Handler (Populates sample state ONLY)
  const handleGenerateSampleResults = () => {
    if (readOnly) return;
    const simulated: BatchQcMeasurement[] = realQcTests.map((t) => ({
      ...t,
      measuredValue: getSampleValueForTest(t),
      status: "Measured",
    }));

    setSampleQcTests(simulated);
    setIsSampleMode(true);
    // Lab QC table is always visible; sample mode swaps displayed values in place.
    setSampleNotification("Populated illustrative sample values for all 8 tests. (Demonstration Preview)");
  };

  // Clear Sample Results Handler (Restores real laboratory form)
  const handleClearSampleResults = () => {
    if (readOnly) return;
    setSampleQcTests(null);
    setIsSampleMode(false);
    setSampleNotification(null);
  };

  // Update measurement handler (Separates real and sample writes)
  const handleUpdateTestValue = (id: string, value: string) => {
    if (readOnly) return;
    if (isSampleMode) {
      setSampleQcTests((prev) =>
        (prev || []).map((test) =>
          test.id === id
            ? {
                ...test,
                measuredValue: value,
                status: value.trim().length > 0 ? "Measured" : "Ready",
              }
            : test
        )
      );
    } else {
      setRealQcTests((prev) =>
        prev.map((test) =>
          test.id === id
            ? {
                ...test,
                measuredValue: value,
                status: value.trim().length > 0 ? "Measured" : "Ready",
              }
            : test
        )
      );
    }
  };

  // =========================================================================
  // 5. PRIMARY ACTION: ANALYZE MY BATCH
  // =========================================================================
  const handleAnalyzeMyBatch = async () => {
    if (readOnly) return;
    if (normalizedIngredients.length === 0) {
      setErrorMessage("No formulation ingredients found. Please complete Step 5 Formulation Builder first.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const payload = {
        batchNumber: batchNumber.trim(),
        formulationType: dosageFormType,
        batchSizeGrams,
        formulationVersion: formVersion,
        isPrepared: activeTestedCount > 0,
        ingredients: normalizedIngredients,
        qcMeasurements: displayedQcTests,
        isSimulated: isSampleMode, // STRICT SEPARATION: never flag real measurements as simulated or vice versa
      };

      const res = await fetch(`/api/researcher/projects/${projectId}/batch-analyses/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze batch");

      const generated = data.report?.shortSummary || data.report?.aiInterpretation;
      setAnalysisResult(
        generated ||
          `Batch ${batchNumber} (${currentActivePct}% w/w ${plantName} ${displayDosageForm}) recipe is mathematically verified with 100.0% mass balance across ${normalizedIngredients.length} ingredients totaling ${batchSizeGrams} g. Empirical physical testing remains pending bench compounding.`
      );
      setAnalysisIsSimulated(Boolean(isSampleMode || data.report?.isSimulated));

      // Refresh batches from server only for real runs so real empirical records are synced
      if (!isSampleMode) {
        const fetchRes = await fetch(`/api/researcher/projects/${projectId}/batch-analyses`);
        if (fetchRes.ok) {
          const full = await fetchRes.json();
          if (Array.isArray(full.batches)) {
            onBatchesChange(full.batches);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze batch");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const easeOut = [0.22, 1, 0.36, 1] as const;
  const isMassBalanced = Math.abs(totalRecipePercentage - 100) < 0.05;
  const hasRecipe = normalizedIngredients.length > 0;
  const qcCompletedCount = isSampleMode ? sampleTestedCount : realTestedCount;
  const fieldClass =
    "h-9 w-full rounded-lg border border-[#d5e3da] bg-[#fbfdfb] px-2.5 font-mono text-[11px] text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15";

  const renderQcInput = (t: BatchQcMeasurement) => {
    const inputType = resolveInputType(t);
    const unit = resultUnitLabel(t);
    const missing = !(t.measuredValue && t.measuredValue.trim().length > 0);
    const options = t.defaultOptions || [];
    const samplePad = isSampleMode ? "pr-14" : unit ? "pr-10" : "";

    if (readOnly) {
      const display = (t.measuredValue && t.measuredValue.trim()) || "—";
      return (
        <div className="rounded-lg border border-[#eef4f0] bg-[#f8fbf9] px-2.5 py-1.5 font-mono text-[11px] text-[#0f2c20]">
          {display}
          {unit && display !== "—" ? (
            <span className="ml-1 text-[10px] font-semibold text-[#8aa094]">{unit}</span>
          ) : null}
        </div>
      );
    }

    if (inputType === "select" && options.length > 0) {
      return (
        <div className="relative">
          <select
            value={t.measuredValue}
            onChange={(e) => handleUpdateTestValue(t.id, e.target.value)}
            className={`${fieldClass} ${samplePad} ${
              missing ? "border-amber-300 bg-amber-50/40" : ""
            } ${isSampleMode ? "border-amber-300 bg-amber-50/40" : ""}`}
            aria-label={`${shortQcTestName(t)} result`}
          >
            <option value="">Select result…</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            {t.measuredValue && !options.includes(t.measuredValue) ? (
              <option value={t.measuredValue}>{t.measuredValue}</option>
            ) : null}
          </select>
          {isSampleMode && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold text-amber-800">
              Sample
            </span>
          )}
        </div>
      );
    }

    // text + decimal keyboard keeps legacy saved values (e.g. "3250 cP") displayable
    // while presenting a numeric entry surface; units sit beside the field.
    return (
      <div className="relative">
        <input
          type="text"
          inputMode={inputType === "number" ? "decimal" : "text"}
          placeholder={missing ? "Enter result" : undefined}
          value={t.measuredValue}
          onChange={(e) => handleUpdateTestValue(t.id, e.target.value)}
          className={`${fieldClass} ${samplePad} ${
            missing ? "border-amber-300/80 bg-amber-50/30" : ""
          } ${isSampleMode ? "border-amber-300 bg-amber-50/40" : ""}`}
          aria-label={`${shortQcTestName(t)} result`}
        />
        {unit && !isSampleMode ? (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#8aa094]">
            {unit}
          </span>
        ) : null}
        {isSampleMode && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold text-amber-800">
            Sample
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Compact page header / batch summary */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
              <Activity className="h-4 w-4 text-emerald-700" />
              Batch Analysis
            </h2>
            <p className="mt-0.5 truncate text-[12px] font-medium text-[#52645d]">
              {formulationName || `${currentActivePct}% ${plantName} ${displayDosageForm}`}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#6d7f76]">
              {batches.length > 1 ? (
                <select
                  value={selectedBatchId || ""}
                  onChange={(e) => setSelectedBatchId(Number(e.target.value))}
                  className="rounded-md border border-[#d5e3da] bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#0f2c20] outline-none focus:border-emerald-600"
                  aria-label="Select batch"
                >
                  {batches.map((b) => {
                    const conc =
                      b.activeConcentrationPercent ||
                      b.batchNumber.match(/(\d+)PCT/i)?.[1] ||
                      "5";
                    return (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber} ({conc}% · {b.batchSizeGrams} g)
                      </option>
                    );
                  })}
                </select>
              ) : (
                <span className="font-mono font-semibold text-[#0f2c20]">{batchNumber}</span>
              )}
              <span className="text-[#d7e4dc]">·</span>
              <span>{formVersion}</span>
              <span className="text-[#d7e4dc]">·</span>
              <span>{batchSizeGrams} g</span>
              <span className="text-[#d7e4dc]">·</span>
              <span>{currentActivePct}% active</span>
            </div>
          </div>
          {!readOnly && (
          <div className="shrink-0 text-[11px] font-semibold">
            {saveStatus === "saving" || isSaving ? (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                Saving...
              </span>
            ) : saveStatus === "saved" ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md border border-[#d7e4dc] bg-[#f7faf8] px-2 py-0.5 text-[#6d7f76]">
                Draft
              </span>
            )}
          </div>
          )}
        </div>

        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-900"
            >
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                {errorMessage}
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-800"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Batch Recipe */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="space-y-2 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f0eb] pb-2.5">
          <h3 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
            <Layers className="h-4 w-4 text-emerald-700" />
            Batch Recipe
          </h3>
          {isMassBalanced ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
              <CheckCircle2 className="h-3 w-3" />
              100% balanced · {totalRecipeMass.toFixed(2)} g
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
              <AlertCircle className="h-3 w-3" />
              {totalRecipePercentage.toFixed(1)}% · {totalRecipeMass.toFixed(2)} g
            </span>
          )}
        </div>

        {hasRecipe ? (
          <div className="overflow-x-auto rounded-xl border border-[#d7e4dc]/90">
            <table className="w-full min-w-[28rem] text-left text-xs">
              <thead className="border-b border-[#e8f0eb] bg-[#f7faf8] text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                <tr>
                  <th className="px-2.5 py-1.5 font-bold">Ingredient</th>
                  <th className="hidden px-2.5 py-1.5 font-bold sm:table-cell">Role</th>
                  <th className="px-2.5 py-1.5 font-bold text-right">Concentration</th>
                  <th className="px-2.5 py-1.5 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8f0eb]">
                {normalizedIngredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-[#f7faf8]">
                    <td className="px-2.5 py-1.5">
                      <span className="block font-semibold text-[#0f2c20]">{ing.name}</span>
                      <span className="text-[10px] text-[#8aa094] sm:hidden">{ing.role}</span>
                    </td>
                    <td className="hidden px-2.5 py-1.5 text-[11px] text-[#6d7f76] sm:table-cell">
                      {ing.role}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-[11px] text-[#0f2c20]">
                      {ing.targetPercentage.toFixed(2)}%
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-[11px] font-semibold text-emerald-800">
                      {ing.targetMassGrams.toFixed(2)} g
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#e8f0eb] bg-[#f7faf8] text-xs font-bold text-[#0f2c20]">
                  <td className="px-2.5 py-2" colSpan={2}>
                    Total
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono">
                    {totalRecipePercentage.toFixed(2)}%
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono">
                    {totalRecipeMass.toFixed(2)} g
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            No formulation ingredients yet — complete Formulation Development first.
          </div>
        )}
      </motion.section>

      {/* Laboratory QC */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: easeOut }}
        className="space-y-2 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
              <Beaker className="h-4 w-4 text-emerald-700" />
              Laboratory QC
            </h3>
            <p className="mt-0.5 text-[11px] text-[#6d7f76]">
              {qcCompletedCount} of {totalCount || 8} tests completed
              {isSampleMode ? " · Sample preview" : ""}
            </p>
          </div>
          {!readOnly &&
            (isSampleMode ? (
              <button
                type="button"
                onClick={handleClearSampleResults}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-100"
              >
                <RotateCcw className="h-3 w-3" />
                Clear samples
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateSampleResults}
                className="inline-flex items-center gap-1 rounded-lg border border-[#d7e4dc] bg-[#f7faf8] px-2.5 py-1 text-[11px] font-semibold text-[#52645d] hover:border-emerald-400 hover:bg-emerald-50"
                title="Fill illustrative demo values for all QC tests"
              >
                <Sparkles className="h-3 w-3 text-emerald-700" />
                Generate Samples
              </button>
            ))}
        </div>

        <AnimatePresence>
          {sampleNotification && isSampleMode && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 shrink-0 text-amber-600" />
                {sampleNotification}
              </span>
              <button type="button" onClick={() => setSampleNotification(null)}>
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto rounded-xl border border-[#d7e4dc]/90">
          <table className="w-full min-w-[36rem] text-left text-xs">
            <thead className="border-b border-[#e8f0eb] bg-[#f7faf8] text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
              <tr>
                <th className="px-2.5 py-1.5 font-bold">Test</th>
                <th className="px-2.5 py-1.5 font-bold">Acceptance criteria</th>
                <th className="w-[12.5rem] px-2.5 py-1.5 font-bold sm:w-[14rem]">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8f0eb]">
              {displayedQcTests.map((t) => {
                const missing = !(t.measuredValue && t.measuredValue.trim().length > 0);
                const expanded = expandedCriteriaId === t.id;
                const shortCrit = shortAcceptanceCriteria(t);
                const showExpand =
                  (t.acceptanceCriteria || "").length > shortCrit.length ||
                  Boolean(t.purpose || t.recommendedMethod);

                return (
                  <tr
                    key={t.id}
                    className={isSampleMode ? "bg-amber-50/25" : missing ? "bg-amber-50/15" : "bg-white"}
                  >
                    <td className="px-2.5 py-2 align-top">
                      <span className="font-semibold text-[#0f2c20]">{shortQcTestName(t)}</span>
                      {missing && (
                        <span className="mt-0.5 block text-[10px] font-medium text-amber-700">
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-2 align-top">
                      <div className="flex items-start gap-1">
                        <span className="text-[11px] leading-snug text-[#52645d]">{shortCrit}</span>
                        {showExpand && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCriteriaId(expanded ? null : t.id)
                            }
                            className="mt-0.5 shrink-0 rounded p-0.5 text-[#8aa094] hover:bg-[#eef4f0] hover:text-[#52645d]"
                            title="Show full criteria"
                            aria-expanded={expanded}
                          >
                            {expanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <Info className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-1 space-y-0.5 overflow-hidden text-[10px] leading-relaxed text-[#6d7f76]"
                          >
                            <p>{t.acceptanceCriteria}</p>
                            {t.purpose ? <p>Purpose: {t.purpose}</p> : null}
                            {t.recommendedMethod ? (
                              <p>Method: {t.recommendedMethod}</p>
                            ) : null}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                    <td className="px-2.5 py-2 align-top">{renderQcInput(t)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Analyze Batch */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12, ease: easeOut }}
        className="space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h3 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#0f2c20]">
              <FlaskConical className="h-4 w-4 text-emerald-700" />
              Analyze Batch
            </h3>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${
                  hasRecipe
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {hasRecipe ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                Batch: {hasRecipe ? "Recipe ready" : "Missing recipe"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${
                  qcCompletedCount === totalCount && totalCount > 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-[#d7e4dc] bg-[#f7faf8] text-[#52645d]"
                }`}
              >
                QC: {qcCompletedCount} of {totalCount || 8} completed
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${
                  isMassBalanced
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                Mass balance: {isMassBalanced ? "100%" : `${totalRecipePercentage.toFixed(1)}%`}
              </span>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAnalyzeMyBatch}
              disabled={isAnalyzing || !hasRecipe}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            >
              <FlaskConical className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
              {isAnalyzing ? "Analyzing..." : "Analyze My Batch"}
            </button>
          )}
        </div>

        {!hasRecipe && (
          <p className="text-[11px] text-amber-800">
            Complete Formulation Development and ensure ingredients sum to 100% before analyzing.
          </p>
        )}

        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`space-y-2 rounded-xl border p-3 text-xs ${
                analysisIsSimulated
                  ? "border-amber-200 bg-amber-50/70 text-amber-950"
                  : "border-[#e8f0eb] bg-[#f7faf8] text-[#52645d]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0f2c20]">
                  {analysisIsSimulated ? (
                    <>
                      <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
                      Sample analysis
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Analysis result
                    </>
                  )}
                </span>
                <span className="rounded-md border border-[#d7e4dc] bg-white px-2 py-0.5 font-mono text-[10px] text-[#6d7f76]">
                  {analysisIsSimulated
                    ? `Simulated · ${activeTestedCount}/${totalCount}`
                    : `${activeTestedCount}/${totalCount} tests entered`}
                </span>
              </div>
              <p className="leading-relaxed text-[11px] text-[#0f2c20]">{analysisResult}</p>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#e8f0eb] bg-white p-2 font-mono text-[10px] sm:grid-cols-4">
                <div>
                  <span className="block text-[#8aa094]">Batch</span>
                  <span className="font-bold text-[#0f2c20]">{batchSizeGrams} g</span>
                </div>
                <div>
                  <span className="block text-[#8aa094]">Active</span>
                  <span className="font-bold text-emerald-800">
                    {currentActivePct.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="block text-[#8aa094]">Active mass</span>
                  <span className="font-bold text-[#0f2c20]">{activeMass.toFixed(2)} g</span>
                </div>
                <div>
                  <span className="block text-[#8aa094]">Balance</span>
                  <span className="font-bold text-emerald-800">
                    {isMassBalanced ? "100%" : `${totalRecipePercentage.toFixed(1)}%`}
                  </span>
                </div>
              </div>
              {analysisIsSimulated && (
                <p className="text-[10px] italic text-[#8aa094]">
                  Illustrative simulation only — not for regulatory release.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
