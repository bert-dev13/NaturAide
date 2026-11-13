/**
 * NatureAide V2 — Smart Materials Catalog & Inventory Definitions
 * Provides curated material presets, type categorizations, compendial grades,
 * functional roles, unit choices, and auto-suggestion templates.
 */

export type MaterialTypeKey =
  | "ACTIVE_BOTANICAL"
  | "EXCIPIENT"
  | "SOLVENT"
  | "PRESERVATIVE"
  | "ANALYTICAL_STANDARD";

export interface MaterialTypeOption {
  key: MaterialTypeKey;
  label: string;
  badgeClass: string;
  description: string;
}

export const MATERIAL_TYPES: MaterialTypeOption[] = [
  {
    key: "ACTIVE_BOTANICAL",
    label: "Active Botanical",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Plant raw materials, crude extracts, and purified fractions",
  },
  {
    key: "EXCIPIENT",
    label: "Excipient",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    description: "Formulation vehicles, gelling agents, humectants, and stabilizers",
  },
  {
    key: "SOLVENT",
    label: "Solvent",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    description: "Extraction menstruum, dissolving agents, and processing fluids",
  },
  {
    key: "PRESERVATIVE",
    label: "Preservative",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Antimicrobial agents and antioxidants preventing microbial spoilage",
  },
  {
    key: "ANALYTICAL_STANDARD",
    label: "Analytical Standard",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
    description: "Certified reference compounds for HPLC/GC assay quantification",
  },
];

export interface MaterialPresetItem {
  id: string;
  name: string;
  type: MaterialTypeKey;
  suggestedRole: string;
  suggestedUnit: string;
  suggestedGrade: string;
  description: string;
  casNumber?: string;
}

export const EXCIPIENT_PRESETS: MaterialPresetItem[] = [
  {
    id: "carbomer_940",
    name: "Carbomer 940",
    type: "EXCIPIENT",
    suggestedRole: "Gelling Agent",
    suggestedUnit: "g",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "High molecular weight polyacrylic acid polymer for crystal-clear hydrogels",
    casNumber: "9007-20-9",
  },
  {
    id: "glycerin",
    name: "Glycerin",
    type: "EXCIPIENT",
    suggestedRole: "Humectant",
    suggestedUnit: "mL",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Trihydroxy sugar alcohol providing hydration and emolliency",
    casNumber: "56-81-5",
  },
  {
    id: "propylene_glycol",
    name: "Propylene Glycol",
    type: "EXCIPIENT",
    suggestedRole: "Humectant",
    suggestedUnit: "mL",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Cosolvent, humectant, and skin penetration enhancer",
    casNumber: "57-55-6",
  },
  {
    id: "xanthan_gum",
    name: "Xanthan Gum",
    type: "EXCIPIENT",
    suggestedRole: "Stabilizer",
    suggestedUnit: "g",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Natural polysaccharide rheology modifier and emulsion stabilizer",
    casNumber: "11138-66-2",
  },
  {
    id: "hpmc",
    name: "Hydroxypropyl Methylcellulose (HPMC)",
    type: "EXCIPIENT",
    suggestedRole: "Gelling Agent",
    suggestedUnit: "g",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Semi-synthetic viscoelastic polymer used for aqueous gel matrices",
    casNumber: "9004-65-3",
  },
  {
    id: "cetyl_alcohol",
    name: "Cetyl Alcohol",
    type: "EXCIPIENT",
    suggestedRole: "Emulsifier",
    suggestedUnit: "g",
    suggestedGrade: "Pharmaceutical Grade",
    description: "Fatty alcohol used as an emulsion co-stabilizer and opacifier",
    casNumber: "36653-82-4",
  },
  {
    id: "polysorbate_80",
    name: "Polysorbate 80",
    type: "EXCIPIENT",
    suggestedRole: "Emulsifier",
    suggestedUnit: "mL",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Nonionic surfactant and solubilizer for botanical lipophiles",
    casNumber: "9005-65-6",
  },
  {
    id: "na_cmc",
    name: "Sodium Carboxymethylcellulose (Na-CMC)",
    type: "EXCIPIENT",
    suggestedRole: "Gelling Agent",
    suggestedUnit: "g",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Water-soluble cellulose ether for bioadhesive hydrogels",
    casNumber: "9004-32-4",
  },
  {
    id: "tea",
    name: "Triethanolamine (TEA)",
    type: "EXCIPIENT",
    suggestedRole: "pH Adjuster",
    suggestedUnit: "mL",
    suggestedGrade: "Reagent Grade (ACS)",
    description: "Tertiary amine neutralizing agent to adjust carbomer gel pH to 5.5",
    casNumber: "102-71-6",
  },
  {
    id: "stearic_acid",
    name: "Stearic Acid",
    type: "EXCIPIENT",
    suggestedRole: "Emulsifier",
    suggestedUnit: "g",
    suggestedGrade: "Pharmaceutical Grade",
    description: "Saturated fatty acid for cream structuring and barrier lipid layer",
    casNumber: "57-11-4",
  },
];

export const SOLVENT_PRESETS: MaterialPresetItem[] = [
  {
    id: "distilled_water",
    name: "Distilled Water",
    type: "SOLVENT",
    suggestedRole: "Extraction Solvent",
    suggestedUnit: "mL",
    suggestedGrade: "Reagent Grade (ACS)",
    description: "Deionized, steam-distilled water for aqueous botanical extraction",
  },
  {
    id: "purified_water_usp",
    name: "Purified Water (USP)",
    type: "SOLVENT",
    suggestedRole: "Extraction Solvent",
    suggestedUnit: "mL",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Microbial-tested compendial water meeting USP specifications",
  },
  {
    id: "ethanol_95",
    name: "Ethanol (95% v/v)",
    type: "SOLVENT",
    suggestedRole: "Extraction Solvent",
    suggestedUnit: "mL",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Grain alcohol meeting pharmaceutical monographs",
    casNumber: "64-17-5",
  },
  {
    id: "ethanol_water_70",
    name: "Ethanol–Water (70% v/v)",
    type: "SOLVENT",
    suggestedRole: "Extraction Solvent",
    suggestedUnit: "mL",
    suggestedGrade: "Analytical Grade (≥98.0%)",
    description: "Standard pharmacopeial hydroethanolic extraction menstruum",
  },
  {
    id: "methanol",
    name: "Methanol",
    type: "SOLVENT",
    suggestedRole: "Extraction Solvent",
    suggestedUnit: "mL",
    suggestedGrade: "Analytical Grade (≥98.0%)",
    description: "Polar extraction solvent; Class 2 toxic residual limits apply",
    casNumber: "67-56-1",
  },
  {
    id: "ethyl_acetate",
    name: "Ethyl Acetate",
    type: "SOLVENT",
    suggestedRole: "Extraction Solvent",
    suggestedUnit: "mL",
    suggestedGrade: "Analytical Grade (≥98.0%)",
    description: "Medium-polarity ester solvent for flavonoid and terpenoid extraction",
    casNumber: "141-78-6",
  },
  {
    id: "acetone",
    name: "Acetone",
    type: "SOLVENT",
    suggestedRole: "Extraction Solvent",
    suggestedUnit: "mL",
    suggestedGrade: "Analytical Grade (≥98.0%)",
    description: "Volatile ketone solvent for botanical pigment and secondary metabolite extraction",
    casNumber: "67-64-1",
  },
];

export const PRESERVATIVE_PRESETS: MaterialPresetItem[] = [
  {
    id: "phenoxyethanol",
    name: "Phenoxyethanol",
    type: "PRESERVATIVE",
    suggestedRole: "Preservative",
    suggestedUnit: "mL",
    suggestedGrade: "Pharmaceutical Grade",
    description: "Broad-spectrum antimicrobial ether alcohol (max 1.0% in topical cosmetics)",
    casNumber: "122-99-6",
  },
  {
    id: "sodium_benzoate",
    name: "Sodium Benzoate",
    type: "PRESERVATIVE",
    suggestedRole: "Preservative",
    suggestedUnit: "g",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Acidic preservative active against yeasts and molds (effective pH < 4.5)",
    casNumber: "532-32-1",
  },
  {
    id: "potassium_sorbate",
    name: "Potassium Sorbate",
    type: "PRESERVATIVE",
    suggestedRole: "Preservative",
    suggestedUnit: "g",
    suggestedGrade: "Food Grade (FCC)",
    description: "Antifungal preservative widely used in aqueous botanical preparations",
    casNumber: "24634-61-5",
  },
  {
    id: "methylparaben",
    name: "Methylparaben",
    type: "PRESERVATIVE",
    suggestedRole: "Preservative",
    suggestedUnit: "g",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Traditional antimicrobial ester effective against molds and gram-positive bacteria",
    casNumber: "99-76-3",
  },
  {
    id: "propylparaben",
    name: "Propylparaben",
    type: "PRESERVATIVE",
    suggestedRole: "Preservative",
    suggestedUnit: "g",
    suggestedGrade: "USP / NF (Compendial Grade)",
    description: "Lipophilic paraben synergist often combined with methylparaben",
    casNumber: "94-13-3",
  },
];

export const COMMON_GRADES = [
  "USP / NF (Compendial Grade)",
  "Pharmaceutical Grade",
  "Analytical Grade (≥98.0%)",
  "Research Grade",
  "Food Grade (FCC)",
  "Reagent Grade (ACS)",
  "Other / Custom",
] as const;

export const COMMON_UNITS = [
  "g",
  "mg",
  "kg",
  "mL",
  "L",
  "µL",
] as const;

export const FUNCTIONAL_ROLES = [
  "Botanical Active",
  "Extraction Solvent",
  "Gelling Agent",
  "Humectant",
  "Emulsifier",
  "Stabilizer",
  "Preservative",
  "Antioxidant",
  "pH Adjuster",
  "Analytical Reference",
  "Other / Custom",
] as const;

/** Researcher-facing role labels for the simplified Add Ingredient form. */
export type SimpleIngredientRoleKey =
  | "MAIN"
  | "GELLING"
  | "PH_ADJUSTER"
  | "MOISTURIZER"
  | "BASE"
  | "SOLVENT"
  | "PRESERVATIVE"
  | "TESTING"
  | "OTHER";

export interface SimpleIngredientRoleOption {
  key: SimpleIngredientRoleKey;
  label: string;
  /** Technical materialType stored in research_materials */
  materialType: MaterialTypeKey;
  /** Technical functionDescription stored when not using a custom Other value */
  functionDescription: string;
}

export const SIMPLE_INGREDIENT_ROLES: SimpleIngredientRoleOption[] = [
  {
    key: "MAIN",
    label: "Main Ingredient",
    materialType: "ACTIVE_BOTANICAL",
    functionDescription: "Botanical Active",
  },
  {
    key: "GELLING",
    label: "Gelling Agent",
    materialType: "EXCIPIENT",
    functionDescription: "Gelling Agent",
  },
  {
    key: "PH_ADJUSTER",
    label: "pH Adjuster",
    materialType: "EXCIPIENT",
    functionDescription: "pH Adjuster",
  },
  {
    key: "MOISTURIZER",
    label: "Moisturizer / Humectant",
    materialType: "EXCIPIENT",
    functionDescription: "Humectant",
  },
  {
    key: "BASE",
    label: "Base Ingredient",
    materialType: "EXCIPIENT",
    functionDescription: "Hydrophilic Vehicle",
  },
  {
    key: "SOLVENT",
    label: "Solvent",
    materialType: "SOLVENT",
    functionDescription: "Extraction Solvent",
  },
  {
    key: "PRESERVATIVE",
    label: "Preservative",
    materialType: "PRESERVATIVE",
    functionDescription: "Preservative",
  },
  {
    key: "TESTING",
    label: "Testing Reference",
    materialType: "ANALYTICAL_STANDARD",
    functionDescription: "Analytical Reference",
  },
  {
    key: "OTHER",
    label: "Other",
    materialType: "EXCIPIENT",
    functionDescription: "Other / Custom",
  },
];

/** Map stored materialType + functionDescription back to a simple role key. */
export function resolveSimpleIngredientRole(
  materialType?: string | null,
  functionDescription?: string | null
): { key: SimpleIngredientRoleKey; customLabel: string } {
  const roleText = String(functionDescription || "").trim();
  const roleLower = roleText.toLowerCase();
  const type = String(materialType || "").toUpperCase();

  if (
    type === "ACTIVE_BOTANICAL" ||
    roleLower.includes("botanical active") ||
    roleLower.includes("main ingredient") ||
    roleLower.includes("therapeutic constituent")
  ) {
    return { key: "MAIN", customLabel: "" };
  }
  if (roleLower.includes("gelling") || roleLower.includes("matrix builder")) {
    return { key: "GELLING", customLabel: "" };
  }
  if (roleLower.includes("ph adjust") || roleLower.includes("ph neutral") || roleLower.includes("crosslinking")) {
    return { key: "PH_ADJUSTER", customLabel: "" };
  }
  if (
    roleLower.includes("humectant") ||
    roleLower.includes("moisturizer") ||
    roleLower.includes("emollient") ||
    roleLower.includes("plasticizer")
  ) {
    return { key: "MOISTURIZER", customLabel: "" };
  }
  if (
    roleLower.includes("hydrophilic vehicle") ||
    roleLower.includes("aqueous") ||
    roleLower.includes("diluent") ||
    roleLower.includes("ointment base") ||
    roleLower.includes("base ingredient")
  ) {
    return { key: "BASE", customLabel: "" };
  }
  if (type === "SOLVENT" || roleLower.includes("solvent")) {
    return { key: "SOLVENT", customLabel: "" };
  }
  if (type === "PRESERVATIVE" || roleLower.includes("preservative") || roleLower.includes("antimicrobial")) {
    return { key: "PRESERVATIVE", customLabel: "" };
  }
  if (
    type === "ANALYTICAL_STANDARD" ||
    roleLower.includes("analytical") ||
    roleLower.includes("testing reference") ||
    roleLower.includes("reference standard")
  ) {
    return { key: "TESTING", customLabel: "" };
  }
  if (!roleText || roleLower === "other / custom" || roleLower === "other") {
    return { key: "OTHER", customLabel: "" };
  }
  return { key: "OTHER", customLabel: roleText };
}

/** Flat catalog search across all preset families (for autocomplete). */
export function getAllMaterialPresets(options?: {
  plantName?: string;
  extractFractionName?: string;
  verifiedPhytochemicals?: any[];
}): MaterialPresetItem[] {
  const botanical = getActiveBotanicalPresets(
    options?.plantName || "Botanical",
    options?.extractFractionName
  );
  const analytical = getAnalyticalStandardPresets(options?.verifiedPhytochemicals || []);
  return [
    ...botanical,
    ...EXCIPIENT_PRESETS,
    ...SOLVENT_PRESETS,
    ...PRESERVATIVE_PRESETS,
    ...analytical,
  ];
}

export const CURATED_SUPPLIERS = [
  "Sigma-Aldrich / Merck Life Science",
  "Lubrizol Life Science",
  "BASF Pharma Solutions",
  "Local Compounding Pharmacy Depot",
  "Philippine Institute of Pure & Applied Chemistry (PIPAC)",
  "UST / National Museum Herbarium Repository",
  "Fisher Scientific",
  "TCI Chemicals",
  "Croda International",
] as const;

/**
 * Generate plant-specific botanical material presets
 */
export function getActiveBotanicalPresets(plantName: string, fractionId?: string): MaterialPresetItem[] {
  const pName = plantName || "Botanical";
  const fId = fractionId && fractionId.trim() ? fractionId.trim() : "EXT-001";

  return [
    {
      id: "bot_dried_leaves",
      name: `${pName} Dried Leaves`,
      type: "ACTIVE_BOTANICAL",
      suggestedRole: "Botanical Active",
      suggestedUnit: "g",
      suggestedGrade: "Research Grade",
      description: `Harvested and authenticated whole dried leaves of ${pName}`,
    },
    {
      id: "bot_leaf_powder",
      name: `${pName} Leaf Powder`,
      type: "ACTIVE_BOTANICAL",
      suggestedRole: "Botanical Active",
      suggestedUnit: "g",
      suggestedGrade: "Research Grade",
      description: `Milled botanical foliar powder (mesh size 40–60)`,
    },
    {
      id: "bot_crude_extract",
      name: `${pName} Crude Extract`,
      type: "ACTIVE_BOTANICAL",
      suggestedRole: "Botanical Active",
      suggestedUnit: "g",
      suggestedGrade: "Research Grade",
      description: `Concentrated crude botanical extract residue`,
    },
    {
      id: "bot_standardized_extract",
      name: `${pName} Standardized Extract`,
      type: "ACTIVE_BOTANICAL",
      suggestedRole: "Botanical Active",
      suggestedUnit: "g",
      suggestedGrade: "Pharmaceutical Grade",
      description: `Standardized extract containing quantified bioactive marker compounds`,
    },
    {
      id: "bot_extract_fraction",
      name: `${pName} Extract Fraction (${fId})`,
      type: "ACTIVE_BOTANICAL",
      suggestedRole: "Botanical Active",
      suggestedUnit: "g",
      suggestedGrade: "Research Grade",
      description: `Laboratory lot ${fId} prepared via standardized extraction protocol`,
    },
    {
      id: "bot_whole_herb",
      name: `${pName} Whole Herb / Aerial Parts`,
      type: "ACTIVE_BOTANICAL",
      suggestedRole: "Botanical Active",
      suggestedUnit: "g",
      suggestedGrade: "Research Grade",
      description: `Fresh or dried aerial parts of authenticated ${pName}`,
    },
  ];
}

/**
 * Generate analytical reference standards from verified phytochemicals
 */
export function getAnalyticalStandardPresets(compounds: any[]): MaterialPresetItem[] {
  if (!compounds || compounds.length === 0) {
    return [
      {
        id: "std_primary_ref",
        name: "Primary Phytochemical Reference Standard",
        type: "ANALYTICAL_STANDARD",
        suggestedRole: "Analytical Reference",
        suggestedUnit: "mg",
        suggestedGrade: "Analytical Grade (≥98.0%)",
        description: "High-purity reference compound for chromatographic identification",
      },
    ];
  }

  return compounds.map((c) => ({
    id: `std_${c.id || c.compoundName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    name: `${c.compoundName} Analytical Standard`,
    type: "ANALYTICAL_STANDARD",
    suggestedRole: "Analytical Reference",
    suggestedUnit: "mg",
    suggestedGrade: "Analytical Grade (≥98.0%)",
    description: `HPLC Reference Standard for ${c.compoundName} (${c.molecularFormula || "C"}), PubChem CID: ${c.pubchemId || "N/A"}`,
  }));
}

