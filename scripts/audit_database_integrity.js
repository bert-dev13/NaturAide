const mysql = require("mysql2/promise");

async function checkDatabaseIntegrity() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "natureaide_db",
  });

  console.log("=========================================");
  console.log("NATUREAIDE DATABASE INTEGRITY AUDIT");
  console.log("=========================================\n");

  const results = {
    orphans: {},
    duplicates: {},
    indexes: {},
  };

  // 1. Check for Orphan Records
  const queries = [
    {
      name: "Research projects without valid researchers",
      sql: `SELECT COUNT(*) as count FROM research_projects rp LEFT JOIN users u ON rp.researcherId = u.id WHERE u.id IS NULL`,
    },
    {
      name: "Projects linked to missing plants (where plantId is provided)",
      sql: `SELECT COUNT(*) as count FROM research_projects rp LEFT JOIN plants p ON rp.plantId = p.id WHERE rp.plantId IS NOT NULL AND p.id IS NULL`,
    },
    {
      name: "Reviewer profiles without REVIEWER users",
      sql: `SELECT COUNT(*) as count FROM reviewer_profiles rp LEFT JOIN users u ON rp.userId = u.id WHERE u.id IS NULL OR u.role != 'REVIEWER'`,
    },
    {
      name: "Review assignments linked to missing reviewers",
      sql: `SELECT COUNT(*) as count FROM review_assignments ra LEFT JOIN users u ON ra.reviewerId = u.id WHERE u.id IS NULL`,
    },
    {
      name: "Review assignments linked to missing projects",
      sql: `SELECT COUNT(*) as count FROM review_assignments ra LEFT JOIN research_projects rp ON ra.projectId = rp.id WHERE rp.id IS NULL`,
    },
    {
      name: "Review assignments linked to missing submissions",
      sql: `SELECT COUNT(*) as count FROM review_assignments ra LEFT JOIN review_submissions rs ON ra.submissionId = rs.id WHERE rs.id IS NULL`,
    },
    {
      name: "Dossier versions without dossier or project",
      sql: `SELECT COUNT(*) as count FROM research_dossier_versions rdv LEFT JOIN research_projects rp ON rdv.projectId = rp.id WHERE rp.id IS NULL`,
    },
    {
      name: "Laboratory records without projects",
      sql: `SELECT COUNT(*) as count FROM laboratory_tests lt LEFT JOIN research_projects rp ON lt.projectId = rp.id WHERE rp.id IS NULL`,
    },
    {
      name: "Completion records without projects",
      sql: `SELECT COUNT(*) as count FROM research_completion_records rcr LEFT JOIN research_projects rp ON rcr.projectId = rp.id WHERE rp.id IS NULL`,
    },
    {
      name: "Knowledge proposals without projects",
      sql: `SELECT COUNT(*) as count FROM knowledge_integration_proposals kip LEFT JOIN research_projects rp ON kip.projectId = rp.id WHERE rp.id IS NULL`,
    },
    {
      name: "Knowledge versions without valid plant_guides",
      sql: `SELECT COUNT(*) as count FROM knowledge_versions kv LEFT JOIN plant_guides pg ON kv.entityId = pg.id WHERE kv.entityType = 'plant_guides' AND pg.id IS NULL`,
    },
  ];

  console.log("--- 1. ORPHAN RECORD AUDIT ---");
  for (const q of queries) {
    try {
      const [rows] = await connection.query(q.sql);
      const count = rows[0]?.count || 0;
      results.orphans[q.name] = count;
      console.log(`[${count === 0 ? "PASS" : "WARN"}] ${q.name}: ${count} orphan(s)`);
    } catch (e) {
      console.log(`[ERROR] ${q.name}: ${e.message}`);
      results.orphans[q.name] = e.message;
    }
  }

  // 2. Check for Duplicates & Inconsistencies
  console.log("\n--- 2. UNIQUENESS & INTEGRITY AUDIT ---");
  const uniqueChecks = [
    {
      name: "Duplicate user emails",
      sql: `SELECT email, COUNT(*) as cnt FROM users GROUP BY email HAVING cnt > 1`,
    },
    {
      name: "Multiple reviewer profiles per user",
      sql: `SELECT userId, COUNT(*) as cnt FROM reviewer_profiles GROUP BY userId HAVING cnt > 1`,
    },
    {
      name: "Multiple active current formulation versions per formulation",
      sql: `SELECT formulationId, COUNT(*) as cnt FROM formulation_versions WHERE isCurrentVersion = 1 GROUP BY formulationId HAVING cnt > 1`,
    },
    {
      name: "Duplicate dossier version tags per project",
      sql: `SELECT projectId, versionTag, COUNT(*) as cnt FROM research_dossier_versions GROUP BY projectId, versionTag HAVING cnt > 1`,
    },
  ];

  for (const uc of uniqueChecks) {
    try {
      const [rows] = await connection.query(uc.sql);
      const dupCount = rows.length;
      results.duplicates[uc.name] = dupCount;
      console.log(`[${dupCount === 0 ? "PASS" : "WARN"}] ${uc.name}: ${dupCount} duplicate set(s)`);
    } catch (e) {
      console.log(`[ERROR] ${uc.name}: ${e.message}`);
      results.duplicates[uc.name] = e.message;
    }
  }

  // 3. Inspect Key Indexes
  console.log("\n--- 3. KEY INDEX AUDIT ---");
  const tableIndexes = [
    "users",
    "reviewer_profiles",
    "research_projects",
    "review_assignments",
    "review_submissions",
    "knowledge_integration_proposals",
    "knowledge_versions",
    "plant_guides",
    "plants",
  ];

  for (const tbl of tableIndexes) {
    try {
      const [idxRows] = await connection.query(`SHOW INDEX FROM ${tbl}`);
      const indexNames = [...new Set(idxRows.map((r) => r.Key_name))];
      results.indexes[tbl] = indexNames;
      console.log(`Table ${tbl}: [${indexNames.join(", ")}]`);
    } catch (e) {
      console.log(`Table ${tbl}: ERROR - ${e.message}`);
    }
  }

  await connection.end();
}

checkDatabaseIntegrity().catch(console.error);
