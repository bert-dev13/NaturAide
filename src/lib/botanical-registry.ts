/**
 * Verified Botanical Registry for NatureAide V2
 * Authoritative taxonomy, botanical families, ethnomedicinal profiles,
 * and pharmacopeial documentation for Philippine medicinal flora.
 */

export interface BotanicalPlantRecord {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  family: string;
  localNames: string;
  botanicalSynonyms: string;
  category: string;
  documentedParts: string[];
  traditionalUses: string;
  traditionalPreparations: string;
  safetyNotes: string;
  isPitahc: boolean;
  pharmacopeiaStatus: string;
  sourceOrganization: string;
  sourceUrl: string;
  imageUrl: string;
  suggestedAuthenticationMethod: string;
}

export const VERIFIED_BOTANICAL_REGISTRY: Record<string, BotanicalPlantRecord> = {
  akapulko: {
    id: "akapulko",
    slug: "akapulko",
    commonName: "Akapulko",
    scientificName: "Senna alata",
    family: "Fabaceae",
    localNames: "Katanda (Tagalog), Palochina (Visayas), Andadasi (Ilocano), Ringworm Bush, Candle Bush",
    botanicalSynonyms: "Cassia alata L., Herpetica alata (L.) Raf.",
    category: "Skin Health & Antifungal",
    documentedParts: ["Leaves"],
    traditionalUses:
      "Documented in Philippine medicinal-plant references for traditional topical antifungal use against ringworm (buni), tinea flava / versicolor (an-an), scabies, eczema, and superficial mycoses.",
    traditionalPreparations:
      "Crush fresh leaves and express sap/juice directly onto affected skin twice daily for 3 weeks; or boil 1 glass of crushed leaves in 2 glasses of water for 15 minutes as an antifungal wash.",
    safetyNotes:
      "Primary route is external topical application. If allergic skin erythema occurs from raw fresh extract, switch to the milder decoction wash. Avoid contact with ocular mucous membranes.",
    isPitahc: true,
    pharmacopeiaStatus: "Official Philippine Herbal Pharmacopeia (PHP) & PITAHC Priority Medicinal Flora",
    sourceOrganization: "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: "https://pitahc.gov.ph/herbs-directory/",
    imageUrl: "/images/plants/akapulko.jpg",
    suggestedAuthenticationMethod: "Morphological identification & stereomicroscopic examination of foliar venation",
  },
  ampalaya: {
    id: "ampalaya",
    slug: "ampalaya",
    commonName: "Ampalaya",
    scientificName: "Momordica charantia",
    family: "Cucurbitaceae",
    localNames: "Bitter Melon, Bitter Gourd, Paria (Ilocano), Palia (Visayas)",
    botanicalSynonyms: "Momordica charantia L., Momordica muricata Willd.",
    category: "Metabolic Health & Glycemic Control",
    documentedParts: ["Leaves", "Young tender shoots", "Fruits"],
    traditionalUses:
      "Traditional adjunctive therapy for mild non-insulin-dependent diabetes mellitus (Type 2 diabetes); digestive tonic, anthelmintic, and carminative folk medicine.",
    traditionalPreparations:
      "Decoction of fresh chopped leaves (1 cup in 2 glasses of water for 15 minutes), taken 1/3 cup three times daily 30 minutes before meals; or freshly steamed tender tops as dietary adjunct.",
    safetyNotes:
      "Not recommended during pregnancy due to potential uterine contractions. Monitor blood glucose closely when co-administered with synthetic hypoglycemic agents.",
    isPitahc: true,
    pharmacopeiaStatus: "Official Philippine Herbal Pharmacopeia (PHP) & PITAHC Priority Medicinal Flora",
    sourceOrganization: "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: "https://pitahc.gov.ph/herbs-directory/",
    imageUrl: "/images/plants/ampalaya.jpg",
    suggestedAuthenticationMethod: "Morphological key identification & TLC fingerprinting of charantin marker",
  },
  bawang: {
    id: "bawang",
    slug: "bawang",
    commonName: "Bawang (Garlic)",
    scientificName: "Allium sativum",
    family: "Amaryllidaceae",
    localNames: "Garlic, Ajos (Spanish/Visayan)",
    botanicalSynonyms: "Allium sativum L., Porrum sativum",
    category: "Cardiovascular Health & Antimicrobial",
    documentedParts: ["Bulbs"],
    traditionalUses:
      "Supportive herbal adjunct for mild hyperlipidemia and borderline hypertension; antibacterial, antiseptic, and antifungal topical and oral applications.",
    traditionalPreparations:
      "Eat 2 to 3 cloves of raw garlic daily with meals, or macerated in coconut oil/vinegar; lightly fried or roasted with food. Avoid burning.",
    safetyNotes:
      "Avoid excessive raw intake on an empty stomach to prevent gastric mucosal irritation. Exercise caution prior to elective surgery due to antiplatelet activity.",
    isPitahc: true,
    pharmacopeiaStatus: "Official Philippine Herbal Pharmacopeia (PHP) & PITAHC Priority Medicinal Flora",
    sourceOrganization: "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: "https://pitahc.gov.ph/herbs-directory/",
    imageUrl: "/images/plants/bawang.jpg",
    suggestedAuthenticationMethod: "Organoleptic verification, allicin GC-MS/HPLC assay & bulb morphology",
  },
  bayabas: {
    id: "bayabas",
    slug: "bayabas",
    commonName: "Bayabas (Guava)",
    scientificName: "Psidium guajava",
    family: "Myrtaceae",
    localNames: "Guava, Kalimbahin, Tayabas (Tagalog), Biabas (Sulu)",
    botanicalSynonyms: "Psidium guajava L., Psidium pyriferum L., Psidium pomiferum L.",
    category: "Antiseptic & Wound Care",
    documentedParts: ["Leaves", "Tender leafy tops"],
    traditionalUses:
      "Antiseptic astringent wash for acute wounds, skin sores, postpartum maternal hygiene; mouth gargle for gingivitis, aphthous ulcers, and toothache; antidiarrheal decoction.",
    traditionalPreparations:
      "Boil 1 to 2 handfuls of freshly gathered leafy tops in 2 glasses of water for 10 to 15 minutes. Cool and strain for topical antiseptic wash or oral mouthwash.",
    safetyNotes:
      "Prolonged oral ingestion of strong decoction may aggravate constipation due to high tannin concentration.",
    isPitahc: true,
    pharmacopeiaStatus: "Official Philippine Herbal Pharmacopeia (PHP) & PITAHC Priority Medicinal Flora",
    sourceOrganization: "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: "https://pitahc.gov.ph/herbs-directory/",
    imageUrl: "/images/plants/bayabas.jpg",
    suggestedAuthenticationMethod: "Morphological leaf venation inspection & total tannin spectrophotometric assay",
  },
  ginger: {
    id: "ginger",
    slug: "ginger",
    commonName: "Ginger (Luya)",
    scientificName: "Zingiber officinale",
    family: "Zingiberaceae",
    localNames: "Luya (Tagalog/Visayan), Laya (Ilocano), Baseng (Ilocano), Ginger",
    botanicalSynonyms: "Zingiber officinale Roscoe, Amomum zingiber L.",
    category: "Digestive & Anti-inflammatory",
    documentedParts: ["Rhizomes"],
    traditionalUses:
      "Warming aromatic carminative for nausea, motion sickness, morning sickness, abdominal flatulence (kabag), sore throat, and arthritic muscular discomfort.",
    traditionalPreparations:
      "Salabat: Crush 1 thumb-sized fresh rhizome, boil in 2 cups of water for 10 to 15 minutes, sweeten with honey or calamansi juice; or warm poultice of crushed rhizome for joints.",
    safetyNotes:
      "High doses may aggravate gastric hyperacidity. Use cautiously in patients with active gallstones.",
    isPitahc: false,
    pharmacopeiaStatus: "Included in Philippine Herbal Pharmacopeia & WHO Monographs on Selected Medicinal Plants",
    sourceOrganization: "National Integrated Research Program on Medicinal Plants (NIRPROMP)",
    sourceUrl: "https://pitahc.gov.ph",
    imageUrl: "/images/plants/ginger.jpg",
    suggestedAuthenticationMethod: "Rhizome anatomy inspection & HPLC quantification of 6-gingerol and 6-shogaol",
  },
  lagundi: {
    id: "lagundi",
    slug: "lagundi",
    commonName: "Lagundi",
    scientificName: "Vitex negundo",
    family: "Lamiaceae",
    localNames: "Dangla (Ilocano), Five-leaved chaste tree, Dab-daban, Limo-limo",
    botanicalSynonyms: "Vitex negundo L., Vitex incisa Thunb.",
    category: "Respiratory Health & Bronchodilator",
    documentedParts: ["Leaves", "Stems"],
    traditionalUses:
      "Relief of acute cough, bronchial asthma, bronchospasm, colds, influenza, pharyngitis, and fever; verified analgesic and anti-inflammatory activity.",
    traditionalPreparations:
      "Boil 1/2 to 1 cup of chopped fresh leaves in 2 glasses of water for 15 minutes; filter and administer 1/3 cup three times daily after meals.",
    safetyNotes:
      "Extensive clinical safety trials confirm wide therapeutic index. Rare mild gastrointestinal intolerance or dry mouth may occur at elevated doses.",
    isPitahc: true,
    pharmacopeiaStatus: "Official Philippine Herbal Pharmacopeia (PHP) & PITAHC Priority Medicinal Flora",
    sourceOrganization: "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: "https://pitahc.gov.ph/herbs-directory/",
    imageUrl: "/images/plants/lagundi.jpg",
    suggestedAuthenticationMethod: "Herbarium morphological key, ITS rDNA barcoding, & HPLC assay of casticin marker",
  },
  "niyog-niyogan": {
    id: "niyog-niyogan",
    slug: "niyog-niyogan",
    commonName: "Niyog-niyogan",
    scientificName: "Quisqualis indica",
    family: "Combretaceae",
    localNames: "Chinese Honeysuckle, Tartaraok (Ilocano), Balitadham (Visayas), Bawe-bawe (Pampanga)",
    botanicalSynonyms: "Quisqualis indica L., Combretum indicum (L.) DeFilipps",
    category: "Anthelmintic & Parasitic Defense",
    documentedParts: ["Seeds"],
    traditionalUses:
      "Traditional herbal anthelmintic for the expulsion of intestinal nematodes (specifically Ascaris lumbricoides and enterobiasis).",
    traditionalPreparations:
      "Chew mature dried seeds thoroughly 2 hours after supper: 4–5 seeds for children 4–7 yrs; 6–7 seeds for 8–9 yrs; 8–10 seeds for adults. Repeat after 1 week if needed.",
    safetyNotes:
      "Strict dosage adherence is essential; excessive seed consumption may trigger hiccoughs, nausea, vomiting, or abdominal colic.",
    isPitahc: true,
    pharmacopeiaStatus: "Official Philippine Herbal Pharmacopeia (PHP) & PITAHC Priority Medicinal Flora",
    sourceOrganization: "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: "https://pitahc.gov.ph/herbs-directory/",
    imageUrl: "/images/plants/niyog-niyogan.jpg",
    suggestedAuthenticationMethod: "Fruit and seed pentagonal morphology identification & quisqualic acid characterization",
  },
  sambong: {
    id: "sambong",
    slug: "sambong",
    commonName: "Sambong",
    scientificName: "Blumea balsamifera",
    family: "Asteraceae",
    localNames: "Subusub (Ilocano), Alimon (Visayas), Kaliban, Camphor blumea, Ayoban",
    botanicalSynonyms: "Blumea balsamifera (L.) DC., Conyza balsamifera L.",
    category: "Renal Health & Diuretic",
    documentedParts: ["Leaves"],
    traditionalUses:
      "Diuretic in mild-to-moderate congestive and renal edema; anti-urolithiasis agent facilitating dissolution and excretion of calcium oxalate renal calculi.",
    traditionalPreparations:
      "Decoction of mature leaves: Boil 1 cup of fresh minced leaves in 2 glasses of water for 15 minutes; drink 1/3 glass three times a day accompanied by generous hydration.",
    safetyNotes:
      "Avoid in patients with obstructive uropathy without clinical imaging. Ensure adequate fluid intake during therapeutic course.",
    isPitahc: true,
    pharmacopeiaStatus: "Official Philippine Herbal Pharmacopeia (PHP) & PITAHC Priority Medicinal Flora",
    sourceOrganization: "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: "https://pitahc.gov.ph/herbs-directory/",
    imageUrl: "/images/plants/sambong.jpg",
    suggestedAuthenticationMethod: "Foliar glandular trichome stereomicroscopy & GC-MS camphor / borneol profiling",
  },
  "tsaang-gubat": {
    id: "tsaang-gubat",
    slug: "tsaang-gubat",
    commonName: "Tsaang Gubat",
    scientificName: "Carmona retusa",
    family: "Boraginaceae",
    localNames: "Wild Tea, Forest Tea, Putputay (Bicol), Alangitngit (Tagalog), Kalimunug",
    botanicalSynonyms: "Carmona retusa (Vahl) Masam., Ehretia microphylla Lam., Cordia retusa Vahl",
    category: "Gastrointestinal Health & Antispasmodic",
    documentedParts: ["Leaves"],
    traditionalUses:
      "Antispasmodic relief of abdominal colic, stomach cramps, diarrhea, and intestinal dysmotility; dental mouth gargle to inhibit dental caries.",
    traditionalPreparations:
      "Boil 1 cup of chopped fresh leaves in 2 glasses of water for 15 minutes; drink 1/3 cup warm every 4 hours for colic; or use as antibacterial mouthwash.",
    safetyNotes:
      "Consult physician if acute bloody diarrhea or persistent high fever is present. Well-tolerated in clinical studies.",
    isPitahc: true,
    pharmacopeiaStatus: "Official Philippine Herbal Pharmacopeia (PHP) & PITAHC Priority Medicinal Flora",
    sourceOrganization: "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: "https://pitahc.gov.ph/herbs-directory/",
    imageUrl: "/images/plants/tsaang-gubat.jpg",
    suggestedAuthenticationMethod: "Leaf margin dentation analysis & microphyllone / rosmarinic acid TLC fingerprint",
  },
  turmeric: {
    id: "turmeric",
    slug: "turmeric",
    commonName: "Turmeric",
    scientificName: "Curcuma longa",
    family: "Zingiberaceae",
    localNames: "Dilaw (Tagalog), Luyang Dilaw, Kalawag (Visayan), Kunig (Ilocano), Turmeric",
    botanicalSynonyms: "Curcuma longa L., Curcuma domestica Valeton",
    category: "Anti-inflammatory & Antioxidant",
    documentedParts: ["Rhizomes"],
    traditionalUses:
      "Potent natural anti-inflammatory, antioxidant, hepatoprotective, and carminative folk medicine; relief of osteoarthritis, dyspepsia, and localized wounds.",
    traditionalPreparations:
      "Decoction of sliced fresh rhizome (10-15g boiled in 2 cups of water for 10 minutes) taken twice daily; or topically as poultice of crushed rhizome with virgin coconut oil.",
    safetyNotes:
      "Contraindicated in active biliary duct obstruction. May enhance antithrombotic therapy at pharmacological doses.",
    isPitahc: false,
    pharmacopeiaStatus: "Included in Philippine Herbal Pharmacopeia & WHO Monographs on Selected Medicinal Plants",
    sourceOrganization: "National Integrated Research Program on Medicinal Plants (NIRPROMP)",
    sourceUrl: "https://pitahc.gov.ph",
    imageUrl: "/images/plants/turmeric.jpg",
    suggestedAuthenticationMethod: "Rhizome internal orange-yellow pigmentation check & HPLC curcuminoid triad profiling",
  },
  "ulasimang-bato": {
    id: "ulasimang-bato",
    slug: "ulasimang-bato",
    commonName: "Ulasimang Bato / Pansit-pansitan",
    scientificName: "Peperomia pellucida",
    family: "Piperaceae",
    localNames: "Pansit-pansitan, Shiny Bush, Olasiman-ilahas, Sinaw-sinaw, Tangon-tangon",
    botanicalSynonyms: "Peperomia pellucida (L.) Kunth, Piper pellucidum L.",
    category: "Hyperuricemia & Anti-arthritic",
    documentedParts: ["Aerial parts", "Leaves", "Stems"],
    traditionalUses:
      "Documented in Philippine ethnobotanical practice for lowering elevated blood uric acid, management of acute and chronic gouty arthritis, and mild diuresis.",
    traditionalPreparations:
      "Eat 1 cup of clean, fresh leafy tops as salad twice daily; or boil 1 1/2 cups of chopped fresh plant in 2 glasses of water for 15 minutes; drink 1/3 glass three times daily.",
    safetyNotes:
      "Do not collect from contaminated urban drainage gutters due to succulent plant bioaccumulation of heavy metals. Must be thoroughly washed.",
    isPitahc: true,
    pharmacopeiaStatus: "Official Philippine Herbal Pharmacopeia (PHP) & PITAHC Priority Medicinal Flora",
    sourceOrganization: "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: "https://pitahc.gov.ph/herbs-directory/",
    imageUrl: "/images/plants/ulasimang-bato.jpg",
    suggestedAuthenticationMethod: "Translucent fleshy stem morphology, cordate leaf examination, & pellucidatin assay",
  },
  "yerba-buena": {
    id: "yerba-buena",
    slug: "yerba-buena",
    commonName: "Yerba Buena",
    scientificName: "Mentha cordifolia",
    family: "Lamiaceae",
    localNames: "Hierba Buena, Peppermint, Marsh mint, Polinyo, Herbal Mint",
    botanicalSynonyms: "Mentha cordifolia Opiz ex Fresen., Clinopodium douglasii, Mentha x cordifolia",
    category: "Analgesic & Antispasmodic",
    documentedParts: ["Leaves", "Stems"],
    traditionalUses:
      "Topical and systemic analgesic for headache, toothache, dysmenorrhea, musculoskeletal arthritis, and postoperative discomfort; aromatic carminative for gas and indigestion.",
    traditionalPreparations:
      "Boil 1 cup of chopped fresh leaves in 2 glasses of water for 15 minutes; drink 1/3 glass every 3–4 hours for pain; or crush fresh leaves and apply warm poultice directly over painful area.",
    safetyNotes:
      "Safe for general adult use. Avoid applying pure concentrated essential oil directly to infant nares or facial skin.",
    isPitahc: true,
    pharmacopeiaStatus: "Official Philippine Herbal Pharmacopeia (PHP) & PITAHC Priority Medicinal Flora",
    sourceOrganization: "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: "https://pitahc.gov.ph/herbs-directory/",
    imageUrl: "/images/plants/yerba-buena.jpg",
    suggestedAuthenticationMethod: "Aromatic foliar organoleptic inspection & GC-MS quantification of menthol and menthone",
  },
};

/**
 * Standard plant parts taxonomy for multi-select
 */
export const STANDARD_PLANT_PARTS = [
  "Leaves",
  "Roots",
  "Stems",
  "Bark",
  "Flowers",
  "Fruits",
  "Seeds",
  "Rhizomes",
  "Bulbs",
  "Whole Plant",
  "Other",
] as const;

/**
 * Resolve botanical record by slug, ID, or fuzzy name match
 */
export function getBotanicalPlantRecord(idOrName?: string | null): BotanicalPlantRecord | null {
  if (!idOrName) return null;
  const clean = idOrName.trim().toLowerCase();

  // 1. Direct ID match
  if (VERIFIED_BOTANICAL_REGISTRY[clean]) {
    return VERIFIED_BOTANICAL_REGISTRY[clean];
  }

  // 2. Match against common name or scientific name or synonyms
  for (const plant of Object.values(VERIFIED_BOTANICAL_REGISTRY)) {
    if (
      plant.id === clean ||
      plant.slug === clean ||
      plant.commonName.toLowerCase() === clean ||
      plant.scientificName.toLowerCase() === clean ||
      clean.includes(plant.commonName.toLowerCase()) ||
      clean.includes(plant.scientificName.toLowerCase()) ||
      plant.localNames.toLowerCase().includes(clean) ||
      plant.botanicalSynonyms.toLowerCase().includes(clean)
    ) {
      return plant;
    }
  }

  return null;
}

/**
 * Retrieve all registered botanical plants
 */
export function getAllBotanicalPlants(): BotanicalPlantRecord[] {
  return Object.values(VERIFIED_BOTANICAL_REGISTRY);
}

