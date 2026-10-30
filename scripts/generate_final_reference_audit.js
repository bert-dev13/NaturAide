const mysql = require('mysql2/promise');

async function generateAudit() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  const [prods] = await conn.query(
    "SELECT id, slug, name, brandName, isPublished, publicationStatus, isMultiIngredient FROM herbal_products WHERE isPublished = 1 AND publicationStatus = 'PUBLISHED' ORDER BY name ASC"
  );

  let countWithRefsOrResources = 0;
  let countWithExact = 0;
  let countWithIngredientPlant = 0;
  let countWithSafety = 0;
  let countWithOfficial = 0;
  let countWithZero = 0;

  const table = [];

  for (const p of prods) {
    const [refs] = await conn.query(
      `SELECT pr.evidenceClassification, pr.supported_ingredient, sr.pubmedId, sr.doi, sr.title
       FROM product_references pr
       JOIN scientific_references sr ON pr.referenceId = sr.id
       WHERE pr.productId = ? AND sr.source_verified = 1`,
      [p.id]
    );

    const [resources] = await conn.query(
      "SELECT id, resourceType, resourceName, url FROM product_resources WHERE productId = ?",
      [p.id]
    );

    const [regRecord] = await conn.query(
      "SELECT id, registrationNumber, verificationUrl FROM product_regulatory_records WHERE productId = ?",
      [p.id]
    );

    const exact = refs.filter(r => r.evidenceClassification === 'EXACT_PRODUCT_STUDY').length;
    const formulation = refs.filter(r => r.evidenceClassification === 'FORMULATION_STUDY').length;
    const ingredient = refs.filter(r => r.evidenceClassification === 'INGREDIENT_EVIDENCE').length;
    const plant = refs.filter(r => r.evidenceClassification === 'PLANT_EVIDENCE').length;
    const safety = refs.filter(r => r.evidenceClassification === 'SAFETY_EVIDENCE').length;

    const totalScientific = refs.length;
    const totalOfficial = resources.length + (regRecord.length > 0 ? 1 : 0);
    const totalSupporting = totalScientific + totalOfficial;

    if (exact > 0) countWithExact++;
    if (formulation + ingredient + plant > 0) countWithIngredientPlant++;
    if (safety > 0) countWithSafety++;
    if (totalOfficial > 0) countWithOfficial++;
    if (totalSupporting > 0) countWithRefsOrResources++;
    else countWithZero++;

    const status = totalSupporting > 0 ? 'VERIFIED' : 'UNDER_REVIEW';

    table.push({
      product: p.name,
      exact,
      formulation,
      ingredient,
      plant,
      safety,
      official: totalOfficial,
      totalVerified: totalScientific,
      status
    });
  }

  console.log(JSON.stringify({
    summary: {
      publishedProducts: prods.length,
      withReferencesOrResources: countWithRefsOrResources,
      withExactProductStudies: countWithExact,
      withIngredientPlantEvidence: countWithIngredientPlant,
      withSafetyEvidence: countWithSafety,
      withOfficialResources: countWithOfficial,
      zeroSupportingSources: countWithZero
    },
    table
  }, null, 2));

  await conn.end();
}

generateAudit().catch(console.error);
