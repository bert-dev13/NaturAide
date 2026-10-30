import mysql, { type Pool } from "mysql2/promise";

// Declare global variable for connection pooling in Next.js development environment
declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: Pool | undefined;
}

const pool: Pool =
  global.mysqlPool ||
  mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "natureaide_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

if (process.env.NODE_ENV !== "production") {
  global.mysqlPool = pool;
}

/**
 * Execute a query with parameters using the MySQL connection pool.
 */
export async function query<T = unknown>(sql: string, values?: unknown[]): Promise<T> {
  const [results] = await pool.query(sql, values);
  return results as T;
}

export { pool };
export default pool;
