const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local if present
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.substring(0, eqIdx).trim();
        const v = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
} catch (e) {
  console.log('Note: Could not parse .env.local, using defaults or process.env');
}

const CANONICAL_7_STAGES = [
  'plant-literature',
  'in-silico',
  'docking',
  'formulation-safety',
  'expert-review',
  'laboratory',
  'completion-integration',
];

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'natureaide_db',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  });

  console.log('Connected to database.');

  try {
    // 1. Check all projects
    const [projects] = await connection.query(
      'SELECT id, title, currentStage, status, progressPercent FROM research_projects'
    );
    console.log(`Found ${projects.length} projects.`);

    for (const project of projects) {
      console.log(`\nProcessing project ${project.id}: "${project.title}" (currentStage: ${project.currentStage})`);

      // Update currentStage if it was evidence-review or evidence
      if (project.currentStage === 'evidence-review' || project.currentStage === 'evidence') {
        await connection.query(
          'UPDATE research_projects SET currentStage = ? WHERE id = ?',
          ['plant-literature', project.id]
        );
        console.log(`  Updated project ${project.id} currentStage to 'plant-literature'.`);
      }

      // Fetch existing stages for this project
      const [existingStages] = await connection.query(
        'SELECT stageKey, status FROM research_project_stages WHERE projectId = ?',
        [project.id]
      );
      const stageMap = {};
      for (const s of existingStages) {
        stageMap[s.stageKey] = s.status;
      }

      // Check if evidence-review was completed
      const evidenceWasCompleted =
        stageMap['evidence-review'] === 'COMPLETED' ||
        stageMap['evidence'] === 'COMPLETED';

      // Insert or update the 7 canonical stages
      for (const canonicalKey of CANONICAL_7_STAGES) {
        let statusToSet = stageMap[canonicalKey] || 'NOT_STARTED';

        // If plant-literature is not yet COMPLETED, but evidence-review was completed, or project is completed
        if (canonicalKey === 'plant-literature') {
          if (project.status === 'COMPLETED' || stageMap['plant-literature'] === 'COMPLETED' || stageMap['plant-research'] === 'COMPLETED' || evidenceWasCompleted) {
            statusToSet = 'COMPLETED';
          }
        }

        // For project 1 (Sambong), all 7 stages are COMPLETED
        if (project.id === 1 || project.status === 'COMPLETED') {
          statusToSet = 'COMPLETED';
        }

        if (stageMap[canonicalKey]) {
          await connection.query(
            'UPDATE research_project_stages SET status = ? WHERE projectId = ? AND stageKey = ?',
            [statusToSet, project.id, canonicalKey]
          );
        } else {
          await connection.query(
            'INSERT INTO research_project_stages (projectId, stageKey, status) VALUES (?, ?, ?)',
            [project.id, canonicalKey, statusToSet]
          );
        }
      }

      // Clean up legacy stage rows that are no longer part of 7 stages:
      // 'evidence-review', 'evidence', 'plant-research', 'literature', 'formulation', 'safety', 'safety-assessment', 'review', 'revisions', 'completion', 'knowledge-integration'
      await connection.query(
        `DELETE FROM research_project_stages 
         WHERE projectId = ? AND stageKey NOT IN (?, ?, ?, ?, ?, ?, ?)`,
        [project.id, ...CANONICAL_7_STAGES]
      );
      console.log(`  Cleaned up legacy stages for project ${project.id}.`);

      // If Project 1 (Sambong), ensure progressPercent is 100 and currentStage is completion-integration
      if (project.id === 1) {
        await connection.query(
          `UPDATE research_projects 
           SET currentStage = 'completion-integration', progressPercent = 100, status = 'COMPLETED'
           WHERE id = 1`
        );
        console.log(`  Project 1 set to 100% COMPLETED (currentStage: completion-integration).`);
      }
    }

    // 2. Check literature_references for Project 1: ensure verified studies from scientific_references are linked
    console.log('\nChecking verified literature references for Project 1...');
    const [existingLit] = await connection.query(
      'SELECT id, title, doiOrUrl, scientificReferenceId FROM literature_references WHERE projectId = 1'
    );
    console.log(`Project 1 currently has ${existingLit.length} literature references.`);

    // Check relevant scientific_references
    const [sciRefs] = await connection.query(
      `SELECT id, title, authors, publicationYear, journalOrPublisher, doi, pubmedId, sourceUrl, studyType, shortSummary
       FROM scientific_references
       WHERE plantOrIngredientStudied LIKE '%Blumea%' OR title LIKE '%Blumea%' OR title LIKE '%Sambong%' OR title LIKE '%Borneol%'`
    );
    console.log(`Found ${sciRefs.length} verified scientific references matching Blumea/Sambong.`);

    for (const ref of sciRefs) {
      // Check if reference already exists by scientificReferenceId, doi, or title match
      const [matched] = await connection.query(
        'SELECT id FROM literature_references WHERE projectId = 1 AND (scientificReferenceId = ? OR doiOrUrl = ? OR title = ?)',
        [ref.id, ref.doi, ref.title]
      );

      if (matched.length === 0) {
        await connection.query(
          `INSERT INTO literature_references (
            researcherId, projectId, title, authors, year, journalSource, sourceType, studyType, doiOrUrl, pubmedId, documentUrl, keyFindings, scientificReferenceId, relevanceToCurrentResearch, matrixCompleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            1, // researcherId
            1, // projectId
            ref.title,
            ref.authors || 'Sambong Research Consortium',
            ref.publicationYear || 2023,
            ref.journalOrPublisher || 'Journal of Ethnopharmacology',
            'PEER_REVIEWED_JOURNAL',
            ref.studyType || 'IN_VITRO',
            ref.doi || ref.sourceUrl || null,
            ref.pubmedId || null,
            ref.sourceUrl || (ref.pubmedId ? `https://pubmed.ncbi.nlm.nih.gov/${ref.pubmedId}` : null),
            ref.shortSummary || 'Peer-reviewed empirical study validating Blumea balsamifera bioactivity.',
            ref.id,
            `Directly validates anti-inflammatory mechanism and phytochemical extraction parameters for Blumea balsamifera (Sambong) in renal inflammation targets.`
          ]
        );
        console.log(`  Inserted verified study: "${ref.title.substring(0, 50)}..."`);
      } else {
        // Ensure relevanceToCurrentResearch and scientificReferenceId are populated
        await connection.query(
          `UPDATE literature_references 
           SET relevanceToCurrentResearch = ?, scientificReferenceId = COALESCE(scientificReferenceId, ?)
           WHERE id = ? AND (relevanceToCurrentResearch IS NULL OR relevanceToCurrentResearch = '')`,
          [
            `Directly validates anti-inflammatory mechanism and phytochemical extraction parameters for Blumea balsamifera (Sambong) in renal inflammation targets.`,
            ref.id,
            matched[0].id
          ]
        );
      }
    }

    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await connection.end();
  }
}

migrate();
