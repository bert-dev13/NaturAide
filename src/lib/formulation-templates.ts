/**
 * NatureAide V2 — Formulation Templates & Master Compounding Catalog
 * Provides standardized pharmaceutical templates, vehicle structures,
 * and excipient matrices aligned with USP/NF and Ph. Eur. compendial standards.
 */

export interface TemplateComponentItem {
  ingredientName: string;
  componentType: "ACTIVE_EXTRACT" | "EXCIPIENT" | "VEHICLE" | "PRESERVATIVE";
  suggestedConcentration: number;
  concentrationUnit: string;
  minConcentration: number;
  maxConcentration: number;
  roleOrFunction: string;
  notes: string;
  isVehicle?: boolean;
}

export interface FormulationTemplate {
  id: string;
  name: string;
  route: "Topical" | "Oral" | "Other";
  dosageFormat: string;
  description: string;
  typicalBatchSize: string;
  components: (plantName: string, extractFractionId?: string) => TemplateComponentItem[];
}

export const FORMULATION_TEMPLATES: FormulationTemplate[] = [
  {
    id: "topical_hydrogel",
    name: "Topical Hydrogel",
    route: "Topical",
    dosageFormat: "Topical Hydrogel",
    description: "Crystal-clear aqueous polymer gel matrix maximizing active skin partition and hydration.",
    typicalBatchSize: "500 g",
    components: (plantName: string, extractFractionId?: string) => [
      {
        ingredientName: `${plantName || "Botanical"} Standardized Extract ${extractFractionId ? `(${extractFractionId})` : ""}`.trim(),
        componentType: "ACTIVE_EXTRACT",
        suggestedConcentration: 5.0,
        concentrationUnit: "% w/w",
        minConcentration: 2.0,
        maxConcentration: 10.0,
        roleOrFunction: "Active Botanical Marker Complex (Anti-inflammatory / Antioxidant)",
        notes: "Standardized laboratory extract lot; requires experimental verification of concentration.",
      },
      {
        ingredientName: "Carbomer 940",
        componentType: "EXCIPIENT",
        suggestedConcentration: 1.0,
        concentrationUnit: "% w/w",
        minConcentration: 0.5,
        maxConcentration: 2.0,
        roleOrFunction: "Primary Gelling Agent / High-viscosity Matrix Builder",
        notes: "USP/NF polyacrylic acid polymer providing crystal-clear gel structure.",
      },
      {
        ingredientName: "Triethanolamine (TEA)",
        componentType: "EXCIPIENT",
        suggestedConcentration: 1.0,
        concentrationUnit: "% w/w",
        minConcentration: 0.5,
        maxConcentration: 1.5,
        roleOrFunction: "Neutralizing Agent (Adjusts pH to physiological 5.5–6.0)",
        notes: "Neutralizes carboxyl groups of carbomer to induce maximum gel viscosity.",
      },
      {
        ingredientName: "Glycerin",
        componentType: "EXCIPIENT",
        suggestedConcentration: 5.0,
        concentrationUnit: "% w/w",
        minConcentration: 2.0,
        maxConcentration: 10.0,
        roleOrFunction: "Humectant & Emollient (Prevents Gel Desiccation)",
        notes: "USP compendial humectant providing skin barrier moisturization.",
      },
      {
        ingredientName: "Propylene Glycol",
        componentType: "EXCIPIENT",
        suggestedConcentration: 3.0,
        concentrationUnit: "% w/w",
        minConcentration: 1.0,
        maxConcentration: 8.0,
        roleOrFunction: "Cosolvent & Transdermal Penetration Enhancer",
        notes: "Facilitates active secondary metabolite partitioning into epidermis.",
      },
      {
        ingredientName: "Phenoxyethanol",
        componentType: "PRESERVATIVE",
        suggestedConcentration: 0.8,
        concentrationUnit: "% w/w",
        minConcentration: 0.5,
        maxConcentration: 1.0,
        roleOrFunction: "Broad-Spectrum Antimicrobial Preservative",
        notes: "USP/Cosmetic-grade preservative preventing bacterial and fungal contamination.",
      },
      {
        ingredientName: "Purified Water (USP)",
        componentType: "VEHICLE",
        suggestedConcentration: 84.2,
        concentrationUnit: "% w/w",
        minConcentration: 70.0,
        maxConcentration: 92.0,
        roleOrFunction: "Aqueous Continuous Vehicle (q.s. to 100%)",
        notes: "Deionized, microbial-tested compendial continuous aqueous phase.",
        isVehicle: true,
      },
    ],
  },
  {
    id: "topical_cream",
    name: "Topical Cream",
    route: "Topical",
    dosageFormat: "Topical Cream (O/W)",
    description: "Oil-in-water biphasic emulsion providing both hydration and protective lipid barrier film.",
    typicalBatchSize: "500 g",
    components: (plantName: string, extractFractionId?: string) => [
      {
        ingredientName: `${plantName || "Botanical"} Standardized Extract ${extractFractionId ? `(${extractFractionId})` : ""}`.trim(),
        componentType: "ACTIVE_EXTRACT",
        suggestedConcentration: 5.0,
        concentrationUnit: "% w/w",
        minConcentration: 2.0,
        maxConcentration: 10.0,
        roleOrFunction: "Active Botanical Marker Complex",
        notes: "Carries quantified secondary metabolites into dermal layer.",
      },
      {
        ingredientName: "Cetyl Alcohol",
        componentType: "EXCIPIENT",
        suggestedConcentration: 3.0,
        concentrationUnit: "% w/w",
        minConcentration: 1.5,
        maxConcentration: 5.0,
        roleOrFunction: "Emulsion Co-Stabilizer & Emollient Stiffening Agent",
        notes: "Fatty alcohol providing body and stability to cream matrix.",
      },
      {
        ingredientName: "Stearic Acid",
        componentType: "EXCIPIENT",
        suggestedConcentration: 4.0,
        concentrationUnit: "% w/w",
        minConcentration: 2.0,
        maxConcentration: 6.0,
        roleOrFunction: "Oil-phase Structuring Agent & Barrier Protectant",
        notes: "Lipid phase component forming protective occlusion.",
      },
      {
        ingredientName: "Polysorbate 80",
        componentType: "EXCIPIENT",
        suggestedConcentration: 2.0,
        concentrationUnit: "% w/w",
        minConcentration: 1.0,
        maxConcentration: 4.0,
        roleOrFunction: "O/W Emulsifying Surfactant (HLB 15.0)",
        notes: "Non-ionic emulsifier stabilizing microscopic oil droplets.",
      },
      {
        ingredientName: "Glycerin",
        componentType: "EXCIPIENT",
        suggestedConcentration: 6.0,
        concentrationUnit: "% w/w",
        minConcentration: 3.0,
        maxConcentration: 10.0,
        roleOrFunction: "Aqueous Phase Humectant",
        notes: "Maintains moisture retention in stratum corneum.",
      },
      {
        ingredientName: "Methylparaben",
        componentType: "PRESERVATIVE",
        suggestedConcentration: 0.15,
        concentrationUnit: "% w/w",
        minConcentration: 0.1,
        maxConcentration: 0.25,
        roleOrFunction: "Water-Phase Preservative",
        notes: "Compendial antimicrobial active against yeasts and molds.",
      },
      {
        ingredientName: "Propylparaben",
        componentType: "PRESERVATIVE",
        suggestedConcentration: 0.05,
        concentrationUnit: "% w/w",
        minConcentration: 0.02,
        maxConcentration: 0.1,
        roleOrFunction: "Oil-Phase Preservative Synergist",
        notes: "Lipophilic paraben providing synergistic antimicrobial preservation.",
      },
      {
        ingredientName: "Purified Water (USP)",
        componentType: "VEHICLE",
        suggestedConcentration: 79.8,
        concentrationUnit: "% w/w",
        minConcentration: 65.0,
        maxConcentration: 85.0,
        roleOrFunction: "Continuous Aqueous Phase Vehicle (q.s. to 100%)",
        notes: "Sterile compendial water phase.",
        isVehicle: true,
      },
    ],
  },
  {
    id: "topical_ointment",
    name: "Topical Ointment",
    route: "Topical",
    dosageFormat: "Topical Ointment (Hydrocarbon Base)",
    description: "Lipophilic occlusive vehicle maximizing active residence time on dry or hyperkeratotic lesions.",
    typicalBatchSize: "250 g",
    components: (plantName: string, extractFractionId?: string) => [
      {
        ingredientName: `${plantName || "Botanical"} Standardized Extract ${extractFractionId ? `(${extractFractionId})` : ""}`.trim(),
        componentType: "ACTIVE_EXTRACT",
        suggestedConcentration: 5.0,
        concentrationUnit: "% w/w",
        minConcentration: 2.0,
        maxConcentration: 10.0,
        roleOrFunction: "Active Botanical Marker Complex",
        notes: "Dispersed in anhydrous vehicle.",
      },
      {
        ingredientName: "Mineral Oil (Light Liquid Paraffin)",
        componentType: "EXCIPIENT",
        suggestedConcentration: 10.0,
        concentrationUnit: "% w/w",
        minConcentration: 5.0,
        maxConcentration: 20.0,
        roleOrFunction: "Levigating Agent & Viscosity Modifier",
        notes: "Enables homogeneous incorporation of dry botanical extracts.",
      },
      {
        ingredientName: "Cetyl Alcohol",
        componentType: "EXCIPIENT",
        suggestedConcentration: 3.0,
        concentrationUnit: "% w/w",
        minConcentration: 1.0,
        maxConcentration: 5.0,
        roleOrFunction: "Stiffening Agent",
        notes: "Elevates melting point for warm climate physical stability.",
      },
      {
        ingredientName: "White Petrolatum (USP)",
        componentType: "VEHICLE",
        suggestedConcentration: 82.0,
        concentrationUnit: "% w/w",
        minConcentration: 70.0,
        maxConcentration: 90.0,
        roleOrFunction: "Hydrocarbon Ointment Base (q.s. to 100%)",
        notes: "USP compendial anhydrous occlusive base.",
        isVehicle: true,
      },
    ],
  },
  {
    id: "topical_lotion",
    name: "Topical Lotion",
    route: "Topical",
    dosageFormat: "Topical Lotion",
    description: "Low-viscosity fluid emulsion suited for broad surface coverage and rapid dermal absorption.",
    typicalBatchSize: "500 g",
    components: (plantName: string, extractFractionId?: string) => [
      {
        ingredientName: `${plantName || "Botanical"} Standardized Extract ${extractFractionId ? `(${extractFractionId})` : ""}`.trim(),
        componentType: "ACTIVE_EXTRACT",
        suggestedConcentration: 4.0,
        concentrationUnit: "% w/w",
        minConcentration: 2.0,
        maxConcentration: 8.0,
        roleOrFunction: "Active Botanical Marker Complex",
        notes: "Bioactive marker fraction.",
      },
      {
        ingredientName: "Xanthan Gum",
        componentType: "EXCIPIENT",
        suggestedConcentration: 0.3,
        concentrationUnit: "% w/w",
        minConcentration: 0.1,
        maxConcentration: 0.6,
        roleOrFunction: "Fluid Rheology Modifier & Suspension Stabilizer",
        notes: "Prevents phase creaming in low-viscosity emulsion.",
      },
      {
        ingredientName: "Glycerin",
        componentType: "EXCIPIENT",
        suggestedConcentration: 5.0,
        concentrationUnit: "% w/w",
        minConcentration: 3.0,
        maxConcentration: 8.0,
        roleOrFunction: "Aqueous Humectant",
        notes: "Provides skin conditioning and spreadability.",
      },
      {
        ingredientName: "Polysorbate 80",
        componentType: "EXCIPIENT",
        suggestedConcentration: 2.0,
        concentrationUnit: "% w/w",
        minConcentration: 1.0,
        maxConcentration: 3.5,
        roleOrFunction: "Emulsifying Surfactant",
        notes: "Solubilizes lipid-soluble terpenes and phenolics.",
      },
      {
        ingredientName: "Phenoxyethanol",
        componentType: "PRESERVATIVE",
        suggestedConcentration: 0.8,
        concentrationUnit: "% w/w",
        minConcentration: 0.5,
        maxConcentration: 1.0,
        roleOrFunction: "Antimicrobial Preservative",
        notes: "Inhibits gram-negative bacteria and fungi.",
      },
      {
        ingredientName: "Purified Water (USP)",
        componentType: "VEHICLE",
        suggestedConcentration: 87.9,
        concentrationUnit: "% w/w",
        minConcentration: 75.0,
        maxConcentration: 92.0,
        roleOrFunction: "Continuous Aqueous Vehicle (q.s. to 100%)",
        notes: "Deionized purified water vehicle.",
        isVehicle: true,
      },
    ],
  },
  {
    id: "oral_syrup",
    name: "Oral Syrup",
    route: "Oral",
    dosageFormat: "Oral Syrup",
    description: "Viscous, sweetened oral liquid dosage form for pediatric or general adult administration.",
    typicalBatchSize: "500 mL",
    components: (plantName: string, extractFractionId?: string) => [
      {
        ingredientName: `${plantName || "Botanical"} Standardized Aqueous Extract`,
        componentType: "ACTIVE_EXTRACT",
        suggestedConcentration: 5.0,
        concentrationUnit: "% w/w",
        minConcentration: 2.0,
        maxConcentration: 10.0,
        roleOrFunction: "Active Botanical Phytocomplex",
        notes: "Aqueous or low-ethanol purified botanical extract.",
      },
      {
        ingredientName: "Sucrose (Syrup Base USP)",
        componentType: "EXCIPIENT",
        suggestedConcentration: 55.0,
        concentrationUnit: "% w/w",
        minConcentration: 45.0,
        maxConcentration: 65.0,
        roleOrFunction: "Sweetener, Osmotic Preservative & Bodying Agent",
        notes: "High osmotic pressure inhibits microbial proliferation.",
      },
      {
        ingredientName: "Glycerin",
        componentType: "EXCIPIENT",
        suggestedConcentration: 8.0,
        concentrationUnit: "% w/w",
        minConcentration: 4.0,
        maxConcentration: 12.0,
        roleOrFunction: "Cosolvent & Crystallization Inhibitor",
        notes: "Prevents sugar cap-locking on bottle threads.",
      },
      {
        ingredientName: "Sodium Benzoate",
        componentType: "PRESERVATIVE",
        suggestedConcentration: 0.15,
        concentrationUnit: "% w/w",
        minConcentration: 0.1,
        maxConcentration: 0.25,
        roleOrFunction: "Antimicrobial Preservative (USP <51>)",
        notes: "Compendial oral preservative effective at acidic pH.",
      },
      {
        ingredientName: "Citric Acid Monohydrate",
        componentType: "EXCIPIENT",
        suggestedConcentration: 0.2,
        concentrationUnit: "% w/w",
        minConcentration: 0.1,
        maxConcentration: 0.4,
        roleOrFunction: "Acidifier & Flavor Buffer (pH 4.0–4.5)",
        notes: "Optimizes sodium benzoate antimicrobial activity.",
      },
      {
        ingredientName: "Purified Water (USP)",
        componentType: "VEHICLE",
        suggestedConcentration: 31.65,
        concentrationUnit: "% w/w",
        minConcentration: 25.0,
        maxConcentration: 45.0,
        roleOrFunction: "Oral Aqueous Vehicle (q.s. to 100%)",
        notes: "USP compendial purified water.",
        isVehicle: true,
      },
    ],
  },
  {
    id: "oral_solution",
    name: "Oral Solution",
    route: "Oral",
    dosageFormat: "Oral Solution",
    description: "Clear, homogeneous liquid preparation containing dissolved botanical extracts.",
    typicalBatchSize: "500 mL",
    components: (plantName: string, extractFractionId?: string) => [
      {
        ingredientName: `${plantName || "Botanical"} Standardized Liquid Extract`,
        componentType: "ACTIVE_EXTRACT",
        suggestedConcentration: 5.0,
        concentrationUnit: "% w/w",
        minConcentration: 2.0,
        maxConcentration: 10.0,
        roleOrFunction: "Active Botanical Phytocomplex",
        notes: "Soluble botanical fraction.",
      },
      {
        ingredientName: "Propylene Glycol",
        componentType: "EXCIPIENT",
        suggestedConcentration: 6.0,
        concentrationUnit: "% w/w",
        minConcentration: 3.0,
        maxConcentration: 10.0,
        roleOrFunction: "Oral Solubilizing Cosolvent",
        notes: "Enhances active marker solubility in water.",
      },
      {
        ingredientName: "Glycerin",
        componentType: "EXCIPIENT",
        suggestedConcentration: 6.0,
        concentrationUnit: "% w/w",
        minConcentration: 3.0,
        maxConcentration: 10.0,
        roleOrFunction: "Sweetening Vehicle & Demulcent",
        notes: "Improves palatability.",
      },
      {
        ingredientName: "Potassium Sorbate",
        componentType: "PRESERVATIVE",
        suggestedConcentration: 0.15,
        concentrationUnit: "% w/w",
        minConcentration: 0.1,
        maxConcentration: 0.25,
        roleOrFunction: "Oral Antifungal Preservative",
        notes: "Effective food/pharma grade preservative.",
      },
      {
        ingredientName: "Purified Water (USP)",
        componentType: "VEHICLE",
        suggestedConcentration: 82.85,
        concentrationUnit: "% w/w",
        minConcentration: 70.0,
        maxConcentration: 90.0,
        roleOrFunction: "Oral Aqueous Vehicle (q.s. to 100%)",
        notes: "Aqueous vehicle qs to 100%.",
        isVehicle: true,
      },
    ],
  },
  {
    id: "capsule",
    name: "Capsule",
    route: "Oral",
    dosageFormat: "Hard Gelatin / HPMC Capsule",
    description: "Solid dosage unit encasing standardized dry powder extract with pharmaceutical excipients.",
    typicalBatchSize: "250 g",
    components: (plantName: string, extractFractionId?: string) => [
      {
        ingredientName: `${plantName || "Botanical"} Spray-Dried Powder Extract`,
        componentType: "ACTIVE_EXTRACT",
        suggestedConcentration: 40.0,
        concentrationUnit: "% w/w",
        minConcentration: 20.0,
        maxConcentration: 60.0,
        roleOrFunction: "Standardized Active Powder (Standardized Bioactives)",
        notes: "Quantified dry extract powder.",
      },
      {
        ingredientName: "Microcrystalline Cellulose (Avicel PH-102)",
        componentType: "EXCIPIENT",
        suggestedConcentration: 57.5,
        concentrationUnit: "% w/w",
        minConcentration: 35.0,
        maxConcentration: 75.0,
        roleOrFunction: "Direct Compression Diluent / Capsule Filler",
        notes: "Inert compendial capsule filler with excellent flow properties.",
      },
      {
        ingredientName: "Magnesium Stearate",
        componentType: "EXCIPIENT",
        suggestedConcentration: 1.5,
        concentrationUnit: "% w/w",
        minConcentration: 0.5,
        maxConcentration: 2.0,
        roleOrFunction: "Hydrophobic Lubricant (Encapsulation Machine)",
        notes: "Prevents powder adhesion to capsule filling tamping pins.",
      },
      {
        ingredientName: "Colloidal Silicon Dioxide (Aerosil 200)",
        componentType: "EXCIPIENT",
        suggestedConcentration: 1.0,
        concentrationUnit: "% w/w",
        minConcentration: 0.2,
        maxConcentration: 2.0,
        roleOrFunction: "Glidant & Moisture Scavenger",
        notes: "Enhances powder blend flowability and protects hygroscopic extract.",
      },
    ],
  },
  {
    id: "herbal_tea",
    name: "Herbal Tea",
    route: "Oral",
    dosageFormat: "Herbal Tea / Infusion Blend",
    description: "Loose dried botanical leaves or tea cut blend for traditional hot aqueous infusion.",
    typicalBatchSize: "200 g",
    components: (plantName: string) => [
      {
        ingredientName: `${plantName || "Botanical"} Dried Cut Leaves (Mesh 10–20)`,
        componentType: "ACTIVE_EXTRACT",
        suggestedConcentration: 85.0,
        concentrationUnit: "% w/w",
        minConcentration: 70.0,
        maxConcentration: 100.0,
        roleOrFunction: "Primary Botanical Active Leaf Tissue",
        notes: "Coarsely cut authenticated foliar specimen.",
      },
      {
        ingredientName: "Cymbopogon citratus (Lemongrass) Cut Herb",
        componentType: "EXCIPIENT",
        suggestedConcentration: 15.0,
        concentrationUnit: "% w/w",
        minConcentration: 5.0,
        maxConcentration: 25.0,
        roleOrFunction: "Aromatic Flavor Adjuvant & Essential Oil Synergist",
        notes: "Enhances organoleptic acceptance and provides complementary citral.",
      },
    ],
  },
  {
    id: "custom_formulation",
    name: "Custom Formulation",
    route: "Other",
    dosageFormat: "Custom Research Formulation",
    description: "Blank researcher-defined formulation composition matrix.",
    typicalBatchSize: "100 g",
    components: (plantName: string) => [
      {
        ingredientName: `${plantName || "Botanical"} Active Component`,
        componentType: "ACTIVE_EXTRACT",
        suggestedConcentration: 5.0,
        concentrationUnit: "% w/w",
        minConcentration: 1.0,
        maxConcentration: 20.0,
        roleOrFunction: "Active Botanical Agent",
        notes: "Researcher-specified active constituent.",
      },
      {
        ingredientName: "Compounding Vehicle Base",
        componentType: "VEHICLE",
        suggestedConcentration: 95.0,
        concentrationUnit: "% w/w",
        minConcentration: 50.0,
        maxConcentration: 99.0,
        roleOrFunction: "Continuous Vehicle (q.s. to 100%)",
        notes: "Continuous vehicle qs to 100%.",
        isVehicle: true,
      },
    ],
  },
];

/**
 * Find matching template based on dosage form name
 */
export function matchFormulationTemplate(dosageForm: string): FormulationTemplate {
  if (!dosageForm) return FORMULATION_TEMPLATES[0];
  const d = dosageForm.toLowerCase();

  if (d.includes("hydrogel") || (d.includes("gel") && !d.includes("capsule"))) {
    return FORMULATION_TEMPLATES.find((t) => t.id === "topical_hydrogel") || FORMULATION_TEMPLATES[0];
  }
  if (d.includes("cream")) {
    return FORMULATION_TEMPLATES.find((t) => t.id === "topical_cream") || FORMULATION_TEMPLATES[0];
  }
  if (d.includes("ointment")) {
    return FORMULATION_TEMPLATES.find((t) => t.id === "topical_ointment") || FORMULATION_TEMPLATES[0];
  }
  if (d.includes("lotion") || d.includes("spray")) {
    return FORMULATION_TEMPLATES.find((t) => t.id === "topical_lotion") || FORMULATION_TEMPLATES[0];
  }
  if (d.includes("syrup")) {
    return FORMULATION_TEMPLATES.find((t) => t.id === "oral_syrup") || FORMULATION_TEMPLATES[0];
  }
  if (d.includes("solution") || d.includes("suspension") || d.includes("oral")) {
    return FORMULATION_TEMPLATES.find((t) => t.id === "oral_solution") || FORMULATION_TEMPLATES[0];
  }
  if (d.includes("capsule") || d.includes("tablet")) {
    return FORMULATION_TEMPLATES.find((t) => t.id === "capsule") || FORMULATION_TEMPLATES[0];
  }
  if (d.includes("tea") || d.includes("infusion")) {
    return FORMULATION_TEMPLATES.find((t) => t.id === "herbal_tea") || FORMULATION_TEMPLATES[0];
  }

  return FORMULATION_TEMPLATES.find((t) => t.id === "custom_formulation") || FORMULATION_TEMPLATES[0];
}

/**
 * Generate a standardized formulation code based on dosage form (e.g. FRM-TOP-001)
 */
export function generateFormulationCode(dosageFormat: string, existingCode?: string): string {
  if (existingCode && existingCode.trim()) return existingCode.trim();

  const d = (dosageFormat || "").toLowerCase();
  let routeCode = "TOP";
  if (d.includes("oral") || d.includes("syrup") || d.includes("tea") || d.includes("capsule")) {
    routeCode = "ORL";
  } else if (d.includes("gel") || d.includes("cream") || d.includes("ointment") || d.includes("lotion")) {
    routeCode = "TOP";
  }

  return `FRM-${routeCode}-001`;
}

