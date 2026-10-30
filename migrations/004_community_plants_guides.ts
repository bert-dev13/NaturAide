import type { Migration, DbExecutor } from "../src/lib/migration-helpers";
import { addColumnIfNotExists } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "004_community_plants_guides",
  domain: "community",
  name: "Medicinal plants catalog, detailed plant guides, and saved remedies",
  up: async (conn) => {
    // 1. plants
    await conn.query(`
      CREATE TABLE IF NOT EXISTS plants (
        id VARCHAR(191) NOT NULL,
        commonName VARCHAR(191) NOT NULL,
        scientificName VARCHAR(191) NOT NULL,
        category VARCHAR(191) NOT NULL,
        simpleUse TEXT NOT NULL,
        badge VARCHAR(191) NOT NULL,
        preparation TEXT DEFAULT NULL,
        safetyNote TEXT DEFAULT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure slug and image columns exist
    await addColumnIfNotExists(conn, "plants", "slug", "VARCHAR(191) DEFAULT NULL AFTER id");
    await addColumnIfNotExists(conn, "plants", "imageUrl", "VARCHAR(255) DEFAULT NULL AFTER badge");
    await addColumnIfNotExists(conn, "plants", "local_image_path", "VARCHAR(500) NULL AFTER imageUrl");
    await addColumnIfNotExists(conn, "plants", "original_image_url", "VARCHAR(1000) NULL AFTER local_image_path");
    await addColumnIfNotExists(conn, "plants", "image_source", "VARCHAR(255) NULL AFTER original_image_url");
    await addColumnIfNotExists(conn, "plants", "image_author", "VARCHAR(500) NULL AFTER image_source");
    await addColumnIfNotExists(conn, "plants", "image_license", "VARCHAR(255) NULL AFTER image_author");
    await addColumnIfNotExists(conn, "plants", "image_attribution", "TEXT NULL AFTER image_license");
    await addColumnIfNotExists(conn, "plants", "image_verified_at", "DATETIME(3) NULL AFTER image_attribution");

    // 2. plant_guides
    await conn.query(`
      CREATE TABLE IF NOT EXISTS plant_guides (
        id INT(11) NOT NULL AUTO_INCREMENT,
        plantId VARCHAR(191) NOT NULL,
        about TEXT NOT NULL,
        traditionalUses TEXT NOT NULL,
        whatResearchSays TEXT NOT NULL,
        commonPreparation TEXT NOT NULL,
        safetyInformation TEXT NOT NULL,
        whoShouldBeCareful TEXT NOT NULL,
        medicineInteractions TEXT NOT NULL,
        whenToConsultDoctor TEXT NOT NULL,
        verifiedBy VARCHAR(191) DEFAULT 'Philippine Traditional & Scientific Review Panel',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY plant_guide_plant (plantId),
        CONSTRAINT fk_plant_guide_plant FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure is_community_visible exists
    await addColumnIfNotExists(conn, "plant_guides", "is_community_visible", "TINYINT(1) NOT NULL DEFAULT 1 AFTER verifiedBy");

    // 3. preparation_guides
    await conn.query(`
      CREATE TABLE IF NOT EXISTS preparation_guides (
        id INT(11) NOT NULL AUTO_INCREMENT,
        title VARCHAR(191) NOT NULL,
        category VARCHAR(100) NOT NULL,
        plantId VARCHAR(191) DEFAULT NULL,
        description TEXT NOT NULL,
        whatYouNeed TEXT NOT NULL,
        preparationSteps TEXT NOT NULL,
        importantReminders TEXT NOT NULL,
        storageGuidance TEXT NOT NULL,
        safetyInformation TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_prep_category (category),
        KEY idx_prep_plantId (plantId),
        CONSTRAINT fk_prep_guide_plant FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. saved_plants
    await conn.query(`
      CREATE TABLE IF NOT EXISTS saved_plants (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        plantId VARCHAR(191) NOT NULL,
        notes TEXT DEFAULT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY user_plant_unique (userId, plantId),
        KEY idx_saved_userId (userId),
        KEY idx_saved_plantId (plantId),
        CONSTRAINT fk_saved_plants_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_saved_plants_plant FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. saved_preparation_guides
    await conn.query(`
      CREATE TABLE IF NOT EXISTS saved_preparation_guides (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        guideId INT(11) NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY user_guide_unique (userId, guideId),
        KEY idx_saved_prep_userId (userId),
        KEY idx_saved_prep_guideId (guideId),
        CONSTRAINT fk_saved_prep_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_saved_prep_guide FOREIGN KEY (guideId) REFERENCES preparation_guides(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. recently_viewed
    await conn.query(`
      CREATE TABLE IF NOT EXISTS recently_viewed (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        plantId VARCHAR(191) NOT NULL,
        viewedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY user_recent_unique (userId, plantId),
        KEY idx_recent_userId (userId),
        KEY idx_recent_viewedAt (viewedAt),
        CONSTRAINT fk_recent_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_recent_plant FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};
export default migration;
