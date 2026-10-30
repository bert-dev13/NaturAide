import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  });
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "natureaide_db",
  });

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

  console.log("community_health_screenings table created.");
  const [cols]: any = await conn.query("SHOW COLUMNS FROM community_health_screenings");
  console.log("Cols:", cols.map((c: any) => c.Field));
  await conn.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
