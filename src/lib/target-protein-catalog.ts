/**
 * NatureAide Target Protein Catalog & Suggestion Engine
 *
 * Provides a curated, scientifically validated library of protein targets
 * relevant to Philippine & Southeast Asian botanical research, with biological
 * functions, RCSB PDB structures, experimental determination status, and
 * intelligent suggestion matching based on researcher objectives and phytochemicals.
 */

export interface CuratedTargetProtein {
  pdbId: string;
  targetName: string;
  geneOrProtein: string;
  organism: string;
  biologicalFunction: string;
  therapeuticCategory: string;
  resolution: string;
  method: string;
  targetType: "EXPERIMENTALLY_ESTABLISHED" | "COMPUTATIONALLY_PREDICTED";
  coLigand?: string;
  relevance: string;
  compoundAssociations: string[];
  objectiveKeywords: string[];
}

export const CURATED_TARGET_PROTEINS: CuratedTargetProtein[] = [
  {
    pdbId: "5KIR",
    targetName: "Cyclooxygenase-2 (COX-2)",
    geneOrProtein: "PTGS2",
    organism: "Homo sapiens",
    biologicalFunction:
      "Inducible enzyme that converts arachidonic acid to prostaglandin H2, the primary mediator of inflammation, pain, and vascular permeability in response to inflammatory cytokines.",
    therapeuticCategory: "Anti-inflammatory & Analgesic",
    resolution: "2.39 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Rofecoxib (Vioxx)",
    relevance:
      "Standard target for evaluating botanical anti-inflammatory and pain-relieving triterpenoids and flavonoids.",
    compoundAssociations: [
      "alpha-amyrin",
      "beta-amyrin",
      "rosmarinic acid",
      "quercetin",
      "curcumin",
      "borneol",
      "luteolin",
      "apigenin",
    ],
    objectiveKeywords: [
      "anti-inflammatory",
      "inflammation",
      "pain",
      "analgesic",
      "arthritis",
      "swelling",
      "edema",
      "wound",
    ],
  },
  {
    pdbId: "6Y3C",
    targetName: "Cyclooxygenase-1 (COX-1)",
    geneOrProtein: "PTGS1",
    organism: "Homo sapiens",
    biologicalFunction:
      "Constitutively expressed cyclooxygenase enzyme responsible for basal cytoprotective prostaglandin synthesis in gastric mucosa and platelet aggregation regulation.",
    therapeuticCategory: "Gastric Safety & Selectivity",
    resolution: "2.40 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Mofezolac derivative",
    relevance:
      "Screened alongside COX-2 to calculate COX-2/COX-1 selectivity ratio; high selectivity reduces gastrointestinal toxicity.",
    compoundAssociations: ["quercetin", "curcumin", "rosmarinic acid", "alpha-amyrin"],
    objectiveKeywords: ["selectivity", "gastric", "ulcer", "platelet", "toxicity", "safety"],
  },
  {
    pdbId: "3W37",
    targetName: "Alpha-Glucosidase",
    geneOrProtein: "MGAM / GH31",
    organism: "Homo sapiens / Beta vulgaris model",
    biologicalFunction:
      "Key brush-border carbohydrate digestion enzyme that hydrolyzes terminal starch and disaccharides into absorbable glucose, regulating postprandial blood sugar spikes.",
    therapeuticCategory: "Anti-diabetic & Glycemic Control",
    resolution: "2.00 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Acarbose",
    relevance:
      "Gold-standard target for investigating anti-hyperglycemic botanical extracts and traditional herbal anti-diabetic agents (e.g. Ampalaya, Tsaang Gubat).",
    compoundAssociations: [
      "charantin",
      "momordicoside a",
      "vicine",
      "alpha-amyrin",
      "quercetin",
      "luteolin",
      "curcumin",
    ],
    objectiveKeywords: [
      "diabetes",
      "diabetic",
      "glucose",
      "glycemic",
      "hyperglycemia",
      "sugar",
      "metabolic",
      "insulin",
    ],
  },
  {
    pdbId: "2AZ5",
    targetName: "Tumor Necrosis Factor-alpha (TNF-α)",
    geneOrProtein: "TNF",
    organism: "Homo sapiens",
    biologicalFunction:
      "Major pro-inflammatory master cytokine that coordinates immune responses, activates vascular endothelium, and triggers downstream NF-κB inflammatory signaling.",
    therapeuticCategory: "Immunomodulatory & Anti-inflammatory",
    resolution: "2.10 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Small-molecule trimer disruptor (SPD304)",
    relevance:
      "Crucial target for investigating botanical extracts that modulate autoimmune flare-ups, chronic inflammatory diseases, and bronchial inflammation.",
    compoundAssociations: [
      "rosmarinic acid",
      "quercetin",
      "curcumin",
      "l-borneol",
      "blumeatin",
      "ehretianone",
    ],
    objectiveKeywords: [
      "cytokine",
      "autoimmune",
      "immunomodulatory",
      "respiratory",
      "asthma",
      "bronchial",
      "inflammation",
    ],
  },
  {
    pdbId: "1CX2",
    targetName: "Prostaglandin Endoperoxide Synthase-2 (Active Site Bound)",
    geneOrProtein: "PTGS2",
    organism: "Mus musculus / H. sapiens homology",
    biologicalFunction:
      "Alternative crystallographic structure resolving the NSAID binding pocket with SC-558, illuminating hydrophobic sub-pocket interactions.",
    therapeuticCategory: "Anti-inflammatory Screening",
    resolution: "3.00 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "SC-558",
    relevance:
      "Secondary structural validation for triterpene and flavonoid hydrophobic interactions in anti-inflammatory docking.",
    compoundAssociations: ["alpha-amyrin", "beta-amyrin", "lupeol", "ursolic acid"],
    objectiveKeywords: ["anti-inflammatory", "docking", "hydrophobic", "pain"],
  },
  {
    pdbId: "4M8E",
    targetName: "Inducible Nitric Oxide Synthase (iNOS)",
    geneOrProtein: "NOS2",
    organism: "Homo sapiens",
    biologicalFunction:
      "Synthesizes large quantities of nitric oxide (NO) in macrophages upon immune stimulation, driving oxidative and nitrosative tissue stress.",
    therapeuticCategory: "Antioxidant & Tissue Protection",
    resolution: "2.25 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Aminoguanidine derivative",
    relevance:
      "Investigating antioxidant and anti-inflammatory plant polyphenols that downregulate excessive macrophage nitric oxide production.",
    compoundAssociations: ["curcumin", "quercetin", "rosmarinic acid", "blumeatin"],
    objectiveKeywords: ["antioxidant", "nitric oxide", "oxidative", "stress", "macrophage"],
  },
  {
    pdbId: "3LN1",
    targetName: "5-Lipoxygenase (5-LOX)",
    geneOrProtein: "ALOX5",
    organism: "Homo sapiens",
    biologicalFunction:
      "Key enzymatic driver in the leukotriene synthesis pathway, mediating bronchoconstriction, vascular permeability, and allergic asthma responses.",
    therapeuticCategory: "Respiratory & Anti-allergic",
    resolution: "2.39 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Zileuton derivative",
    relevance:
      "Direct target for botanical preparations intended for respiratory relief, cough, asthma, and allergic rhinitis (e.g., Lagundi, Sambong).",
    compoundAssociations: ["chrysosplenol d", "l-borneol", "quercetin", "luteolin"],
    objectiveKeywords: [
      "cough",
      "asthma",
      "respiratory",
      "bronchodilator",
      "bronchial",
      "allergy",
      "pulmonary",
      "lung",
    ],
  },
  {
    pdbId: "2XCT",
    targetName: "DNA Gyrase Subunit B (GyrB)",
    geneOrProtein: "gyrB",
    organism: "Staphylococcus aureus",
    biologicalFunction:
      "Essential bacterial topoisomerase II enzyme that introduces negative supercoils into DNA during replication; absent in mammalian hosts.",
    therapeuticCategory: "Antimicrobial & Antibacterial",
    resolution: "2.30 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Novobiocin analogue",
    relevance:
      "Assessing antibacterial potential of medicinal plants against Gram-positive pathogens (e.g., Bayabas, Akapulko).",
    compoundAssociations: ["quercetin", "guaijaverin", "aloe-emodin", "rhein"],
    objectiveKeywords: ["antimicrobial", "antibacterial", "infection", "staphylococcus", "pathogen", "bacterial"],
  },
  {
    pdbId: "1T46",
    targetName: "Matrix Metalloproteinase-9 (MMP-9)",
    geneOrProtein: "MMP9",
    organism: "Homo sapiens",
    biologicalFunction:
      "Zinc-dependent endopeptidase involved in extracellular matrix degradation, wound healing remodeling, and chronic inflammatory tissue destruction.",
    therapeuticCategory: "Wound Healing & Topical Repair",
    resolution: "2.30 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Hydroxamate inhibitor",
    relevance:
      "Target for botanical wound healing and dermal topical formulations (e.g., Bayabas, Akapulko hydrogels).",
    compoundAssociations: ["quercetin", "curcumin", "rosmarinic acid", "alpha-amyrin"],
    objectiveKeywords: ["wound", "healing", "topical", "skin", "dermal", "hydrogel", "tissue"],
  },
];

export interface TargetSuggestionResult {
  target: CuratedTargetProtein;
  score: number;
  matchReasons: string[];
  isRecommended: boolean;
}

/**
 * Suggests potential target proteins based on research objectives, plant identity,
 * screened compounds, and literature keywords.
 */
export function suggestTargetsForProject(context: {
  researchObjective?: string | null;
  researchQuestion?: string | null;
  plantName?: string | null;
  compoundNames?: string[];
  literatureKeywords?: string[];
}): TargetSuggestionResult[] {
  const textCorpus = [
    context.researchObjective || "",
    context.researchQuestion || "",
    context.plantName || "",
    ...(context.literatureKeywords || []),
  ]
    .join(" ")
    .toLowerCase();

  const normalizedCompounds = (context.compoundNames || []).map((c) =>
    c.toLowerCase().trim().replace(/^α-/, "alpha-").replace(/^β-/, "beta-")
  );

  return CURATED_TARGET_PROTEINS.map((target) => {
    let score = 0;
    const matchReasons: string[] = [];

    // 1. Research objective keywords match
    for (const kw of target.objectiveKeywords) {
      if (textCorpus.includes(kw)) {
        score += 3;
        matchReasons.push(`Matches research focus: "${kw}"`);
      }
    }

    // 2. Phytochemical compound associations
    for (const assoc of target.compoundAssociations) {
      const match = normalizedCompounds.find(
        (c) => c.includes(assoc) || assoc.includes(c)
      );
      if (match) {
        score += 4;
        matchReasons.push(`Documented affinity for constituent: ${match}`);
      }
    }

    // Baseline score for common targets
    if (target.pdbId === "5KIR" || target.pdbId === "3W37") {
      score += 1;
    }

    const uniqueReasons = Array.from(new Set(matchReasons));

    return {
      target,
      score,
      matchReasons:
        uniqueReasons.length > 0
          ? uniqueReasons
          : [`Relevant standard target for ${target.therapeuticCategory}`],
      isRecommended: score >= 3,
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Search target catalog by keyword (PDB ID, target name, gene, or therapeutic category)
 */
export function searchCuratedTargets(query: string): CuratedTargetProtein[] {
  const q = query.trim().toLowerCase();
  if (!q) return CURATED_TARGET_PROTEINS;

  return CURATED_TARGET_PROTEINS.filter((target) => {
    return (
      target.pdbId.toLowerCase().includes(q) ||
      target.targetName.toLowerCase().includes(q) ||
      target.geneOrProtein.toLowerCase().includes(q) ||
      target.therapeuticCategory.toLowerCase().includes(q) ||
      target.biologicalFunction.toLowerCase().includes(q)
    );
  });
}

/**
 * Look up a curated target protein by PDB ID (case-insensitive)
 */
export function lookupTargetByPdbId(pdbId: string): CuratedTargetProtein | null {
  const normalized = pdbId.trim().toUpperCase();
  return CURATED_TARGET_PROTEINS.find((t) => t.pdbId.toUpperCase() === normalized) || null;
}


