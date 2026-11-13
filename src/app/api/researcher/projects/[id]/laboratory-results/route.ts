import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { ensureV2ResearchSchema } from "@/lib/v2-research-schema";
import { LAB_TEST_CATEGORIES } from "@/lib/laboratory-results-catalog";
import { calculateV2ProjectProgress } from "@/lib/v2-progress-service";

async function refreshProjectProgress(projectId: number) {
  const progress = await calculateV2ProjectProgress(projectId);
  try {
    await pool.query("UPDATE research_projects SET progressPercent = ? WHERE id = ?", [
      progress.overallProgressPercent,
      projectId,
    ]);
  } catch {
    // Non-fatal if progress column update fails
  }
  return progress;
}

async function assertResearcherOwnsProject(projectId: number, researcherId: number) {
  const [rows]: any = await pool.query(
    "SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
    [projectId, researcherId]
  );
  return rows.length > 0;
}

async function assertReviewerCanAccessProject(projectId: number, reviewerId: number) {
  const [proj]: any = await pool.query(
    "SELECT id FROM research_projects WHERE id = ? LIMIT 1",
    [projectId]
  );
  if (!proj.length) return false;

  try {
    const [assigned]: any = await pool.query(
      `SELECT id FROM review_assignments
       WHERE projectId = ? AND reviewerId = ?
       LIMIT 1`,
      [projectId, reviewerId]
    );
    if (assigned.length > 0) return true;
  } catch {
    // table may not exist
  }

  try {
    const [coverage]: any = await pool.query(
      `SELECT id FROM review_section_coverage
       WHERE projectId = ? AND reviewerId = ?
       LIMIT 1`,
      [projectId, reviewerId]
    );
    if (coverage.length > 0) return true;
  } catch {
    // table may not exist
  }

  try {
    const [specialty]: any = await pool.query(
      `SELECT id FROM review_specialty_assignments
       WHERE projectId = ? AND reviewerId = ?
       LIMIT 1`,
      [projectId, reviewerId]
    );
    if (specialty.length > 0) return true;
  } catch {
    // table may not exist
  }

  return false;
}

function isValidCategory(key: string) {
  return LAB_TEST_CATEGORIES.some((c) => c.key === key);
}

// GET /api/researcher/projects/[id]/laboratory-results
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureV2ResearchSchema();
    const session = await getSession();
    if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    if (session.role === "RESEARCHER") {
      const ok = await assertResearcherOwnsProject(projectId, session.id);
      if (!ok) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    } else {
      const ok = await assertReviewerCanAccessProject(projectId, session.id);
      if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [rows]: any = await pool.query(
      `SELECT id, projectId, createdByUserId, testCategory, testName, resultValue, unit,
              dateConducted, remarks, reportFileUrl, reportFileName, createdAt, updatedAt
       FROM research_laboratory_results
       WHERE projectId = ?
       ORDER BY dateConducted DESC, id DESC`,
      [projectId]
    );

    const labCount = Array.isArray(rows) ? rows.length : 0;
    return NextResponse.json({
      success: true,
      results: rows,
      laboratoryResults: {
        count: labCount,
        progressPercent: labCount > 0 ? 100 : 0,
        status: labCount > 0 ? "COMPLETED" : "NOT_STARTED",
      },
    });
  } catch (error: any) {
    console.error("laboratory-results GET:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load laboratory results" },
      { status: 500 }
    );
  }
}

// POST create or update
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureV2ResearchSchema();
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const ok = await assertResearcherOwnsProject(projectId, session.id);
    if (!ok) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json();
    const {
      id: resultId = null,
      testCategory,
      testName,
      resultValue,
      unit = null,
      dateConducted = null,
      remarks = null,
      reportFileUrl = null,
      reportFileName = null,
    } = body;

    if (!testCategory || !isValidCategory(String(testCategory))) {
      return NextResponse.json({ error: "Valid test category is required" }, { status: 400 });
    }
    if (!testName || !String(testName).trim()) {
      return NextResponse.json({ error: "Laboratory test name is required" }, { status: 400 });
    }
    if (resultValue === null || resultValue === undefined || !String(resultValue).trim()) {
      return NextResponse.json({ error: "Result is required" }, { status: 400 });
    }

    const trimmedName = String(testName).trim();
    const trimmedResult = String(resultValue).trim();
    const trimmedUnit =
      unit === null || unit === undefined || String(unit).trim() === ""
        ? null
        : String(unit).trim();
    const trimmedRemarks =
      remarks === null || remarks === undefined || String(remarks).trim() === ""
        ? null
        : String(remarks).trim();
    const dateVal =
      dateConducted && String(dateConducted).trim()
        ? String(dateConducted).slice(0, 10)
        : null;
    const trimmedReportUrl =
      reportFileUrl === null || reportFileUrl === undefined || String(reportFileUrl).trim() === ""
        ? null
        : String(reportFileUrl).trim().slice(0, 500);
    const trimmedReportName =
      reportFileName === null || reportFileName === undefined || String(reportFileName).trim() === ""
        ? null
        : String(reportFileName).trim().slice(0, 255);

    if (resultId) {
      const [existing]: any = await pool.query(
        "SELECT id FROM research_laboratory_results WHERE id = ? AND projectId = ? LIMIT 1",
        [resultId, projectId]
      );
      if (!existing.length) {
        return NextResponse.json({ error: "Result not found" }, { status: 404 });
      }

      await pool.query(
        `UPDATE research_laboratory_results
         SET testCategory = ?, testName = ?, resultValue = ?, unit = ?,
             dateConducted = ?, remarks = ?, reportFileUrl = ?, reportFileName = ?,
             updatedAt = CURRENT_TIMESTAMP(3)
         WHERE id = ? AND projectId = ?`,
        [
          testCategory,
          trimmedName,
          trimmedResult,
          trimmedUnit,
          dateVal,
          trimmedRemarks,
          trimmedReportUrl,
          trimmedReportName,
          resultId,
          projectId,
        ]
      );
      const progress = await refreshProjectProgress(projectId);
      return NextResponse.json({
        success: true,
        id: resultId,
        message: "Laboratory result updated",
        progress,
        laboratoryResults: progress.laboratoryResults,
      });
    }

    const [insert]: any = await pool.query(
      `INSERT INTO research_laboratory_results
        (projectId, createdByUserId, testCategory, testName, resultValue, unit, dateConducted, remarks, reportFileUrl, reportFileName)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        session.id,
        testCategory,
        trimmedName,
        trimmedResult,
        trimmedUnit,
        dateVal,
        trimmedRemarks,
        trimmedReportUrl,
        trimmedReportName,
      ]
    );

    const progress = await refreshProjectProgress(projectId);
    return NextResponse.json({
      success: true,
      id: insert.insertId,
      message: "Laboratory result saved",
      progress,
      laboratoryResults: progress.laboratoryResults,
    });
  } catch (error: any) {
    console.error("laboratory-results POST:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save laboratory result" },
      { status: 500 }
    );
  }
}

// DELETE ?resultId=
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureV2ResearchSchema();
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    const resultId = parseInt(new URL(req.url).searchParams.get("resultId") || "", 10);
    if (isNaN(projectId) || isNaN(resultId)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const ok = await assertResearcherOwnsProject(projectId, session.id);
    if (!ok) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Block delete if project already under final review / completed (align with submission rules)
    const [proj]: any = await pool.query(
      "SELECT status FROM research_projects WHERE id = ? LIMIT 1",
      [projectId]
    );
    const status = String(proj[0]?.status || "").toUpperCase();
    if (
      status.includes("APPROVED") ||
      status === "COMPLETED" ||
      status === "UNDER_REVIEW" ||
      status === "SUBMITTED"
    ) {
      // Soft gate: allow delete unless fully completed; under review still allow researcher edits for lab notes
      if (status === "COMPLETED" || status === "APPROVED") {
        return NextResponse.json(
          { error: "Cannot delete laboratory results after research completion." },
          { status: 409 }
        );
      }
    }

    await pool.query(
      "DELETE FROM research_laboratory_results WHERE id = ? AND projectId = ?",
      [resultId, projectId]
    );

    const progress = await refreshProjectProgress(projectId);
    return NextResponse.json({
      success: true,
      message: "Laboratory result deleted",
      progress,
      laboratoryResults: progress.laboratoryResults,
    });
  } catch (error: any) {
    console.error("laboratory-results DELETE:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete laboratory result" },
      { status: 500 }
    );
  }
}
