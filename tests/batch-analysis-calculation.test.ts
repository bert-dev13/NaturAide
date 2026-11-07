import assert from "node:assert";
import { calculateBatchComposition } from "../src/lib/batch-qc-catalog";

describe_batch_analysis_suite();

function describe_batch_analysis_suite() {
  console.log("=== RUNNING SECTION 1, STEP 6: BATCH ANALYSIS & QC MASS BALANCE TEST SUITE ===\n");

  testStringDecimalInputs();
  testStandardHydrogelMassBalance();
  testNegativeVehicleMarginValidation();

  console.log("\n✓ ALL BATCH ANALYSIS REGRESSION TESTS PASSED!\n");
}

function testStringDecimalInputs() {
  console.log("1. Testing string DECIMAL inputs (e.g. from MySQL)...");

  // MySQL DECIMAL columns often return as strings like "5.00" or "500.00"
  const result = calculateBatchComposition("5.00", "500.00", [
    { ingredientName: "Akapulko Extract", componentType: "ACTIVE", concentrationValue: "5.00" },
    { ingredientName: "Carbomer 940", componentType: "EXCIPIENT", concentrationValue: "1.00" },
    { ingredientName: "Purified Water", componentType: "VEHICLE", concentrationValue: "94.00" },
  ]);

  assert.strictEqual(result.valid, true, "Calculation must succeed with string decimals");
  assert.strictEqual(result.activeConcentration, 5);
  assert.strictEqual(result.batchSizeGrams, 500);
  assert.strictEqual(result.activeMassGrams, 25);
  assert.strictEqual(result.vehiclePercentage, 94);
  assert.strictEqual(result.vehicleMassGrams, 470);

  console.log("   ✓ String decimal inputs parsed and calculated correctly: 5% of 500g = 25g, vehicle = 470g.");
}

function testStandardHydrogelMassBalance() {
  console.log("2. Testing mass balance across 100g, 250g, 500g, 1000g batches...");

  const batchSizes = [100, 250, 500, 1000];
  for (const size of batchSizes) {
    const res = calculateBatchComposition(7.0, size, [
      { ingredientName: "Botanical Extract", componentType: "ACTIVE", concentrationValue: 7.0 },
      { ingredientName: "Gelling Agent", componentType: "EXCIPIENT", concentrationValue: 1.5 },
      { ingredientName: "Humectant", componentType: "EXCIPIENT", concentrationValue: 5.0 },
      { ingredientName: "Preservative", componentType: "EXCIPIENT", concentrationValue: 0.8 },
      { ingredientName: "Continuous Vehicle", componentType: "VEHICLE", concentrationValue: 85.7 },
    ]);

    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.activeMassGrams, (size * 7) / 100);
    assert.strictEqual(Number((res.activeMassGrams + res.excipientMassSum).toFixed(2)), size);
  }

  console.log("   ✓ Mass balance verified across all standard batch sizes.");
}

function testNegativeVehicleMarginValidation() {
  console.log("3. Testing over-100% formulation rejection...");

  const res = calculateBatchComposition(90, 500, [
    { ingredientName: "Active Extract", componentType: "ACTIVE", concentrationValue: 90 },
    { ingredientName: "Excipient A", componentType: "EXCIPIENT", concentrationValue: 20 },
    { ingredientName: "Water", componentType: "VEHICLE", concentrationValue: 0 },
  ]);

  assert.strictEqual(res.valid, false, "Must reject over-100% combination");
  assert(res.error != null && res.error.includes("Formulation balance exceeded"));

  console.log("   ✓ Negative vehicle margin safely rejected.");
}

