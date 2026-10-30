import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
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

    // Project & plant
    const [pRows]: any = await pool.query(
      `
      SELECT
        rp.*,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      `,
      [projectId, session.id]
    );

    if (pRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    const project = pRows[0];

    // Stages
    const [stages]: any = await pool.query(
      "SELECT stageKey, status FROM research_project_stages WHERE projectId = ?",
      [projectId]
    );
    const stageMap: Record<string, string> = {};
    for (const s of stages) {
      stageMap[s.stageKey] = s.status;
    }

    // Latest review submission
    const [submissions]: any = await pool.query(
      `
      SELECT rs.*, u.name as reviewerName, rp.specialty as reviewerSpecialty
      FROM review_submissions rs
      LEFT JOIN users u ON rs.assignedReviewerId = u.id
      LEFT JOIN reviewer_profiles rp ON u.id = rp.userId
      WHERE rs.projectId = ?
      ORDER BY rs.id DESC
      LIMIT 1
      `,
      [projectId]
    );
    const latestSubmission = submissions[0] || null;

    // Latest decision
    let latestDecision: any = null;
    if (latestSubmission) {
      const [decRows]: any = await pool.query(
        `
        SELECT rd.*, u.name as reviewerName, rp.specialty as reviewerSpecialty
        FROM review_decisions rd
        LEFT JOIN users u ON rd.reviewerId = u.id
        LEFT JOIN reviewer_profiles rp ON u.id = rp.userId
        WHERE rd.submissionId = ?
        ORDER BY rd.id DESC
        LIMIT 1
        `,
        [latestSubmission.id]
      );
      latestDecision = decRows[0] || null;
    }

    // Latest revision cycle
    const [cycleRows]: any = await pool.query(
      `
      SELECT rc.*, u.name as reviewerName, rp.specialty as reviewerSpecialty
      FROM revision_cycles rc
      LEFT JOIN users u ON rc.reviewerId = u.id
      LEFT JOIN reviewer_profiles rp ON u.id = rp.userId
      WHERE rc.projectId = ?
      ORDER BY rc.id DESC
      LIMIT 1
      `,
      [projectId]
    );
    const currentCycle = cycleRows[0] || null;

    // Reviewer feedback comments for this submission/project
    const [feedbackRows]: any = await pool.query(
      `
      SELECT rf.*, u.name as reviewerDisplayName
      FROM review_feedback rf
      LEFT JOIN users u ON rf.reviewerId = u.id
      WHERE rf.projectId = ? ${latestSubmission ? "AND rf.submissionId = ?" : ""}
      ORDER BY FIELD(rf.severity, 'CRITICAL', 'MAJOR', 'MINOR', 'INFORMATIONAL'), rf.id ASC
      `,
      latestSubmission ? [projectId, latestSubmission.id] : [projectId]
    );

    // Calculate feedback counts
    const counts = {
      critical: feedbackRows.filter((f: any) => f.severity === "CRITICAL").length,
      major: feedbackRows.filter((f: any) => f.severity === "MAJOR").length,
      minor: feedbackRows.filter((f: any) => f.severity === "MINOR").length,
      informational: feedbackRows.filter((f: any) => f.severity === "INFORMATIONAL").length,
      total: feedbackRows.length,
      addressed: feedbackRows.filter((f: any) => f.status === "ADDRESSED" || f.status === "RESOLVED").length,
      open: feedbackRows.filter((f: any) => f.status === "OPEN").length,
    };

    // Historical submitted snapshot (e.g. v1.0)
    let historicalSnapshot: any = null;
    if (latestSubmission?.snapshotData) {
      try {
        historicalSnapshot =
          typeof latestSubmission.snapshotData === "string"
            ? JSON.parse(latestSubmission.snapshotData)
            : latestSubmission.snapshotData;
      } catch (e) {}
    }

    // Current working research state (for diff comparison)
    const [curEv]: any = await pool.query("SELECT * FROM research_evidence_reviews WHERE projectId = ? LIMIT 1", [projectId]);
    const [curPlant]: any = await pool.query("SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1", [projectId]);
    const [curLit]: any = await pool.query("SELECT * FROM literature_references WHERE projectId = ? ORDER BY year DESC", [projectId]);
    const [curInSilico]: any = await pool.query("SELECT * FROM insilico_results WHERE projectId = ? ORDER BY id DESC", [projectId]);
    const [curDocking]: any = await pool.query("SELECT * FROM docking_runs WHERE projectId = ? ORDER BY id DESC", [projectId]);

    const [curForm]: any = await pool.query("SELECT * FROM research_formulations WHERE projectId = ? LIMIT 1", [projectId]);
    let curFormVersion: any = null;
    let curComponents: any[] = [];
    if (curForm.length > 0) {
      const [vRows]: any = await pool.query(
        "SELECT * FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1",
        [curForm[0].id]
      );
      curFormVersion = vRows[0] || null;
      if (curFormVersion) {
        const [cRows]: any = await pool.query("SELECT * FROM formulation_components WHERE versionId = ?", [curFormVersion.id]);
        curComponents = cRows;
      }
    }

    const [curSafety]: any = await pool.query("SELECT * FROM research_safety_assessments WHERE projectId = ? ORDER BY id DESC LIMIT 1", [projectId]);

    const currentWorkingState = {
      evidenceReview: curEv[0] || null,
      plantData: curPlant[0] || null,
      literatureCount: curLit.length,
      inSilicoCount: curInSilico.length,
      dockingCount: curDocking.length,
      formulation: {
        name: curForm[0]?.formulationName,
        version: curFormVersion?.versionTag,
        componentCount: curComponents.length,
      },
      safety: curSafety[0] || null,
    };

    // Resubmission readiness checklist
    const unaddressedCriticalOrMajor = feedbackRows.filter(
      (f: any) => (f.severity === "CRITICAL" || f.severity === "MAJOR") && f.status === "OPEN"
    );
    const missingRequirements: string[] = [];

    if (unaddressedCriticalOrMajor.length > 0) {
      missingRequirements.push(
        `${unaddressedCriticalOrMajor.length} Major or Critical reviewer comment(s) still require documented responses.`
      );
    }

    const isReadyForResubmission = missingRequirements.length === 0 && feedbackRows.length > 0;

    return NextResponse.json({
      success: true,
      project,
      stageMap,
      latestSubmission,
      latestDecision,
      currentCycle,
      feedback: feedbackRows,
      counts,
      historicalSnapshot,
      currentWorkingState,
      resubmissionReadiness: {
        isReadyForResubmission,
        missingRequirements,
        unaddressedCriticalOrMajorCount: unaddressedCriticalOrMajor.length,
      },
    });
  } catch (error) {
    console.error("Revisions GET error:", error);
    return NextResponse.json({ error: "Failed to load revisions" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
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

    // Verify ownership
    const [pCheck]: any = await pool.query(
      `
      SELECT
        rp.*,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      `,
      [projectId, session.id]
    );
    if (pCheck.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    const project = pCheck[0];

    const body = await request.json();
    const { action } = body;

    // ACTION 1: Save response to an individual reviewer comment
    if (action === "save-response") {
      const {
        feedbackId,
        researcherReply,
        responseAction,
        responseDescription,
        affectedStage,
        supportingFileUrl,
        status, // 'ADDRESSED' | 'PENDING'
      } = body;

      if (!feedbackId) {
        return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 });
      }

      await pool.query(
        `
        UPDATE review_feedback
        SET
          researcherReply = ?,
          responseAction = ?,
          responseDescription = ?,
          affectedStage = ?,
          supportingFileUrl = ?,
          status = COALESCE(?, 'ADDRESSED'),
          researcherRepliedAt = CURRENT_TIMESTAMP(3),
          updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ? AND projectId = ?
        `,
        [
          researcherReply?.trim() || null,
          responseAction || "CHANGE_MADE",
          responseDescription?.trim() || null,
          affectedStage || null,
          supportingFileUrl?.trim() || null,
          status || "ADDRESSED",
          feedbackId,
          projectId,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Response recorded and comment marked as addressed.",
      });
    }

    // ACTION 2: Resubmit revised dossier for professional review
    if (action === "resubmit") {
      const { revisionSummary, changeNotes } = body;

      // Check existing submissions
      const [subRows]: any = await pool.query(
        "SELECT * FROM review_submissions WHERE projectId = ? ORDER BY id DESC LIMIT 1",
        [projectId]
      );
      const lastSubmission = subRows[0] || null;

      // Determine next version (e.g. v1.0 -> v1.1, v1.1 -> v1.2, or v2.0)
      const lastTag = lastSubmission?.versionTag || "v1.0";
      const match = lastTag.match(/v(\d+)\.(\d+)/);
      let nextTag = "v1.1";
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        nextTag = `v${major}.${minor + 1}`;
      }
      const nextRound = (lastSubmission?.reviewRound || 1) + 1;

      // Compile new immutable snapshot of the revised current project state
      const [evReview]: any = await pool.query("SELECT * FROM research_evidence_reviews WHERE projectId = ? LIMIT 1", [projectId]);
      const [plantData]: any = await pool.query("SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1", [projectId]);
      const [literature]: any = await pool.query("SELECT * FROM literature_references WHERE projectId = ? ORDER BY year DESC", [projectId]);
      const [compounds]: any = await pool.query("SELECT * FROM research_compounds WHERE projectId = ?", [projectId]);
      const [inSilico]: any = await pool.query("SELECT * FROM insilico_results WHERE projectId = ? ORDER BY id DESC", [projectId]);
      const [dockingRuns]: any = await pool.query("SELECT * FROM docking_runs WHERE projectId = ? ORDER BY id DESC", [projectId]);
      const [dockingSetups]: any = await pool.query("SELECT * FROM docking_setups WHERE projectId = ? LIMIT 1", [projectId]);

      const [formRows]: any = await pool.query("SELECT * FROM research_formulations WHERE projectId = ? LIMIT 1", [projectId]);
      const formulation = formRows[0] || null;
      let activeVersion: any = null;
      let components: any[] = [];
      let steps: any[] = [];
      let batches: any[] = [];
      let rationale: any = null;

      if (formulation) {
        const [vRows]: any = await pool.query(
          "SELECT * FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1",
          [formulation.id]
        );
        activeVersion = vRows[0] || null;
        if (activeVersion) {
          const [cRows]: any = await pool.query("SELECT * FROM formulation_components WHERE versionId = ?", [activeVersion.id]);
          components = cRows;
          const [sRows]: any = await pool.query("SELECT * FROM formulation_steps WHERE versionId = ? ORDER BY stepNumber ASC", [activeVersion.id]);
          steps = sRows;
          const [bRows]: any = await pool.query("SELECT * FROM formulation_batches WHERE versionId = ?", [activeVersion.id]);
          batches = bRows;
          const [rRows]: any = await pool.query("SELECT * FROM formulation_rationales WHERE versionId = ? LIMIT 1", [activeVersion.id]);
          rationale = rRows[0] || null;
        }
      }

      let safetyAssessment: any = null;
      let safetyConcerns: any[] = [];
      let safetySummary: any = null;
      if (activeVersion) {
        const [saRows]: any = await pool.query("SELECT * FROM research_safety_assessments WHERE projectId = ? AND formulationVersionId = ? LIMIT 1", [projectId, activeVersion.id]);
        safetyAssessment = saRows[0] || null;
      }
      if (!safetyAssessment) {
        const [saFallback]: any = await pool.query("SELECT * FROM research_safety_assessments WHERE projectId = ? ORDER BY id DESC LIMIT 1", [projectId]);
        safetyAssessment = saFallback[0] || null;
      }
      if (safetyAssessment) {
        const [scRows]: any = await pool.query("SELECT * FROM safety_concerns WHERE safetyAssessmentId = ?", [safetyAssessment.id]);
        safetyConcerns = scRows;
        const [ssRows]: any = await pool.query("SELECT * FROM safety_summaries WHERE safetyAssessmentId = ? LIMIT 1", [safetyAssessment.id]);
        safetySummary = ssRows[0] || null;
      }

      // Fetch all addressed responses to link with this resubmission
      const [responses]: any = await pool.query(
        "SELECT id, sectionName, comment, researcherReply, responseAction, responseDescription FROM review_feedback WHERE projectId = ? AND status = 'ADDRESSED'",
        [projectId]
      );

      const revisedSnapshot = {
        project: {
          id: project.id,
          title: project.title,
          plantName: project.plantName,
          plantScientificName: project.plantScientificName,
        },
        evidenceReview: evReview[0] || null,
        plantData: plantData[0] || null,
        literature: literature || [],
        compounds: compounds || [],
        inSilico: inSilico || [],
        docking: dockingRuns || [],
        dockingSetup: dockingSetups[0] || null,
        formulations: activeVersion
          ? [
              {
                id: activeVersion.id,
                formulationName: formulation?.formulationName || "Research Formulation Prototype",
                formulationType: formulation?.formulationType || "Extract",
                versionNumber: activeVersion.versionNumber || "1.0",
                versionTag: activeVersion.versionTag || "v1.0",
                preparationMethod: steps.map((s: any) => `${s.stepNumber}. ${s.procedureText}`).join("\n"),
                ingredients: components.map((c: any) => ({
                  id: c.id,
                  ingredientName: c.componentName,
                  quantity: c.quantity,
                  unit: c.unit,
                  role: c.roleInFormulation,
                })),
                components,
                steps,
                batches,
                rationale,
              },
            ]
          : [],
        safety: safetyAssessment
          ? {
              id: safetyAssessment.id,
              knownAdverseEffects: safetyAssessment.knownAdverseEffects,
              contraindications: safetyAssessment.potentialContraindications,
              drugInteractions: safetyAssessment.herbDrugInteractions,
              concerns: safetyConcerns,
              summary: safetySummary,
            }
          : null,
        resubmissionMetadata: {
          parentVersion: lastTag,
          revisionTag: nextTag,
          reviewRound: nextRound,
          revisionSummary: revisionSummary?.trim() || "Addressed reviewer comments.",
          addressedFeedbackCount: responses.length,
          responses,
          submittedAt: new Date().toISOString(),
        },
      };

      const revisedJson = JSON.stringify(revisedSnapshot);

      // 1. Update research_dossiers
      await pool.query(
        "UPDATE research_dossiers SET currentVersionTag = ?, status = 'UNDER_REVIEW', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ?",
        [nextTag, projectId]
      );

      const [dossierRow]: any = await pool.query(
        "SELECT id FROM research_dossiers WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      const dossierId = dossierRow[0]?.id || 1;

      // 2. Insert into research_dossier_versions
      const [verRes]: any = await pool.query(
        `
        INSERT INTO research_dossier_versions (
          dossierId, projectId, researcherId, versionTag, reviewRound,
          formulationVersionId, formulationVersionTag, submissionStatus,
          messageToReviewers, readinessSnapshot, dossierSnapshot, submissionTimestamp,
          assignedReviewerId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', ?, ?, ?, CURRENT_TIMESTAMP(3), ?)
        `,
        [
          dossierId,
          projectId,
          session.id,
          nextTag,
          nextRound,
          activeVersion?.id || null,
          activeVersion?.versionTag || "v1.0",
          revisionSummary?.trim() || "Revised research submitted.",
          JSON.stringify({ isReadyForReview: true }),
          revisedJson,
          lastSubmission?.assignedReviewerId || null,
        ]
      );
      const dossierVersionId = verRes.insertId;

      // 3. Insert stage-by-stage snapshots
      const stagesToSnap = [
        { key: "evidence-review", title: "Evidence Review", status: "COMPLETED", data: evReview[0] || {} },
        { key: "plant-research", title: "Plant Research", status: "COMPLETED", data: plantData[0] || {} },
        { key: "literature", title: "Literature & Evidence", status: "COMPLETED", data: literature || [] },
        { key: "in-silico", title: "In-Silico Analysis", status: "COMPLETED", data: inSilico || [] },
        { key: "docking", title: "Molecular Docking", status: "COMPLETED", data: dockingRuns || [] },
        { key: "formulation", title: "Formulation Builder", status: "COMPLETED", data: { formulation, version: activeVersion, components, steps, batches } },
        { key: "safety", title: "Safety Assessment", status: "COMPLETED", data: { safetyAssessment, concerns: safetyConcerns, summary: safetySummary } },
      ];
      for (const ss of stagesToSnap) {
        await pool.query(
          `
          INSERT INTO research_dossier_stage_snapshots (
            dossierVersionId, projectId, stageKey, stageTitle, stageStatus, snapshotPayload
          ) VALUES (?, ?, ?, ?, ?, ?)
          `,
          [dossierVersionId, projectId, ss.key, ss.title, ss.status, JSON.stringify(ss.data)]
        );
      }

      // 4. Create review_submissions record
      const [subRes]: any = await pool.query(
        `
        INSERT INTO review_submissions (
          projectId, versionTag, reviewRound, messageToReviewers,
          readinessSnapshot, snapshotData, previousSubmissionId, assignedReviewerId,
          status, submittedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', CURRENT_TIMESTAMP(3))
        `,
        [
          projectId,
          nextTag,
          nextRound,
          revisionSummary?.trim() || null,
          JSON.stringify({ isReadyForReview: true }),
          revisedJson,
          lastSubmission?.id || null,
          lastSubmission?.assignedReviewerId || null,
        ]
      );
      const newSubmissionId = subRes.insertId;

      // 5. Update assignment or create new assignment for the reviewer.
      // Eligibility = users.status ACTIVE AND users.role REVIEWER AND profile VERIFIED.
      // Prior assignments are never modified/deleted (history preserved).
      let targetReviewerId = lastSubmission?.assignedReviewerId;
      let targetSpecialty = "PHARMACIST";

      if (targetReviewerId) {
        const [revCheck]: any = await pool.query(
          `SELECT rp.verificationStatus, rp.specialty
           FROM reviewer_profiles rp
           JOIN users u ON u.id = rp.userId
           WHERE rp.userId = ? AND u.status = 'ACTIVE' AND u.role = 'REVIEWER'
           LIMIT 1`,
          [targetReviewerId]
        );
        if (revCheck.length === 0 || revCheck[0].verificationStatus !== "VERIFIED") {
          // Previous reviewer is no longer eligible: select another eligible reviewer
          const [verifiedRevs]: any = await pool.query(
            `SELECT rp.userId, rp.specialty
             FROM reviewer_profiles rp
             JOIN users u ON u.id = rp.userId
             WHERE rp.verificationStatus = 'VERIFIED' AND u.status = 'ACTIVE' AND u.role = 'REVIEWER'
             ORDER BY rp.id ASC LIMIT 1`
          );
          if (verifiedRevs.length > 0) {
            targetReviewerId = verifiedRevs[0].userId;
            targetSpecialty = verifiedRevs[0].specialty;
          } else {
            targetReviewerId = null;
          }
        } else {
          targetSpecialty = revCheck[0].specialty || "PHARMACIST";
        }
      }

      // Keep the submission's reviewer pointer consistent with the validated assignment
      if ((targetReviewerId || null) !== (lastSubmission?.assignedReviewerId || null)) {
        await pool.query("UPDATE review_submissions SET assignedReviewerId = ? WHERE id = ?", [
          targetReviewerId || null,
          newSubmissionId,
        ]);
      }

      if (targetReviewerId) {
        await pool.query(
          `
          INSERT INTO review_assignments (
            projectId, submissionId, reviewerId, specialtyNeeded, status,
            reviewRound, assignedAt
          ) VALUES (?, ?, ?, ?, 'RESUBMITTED', ?, CURRENT_TIMESTAMP(3))
          `,
          [projectId, newSubmissionId, targetReviewerId, targetSpecialty, nextRound]
        );
      }

      // 6. Record change records
      if (changeNotes && Array.isArray(changeNotes)) {
        for (const cn of changeNotes) {
          await pool.query(
            `
            INSERT INTO revision_change_records (
              projectId, fromVersionTag, toVersionTag, sectionKey,
              changeType, changeDescription
            ) VALUES (?, ?, ?, ?, ?, ?)
            `,
            [projectId, lastTag, nextTag, cn.sectionKey || "formulation", cn.changeType || "MODIFIED", cn.description || "Updated"]
          );
        }
      }

      // 7. Update project and stage statuses
      await pool.query(
        `
        UPDATE research_projects
        SET status = 'UNDER_REVIEW', currentStage = 'review', updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [projectId]
      );

      await pool.query(
        `UPDATE research_project_stages SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND stageKey = 'revisions'`,
        [projectId]
      );

      await pool.query(
        `UPDATE research_project_stages SET status = 'UNDER_REVIEW', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND stageKey = 'review'`,
        [projectId]
      );

      // 8. Log activity
      await pool.query(
        `
        INSERT INTO review_activity_logs (
          projectId, submissionId, dossierVersionId, actorId, actorRole, actionType, description
        ) VALUES (?, ?, ?, ?, 'RESEARCHER', 'DOSSIER_RESUBMITTED', ?)
        `,
        [projectId, newSubmissionId, dossierVersionId, session.id, `Resubmitted Dossier ${nextTag} (Round ${nextRound}) for review`]
      );

      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'DOSSIER_RESUBMITTED', ?)
        `,
        [projectId, session.id, `Resubmitted Dossier ${nextTag} with addressed revision responses`]
      );

      // 9. Notify reviewer if assigned
      if (lastSubmission?.assignedReviewerId) {
        await pool.query(
          `
          INSERT INTO review_notifications (userId, type, title, message, link)
          VALUES (?, 'RESUBMITTED', ?, ?, ?)
          `,
          [
            lastSubmission.assignedReviewerId,
            `Resubmitted: ${project.title} (${nextTag})`,
            `The researcher has addressed reviewer feedback and resubmitted Dossier ${nextTag} for round ${nextRound} evaluation.`,
            `/reviewer/reviews/${newSubmissionId}`,
          ]
        );
      }

      return NextResponse.json({
        success: true,
        message: `Dossier ${nextTag} successfully compiled and resubmitted for professional review.`,
        newSubmissionId,
        nextTag,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Revisions POST error:", error);
    return NextResponse.json({ error: "Failed to process revision action" }, { status: 500 });
  }
}
