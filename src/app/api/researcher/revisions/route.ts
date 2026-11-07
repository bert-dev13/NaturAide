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
    const filterProjectId = searchParams.get("projectId")
      ? parseInt(searchParams.get("projectId")!, 10)
      : null;
    const filterStatus = searchParams.get("status") || "ALL";

    // 1. Fetch all projects belonging to this researcher
    const [projectsRows]: any = await pool.query(
      `SELECT rp.id, rp.title, rp.status, rp.currentStage, rp.progressPercent,
              rp.plantCustomName, rp.createdAt, rp.updatedAt,
              COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName,
              p.scientificName as plantScientificName
       FROM research_projects rp
       LEFT JOIN plants p ON rp.plantId = p.id
       WHERE rp.researcherId = ?
       ORDER BY rp.updatedAt DESC`,
      [session.id]
    );

    const projects = projectsRows || [];
    if (projects.length === 0) {
      return NextResponse.json({
        success: true,
        projects: [],
        revisions: [],
        stats: { total: 0, open: 0, addressed: 0, resolved: 0 },
      });
    }

    const projectIds = projects.map((p: any) => p.id);

    // 2. Fetch feedback items for these projects
    let query = `
      SELECT rf.*,
             rp.title as projectTitle,
             COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName,
             p.scientificName as plantScientificName,
             u.name as reviewerDisplayName,
             u.role as reviewerRole
      FROM review_feedback rf
      JOIN research_projects rp ON rf.projectId = rp.id
      LEFT JOIN plants p ON rp.plantId = p.id
      LEFT JOIN users u ON rf.reviewerId = u.id
      WHERE rf.projectId IN (?)
    `;
    const params: any[] = [projectIds];

    if (filterProjectId) {
      query += ` AND rf.projectId = ?`;
      params.push(filterProjectId);
    }

    if (filterStatus !== "ALL") {
      query += ` AND rf.status = ?`;
      params.push(filterStatus);
    }

    query += `
      ORDER BY 
        CASE WHEN rf.status = 'OPEN' THEN 1
             WHEN rf.status = 'ADDRESSED' THEN 2
             ELSE 3 END,
        rf.id DESC
    `;

    const [feedbackRows]: any = await pool.query(query, params);
    const revisions = (feedbackRows || []).map((row: any) => {
      // Map sectionName to direct navigation link for the researcher
      const sName = (row.sectionName || "").toLowerCase();
      let stepNum = 1;
      const stepMatch = (row.sectionName || "").match(/step\s*(\d+)/i) || (row.title || "").match(/step\s*(\d+)/i);
      if (stepMatch && stepMatch[1]) {
        stepNum = parseInt(stepMatch[1], 10);
      }

      let navPath = `/researcher/projects/${row.projectId}`;
      if (sName.includes("section 1") || sName.includes("formulation") || sName.includes("batch")) {
        navPath = `/researcher/projects/${row.projectId}/formulation-rd?step=${stepNum}`;
      } else if (sName.includes("section 2") || sName.includes("in-silico") || sName.includes("docking")) {
        navPath = `/researcher/projects/${row.projectId}/in-silico?step=${stepNum}`;
      } else if (sName.includes("section 3") || sName.includes("manuscript") || sName.includes("submission") || sName.includes("paper")) {
        navPath = `/researcher/projects/${row.projectId}/submission?step=${Math.min(3, stepNum)}`;
      }

      return {
        ...row,
        navPath,
      };
    });

    // 3. Compute overall stats across all researcher projects
    const [allFeedbackRows]: any = await pool.query(
      `SELECT status FROM review_feedback WHERE projectId IN (?)`,
      [projectIds]
    );

    const allItems = allFeedbackRows || [];
    const stats = {
      total: allItems.length,
      open: allItems.filter((i: any) => i.status === "OPEN").length,
      addressed: allItems.filter((i: any) => i.status === "ADDRESSED").length,
      resolved: allItems.filter((i: any) => i.status === "RESOLVED").length,
    };

    // Calculate per-project feedback counts
    const projectsWithCounts = projects.map((p: any) => {
      const pFeedbacks = allItems.filter((f: any) => f.projectId === p.id);
      return {
        ...p,
        totalFeedback: pFeedbacks.length,
        openFeedback: pFeedbacks.filter((f: any) => f.status === "OPEN").length,
      };
    });

    return NextResponse.json({
      success: true,
      projects: projectsWithCounts,
      revisions,
      stats,
    });
  } catch (error: any) {
    console.error("GET /api/researcher/revisions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load revisions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackId, researcherReply } = body;

    if (!feedbackId) {
      return NextResponse.json({ error: "Missing feedbackId" }, { status: 400 });
    }

    const replyText = (researcherReply || "").trim();
    if (!replyText) {
      return NextResponse.json(
        { error: "Please enter your response or revision resolution notes." },
        { status: 400 }
      );
    }

    // Verify ownership of the project associated with this feedback
    const [existingRows]: any = await pool.query(
      `SELECT rf.*, rp.title as projectTitle, rp.researcherId
       FROM review_feedback rf
       JOIN research_projects rp ON rf.projectId = rp.id
       WHERE rf.id = ? AND rp.researcherId = ?
       LIMIT 1`,
      [feedbackId, session.id]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: "Revision item not found or unauthorized." }, { status: 404 });
    }
    const item = existingRows[0];

    // Update feedback item status to ADDRESSED
    await pool.query(
      `UPDATE review_feedback
       SET researcherReply = ?,
           researcherRepliedAt = CURRENT_TIMESTAMP(3),
           status = 'ADDRESSED',
           updatedAt = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [replyText, feedbackId]
    );

    // Notify the reviewer
    if (item.reviewerId) {
      try {
        await pool.query(
          `INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
           VALUES (?, 'REVISION_ADDRESSED', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))`,
          [
            item.reviewerId,
            `Revision Addressed · ${item.projectTitle || "Project"}`,
            `Researcher addressed "${item.title || "Review finding"}": "${replyText.slice(0, 120)}${replyText.length > 120 ? "..." : ""}"`,
            `/reviewer/projects/${item.projectId}`,
          ]
        );
      } catch (notifErr) {
        console.warn("Could not dispatch reviewer notification:", notifErr);
      }
    }

    // Log Activity
    try {
      await pool.query(
        `INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
         VALUES (?, ?, ?, 'RESEARCHER', 'REVISION_ADDRESSED', ?)`,
        [
          item.projectId,
          item.submissionId || null,
          session.id,
          `Researcher addressed revision "${item.title || "finding"}" with resolution note.`,
        ]
      );
    } catch (logErr) {
      console.warn("Could not insert review_activity_log:", logErr);
    }

    return NextResponse.json({
      success: true,
      message: "Revision resolution recorded successfully. Reviewer has been notified.",
    });
  } catch (error: any) {
    console.error("POST /api/researcher/revisions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit revision resolution" },
      { status: 500 }
    );
  }
}

