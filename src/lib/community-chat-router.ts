/**
 * Community Chat Router & Context Handling Engine
 * 
 * Multilingual, context-aware routing supporting English, Filipino/Tagalog, Taglish,
 * Cebuano, and Ilocano for Ask NatureAide.
 * 
 * Implements strict hierarchy:
 * Emergency/Safety Screen > Explicit Intent > Explicit Entity > Conversational Context > Previous Entity
 */

export type SupportedLanguage = "en" | "fil" | "taglish" | "ceb" | "ilo";

export type ChatIntent =
  | "GREETING"
  | "CONVERSATION"
  | "GENERAL_QUESTION"
  | "GENERAL_KNOWLEDGE"
  | "RESEARCH_EXPLANATION"
  | "USER_NAME_QUERY"
  | "USER_NAME_SET"
  | "PLANT_LOOKUP"
  | "PLANT_FOLLOWUP"
  | "PLANT_COMPARISON"
  | "PRODUCT_LOOKUP"
  | "PRODUCT_FOLLOWUP"
  | "PRODUCTS"
  | "PREPARATION"
  | "SAFETY"
  | "EVIDENCE"
  | "SYMPTOM"
  | "HEALTH_CONCERN"
  | "PROFESSIONAL_CARE"
  | "EMERGENCY"
  | "THANKS"
  | "GOODBYE"
  | "UNCLEAR";

export type AssistantRoute =
  | "CONVERSATION"
  | "GENERAL_KNOWLEDGE"
  | "RESEARCH_EXPLANATION"
  | "NATURAIDE_PLANT"
  | "NATURAIDE_PRODUCT"
  | "NATURAIDE_PREPARATION"
  | "NATURAIDE_SAFETY"
  | "NATURAIDE_EVIDENCE"
  | "PLANT_COMPARISON"
  | "SYMPTOM"
  | "HEALTH_GENERAL"
  | "PROFESSIONAL_CARE"
  | "EMERGENCY";

export type EvidenceLevel =
  | "TRADITIONAL_USE"
  | "MONOGRAPH"
  | "IN_VITRO"
  | "ANIMAL"
  | "PRECLINICAL"
  | "OBSERVATIONAL"
  | "CLINICAL_TRIAL"
  | "SYSTEMATIC_REVIEW"
  | "GUIDELINE";

export interface ConversationEntity {
  type: "PLANT" | "PRODUCT" | "COMPARISON";
  id: string;
  name: string;
  slug?: string;
  scientificName?: string;
  source: "EXPLICIT" | "CONTEXTUAL";
  secondaryPlantId?: string;
  secondaryPlantName?: string;
}

export interface DetectedSymptom {
  key: string;
  nameEn: string;
  nameFil: string;
  associatedPlantIds: string[];
  primaryPlantId: string;
  isRedFlag: boolean;
  warningEn?: string;
  warningFil?: string;
}

/**
 * Normalizes input message for clean intent and entity token analysis.
 */
export function normalizeMessage(message: string): string {
  return (message || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detects the language of the user message.
 */
export function detectLanguage(text: string): SupportedLanguage {
  const norm = normalizeMessage(text);
  const words = norm.split(/\s+/);

  // Cebuano / Bisaya markers
  const cebMarkers = [
    "unsa", "kini", "niana", "tambal", "tanom", "dughan", "ngipon", "lawas",
    "kalibanga", "mangihi", "mabdos", "unsaon", "epekto", "luwas", "dili",
    "makaginhawa", "lisod", "giubo", "nag-ubo"
  ];
  if (cebMarkers.some((m) => norm.includes(m))) {
    return "ceb";
  }

  // Ilocano markers
  const iloMarkers = [
    "ania", "agas", "mula", "ubog", "tian", "kasano", "aramiden",
    "aganges", "marigatan"
  ];
  if (iloMarkers.some((m) => norm.includes(m))) {
    return "ilo";
  }

  // Filipino / Tagalog specific markers
  const filMarkers = [
    "ano", "anong", "mga", "halaman", "halamang", "gamot", "para", "sa", "ng", "ang",
    "ubo", "inuubo", "may", "tiyan", "ulo", "lalamunan", "lagnat", "nito", "nila",
    "ito", "dito", "ba", "po", "opo", "kumusta", "kamusta", "masakit", "paano",
    "ihanda", "gamitin", "bata", "buntis", "ligtas", "meron", "mayroon", "pag-aaral",
    "ebidensya", "pakuluan", "tsaa", "dahon", "sakit", "lason", "nahihirapan", "huminga",
    "buni", "an-an", "alipunga", "manas", "rayuma", "tatae", "nagtatae", "kabag"
  ];

  let filCount = 0;
  for (const w of words) {
    if (filMarkers.includes(w)) filCount++;
  }

  // English markers
  const enMarkers = [
    "what", "is", "are", "how", "the", "for", "with", "can", "should", "does",
    "cough", "stomach", "headache", "safe", "safety", "evidence", "research",
    "prepare", "preparation", "products", "pregnant", "children", "side", "effects"
  ];

  let enCount = 0;
  for (const w of words) {
    if (enMarkers.includes(w)) enCount++;
  }

  if (filCount > 0 && enCount > 0) {
    return "taglish";
  }
  if (filCount > 0) {
    return "fil";
  }
  return "en";
}

/**
 * Detects emergency or high-risk medical safety triggers across English, Filipino, Taglish, and dialects.
 */
export function detectEmergencyOrHighRiskIntent(normalized: string): "EMERGENCY" | "HEALTH_CONCERN" | null {
  const emergencyKeywords = [
    // English
    "emergency",
    "cannot breathe",
    "cant breathe",
    "difficulty breathing",
    "shortness of breath",
    "severe chest pain",
    "chest pain",
    "heart attack",
    "poisoning",
    "poisoned",
    "overdose",
    "unconscious",
    "passed out",
    "loss of consciousness",
    "severe bleeding",
    "bleeding heavily",
    "anaphylaxis",
    "severe allergic reaction",
    "swollen throat",
    "choking",
    "coughing blood",
    "cough blood",
    "blood in cough",
    "vomiting blood",
    "going to faint",
    "feeling faint",

    // Filipino / Tagalog / Taglish
    "nahihirapang huminga",
    "nahihirapan huminga",
    "hirap huminga",
    "di makahinga",
    "hindi makahinga",
    "hindi ako makahinga",
    "di ako makahinga",
    "sumisikip ang dibdib",
    "masakit ang dibdib",
    "paninikip ng dibdib",
    "atake sa puso",
    "umuubo ng dugo",
    "inuubo ng dugo",
    "may dugo ang ubo",
    "may dugo ang inuubo",
    "dumudugo ang ubo",
    "nagsusuka ng dugo",
    "nahimatay",
    "nawalan ng malay",
    "hinihimatay",
    "nalason",
    "lason",
    "sobrang inom ng gamot",
    "namamaga ang lalamunan",
    "matinding allergy",

    // Cebuano
    "dili makaginhawa",
    "lisod iginhawa",
    "naglisod og ginhawa",
    "sakit ang dughan",
    "nag-ubo og dugo",
    "naay dugo ang ubo",
    "nakuyapan",

    // Ilocano
    "marigatan nga aganges",
    "di makaanges",
    "agub-ubor ti dara"
  ];

  for (const kw of emergencyKeywords) {
    if (normalized.includes(kw)) {
      return "EMERGENCY";
    }
  }

  const healthConcernKeywords = [
    // English
    "i feel sick",
    "i have severe",
    "cure my",
    "diagnose",
    "my symptoms are",
    "i am suffering from",
    "treat my infection",
    // Filipino
    "masama ang pakiramdam ko",
    "gamutin ang sakit ko",
    "anong sakit ko"
  ];

  for (const kw of healthConcernKeywords) {
    if (normalized.includes(kw)) {
      return "HEALTH_CONCERN";
    }
  }

  return null;
}

/**
 * Detects common symptoms and retrieves verified associated NatureAide medicinal plants.
 */
export function detectSymptomAndAssociatedPlants(normalized: string): DetectedSymptom | null {
  // 1. Cough / Respiratory
  const coughKeywords = [
    "cough", "coughing", "dry cough", "wet cough", "phlegm",
    "ubo", "inuubo", "may ubo", "may plema", "plema", "ubong", "ubo ko",
    "gi-ubo", "giubo", "nag-ubo"
  ];
  if (coughKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(normalized) || normalized.includes(kw))) {
    return {
      key: "cough",
      nameEn: "Cough & Respiratory Discomfort",
      nameFil: "Ubo at Panlalamig sa Dibdib",
      associatedPlantIds: ["lagundi", "ginger"],
      primaryPlantId: "lagundi",
      isRedFlag: false,
      warningEn: "If accompanied by high fever, difficulty breathing, or coughing blood, seek immediate emergency medical care.",
      warningFil: "Kung may kasamang mataas na lagnat, hirap sa paghinga, o pag-ubo ng dugo, magpatingin agad sa pinakamalapit na pagamutan.",
    };
  }

  // 2. Stomach / Digestive / Diarrhea
  const stomachKeywords = [
    "stomach ache", "stomach pain", "stomach hurts", "abdominal pain", "cramps",
    "diarrhea", "bloated", "bloating", "indigestion", "gut pain",
    "masakit ang tiyan", "sakit ng tiyan", "sakit sa tiyan", "nagtatae", "pagtatae",
    "kabag", "humihilab ang tiyan", "hilab ng tiyan", "kumukulo ang tiyan",
    "sakit ang tiyan", "kalibanga"
  ];
  if (stomachKeywords.some((kw) => normalized.includes(kw))) {
    return {
      key: "stomach",
      nameEn: "Stomach Discomfort & Abdominal Cramps",
      nameFil: "Sakit ng Tiyan at Pagtatae",
      associatedPlantIds: ["tsaang-gubat", "bayabas", "ginger"],
      primaryPlantId: "tsaang-gubat",
      isRedFlag: false,
      warningEn: "Persistent severe abdominal pain, dehydration, or blood in stool requires prompt physician evaluation.",
      warningFil: "Ang patuloy na matinding pananakit ng tiyan, pagkatuyo, o dugo sa dumi ay nangangailangan ng agarang patingin sa doktor.",
    };
  }

  // 3. Headache / Toothache / Pain
  const headacheKeywords = [
    "headache", "head hurts", "toothache", "tooth hurts", "muscle pain", "body ache",
    "masakit ang ulo", "sakit ng ulo", "sakit sa ulo", "masakit ang ngipin", "sakit ng ngipin",
    "pananakit ng katawan", "sakit ang ulo", "sakit ang ngipon"
  ];
  if (headacheKeywords.some((kw) => normalized.includes(kw))) {
    return {
      key: "headache",
      nameEn: "Headache, Toothache & Mild Discomfort",
      nameFil: "Sakit ng Ulo, Ngipin at Pananakit ng Katawan",
      associatedPlantIds: ["yerba-buena"],
      primaryPlantId: "yerba-buena",
      isRedFlag: false,
      warningEn: "Sudden thunderclap headaches, vision changes, or severe neurological symptoms require urgent evaluation.",
      warningFil: "Ang biglaang napakatinding sakit ng ulo na may kasamang pagkahilo o paglabo ng paningin ay nangangailangan ng agarang pagsusuri.",
    };
  }

  // 4. Kidney stones / Urinary / Edema (Manas)
  const kidneyKeywords = [
    "kidney stone", "kidney stones", "urolithiasis", "urinary", "difficulty urinating",
    "edema", "swelling", "water retention",
    "bato sa bato", "bato sa pantog", "manas", "hirap umihi", "masakit umihi",
    "bato sa kidney", "lisod mangihi"
  ];
  if (kidneyKeywords.some((kw) => normalized.includes(kw))) {
    return {
      key: "kidney",
      nameEn: "Urinary Health, Mild Edema & Kidney Support",
      nameFil: "Pangangalaga sa Bato, Ihi at Manas",
      associatedPlantIds: ["sambong"],
      primaryPlantId: "sambong",
      isRedFlag: false,
      warningEn: "Severe flank pain, fever with urinary burning, or inability to pass urine requires urgent medical evaluation.",
      warningFil: "Ang matinding kirot sa tagiliran, lagnat na may kasamang hapdi sa pag-ihi, o hindi maihi ay nangangailangan ng agarang medikal na atensyon.",
    };
  }

  // 5. Blood Sugar / Diabetes
  const diabetesKeywords = [
    "diabetes", "blood sugar", "hyperglycemia", "glucose",
    "asukal sa dugo", "mataas ang asukal", "asukal"
  ];
  if (diabetesKeywords.some((kw) => normalized.includes(kw))) {
    return {
      key: "diabetes",
      nameEn: "Blood Glucose Supportive Care",
      nameFil: "Pangangalaga sa Antas ng Asukal sa Dugo",
      associatedPlantIds: ["ampalaya"],
      primaryPlantId: "ampalaya",
      isRedFlag: false,
      warningEn: "Herbal options are supportive adjuncts and must not replace prescribed anti-diabetic medication or insulin.",
      warningFil: "Ang mga halamang gamot ay pantulong lamang at hindi dapat ipalit sa iniresetang gamot o insulin ng doktor.",
    };
  }

  // 6. Uric Acid / Gout / Joint Discomfort
  const goutKeywords = [
    "uric acid", "gout", "arthritis", "stiff joint", "joint pain",
    "rayuma", "kirot sa kasu-kasuan", "kasu-kasuan", "mataas na uric acid"
  ];
  if (goutKeywords.some((kw) => normalized.includes(kw))) {
    return {
      key: "gout",
      nameEn: "Serum Uric Acid & Joint Discomfort",
      nameFil: "Mataas na Uric Acid at Kirot sa Kasu-kasuan",
      associatedPlantIds: ["ulasimang-bato", "turmeric"],
      primaryPlantId: "ulasimang-bato",
      isRedFlag: false,
    };
  }

  // 7. Skin Fungal / Buni / An-an / Wounds
  const skinKeywords = [
    "fungal", "ringworm", "athlete s foot", "tinea", "skin sore", "wound",
    "buni", "an-an", "alipunga", "sugat", "galis", "makating balat"
  ];
  if (skinKeywords.some((kw) => normalized.includes(kw))) {
    return {
      key: "skin",
      nameEn: "Fungal Skin Discomfort & Antiseptic Care",
      nameFil: "Pangangalaga sa Balat, Buni, An-an at Sugat",
      associatedPlantIds: ["akapulko", "bayabas"],
      primaryPlantId: "akapulko",
      isRedFlag: false,
    };
  }

  // 8. Fever / Lagnat
  const feverKeywords = [
    "fever", "high temperature", "chills",
    "lagnat", "nilalagnat", "sinat", "mataas ang lagnat"
  ];
  if (feverKeywords.some((kw) => normalized.includes(kw))) {
    return {
      key: "fever",
      nameEn: "Mild Fever & Cold Chills",
      nameFil: "Lagnat at Sinat",
      associatedPlantIds: ["lagundi", "ginger"],
      primaryPlantId: "lagundi",
      isRedFlag: false,
      warningEn: "High or prolonged fever exceeding 3 days requires direct clinical evaluation.",
      warningFil: "Ang mataas o pabalik-balik na lagnat na lumalagpas sa 3 araw ay dapat maipatingin sa doktor.",
    };
  }

  return null;
}

/**
 * Detects whether the message is a pure greeting.
 */
export function isGreeting(normalized: string): boolean {
  const greetingExact = [
    "hi", "hello", "hey", "heya", "howdy", "yo", "sup",
    "good morning", "good afternoon", "good evening", "good day",
    "kumusta", "kamusta", "kumusta po", "kamusta po", "hello po", "hi po",
    "magandang araw", "magandang umaga", "magandang hapon", "magandang gabi",
    "hi natureaide", "hello natureaide", "hi naturamide", "hello naturamide"
  ];

  if (greetingExact.includes(normalized)) return true;

  const greetingPrefixes = [
    /^hi\b/, /^hello\b/, /^hey\b/, /^kumusta\b/, /^kamusta\b/,
    /^good (morning|afternoon|evening|day)\b/,
  ];

  for (const regex of greetingPrefixes) {
    if (regex.test(normalized)) {
      const rest = normalized.replace(regex, "").trim();
      if (!rest || /^(there|friend|po|assistant|bot|natureaide|naturamide)$/.test(rest)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects thanks or gratitude messages in English or Filipino.
 */
export function isThanks(normalized: string): boolean {
  const thanksExact = [
    "thanks", "thank you", "thank u", "thx", "ty",
    "salamat", "salamat po", "maraming salamat", "maraming salamat po",
    "daghang salamat", "agyamanak",
    "many thanks", "thanks a lot", "thank you so much",
    "okay thanks", "ok thanks", "ok thank you", "okay thank you"
  ];
  return thanksExact.includes(normalized);
}

/**
 * Detects goodbye / exit messages.
 */
export function isGoodbye(normalized: string): boolean {
  const goodbyeExact = [
    "bye", "goodbye", "bye bye", "byebye", "paalam", "paalam po",
    "babay", "see you", "see ya", "cya", "good night", "take care"
  ];
  return goodbyeExact.includes(normalized);
}

/**
 * Detects conversational chitchat or identity questions.
 */
export function isConversational(normalized: string): boolean {
  const conversationalPhrases = [
    "how are you", "how are you doing", "hows it going", "how is it going",
    "how are things", "how do you do", "whats up", "what is up", "sup",
    "kumusta ka", "kamusta ka", "kumusta ka po", "kamusta ka po",
    "tell me a joke", "tell a joke", "say a joke", "make me laugh", "say something funny",
    "who are you", "who made you", "who created you", "what are you", "sino ka",
    "ano ka", "are you an ai", "what can you do", "ano kaya mong gawin", "anong pwede mong gawin",
    "tell me about yourself", "introduce yourself", "magpakilala ka"
  ];

  for (const phrase of conversationalPhrases) {
    const escaped = phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "i");
    if (pattern.test(normalized)) return true;
  }

  return false;
}

/**
 * Checks if the user is asking what their own name is.
 */
export function isUserNameQuestion(normalized: string): boolean {
  const patterns = [
    /\bwhat is my name\b/, /\bwhats my name\b/, /\bdo you know my name\b/,
    /\bwho am i\b/, /\bremember my name\b/, /\btell me my name\b/,
    /\bkilala mo ba ako\b/, /\bano pangalan ko\b/, /\banong pangalan ko\b/
  ];
  return patterns.some((p) => p.test(normalized));
}

/**
 * Extracts user's introduced name.
 */
export function extractUserNameMention(normalized: string, rawText?: string): string | null {
  const text = rawText || normalized;
  const explicitPatterns = [
    /\bmy name is\s+([A-Za-zÀ-ÿ]+)/i,
    /\bcall me\s+([A-Za-zÀ-ÿ]+)/i,
    /\bako si\s+([A-Za-zÀ-ÿ]+)/i,
    /\bang pangalan ko ay\s+([A-Za-zÀ-ÿ]+)/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const forbidden = ["a", "an", "the", "not", "asking", "user", "guest", "here", "may", "ano"];
      if (candidate.length >= 2 && !forbidden.includes(candidate.toLowerCase())) {
        return candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }
  }

  const iamPattern = /\b(?:i am|i'm|im)\s+([A-Za-zÀ-ÿ]+)/i;
  const iamMatch = text.match(iamPattern);
  if (iamMatch && iamMatch[1]) {
    const candidate = iamMatch[1].trim();
    const commonStates = [
      "sick", "ill", "fine", "good", "well", "okay", "ok", "great",
      "pregnant", "nursing", "breastfeeding", "allergic", "suffering",
      "tired", "hurting", "pain", "here", "curious", "asking", "interested",
      "looking", "wondering", "diabetic", "hypertensive", "experiencing", "a", "an", "the", "coughing"
    ];
    if (candidate.length >= 2 && !commonStates.includes(candidate.toLowerCase())) {
      return candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  return null;
}

/**
 * Detects general conceptual science, botany, or research questions that do not mention a specific plant.
 */
export function isGeneralKnowledgeQuestion(normalized: string): boolean {
  if (isGeneralQuestion(normalized)) return true;

  const generalKnowledgeKeywords = [
    "photosynthesis", "biodiversity", "biological diversity",
    "what is botany", "what is biology", "what is chemistry", "what is science",
    "what is an ecosystem", "how do plants make food", "how do plants grow",
    "why are leaves green", "chlorophyll", "types of research",
    "what is an extract", "ano ang extract", "what is a decoction", "ano ang decoction",
    "what is traditional use", "ano ang traditional use",
    "difference between herbal medicine and supplements", "herbal medicine vs supplement"
  ];

  return generalKnowledgeKeywords.some((kw) => normalized.includes(kw));
}

/**
 * Detects research education questions (molecular docking, binding affinity, phytochemicals, etc.).
 */
export function isResearchEducationQuestion(normalized: string): boolean {
  const researchKeywords = [
    "molecular docking", "docking", "binding affinity",
    "phytochemical", "phytochemicals", "phytochemistry",
    "in-silico", "in silico", "-7", "kcal/mol", "kcal mol",
    "pharmacology", "pharmacognosy", "bioactive", "compounds",
    "what does -7", "what does binding affinity mean", "ano ang molecular docking",
    "ano ang phytochemical"
  ];
  return researchKeywords.some((kw) => normalized.includes(kw));
}

/**
 * Detects general educational questions about medicinal plants or the platform.
 */
export function isGeneralQuestion(normalized: string): boolean {
  const generalPatterns = [
    /\bwhat (is|are) medicinal plants?\b/,
    /\bwhat (is|are) a medicinal plant\b/,
    /\bdefine medicinal plants?\b/,
    /\bmeaning of medicinal plants?\b/,
    /\bwhat (is|are) herbal medicines?\b/,
    /\bano ang (mga )?halamang gamot\b/,
    /\bano ang herbal medicine\b/,
    /\bhow do (medicinal plants|herbal medicines|herbs) work\b/,
    /\bwhat plants are (available|endorsed|included|recommended)\b/,
    /\bwhat medicinal plants do you know\b/,
    /\banong mga halaman(g gamot)? ang alam mo\b/,
    /\banong halamang gamot ang alam mo\b/,
    /\bano ang mga halamang nasa natureaide\b/,
    /\bwhat are (the )?(10|ten) (doh|pitahc) medicinal plants\b/,
    /\blist of medicinal plants\b/,
    /\blista ng mga halamang gamot\b/,
    /\bwhat can you (do|help with)\b/,
    /\bano ang natureaide\b/,
    /\bwhat is natureaide\b/,
    /\babout natureaide\b/,
    /\bwhat is naturamide\b/,
    /\babout naturamide\b/,
    /\bhow to use medicinal plants\b/,
    /\bintroduction to medicinal plants\b/,
    /\bgeneral (rules|precautions) for herbs\b/,
  ];

  return generalPatterns.some((regex) => regex.test(normalized));
}

/**
 * Detects plant comparison intent (e.g. "Lagundi vs Tsaang Gubat", "Ano difference nila").
 */
export function isPlantComparison(normalized: string): boolean {
  const comparisonPatterns = [
    /\bvs\b/, /\bversus\b/,
    /\bdifference\b/,
    /\b(pagkakaiba|pinagkaiba|pagkaiba|pinag-iba)\b/,
    /\balin ang mas\b/, /\bwhich has (more|stronger|better)\b/,
    /\bcompare\b/, /\bipagkumpara\b/, /\bpagkumparahin\b/
  ];
  return comparisonPatterns.some((p) => p.test(normalized));
}

/**
 * Classifies the high-level intent of the user message.
 */
export function classifyIntent(normalized: string): ChatIntent {
  const safety = detectEmergencyOrHighRiskIntent(normalized);
  if (safety === "EMERGENCY") return "EMERGENCY";
  if (safety === "HEALTH_CONCERN") return "HEALTH_CONCERN";

  if (isUserNameQuestion(normalized)) return "USER_NAME_QUERY";
  if (extractUserNameMention(normalized)) return "USER_NAME_SET";

  if (isGreeting(normalized)) return "GREETING";
  if (isThanks(normalized)) return "THANKS";
  if (isGoodbye(normalized)) return "GOODBYE";
  if (isConversational(normalized)) return "CONVERSATION";

  if (isPlantComparison(normalized)) return "PLANT_COMPARISON";
  if (isResearchEducationQuestion(normalized)) return "RESEARCH_EXPLANATION";
  if (isGeneralQuestion(normalized)) return "GENERAL_QUESTION";
  if (isGeneralKnowledgeQuestion(normalized)) return "GENERAL_KNOWLEDGE";

  // Check Symptom intent
  const symptom = detectSymptomAndAssociatedPlants(normalized);
  if (symptom) return "SYMPTOM";

  // Preparation intent across English, Filipino, Taglish
  if (
    normalized.includes("how is it prepared") ||
    normalized.includes("how is this prepared") ||
    normalized.includes("how do i prepare") ||
    normalized.includes("how to prepare") ||
    normalized.includes("paano ihanda") ||
    normalized.includes("paano ito ihanda") ||
    normalized.includes("paano gamitin") ||
    normalized.includes("paano gawin") ||
    normalized.includes("paano gumawa ng tsaa") ||
    normalized.includes("pwede bang pakuluan") ||
    normalized.includes("pwede pakuluan") ||
    normalized.includes("anong parte") ||
    normalized.includes("anong bahagi") ||
    normalized.includes("which part") ||
    normalized.includes("plant part") ||
    normalized.includes("make tea") ||
    normalized.includes("boil the leaves") ||
    normalized.includes("preparation method") ||
    normalized.includes("preparation steps") ||
    normalized.includes("decoction") ||
    normalized.includes("poultice") ||
    normalized.includes("infusion") ||
    normalized.includes("tea method") ||
    normalized.includes("unsaon pag-andam")
  ) {
    return "PREPARATION";
  }

  // Safety / Precaution intent across English, Filipino, Taglish
  if (
    normalized.includes("precaution") ||
    normalized.includes("safety") ||
    normalized.includes("safe ba") ||
    normalized.includes("ligtas ba") ||
    normalized.includes("is it safe") ||
    normalized.includes("safe for") ||
    normalized.includes("side effect") ||
    normalized.includes("side effects") ||
    normalized.includes("contraindication") ||
    normalized.includes("warning") ||
    normalized.includes("pwede ba sa bata") ||
    normalized.includes("pwede sa bata") ||
    normalized.includes("can children use") ||
    normalized.includes("pwede ba sa buntis") ||
    normalized.includes("pwede sa buntis") ||
    normalized.includes("can pregnant") ||
    normalized.includes("buntis") ||
    normalized.includes("pregnant") ||
    normalized.includes("nursing") ||
    normalized.includes("breastfeeding") ||
    normalized.includes("maintenance") ||
    normalized.includes("with my medicine") ||
    normalized.includes("kasabay ng gamot") ||
    normalized.includes("interaksyon") ||
    normalized.includes("interaction") ||
    normalized.includes("who should avoid") ||
    normalized.includes("sino ang hindi dapat") ||
    normalized.includes("who should be careful") ||
    normalized.includes("overdose") ||
    normalized.includes("sobrang inom") ||
    normalized.includes("take too much") ||
    normalized.includes("dose") ||
    normalized.includes("dosage")
  ) {
    return "SAFETY";
  }

  // Evidence / Research intent across English, Filipino, Taglish
  if (
    normalized.includes("clinical benefit") ||
    normalized.includes("verified benefit") ||
    normalized.includes("evidence") ||
    normalized.includes("research") ||
    normalized.includes("study") ||
    normalized.includes("studies") ||
    normalized.includes("may studies ba") ||
    normalized.includes("may research ba") ||
    normalized.includes("may pag-aaral ba") ||
    normalized.includes("pag-aaral") ||
    normalized.includes("ebidensya") ||
    normalized.includes("patunay") ||
    normalized.includes("clinical trial") ||
    normalized.includes("clinical") ||
    normalized.includes("proof") ||
    normalized.includes("pubmed") ||
    normalized.includes("what does research say") ||
    normalized.includes("is it proven") ||
    normalized.includes("scientifically proven") ||
    normalized.includes("scientific evidence") ||
    normalized.includes("saan galing") ||
    normalized.includes("where did this information come from") ||
    normalized.includes("source") ||
    normalized.includes("sources")
  ) {
    return "EVIDENCE";
  }

  // Products intent across English, Filipino, Taglish
  if (
    normalized.includes("products containing") ||
    normalized.includes("what products contain") ||
    normalized.includes("show me products") ||
    normalized.includes("may product ba") ||
    normalized.includes("mga produkto") ||
    normalized.includes("anong produkto") ||
    normalized.includes("available products") ||
    normalized.includes("fda registered") ||
    normalized.includes("registered product") ||
    normalized.includes("commercial product") ||
    normalized.includes("herbal product") ||
    normalized.includes("available brands") ||
    normalized.includes("ascof") ||
    /\b(products?|brands?|syrup|capsule|tablet)\b/.test(normalized)
  ) {
    return "PRODUCTS";
  }

  return "UNCLEAR";
}

/**
 * Known aliases for Philippine medicinal plants and products.
 */
export const PLANT_ALIASES_MAP: Record<string, string[]> = {
  lagundi: ["vitex negundo", "dangla", "five-leaved chaste tree", "five leaved chaste tree"],
  sambong: ["blumea balsamifera", "subusub", "ngai camphor", "gabuen", "lakad-bulan"],
  "tsaang-gubat": ["carmona retusa", "wild tea", "chaang gubat", "fukien tea", "putputay", "forest tea"],
  "yerba-buena": ["mentha cordifolia", "hierba buena", "peppermint", "marsh mint", "mint"],
  ampalaya: ["momordica charantia", "bitter melon", "bitter gourd", "paria", "balsam apple"],
  akapulko: ["senna alata", "cassia alata", "ringworm bush", "katanda", "bikas-bikas"],
  bawang: ["allium sativum", "garlic", "ajos"],
  bayabas: ["psidium guajava", "guava", "kalimbahin", "tayabas"],
  "niyog-niyogan": ["quisqualis indica", "chinese honeysuckle", "combretum indicum", "tartaraok", "balitadham"],
  "ulasimang-bato": ["peperomia pellucida", "pansit-pansitan", "pansit pansitan", "clearweed", "ulasiman"],
  ginger: ["luya", "zingiber officinale"],
  turmeric: ["luyang dilaw", "dilaw", "curcuma longa", "kalawag"],
};

/**
 * Searches the current query for an explicitly named plant or product from the catalog.
 */
export function detectExplicitEntity(
  normalized: string,
  plants: Array<{ id: string; slug?: string; commonName: string; scientificName: string }>,
  products: Array<{ id: string; slug?: string; name: string; brandName?: string }>,
  plantAliases: Record<string, string[]> = {},
  productAliases: Record<string, string[]> = {}
): ConversationEntity | null {
  // 1. Check for plant comparison (e.g., "Lagundi vs Tsaang Gubat", "Ano ang pinagkaiba ng Sambong at Lagundi")
  if (normalized.includes("vs") || normalized.includes("versus") || isPlantComparison(normalized)) {
    const matchedPlants: Array<{ id: string; name: string; slug?: string; scientificName?: string }> = [];

    for (const p of plants) {
      const aliases = [
        p.commonName.toLowerCase().replace(/\s*\([^)]*\)/, "").trim(),
        p.scientificName.toLowerCase().trim(),
        p.slug?.toLowerCase().trim() || "",
        ...(PLANT_ALIASES_MAP[p.id] || []),
        ...(plantAliases[p.id] || [])
      ].filter(Boolean);

      for (const tok of aliases) {
        if (tok.length >= 3 && new RegExp(`\\b${tok.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i").test(normalized)) {
          if (!matchedPlants.some((mp) => mp.id === p.id)) {
            matchedPlants.push({
              id: p.id,
              name: p.commonName,
              slug: p.slug,
              scientificName: p.scientificName,
            });
          }
          break;
        }
      }
    }

    if (matchedPlants.length >= 2) {
      return {
        type: "COMPARISON",
        id: matchedPlants[0].id,
        name: matchedPlants[0].name,
        slug: matchedPlants[0].slug,
        scientificName: matchedPlants[0].scientificName,
        source: "EXPLICIT",
        secondaryPlantId: matchedPlants[1].id,
        secondaryPlantName: matchedPlants[1].name,
      };
    }
  }

  // 2. Check products
  for (const prod of products) {
    const aliases = productAliases[prod.id] || [];
    const tokens = [
      prod.brandName?.toLowerCase(),
      prod.name?.toLowerCase(),
      prod.slug?.toLowerCase(),
      ...aliases,
    ].filter(Boolean) as string[];

    for (const tok of tokens) {
      const cleanTok = tok.toLowerCase().trim();
      if (!cleanTok || cleanTok.length < 3) continue;
      const escaped = cleanTok.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const pattern = new RegExp(`\\b${escaped}\\b`, "i");
      if (pattern.test(normalized)) {
        return {
          type: "PRODUCT",
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          source: "EXPLICIT",
        };
      }
    }
  }

  // 3. Check plants with alias map
  for (const plant of plants) {
    const aliases = [
      ...(plantAliases[plant.id] || []),
      ...(plantAliases[plant.slug || ""] || []),
      ...(PLANT_ALIASES_MAP[plant.id] || []),
      ...(PLANT_ALIASES_MAP[plant.slug || ""] || []),
    ];
    const cleanCommon = plant.commonName.replace(/\s*\([^)]*\)/, "").toLowerCase().trim();
    const tokens = [
      cleanCommon,
      plant.commonName.toLowerCase().trim(),
      plant.scientificName.toLowerCase().trim(),
      plant.slug?.toLowerCase().trim(),
      ...aliases,
    ].filter(Boolean) as string[];

    for (const tok of tokens) {
      const cleanTok = tok.toLowerCase().trim();
      if (!cleanTok || cleanTok.length < 3) continue;
      const escaped = cleanTok.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const pattern = new RegExp(`\\b${escaped}\\b`, "i");
      if (pattern.test(normalized)) {
        return {
          type: "PLANT",
          id: plant.id,
          name: plant.commonName,
          slug: plant.slug,
          scientificName: plant.scientificName,
          source: "EXPLICIT",
        };
      }
    }
  }

  return null;
}

/**
 * Checks whether the message syntactically contains follow-up pronouns or phrases
 * in English, Filipino, Taglish, or dialects.
 */
export function hasFollowUpIndicators(normalized: string): boolean {
  const pronounPatterns = [
    // English
    /\b(it|its)\b/,
    /\b(this|that)\b/,
    /\b(this plant|that plant|the plant)\b/,
    /\b(this herb|that herb|the herb)\b/,
    /\b(this product|that product|the product)\b/,
    /\b(this remedy|that remedy|the remedy)\b/,
    // Filipino / Taglish
    /\b(ito|nito|dito)\b/,
    /\b(ang halaman|halamang ito|itong halaman)\b/,
    /\b(ang produkto|produktong ito|itong produkto)\b/,
    /\b(siya|nila|kanila)\b/,
    // Cebuano
    /\b(kini|niana|kining tanom)\b/
  ];

  if (pronounPatterns.some((p) => p.test(normalized))) {
    return true;
  }

  const followUpPhrases = [
    // English
    "what about its", "how is it", "how do i prepare it", "how to prepare it",
    "what are its", "what about safety", "what are the precautions", "what are the side effects",
    "what does it do", "what part is used", "what evidence supports that", "what studies support that",
    "what products contain it", "tell me more", "what else", "is it safe", "can it help",
    "does it work", "how much to drink", "how much should i take",
    // Filipino
    "ano ang mga gamit nito", "paano ito ihanda", "paano ihanda ito", "paano ito gamitin",
    "ligtas ba ito", "safe ba ito", "may side effects ba ito", "may side effect ba ito",
    "pwede ba ito sa bata", "pwede ba ito sa buntis", "may studies ba tungkol dito",
    "may research ba dito", "may produkto ba nito", "may product ba ito",
    "ano pa ang alam mo dito", "magkwento ka pa tungkol dito", "unsaon pag-andam niini"
  ];

  return followUpPhrases.some((phrase) => normalized.includes(phrase));
}

/**
 * Determines whether the message is a genuine contextual follow-up semantically
 * depending on a previously active entity.
 */
export function isContextualFollowUp(
  normalized: string,
  previousEntity?: { type: "PLANT" | "PRODUCT" | "COMPARISON"; id: string; name: string } | null,
  isEntityEligible: boolean = true
): boolean {
  if (!previousEntity || !isEntityEligible) {
    return false;
  }

  if (hasFollowUpIndicators(normalized)) {
    return true;
  }

  const shortAttributeQueries = [
    // English
    "preparations", "preparation", "precautions", "safety", "side effects",
    "contraindications", "evidence", "research", "studies", "dosage", "dose", "products",
    // Filipino
    "paghahanda", "kaligtasan", "ebidensya", "pag-aaral", "produkto", "mga produkto"
  ];

  return shortAttributeQueries.includes(normalized);
}

/**
 * Evaluates the evidence level of references for a plant or product.
 */
export function assessEvidenceLevel(
  references: Array<{ studyType?: string; title?: string; shortSummary?: string }>
): {
  highestLevel: EvidenceLevel;
  humanClinicalCount: number;
  preclinicalCount: number;
  hasHumanClinical: boolean;
  evidenceSummaryNote: string;
} {
  let humanClinicalCount = 0;
  let preclinicalCount = 0;

  for (const ref of references) {
    const text = `${ref.studyType || ""} ${ref.title || ""} ${ref.shortSummary || ""}`.toLowerCase();
    if (
      text.includes("clinical trial") ||
      text.includes("randomized controlled") ||
      text.includes("human trial") ||
      text.includes("double-blind") ||
      text.includes("patients with")
    ) {
      humanClinicalCount++;
    } else if (
      text.includes("in vivo") ||
      text.includes("in vitro") ||
      text.includes("animal") ||
      text.includes("rat") ||
      text.includes("mice") ||
      text.includes("screening") ||
      text.includes("phytochemical") ||
      text.includes("preclinical")
    ) {
      preclinicalCount++;
    }
  }

  const hasHumanClinical = humanClinicalCount > 0;
  const highestLevel: EvidenceLevel = hasHumanClinical
    ? "CLINICAL_TRIAL"
    : preclinicalCount > 0
    ? "PRECLINICAL"
    : "MONOGRAPH";

  let evidenceSummaryNote = "";
  if (hasHumanClinical) {
    evidenceSummaryNote = `Clinical studies (${humanClinicalCount} on record) have evaluated these benefits in human participants.`;
  } else if (preclinicalCount > 0) {
    evidenceSummaryNote = `NaturAide currently indexes preclinical laboratory and in vivo investigations. These findings support biological activity in experimental models, but should not be described as confirmed clinical effectiveness in humans without dedicated clinical trials.`;
  } else {
    evidenceSummaryNote = `Documented in official Philippine traditional herbal monographs and pharmacopeias.`;
  }

  return {
    highestLevel,
    humanClinicalCount,
    preclinicalCount,
    hasHumanClinical,
    evidenceSummaryNote,
  };
}

/**
 * Sanitizes raw marketing phrases from botanical and commercial product texts.
 */
export function sanitizeEvidenceMarketingLanguage(text: string): string {
  if (!text) return "";
  return text
    .replace(/\bclinically proven and doh-approved\b/gi, "documented in Philippine medicinal-plant references")
    .replace(/\bclinically proven\b/gi, "clinically evaluated")
    .replace(/\bclinically-proven\b/gi, "clinically evaluated")
    .replace(/\bdoh-approved\b/gi, "documented in Philippine health references (DOH/PITAHC)")
    .replace(/\bguaranteed effective\b/gi, "traditionally and scientifically documented")
    .replace(/\beffective cure\b/gi, "documented therapeutic support")
    .replace(/\bproven cure\b/gi, "documented herbal support")
    .replace(/\bproven to dissolve\b/gi, "investigated for antiurolithic activity regarding")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Standard development logger.
 */
export function logRoutingDecision(params: {
  message: string;
  intent: string;
  explicitEntity: string | null;
  previousEntity: string | null;
  isContextualFollowUp: boolean;
  resolvedEntity: string | null;
  route: string;
  language?: string;
}) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`
[AskNaturAide Routing]
MESSAGE: "${params.message}"
INTENT: ${params.intent}
EXPLICIT ENTITY: ${params.explicitEntity ?? "null"}
PREVIOUS ENTITY: ${params.previousEntity ?? "null"}
CONTEXTUAL FOLLOW-UP: ${params.isContextualFollowUp}
RESOLVED ENTITY: ${params.resolvedEntity ?? "null"}
ROUTE: ${params.route}
LANGUAGE: ${params.language ?? "en"}
`);
  }
}
