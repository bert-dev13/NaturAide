import type { Connection, Pool, PoolConnection } from "mysql2/promise";

export type DbExecutor = Connection | Pool | PoolConnection;

/**
 * Helper utilities for idempotent, non-destructive schema migrations.
 */

export async function tableExists(conn: DbExecutor, tableName: string): Promise<boolean> {
  const [rows]: any = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return Number(rows[0]?.c || 0) > 0;
}

export async function columnExists(
  conn: DbExecutor,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const [rows]: any = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Number(rows[0]?.c || 0) > 0;
}

export async function addColumnIfNotExists(
  conn: DbExecutor,
  tableName: string,
  columnName: string,
  definition: string
): Promise<boolean> {
  if (!(await columnExists(conn, tableName, columnName))) {
    await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
    return true;
  }
  return false;
}

export async function indexExists(
  conn: DbExecutor,
  tableName: string,
  indexName: string
): Promise<boolean> {
  const [rows]: any = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return Number(rows[0]?.c || 0) > 0;
}

export async function addIndexIfNotExists(
  conn: DbExecutor,
  tableName: string,
  indexName: string,
  indexDefinition: string
): Promise<boolean> {
  if (!(await indexExists(conn, tableName, indexName))) {
    await conn.query(`ALTER TABLE \`${tableName}\` ADD INDEX \`${indexName}\` ${indexDefinition}`);
    return true;
  }
  return false;
}

export interface Migration {
  id: string; // Permanent unique version ID, e.g. "001_shared_core_users"
  domain: "community" | "researcher" | "reviewer" | "shared";
  name: string; // Human readable description
  up: (conn: DbExecutor) => Promise<void>;
}
