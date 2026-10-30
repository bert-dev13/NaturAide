const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'natureaide_db',
    port: 3306,
  });

  console.log('Running migration for Dossier and Review tables...');

  // 1. research_dossiers
  await pool.query(`
    CREATE TABLE IF NOT EXISTS research_dossiers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL UNIQUE,
      researcherId INT NOT NULL,
      currentVersionTag VARCHAR(50) DEFAULT 'v1.0',
      status ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED', 'ACCEPTED_FOR_NEXT_STAGE') DEFAULT 'SUBMITTED',
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_rd_project (projectId),
      INDEX idx_rd_researcher (researcherId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. research_dossier_versions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS research_dossier_versions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dossierId INT NOT NULL,
      projectId INT NOT NULL,
      researcherId INT NOT NULL,
      versionTag VARCHAR(50) NOT NULL,
      reviewRound INT DEFAULT 1,
      formulationVersionId INT NULL,
      formulationVersionTag VARCHAR(50) NULL,
      submissionStatus ENUM('SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED', 'ACCEPTED_FOR_NEXT_STAGE') DEFAULT 'SUBMITTED',
      preferredSpecialty VARCHAR(100) NULL,
      messageToReviewers TEXT NULL,
      readinessSnapshot JSON NULL,
      dossierSnapshot LONGTEXT NOT NULL,
      safetyFlagsSnapshot JSON NULL,
      submissionTimestamp DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      assignedReviewerId INT NULL,
      reviewedAt DATETIME(3) NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_rdv_dossier (dossierId),
      INDEX idx_rdv_project (projectId),
      INDEX idx_rdv_version (versionTag)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. research_dossier_stage_snapshots
  await pool.query(`
    CREATE TABLE IF NOT EXISTS research_dossier_stage_snapshots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dossierVersionId INT NOT NULL,
      projectId INT NOT NULL,
      stageKey VARCHAR(50) NOT NULL,
      stageTitle VARCHAR(100) NOT NULL,
      stageStatus VARCHAR(50) NOT NULL,
      snapshotPayload LONGTEXT NOT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_rdss_version (dossierVersionId),
      INDEX idx_rdss_project (projectId),
      INDEX idx_rdss_stage (stageKey)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. review_activity_logs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS review_activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      submissionId INT NULL,
      dossierVersionId INT NULL,
      actorId INT NOT NULL,
      actorRole VARCHAR(50) NOT NULL,
      actionType VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_ral_project (projectId),
      INDEX idx_ral_submission (submissionId),
      INDEX idx_ral_actor (actorId),
      INDEX idx_ral_created (createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Migration completed successfully!');
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
