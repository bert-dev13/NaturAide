const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [cols] = await pool.query('DESCRIBE conversations');
  console.log('conversations schema:', cols);

  const [msgCols] = await pool.query('DESCRIBE messages');
  console.log('messages schema:', msgCols);

  await pool.end();
}

main().catch(console.error);
