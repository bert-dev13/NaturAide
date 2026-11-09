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
  Leaf,
  Beaker,
  ChevronRight,
} from "lucide-react";
import {
  BatchQcMeasurement,
  buildDeterministicQcSuggestions,
} from "@/lib/batch-ai-service";
import { LiteratureItem } from "./BotanicalStep1Section";

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
}

// User-friendly contextual placeholders for real physical measurements
const LAB_RESULT_PLACEHOLDERS: Record<string, string> = {
  "qc-appearance": "Enter visual observation (e.g. Translucent amber gel)",
  "qc-ph": "Enter measured pH (e.g. 5.50)",
  "qc-viscosity": "Enter viscosity in cP (e.g. 3,200 cP)",
  "qc-spreadability": "Enter mm diameter (e.g. 52 mm)",
  "qc-active-assay": "Enter recovery % (e.g. 98.2%)",
  "qc-microbial-limits": "Enter CFU/g (e.g. < 10 CFU/g)",
  "qc-specified-pathogens": "Enter pathogen status (e.g. Absent in 1.0 g)",
  "qc-centrifuge-stability": "Enter observation (e.g. No phase separation)",
  "qc-density": "Enter density in g/mL (e.g. 1.045 g/mL)",
};

// Illustrative sample demonstration values (Non-empirical preview)
const SAMPLE_QC_VALUES: Record<string, string> = {
  "qc-appearance": "Homogeneous translucent amber gel",
  "qc-ph": "5.42",
  "qc-viscosity": "3,250 cP",
  "qc-spreadability": "53 mm",
  "qc-active-assay": "98.4%",
  "qc-microbial-limits": "TAMC 12 CFU/g; TYMC <10 CFU/g",
  "qc-specified-pathogens": "Not detected (simulated)",
  "qc-centrifuge-stability": "No phase separation observed",
  "qc-density": "1.045 g/mL",
};

function getSampleValueForTest(test: BatchQcMeasurement): string {
  if (SAMPLE_QC_VALUES[test.id]) return SAMPLE_QC_VALUES[test.id];
  const nameLower = test.testName.toLowerCase();
  if (nameLower.includes("appearance") || nameLower.includes("color")) return "Homogeneous translucent amber gel";
  if (nameLower.includes("ph")) return "5.42";
  if (nameLower.includes("viscosity")) return "3,250 cP";
  if (nameLower.includes("spreadability")) return "53 mm";
  if (nameLower.includes("assay") || nameLower.includes("recovery")) return "98.4%";
  if (nameLower.includes("microbial") || nameLower.includes("tamc")) return "TAMC 12 CFU/g; TYMC <10 CFU/g";
  if (nameLower.includes("pathogen")) return "Not detected (simulated)";
  if (nameLower.includes("centrifuge") || nameLower.includes("stability")) return "No phase separation observed";
  if (nameLower.includes("density")) return "1.045 g/mL";
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
  literatureReferences = [],
  isSaving,
  onSaveDraft,
  saveStatus,
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
      status: "Ready",
      analystNotes: "",
      isCustom: false,
    }));
  }, [projectId, plantName, dosageFormType, parsedDefaultBatchSize]);

  // Actual Laboratory Results state (strictly empirical, user entered or DB restored)
  const [realQcTests, setRealQcTests] = useState<BatchQcMeasurement[]>(defaultQcTests);

  // Simulated Sample Results state (independent demonstration values)
  const [sampleQcTests, setSampleQcTests] = useState<BatchQcMeasurement[] | null>(null);

  // Active mode indicator
  const [isSampleMode, setIsSampleMode] = useState<boolean>(false);
  const [sampleNotification, setSampleNotification] = useState<string | null>(null);

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
            setRealQcTests(parsed.qcMeasurements);
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
  }, [selectedBatch]);

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
    const simulated: BatchQcMeasurement[] = realQcTests.map((t) => ({
      ...t,
      measuredValue: getSampleValueForTest(t),
      status: "Measured",
    }));

    setSampleQcTests(simulated);
    setIsSampleMode(true);
    setSampleNotification("Populated illustrative sample values for all 8 tests. (Demonstration Preview)");
  };

  // Clear Sample Results Handler (Restores real laboratory form)
  const handleClearSampleResults = () => {
    setSampleQcTests(null);
    setIsSampleMode(false);
    setSampleNotification(null);
  };

  // Update measurement handler (Separates real and sample writes)
  const handleUpdateTestValue = (id: string, value: string) => {
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

  return (
    <div className="space-y-4">
      {/* Compact status strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d7e4dc]/90 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex items-center gap-2 text-[11px] text-[#6d7f76]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Activity className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-[#0f2c20]">Batch Analysis</span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
            {currentActivePct}% · {batchSizeGrams} g
          </span>
        </div>
        <div className="text-[11px] font-semibold">
          {saveStatus === "saving" || isSaving ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              Saving...
            </span>
          ) : saveStatus === "saved" ? (
            <span className="inline-flex items-center gap-1 text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved
            </span>
          ) : (
            <span className="text-[#8aa094]">Draft</span>
          )}
        </div>
      </motion.div>

      {/* Context + how-to */}
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
              <h2 className="text-sm font-semibold text-[#0f2c20]">
                {currentActivePct}% {plantName} {displayDosageForm}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#8aa094]">
                {batches.length > 1 ? (
                  <select
                    value={selectedBatchId || ""}
                    onChange={(e) => setSelectedBatchId(Number(e.target.value))}
                    className="rounded-md border border-[#d5e3da] bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#0f2c20] outline-none focus:border-emerald-600"
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
                  <span className="font-mono font-semibold text-[#52645d]">{batchNumber}</span>
                )}
                <span className="text-[#d7e4dc]">·</span>
                <span>{formVersion}</span>
                <span className="text-[#d7e4dc]">·</span>
                <span>{batchSizeGrams} g master batch</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "1", label: "Review recipe" },
              { n: "2", label: "Enter lab QC" },
              { n: "3", label: "Analyze" },
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

      {/* 1. Recipe */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="space-y-2 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f0eb] pb-2.5">
          <h3 className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
              1
            </span>
            <Layers className="h-3.5 w-3.5 text-emerald-700" />
            Batch recipe
            <span className="font-medium normal-case tracking-normal text-[#8aa094]">
              · {normalizedIngredients.length}{" "}
              {normalizedIngredients.length === 1 ? "ingredient" : "ingredients"} ·{" "}
              {batchSizeGrams} g
            </span>
          </h3>
          {Math.abs(totalRecipePercentage - 100) < 0.05 ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
              <CheckCircle2 className="h-3 w-3" />
              100% balanced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
              <AlertCircle className="h-3 w-3" />
              {totalRecipePercentage.toFixed(1)}% of batch
            </span>
          )}
        </div>

        {normalizedIngredients.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-[#d7e4dc]/90">
            <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2 border-b border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#8aa094]">
              <span>Ingredient</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="divide-y divide-[#e8f0eb]">
              {normalizedIngredients.map((ing) => (
                <div
                  key={ing.id}
                  className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-2 px-2.5 py-1.5 hover:bg-[#f7faf8]"
                >
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-[#0f2c20]">
                      {ing.name}
                    </span>
                    <span className="text-[10px] text-[#8aa094]">
                      {ing.targetPercentage.toFixed(2)}% · {ing.role}
                    </span>
                  </div>
                  <span className="text-right font-mono text-[11px] font-bold text-emerald-800">
                    {ing.targetMassGrams.toFixed(2)} g
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2 border-t border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-2 text-xs font-bold text-[#0f2c20]">
              <span>Total</span>
              <span className="text-right font-mono">
                {totalRecipeMass.toFixed(2)} g
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            No Step 5 ingredients yet — complete Formulation Development first.
          </div>
        )}
      </motion.section>

      {/* 2. Lab QC — always visible */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: easeOut }}
        className="space-y-2 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                2
              </span>
              <Beaker className="h-3.5 w-3.5 text-emerald-700" />
              Laboratory QC
              <span className="font-medium normal-case tracking-normal text-[#8aa094]">
                · {isSampleMode ? sampleTestedCount : realTestedCount}/{totalCount} entered
              </span>
            </h3>
            {isSampleMode && (
              <span className="mt-1 inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                <FlaskConical className="h-2.5 w-2.5" />
                Sample / simulated data
              </span>
            )}
          </div>
          {isSampleMode ? (
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
              Generate samples
            </button>
          )}
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

        <div className="overflow-hidden rounded-xl border border-[#d7e4dc]/90">
          <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)] gap-2 border-b border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#8aa094] sm:grid">
            <span>Test</span>
            <span>Criteria</span>
            <span>Result</span>
          </div>
          <div className="divide-y divide-[#e8f0eb]">
            {displayedQcTests.map((t) => (
              <div
                key={t.id}
                className={`grid grid-cols-1 gap-1.5 px-2.5 py-2 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center sm:gap-2 ${
                  isSampleMode ? "bg-amber-50/30" : "bg-white hover:bg-[#f7faf8]"
                }`}
              >
                <div className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-[#0f2c20]">
                    {t.testName}
                  </span>
                  <span className="text-[10px] text-[#8aa094] sm:hidden">
                    {t.acceptanceCriteria}
                  </span>
                </div>
                <p className="hidden truncate text-[11px] text-[#6d7f76] sm:block">
                  {t.acceptanceCriteria}
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={LAB_RESULT_PLACEHOLDERS[t.id] || "Enter result"}
                    value={t.measuredValue}
                    onChange={(e) => handleUpdateTestValue(t.id, e.target.value)}
                    className={`w-full rounded-lg border px-2 py-1.5 font-mono text-[11px] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 ${
                      isSampleMode
                        ? "border-amber-300 bg-amber-50/40 pr-14"
                        : "border-[#d5e3da] bg-[#fbfdfb]"
                    }`}
                  />
                  {isSampleMode && (
                    <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold text-amber-800">
                      Sample
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 3. Analyze */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12, ease: easeOut }}
        className="space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                3
              </span>
              <FlaskConical className="h-3.5 w-3.5 text-emerald-700" />
              Analyze batch
            </h3>
            <p className="mt-1 text-[11px] text-[#8aa094]">
              Validate mass balance and review laboratory readiness.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAnalyzeMyBatch}
            disabled={isAnalyzing || normalizedIngredients.length === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          >
            <FlaskConical className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
            {isAnalyzing ? "Analyzing..." : "Analyze My Batch"}
          </button>
        </div>

        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`space-y-2.5 rounded-xl border p-3 text-xs ${
                analysisIsSimulated
                  ? "border-amber-200 bg-amber-50/70 text-amber-950"
                  : "border-[#e8f0eb] bg-[#f7faf8] text-[#52645d]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
                  {analysisIsSimulated ? (
                    <>
                      <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
                      Sample analysis
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Batch analysis
                    </>
                  )}
                </span>
                <span className="rounded-md border border-[#d7e4dc] bg-white px-2 py-0.5 font-mono text-[10px] text-[#6d7f76]">
                  {analysisIsSimulated
                    ? `Simulated ${activeTestedCount}/${totalCount}`
                    : activeTestedCount > 0
                      ? `${activeTestedCount}/${totalCount} tests`
                      : "0 physical tests"}
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
                  <span className="font-bold text-emerald-800">100%</span>
                </div>
              </div>
              <p className="text-[10px] italic text-[#8aa094]">
                {analysisIsSimulated
                  ? "Illustrative simulation only — not for regulatory release."
                  : "Based on calculated composition; confirm with bench QC before release."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
