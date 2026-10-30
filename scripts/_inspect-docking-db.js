const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
// minimal .env.local loader
for (const l of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "natureaide_db",
  });
  const [projects] = await c.query("SELECT id,title,currentStage,researcherId FROM research_projects ORDER BY id");
  console.log("PROJECTS", JSON.stringify(projects));
  const [comp] = await c.query("SELECT id,projectId,compoundName,molecularFormula,pubchemId,LEFT(smiles,80) smiles,selectedForDocking FROM research_compounds WHERE selectedForDocking=1");
  console.log("SELECTED", JSON.stringify(comp, null, 1));
  for (const t of ["docking_runs", "docking_targets", "docking_setups", "research_docking_syntheses", "research_project_stages"]) {
    const [cols] = await c.query(`SHOW COLUMNS FROM ${t}`);
    console.log(t, cols.map((x) => `${x.Field}:${x.Type}`).join(", "));
  }
  const [st] = await c.query("SELECT projectId,stageKey,status FROM research_project_stages WHERE stageKey IN ('docking','formulation-safety','formulation')");
  console.log("STAGES", JSON.stringify(st));
  await c.end();
})().catch((e) => console.error("ERR", e.message));
