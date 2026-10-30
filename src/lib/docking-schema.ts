import pool from "@/lib/db";

let ready: Promise<void> | null = null;

async function columnExists(table: string, column: string): Promise<boolean> {
  const [rows]: any = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0]?.n) > 0;
}

async function addColumn(table: string, column: string, definition: string) {
  if (!(await columnExists(table, column))) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

/**
 * Extends the existing docking tables so a Vina run can be stored as a
 * scientific record. Safe to call on every request.
 */
export function ensureDockingSchema(): Promise<void> {
  if (!ready) {
    ready = migrate().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS docking_ligand_preps (
      id INT NOT NULL AUTO_INCREMENT,
      projectId INT NOT NULL,
      compoundId INT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
      smiles TEXT NULL,
      pubchemCid VARCHAR(32) NULL,
      formula VARCHAR(64) NULL,
      structureSource VARCHAR(255) NULL,
      method TEXT NULL,
      pdbqtPath VARCHAR(500) NULL,
      heavyAtoms INT NULL,
      torsions INT NULL,
      molecularWeight DECIMAL(12,3) NULL,
      errorMessage TEXT NULL,
      preparedAt DATETIME(3) NULL,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_dock_ligand (projectId, compoundId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const runCols: Array<[string, string]> = [
    ["jobStatus", "VARCHAR(32) NULL"],
    ["vinaVersion", "VARCHAR(120) NULL"],
    ["posesJson", "MEDIUMTEXT NULL"],
    ["vinaLog", "MEDIUMTEXT NULL"],
    ["stdoutText", "MEDIUMTEXT NULL"],
    ["stderrText", "MEDIUMTEXT NULL"],
    ["exitCode", "INT NULL"],
    ["configJson", "MEDIUMTEXT NULL"],
    ["ligandPrepJson", "TEXT NULL"],
    ["receptorPrepJson", "TEXT NULL"],
    ["outputPdbqtPath", "VARCHAR(500) NULL"],
    ["logPath", "VARCHAR(500) NULL"],
    ["startedAt", "DATETIME(3) NULL"],
    ["completedAt", "DATETIME(3) NULL"],
    ["errorMessage", "TEXT NULL"],
    ["poseCount", "INT NULL"],
    ["literatureJson", "MEDIUMTEXT NULL"],
  ];
  for (const [name, def] of runCols) await addColumn("docking_runs", name, def);

  const targetCols: Array<[string, string]> = [
    ["prepStatus", "VARCHAR(32) NULL"],
    ["prepError", "TEXT NULL"],
    ["prepMethod", "TEXT NULL"],
    ["receptorPdbqtPath", "VARCHAR(500) NULL"],
    ["cleanPdbPath", "VARCHAR(500) NULL"],
    ["sourceUrl", "VARCHAR(500) NULL"],
    ["structureMeta", "MEDIUMTEXT NULL"],
    ["preparedAt", "DATETIME(3) NULL"],
    ["detectedSites", "MEDIUMTEXT NULL"],
    ["gridConfigJson", "TEXT NULL"],
  ];
  for (const [name, def] of targetCols) await addColumn("docking_targets", name, def);

  await addColumn("docking_setups", "gridConfigJson", "TEXT NULL");

  const [enumRows]: any = await pool.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'docking_runs' AND COLUMN_NAME = 'dataSource'`
  );
  const enumType = String(enumRows[0]?.t || "");
  if (enumType && !enumType.includes("'VINA'")) {
    await pool.query(
      `ALTER TABLE docking_runs MODIFY COLUMN dataSource
       ENUM('MANUAL_ENTRY','UPLOADED_RESULT','NOT_YET_RUN','VINA') NOT NULL DEFAULT 'NOT_YET_RUN'`
    );
  }
}
