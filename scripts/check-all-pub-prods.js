const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [prods] = await pool.query('SELECT id, slug, brandName, name, manufacturer FROM herbal_products WHERE isPublished = 1');
  console.log('Published products in MySQL:', prods);

  await pool.end();
}

main().catch(console.error);
