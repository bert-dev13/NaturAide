import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { calculateV2ProjectProgress } from "@/lib/v2-progress-service";
import { openExpertReviewCycle } from "@/lib/expert-review-assignment";
import { ensureManuscriptUploadColumns } from "@/lib/manuscript-upload-service";
import pool from "@/lib/db";

// POST /api/researcher/projects/[id]/submit-final
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    await ensureManuscriptUploadColumns();

    // Verify project belongs to researcher
    const [projectRows]: any = await pool.query(
      "SELECT id, status, title FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json(
        { error: "Project not found or not owned by researcher" },
        { status: 404 }
      );
    }

    const currentProject = projectRows[0];

    // Prevent duplicate submissions when already under active review (unless revision was requested)
    const [latestSubRows]: any = await pool.query(
      `SELECT id, versionTag, reviewRound, status, isLocked, submittedAt
       FROM review_submissions
       WHERE projectId = ?
       ORDER BY reviewRound DESC, id DESC
       LIMIT 1`,
      [projectId]
    );
    const latestSub = latestSubRows[0] || null;

    if (latestSub && (Boolean(latestSub.isLocked) || String(latestSub.status || "").toUpperCase() === "APPROVED")) {
      return NextResponse.json(
        {
          error: `This research package (${latestSub.versionTag}) has already received final approval across all 3 professional reviewer roles and is locked.`,
          alreadyApproved: true,
          submissionId: latestSub.id,
          versionTag: latestSub.versionTag,
        },
        { status: 409 }
      );
    }

    let hasRevisionRequested = false;
    if (latestSub) {
      const [revCovRows]: any = await pool.query(
        `SELECT id FROM review_area_coverage WHERE submissionId = ? AND status = 'REVISION_REQUIRED' LIMIT 1`,
        [latestSub.id]
      );
      hasRevisionRequested =
        revCovRows.length > 0 ||
        String(latestSub.status || "").toUpperCase() === "REVISION_REQUESTED";
    }

    const normProjectStatus = String(currentProject.status || "").toUpperCase();
    const isAlreadyUnderReview =
      !hasRevisionRequested &&
      (normProjectStatus === "UNDER_REVIEW" || normProjectStatus === "SUBMITTED") &&
      latestSub &&
      String(latestSub.status || "").toUpperCase() === "UNDER_REVIEW";

    if (isAlreadyUnderReview) {
      return NextResponse.json(
        {
          error: `This research package has already been submitted (${latestSub.versionTag}) and is currently under expert review.`,
          alreadySubmitted: true,
          submissionId: latestSub.id,
          versionTag: latestSub.versionTag,
        },
        { status: 409 }
      );
    }

    // Check V2 completion requirements
    const progress = await calculateV2ProjectProgress(projectId);

    if (progress.section1.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error: `Section 1 (Formulation R&D) is incomplete (${progress.section1.completedSteps}/${progress.section1.totalSteps} steps completed). Please complete all Section 1 steps before submitting.`,
        },
        { status: 400 }
      );
    }

    if (progress.section2.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error: `Section 2 (In-Silico Analysis) is incomplete (${progress.section2.completedSteps}/${progress.section2.totalSteps} steps completed). Please complete all Section 2 steps before submitting.`,
        },
        { status: 400 }
      );
    }

    if (!progress.section3.steps[0]?.completed) {
      return NextResponse.json(
        {
          error: "Step 1 (Research Summary) is required before submitting. Please review and save your Research Summary.",
        },
        { status: 400 }
      );
    }

    if (!progress.section3.steps[1]?.completed) {
      return NextResponse.json(
        {
          error: "Step 2 (Upload Research Paper) is required before submitting. Please upload your completed manuscript in PDF or DOCX format.",
        },
        { status: 400 }
      );
    }

    // Gather full snapshot data (preserving all existing data, literature references, and saved interpretations)
    const [plantData]: any = await pool.query("SELECT * FROM research_plant_data WHERE projectId = ?", [projectId]);
    const [productSelection]: any = await pool.query("SELECT * FROM research_product_selections WHERE projectId = ?", [projectId]);
    const [materials]: any = await pool.query("SELECT * FROM research_materials WHERE projectId = ?", [projectId]);
    const [formulations]: any = await pool.query("SELECT * FROM research_formulations WHERE projectId = ?", [projectId]);
    const [components]: any = await pool.query("SELECT * FROM formulation_components WHERE projectId = ?", [projectId]);
    const [batchAnalyses]: any = await pool.query("SELECT * FROM research_batch_analyses WHERE projectId = ?", [projectId]);
    const [compounds]: any = await pool.query("SELECT * FROM research_compounds WHERE projectId = ?", [projectId]);
    const [targets]: any = await pool.query("SELECT * FROM docking_targets WHERE projectId = ?", [projectId]);
    const [dockingRuns]: any = await pool.query("SELECT * FROM docking_runs WHERE projectId = ?", [projectId]);
    const [insilicoResults]: any = await pool.query("SELECT * FROM insilico_results WHERE projectId = ?", [projectId]);
    const [insilicoSyntheses]: any = await pool.query("SELECT * FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1", [projectId]);
    const [manuscripts]: any = await pool.query("SELECT * FROM research_manuscripts WHERE projectId = ?", [projectId]);
    const [literature]: any = await pool.query("SELECT * FROM literature_references WHERE projectId = ?", [projectId]);
    const [dossiers]: any = await pool.query("SELECT * FROM research_dossiers WHERE projectId = ?", [projectId]);

    const snapshotPayload = {
      submittedAt: new Date().toISOString(),
      submittedBy: { id: session.id, name: session.name, email: session.email },
      project: currentProject,
      plantName: plantData[0]?.commonName || currentProject.title || "Unspecified Plant",
      plantScientificName: plantData[0]?.scientificName || "",
      section1: {
        plantData: plantData[0] || null,
        productSelection: productSelection[0] || null,
        materials,
        formulations: formulations[0] || null,
        components,
        batchAnalyses,
      },
      section2: {
        compounds,
        targets,
        dockingRuns,
        insilicoResults,
        insilicoSynthesis: insilicoSyntheses[0] || null,
      },
      section3: {
        dossier: dossiers[0] || null,
        literature,
        manuscript: manuscripts[0] || null,
      },
      validationChecklist: {
        passedAt: new Date().toISOString(),
        section1Verified: true,
        section2Verified: true,
        section3Verified: true,
      },
    };

    // Open multi-disciplinary expert review cycle (assigns all 3 professional roles: Section 1, Section 2, Section 3)
    const cycleResult = await openExpertReviewCycle({
      projectId,
      researcherId: session.id,
      message: "Consolidated multi-disciplinary research package submitted for professional peer review.",
      snapshotData: snapshotPayload,
    });

    const newStatus = "UNDER_REVIEW";

    // Update project
    await pool.query(
      `
      UPDATE research_projects
      SET status = ?,
          progressPercent = 100,
          updatedAt = CURRENT_TIMESTAMP(3)
      WHERE id = ?
      `,
      [newStatus, projectId]
    );

    // Log research activity
    await pool.query(
      `
      INSERT INTO research_activity_logs (projectId, researcherId, actionType, description, createdAt)
      VALUES (?, ?, 'SUBMIT_FOR_REVIEW', 'Complete research package submitted for professional multidisciplinary review', CURRENT_TIMESTAMP(3))
      `,
      [projectId, session.id]
    );

    return NextResponse.json({
      success: true,
      message: "Research successfully submitted for professional multidisciplinary review!",
      submissionId: cycleResult.submissionId,
      versionTag: cycleResult.versionTag,
      reviewRound: cycleResult.reviewRound,
      newStatus,
    });
  } catch (error: any) {
    console.error("Error submitting final research:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit research" },
      { status: 500 }
    );
  }
}
