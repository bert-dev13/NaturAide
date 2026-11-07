// src/lib/batch-qc-catalog.ts
// Standardized batch presets, QC qualitative options, and mass balance calculation engine for Step 6

export interface ConcentrationSeriesPreset {
  id: string;
  name: string;
  description: string;
  increments: number[];
}

export const CONCENTRATION_SERIES_PRESETS: ConcentrationSeriesPreset[] = [
  {
    id: "5-10-1pct",
    name: "5–10%, 1% intervals",
    description: "Compendial multi-dose evaluation range (5%, 6%, 7%, 8%, 9%, 10%)",
    increments: [5, 6, 7, 8, 9, 10],
  },
  {
    id: "1-5-1pct",
    name: "1–5%, 1% intervals",
    description: "Low-dose / sensitive botanical range (1%, 2%, 3%, 4%, 5%)",
    increments: [1, 2, 3, 4, 5],
  },
  {
    id: "2-10-2pct",
    name: "2–10%, 2% intervals",
    description: "Wide-span preliminary screening (2%, 4%, 6%, 8%, 10%)",
    increments: [2, 4, 6, 8, 10],
  },
  {
    id: "single",
    name: "Single Concentration",
    description: "Dedicated single target batch (e.g. 5.0% w/w)",
    increments: [5],
  },
  {
    id: "custom",
    name: "Custom Series",
    description: "Researcher-defined start %, end %, and increment",
    increments: [],
  },
];

export interface BatchSizeOption {
  id: string;
  value: number;
  label: string;
  description: string;
}

export const BATCH_SIZE_PRESETS: BatchSizeOption[] = [
  { id: "100", value: 100, label: "100 g", description: "Small-scale bench evaluation" },
  { id: "250", value: 250, label: "250 g", description: "Intermediate stability lot" },
  { id: "500", value: 500, label: "500 g", description: "Standard experimental batch" },
  { id: "1000", value: 1000, label: "1,000 g", description: "Pilot scale formulation" },
  { id: "custom", value: 0, label: "Custom Size", description: "Researcher-defined batch mass" },
];

export type QCStatusType = "Planned" | "Prepared" | "Testing" | "Results Recorded" | "Verified";

export const QC_STATUS_CONFIG: Record<QCStatusType, { label: string; badgeClass: string; stepOrder: number }> = {
  Planned: {
    label: "Planned",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    stepOrder: 1,
  },
  Prepared: {
    label: "Prepared",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    stepOrder: 2,
  },
  Testing: {
    label: "Testing",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    stepOrder: 3,
  },
  "Results Recorded": {
    label: "Results Recorded",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    stepOrder: 4,
  },
  Verified: {
    label: "Verified",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    stepOrder: 5,
  },
};

// Qualitative observation options for laboratory records
export const APPEARANCE_OPTIONS = [
  "Homogeneous translucent amber gel",
  "Homogeneous clear transparent gel",
  "Uniform opaque smooth cream (O/W)",
  "Uniform white silky lotion (O/W)",
  "Smooth viscous lipophilic ointment",
  "Clear amber oral solution",
  "Viscous sweet translucent herbal syrup",
  "Free-flowing homogeneous powder blend",
  "Aromatic clear hot botanical infusion",
  "Custom / Laboratory observed",
];

export const HOMOGENEITY_OPTIONS = [
  "Homogeneous (Uniform single-phase dispersion)",
  "Slightly Heterogeneous (Trace micro-bubbles or minor particulate)",
  "Inhomogeneous (Visible phase separation or particulate clustering)",
];

export const PHASE_SEPARATION_OPTIONS = [
  "None / Stable (No syneresis or phase boundary detected)",
  "Trace Syneresis (Minor surface bleeding, fully redispersible)",
  "Moderate Creaming / Coalescence",
  "Complete Phase Separation (Unstable emulsion/gel break)",
];

export const PRECIPITATION_OPTIONS = [
  "None detected (Clear/uniform matrix, no sedimentation)",
  "Trace sediment (Passes compendial filter check)",
  "Moderate crystalline precipitate observed",
  "Heavy particulate sedimentation",
];

export const COLOR_CHANGE_OPTIONS = [
  "No change / Color stable",
  "Minor darkening (Expected mild botanical polyphenolic oxidation)",
  "Noticeable discoloration / Bleaching",
  "Significant oxidative darkening / Browning",
];

export const ODOR_OPTIONS = [
  "Characteristic botanical (Fresh, herbal, agreeable)",
  "Neutral / Faint botanical aroma",
  "Mild solvent / Preservative scent",
  "Off-odor / Pungent volatile notes",
  "Rancid / Oxidative decomposition",
];

export interface BatchIngredientLine {
  id?: number | string;
  name: string;
  role: string;
  type: string;
  percentage: number;
  massGrams: number;
  isVehicle?: boolean;
  isActive?: boolean;
}

export interface BatchCalculationResult {
  valid: boolean;
  error?: string;
  activeConcentration: number;
  batchSizeGrams: number;
  activeMassGrams: number;
  vehiclePercentage: number;
  vehicleMassGrams: number;
  excipientMassSum: number;
  totalPercentage: number;
  totalMassGrams: number;
  ingredients: BatchIngredientLine[];
}

/**
 * Calculates exact mass balance across all formulation components for a batch.
 * Adjusts target active concentration and balances vehicle (q.s. to 100%)
 * without modifying fixed excipient concentrations.
 */
export function calculateBatchComposition(
  targetActivePct: number | string,
  batchSizeGrams: number | string,
  rawComponents: any[] = [],
  plantName: string = "Medicinal Botanical Extract"
): BatchCalculationResult {
  const activePct = typeof targetActivePct === "number" ? targetActivePct : parseFloat(String(targetActivePct)) || 0;
  const batchMass = typeof batchSizeGrams === "number" ? batchSizeGrams : parseFloat(String(batchSizeGrams)) || 0;

  if (batchMass <= 0) {
    return {
      valid: false,
      error: "Batch size mass must be greater than 0 grams.",
      activeConcentration: activePct,
      batchSizeGrams: 0,
      activeMassGrams: 0,
      vehiclePercentage: 0,
      vehicleMassGrams: 0,
      excipientMassSum: 0,
      totalPercentage: 0,
      totalMassGrams: 0,
      ingredients: [],
    };
  }

  // Normalize components or provide standard template fallback
  let comps = Array.isArray(rawComponents) && rawComponents.length > 0 ? [...rawComponents] : [];

  if (comps.length === 0) {
    comps = [
      {
        ingredientName: `${plantName} Standardized Extract`,
        componentType: "ACTIVE",
        roleOrFunction: "Active Botanical Bioactive",
        concentrationValue: activePct,
      },
      {
        ingredientName: "Carbomer 940",
        componentType: "EXCIPIENT",
        roleOrFunction: "Gelling Agent",
        concentrationValue: 1.0,
      },
      {
        ingredientName: "Propylene Glycol",
        componentType: "EXCIPIENT",
        roleOrFunction: "Humectant & Solubilizer",
        concentrationValue: 5.0,
      },
      {
        ingredientName: "Methylparaben",
        componentType: "PRESERVATIVE",
        roleOrFunction: "Antimicrobial Preservative",
        concentrationValue: 0.18,
      },
      {
        ingredientName: "Triethanolamine",
        componentType: "EXCIPIENT",
        roleOrFunction: "Neutralizer / pH Adjuster",
        concentrationValue: 0.5,
      },
      {
        ingredientName: "Purified Water USP",
        componentType: "VEHICLE",
        roleOrFunction: "Hydrophilic Vehicle (q.s. to 100%)",
        concentrationValue: 93.32,
      },
    ];
  }

  // Find active ingredient index
  let activeIdx = comps.findIndex(
    (c) =>
      c.componentType === "ACTIVE" ||
      c.roleOrFunction?.toLowerCase().includes("active") ||
      c.ingredientName?.toLowerCase().includes("extract") ||
      c.ingredientName?.toLowerCase().includes(plantName.toLowerCase().split(" ")[0])
  );
  if (activeIdx === -1) activeIdx = 0;

  // Find vehicle index (q.s. balancer)
  let vehicleIdx = comps.findIndex(
    (c, idx) =>
      idx !== activeIdx &&
      (c.componentType === "VEHICLE" ||
        c.roleOrFunction?.toLowerCase().includes("vehicle") ||
        c.roleOrFunction?.toLowerCase().includes("q.s.") ||
        c.ingredientName?.toLowerCase().includes("water") ||
        c.ingredientName?.toLowerCase().includes("carrier") ||
        c.ingredientName?.toLowerCase().includes("syrup") ||
        c.ingredientName?.toLowerCase().includes("base"))
  );
  if (vehicleIdx === -1) {
    // Pick the last non-active component as vehicle fallback
    vehicleIdx = comps.length - 1;
    if (vehicleIdx === activeIdx && comps.length > 1) {
      vehicleIdx = comps.length - 2;
    }
  }

  // Sum fixed excipients (all components other than active and vehicle)
  let fixedExcipientsSum = 0;
  comps.forEach((c, idx) => {
    if (idx !== activeIdx && idx !== vehicleIdx) {
      const val = parseFloat(c.concentrationValue) || 0;
      fixedExcipientsSum += val;
    }
  });

  const remainingForVehicle = 100.0 - activePct - fixedExcipientsSum;

  if (remainingForVehicle < 0) {
    return {
      valid: false,
      error: `Formulation balance exceeded: Active (${activePct.toFixed(1)}%) + Fixed Excipients (${fixedExcipientsSum.toFixed(2)}%) = ${(activePct + fixedExcipientsSum).toFixed(2)}% (exceeds 100.0%). Vehicle margin is negative (${remainingForVehicle.toFixed(2)}%).`,
      activeConcentration: activePct,
      batchSizeGrams: batchMass,
      activeMassGrams: (batchMass * activePct) / 100,
      vehiclePercentage: remainingForVehicle,
      vehicleMassGrams: (batchMass * remainingForVehicle) / 100,
      excipientMassSum: (batchMass * fixedExcipientsSum) / 100,
      totalPercentage: +(activePct + fixedExcipientsSum + remainingForVehicle).toFixed(2),
      totalMassGrams: batchMass,
      ingredients: [],
    };
  }

  const roundedVehiclePct = +remainingForVehicle.toFixed(3);
  const activeMass = +((batchMass * activePct) / 100).toFixed(3);
  const vehicleMass = +((batchMass * roundedVehiclePct) / 100).toFixed(3);

  const ingredientLines: BatchIngredientLine[] = comps.map((c, idx) => {
    const isAct = idx === activeIdx;
    const isVeh = idx === vehicleIdx;

    const pct = isAct ? activePct : isVeh ? roundedVehiclePct : +(parseFloat(c.concentrationValue) || 0).toFixed(3);
    const mass = +((batchMass * pct) / 100).toFixed(3);

    return {
      id: c.id || idx,
      name: c.ingredientName || "Ingredient",
      role: isVeh ? `${c.roleOrFunction || "Vehicle"} (q.s. to 100%)` : c.roleOrFunction || "Excipient",
      type: isAct ? "ACTIVE" : isVeh ? "VEHICLE" : c.componentType || "EXCIPIENT",
      percentage: pct,
      massGrams: mass,
      isActive: isAct,
      isVehicle: isVeh,
    };
  });

  // Calculate excipient mass sum (all non-active components)
  const excipientMassSum = +(batchMass - activeMass).toFixed(3);

  return {
    valid: true,
    activeConcentration: activePct,
    batchSizeGrams: batchMass,
    activeMassGrams: activeMass,
    vehiclePercentage: roundedVehiclePct,
    vehicleMassGrams: vehicleMass,
    excipientMassSum,
    totalPercentage: 100.0,
    totalMassGrams: batchMass,
    ingredients: ingredientLines,
  };
}

/**
 * Generates an increment series array based on dropdown choice or custom inputs
 */
export function resolveConcentrationIncrements(
  presetId: string,
  customStart: number = 2,
  customEnd: number = 10,
  customStep: number = 2,
  singleTarget: number = 5
): number[] {
  if (presetId === "single") {
    return [Math.max(0.1, Number(singleTarget) || 5)];
  }

  if (presetId === "custom") {
    const start = Math.max(0.1, Number(customStart) || 1);
    const end = Math.max(start, Number(customEnd) || 10);
    const step = Math.max(0.1, Number(customStep) || 1);

    const result: number[] = [];
    for (let c = start; c <= end + 0.0001; c += step) {
      result.push(+c.toFixed(2));
      if (result.length > 20) break; // safety cap
    }
    return result.length > 0 ? result : [start];
  }

  const preset = CONCENTRATION_SERIES_PRESETS.find((p) => p.id === presetId);
  return preset ? preset.increments : [5, 6, 7, 8, 9, 10];
}

/**
 * Generate unique standardized batch number code
 */
export function generateBatchIdentifier(
  concPct: number,
  prefix: string = "BATCH"
): string {
  const cleanPrefix = (prefix || "BATCH").replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
  const timeSlice = Date.now().toString().slice(-4);
  const randomSuffix = Math.floor(Math.random() * 90 + 10);
  return `${cleanPrefix}-${concPct}PCT-${timeSlice}${randomSuffix}`;
}

