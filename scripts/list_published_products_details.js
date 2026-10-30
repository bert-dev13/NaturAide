const mysql = require('mysql2/promise');

async function listAll() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  const [prods] = await conn.query(
    "SELECT id, slug, name, brandName, manufacturer, productType, isMultiIngredient FROM herbal_products WHERE isPublished = 1 AND publicationStatus = 'PUBLISHED' ORDER BY id"
  );
  console.log(`Published Products (${prods.length}):`);
  
  for (const p of prods) {
    const [plants] = await conn.query(
      "SELECT p.id, p.slug, p.commonName FROM product_plants pp JOIN plants p ON p.id = pp.plantId WHERE pp.productId = ?",
      [p.id]
    );
    const [ingredients] = await conn.query(
      "SELECT ingredientName, strength FROM product_ingredients WHERE productId = ?",
      [p.id]
    );
    console.log(`[${p.id}]`);
    console.log(`  Name: ${p.name} | Brand: ${p.brandName} | Mfg: ${p.manufacturer}`);
    console.log(`  Multi: ${p.isMultiIngredient} | Plants: ${plants.map(x => x.commonName).join(', ')}`);
    console.log(`  Ingredients: ${ingredients.map(i => `${i.ingredientName} (${i.strength})`).join('; ')}`);
  }

  await conn.end();
}

listAll().catch(console.error);
