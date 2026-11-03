import pool from "./db";
import { callGrokChat, isGrokConfigured, getGrokDiagnostics, GrokDiagnostics } from "./ai/grok-provider";
import { callTogetherChat, isTogetherConfigured } from "./ai/together-provider";
import {
  ChatIntent,
  AssistantRoute,
  EvidenceLevel,
  SupportedLanguage,
  detectLanguage,
  detectSymptomAndAssociatedPlants,
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
  isResearchEducationQuestion,
  isGeneralQuestion,
  isPlantComparison,
  sanitizeEvidenceMarketingLanguage,
} from "./community-chat-router";

export interface ModelCandidate {
  id: string;
  name: string;
  role: "PRIMARY" | "FALLBACK";
}

export const DEFAULT_MODELS: ModelCandidate[] = [
  {
    id: process.env.TOGETHER_MODEL_PRIMARY || process.env.XAI_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    name: "Ask NaturAide Intelligence Engine",
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
  secondaryPlantId?: string | null;
  activeEntityName: string | null;
  activeEntitySlug: string | null;
  intent: string;
  isUnknownEntity: boolean;
  detectedLanguage?: SupportedLanguage;
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
  const detectedLang = detectLanguage(userQuery);
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
    let direct = "";
    if (detectedLang === "fil" || detectedLang === "taglish") {
      direct = "⚠️ EMERGENCY MEDICAL NOTICE / PAUNAWA SA MEDIKAL NA EMERHENSIYA: Kung ikaw o ang iyong kasama ay nakakaranas ng matinding hirap sa paghinga, paninikip ng dibdib, pag-ubo ng dugo, hinalang pagkalason, o pagkawala ng malay, magpunta agad sa pinakamalapit na ospital o emergency room. Ang NaturAide ay isang pang-edukasyong plataporma lamang at hindi maaaring magbigay ng lunas sa mga emergency o kritikal na kondisyon.";
    } else if (detectedLang === "ceb") {
      direct = "⚠️ EMERGENCY MEDICAL NOTICE / PAHIBALO SA EMERHENSIYA: Kung ikaw o ang imong kauban naglisod sa pagginhawa, nagsakit ang dughan, nag-ubo og dugo, o nakuyapan, palihug adto dayon sa pinakaduol nga ospital o emergency room. Ang NaturAide alang lamang sa edukasyon ug dili makahatag og tambal sa mga emerhensiya.";
    } else {
      direct = "⚠️ EMERGENCY MEDICAL NOTICE: If you or someone you are with is experiencing severe difficulty breathing, acute chest pain, suspected poisoning, severe allergic reaction, or uncontrollable bleeding, please seek immediate emergency care at the nearest hospital or emergency room. NaturAide is an educational informational database and cannot handle medical emergencies.";
    }

    logRoutingDecision({
      message: userQuery,
      intent: "EMERGENCY",
      explicitEntity: explicitEntity ? explicitEntity.name : null,
      previousEntity: persistedContext?.currentPlantId ?? null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "EMERGENCY_SAFETY_HANDLER",
      language: detectedLang,
    });
    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "EMERGENCY",
      isUnknownEntity: false,
      detectedLanguage: detectedLang,
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

  // 10. PRIORITY ROUTE: Plant Comparison (e.g. "Lagundi vs Tsaang Gubat", "Ano pinagkaiba ng Sambong at Lagundi")
  if ((explicitEntity && explicitEntity.type === "COMPARISON") || rawIntent === "PLANT_COMPARISON") {
    let plantA: any = null;
    let plantB: any = null;

    if (explicitEntity && explicitEntity.type === "COMPARISON") {
      plantA = plantRows.find((p: any) => p.id === explicitEntity.id || p.slug === explicitEntity.id);
      plantB = plantRows.find((p: any) => p.id === explicitEntity.secondaryPlantId || p.slug === explicitEntity.secondaryPlantId);
    }

    if (!plantA || !plantB) {
      const candidates: any[] = [];
      for (const p of plantRows) {
        const clean = p.commonName.toLowerCase().replace(/\s*\([^)]*\)/, "").trim();
        if (normalized.includes(clean) || (p.slug && normalized.includes(p.slug))) {
          if (!candidates.some((c) => c.id === p.id)) candidates.push(p);
        }
      }
      if (candidates.length >= 2) {
        plantA = candidates[0];
        plantB = candidates[1];
      }
    }

    if (plantA && plantB) {
      const compText = `
COMPARISON OF TWO PHILIPPINE MEDICINAL PLANTS:
1. ${plantA.commonName} (${plantA.scientificName}):
   - Documented Uses: ${plantA.simpleUse || plantA.category}
   - Documented Plant Part: ${plantA.plant_parts_used || "Leaves"}
   - Precautions: ${plantA.safetyInformation || plantA.safetyNote || "Consult physician prior to use."}
2. ${plantB.commonName} (${plantB.scientificName}):
   - Documented Uses: ${plantB.simpleUse || plantB.category}
   - Documented Plant Part: ${plantB.plant_parts_used || "Leaves"}
   - Precautions: ${plantB.safetyInformation || plantB.safetyNote || "Consult physician prior to use."}

INSTRUCTION: Compare these two plants clearly, highlighting similarities, differences in therapeutic indications, traditional preparations, and safety profiles.
`;
      const fallbackAns = detectedLang === "fil" || detectedLang === "taglish"
        ? `Paghahambing ng ${plantA.commonName} at ${plantB.commonName}:\n\n• **${plantA.commonName}** (${plantA.scientificName}): Pangunahing nakatala sa PITAHC para sa ${plantA.simpleUse || plantA.category}. Karaniwang dahon ang ginagamit bilang tsaa o decoction.\n• **${plantB.commonName}** (${plantB.scientificName}): Nakatala para sa ${plantB.simpleUse || plantB.category}.\n\nMagkaiba ang kanilang pangunahing gamit at aktibong sangkap, kaya mahalagang gamitin ang angkop na halaman para sa iyong partikular na pangangailangan at kumonsulta sa doktor bago uminom.`
        : `Comparison between ${plantA.commonName} and ${plantB.commonName}:\n\n• **${plantA.commonName}** (${plantA.scientificName}): Officially documented for ${plantA.simpleUse || plantA.category}, primarily prepared from leaves.\n• **${plantB.commonName}** (${plantB.scientificName}): Documented for ${plantB.simpleUse || plantB.category}.\n\nBoth are officially recognized Philippine medicinal plants, but they target distinct health indications. Always consult a healthcare professional before use.`;

      const card: ContextCard = {
        type: "PLANT",
        title: `${plantA.commonName} vs ${plantB.commonName}`,
        subtitle: "Multi-Plant Comparison",
        entityId: plantA.id,
        entitySlug: plantA.slug,
        metrics: [
          { icon: "leaf", label: plantA.commonName, value: plantA.simpleUse || "PITAHC Plant" },
          { icon: "leaf", label: plantB.commonName, value: plantB.simpleUse || "PITAHC Plant" },
        ],
        actions: [
          { label: `View ${plantA.commonName} Guide →`, href: `/community/plants/${plantA.slug || plantA.id}` },
          { label: `View ${plantB.commonName} Guide →`, href: `/community/plants/${plantB.slug || plantB.id}` },
        ],
      };

      logRoutingDecision({
        message: userQuery,
        intent: "PLANT_COMPARISON",
        explicitEntity: `${plantA.commonName} vs ${plantB.commonName}`,
        previousEntity: persistedContext?.currentPlantId ?? null,
        isContextualFollowUp: false,
        resolvedEntity: `${plantA.commonName} vs ${plantB.commonName}`,
        route: "PLANT_COMPARISON_HANDLER",
        language: detectedLang,
      });

      return {
        activeType: "PLANT",
        plantId: plantA.id,
        productId: null,
        secondaryPlantId: plantB.id,
        activeEntityName: `${plantA.commonName} vs ${plantB.commonName}`,
        activeEntitySlug: plantA.slug,
        intent: "PLANT_COMPARISON",
        isUnknownEntity: false,
        detectedLanguage: detectedLang,
        knowledgeContextText: compText,
        cardData: card,
        groundedFallbackAnswer: fallbackAns,
        routeTaken: "PLANT_COMPARISON_HANDLER",
      };
    }
  }

  // 11. PRIORITY ROUTE: Research & In-Silico Concepts (e.g. molecular docking, -7.5 kcal/mol, phytochemicals)
  if (rawIntent === "RESEARCH_EXPLANATION" || isResearchEducationQuestion(normalized)) {
    const researchKnowledge = `
SCIENTIFIC RESEARCH & COMPUTATIONAL CONCEPTS IN NATURAIDE:
- Molecular Docking: A computational modeling technique that simulates how a plant phytochemical fits into the binding pocket of a target disease protein (like a key fitting into a lock).
- Binding Affinity (e.g., -7.5 kcal/mol): Quantifies how strongly a molecule binds to a protein target in computational simulation. Measured in kcal/mol (kilocalories per mole). Negative values indicate thermodynamically favorable binding. A score of -7.0 to -8.0 kcal/mol or lower indicates strong, favorable binding interaction in in-silico screening.
- Phytochemicals: Natural bioactive chemical compounds produced by plants (such as flavonoids, alkaloids, terpenes, and polyphenols) that provide natural defense mechanisms and potential therapeutic properties.
- In-Silico vs Experimental: In-silico predictions prioritize candidate molecules on a computer, but they are NOT laboratory proof or human clinical trial outcomes. Promising docking scores require subsequent in-vitro, in-vivo, and clinical validation.
`;

    const fallbackAns = detectedLang === "fil" || detectedLang === "taglish"
      ? `Sa siyentipikong pananaliksik ng NatureAide:\n\n• **Molecular Docking**: Isang computer simulation na sumusuri kung paano sasakto ang isang phytochemical (molekyul mula sa halaman) sa isang target protein sa katawan—tulad ng susi na sumusukat sa kandado.\n• **Binding Affinity (-7.5 kcal/mol)**: Ito ang sukat ng lakas ng pagkakakapit ng molekyul sa target protein sa computer simulation. Ang negatibong numero (tulad ng -7.5 kcal/mol) ay nangangahulugang maganda at matibay ang pagkakalapat (favorable binding energy).\n• **Tandaan**: Ang in-silico docking ay gabay sa pananaliksik upang matukoy ang mga pinakamabisang sangkap, ngunit kailangan pa rin itong kumpirmahin sa laboratoryo (wet-lab) at clinical trials.`
      : `In scientific research and NaturAide's computational pipeline:\n\n• **Molecular Docking**: A computer simulation that models how a plant phytochemical fits into a disease-related target protein—analogous to a key fitting into a lock.\n• **Binding Affinity (-7.5 kcal/mol)**: Measures the predicted binding strength in kcal/mol. Negative scores represent thermodynamically favorable binding; a score of -7.5 kcal/mol indicates a strong and favorable computational interaction.\n• **Scientific Context**: In-silico docking serves as a predictive screening tool. While it helps prioritize active compounds, it does not replace wet-lab assays or clinical trials.`;

    const card: ContextCard = {
      type: "GENERAL",
      title: "Scientific Research & In-Silico Concepts",
      subtitle: "Molecular Docking & Phytochemistry",
      metrics: [
        { icon: "book", label: "Computational Simulation", value: "In-Silico Docking" },
        { icon: "shield", label: "Evidence Layer", value: "Predictive Model" },
      ],
      actions: [
        { label: "What is a Phytochemical?", query: "What is a phytochemical and how does it work?" },
        { label: "Explore Medicinal Plants →", href: "/community/herbal-guide" },
      ],
    };

    logRoutingDecision({
      message: userQuery,
      intent: "RESEARCH_EXPLANATION",
      explicitEntity: null,
      previousEntity: persistedContext?.currentPlantId ?? null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "RESEARCH_EXPLANATION_HANDLER",
      language: detectedLang,
    });

    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "RESEARCH_EXPLANATION",
      isUnknownEntity: false,
      detectedLanguage: detectedLang,
      knowledgeContextText: researchKnowledge,
      cardData: card,
      groundedFallbackAnswer: fallbackAns,
      routeTaken: "RESEARCH_EXPLANATION_HANDLER",
    };
  }

  // 12. PRIORITY ROUTE: Symptom & Health Discomfort (e.g. "I have a cough", "Ano ang mga halamang para sa ubo?", "May ubo ako")
  const symptom = detectSymptomAndAssociatedPlants(normalized);
  if (symptom && !explicitEntity) {
    const primaryPlant = plantRows.find(
      (p: any) => p.id === symptom.primaryPlantId || p.slug === symptom.primaryPlantId
    );

    if (primaryPlant) {
      const [preps]: any = await pool.query(
        `SELECT id, title, preparation_type, plant_part_used, traditional_use_context, description,
                administration_instructions, when_to_seek_guidance
         FROM traditional_preparations
         WHERE plant_id = ? AND status = 'PUBLISHED'
         ORDER BY id ASC`,
        [primaryPlant.id]
      );

      const cleanCommon = primaryPlant.commonName.replace(/\s*\([^)]*\)/, "").trim();
      const [refs]: any = await pool.query(
        `SELECT sr.id, sr.pubmedId, sr.doi, sr.title, sr.authors, sr.publicationYear,
                sr.journalOrPublisher, sr.studyType, sr.shortSummary, sr.evidence_scope
         FROM scientific_references sr
         WHERE sr.source_verified = 1
           AND (sr.plantOrIngredientStudied LIKE ? OR sr.plantOrIngredientStudied LIKE ?)
         ORDER BY sr.publicationYear DESC`,
        [`%${cleanCommon}%`, `%${primaryPlant.scientificName}%`]
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
        [primaryPlant.id]
      );

      const plantPart = primaryPlant.plant_parts_used || preps[0]?.plant_part_used || "Leaves";
      const prepCount = preps.length;
      const refCount = refs.length;
      const prodCount = prods.length;

      const symptomKnowledgeText = `
DETECTED HEALTH CONCERN / SYMPTOM:
- Symptom: ${symptom.nameEn} (${symptom.nameFil})
- Red Flag Warning: ${symptom.warningEn || "If symptoms are severe or persist, seek immediate physician guidance."}
- Primary Verified Medicinal Plant: ${primaryPlant.commonName} (${primaryPlant.scientificName})
- Documented Uses: ${primaryPlant.simpleUse || primaryPlant.category}
- Documented Plant Part Used: ${plantPart}
- Traditional Preparations Available: ${prepCount > 0 ? preps.map((pr: any) => `${pr.title} (${pr.preparation_type}) - ${pr.description}`).join("; ") : "Boiled leaves decoction"}
- Verified Citations on File: ${refCount}
- Registered Commercial Products: ${prodCount > 0 ? prods.slice(0, 3).map((p: any) => p.name).join(", ") : "Traditional Form"}
- Precautions & Sensitive Groups: ${primaryPlant.safetyInformation || primaryPlant.safetyNote || "Consult a doctor for pregnant women, infants, or when taking maintenance medications."}

INSTRUCTION: Address the user's symptom directly, warmly, and responsibly in ${detectedLang === "fil" || detectedLang === "taglish" ? "Filipino / Taglish" : "English"}.
1. Acknowledge the symptom and check safety (mention warning signs).
2. Recommend the officially recognized PITAHC plant: ${primaryPlant.commonName} (${primaryPlant.scientificName}).
3. Explain how it is traditionally prepared (e.g. decoction of leaves).
4. Emphasize health safety screening (pregnancy, nursing, young children, maintenance medications).
5. State clearly that if symptoms persist for more than 3 days or worsen, consult a doctor.
`;

      const fallbackAns = detectedLang === "fil" || detectedLang === "taglish"
        ? `Para sa ${symptom.nameFil.toLowerCase()} (${symptom.nameEn.toLowerCase()}), ang **${primaryPlant.commonName}** (${primaryPlant.scientificName}) ang opisyal na halamang gamot na ineendorso ng Philippine Institute of Traditional and Health Care (PITAHC) at Department of Health (DOH).\n\n• **Pangunahing Gamit**: ${primaryPlant.simpleUse || "Pampaginhawa sa ubo at daluyan ng paghinga"}.\n• **Tradisyonal na Paghahanda**: Karaniwang inihahanda bilang decoction o pinakuluang dahon (${plantPart}).\n• **Mahalagang Pag-iingat**: ${symptom.warningFil || "Kung may kasamang mataas na lagnat, hirap sa paghinga, o hindi bumubuti pagkalipas ng 3 araw, magpatingin agad sa doktor."}\n\nPaalala: Siguraduhing kumonsulta sa doktor bago gumamit kung ikaw ay buntis, nagpapasuso, nagpapagaling ng bata, o may iniinom na maintenance medicine.`
        : `For ${symptom.nameEn.toLowerCase()}, **${primaryPlant.commonName}** (${primaryPlant.scientificName}) is the primary medicinal plant officially recognized by the Philippine Institute of Traditional and Health Care (PITAHC) and the Department of Health (DOH).\n\n• **Documented Indication**: ${primaryPlant.simpleUse || "Relief of respiratory discomfort and cough"}.\n• **Traditional Preparation**: Documented primarily as a decoction using the ${plantPart.toLowerCase()}.\n• **Safety & Clinical Guidance**: ${symptom.warningEn || "If symptoms persist beyond 3 days, worsen, or involve severe difficulty breathing, consult a licensed healthcare professional promptly."}\n\nNote: Always consult a doctor if you are pregnant, nursing, treating young children, or taking prescription maintenance medications.`;

      const card: ContextCard = {
        type: "PLANT",
        title: detectedLang === "fil" || detectedLang === "taglish"
          ? `Gabay sa Halamang Gamot para sa ${symptom.nameFil}`
          : `Herbal Guidance for ${symptom.nameEn}`,
        subtitle: `${primaryPlant.commonName} (${primaryPlant.scientificName}) · PITAHC Endorsed`,
        entityId: primaryPlant.id,
        entitySlug: primaryPlant.slug,
        metrics: [
          { icon: "leaf", label: "Primary Herb", value: `${primaryPlant.commonName}` },
          { icon: "coffee", label: "Preparation", value: prepCount > 0 ? `${prepCount} Method(s)` : "Decoction" },
          { icon: "shield", label: "Safety Screening", value: "Consult doctor if persistent" },
          { icon: "pill", label: "Products", value: prodCount > 0 ? `${prodCount} Registered` : "Traditional Form" },
        ],
        actions: [
          { label: `View ${primaryPlant.commonName} Guide →`, href: `/community/plants/${primaryPlant.slug || primaryPlant.id}` },
          { label: "Traditional Preparation", query: `How is ${primaryPlant.commonName} prepared?` },
          { label: "Safety & Precautions", query: `What are the precautions for ${primaryPlant.commonName}?` },
          { label: "Health Safety Screening", href: "/community/screening" },
        ],
      };

      logRoutingDecision({
        message: userQuery,
        intent: "SYMPTOM",
        explicitEntity: null,
        previousEntity: persistedContext?.currentPlantId ?? null,
        isContextualFollowUp: false,
        resolvedEntity: primaryPlant.commonName,
        route: "SYMPTOM_HERBAL_HANDLER",
        language: detectedLang,
      });

      return {
        activeType: "PLANT",
        plantId: primaryPlant.id,
        productId: null,
        activeEntityName: primaryPlant.commonName,
        activeEntitySlug: primaryPlant.slug,
        intent: "SYMPTOM",
        isUnknownEntity: false,
        detectedLanguage: detectedLang,
        knowledgeContextText: symptomKnowledgeText,
        cardData: card,
        assistantDirectAnswer: undefined, // Let Together AI or Grok synthesize in the user's detected language!
        groundedFallbackAnswer: fallbackAns,
        routeTaken: "SYMPTOM_HERBAL_HANDLER",
      };
    }
  }

  // 13. PRIORITY ROUTE: General Informational / Science Question without explicit entity
  if ((rawIntent === "GENERAL_QUESTION" || rawIntent === "GENERAL_KNOWLEDGE" || isGeneralKnowledgeQuestion(normalized) || isGeneralQuestion(normalized)) && !explicitEntity) {
    let direct = "";
    let card: ContextCard | null = null;

    if (
      normalized.includes("what medicinal plants do you know") ||
      normalized.includes("anong mga halaman") ||
      normalized.includes("anong halamang") ||
      normalized.includes("ano ang mga halamang") ||
      normalized.includes("halamang gamot ang alam mo") ||
      normalized.includes("ano ang mga halamang nasa natureaide") ||
      normalized.includes("what plants are available") ||
      normalized.includes("10 pitahc") ||
      normalized.includes("10 doh") ||
      normalized.includes("list of medicinal plants") ||
      normalized.includes("lista ng mga halamang gamot")
    ) {
      direct = detectedLang === "fil" || detectedLang === "taglish"
        ? `Naglalaman ang NatureAide ng beripikadong impormasyon tungkol sa 10 halamang gamot na opisyal na ineendorso ng PITAHC at DOH sa Pilipinas:\n\n1. **Lagundi** (*Vitex negundo*) – para sa ubo, hika, at panlalamig sa dibdib\n2. **Sambong** (*Blumea balsamifera*) – pampaihi at suporta sa bato / urinary tract\n3. **Ampalaya** (*Momordica charantia*) – pantulong sa antas ng asukal sa dugo (diabetes)\n4. **Tsaang Gubat** (*Carmona retusa*) – para sa sakit ng tiyan, kabag, at pagtatae\n5. **Yerba Buena** (*Clinopodium douglasii*) – pampaginhawa sa sakit ng ulo, ngipin, at katawan\n6. **Akapulko** (*Senna alata*) – panlaban sa buni, an-an, at fungal skin infections\n7. **Bawang** (*Allium sativum*) – suporta sa blood pressure at cholesterol\n8. **Bayabas** (*Psidium guajava*) – panghugas ng sugat at antiseptiko\n9. **Niyog-niyogan** (*Quisqualis indica*) – panlunas sa bulate sa tiyan (antihelminthic)\n10. **Ulasimang Bato / Pansit-pansitan** (*Peperomia pellucida*) – suporta sa mataas na uric acid at rayuma/gout\n\nAlin sa mga ito ang nais mong suriin nang mas detalyado?`
        : `NaturAide indexes verified scientific, traditional, and regulatory records for the 10 Philippine medicinal plants officially endorsed by PITAHC and DOH:\n\n1. **Lagundi** (*Vitex negundo*) – Cough, asthma, and respiratory relief\n2. **Sambong** (*Blumea balsamifera*) – Diuretic and supportive kidney/urinary health\n3. **Ampalaya** (*Momordica charantia*) – Supportive blood sugar management\n4. **Tsaang Gubat** (*Carmona retusa*) – Stomachache, abdominal cramps, and diarrhea\n5. **Yerba Buena** (*Clinopodium douglasii*) – Headache, toothache, and body pain\n6. **Akapulko** (*Senna alata*) – Antifungal for ringworm and skin conditions\n7. **Bawang** (*Allium sativum*) – Cardiovascular and blood pressure support\n8. **Bayabas** (*Psidium guajava*) – Wound antiseptic and astringent wash\n9. **Niyog-niyogan** (*Quisqualis indica*) – Deworming and intestinal antihelminthic\n10. **Ulasimang Bato / Pansit-pansitan** (*Peperomia pellucida*) – Serum uric acid and gout relief\n\nWhich medicinal plant would you like to explore?`;

      card = {
        type: "GENERAL",
        title: "10 PITAHC Philippine Medicinal Plants",
        subtitle: "Officially Endorsed Herbal Knowledge",
        metrics: [
          { icon: "leaf", label: "Endorsed Plants", value: "10 Species" },
          { icon: "book", label: "Evidence Scope", value: "DOH/PITAHC Monographed" },
        ],
        actions: [
          { label: "Lagundi (Cough / Ubo)", query: "Tell me about Lagundi" },
          { label: "Sambong (Kidney / Bato)", query: "Tell me about Sambong" },
          { label: "Tsaang Gubat (Stomach)", query: "Tell me about Tsaang Gubat" },
          { label: "Explore Herbal Guide →", href: "/community/herbal-guide" },
        ],
      };
    } else if (normalized.includes("photosynthesis")) {
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
      language: detectedLang,
    });
    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: rawIntent === "GENERAL_QUESTION" ? "GENERAL_QUESTION" : "GENERAL_KNOWLEDGE",
      isUnknownEntity: false,
      detectedLanguage: detectedLang,
      knowledgeContextText: direct,
      cardData: card,
      assistantDirectAnswer: direct,
      groundedFallbackAnswer: direct,
      routeTaken: "GENERAL_QUESTION_HANDLER",
    };
  }

  // 14. RESOLVE ENTITY HIERARCHY
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
        language: detectedLang,
      });
      return {
        activeType: "NONE",
        plantId: null,
        productId: null,
        activeEntityName: null,
        activeEntitySlug: null,
        intent: "AMBIGUOUS",
        isUnknownEntity: false,
        detectedLanguage: detectedLang,
        knowledgeContextText: "Prompt user for specific medicinal plant disambiguation.",
        cardData: null,
        assistantDirectAnswer: direct,
        groundedFallbackAnswer: direct,
        routeTaken: "AMBIGUOUS_FOLLOWUP_DISAMBIGUATION",
      };
    }
  }

  // 15. If NO active plant and NO active product resolved:
  if (!activePlant && !activeProduct) {
    const direct = detectedLang === "fil" || detectedLang === "taglish"
      ? "Nais mo bang magtanong tungkol sa isang partikular na karamdaman (tulad ng ubo, sakit ng tiyan, o lagnat) o tungkol sa isa sa mga halamang gamot ng Pilipinas (tulad ng Lagundi, Sambong, o Ampalaya)? Sabihin mo lang sa akin kung paano kita matutulungan!"
      : "I can help you explore Philippine medicinal plants, registered herbal products, traditional preparations, safety precautions, or assist with symptoms like cough or stomachache. Which topic or plant would you like to explore?";

    logRoutingDecision({
      message: userQuery,
      intent: rawIntent,
      explicitEntity: null,
      previousEntity: previousEntity ? previousEntity.name : null,
      isContextualFollowUp: false,
      resolvedEntity: null,
      route: "CONVERSATIONAL_FALLBACK_HANDLER",
      language: detectedLang,
    });

    return {
      activeType: "NONE",
      plantId: null,
      productId: null,
      activeEntityName: null,
      activeEntitySlug: null,
      intent: "GENERAL",
      isUnknownEntity: false,
      detectedLanguage: detectedLang,
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
 * Primary: xAI Grok (if configured) or Together AI (Llama 3.3 70B / DeepSeek / Qwen)
 * Fallback: NaturAide Deterministic Grounded Engine
 */
export async function executeChatWithFallback(
  messages: ChatMessageParam[],
  fallbackText?: string
): Promise<GenerateResult> {
  const defaultFallbackAnswer =
    fallbackText ||
    "NaturAide provides verified factual information from Philippine health authorities (DOH and PITAHC). Verified information for this specific query is not currently available in the NaturAide knowledge base.";

  const modelsAttempted: string[] = [];

  // 1. Try xAI Grok if configured
  if (isGrokConfigured()) {
    const grokModel = process.env.XAI_MODEL || "grok-4.7";
    modelsAttempted.push(grokModel);
    const grokRes = await callGrokChat(messages);
    if (grokRes.success && grokRes.content) {
      return {
        content: grokRes.content,
        modelUsed: grokRes.model,
        fallbackCount: 0,
        modelsAttempted,
      };
    }
  }

  // 2. Try Together AI if configured
  if (isTogetherConfigured()) {
    const togetherPrimary = process.env.TOGETHER_MODEL_PRIMARY || "meta-llama/Llama-3.3-70B-Instruct-Turbo";
    modelsAttempted.push(togetherPrimary);
    const togetherRes = await callTogetherChat(messages);
    if (togetherRes.success && togetherRes.content) {
      return {
        content: togetherRes.content,
        modelUsed: togetherRes.model,
        fallbackCount: modelsAttempted.length > 1 ? 1 : 0,
        modelsAttempted,
      };
    }
  }

  // 3. Fallback: NaturAide Local Grounded Engine
  modelsAttempted.push("natureaide-grounded-engine");
  return {
    content: defaultFallbackAnswer,
    modelUsed: "natureaide-grounded-engine",
    fallbackCount: 1,
    modelsAttempted,
  };
}

/**
 * Builds the server-side system instruction contract enforcing zero-fabrication,
 * strict scientific/medical boundaries, and native multilingual communication.
 */
export function buildSystemPrompt(
  screeningOutcome: "ELIGIBLE_TO_CONTINUE" | "PROFESSIONAL_GUIDANCE_REQUIRED" | "NO_SCREENING",
  knowledgeContextText: string,
  activeContextTypeOrUnknown?: string | boolean,
  isUnknownEntity?: boolean,
  userName?: string | null,
  detectedLanguage: SupportedLanguage = "en"
): string {
  const isUnknown =
    typeof activeContextTypeOrUnknown === "boolean"
      ? activeContextTypeOrUnknown
      : Boolean(isUnknownEntity);

  return `You are Ask NaturAide, an intelligent, conversational, and evidence-grounded herbal knowledge assistant for the NaturAide platform.
You combine conversational versatility with strict grounding in NaturAide's verified botanical, pharmacological, and regulatory database from Philippine health authorities (PITAHC and DOH).

${userName ? `The user's name is ${userName}. When asked or appropriate, you may address them warmly.` : ""}

MULTILINGUAL & CONVERSATIONAL INSTRUCTIONS:
- Detected User Language / Style: ${detectedLanguage.toUpperCase()}
- You MUST reply in the user's detected language and natural tone:
  * If the user wrote in Filipino / Tagalog (e.g. "Ano ang mga halamang para sa ubo?", "May ubo ako", "Inuubo ako"): respond warmly, clearly, and fluently in Filipino / Tagalog.
  * If the user wrote in Taglish (e.g. "Safe ba ang Lagundi sa bata?", "May studies ba dito?"): respond in natural, friendly Taglish.
  * If the user wrote in Cebuano / Bisaya (e.g. "Unsay tambal sa ubo?", "Luwas ba kini?"): respond respectfully in Cebuano.
  * If the user wrote in Ilocano (e.g. "Ania ti agas ti ubog?"): respond in Ilocano.
  * If the user wrote in English: respond in clear, accessible, and supportive English.
- NEVER start your response with a generic capability message (such as "I can chat with you, explain general nature and science concepts...") when the user asked a real question or mentioned a symptom. Directly and warmly answer their question!
- If the user asks casual chat ("how are you", "tell a joke", "who are you"), respond naturally and playfully without forcing medicinal plant facts.
- If the user switches languages mid-conversation, smoothly switch to their new language without losing the topic context.

SYMPTOMS & HEALTH SCREENING:
- Recognize the user's symptom first (e.g., cough, stomach pain, headache, urinary discomfort, fever).
- Screen for emergency red flags (e.g., difficulty breathing, acute chest pain, coughing blood, high fever over 3 days, severe dehydration). If red flags are present or suspected, prioritize advising immediate hospital or emergency room care.
- Suggest only officially recognized PITAHC / DOH medicinal plants associated with the symptom (e.g. Lagundi for cough/asthma, Tsaang Gubat for stomach cramps/diarrhea, Sambong for kidney stones/urinary support, Ampalaya for blood sugar support, Yerba Buena for body pain/headache, Akapulko for fungal skin conditions, Ulasimang Bato for uric acid/gout).
- Highlight safety screening: remind users to exercise caution and consult a healthcare professional if they are pregnant, breastfeeding, treating infants/young children, have severe liver/kidney disease, or take maintenance prescription drugs.
- Emphasize that herbal remedies are supportive and do not replace professional diagnosis or prescription drugs.

MEDICINAL PLANTS & VERIFIED KNOWLEDGE GROUNDING:
- Ground your answers strictly in the verified NaturAide context provided below.
- Never fabricate: citations, authors, journals, years, DOIs, PMIDs, clinical trials, drug interactions, dosages, preparation quantities, contraindications, chemical identifiers, ADME predictions, toxicity predictions, docking results, PDB IDs, binding affinities, laboratory findings, regulatory approval, or commercial claims.
- Do not diagnose disease.
- Do not prescribe treatment.
- Do not tell users to stop or replace prescribed medication.
- Clearly distinguish educational information from professional medical advice.
- Never use absolute marketing phrases such as "clinically proven", "guaranteed effective", or "proven to dissolve kidney stones" unless the supplied context explicitly documents human clinical trials.
- A citation being "verified" means only that NaturAide has indexed and validated the reference source; it does NOT mean the plant's health claim is clinically proven in humans.
- If evidence is classified as PRECLINICAL, ANIMAL, IN VITRO, or MONOGRAPH, explicitly describe it as preclinical, animal, or monograph documentation. Do NOT upgrade evidence strength.
- When answering questions about clinical benefits: directly address the actual benefits/therapeutic areas supported by evidence, and clearly state whether findings are human clinical vs preclinical/monograph.
- If the user asks for exact database counts, report the exact count from the context.
- If the user asks for human clinical trials for a plant that only has preclinical records (e.g. Sambong), state clearly that there are 0 human clinical trials on file.

RESEARCH & SCIENTIFIC CONCEPTS:
- Explain complex scientific concepts simply and educationally for community users:
  * Molecular Docking: a computational computer simulation predicting how a plant phytochemical fits into a target protein receptor (like a key into a lock).
  * Binding Affinity (e.g. -7.5 kcal/mol): measures how tightly the molecule binds computationally. Negative values indicate favorable binding (the more negative, the stronger the predicted interaction).
  * Phytochemicals: natural bioactive chemical compounds produced by plants for defense and health properties.
  * In-silico vs Experimental: computational predictions are hypothetical models that guide research, but are NOT the same as wet-lab assays or human clinical trials.

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

