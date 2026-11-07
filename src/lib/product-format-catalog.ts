/**
 * NatureAide V2 — Product Format Catalog & Recommendation Engine
 * Provides predefined product format presets, category filters, target application tags,
 * packaging options, population cohorts, and evidence-aware scientific rationale templates.
 */

export type ProductRoute = "Topical" | "Oral" | "Other";

export interface ProductFormatPreset {
  id: string;
  name: string;
  route: ProductRoute;
  category: string;
  dosageForm: string;
  defaultIndications: string[];
  indicationSummary: string;
  defaultPopulation: string;
  defaultPackaging: string;
  containerVolume: string;
  packagingMaterial: string;
  scientificRationale: string;
  keyExcipients: string[];
  stabilityConsiderations: string;
  requiresSpecialSafetyNotice?: boolean;
}

export const PRODUCT_CATEGORIES = [
  "Topical Research Formulation",
  "Oral Research Formulation",
  "Herbal Formulation",
  "Phytopharmaceutical Research Product",
  "Cosmetic Research Formulation",
  "Laboratory Research Prototype",
  "Other / Custom",
] as const;

export const TARGET_APPLICATIONS = [
  { id: "antifungal", label: "Topical antifungal research", category: "Topical" },
  { id: "antimicrobial", label: "Topical antimicrobial research", category: "Topical" },
  { id: "anti_inflammatory", label: "Anti-inflammatory research", category: "General" },
  { id: "skin_barrier", label: "Skin-barrier formulation research", category: "Topical" },
  { id: "wound_care", label: "Wound-care formulation research", category: "Topical" },
  { id: "respiratory", label: "Respiratory symptom-related research", category: "Oral" },
  { id: "gastrointestinal", label: "Gastrointestinal formulation research", category: "Oral" },
  { id: "oral_hygiene", label: "Oral hygiene research", category: "Other" },
  { id: "antioxidant", label: "Antioxidant formulation research", category: "General" },
  { id: "joint_muscular", label: "Localized muscular/joint discomfort", category: "Topical" },
] as const;

export const TARGET_POPULATIONS = [
  { id: "adults", label: "Adults (18–65 years)", isVulnerable: false, requiresNotice: false },
  { id: "older_adults", label: "Older Adults (65+ years)", isVulnerable: false, requiresNotice: false },
  { id: "adolescents", label: "Adolescents (12–17 years)", isVulnerable: false, requiresNotice: true },
  { id: "pediatric", label: "Pediatric Population (2–11 years)", isVulnerable: true, requiresNotice: true },
  { id: "general", label: "General Population (Excluding Infants)", isVulnerable: false, requiresNotice: false },
  { id: "laboratory_only", label: "Research / Laboratory Use Only (Pre-clinical)", isVulnerable: false, requiresNotice: false },
  { id: "custom", label: "Other / Custom Population Specification", isVulnerable: false, requiresNotice: false },
] as const;

export const PACKAGING_OPTIONS: Record<ProductRoute, string[]> = {
  Topical: [
    "Airless Pump Bottle (50 mL)",
    "Laminated Aluminum-Plastic Tube (30 g)",
    "Pure Aluminum Collapsible Tube (50 g)",
    "Wide-Mouth Amber Glass Jar (60 g)",
    "Fine-Mist Spray Dispenser Bottle (100 mL)",
    "HDPE Pump Dispenser Bottle (150 mL)",
    "Topical Roll-On Applicator (15 mL)",
    "Laboratory Sample Amber Vial (20 mL)",
    "Custom Topical Packaging",
  ],
  Oral: [
    "Type III Amber Glass Bottle (120 mL) with Calibrated Cup",
    "Pharmaceutical Amber PET Bottle (60 mL)",
    "Alu-Alu Moisture Barrier Blister Pack (10x10 units)",
    "High-Density Polyethylene (HDPE) Capsule Bottle (60 count)",
    "Multi-Layer Foil Sachet (5 g single dose)",
    "Sealed Amber Dropper Bottle (30 mL)",
    "Laboratory Screw-Cap Glass Vial (15 mL)",
    "Custom Oral Packaging",
  ],
  Other: [
    "Sealed Laboratory Sample Vial with PTFE Septum (20 mL)",
    "Opaque Amber PET Gargle Bottle (250 mL) with Dose Cap",
    "Airtight Foil-Lined Pouch for Powder (100 g)",
    "Sealed Sterile Research Container (50 mL)",
    "Custom Laboratory Research Packaging",
  ],
};

export const PRODUCT_FORMAT_PRESETS: ProductFormatPreset[] = [
  // ---------------------------------------------------------------------------
  // 1. TOPICAL FORMULATIONS
  // ---------------------------------------------------------------------------
  {
    id: "topical-hydrogel",
    name: "Topical Hydrogel",
    route: "Topical",
    category: "Topical Research Formulation",
    dosageForm: "Topical Hydrogel",
    defaultIndications: ["Anti-inflammatory research", "Topical antimicrobial research", "Skin-barrier formulation research"],
    indicationSummary: "Localized inflammatory soothing, epidermal barrier hydration, and controlled cutaneous phytochemical release.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Airless Pump Bottle (50 mL)",
    containerVolume: "50 mL",
    packagingMaterial: "Opaque UV-shielded polypropylene airless pump",
    scientificRationale:
      "A cross-linked aqueous polymeric hydrogel vehicle (e.g. Carbomer 940) provides high thermodynamic activity for hydrophilic botanical metabolites and uniform dispersion of hydroethanolic extracts. The non-occlusive, non-greasy matrix promotes physiological hydration and transdermal permeation across the stratum corneum without disrupting cutaneous lipid bilayers.",
    keyExcipients: ["Carbomer 940 / Carbopol", "Triethanolamine (TEA)", "Propylene Glycol", "Purified Deionized Water", "Methylparaben / Phenoxyethanol"],
    stabilityConsiderations: "Monitor pH drift (target 5.2–6.5), gel viscosity degradation over 90 days, and microbial contamination.",
  },
  {
    id: "topical-cream-ow",
    name: "Topical Cream (O/W)",
    route: "Topical",
    category: "Topical Research Formulation",
    dosageForm: "Topical Cream (O/W)",
    defaultIndications: ["Skin-barrier formulation research", "Anti-inflammatory research", "Wound-care formulation research"],
    indicationSummary: "Biphasic delivery for co-incorporation of lipophilic phytosterols/terpenes and hydrophilic polyphenols.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Laminated Aluminum-Plastic Tube (30 g)",
    containerVolume: "30 g",
    packagingMaterial: "Triple-layer barrier laminate tube with tamper-evident seal",
    scientificRationale:
      "An oil-in-water (O/W) emulsion system accommodates both non-polar volatile terpenes and water-soluble flavonoids. Emulsifying waxes stabilize droplet size distribution, delivering emollient epidermal conditioning while partitioning active phytochemicals smoothly into the dermis.",
    keyExcipients: ["Cetearyl Alcohol & Ceteareth-20", "Mineral Oil / Caprylic Triglycerides", "Glycerin", "Purified Water", "Tocopheryl Acetate"],
    stabilityConsiderations: "Verify emulsion droplet coalescence, centrifugation phase separation (3000 rpm x 30 min), and rancidity.",
  },
  {
    id: "topical-ointment",
    name: "Topical Ointment",
    route: "Topical",
    category: "Topical Research Formulation",
    dosageForm: "Topical Ointment",
    defaultIndications: ["Wound-care formulation research", "Topical antifungal research", "Localized muscular/joint discomfort"],
    indicationSummary: "Hydrophobic occlusive vehicle designed for prolonged active contact and slow sustained diffusion.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Pure Aluminum Collapsible Tube (50 g)",
    containerVolume: "50 g",
    packagingMaterial: "Epoxy-phenolic internal lined collapsible aluminum tube",
    scientificRationale:
      "Hydrocarbon- or oleaginous-based ointment bases form a protective occlusive moisture barrier on the skin, enhancing hydration of the stratum corneum and drastically prolonging residence time of active lipophilic phytochemicals on targeted lesions or joint sites.",
    keyExcipients: ["White Petrolatum", "Microcrystalline Wax", "Liquid Paraffin", "Beeswax", "BHT (Antioxidant)"],
    stabilityConsiderations: "Thermal syneresis, consistency penetrometry at elevated temperatures (40°C), and chemical oxidation.",
  },
  {
    id: "topical-lotion",
    name: "Topical Lotion",
    route: "Topical",
    category: "Topical Research Formulation",
    dosageForm: "Topical Lotion",
    defaultIndications: ["Skin-barrier formulation research", "Anti-inflammatory research", "Antioxidant formulation research"],
    indicationSummary: "Low-viscosity fluid emulsion for extensive anatomical body surface coverage and quick absorption.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "HDPE Pump Dispenser Bottle (150 mL)",
    containerVolume: "150 mL",
    packagingMaterial: "High-density polyethylene (HDPE) with mechanical lotion pump",
    scientificRationale:
      "A fluid, shear-thinning lotion facilitates uniform spreading over larger surface areas without mechanical skin friction. Its balanced aqueous-lipid phase supports fast absorption and barrier replenishment with minimal residue.",
    keyExcipients: ["Glyceryl Stearate", "Stearic Acid", "Glycerin", "Purified Water", "Dimethicone"],
    stabilityConsiderations: "Creaming velocity, rheological rheopexy/thixotropy, and preservative efficacy testing.",
  },
  {
    id: "topical-gel",
    name: "Topical Gel",
    route: "Topical",
    category: "Topical Research Formulation",
    dosageForm: "Topical Gel",
    defaultIndications: ["Localized muscular/joint discomfort", "Anti-inflammatory research", "Topical antimicrobial research"],
    indicationSummary: "Fast-absorbing, cooling hydro-alcoholic vehicle suitable for localized pain relief and rapid active release.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Pure Aluminum Collapsible Tube (50 g)",
    containerVolume: "50 g",
    packagingMaterial: "Hermetically sealed aluminum tube with puncturable diaphragm",
    scientificRationale:
      "Hydro-alcoholic gel formulations provide a cooling sensation upon evaporation while alcohol co-solvents enhance cutaneous flux and lipid fluidization for rapid bioactive penetration into muscular tissues.",
    keyExcipients: ["Hydroxypropyl Methylcellulose (HPMC)", "Ethanol 96%", "Propylene Glycol", "Menthol / Camphor", "Purified Water"],
    stabilityConsiderations: "Alcohol evaporation rate, polymer syneresis, and container closure integrity.",
  },
  {
    id: "topical-spray",
    name: "Topical Spray",
    route: "Topical",
    category: "Topical Research Formulation",
    dosageForm: "Topical Spray",
    defaultIndications: ["Wound-care formulation research", "Topical antimicrobial research", "Skin-barrier formulation research"],
    indicationSummary: "Touchless application format ideal for painful, fragile, or irritated skin lesions.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Fine-Mist Spray Dispenser Bottle (100 mL)",
    containerVolume: "100 mL",
    packagingMaterial: "Amber PET container with non-aerosol metered fine-mist pump",
    scientificRationale:
      "Touch-free spray atomization prevents mechanical irritation and secondary cross-contamination of fragile or broken skin. Uniform spray droplet deposition ensures even coverage of standardized botanical actives.",
    keyExcipients: ["Polysorbate 20", "Ethanol / Water Cosolvent", "Glycerin", "Sodium Benzoate", "Citric Acid Buffer"],
    stabilityConsiderations: "Actuator nozzle clogging, spray pattern uniformity, and microbial bioburden.",
  },
  {
    id: "herbal-soap",
    name: "Herbal Soap",
    route: "Topical",
    category: "Cosmetic Research Formulation",
    dosageForm: "Herbal Soap",
    defaultIndications: ["Topical antimicrobial research", "Topical antifungal research", "Skin-barrier formulation research"],
    indicationSummary: "Solid saponified botanical wash for cutaneous surface cleansing and microbial reduction.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Custom Topical Packaging",
    containerVolume: "100 g bar",
    packagingMaterial: "Biodegradable moisture-resistant greaseproof paper wrap",
    scientificRationale:
      "A saponified lipid bar incorporates botanical powders or standardized extracts into a gentle surfactant matrix to deliver localized antimicrobial and antioxidant compounds during dermal cleansing.",
    keyExcipients: ["Saponified Cocos Nucifera (Coconut) Oil", "Sodium Hydroxide", "Glycerin", "Purified Water", "Botanical Extract"],
    stabilityConsiderations: "Alkaline saponification impact on polyphenol integrity, moisture loss, and bar hardening.",
  },

  // ---------------------------------------------------------------------------
  // 2. ORAL FORMULATIONS
  // ---------------------------------------------------------------------------
  {
    id: "oral-syrup",
    name: "Oral Syrup",
    route: "Oral",
    category: "Phytopharmaceutical Research Product",
    dosageForm: "Oral Syrup",
    defaultIndications: ["Respiratory symptom-related research", "Anti-inflammatory research"],
    indicationSummary: "Demulcent viscous oral solution for pharyngeal soothing and palatability optimization.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Type III Amber Glass Bottle (120 mL) with Calibrated Cup",
    containerVolume: "120 mL",
    packagingMaterial: "Amber USP Type III soda-lime glass with child-resistant HDPE closure",
    scientificRationale:
      "A high-viscosity sucrose or sorbitol vehicle provides an osmotic demulcent coating along inflamed pharyngeal mucosa, reducing cough reflex excitability while masking bitter botanical extracts with pharmaceutical-grade flavoring.",
    keyExcipients: ["Sucrose / Sorbitol 70%", "Sodium Benzoate", "Citric Acid Monohydrate", "Propylene Glycol", "Natural Flavoring"],
    stabilityConsiderations: "Sugar crystallization (cap-locking), microbial proliferation, and pH-dependent polyphenol hydrolysis.",
  },
  {
    id: "oral-solution",
    name: "Oral Solution",
    route: "Oral",
    category: "Oral Research Formulation",
    dosageForm: "Oral Solution",
    defaultIndications: ["Gastrointestinal formulation research", "Antioxidant formulation research", "Respiratory symptom-related research"],
    indicationSummary: "Homogeneous single-phase liquid for prompt gastrointestinal absorption and flexible dosing.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Pharmaceutical Amber PET Bottle (60 mL)",
    containerVolume: "60 mL",
    packagingMaterial: "Amber PET with tamper-evident seal and graduated dropper",
    scientificRationale:
      "Single-phase aqueous solutions bypass gastric dissolution steps, enabling fast and predictable enteric absorption. Co-solvents stabilize polar and moderately non-polar secondary metabolites in solution.",
    keyExcipients: ["Glycerin", "Propylene Glycol", "Sodium Citrate Buffer", "Potassium Sorbate", "Purified Water"],
    stabilityConsiderations: "Oxidative discoloration, precipitation upon standing, and microbial limit testing.",
  },
  {
    id: "herbal-tea-infusion",
    name: "Herbal Tea / Infusion",
    route: "Oral",
    category: "Herbal Formulation",
    dosageForm: "Herbal Tea / Infusion",
    defaultIndications: ["Respiratory symptom-related research", "Antioxidant formulation research", "Gastrointestinal formulation research"],
    indicationSummary: "Standardized cut dried botanical material for extemporaneous aqueous hot infusion / decoction.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Multi-Layer Foil Sachet (5 g single dose)",
    containerVolume: "5 g per sachet",
    packagingMaterial: "Heat-sealed unbleached filter paper in moisture-barrier aluminum foil overwrap",
    scientificRationale:
      "Infusion formulations reflect traditional ethnopharmacological preparations. Standardizing particle size (cut leaves) ensures consistent aqueous extraction kinetics of polar glycosides and flavonoids at domestic preparation temperatures (90–100°C).",
    keyExcipients: ["Standardized Dried Botanical Cut Foliage", "Desiccant Pouch (External Packaging)"],
    stabilityConsiderations: "Residual water activity (< 10%), fungal spore contamination, and loss of volatile aroma compounds.",
  },
  {
    id: "capsule",
    name: "Capsule",
    route: "Oral",
    category: "Phytopharmaceutical Research Product",
    dosageForm: "Capsule",
    defaultIndications: ["Anti-inflammatory research", "Antioxidant formulation research", "Gastrointestinal formulation research"],
    indicationSummary: "Solid unit-dose encapsulation of spray-dried or lyophilized standardized extract.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "High-Density Polyethylene (HDPE) Capsule Bottle (60 count)",
    containerVolume: "60 capsules",
    packagingMaterial: "White opaque HDPE bottle with induction-sealed liner and silica gel desiccant",
    scientificRationale:
      "Hard gelatin or vegetarian (HPMC) capsules protect hygroscopic botanical dry extracts from ambient moisture and oxygen, masking bitter taste and providing precise, uniform unit-dose administration with predictable gastric disintegration.",
    keyExcipients: ["Microcrystalline Cellulose (Avicel PH-102)", "Colloidal Silicon Dioxide (Aerosil 200)", "Magnesium Stearate", "HPMC / Gelatin Shell #0"],
    stabilityConsiderations: "In-vitro dissolution rate, capsule shell embrittlement, and moisture sorption isotherms.",
  },
  {
    id: "tablet",
    name: "Tablet",
    route: "Oral",
    category: "Phytopharmaceutical Research Product",
    dosageForm: "Tablet",
    defaultIndications: ["Anti-inflammatory research", "Antioxidant formulation research"],
    indicationSummary: "Directly compressed or wet-granulated solid dosage form offering high stability and dose precision.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Alu-Alu Moisture Barrier Blister Pack (10x10 units)",
    containerVolume: "100 tablets (10 strips of 10)",
    packagingMaterial: "Cold-formable aluminum-aluminum blister foil",
    scientificRationale:
      "Compressed tablets offer superior physical stability and dose uniformity. Polymeric film coating seals bitter extract odors and prevents environmental hygroscopic degradation during storage.",
    keyExcipients: ["Lactose Monohydrate / MCC", "Povidone (PVP K-30)", "Croscarmellose Sodium", "Magnesium Stearate", "Opadry Film Coating"],
    stabilityConsiderations: "Tablet hardness (> 60 N), friability (< 1.0%), and disintegration time (< 15 min in 0.1N HCl).",
  },
  {
    id: "oral-suspension",
    name: "Oral Suspension",
    route: "Oral",
    category: "Oral Research Formulation",
    dosageForm: "Oral Suspension",
    defaultIndications: ["Gastrointestinal formulation research", "Respiratory symptom-related research"],
    indicationSummary: "Heterogeneous liquid system with insoluble extract microparticles uniformly suspended via hydrocolloids.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Type III Amber Glass Bottle (120 mL) with Calibrated Cup",
    containerVolume: "120 mL",
    packagingMaterial: "Amber USP Type III soda-lime glass with shake-well warning label",
    scientificRationale:
      "A thixotropic polymeric suspension base maintains insoluble phytocomplexes in homogenous dispersion upon gentle agitation, providing liquid dosage flexibility when chemical solubilization is unfeasible.",
    keyExcipients: ["Xanthan Gum", "Microcrystalline Cellulose / Carboxymethylcellulose Sodium", "Glycerin", "Polysorbate 80", "Sodium Benzoate"],
    stabilityConsiderations: "Sedimentation volume ratio (F), ease of redispersion upon shaking, and particle agglomeration/caking.",
  },

  // ---------------------------------------------------------------------------
  // 3. OTHER RESEARCH FORMATS
  // ---------------------------------------------------------------------------
  {
    id: "mouthwash-gargle",
    name: "Mouthwash / Gargle",
    route: "Other",
    category: "Topical Research Formulation",
    dosageForm: "Mouthwash / Gargle",
    defaultIndications: ["Oral hygiene research", "Topical antimicrobial research", "Anti-inflammatory research"],
    indicationSummary: "Aqueous hydro-alcoholic rinse for oral cavity microbial reduction and mucosal soothing.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Opaque Amber PET Gargle Bottle (250 mL) with Dose Cap",
    containerVolume: "250 mL",
    packagingMaterial: "Food-grade amber PET with calibrated 15 mL measuring dose cup",
    scientificRationale:
      "Formulated to rinse the oral mucosa and gingiva, utilizing botanical antimicrobial tannins and essential oils without mucosal stinging or cellular irritation.",
    keyExcipients: ["Purified Water", "Glycerin", "Ethanol 5-10% (Optional/Alcohol-Free alternative)", "Xylitol", "Menthol", "Polysorbate 20"],
    stabilityConsiderations: "Taste stability, clarity/turbidity over time, and antimicrobial preservative effectiveness.",
  },
  {
    id: "herbal-extract",
    name: "Herbal Extract",
    route: "Other",
    category: "Laboratory Research Prototype",
    dosageForm: "Herbal Extract",
    defaultIndications: ["Anti-inflammatory research", "Antioxidant formulation research", "Topical antimicrobial research"],
    indicationSummary: "Concentrated standardized liquid or dry extract intermediate for compounding and bioassays.",
    defaultPopulation: "Research / Laboratory Use Only (Pre-clinical)",
    defaultPackaging: "Sealed Laboratory Sample Vial with PTFE Septum (20 mL)",
    containerVolume: "20 mL",
    packagingMaterial: "Type I borosilicate amber glass vial with PTFE-lined silicone septum crimp seal",
    scientificRationale:
      "Standardized extract fractions serve as the characterized starting material for downstream formulations. Storage in inert, airtight amber vials prevents photo-oxidation and volatile loss prior to formulation compounding.",
    keyExcipients: ["Ethanol-Water Solvent Residue (if liquid)", "Maltodextrin Carrier (if spray dried)", "Nitrogen Purge Overlay"],
    stabilityConsiderations: "Residual solvent quantification (GC-MS), marker compound titer degradation (HPLC), and moisture pickup.",
  },
  {
    id: "powder",
    name: "Powder",
    route: "Other",
    category: "Herbal Formulation",
    dosageForm: "Powder",
    defaultIndications: ["Antioxidant formulation research", "Topical antimicrobial research"],
    indicationSummary: "Micronized dried botanical material for reconstitution or topical dusting.",
    defaultPopulation: "Research / Laboratory Use Only (Pre-clinical)",
    defaultPackaging: "Airtight Foil-Lined Pouch for Powder (100 g)",
    containerVolume: "100 g",
    packagingMaterial: "Multi-ply metallized barrier pouch with zip-lock reseal and desiccant strip",
    scientificRationale:
      "Micronized botanical powder provides uniform particle size distribution for standardized solubility, dissolution kinetics, and analytical reproducibility in laboratory assays.",
    keyExcipients: ["Micronized Botanical Powder", "Colloidal Silica (Anti-caking 0.5%)"],
    stabilityConsiderations: "Hygroscopic moisture uptake, powder flowability (Carr's Index), and microbial bioburden.",
  },
  {
    id: "research-prototype",
    name: "Research Prototype",
    route: "Other",
    category: "Laboratory Research Prototype",
    dosageForm: "Research Prototype",
    defaultIndications: ["Anti-inflammatory research", "Skin-barrier formulation research"],
    indicationSummary: "Investigational delivery matrix for proof-of-concept testing and formulation screening.",
    defaultPopulation: "Research / Laboratory Use Only (Pre-clinical)",
    defaultPackaging: "Sealed Sterile Research Container (50 mL)",
    containerVolume: "50 mL",
    packagingMaterial: "Gamma-sterilized polypropylene laboratory screw-top specimen jar",
    scientificRationale:
      "An investigational formulation matrix configured to evaluate preliminary phytochemical solubility, excipient compatibility, and basic organoleptic and rheological characteristics before formal scale-up.",
    keyExcipients: ["Investigational Polymer Vehicle", "Buffering Salts", "Purified Water"],
    stabilityConsiderations: "Short-term accelerated stress stability testing (40°C/75% RH for 4 weeks).",
  },
  {
    id: "custom-formulation",
    name: "Custom Formulation",
    route: "Other",
    category: "Other / Custom",
    dosageForm: "Custom Formulation",
    defaultIndications: ["Anti-inflammatory research"],
    indicationSummary: "User-defined novel pharmaceutical or botanical delivery format.",
    defaultPopulation: "Adults (18–65 years)",
    defaultPackaging: "Custom Laboratory Research Packaging",
    containerVolume: "Custom",
    packagingMaterial: "Researcher-specified container",
    scientificRationale:
      "Custom formulation delivery system specified according to specialized research protocols and investigational requirements.",
    keyExcipients: ["Custom Excipient Matrix"],
    stabilityConsiderations: "Establish customized protocol-specific stability indicators.",
  },
];

/**
 * Intelligent Focus-Aware Recommendation Engine
 * Scores presets based on plant identity, traditional uses, plant parts, and project objectives.
 */
export interface ScoredPreset {
  preset: ProductFormatPreset;
  score: number;
  matchReason: string;
  matchBadge: "High Botanical Fit" | "Traditional Form Fit" | "Topical Phytochemical Vehicle" | "General Research Fit";
}

export function recommendProductFormats(context: {
  plantName?: string;
  plantScientificName?: string;
  plantParts?: string[];
  traditionalUses?: string;
  traditionalPreparations?: string;
  researchTitle?: string;
  researchObjective?: string;
}): ScoredPreset[] {
  const title = (context.researchTitle || "").toLowerCase();
  const obj = (context.researchObjective || "").toLowerCase();
  const uses = (context.traditionalUses || "").toLowerCase();
  const prep = (context.traditionalPreparations || "").toLowerCase();
  const plant = (context.plantName || "").toLowerCase();
  const parts = (context.plantParts || []).map((p) => p.toLowerCase());

  return PRODUCT_FORMAT_PRESETS.map((preset) => {
    let score = 50; // base score
    let matchReason = "Standardized pharmaceutical delivery format suitable for phytochemical research.";
    let matchBadge: ScoredPreset["matchBadge"] = "General Research Fit";

    const isTopicalRequested =
      title.includes("topical") ||
      title.includes("gel") ||
      title.includes("cream") ||
      title.includes("wound") ||
      title.includes("skin") ||
      title.includes("dermat") ||
      obj.includes("topical") ||
      obj.includes("skin") ||
      obj.includes("barrier");

    const isOralRequested =
      title.includes("oral") ||
      title.includes("syrup") ||
      title.includes("cough") ||
      title.includes("respiratory") ||
      title.includes("tea") ||
      title.includes("capsule") ||
      obj.includes("oral") ||
      obj.includes("cough") ||
      obj.includes("respiratory");

    // 1. Direct title or objective match
    if (isTopicalRequested && preset.route === "Topical") {
      score += 35;
      matchReason = "Directly aligns with your project's topical research focus and cutaneous application objective.";
      matchBadge = "High Botanical Fit";
    } else if (isOralRequested && preset.route === "Oral") {
      score += 35;
      matchReason = "Directly aligns with your project's oral or respiratory research focus.";
      matchBadge = "High Botanical Fit";
    }

    // 2. Specific Plant Knowledge (e.g. Lagundi, Akapulko, Sambong, Ampalaya, Guava)
    if (plant.includes("lagundi") || plant.includes("vitex")) {
      if (preset.id === "oral-syrup" || preset.id === "capsule") {
        score += 30;
        matchReason = "Lagundi has validated pharmacopeial clinical monographs for oral syrup and capsule formats in respiratory indications.";
        matchBadge = "High Botanical Fit";
      } else if (preset.id === "topical-hydrogel" || preset.id === "topical-ointment") {
        score += 20;
        matchReason = "Topical formulations utilize Lagundi's chrysosplenol D and flavonoid anti-inflammatory properties for localized musculoskeletal relief.";
        matchBadge = "Topical Phytochemical Vehicle";
      }
    } else if (plant.includes("akapulko") || plant.includes("senna") || plant.includes("cassia")) {
      if (preset.id === "topical-cream-ow" || preset.id === "topical-ointment" || preset.id === "herbal-soap" || preset.id === "topical-hydrogel") {
        score += 40;
        matchReason = "Akapulko's chrysophanic acid anthraquinones are primarily indicated for topical antifungal and dermatological research.";
        matchBadge = "High Botanical Fit";
      }
    } else if (plant.includes("guava") || plant.includes("bayabas") || plant.includes("psidium")) {
      if (preset.id === "mouthwash-gargle" || preset.id === "topical-hydrogel" || preset.id === "topical-spray") {
        score += 35;
        matchReason = "Guava leaf tannins and astringent polyphenols are strongly suited for wound-care sprays, hydrogels, and oral mucosal gargles.";
        matchBadge = "High Botanical Fit";
      }
    } else if (plant.includes("sambong") || plant.includes("blumea")) {
      if (preset.id === "tablet" || preset.id === "capsule" || preset.id === "herbal-tea-infusion") {
        score += 35;
        matchReason = "Sambong has established clinical guidelines for oral solid dosage forms (diuretic and anti-urolithiasis).";
        matchBadge = "High Botanical Fit";
      }
    }

    // 3. Plant Part matching
    if (parts.includes("leaves") || parts.includes("aerial parts")) {
      if (preset.id === "topical-hydrogel" || preset.id === "oral-syrup" || preset.id === "herbal-tea-infusion") {
        score += 10;
      }
    }
    if (parts.includes("bark") || parts.includes("roots")) {
      if (preset.id === "herbal-extract" || preset.id === "capsule" || preset.id === "topical-ointment") {
        score += 10;
      }
    }

    // 4. Traditional preparations analog
    if (prep.includes("decoction") || prep.includes("tea") || prep.includes("boiled")) {
      if (preset.id === "herbal-tea-infusion" || preset.id === "oral-solution" || preset.id === "oral-syrup") {
        score += 15;
        if (matchBadge === "General Research Fit") matchBadge = "Traditional Form Fit";
      }
    }
    if (prep.includes("poultice") || prep.includes("crushed") || prep.includes("plaster") || uses.includes("skin") || uses.includes("wound")) {
      if (preset.route === "Topical") {
        score += 15;
        if (matchBadge === "General Research Fit") matchBadge = "Topical Phytochemical Vehicle";
      }
    }

    // Default hydrogel boost if no specific format matched yet
    if (preset.id === "topical-hydrogel" && score === 50) {
      score += 15;
      matchBadge = "Topical Phytochemical Vehicle";
    }

    return { preset, score, matchReason, matchBadge };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Generates an evidence-aware, structured scientific rationale template.
 * Highlights route, vehicle characteristics, packaging requirements, and verification protocols.
 * Never makes unsupported claims of proven safety or clinical efficacy.
 */
export function generateScientificRationale(params: {
  plantName: string;
  plantScientificName?: string;
  deliveryFormat: string;
  productType: string;
  targetIndications: string;
  intendedPopulation: string;
  packagingType: string;
  plantParts?: string[];
}): string {
  const {
    plantName,
    plantScientificName,
    deliveryFormat,
    productType,
    targetIndications,
    intendedPopulation,
    packagingType,
    plantParts = ["Leaves"],
  } = params;

  const botanicalRef = plantScientificName && plantScientificName !== "Not documented"
    ? `${plantName} (${plantScientificName})`
    : plantName;

  const partsText = plantParts.length > 0 ? plantParts.join(", ") : "botanical plant parts";

  const preset = PRODUCT_FORMAT_PRESETS.find(
    (p) => p.name.toLowerCase() === deliveryFormat.toLowerCase() || p.dosageForm.toLowerCase() === deliveryFormat.toLowerCase()
  );

  const route = preset?.route || (deliveryFormat.toLowerCase().includes("oral") ? "Oral" : "Topical");

  let vehicleClause = "";
  if (route === "Topical") {
    vehicleClause = `The selected ${deliveryFormat} vehicle provides controlled interfacial contact with the stratum corneum, optimizing thermodynamic partitioning of secondary metabolites from ${partsText} while preserving cutaneous physiological barrier hydration.`;
  } else if (route === "Oral") {
    vehicleClause = `The ${deliveryFormat} delivery matrix facilitates standardized dispersion and enteric transit of active phytochemical complexes from ${partsText}, protecting labile components from premature gastric degradation.`;
  } else {
    vehicleClause = `The ${deliveryFormat} investigational matrix enables reproducible laboratory dosing, bioassay evaluation, and baseline physicochemical characterization of active phytochemical fractions from ${partsText}.`;
  }

  const packagingClause = `Packaging in ${packagingType} provides essential barrier protection against photolytic oxidation, ambient moisture sorption, and volatile terpene evaporation throughout experimental storage.`;

  const safetyClause = `Targeted for ${intendedPopulation}. This investigational formulation is hypothesized for ${targetIndications || "pre-clinical screening"} and requires empirical batch quality verification, including physiological pH conformance, centrifugation stability testing, accelerated thermal stress challenge, and USP/EP microbiological purity assays prior to any clinical extrapolation.`;

  return `${vehicleClause} ${packagingClause} ${safetyClause}`;
}

