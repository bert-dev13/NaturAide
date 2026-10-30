import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import mysql, { PoolConnection } from "mysql2/promise";
import { Migration } from "../src/lib/migration-helpers";

// 1. Load environment variables from .env.local and .env
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  community: "Community",
  researcher: "Researcher",
  reviewer: "Professional Reviewer",
  shared: "Shared"
};

const DOMAIN_UP_TO_DATE_LABELS: Record<string, string> = {
  community: "Community migrations up to date",
  researcher: "Research migrations up to date",
  reviewer: "Reviewer migrations up to date",
  shared: "Reference/schema migrations up to date"
};

async function getMigrationsList(): Promise<{ file: string; migration: Migration }[]> {
  const migrationsDir = path.resolve(__dirname, "../migrations");
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => (f.endsWith(".ts") || f.endsWith(".js")) && !f.endsWith(".d.ts"))
    .sort();

  const migrations: { file: string; migration: Migration }[] = [];
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    // Dynamic import
    const mod = await import(pathToFileURL(filePath).href);
    const mig: Migration = mod.migration || mod.default;
    if (!mig || !mig.id || !mig.up) {
      throw new Error(`Migration file "${file}" does not export a valid Migration object.`);
    }
    migrations.push({ file, migration: mig });
  }

  return migrations;
}

async function ensureMigrationTable(conn: PoolConnection) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      domain ENUM('community', 'researcher', 'reviewer', 'shared') NOT NULL,
      batch INT NOT NULL,
      execution_time_ms INT NOT NULL,
      executed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function runStatus() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "natureaide_db",
    waitForConnections: true,
    connectionLimit: 5
  });

  const conn = await pool.getConnection();
  try {
    await ensureMigrationTable(conn);
    const [rows]: any = await conn.query("SELECT * FROM schema_migrations ORDER BY id ASC");
    const appliedMap = new Map<string, any>();
    for (const r of rows) {
      appliedMap.set(r.id, r);
    }

    const allMigrations = await getMigrationsList();

    console.log("\n=======================================================");
    console.log("             NATUREAIDE DATABASE MIGRATIONS");
    console.log("=======================================================\n");

    for (const { migration } of allMigrations) {
      const applied = appliedMap.get(migration.id);
      const domainName = DOMAIN_DISPLAY_NAMES[migration.domain] || migration.domain;
      if (applied) {
        console.log(`[APPLIED] [${domainName}] ${migration.id} - ${migration.name} (Batch ${applied.batch}, ${applied.execution_time_ms}ms)`);
      } else {
        console.log(`[PENDING] [${domainName}] ${migration.id} - ${migration.name}`);
      }
    }

    const pendingCount = allMigrations.filter((m) => !appliedMap.has(m.migration.id)).length;
    console.log(`\nTotal migrations: ${allMigrations.length} | Applied: ${appliedMap.size} | Pending: ${pendingCount}\n`);
  } finally {
    conn.release();
    await pool.end();
  }
}

async function runMigrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "natureaide_db",
    waitForConnections: true,
    connectionLimit: 5
  });

  const conn = await pool.getConnection();

  try {
    await ensureMigrationTable(conn);

    const [rows]: any = await conn.query("SELECT id FROM schema_migrations");
    const appliedIds = new Set<string>(rows.map((r: any) => r.id));

    const [batchRows]: any = await conn.query("SELECT COALESCE(MAX(batch), 0) + 1 AS nextBatch FROM schema_migrations");
    const nextBatch: number = batchRows[0]?.nextBatch || 1;

    const allMigrations = await getMigrationsList();

    const domains: ("community" | "researcher" | "reviewer" | "shared")[] = [
      "community",
      "researcher",
      "reviewer",
      "shared"
    ];

    console.log("DATABASE MIGRATIONS\n");

    let totalAppliedInThisRun = 0;

    for (const domain of domains) {
      const domainDisplay = DOMAIN_DISPLAY_NAMES[domain];
      const domainMigrations = allMigrations.filter((m) => m.migration.domain === domain);
      const pendingInDomain = domainMigrations.filter((m) => !appliedIds.has(m.migration.id));

      console.log(domainDisplay);

      if (pendingInDomain.length === 0) {
        console.log(`[OK] ${DOMAIN_UP_TO_DATE_LABELS[domain]}\n`);
        continue;
      }

      for (const item of pendingInDomain) {
        const { migration } = item;
        console.log(`[..] Applying ${migration.name}`);
        const startTime = Date.now();

        try {
          await migration.up(conn);
          const elapsed = Date.now() - startTime;

          await conn.query(
            `INSERT INTO schema_migrations (id, name, domain, batch, execution_time_ms, executed_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
            [migration.id, migration.name, migration.domain, nextBatch, elapsed]
          );

          appliedIds.add(migration.id);
          totalAppliedInThisRun++;
          console.log(`[OK] Migration completed (${elapsed}ms)`);
        } catch (err: any) {
          console.error(`\n[ERROR] Migration failed: ${migration.id} (${migration.name})`);
          console.error(err?.message || err);
          throw err;
        }
      }
      console.log("");
    }

    console.log("[OK] NatureAide database schema is fully up to date.");
  } finally {
    conn.release();
    await pool.end();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--status")) {
    await runStatus();
  } else {
    await runMigrate();
  }
}

main().catch((err) => {
  console.error("Migration runner terminated with error:", err);
  process.exit(1);
});
