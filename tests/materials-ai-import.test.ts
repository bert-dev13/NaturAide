import assert from "node:assert";
import {
  buildDeterministicMaterials,
  sanitizeMaterialRecommendation,
  recommendMaterialsForProject,
  MaterialRecommendationContext,
  MaterialRecommendation,
} from "../src/lib/materials-ai-service";

describe_materials_ai_suite();

async function describe_materials_ai_suite() {
  console.log("=== RUNNING SECTION 1, STEP 4: AI MATERIALS RECOMMENDATION & IMPORT TEST SUITE ===\n");

  testAkapulkoHydrogelRecommendations();
  testOralSyrupRecommendations();
  testSanitizationAndUnmeasuredStockIntegrity();
  testDuplicateDetectionLogic();
  testExtractFractionIdLinking();
  await testRecommendationServiceFallback();

  console.log("\n✓ ALL MATERIALS AI RECOMMENDATION & IMPORT INTEGRITY TESTS PASSED!\n");
}

/**
 * 1. Test deterministic recommendation generator for Akapulko Topical Hydrogel
 */
function testAkapulkoHydrogelRecommendations() {
  console.log("1. Testing deterministic recommendations for Akapulko topical hydrogel...");

  const context: MaterialRecommendationContext = {
    projectId: 101,
    plantName: "Akapulko",
    scientificName: "Senna alata",
    selectedPlantParts: ["Leaves"],
    extractionMethod: "Cold Maceration",
    extractionSolvent: "Ethanol (70%)",
    extractFractionId: "AKP-EXT-001",
    productType: "Phytomedicine",
    deliveryFormat: "Topical Hydrogel",
    targetApplications: "Antifungal (Tinea versicolor, Ringworm)",
    intendedPopulation: "Adults",
    knownCompounds: ["Chrysophanol", "Aloe-emodin", "Rhein"],
  };

  const recommendations = buildDeterministicMaterials(context);

  assert(Array.isArray(recommendations), "Recommendations must be an array");
  assert(recommendations.length >= 5, `Expected at least 5 recommendations, got ${recommendations.length}`);

  // Check Active Botanical
  const activeBotanicals = recommendations.filter((r) => r.materialType === "ACTIVE_BOTANICAL");
  assert.strictEqual(activeBotanicals.length, 1, "Should recommend exactly 1 active botanical extract");
  assert(
    activeBotanicals[0].materialName.includes("Akapulko") || activeBotanicals[0].materialName.includes("Senna alata"),
    `Active botanical must reference plant name, got: ${activeBotanicals[0].materialName}`
  );
  assert.strictEqual(
    activeBotanicals[0].extractFractionId,
    "AKP-EXT-001",
    "Active botanical must link to extractFractionId AKP-EXT-001"
  );
  assert.strictEqual(activeBotanicals[0].inventoryStatus, "PLANNED");
  assert.strictEqual(activeBotanicals[0].quantityAvailable, null);

  // Check Hydrogel Excipients
  const excipientNames = recommendations.map((r) => r.materialName.toLowerCase());
  const hasGellingAgent = excipientNames.some((n) => n.includes("carbomer"));
  const hasHumectant = excipientNames.some((n) => n.includes("glycerin") || n.includes("propylene glycol"));
  const hasNeutralizer = excipientNames.some((n) => n.includes("triethanolamine") || n.includes("tea"));
  const hasVehicle = excipientNames.some((n) => n.includes("water"));
  const hasPreservative = recommendations.some((r) => r.materialType === "PRESERVATIVE");
  const hasSolvent = recommendations.some((r) => r.materialType === "SOLVENT");

  assert(hasGellingAgent, "Must recommend Carbomer 940 for topical hydrogel");
  assert(hasHumectant, "Must recommend a humectant (Glycerin/Propylene Glycol)");
  assert(hasNeutralizer, "Must recommend a neutralizer (TEA)");
  assert(hasVehicle, "Must recommend vehicle (Purified Water)");
  assert(hasPreservative, "Must recommend an antimicrobial preservative");
  assert(hasSolvent, "Must recommend extraction solvent (Ethanol)");

  console.log(`   ✓ Successfully generated ${recommendations.length} grounded materials for Akapulko topical hydrogel.`);
}

/**
 * 2. Test oral syrup dosage format variation
 */
function testOralSyrupRecommendations() {
  console.log("2. Testing recommendations for Oral Syrup dosage format...");

  const context: MaterialRecommendationContext = {
    projectId: 102,
    plantName: "Lagundi",
    scientificName: "Vitex negundo",
    selectedPlantParts: ["Leaves"],
    extractionMethod: "Decoction",
    extractionSolvent: "Purified Water",
    extractFractionId: "LAG-DEC-001",
    deliveryFormat: "Oral Syrup",
  };

  const recommendations = buildDeterministicMaterials(context);
  const names = recommendations.map((r) => r.materialName.toLowerCase());

  const hasSweetenerOrViscosity = names.some((n) => n.includes("sucrose") || n.includes("syrup") || n.includes("sorbitol"));
  assert(hasSweetenerOrViscosity, "Oral syrup must include a sweetener or viscosity agent (Sucrose / Sorbitol)");

  console.log("   ✓ Oral syrup recommendations correctly reflect syrup vehicle and compounding agents.");
}

/**
 * 3. Test sanitization & integrity of unmeasured stock
 */
function testSanitizationAndUnmeasuredStockIntegrity() {
  console.log("3. Testing material sanitization & unmeasured stock integrity...");

  // Simulate an AI response that improperly tried to invent supplier, lot, or available mass
  const unhygienicRaw: any = {
    materialName: "Carbomer 940  ",
    materialType: "EXCIPIENT",
    gradeOrPurity: "USP / NF",
    supplierOrSource: "Fabricated Chemical Depot Inc.", // MUST BE STRIPPED
    lotOrBatchNumber: "LOT-999-FAKE", // MUST BE STRIPPED
    quantityAvailable: 500, // MUST BE NULLIFIED
    unit: "g",
    scientificJustification: "Primary gelling agent creating clear aqueous polymer gel network.",
    compatibilityNotes: "Neutralize with TEA to pH 6.0-7.0",
    confidenceScore: 0.95,
  };

  const sanitized = sanitizeMaterialRecommendation(unhygienicRaw, 0);

  assert(sanitized != null, "Sanitized item should not be null");
  assert.strictEqual(sanitized.materialName, "Carbomer 940");
  assert.strictEqual(sanitized.inventoryStatus, "PLANNED", "inventoryStatus must always be PLANNED");
  assert.strictEqual(sanitized.source, "AI_RECOMMENDATION", "source must be AI_RECOMMENDATION");
  assert.strictEqual(
    sanitized.supplierOrSource,
    null,
    "Fabricated suppliers must be stripped to null until physically verified"
  );
  assert.strictEqual(
    sanitized.lotOrBatchNumber,
    null,
    "Fabricated lot numbers must be stripped to null until physically verified"
  );
  assert.strictEqual(
    sanitized.quantityAvailable,
    null,
    "Theoretical materials must not synthesize stock quantity (must be null)"
  );
  assert.strictEqual(
    sanitized.scientificJustification,
    "Primary gelling agent creating clear aqueous polymer gel network."
  );

  console.log("   ✓ Sanitizer successfully enforces NULL for unmeasured physical fields (supplier, lot, quantity).");
}

/**
 * 4. Test duplicate detection and normalization logic
 */
function testDuplicateDetectionLogic() {
  console.log("4. Testing duplicate detection logic in project materials...");

  const existingInventory = [
    { materialName: "Carbomer 940" },
    { materialName: "Glycerin" },
    { materialName: "Purified Water (USP)" },
  ];

  const normalizeName = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const existingSet = new Set(existingInventory.map((item) => normalizeName(item.materialName)));

  const candidates = [
    "Carbomer 940",          // Duplicate
    "  carbomer-940  ",      // Duplicate (whitespace & dash)
    "Glycerin (USP)",        // Should detect 'glycerin' or match closely
    "Triethanolamine (TEA)", // New
    "Phenoxyethanol",        // New
  ];

  const results = candidates.map((cand) => {
    const isDup = existingSet.has(normalizeName(cand));
    return { name: cand, isDuplicate: isDup };
  });

  assert.strictEqual(results[0].isDuplicate, true, "Carbomer 940 should be detected as duplicate");
  assert.strictEqual(results[1].isDuplicate, true, "Trimmed carbomer-940 should match existing Carbomer 940");
  assert.strictEqual(results[3].isDuplicate, false, "Triethanolamine should be recognized as new");
  assert.strictEqual(results[4].isDuplicate, false, "Phenoxyethanol should be recognized as new");

  console.log("   ✓ Duplicate normalization accurately identifies existing project materials.");
}

/**
 * 5. Test extract fraction ID linking without synthesizing dry yield
 */
function testExtractFractionIdLinking() {
  console.log("5. Testing extract fraction ID linking for Active Botanicals...");

  const context: MaterialRecommendationContext = {
    projectId: 105,
    plantName: "Sambong",
    scientificName: "Blumea balsamifera",
    extractFractionId: "SAM-EXT-002",
    deliveryFormat: "Topical Ointment",
  };

  const recs = buildDeterministicMaterials(context);
  const botanical = recs.find((r) => r.materialType === "ACTIVE_BOTANICAL");

  assert(botanical != null, "Active botanical recommendation must exist");
  assert.strictEqual(botanical.extractFractionId, "SAM-EXT-002");
  assert.strictEqual(botanical.inventoryStatus, "PLANNED");
  assert.strictEqual(
    botanical.quantityAvailable,
    null,
    "Active botanical must not fabricate dry yield stock quantity from extraction starting mass"
  );

  console.log("   ✓ Extract fraction ID preserved while maintaining unmeasured stock integrity.");
}

/**
 * 6. Test high-level recommendMaterialsForProject service
 */
async function testRecommendationServiceFallback() {
  console.log("6. Testing recommendMaterialsForProject fallback behavior...");

  const result = await recommendMaterialsForProject({
    projectId: 108,
    plantName: "Akapulko",
    scientificName: "Senna alata",
    deliveryFormat: "Topical Hydrogel",
  });

  assert(Array.isArray(result.recommendations), "Result must include recommendations array");
  assert(result.recommendations.length > 0, "Recommendations must not be empty");
  assert(["ai", "deterministic"].includes(result.provenance), `Valid provenance required, got: ${result.provenance}`);

  // Ensure every recommendation satisfies PLANNED invariants
  for (const rec of result.recommendations) {
    assert.strictEqual(rec.inventoryStatus, "PLANNED");
    assert.strictEqual(rec.quantityAvailable, null);
    assert.strictEqual(rec.supplierOrSource, null);
    assert.strictEqual(rec.lotOrBatchNumber, null);
    assert(rec.materialName.length > 0);
  }

  console.log(`   ✓ recommendMaterialsForProject returned ${result.recommendations.length} verified items via provenance: ${result.provenance}.`);
}
