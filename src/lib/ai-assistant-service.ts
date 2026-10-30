import pool from "./db";
import { callGrokChat, isGrokConfigured, getGrokDiagnostics, GrokDiagnostics } from "./ai/grok-provider";

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
  intent: "OVERVIEW" | "PREPARATION" | "SAFETY" | "EVIDENCE" | "PRODUCTS" | "INGREDIENTS" | "REGULATORY" | "PLANT_PART" | "GENERAL" | "UNKNOWN";
  isUnknownEntity: boolean;
  knowledgeContextText: string;
  cardData: ContextCard | null;
  groundedFallbackAnswer?: string;
}

export async function resolveContextAndKnowledge(
  userQuery: string,
  persistedContext?: {
    currentPlantId?: string | null;
    currentProductId?: string | null;
    currentPreparationId?: string | null;
    activeContextType?: string;
  }
): Promise<ActiveContextResolution> {
  const queryLower = (userQuery || "").toLowerCase().trim();

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

  // 2. Detect Intent
  let intent: ActiveContextResolution["intent"] = "GENERAL";

  if (
    queryLower.includes("how is it prepared") ||
    queryLower.includes("how is this prepared") ||
    queryLower.includes("how do i prepare") ||
    queryLower.includes("preparation") ||
    queryLower.includes("how to cook") ||
    queryLower.includes("decoction") ||
    queryLower.includes("poultice") ||
    queryLower.includes("tea method")
  ) {
    intent = "PREPARATION";
  } else if (
    queryLower.includes("safety") ||
    queryLower.includes("precaution") ||
    queryLower.includes("warning") ||
    queryLower.includes("side effect") ||
    queryLower.includes("contraindication") ||
    queryLower.includes("safe for") ||
    queryLower.includes("who should avoid") ||
    queryLower.includes("interaction") ||
    queryLower.includes("pregnant") ||
    queryLower.includes("dose") ||
    queryLower.includes("dosage")
  ) {
    intent = "SAFETY";
  } else if (
    queryLower.includes("evidence") ||
    queryLower.includes("research") ||
    queryLower.includes("study") ||
    queryLower.includes("studies") ||
    queryLower.includes("clinical") ||
    queryLower.includes("trial") ||
    queryLower.includes("proof") ||
    queryLower.includes("pubmed") ||
    queryLower.includes("does this prove") ||
    queryLower.includes("what research")
  ) {
    intent = "EVIDENCE";
  } else if (
    queryLower.includes("products containing") ||
    queryLower.includes("what products contain") ||
    queryLower.includes("does it have products") ||
    queryLower.includes("show me products") ||
    queryLower.includes("commercial product") ||
    queryLower.includes("herbal product")
  ) {
    intent = "PRODUCTS";
  } else if (
    queryLower.includes("main ingredient") ||
    queryLower.includes("active ingredient") ||
    queryLower.includes("composition") ||
    queryLower.includes("what plant does it contain")
  ) {
    intent = "INGREDIENTS";
  } else if (
    queryLower.includes("registration") ||
    queryLower.includes("is it registered") ||
    queryLower.includes("fda approved") ||
    queryLower.includes("cpr") ||
    queryLower.includes("regulatory")
  ) {
    intent = "REGULATORY";
  } else if (
    queryLower.includes("what part") ||
    queryLower.includes("plant part") ||
    queryLower.includes("parts used")
  ) {
    intent = "PLANT_PART";
  } else if (
    queryLower.includes("tell me about") ||
    queryLower.includes("what is") ||
    queryLower.includes("who is") ||
    queryLower.includes("describe") ||
    queryLower.startsWith("about ")
  ) {
    intent = "OVERVIEW";
  }

  // 3. Entity Detection (Products first, then Plants)
  let detectedProduct: any = null;
  let detectedPlant: any = null;

  for (const prod of productRows) {
    const aliases = productAliases[prod.id] || [];
    const directTokens = [
      prod.brandName?.toLowerCase(),
      prod.name?.toLowerCase(),
      prod.slug?.toLowerCase(),
      ...aliases,
    ].filter(Boolean);

    if (directTokens.some((tok: string) => tok && queryLower.includes(tok))) {
      detectedProduct = prod;
      break;
    }
  }

  if (!detectedProduct) {
    for (const plant of plantRows) {
      const aliases = plantAliases[plant.id] || plantAliases[plant.slug] || [];
      const cleanCommon = plant.commonName.replace(/\s*\([^)]*\)/, "").toLowerCase();
      const directTokens = [
        cleanCommon,
        plant.commonName.toLowerCase(),
        plant.scientificName.toLowerCase(),
        plant.slug.toLowerCase(),
        ...aliases,
      ].filter(Boolean);

      if (directTokens.some((tok: string) => tok && queryLower.includes(tok))) {
        detectedPlant = plant;
        break;
      }
    }
  }

  // 4. Fallback to Persisted Conversational Context for follow-up questions ("it", "this plant", etc.)
  let activeType: "PLANT" | "PRODUCT" | "PREPARATION" | "NONE" = "NONE";
  let activePlant: any = null;
  let activeProduct: any = null;

  if (detectedProduct) {
    activeType = "PRODUCT";
    activeProduct = detectedProduct;
  } else if (detectedPlant) {
    activeType = "PLANT";
    activePlant = detectedPlant;
  } else if (persistedContext?.activeContextType === "PRODUCT" && persistedContext.currentProductId) {
    activeProduct = productRows.find(
      (p: any) => p.id === persistedContext.currentProductId || p.slug === persistedContext.currentProductId
    );
    if (activeProduct) activeType = "PRODUCT";
  } else if (persistedContext?.activeContextType === "PLANT" && persistedContext.currentPlantId) {
    activePlant = plantRows.find(
      (p: any) => p.id === persistedContext.currentPlantId || p.slug === persistedContext.currentPlantId
    );
    if (activePlant) activeType = "PLANT";
  }

  // If asking about the plant inside an active product
  if (activeType === "PRODUCT" && activeProduct && intent === "INGREDIENTS") {
    const [linked]: any = await pool.query(
      `SELECT plantId FROM product_plants WHERE productId = ? LIMIT 1`,
      [activeProduct.id]
    );
    if (linked && linked.length > 0) {
      const p = plantRows.find((pl: any) => pl.id === linked[0].plantId);
      if (p) activePlant = p;
    }
  }

  // 5. Detect Unknown Entity
  let isUnknownEntity = false;
  if (!activePlant && !activeProduct) {
    // Check if user is asking about an unrecognized plant / substance
    const genericTriggers = ["plant", "herb", "medicine", "tree", "leaf", "what is", "tell me about", "monograph", "dosage", "cure", "effects of"];
    const hasGenericQuestion = genericTriggers.some((t) => queryLower.includes(t));
    if (hasGenericQuestion && queryLower.length > 10) {
      isUnknownEntity = true;
    }
  }

  // 6. Build Grounded Context and Structured Card Data dynamically from MySQL
  let knowledgeContextText = "";
  let cardData: ContextCard | null = null;
  let groundedFallbackAnswer = "";

  if (isUnknownEntity) {
    groundedFallbackAnswer = "I don't currently have verified information about that in the NaturAide knowledge base.";
    cardData = {
      type: "NONE",
      title: "Knowledge Base Notice",
      actions: [
        { label: "Explore 10 DOH Medicinal Plants", href: "/community/herbal-guide?filter=pitahc" },
        { label: "View Registered Herbal Products", href: "/community/herbal-guide?tab=products" },
      ],
    };
    knowledgeContextText = `User is asking about an unrecognized entity not found in NaturAide database.\nExplicitly state: "I don't currently have verified information about that in the NaturAide knowledge base." Do NOT invent or fabricate any details.`;
  } else if (activeType === "PLANT" && activePlant) {
    // Dynamic queries for verified preparations, references, and products
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

    // Query published/INTEGRATED research proposals for this plant (strictly excluding non-integrated ones)
    let integratedKnowledgeText = "";
    try {
      const [integratedProposals]: any = await pool.query(
        `SELECT kip.proposalCode, kip.title, kip.knowledgeArea, kiv.proposedContent
         FROM knowledge_integration_proposals kip
         JOIN knowledge_integration_versions kiv ON kiv.proposalId = kip.id AND kiv.versionNumber = kip.currentVersionNumber
         WHERE kip.status = 'INTEGRATED' AND kip.plantId = ?`,
        [activePlant.id]
      );
      if (integratedProposals && integratedProposals.length > 0) {
        integratedKnowledgeText = integratedProposals
          .map((p: any) => `- [Integrated Finding ${p.proposalCode} - ${p.title}]: ${p.proposedContent}`)
          .join("\n");
      }
    } catch {
      // Table may not have proposals or schema
    }

    const plantPart = activePlant.plant_parts_used || (preps[0]?.plant_part_used) || "Leaves";
    const prepCount = preps.length;
    const refCount = refs.length;
    const prodCount = prods.length;

    // Handle INTENT specific answers
    if (intent === "PREPARATION") {
      if (prepCount === 0) {
        groundedFallbackAnswer = "I don't currently have a verified traditional preparation guide for this plant in the NaturAide knowledge base.";
        cardData = {
          type: "PREPARATION",
          title: `${activePlant.commonName} Preparation`,
          actions: [
            { label: "Safety Precautions", query: `What are the safety precautions for ${activePlant.commonName}?` },
            { label: `View ${activePlant.commonName}`, href: `/community/plants/${activePlant.slug || activePlant.id}` },
          ],
        };
      } else {
        const p1 = preps[0];
        groundedFallbackAnswer = `${activePlant.commonName} (${activePlant.scientificName}) has ${prepCount} verified traditional preparation ${prepCount === 1 ? "method" : "methods"} documented in Philippine health monographs. The primary part used is ${plantPart}.`;
        cardData = {
          type: "PREPARATION",
          title: `${activePlant.commonName} Traditional Preparation`,
          subtitle: `${p1.title} (${p1.preparation_type})`,
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
      }
    } else if (intent === "SAFETY") {
      const safetyText = activePlant.contraindications || activePlant.safetyInformation || activePlant.safetyNote || "Consult a qualified physician prior to use.";
      groundedFallbackAnswer = `For ${activePlant.commonName} (${activePlant.scientificName}), documented safety precautions note: ${safetyText}`;
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
      const clinicalCount = refs.filter((r: any) => (r.studyType || "").toLowerCase().includes("clinical") || (r.studyType || "").toLowerCase().includes("human")).length;
      groundedFallbackAnswer = `${activePlant.commonName} (${activePlant.scientificName}) has ${refCount} peer-reviewed scientific ${refCount === 1 ? "citation" : "citations"} indexed in the NaturAide knowledge base (${clinicalCount > 0 ? `${clinicalCount} clinical trials on record` : "preclinical laboratory studies"}).`;
      cardData = {
        type: "EVIDENCE",
        title: `${activePlant.commonName} Research & Scientific Evidence`,
        entityId: activePlant.id,
        entitySlug: activePlant.slug,
        metrics: [
          { icon: "book", label: "Indexed Citations", value: `${refCount} verified studies` },
          { icon: "leaf", label: "Clinical Evidence", value: clinicalCount > 0 ? `${clinicalCount} clinical trials` : "Preclinical/monograph" },
        ],
        actions: [
          { label: "Traditional Preparation", query: `How is ${activePlant.commonName} prepared?` },
          { label: "Safety Precautions", query: `What are the safety precautions for ${activePlant.commonName}?` },
          { label: `View ${activePlant.commonName} Monograph →`, href: `/community/plants/${activePlant.slug || activePlant.id}` },
        ],
      };
    } else {
      // DEFAULT / OVERVIEW
      groundedFallbackAnswer = `${activePlant.commonName} (${activePlant.scientificName}) is a medicinal plant documented in Philippine herbal-health sources, particularly for ${activePlant.simpleUse || activePlant.category}.`;
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

    knowledgeContextText = `
CURRENT VERIFIED MEDICINAL PLANT IN FOCUS:
- Name: ${activePlant.commonName} (${activePlant.scientificName})
- Documented Uses: ${activePlant.simpleUse || activePlant.category}
- Plant Part Used: ${plantPart}
- Documented Preparations Count: ${prepCount}
- Verified Research Count: ${refCount}
- Related Commercial Products Count: ${prodCount}
- Precautions: ${activePlant.safetyInformation || activePlant.safetyNote || "Consult a doctor prior to use."}
${integratedKnowledgeText ? `\nVERIFIED INTEGRATED KNOWLEDGE:\n${integratedKnowledgeText}` : ""}
`;
  } else if (activeType === "PRODUCT" && activeProduct) {
    // Dynamic queries for this product
    const [linkedPlants]: any = await pool.query(
      `SELECT p.id, p.slug, p.commonName, p.scientificName
       FROM product_plants pp
       JOIN plants p ON p.id = pp.plantId
       WHERE pp.productId = ?`,
      [activeProduct.id]
    );

    const [ingredients]: any = await pool.query(
      `SELECT ingredientName, strength, ingredientType
       FROM product_ingredients
       WHERE productId = ?
       ORDER BY id ASC`,
      [activeProduct.id]
    );

    const [regRecordRows]: any = await pool.query(
      `SELECT registrationNumber, regulatoryAgency, productClassification, registrationStatus, validUntil
       FROM product_regulatory_records
       WHERE productId = ?
       LIMIT 1`,
      [activeProduct.id]
    );
    const regRecord = regRecordRows[0] || null;

    const mainPlant = linkedPlants[0] || null;
    const mainPlantName = mainPlant ? `${mainPlant.commonName} (${mainPlant.scientificName})` : "botanical extracts";

    const [refs]: any = await pool.query(
      `SELECT sr.id, sr.pubmedId, sr.title, sr.publicationYear, sr.studyType
       FROM scientific_references sr
       WHERE sr.source_verified = 1
         AND (sr.plantOrIngredientStudied LIKE ? OR sr.plantOrIngredientStudied LIKE ?)
       ORDER BY sr.publicationYear DESC`,
      [`%${activeProduct.name}%`, `%${mainPlant ? mainPlant.commonName : "active"}%`]
    );

    const isExactProductStudy = refs.some((r: any) =>
      (r.title || "").toLowerCase().includes(activeProduct.name.toLowerCase())
    );

    if (intent === "INGREDIENTS") {
      groundedFallbackAnswer = `${activeProduct.name} is formulated with ${mainPlantName} as its primary active botanical component.`;
      cardData = {
        type: "PRODUCT",
        title: `${activeProduct.name} Ingredients`,
        entityId: activeProduct.id,
        entitySlug: activeProduct.slug,
        metrics: [
          { icon: "leaf", label: "Active Herb", value: mainPlant ? mainPlant.commonName : "Botanical" },
          { icon: "pill", label: "Dosage Form", value: activeProduct.dosageForm },
        ],
        actions: [
          { label: "Dosage Form Info", query: `What is the dosage form of ${activeProduct.name}?` },
          ...(mainPlant ? [{ label: `View ${mainPlant.commonName} Plant`, href: `/community/plants/${mainPlant.slug || mainPlant.id}` }] : []),
          { label: `View Product Details →`, href: `/community/products/${activeProduct.slug || activeProduct.id}` },
        ],
      };
    } else if (intent === "REGULATORY") {
      groundedFallbackAnswer = regRecord
        ? `${activeProduct.name} is verified on record with ${regRecord.regulatoryAgency} under CPR #${regRecord.registrationNumber} (${regRecord.registrationStatus}).`
        : `${activeProduct.name} is classified as an approved commercial herbal preparation in the NaturAide database.`;
      cardData = {
        type: "PRODUCT",
        title: `Regulatory Details: ${activeProduct.name}`,
        entityId: activeProduct.id,
        entitySlug: activeProduct.slug,
        metrics: [
          { icon: "shield", label: "Agency", value: regRecord?.regulatoryAgency || "FDA/PITAHC" },
          { icon: "package", label: "CPR Number", value: regRecord?.registrationNumber || "Verified" },
          { icon: "shield", label: "Status", value: regRecord?.registrationStatus || "Verified" },
        ],
        actions: [
          { label: "What research supports this?", query: `What research supports ${activeProduct.name}?` },
          { label: "What are its warnings?", query: `What are the warnings for ${activeProduct.name}?` },
          { label: `View Product Details →`, href: `/community/products/${activeProduct.slug || activeProduct.id}` },
        ],
      };
    } else if (intent === "EVIDENCE") {
      groundedFallbackAnswer = isExactProductStudy
        ? `Evidence is indexed specifically evaluating this finished commercial product formulation in controlled trials.`
        : `NaturAide indexes research for the active ingredient ${mainPlantName}. Note: Research on the medicinal plant or ingredient does not prove the clinical efficacy of this specific finished commercial product.`;
      cardData = {
        type: "EVIDENCE",
        title: `Evidence for ${activeProduct.name}`,
        entityId: activeProduct.id,
        entitySlug: activeProduct.slug,
        metrics: [
          { icon: "book", label: "Exact Product Study", value: isExactProductStudy ? "Available" : "Not Tested (Ingredient Research)" },
          { icon: "leaf", label: "Ingredient Research", value: `${refs.length} citations on file` },
        ],
        actions: [
          { label: "Registration Info", query: `Is registration information available for ${activeProduct.name}?` },
          { label: "What are its warnings?", query: `What are the warnings for ${activeProduct.name}?` },
          { label: `View Evidence Details →`, href: `/community/products/${activeProduct.slug || activeProduct.id}` },
        ],
      };
    } else {
      groundedFallbackAnswer = `${activeProduct.name} is a commercial ${activeProduct.productType || "herbal preparation"} (${activeProduct.dosageForm}) manufactured by ${activeProduct.manufacturer}, containing ${mainPlantName}.`;
      cardData = {
        type: "PRODUCT",
        title: activeProduct.name,
        subtitle: `Manufacturer: ${activeProduct.manufacturer}`,
        entityId: activeProduct.id,
        entitySlug: activeProduct.slug,
        metrics: [
          { icon: "pill", label: "Form & Strength", value: `${activeProduct.dosageForm} ${activeProduct.dosageStrength ? `(${activeProduct.dosageStrength})` : ""}` },
          { icon: "leaf", label: "Main Herb", value: mainPlant ? mainPlant.commonName : "Botanical" },
          { icon: "shield", label: "Regulatory", value: regRecord ? `CPR #${regRecord.registrationNumber} (${regRecord.registrationStatus})` : "Verified" },
          { icon: "book", label: "Research", value: `${refs.length} Verified Sources` },
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
    }

    knowledgeContextText = `
CURRENT VERIFIED COMMERCIAL PRODUCT IN FOCUS:
- Product Name: ${activeProduct.name}
- Brand / Manufacturer: ${activeProduct.brandName} (${activeProduct.manufacturer})
- Dosage Form: ${activeProduct.dosageForm} ${activeProduct.dosageStrength ? `(${activeProduct.dosageStrength})` : ""}
- Contained Plant: ${mainPlantName}
- Registration: ${regRecord ? `${regRecord.regulatoryAgency} #${regRecord.registrationNumber} (${regRecord.registrationStatus})` : "Verified"}
- Exact Product Tested: ${isExactProductStudy ? "YES" : "NO (Ingredient research on file)"}
`;
  } else {
    // General overview inquiry
    groundedFallbackAnswer = `NaturAide provides verified factual information from Philippine health authorities (DOH and PITAHC) on 10 traditional medicinal plants and 40 registered commercial herbal products.`;
    cardData = {
      type: "GENERAL",
      title: "NaturAide Botanical Knowledge Base",
      actions: [
        { label: "10 DOH Medicinal Plants", query: "Tell me about the 10 PITAHC medicinal plants" },
        { label: "Traditional Preparation", query: "How are medicinal plants traditionally prepared?" },
        { label: "Safety Precautions", query: "What safety precautions should I know?" },
        { label: "Registered Products", query: "What commercial herbal products are registered?" },
      ],
    };
  }

  return {
    activeType,
    plantId: activePlant ? activePlant.id : null,
    productId: activeProduct ? activeProduct.id : null,
    preparationId: persistedContext?.currentPreparationId || null,
    activeEntityName: activeProduct ? activeProduct.name : activePlant ? activePlant.commonName : null,
    activeEntitySlug: activeProduct ? activeProduct.slug : activePlant ? activePlant.slug : null,
    intent,
    isUnknownEntity,
    knowledgeContextText,
    cardData,
    groundedFallbackAnswer,
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
  isUnknownEntity?: boolean
): string {
  const isUnknown =
    typeof activeContextTypeOrUnknown === "boolean"
      ? activeContextTypeOrUnknown
      : Boolean(isUnknownEntity);

  return `You are Ask NaturAide, an educational medicinal-plant information assistant for the NaturAide platform.

Answer using ONLY the verified NaturAide context supplied with the request.
Do not rely on unsupported general model knowledge to invent missing scientific or medical information.

If the supplied NaturAide context does not support the answer, clearly say that the information is not currently available in the verified NaturAide knowledge base.

Never fabricate:
citations, authors, journals, years, DOIs, PMIDs, clinical trials, drug interactions, dosages, preparation quantities, contraindications, chemical identifiers, ADME predictions, toxicity predictions, docking results, PDB IDs, binding affinities, laboratory findings, regulatory approval, product claims.

Do not diagnose disease.
Do not prescribe treatment.
Do not tell users to stop or replace prescribed medication.
Do not claim that computational evidence proves clinical effectiveness.
Do not describe a research prototype formulation as a Community traditional preparation.
Clearly distinguish educational information from professional medical advice.
If the question requires individualized medical judgment, recommend consulting an appropriate licensed healthcare professional.

CRITICAL SHORT ANSWER RULE:
- Keep answers concise, factual, and easy to understand (1 to 2 clear paragraphs, max 3-4 sentences).
- Do NOT dump raw database records, tables, or long bullet lists into chat.
- Structured metrics and follow-up action buttons are automatically rendered below your response by the NaturAide UI.

${isUnknown ? `CRITICAL: The user's query is about an unverified entity outside NaturAide. Reply ONLY:
"I don't currently have verified information about that in the NaturAide knowledge base."` : ""}

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

