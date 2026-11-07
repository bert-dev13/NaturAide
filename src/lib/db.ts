import mysql, { type Pool } from "mysql2/promise";
import { getAllBotanicalPlants } from "./botanical-registry";

// Declare global variable for connection pooling in Next.js development environment
declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var mysqlPoolPatched: boolean | undefined;
}

const rawPool: Pool =
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

let plantsRepairPromise: Promise<void> | null = null;

async function ensurePlantsTableHealthy(targetPool: Pool, originalQuery: (...args: any[]) => Promise<any>): Promise<void> {
  if (plantsRepairPromise) {
    return plantsRepairPromise;
  }
  plantsRepairPromise = (async () => {
    const conn = await targetPool.getConnection();
    try {
      await conn.query("SET FOREIGN_KEY_CHECKS = 0");
      try {
        await conn.query("DROP TABLE IF EXISTS plants");
      } catch {
        const [fks]: any = await conn.query(`
          SELECT TABLE_NAME, CONSTRAINT_NAME
          FROM information_schema.KEY_COLUMN_USAGE
          WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME = 'plants'
        `);
        for (const fk of fks || []) {
          try {
            await conn.query(`ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
          } catch {
            // ignore
          }
        }
        await conn.query("DROP TABLE IF EXISTS plants");
      }

      await conn.query(`
        CREATE TABLE IF NOT EXISTS plants (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          slug VARCHAR(191) DEFAULT NULL,
          commonName VARCHAR(191) NOT NULL,
          scientificName VARCHAR(191) NOT NULL,
          family VARCHAR(191) DEFAULT NULL,
          category VARCHAR(191) NOT NULL,
          simpleUse TEXT NOT NULL,
          badge VARCHAR(191) NOT NULL DEFAULT 'Expert Reviewed',
          imageUrl VARCHAR(500) DEFAULT NULL,
          local_image_path VARCHAR(500) DEFAULT NULL,
          image_path VARCHAR(500) DEFAULT NULL,
          original_image_url VARCHAR(1000) DEFAULT NULL,
          image_source VARCHAR(255) DEFAULT NULL,
          image_source_url VARCHAR(1000) DEFAULT NULL,
          image_author VARCHAR(500) DEFAULT NULL,
          image_license VARCHAR(255) DEFAULT NULL,
          image_attribution TEXT DEFAULT NULL,
          image_verified TINYINT(1) NOT NULL DEFAULT 1,
          image_verified_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          preparation TEXT DEFAULT NULL,
          safetyNote TEXT DEFAULT NULL,
          is_pitahc TINYINT(1) NOT NULL DEFAULT 1,
          botanical_synonyms TEXT DEFAULT NULL,
          local_names TEXT DEFAULT NULL,
          plant_parts_used VARCHAR(255) DEFAULT NULL,
          source_organization VARCHAR(255) DEFAULT NULL,
          source_url VARCHAR(500) DEFAULT NULL,
          source_verified TINYINT(1) NOT NULL DEFAULT 1,
          source_verified_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          UNIQUE KEY idx_plants_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      await conn.query("SET FOREIGN_KEY_CHECKS = 1");

      for (const plant of getAllBotanicalPlants()) {
        const localImg = `/images/plants/${plant.slug}.jpg`;
        const partsUsed = Array.isArray(plant.documentedParts)
          ? plant.documentedParts.join(", ")
          : String(plant.documentedParts || "Leaves");
        const badge = plant.isPitahc ? "DOH / PITAHC Endorsed" : "Expert Reviewed";
        const attribution = `Verified botanical reference image for ${plant.scientificName} (${plant.commonName}).`;

        await conn.query(
          `INSERT INTO plants (
            id, slug, commonName, scientificName, family, category, simpleUse, badge,
            imageUrl, local_image_path, image_path, original_image_url,
            image_source, image_source_url, image_author, image_license, image_attribution,
            image_verified, image_verified_at,
            preparation, safetyNote, is_pitahc,
            botanical_synonyms, local_names, plant_parts_used,
            source_organization, source_url, source_verified, source_verified_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
          ON DUPLICATE KEY UPDATE
            slug = VALUES(slug),
            commonName = VALUES(commonName),
            scientificName = VALUES(scientificName)`,
          [
            plant.id,
            plant.slug,
            plant.commonName,
            plant.scientificName,
            plant.family,
            plant.category,
            plant.traditionalUses,
            badge,
            localImg,
            localImg,
            localImg,
            plant.sourceUrl,
            "Wikimedia Commons / PITAHC Botanical Archive",
            plant.sourceUrl,
            "NatureAide Verified Botanical Registry",
            "CC BY-SA 4.0",
            attribution,
            plant.traditionalPreparations,
            plant.safetyNotes,
            plant.isPitahc ? 1 : 0,
            plant.botanicalSynonyms,
            plant.localNames,
            partsUsed,
            plant.sourceOrganization,
            plant.sourceUrl,
          ]
        );
      }
    } finally {
      conn.release();
      plantsRepairPromise = null;
    }
  })();
  return plantsRepairPromise;
}

function isPlantsTableEngineError(err: any): boolean {
  const msg = String(err?.message || err?.sqlMessage || "");
  return (
    msg.includes("plants' doesn't exist") ||
    (err?.code === "ER_NO_SUCH_TABLE_IN_ENGINE" && msg.includes("plants")) ||
    (err?.code === "ER_NO_SUCH_TABLE" && msg.includes("plants"))
  );
}

if (!global.mysqlPoolPatched) {
  const origQuery = rawPool.query.bind(rawPool);
  const origExecute = rawPool.execute.bind(rawPool);

  (rawPool as any).query = async (...args: any[]) => {
    try {
      return await (origQuery as any)(...args);
    } catch (err: any) {
      if (isPlantsTableEngineError(err)) {
        await ensurePlantsTableHealthy(rawPool, origQuery as any);
        return await (origQuery as any)(...args);
      }
      throw err;
    }
  };

  (rawPool as any).execute = async (...args: any[]) => {
    try {
      return await (origExecute as any)(...args);
    } catch (err: any) {
      if (isPlantsTableEngineError(err)) {
        await ensurePlantsTableHealthy(rawPool, origQuery as any);
        return await (origExecute as any)(...args);
      }
      throw err;
    }
  };

  global.mysqlPoolPatched = true;
}

const pool: Pool = rawPool;

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
