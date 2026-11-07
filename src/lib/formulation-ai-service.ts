import { callTogetherChat } from "@/lib/ai/together-provider";

export interface FormulationRecommendedIngredient {
  id: string;
  ingredientName: string;
  componentName: string; // compatibility alias
  componentType: "ACTIVE_EXTRACT" | "EXCIPIENT" | "VEHICLE" | "PRESERVATIVE" | string;
  functionalRole: string;
  roleInFormulation: string; // compatibility alias
  suggestedConcentration: number | null;
  proposedConcentration: string; // compatibility alias
  suggestedConcentrationRange: string;
  concentrationUnit: string;
  isConcentrationSupported: boolean;
  evidenceStatus: "SUPPORTED" | "REQUIRES_EXPERIMENTAL_VALIDATION";
  isVehicle: boolean;
  isPhAdjuster: boolean;
  scientificRationale: string;
  sourceReference: string;
  evidenceLevel: "COMPENDIAL" | "PLANT_SPECIFIC" | "THEORETICAL_PROPOSAL";
  inventoryMatch?: {
    id: number;
    materialName: string;
    materialType: string;
    gradeOrPurity?: string;
    supplierOrSource?: string | null;
    lotOrBatchNumber?: string | null;
    quantityAvailable?: number | null;
    unit?: string | null;
    inventoryStatus: string;
    extractFractionId?: string | null;
  } | null;
  isAvailableInInventory: boolean;
  inventoryStatus: "AVAILABLE" | "PLANNED" | "NOT_IN_INVENTORY";
  extractFractionId?: string | null;
  isAiSuggested?: boolean;
}

// Backward compatibility alias
export type FormulationProposalComponent = FormulationRecommendedIngredient;

export interface FormulationProposal {
  formulationName: string;
  dosageFormType: string;
  targetExtractDescription: string;
  components: FormulationRecommendedIngredient[];
  scientificRationale: string;
  compatibilityConsiderations: string;
  safetyAndLimitations: string;
  supportingReferences: string[];
  disclaimer: string;
  generatedAt: string;
}

export interface FormulationAiContext {
  projectId: number;
  plantName: string;
  plantScientificName?: string;
  plantPart?: string;
  extractionSolvent?: string;
  extractionMethod?: string;
  solventConcentration?: string;
  extractFractionName?: string;
  extractFractionId?: string;
  extractYieldPercent?: string;
  plantMaterialMass?: string;
  researchObjective?: string;
  researchQuestion?: string;
  productType?: string;
  dosageFormType?: string;
  deliveryFormat?: string;
  targetIndications?: string;
  intendedPopulation?: string;
  packagingType?: string;
  purpose?: string;
  materials?: Array<{
    id: number;
    materialName: string;
    materialType: string;
    gradeOrPurity?: string;
    supplierOrSource?: string | null;
    lotOrBatchNumber?: string | null;
    quantityAvailable?: number | null;
    unit?: string | null;
    inventoryStatus?: string;
    extractFractionId?: string | null;
    functionDescription?: string | null;
  }>;
  compounds?: Array<{
    compoundName: string;
    molecularFormula?: string;
    molecularWeight?: number;
    logP?: number;
    smiles?: string;
    selectedForDocking?: boolean | number;
  }>;
  dockingRuns?: Array<{
    ligandName: string;
    targetProtein: string;
    bindingAffinity: string | number;
    units?: string;
  }>;
  literature?: Array<{
    title: string;
    authors?: string;
    year?: number | string;
    journal?: string;
    pmid?: string;
  }>;
}

function extractJson(text: string): Record<string, any> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] || text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("NO_JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

/**
 * Normalizes text for matching material names against inventory
 */
export function normalizeMaterialName(str: string | null | undefined): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Searches context.materials for an inventory match, supporting pharmaceutical
 * synonyms and plant-specific botanical extract naming.
 */
export function findInventoryMatch(
  ingredientName: string,
  componentType: string,
  materials: any[] = [],
  plantName?: string
) {
  if (!materials || materials.length === 0) return null;

  const targetNorm = normalizeMaterialName(ingredientName);
  const plantNorm = normalizeMaterialName(plantName);

  // 1. If active botanical, match against active botanical type or plant name
  if (componentType === "ACTIVE_EXTRACT" || componentType === "ACTIVE_BOTANICAL") {
    const botanical = materials.find((m) => {
      const mType = m.materialType || "";
      const mNorm = normalizeMaterialName(m.materialName);
      if (mType === "ACTIVE_BOTANICAL" || mType === "ACTIVE_EXTRACT") return true;
      if (plantNorm && mNorm.includes(plantNorm)) return true;
      if (mNorm.includes("extract")) return true;
      return false;
    });
    if (botanical) return botanical;
  }

  // 2. Exact or normalized substring match
  for (const m of materials) {
    const matNorm = normalizeMaterialName(m.materialName);
    if (!matNorm) continue;
    if (matNorm === targetNorm || matNorm.includes(targetNorm) || targetNorm.includes(matNorm)) {
      return m;
    }
  }

  // 3. Common pharmaceutical synonyms & trade names
  // Carbomer / Carbopol
  if (targetNorm.includes("carbomer") || targetNorm.includes("carbopol")) {
    const match = materials.find((m) => {
      const n = normalizeMaterialName(m.materialName);
      return n.includes("carbomer") || n.includes("carbopol") || n.includes("carboxypolymethylene");
    });
    if (match) return match;
  }

  // Purified Water / Aqua / Water USP
  if (targetNorm.includes("water") || targetNorm.includes("aqua")) {
    const match = materials.find((m) => {
      const n = normalizeMaterialName(m.materialName);
      return n.includes("water") || n.includes("aqua");
    });
    if (match) return match;
  }

  // Triethanolamine / TEA / Trolamine
  if (targetNorm.includes("triethanolamine") || targetNorm.includes("tea") || targetNorm.includes("trolamine")) {
    const match = materials.find((m) => {
      const n = normalizeMaterialName(m.materialName);
      return n.includes("triethanolamine") || n === "tea" || n.includes("trolamine");
    });
    if (match) return match;
  }

  // Glycerin / Glycerol
  if (targetNorm.includes("glycerin") || targetNorm.includes("glycerol")) {
    const match = materials.find((m) => {
      const n = normalizeMaterialName(m.materialName);
      return n.includes("glycerin") || n.includes("glycerol");
    });
    if (match) return match;
  }

  // Phenoxyethanol
  if (targetNorm.includes("phenoxyethanol")) {
    const match = materials.find((m) => normalizeMaterialName(m.materialName).includes("phenoxyethanol"));
    if (match) return match;
  }

  // Propylene glycol
  if (targetNorm.includes("propyleneglycol")) {
    const match = materials.find((m) => normalizeMaterialName(m.materialName).includes("propyleneglycol"));
    if (match) return match;
  }

  // Simple Syrup
  if (targetNorm.includes("syrup")) {
    const match = materials.find((m) => normalizeMaterialName(m.materialName).includes("syrup"));
    if (match) return match;
  }

  // Sodium Benzoate
  if (targetNorm.includes("benzoate")) {
    const match = materials.find((m) => normalizeMaterialName(m.materialName).includes("benzoate"));
    if (match) return match;
  }

  // Microcrystalline cellulose / MCC / Avicel
  if (targetNorm.includes("microcrystalline") || targetNorm.includes("mcc") || targetNorm.includes("avicel")) {
    const match = materials.find((m) => {
      const n = normalizeMaterialName(m.materialName);
      return n.includes("microcrystalline") || n.includes("mcc") || n.includes("avicel");
    });
    if (match) return match;
  }

  // Magnesium Stearate
  if (targetNorm.includes("magnesiumstearate") || targetNorm.includes("mgstearate")) {
    const match = materials.find((m) => {
      const n = normalizeMaterialName(m.materialName);
      return n.includes("magnesiumstearate") || n.includes("mgstearate");
    });
    if (match) return match;
  }

  // Silicon Dioxide / Aerosil
  if (targetNorm.includes("silicondioxide") || targetNorm.includes("aerosil")) {
    const match = materials.find((m) => {
      const n = normalizeMaterialName(m.materialName);
      return n.includes("silicondioxide") || n.includes("aerosil");
    });
    if (match) return match;
  }

  return null;
}

/**
 * Builds deterministic, compendially grounded preliminary formulation proposals.
 * Guarantees zero artificial concentration claims for botanical extracts.
 */
export function buildDeterministicProposal(context: FormulationAiContext): FormulationProposal {
  const plant = (context.plantName || "Medicinal Plant").trim();
  const part = (context.plantPart || "Leaves").trim();
  const solvent = (context.extractionSolvent || "70% Aqueous Ethanol").trim();
  const method = (context.extractionMethod || "Standardized Maceration").trim();
  const rawDosage = (context.dosageFormType || context.deliveryFormat || "Topical Hydrogel").trim();
  const dosageLower = rawDosage.toLowerCase();
  const materials = context.materials || [];
  const fractionId =
    context.extractFractionId ||
    context.extractFractionName ||
    `${plant.slice(0, 3).toUpperCase()}-EXT-001`;

  const topCompound = context.compounds?.[0]?.compoundName || "Bioactive Secondary Metabolites";
  const topDocking = context.dockingRuns?.[0];
  const dockingRationale = topDocking
    ? `Docking simulations demonstrated binding affinity of ${topDocking.bindingAffinity} ${topDocking.units || "kcal/mol"} toward ${topDocking.targetProtein}.`
    : `Enriched in marker compounds including ${topCompound}.`;

  const rawIngredients: Array<{
    name: string;
    type: string;
    role: string;
    conc: number | null;
    range: string;
    isSupported: boolean;
    isVehicle: boolean;
    isPhAdjuster: boolean;
    rationale: string;
    reference: string;
    evidenceLevel: "COMPENDIAL" | "PLANT_SPECIFIC" | "THEORETICAL_PROPOSAL";
  }> = [];

  // Active Botanical (ALWAYS requires researcher input / validation)
  rawIngredients.push({
    name: `${plant} Leaf Extract`,
    type: "ACTIVE_EXTRACT",
    role: "Botanical Active",
    conc: null,
    range: "Concentration: Requires Researcher Input",
    isSupported: false,
    isVehicle: false,
    isPhAdjuster: false,
    rationale: `Botanical extract fraction obtained from ${part} via ${method} using ${solvent}. Standardized active extract candidate for preliminary formulation compounding. Active botanical concentration requires experimental laboratory validation.`,
    reference: "Philippine Herbal Pharmacopeia (PHP); USP <561> Articles of Botanical Origin",
    evidenceLevel: "PLANT_SPECIFIC",
  });

  if (dosageLower.includes("hydrogel") || dosageLower.includes("gel")) {
    rawIngredients.push(
      {
        name: "Carbomer 940",
        type: "EXCIPIENT",
        role: "Gelling Agent",
        conc: 1.0,
        range: "0.5% – 1.5% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "High molecular weight crosslinked polyacrylic acid polymer providing clear, bioadhesive viscoelastic matrix with non-greasy spreadability.",
        reference: "Handbook of Pharmaceutical Excipients — Carbomer Monograph; USP-NF",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Glycerin",
        type: "EXCIPIENT",
        role: "Humectant",
        conc: 5.0,
        range: "3.0% – 10.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Trihydroxy sugar alcohol that retains dermal hydration, improves tactile spreadability, and prevents premature drying of the aqueous gel network.",
        reference: "USP-NF Monograph: Glycerin",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Triethanolamine (TEA)",
        type: "EXCIPIENT",
        role: "pH Adjuster",
        conc: null, // q.s.
        range: "q.s. to pH 5.5–6.5 (titrate to target pH)",
        isSupported: false, // q.s. titrant requires empirical bench titration
        isVehicle: false,
        isPhAdjuster: true,
        rationale: "Organic tertiary amine added dropwise with gentle stirring to neutralize acidic carbomer carboxylic groups, crosslinking polymer chains into a clear gel compatible with skin physiological pH.",
        reference: "Handbook of Pharmaceutical Excipients — Triethanolamine",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Purified Water (USP)",
        type: "VEHICLE",
        role: "Aqueous Vehicle",
        conc: null, // q.s. to 100%
        range: "q.s. to 100% w/w",
        isSupported: true,
        isVehicle: true,
        isPhAdjuster: false,
        rationale: "Continuous hydrophilic phase ensuring full hydration of carbomer polymers and dissolution of polar phytochemical fractions.",
        reference: "USP <1231> Water for Pharmaceutical Purposes",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Phenoxyethanol",
        type: "PRESERVATIVE",
        role: "Antimicrobial Preservative",
        conc: 0.8,
        range: "0.5% – 1.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Broad-spectrum antimicrobial agent preventing bacterial and fungal contamination in high-water aqueous topical preparations.",
        reference: "USP <51> Antimicrobial Effectiveness Testing",
        evidenceLevel: "COMPENDIAL",
      }
    );
  } else if (dosageLower.includes("cream") || dosageLower.includes("lotion") || dosageLower.includes("emulsion")) {
    rawIngredients.push(
      {
        name: "Cetearyl Alcohol & Ceteareth-20",
        type: "EXCIPIENT",
        role: "Emulsifying Wax",
        conc: 6.0,
        range: "4.0% – 8.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Self-emulsifying nonionic base providing stable oil-in-water lamellar structures.",
        reference: "Handbook of Pharmaceutical Excipients",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Light Mineral Oil",
        type: "EXCIPIENT",
        role: "Emollient",
        conc: 8.0,
        range: "5.0% – 15.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Lipophilic emollient phase creating a protective moisture-retentive barrier on stratum corneum.",
        reference: "USP-NF Monograph: Mineral Oil",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Glycerin",
        type: "EXCIPIENT",
        role: "Humectant",
        conc: 4.0,
        range: "2.0% – 8.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Hydrating humectant stabilizing the aqueous continuous phase.",
        reference: "USP-NF Monograph: Glycerin",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Purified Water (USP)",
        type: "VEHICLE",
        role: "Continuous Phase Vehicle",
        conc: null,
        range: "q.s. to 100% w/w",
        isSupported: true,
        isVehicle: true,
        isPhAdjuster: false,
        rationale: "Continuous aqueous carrier for emulsion compounding.",
        reference: "USP <1231> Water for Pharmaceutical Purposes",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Phenoxyethanol",
        type: "PRESERVATIVE",
        role: "Antimicrobial Preservative",
        conc: 0.8,
        range: "0.5% – 1.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Broad-spectrum antimicrobial preservation.",
        reference: "USP <51>",
        evidenceLevel: "COMPENDIAL",
      }
    );
  } else if (dosageLower.includes("ointment")) {
    rawIngredients.push(
      {
        name: "White Petrolatum (USP)",
        type: "EXCIPIENT",
        role: "Hydrocarbon Base / Occlusive",
        conc: 80.0,
        range: "70.0% – 90.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Semi-solid occlusive hydrocarbon base preventing transepidermal water loss.",
        reference: "USP-NF Monograph: White Petrolatum",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Cetyl Alcohol",
        type: "EXCIPIENT",
        role: "Stiffening Agent",
        conc: 5.0,
        range: "3.0% – 10.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Increases structural viscosity and thermal stability of the hydrocarbon base.",
        reference: "USP-NF Monograph: Cetyl Alcohol",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Mineral Oil",
        type: "EXCIPIENT",
        role: "Levigating Agent",
        conc: null,
        range: "q.s. to 100% w/w",
        isSupported: true,
        isVehicle: true,
        isPhAdjuster: false,
        rationale: "Liquid hydrocarbon carrier used for fine geometric trituration of botanical extracts.",
        reference: "Handbook of Pharmaceutical Excipients",
        evidenceLevel: "COMPENDIAL",
      }
    );
  } else if (dosageLower.includes("syrup") || dosageLower.includes("oral") || dosageLower.includes("solution")) {
    rawIngredients.push(
      {
        name: "Simple Syrup 66.7% (USP)",
        type: "EXCIPIENT",
        role: "Sweetener & Viscosity Vehicle",
        conc: 60.0,
        range: "50.0% – 70.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "High-osmolarity sucrose vehicle masking botanical bitterness and providing palatability.",
        reference: "USP-NF Monograph: Syrup",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Sodium Benzoate",
        type: "PRESERVATIVE",
        role: "Antimicrobial Preservative",
        conc: 0.2,
        range: "0.1% – 0.5% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Preservative preventing fungal and yeast proliferation in oral liquid preparations.",
        reference: "USP-NF Monograph: Sodium Benzoate",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Citric Acid Monohydrate",
        type: "EXCIPIENT",
        role: "pH Buffer / Acidulant",
        conc: null,
        range: "q.s. to pH 4.0–4.5",
        isSupported: false,
        isVehicle: false,
        isPhAdjuster: true,
        rationale: "Optimizes benzoic acid antimicrobial dissociation and provides pleasant tartness.",
        reference: "Handbook of Pharmaceutical Excipients",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Purified Water (USP)",
        type: "VEHICLE",
        role: "Aqueous Vehicle",
        conc: null,
        range: "q.s. to 100% w/w",
        isSupported: true,
        isVehicle: true,
        isPhAdjuster: false,
        rationale: "Continuous diluent carrier phase for oral liquid formulation.",
        reference: "USP <1231>",
        evidenceLevel: "COMPENDIAL",
      }
    );
  } else {
    // General Capsule / Powder Dosage Form
    rawIngredients.push(
      {
        name: "Microcrystalline Cellulose (Avicel PH-102)",
        type: "EXCIPIENT",
        role: "Diluent & Dry Binder",
        conc: 40.0,
        range: "30.0% – 60.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Direct compression diluent with excellent flowability and rapid disintegration.",
        reference: "Handbook of Pharmaceutical Excipients — MCC",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Colloidal Silicon Dioxide",
        type: "EXCIPIENT",
        role: "Glidant & Moisture Scavenger",
        conc: 0.5,
        range: "0.2% – 1.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Improves powder flow and protects hygroscopic dry plant extract from clumping.",
        reference: "USP-NF Monograph: Colloidal Silicon Dioxide",
        evidenceLevel: "COMPENDIAL",
      },
      {
        name: "Magnesium Stearate",
        type: "EXCIPIENT",
        role: "Lubricant",
        conc: 1.0,
        range: "0.5% – 2.0% w/w",
        isSupported: true,
        isVehicle: false,
        isPhAdjuster: false,
        rationale: "Reduces die-wall and punch friction during encapsulation.",
        reference: "USP-NF Monograph: Magnesium Stearate",
        evidenceLevel: "COMPENDIAL",
      }
    );
  }

  // Map ingredients to inventory
  const components: FormulationRecommendedIngredient[] = rawIngredients.map((raw, idx) => {
    const invMatch = findInventoryMatch(raw.name, raw.type, materials, plant);
    const isAvail = Boolean(invMatch && invMatch.quantityAvailable != null && Number(invMatch.quantityAvailable) > 0);
    const invStatus: "AVAILABLE" | "PLANNED" | "NOT_IN_INVENTORY" = invMatch
      ? isAvail
        ? "AVAILABLE"
        : "PLANNED"
      : "NOT_IN_INVENTORY";

    return {
      id: `ai-comp-${Date.now()}-${idx}`,
      ingredientName: raw.name,
      componentName: raw.name,
      componentType: raw.type,
      functionalRole: raw.role,
      roleInFormulation: raw.role,
      suggestedConcentration: raw.conc,
      proposedConcentration: raw.range,
      suggestedConcentrationRange: raw.range,
      concentrationUnit: "% w/w",
      isConcentrationSupported: raw.isSupported,
      evidenceStatus: raw.isSupported ? ("SUPPORTED" as const) : ("REQUIRES_EXPERIMENTAL_VALIDATION" as const),
      isVehicle: raw.isVehicle,
      isPhAdjuster: raw.isPhAdjuster,
      scientificRationale: raw.rationale,
      sourceReference: raw.reference,
      evidenceLevel: raw.evidenceLevel,
      inventoryMatch: invMatch
        ? {
            id: invMatch.id,
            materialName: invMatch.materialName,
            materialType: invMatch.materialType,
            gradeOrPurity: invMatch.gradeOrPurity,
            supplierOrSource: invMatch.supplierOrSource,
            lotOrBatchNumber: invMatch.lotOrBatchNumber,
            quantityAvailable: invMatch.quantityAvailable != null ? Number(invMatch.quantityAvailable) : null,
            unit: invMatch.unit,
            inventoryStatus: invMatch.inventoryStatus || invStatus,
            extractFractionId: invMatch.extractFractionId || (raw.type === "ACTIVE_EXTRACT" ? fractionId : null),
          }
        : null,
      isAvailableInInventory: isAvail,
      inventoryStatus: invStatus,
      extractFractionId: raw.type === "ACTIVE_EXTRACT" ? (invMatch?.extractFractionId || fractionId) : undefined,
      isAiSuggested: true,
    };
  });

  return {
    formulationName: `${plant} ${rawDosage}`,
    dosageFormType: rawDosage,
    targetExtractDescription: `Standardized ${plant} extract fraction (${fractionId}) obtained from ${part} via ${method} using ${solvent}.`,
    components,
    scientificRationale: `Preliminary formulation proposal structured to optimize active phytochemical delivery of ${plant} in a standardized ${rawDosage} matrix. Ingredients provide polymer rheology, dermal humectancy, and microbiological preservation. Active extract concentration requires laboratory bench optimization.`,
    compatibilityConsiderations: `Polyphenolic botanical constituents are sensitive to oxidative degradation and pH-dependent precipitation. Maintain matrix pH between 5.5 and 6.5. Protect from direct light and avoid high compounding shear.`,
    safetyAndLimitations: `PRELIMINARY HYPOTHESIS ONLY: Computational formulation suggestion. Active botanical concentration is designated as requiring empirical experimental validation. Laboratory bench compounding, stability testing, and in-vitro safety testing are mandatory prior to clinical application.`,
    supportingReferences: [
      "Philippine Herbal Pharmacopeia (PHP) Standards",
      "Handbook of Pharmaceutical Excipients (9th Edition)",
      "USP <1151> Pharmaceutical Dosage Forms",
      "USP <1231> Water for Pharmaceutical Purposes",
      "USP <51> Antimicrobial Effectiveness Testing",
    ],
    disclaimer: "AI-assisted preliminary research hypothesis. Must undergo laboratory compounding, stability testing, and in-vitro safety validation before any therapeutic or clinical application.",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates project-aware formulation proposals using Together AI with
 * deterministic fallback guarantee.
 */
export async function generateFormulationProposal(
  context: FormulationAiContext
): Promise<FormulationProposal> {
  const deterministic = buildDeterministicProposal(context);

  const plant = context.plantName || "Medicinal Plant";
  const scientific = context.plantScientificName || "";
  const part = context.plantPart || "Leaves";
  const solvent = context.extractionSolvent || "70% Aqueous Ethanol";
  const method = context.extractionMethod || "Standardized Maceration";
  const dosageForm = context.dosageFormType || context.deliveryFormat || "Topical Hydrogel";
  const targetApp = context.targetIndications || "Target Therapeutic Application";

  const compoundSummary = context.compounds && context.compounds.length > 0
    ? context.compounds.slice(0, 5).map((c) => `- ${c.compoundName} (Formula: ${c.molecularFormula || "N/A"})`).join("\n")
    : "No isolated compounds identified yet; crude botanical phytochemical profile.";

  const dockingSummary = context.dockingRuns && context.dockingRuns.length > 0
    ? context.dockingRuns.slice(0, 4).map((d) => `- ${d.ligandName} vs ${d.targetProtein}: ${d.bindingAffinity} ${d.units || "kcal/mol"}`).join("\n")
    : "Computational docking data pending.";

  const systemPrompt = `You are a Senior Pharmaceutical Scientist and Botanical Formulation Expert on the NatureAide scientific platform.
Your task is to refine a preliminary, evidence-grounded formulation proposal for ${plant} (${scientific}) in a ${dosageForm} format.

CRITICAL SCIENTIFIC INTEGRITY RULES:
1. NEVER invent, fabricate, or hallucinate numerical extract concentrations for botanical actives. If unsupported by documented literature, you MUST set proposedConcentration to null and isConcentrationSupported to false ("Concentration: Requires Researcher Input").
2. Excipients must be compendial standard ingredients appropriate for the requested dosage form.
3. pH adjusters (TEA, citric acid) added q.s. must not have an arbitrary fixed percentage.
4. Continuous vehicle (Purified Water) must be designated as q.s. to 100%.
5. Never make absolute medical efficacy claims (e.g. "proven anti-inflammatory", "cures fungal infection").

Respond ONLY with valid JSON:
{
  "formulationName": "string",
  "dosageFormType": "string",
  "scientificRationale": "string",
  "compatibilityConsiderations": "string",
  "safetyAndLimitations": "string"
}`;

  const userPrompt = `Project Context:
- Plant: ${plant} (${scientific})
- Plant Part Used: ${part}
- Extraction Method: ${method}
- Extraction Solvent: ${solvent}
- Target Dosage Form: ${dosageForm}
- Target Application: ${targetApp}

Stage 2 Phytochemical Markers:
${compoundSummary}

Stage 3 Docking Affinities:
${dockingSummary}

Provide scientific rationale and compatibility notes in JSON format.`;

  try {
    const aiResponse = await callTogetherChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], {
      temperature: 0.2,
      maxTokens: 2000,
    });

    if (aiResponse.success && aiResponse.content) {
      const parsed = extractJson(aiResponse.content);
      if (parsed) {
        return {
          ...deterministic,
          formulationName: String(parsed.formulationName || deterministic.formulationName),
          dosageFormType: String(parsed.dosageFormType || deterministic.dosageFormType),
          scientificRationale: String(parsed.scientificRationale || deterministic.scientificRationale),
          compatibilityConsiderations: String(parsed.compatibilityConsiderations || deterministic.compatibilityConsiderations),
          safetyAndLimitations: String(parsed.safetyAndLimitations || deterministic.safetyAndLimitations),
        };
      }
    }
  } catch (err: any) {
    console.warn("[formulation-ai-service] AI LLM refinement skipped, returning grounded deterministic proposal:", err.message);
  }

  return deterministic;
}
