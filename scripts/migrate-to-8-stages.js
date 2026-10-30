const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((l) => {
    const t = l.trim();
    if (t && !t.startsWith('#')) {
      const idx = t.indexOf('=');
      if (idx !== -1) {
        process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
      }
    }
  });
}

const CANONICAL_8_STAGES = [
  { key: 'evidence-review', num: 1, name: 'Evidence Review' },
  { key: 'plant-literature', num: 2, name: 'Plant & Literature Research' },
  { key: 'in-silico', num: 3, name: 'In-Silico Analysis' },
  { key: 'docking', num: 4, name: 'Molecular Docking' },
  { key: 'formulation-safety', num: 5, name: 'Formulation & Safety' },
  { key: 'expert-review', num: 6, name: 'Expert Review' },
  { key: 'laboratory', num: 7, name: 'Laboratory Validation' },
  { key: 'completion-integration', num: 8, name: 'Research Completion & Integration' },
];

function mapCurrentStageTo8(currentStage) {
  if (!currentStage) return 'evidence-review';
  const clean = String(currentStage).toLowerCase().trim();
  switch (clean) {
    case '1':
    case 'evidence':
    case 'evidence-review':
      return 'evidence-review';

    case '2':
    case '3':
    case 'plant':
    case 'plant-research':
    case 'literature':
    case 'plant-literature':
      return 'plant-literature';

    case '4':
    case 'in-silico':
    case 'insilico':
      return 'in-silico';

    case '5':
    case 'docking':
    case 'molecular-docking':
      return 'docking';

    case '6':
    case '7':
    case 'formulation':
    case 'safety':
    case 'safety-assessment':
    case 'formulation-safety':
      return 'formulation-safety';

    case '8':
    case '9':
    case 'review':
    case 'revisions':
    case 'expert-review':
    case 'professional-review':
      return 'expert-review';

    case '10':
    case 'laboratory':
    case 'lab':
      return 'laboratory';

    case '11':
    case '12':
    case 'completion':
    case 'knowledge-integration':
    case 'completion-integration':
      return 'completion-integration';

    default:
      return 'evidence-review';
  }
}

async function migrate() {
  console.log('--- NatureAide 8-Stage Research Journey Migration ---');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'natureaide_db',
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();

  try {
    // 1. Ensure research_project_stages status column accommodates all status strings
    console.log('1. Checking research_project_stages column definition...');
    await conn.query(`
      ALTER TABLE research_project_stages 
      MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED'
    `);
    console.log('   Column status is VARCHAR(50).');

    // 2. Query all existing research projects
    console.log('2. Querying all research projects...');
    const [projects] = await conn.query('SELECT id, title, status, currentStage, progressPercent FROM research_projects');
    console.log(`   Found ${projects.length} project(s) to migrate.`);

    for (const proj of projects) {
      console.log(`\nMigrating Project ID ${proj.id}: "${proj.title}"`);
      const [existingStages] = await conn.query(
        'SELECT stageKey, status, completedAt FROM research_project_stages WHERE projectId = ?',
        [proj.id]
      );

      const stageMap = {};
      const completedMap = {};
      for (const s of existingStages) {
        stageMap[s.stageKey] = s.status;
        completedMap[s.stageKey] = s.completedAt;
      }

      // Compute status for the 8 canonical stages
      const newStageRecords = [];

      // Stage 1: Evidence Review
      newStageRecords.push({
        key: 'evidence-review',
        status: stageMap['evidence-review'] || 'NOT_STARTED',
        completedAt: completedMap['evidence-review'] || null,
      });

      // Stage 2: Plant & Literature Research
      let stage2Status = 'NOT_STARTED';
      let stage2CompletedAt = null;
      if (stageMap['plant-research'] === 'COMPLETED' || stageMap['literature'] === 'COMPLETED' || stageMap['plant-literature'] === 'COMPLETED') {
        stage2Status = 'COMPLETED';
        stage2CompletedAt = completedMap['plant-literature'] || completedMap['literature'] || completedMap['plant-research'] || new Date();
      } else if (stageMap['plant-research'] === 'IN_PROGRESS' || stageMap['literature'] === 'IN_PROGRESS' || stageMap['plant-literature'] === 'IN_PROGRESS') {
        stage2Status = 'IN_PROGRESS';
      }
      newStageRecords.push({
        key: 'plant-literature',
        status: stage2Status,
        completedAt: stage2CompletedAt,
      });

      // Stage 3: In-Silico Analysis
      newStageRecords.push({
        key: 'in-silico',
        status: stageMap['in-silico'] || 'NOT_STARTED',
        completedAt: completedMap['in-silico'] || null,
      });

      // Stage 4: Molecular Docking
      newStageRecords.push({
        key: 'docking',
        status: stageMap['docking'] || 'NOT_STARTED',
        completedAt: completedMap['docking'] || null,
      });

      // Stage 5: Formulation & Safety
      let stage5Status = 'NOT_STARTED';
      let stage5CompletedAt = null;
      if (stageMap['formulation'] === 'COMPLETED' || stageMap['safety'] === 'COMPLETED' || stageMap['formulation-safety'] === 'COMPLETED') {
        stage5Status = 'COMPLETED';
        stage5CompletedAt = completedMap['formulation-safety'] || completedMap['safety'] || completedMap['formulation'] || new Date();
      } else if (stageMap['formulation'] === 'IN_PROGRESS' || stageMap['safety'] === 'IN_PROGRESS' || stageMap['formulation-safety'] === 'IN_PROGRESS') {
        stage5Status = 'IN_PROGRESS';
      }
      newStageRecords.push({
        key: 'formulation-safety',
        status: stage5Status,
        completedAt: stage5CompletedAt,
      });

      // Stage 6: Expert Review
      let stage6Status = 'NOT_STARTED';
      let stage6CompletedAt = null;
      if (stageMap['review'] === 'COMPLETED' || stageMap['revisions'] === 'COMPLETED' || stageMap['expert-review'] === 'COMPLETED') {
        stage6Status = 'COMPLETED';
        stage6CompletedAt = completedMap['expert-review'] || completedMap['revisions'] || completedMap['review'] || new Date();
      } else if (stageMap['revisions'] === 'IN_PROGRESS' || stageMap['review'] === 'REVISION_REQUESTED') {
        stage6Status = 'REQUIRES_REVISION';
      } else if (stageMap['review'] === 'UNDER_REVIEW') {
        stage6Status = 'UNDER_REVIEW';
      } else if (stageMap['review'] === 'IN_PROGRESS' || stageMap['expert-review'] === 'IN_PROGRESS') {
        stage6Status = 'IN_PROGRESS';
      }
      newStageRecords.push({
        key: 'expert-review',
        status: stage6Status,
        completedAt: stage6CompletedAt,
      });

      // Stage 7: Laboratory Validation
      newStageRecords.push({
        key: 'laboratory',
        status: stageMap['laboratory'] || 'NOT_STARTED',
        completedAt: completedMap['laboratory'] || null,
      });

      // Stage 8: Research Completion & Integration
      let stage8Status = 'NOT_STARTED';
      let stage8CompletedAt = null;
      if (stageMap['completion'] === 'COMPLETED' || stageMap['knowledge-integration'] === 'COMPLETED' || stageMap['completion-integration'] === 'COMPLETED') {
        stage8Status = 'COMPLETED';
        stage8CompletedAt = completedMap['completion-integration'] || completedMap['knowledge-integration'] || completedMap['completion'] || new Date();
      } else if (stageMap['completion'] === 'IN_PROGRESS' || stageMap['knowledge-integration'] === 'IN_PROGRESS' || stageMap['completion-integration'] === 'IN_PROGRESS') {
        stage8Status = 'IN_PROGRESS';
      }
      newStageRecords.push({
        key: 'completion-integration',
        status: stage8Status,
        completedAt: stage8CompletedAt,
      });

      // Upsert into research_project_stages
      for (const rec of newStageRecords) {
        await conn.query(
          `
          INSERT INTO research_project_stages (projectId, stageKey, status, completedAt, updatedAt)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3))
          ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            completedAt = COALESCE(VALUES(completedAt), completedAt),
            updatedAt = CURRENT_TIMESTAMP(3)
        `,
          [proj.id, rec.key, rec.status, rec.completedAt]
        );
      }

      // Map current stage & progress
      const newCurrentStage = mapCurrentStageTo8(proj.currentStage);
      const completedCount = newStageRecords.filter((s) => s.status === 'COMPLETED').length;
      let newProgressPercent = Math.round((completedCount / 8) * 100);
      if (proj.status === 'COMPLETED' || completedCount === 8) {
        newProgressPercent = 100;
      }

      console.log(`   Old currentStage: ${proj.currentStage} -> New: ${newCurrentStage}`);
      console.log(`   Completed 8-stages: ${completedCount}/8 -> progress: ${newProgressPercent}%`);

      await conn.query(
        `
        UPDATE research_projects
        SET currentStage = ?, progressPercent = ?
        WHERE id = ?
      `,
        [newCurrentStage, newProgressPercent, proj.id]
      );
    }

    console.log('\nMigration completed successfully for all projects!');
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
