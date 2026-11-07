import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeReviewAreaKey, expertReviewAreaLabel } from "@/lib/expert-review-areas";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get("projectId");
    const filterProjectId = projectIdParam ? parseInt(projectIdParam, 10) : null;

    let query = `
      SELECT
        rf.id as findingId,
        rf.projectId,
        rf.submissionId,
        rf.reviewRound,
        rf.sectionName,
        rf.comment as originalFinding,
        rf.recommendation as requiredAction,
        rf.title as findingTitle,
        rf.severity,
        rf.status as findingStatus,
        rf.researcherReply as researcherResponse,
        rf.researcherRepliedAt,
        rf.resolvedAt,
        rf.areaKey,
        rf.affectedStage,
        rp.title as projectTitle,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        u.name as researcherName,
        COALESCE(rs.versionTag, 'v1.0') as versionTag
      FROM review_feedback rf
      JOIN research_projects rp ON rf.projectId = rp.id
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN plants p ON rp.plantId = p.id
      LEFT JOIN review_submissions rs ON rf.submissionId = rs.id
      WHERE (
        rf.reviewerId = ? 
        OR rf.reviewerId IS NULL 
        OR EXISTS (
          SELECT 1 FROM review_assignments ra 
          WHERE ra.projectId = rf.projectId AND ra.reviewerId = ?
        )
      )
    `;

    const queryParams: any[] = [session.id, session.id];

    if (filterProjectId && !isNaN(filterProjectId)) {
      query += ` AND rf.projectId = ?`;
      queryParams.push(filterProjectId);
    }

    query += `
      GROUP BY rf.id
      ORDER BY
        CASE rf.status
          WHEN 'ADDRESSED' THEN 1
          WHEN 'OPEN' THEN 2
          ELSE 3
        END ASC,
        rf.updatedAt DESC
    `;

    const [findings]: any = await pool.query(query, queryParams);

    const seenFindingIds = new Set<number>();
    const uniqueFindings = (findings || []).filter((f: any) => {
      if (seenFindingIds.has(f.findingId)) return false;
      seenFindingIds.add(f.findingId);
      return true;
    });

    // Compute step number and direct URL for each finding
    const formatted = uniqueFindings.map((f: any) => {
      const area = normalizeReviewAreaKey(f.areaKey || "pharmacognosy");
      const sectionLower = (f.sectionName || "").toLowerCase();
      const titleLower = (f.findingTitle || "").toLowerCase();

      // Extract step number (1..8)
      let stepNum = 1;
      const stepMatch = (f.sectionName || "").match(/step\s*(\d+)/i) || (f.findingTitle || "").match(/step\s*(\d+)/i);
      if (stepMatch && stepMatch[1]) {
        stepNum = parseInt(stepMatch[1], 10);
      }

      let targetUrl = `/reviewer/projects/${f.projectId}`;
      if (
        sectionLower.includes("section 1") ||
        sectionLower.includes("formulation") ||
        sectionLower.includes("pharmacognosy") ||
        area === "formulation"
      ) {
        targetUrl = `/reviewer/projects/${f.projectId}/formulation-rd?step=${stepNum}&revId=${f.findingId}`;
      } else if (
        sectionLower.includes("section 2") ||
        sectionLower.includes("in-silico") ||
        sectionLower.includes("docking") ||
        sectionLower.includes("bioinformatics") ||
        area === "bioinformatics"
      ) {
        targetUrl = `/reviewer/projects/${f.projectId}/in-silico?step=${stepNum}&revId=${f.findingId}`;
      } else if (
        sectionLower.includes("section 3") ||
        sectionLower.includes("submission") ||
        sectionLower.includes("paper") ||
        area === "pharmacology"
      ) {
        targetUrl = `/reviewer/projects/${f.projectId}/submission?step=${Math.min(3, stepNum)}&revId=${f.findingId}`;
      }

      return {
        ...f,
        areaKey: area,
        areaLabel: expertReviewAreaLabel(area),
        stepNumber: stepNum,
        targetUrl,
      };
    });

    // Also fetch list of projects that have findings for the project switcher
    const [projectRows]: any = await pool.query(`
      SELECT DISTINCT 
        rp.id,
        rp.title,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        u.name as researcherName,
        (SELECT COUNT(*) FROM review_feedback rf2 WHERE rf2.projectId = rp.id AND rf2.status = 'ADDRESSED') as addressedCount,
        (SELECT COUNT(*) FROM review_feedback rf2 WHERE rf2.projectId = rp.id AND rf2.status = 'OPEN') as openCount,
        (SELECT COUNT(*) FROM review_feedback rf2 WHERE rf2.projectId = rp.id AND rf2.status = 'RESOLVED') as resolvedCount
      FROM research_projects rp
      JOIN review_feedback rf ON rp.id = rf.projectId
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN plants p ON rp.plantId = p.id
      ORDER BY addressedCount DESC, rp.updatedAt DESC
    `);

    return NextResponse.json({
      success: true,
      revisions: formatted,
      projects: projectRows || [],
    });
  } catch (error) {
    console.error("GET /api/reviewer/revisions error:", error);
    return NextResponse.json({ error: "Failed to load revisions" }, { status: 500 });
  }
}
