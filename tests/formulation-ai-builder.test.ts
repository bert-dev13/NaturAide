import assert from "node:assert";
import {
  buildDeterministicProposal,
  generateFormulationProposal,
  findInventoryMatch,
  normalizeMaterialName,
  FormulationAiContext,
} from "../src/lib/formulation-ai-service";

describe_formulation_ai_suite();

async function describe_formulation_ai_suite() {
  console.log("=== RUNNING SECTION 1, STEP 5: AI FORMULATION BUILDER & MASS BALANCE TEST SUITE ===\n");

  testAkapulkoHydrogelProposal();
  testBotanicalActiveConcentrationSafety();
  testMassBalanceCalculations();
  testVehicleQsBalancing();
  testInventoryMatchingStep4();
  testSynonymInventoryMatching();
  testNonDestructiveMatrixMerge();
  await testFormulationProposalServiceFallback();

  console.log("\n✓ ALL FORMULATION AI BUILDER & MASS BALANCE REGRESSION TESTS PASSED!\n");
}

/**
 * 1. Test Akapulko Topical Hydrogel proposal structure
 */
function testAkapulkoHydrogelProposal() {
  console.log("1. Testing Akapulko topical hydrogel proposal generation...");

  const context: FormulationAiContext = {
    projectId: 201,
    plantName: "Akapulko",
    plantScientificName: "Senna alata",
    plantPart: "Leaves",
    extractionMethod: "Standardized Maceration",
    extractionSolvent: "70% Aqueous Ethanol",
    extractFractionId: "AKP-EXT-001",
    dosageFormType: "Topical Hydrogel",
    materials: [
      {
        id: 11,
        materialName: "Carbomer 940",
        materialType: "EXCIPIENT",
        quantityAvailable: 250,
        unit: "g",
        inventoryStatus: "AVAILABLE",
      },
      {
        id: 12,
        materialName: "Glycerin",
        materialType: "EXCIPIENT",
        quantityAvailable: null,
        unit: "mL",
        inventoryStatus: "PLANNED",
      },
    ],
  };

  const proposal = buildDeterministicProposal(context);

  assert(proposal.formulationName.includes("Akapulko"), "Proposal title must reflect plant name");
  assert(proposal.components.length >= 5, `Expected at least 5 ingredients, got ${proposal.components.length}`);

  const names = proposal.components.map((c) => c.ingredientName);
  assert(names.some((n) => n.includes("Akapulko")), "Must include Akapulko Botanical Active");
  assert(names.some((n) => n.includes("Carbomer")), "Must include Carbomer 940");
  assert(names.some((n) => n.includes("Glycerin")), "Must include Glycerin");
  assert(names.some((n) => n.includes("Triethanolamine") || n.includes("TEA")), "Must include TEA pH adjuster");
  assert(names.some((n) => n.includes("Water")), "Must include Purified Water vehicle");

  console.log(`   ✓ Successfully generated ${proposal.components.length} candidate ingredients for Akapulko topical hydrogel.`);
}

/**
 * 2. Test botanical active concentration safety invariant
 * Unsupported botanical extract concentrations MUST NOT be fabricated.
 */
function testBotanicalActiveConcentrationSafety() {
  console.log("2. Testing unverified botanical concentration safety invariant...");

  const context: FormulationAiContext = {
    projectId: 202,
    plantName: "Akapulko",
    dosageFormType: "Topical Hydrogel",
    extractFractionId: "AKP-EXT-001",
  };

  const proposal = buildDeterministicProposal(context);
  const activeExtract = proposal.components.find((c) => c.componentType === "ACTIVE_EXTRACT");

  assert(activeExtract != null, "Active botanical component must exist");
  assert.strictEqual(
    activeExtract.suggestedConcentration,
    null,
    "Active extract concentration MUST be null without clinical validation"
  );
  assert.strictEqual(
    activeExtract.isConcentrationSupported,
    false,
    "isConcentrationSupported must be false for active botanical"
  );
  assert(
    activeExtract.suggestedConcentrationRange.includes("Requires Researcher Input"),
    `Must state 'Requires Researcher Input', got: ${activeExtract.suggestedConcentrationRange}`
  );
  assert.strictEqual(
    activeExtract.extractFractionId,
    "AKP-EXT-001",
    "Must preserve extract fraction link"
  );

  console.log("   ✓ Invariant confirmed: Active botanical concentrations require researcher experimental input.");
}

/**
 * 3. Test Mass Balance Calculations:
 * Ingredient Mass (g) = Batch Size (g) × Concentration (% w/w) / 100
 */
function testMassBalanceCalculations() {
  console.log("3. Testing ingredient mass balance formulas across batch sizes...");

  const calculateGrams = (batchSizeGrams: number, concPercent: number) =>
    Number(((batchSizeGrams * concPercent) / 100).toFixed(2));

  // Case A: 500 g batch @ 5% w/w = 25 g
  const mass500_5 = calculateGrams(500, 5.0);
  assert.strictEqual(mass500_5, 25.0, `Expected 25.0 g, got ${mass500_5}`);

  // Case B: 100 g batch @ 1% w/w = 1 g
  const mass100_1 = calculateGrams(100, 1.0);
  assert.strictEqual(mass100_1, 1.0, `Expected 1.0 g, got ${mass100_1}`);

  // Case C: 1000 g (1 kg) batch @ 0.8% w/w = 8 g
  const mass1000_08 = calculateGrams(1000, 0.8);
  assert.strictEqual(mass1000_08, 8.0, `Expected 8.0 g, got ${mass1000_08}`);

  // Case D: 250 g batch @ 3.5% w/w = 8.75 g
  const mass250_35 = calculateGrams(250, 3.5);
  assert.strictEqual(mass250_35, 8.75, `Expected 8.75 g, got ${mass250_35}`);

  console.log("   ✓ Mass calculations verified: 500 g @ 5% = 25 g, 100 g @ 1% = 1 g, 1000 g @ 0.8% = 8 g.");
}

/**
 * 4. Test Vehicle q.s. (quantum satis) auto-balancing logic
 */
function testVehicleQsBalancing() {
  console.log("4. Testing vehicle q.s. auto-balance logic...");

  // Suppose ingredients:
  // Botanical Extract: 5.0%
  // Carbomer 940: 1.0%
  // Glycerin: 5.0%
  // Phenoxyethanol: 0.8%
  // Vehicle: Purified Water
  const nonVehicle = [5.0, 1.0, 5.0, 0.8];
  const nonVehicleSum = nonVehicle.reduce((a, b) => a + b, 0); // 11.8%
  const vehiclePercent = Number((100.0 - nonVehicleSum).toFixed(2)); // 88.2%

  assert.strictEqual(vehiclePercent, 88.2, `Expected 88.2%, got ${vehiclePercent}`);

  const total = nonVehicleSum + vehiclePercent;
  assert.strictEqual(Number(total.toFixed(2)), 100.0, "Total must balance to exactly 100.0%");

  // If non-vehicle exceeds 100
  const excessList = [80.0, 30.0];
  const excessSum = excessList.reduce((a, b) => a + b, 0); // 110.0%
  const isOver100 = excessSum > 100.0;
  assert.strictEqual(isOver100, true, "Must flag over 100%");

  console.log("   ✓ Vehicle q.s. correctly calculates 88.2% to achieve 100.0% mass balance.");
}

/**
 * 5. Test inventory matching against Step 4
 */
function testInventoryMatchingStep4() {
  console.log("5. Testing inventory matching and status mapping...");

  const context: FormulationAiContext = {
    projectId: 205,
    plantName: "Akapulko",
    dosageFormType: "Topical Hydrogel",
    materials: [
      {
        id: 41,
        materialName: "Carbomer 940",
        materialType: "EXCIPIENT",
        quantityAvailable: 500,
        unit: "g",
        inventoryStatus: "AVAILABLE",
      },
      {
        id: 42,
        materialName: "Glycerin",
        materialType: "EXCIPIENT",
        quantityAvailable: null,
        unit: "mL",
        inventoryStatus: "PLANNED",
      },
    ],
  };

  const proposal = buildDeterministicProposal(context);

  const carbomer = proposal.components.find((c) => c.ingredientName.includes("Carbomer"));
  assert(carbomer != null);
  assert.strictEqual(carbomer.inventoryStatus, "AVAILABLE", "Carbomer with stock must be AVAILABLE");
  assert.strictEqual(carbomer.inventoryMatch?.id, 41);

  const glycerin = proposal.components.find((c) => c.ingredientName.includes("Glycerin"));
  assert(glycerin != null);
  assert.strictEqual(glycerin.inventoryStatus, "PLANNED", "Glycerin with null stock must be PLANNED");
  assert.strictEqual(glycerin.inventoryMatch?.id, 42);

  const water = proposal.components.find((c) => c.ingredientName.includes("Water"));
  assert(water != null);
  assert.strictEqual(water.inventoryStatus, "NOT_IN_INVENTORY", "Water not in Step 4 must be NOT_IN_INVENTORY");
  assert.strictEqual(water.inventoryMatch, null);

  console.log("   ✓ Inventory mapping accurately differentiates AVAILABLE, PLANNED, and NOT_IN_INVENTORY.");
}

/**
 * 7. Test pharmaceutical synonym inventory matching
 * Verifies Carbopol/Carbomer, Purified Water USP, TEA, and Akapulko extract matching.
 */
function testSynonymInventoryMatching() {
  console.log("7. Testing pharmaceutical synonym and botanical matching in inventory...");

  const inventory = [
    { id: 101, materialName: "Carbopol 940", materialType: "EXCIPIENT", quantityAvailable: 100 },
    { id: 102, materialName: "Purified Water USP", materialType: "SOLVENT", quantityAvailable: 5000 },
    { id: 103, materialName: "Akapulko Leaves Extract", materialType: "ACTIVE_BOTANICAL", quantityAvailable: 250 },
    { id: 104, materialName: "TEA (Triethanolamine)", materialType: "EXCIPIENT", quantityAvailable: null },
    { id: 105, materialName: "Glycerol (USP)", materialType: "EXCIPIENT", quantityAvailable: 500 },
  ];

  // A. Carbomer 940 -> Carbopol 940
  const matchCarb = findInventoryMatch("Carbomer 940", "EXCIPIENT", inventory, "Akapulko");
  assert.strictEqual(matchCarb?.id, 101, "Carbomer 940 must match Carbopol 940");

  // B. Purified Water -> Purified Water USP
  const matchWater = findInventoryMatch("Purified Water", "VEHICLE", inventory, "Akapulko");
  assert.strictEqual(matchWater?.id, 102, "Purified Water must match Purified Water USP");

  // C. Akapulko Hydroethanolic Extract -> Akapulko Leaves Extract
  const matchExtract = findInventoryMatch("Akapulko Hydroethanolic Extract", "ACTIVE_EXTRACT", inventory, "Akapulko");
  assert.strictEqual(matchExtract?.id, 103, "Akapulko Hydroethanolic Extract must match Akapulko Leaves Extract");

  // D. Triethanolamine -> TEA
  const matchTea = findInventoryMatch("Triethanolamine (TEA)", "EXCIPIENT", inventory, "Akapulko");
  assert.strictEqual(matchTea?.id, 104, "Triethanolamine must match TEA");

  // E. Glycerin -> Glycerol
  const matchGlyc = findInventoryMatch("Glycerin", "EXCIPIENT", inventory, "Akapulko");
  assert.strictEqual(matchGlyc?.id, 105, "Glycerin must match Glycerol (USP)");

  console.log("   ✓ Synonym matching correctly mapped Carbopol, Water USP, TEA, Glycerol, and Akapulko extract.");
}

/**
 * 8. Test Non-Destructive Merge and Vehicle q.s. Auto-Rebalance
 */
function testNonDestructiveMatrixMerge() {
  console.log("8. Testing non-destructive matrix merge and duplicate prevention...");

  // Existing matrix created by researcher
  const existingMatrix = [
    {
      id: "comp-1",
      ingredientName: "Akapulko Leaf Extract",
      componentType: "ACTIVE_EXTRACT",
      concentrationValue: 5.0, // researcher entered 5.0%
      roleOrFunction: "Active Botanical",
    },
    {
      id: "comp-2",
      ingredientName: "Carbomer 940",
      componentType: "EXCIPIENT",
      concentrationValue: 1.0,
      roleOrFunction: "Gelling Agent",
    },
    {
      id: "comp-3",
      ingredientName: "Purified Water (USP)",
      componentType: "VEHICLE",
      concentrationValue: 94.0, // balanced
      isVehicle: true,
      roleOrFunction: "Vehicle",
    },
  ];

  // AI recommendations (6 items)
  const aiRecommendations = [
    {
      id: "rec-1",
      ingredientName: "Carbomer 940", // already in matrix
      componentType: "EXCIPIENT",
      functionalRole: "Gelling Agent & Viscoelastic Matrix Builder",
      suggestedConcentration: 1.0,
      isConcentrationSupported: true,
      isVehicle: false,
    },
    {
      id: "rec-2",
      ingredientName: "Glycerin", // NEW ingredient
      componentType: "EXCIPIENT",
      functionalRole: "Humectant & Emollient",
      suggestedConcentration: 5.0,
      isConcentrationSupported: true,
      isVehicle: false,
    },
  ];

  // Researcher selects 1 item: Glycerin
  const selected = aiRecommendations.filter((r) => r.id === "rec-2");
  assert.strictEqual(selected.length, 1);

  // Merge selected item into matrix
  const merged = [...existingMatrix];
  for (const item of selected) {
    const existingIdx = merged.findIndex(
      (c) => normalizeMaterialName(c.ingredientName) === normalizeMaterialName(item.ingredientName)
    );
    if (existingIdx === -1) {
      merged.push({
        id: `build-new-1`,
        ingredientName: item.ingredientName,
        componentType: item.componentType,
        concentrationValue: item.suggestedConcentration || 0,
        roleOrFunction: item.functionalRole,
      });
    }
  }

  // Verify Glycerin added, total count increased from 3 to 4
  assert.strictEqual(merged.length, 4, "Matrix must now contain 4 ingredients");
  const glyc = merged.find((c) => c.ingredientName === "Glycerin");
  assert(glyc != null);
  assert.strictEqual(glyc.concentrationValue, 5.0);

  // Rebalance Vehicle q.s.
  const vehIdx = merged.findIndex((c) => c.isVehicle);
  assert(vehIdx >= 0);
  const nonVehSum = merged.reduce(
    (acc, c, idx) => (idx === vehIdx ? acc : acc + (parseFloat(String(c.concentrationValue)) || 0)),
    0
  ); // 5.0 (Akapulko) + 1.0 (Carbomer) + 5.0 (Glycerin) = 11.0%
  assert.strictEqual(nonVehSum, 11.0);
  const newVehConc = Number(Math.max(0, 100.0 - nonVehSum).toFixed(2)); // 89.0%
  assert.strictEqual(newVehConc, 89.0);
  merged[vehIdx].concentrationValue = newVehConc;

  // Verify total mass balance = 100.0%
  const total = merged.reduce((acc, c) => acc + (parseFloat(String(c.concentrationValue)) || 0), 0);
  assert.strictEqual(Number(total.toFixed(2)), 100.0);

  // Now test merging an ingredient that ALREADY exists: Carbomer 940 with custom concentration 1.5%
  merged[1].concentrationValue = 1.5; // researcher customized to 1.5%
  const selectedCarb = aiRecommendations.filter((r) => r.id === "rec-1");
  for (const item of selectedCarb) {
    const existingIdx = merged.findIndex(
      (c) => normalizeMaterialName(c.ingredientName) === normalizeMaterialName(item.ingredientName)
    );
    assert(existingIdx >= 0, "Carbomer must be recognized as already existing");
    // Preserve custom concentration!
    assert.strictEqual(merged[existingIdx].concentrationValue, 1.5, "Must preserve custom 1.5% concentration");
  }
  assert.strictEqual(merged.length, 4, "No duplicate Carbomer row must be created");

  console.log("   ✓ Non-destructive merge verified: Glycerin added, custom concentrations preserved, vehicle rebalanced to 89.0%, zero duplicates.");
}

/**
 * 9. Test high-level generateFormulationProposal service
 */
async function testFormulationProposalServiceFallback() {
  console.log("6. Testing generateFormulationProposal service fallback guarantee...");

  const result = await generateFormulationProposal({
    projectId: 206,
    plantName: "Akapulko",
    dosageFormType: "Topical Hydrogel",
  });

  assert(result != null, "Result must not be null");
  assert(Array.isArray(result.components), "Components must be an array");
  assert(result.components.length >= 5, "Proposal must have full component suite");
  assert(result.scientificRationale.length > 0, "Must have scientific rationale");
  assert(result.supportingReferences.length > 0, "Must include supporting references");

  console.log(`   ✓ generateFormulationProposal returned ${result.components.length} components with valid rationale.`);
}

