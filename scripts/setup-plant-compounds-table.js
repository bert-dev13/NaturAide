const mysql = require("mysql2/promise");

async function setup() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "natureaide_db",
  });

  console.log("Creating plant_compounds table if not exists...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plant_compounds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      plantId VARCHAR(191) NULL,
      plantScientificName VARCHAR(191) NOT NULL,
      plantCommonName VARCHAR(191) NOT NULL,
      compoundName VARCHAR(191) NOT NULL,
      iupacName VARCHAR(255) NULL,
      molecularFormula VARCHAR(100) NULL,
      molecularWeight DECIMAL(10, 4) NULL,
      compoundClass VARCHAR(100) NULL,
      pubchemId VARCHAR(50) NULL,
      smiles VARCHAR(500) NULL,
      plantPartReported VARCHAR(150) NULL,
      referencesData JSON NULL,
      verificationStatus VARCHAR(50) DEFAULT 'VERIFIED_DATABASE',
      submittedByResearcherId INT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_plant_sci (plantScientificName),
      INDEX idx_plant_id (plantId),
      INDEX idx_compound_name (compoundName)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("plant_compounds table is ready.");
  await pool.end();
}

setup().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

