import type { Migration, DbExecutor } from "../src/lib/migration-helpers";
import { addColumnIfNotExists } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "005_community_screenings_chat",
  domain: "community",
  name: "Health safety screenings and educational AI conversations",
  up: async (conn) => {
    // 1. community_health_screenings
    await conn.query(`
      CREATE TABLE IF NOT EXISTS community_health_screenings (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        ruleVersion VARCHAR(50) NOT NULL DEFAULT 'v1.0-community-safety',
        ageGroup VARCHAR(50) DEFAULT NULL,
        healthConcern VARCHAR(255) DEFAULT NULL,
        currentMedications TEXT DEFAULT NULL,
        knownAllergies TEXT DEFAULT NULL,
        isPregnantOrLactating TINYINT(1) NOT NULL DEFAULT 0,
        hasSevereSymptoms TINYINT(1) NOT NULL DEFAULT 0,
        hasOrganFailure TINYINT(1) NOT NULL DEFAULT 0,
        responsesJson LONGTEXT NOT NULL,
        evaluationResult ENUM('ELIGIBLE_TO_CONTINUE', 'PROFESSIONAL_GUIDANCE_REQUIRED') NOT NULL,
        reasonSummary TEXT DEFAULT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_screening_user (userId),
        KEY idx_screening_result (evaluationResult),
        CONSTRAINT fk_screening_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure status, completedAt, and snake_case alias columns exist
    await addColumnIfNotExists(conn, "community_health_screenings", "status", "ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'COMPLETED' AFTER evaluationResult");
    await addColumnIfNotExists(conn, "community_health_screenings", "completedAt", "DATETIME(3) NULL AFTER status");
    await addColumnIfNotExists(conn, "community_health_screenings", "completed_at", "DATETIME(3) NULL AFTER completedAt");
    await addColumnIfNotExists(conn, "community_health_screenings", "result", "VARCHAR(50) NULL AFTER reasonSummary");
    await addColumnIfNotExists(conn, "community_health_screenings", "rule_version", "VARCHAR(50) NULL AFTER ruleVersion");
    await addColumnIfNotExists(conn, "community_health_screenings", "user_id", "INT(11) NULL AFTER userId");
    await addColumnIfNotExists(conn, "community_health_screenings", "created_at", "DATETIME(3) NULL AFTER createdAt");

    // 2. conversations
    await conn.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        title VARCHAR(191) NOT NULL DEFAULT 'Herbal Educational Chat',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_conv_user (userId),
        CONSTRAINT fk_conv_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure conversation context columns exist
    await addColumnIfNotExists(conn, "conversations", "currentPlantId", "VARCHAR(191) NULL AFTER title");
    await addColumnIfNotExists(conn, "conversations", "currentProductId", "VARCHAR(191) NULL AFTER currentPlantId");
    await addColumnIfNotExists(conn, "conversations", "activeContextType", "ENUM('NONE', 'PLANT', 'PRODUCT') NOT NULL DEFAULT 'NONE' AFTER currentProductId");

    // 3. messages
    await conn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT(11) NOT NULL AUTO_INCREMENT,
        conversationId INT(11) NOT NULL,
        sender ENUM('USER', 'ASSISTANT') NOT NULL DEFAULT 'USER',
        content TEXT NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_msg_conv (conversationId),
        CONSTRAINT fk_msg_conv FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};
export default migration;
