const mysql = require('mysql2/promise');

async function audit() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  const [prods] = await conn.query(
    "SELECT id, slug, name, brandName, isPublished, publicationStatus, isMultiIngredient FROM herbal_products WHERE isPublished = 1 AND publicationStatus = 'PUBLISHED' ORDER BY id"
  );
  console.log('Total published products:', prods.length);

  // Check columns of product_references
  const [refCols] = await conn.query("DESCRIBE product_references");
  console.log('product_references columns:', refCols.map(c => c.Field));

  // Check if product_resources exists
  const [tables] = await conn.query("SHOW TABLES LIKE 'product_resources'");
  const hasResources = tables.length > 0;
  console.log('Has product_resources table:', hasResources);

  if (hasResources) {
    const [resCols] = await conn.query("DESCRIBE product_resources");
    console.log('product_resources columns:', resCols.map(c => c.Field));
  }

  // Check product_regulatory_records
  const [regCols] = await conn.query("DESCRIBE product_regulatory_records");
  console.log('product_regulatory_records columns:', regCols.map(c => c.Field));

  // Check scientific_references columns
  const [sciCols] = await conn.query("DESCRIBE scientific_references");
  console.log('scientific_references columns:', sciCols.map(c => c.Field));

  let noExactCount = 0;
  let totalWithExact = 0;
  let zeroSourcesCount = 0;

  for (const p of prods) {
    const [pRefs] = await conn.query(
      "SELECT pr.*, sr.title, sr.pubmedId, sr.doi, sr.studyType, sr.source_verified FROM product_references pr LEFT JOIN scientific_references sr ON pr.referenceId = sr.id WHERE pr.productId = ?",
      [p.id]
    );
    let pRes = [];
    if (hasResources) {
      const [rows] = await conn.query("SELECT * FROM product_resources WHERE productId = ?", [p.id]);
      pRes = rows;
    }
    const [pReg] = await conn.query("SELECT * FROM product_regulatory_records WHERE productId = ?", [p.id]);
    const [pPlants] = await conn.query(
      "SELECT p.id, p.slug, p.commonName, p.scientificName FROM product_plants pp JOIN plants p ON pp.plantId = p.id WHERE pp.productId = ?",
      [p.id]
    );
    const [pIngredients] = await conn.query(
      "SELECT * FROM product_ingredients WHERE productId = ?",
      [p.id]
    );

    const exactRefs = pRefs.filter(r => r.evidenceClassification === 'EXACT_PRODUCT_STUDY' || r.evidence_scope === 'EXACT_PRODUCT');
    const formulationRefs = pRefs.filter(r => r.evidenceClassification === 'FORMULATION_STUDY' || r.evidence_scope === 'FORMULATION');
    const ingredientRefs = pRefs.filter(r => r.evidenceClassification === 'INGREDIENT_EVIDENCE' || r.evidence_scope === 'INGREDIENT');
    const plantRefs = pRefs.filter(r => r.evidenceClassification === 'PLANT_EVIDENCE' || r.evidence_scope === 'PLANT');
    const safetyRefs = pRefs.filter(r => r.evidenceClassification === 'SAFETY_EVIDENCE' || r.evidence_scope === 'SAFETY');

    console.log(`[${p.id}] ${p.slug} (${p.brandName})`);
    console.log(`  Plants: ${pPlants.map(pl => pl.commonName).join(', ')} | Ingredients: ${pIngredients.length}`);
    console.log(`  Total pRefs: ${pRefs.length} (Exact: ${exactRefs.length}, Form: ${formulationRefs.length}, Ing: ${ingredientRefs.length}, Plant: ${plantRefs.length}, Safety: ${safetyRefs.length})`);
    console.log(`  Official Reg: ${pReg.length} | Official Res: ${pRes.length}`);

    if (exactRefs.length > 0) totalWithExact++;
    else noExactCount++;

    if (pRefs.length === 0 && pRes.length === 0 && pReg.length === 0) {
      console.log(`  >>> ZERO SUPPORTING SOURCES!`);
      zeroSourcesCount++;
    }
  }

  console.log('--------------------------------------------------');
  console.log('Total Published:', prods.length);
  console.log('Products with Exact Studies:', totalWithExact);
  console.log('Products without Exact Studies:', noExactCount);
  console.log('Products with ZERO sources:', zeroSourcesCount);
  console.log('--------------------------------------------------');

  await conn.end();
}

audit().catch(console.error);
