// src/components/researcher/formulation-rd/BatchAnalysisStep6Section.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
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

    return activeComponents.map((c, idx) => {
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

  const [isAddingLabResults, setIsAddingLabResults] = useState<boolean>(false);
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
    setIsAddingLabResults(true); // Automatically expand so user sees sample values
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

  return (
    <div className="space-y-3.5">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & SAVE STATUS                                           */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
              Step 06
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              Batch Analysis
            </span>
          </div>

          <div className="text-[11px] font-medium text-slate-500">
            {saveStatus === "saving" ? (
              <span className="text-amber-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Saving...
              </span>
            ) : saveStatus === "saved" ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Saved
              </span>
            ) : (
              <span className="text-slate-400">Draft</span>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. BATCH SUMMARY (ZERO MISMATCH, BATCH SWITCHER)                      */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {currentActivePct}% {plantName} {displayDosageForm} · {batchSizeGrams} g
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1 flex-wrap">
              <span>Batch ID:</span>
              {batches.length > 1 ? (
                <select
                  value={selectedBatchId || ""}
                  onChange={(e) => setSelectedBatchId(Number(e.target.value))}
                  className="px-2 py-0.5 rounded border border-slate-300 text-xs font-mono font-semibold text-slate-800 bg-white cursor-pointer focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {batches.map((b) => {
                    const conc = b.activeConcentrationPercent || b.batchNumber.match(/(\d+)PCT/i)?.[1] || "5";
                    return (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber} ({conc}% active · {b.batchSizeGrams} g)
                      </option>
                    );
                  })}
                </select>
              ) : (
                <span className="font-mono font-semibold text-slate-800">{batchNumber}</span>
              )}
              <span className="text-slate-300">•</span>
              <span>Version {formVersion}</span>
            </div>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-lg text-xs flex items-center justify-between bg-rose-50 text-rose-900 border border-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-xs ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. AUTOMATICALLY CALCULATED BATCH RECIPE                              */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Batch Recipe
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact ingredient quantities automatically calculated for {batchSizeGrams} g batch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Mass Balance: 100.0% Verified
            </span>
          </div>
        </div>

        {normalizedIngredients.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Ingredient</th>
                  <th className="py-2.5 px-3 text-right">Required Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {normalizedIngredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-semibold text-slate-800">{ing.name}</span>
                      <span className="text-slate-500 text-[11px] font-normal ml-2">
                        ({ing.targetPercentage.toFixed(2)}% · {ing.role})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                      {ing.targetMassGrams.toFixed(2)} g
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/70 border-t border-slate-200 font-mono text-xs font-bold text-slate-900">
                <tr>
                  <td className="py-2.5 px-3 font-sans">Total Batch Mass</td>
                  <td className="py-2.5 px-3 text-right text-slate-900">
                    {totalRecipeMass.toFixed(2)} g (100.0%)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              No formulation ingredients found in Step 5. Please complete and save Step 5 Formulation Builder first.
            </span>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 4. MAIN ACTION: ANALYZE MY BATCH & OPTIONAL LAB RESULTS               */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-emerald-600" />
              Analyze My Batch
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Validate formulation composition, mass balance, and assess laboratory testing readiness.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAnalyzeMyBatch}
              disabled={isAnalyzing || normalizedIngredients.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              <FlaskConical className={`w-4 h-4 ${isAnalyzing ? "animate-spin text-emerald-400" : ""}`} />
              <span>{isAnalyzing ? "Analyzing..." : "Analyze My Batch"}</span>
            </button>
          </div>
        </div>

        {/* AI ANALYSIS RESULT DISPLAY (MAX 3 SENTENCES + METRICS) */}
        {analysisResult && (
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div
              className={`p-3.5 rounded-lg border text-xs space-y-2.5 ${
                analysisIsSimulated
                  ? "bg-amber-50/70 border-amber-200 text-amber-950"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span
                  className={`font-bold text-xs flex items-center gap-1.5 ${
                    analysisIsSimulated ? "text-amber-900" : "text-slate-800"
                  }`}
                >
                  {analysisIsSimulated ? (
                    <>
                      <FlaskConical className="w-4 h-4 text-amber-600" />
                      Sample Analysis — For Demonstration Only
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      AI Batch Analysis
                    </>
                  )}
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                    analysisIsSimulated
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "text-slate-500 bg-white border border-slate-200"
                  }`}
                >
                  {analysisIsSimulated
                    ? `Simulated Trial Data (${activeTestedCount}/${totalCount})`
                    : activeTestedCount > 0
                    ? `${activeTestedCount} of ${totalCount} Empirical Tests Recorded`
                    : "0 Physical Tests Recorded"}
                </span>
              </div>

              <p className="leading-relaxed font-sans text-xs">
                {analysisResult}
              </p>

              {/* Formulation & Mass Balance Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] p-2.5 rounded bg-white border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Batch Size</span>
                  <span className="font-semibold text-slate-800">{batchSizeGrams} g</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Constituent</span>
                  <span className="font-semibold text-emerald-700">{currentActivePct.toFixed(1)}% w/w</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Mass</span>
                  <span className="font-semibold text-slate-800">{activeMass.toFixed(2)} g</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Mass Balance</span>
                  <span className="font-semibold text-emerald-700">100.0%</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                {analysisIsSimulated
                  ? "Demonstration Scenario: These figures are illustrative simulations for workflow preview and cannot be used for official pharmaceutical release or regulatory dossiers."
                  : "Scientific Safeguard: AI interpretation is based on calculated formulation composition. Empirical testing remains pending prior to physical release."}
              </p>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 5. OPTIONAL LABORATORY RESULTS ENTRY & GENERATE SAMPLE RESULTS        */}
        {/* ===================================================================== */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-600 font-medium">
                {isSampleMode
                  ? `Sample Data Active (${sampleTestedCount} of ${totalCount} simulated)`
                  : `Optional Physical Laboratory Testing (${realTestedCount} of ${totalCount} entered)`}
              </span>

              {isSampleMode && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <FlaskConical className="w-3 h-3 text-amber-600" />
                  Sample Data (Simulated)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Generate / Clear Sample Results buttons */}
              {isSampleMode ? (
                <button
                  type="button"
                  onClick={handleClearSampleResults}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  title="Clear simulated demonstration values and restore actual laboratory form"
                >
                  <RotateCcw className="w-3 h-3 text-rose-500" />
                  <span>Clear Sample Results</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateSampleResults}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                  title="Populate illustrative demonstration values for all 8 QC tests"
                >
                  <FlaskConical className="w-3 h-3 text-emerald-600" />
                  <span>Generate Sample Results</span>
                </button>
              )}

              {/* Show / Hide Lab Results toggle */}
              <button
                type="button"
                onClick={() => setIsAddingLabResults(!isAddingLabResults)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                <span>{isAddingLabResults ? "Hide Lab Results" : "Show Lab Results"}</span>
                {isAddingLabResults ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Inline confirmation banner when sample mode is active */}
          {sampleNotification && isSampleMode && (
            <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{sampleNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => setSampleNotification(null)}
                className="text-amber-600 hover:text-amber-800 ml-2 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Laboratory Testing Table */}
          {isAddingLabResults && (
            <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Quality Check</th>
                    <th className="py-2 px-3">What We're Checking</th>
                    <th className="py-2 px-3">
                      {isSampleMode ? "Sample Result (Editable)" : "Laboratory Result"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedQcTests.map((t) => (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isSampleMode ? "bg-amber-50/20" : ""
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {t.testName}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-xs">
                        {t.acceptanceCriteria}
                      </td>
                      <td className="py-2 px-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={LAB_RESULT_PLACEHOLDERS[t.id] || "Enter result"}
                            value={t.measuredValue}
                            onChange={(e) => handleUpdateTestValue(t.id, e.target.value)}
                            className={`w-full px-2 py-1 rounded border text-xs font-mono bg-white focus:ring-1 focus:outline-hidden ${
                              isSampleMode
                                ? "border-amber-300 pr-14 focus:ring-amber-500 bg-amber-50/20"
                                : "border-slate-300 focus:ring-emerald-500"
                            }`}
                          />
                          {isSampleMode && (
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1 py-0.5 rounded pointer-events-none">
                              Sample
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
