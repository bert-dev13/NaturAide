export interface SimplePlant {
  id: string;
  commonName: string;
  scientificName: string;
  category: string;
  simpleUse: string;
  badge: string;
  badgeColor: string;
  benefits: string[];
  preparation: string;
  safetyNote: string;
  iconBg: string;
  accentColor: string;
}

export const COMMUNITY_PLANTS: SimplePlant[] = [
  {
    id: "chamomile",
    commonName: "Chamomile",
    scientificName: "Matricaria chamomilla",
    category: "Calm & Sleep",
    simpleUse: "Gentle floral blossom traditionally enjoyed as a calming bedtime tea and for soothing digestion.",
    badge: "Expert Reviewed",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    benefits: ["Promotes peaceful sleep", "Soothes mild stomach tension", "Gentle everyday tea"],
    preparation: "Steep 1–2 teaspoons of dried flowers in hot water for 5–10 minutes.",
    safetyNote: "Generally very safe. Caution if you have severe ragweed allergies.",
    iconBg: "bg-amber-50 text-amber-700 border-amber-200",
    accentColor: "#d97706",
  },
  {
    id: "turmeric",
    commonName: "Turmeric",
    scientificName: "Curcuma longa",
    category: "Joints & Wellness",
    simpleUse: "Vibrant golden root celebrated across generations for supporting healthy joints and natural recovery.",
    badge: "Evidence Backed",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    benefits: ["Supports joint flexibility", "Natural antioxidant support", "Supports post-exercise comfort"],
    preparation: "Often paired with black pepper or healthy fats to help your body absorb its active goodness.",
    safetyNote: "Talk to your doctor if you take strong blood thinners or have gallstones.",
    iconBg: "bg-yellow-50 text-yellow-700 border-yellow-200",
    accentColor: "#ca8a04",
  },
  {
    id: "ashwagandha",
    commonName: "Ashwagandha",
    scientificName: "Withania somnifera",
    category: "Stress & Energy",
    simpleUse: "Revered adaptogen root that helps the mind and body find calm balance during busy, stressful periods.",
    badge: "Evidence Backed",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    benefits: ["Supports stress resilience", "Encourages calm clarity", "Non-drowsy relaxation"],
    preparation: "Traditionally stirred into warm milk or taken as a standardized herbal supplement.",
    safetyNote: "Not recommended during pregnancy. Check with a physician if you have thyroid conditions.",
    iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accentColor: "#15803d",
  },
  {
    id: "ginger",
    commonName: "Ginger",
    scientificName: "Zingiber officinale",
    category: "Digestion & Comfort",
    simpleUse: "Warming, zesty rhizome loved around the world for easing upset stomachs, travel queasiness, and everyday digestion.",
    badge: "Evidence Backed",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    benefits: ["Settles occasional nausea", "Warming digestive comfort", "Supports immune vitality"],
    preparation: "Slice fresh root into hot water with a slice of lemon and a spoonful of honey.",
    safetyNote: "Very well tolerated. Avoid extreme high amounts if you experience acid reflux.",
    iconBg: "bg-orange-50 text-orange-700 border-orange-200",
    accentColor: "#ea580c",
  },
  {
    id: "lavender",
    commonName: "Lavender",
    scientificName: "Lavandula angustifolia",
    category: "Rest & Mood",
    simpleUse: "Aromatic purple botanical prized for its soothing scent, easing everyday restlessness and supporting serene sleep.",
    badge: "Expert Reviewed",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    benefits: ["Soothes evening tension", "Delicate relaxing aroma", "Encourages deeper rest"],
    preparation: "Brew dried culinary buds into a light herbal infusion or inhale as pure essential oil.",
    safetyNote: "Safe for general aromatherapy and gentle teas. Do not ingest pure essential oils directly.",
    iconBg: "bg-purple-50 text-purple-700 border-purple-200",
    accentColor: "#9333ea",
  },
  {
    id: "peppermint",
    commonName: "Peppermint",
    scientificName: "Mentha piperita",
    category: "Fresh Focus",
    simpleUse: "Cooling aromatic herb with natural menthol, ideal for soothing post-meal fullness and refreshing tired minds.",
    badge: "Traditional Favorite",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    benefits: ["Refreshes after meals", "Cooling, clean sensation", "Quick mental pick-me-up"],
    preparation: "Infuse fresh or dried leaves in freshly boiled water for 5 minutes.",
    safetyNote: "Generally very gentle. May worsen heartburn in individuals with severe gastroesophageal reflux.",
    iconBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
    accentColor: "#0891b2",
  },
];

// Compatibility types for previous components if referenced
export interface MedicinalPlant {
  id: string;
  scientificName: string;
  commonName: string;
  family: string;
  category: string;
  activeCompounds: string[];
  primaryTargets: string[];
  dockingScore: string;
  traditionalUse: string;
  evidenceGrade: string;
  clinicalTrialsCount: number;
  safetyIndex: number;
  contraindications: string[];
  preparationType: string;
  summary: string;
}

export const FEATURED_PLANTS: MedicinalPlant[] = [
  {
    id: "withania-somnifera",
    scientificName: "Withania somnifera",
    commonName: "Ashwagandha",
    family: "Solanaceae",
    category: "adaptogen",
    activeCompounds: ["Withanolides", "Withaferin A"],
    primaryTargets: ["Stress Pathways", "GABA Receptors"],
    dockingScore: "-9.2 kcal/mol",
    traditionalUse: "Time-tested tonic for calm and restful sleep.",
    evidenceGrade: "A+",
    clinicalTrialsCount: 42,
    safetyIndex: 9.4,
    contraindications: ["Pregnancy"],
    preparationType: "Root decoction or herbal tea",
    summary: "Time-honored adaptogen for daily calm.",
  },
];

export interface ReviewerProfile {
  name: string;
  role: string;
  institution: string;
  discipline: string;
  verifiedReviews: number;
  avatarText: string;
}

export const EXPERT_REVIEWERS: ReviewerProfile[] = [
  {
    name: "Dr. Elena Rostova",
    role: "Pharmacognosy Specialist",
    institution: "Natural Products Research",
    discipline: "Botanical Research",
    verifiedReviews: 142,
    avatarText: "ER",
  },
];
