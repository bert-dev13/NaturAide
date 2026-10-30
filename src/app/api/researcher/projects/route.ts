import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status")?.trim().toUpperCase() || "ALL";
    const q = searchParams.get("q")?.trim();
    const sort = searchParams.get("sort")?.trim() || "updatedAt";

    // Compute status tab counts for researcher
    const [countRows]: any = await pool.query(
      `
      SELECT
        COUNT(CASE WHEN status != 'ARCHIVED' THEN 1 END) as allCount,
        COUNT(CASE WHEN status IN ('IN_PROGRESS', 'DRAFT') AND status != 'ARCHIVED' THEN 1 END) as activeCount,
        COUNT(CASE WHEN status IN ('UNDER_REVIEW', 'READY_FOR_REVIEW') AND status != 'ARCHIVED' THEN 1 END) as reviewCount,
        COUNT(CASE WHEN status = 'REVISION_REQUIRED' AND status != 'ARCHIVED' THEN 1 END) as revisionCount,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completedCount,
        COUNT(CASE WHEN status = 'ARCHIVED' THEN 1 END) as archivedCount
      FROM research_projects
      WHERE researcherId = ?
      `,
      [session.id]
    );

    const counts = countRows[0] || {};
    const tabCounts = {
      ALL: Number(counts.allCount || 0),
      ACTIVE: Number(counts.activeCount || 0),
      UNDER_REVIEW: Number(counts.reviewCount || 0),
      REVISION_REQUIRED: Number(counts.revisionCount || 0),
      COMPLETED: Number(counts.completedCount || 0),
      ARCHIVED: Number(counts.archivedCount || 0),
    };

    let sql = `
      SELECT rp.id, rp.title, rp.shortDescription, rp.researchObjective, rp.researchQuestion,
             rp.areaOfInterest, rp.expectedOutcome, rp.status, rp.currentStage, rp.progressPercent,
             rp.plantId, rp.plantCustomName, rp.createdAt, rp.updatedAt,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
             p.scientificName as plantScientificName,
             p.category as plantCategory,
             COALESCE(p.local_image_path, p.imageUrl) as plantImageUrl,
             (SELECT COUNT(*) FROM review_feedback rf WHERE rf.projectId = rp.id) as feedbackCount,
             (SELECT COUNT(*) FROM research_project_stages rps WHERE rps.projectId = rp.id AND rps.status = 'COMPLETED') as completedStagesCount,
             (SELECT rs.versionTag FROM review_submissions rs WHERE rs.projectId = rp.id ORDER BY rs.id DESC LIMIT 1) as dossierVersion,
             (SELECT rd.decision FROM review_decisions rd WHERE rd.projectId = rp.id ORDER BY rd.id DESC LIMIT 1) as finalDecision,
             (SELECT rd.decidedAt FROM review_decisions rd WHERE rd.projectId = rp.id ORDER BY rd.id DESC LIMIT 1) as finalizedDate,
             (SELECT u.name FROM review_decisions rd LEFT JOIN users u ON rd.reviewerId = u.id WHERE rd.projectId = rp.id ORDER BY rd.id DESC LIMIT 1) as reviewerName
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.researcherId = ?
    `;
    const params: any[] = [session.id];

    if (rawStatus === "ACTIVE") {
      sql += ` AND rp.status IN ('IN_PROGRESS', 'DRAFT')`;
    } else if (rawStatus === "UNDER_REVIEW") {
      sql += ` AND rp.status IN ('UNDER_REVIEW', 'READY_FOR_REVIEW')`;
    } else if (rawStatus === "REVISION_REQUIRED" || rawStatus === "NEEDS_REVISION") {
      sql += ` AND rp.status = 'REVISION_REQUIRED'`;
    } else if (rawStatus === "COMPLETED") {
      sql += ` AND rp.status = 'COMPLETED'`;
    } else if (rawStatus === "ARCHIVED") {
      sql += ` AND rp.status = 'ARCHIVED'`;
    } else {
      sql += ` AND rp.status != 'ARCHIVED'`;
    }

    if (q) {
      sql += ` AND (rp.title LIKE ? OR rp.shortDescription LIKE ? OR p.commonName LIKE ? OR p.scientificName LIKE ?)`;
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    // Secondary sorting by user preference with automated test projects deprioritized on non-archived views
    const deprioritizeTests = rawStatus !== "ARCHIVED" ? "CASE WHEN rp.title LIKE 'Automated Verification Project%' THEN 1 ELSE 0 END ASC, " : "";

    if (sort === "title") {
      sql += ` ORDER BY ${deprioritizeTests}rp.title ASC`;
    } else if (sort === "progress") {
      sql += ` ORDER BY ${deprioritizeTests}rp.progressPercent DESC`;
    } else {
      sql += ` ORDER BY ${deprioritizeTests}rp.updatedAt DESC`;
    }

    const [projects]: any = await pool.query(sql, params);

    return NextResponse.json({ success: true, projects, tabCounts });
  } catch (error) {
    console.error("Error fetching researcher projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      shortDescription,
      researchObjective,
      plantId,
      plantCustomName,
      researchQuestion,
      areaOfInterest,
      expectedOutcome,
      plannedScope,
      isDraft,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Research Title is required" }, { status: 400 });
    }

    const status = isDraft ? "DRAFT" : "IN_PROGRESS";
    const initialProgress = 0; // Starts at 0 / 6 stages completed

    // Format planned scope if provided as an array
    const scopeString = Array.isArray(plannedScope) && plannedScope.length > 0
      ? plannedScope.join(", ")
      : areaOfInterest?.trim() || "Comprehensive Botanical Evidence Dossier";

    const [insertResult]: any = await pool.query(
      `
      INSERT INTO research_projects (
        researcherId, plantId, plantCustomName, title, shortDescription, researchObjective,
        researchQuestion, areaOfInterest, expectedOutcome, status, currentStage, progressPercent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'plant-literature', ?)
      `,
      [
        session.id,
        plantId || null,
        plantCustomName || null,
        title.trim(),
        shortDescription?.trim() || null,
        researchObjective?.trim() || null,
        researchQuestion?.trim() || null,
        scopeString,
        expectedOutcome?.trim() || "Scientific monograph & empirical validation benchmarks",
        status,
        initialProgress,
      ]
    );

    const projectId = insertResult.insertId;

    // Initialize all 6 stages in research_project_stages
    const stages = [
      "plant-literature",
      "in-silico",
      "docking",
      "formulation-safety",
      "completion-integration",
      "expert-review",
    ];

    for (const stageKey of stages) {
      await pool.query(
        `INSERT INTO research_project_stages (projectId, stageKey, status) VALUES (?, ?, ?)`,
        [projectId, stageKey, stageKey === "plant-literature" && !isDraft ? "IN_PROGRESS" : "NOT_STARTED"]
      );
    }

    // Initialize evidence review entry
    await pool.query(
      `
      INSERT INTO research_evidence_reviews (projectId, background, initialQuestion, objectives, status)
      VALUES (?, ?, ?, ?, 'IN_PROGRESS')
      `,
      [projectId, shortDescription || null, researchQuestion || null, researchObjective || null]
    );

    // Initialize plant research entry if plant selected
    if (plantId) {
      const [plantRows]: any = await pool.query("SELECT commonName, scientificName FROM plants WHERE id = ?", [plantId]);
      if (plantRows.length > 0) {
        await pool.query(
          `
          INSERT INTO research_plant_data (projectId, commonName, scientificName)
          VALUES (?, ?, ?)
          `,
          [projectId, plantRows[0].commonName, plantRows[0].scientificName]
        );
      }
    } else if (plantCustomName) {
      await pool.query(
        `
        INSERT INTO research_plant_data (projectId, commonName)
        VALUES (?, ?)
        `,
        [projectId, plantCustomName]
      );
    }

    // Activity log
    await pool.query(
      `
      INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
      VALUES (?, ?, 'PROJECT_CREATED', ?)
      `,
      [projectId, session.id, `Created research project: "${title.trim()}"`]
    );

    return NextResponse.json({
      success: true,
      projectId,
      message: isDraft ? "Project saved as draft." : "Research project initiated.",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create research project" }, { status: 500 });
  }
}
