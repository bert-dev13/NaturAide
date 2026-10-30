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

    // 1. Project details & plant
    const [projectRows]: any = await pool.query(
      `
      SELECT
        rp.*,
        u.name as researcherName,
        u.email as researcherEmail,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        p.id as actualPlantId,
        p.slug as plantSlug
      FROM research_projects rp
      LEFT JOIN users u ON rp.researcherId = u.id
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      `,
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    const project = projectRows[0];

    // 2. Stage Map
    const [stages]: any = await pool.query(
      "SELECT stageKey, status FROM research_project_stages WHERE projectId = ?",
      [projectId]
    );
    const stageMap: Record<string, string> = {};
    for (const s of stages) {
      stageMap[s.stageKey] = s.status;
    }

    // 3. Stage 5 Completion Record
    const [compRows]: any = await pool.query(
      "SELECT * FROM research_completion_records WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const completionRecord = compRows[0] || null;

    // 4. Eligible Stage 5 Final Findings
    const [findings]: any = await pool.query(
      "SELECT * FROM research_final_findings WHERE projectId = ? ORDER BY id ASC",
      [projectId]
    );

    // 5. Evidence Traceability
    const [evidenceTraceability]: any = await pool.query(
      "SELECT * FROM research_evidence_traceability WHERE projectId = ? ORDER BY id ASC",
      [projectId]
    );

    // 6. Supporting Validation Records
    const [labTests]: any = await pool.query(
      `
      SELECT lt.*, li.keyFindings as interpretationKeyFindings
      FROM laboratory_tests lt
      LEFT JOIN laboratory_interpretations li ON lt.id = li.testId
      WHERE lt.projectId = ?
      ORDER BY lt.id DESC
      `,
      [projectId]
    );

    // 7. Latest Professional Review Decision
    const [revDecRows]: any = await pool.query(
      `
      SELECT rd.*, u.name as reviewerName, rp.specialty as reviewerSpecialty
      FROM review_decisions rd
      LEFT JOIN users u ON rd.reviewerId = u.id
      LEFT JOIN reviewer_profiles rp ON u.id = rp.userId
      WHERE rd.projectId = ?
      ORDER BY rd.id DESC
      LIMIT 1
      `,
      [projectId]
    );
    const reviewDecision = revDecRows[0] || null;

    // 8. Current NatureAide Community Knowledge for this plant
    let currentCommunityKnowledge: any = {
      medicinalPlantInfo: "",
      scientificEvidence: "",
      safetyPrecautions: "",
      researchSummary: "",
      traditionalPreparation: "",
    };

    if (project.actualPlantId) {
      const [plantGuideRows]: any = await pool.query(
        "SELECT * FROM plant_guides WHERE plantId = ? LIMIT 1",
        [project.actualPlantId]
      );
      const guide = plantGuideRows[0] || null;

      const [prepRows]: any = await pool.query(
        "SELECT * FROM traditional_preparations WHERE plant_id = ? ORDER BY id ASC LIMIT 3",
        [project.actualPlantId]
      );

      currentCommunityKnowledge = {
        medicinalPlantInfo: guide?.about || "Standard botanical monograph documented.",
        scientificEvidence: guide?.whatResearchSays || guide?.preclinical_evidence || "Preclinical and bioassay literature archived.",
        safetyPrecautions: guide?.safetyInformation || guide?.contraindications || "Standard precautions and contraindication profile.",
        researchSummary: guide?.clinical_evidence || guide?.documented_uses || "Consolidated research findings.",
        traditionalPreparation: prepRows.map((pr: any) => `${pr.title}: ${pr.description}`).join("\n\n") || "Traditional decoction and infusion protocols.",
      };
    }

    // 9. Existing Knowledge Integration Proposals with versions, comments, and decisions
    const [proposalRows]: any = await pool.query(
      `
      SELECT kip.*, p.commonName as plantCommonName, p.scientificName as plantScientificName
      FROM knowledge_integration_proposals kip
      LEFT JOIN plants p ON kip.plantId = p.id
      WHERE kip.projectId = ?
      ORDER BY kip.id DESC
      `,
      [projectId]
    );

    const proposals: any[] = [];
    for (const prop of proposalRows) {
      // Versions
      const [versions]: any = await pool.query(
        "SELECT * FROM knowledge_integration_versions WHERE proposalId = ? ORDER BY versionNumber DESC",
        [prop.id]
      );

      // Evidence links
      const [evLinks]: any = await pool.query(
        "SELECT * FROM knowledge_integration_evidence_links WHERE proposalId = ? ORDER BY id ASC",
        [prop.id]
      );

      // Comments
      const [comments]: any = await pool.query(
        `
        SELECT kic.*, u.name as authorName, u.email as authorEmail
        FROM knowledge_integration_comments kic
        LEFT JOIN users u ON kic.authorId = u.id
        WHERE kic.proposalId = ?
        ORDER BY kic.id ASC
        `,
        [prop.id]
      );

      // Decisions
      const [decisions]: any = await pool.query(
        `
        SELECT kid.*, u.name as reviewerName
        FROM knowledge_integration_decisions kid
        LEFT JOIN users u ON kid.reviewerId = u.id
        WHERE kid.proposalId = ?
        ORDER BY kid.id DESC
        `,
        [prop.id]
      );

      proposals.push({
        ...prop,
        versions,
        currentVersion: versions[0] || null,
        evidenceLinks: evLinks,
        comments,
        decisions,
      });
    }

    return NextResponse.json({
      success: true,
      project,
      stageMap,
      completionRecord,
      eligibleFindings: findings,
      evidenceTraceability,
      labTests,
      reviewDecision,
      currentCommunityKnowledge,
      proposals,
    });
  } catch (error) {
    console.error("Knowledge integration GET error:", error);
    return NextResponse.json({ error: "Failed to load knowledge integration workspace" }, { status: 500 });
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

    const researcherId = session.id;

    // Verify ownership
    const [projectRows]: any = await pool.query(
      "SELECT * FROM research_projects WHERE id = ? AND researcherId = ?",
      [projectId, researcherId]
    );
    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    const project = projectRows[0];

    const body = await request.json();
    const { action } = body;

    // ACTION: CREATE PROPOSAL (DRAFT)
    if (action === "create-proposal") {
      const {
        title,
        knowledgeArea,
        changeType,
        sourceFindingId,
        sourceFindingTitle,
        currentKnowledgeSnapshot,
        proposedContent,
        reasonForChange,
        supportingFindingSummary,
        dossierVersionTag,
        laboratoryEvidenceSummary,
        professionalReviewOutcome,
        supportingReferences,
        selectedEvidenceLinks,
      } = body;

      if (!title?.trim() || !knowledgeArea || !changeType || !proposedContent?.trim() || !reasonForChange?.trim()) {
        return NextResponse.json({ error: "Title, knowledge area, change type, proposed content, and reason for change are required." }, { status: 400 });
      }

      // Traditional preparation constraint check
      if (knowledgeArea === "TRADITIONAL_PREPARATION") {
        if (!reasonForChange.toLowerCase().includes("traditional") && !proposedContent.toLowerCase().includes("traditional") && !proposedContent.toLowerCase().includes("preparation")) {
          return NextResponse.json({
            error: "Traditional Preparation can only be proposed when the completed research actually supports preparation information. Do not convert formulation research into traditional preparation.",
          }, { status: 400 });
        }
      }

      // Generate Proposal Code
      const propCode = `KIP-${projectId}-${Date.now().toString().slice(-4)}`;

      // 1. Insert proposal
      const [propRes]: any = await pool.query(
        `
        INSERT INTO knowledge_integration_proposals (
          projectId, researcherId, plantId, proposalCode, title,
          knowledgeArea, changeType, currentVersionNumber, status,
          sourceFindingId, sourceFindingTitle
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'DRAFT', ?, ?)
        `,
        [
          projectId,
          researcherId,
          project.plantId || null,
          propCode,
          title.trim(),
          knowledgeArea,
          changeType,
          sourceFindingId || null,
          sourceFindingTitle?.trim() || null,
        ]
      );
      const proposalId = propRes.insertId;

      // 2. Insert initial version
      const [verRes]: any = await pool.query(
        `
        INSERT INTO knowledge_integration_versions (
          proposalId, versionNumber, currentKnowledgeSnapshot, proposedContent,
          reasonForChange, supportingFindingSummary, dossierVersionTag,
          laboratoryEvidenceSummary, professionalReviewOutcome, supportingReferences,
          isLocked
        ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `,
        [
          proposalId,
          currentKnowledgeSnapshot?.trim() || null,
          proposedContent.trim(),
          reasonForChange.trim(),
          supportingFindingSummary?.trim() || null,
          dossierVersionTag || "v1.0",
          laboratoryEvidenceSummary?.trim() || null,
          professionalReviewOutcome?.trim() || null,
          supportingReferences?.trim() || null,
        ]
      );
      const versionId = verRes.insertId;

      // 3. Insert evidence links
      if (Array.isArray(selectedEvidenceLinks) && selectedEvidenceLinks.length > 0) {
        for (const link of selectedEvidenceLinks) {
          if (link.evidenceType && link.evidenceReference) {
            await pool.query(
              `
              INSERT INTO knowledge_integration_evidence_links (
                proposalId, versionId, evidenceType, evidenceReference, notes
              ) VALUES (?, ?, ?, ?, ?)
              `,
              [proposalId, versionId, link.evidenceType, link.evidenceReference.trim(), link.notes?.trim() || null]
            );
          }
        }
      }

      // 4. Log activity
      await pool.query(
        `
        INSERT INTO knowledge_integration_activity_logs (
          proposalId, projectId, actorId, actionType, description
        ) VALUES (?, ?, ?, 'DRAFT_CREATED', ?)
        `,
        [proposalId, projectId, researcherId, `Created draft proposal ${propCode}: "${title.trim()}"`]
      );

      return NextResponse.json({
        success: true,
        proposalId,
        proposalCode: propCode,
        message: "Knowledge integration proposal draft created.",
      });
    }

    // ACTION: SUBMIT PROPOSAL FOR INDEPENDENT REVIEW
    if (action === "submit-proposal") {
      const { proposalId } = body;
      if (!proposalId) {
        return NextResponse.json({ error: "Proposal ID is required." }, { status: 400 });
      }

      const [propRows]: any = await pool.query(
        "SELECT * FROM knowledge_integration_proposals WHERE id = ? AND projectId = ? AND researcherId = ?",
        [proposalId, projectId, researcherId]
      );
      if (propRows.length === 0) {
        return NextResponse.json({ error: "Proposal not found or unauthorized." }, { status: 404 });
      }
      const proposal = propRows[0];

      // Check current version
      const [verRows]: any = await pool.query(
        "SELECT * FROM knowledge_integration_versions WHERE proposalId = ? AND versionNumber = ?",
        [proposalId, proposal.currentVersionNumber]
      );
      if (verRows.length === 0) {
        return NextResponse.json({ error: "Proposal version not found." }, { status: 404 });
      }
      const currVersion = verRows[0];

      // Submission validations
      if (!currVersion.proposedContent || currVersion.proposedContent.trim().length < 10) {
        return NextResponse.json({ error: "Proposed content must be documented before submission." }, { status: 400 });
      }
      if (!currVersion.reasonForChange || currVersion.reasonForChange.trim().length < 5) {
        return NextResponse.json({ error: "Reason for change must be documented before submission." }, { status: 400 });
      }

      // Lock version and mark SUBMITTED / UNDER_REVIEW
      await pool.query(
        `
        UPDATE knowledge_integration_versions
        SET isLocked = 1, submittedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [currVersion.id]
      );

      await pool.query(
        `
        UPDATE knowledge_integration_proposals
        SET status = 'SUBMITTED', updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [proposalId]
      );

      // Keep Stage 5 as IN_PROGRESS
      await pool.query(
        `
        UPDATE research_project_stages
        SET status = 'IN_PROGRESS'
        WHERE projectId = ? AND stageKey = 'knowledge-integration'
        `,
        [projectId]
      );

      // Activity logs
      await pool.query(
        `
        INSERT INTO knowledge_integration_activity_logs (
          proposalId, projectId, actorId, actionType, description
        ) VALUES (?, ?, ?, 'SUBMITTED_FOR_REVIEW', ?)
        `,
        [proposalId, projectId, researcherId, `Submitted proposal ${proposal.proposalCode} for Knowledge Integration Review.`]
      );

      await pool.query(
        `
        INSERT INTO research_activity_logs (
          projectId, researcherId, actionType, description
        ) VALUES (?, ?, 'KNOWLEDGE_INTEGRATION_SUBMITTED', ?)
        `,
        [projectId, researcherId, `Submitted proposal ${proposal.proposalCode} ("${proposal.title}") for independent Knowledge Integration Review.`]
      );

      return NextResponse.json({
        success: true,
        message: "Proposal submitted for independent Knowledge Integration Review. Community content remains unchanged pending review.",
      });
    }

    // ACTION: SUBMIT REVISION (WHEN CHANGES_REQUESTED)
    if (action === "submit-revision") {
      const {
        proposalId,
        revisedProposedContent,
        revisedReasonForChange,
        revisionNotes,
        selectedEvidenceLinks,
      } = body;

      if (!proposalId || !revisedProposedContent?.trim() || !revisedReasonForChange?.trim()) {
        return NextResponse.json({ error: "Proposal ID, revised proposed content, and reason for change are required." }, { status: 400 });
      }

      const [propRows]: any = await pool.query(
        "SELECT * FROM knowledge_integration_proposals WHERE id = ? AND projectId = ? AND researcherId = ?",
        [proposalId, projectId, researcherId]
      );
      if (propRows.length === 0) {
        return NextResponse.json({ error: "Proposal not found or unauthorized." }, { status: 404 });
      }
      const proposal = propRows[0];

      if (proposal.status !== "CHANGES_REQUESTED") {
        return NextResponse.json({ error: "Revisions can only be submitted for proposals with status CHANGES_REQUESTED." }, { status: 400 });
      }

      const nextVersionNumber = proposal.currentVersionNumber + 1;

      // Copy previous version data for reference
      const [prevVer]: any = await pool.query(
        "SELECT * FROM knowledge_integration_versions WHERE proposalId = ? AND versionNumber = ?",
        [proposalId, proposal.currentVersionNumber]
      );
      const prev = prevVer[0] || {};

      // Insert new version (locked upon submission)
      const [newVerRes]: any = await pool.query(
        `
        INSERT INTO knowledge_integration_versions (
          proposalId, versionNumber, currentKnowledgeSnapshot, proposedContent,
          reasonForChange, supportingFindingSummary, dossierVersionTag,
          laboratoryEvidenceSummary, professionalReviewOutcome, supportingReferences,
          isLocked, submittedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP(3))
        `,
        [
          proposalId,
          nextVersionNumber,
          prev.currentKnowledgeSnapshot || null,
          revisedProposedContent.trim(),
          revisedReasonForChange.trim(),
          prev.supportingFindingSummary || null,
          prev.dossierVersionTag || "v1.0",
          prev.laboratoryEvidenceSummary || null,
          prev.professionalReviewOutcome || null,
          prev.supportingReferences || null,
        ]
      );
      const newVersionId = newVerRes.insertId;

      // Evidence links for new version
      if (Array.isArray(selectedEvidenceLinks) && selectedEvidenceLinks.length > 0) {
        for (const link of selectedEvidenceLinks) {
          if (link.evidenceType && link.evidenceReference) {
            await pool.query(
              `
              INSERT INTO knowledge_integration_evidence_links (
                proposalId, versionId, evidenceType, evidenceReference, notes
              ) VALUES (?, ?, ?, ?, ?)
              `,
              [proposalId, newVersionId, link.evidenceType, link.evidenceReference.trim(), link.notes?.trim() || null]
            );
          }
        }
      }

      // Update proposal state
      await pool.query(
        `
        UPDATE knowledge_integration_proposals
        SET currentVersionNumber = ?, status = 'SUBMITTED', updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [nextVersionNumber, proposalId]
      );

      // Add comment recording researcher's response
      if (revisionNotes?.trim()) {
        await pool.query(
          `
          INSERT INTO knowledge_integration_comments (
            proposalId, versionId, authorId, authorRole, commentType, severity, commentText
          ) VALUES (?, ?, ?, 'RESEARCHER', 'GENERAL_COMMENT', 'INFORMATIONAL', ?)
          `,
          [proposalId, newVersionId, researcherId, `Revision v${nextVersionNumber} Notes: ${revisionNotes.trim()}`]
        );
      }

      // Log activity
      await pool.query(
        `
        INSERT INTO knowledge_integration_activity_logs (
          proposalId, projectId, actorId, actionType, description
        ) VALUES (?, ?, ?, 'REVISION_SUBMITTED', ?)
        `,
        [proposalId, projectId, researcherId, `Submitted revision v${nextVersionNumber} for proposal ${proposal.proposalCode}.`]
      );

      return NextResponse.json({
        success: true,
        message: `Revision v${nextVersionNumber} submitted successfully for review.`,
      });
    }

    // ACTION: DELETE DRAFT
    if (action === "delete-draft") {
      const { proposalId } = body;
      const [propRows]: any = await pool.query(
        "SELECT * FROM knowledge_integration_proposals WHERE id = ? AND projectId = ? AND researcherId = ? AND status = 'DRAFT'",
        [proposalId, projectId, researcherId]
      );
      if (propRows.length === 0) {
        return NextResponse.json({ error: "Only draft proposals can be deleted." }, { status: 400 });
      }

      await pool.query("DELETE FROM knowledge_integration_evidence_links WHERE proposalId = ?", [proposalId]);
      await pool.query("DELETE FROM knowledge_integration_versions WHERE proposalId = ?", [proposalId]);
      await pool.query("DELETE FROM knowledge_integration_comments WHERE proposalId = ?", [proposalId]);
      await pool.query("DELETE FROM knowledge_integration_decisions WHERE proposalId = ?", [proposalId]);
      await pool.query("DELETE FROM knowledge_integration_activity_logs WHERE proposalId = ?", [proposalId]);
      await pool.query("DELETE FROM knowledge_integration_proposals WHERE id = ?", [proposalId]);

      return NextResponse.json({ success: true, message: "Draft proposal removed." });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Knowledge integration POST error:", error);
    return NextResponse.json({ error: "Failed to process knowledge proposal" }, { status: 500 });
  }
}
