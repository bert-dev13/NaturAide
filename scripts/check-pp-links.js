const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [pp] = await pool.query(`
    SELECT pp.productId, pp.plantId, hp.brandName, hp.name as productName, p.commonName, p.scientificName
    FROM product_plants pp
    JOIN herbal_products hp ON hp.id = pp.productId
    JOIN plants p ON p.id = pp.plantId
  `);
  console.log('product_plants links:', pp);

  await pool.end();
}

main().catch(console.error);
