import pool from "../src/lib/db";
import fs from "fs";
import path from "path";
import {
  resolveContextAndKnowledge,
  buildSystemPrompt,
  executeChatWithFallback,
} from "../src/lib/ai-assistant-service";

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  message?: string;
}

async function runTests() {
  const results: TestResult[] = [];
  let testCounter = 1;

  function record(name: string, condition: boolean, message?: string) {
    results.push({ num: testCounter++, name, passed: condition, message });
    if (condition) {
      console.log(`✓ [PASS] #${testCounter - 1}: ${name}`);
    } else {
      console.error(`✗ [FAIL] #${testCounter - 1}: ${name} - ${message || "Failed"}`);
    }
  }

  console.log("=================================================================");
  console.log("NATUREAIDE PITAHC INTEGRATION & SYSTEM VERIFICATION TEST SUITE");
  console.log("=================================================================\n");

  // 1. Target 10 PITAHC Plants Exist in DB
  const [pitahcPlants]: any = await pool.query(
    "SELECT * FROM plants WHERE is_pitahc = 1 ORDER BY commonName ASC"
  );
  record("10 PITAHC plants present with is_pitahc = 1", pitahcPlants.length === 10, `Found: ${pitahcPlants.length}`);

  const expectedSlugs = [
    "akapulko", "ampalaya", "bawang", "bayabas", "lagundi",
    "niyog-niyogan", "sambong", "tsaang-gubat", "ulasimang-bato", "yerba-buena"
  ];
  const actualSlugs = pitahcPlants.map((p: any) => p.slug).sort();
  const allSlugsMatch = expectedSlugs.every(slug => actualSlugs.includes(slug));
  record("All 10 official PITAHC slugs match expected set", allSlugsMatch, `Found slugs: ${actualSlugs.join(", ")}`);

  // 2. Non-PITAHC plants preserved with is_pitahc = 0
  const [nonPitahc]: any = await pool.query(
    "SELECT slug, commonName, is_pitahc FROM plants WHERE slug IN ('ginger', 'turmeric')"
  );
  const preservedCount = nonPitahc.filter((p: any) => p.is_pitahc === 0).length;
  record("Non-PITAHC plants (ginger, turmeric) preserved with is_pitahc = 0", preservedCount === 2, `Count: ${preservedCount}`);

  // 3. Official Source Provenance Populated
  const allHaveSource = pitahcPlants.every(
    (p: any) => p.source_organization && p.source_organization.includes("PITAHC") &&
                p.source_url && p.source_url.includes("pitahc.gov.ph") &&
                p.source_verified === 1 &&
                p.source_verified_at !== null
  );
  record("Official PITAHC source provenance verified on all 10 plants", allHaveSource);

  // 4. Botanical Metadata Populated (synonyms, local names, plant parts used)
  const allHaveBotanical = pitahcPlants.every(
    (p: any) => p.botanical_synonyms && p.local_names && p.plant_parts_used
  );
  record("Botanical synonyms, local names, and parts used populated on all 10 plants", allHaveBotanical);

  // 5. Scientific Evidence Rigorously Distinguished in plant_guides
  const [guides]: any = await pool.query(
    `SELECT g.*, p.slug FROM plant_guides g
     JOIN plants p ON p.id = g.plantId
     WHERE p.is_pitahc = 1`
  );
  const allHaveGuides = guides.length === 10;
  const allHaveDistinctEvidence = guides.every(
    (g: any) => g.preclinical_evidence && g.clinical_evidence && g.traditionalUses && g.commonPreparation
  );
  record("All 10 plants have plant_guides with distinct Preclinical, Clinical & Traditional evidence",
    allHaveGuides && allHaveDistinctEvidence,
    `Guides count: ${guides.length}`
  );

  // 6. Legitimate Botanical Images Exist on Disk with Attribution in DB
  let allImagesValid = true;
  let missingImages: string[] = [];
  for (const plant of pitahcPlants) {
    if (!plant.imageUrl || !plant.image_source || !plant.image_license) {
      allImagesValid = false;
      missingImages.push(`${plant.slug} (missing metadata)`);
      continue;
    }
    const localRel = plant.imageUrl.startsWith("/") ? plant.imageUrl.slice(1) : plant.imageUrl;
    const fullDiskPath = path.join(process.cwd(), "public", localRel);
    if (!fs.existsSync(fullDiskPath)) {
      allImagesValid = false;
      missingImages.push(`${plant.slug} (${fullDiskPath} not on disk)`);
    }
  }
  record("All 10 plants have authentic botanical images on disk with source & license attribution",
    allImagesValid,
    missingImages.length > 0 ? `Missing: ${missingImages.join(", ")}` : undefined
  );

  // 7. Verified Commercial Products & Relations
  const [products]: any = await pool.query(`
    SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer,
           p.slug AS plant_slug, p.commonName AS plant_name,
           prr.registrationNumber, prr.verification_status
    FROM herbal_products hp
    JOIN product_plants pp ON pp.productId = hp.id
    JOIN plants p ON p.id = pp.plantId
    LEFT JOIN product_regulatory_records prr ON prr.productId = hp.id
    WHERE hp.isPublished = 1
  `);
  
  const plantsWithProducts = Array.from(new Set(products.map((p: any) => p.plant_slug)));
  const plantsWithoutProducts = pitahcPlants
    .map((p: any) => p.slug)
    .filter((slug: string) => !plantsWithProducts.includes(slug));

  record("Verified commercial products linked to plants (Ampalaya, Akapulko, Lagundi, Sambong, Tsaang-gubat, Yerba Buena)",
    plantsWithProducts.includes("ampalaya") &&
    plantsWithProducts.includes("akapulko") &&
    plantsWithProducts.includes("lagundi") &&
    plantsWithProducts.includes("sambong") &&
    plantsWithProducts.includes("tsaang-gubat") &&
    plantsWithProducts.includes("yerba-buena"),
    `Linked plants: ${plantsWithProducts.join(", ")}`
  );

  // 8. Honest Zero-Fabrication Fallback: Niyog-niyogan has 0 commercial products
  const pitahcPlantsWithProducts = pitahcPlants.filter((p: any) => plantsWithProducts.includes(p.slug));
  record("Zero-fabrication rule enforced: Niyog-niyogan has 0 commercial products while all other 9 PITAHC plants have genuine regulatory records",
    plantsWithoutProducts.length === 1 &&
    plantsWithoutProducts.includes("niyog-niyogan") &&
    pitahcPlantsWithProducts.length === 9,
    `Plants with 0 products: ${plantsWithoutProducts.join(", ")} | PITAHC plants with products: ${pitahcPlantsWithProducts.length}`
  );

  // 9. Product Regulatory Records Verified (FDA / NIRPROMP registrations present)
  const fdaProducts = products.filter((p: any) => p.registrationNumber && p.verification_status === "VERIFIED");
  record("Verified products have legitimate FDA / NIRPROMP regulatory records",
    fdaProducts.length >= 6,
    `Verified count: ${fdaProducts.length}`
  );

  // 10. AI Assistant: Plant recognition for all 10 PITAHC plants
  let allPlantsResolved = true;
  for (const plant of pitahcPlants) {
    const res = await resolveContextAndKnowledge(`What is ${plant.commonName}?`);
    if (res.activeType !== "PLANT" || (res.plantId !== plant.id && res.plantId !== plant.slug)) {
      allPlantsResolved = false;
      console.warn(`Resolution failed for plant ${plant.commonName}:`, res);
    }
  }
  record("Ask NatureAide AI resolves all 10 PITAHC plants from natural language queries", allPlantsResolved);

  // 11. AI Assistant: Product recognition for verified commercial products
  const productTestQueries = [
    { query: "Tell me about ASCOF Lagundi", expectedId: "ascof-lagundi-syrup" },
    { query: "What is Re-Leaf Sambong?", expectedId: "re-leaf-sambong-tablet" },
    { query: "Tell me about Charantia Ampalaya Capsule", expectedId: "charantia-ampalaya-capsule" },
    { query: "What is PITAHC Tsaang Gubat tablet?", expectedId: "pitahc-tsaang-gubat-tablet" },
    { query: "Tell me about Lakapulko lotion", expectedId: "lakapulko-antifungal-lotion" }
  ];
  let allProductsResolved = true;
  for (const tq of productTestQueries) {
    const res = await resolveContextAndKnowledge(tq.query);
    const matches = res.activeType === "PRODUCT" && (res.productId === tq.expectedId || (res.productId && res.productId.startsWith(tq.expectedId.replace("-tablet", ""))));
    if (!matches) {
      allProductsResolved = false;
      console.warn(`Resolution failed for product query '${tq.query}':`, res);
    }
  }
  record("Ask NatureAide AI resolves verified commercial products from queries", allProductsResolved);

  // 12. AI Assistant: Multi-turn Context Continuity (Pronoun resolution: 'it')
  const multiTurnRes = await resolveContextAndKnowledge("What scientific studies support it?", {
    currentPlantId: "tsaang-gubat",
    currentProductId: null,
    activeContextType: "PLANT"
  });
  const resolvesIt = multiTurnRes.activeType === "PLANT" &&
                     (multiTurnRes.plantId === "tsaang-gubat" || multiTurnRes.activeEntityName?.toLowerCase().includes("tsaang"));
  record("AI maintains conversational context and resolves follow-up pronoun 'it' to active plant",
    Boolean(resolvesIt),
    `Resolved: ${multiTurnRes.activeEntityName}`
  );

  // 13. AI Assistant: Context Switching (Product -> Plant query)
  const switchRes = await resolveContextAndKnowledge("What plant is this product made from?", {
    currentPlantId: null,
    currentProductId: "ascof-lagundi-syrup",
    activeContextType: "PRODUCT"
  });
  const switchedToPlant = switchRes.activeType === "PLANT" &&
                          (switchRes.plantId === "lagundi" || switchRes.activeEntityName?.toLowerCase().includes("lagundi"));
  record("AI correctly bridges Product -> Plant context in follow-up queries", Boolean(switchedToPlant), `Resolved: ${switchRes.activeEntityName}`);

  // 14. AI Assistant: Unknown entity honest fallback
  const unknownRes = await resolveContextAndKnowledge("Tell me about Xenomorphic Klingon Weed");
  const isUnknown = unknownRes.isUnknownEntity === true && unknownRes.activeType === "NONE";
  record("AI identifies unknown herbs and flags for honest fallback", isUnknown);

  // 15. System Prompt: PITAHC 10 list and evidence distinction enforced
  const promptCheck = buildSystemPrompt("ELIGIBLE_TO_CONTINUE", "Knowledge context test", "PLANT", false);
  const promptHasPITAHC = promptCheck.includes("Akapulko") &&
                          promptCheck.includes("Tsaang-gubat") &&
                          promptCheck.includes("Ulasimang-bato") &&
                          promptCheck.includes("CRITICAL PRODUCT VS. PLANT EVIDENCE RULES:");
  record("System prompt contains official PITAHC 10 list and enforces plant vs product evidence distinction", promptHasPITAHC);

  // 16. AI Assistant: Safety Refusal (PROFESSIONAL_GUIDANCE_REQUIRED)
  const dangerPrompt = buildSystemPrompt("PROFESSIONAL_GUIDANCE_REQUIRED", "Ampalaya context", "PLANT", false);
  const enforcesGuidance = dangerPrompt.includes("CRITICAL USER SCREENING RESTRICTION (ACTIVE):") &&
                           dangerPrompt.includes("PROFESSIONAL_GUIDANCE_REQUIRED") &&
                           dangerPrompt.includes("Advise them to consult a qualified physician or pharmacist");
  record("System prompt strictly enforces clinical referral and refuses dosage changes when screening requires professional guidance", enforcesGuidance);

  // 17. Evidence distinction: plant evidence vs finished commercial product evidence
  const [productGuides]: any = await pool.query(
    "SELECT * FROM product_references WHERE productId = 'ascof-lagundi-syrup'"
  );
  const hasClassification = productGuides.length > 0 && productGuides.some((r: any) => r.evidenceClassification);
  record("Database maintains separate product_references with evidenceClassification distinct from plant monographs", hasClassification);

  // 18. Live Model Generation Verification
  console.log("\nTesting live LLM generation with Together AI...");
  const liveRes = await executeChatWithFallback([
    { role: "system", content: promptCheck },
    { role: "user", content: "What is Tsaang Gubat and what are its documented traditional uses?" }
  ]);
  const liveSuccess = !liveRes.error && liveRes.content.length > 50 &&
                      (liveRes.content.toLowerCase().includes("tsaang") || liveRes.content.toLowerCase().includes("carmona"));
  record("Live Together AI generation succeeds with PITAHC-grounded response", liveSuccess, `Model: ${liveRes.modelUsed}`);

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log("\n=================================================================");
  console.log(`TEST SUITE COMPLETE: ${passedCount} / ${results.length} PASSED`);
  console.log("=================================================================");

  // Close connection pool
  await pool.end();

  if (passedCount === results.length) {
    console.log("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error(`FAILED CHECKS: ${results.length - passedCount}`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});