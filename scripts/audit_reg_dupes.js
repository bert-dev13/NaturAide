const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  
  const [rows] = await pool.query(`
    SELECT r1.id as id1, r2.id as id2, r1.productId, r1.registrationNumber, r2.registrationNumber as reg2,
           r1.issuanceDate, r2.issuanceDate as iss2
    FROM product_regulatory_records r1
    JOIN product_regulatory_records r2 ON r1.productId = r2.productId AND r1.id < r2.id
  `);
  console.log(`Duplicate regulatory record pairs: ${rows.length}`);
  console.table(rows.slice(0, 15));
  await pool.end();
})();
