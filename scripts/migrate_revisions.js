const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'natureaide_db',
    port: 3306,
  });

  console.log('Running migration for Stage 9 Revisions and Review tables...');

  // 1. Alter review_feedback to add recommendation, referenceLink, responseAction, responseDescription, affectedStage, supportingFileUrl, dossierVersionTag
  const [cols] = await pool.query('DESCRIBE review_feedback');
  const existingCols = cols.map(c => c.Field);

  if (!existingCols.includes('recommendation')) {
    await pool.query('ALTER TABLE review_feedback ADD COLUMN recommendation TEXT NULL AFTER comment');
    console.log('✓ Added recommendation to review_feedback');
  }
  if (!existingCols.includes('referenceLink')) {
    await pool.query('ALTER TABLE review_feedback ADD COLUMN referenceLink VARCHAR(255) NULL AFTER recommendation');
    console.log('✓ Added referenceLink to review_feedback');
  }
  if (!existingCols.includes('responseAction')) {
    await pool.query("ALTER TABLE review_feedback ADD COLUMN responseAction ENUM('CHANGE_MADE', 'CLARIFICATION_PROVIDED', 'ADDITIONAL_EVIDENCE_ADDED', 'NO_CHANGE_WITH_JUSTIFICATION') NULL AFTER status");
    console.log('✓ Added responseAction to review_feedback');
  }
  if (!existingCols.includes('responseDescription')) {
    await pool.query('ALTER TABLE review_feedback ADD COLUMN responseDescription TEXT NULL AFTER responseAction');
    console.log('✓ Added responseDescription to review_feedback');
  }
  if (!existingCols.includes('affectedStage')) {
    await pool.query('ALTER TABLE review_feedback ADD COLUMN affectedStage VARCHAR(100) NULL AFTER responseDescription');
    console.log('✓ Added affectedStage to review_feedback');
  }
  if (!existingCols.includes('supportingFileUrl')) {
    await pool.query('ALTER TABLE review_feedback ADD COLUMN supportingFileUrl VARCHAR(255) NULL AFTER affectedStage');
    console.log('✓ Added supportingFileUrl to review_feedback');
  }
  if (!existingCols.includes('dossierVersionTag')) {
    await pool.query("ALTER TABLE review_feedback ADD COLUMN dossierVersionTag VARCHAR(50) NULL DEFAULT 'v1.0' AFTER supportingFileUrl");
    console.log('✓ Added dossierVersionTag to review_feedback');
  }

  // 2. Create revision_cycles
  await pool.query(`
    CREATE TABLE IF NOT EXISTS revision_cycles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      submissionId INT NOT NULL,
      dossierVersionTag VARCHAR(50) NOT NULL,
      nextVersionTag VARCHAR(50) NULL,
      reviewRound INT DEFAULT 1,
      reviewerId INT NOT NULL,
      reviewerDecision ENUM('REVISION_REQUESTED', 'ACCEPTED_FOR_NEXT_STAGE') NOT NULL,
      reviewerSummary TEXT NOT NULL,
      status ENUM('IN_PROGRESS', 'RESOLVED', 'SUPERSEDED') DEFAULT 'IN_PROGRESS',
      researcherSummary TEXT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      resolvedAt DATETIME(3) NULL,
      INDEX idx_rc_project (projectId),
      INDEX idx_rc_submission (submissionId),
      INDEX idx_rc_reviewer (reviewerId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created revision_cycles table');

  // 3. Create revision_change_records
  await pool.query(`
    CREATE TABLE IF NOT EXISTS revision_change_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cycleId INT NULL,
      projectId INT NOT NULL,
      fromVersionTag VARCHAR(50) NOT NULL,
      toVersionTag VARCHAR(50) NOT NULL,
      sectionKey VARCHAR(50) NOT NULL,
      changeType ENUM('ADDED', 'MODIFIED', 'REMOVED') NOT NULL,
      previousSummary TEXT NULL,
      newSummary TEXT NULL,
      changeDescription TEXT NOT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_rcr_project (projectId),
      INDEX idx_rcr_cycle (cycleId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created revision_change_records table');

  console.log('Migration completed successfully!');
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
