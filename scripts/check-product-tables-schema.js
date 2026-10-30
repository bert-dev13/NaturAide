const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const tables = ['product_plants', 'product_ingredients', 'product_resources', 'product_regulatory_records', 'product_references'];
  for (const t of tables) {
    try {
      const [cols] = await pool.query(`DESCRIBE ${t}`);
      console.log(`\nTable ${t}:`, cols.map(c => `${c.Field} (${c.Type})`).join(', '));
    } catch (e) {
      console.log(`\nTable ${t} error:`, e.message);
    }
  }

  await pool.end();
}

main().catch(console.error);
