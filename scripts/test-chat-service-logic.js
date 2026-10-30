const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  // Test 1: Fetch all plants with guide and verified refs
  const [plants] = await pool.query(`
    SELECT p.id, p.slug, p.commonName, p.scientificName, p.simpleUse, p.preparation, p.safetyNote,
           g.about, g.traditionalUses, g.whatResearchSays, g.commonPreparation,
           g.safetyInformation, g.whoShouldBeCareful, g.medicineInteractions, g.whenToConsultDoctor
    FROM plants p
    LEFT JOIN plant_guides g ON g.plantId = p.id
  `);
  console.log(`Loaded ${plants.length} plants.`);

  // Test 2: Fetch all published products with ingredients, plants, regulatory records, resources, references
  const [prods] = await pool.query(`
    SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.dosageForm, hp.productType,
           hp.description, hp.intendedUse, hp.usageInstructions, hp.warningsPrecautions, hp.preparationGuide
    FROM herbal_products hp
    WHERE hp.isPublished = 1
  `);
  console.log(`Loaded ${prods.length} published products.`);

  for (const prod of prods) {
    const [linkedPlants] = await pool.query(`
      SELECT p.id, p.commonName, p.scientificName
      FROM product_plants pp
      JOIN plants p ON p.id = pp.plantId
      WHERE pp.productId = ?
    `, [prod.id]);

    const [ingredients] = await pool.query(`
      SELECT ingredientName, strength, ingredientType
      FROM product_ingredients
      WHERE productId = ?
    `, [prod.id]);

    const [regulatory] = await pool.query(`
      SELECT regulatoryAgency, registrationNumber, registrationStatus, classification, verificationSource
      FROM product_regulatory_records
      WHERE productId = ?
    `, [prod.id]);

    const [resources] = await pool.query(`
      SELECT resourceName, resourceType, url
      FROM product_resources
      WHERE productId = ?
    `, [prod.id]);

    const [refs] = await pool.query(`
      SELECT sr.id, sr.pubmedId, sr.title, sr.evidence_scope, pr.evidenceClassification
      FROM product_references pr
      JOIN scientific_references sr ON sr.id = pr.referenceId
      WHERE pr.productId = ? AND sr.source_verified = 1
    `, [prod.id]);

    console.log(`\nProduct: ${prod.brandName} - ${prod.name}`);
    console.log(`  Plants: ${linkedPlants.map(p => `${p.commonName} (${p.scientificName})`).join(', ') || 'None'}`);
    console.log(`  Ingredients: ${ingredients.map(i => `${i.ingredientName} ${i.strength || ''}`).join(', ')}`);
    console.log(`  Reg Record: ${regulatory.length > 0 ? `${regulatory[0].regulatoryAgency} #${regulatory[0].registrationNumber} (${regulatory[0].registrationStatus})` : 'None'}`);
    console.log(`  Resources: ${resources.length} verified official resources`);
    console.log(`  References: ${refs.length} verified citations`);
  }

  await pool.end();
}

test().catch(console.error);
