/**
 * NatureAide V2 — Standardized Extraction Methodology & Yield Catalog
 * Provides curated extraction method presets, solvent compatibility rules,
 * ICH safety classifications, solvent volume math, and extract yield calculations.
 */

export interface ExtractionMethodPreset {
  id: string;
  name: string;
  description: string;
  suggestedSolvents: string[];
  defaultSolvent: string;
  defaultConcentration: string;
  defaultRatio: string;
  defaultTemperature: number;
  defaultDuration: number; // in hours
  durationUnit: "hours" | "minutes";
  typicalYieldRange: string;
  principles: string;
  isExperimentalSuggestion: boolean;
  literatureNotes: string;
}

export interface SolventSystemSpec {
  id: string;
  name: string;
  safetyClass: string;
  routeCompatibility: ("Topical" | "Oral" | "Other")[];
  toxicityWarning: string | null;
  isConcentrationMeaningful: boolean;
  defaultConcentrations: string[];
  boilingPoint: string;
  regulatoryLimit?: string;
}

export const EXTRACTION_METHODS: ExtractionMethodPreset[] = [
  {
    id: "cold_maceration",
    name: "Cold Maceration",
    description: "Extended ambient steeping (15–25°C) with periodic agitation, ideal for heat-sensitive phytochemicals.",
    suggestedSolvents: ["Ethanol–Water", "Ethanol", "Distilled Water", "Methanol–Water", "Ethyl Acetate"],
    defaultSolvent: "Ethanol–Water",
    defaultConcentration: "70%",
    defaultRatio: "1:10",
    defaultTemperature: 25,
    defaultDuration: 48,
    durationUnit: "hours",
    typicalYieldRange: "10–16% w/w",
    principles: "Gentle non-thermal extraction preserving heat-labile phenolics, flavonoids, and volatile terpenoids without hydrolytic breakdown.",
    isExperimentalSuggestion: true,
    literatureNotes: "Compendial standard in Philippine Herbal Pharmacopeia for foliar botanical crude extracts.",
  },
  {
    id: "hot_maceration",
    name: "Hot Maceration",
    description: "Controlled mild thermal maceration (40–55°C) to accelerate solute diffusion and cell matrix softening.",
    suggestedSolvents: ["Ethanol–Water", "Distilled Water", "Ethanol"],
    defaultSolvent: "Ethanol–Water",
    defaultConcentration: "70%",
    defaultRatio: "1:10",
    defaultTemperature: 50,
    defaultDuration: 4,
    durationUnit: "hours",
    typicalYieldRange: "12–18% w/w",
    principles: "Thermal elevation lowers solvent viscosity and enhances mass transfer across semi-permeable cell membranes.",
    isExperimentalSuggestion: true,
    literatureNotes: "Used for moderately robust foliar and floral matrices to shorten extraction times.",
  },
  {
    id: "percolation",
    name: "Percolation",
    description: "Continuous displacement of fresh menstruum downward through a packed column of uniformly pulverized botanical material.",
    suggestedSolvents: ["Ethanol–Water", "Ethanol", "Distilled Water"],
    defaultSolvent: "Ethanol–Water",
    defaultConcentration: "70%",
    defaultRatio: "1:10",
    defaultTemperature: 25,
    defaultDuration: 24,
    durationUnit: "hours",
    typicalYieldRange: "12–20% w/w",
    principles: "Maintains a constant high concentration gradient between incoming pure solvent and exhaustive plant bed.",
    isExperimentalSuggestion: true,
    literatureNotes: "Standard compendial technique for fluidextracts and concentrated botanical tinctures (USP <561>).",
  },
  {
    id: "soxhlet",
    name: "Soxhlet Extraction",
    description: "Continuous automated solvent reflux and siphon cycling through a porous extraction thimble.",
    suggestedSolvents: ["Ethanol", "Ethyl Acetate", "Acetone", "Hexane", "Methanol"],
    defaultSolvent: "Ethanol",
    defaultConcentration: "95%",
    defaultRatio: "1:15",
    defaultTemperature: 78,
    defaultDuration: 6,
    durationUnit: "hours",
    typicalYieldRange: "15–25% w/w",
    principles: "Exhaustive continuous extraction with recycled condensed pure solvent; unsuitable for thermolabile compounds or aqueous menstruum.",
    isExperimentalSuggestion: true,
    literatureNotes: "Reference analytical method for total extractable matter and lipid/secondary metabolite partitioning.",
  },
  {
    id: "infusion",
    name: "Infusion",
    description: "Short-duration steeping in freshly boiled or hot water (85–95°C) followed by maceration.",
    suggestedSolvents: ["Distilled Water"],
    defaultSolvent: "Distilled Water",
    defaultConcentration: "0%",
    defaultRatio: "1:10",
    defaultTemperature: 90,
    defaultDuration: 0.5,
    durationUnit: "hours",
    typicalYieldRange: "6–12% w/w",
    principles: "Aqueous preparation extracting water-soluble mucilages, glycosides, and simple polyphenols.",
    isExperimentalSuggestion: true,
    literatureNotes: "Reflects ethnomedicinal tea preparation methods (e.g. traditional Sambong/Lagundi herbal teas).",
  },
  {
    id: "decoction",
    name: "Decoction",
    description: "Continuous boiling of botanical parts in water at 100°C for an extended period under atmospheric pressure.",
    suggestedSolvents: ["Distilled Water"],
    defaultSolvent: "Distilled Water",
    defaultConcentration: "0%",
    defaultRatio: "1:12",
    defaultTemperature: 100,
    defaultDuration: 1.0,
    durationUnit: "hours",
    typicalYieldRange: "8–15% w/w",
    principles: "Intense thermal extraction suitable for hard or fibrous plant matrices (barks, roots, hard seeds).",
    isExperimentalSuggestion: true,
    literatureNotes: "Traditional preparation for tough botanical specimens; not suitable for volatile oil retention.",
  },
  {
    id: "uae",
    name: "Ultrasound-Assisted Extraction",
    description: "Acoustic cavitation induces microscopic bubble collapse, creating localized shear stress and cell wall disruption.",
    suggestedSolvents: ["Ethanol–Water", "Distilled Water", "Ethanol", "Methanol–Water", "Ethyl Acetate"],
    defaultSolvent: "Ethanol–Water",
    defaultConcentration: "70%",
    defaultRatio: "1:10",
    defaultTemperature: 45,
    defaultDuration: 0.75, // 45 min
    durationUnit: "hours",
    typicalYieldRange: "14–22% w/w",
    principles: "Acoustic microjets disrupt parenchyma cells and glandular trichomes, yielding high extract mass in shorter duration.",
    isExperimentalSuggestion: true,
    literatureNotes: "Modern green chemistry standard for accelerated extraction of phenolic antioxidants and flavonoids.",
  },
  {
    id: "mae",
    name: "Microwave-Assisted Extraction",
    description: "Non-ionizing electromagnetic radiation couples with polar dielectric solvents, inducing rapid internal superheating.",
    suggestedSolvents: ["Ethanol–Water", "Distilled Water", "Ethanol", "Methanol–Water"],
    defaultSolvent: "Ethanol–Water",
    defaultConcentration: "70%",
    defaultRatio: "1:10",
    defaultTemperature: 60,
    defaultDuration: 0.25, // 15 min
    durationUnit: "hours",
    typicalYieldRange: "15–24% w/w",
    principles: "Internal moisture vaporization triggers pressure-induced cellular rupture and rapid bioactive release.",
    isExperimentalSuggestion: true,
    literatureNotes: "Accelerated laboratory technique requiring microwave-absorbing polar solvent systems.",
  },
  {
    id: "reflux",
    name: "Reflux Extraction",
    description: "Boiling extraction under a water-cooled condenser, maintaining boiling temperature without solvent evaporation loss.",
    suggestedSolvents: ["Ethanol–Water", "Ethanol", "Distilled Water", "Methanol–Water", "Ethyl Acetate"],
    defaultSolvent: "Ethanol–Water",
    defaultConcentration: "70%",
    defaultRatio: "1:10",
    defaultTemperature: 78,
    defaultDuration: 2.0,
    durationUnit: "hours",
    typicalYieldRange: "14–20% w/w",
    principles: "Maintains constant solvent-to-material ratio and boiling kinetic energy for stable chemical constituents.",
    isExperimentalSuggestion: true,
    literatureNotes: "Bench-scale standard for thermal extraction of robust secondary metabolites.",
  },
  {
    id: "sfe",
    name: "Supercritical Fluid Extraction",
    description: "Extraction utilizing fluid maintained above its critical temperature and pressure (typically CO2 at >31.1°C, >73.8 bar).",
    suggestedSolvents: ["Ethanol", "Other / Custom"],
    defaultSolvent: "Ethanol",
    defaultConcentration: "95%",
    defaultRatio: "1:8",
    defaultTemperature: 45,
    defaultDuration: 2.0,
    durationUnit: "hours",
    typicalYieldRange: "6–14% w/w",
    principles: "Gas-like mass transfer with liquid-like solvating power; leaves zero toxic organic solvent residue.",
    isExperimentalSuggestion: true,
    literatureNotes: "Industrial green standard for lipophilic bioactives, volatile essences, and high-purity fractions.",
  },
  {
    id: "custom",
    name: "Other / Custom",
    description: "Proprietary or specialized laboratory extraction procedure defined by the research investigator.",
    suggestedSolvents: ["Ethanol–Water", "Distilled Water", "Ethanol", "Ethyl Acetate", "Other / Custom"],
    defaultSolvent: "Other / Custom",
    defaultConcentration: "Custom",
    defaultRatio: "1:10",
    defaultTemperature: 25,
    defaultDuration: 24,
    durationUnit: "hours",
    typicalYieldRange: "Protocol specific",
    principles: "Custom researcher-specified experimental parameters.",
    isExperimentalSuggestion: true,
    literatureNotes: "User-defined experimental extraction procedure.",
  },
];

export const SOLVENT_SYSTEMS: SolventSystemSpec[] = [
  {
    id: "water",
    name: "Distilled Water",
    safetyClass: "ICH Class 3 / GRAS",
    routeCompatibility: ["Topical", "Oral", "Other"],
    toxicityWarning: null,
    isConcentrationMeaningful: false,
    defaultConcentrations: ["0%"],
    boilingPoint: "100°C",
    regulatoryLimit: "No toxic limit (GRAS vehicle)",
  },
  {
    id: "ethanol",
    name: "Ethanol",
    safetyClass: "ICH Class 3 / Low Toxicity",
    routeCompatibility: ["Topical", "Oral", "Other"],
    toxicityWarning: null,
    isConcentrationMeaningful: true,
    defaultConcentrations: ["70%", "80%", "95%", "100%", "Custom"],
    boilingPoint: "78.3°C",
    regulatoryLimit: "5,000 ppm (ICH Q3C Class 3)",
  },
  {
    id: "ethanol_water",
    name: "Ethanol–Water",
    safetyClass: "ICH Class 3 / Low Toxicity",
    routeCompatibility: ["Topical", "Oral", "Other"],
    toxicityWarning: null,
    isConcentrationMeaningful: true,
    defaultConcentrations: ["50%", "70%", "80%", "95%", "Custom"],
    boilingPoint: "78–100°C",
    regulatoryLimit: "5,000 ppm (ICH Q3C Class 3)",
  },
  {
    id: "methanol",
    name: "Methanol",
    safetyClass: "ICH Class 2 / Toxic",
    routeCompatibility: ["Other"],
    toxicityWarning: "ICH Class 2 solvent (teratogenic / ocular toxicity). Prohibited in clinical oral/topical phytomedicines unless exhaustive solvent stripping is validated (<3,000 ppm).",
    isConcentrationMeaningful: false,
    defaultConcentrations: ["100%"],
    boilingPoint: "64.7°C",
    regulatoryLimit: "3,000 ppm (ICH Q3C Class 2)",
  },
  {
    id: "methanol_water",
    name: "Methanol–Water",
    safetyClass: "ICH Class 2 / Toxic Potential",
    routeCompatibility: ["Other"],
    toxicityWarning: "ICH Class 2 solvent. Strict residual testing required (<3,000 ppm). Not recommended as primary menstruum for human topical or oral products.",
    isConcentrationMeaningful: true,
    defaultConcentrations: ["50%", "70%", "80%", "Custom"],
    boilingPoint: "65–100°C",
    regulatoryLimit: "3,000 ppm (ICH Q3C Class 2)",
  },
  {
    id: "ethyl_acetate",
    name: "Ethyl Acetate",
    safetyClass: "ICH Class 3 / Low Toxicity",
    routeCompatibility: ["Topical", "Oral", "Other"],
    toxicityWarning: null,
    isConcentrationMeaningful: false,
    defaultConcentrations: ["100%"],
    boilingPoint: "77.1°C",
    regulatoryLimit: "5,000 ppm (ICH Q3C Class 3)",
  },
  {
    id: "acetone",
    name: "Acetone",
    safetyClass: "ICH Class 3 / Low Toxicity",
    routeCompatibility: ["Topical", "Other"],
    toxicityWarning: "Highly volatile and flammable. Must be completely stripped prior to formulation compounding.",
    isConcentrationMeaningful: false,
    defaultConcentrations: ["100%"],
    boilingPoint: "56°C",
    regulatoryLimit: "5,000 ppm (ICH Q3C Class 3)",
  },
  {
    id: "hexane",
    name: "Hexane",
    safetyClass: "ICH Class 2 / Neurotoxic",
    routeCompatibility: ["Other"],
    toxicityWarning: "ICH Class 2 neurotoxin (peripheral neuropathy risk). Strictly restricted (290 ppm limit). Inadmissible in finished oral/topical formulations without verified total solvent removal.",
    isConcentrationMeaningful: false,
    defaultConcentrations: ["100%"],
    boilingPoint: "68.7°C",
    regulatoryLimit: "290 ppm (ICH Q3C Class 2)",
  },
  {
    id: "custom",
    name: "Other / Custom",
    safetyClass: "Custom Specification",
    routeCompatibility: ["Topical", "Oral", "Other"],
    toxicityWarning: "Verify safety classification and ICH Q3C residual solvent thresholds before formulation.",
    isConcentrationMeaningful: true,
    defaultConcentrations: ["Custom"],
    boilingPoint: "Variable",
    regulatoryLimit: "Must comply with compendial residual limits",
  },
];

export const SOLVENT_CONCENTRATION_OPTIONS = [
  "0%",
  "50%",
  "70%",
  "80%",
  "95%",
  "100%",
  "Custom",
] as const;

export interface SolventRatioPreset {
  id: string;
  ratioValue: number; // numeric ratio in mL/g (e.g., 5, 8, 10, 12, 15, 20, 25)
  ratioText: string; // standard ratio string: "1:10"
  label: string; // human-friendly label: "1:10 (w/v)"
  mLPerGram: number; // 10
  description: string;
}

export const SOLVENT_RATIO_PRESETS: SolventRatioPreset[] = [
  {
    id: "ratio_1_5",
    ratioValue: 5,
    mLPerGram: 5,
    ratioText: "1:5",
    label: "1:5 (w/v)",
    description: "5 mL/g — Concentrated fluidextract",
  },
  {
    id: "ratio_1_8",
    ratioValue: 8,
    mLPerGram: 8,
    ratioText: "1:8",
    label: "1:8 (w/v)",
    description: "8 mL/g — Percolation / dense matrix",
  },
  {
    id: "ratio_1_10",
    ratioValue: 10,
    mLPerGram: 10,
    ratioText: "1:10",
    label: "1:10 (w/v)",
    description: "10 mL/g — Pharmacopeial reference standard (PHP / USP)",
  },
  {
    id: "ratio_1_12",
    ratioValue: 12,
    mLPerGram: 12,
    ratioText: "1:12",
    label: "1:12 (w/v)",
    description: "12 mL/g — Compendial decoction standard",
  },
  {
    id: "ratio_1_15",
    ratioValue: 15,
    mLPerGram: 15,
    ratioText: "1:15",
    label: "1:15 (w/v)",
    description: "15 mL/g — Soxhlet continuous extraction",
  },
  {
    id: "ratio_1_20",
    ratioValue: 20,
    mLPerGram: 20,
    ratioText: "1:20",
    label: "1:20 (w/v)",
    description: "20 mL/g — Exhaustive extraction / washing",
  },
  {
    id: "ratio_1_25",
    ratioValue: 25,
    mLPerGram: 25,
    ratioText: "1:25",
    label: "1:25 (w/v)",
    description: "25 mL/g — High-volume analytical extraction",
  },
];

export const SOLVENT_RATIO_OPTIONS = [
  "1:5",
  "1:8",
  "1:10",
  "1:12",
  "1:15",
  "1:20",
  "1:25",
  "Custom",
] as const;

export interface ExtractionDurationPreset {
  id: string;
  label: string;
  value: string;
  /** Total contact time in minutes (for matching / sorting). */
  minutes: number;
  description: string;
}

export const EXTRACTION_DURATION_PRESETS: ExtractionDurationPreset[] = [
  {
    id: "dur_15m",
    label: "15 minutes",
    value: "15 minutes",
    minutes: 15,
    description: "MAE / brief acoustic cavitation",
  },
  {
    id: "dur_30m",
    label: "30 minutes",
    value: "30 minutes",
    minutes: 30,
    description: "Short UAE / aqueous infusion",
  },
  {
    id: "dur_45m",
    label: "45 minutes",
    value: "45 minutes",
    minutes: 45,
    description: "Standard ultrasound-assisted extraction",
  },
  {
    id: "dur_1h",
    label: "1 hour",
    value: "1 hour",
    minutes: 60,
    description: "Decoction / short reflux contact",
  },
  {
    id: "dur_2h",
    label: "2 hours",
    value: "2 hours",
    minutes: 120,
    description: "Reflux / supercritical fluid extraction",
  },
  {
    id: "dur_4h",
    label: "4 hours",
    value: "4 hours",
    minutes: 240,
    description: "Hot maceration standard",
  },
  {
    id: "dur_6h",
    label: "6 hours",
    value: "6 hours",
    minutes: 360,
    description: "Soxhlet continuous cycling",
  },
  {
    id: "dur_8h",
    label: "8 hours",
    value: "8 hours",
    minutes: 480,
    description: "Extended thermal extraction",
  },
  {
    id: "dur_12h",
    label: "12 hours",
    value: "12 hours",
    minutes: 720,
    description: "Overnight laboratory steeping",
  },
  {
    id: "dur_24h",
    label: "24 hours",
    value: "24 hours",
    minutes: 1440,
    description: "Percolation / overnight maceration",
  },
  {
    id: "dur_48h",
    label: "48 hours",
    value: "48 hours",
    minutes: 2880,
    description: "Cold maceration pharmacopeial standard",
  },
  {
    id: "dur_72h",
    label: "72 hours",
    value: "72 hours",
    minutes: 4320,
    description: "Extended cold maceration",
  },
];

/**
 * Parse a free-text duration into total minutes when possible.
 */
export function parseExtractionDurationMinutes(raw: string): number | null {
  const text = (raw || "").trim().toLowerCase();
  if (!text || text.startsWith("custom")) return null;

  const match = text.match(
    /(\d+(?:\.\d+)?)\s*(minutes?|mins?|min|hours?|hrs?|hr|h|m)?\b/
  );
  if (!match) return null;

  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value < 0) return null;

  const unit = match[2] || "";
  const isMinutes =
    unit === "m" ||
    unit === "min" ||
    unit === "mins" ||
    unit === "minute" ||
    unit === "minutes";
  const isHours =
    unit === "h" ||
    unit === "hr" ||
    unit === "hrs" ||
    unit === "hour" ||
    unit === "hours";

  if (isMinutes) return Math.round(value);
  if (isHours) return Math.round(value * 60);

  // No unit: fractional values are hours (method defaults like 0.75);
  // integers ≥ 10 are treated as minutes (lab shorthand, e.g. "45").
  if (value > 0 && value < 1) return Math.round(value * 60);
  if (value >= 10 && Number.isInteger(value)) return value;
  return Math.round(value * 60);
}

export function matchExtractionDurationPreset(
  raw: string
): ExtractionDurationPreset | null {
  const text = (raw || "").trim().toLowerCase();
  if (!text) return null;

  const byLabel = EXTRACTION_DURATION_PRESETS.find(
    (p) => p.label.toLowerCase() === text || p.value.toLowerCase() === text
  );
  if (byLabel) return byLabel;

  const minutes = parseExtractionDurationMinutes(raw);
  if (minutes === null) return null;

  return EXTRACTION_DURATION_PRESETS.find((p) => p.minutes === minutes) || null;
}

/**
 * Format method-catalog default duration into a friendly preset label.
 */
export function formatMethodDefaultDuration(preset: ExtractionMethodPreset): string {
  const minutes =
    preset.durationUnit === "minutes"
      ? Math.round(preset.defaultDuration)
      : Math.round(preset.defaultDuration * 60);

  const matched = EXTRACTION_DURATION_PRESETS.find((p) => p.minutes === minutes);
  if (matched) return matched.value;

  if (minutes < 60) return `${minutes} minutes`;
  if (minutes === 60) return "1 hour";
  if (minutes % 60 === 0) return `${minutes / 60} hours`;
  return `${minutes} minutes`;
}

/**
 * Check whether concentration input is chemically meaningful for the selected solvent
 */
export function isSolventConcentrationMeaningful(solventName: string): boolean {
  if (!solventName) return false;
  const s = solventName.toLowerCase();
  if (s.includes("–water") || s.includes("-water") || s.includes("aqueous") || s.includes("ethanol") || s.includes("custom")) {
    return true;
  }
  return false;
}

/**
 * Evaluate compatibility between method, solvent, and intended product route
 */
export function checkSolventCompatibility(
  methodName: string,
  solventName: string,
  productRoute?: string
): {
  compatible: boolean;
  warnings: string[];
  cautions: string[];
} {
  const warnings: string[] = [];
  const cautions: string[] = [];
  const m = (methodName || "").toLowerCase();
  const s = (solventName || "").toLowerCase();
  const r = (productRoute || "").toLowerCase();

  // 1. Water with Soxhlet check
  if (m.includes("soxhlet") && s.includes("distilled water")) {
    warnings.push("Pure distilled water is incompatible with standard Soxhlet apparatus due to high latent heat of vaporization, bumping, and prolonged cycling time causing hydrolytic degradation.");
  }

  // 2. Hexane or non-polar solvents in Microwave-Assisted Extraction
  if (m.includes("microwave") && s.includes("hexane")) {
    warnings.push("Hexane is a non-polar solvent with near-zero dielectric dissipation factor (tan δ); it does not absorb microwave radiation efficiently unless polar modifiers or co-solvents are added.");
  }

  // 3. Decoction / Infusion with organic solvents
  if ((m.includes("decoction") || m.includes("infusion")) && (s.includes("ethanol") || s.includes("methanol") || s.includes("acetone") || s.includes("hexane") || s.includes("ethyl acetate"))) {
    warnings.push("Decoction and Infusion are open boiling/steeping methods traditionally designed for aqueous systems. Open heating of volatile flammable solvents creates severe laboratory flashfire hazards.");
  }

  // 4. Product Route Safety Checks (ICH Q3C guidelines)
  const isOralOrTopical = r.includes("topical") || r.includes("oral");
  if (isOralOrTopical) {
    if (s.includes("methanol")) {
      cautions.push("ICH Class 2 Safety Caution: Methanol has a strict residual exposure limit (<3,000 ppm) due to optic toxicity and teratogenicity. For topical or oral finished products, non-toxic Class 3 solvents (Ethanol, Water) are compendially preferred.");
    }
    if (s.includes("hexane")) {
      cautions.push("ICH Class 2 Safety Caution: Hexane is a neurotoxic Class 2 solvent (ICH limit <290 ppm). Rotary evaporation to complete dryness and residual GC-MS testing are mandatory before incorporating into finished topical or oral products.");
    }
  }

  return {
    compatible: warnings.length === 0,
    warnings,
    cautions,
  };
}

export interface ParsedSolventRatio {
  ratioMlPerG: number;
  isValid: boolean;
  error?: string;
  normalizedText: string;
}

/**
 * Robust parser for solid-to-liquid solvent extraction ratios.
 * Handles:
 * - Structured presets: "1:10", "1:10 (w/v)", "1:5", etc.
 * - Direct numeric ratios: 10 -> 10 mL/g
 * - Colon ratios: "1:10" (solid:solvent -> 10 mL/g) and legacy "10:1" (solvent:solid -> 10 mL/g)
 * - Custom strings: "12.5 mL/g", "Custom 18", "1:18"
 * - Validation: zero, negative, missing, and non-numeric strings
 */
export function parseSolventRatio(ratioInput: string | number | null | undefined): ParsedSolventRatio {
  if (ratioInput === null || ratioInput === undefined) {
    return {
      ratioMlPerG: 0,
      isValid: false,
      error: "Solvent ratio is required.",
      normalizedText: "",
    };
  }

  if (typeof ratioInput === "number") {
    if (isNaN(ratioInput)) {
      return { ratioMlPerG: 0, isValid: false, error: "Invalid numeric solvent ratio.", normalizedText: "" };
    }
    if (ratioInput <= 0) {
      return { ratioMlPerG: 0, isValid: false, error: "Solvent ratio must be greater than 0 mL/g.", normalizedText: String(ratioInput) };
    }
    return {
      ratioMlPerG: ratioInput,
      isValid: true,
      normalizedText: `1:${ratioInput}`,
    };
  }

  const raw = String(ratioInput).trim();
  if (!raw) {
    return {
      ratioMlPerG: 0,
      isValid: false,
      error: "Solvent ratio is required.",
      normalizedText: "",
    };
  }

  if (raw.toLowerCase() === "custom") {
    return {
      ratioMlPerG: 0,
      isValid: false,
      error: "Please specify a numeric custom solvent ratio (e.g. 1:10 or 10 mL/g).",
      normalizedText: "Custom",
    };
  }

  // 1. Check structured presets
  const preset = SOLVENT_RATIO_PRESETS.find(
    (p) =>
      p.id.toLowerCase() === raw.toLowerCase() ||
      p.ratioText.toLowerCase() === raw.toLowerCase() ||
      p.label.toLowerCase() === raw.toLowerCase()
  );
  if (preset) {
    return {
      ratioMlPerG: preset.ratioValue,
      isValid: true,
      normalizedText: preset.ratioText,
    };
  }

  // 2. Colon ratio format: "1:10", "1:10 (w/v)", "10:1", "1 : 12.5"
  if (raw.includes(":")) {
    const parts = raw.split(":");
    if (parts.length === 2) {
      if (parts[0].includes("-") || parts[1].includes("-")) {
        return {
          ratioMlPerG: 0,
          isValid: false,
          error: "Solvent ratio cannot be negative.",
          normalizedText: raw,
        };
      }

      const leftMatch = parts[0].match(/(\d+(\.\d+)?)/);
      const rightMatch = parts[1].match(/(\d+(\.\d+)?)/);
      const leftVal = leftMatch ? parseFloat(leftMatch[1]) : NaN;
      const rightVal = rightMatch ? parseFloat(rightMatch[1]) : NaN;

      if (!isNaN(leftVal) && !isNaN(rightVal)) {
        if (leftVal <= 0 || rightVal <= 0) {
          return {
            ratioMlPerG: 0,
            isValid: false,
            error: "Solvent ratio must be greater than 0 mL/g.",
            normalizedText: raw,
          };
        }

        // Standard solid-to-liquid ratio: 1:X (w/v) -> X mL/g
        if (leftVal === 1 && rightVal !== 1) {
          return {
            ratioMlPerG: rightVal,
            isValid: true,
            normalizedText: `1:${rightVal}`,
          };
        }

        // Legacy liquid-to-solid ratio: X:1 (v/w) -> X mL/g
        if (rightVal === 1 && leftVal !== 1) {
          return {
            ratioMlPerG: leftVal,
            isValid: true,
            normalizedText: `1:${leftVal}`,
          };
        }

        // If ratio is 1:1 or neither is 1 (e.g. 2:20):
        const effectiveRatio = rightVal >= leftVal ? rightVal / leftVal : leftVal / rightVal;
        const rounded = Number(effectiveRatio.toFixed(2));
        return {
          ratioMlPerG: rounded,
          isValid: true,
          normalizedText: `1:${rounded}`,
        };
      }
    }
  }

  if (raw.includes("-")) {
    return {
      ratioMlPerG: 0,
      isValid: false,
      error: "Solvent ratio cannot be negative.",
      normalizedText: raw,
    };
  }

  // 3. Fallback: single numeric string like "10 mL/g", "15", "12.5"
  const singleMatch = raw.match(/(\d+(\.\d+)?)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    if (val <= 0) {
      return {
        ratioMlPerG: 0,
        isValid: false,
        error: "Solvent ratio must be greater than 0 mL/g.",
        normalizedText: raw,
      };
    }
    return {
      ratioMlPerG: val,
      isValid: true,
      normalizedText: `1:${val}`,
    };
  }

  return {
    ratioMlPerG: 0,
    isValid: false,
    error: `Unable to parse solvent ratio "${raw}". Please enter in 1:X or mL/g format.`,
    normalizedText: raw,
  };
}

export interface SolventVolumeResult {
  volumeMl: number;
  volumeLiters: number;
  ratioMlPerG: number;
  startingMassGrams: number;
  isValid: boolean;
  error?: string;
  formulaDisplay: string;
  formattedRatio: string;
}

/**
 * Calculate required solvent volume in mL and Liters from plant mass and solvent ratio.
 * Formula: Solvent Volume (mL) = Starting Plant Mass (g) * Solvent Ratio (mL/g)
 */
export function calculateSolventVolumeDetails(
  massGrams: number | string | null | undefined,
  ratioInput: string | number | null | undefined
): SolventVolumeResult {
  let numericMass: number;
  if (typeof massGrams === "number") {
    numericMass = massGrams;
  } else if (typeof massGrams === "string") {
    const trimmed = massGrams.trim();
    if (!trimmed) {
      numericMass = NaN;
    } else if (trimmed.includes("-")) {
      numericMass = -1;
    } else {
      const match = trimmed.match(/(\d+(\.\d+)?)/);
      numericMass = match ? parseFloat(match[1]) : NaN;
    }
  } else {
    numericMass = NaN;
  }

  const parsedRatio = parseSolventRatio(ratioInput);

  if (isNaN(numericMass)) {
    return {
      volumeMl: 0,
      volumeLiters: 0,
      ratioMlPerG: parsedRatio.ratioMlPerG,
      startingMassGrams: 0,
      isValid: false,
      error: "Starting plant mass is required.",
      formulaDisplay: "—",
      formattedRatio: parsedRatio.normalizedText || "1:10",
    };
  }

  if (numericMass < 0) {
    return {
      volumeMl: 0,
      volumeLiters: 0,
      ratioMlPerG: parsedRatio.ratioMlPerG,
      startingMassGrams: numericMass,
      isValid: false,
      error: "Starting plant mass cannot be negative.",
      formulaDisplay: "—",
      formattedRatio: parsedRatio.normalizedText || "1:10",
    };
  }

  if (numericMass === 0) {
    return {
      volumeMl: 0,
      volumeLiters: 0,
      ratioMlPerG: parsedRatio.ratioMlPerG,
      startingMassGrams: 0,
      isValid: false,
      error: "Starting plant mass must be greater than 0 g.",
      formulaDisplay: "0 g × 0 mL/g = 0 mL (0.00 L)",
      formattedRatio: parsedRatio.normalizedText || "1:10",
    };
  }

  if (!parsedRatio.isValid || parsedRatio.ratioMlPerG <= 0) {
    return {
      volumeMl: 0,
      volumeLiters: 0,
      ratioMlPerG: 0,
      startingMassGrams: numericMass,
      isValid: false,
      error: parsedRatio.error || "Invalid solvent ratio.",
      formulaDisplay: `${numericMass.toLocaleString()} g × 0 mL/g = 0 mL`,
      formattedRatio: parsedRatio.normalizedText || "Invalid",
    };
  }

  const volumeMl = Math.round(numericMass * parsedRatio.ratioMlPerG * 100) / 100;
  const volumeLiters = Math.round((volumeMl / 1000) * 1000) / 1000;

  return {
    volumeMl,
    volumeLiters,
    ratioMlPerG: parsedRatio.ratioMlPerG,
    startingMassGrams: numericMass,
    isValid: true,
    formulaDisplay: `${numericMass.toLocaleString()} g × ${parsedRatio.ratioMlPerG} mL/g = ${volumeMl.toLocaleString()} mL (${volumeLiters.toFixed(2)} L)`,
    formattedRatio: parsedRatio.normalizedText,
  };
}

/**
 * Calculate required solvent volume in mL from plant mass and ratio
 * Solvent Volume (mL) = Plant Mass (g) * Ratio (mL/g)
 */
export function calculateSolventVolume(
  massGrams: number | string | null | undefined,
  ratioInput: string | number | null | undefined
): number {
  return calculateSolventVolumeDetails(massGrams, ratioInput).volumeMl;
}

/**
 * Calculate Crude Extract Yield (% w/w)
 * Formula: Crude Extract Yield (%) = (Recovered Dry Extract Mass / Starting Plant Mass) * 100
 */
export function calculateExtractYield(
  recoveredDryMassGrams: number | null | undefined,
  startingMassGrams: number
): {
  yieldPercent: number | null;
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  if (recoveredDryMassGrams === null || recoveredDryMassGrams === undefined || isNaN(recoveredDryMassGrams)) {
    return { yieldPercent: null, isValid: true };
  }

  if (startingMassGrams <= 0 || isNaN(startingMassGrams)) {
    return {
      yieldPercent: null,
      isValid: false,
      error: "Starting plant mass must be greater than 0 g.",
    };
  }

  if (recoveredDryMassGrams < 0) {
    return {
      yieldPercent: null,
      isValid: false,
      error: "Recovered dry extract mass cannot be negative.",
    };
  }

  if (recoveredDryMassGrams === 0) {
    return {
      yieldPercent: 0,
      isValid: true,
      warning: "Zero recovered mass indicates complete loss or unmeasured residue.",
    };
  }

  if (recoveredDryMassGrams > startingMassGrams) {
    return {
      yieldPercent: Number(((recoveredDryMassGrams / startingMassGrams) * 100).toFixed(2)),
      isValid: false,
      error: `Recovered dry extract mass (${recoveredDryMassGrams}g) exceeds starting plant material mass (${startingMassGrams}g), giving an impossible yield (> 100%). Ensure the solvent has been completely removed via rotary evaporation or lyophilization and that wet marc is not weighed.`,
    };
  }

  const rawYield = (recoveredDryMassGrams / startingMassGrams) * 100;
  return {
    yieldPercent: Number(rawYield.toFixed(2)),
    isValid: true,
  };
}

/**
 * Generate a standardized extract fraction identifier (e.g. AKP-EXT-001)
 */
export function generateExtractFractionId(plantName: string, existingId?: string): string {
  if (existingId && existingId.trim() && !existingId.includes("Standardized Polyphenolic")) {
    return existingId.trim();
  }

  const cleanName = (plantName || "Botanical").trim().toUpperCase();
  let prefix = "EXT";
  if (cleanName.includes("AKAPULKO") || cleanName.includes("ALATA")) {
    prefix = "AKP";
  } else if (cleanName.includes("LAGUNDI") || cleanName.includes("NEGUNDO")) {
    prefix = "LAG";
  } else if (cleanName.includes("SAMBONG") || cleanName.includes("BALSAMIFERA")) {
    prefix = "SAM";
  } else if (cleanName.includes("TSAANG") || cleanName.includes("CARMONA")) {
    prefix = "TSA";
  } else if (cleanName.includes("AMPALAYA") || cleanName.includes("CHARANTIA")) {
    prefix = "AMP";
  } else if (cleanName.includes("GUAVA") || cleanName.includes("GUAJAVA")) {
    prefix = "GUA";
  } else if (cleanName.includes("BANABA") || cleanName.includes("SPECIOSA")) {
    prefix = "BAN";
  } else {
    const letters = cleanName.replace(/[^A-Z]/g, "");
    prefix = letters.slice(0, 3) || "BOT";
  }

  return `${prefix}-EXT-001`;
}

