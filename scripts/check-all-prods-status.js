const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [allProds] = await pool.query('SELECT id, slug, brandName, name, publicationStatus, isPublished FROM herbal_products');
  console.log('All products in DB:');
  allProds.forEach(p => console.log(`- ${p.id} | Status: ${p.publicationStatus} | isPublished: ${p.isPublished} | Brand: ${p.brandName}`));

  await pool.end();
}

main().catch(console.error);
