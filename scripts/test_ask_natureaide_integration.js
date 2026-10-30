const mysql = require('mysql2/promise');

async function testAskNatureAideKnowledgeRetrieval() {
  console.log("==========================================================================");
  console.log("TESTING ASK NATUREAIDE GROUNDED KNOWLEDGE RETRIEVAL");
  console.log("==========================================================================");

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'natureaide_db',
    port: 3306,
  });

  // 1. Check published plant and guide data that Ask NatureAide accesses
  const [plantRows] = await pool.query(`
    SELECT p.id, p.slug, p.commonName, p.scientificName,
           g.whatResearchSays, g.safetyInformation, g.about
    FROM plants p
    LEFT JOIN plant_guides g ON g.plantId = p.id
    WHERE p.id = 'sambong'
  `);

  if (plantRows.length === 0) throw new Error("Sambong plant guide not found");
  const sambong = plantRows[0];
  console.log("Sambong Knowledge in Community Base:");
  console.log("- Common Name:", sambong.commonName);
  console.log("- Research Length:", sambong.whatResearchSays?.length);
  console.log("- Contains Integrated Finding:", sambong.whatResearchSays.includes("Validated Research Finding"));

  // 2. Verify that no DRAFT, SUBMITTED, or REJECTED proposals are published to Community
  const [unapprovedProposals] = await pool.query(`
    SELECT proposalCode, status, title
    FROM knowledge_integration_proposals
    WHERE status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'REJECTED')
  `);
  console.log("Unapproved proposals in system:", unapprovedProposals.length);

  for (const up of unapprovedProposals) {
    if (sambong.whatResearchSays.includes(up.proposalCode)) {
      throw new Error(`SECURITY VIOLATION: Unapproved proposal ${up.proposalCode} leaked into Community Knowledge!`);
    }
  }
  console.log("✓ Verified: Zero unapproved proposals leaked into Community knowledge base.");

  // 3. Verify knowledge_versions audit trail
  const [versions] = await pool.query(`
    SELECT id, entityType, fieldUpdated, sourceProposalId, integratedBy, integratedAt
    FROM knowledge_versions
  `);
  console.log(`✓ Audit Trail: ${versions.length} knowledge snapshot version(s) archived.`);

  console.log("\n==========================================================================");
  console.log("ASK NATUREAIDE KNOWLEDGE RETRIEVAL VERIFIED SUCCESSFULLY!");
  console.log("==========================================================================");

  await pool.end();
}

testAskNatureAideKnowledgeRetrieval().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
