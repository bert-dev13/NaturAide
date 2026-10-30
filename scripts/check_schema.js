const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  const [cols] = await pool.query('DESCRIBE herbal_products');
  console.table(cols);
  const [indexes] = await pool.query('SHOW INDEXES FROM herbal_products');
  console.table(indexes);
  await pool.end();
})();
