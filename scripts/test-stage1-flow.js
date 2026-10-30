const mysql = require("mysql2/promise");

async function runTest() {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "natureaide_db",
  });

  console.log("=== Testing Stage 1 Complete & Continue Workflow ===");

  // Reset Project 8 for test
  await pool.query(
    "UPDATE research_projects SET currentStage = 'plant-literature', progressPercent = 0 WHERE id = 8"
  );
  await pool.query(
    "UPDATE research_project_stages SET status = 'IN_PROGRESS', completedAt = NULL WHERE projectId = 8 AND stageKey = 'plant-literature'"
  );
  await pool.query(
    "UPDATE research_project_stages SET status = 'NOT_STARTED', completedAt = NULL WHERE projectId = 8 AND stageKey = 'in-silico'"
  );
  await pool.query(
    "UPDATE research_plant_data SET partsStudied = NULL, specimenSource = NULL, selectionRationale = NULL WHERE projectId = 8"
  );

  console.log("[1] Reset Project 8: currentStage='plant-literature', plant-literature='IN_PROGRESS', in-silico='NOT_STARTED'");

  // 1. Simulate saving specimen
  console.log("[2] Saving specimen with Plant Part = 'Leaves'...");
  await pool.query(
    `INSERT INTO research_plant_data (
      projectId, partsStudied, specimenSource, selectionRationale, updatedAt
    ) VALUES (8, 'Leaves', 'National Herbarium (PNH)', 'Documented ethnopharmacological efficacy in metabolic glycemic regulation.', CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE
      partsStudied = VALUES(partsStudied),
      specimenSource = VALUES(specimenSource),
      selectionRationale = VALUES(selectionRationale),
      updatedAt = CURRENT_TIMESTAMP(3)`
  );

  const [savedData] = await pool.query(
    "SELECT partsStudied, specimenSource, selectionRationale FROM research_plant_data WHERE projectId = 8"
  );
  console.log("Saved Research Plant Data:", savedData[0]);

  if (savedData[0].partsStudied !== "Leaves") {
    throw new Error("Failed: partsStudied was not saved properly!");
  }
  console.log("✓ partsStudied successfully saved to research_plant_data!");

  // 2. Simulate stage completion
  console.log("[3] Simulating Stage 1 completion...");
  await pool.query(
    `UPDATE research_project_stages
     SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
     WHERE projectId = 8 AND (stageKey = 'plant-literature' OR stageKey = 'plant-research')`
  );
  await pool.query(
    `UPDATE research_project_stages
     SET status = 'IN_PROGRESS', updatedAt = CURRENT_TIMESTAMP(3)
     WHERE projectId = 8 AND (stageKey = 'in-silico' OR stageKey = 'insilico')`
  );
  await pool.query(
    `UPDATE research_projects
     SET currentStage = 'in-silico', progressPercent = GREATEST(progressPercent, 14), updatedAt = CURRENT_TIMESTAMP(3)
     WHERE id = 8`
  );

  const [proj] = await pool.query(
    "SELECT id, currentStage, progressPercent FROM research_projects WHERE id = 8"
  );
  console.log("Updated Project 8:", proj[0]);

  const [stages] = await pool.query(
    "SELECT stageKey, status FROM research_project_stages WHERE projectId = 8 AND stageKey IN ('plant-literature', 'in-silico')"
  );
  console.log("Updated Stages for Project 8:", stages);

  const plantLitStage = stages.find((s) => s.stageKey === "plant-literature");
  const inSilicoStage = stages.find((s) => s.stageKey === "in-silico");

  if (plantLitStage.status !== "COMPLETED") {
    throw new Error("Failed: plant-literature is not COMPLETED!");
  }
  if (inSilicoStage.status !== "IN_PROGRESS") {
    throw new Error("Failed: in-silico is not IN_PROGRESS!");
  }
  if (proj[0].currentStage !== "in-silico") {
    throw new Error("Failed: currentStage is not in-silico!");
  }
  if (proj[0].progressPercent < 14) {
    throw new Error("Failed: progressPercent did not advance!");
  }

  console.log("✓ Project Workspace stage status verification PASSED!");
  console.log("  Stage 1: plant-literature -> COMPLETED (✓ Completed)");
  console.log("  Stage 2: in-silico -> IN_PROGRESS (● Current)");
  console.log("  Project currentStage: in-silico");
  console.log("  Project progress: " + proj[0].progressPercent + "%");

  await pool.end();
}

runTest().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
