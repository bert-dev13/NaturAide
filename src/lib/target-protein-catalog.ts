/**
 * NatureAide Target Protein Catalog & Suggestion Engine
 *
 * Provides a curated, scientifically validated library of protein targets
 * relevant to Philippine & Southeast Asian botanical research, with biological
 * functions, RCSB PDB structures, experimental determination status, and
 * intelligent suggestion matching based on researcher objectives and phytochemicals.
 *
 * Every pdbId below was verified against the RCSB PDB REST API (data.rcsb.org).
 * Do not invent PDB IDs or protein identities. When expanding, verify each entry
 * against RCSB before adding.
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

/** Page size for Target Protein Library Load More. */
export const TARGET_LIBRARY_PAGE_SIZE = 12;

export const CURATED_TARGET_PROTEINS: CuratedTargetProtein[] = [
  // ─── Original nine PDB IDs (metadata corrected to match RCSB deposits) ───
  {
    pdbId: "5KIR",
    targetName: "Cyclooxygenase-2 (COX-2)",
    geneOrProtein: "PTGS2",
    organism: "Homo sapiens",
    biologicalFunction:
      "Inducible enzyme that converts arachidonic acid to prostaglandin H2, the primary mediator of inflammation, pain, and vascular permeability in response to inflammatory cytokines.",
    therapeuticCategory: "Anti-inflammatory & Analgesic",
    resolution: "2.70 Å",
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
    resolution: "3.36 Å",
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
    organism: "Beta vulgaris",
    biologicalFunction:
      "Key carbohydrate digestion enzyme that hydrolyzes terminal starch and disaccharides into absorbable glucose, regulating postprandial blood sugar spikes. Sugar-beet structure used as a structural model for alpha-glucosidase inhibition studies.",
    therapeuticCategory: "Anti-diabetic & Glycemic Control",
    resolution: "1.70 Å",
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
    targetName: "Cyclooxygenase-2 with SC-558",
    geneOrProtein: "PTGS2",
    organism: "Mus musculus",
    biologicalFunction:
      "Murine COX-2 crystallographic structure resolving the NSAID binding pocket with selective inhibitor SC-558, illuminating hydrophobic sub-pocket interactions.",
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
    targetName: "Retinoid X Receptor Alpha (RXR-α)",
    geneOrProtein: "RXRA",
    organism: "Homo sapiens",
    biologicalFunction:
      "Nuclear receptor that heterodimerizes with PPAR, RAR, and other partners to regulate gene expression in lipid metabolism, epidermal differentiation, and inflammatory signaling.",
    therapeuticCategory: "Skin Protection & Metabolic Regulation",
    resolution: "2.40 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "(S)-4-Methyl-9cUAB30",
    relevance:
      "Relevant for botanical retinoid-like and dermal metabolic modulation studies in topical and metabolic research.",
    compoundAssociations: ["curcumin", "resveratrol", "quercetin"],
    objectiveKeywords: ["skin", "dermal", "retinoid", "metabolic", "nuclear receptor", "topical"],
  },
  {
    pdbId: "3LN1",
    targetName: "Cyclooxygenase-2 with Celecoxib",
    geneOrProtein: "PTGS2",
    organism: "Mus musculus",
    biologicalFunction:
      "COX-2 active-site complex with the selective COX-2 inhibitor celecoxib, mapping sulfonamide binding interactions used in anti-inflammatory structure-based studies.",
    therapeuticCategory: "Anti-inflammatory & Analgesic",
    resolution: "2.40 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Celecoxib",
    relevance:
      "Reference COX-2 pocket for comparing botanical flavonoid and phenolic docking poses to a clinically used selective inhibitor.",
    compoundAssociations: ["quercetin", "curcumin", "luteolin", "apigenin"],
    objectiveKeywords: ["anti-inflammatory", "inflammation", "pain", "analgesic", "arthritis"],
  },
  {
    pdbId: "2XCT",
    targetName: "DNA Gyrase (GyrA/GyrB–DNA Complex)",
    geneOrProtein: "gyrA / gyrB",
    organism: "Staphylococcus aureus",
    biologicalFunction:
      "Essential bacterial topoisomerase II complex that introduces negative supercoils into DNA during replication; absent in mammalian hosts.",
    therapeuticCategory: "Antimicrobial & Antibacterial",
    resolution: "3.35 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Ciprofloxacin",
    relevance:
      "Assessing antibacterial potential of medicinal plants against Gram-positive pathogens (e.g., Bayabas, Akapulko).",
    compoundAssociations: ["quercetin", "guaijaverin", "aloe-emodin", "rhein"],
    objectiveKeywords: ["antimicrobial", "antibacterial", "infection", "staphylococcus", "pathogen", "bacterial"],
  },
  {
    pdbId: "1T46",
    targetName: "c-Kit Tyrosine Kinase",
    geneOrProtein: "KIT",
    organism: "Homo sapiens",
    biologicalFunction:
      "Receptor tyrosine kinase controlling stem-cell factor signaling, cell proliferation, and tissue remodeling pathways relevant to wound repair and oncology research.",
    therapeuticCategory: "Wound Healing & Kinase Signaling",
    resolution: "1.60 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Imatinib (STI-571)",
    relevance:
      "Verified RCSB deposit of autoinhibited c-Kit; useful for kinase-pathway screening of botanical polyphenols in repair and proliferation contexts.",
    compoundAssociations: ["quercetin", "curcumin", "genistein", "luteolin"],
    objectiveKeywords: ["wound", "healing", "kinase", "proliferation", "tissue", "dermal"],
  },

  // ─── Expanded verified library ───
  {
    pdbId: "1GKC",
    targetName: "Matrix Metalloproteinase-9 (MMP-9)",
    geneOrProtein: "MMP9",
    organism: "Homo sapiens",
    biologicalFunction:
      "Zinc-dependent endopeptidase (gelatinase B) involved in extracellular matrix degradation, wound remodeling, and chronic inflammatory tissue destruction.",
    therapeuticCategory: "Wound Healing & Topical Repair",
    resolution: "2.30 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Hydroxamate inhibitor",
    relevance:
      "Primary MMP-9 structure for botanical wound-healing and dermal topical formulation docking.",
    compoundAssociations: ["quercetin", "curcumin", "rosmarinic acid", "alpha-amyrin"],
    objectiveKeywords: ["wound", "healing", "topical", "skin", "dermal", "hydrogel", "tissue", "mmp"],
  },
  {
    pdbId: "3V99",
    targetName: "5-Lipoxygenase (5-LOX)",
    geneOrProtein: "ALOX5",
    organism: "Homo sapiens",
    biologicalFunction:
      "Key enzymatic driver in the leukotriene synthesis pathway, mediating bronchoconstriction, vascular permeability, and allergic asthma responses.",
    therapeuticCategory: "Respiratory & Anti-allergic",
    resolution: "2.25 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Arachidonic acid",
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
      "leukotriene",
    ],
  },
  {
    pdbId: "3E7G",
    targetName: "Inducible Nitric Oxide Synthase (iNOS)",
    geneOrProtein: "NOS2",
    organism: "Homo sapiens",
    biologicalFunction:
      "Synthesizes large quantities of nitric oxide in macrophages upon immune stimulation, driving oxidative and nitrosative tissue stress.",
    therapeuticCategory: "Antioxidant & Tissue Protection",
    resolution: "2.20 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "AR-C95791",
    relevance:
      "Investigating antioxidant and anti-inflammatory plant polyphenols that downregulate excessive macrophage nitric oxide production.",
    compoundAssociations: ["curcumin", "quercetin", "rosmarinic acid", "blumeatin"],
    objectiveKeywords: ["antioxidant", "nitric oxide", "oxidative", "stress", "macrophage", "inos"],
  },
  {
    pdbId: "4NOS",
    targetName: "Inducible Nitric Oxide Synthase Oxygenase Domain",
    geneOrProtein: "NOS2",
    organism: "Homo sapiens",
    biologicalFunction:
      "Human iNOS oxygenase domain structure with bound inhibitor, resolving the heme-centered catalytic pocket used in NO synthase inhibition studies.",
    therapeuticCategory: "Antioxidant & Tissue Protection",
    resolution: "2.25 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Secondary iNOS pocket for antioxidant botanical screening against nitrosative stress.",
    compoundAssociations: ["curcumin", "quercetin", "epicatechin"],
    objectiveKeywords: ["antioxidant", "nitric oxide", "oxidative", "inflammation"],
  },
  {
    pdbId: "2C9V",
    targetName: "Cu-Zn Superoxide Dismutase (SOD1)",
    geneOrProtein: "SOD1",
    organism: "Homo sapiens",
    biologicalFunction:
      "Cytosolic antioxidant metalloenzyme that converts superoxide radicals to hydrogen peroxide and molecular oxygen, limiting oxidative cellular damage.",
    therapeuticCategory: "Antioxidant & Tissue Protection",
    resolution: "1.07 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Atomic-resolution antioxidant enzyme for evaluating radical-scavenging botanical polyphenols.",
    compoundAssociations: ["quercetin", "catechin", "rosmarinic acid", "ascorbic acid"],
    objectiveKeywords: ["antioxidant", "oxidative", "radical", "sod", "stress", "protection"],
  },
  {
    pdbId: "1DGF",
    targetName: "Catalase",
    geneOrProtein: "CAT",
    organism: "Homo sapiens",
    biologicalFunction:
      "Heme enzyme that decomposes hydrogen peroxide to water and oxygen, a central defense against peroxide-mediated oxidative damage in erythrocytes and tissues.",
    therapeuticCategory: "Antioxidant & Tissue Protection",
    resolution: "1.50 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Classic antioxidant enzyme target for peroxide-scavenging plant extracts used in skin and systemic protection research.",
    compoundAssociations: ["quercetin", "curcumin", "ellagic acid", "gallic acid"],
    objectiveKeywords: ["antioxidant", "peroxide", "oxidative", "catalase", "protection", "skin"],
  },
  {
    pdbId: "1HD2",
    targetName: "Peroxiredoxin 5 (PRDX5)",
    geneOrProtein: "PRDX5",
    organism: "Homo sapiens",
    biologicalFunction:
      "Thiol-dependent peroxidase that reduces hydrogen peroxide and alkyl hydroperoxides, protecting mitochondria and cytosol from oxidative injury.",
    therapeuticCategory: "Antioxidant & Tissue Protection",
    resolution: "1.50 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Peroxiredoxin system relevant to botanical antioxidant and cellular stress-response studies.",
    compoundAssociations: ["quercetin", "epigallocatechin", "rosmarinic acid"],
    objectiveKeywords: ["antioxidant", "peroxide", "oxidative", "stress", "mitochondria"],
  },
  {
    pdbId: "1N1M",
    targetName: "Dipeptidyl Peptidase IV (DPP-IV / CD26)",
    geneOrProtein: "DPP4",
    organism: "Homo sapiens",
    biologicalFunction:
      "Serine protease that inactivates incretin hormones GLP-1 and GIP, thereby regulating insulin secretion and postprandial glucose control.",
    therapeuticCategory: "Anti-diabetic & Glycemic Control",
    resolution: "2.50 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Established antidiabetic target for screening plant alkaloids and flavonoids from traditional hypoglycemic herbs.",
    compoundAssociations: ["berberine", "quercetin", "charantin", "curcumin"],
    objectiveKeywords: ["diabetes", "diabetic", "glucose", "incretin", "insulin", "glycemic", "dpp"],
  },
  {
    pdbId: "2PRG",
    targetName: "Peroxisome Proliferator-Activated Receptor Gamma (PPARγ)",
    geneOrProtein: "PPARG",
    organism: "Homo sapiens",
    biologicalFunction:
      "Nuclear receptor controlling adipogenesis, insulin sensitization, and inflammatory gene repression in metabolic tissues.",
    therapeuticCategory: "Anti-diabetic & Glycemic Control",
    resolution: "2.30 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Rosiglitazone-class ligand pocket",
    relevance:
      "Metabolic nuclear receptor for botanical insulin-sensitizing and anti-inflammatory phytochemical evaluation.",
    compoundAssociations: ["curcumin", "resveratrol", "quercetin", "luteolin"],
    objectiveKeywords: ["diabetes", "metabolic", "insulin", "ppar", "adipose", "glycemic"],
  },
  {
    pdbId: "1FM6",
    targetName: "PPARγ–RXRα Heterodimer Ligand-Binding Domains",
    geneOrProtein: "PPARG / RXRA",
    organism: "Homo sapiens",
    biologicalFunction:
      "Heterodimeric nuclear receptor complex that integrates metabolic and transcriptional responses to fatty-acid and retinoid ligands.",
    therapeuticCategory: "Anti-diabetic & Metabolic Regulation",
    resolution: "2.10 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Rosiglitazone / 9-cis-retinoic acid",
    relevance:
      "Dual-pocket structure for studying botanical ligands that engage metabolic nuclear receptor heterodimers.",
    compoundAssociations: ["curcumin", "resveratrol", "fatty acids"],
    objectiveKeywords: ["diabetes", "metabolic", "ppar", "retinoid", "insulin"],
  },
  {
    pdbId: "3G7B",
    targetName: "DNA Gyrase Subunit B (GyrB)",
    geneOrProtein: "gyrB",
    organism: "Staphylococcus aureus",
    biologicalFunction:
      "ATP-binding subunit of bacterial DNA gyrase required for DNA supercoiling during replication; a validated antibacterial target.",
    therapeuticCategory: "Antimicrobial & Antibacterial",
    resolution: "2.30 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Complementary GyrB pocket for plant antimicrobial screening against staphylococcal pathogens.",
    compoundAssociations: ["quercetin", "aloe-emodin", "rhein", "berberine"],
    objectiveKeywords: ["antimicrobial", "antibacterial", "gyrase", "infection", "bacterial"],
  },
  {
    pdbId: "2Q5K",
    targetName: "HIV-1 Protease",
    geneOrProtein: "pol (HIV-1 protease)",
    organism: "Human immunodeficiency virus 1",
    biologicalFunction:
      "Aspartic protease essential for cleavage of viral polyproteins and maturation of infectious HIV particles.",
    therapeuticCategory: "Antimicrobial & Antiviral",
    resolution: "1.95 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Lopinavir",
    relevance:
      "Reference antiviral protease for exploratory docking of antiviral plant metabolites.",
    compoundAssociations: ["quercetin", "myricetin", "ellagic acid"],
    objectiveKeywords: ["antiviral", "antimicrobial", "hiv", "protease", "infection", "viral"],
  },
  {
    pdbId: "1P45",
    targetName: "Enoyl-ACP Reductase (InhA)",
    geneOrProtein: "inhA",
    organism: "Mycobacterium tuberculosis",
    biologicalFunction:
      "NADH-dependent enoyl reductase in mycolic acid biosynthesis; essential for mycobacterial cell-wall integrity.",
    therapeuticCategory: "Antimicrobial & Antibacterial",
    resolution: "2.60 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "TB-relevant antibacterial target for screening plant phenolics and quinones with reported antimycobacterial activity.",
    compoundAssociations: ["plumbagin", "lawsone", "quercetin", "aloe-emodin"],
    objectiveKeywords: ["antimicrobial", "antibacterial", "tuberculosis", "mycobacterium", "infection"],
  },
  {
    pdbId: "1B0F",
    targetName: "Neutrophil Elastase",
    geneOrProtein: "ELANE",
    organism: "Homo sapiens",
    biologicalFunction:
      "Serine protease released by neutrophils that degrades elastin and extracellular matrix during inflammation and tissue remodeling.",
    therapeuticCategory: "Wound Healing & Tissue Remodeling",
    resolution: "3.00 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "MDL 101,146",
    relevance:
      "Tissue-remodeling protease relevant to wound, COPD, and topical anti-inflammatory botanical research.",
    compoundAssociations: ["quercetin", "epicatechin", "ursolic acid"],
    objectiveKeywords: ["wound", "elastase", "tissue", "inflammation", "skin", "remodeling"],
  },
  {
    pdbId: "3NX7",
    targetName: "Matrix Metalloproteinase-12 (MMP-12)",
    geneOrProtein: "MMP12",
    organism: "Homo sapiens",
    biologicalFunction:
      "Macrophage metalloelastase that degrades elastin and contributes to chronic inflammatory tissue damage in skin and lung.",
    therapeuticCategory: "Wound Healing & Tissue Remodeling",
    resolution: "1.80 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "MMP family member for dermal remodeling and anti-inflammatory topical extract evaluation.",
    compoundAssociations: ["curcumin", "quercetin", "epigallocatechin"],
    objectiveKeywords: ["wound", "mmp", "skin", "tissue", "inflammation", "remodeling"],
  },
  {
    pdbId: "2Y9X",
    targetName: "Tyrosinase (PPO3)",
    geneOrProtein: "PPO3 / TYR homolog",
    organism: "Agaricus bisporus",
    biologicalFunction:
      "Copper-containing oxidase that catalyzes melanin precursor oxidation; widely used structural model for skin pigmentation and browning enzyme inhibition.",
    therapeuticCategory: "Skin Protection & Pigmentation",
    resolution: "2.78 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Tropolone",
    relevance:
      "Skin-whitening and photoprotection research target for plant phenolics that modulate melanogenesis.",
    compoundAssociations: ["kojic acid", "arbutin", "quercetin", "resveratrol", "ellagic acid"],
    objectiveKeywords: ["skin", "pigment", "melanin", "tyrosinase", "topical", "dermal", "whitening"],
  },
  {
    pdbId: "4KIK",
    targetName: "IκB Kinase Beta (IKKβ)",
    geneOrProtein: "IKBKB",
    organism: "Homo sapiens",
    biologicalFunction:
      "Catalytic kinase of the IKK complex that phosphorylates IκB, enabling NF-κB nuclear translocation and pro-inflammatory gene expression.",
    therapeuticCategory: "Anti-inflammatory & Analgesic",
    resolution: "2.83 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Upstream NF-κB pathway node frequently studied with anti-inflammatory plant polyphenols.",
    compoundAssociations: ["curcumin", "quercetin", "resveratrol", "andrographolide"],
    objectiveKeywords: ["anti-inflammatory", "nfkb", "ikk", "cytokine", "inflammation"],
  },
  {
    pdbId: "1KV1",
    targetName: "p38 MAP Kinase",
    geneOrProtein: "MAPK14",
    organism: "Homo sapiens",
    biologicalFunction:
      "Stress-activated MAPK mediating cytokine production, inflammatory gene transcription, and cellular responses to environmental stress.",
    therapeuticCategory: "Anti-inflammatory & Analgesic",
    resolution: "2.50 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Inflammatory MAPK for docking studies of botanical kinase modulators.",
    compoundAssociations: ["quercetin", "luteolin", "curcumin", "apigenin"],
    objectiveKeywords: ["anti-inflammatory", "mapk", "kinase", "cytokine", "inflammation", "stress"],
  },
  {
    pdbId: "4PH9",
    targetName: "Cyclooxygenase-2 with Ibuprofen",
    geneOrProtein: "PTGS2",
    organism: "Mus musculus",
    biologicalFunction:
      "COX-2 structure with ibuprofen bound in the cyclooxygenase channel, informing NSAID-like binding comparisons for plant phenolics.",
    therapeuticCategory: "Anti-inflammatory & Analgesic",
    resolution: "1.81 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Ibuprofen",
    relevance:
      "High-resolution COX-2 reference for comparing botanical ligands to a widely used NSAID pose.",
    compoundAssociations: ["quercetin", "salicylic acid", "curcumin"],
    objectiveKeywords: ["anti-inflammatory", "pain", "nsaid", "cox", "analgesic"],
  },
  {
    pdbId: "1M17",
    targetName: "Epidermal Growth Factor Receptor Kinase (EGFR)",
    geneOrProtein: "EGFR",
    organism: "Homo sapiens",
    biologicalFunction:
      "Receptor tyrosine kinase that drives epithelial cell proliferation, differentiation, and wound-edge migration via EGF-family ligands.",
    therapeuticCategory: "Wound Healing & Kinase Signaling",
    resolution: "2.60 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Erlotinib",
    relevance:
      "Epithelial kinase relevant to skin repair, topical oncology-adjacent, and growth-factor pathway botanical screens.",
    compoundAssociations: ["quercetin", "luteolin", "genistein", "curcumin"],
    objectiveKeywords: ["wound", "skin", "egfr", "kinase", "proliferation", "epithelial"],
  },
  {
    pdbId: "3ERT",
    targetName: "Estrogen Receptor Alpha Ligand-Binding Domain",
    geneOrProtein: "ESR1",
    organism: "Homo sapiens",
    biologicalFunction:
      "Nuclear hormone receptor that mediates estrogen-dependent transcription affecting skin, bone, and reproductive tissues.",
    therapeuticCategory: "Skin Protection & Hormone Modulation",
    resolution: "1.90 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "4-Hydroxytamoxifen",
    relevance:
      "Useful for phytoestrogen and botanical hormone-modulating compound evaluation.",
    compoundAssociations: ["genistein", "daidzein", "coumestrol", "resveratrol"],
    objectiveKeywords: ["estrogen", "phytoestrogen", "hormone", "skin", "receptor"],
  },
  {
    pdbId: "1HW9",
    targetName: "HMG-CoA Reductase",
    geneOrProtein: "HMGCR",
    organism: "Homo sapiens",
    biologicalFunction:
      "Rate-limiting enzyme of cholesterol biosynthesis that converts HMG-CoA to mevalonate; primary target of statin drugs.",
    therapeuticCategory: "Metabolic & Cardiovascular Research",
    resolution: "2.33 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Simvastatin",
    relevance:
      "Metabolic enzyme for plant sterols and cholesterol-lowering phytochemical docking studies.",
    compoundAssociations: ["beta-sitosterol", "stigmasterol", "curcumin"],
    objectiveKeywords: ["cholesterol", "metabolic", "cardiovascular", "statin", "lipid"],
  },
  {
    pdbId: "1AZM",
    targetName: "Carbonic Anhydrase I",
    geneOrProtein: "CA1",
    organism: "Homo sapiens",
    biologicalFunction:
      "Zinc metalloenzyme catalyzing CO2 hydration; isoform I is abundant in erythrocytes and used as a model for sulfonamide binding.",
    therapeuticCategory: "Enzyme Inhibition & Screening",
    resolution: "2.00 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Sulfonamide",
    relevance:
      "Classic metalloenzyme for benchmarking botanical phenolic and sulfonamide-like inhibitors.",
    compoundAssociations: ["quercetin", "coumarin", "ellagic acid"],
    objectiveKeywords: ["enzyme", "carbonic anhydrase", "screening", "metalloenzyme"],
  },
  {
    pdbId: "4EY7",
    targetName: "Acetylcholinesterase",
    geneOrProtein: "ACHE",
    organism: "Homo sapiens",
    biologicalFunction:
      "Serine hydrolase that terminates cholinergic signaling by hydrolyzing acetylcholine at synapses.",
    therapeuticCategory: "Neuroprotective & Enzyme Inhibition",
    resolution: "2.35 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Donepezil",
    relevance:
      "Neuroprotective screening target for alkaloid-rich medicinal plants with reported cholinesterase inhibition.",
    compoundAssociations: ["galantamine", "huperzine", "berberine", "quercetin"],
    objectiveKeywords: ["neuro", "cholinesterase", "memory", "acetylcholinesterase", "alkaloid"],
  },
  {
    pdbId: "2B7A",
    targetName: "Janus Kinase 2 (JAK2)",
    geneOrProtein: "JAK2",
    organism: "Homo sapiens",
    biologicalFunction:
      "Non-receptor tyrosine kinase mediating cytokine receptor signaling through the JAK–STAT pathway in inflammation and hematopoiesis.",
    therapeuticCategory: "Immunomodulatory & Anti-inflammatory",
    resolution: "2.00 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Cytokine signaling kinase for immunomodulatory botanical polyphenol evaluation.",
    compoundAssociations: ["curcumin", "quercetin", "resveratrol"],
    objectiveKeywords: ["immunomodulatory", "jak", "cytokine", "inflammation", "stat"],
  },
  {
    pdbId: "1R4L",
    targetName: "Angiotensin-Converting Enzyme 2 (ACE2)",
    geneOrProtein: "ACE2",
    organism: "Homo sapiens",
    biologicalFunction:
      "Carboxypeptidase that converts angiotensin II to angiotensin-(1–7), regulating blood pressure and serving as a cellular receptor for certain coronaviruses.",
    therapeuticCategory: "Cardiovascular & Host-Pathogen Research",
    resolution: "3.00 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Cardiovascular and host-entry research target for plant peptides and phenolics with ACE-modulating reports.",
    compoundAssociations: ["quercetin", "luteolin", "epicatechin"],
    objectiveKeywords: ["cardiovascular", "ace", "blood pressure", "angiotensin", "host"],
  },
  {
    pdbId: "2HCK",
    targetName: "Hematopoietic Cell Kinase (HCK) with Quercetin",
    geneOrProtein: "HCK",
    organism: "Homo sapiens",
    biologicalFunction:
      "Src-family tyrosine kinase involved in immune cell signaling; this deposit captures the flavonoid quercetin bound in the ATP site.",
    therapeuticCategory: "Anti-inflammatory & Phytochemical Reference",
    resolution: "3.00 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Quercetin",
    relevance:
      "Direct experimental evidence of a common botanical flavonoid occupying a kinase ATP pocket—valuable reference for plant-compound docking.",
    compoundAssociations: ["quercetin", "luteolin", "apigenin", "kaempferol"],
    objectiveKeywords: ["flavonoid", "quercetin", "kinase", "anti-inflammatory", "phytochemical"],
  },
  {
    pdbId: "3EQM",
    targetName: "Aromatase (CYP19A1)",
    geneOrProtein: "CYP19A1",
    organism: "Homo sapiens",
    biologicalFunction:
      "Cytochrome P450 enzyme converting androgens to estrogens; central to hormone biosynthesis and phytoestrogen research.",
    therapeuticCategory: "Hormone Modulation & Metabolic Research",
    resolution: "2.90 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Androstenedione",
    relevance:
      "Hormone-pathway target for evaluating phytoestrogenic and aromatase-modulating plant metabolites.",
    compoundAssociations: ["apigenin", "chrysin", "genistein", "naringenin"],
    objectiveKeywords: ["aromatase", "estrogen", "hormone", "phytoestrogen", "cyp"],
  },
  {
    pdbId: "3BQD",
    targetName: "Glucocorticoid Receptor Ligand-Binding Domain",
    geneOrProtein: "NR3C1",
    organism: "Homo sapiens",
    biologicalFunction:
      "Nuclear receptor mediating anti-inflammatory and metabolic effects of glucocorticoids through transcriptional regulation.",
    therapeuticCategory: "Anti-inflammatory & Immunomodulatory",
    resolution: "2.50 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    coLigand: "Deacylcortivazol",
    relevance:
      "Steroid-receptor pocket for botanical anti-inflammatory and adaptogenic compound exploration.",
    compoundAssociations: ["glycyrrhetinic acid", "curcumin", "quercetin"],
    objectiveKeywords: ["glucocorticoid", "anti-inflammatory", "steroid", "immunomodulatory"],
  },
  {
    pdbId: "4NRE",
    targetName: "15-Lipoxygenase-B (ALOX15B)",
    geneOrProtein: "ALOX15B",
    organism: "Homo sapiens",
    biologicalFunction:
      "Lipoxygenase isoform that oxygenates polyunsaturated fatty acids, contributing to specialized pro-resolving lipid mediator pathways and epithelial inflammation.",
    therapeuticCategory: "Anti-inflammatory & Lipid Mediators",
    resolution: "2.63 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Lipoxygenase family member for anti-inflammatory botanical fatty-acid pathway studies.",
    compoundAssociations: ["quercetin", "baicalein", "luteolin", "curcumin"],
    objectiveKeywords: ["anti-inflammatory", "lipoxygenase", "lipid", "inflammation", "epithelial"],
  },
  {
    pdbId: "3O8Y",
    targetName: "Stable 5-Lipoxygenase",
    geneOrProtein: "ALOX5",
    organism: "Homo sapiens",
    biologicalFunction:
      "Stabilized human 5-LOX structure used to study leukotriene biosynthesis enzyme conformation without bound arachidonate.",
    therapeuticCategory: "Respiratory & Anti-allergic",
    resolution: "2.39 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Alternate 5-LOX conformation for respiratory and anti-allergic botanical docking comparisons.",
    compoundAssociations: ["quercetin", "luteolin", "nordihydroguaiaretic acid"],
    objectiveKeywords: ["asthma", "respiratory", "leukotriene", "allergy", "anti-inflammatory"],
  },
  {
    pdbId: "2OYU",
    targetName: "Cyclooxygenase-1 (Ovine)",
    geneOrProtein: "PTGS1",
    organism: "Ovis aries",
    biologicalFunction:
      "Ovine COX-1 crystal structure widely used as a high-quality structural surrogate for mammalian COX-1 inhibitor studies.",
    therapeuticCategory: "Gastric Safety & Selectivity",
    resolution: "2.70 Å",
    method: "X-ray Diffraction",
    targetType: "EXPERIMENTALLY_ESTABLISHED",
    relevance:
      "Complementary COX-1 model for selectivity ratio calculations against botanical COX-2 binders.",
    compoundAssociations: ["quercetin", "curcumin", "salicylic acid"],
    objectiveKeywords: ["selectivity", "cox", "gastric", "anti-inflammatory", "safety"],
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

    for (const kw of target.objectiveKeywords) {
      if (textCorpus.includes(kw)) {
        score += 3;
        matchReasons.push(`Matches research focus: "${kw}"`);
      }
    }

    for (const assoc of target.compoundAssociations) {
      const match = normalizedCompounds.find(
        (c) => c.includes(assoc) || assoc.includes(c)
      );
      if (match) {
        score += 4;
        matchReasons.push(`Documented affinity for constituent: ${match}`);
      }
    }

    if (target.pdbId === "5KIR" || target.pdbId === "3W37" || target.pdbId === "1GKC") {
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
      target.biologicalFunction.toLowerCase().includes(q) ||
      target.organism.toLowerCase().includes(q)
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

/** Unique PDB IDs currently in the curated library (no duplicates). */
export function getCuratedLibrarySize(): number {
  return CURATED_TARGET_PROTEINS.length;
}
