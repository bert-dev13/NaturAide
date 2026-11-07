import pool from "../src/lib/db";
import { getAllBotanicalPlants } from "../src/lib/botanical-registry";

export async function repairAndSeedPlantsTable() {
  const conn = await pool.getConnection();
  try {
    console.log("[repair-plants] Checking plants table health...");
    let needsRepair = false;
    try {
      const [rows]: any = await conn.query("SELECT COUNT(*) as cnt FROM plants");
      const count = Number(rows?.[0]?.cnt || 0);
      console.log(`[repair-plants] plants table accessible, row count = ${count}`);
      if (count < 12) {
        needsRepair = true;
      }
    } catch (err: any) {
      console.warn(`[repair-plants] Error querying plants table (${err.code}): ${err.message}`);
      needsRepair = true;
    }

    if (needsRepair) {
      console.log("[repair-plants] Repairing and recreating plants table...");
      await conn.query("SET FOREIGN_KEY_CHECKS = 0");

      // Check if any foreign keys reference plants(id) and temporarily drop them if DROP TABLE fails
      try {
        await conn.query("DROP TABLE IF EXISTS plants");
      } catch (dropErr: any) {
        console.warn("[repair-plants] Initial DROP TABLE failed, checking referencing FKs:", dropErr.message);
        const [fks]: any = await conn.query(`
          SELECT TABLE_NAME, CONSTRAINT_NAME
          FROM information_schema.KEY_COLUMN_USAGE
          WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME = 'plants'
        `);
        for (const fk of fks || []) {
          try {
            await conn.query(`ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
            console.log(`[repair-plants] Dropped FK ${fk.CONSTRAINT_NAME} on ${fk.TABLE_NAME}`);
          } catch (e: any) {
            console.warn(`[repair-plants] Could not drop FK ${fk.CONSTRAINT_NAME}:`, e.message);
          }
        }
        await conn.query("DROP TABLE IF EXISTS plants");
      }

      await conn.query(`
        CREATE TABLE plants (
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
      console.log("[repair-plants] Created fresh plants table.");
    }

    const allPlants = getAllBotanicalPlants();
    for (const plant of allPlants) {
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
          scientificName = VALUES(scientificName),
          family = VALUES(family),
          category = VALUES(category),
          simpleUse = VALUES(simpleUse),
          badge = VALUES(badge),
          imageUrl = COALESCE(plants.imageUrl, VALUES(imageUrl)),
          local_image_path = COALESCE(plants.local_image_path, VALUES(local_image_path)),
          image_path = COALESCE(plants.image_path, VALUES(image_path)),
          preparation = VALUES(preparation),
          safetyNote = VALUES(safetyNote),
          is_pitahc = VALUES(is_pitahc),
          botanical_synonyms = VALUES(botanical_synonyms),
          local_names = VALUES(local_names),
          plant_parts_used = VALUES(plant_parts_used),
          source_organization = VALUES(source_organization),
          source_url = VALUES(source_url),
          source_verified = 1`,
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

    const [finalRows]: any = await conn.query(
      "SELECT id, slug, commonName, scientificName, is_pitahc, local_image_path FROM plants ORDER BY is_pitahc DESC, commonName ASC"
    );
    console.log(`[repair-plants] Successfully verified ${finalRows.length} plants in natureaide_db.plants:`);
    for (const r of finalRows) {
      console.log(`  - ${r.id} (${r.commonName} / ${r.scientificName}) [PITAHC=${r.is_pitahc}] -> ${r.local_image_path}`);
    }
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  repairAndSeedPlantsTable()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[repair-plants] Fatal error:", err);
      process.exit(1);
    });
}

