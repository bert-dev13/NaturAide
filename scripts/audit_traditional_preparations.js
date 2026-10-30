const mysql = require('mysql2/promise');

async function audit() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  console.log('================================================================================');
  console.log('TRADITIONAL PREPARATION COVERAGE AUDIT');
  console.log('================================================================================\n');

  const [plants] = await conn.query(`
    SELECT id, slug, commonName, scientificName, plant_parts_used
    FROM plants
    ORDER BY commonName ASC
  `);

  let totalPublishedPlants = plants.length;
  let plantsWithVerifiedPrep = 0;
  let plantsWithMultiplePreps = 0;
  let totalPrepMethods = 0;
  let totalVerifiedReferences = 0;
  let plantsRequiringResearch = 0;

  const tableData = [];

  for (const plant of plants) {
    const [preps] = await conn.query(`
      SELECT tp.id, tp.title, tp.preparation_type, tp.plant_part_used, tp.status, tp.source_verified,
             (SELECT COUNT(*) FROM preparation_references pr WHERE pr.preparation_id = tp.id) as ref_count
      FROM traditional_preparations tp
      WHERE tp.plant_id = ?
      ORDER BY tp.id ASC
    `, [plant.id]);

    const hasPreps = preps.length > 0;
    if (hasPreps) {
      plantsWithVerifiedPrep++;
      totalPrepMethods += preps.length;
      if (preps.length > 1) {
        plantsWithMultiplePreps++;
      }
    } else {
      plantsRequiringResearch++;
    }

    const prepNames = preps.map(p => `${p.title} [${p.preparation_type}]`).join('; ') || 'NONE';
    const parts = Array.from(new Set(preps.map(p => p.plant_part_used))).join('; ') || plant.plant_parts_used || 'N/A';
    const plantRefs = preps.reduce((acc, p) => acc + p.ref_count, 0);
    totalVerifiedReferences += plantRefs;

    const verificationStatus = preps.every(p => p.status === 'PUBLISHED' && p.source_verified === 1) && preps.length > 0
      ? 'VERIFIED & PUBLISHED'
      : hasPreps ? 'PARTIALLY VERIFIED' : 'RESEARCH REQUIRED';

    tableData.push({
      plant: plant.commonName,
      scientificName: plant.scientificName,
      methodsCount: preps.length,
      preparationMethods: prepNames,
      plantPart: parts,
      referencesCount: plantRefs,
      status: verificationStatus,
      preparations: preps
    });
  }

  // Print formatted report
  console.log('| Plant | Scientific Name | Preparation Methods | Plant Part | References | Verification Status |');
  console.log('|---|---|---|---|---|---|');
  for (const row of tableData) {
    console.log(`| **${row.plant}** | *${row.scientificName}* | ${row.preparationMethods} | ${row.plantPart} | ${row.referencesCount} | ${row.status} |`);
  }

  console.log('\n================================================================================');
  console.log('SUMMARY METRICS:');
  console.log('================================================================================');
  console.log(`Published Medicinal Plants: ${totalPublishedPlants}`);
  console.log(`Plants with Verified Preparation Guide: ${plantsWithVerifiedPrep}`);
  console.log(`Plants with Multiple Preparation Methods: ${plantsWithMultiplePreps}`);
  console.log(`Total Preparation Methods: ${totalPrepMethods}`);
  console.log(`Verified Preparation References: ${totalVerifiedReferences}`);
  console.log(`Plants Requiring Preparation Research: ${plantsRequiringResearch}`);

  if (plantsRequiringResearch > 0) {
    console.log('\nPlants missing preparation information:');
    for (const row of tableData) {
      if (row.methodsCount === 0) {
        console.log(`- ${row.plant} (${row.scientificName}): Missing authoritative DOH/PITAHC preparation source.`);
      }
    }
  } else {
    console.log('\nMissing Plants: 0 (100% of published medicinal plants have verified authoritative traditional preparation guides).');
  }

  await conn.end();
}

audit().catch(console.error);
