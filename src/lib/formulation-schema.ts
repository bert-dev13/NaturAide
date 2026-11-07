import pool from "@/lib/db";

let ready: Promise<void> | null = null;

async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const [rows]: any = await pool.query(
      `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    return Number(rows[0]?.n) > 0;
  } catch {
    return false;
  }
}

async function addColumn(table: string, column: string, definition: string) {
  if (!(await columnExists(table, column))) {
    try {
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    } catch (e: any) {
      // Ignore duplicate column errors if raced
      if (!e.message?.includes("Duplicate column name")) {
        console.warn(`[formulation-schema] Could not add ${table}.${column}:`, e.message);
      }
    }
  }
}

/**
 * Ensures formulation tables have all columns required for AI proposals,
 * component traceability, and reviewer validation. Safe to call on every request.
 */
export function ensureFormulationSchema(): Promise<void> {
  if (!ready) {
    ready = migrate().catch((error) => {
      ready = null;
      console.error("[formulation-schema] Migration failed:", error);
      throw error;
    });
  }
  return ready;
}

async function migrate() {
  // Ensure research_formulations has AI traceability columns
  await addColumn("research_formulations", "aiProposalJson", "LONGTEXT DEFAULT NULL");
  await addColumn("research_formulations", "aiGeneratedAt", "TIMESTAMP NULL DEFAULT NULL");
  await addColumn("research_formulations", "dosageFormType", "VARCHAR(100) DEFAULT NULL");
  await addColumn("research_formulations", "researcherRationale", "TEXT DEFAULT NULL");

  // Ensure formulation_components has traceability columns
  await addColumn("formulation_components", "isAiSuggested", "TINYINT(1) DEFAULT 0");
  await addColumn("formulation_components", "sourceReference", "VARCHAR(255) DEFAULT NULL");
  await addColumn("formulation_components", "evidenceStatus", "VARCHAR(100) DEFAULT NULL");
  await addColumn("formulation_components", "materialId", "INT(11) DEFAULT NULL");
  await addColumn("formulation_components", "inventoryStatus", "VARCHAR(32) DEFAULT NULL");
  await addColumn("formulation_components", "isVehicle", "TINYINT(1) DEFAULT 0");
  await addColumn("formulation_components", "isPhAdjuster", "TINYINT(1) DEFAULT 0");

  // Ensure formulation_rationales table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS formulation_rationales (
      id INT(11) NOT NULL AUTO_INCREMENT,
      formulationId INT(11) NOT NULL,
      versionId INT(11) NOT NULL,
      projectId INT(11) NOT NULL,
      componentSelectionRationale TEXT DEFAULT NULL,
      literatureSupport TEXT DEFAULT NULL,
      previousStagesInfluence TEXT DEFAULT NULL,
      knownLimitations TEXT DEFAULT NULL,
      validationQuestions TEXT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_form_rat (formulationId, versionId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

