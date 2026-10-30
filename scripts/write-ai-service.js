const fs = require('fs');

const content = `import pool from "./db";

export interface ModelCandidate {
  id: string;
  name: string;
  role: "PRIMARY" | "FALLBACK" | "FINAL_FALLBACK";
}

// 3 verified serverless models from Together AI
export const DEFAULT_MODELS: ModelCandidate[] = [
  {
    id: process.env.TOGETHER_MODEL_PRIMARY || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    name: "Llama-3.3-70B-Instruct-Turbo",
    role: "PRIMARY",
  },
  {
    id: process.env.TOGETHER_MODEL_FALLBACK || "deepseek-ai/DeepSeek-V4.1-Flash",
    name: "DeepSeek-V4.1-Flash",
    role: "FALLBACK",
  },
  {
    id: process.env.TOGETHER_MODEL_FINAL || "zai-org/GLM-5.3-Flash",
    name: "GLM-5.3-Flash",
    role: "FINAL_FALLBACK",
  },
];

export const MANDATORY_DISCLAIMER =
  "NatureAide provides educational and evidence-based information and is not intended to diagnose medical conditions, prescribe treatment, or replace professional medical care.";

export interface ActiveContextResolution {
  activeType: "PLANT" | "PRODUCT" | "NONE";
  plantId: string | null;
  productId: string | null;
  activeEntityName: string | null;
  isUnknownEntity: boolean;
  knowledgeContextText: string;
}

/**
 * Detect plant and product entities from user query, resolve conversational context,
 * and fetch rich verified data directly from MySQL (same knowledge base as Plant & Product details).
 */
export async function resolveContextAndKnowledge(
  userQuery: string,
  persistedContext?: {
    currentPlantId?: string | null;
    currentProductId?: string | null;
    activeContextType?: "NONE" | "PLANT" | "PRODUCT";
  }
): Promise<ActiveContextResolution> {
  const queryLower = (userQuery || "").toLowerCase();

  // 1. Load all published plants and products dynamically from MySQL
  const [plantRows]: any = await pool.query(
    `SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.simpleUse, p.preparation, p.safetyNote,
            g.about, g.traditionalUses, g.whatResearchSays, g.commonPreparation,
            g.safetyInformation, g.whoShouldBeCareful, g.medicineInteractions, g.whenToConsultDoctor
     FROM plants p
     LEFT JOIN plant_guides g ON g.plantId = p.id
     ORDER BY p.commonName ASC`
  );

  const [productRows]: any = await pool.query(
    `SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.dosageForm, hp.productType,
            hp.description, hp.intendedUse, hp.usageInstructions, hp.warningsPrecautions, hp.preparationGuide
     FROM herbal_products hp
     WHERE hp.isPublished = 1
     ORDER BY hp.name ASC`
  );

  // Define botanical synonyms/aliases
  const plantAliases: Record<string, string[]> = {
    "lagundi": ["lagundi", "vitex negundo", "vitex", "dangla"],
    "sambong": ["sambong", "blumea balsamifera", "subusub", "alimon"],
    "tsaang-gubat": ["tsaang gubat", "tsaang-gubat", "carmona retusa", "ehretia microphylla", "wild tea", "putputay", "forest tea"],
    "yerba-buena": ["yerba buena", "yerba-buena", "clinopodium douglasii", "mentha cordifolia", "hierba buena", "marsh mint"],
    "turmeric": ["turmeric", "luyang dilaw", "curcuma longa", "dilaw", "yellow ginger"],
    "ginger": ["ginger", "luya", "zingiber officinale", "salabat"],
  };

  // Define product aliases
  const productAliases: Record<string, string[]> = {
    "ascof-lagundi-syrup": ["ascof", "ascof lagundi", "ascof lagundi syrup", "pascual laboratories ascof"],
    "re-leaf-sambong-tablet": ["re-leaf", "releaf", "re-leaf sambong", "releaf sambong", "re-leaf sambong tablet"],
    "tolak-angin-herbal-liquid": ["tolak angin", "tolakangin", "tolak angin herbal liquid", "sido muncul"],
  };

  // 2. Entity Detection
  let detectedProduct: any = null;
  let detectedPlant: any = null;

  // Check product match first (e.g. "ASCOF Lagundi" matches product ASCOF, not just plant Lagundi)
  for (const prod of productRows) {
    const aliases = productAliases[prod.id] || [];
    const directTokens = [
      prod.brandName?.toLowerCase(),
      prod.name?.toLowerCase(),
      prod.slug?.toLowerCase(),
      ...aliases,
    ].filter(Boolean);

    if (directTokens.some((tok) => tok && queryLower.includes(tok))) {
      detectedProduct = prod;
      break;
    }
  }

  // If no product detected, check plant match
  if (!detectedProduct) {
    for (const plant of plantRows) {
      const aliases = plantAliases[plant.id] || plantAliases[plant.slug] || [];
      const cleanCommon = plant.commonName.replace(/\\s*\\([^)]*\\)/, "").toLowerCase();
      const directTokens = [
        cleanCommon,
        plant.commonName.toLowerCase(),
        plant.scientificName.toLowerCase(),
        plant.slug.toLowerCase(),
        ...aliases,
      ].filter(Boolean);

      if (directTokens.some((tok) => tok && queryLower.includes(tok))) {
        detectedPlant = plant;
        break;
      }
    }
  }

  // 3. Fallback to Persisted Conversational Context for follow-up questions
  // E.g.: "What studies support it?", "What plant is this made from?", "What about its safety?"
  let activeType: "PLANT" | "PRODUCT" | "NONE" = "NONE";
  let activePlant: any = null;
  let activeProduct: any = null;

  if (detectedProduct) {
    activeType = "PRODUCT";
    activeProduct = detectedProduct;
  } else if (detectedPlant) {
    activeType = "PLANT";
    activePlant = detectedPlant;
  } else if (persistedContext?.activeContextType === "PRODUCT" && persistedContext.currentProductId) {
    activeProduct = productRows.find((p: any) => p.id === persistedContext.currentProductId || p.slug === persistedContext.currentProductId);
    if (activeProduct) {
      activeType = "PRODUCT";
    }
  } else if (persistedContext?.activeContextType === "PLANT" && persistedContext.currentPlantId) {
    activePlant = plantRows.find((p: any) => p.id === persistedContext.currentPlantId || p.slug === persistedContext.currentPlantId);
    if (activePlant) {
      activeType = "PLANT";
    }
  }

  // 4. Detect if the user asked about an unrecognized/unsupported entity
  // E.g., "What is Ashwagandha?", "Tell me about Ginseng", "What is Biogesic?"
  let isUnknownEntity = false;
  if (activeType === "NONE") {
    const unknownInquiryKeywords = [
      "what is", "tell me about", "can i take", "is there", "how about", "what about",
      "dosage for", "side effects of", "benefits of", "contraindications for"
    ];
    const isQuestionAboutEntity = unknownInquiryKeywords.some((k) => queryLower.includes(k));
    if (isQuestionAboutEntity) {
      // Check if it mentions known general terms
      const generalTerms = ["herb", "plant", "product", "medicine", "screening", "facility", "clinic", "natureaide", "health"];
      const isGeneral = generalTerms.some((t) => queryLower === t || queryLower.endsWith(t));
      if (!isGeneral) {
        isUnknownEntity = true;
      }
    }
  }

  // 5. Build rich Grounded Knowledge Context from MySQL
  let knowledgeContextText = "";

  if (activeType === "PRODUCT" && activeProduct) {
    // A. Contained Plants
    const [linkedPlants]: any = await pool.query(
      `SELECT p.id, p.commonName, p.scientificName, p.simpleUse
       FROM product_plants pp
       JOIN plants p ON p.id = pp.plantId
       WHERE pp.productId = ?`,
      [activeProduct.id]
    );

    // B. Ingredients
    const [ingredients]: any = await pool.query(
      `SELECT ingredientName, strength, ingredientType
       FROM product_ingredients
       WHERE productId = ?
       ORDER BY id ASC`,
      [activeProduct.id]
    );

    // C. Regulatory Record
    const [regulatory]: any = await pool.query(
      `SELECT regulatoryAgency, registrationNumber, registrationStatus, classification, verificationSource, verificationUrl
       FROM product_regulatory_records
       WHERE productId = ?
       LIMIT 1`,
      [activeProduct.id]
    );

    // D. Official Resources
    const [resources]: any = await pool.query(
      `SELECT resourceName, resourceType, url, description
       FROM product_resources
       WHERE productId = ?`,
      [activeProduct.id]
    );

    // E. Peer-reviewed Scientific References (strictly source_verified = 1)
    const [references]: any = await pool.query(
      `SELECT sr.id, sr.pubmedId, sr.doi, sr.title, sr.authors, sr.publicationYear,
              sr.journalOrPublisher, sr.studyType, sr.shortSummary, sr.evidence_scope,
              pr.evidenceClassification, pr.evidenceNote
       FROM product_references pr
       JOIN scientific_references sr ON sr.id = pr.referenceId
       WHERE pr.productId = ? AND sr.source_verified = 1
       ORDER BY sr.publicationYear DESC`,
      [activeProduct.id]
    );

    let prepGuideStr = activeProduct.usageInstructions || "Refer to packaging";
    if (activeProduct.preparationGuide) {
      try {
        const g = typeof activeProduct.preparationGuide === "string"
          ? JSON.parse(activeProduct.preparationGuide)
          : activeProduct.preparationGuide;
        prepGuideStr = `Method: \${g.method || "N/A"} | Serving: \${g.servingAmount || "1 unit"} | Water: \${g.waterAmount || "N/A"} | Frequency: \${g.frequency || "As directed"}`;
        if (g.steps && g.steps.length > 0) {
          prepGuideStr += " | Steps: " + g.steps.join(" -> ");
        }
      } catch {}
    }

    const regRecord = regulatory[0];
    const regStatusStr = regRecord
      ? `\${regRecord.regulatoryAgency} Registration #\${regRecord.registrationNumber} (\${regRecord.registrationStatus}, Classification: \${regRecord.classification || "Traditional Herbal Preparation"}) verified via \${regRecord.verificationSource || "FDA Verification Portal"}`
      : "No verified FDA registration record is currently on file in NatureAide.";

    const plantListStr = linkedPlants.length > 0
      ? linkedPlants.map((p: any) => `\${p.commonName} (\${p.scientificName})`).join(", ")
      : "No direct single-plant link recorded.";

    const ingListStr = ingredients.length > 0
      ? ingredients.map((i: any) => `\${i.ingredientName}\${i.strength ? " (" + i.strength + ")" : ""} [\${i.ingredientType || "Active"}]`).join("; ")
      : "Standardized herbal extract.";

    const resListStr = resources.length > 0
      ? resources.map((r: any) => `• \${r.resourceName} (\${r.resourceType}): \${r.url}`).join("\n")
      : "No external official links cataloged.";

    let refListStr = "No peer-reviewed citations indexed for this product.";
    if (references.length > 0) {
      refListStr = references.map((r: any) =>
        `• [\${r.evidenceClassification}] PMID \${r.pubmedId}: "\${r.title}" (\${r.publicationYear}) in \${r.journalOrPublisher}. Scope: \${r.evidence_scope}. Summary: \${r.shortSummary}`
      ).join("\n");
    }

    knowledgeContextText = `
[CURRENT VERIFIED PRODUCT IN FOCUS]
Product Name: \${activeProduct.name}
Brand Name: \${activeProduct.brandName}
Manufacturer: \${activeProduct.manufacturer}
Product Type & Form: \${activeProduct.dosageForm} (\${activeProduct.productType})
Documented Intended Use: \${activeProduct.intendedUse || activeProduct.description || "Traditional herbal relief"}
Contained Medicinal Plant(s): \${plantListStr}
Active & Botanical Ingredients: \${ingListStr}
Preparation / Usage Directions: \${prepGuideStr}
Warnings & Precautions: \${activeProduct.warningsPrecautions || "Follow manufacturer package label precautions."}
Regulatory Record: \${regStatusStr}
Official Product Resources:
\${resListStr}

Scientific Evidence on Record:
- Specific Product Research: Not Available (No clinical trial testing this exact finished commercial product is on file).
- Ingredient / Plant Research: Available (\${references.length} verified studies evaluating the herbal ingredient).
- CRITICAL SCIENTIFIC DISTINCTION: This evidence proves the pharmacological properties of the herbal ingredient (\${plantListStr}), NOT proof that this specific commercial product was tested in a clinical trial.
Verified Citations:
\${refListStr}
`;
  } else if (activeType === "PLANT" && activePlant) {
    // A. References matching this plant (strictly source_verified = 1)
    const cleanCommon = activePlant.commonName.replace(/\\s*\\([^)]*\\)/, "").trim();
    const [references]: any = await pool.query(
      `SELECT sr.id, sr.pubmedId, sr.doi, sr.title, sr.authors, sr.publicationYear,
              sr.journalOrPublisher, sr.studyType, sr.shortSummary, sr.evidence_scope
       FROM scientific_references sr
       WHERE sr.source_verified = 1
         AND (sr.plantOrIngredientStudied LIKE ? OR sr.plantOrIngredientStudied LIKE ?)
       ORDER BY sr.publicationYear DESC`,
      [\`%\${cleanCommon}%\`, \`%\${activePlant.scientificName}%\`]
    );

    // B. Verified commercial products containing this plant
    const [linkedProducts]: any = await pool.query(
      `SELECT hp.id, hp.name, hp.brandName, hp.manufacturer, hp.dosageForm
       FROM herbal_products hp
       JOIN product_plants pp ON pp.productId = hp.id
       WHERE pp.plantId = ? AND hp.isPublished = 1`,
      [activePlant.id]
    );

    let productStr = "Currently, there are no verified commercial products linked to this plant in the NatureAide knowledge base.";
    if (linkedProducts.length > 0) {
      productStr = linkedProducts.map((p: any) => `• \${p.name} (Brand: \${p.brandName}, Manufacturer: \${p.manufacturer}) - Form: \${p.dosageForm}`).join("\n");
    }

    let refStr = "Verified scientific evidence is not currently available in the NatureAide knowledge base.";
    if (references.length > 0) {
      refStr = references.map((r: any) => {
        const scopeNote = r.evidence_scope === "MULTI_INGREDIENT_EVIDENCE"
          ? "[MULTI_INGREDIENT_EVIDENCE - Evaluates a multi-herbal combination, not standalone proof of single herb]"
          : "[SINGLE_HERBAL_EVIDENCE - Directly studies this plant]";
        return `• PMID \${r.pubmedId} \${scopeNote}: "\${r.title}" by \${r.authors} (\${r.publicationYear}) in \${r.journalOrPublisher}. Study Type: \${r.studyType}. Key Findings: \${r.shortSummary}`;
      }).join("\n");
    }

    knowledgeContextText = `
[CURRENT VERIFIED MEDICINAL PLANT IN FOCUS]
Plant Name: \${activePlant.commonName}
Scientific Name: \${activePlant.scientificName}
Documented Uses: \${activePlant.traditionalUses || activePlant.simpleUse || "Traditional Philippine herbal remedy"}
Preparation & Administration: \${activePlant.commonPreparation || activePlant.preparation || "Decoction or infusion as documented"}
Safety & Precautions: \${activePlant.safetyInformation || activePlant.safetyNote || "Consult a healthcare professional prior to use"}
Who Should Be Careful: \${activePlant.whoShouldBeCareful || "Pregnant and nursing women should avoid or exercise caution"}
Medication Interactions: \${activePlant.medicineInteractions || "Separate from prescription drugs"}
When to Consult Doctor: \${activePlant.whenToConsultDoctor || "If symptoms persist or worsen"}
Clinical Pharmacognosy Overview: \${activePlant.whatResearchSays || "Documented in Philippine national herbal research"}

Verified Scientific References (NCBI PubMed):
\${refStr}

Verified Commercial Herbal Products in NatureAide:
\${productStr}
`;
  }

  // Also include general summary of all cataloged plants and products for broad questions
  const plantsCatalogSummary = plantRows.map((p: any) =>
    `• \${p.commonName} (\${p.scientificName}): \${p.simpleUse || "Herbal remedy"}`
  ).join("\n");

  const productsCatalogSummary = productRows.map((p: any) =>
    `• \${p.name} (Brand: \${p.brandName}, Manufacturer: \${p.manufacturer})`
  ).join("\n");

  const fullKnowledgeText = `
=== CURRENT ACTIVE CONTEXT ===
\${knowledgeContextText || "No single plant or product is currently in exclusive focus."}

=== FULL NATUREAIDE CATALOG SUMMARY ===
Verified Philippine Medicinal Plants:
\${plantsCatalogSummary}

Verified Published Commercial Herbal Products:
\${productsCatalogSummary}
`;

  return {
    activeType,
    plantId: activePlant ? activePlant.id : null,
    productId: activeProduct ? activeProduct.id : null,
    activeEntityName: activeProduct ? activeProduct.name : activePlant ? activePlant.commonName : null,
    isUnknownEntity,
    knowledgeContextText: fullKnowledgeText,
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
}

/**
 * Execute chat completion with automatic 3-model fallback:
 * Model 1 (Primary) -> Model 2 (Fallback) -> Model 3 (Final Fallback)
 */
export async function executeChatWithFallback(
  messages: ChatMessageParam[],
  customCandidates?: ModelCandidate[]
): Promise<GenerateResult> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return {
      content:
        "The AI assistant is temporarily unavailable because the server API key is not configured. Please contact the administrator.",
      modelUsed: "none",
      fallbackCount: 0,
      modelsAttempted: [],
      error: "MISSING_API_KEY",
    };
  }

  const candidates = customCandidates && customCandidates.length > 0 ? customCandidates : DEFAULT_MODELS;
  const modelsAttempted: string[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    modelsAttempted.push(candidate.id);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout per model

      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${apiKey}\`,
          "Content-Type": "application/json",
          "User-Agent": "NatureAide-AI-Assistant/1.0",
        },
        body: JSON.stringify({
          model: candidate.id,
          messages: messages,
          max_tokens: 800,
          temperature: 0.2, // Low temperature for factual precision
          top_p: 0.9,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Successful response
      if (response.ok) {
        const data = await response.json();
        const choice = data.choices?.[0];
        const content = choice?.message?.content?.trim();

        if (content) {
          return {
            content,
            modelUsed: candidate.id,
            fallbackCount: i,
            modelsAttempted,
          };
        }
      }

      // Read error details without exposing credentials
      let errorStatus = response.status;
      let errorDetails = "";
      try {
        const errJson = await response.json();
        errorDetails = errJson?.error?.message || "";
      } catch {
        errorDetails = await response.text().catch(() => "");
      }

      console.warn(
        \`[AskNatureAide] Model Candidate \${i + 1} (\${candidate.id}) failed with HTTP \${errorStatus}: \${errorDetails.slice(0, 120)}. Trying fallback candidate...\`
      );
    } catch (err: any) {
      console.warn(
        \`[AskNatureAide] Model Candidate \${i + 1} (\${candidate.id}) request threw: \${err?.name || "Error"} - \${err?.message || ""}. Trying fallback candidate...\`
      );
    }
  }

  // All 3 models failed
  return {
    content:
      "NatureAide is currently experiencing unusually high demand, and all AI assistant model endpoints are temporarily busy. Please try your question again in a moment, or visit our verified monographs in the Herbal Finder.",
    modelUsed: "none",
    fallbackCount: candidates.length,
    modelsAttempted,
    error: "ALL_MODELS_UNAVAILABLE",
  };
}

/**
 * Builds the strict, grounded system prompt enforcing NatureAide safety boundaries,
 * screening compliance, verified plant and product distinctions, and context memory.
 */
export function buildSystemPrompt(
  screeningOutcome: "ELIGIBLE_TO_CONTINUE" | "PROFESSIONAL_GUIDANCE_REQUIRED" | "NO_SCREENING",
  knowledgeContextText: string,
  activeContextType: "PLANT" | "PRODUCT" | "NONE",
  isUnknownEntity: boolean
): string {
  const baseRules = \`You are "NatureAide Assistant", a compassionate, evidence-based AI herbal-information companion for the Philippine public.

MISSION & IDENTITY:
- Provide accurate, culturally respectful educational guidance regarding Philippine medicinal plants (Lagundi, Sambong, Tsaang Gubat, Yerba Buena, Turmeric, Ginger/Luya) and verified commercial herbal products (such as ASCOF Lagundi, Re-Leaf Sambong, Tolak Angin).
- Help users learn about traditional preparations, documented uses, safety precautions, active ingredients, manufacturers, and verified regulatory status.
- Maintain seamless conversation context across follow-up questions (e.g. if the user asked about ASCOF or Tsaang Gubat, understand subsequent queries like "What studies support it?", "What plant is this made from?", or "What about its safety?" as referring to that entity).

STRICT KNOWLEDGE GROUNDING RULES:
1. Ground all answers exclusively in the verified NatureAide MySQL Knowledge Base provided below.
2. If the user asks about a plant, herb, drug, or product that is NOT in the NatureAide knowledge base, or if information is unavailable, explicitly say:
   "I don’t currently have verified information about that in the NatureAide knowledge base."
3. NEVER fabricate plants, commercial brand names, FDA registration numbers, citations, PMIDs, DOIs, clinical trial findings, or therapeutic claims.

CRITICAL PRODUCT VS. PLANT EVIDENCE RULES:
1. Clearly distinguish commercial product information from botanical plant information.
2. For products, distinguish EXACT_PRODUCT_STUDY from INGREDIENT_EVIDENCE, PLANT_EVIDENCE, FORMULATION_STUDY, and SAFETY_EVIDENCE.
3. NEVER imply or state that plant research proves the effectiveness of a specific commercial finished product. Always clarify that scientific citations on record evaluate the herbal ingredient or botanical species, not a specific finished product clinical trial.
4. Only describe regulatory status when an actual verified regulatory record exists in the knowledge base.
5. If a plant has no verified commercial products (such as Turmeric, Tsaang Gubat, or Yerba Buena), state honestly that no verified commercial products are currently linked to it in the knowledge base.
6. If a plant has no verified scientific citations (such as Yerba Buena), state:
   "Verified scientific evidence is not currently available in the NatureAide knowledge base."

CRITICAL MEDICAL SAFETY BOUNDARIES:
1. NEVER diagnose diseases or conditions.
2. NEVER prescribe medical treatment, drug regimens, or unverified dosages.
3. NEVER tell a user to stop, replace, or alter prescription medications.
4. NEVER claim a commercial herbal product or plant cures, treats, or is the "best treatment" for a disease.
5. For acute symptoms (severe chest pain, breathing difficulty, uncontrollable bleeding, sudden paralysis, high persistent fever, or suspected poisoning), immediately urge seeking emergency medical care and direct the user to the NatureAide Facility Finder (/community/facilities).
6. Always conclude your response with the exact mandatory disclaimer:
   "?? \${MANDATORY_DISCLAIMER}"\`;

  let unknownEntityRule = "";
  if (isUnknownEntity) {
    unknownEntityRule = \`
CRITICAL UNKNOWN ENTITY DIRECTIVE:
The user is inquiring about an uncataloged or unverified plant, drug, or commercial product.
You MUST clearly and directly state:
"I don’t currently have verified information about that in the NatureAide knowledge base."
You may invite them to ask about our verified Philippine medicinal plants (Lagundi, Sambong, Tsaang Gubat, Yerba Buena, Turmeric, Ginger) or verified products (ASCOF Lagundi, Re-Leaf Sambong, Tolak Angin).\`;
  }

  let screeningRule = "";
  if (screeningOutcome === "PROFESSIONAL_GUIDANCE_REQUIRED") {
    screeningRule = \`
CRITICAL USER SCREENING RESTRICTION (ACTIVE):
The user's health screening status is: PROFESSIONAL_GUIDANCE_REQUIRED.
- The user has identified safety precautions (such as severe symptoms, organ impairment, pregnancy, or interacting prescription medications like blood thinners).
- Under NO circumstance may you recommend an herb, herbal remedy, product, or dosage to treat their personal symptoms or conditions.
- You must NOT suggest commercial herbal products as a workaround for this screening restriction.
- If the user asks for a recommendation, remedy, or what herb/product to take for their ailment:
  1. Politely and firmly inform them that based on their health safety screening profile, personalized herbal and product recommendations are restricted for their safety.
  2. Advise them to consult a qualified physician or pharmacist before taking any botanical preparations.
  3. Direct them to the NatureAide Healthcare Facility Finder at /community/facilities.
- You MAY answer general, purely educational botanical/product questions (e.g. "What is the scientific name of Lagundi?", "Who manufactures Re-Leaf?"), but you must never suggest using it for their personal symptoms.\`;
  } else if (screeningOutcome === "NO_SCREENING") {
    screeningRule = \`
USER SCREENING STATUS: NO_SCREENING
- The user has not yet completed the initial NatureAide Health Safety Screening.
- Gently remind them to complete their screening at /community/screening before seeking personalized herbal guidance so recommendations match their safety profile.\`;
  } else {
    screeningRule = \`
USER SCREENING STATUS: ELIGIBLE_TO_CONTINUE
- The user has completed screening with no active restrictions.
- You may provide educational herbal information, product details, traditional preparations, and safety reminders from the database.\`;
  }

  return \`\${baseRules}\n\${unknownEntityRule}\n\${screeningRule}\n\${knowledgeContextText}\`;
}
`;

fs.writeFileSync('src/lib/ai-assistant-service.ts', content, 'utf8');
console.log('Successfully updated src/lib/ai-assistant-service.ts');
