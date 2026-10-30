import { Migration, DbExecutor, addColumnIfNotExists } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "012_reviewer_profiles_credentials",
  name: "Reviewer Profiles, Credentials, and Verification Logs Schema",
  domain: "reviewer",
  up: async (conn: DbExecutor) => {
    // 1. reviewer_profiles
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reviewer_profiles (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL UNIQUE,
        specialty VARCHAR(100) NOT NULL DEFAULT 'PHARMACIST',
        professionalTitle VARCHAR(191) NOT NULL DEFAULT 'Clinical Pharmacist & Herbal Medicine Evaluator',
        institution VARCHAR(191) NOT NULL DEFAULT 'Philippine Pharmacopeia Commission / National Herb Research Center',
        licenseNumber VARCHAR(100) DEFAULT 'RPh-088921',
        areasOfExpertise TEXT DEFAULT 'Pharmacokinetics, Botanical Drug Interactions, Standardized Formulations, Safety Screening',
        bio TEXT DEFAULT 'Board-certified clinical pharmacist with 12+ years evaluating phytomedicinal monographs, adverse event toxicology, and botanical dosage form stability.',
        verificationStatus ENUM('PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED') NOT NULL DEFAULT 'VERIFIED',
        verifiedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        verifiedBy INT NULL,
        suspendedBy INT NULL,
        suspendedAt DATETIME(3) NULL,
        suspensionReason TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        CONSTRAINT fk_rev_prof_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure extra columns exist if reviewer_profiles was created by older schema
    await addColumnIfNotExists(conn, "reviewer_profiles", "verifiedBy", "INT NULL AFTER verifiedAt");
    await addColumnIfNotExists(conn, "reviewer_profiles", "suspendedBy", "INT NULL AFTER verifiedBy");
    await addColumnIfNotExists(conn, "reviewer_profiles", "suspendedAt", "DATETIME(3) NULL AFTER suspendedBy");
    await addColumnIfNotExists(conn, "reviewer_profiles", "suspensionReason", "TEXT NULL AFTER suspendedAt");

    // 2. reviewer_credentials
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reviewer_credentials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reviewerId INT NOT NULL,
        credentialType VARCHAR(100) NOT NULL,
        credentialTitle VARCHAR(255) NOT NULL,
        credentialNumber VARCHAR(100) NULL,
        issuingOrganization VARCHAR(255) NULL,
        issueDate DATE NULL,
        expirationDate DATE NULL,
        documentUrl VARCHAR(500) NULL,
        verificationStatus ENUM('SUBMITTED','VERIFIED','REJECTED','EXPIRED') NOT NULL DEFAULT 'SUBMITTED',
        verifiedBy INT NULL,
        verifiedAt DATETIME(3) NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_rev_cred_reviewer (reviewerId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. reviewer_verification_logs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reviewer_verification_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reviewerId INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        previousStatus VARCHAR(50) NULL,
        newStatus VARCHAR(50) NULL,
        adminId INT NULL,
        adminName VARCHAR(191) NULL,
        reasonCategory VARCHAR(100) NULL,
        notes TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_rev_verif_logs_reviewer (reviewerId),
        INDEX idx_rev_verif_logs_admin (adminId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
};
