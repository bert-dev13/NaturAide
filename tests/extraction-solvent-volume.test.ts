import assert from "node:assert";
import {
  calculateSolventVolume,
  calculateSolventVolumeDetails,
  parseSolventRatio,
  calculateExtractYield,
  SOLVENT_RATIO_PRESETS,
  EXTRACTION_METHODS,
} from "../src/lib/extraction-catalog";

describe_tests();

function describe_tests() {
  console.log("=== RUNNING SECTION 1, STEP 3 EXTRACTION CALCULATIONS & REGRESSION TEST SUITE ===\n");

  testCoreProblemCase();
  testAllStructuredPresets();
  testStartingMassScalability();
  testLegacySavedRatioFormats();
  testCustomRatioInputs();
  testValidationZeroNegativeAndMissing();
  testRecoveredDryExtractYieldAndUnmeasuredIntegrity();
  testMethodPresetDefaultRatios();

  console.log("\n✓ ALL EXTRACTION VOLUME & YIELD REGRESSION SUITES PASSED!\n");
}

/**
 * 1. Test Core User Problem Statement:
 * Starting Mass: 100 g, Solvent Ratio: 1:10 (w/v) -> 1,000 mL (1.00 L)
 */
function testCoreProblemCase() {
  console.log("1. Testing core user problem case (100 g @ 1:10 = 1,000 mL)...");

  // Format 1: Standard ratio string "1:10"
  const vol1 = calculateSolventVolume(100, "1:10");
  assert.strictEqual(vol1, 1000, `Expected 100 g @ 1:10 to be 1000 mL, got ${vol1}`);

  // Format 2: Detailed calculation details
  const details1 = calculateSolventVolumeDetails(100, "1:10");
  assert.strictEqual(details1.volumeMl, 1000);
  assert.strictEqual(details1.volumeLiters, 1.0);
  assert.strictEqual(details1.ratioMlPerG, 10);
  assert.strictEqual(details1.isValid, true);
  assert.strictEqual(details1.formattedRatio, "1:10");

  // Format 3: Display with weight-to-volume annotation "1:10 (w/v)"
  const vol2 = calculateSolventVolume(100, "1:10 (w/v)");
  assert.strictEqual(vol2, 1000, `Expected 100 g @ "1:10 (w/v)" to be 1000 mL, got ${vol2}`);

  // Format 4: Explicit unit "10 mL/g"
  const vol3 = calculateSolventVolume(100, "10 mL/g");
  assert.strictEqual(vol3, 1000, `Expected 100 g @ "10 mL/g" to be 1000 mL, got ${vol3}`);

  // Format 5: String starting mass "100 g"
  const vol4 = calculateSolventVolume("100 g", "1:10");
  assert.strictEqual(vol4, 1000, `Expected "100 g" @ 1:10 to be 1000 mL, got ${vol4}`);

  console.log("   ✓ Core case passed: 100 g @ 1:10 (w/v) produces 1,000 mL (1.00 L) exactly.");
}

/**
 * 2. Test All Structured Presets
 */
function testAllStructuredPresets() {
  console.log("2. Testing all structured solvent ratio presets...");

  const testCases = [
    { ratio: "1:5", expectedMl: 500, expectedL: 0.5 },
    { ratio: "1:8", expectedMl: 800, expectedL: 0.8 },
    { ratio: "1:10", expectedMl: 1000, expectedL: 1.0 },
    { ratio: "1:12", expectedMl: 1200, expectedL: 1.2 },
    { ratio: "1:15", expectedMl: 1500, expectedL: 1.5 },
    { ratio: "1:20", expectedMl: 2000, expectedL: 2.0 },
    { ratio: "1:25", expectedMl: 2500, expectedL: 2.5 },
  ];

  for (const tc of testCases) {
    const res = calculateSolventVolumeDetails(100, tc.ratio);
    assert.strictEqual(res.volumeMl, tc.expectedMl, `Preset ${tc.ratio} volume failed`);
    assert.strictEqual(res.volumeLiters, tc.expectedL, `Preset ${tc.ratio} liter conversion failed`);
    assert.strictEqual(res.isValid, true);
  }

  // Also verify preset objects have structured mLPerGram
  for (const p of SOLVENT_RATIO_PRESETS) {
    assert.ok(p.ratioValue > 0, `Preset ${p.id} must have ratioValue > 0`);
    assert.strictEqual(p.ratioValue, p.mLPerGram, `Preset ${p.id} ratioValue must match mLPerGram`);
    const parsed = parseSolventRatio(p.ratioText);
    assert.strictEqual(parsed.ratioMlPerG, p.ratioValue, `Parsing preset ${p.ratioText} failed`);
  }

  console.log("   ✓ All 7 structured presets verified.");
}

/**
 * 3. Test Starting Mass Scalability
 */
function testStartingMassScalability() {
  console.log("3. Testing starting mass scalability across typical research batches...");

  const batches = [
    { mass: 25, ratio: "1:10", expectedMl: 250, expectedL: 0.25 },
    { mass: 50, ratio: "1:10", expectedMl: 500, expectedL: 0.5 },
    { mass: 100, ratio: "1:10", expectedMl: 1000, expectedL: 1.0 },
    { mass: 250, ratio: "1:10", expectedMl: 2500, expectedL: 2.5 },
    { mass: 500, ratio: "1:10", expectedMl: 5000, expectedL: 5.0 },
    { mass: 1000, ratio: "1:10", expectedMl: 10000, expectedL: 10.0 },
    { mass: 50, ratio: "1:15", expectedMl: 750, expectedL: 0.75 },
    { mass: 200, ratio: "1:12", expectedMl: 2400, expectedL: 2.4 },
  ];

  for (const b of batches) {
    const res = calculateSolventVolumeDetails(b.mass, b.ratio);
    assert.strictEqual(res.volumeMl, b.expectedMl);
    assert.strictEqual(res.volumeLiters, b.expectedL);
    assert.strictEqual(res.isValid, true);
  }

  console.log("   ✓ Batch scalability verified across 25g to 1000g.");
}

/**
 * 4. Test Legacy Saved Ratio Formats (Preserving existing database values)
 */
function testLegacySavedRatioFormats() {
  console.log("4. Testing backward compatibility for legacy saved ratio strings...");

  // Legacy liquid:solid notation (e.g. "10:1")
  const legacy10 = calculateSolventVolumeDetails(100, "10:1");
  assert.strictEqual(legacy10.volumeMl, 1000, `Legacy "10:1" must parse to 10 mL/g`);
  assert.strictEqual(legacy10.ratioMlPerG, 10);

  const legacy15 = calculateSolventVolumeDetails(100, "15:1");
  assert.strictEqual(legacy15.volumeMl, 1500, `Legacy "15:1" must parse to 15 mL/g`);

  const legacy12 = calculateSolventVolumeDetails(100, "12:1");
  assert.strictEqual(legacy12.volumeMl, 1200, `Legacy "12:1" must parse to 12 mL/g`);

  const legacy8 = calculateSolventVolumeDetails(100, "8:1");
  assert.strictEqual(legacy8.volumeMl, 800, `Legacy "8:1" must parse to 8 mL/g`);

  console.log("   ✓ Legacy formats (10:1, 15:1, 12:1, 8:1) successfully mapped to correct menstruum volumes.");
}

/**
 * 5. Test Custom Ratio Inputs
 */
function testCustomRatioInputs() {
  console.log("5. Testing custom ratio inputs...");

  // Custom colon ratio
  const custom1 = calculateSolventVolumeDetails(100, "1:18");
  assert.strictEqual(custom1.volumeMl, 1800);
  assert.strictEqual(custom1.volumeLiters, 1.8);
  assert.strictEqual(custom1.isValid, true);

  // Custom decimal ratio
  const custom2 = calculateSolventVolumeDetails(200, "1:12.5");
  assert.strictEqual(custom2.volumeMl, 2500);
  assert.strictEqual(custom2.volumeLiters, 2.5);
  assert.strictEqual(custom2.isValid, true);

  // Custom string with prefix and units
  const custom3 = calculateSolventVolumeDetails(100, "Custom: 16 mL/g");
  assert.strictEqual(custom3.volumeMl, 1600);
  assert.strictEqual(custom3.volumeLiters, 1.6);
  assert.strictEqual(custom3.isValid, true);

  console.log("   ✓ Custom ratio formats correctly parsed and calculated.");
}

/**
 * 6. Test Validation: Zero, Negative, Missing, and Invalid Values
 */
function testValidationZeroNegativeAndMissing() {
  console.log("6. Testing boundary validation (zero, negative, missing, invalid)...");

  // Zero starting mass
  const zeroMass = calculateSolventVolumeDetails(0, "1:10");
  assert.strictEqual(zeroMass.volumeMl, 0);
  assert.strictEqual(zeroMass.isValid, false);
  assert.ok(zeroMass.error?.includes("greater than 0"));

  // Negative starting mass
  const negMass = calculateSolventVolumeDetails(-100, "1:10");
  assert.strictEqual(negMass.volumeMl, 0);
  assert.strictEqual(negMass.isValid, false);
  assert.ok(negMass.error?.includes("cannot be negative"));

  // Missing starting mass
  const missingMass = calculateSolventVolumeDetails("", "1:10");
  assert.strictEqual(missingMass.volumeMl, 0);
  assert.strictEqual(missingMass.isValid, false);
  assert.ok(missingMass.error?.includes("required"));

  // Zero ratio
  const zeroRatio = calculateSolventVolumeDetails(100, "0");
  assert.strictEqual(zeroRatio.volumeMl, 0);
  assert.strictEqual(zeroRatio.isValid, false);
  assert.ok(zeroRatio.error?.includes("greater than 0"));

  // Negative ratio
  const negRatio = calculateSolventVolumeDetails(100, "-10");
  assert.strictEqual(negRatio.volumeMl, 0);
  assert.strictEqual(negRatio.isValid, false);
  assert.ok(negRatio.error?.includes("cannot be negative"));

  // Missing ratio
  const missingRatio = calculateSolventVolumeDetails(100, "");
  assert.strictEqual(missingRatio.volumeMl, 0);
  assert.strictEqual(missingRatio.isValid, false);
  assert.ok(missingRatio.error?.includes("required"));

  // Pure "Custom" with no number yet entered
  const customEmpty = calculateSolventVolumeDetails(100, "Custom");
  assert.strictEqual(customEmpty.volumeMl, 0);
  assert.strictEqual(customEmpty.isValid, false);
  assert.ok(customEmpty.error?.includes("specify a numeric custom"));

  // Malformed text
  const malformed = calculateSolventVolumeDetails(100, "invalid-words");
  assert.strictEqual(malformed.volumeMl, 0);
  assert.strictEqual(malformed.isValid, false);

  console.log("   ✓ All boundary and invalid inputs safely guarded.");
}

/**
 * 7. Test Recovered Dry Extract Yield & Unmeasured Value Integrity
 */
function testRecoveredDryExtractYieldAndUnmeasuredIntegrity() {
  console.log("7. Testing recovered dry extract yield calculation and unmeasured integrity...");

  // Valid measured mass
  const yield1 = calculateExtractYield(14.5, 100);
  assert.strictEqual(yield1.yieldPercent, 14.5);
  assert.strictEqual(yield1.isValid, true);
  assert.strictEqual(yield1.error, undefined);

  // Unmeasured / null mass: MUST remain null and NOT populate artificial values
  const unmeasured = calculateExtractYield(null, 100);
  assert.strictEqual(unmeasured.yieldPercent, null);
  assert.strictEqual(unmeasured.isValid, true);

  const unmeasuredUndef = calculateExtractYield(undefined, 100);
  assert.strictEqual(unmeasuredUndef.yieldPercent, null);
  assert.strictEqual(unmeasuredUndef.isValid, true);

  // Impossible yield (> 100%): recovered mass exceeds starting mass
  const impossible = calculateExtractYield(120, 100);
  assert.strictEqual(impossible.isValid, false);
  assert.ok(impossible.error?.includes("exceeds starting plant material mass"));

  // Negative recovered mass
  const negRecovered = calculateExtractYield(-5, 100);
  assert.strictEqual(negRecovered.isValid, false);
  assert.ok(negRecovered.error?.includes("cannot be negative"));

  // Zero recovered mass
  const zeroRecovered = calculateExtractYield(0, 100);
  assert.strictEqual(zeroRecovered.yieldPercent, 0);
  assert.strictEqual(zeroRecovered.isValid, true);
  assert.ok(zeroRecovered.warning?.includes("Zero recovered mass"));

  console.log("   ✓ Extract yield math and unmeasured data integrity verified.");
}

/**
 * 8. Verify Extraction Method Presets Default Ratios
 */
function testMethodPresetDefaultRatios() {
  console.log("8. Verifying default solvent ratios on extraction method presets...");

  for (const m of EXTRACTION_METHODS) {
    const parsed = parseSolventRatio(m.defaultRatio);
    assert.strictEqual(parsed.isValid, true, `Method preset ${m.name} has invalid defaultRatio: ${m.defaultRatio}`);
    assert.ok(parsed.ratioMlPerG >= 5 && parsed.ratioMlPerG <= 25, `Method preset ${m.name} ratio out of reasonable range`);
  }

  console.log("   ✓ All extraction method presets have valid default solvent ratios.");
}

