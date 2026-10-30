import type { Migration, DbExecutor } from "../src/lib/migration-helpers";
import { addColumnIfNotExists } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "001_shared_core_users",
  domain: "shared",
  name: "Core users, user profiles, and account activity logs",
  up: async (conn) => {
    // 1. users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT(11) NOT NULL AUTO_INCREMENT,
        email VARCHAR(191) NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(191) DEFAULT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'COMMUNITY',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY email_unique (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure status and audit fields exist on users
    await addColumnIfNotExists(conn, "users", "status", "VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' AFTER role");
    await addColumnIfNotExists(conn, "users", "disabledReasonCategory", "VARCHAR(100) NULL AFTER status");
    await addColumnIfNotExists(conn, "users", "disabledReason", "TEXT NULL AFTER disabledReasonCategory");
    await addColumnIfNotExists(conn, "users", "disabledAt", "DATETIME(3) NULL AFTER disabledReason");
    await addColumnIfNotExists(conn, "users", "disabledBy", "INT NULL AFTER disabledAt");
    await addColumnIfNotExists(conn, "users", "lastLoginAt", "DATETIME(3) NULL AFTER disabledBy");
    await addColumnIfNotExists(conn, "users", "lastActiveAt", "DATETIME(3) NULL AFTER lastLoginAt");

    // 2. user_profiles table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        preferredLanguage VARCHAR(50) DEFAULT 'English',
        healthInterests VARCHAR(255) DEFAULT 'Everyday Wellness, Digestion, Respiratory Comfort',
        institution VARCHAR(191) DEFAULT 'National Institute of Health & Botanical Research',
        department VARCHAR(191) DEFAULT 'Department of Pharmacognosy & Phytochemistry',
        researchField VARCHAR(191) DEFAULT 'Natural Products Chemistry & Molecular Screening',
        academicInfo TEXT DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY user_profile_unique (userId),
        CONSTRAINT fk_user_profile_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure research fields exist on user_profiles
    await addColumnIfNotExists(conn, "user_profiles", "institution", "VARCHAR(191) DEFAULT 'National Institute of Health & Botanical Research' AFTER healthInterests");
    await addColumnIfNotExists(conn, "user_profiles", "department", "VARCHAR(191) DEFAULT 'Department of Pharmacognosy & Phytochemistry' AFTER institution");
    await addColumnIfNotExists(conn, "user_profiles", "researchField", "VARCHAR(191) DEFAULT 'Natural Products Chemistry & Molecular Screening' AFTER department");
    await addColumnIfNotExists(conn, "user_profiles", "academicInfo", "TEXT DEFAULT NULL AFTER researchField");
    await addColumnIfNotExists(conn, "user_profiles", "bio", "TEXT DEFAULT NULL AFTER academicInfo");

    // 3. user_account_activity_logs table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_account_activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        targetUserId INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        previousValue VARCHAR(255) NULL,
        newValue VARCHAR(255) NULL,
        reasonCategory VARCHAR(100) NULL,
        reason TEXT NULL,
        performedBy INT NOT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_uaal_target (targetUserId),
        INDEX idx_uaal_performer (performedBy)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};
export default migration;
