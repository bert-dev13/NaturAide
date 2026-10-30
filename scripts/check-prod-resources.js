const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [res] = await pool.query('SELECT * FROM product_resources');
  console.log(`product_resources count: ${res.length}`);
  res.forEach(r => console.log(`- [${r.productId}] ${r.resourceName} (${r.resourceType}): ${r.url}`));

  const [reg] = await pool.query('SELECT * FROM product_regulatory_records');
  console.log(`\nproduct_regulatory_records count: ${reg.length}`);
  reg.forEach(r => console.log(`- [${r.productId}] ${r.regulatoryAgency} Reg #${r.registrationNumber} (${r.registrationStatus})`));

  await pool.end();
}

main().catch(console.error);
