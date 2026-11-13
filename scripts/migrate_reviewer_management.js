const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'natureaide_db'
  });

  try {
    console.log('--- Migrating Reviewer Management Schema ---');

    // 1. Add columns to reviewer_profiles if missing
    const [cols] = await pool.query('SHOW COLUMNS FROM reviewer_profiles');
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('verifiedBy')) {
      await pool.query('ALTER TABLE reviewer_profiles ADD COLUMN verifiedBy INT NULL AFTER verifiedAt');
      console.log('Added verifiedBy to reviewer_profiles');
    }
    if (!colNames.includes('suspendedBy')) {
      await pool.query('ALTER TABLE reviewer_profiles ADD COLUMN suspendedBy INT NULL AFTER verifiedBy');
      console.log('Added suspendedBy to reviewer_profiles');
    }
    if (!colNames.includes('suspendedAt')) {
      await pool.query('ALTER TABLE reviewer_profiles ADD COLUMN suspendedAt DATETIME(3) NULL AFTER suspendedBy');
      console.log('Added suspendedAt to reviewer_profiles');
    }
    if (!colNames.includes('suspensionReason')) {
      await pool.query('ALTER TABLE reviewer_profiles ADD COLUMN suspensionReason TEXT NULL AFTER suspendedAt');
      console.log('Added suspensionReason to reviewer_profiles');
    }

    await pool.query("ALTER TABLE reviewer_profiles MODIFY COLUMN specialty VARCHAR(100) NOT NULL DEFAULT 'PHARMACIST'");
    console.log('Updated reviewer_profiles specialty column to VARCHAR(100)');

    // 2. Create reviewer_credentials table
    await pool.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Table reviewer_credentials checked/created.');

    // 3. Create reviewer_verification_logs table
    await pool.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Table reviewer_verification_logs checked/created.');

    // 4. Ensure initial credential and log for existing verified reviewer (user 3)
    const [existingCreds] = await pool.query('SELECT * FROM reviewer_credentials WHERE reviewerId = 3');
    if (existingCreds.length === 0) {
      await pool.query(`
        INSERT INTO reviewer_credentials (
          reviewerId, credentialType, credentialTitle, credentialNumber, issuingOrganization,
          issueDate, expirationDate, documentUrl, verificationStatus, verifiedBy, verifiedAt
        ) VALUES (
          3, 'PROFESSIONAL_LICENSE', 'Registered Pharmacist Board License', 'RPh-088921-PH',
          'Philippine Professional Regulation Commission (PRC)', '2012-06-15', '2028-06-15',
          '/uploads/credentials/prc-license-elena-rostova.pdf', 'VERIFIED', 4, CURRENT_TIMESTAMP(3)
        )
      `);
      console.log('Inserted default verified credential for reviewer 3');
    }

    const [existingLogs] = await pool.query('SELECT * FROM reviewer_verification_logs WHERE reviewerId = 3');
    if (existingLogs.length === 0) {
      await pool.query(`
        INSERT INTO reviewer_verification_logs (
          reviewerId, action, previousStatus, newStatus, adminId, adminName, notes, createdAt
        ) VALUES (
          3, 'REVIEWER_VERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 4,
          'NatureAide Administrator', 'Initial system verification of clinical credentials and PRC Board Registration.',
          CURRENT_TIMESTAMP(3)
        )
      `);
      console.log('Inserted initial verification log for reviewer 3');
    }

    console.log('✓ Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
