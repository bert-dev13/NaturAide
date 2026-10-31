import pool from "./db";
import { callGrokChat, isGrokConfigured, getGrokDiagnostics, GrokDiagnostics } from "./ai/grok-provider";
import {
  ChatIntent,
  AssistantRoute,
  EvidenceLevel,
  classifyIntent,
  detectExplicitEntity,
  isContextualFollowUp,
  hasFollowUpIndicators,
  assessEvidenceLevel,
  logRoutingDecision,
  normalizeMessage,
  detectEmergencyOrHighRiskIntent,
  isGreeting,
  isThanks,
  isGoodbye,
  isConversational,
  isUserNameQuestion,
  extractUserNameMention,
  isGeneralKnowledgeQuestion,
  sanitizeEvidenceMarketingLanguage,
  determineAssistantRoute,
} from "./community-chat-router";

export interface ModelCandidate {
  id: string;
  name: string;
  role: "PRIMARY" | "FALLBACK";
}

export const DEFAULT_MODELS: ModelCandidate[] = [
  {
    id: process.env.XAI_MODEL || "grok-4.7",
    name: "xAI Grok",
    role: "PRIMARY",
  },
  {
    id: "natureaide-grounded-engine",
    name: "NaturAide Grounded Engine",
    role: "FALLBACK",
  },
];

export { getGrokDiagnostics, isGrokConfigured, type GrokDiagnostics };

export const MANDATORY_DISCLAIMER =
  "NaturAide provides educational and evidence-based information and is not intended to diagnose medical conditions, prescribe treatment, or replace professional medical care.";

export interface ContextualAction {
  label: string;
  query?: string;
  href?: string;
  isExternal?: boolean;
}

export interface MetricItem {
  icon: "leaf" | "coffee" | "book" | "package" | "shield" | "pill";
  label: string;
  value: string;
}

export interface ContextCard {
  type: "PLANT" | "PRODUCT" | "PREPARATION" | "SAFETY" | "EVIDENCE" | "NONE" | "GENERAL";
  title: string;
  subtitle?: string;
  entityId?: string;
  entitySlug?: string;
  metrics?: MetricItem[];
  actions?: ContextualAction[];
}

export interface ActiveContextResolution {
  activeType: "PLANT" | "PRODUCT" | "PREPARATION" | "NONE";
  plantId: string | null;
  productId: string | null;
  preparationId?: string | null;
  activeEntityName: string | null;
  activeEntitySlug: string | null;
  intent: string;
  isUnknownEntity: boolean;
  knowledgeContextText: string;
  cardData: ContextCard | null;
  groundedFallbackAnswer?: string;
  assistantDirectAnswer?: string;
  routeTaken?: string;
}

export async function resolveContextAndKnowledge(
  userQuery: string,
  persistedContext?: {
    currentPlantId?: string | null;
    currentProductId?: string | null;
    currentPreparationId?: string | null;
    activeContextType?: string;
    isEntityEligible?: boolean;
    recentMessages?: Array<{ sender: string; content: string; metadata?: unknown }>;
    userName?: string | null;
  }
): Promise<ActiveContextResolution> {
  const normalized = normalizeMessage(userQuery);
  const rawIntent = classifyIntent(normalized);

  // Resolve known user name from persistedContext or recent message history
  let knownUserName: string | null = persistedContext?.userName || null;
  if (!knownUserName && persistedContext?.recentMessages) {
    for (const m of persistedContext.recentMessages) {
      if (m.sender === "USER" && m.content) {
        const extracted = extractUserNameMention(normalizeMessage(m.content), m.content);
        if (extracted) {
          knownUserName = extracted;
          break;
        }
      }
    }
  }

  // 1. Load published plants and products from verified MySQL knowledge base
  const [plantRows]: any = await pool.query(
    `SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.simpleUse, p.preparation, p.safetyNote,
            p.botanical_synonyms, p.local_names, p.plant_parts_used, p.source_organization, p.source_url, p.is_pitahc,
            g.about, g.traditionalUses, g.whatResearchSays, g.commonPreparation,
            g.safetyInformation, g.whoShouldBeCareful, g.medicineInteractions, g.whenToConsultDoctor,
            g.preclinical_evidence, g.clinical_evidence, g.contraindications, g.documented_uses
     FROM plants p
     LEFT JOIN plant_guides g ON g.plantId = p.id AND (g.is_community_visible = 1 OR g.is_community_visible IS NULL)
     ORDER BY p.commonName ASC`
  );

  const [productRows]: any = await pool.query(
    `SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.dosageForm, hp.dosageStrength,
            hp.productType, hp.productClassification, hp.isMultiIngredient,
            hp.description, hp.intendedUse, hp.usageInstructions, hp.warningsPrecautions, hp.preparationGuide
     FROM herbal_products hp
     WHERE hp.isPublished = 1
     ORDER BY hp.name ASC`
  );

  // Botanical Aliases for PITAHC Plants + Preserved Plants
  const plantAliases: Record<string, string[]> = {
    akapulko: ["akapulko", "senna alata", "cassia alata", "katanda", "palochina", "ringworm bush", "candle bush", "andadasi"],
    ampalaya: ["ampalaya", "momordica charantia", "bitter melon", "bitter gourd", "paria", "palia"],
    bawang: ["bawang", "garlic", "allium sativum", "porrum sativum", "ajos"],
    bayabas: ["bayabas", "guava", "psidium guajava", "kalimbahin", "tayabas", "biabas"],
    lagundi: ["lagundi", "vitex negundo", "vitex", "dangla", "five-leaved chaste tree", "dab-daban"],
    "niyog-niyogan": ["niyog-niyogan", "niyog niyogan", "niyogniyogan", "quisqualis indica", "combretum indicum", "chinese honeysuckle", "tartaraok", "balitadham"],
    sambong: ["sambong", "blumea balsamifera", "subusub", "alimon", "kaliban", "camphor blumea"],
    "tsaang-gubat": ["tsaang gubat", "tsaang-gubat", "carmona retusa", "ehretia microphylla", "wild tea", "forest tea", "putputay", "alangitngit"],
    "ulasimang-bato": ["ulasimang bato", "ulasimang-bato", "pansit-pansitan", "pansit pansitan", "pansitpansitan", "peperomia pellucida", "shiny bush"],
    "yerba-buena": ["yerba buena", "yerba-buena", "clinopodium douglasii", "mentha cordifolia", "hierba buena", "marsh mint", "peppermint"],
    turmeric: ["turmeric", "luyang dilaw", "curcuma longa", "dilaw", "yellow ginger"],
    ginger: ["ginger", "luya", "zingiber officinale", "salabat"],
  };

  // Product Aliases
  const productAliases: Record<string, string[]> = {
    "ascof-lagundi-syrup": ["ascof", "ascof lagundi", "ascof lagundi syrup", "pascual laboratories ascof"],
    "ascof-forte-lagundi-tablet": ["ascof forte", "ascof tablet", "ascof 600mg"],
    "plemex-forte-lagundi-syrup": ["plemex", "plemex forte", "plemex lagundi", "plemex for kids"],
    "ritemed-lagundi-capsule": ["ritemed lagundi", "ritemed capsule", "ritemed 600mg"],
    "nocof-lagundi-syrup": ["nocof", "nocof syrup", "nocof lagundi"],
    "actimed-lagundi-syrup": ["actimed", "actimed lagundi", "actimed syrup"],
    "pitahc-lagundi-tablet": ["pitahc lagundi", "pitahc lagundi tablet", "hmr-166"],
    "re-leaf-sambong-tablet": ["re-leaf", "releaf", "re-leaf sambong", "releaf sambong", "re-leaf sambong tablet"],
    "uricare-sambong-tablet": ["uricare", "uricare sambong", "ajanta pharma uricare"],
    "urisam-sambong-tablet": ["urisam", "urisam sambong", "unilab urisam"],
    "kidneygen-forte-sambong-tablet": ["kidneygen", "kidneygen forte"],
    "pitahc-sambong-tablet": ["pitahc sambong", "pitahc sambong tablet", "dr-xy14201"],
    "charantia-ampalaya-capsule": ["charantia", "charantia ampalaya", "charantia capsule", "herbcare ampalaya"],
    "bitteractive-ampalaya-capsule": ["bitteractive", "bitteractive ampalaya", "nurturemed ampalaya"],
    "better-ampalaya-capsule": ["better ampalaya", "better ampalaya-500", "ap pharma ampalaya"],
    "diavit-herbs-capsule": ["diavit", "diavit herbs", "diavit ampalaya"],
    "nirpromp-tsaang-gubat-tablet": ["nirpromp tsaang gubat", "tsaang gubat tablet", "tsaang gubat 500mg"],
    "nirpromp-akapulko-lotion": ["nirpromp akapulko", "akapulko lotion", "akapulko antifungal lotion"],
    "guavidone-bayabas-povidone-iodine-antiseptic": ["guavidone", "guavidone bayabas", "guavidone antiseptic"],
    "propan-fit-garlic-capsule": ["propan fit", "propan fit garlic", "propan softgel"],
    "atc-garlic-oil-softgel": ["atc garlic oil", "atc garlic", "atc healthcare garlic"],
    "nirpromp-yerba-buena-infusion": ["nirpromp yerba buena", "yerba buena infusion"],
    "dok-natural-ulasimang-bato-pansit-pansitan-drops": ["dok natural ulasimang bato", "pansit-pansitan drops"],
    "belle-vine-ulasimang-bato-pansit-pansitan-capsule": ["belle vine", "bellevine", "bellevine ulasimang bato"],
    "tolak-angin-herbal-liquid": ["tolak angin", "tolakangin", "tolak angin herbal liquid", "sido muncul"],
    "san-san-instant-salabat-ginger-tea": ["san san", "san san salabat"],
    "yamang-bukid-turmeric-10-in-1-tea": ["yamang bukid", "yamang bukid turmeric"],
    "botanical-lagundi-leaf-tea": ["traditional lagundi leaf tea", "luzon herbal lagundi"],
  };

  // 2. Detect Explicit Entity in current user query
  const explicitEntity = detectExplicitEntity(normalized, plantRows, productRows, plantAliases, productAliases);

  // 3. PRIORITY ROUTE: Emergency
  if (rawIntent === "EMERGENCY") {
    const direct = "⚠️ EMERGENCY MEDICAL NOTICE: If you or someone you are with is experiencing severe difficulty breathing, acute chest pain, suspected poisoning, severe allergic reaction, or uncontrollable bleeding, please seek immediate emergency care at the nearest hospital or emergency room. NaturAide is an educational informational database and cannot handle medical emergencies.";
    logRoutingDecision({
      message: userQuery,
      intent: "EMERGENCY",
      explicitEntity: explicitEntity ? explicitEntity.name : null,
      previousEntity: persistedContext?.currentPlantId ?? null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "EMERGENCY_SAFETY_HANDLER",
    });
    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "EMERGENCY",
      isUnknownEntity: false,
      knowledgeContextText: "EMERGENCY NOTICE: Immediate medical attention required.",
      cardData: null,
      assistantDirectAnswer: direct,
      groundedFallbackAnswer: direct,
      routeTaken: "EMERGENCY_SAFETY_HANDLER",
    };
  }

  // 4. PRIORITY ROUTE: User introducing name without explicit entity
  const nameMentioned = extractUserNameMention(normalized, userQuery);
  if (nameMentioned && !explicitEntity) {
    knownUserName = nameMentioned;
    const direct = `Nice to meet you, ${knownUserName}! 😊 How can I help you today? You can ask me about Philippine medicinal plants, herbal products, traditional preparations, safety precautions, or general science topics.`;
    logRoutingDecision({
      message: userQuery,
      intent: "USER_NAME_SET",
      explicitEntity: null,
      previousEntity: persistedContext?.currentPlantId ?? null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "CONVERSATION_HANDLER",
    });
    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "CONVERSATION",
      isUnknownEntity: false,
      knowledgeContextText: `User introduced their name as ${knownUserName}.`,
      cardData: null,
      assistantDirectAnswer: direct,
      groundedFallbackAnswer: direct,
      routeTaken: "CONVERSATION_HANDLER",
    };
  }

  // 5. PRIORITY ROUTE: User asking what their name is without explicit entity
  if (isUserNameQuestion(normalized) && !explicitEntity) {
    const direct = knownUserName
      ? `Your name is ${knownUserName}.`
      : "I don't know your name yet! You can tell me by saying something like 'My name is [Your Name]'.";
    logRoutingDecision({
      message: userQuery,
      intent: "USER_NAME_QUERY",
      explicitEntity: null,
      previousEntity: persistedContext?.currentPlantId ?? null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "CONVERSATION_HANDLER",
    });
    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "CONVERSATION",
      isUnknownEntity: false,
      knowledgeContextText: knownUserName ? `User's name is ${knownUserName}.` : "User's name is not yet specified.",
      cardData: null,
      assistantDirectAnswer: direct,
      groundedFallbackAnswer: direct,
      routeTaken: "CONVERSATION_HANDLER",
    };
  }

  // 6. PRIORITY ROUTE: Pure Greetings without explicit entity
  if (rawIntent === "GREETING" && !explicitEntity) {
    const direct = "Hi! 👋 I'm NaturAide. You can ask me about Philippine medicinal plants, traditional preparation, safety precautions, scientific evidence, or herbal products.";
    logRoutingDecision({
      message: userQuery,
      intent: "GREETING",
      explicitEntity: null,
      previousEntity: persistedContext?.currentPlantId ?? null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "GREETING_HANDLER",
    });
    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "GREETING",
      isUnknownEntity: false,
      knowledgeContextText: "Friendly greeting from NaturAide educational botanical assistant.",
      cardData: null,
      assistantDirectAnswer: direct,
      groundedFallbackAnswer: direct,
      routeTaken: "GREETING_HANDLER",
    };
  }

  // 7. PRIORITY ROUTE: Casual Conversation (how are you, tell me a joke, who are you) without explicit entity
  if (isConversational(normalized) && !explicitEntity) {
    let direct = "";
    if (normalized.includes("joke") || normalized.includes("laugh") || normalized.includes("funny")) {
      direct = "Why did the leaf go to the doctor?\nBecause it was feeling a little green! 🍃😄\n\nHow else can I brighten your day or help you explore nature?";
    } else if (
      normalized.includes("how are you") ||
      normalized.includes("how r u") ||
      normalized.includes("hows it going") ||
      normalized.includes("how is it going") ||
      normalized.includes("whats up") ||
      normalized.includes("what is up") ||
      normalized.includes("how do you do") ||
      normalized.includes("kumusta ka") ||
      normalized.includes("kamusta ka")
    ) {
      direct = "I'm doing well, thank you for asking! 😊 How are you doing today? Let me know what you'd like to explore or talk about.";
    } else if (
      normalized.includes("who are you") ||
      normalized.includes("who made you") ||
      normalized.includes("what are you") ||
      normalized.includes("tell me about yourself")
    ) {
      direct = "I am Ask NaturAide, your friendly conversational AI assistant! 🌿 I can chat with you naturally, explain general science and botany concepts, and provide verified, evidence-grounded information on Philippine medicinal plants, registered herbal products, traditional preparations, and safety.";
    } else {
      direct = "I'm doing well and always excited to chat, answer questions, and explore nature, science, or Philippine medicinal plants with you! What's on your mind?";
    }

    logRoutingDecision({
      message: userQuery,
      intent: "CONVERSATION",
      explicitEntity: null,
      previousEntity: persistedContext?.currentPlantId ?? null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "CONVERSATION_HANDLER",
    });
    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "CONVERSATION",
      isUnknownEntity: false,
      knowledgeContextText: direct,
      cardData: null,
      assistantDirectAnswer: direct,
      groundedFallbackAnswer: direct,
      routeTaken: "CONVERSATION_HANDLER",
    };
  }

  // 8. PRIORITY ROUTE: Thanks / Gratitude without explicit entity
  if (rawIntent === "THANKS" && !explicitEntity) {
    const direct = "You're welcome! 🌿 Let me know if you'd like to explore another medicinal plant, traditional preparation, or check safety information.";
    logRoutingDecision({
      message: userQuery,
      intent: "THANKS",
      explicitEntity: null,
      previousEntity: persistedContext?.currentPlantId ?? null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "THANKS_HANDLER",
    });
    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "THANKS",
      isUnknownEntity: false,
      knowledgeContextText: "Courteous acknowledgement of user gratitude.",
      cardData: null,
      assistantDirectAnswer: direct,
      groundedFallbackAnswer: direct,
      routeTaken: "THANKS_HANDLER",
    };
  }

  // 9. PRIORITY ROUTE: Goodbye without explicit entity
  if (rawIntent === "GOODBYE" && !explicitEntity) {
    const direct = "Take care! 🌿 Stay safe and feel free to return whenever you have questions about Philippine medicinal plants.";
    logRoutingDecision({
      message: userQuery,
      intent: "GOODBYE",
      explicitEntity: null,
      previousEntity: persistedContext?.currentPlantId ?? null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "GOODBYE_HANDLER",
    });
    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "GOODBYE",
      isUnknownEntity: false,
      knowledgeContextText: "Courteous farewell to user.",
      cardData: null,
      assistantDirectAnswer: direct,
      groundedFallbackAnswer: direct,
      routeTaken: "GOODBYE_HANDLER",
    };
  }

  // 10. PRIORITY ROUTE: General Informational / Science Question without explicit entity
  if ((rawIntent === "GENERAL_QUESTION" || rawIntent === "GENERAL_KNOWLEDGE" || isGeneralKnowledgeQuestion(normalized)) && !explicitEntity) {
    let direct = "";
    if (normalized.includes("photosynthesis")) {
      direct = "Photosynthesis is the biological process by which green plants, algae, and certain bacteria convert sunlight, water, and carbon dioxide into oxygen and chemical energy in the form of glucose. It takes place primarily in leaves within specialized cellular structures called chloroplasts, which contain the green pigment chlorophyll.";
    } else if (normalized.includes("biodiversity")) {
      direct = "Biodiversity (biological diversity) refers to the variety and variability of all life on Earth. It spans three interconnected levels: genetic diversity within species, species diversity (the variety of plants, animals, fungi, and microorganisms), and ecosystem diversity (such as rainforests, coral reefs, and mangroves).";
    } else if (
      normalized.includes("what is medicinal plants") ||
      normalized.includes("what are medicinal plants") ||
      normalized.includes("what is a medicinal plant") ||
      normalized.includes("define medicinal plant") ||
      normalized.includes("meaning of medicinal plant")
    ) {
      direct = "Medicinal plants are plants traditionally or scientifically used for their potential health-related properties. NaturAide can help you explore Philippine medicinal plants, their documented uses, preparation methods, precautions, and available scientific evidence.";
    } else if (
      normalized.includes("research") ||
      normalized.includes("clinical trial") ||
      normalized.includes("in vitro") ||
      normalized.includes("in vivo")
    ) {
      direct = "Scientific evidence in herbal medicine spans several stages: laboratory preclinical studies (in vitro and in vivo animal models) evaluate biological activity and mechanisms, while human clinical trials (such as randomized controlled trials) evaluate safety, efficacy, and dosage in human participants. Official pharmacopeias and monographs summarize this total body of evidence.";
    } else {
      direct = "Medicinal plants are plants traditionally or scientifically used for their potential health-related properties. NaturAide can help you explore Philippine medicinal plants, their documented uses, preparation methods, precautions, and available scientific evidence.";
    }

    logRoutingDecision({
      message: userQuery,
      intent: rawIntent === "GENERAL_QUESTION" ? "GENERAL_QUESTION" : "GENERAL_KNOWLEDGE",
      explicitEntity: null,
      previousEntity: persistedContext?.currentPlantId ?? null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "GENERAL_QUESTION_HANDLER",
    });
    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: rawIntent === "GENERAL_QUESTION" ? "GENERAL_QUESTION" : "GENERAL_KNOWLEDGE",
      isUnknownEntity: false,
      knowledgeContextText: direct,
      cardData: null,
      assistantDirectAnswer: direct,
      groundedFallbackAnswer: direct,
      routeTaken: "GENERAL_QUESTION_HANDLER",
    };
  }

  // 8. RESOLVE ENTITY HIERARCHY
  // Hierarchy: explicitEntity > contextualEntity (if eligible follow-up) > null
  let activePlant: any = null;
  let activeProduct: any = null;
  let activeType: "PLANT" | "PRODUCT" | "PREPARATION" | "NONE" = "NONE";

  const isEligible = persistedContext?.isEntityEligible !== false;

  const previousPlant = persistedContext?.currentPlantId
    ? plantRows.find((p: any) => p.id === persistedContext.currentPlantId || p.slug === persistedContext.currentPlantId)
    : null;
  const previousProduct = persistedContext?.currentProductId
    ? productRows.find((p: any) => p.id === persistedContext.currentProductId || p.slug === persistedContext.currentProductId)
    : null;
  const previousEntity = previousPlant
    ? { type: "PLANT" as const, id: previousPlant.id, name: previousPlant.commonName }
    : previousProduct
    ? { type: "PRODUCT" as const, id: previousProduct.id, name: previousProduct.name }
    : null;

  if (explicitEntity) {
    // Explicit entity ALWAYS supersedes previous context
    if (explicitEntity.type === "PRODUCT") {
      activeProduct = productRows.find((p: any) => p.id === explicitEntity.id || p.slug === explicitEntity.id);
      activeType = "PRODUCT";
    } else {
      activePlant = plantRows.find((p: any) => p.id === explicitEntity.id || p.slug === explicitEntity.id);
      activeType = "PLANT";
    }
  } else {
    // Check whether this message is a genuine contextual follow-up
    const isFollowUp = isContextualFollowUp(normalized, previousEntity, isEligible);

    if (isFollowUp && isEligible && previousEntity) {
      if (previousEntity.type === "PRODUCT" && previousProduct) {
        activeProduct = previousProduct;
        activeType = "PRODUCT";
      } else if (previousEntity.type === "PLANT" && previousPlant) {
        activePlant = previousPlant;
        activeType = "PLANT";
      }
    } else if (hasFollowUpIndicators(normalized) && (!isEligible || !previousEntity)) {
      // User used follow-up pronouns (e.g. "What are its precautions?") but previous topic was broken/general
      const direct = "Which medicinal plant would you like precautions for? You can ask about Sambong, Lagundi, Ampalaya, or any of our 10 PITAHC medicinal plants.";
      logRoutingDecision({
        message: userQuery,
        intent: "SAFETY",
        explicitEntity: null,
        previousEntity: previousEntity ? previousEntity.name : null,
        isContextualFollowUp: true,
        resolvedEntity: null,
        route: "AMBIGUOUS_FOLLOWUP_DISAMBIGUATION",
      });
      return {
        activeType: "NONE",
        plantId: null,
        productId: null,
        activeEntityName: null,
        activeEntitySlug: null,
        intent: "AMBIGUOUS",
        isUnknownEntity: false,
        knowledgeContextText: "Prompt user for specific medicinal plant disambiguation.",
        cardData: null,
        assistantDirectAnswer: direct,
        groundedFallbackAnswer: direct,
        routeTaken: "AMBIGUOUS_FOLLOWUP_DISAMBIGUATION",
      };
    }
  }

  // 11. If NO active plant and NO active product resolved:
  if (!activePlant && !activeProduct) {
    const direct = "I can chat with you, explain general nature and science concepts, or provide verified educational information on Philippine medicinal plants, registered herbal products, traditional preparations, safety precautions, and scientific evidence. What would you like to explore?";

    logRoutingDecision({
      message: userQuery,
      intent: rawIntent,
      explicitEntity: null,
      previousEntity: previousEntity ? previousEntity.name : null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "CONVERSATIONAL_FALLBACK_HANDLER",
    });

    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "GENERAL",
      isUnknownEntity: false,
      knowledgeContextText: direct,
      cardData: null,
      assistantDirectAnswer: direct,
      groundedFallbackAnswer: direct,
      routeTaken: "CONVERSATIONAL_FALLBACK_HANDLER",
    };
  }

  // 10. Map sub-intent for active entity
  let intent: ActiveContextResolution["intent"] = "OVERVIEW";
  if (rawIntent === "PREPARATION") intent = "PREPARATION";
  else if (rawIntent === "SAFETY") intent = "SAFETY";
  else if (rawIntent === "EVIDENCE") intent = "EVIDENCE";
  else if (rawIntent === "PRODUCTS") intent = "PRODUCTS";
  else if (rawIntent === "HEALTH_CONCERN") intent = "SAFETY";

  // 11. Process ACTIVE PLANT
  if (activeType === "PLANT" && activePlant) {
    const [preps]: any = await pool.query(
      `SELECT id, title, preparation_type, plant_part_used, traditional_use_context, description,
              administration_instructions, when_to_seek_guidance
       FROM traditional_preparations
       WHERE plant_id = ? AND status = 'PUBLISHED'
       ORDER BY id ASC`,
      [activePlant.id]
    );

    const cleanCommon = activePlant.commonName.replace(/\s*\([^)]*\)/, "").trim();
    const [refs]: any = await pool.query(
      `SELECT sr.id, sr.pubmedId, sr.doi, sr.title, sr.authors, sr.publicationYear,
              sr.journalOrPublisher, sr.studyType, sr.shortSummary, sr.evidence_scope
       FROM scientific_references sr
       WHERE sr.source_verified = 1
         AND (sr.plantOrIngredientStudied LIKE ? OR sr.plantOrIngredientStudied LIKE ?)
       ORDER BY sr.publicationYear DESC`,
      [`%${cleanCommon}%`, `%${activePlant.scientificName}%`]
    );

    const [prods]: any = await pool.query(
      `SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.dosageForm, hp.dosageStrength,
              hp.productClassification, hp.isMultiIngredient,
              prr.registrationNumber, prr.registrationStatus
       FROM herbal_products hp
       JOIN product_plants pp ON pp.productId = hp.id
       LEFT JOIN product_regulatory_records prr ON prr.productId = hp.id
       WHERE pp.plantId = ? AND hp.isPublished = 1
       ORDER BY hp.name ASC`,
      [activePlant.id]
    );

    const plantPart = activePlant.plant_parts_used || preps[0]?.plant_part_used || "Leaves";
    const prepCount = preps.length;
    const refCount = refs.length;
    const prodCount = prods.length;

    let groundedFallbackAnswer = "";
    let assistantDirectAnswer: string | undefined = undefined;
    let cardData: ContextCard | null = null;

    if (intent === "PREPARATION") {
      if (prepCount === 0) {
        groundedFallbackAnswer = `I don't currently have a verified traditional preparation guide for ${activePlant.commonName} in the NaturAide knowledge base.`;
      } else {
        const p1 = preps[0];
        groundedFallbackAnswer = `${activePlant.commonName} (${activePlant.scientificName}) has ${prepCount} verified traditional preparation ${prepCount === 1 ? "method" : "methods"} documented in Philippine health monographs. The primary part used is ${plantPart}. ${p1.description || ""}`;
      }
      assistantDirectAnswer = groundedFallbackAnswer;
      cardData = {
        type: "PREPARATION",
        title: `${activePlant.commonName} Traditional Preparation`,
        subtitle: preps[0] ? `${preps[0].title} (${preps[0].preparation_type})` : undefined,
        entityId: activePlant.id,
        entitySlug: activePlant.slug,
        metrics: [
          { icon: "leaf", label: "Plant Part", value: plantPart },
          { icon: "coffee", label: "Documented Methods", value: `${prepCount} method${prepCount === 1 ? "" : "s"}` },
          { icon: "shield", label: "Safety Note", value: "Consult physician if symptoms persist" },
        ],
        actions: [
          { label: "Documented Uses", query: `What are the documented uses of ${activePlant.commonName}?` },
          { label: "Safety & Precautions", query: `What are the safety precautions for ${activePlant.commonName}?` },
          { label: "Related Products", query: `What products contain ${activePlant.commonName}?` },
          { label: `View Full Preparation Guide →`, href: `/community/plants/${activePlant.slug || activePlant.id}/preparation` },
        ],
      };
    } else if (intent === "SAFETY") {
      const safetyText = activePlant.contraindications || activePlant.safetyInformation || activePlant.safetyNote || "Consult a qualified physician prior to use.";
      groundedFallbackAnswer = `For ${activePlant.commonName} (${activePlant.scientificName}), documented safety precautions note: ${safetyText}`;
      assistantDirectAnswer = groundedFallbackAnswer;
      cardData = {
        type: "SAFETY",
        title: `${activePlant.commonName} Safety & Precautions`,
        entityId: activePlant.id,
        entitySlug: activePlant.slug,
        metrics: [
          { icon: "shield", label: "Contraindications", value: activePlant.contraindications || "None specifically recorded" },
          { icon: "leaf", label: "Sensitive Groups", value: activePlant.whoShouldBeCareful || "Pregnant/nursing women seek guidance" },
        ],
        actions: [
          { label: "Traditional Preparation", query: `How is ${activePlant.commonName} prepared?` },
          { label: "Research & Evidence", query: `Show me the research for ${activePlant.commonName}` },
          { label: "Related Products", query: `What products contain ${activePlant.commonName}?` },
          { label: `View ${activePlant.commonName} Details →`, href: `/community/plants/${activePlant.slug || activePlant.id}` },
        ],
      };
    } else if (intent === "PRODUCTS") {
      if (prodCount === 0) {
        groundedFallbackAnswer = `No currently verified commercial products associated with ${activePlant.commonName} were found in the NaturAide knowledge base.`;
      } else {
        const prodNames = prods.slice(0, 3).map((p: any) => p.name).join(", ");
        groundedFallbackAnswer = `${activePlant.commonName} is an active ingredient in ${prodCount} verified commercial herbal ${prodCount === 1 ? "product" : "products"} on record, including ${prodNames}.`;
      }
      assistantDirectAnswer = groundedFallbackAnswer;
      cardData = {
        type: "PRODUCT",
        title: `Products Containing ${activePlant.commonName}`,
        entityId: activePlant.id,
        entitySlug: activePlant.slug,
        metrics: [
          { icon: "package", label: "Verified Products", value: `${prodCount} registered` },
          { icon: "leaf", label: "Medicinal Plant", value: `${activePlant.commonName} (${activePlant.scientificName})` },
        ],
        actions: [
          ...prods.slice(0, 2).map((p: any) => ({
            label: `View ${p.brandName || p.name} →`,
            href: `/community/products/${p.slug || p.id}`,
          })),
          { label: "Traditional Preparation", query: `How is ${activePlant.commonName} prepared?` },
          { label: `Explore All ${activePlant.commonName} Products →`, href: `/community/herbal-guide?tab=products` },
        ],
      };
    } else if (intent === "EVIDENCE") {
      const evidenceAssessment = assessEvidenceLevel(refs);
      const isKidneyQuestion = normalized.includes("kidney") || normalized.includes("urolithiasis") || normalized.includes("stone") || normalized.includes("renal");
      const isCountQuestion = normalized.includes("how many") && (normalized.includes("stud") || normalized.includes("research") || normalized.includes("citation") || normalized.includes("reference"));
      const isClinicalTrialSpecific = normalized.includes("clinical trial") || normalized.includes("clinical study") || normalized.includes("human trial");

      if (isCountQuestion) {
        groundedFallbackAnswer = `NaturAide currently indexes exactly ${refCount} verified scientific ${refCount === 1 ? "reference" : "references"} on record for ${activePlant.commonName} (${activePlant.scientificName}).`;
      } else if (isClinicalTrialSpecific && !evidenceAssessment.hasHumanClinical) {
        groundedFallbackAnswer = `NaturAide currently has 0 human clinical trials indexed for ${activePlant.commonName} (${activePlant.scientificName}). The indexed evidence (${refCount} references) consists of preclinical laboratory evaluations and official Philippine herbal monograph documentation regarding traditional uses. Findings in experimental models should not be described as confirmed human clinical outcomes without dedicated clinical trials.`;
      } else if (!evidenceAssessment.hasHumanClinical) {
        if (activePlant.id === "sambong" && isKidneyQuestion) {
          groundedFallbackAnswer = `NaturAide currently indexes ${refCount} peer-reviewed references and official Philippine monograph records for Sambong (Blumea balsamifera). While traditional use and preclinical studies investigate its diuretic and antiurolithic activity for urinary and kidney health, these findings are preclinical and monograph-documented rather than confirmed human clinical trial outcomes. Consult a licensed physician for any renal concerns.`;
        } else {
          groundedFallbackAnswer = `NaturAide currently indexes ${refCount} verified scientific citations for ${activePlant.commonName} (${activePlant.scientificName}). The indexed evidence consists of preclinical laboratory and pharmacological evaluations (${evidenceAssessment.evidenceSummaryNote}). Therapeutic benefits should not be described as confirmed human clinical outcomes without dedicated clinical trials.`;
        }
      } else {
        groundedFallbackAnswer = `${activePlant.commonName} (${activePlant.scientificName}) has ${refCount} verified scientific citations indexed in NaturAide, including ${evidenceAssessment.humanClinicalCount} human clinical evaluations on file.`;
      }
      assistantDirectAnswer = groundedFallbackAnswer;

      cardData = {
        type: "EVIDENCE",
        title: `${activePlant.commonName} Research & Scientific Evidence`,
        entityId: activePlant.id,
        entitySlug: activePlant.slug,
        metrics: [
          { icon: "book", label: "Indexed Citations", value: `${refCount} verified citations` },
          { icon: "leaf", label: "Clinical Evidence", value: evidenceAssessment.hasHumanClinical ? `${evidenceAssessment.humanClinicalCount} clinical trials` : "Preclinical / Monograph" },
        ],
        actions: [
          { label: "Traditional Preparation", query: `How is ${activePlant.commonName} prepared?` },
          { label: "Safety Precautions", query: `What are the safety precautions for ${activePlant.commonName}?` },
          { label: `View ${activePlant.commonName} Monograph →`, href: `/community/plants/${activePlant.slug || activePlant.id}` },
        ],
      };
    } else {
      // OVERVIEW
      const rawUse = activePlant.simpleUse || activePlant.category;
      const sanitizedUse = sanitizeEvidenceMarketingLanguage(rawUse);
      groundedFallbackAnswer = `${activePlant.commonName} (${activePlant.scientificName}) is a medicinal plant documented in Philippine medicinal-plant references for ${sanitizedUse}.`;
      assistantDirectAnswer = groundedFallbackAnswer;
      cardData = {
        type: "PLANT",
        title: `${activePlant.commonName} (${activePlant.scientificName})`,
        entityId: activePlant.id,
        entitySlug: activePlant.slug,
        metrics: [
          { icon: "leaf", label: "Plant Part", value: plantPart },
          { icon: "coffee", label: "Preparation", value: prepCount > 0 ? `${prepCount} documented ${prepCount === 1 ? "method" : "methods"}` : "None on record" },
          { icon: "book", label: "Research", value: refCount > 0 ? "Evidence available" : "Monograph only" },
          { icon: "package", label: "Related Products", value: String(prodCount) },
        ],
        actions: [
          { label: "Traditional Preparation", query: `How is ${activePlant.commonName} prepared?` },
          { label: "Documented Uses", query: `What are the documented uses of ${activePlant.commonName}?` },
          { label: "Safety", query: `What about its safety?` },
          { label: "Research & Evidence", query: `Show me the research for ${activePlant.commonName}` },
          { label: "Herbal Products", query: `What products contain ${activePlant.commonName}?` },
          { label: `View ${activePlant.commonName} →`, href: `/community/plants/${activePlant.slug || activePlant.id}` },
        ],
      };
    }

    const knowledgeContextText = `
CURRENT VERIFIED MEDICINAL PLANT IN FOCUS:
- Name: ${activePlant.commonName} (${activePlant.scientificName})
- Documented Uses: ${activePlant.simpleUse || activePlant.category}
- Plant Part Used: ${plantPart}
- Documented Preparations Count: ${prepCount}
- Verified Research Count: ${refCount}
- Related Commercial Products Count: ${prodCount}
- Precautions: ${activePlant.safetyInformation || activePlant.safetyNote || "Consult a doctor prior to use."}
`;

    logRoutingDecision({
      message: userQuery,
      intent,
      explicitEntity: explicitEntity ? explicitEntity.name : null,
      previousEntity: previousEntity ? previousEntity.name : null,
      isContextualFollowUp: !explicitEntity && Boolean(previousEntity),
      resolvedEntity: activePlant.commonName,
      route: explicitEntity ? "EXPLICIT_PLANT_HANDLER" : `CONTEXTUAL_PLANT_${intent}`,
    });

    return {
      activeType: "PLANT",
      plantId: activePlant.id,
      productId: null,
      activeEntityName: activePlant.commonName,
      activeEntitySlug: activePlant.slug,
      intent,
      isUnknownEntity: false,
      knowledgeContextText,
      cardData,
      assistantDirectAnswer,
      groundedFallbackAnswer,
      routeTaken: explicitEntity ? "EXPLICIT_PLANT_HANDLER" : `CONTEXTUAL_PLANT_${intent}`,
    };
  }

  // 12. Process ACTIVE PRODUCT
  const [linkedPlants]: any = await pool.query(
    `SELECT p.id, p.slug, p.commonName, p.scientificName
     FROM product_plants pp
     JOIN plants p ON p.id = pp.plantId
     WHERE pp.productId = ?`,
    [activeProduct.id]
  );
  const mainPlant = linkedPlants[0] || null;
  const mainPlantName = mainPlant ? `${mainPlant.commonName} (${mainPlant.scientificName})` : "Active Botanical";

  const [regRows]: any = await pool.query(
    `SELECT registrationNumber, registrationStatus, regulatoryAgency FROM product_regulatory_records WHERE productId = ? LIMIT 1`,
    [activeProduct.id]
  );
  const regRecord = regRows[0] || null;

  const [productRefs]: any = await pool.query(
    `SELECT sr.id, sr.title, sr.authors, sr.publicationYear, sr.studyType
     FROM product_references pr
     JOIN scientific_references sr ON pr.referenceId = sr.id
     WHERE pr.productId = ? AND sr.source_verified = 1`,
    [activeProduct.id]
  );

  let groundedFallbackAnswer = `${activeProduct.name} is a commercial ${activeProduct.productType || "herbal preparation"} (${activeProduct.dosageForm}) manufactured by ${activeProduct.manufacturer}, containing ${mainPlantName}.`;
  let cardData: ContextCard | null = {
    type: "PRODUCT",
    title: activeProduct.name,
    subtitle: `Manufacturer: ${activeProduct.manufacturer}`,
    entityId: activeProduct.id,
    entitySlug: activeProduct.slug,
    metrics: [
      { icon: "pill", label: "Form & Strength", value: `${activeProduct.dosageForm} ${activeProduct.dosageStrength ? `(${activeProduct.dosageStrength})` : ""}` },
      { icon: "leaf", label: "Main Herb", value: mainPlant ? mainPlant.commonName : "Botanical" },
      { icon: "shield", label: "Regulatory", value: regRecord ? `CPR #${regRecord.registrationNumber} (${regRecord.registrationStatus})` : "Verified" },
      { icon: "book", label: "Research", value: `${productRefs.length} Verified Sources` },
    ],
    actions: [
      { label: "Main Ingredient", query: `What is the main ingredient of ${activeProduct.name}?` },
      { label: "Registration Info", query: `Is registration information available for ${activeProduct.name}?` },
      { label: "Research Evidence", query: `What research supports ${activeProduct.name}?` },
      { label: "Warnings & Precautions", query: `What are the warnings for ${activeProduct.name}?` },
      ...(mainPlant ? [{ label: `View ${mainPlant.commonName} Plant`, href: `/community/plants/${mainPlant.slug || mainPlant.id}` }] : []),
      { label: `View Product →`, href: `/community/products/${activeProduct.slug || activeProduct.id}` },
    ],
  };

  const knowledgeContextText = `
CURRENT VERIFIED COMMERCIAL PRODUCT IN FOCUS:
- Product Name: ${activeProduct.name}
- Brand / Manufacturer: ${activeProduct.brandName} (${activeProduct.manufacturer})
- Dosage Form: ${activeProduct.dosageForm} ${activeProduct.dosageStrength ? `(${activeProduct.dosageStrength})` : ""}
- Contained Plant: ${mainPlantName}
- Registration: ${regRecord ? `${regRecord.regulatoryAgency} #${regRecord.registrationNumber} (${regRecord.registrationStatus})` : "Verified"}
`;

  logRoutingDecision({
    message: userQuery,
    intent,
    explicitEntity: explicitEntity ? explicitEntity.name : null,
    previousEntity: previousEntity ? previousEntity.name : null,
    isContextualFollowUp: !explicitEntity && Boolean(previousEntity),
    resolvedEntity: activeProduct.name,
    route: explicitEntity ? "EXPLICIT_PRODUCT_HANDLER" : `CONTEXTUAL_PRODUCT_${intent}`,
  });

  return {
    activeType: "PRODUCT",
    plantId: null,
    productId: activeProduct.id,
    activeEntityName: activeProduct.name,
    activeEntitySlug: activeProduct.slug,
    intent,
    isUnknownEntity: false,
    knowledgeContextText,
    cardData,
    groundedFallbackAnswer,
    routeTaken: explicitEntity ? "EXPLICIT_PRODUCT_HANDLER" : `CONTEXTUAL_PRODUCT_${intent}`,
  };
}

export interface ChatMessageParam {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateResult {
  content: string;
  modelUsed: string;
  fallbackCount: number;
  modelsAttempted: string[];
  error?: string;
  fallbackReason?: string;
}

/**
 * Executes a grounded chat completion request.
 * Primary: xAI Grok (server-side only)
 * Fallback: NaturAide Deterministic Grounded Engine
 */
export async function executeChatWithFallback(
  messages: ChatMessageParam[],
  fallbackText?: string
): Promise<GenerateResult> {
  const defaultFallbackAnswer =
    fallbackText ||
    "NaturAide provides verified factual information from Philippine health authorities (DOH and PITAHC). Verified information for this specific query is not currently available in the NaturAide knowledge base.";

  const configuredModel = process.env.XAI_MODEL || "grok-4.7";

  // Primary: Call xAI Grok
  const grokRes = await callGrokChat(messages);
  if (grokRes.success && grokRes.content) {
    return {
      content: grokRes.content,
      modelUsed: grokRes.model,
      fallbackCount: 0,
      modelsAttempted: [grokRes.model],
    };
  }

  // Fallback: NaturAide Local Grounded Engine
  return {
    content: defaultFallbackAnswer,
    modelUsed: "natureaide-grounded-engine",
    fallbackCount: 1,
    modelsAttempted: [configuredModel, "natureaide-grounded-engine"],
    fallbackReason: grokRes.error,
  };
}

/**
 * Builds the server-side system instruction contract enforcing zero-fabrication
 * and strict scientific / medical boundaries.
 */
export function buildSystemPrompt(
  screeningOutcome: "ELIGIBLE_TO_CONTINUE" | "PROFESSIONAL_GUIDANCE_REQUIRED" | "NO_SCREENING",
  knowledgeContextText: string,
  activeContextTypeOrUnknown?: string | boolean,
  isUnknownEntity?: boolean,
  userName?: string | null
): string {
  const isUnknown =
    typeof activeContextTypeOrUnknown === "boolean"
      ? activeContextTypeOrUnknown
      : Boolean(isUnknownEntity);

  return `You are Ask NaturAide, a conversational AI assistant for the NaturAide platform, blending conversational versatility with strict evidence-based grounding in NaturAide's curated botanical and health knowledge base.

${userName ? `The user's name is ${userName}. When asked or appropriate, you may address them warmly.` : ""}

CONVERSATION & GENERAL KNOWLEDGE:
- You engage in natural, helpful, and friendly conversation (answering greetings, "how are you", telling clean nature/botanical jokes, explaining general concepts like photosynthesis, biodiversity, science, and ecology).
- You can explain general concepts clearly, concisely, and educationally.
- When answering casual chat, user identity, or general science/nature questions, respond naturally without forcing medicinal plant facts or attaching cards.

MEDICINAL PLANTS & VERIFIED KNOWLEDGE GROUNDING:
- When the discussion is about Philippine medicinal plants, herbal products, traditional preparations, safety precautions, or scientific evidence, ground your answers strictly in the verified NaturAide context provided below.
- Never fabricate: citations, authors, journals, years, DOIs, PMIDs, clinical trials, drug interactions, dosages, preparation quantities, contraindications, chemical identifiers, ADME predictions, toxicity predictions, docking results, PDB IDs, binding affinities, laboratory findings, regulatory approval, product claims.
- Do not diagnose disease.
- Do not prescribe treatment.
- Do not tell users to stop or replace prescribed medication.
- Clearly distinguish educational information from professional medical advice.
- If the question requires individualized medical judgment, recommend consulting an appropriate licensed healthcare professional.
- Never use absolute marketing phrases such as "clinically proven", "guaranteed effective", or "proven to dissolve kidney stones" unless the supplied context explicitly documents human clinical trials.
- A citation being "verified" means only that NaturAide has indexed and validated the reference source; it does NOT mean the plant's health claim is clinically proven in humans.
- If evidence is classified as PRECLINICAL, ANIMAL, IN VITRO, or MONOGRAPH, explicitly describe it as preclinical, animal, or monograph documentation. Do NOT upgrade evidence strength.
- When answering questions about clinical benefits: directly address the actual benefits/therapeutic areas supported by evidence, and clearly state whether findings are human clinical vs preclinical/monograph.
- If the user asks for exact database counts, report the exact count from the context.
- If the user asks for human clinical trials for a plant that only has preclinical records (e.g. Sambong), state clearly that there are 0 human clinical trials on file.

${screeningOutcome === "PROFESSIONAL_GUIDANCE_REQUIRED" ? `- NOTICE: User screening indicates health risk factors. Provide general educational facts only; never provide personalized herbal advice.` : ""}

VERIFIED NATURAIDE CONTEXT (GROUND TRUTH):
${knowledgeContextText}`;
}

export interface ResearcherEvidenceGroundingResult {
  groundingContextText: string;
  hasMatchingLiterature: boolean;
  literatureCount: number;
  matchingItems: any[];
  groundedFallbackAnswer: string;
}

/**
 * Retrieves and formats real project evidence for grounding the AI Research Assistant.
 * Adheres strictly to the Anti-Fabrication Rule: quotes real PMIDs/authors/titles,
 * and maintains the strict distinction between PREDICTED, EXPERIMENTAL, LITERATURE, and INTERPRETATION.
 */
export async function buildResearcherEvidenceGrounding(
  projectId: number,
  userQuery: string
): Promise<ResearcherEvidenceGroundingResult> {
  try {
    const qLower = (userQuery || "").toLowerCase();

    // 1. Fetch project header metadata
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.id, rp.title, rp.researchObjective, rp.researchQuestion,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
             p.scientificName as plantScientificName
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ?
      LIMIT 1
      `,
      [projectId]
    );

    const project = projectRows[0] || { id: projectId, title: "Research Project", plantName: "Medicinal Plant" };

    // 2. Fetch all project evidence items
    const [rows]: any = await pool.query(
      `
      SELECT id, evidenceClass, stageKey, title, summary, authors,
             publicationYear, journalOrSource, pmid, doi, sourceUrl,
             relevanceExplanation, targetCompound, targetBiological,
             assayOrEndpoint, numericalValue, unit, associatedResultType
      FROM project_evidence_items
      WHERE projectId = ?
      ORDER BY 
        CASE evidenceClass
          WHEN 'LITERATURE' THEN 1
          WHEN 'PREDICTED' THEN 2
          WHEN 'EXPERIMENTAL' THEN 3
          WHEN 'INTERPRETATION' THEN 4
          ELSE 5
        END,
        id DESC
      `,
      [projectId]
    );

    if (rows.length === 0) {
      const fallback = `No relevant verified literature found for this research context. No evidence records are currently logged in the project evidence library for "${project.title}".`;
      return {
        groundingContextText: "No research evidence records are currently logged for this project.",
        hasMatchingLiterature: false,
        literatureCount: 0,
        matchingItems: [],
        groundedFallbackAnswer: fallback,
      };
    }

    // 3. Separate evidence items by class
    const litItems = rows.filter((r: any) => r.evidenceClass === "LITERATURE");
    const predItems = rows.filter((r: any) => r.evidenceClass === "PREDICTED");
    const expItems = rows.filter((r: any) => r.evidenceClass === "EXPERIMENTAL");
    const interpItems = rows.filter((r: any) => r.evidenceClass === "INTERPRETATION");
    const refItems = rows.filter((r: any) => r.evidenceClass === "REFERENCE");

    // 4. Identify if researcher is asking about docking or a specific target/compound
    const isAskingDocking = qLower.includes("docking") || qLower.includes("binding") || qLower.includes("affinity");
    const isAskingLit = qLower.includes("literature") || qLower.includes("paper") || qLower.includes("study") || qLower.includes("publication");

    // Check if the user explicitly requested a specific target or compound name
    const explicitTargetMatch = userQuery.match(/(?:target|protein|receptor|for\s+target|for)\s+([A-Za-z0-9_-]+)/i);
    let explicitTarget: string | null = null;
    if (explicitTargetMatch) {
      const candidate = explicitTargetMatch[1].trim();
      const stopwords = ["this", "my", "the", "a", "our", "all", "each", "docking", "its", "what", "which"];
      if (!stopwords.includes(candidate.toLowerCase())) {
        explicitTarget = candidate;
      }
    }

    const explicitCompoundMatch = userQuery.match(/(?:compound|phytochemical|molecule)\s+([A-Za-z0-9_-]+)/i);
    let explicitCompound: string | null = null;
    if (explicitCompoundMatch) {
      const candidate = explicitCompoundMatch[1].trim();
      const stopwords = ["this", "my", "the", "a", "our", "all", "each", "its"];
      if (!stopwords.includes(candidate.toLowerCase())) {
        explicitCompound = candidate;
      }
    }

    // Search for any known project target mentioned in user query
    let targetMatch: any = null;
    for (const r of rows) {
      if (r.targetBiological && qLower.includes(r.targetBiological.toLowerCase())) {
        targetMatch = r.targetBiological;
        break;
      }
    }

    // Search for any known project compound mentioned in user query
    let compoundMatch: any = null;
    for (const r of rows) {
      if (r.targetCompound && qLower.includes(r.targetCompound.toLowerCase())) {
        compoundMatch = r.targetCompound;
        break;
      }
    }

    // Filter relevant literature
    let relevantLit: any[] = [];
    if (explicitTarget && !targetMatch) {
      // User explicitly asked for a target not recognized in the project's evidence
      relevantLit = litItems.filter(
        (l: any) =>
          l.targetBiological?.toLowerCase().includes(explicitTarget!.toLowerCase()) ||
          l.title.toLowerCase().includes(explicitTarget!.toLowerCase()) ||
          (l.relevanceExplanation && l.relevanceExplanation.toLowerCase().includes(explicitTarget!.toLowerCase()))
      );
    } else if (targetMatch) {
      relevantLit = litItems.filter(
        (l: any) =>
          l.targetBiological?.toLowerCase().includes(targetMatch.toLowerCase()) ||
          l.title.toLowerCase().includes(targetMatch.toLowerCase()) ||
          (l.relevanceExplanation && l.relevanceExplanation.toLowerCase().includes(targetMatch.toLowerCase()))
      );
    } else if (explicitCompound && !compoundMatch) {
      relevantLit = litItems.filter(
        (l: any) =>
          l.targetCompound?.toLowerCase().includes(explicitCompound!.toLowerCase()) ||
          l.title.toLowerCase().includes(explicitCompound!.toLowerCase()) ||
          (l.relevanceExplanation && l.relevanceExplanation.toLowerCase().includes(explicitCompound!.toLowerCase()))
      );
    } else if (compoundMatch) {
      relevantLit = litItems.filter(
        (l: any) =>
          l.targetCompound?.toLowerCase().includes(compoundMatch.toLowerCase()) ||
          l.title.toLowerCase().includes(compoundMatch.toLowerCase()) ||
          (l.relevanceExplanation && l.relevanceExplanation.toLowerCase().includes(compoundMatch.toLowerCase()))
      );
    } else if (isAskingDocking) {
      const dockingLit = litItems.filter(
        (l: any) =>
          l.associatedResultType === "DOCKING" ||
          l.stageKey === "docking" ||
          l.title.toLowerCase().includes("docking") ||
          (l.relevanceExplanation && l.relevanceExplanation.toLowerCase().includes("docking"))
      );
      relevantLit = dockingLit.length > 0 ? dockingLit : litItems;
    } else {
      relevantLit = litItems;
    }

    const hasMatchingLiterature = relevantLit.length > 0;

    // 5. Build strict structured grounding text
    const lines: string[] = [
      `=== RESEARCH PROJECT: ${project.title.toUpperCase()} ===`,
      `Plant: ${project.plantName}${project.plantScientificName ? ` (${project.plantScientificName})` : ""}`,
      "STRICT EVIDENCE ARCHITECTURE RULES:",
      "1. NEVER convert computational predictions (PREDICTED) into experimental evidence.",
      "2. Published research (LITERATURE) provides biological plausibility, but is NOT laboratory proof of your computational model.",
      "3. All citations MUST originate strictly from the LITERATURE items below. NEVER fabricate authors, PMIDs, DOIs, or titles.",
      "4. If no literature is listed for a requested target or result, state clearly: 'No relevant verified literature found for this research context.'",
      "",
    ];

    if (hasMatchingLiterature) {
      lines.push("--- ATTACHED PUBLISHED LITERATURE (CLASS: LITERATURE) ---");
      for (const r of relevantLit) {
        lines.push(
          `• Title: "${r.title}" | Authors: ${r.authors} (${r.publicationYear}) | Journal: ${r.journalOrSource} | PMID: ${r.pmid || "N/A"}${r.doi ? ` | DOI: ${r.doi}` : ""} | Target: ${r.targetBiological || "N/A"} | Relevance: ${r.relevanceExplanation || r.summary}`
        );
      }
      lines.push("");
    } else if (isAskingLit || isAskingDocking) {
      lines.push(
        "--- LITERATURE STATUS: NO VERIFIED LITERATURE FOUND FOR THIS TARGET/QUERY ---",
        "STRICT INSTRUCTION: No verified publications matching this context are attached in the project evidence library.",
        "You MUST respond that no relevant verified literature was found for this research context. Do NOT invent citations.",
        ""
      );
    }

    if (predItems.length > 0) {
      lines.push("--- COMPUTATIONAL SIMULATION RESULTS (CLASS: PREDICTED) ---");
      for (const r of predItems.slice(0, 5)) {
        lines.push(
          `• [PREDICTED] ${r.title}: ${r.numericalValue || ""} ${r.unit || ""} (Computational Model - NOT experimental proof). Target: ${r.targetBiological || "N/A"}`
        );
      }
      lines.push("");
    }

    if (expItems.length > 0) {
      lines.push("--- EMPIRICAL LABORATORY ASSAYS (CLASS: EXPERIMENTAL) ---");
      for (const r of expItems.slice(0, 5)) {
        lines.push(
          `• [EXPERIMENTAL] ${r.title}: ${r.numericalValue || ""} ${r.unit || ""} measured in ${r.assayOrEndpoint || "Wet-Lab"}. Verification: ${r.verificationSource}`
        );
      }
      lines.push("");
    }

    if (interpItems.length > 0) {
      lines.push("--- RESEARCHER CONCLUSIONS (CLASS: INTERPRETATION) ---");
      for (const r of interpItems.slice(0, 3)) {
        lines.push(`• [INTERPRETATION] ${r.title}: ${r.summary}`);
      }
      lines.push("");
    }

    // 6. Formulate precise grounded fallback answer
    let groundedFallbackAnswer = "";
    if (isAskingLit || isAskingDocking || explicitTarget || explicitCompound) {
      if (hasMatchingLiterature) {
        const paperList = relevantLit
          .slice(0, 3)
          .map(
            (p: any, i: number) =>
              `${i + 1}. **${p.title}**\n   *Authors:* ${p.authors} (${p.publicationYear}) · *Journal:* ${p.journalOrSource} · *PMID:* ${p.pmid || "N/A"}${p.doi ? ` · *DOI:* ${p.doi}` : ""}\n   *Relevance:* ${p.relevanceExplanation || p.summary}`
          )
          .join("\n\n");

        const targetPhrase = targetMatch ? ` for target **${targetMatch}**` : explicitTarget ? ` for target **${explicitTarget}**` : "";
        groundedFallbackAnswer =
          `The following published scientific literature supports your docking context${targetPhrase}:\n\n` +
          `${paperList}\n\n` +
          `**Scientific Evidence Boundary:**\n` +
          `These publications remain classified as **LITERATURE**. While they document biological plausibility and target binding mechanics in published literature, they do **not** validate or convert your in-silico docking score into experimental laboratory evidence.`;
      } else {
        const specifier = explicitTarget ? ` for target "${explicitTarget}"` : explicitCompound ? ` for compound "${explicitCompound}"` : "";
        groundedFallbackAnswer =
          `**No relevant verified literature found for this research context.**\n\n` +
          `NatureAide strictly adheres to anti-fabrication standards. No verified PubMed/NCBI publications are currently attached to this project${specifier} or for this docking context. Bibliographic citations are never generated or invented.`;
      }
    } else {
      groundedFallbackAnswer =
        `**Project Evidence Summary (${project.title}):**\n` +
        `• **Literature Evidence:** ${litItems.length} peer-reviewed publication(s) attached from PubMed/NCBI.\n` +
        `• **Computational / Predicted:** ${predItems.length} in-silico prediction(s) and docking score(s).\n` +
        `• **Experimental Evidence:** ${expItems.length} measured laboratory assay result(s).\n` +
        `• **Researcher Interpretation:** ${interpItems.length} documented conclusion(s).\n\n` +
        `NatureAide maintains strict separation across these evidence layers to ensure scientific integrity.`;
    }

    return {
      groundingContextText: lines.join("\n"),
      hasMatchingLiterature,
      literatureCount: relevantLit.length,
      matchingItems: relevantLit,
      groundedFallbackAnswer,
    };
  } catch (err) {
    console.error("Error retrieving researcher evidence grounding:", err);
    return {
      groundingContextText: "Error retrieving project evidence grounding.",
      hasMatchingLiterature: false,
      literatureCount: 0,
      matchingItems: [],
      groundedFallbackAnswer: "An error occurred while retrieving project evidence records.",
    };
  }
}

