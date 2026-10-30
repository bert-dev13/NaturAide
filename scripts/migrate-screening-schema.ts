import pool from "../src/lib/db";

async function migrate() {
  console.log("Checking and migrating community_health_screenings columns...");

  // Check existing columns
  const [cols]: any = await pool.query("DESCRIBE community_health_screenings");
  const colNames = new Set(cols.map((c: any) => c.Field.toLowerCase()));

  if (!colNames.has("status")) {
    console.log("Adding column: status");
    await pool.query(
      "ALTER TABLE community_health_screenings ADD COLUMN status ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'COMPLETED'"
    );
  }

  if (!colNames.has("completedat")) {
    console.log("Adding column: completedAt");
    await pool.query(
      "ALTER TABLE community_health_screenings ADD COLUMN completedAt DATETIME(3) NULL"
    );
  }

  if (!colNames.has("completed_at")) {
    console.log("Adding column: completed_at");
    await pool.query(
      "ALTER TABLE community_health_screenings ADD COLUMN completed_at DATETIME(3) NULL"
    );
  }

  if (!colNames.has("result")) {
    console.log("Adding column: result");
    await pool.query(
      "ALTER TABLE community_health_screenings ADD COLUMN result VARCHAR(50) NULL"
    );
  }

  if (!colNames.has("rule_version")) {
    console.log("Adding column: rule_version");
    await pool.query(
      "ALTER TABLE community_health_screenings ADD COLUMN rule_version VARCHAR(50) NULL"
    );
  }

  if (!colNames.has("user_id")) {
    console.log("Adding column: user_id");
    await pool.query(
      "ALTER TABLE community_health_screenings ADD COLUMN user_id INT(11) NULL"
    );
  }

  if (!colNames.has("created_at")) {
    console.log("Adding column: created_at");
    await pool.query(
      "ALTER TABLE community_health_screenings ADD COLUMN created_at DATETIME(3) NULL"
    );
  }

  // Backfill existing records
  console.log("Synchronizing data in existing screening records...");
  await pool.query(`
    UPDATE community_health_screenings
    SET 
      status = 'COMPLETED',
      completedAt = COALESCE(completedAt, createdAt),
      completed_at = COALESCE(completed_at, createdAt),
      result = COALESCE(result, evaluationResult),
      rule_version = COALESCE(rule_version, ruleVersion),
      user_id = COALESCE(user_id, userId),
      created_at = COALESCE(created_at, createdAt)
    WHERE status IS NULL OR completedAt IS NULL OR completed_at IS NULL
  `);

  console.log("Migration complete!");
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
