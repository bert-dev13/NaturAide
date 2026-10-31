/**
 * Community Chat Router & Context Handling Engine
 * 
 * Implements strict hierarchy:
 * current user intent > current explicit entity > conversational context > previous entity
 */

export type ChatIntent =
  | "GREETING"
  | "CONVERSATION"
  | "GENERAL_QUESTION"
  | "GENERAL_KNOWLEDGE"
  | "USER_NAME_QUERY"
  | "USER_NAME_SET"
  | "PLANT_LOOKUP"
  | "PLANT_FOLLOWUP"
  | "PRODUCT_LOOKUP"
  | "PRODUCT_FOLLOWUP"
  | "PRODUCTS"
  | "PREPARATION"
  | "SAFETY"
  | "EVIDENCE"
  | "HEALTH_CONCERN"
  | "EMERGENCY"
  | "THANKS"
  | "GOODBYE"
  | "UNCLEAR";

export type AssistantRoute =
  | "CONVERSATION"
  | "GENERAL_KNOWLEDGE"
  | "NATURAIDE_PLANT"
  | "NATURAIDE_PRODUCT"
  | "NATURAIDE_PREPARATION"
  | "NATURAIDE_SAFETY"
  | "NATURAIDE_EVIDENCE"
  | "HEALTH_GENERAL"
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
  type: "PLANT" | "PRODUCT";
  id: string;
  name: string;
  slug?: string;
  scientificName?: string;
  source: "EXPLICIT" | "CONTEXTUAL";
}

export interface ConversationTurnSummary {
  sender: "USER" | "ASSISTANT";
  content: string;
  intent?: ChatIntent;
  entityId?: string | null;
  entityType?: "PLANT" | "PRODUCT" | "NONE";
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
 * Detects emergency or high-risk medical safety triggers.
 */
export function detectEmergencyOrHighRiskIntent(normalized: string): "EMERGENCY" | "HEALTH_CONCERN" | null {
  const emergencyKeywords = [
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
    "severe bleeding",
    "bleeding heavily",
    "anaphylaxis",
    "severe allergic reaction",
    "swollen throat",
    "choking",
  ];

  for (const kw of emergencyKeywords) {
    if (normalized.includes(kw)) {
      return "EMERGENCY";
    }
  }

  const healthConcernKeywords = [
    "i feel sick",
    "i have severe",
    "cure my",
    "diagnose",
    "my symptoms are",
    "i am suffering from",
    "treat my infection",
  ];

  for (const kw of healthConcernKeywords) {
    if (normalized.includes(kw)) {
      return "HEALTH_CONCERN";
    }
  }

  return null;
}

/**
 * Detects whether the message is a pure greeting.
 * Greetings: hi, hello, hey, good morning, good afternoon, kumusta, kamusta, etc.
 */
export function isGreeting(normalized: string): boolean {
  const greetingExact = [
    "hi",
    "hello",
    "hey",
    "heya",
    "howdy",
    "yo",
    "sup",
    "good morning",
    "good afternoon",
    "good evening",
    "good day",
    "kumusta",
    "kamusta",
    "kumusta po",
    "kamusta po",
    "hello po",
    "hi po",
    "magandang araw",
    "magandang umaga",
    "magandang hapon",
    "magandang gabi",
    "hi naturamide",
    "hello naturamide",
    "hi naturamide",
    "hello naturamide",
  ];

  if (greetingExact.includes(normalized)) return true;

  // Pattern checks for greetings at start with greeting only or trivial punctuation
  const greetingPrefixes = [
    /^hi\b/,
    /^hello\b/,
    /^hey\b/,
    /^kumusta\b/,
    /^kamusta\b/,
    /^good (morning|afternoon|evening|day)\b/,
  ];

  for (const regex of greetingPrefixes) {
    if (regex.test(normalized)) {
      const rest = normalized.replace(regex, "").trim();
      // If the rest is empty or just generic salutation like "there", "friend", "po", "bot", "assistant"
      if (!rest || /^(there|friend|po|assistant|bot|naturamide)$/.test(rest)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects thanks or gratitude messages.
 */
export function isThanks(normalized: string): boolean {
  const thanksExact = [
    "thanks",
    "thank you",
    "thank u",
    "thx",
    "ty",
    "salamat",
    "salamat po",
    "maraming salamat",
    "maraming salamat po",
    "many thanks",
    "thanks a lot",
    "thank you so much",
    "okay thanks",
    "ok thanks",
    "ok thank you",
    "okay thank you",
  ];

  return thanksExact.includes(normalized);
}

/**
 * Detects goodbye / exit messages.
 */
export function isGoodbye(normalized: string): boolean {
  const goodbyeExact = [
    "bye",
    "goodbye",
    "bye bye",
    "byebye",
    "paalam",
    "paalam po",
    "see you",
    "see ya",
    "cya",
    "good night",
    "take care",
  ];

  return goodbyeExact.includes(normalized);
}

/**
 * Detects general conversational questions like "how are you", "tell me a joke", "who are you".
 */
export function isConversational(normalized: string): boolean {
  const conversationalPhrases = [
    "how are you",
    "how are you doing",
    "hows it going",
    "how is it going",
    "how are things",
    "how do you do",
    "whats up",
    "what is up",
    "sup",
    "kumusta ka",
    "kamusta ka",
    "tell me a joke",
    "tell a joke",
    "say a joke",
    "make me laugh",
    "say something funny",
    "who are you",
    "who made you",
    "who created you",
    "what are you",
    "are you an ai",
    "what can you do",
    "tell me about yourself",
    "introduce yourself",
  ];

  for (const phrase of conversationalPhrases) {
    const escaped = phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "i");
    if (pattern.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the user is asking what their own name is.
 */
export function isUserNameQuestion(normalized: string): boolean {
  const patterns = [
    /\bwhat is my name\b/,
    /\bwhats my name\b/,
    /\bdo you know my name\b/,
    /\bwho am i\b/,
    /\bremember my name\b/,
    /\btell me my name\b/,
  ];
  return patterns.some((p) => p.test(normalized));
}

/**
 * Extracts user's introduced name from messages like:
 * "My name is Maria", "I am Juan", "Call me Alex", "Ako si Ana"
 */
export function extractUserNameMention(normalized: string, rawText?: string): string | null {
  const text = rawText || normalized;

  // Patterns: "my name is [Name]", "call me [Name]", "ako si [Name]"
  const explicitPatterns = [
    /\bmy name is\s+([A-Za-zÀ-ÿ]+)/i,
    /\bcall me\s+([A-Za-zÀ-ÿ]+)/i,
    /\bako si\s+([A-Za-zÀ-ÿ]+)/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const forbidden = ["a", "an", "the", "not", "asking", "user", "guest", "here"];
      if (candidate.length >= 2 && !forbidden.includes(candidate.toLowerCase())) {
        return candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }
  }

  // "I am [Name]" or "I'm [Name]" - require capital letter or check against health/state words
  const iamPattern = /\b(?:i am|i'm|im)\s+([A-Za-zÀ-ÿ]+)/i;
  const iamMatch = text.match(iamPattern);
  if (iamMatch && iamMatch[1]) {
    const candidate = iamMatch[1].trim();
    const commonStates = [
      "sick", "ill", "fine", "good", "well", "okay", "ok", "great",
      "pregnant", "nursing", "breastfeeding", "allergic", "suffering",
      "tired", "hurting", "pain", "here", "curious", "asking", "interested",
      "looking", "wondering", "diabetic", "hypertensive", "experiencing", "a", "an", "the"
    ];
    if (candidate.length >= 2 && !commonStates.includes(candidate.toLowerCase())) {
      // If raw text has uppercase first letter or user explicitly introduced themselves
      return candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  return null;
}

/**
 * Detects general conceptual science, botany, or research questions that do not mention a specific plant.
 * e.g., "what is photosynthesis", "what is biodiversity", "what are medicinal plants".
 */
export function isGeneralKnowledgeQuestion(normalized: string): boolean {
  if (isGeneralQuestion(normalized)) {
    return true;
  }

  const generalKnowledgeKeywords = [
    "photosynthesis",
    "biodiversity",
    "biological diversity",
    "what is botany",
    "what is biology",
    "what is chemistry",
    "what is science",
    "what is an ecosystem",
    "how do plants make food",
    "how do plants grow",
    "why are leaves green",
    "chlorophyll",
    "what kinds of research are used",
    "types of research",
    "what is a clinical trial",
    "what is in vitro",
    "what is in vivo",
    "what is a randomized controlled trial",
    "what is preclinical",
  ];

  for (const kw of generalKnowledgeKeywords) {
    if (normalized.includes(kw)) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitizes raw marketing phrases from botanical and commercial product texts
 * to maintain strict scientific and regulatory objectivity.
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
 * Determines the architectural AssistantRoute for a given query and context.
 */
export function determineAssistantRoute(
  normalized: string,
  explicitEntity: ConversationEntity | null,
  previousEntity: { type: "PLANT" | "PRODUCT"; id: string; name: string } | null,
  isFollowUp: boolean
): AssistantRoute {
  if (detectEmergencyOrHighRiskIntent(normalized) === "EMERGENCY") {
    return "EMERGENCY";
  }

  // If no explicit entity and not a contextual follow-up, check conversational and general knowledge
  if (!explicitEntity && !isFollowUp) {
    if (
      isGreeting(normalized) ||
      isThanks(normalized) ||
      isGoodbye(normalized) ||
      isConversational(normalized) ||
      isUserNameQuestion(normalized) ||
      extractUserNameMention(normalized) !== null
    ) {
      return "CONVERSATION";
    }

    if (isGeneralKnowledgeQuestion(normalized)) {
      return "GENERAL_KNOWLEDGE";
    }

    if (detectEmergencyOrHighRiskIntent(normalized) === "HEALTH_CONCERN") {
      return "HEALTH_GENERAL";
    }
  }

  // Active entity resolution
  const resolved = explicitEntity || (isFollowUp ? previousEntity : null);
  if (resolved) {
    if (resolved.type === "PRODUCT") {
      return "NATURAIDE_PRODUCT";
    }
    const intent = classifyIntent(normalized);
    if (intent === "PREPARATION") return "NATURAIDE_PREPARATION";
    if (intent === "SAFETY" || intent === "HEALTH_CONCERN") return "NATURAIDE_SAFETY";
    if (intent === "EVIDENCE") return "NATURAIDE_EVIDENCE";
    if (intent === "PRODUCTS") return "NATURAIDE_PRODUCT";
    return "NATURAIDE_PLANT";
  }

  if (isGeneralKnowledgeQuestion(normalized)) {
    return "GENERAL_KNOWLEDGE";
  }

  if (detectEmergencyOrHighRiskIntent(normalized) === "HEALTH_CONCERN") {
    return "HEALTH_GENERAL";
  }

  return "CONVERSATION";
}

/**
 * Detects general, conceptual educational questions about medicinal plants or platform.
 * e.g., "what is medicinal plants", "what are medicinal plants", "how do herbs work".
 */
export function isGeneralQuestion(normalized: string): boolean {
  const generalPatterns = [
    /\bwhat (is|are) medicinal plants?\b/,
    /\bwhat (is|are) a medicinal plant\b/,
    /\bdefine medicinal plants?\b/,
    /\bmeaning of medicinal plants?\b/,
    /\bwhat (is|are) herbal medicines?\b/,
    /\bhow do (medicinal plants|herbal medicines|herbs) work\b/,
    /\bwhat plants are (available|endorsed|included|recommended)\b/,
    /\bwhat are (the )?(10|ten) (doh|pitahc) medicinal plants\b/,
    /\blist of medicinal plants\b/,
    /\bwhat can you (do|help with)\b/,
    /\bwhat is naturamide\b/,
    /\babout naturamide\b/,
    /\bhow to use medicinal plants\b/,
    /\bintroduction to medicinal plants\b/,
    /\bgeneral (rules|precautions) for herbs\b/,
  ];

  return generalPatterns.some((regex) => regex.test(normalized));
}

/**
 * Classifies the high-level intent of the current normalized message.
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
  if (isGeneralQuestion(normalized)) return "GENERAL_QUESTION";
  if (isGeneralKnowledgeQuestion(normalized)) return "GENERAL_KNOWLEDGE";

  // Preparation intent
  if (
    normalized.includes("how is it prepared") ||
    normalized.includes("how is this prepared") ||
    normalized.includes("how do i prepare") ||
    normalized.includes("how to prepare") ||
    normalized.includes("preparation method") ||
    normalized.includes("preparation steps") ||
    normalized.includes("how to cook") ||
    normalized.includes("how to brew") ||
    normalized.includes("decoction") ||
    normalized.includes("poultice") ||
    normalized.includes("infusion") ||
    normalized.includes("tea method")
  ) {
    return "PREPARATION";
  }

  // Safety / Precaution intent
  if (
    normalized.includes("precaution") ||
    normalized.includes("safety") ||
    normalized.includes("side effect") ||
    normalized.includes("contraindication") ||
    normalized.includes("warning") ||
    normalized.includes("is it safe") ||
    normalized.includes("safe for") ||
    normalized.includes("who should avoid") ||
    normalized.includes("who should be careful") ||
    normalized.includes("pregnant") ||
    normalized.includes("pregnancy") ||
    normalized.includes("nursing") ||
    normalized.includes("breastfeeding") ||
    normalized.includes("dose") ||
    normalized.includes("dosage") ||
    normalized.includes("interaction") ||
    normalized.includes("overdose")
  ) {
    return "SAFETY";
  }

  // Evidence / Research intent
  if (
    normalized.includes("clinical benefit") ||
    normalized.includes("verified benefit") ||
    normalized.includes("evidence") ||
    normalized.includes("research") ||
    normalized.includes("study") ||
    normalized.includes("studies") ||
    normalized.includes("clinical trial") ||
    normalized.includes("clinical") ||
    normalized.includes("proof") ||
    normalized.includes("pubmed") ||
    normalized.includes("what does research say") ||
    normalized.includes("is it proven") ||
    normalized.includes("scientific evidence")
  ) {
    return "EVIDENCE";
  }

  // Products intent
  if (
    normalized.includes("products containing") ||
    normalized.includes("what products contain") ||
    normalized.includes("show me products") ||
    /show (me|us).*\bproducts?\b/.test(normalized) ||
    normalized.includes("does it have products") ||
    normalized.includes("commercial product") ||
    normalized.includes("herbal product") ||
    normalized.includes("available brands") ||
    normalized.includes("registered products") ||
    /\b(products?|brands?|syrup|capsule|tablet)\b/.test(normalized)
  ) {
    return "PRODUCTS";
  }

  return "UNCLEAR";
}

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
  // 1. Check products first
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
      // Word boundary regex check
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

  // 2. Check plants
  for (const plant of plants) {
    const aliases = plantAliases[plant.id] || plantAliases[plant.slug || ""] || [];
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
 * (independent of whether an entity is actually currently available).
 */
export function hasFollowUpIndicators(normalized: string): boolean {
  const pronounPatterns = [
    /\b(it|its)\b/,
    /\b(this|that)\b/,
    /\b(this plant|that plant|the plant)\b/,
    /\b(this herb|that herb|the herb)\b/,
    /\b(this product|that product|the product)\b/,
    /\b(this remedy|that remedy|the remedy)\b/,
  ];

  if (pronounPatterns.some((p) => p.test(normalized))) {
    return true;
  }

  const followUpPhrases = [
    "what about its",
    "how is it",
    "how do i prepare it",
    "how to prepare it",
    "what are its",
    "what about safety",
    "what are the precautions",
    "what are the side effects",
    "what does it do",
    "what part is used",
    "what evidence supports that",
    "what studies support that",
    "what products contain it",
    "tell me more",
    "what else",
    "is it safe",
    "can it help",
    "does it work",
    "how much to drink",
    "how much should i take",
  ];

  for (const phrase of followUpPhrases) {
    if (normalized.includes(phrase)) {
      return true;
    }
  }

  return false;
}

/**
 * Determines whether the message is a genuine contextual follow-up semantically
 * depending on a previously active entity.
 */
export function isContextualFollowUp(
  normalized: string,
  previousEntity?: { type: "PLANT" | "PRODUCT"; id: string; name: string } | null,
  isEntityEligible: boolean = true
): boolean {
  if (!previousEntity || !isEntityEligible) {
    return false;
  }

  if (hasFollowUpIndicators(normalized)) {
    return true;
  }

  // Attribute queries without naming the plant (e.g., user just says "preparations", "dosage", "side effects")
  const shortAttributeQueries = [
    "preparations",
    "preparation",
    "precautions",
    "side effects",
    "contraindications",
    "evidence",
    "research",
    "dosage",
    "dose",
    "products",
  ];

  if (shortAttributeQueries.includes(normalized)) {
    return true;
  }

  return false;
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
 * Standard development logger conforming to prompt specification.
 */
export function logRoutingDecision(params: {
  message: string;
  intent: string;
  explicitEntity: string | null;
  previousEntity: string | null;
  isContextualFollowUp: boolean;
  resolvedEntity: string | null;
  route: string;
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
`);
  }
}
