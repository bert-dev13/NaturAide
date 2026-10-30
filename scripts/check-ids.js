const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [pCols] = await pool.query('DESCRIBE plants');
  console.log('plants id:', pCols.find(c => c.Field === 'id'));

  const [hpCols] = await pool.query('DESCRIBE herbal_products');
  console.log('herbal_products id:', hpCols.find(c => c.Field === 'id'));

  await pool.end();
}

main().catch(console.error);
