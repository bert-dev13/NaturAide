const mysql = require("mysql2/promise");

async function migrate() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "natureaide_db",
  });

  console.log("Connected to natureaide_db.");

  // 1. Add status and audit columns to users if they don't exist
  const [statusCols] = await conn.query("SHOW COLUMNS FROM users LIKE 'status'");
  if (statusCols.length === 0) {
    await conn.query("ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' AFTER role");
    console.log("Added status column to users.");
  } else {
    console.log("status column already exists on users.");
  }

  const [disabledReasonCols] = await conn.query("SHOW COLUMNS FROM users LIKE 'disabledReason'");
  if (disabledReasonCols.length === 0) {
    await conn.query("ALTER TABLE users ADD COLUMN disabledReasonCategory VARCHAR(100) NULL AFTER status, ADD COLUMN disabledReason TEXT NULL AFTER disabledReasonCategory, ADD COLUMN disabledAt DATETIME(3) NULL AFTER disabledReason, ADD COLUMN disabledBy INT NULL AFTER disabledAt");
    console.log("Added disabledReason and audit fields to users.");
  } else {
    console.log("disabledReason fields already exist on users.");
  }

  const [lastLoginCols] = await conn.query("SHOW COLUMNS FROM users LIKE 'lastLoginAt'");
  if (lastLoginCols.length === 0) {
    await conn.query("ALTER TABLE users ADD COLUMN lastLoginAt DATETIME(3) NULL AFTER disabledBy, ADD COLUMN lastActiveAt DATETIME(3) NULL AFTER lastLoginAt");
    console.log("Added lastLoginAt and lastActiveAt to users.");
  } else {
    console.log("lastLoginAt fields already exist on users.");
  }

  // 2. Create user_account_activity_logs table
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
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
    )
  `);
  console.log("Verified user_account_activity_logs table.");

  await conn.end();
  console.log("User Management migration completed successfully.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
