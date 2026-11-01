export interface ExpertReviewArea {
  key: "pharmacognosy" | "bioinformatics" | "pharmacology" | "formulation" | "clinical_safety";
  order: number;
  label: string;
  shortLabel: string;
  professionTitle: string;
  checkingTitle: string;
  detail: string;
  aliases: string[];
  criteria: string[];
  checkingItems: string[];
  stageLinks: Array<{ label: string; sectionId: string }>;
}

export const EXPERT_REVIEW_AREAS: readonly ExpertReviewArea[] = [
  {
    key: "pharmacognosy",
    order: 1,
    label: "Pharmacognosy",
    shortLabel: "Pharmacognosy",
    professionTitle: "Pharmacist / Pharmacognosist",
    checkingTitle: "Pharmacognosy Checking",
    detail: "Plant identity, plant material, phytochemicals, extraction and botanical literature",
    aliases: ["pharmacognosy", "botany", "phytochemistry"],
    criteria: [
      "Plant taxonomic identity and authentication",
      "Plant material and studied plant parts",
      "Phytochemical characterization",
      "Extraction method and solvent selection",
      "Botanical and ethnomedicinal literature rigor",
      "Botanical interpretation alignment",
    ],
    checkingItems: [
      "Botanical identity",
      "Scientific & common name",
      "Plant material",
      "Plant part",
      "Phytochemical information",
      "Extraction information",
      "Botanical literature",
      "Supporting references",
      "Scientific interpretation",
    ],
    stageLinks: [
      { label: "Plant & Literature", sectionId: "plant-literature" },
      { label: "Research Integration", sectionId: "research-integration" },
    ],
  },
  {
    key: "bioinformatics",
    order: 2,
    label: "Bioinformatics",
    shortLabel: "Bioinformatics",
    professionTitle: "Bioinformatician / Computational Biologist",
    checkingTitle: "Bioinformatics Checking",
    detail: "Compound screening, computational methodology, target/PDB selection and docking results",
    aliases: ["bioinformatics", "in-silico", "computational"],
    criteria: [
      "Compound screening and physicochemical properties",
      "Computational screening methodology (Lipinski, ADMET)",
      "Target protein selection and justification",
      "PDB crystal structure selection and quality",
      "AutoDock Vina configuration (grid box, exhaustiveness)",
      "Docking predicted affinity and pose plausibility",
      "Computational interpretation and scientific limitations",
    ],
    checkingItems: [
      "Selected compounds",
      "Molecular information",
      "Screening results",
      "ADMET predictions",
      "Target selection",
      "PDB structure",
      "AutoDock Vina setup",
      "Docking affinity (PREDICTED)",
      "Docking interpretation",
      "Computational limitations",
    ],
    stageLinks: [
      { label: "In-Silico Screening", sectionId: "in-silico" },
      { label: "Molecular Docking", sectionId: "molecular-docking" },
      { label: "Research Integration", sectionId: "research-integration" },
    ],
  },
  {
    key: "pharmacology",
    order: 3,
    label: "Pharmacology",
    shortLabel: "Pharmacology",
    professionTitle: "Pharmacologist",
    checkingTitle: "Pharmacology Checking",
    detail: "Predicted mechanisms, biological relevance, pharmacological literature and toxicity interpretation",
    aliases: ["pharmacology", "pharmacological", "mechanisms"],
    criteria: [
      "Predicted molecular mechanisms and pathways",
      "Biological relevance of targeted receptors/enzymes",
      "Pharmacological literature evidence grounding",
      "Toxicity and safety profile interpretation",
      "Assessing whether conclusions exceed available evidence boundaries",
    ],
    checkingItems: [
      "Proposed mechanisms",
      "Biological relevance",
      "Pharmacological literature",
      "Compound-target interpretation",
      "Toxicity evidence",
      "Safety interpretation",
      "Conclusions supported by available evidence",
    ],
    stageLinks: [
      { label: "Molecular Docking", sectionId: "molecular-docking" },
      { label: "Formulation & Safety", sectionId: "formulation-safety" },
      { label: "Research Integration", sectionId: "research-integration" },
    ],
  },
  {
    key: "formulation",
    order: 4,
    label: "Formulation",
    shortLabel: "Formulation",
    professionTitle: "Pharmacist / Pharmaceutical Scientist",
    checkingTitle: "Formulation Checking",
    detail: "Formulation design, preparation, composition, solvent/extraction and concentration",
    aliases: ["formulation", "pharmacy", "pharmaceutics"],
    criteria: [
      "Formulation prototype design and dosage form",
      "Preparation methodology and procedural clarity",
      "Component composition and vehicle suitability",
      "Solvent and extraction efficiency parameters",
      "Concentration benchmarks and reproducibility",
      "Formulation limitations and stability considerations",
    ],
    checkingItems: [
      "Formulation type",
      "Plant material",
      "Extraction method",
      "Solvent",
      "Active compounds",
      "Composition",
      "Concentration when available",
      "Preparation",
      "Formulation limitations",
    ],
    stageLinks: [
      { label: "Formulation & Safety", sectionId: "formulation-safety" },
      { label: "Plant & Literature", sectionId: "plant-literature" },
    ],
  },
  {
    key: "clinical_safety",
    order: 5,
    label: "Clinical Safety",
    shortLabel: "Clinical Safety",
    professionTitle: "Physician / Clinical Pharmacist",
    checkingTitle: "Clinical Safety Checking",
    detail: "Contraindications, drug interactions, precautions, dose limitations and clinical safety conclusions",
    aliases: ["clinical_safety", "clinical-safety", "clinical", "medical", "safety"],
    criteria: [
      "Documented contraindications and vulnerable populations",
      "Potential herb-drug interactions and CYP enzyme modulation",
      "Safety precautions and usage warnings",
      "Dose limitations and safety margins",
      "Clinical relevance of proposed botanical use",
      "Appropriateness of safety conclusions without over-claiming",
    ],
    checkingItems: [
      "Contraindications",
      "Drug/herb interactions",
      "Precautions",
      "Toxicity concerns",
      "Dose/concentration limitations",
      "Vulnerable populations",
      "Clinical relevance",
      "Safety conclusion",
    ],
    stageLinks: [
      { label: "Formulation & Safety", sectionId: "formulation-safety" },
      { label: "Research Integration", sectionId: "research-integration" },
    ],
  },
] as const;

export type ExpertReviewAreaKey = (typeof EXPERT_REVIEW_AREAS)[number]["key"];

export function normalizeReviewAreaKeyOrNull(raw?: string | null): ExpertReviewAreaKey | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase();
  const normalized = clean.replace(/-/g, "_");
  for (const area of EXPERT_REVIEW_AREAS) {
    if (area.key === clean || area.key === normalized || area.aliases.includes(clean) || area.aliases.includes(normalized)) {
      return area.key;
    }
  }
  return null;
}

export function normalizeReviewAreaKey(raw?: string | null): ExpertReviewAreaKey {
  return normalizeReviewAreaKeyOrNull(raw) || "pharmacognosy";
}

export function expertReviewAreaLabel(key?: string | null): string {
  const norm = normalizeReviewAreaKey(key);
  const found = EXPERT_REVIEW_AREAS.find((a) => a.key === norm);
  return found?.shortLabel || "Review Area";
}

export function expertReviewAreaFullLabel(key?: string | null): string {
  const norm = normalizeReviewAreaKey(key);
  const found = EXPERT_REVIEW_AREAS.find((a) => a.key === norm);
  return found?.label || "Review Area";
}

export function expertCheckingTitle(key?: string | null): string {
  const norm = normalizeReviewAreaKey(key);
  const found = EXPERT_REVIEW_AREAS.find((a) => a.key === norm);
  return found?.checkingTitle || `${found?.shortLabel || "Specialty"} Checking`;
}

export function expertProfessionTitle(key?: string | null): string {
  const norm = normalizeReviewAreaKey(key);
  const found = EXPERT_REVIEW_AREAS.find((a) => a.key === norm);
  return found?.professionTitle || "Scientific Reviewer";
}

export function getAreaDefinition(key?: string | null): ExpertReviewArea {
  const norm = normalizeReviewAreaKey(key);
  return EXPERT_REVIEW_AREAS.find((a) => a.key === norm) || EXPERT_REVIEW_AREAS[0];
}
