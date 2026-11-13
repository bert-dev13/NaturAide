import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calculateV2ProjectProgress } from "@/lib/v2-progress-service";

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
             (SELECT COUNT(*) FROM review_feedback rf WHERE rf.projectId = rp.id AND rf.status IN ('OPEN', 'IN_REVIEW')) as openFeedbackCount,
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

    const [rawProjects]: any = await pool.query(sql, params);

    const projectIds = (rawProjects || []).map((p: any) => Number(p.id));
    const latestSubByProj = new Map<number, number>();
    const approvedBySub = new Map<number, number>();
    const revBySub = new Map<number, number>();

    if (projectIds.length > 0) {
      try {
        const [subRows]: any = await pool.query(
          `SELECT id, projectId FROM review_submissions WHERE projectId IN (?) ORDER BY reviewRound DESC, id DESC`,
          [projectIds]
        );
        for (const sr of subRows || []) {
          const pid = Number(sr.projectId);
          if (!latestSubByProj.has(pid)) {
            latestSubByProj.set(pid, Number(sr.id));
          }
        }
        const subIds = Array.from(latestSubByProj.values());
        if (subIds.length > 0) {
          const [covRows]: any = await pool.query(
            `SELECT submissionId, status FROM review_area_coverage WHERE submissionId IN (?)`,
            [subIds]
          );
          for (const cr of covRows || []) {
            const sid = Number(cr.submissionId);
            const cst = String(cr.status || "").toUpperCase();
            if (cst === "APPROVED" || cst === "COMPLETED") {
              approvedBySub.set(sid, (approvedBySub.get(sid) || 0) + 1);
            } else if (cst === "REVISION_REQUIRED" || cst === "REVISION_REQUESTED") {
              revBySub.set(sid, (revBySub.get(sid) || 0) + 1);
            }
          }
        }
      } catch {
        // Non-fatal
      }
    }

    // Resolve V2 section completion status in parallel for sequential stage progression
    const v2ProgressList = await Promise.all(
      projectIds.map((pid: number) => calculateV2ProjectProgress(pid).catch(() => null))
    );
    const v2ProgressByPid = new Map<number, any>();
    projectIds.forEach((pid: number, idx: number) => {
      if (v2ProgressList[idx]) v2ProgressByPid.set(pid, v2ProgressList[idx]);
    });

    const projects = (rawProjects || []).map((p: any) => {
      const pid = Number(p.id);
      const st = String(p.status || "IN_PROGRESS").toUpperCase();
      const latestSid = latestSubByProj.get(pid);
      const hasSub = Boolean(latestSid);
      const approvedCount = latestSid ? approvedBySub.get(latestSid) || 0 : 0;
      const revCount = latestSid ? revBySub.get(latestSid) || 0 : 0;

      const v2Prog = v2ProgressByPid.get(pid);
      const isSec1Done = v2Prog ? v2Prog.section1.status === "COMPLETED" : false;
      const isSec2Done = v2Prog ? v2Prog.section2.status === "COMPLETED" : false;
      const isSec3Done = v2Prog ? v2Prog.section3.status === "COMPLETED" : false;

      // Sequential progression: Section 1 -> Section 2 -> Section 3 -> Section 4
      let continueRoute = `/researcher/projects/${pid}/formulation-rd`;
      let currentSectionNum = 1;
      let currentSectionTitle = "1. Formulation R&D";
      let resolvedCurrentStage = "plant-literature";

      if (st === "COMPLETED") {
        continueRoute = `/researcher/projects/${pid}/completion`;
        currentSectionNum = 4;
        currentSectionTitle = "Completed Research";
        resolvedCurrentStage = "completion";
      } else if (!isSec1Done) {
        continueRoute = `/researcher/projects/${pid}/formulation-rd`;
        currentSectionNum = 1;
        currentSectionTitle = "1. Formulation R&D";
        resolvedCurrentStage = "plant-literature";
      } else if (!isSec2Done) {
        continueRoute = `/researcher/projects/${pid}/in-silico`;
        currentSectionNum = 2;
        currentSectionTitle = "2. In-Silico Analysis";
        resolvedCurrentStage = "in-silico";
      } else if (!isSec3Done) {
        continueRoute = `/researcher/projects/${pid}/submission`;
        currentSectionNum = 3;
        currentSectionTitle = "3. Paper Submission";
        resolvedCurrentStage = "submission";
      } else {
        continueRoute = `/researcher/projects/${pid}/completion`;
        currentSectionNum = 4;
        currentSectionTitle = "4. Professional Approval";
        resolvedCurrentStage = "completion";
      }

      let statusLabel = "In Progress";
      if (st === "COMPLETED") {
        statusLabel = "Completed";
      } else if (st === "REVISION_REQUIRED" || st === "REVISION_REQUESTED" || revCount > 0) {
        statusLabel = "Revisions Required";
      } else if (st === "APPROVED" || (hasSub && approvedCount >= 3 && revCount === 0)) {
        statusLabel = "Fully Approved — Ready to Complete";
      } else if (st === "UNDER_REVIEW" || st === "READY_FOR_REVIEW" || hasSub) {
        statusLabel = `Under Professional Review — ${approvedCount}/3 Approved`;
      } else if (st === "DRAFT") {
        statusLabel = "Draft";
      }

      const completedStagesCount =
        (isSec1Done ? 1 : 0) +
        (isSec2Done ? 1 : 0) +
        (isSec3Done ? 1 : 0) +
        (st === "COMPLETED" ? 1 : 0);

      const computedProgress = v2Prog ? v2Prog.overallProgressPercent : Number(p.progressPercent || 0);

      return {
        ...p,
        currentStage: resolvedCurrentStage,
        continueRoute,
        currentSectionNum,
        currentSectionTitle,
        progressPercent: computedProgress,
        completedStagesCount,
        approvedSpecialtiesCount: approvedCount,
        statusLabel,
      };
    });

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

    const hasCatalogPlant = typeof plantId === "string" && plantId.trim().length > 0;
    const hasCustomPlant =
      typeof plantCustomName === "string" && plantCustomName.trim().length > 0;
    if (!hasCatalogPlant && !hasCustomPlant) {
      return NextResponse.json(
        { error: "A medicinal plant or custom specimen is required" },
        { status: 400 }
      );
    }

    const status = isDraft ? "DRAFT" : "IN_PROGRESS";
    const initialProgress = 0; // Starts at 0 / 6 stages completed

    // Optional context fields may be omitted at creation (collected later in the workflow).
    // Preserve explicit values when clients still send them; do not invent placeholders.
    const scopeString =
      Array.isArray(plannedScope) && plannedScope.length > 0
        ? plannedScope.join(", ")
        : areaOfInterest?.trim() || null;

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
        expectedOutcome?.trim() || null,
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
