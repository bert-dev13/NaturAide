export interface ExpertReviewArea {
  key: "formulation" | "bioinformatics" | "pharmacology";
  order: number;
  label: string;
  shortLabel: string;
  sectionNumber: 1 | 2 | 3;
  sectionTitle: string;
  assignedSectionRoute: string;
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
    key: "formulation",
    order: 1,
    label: "Formulation Science & Pharmacognosy",
    shortLabel: "Formulation & Pharmacognosy",
    sectionNumber: 1,
    sectionTitle: "Section 1: Formulation R&D",
    assignedSectionRoute: "formulation-rd",
    professionTitle: "Formulation Scientist / Pharmacognosist",
    checkingTitle: "Section 1: Formulation R&D Evaluation",
    detail: "Botanical specimen verification, plant part selection, extraction methodology, phytochemical screening, AI formulation builder composition, and batch quality control analysis.",
    aliases: [
      "formulation",
      "formulation_science",
      "formulation-science",
      "pharmacognosy",
      "botany",
      "phytochemistry",
      "pharmacy",
      "pharmaceutics",
    ],
    criteria: [
      "Botanical identity, scientific nomenclature, and plant part documentation (Steps 1 & 2)",
      "Extraction methodology, solvent system suitability, and yield parameters (Step 3)",
      "Phytochemical screening, compound identification, and bioactive constituents (Step 4)",
      "AI formulation composition, dosage form design, and excipient compatibility (Step 5)",
      "Automated batch quality control, pH, viscosity, and stability evaluation (Steps 6, 7 & 8)",
    ],
    checkingItems: [
      "Botanical Identity & Specimen",
      "Extraction & Solvent Optimization",
      "Phytochemical Profile",
      "Formulation Composition & Excipients",
      "Batch QC & Stability Analysis",
    ],
    stageLinks: [
      { label: "Formulation R&D (Section 1)", sectionId: "formulation-rd" },
      { label: "Research Summary (Section 3)", sectionId: "research-summary" },
    ],
  },
  {
    key: "bioinformatics",
    order: 2,
    label: "Bioinformatics & In-Silico Modeling",
    shortLabel: "Bioinformatics & In-Silico",
    sectionNumber: 2,
    sectionTitle: "Section 2: In-Silico Molecular Docking",
    assignedSectionRoute: "in-silico",
    professionTitle: "Bioinformatician / Computational Scientist",
    checkingTitle: "Section 2: In-Silico Molecular Docking Evaluation",
    detail: "Target protein selection & active site validation, ligand 3D preparation, Lipinski & ADMET screening, AutoDock Vina molecular docking, binding affinity analysis, and 2D/3D interaction profiling.",
    aliases: [
      "bioinformatics",
      "in-silico",
      "insilico",
      "computational",
      "docking",
      "modeling",
    ],
    criteria: [
      "Target protein selection, PDB structure integrity, and binding pocket active site validation (Steps 1 & 2)",
      "Phytochemical ligand 3D conformation preparation and SMILES notation (Step 2)",
      "Lipinski Rule of Five compliance and ADMET pharmacokinetics drug-likeness screening (Step 3)",
      "AutoDock Vina docking simulation parameters, search space grid box, and RMSD (Steps 4 & 5)",
      "Binding affinity scores (kcal/mol), hydrogen bonding, hydrophobic interactions, and scientific interpretation (Steps 6, 7 & 8)",
    ],
    checkingItems: [
      "Target Protein & PDB Structure",
      "Ligand 3D Conformation",
      "Lipinski & ADMET Drug-Likeness",
      "AutoDock Vina Docking Simulations",
      "Binding Energy & 2D/3D Interactions",
    ],
    stageLinks: [
      { label: "In-Silico Docking (Section 2)", sectionId: "in-silico" },
      { label: "Research Summary (Section 3)", sectionId: "research-summary" },
    ],
  },
  {
    key: "pharmacology",
    order: 3,
    label: "Clinical Pharmacology & Paper Review",
    shortLabel: "Clinical Pharmacology & Paper",
    sectionNumber: 3,
    sectionTitle: "Section 3: Research Paper Submission",
    assignedSectionRoute: "submission",
    professionTitle: "Clinical Pharmacologist / Medical Reviewer",
    checkingTitle: "Section 3: Research Paper Submission Evaluation",
    detail: "Cross-disciplinary research summary synthesis, manuscript paper completeness and figures, preclinical pharmacology, clinical safety considerations, and final publication sign-off.",
    aliases: [
      "pharmacology",
      "pharmacological",
      "clinical_safety",
      "clinical-safety",
      "clinical",
      "medical",
      "safety",
      "submission",
      "paper",
      "manuscript",
    ],
    criteria: [
      "Cross-disciplinary research summary synthesis and cross-section scientific coherence (Step 1)",
      "Uploaded research manuscript completeness, formatting, figures, and publication standard (Step 2)",
      "Preclinical pharmacological mechanism of action and dose-response justification (Steps 1 & 2)",
      "Clinical safety profile, predicted adverse risks, contraindications, and regulatory disclaimers (Step 1)",
      "Final research dossier integrity, peer-review sign-off, and readiness for completion (Step 2)",
    ],
    checkingItems: [
      "Research Summary & Coherence",
      "Research Manuscript / Paper Upload",
      "Preclinical Pharmacology & Mechanism",
      "Clinical Safety & Risk Assessment",
      "Final Approval & Completion Readiness",
    ],
    stageLinks: [
      { label: "Paper Submission (Section 3)", sectionId: "submission" },
      { label: "Research Summary (Section 3)", sectionId: "research-summary" },
    ],
  },
] as const;

export type ExpertReviewAreaKey = (typeof EXPERT_REVIEW_AREAS)[number]["key"];

export function normalizeReviewAreaKeyOrNull(raw?: string | null): ExpertReviewAreaKey | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase();
  const normalized = clean.replace(/-/g, "_");
  for (const area of EXPERT_REVIEW_AREAS) {
    if (
      area.key === clean ||
      area.key === normalized ||
      area.aliases.includes(clean) ||
      area.aliases.includes(normalized)
    ) {
      return area.key;
    }
  }
  return null;
}

export function normalizeReviewAreaKey(raw?: string | null): ExpertReviewAreaKey {
  return normalizeReviewAreaKeyOrNull(raw) || "formulation";
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
