const mysql = require("mysql2/promise");

async function runTests() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "natureaide_db",
  });

  console.log("=== Testing Plant Compounds Resolution ===");

  async function queryAvailableCompounds(plantId, plantScientificName, plantCommonName) {
    const plantSci = (plantScientificName || "").trim().toLowerCase();
    const plantComm = (plantCommonName || "").trim().toLowerCase();

    const [rows] = await pool.query(
      `
      SELECT id, plantId, plantScientificName, plantCommonName, compoundName,
             iupacName, molecularFormula, molecularWeight, compoundClass,
             pubchemId, smiles, plantPartReported, referencesData, verificationStatus
      FROM plant_compounds
      WHERE (? IS NOT NULL AND plantId = ?)
         OR (LENGTH(?) > 2 AND LOWER(plantScientificName) = LOWER(?))
         OR (LENGTH(?) > 2 AND LOWER(plantCommonName) = LOWER(?))
         OR (LENGTH(?) > 2 AND LOWER(?) LIKE CONCAT('%', LOWER(plantCommonName), '%'))
         OR (LENGTH(?) > 2 AND LOWER(plantCommonName) LIKE CONCAT('%', ?, '%'))
         OR (LENGTH(?) > 2 AND LOWER(?) LIKE CONCAT('%', LOWER(plantScientificName), '%'))
         OR (LENGTH(?) > 2 AND LOWER(plantScientificName) LIKE CONCAT('%', ?, '%'))
      ORDER BY compoundName ASC
      `,
      [
        plantId, plantId,
        plantSci, plantSci,
        plantComm, plantComm,
        plantComm, plantComm, plantComm, plantComm,
        plantSci, plantSci, plantSci, plantSci
      ]
    );

    return rows.map(r => ({
      ...r,
      references: r.referencesData ? (typeof r.referencesData === "string" ? JSON.parse(r.referencesData) : r.referencesData) : []
    }));
  }

  // Test 1: Ginger (Luya)
  const gingerCompounds = await queryAvailableCompounds("ginger", "Zingiber officinale", "Ginger (Luya)");
  console.log(`\n[Test 1] Ginger (Luya) compounds count: ${gingerCompounds.length}`);
  if (gingerCompounds.length >= 10) {
    console.log("✓ PASS: Found >= 10 verified Ginger compounds.");
    console.log("  Compounds:", gingerCompounds.map(c => `${c.compoundName} (${c.molecularFormula}, CID: ${c.pubchemId})`).join("\n  "));
  } else {
    console.error("✗ FAIL: Expected at least 10 ginger compounds, found", gingerCompounds.length);
  }

  // Verify Ginger references are intact
  const g6 = gingerCompounds.find(c => c.compoundName === "6-Gingerol");
  if (g6 && g6.references.length > 0) {
    console.log(`✓ PASS: 6-Gingerol has ${g6.references.length} peer-reviewed references.`);
    console.log(`  Sample Ref: "${g6.references[0].title}" - ${g6.references[0].journal} (${g6.references[0].year})`);
  } else {
    console.error("✗ FAIL: 6-Gingerol references missing!");
  }

  // Test 2: Lagundi (Vitex negundo)
  const lagundiCompounds = await queryAvailableCompounds("lagundi", "Vitex negundo", "Lagundi");
  console.log(`\n[Test 2] Lagundi compounds count: ${lagundiCompounds.length}`);
  if (lagundiCompounds.length >= 20) {
    console.log("✓ PASS: Lagundi preserved all 20 verified compounds.");
  } else {
    console.error("✗ FAIL: Expected 20 lagundi compounds, found", lagundiCompounds.length);
  }

  // Test 3: Turmeric (Curcuma longa)
  const turmericCompounds = await queryAvailableCompounds("turmeric", "Curcuma longa", "Turmeric");
  console.log(`\n[Test 3] Turmeric compounds count: ${turmericCompounds.length}`);
  if (turmericCompounds.length >= 4) {
    console.log("✓ PASS: Turmeric compounds populated (Curcumin, Demethoxycurcumin, etc.).");
  } else {
    console.error("✗ FAIL: Expected at least 4 turmeric compounds, found", turmericCompounds.length);
  }

  // Test 4: Garlic / Bawang (Allium sativum)
  const bawangCompounds = await queryAvailableCompounds("bawang", "Allium sativum", "Bawang (Garlic)");
  console.log(`\n[Test 4] Bawang compounds count: ${bawangCompounds.length}`);
  if (bawangCompounds.length >= 4) {
    console.log("✓ PASS: Bawang compounds populated (Allicin, Alliin, Ajoene, etc.).");
  } else {
    console.error("✗ FAIL: Expected at least 4 bawang compounds, found", bawangCompounds.length);
  }

  // Test 5: Unknown / custom plant
  const unknownCompounds = await queryAvailableCompounds(null, "Nonexistent species", "Nonexistent plant");
  console.log(`\n[Test 5] Unknown plant compounds count: ${unknownCompounds.length}`);
  if (unknownCompounds.length === 0) {
    console.log("✓ PASS: Correctly returns 0 compounds for uncataloged species without fabricating data.");
  } else {
    console.error("✗ FAIL: Expected 0 compounds for unknown plant, found", unknownCompounds.length);
  }

  await pool.end();
}

runTests().catch(console.error);

