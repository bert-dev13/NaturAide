const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  console.log('Running reference tables migration...');

  // 1. Check scientific_references columns
  const [sciCols] = await conn.query("DESCRIBE scientific_references");
  const sciColNames = sciCols.map(c => c.Field);

  if (!sciColNames.includes('verification_source')) {
    await conn.query("ALTER TABLE scientific_references ADD COLUMN verification_source VARCHAR(255) DEFAULT 'NCBI PubMed Official E-Utilities API'");
    console.log('+ Added verification_source to scientific_references');
  }

  // 2. Check product_references columns
  const [prodRefCols] = await conn.query("DESCRIBE product_references");
  const prodRefColNames = prodRefCols.map(c => c.Field);

  if (!prodRefColNames.includes('source_verified')) {
    await conn.query("ALTER TABLE product_references ADD COLUMN source_verified TINYINT(1) DEFAULT 1");
    console.log('+ Added source_verified to product_references');
  }

  if (!prodRefColNames.includes('source_verified_at')) {
    await conn.query("ALTER TABLE product_references ADD COLUMN source_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    console.log('+ Added source_verified_at to product_references');
  }

  if (!prodRefColNames.includes('verification_source')) {
    await conn.query("ALTER TABLE product_references ADD COLUMN verification_source VARCHAR(255) DEFAULT 'NCBI PubMed / PITAHC Monograph'");
    console.log('+ Added verification_source to product_references');
  }

  if (!prodRefColNames.includes('evidence_scope')) {
    await conn.query("ALTER TABLE product_references ADD COLUMN evidence_scope VARCHAR(50) DEFAULT 'PLANT_EVIDENCE'");
    console.log('+ Added evidence_scope to product_references');
  }

  if (!prodRefColNames.includes('botanical_identity_verified')) {
    await conn.query("ALTER TABLE product_references ADD COLUMN botanical_identity_verified TINYINT(1) DEFAULT 1");
    console.log('+ Added botanical_identity_verified to product_references');
  }

  if (!prodRefColNames.includes('supported_ingredient')) {
    await conn.query("ALTER TABLE product_references ADD COLUMN supported_ingredient VARCHAR(255) DEFAULT NULL");
    console.log('+ Added supported_ingredient to product_references');
  }

  console.log('Migration completed successfully.');
  await conn.end();
}

migrate().catch(console.error);
