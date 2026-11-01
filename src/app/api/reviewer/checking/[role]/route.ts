import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  getAreaDefinition,
  expertCheckingTitle,
  type ExpertReviewAreaKey,
} from "@/lib/expert-review-areas";
import { buildFullDossierSnapshot } from "@/lib/expert-review-assignment";

const PLANT_FAMILY_MAP: Record<string, string> = {
  "Momordica charantia": "Cucurbitaceae",
  "Blumea balsamifera": "Asteraceae",
  "Vitex negundo": "Lamiaceae (Verbenaceae)",
  "Psidium guajava": "Myrtaceae",
  "Senna alata": "Fabaceae",
  "Allium sativum": "Amaryllidaceae",
  "Curcuma longa": "Zingiberaceae",
  "Peperomia pellucida": "Piperaceae",
  "Carmona retusa": "Boraginaceae",
  "Mentha cordifolia": "Lamiaceae",
  "Quisqualis indica": "Combretaceae",
  "Zingiber officinale": "Zingiberaceae",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await params;
    const roleKey = normalizeReviewAreaKey(role);
    const areaDef = getAreaDefinition(roleKey);

    const { searchParams } = new URL(request.url);
    const requestedProjectId = searchParams.get("projectId")
      ? parseInt(searchParams.get("projectId")!, 10)
      : null;
    const requestedAssignmentId = searchParams.get("assignmentId")
      ? parseInt(searchParams.get("assignmentId")!, 10)
      : null;

    // Fetch latest assignment per project for this role across the system
    const [assignments]: any = await pool.query(
      `
      SELECT
        ra.id as assignmentId,
        ra.submissionId,
        ra.projectId,
        ra.reviewerId,
        u_rev.name as assignedReviewerName,
        ra.status as assignmentStatus,
        ra.specialtyNeeded,
        ra.reviewRound,
        ra.assignedAt,
        ra.startedAt,
        ra.completedAt,
        rp.title as projectTitle,
        rp.shortDescription,
        rp.researchObjective,
        rp.currentStage,
        rp.status as projectStatus,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        p.category as plantCategory,
        u.id as researcherId,
        u.name as researcherName,
        rs.versionTag,
        rs.submittedAt,
        rs.messageToReviewers,
        rs.snapshotData,
        pr.assessment,
        pr.comments as reviewComments,
        pr.status as reviewStatus,
        (
          SELECT COUNT(*)
          FROM review_feedback rf
          WHERE rf.submissionId = ra.submissionId AND rf.areaKey = ? AND rf.status = 'OPEN'
        ) as openFindingsCount
      FROM review_assignments ra
      JOIN research_projects rp ON ra.projectId = rp.id
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN users u_rev ON ra.reviewerId = u_rev.id
      LEFT JOIN plants p ON rp.plantId = p.id
      JOIN review_submissions rs ON ra.submissionId = rs.id
      LEFT JOIN professional_reviews pr ON (pr.submissionId = ra.submissionId AND pr.areaKey = ?)
      WHERE (ra.specialtyNeeded = ? OR ra.specialtyNeeded = 'EXPERT_REVIEW')
        AND ra.id IN (
          SELECT MAX(ra2.id)
          FROM review_assignments ra2
          WHERE (ra2.specialtyNeeded = ? OR ra2.specialtyNeeded = 'EXPERT_REVIEW')
          GROUP BY ra2.projectId
        )
      ORDER BY
        (ra.reviewerId = ?) DESC,
        ra.assignedAt DESC,
        ra.id DESC
      `,
      [roleKey, roleKey, roleKey, roleKey, session.id]
    );

    // Check if a specific project was requested
    let requestedProjectRecord: any = null;
    let requestedProjectMatch = requestedProjectId
      ? assignments.find((a: any) => a.projectId === requestedProjectId)
      : null;

    if (requestedProjectId && !requestedProjectMatch) {
      const [projRows]: any = await pool.query(
        `
        SELECT rp.id as projectId, rp.title as projectTitle, rp.shortDescription, rp.researchObjective,
               rp.currentStage, rp.status as projectStatus,
               COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
               p.scientificName as plantScientificName,
               u.id as researcherId, u.name as researcherName
        FROM research_projects rp
        JOIN users u ON rp.researcherId = u.id
        LEFT JOIN plants p ON rp.plantId = p.id
        WHERE rp.id = ?
        LIMIT 1
        `,
        [requestedProjectId]
      );
      if (projRows.length > 0) {
        requestedProjectRecord = projRows[0];
      }
    }

    if (requestedProjectRecord) {
      const STAGE_LEVELS: Record<string, number> = {
        "plant-literature": 1,
        "in-silico": 2,
        docking: 3,
        "formulation-safety": 4,
        "completion-integration": 5,
        "expert-review": 6,
      };
      const ROLE_REQUIRED_LEVELS: Record<string, number> = {
        pharmacognosy: 1,
        bioinformatics: 2,
        pharmacology: 3,
        formulation: 4,
        clinical_safety: 5,
      };
      const currentLevel = STAGE_LEVELS[requestedProjectRecord.currentStage] || 1;
      const requiredLevel = ROLE_REQUIRED_LEVELS[roleKey] || 1;
      const isReady = currentLevel >= requiredLevel || requestedProjectRecord.projectStatus === "COMPLETED";

      if (!isReady) {
        const notReadyAssignment = {
          assignmentId: 0,
          submissionId: 0,
          projectId: requestedProjectRecord.projectId,
          reviewerId: session.id,
          assignedReviewerName: session.name,
          assignmentStatus: "NOT_READY",
          specialtyNeeded: roleKey,
          reviewRound: 1,
          projectTitle: requestedProjectRecord.projectTitle,
          plantName: requestedProjectRecord.plantName,
          plantScientificName: requestedProjectRecord.plantScientificName,
          researcherName: requestedProjectRecord.researcherName,
          versionTag: "v1.0",
          reviewArea: roleKey,
          reviewAreaLabel: areaDef.shortLabel,
          isReady: false,
          notReadyReason: "The required research data has not yet been submitted.",
        };

        return NextResponse.json({
          success: true,
          roleKey,
          areaDefinition: areaDef,
          checkingTitle: expertCheckingTitle(roleKey),
          assignments: [notReadyAssignment, ...assignments],
          activeAssignment: notReadyAssignment,
          canEdit: false,
          isAssignedToCurrentUser: true,
          snapshot: null,
          reviewHistory: [],
          review: null,
          findings: [],
        });
      }
    }

    if (assignments.length === 0) {
      // If no assignments exist yet, fetch latest submitted project snapshot for viewing
      const [latestSub]: any = await pool.query(
        `
        SELECT rs.id as submissionId, rs.projectId, rs.versionTag, rs.snapshotData,
               rp.title as projectTitle, rp.researchObjective,
               COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
               p.scientificName as plantScientificName,
               u.id as researcherId, u.name as researcherName
        FROM review_submissions rs
        JOIN research_projects rp ON rs.projectId = rp.id
        JOIN users u ON rp.researcherId = u.id
        LEFT JOIN plants p ON rp.plantId = p.id
        ORDER BY rs.id DESC
        LIMIT 1
        `
      );

      let fallbackSnapshot: any = null;
      let activeAssignment: any = null;

      if (latestSub.length > 0) {
        const sub = latestSub[0];
        try {
          fallbackSnapshot = typeof sub.snapshotData === "string" ? JSON.parse(sub.snapshotData) : sub.snapshotData;
        } catch (e) {
          console.error(e);
        }
        if (!fallbackSnapshot || !fallbackSnapshot.compounds) {
          fallbackSnapshot = await buildFullDossierSnapshot(sub.projectId);
        }

        activeAssignment = {
          assignmentId: 0,
          submissionId: sub.submissionId,
          projectId: sub.projectId,
          reviewerId: null,
          assignedReviewerName: "Unassigned",
          assignmentStatus: "PENDING",
          specialtyNeeded: roleKey,
          reviewRound: 1,
          projectTitle: sub.projectTitle,
          plantName: sub.plantName,
          plantScientificName: sub.plantScientificName,
          researcherName: sub.researcherName,
          versionTag: sub.versionTag || "v1.0",
          reviewArea: roleKey,
          reviewAreaLabel: areaDef.shortLabel,
        };
      }

      return NextResponse.json({
        success: true,
        roleKey,
        areaDefinition: areaDef,
        checkingTitle: expertCheckingTitle(roleKey),
        assignments: activeAssignment ? [activeAssignment] : [],
        activeAssignment,
        canEdit: false,
        isAssignedToCurrentUser: false,
        snapshot: fallbackSnapshot,
        reviewHistory: [],
        review: null,
        findings: [],
      });
    }

    // Determine active assignment
    let activeAssignment = assignments[0];
    if (requestedAssignmentId) {
      const match = assignments.find((a: any) => a.assignmentId === requestedAssignmentId);
      if (match) activeAssignment = match;
    } else if (requestedProjectId) {
      const match = assignments.find((a: any) => a.projectId === requestedProjectId);
      if (match) activeAssignment = match;
    }

    const projectId = activeAssignment.projectId;
    const submissionId = activeAssignment.submissionId;
    const isAssignedToCurrentUser = activeAssignment.reviewerId === session.id;
    const canEdit = isAssignedToCurrentUser;

    // Transition PENDING -> IN_REVIEW automatically upon opening if assigned to current user
    if (isAssignedToCurrentUser && activeAssignment.assignmentStatus === "PENDING") {
      await pool.query(
        "UPDATE review_assignments SET status = 'IN_REVIEW', startedAt = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [activeAssignment.assignmentId]
      );
      await pool.query(
        "UPDATE review_area_coverage SET status = 'IN_REVIEW' WHERE submissionId = ? AND areaKey = ?",
        [submissionId, roleKey]
      );
      activeAssignment.assignmentStatus = "IN_REVIEW";
    }

    // Load or build exact versioned dossier snapshot
    let snapshot: any = null;
    if (activeAssignment.snapshotData) {
      try {
        snapshot =
          typeof activeAssignment.snapshotData === "string"
            ? JSON.parse(activeAssignment.snapshotData)
            : activeAssignment.snapshotData;
      } catch (e) {
        console.error("Error parsing snapshotData:", e);
      }
    }

    if (!snapshot || !snapshot.literature || !snapshot.compounds) {
      const fullSnapshot = await buildFullDossierSnapshot(projectId);
      snapshot = { ...fullSnapshot, ...snapshot };
    }

    // Always overlay live Stage 1 researcher scientific record (Single Source of Truth)
    try {
      const [livePlantRows]: any = await pool.query(
        `SELECT rpd.*, p.category as plantFamily, p.local_names as plantLocalNames,
                p.botanical_synonyms as plantSynonyms, p.source_organization as plantSourceOrg,
                p.source_verified as plantSourceVerified, p.plant_parts_used as plantPartsUsed
         FROM research_projects rp
         LEFT JOIN plants p ON rp.plantId = p.id
         LEFT JOIN research_plant_data rpd ON rpd.projectId = rp.id
         WHERE rp.id = ? LIMIT 1`,
        [projectId]
      );
      const livePlant = livePlantRows[0] || {};

      const [liveSynthRows]: any = await pool.query(
        "SELECT * FROM research_literature_syntheses WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      const liveSynth = liveSynthRows[0] || null;

      const [liveLitRows]: any = await pool.query(
        "SELECT * FROM literature_references WHERE projectId = ? ORDER BY year DESC, id DESC",
        [projectId]
      );

      snapshot = {
        ...snapshot,
        plantLocalNames: livePlant.localNames || livePlant.plantLocalNames || snapshot?.plantLocalNames || "",
        plantFamily: livePlant.family || livePlant.plantFamily || snapshot?.plantFamily || snapshot?.botanicalFamily || "",
        plantPartsStudied: livePlant.partsStudied || snapshot?.plantPartsStudied || livePlant.plantPartsUsed || "Leaves",
        specimenSource: livePlant.specimenSource || snapshot?.specimenSource || "",
        collectionDate: livePlant.collectionDate || snapshot?.collectionDate || "",
        collectionLocation: livePlant.collectionLocation || snapshot?.collectionLocation || "",
        voucherSpecimenNumber: livePlant.voucherSpecimenNumber || snapshot?.voucherSpecimenNumber || "",
        sampleIdentifier: livePlant.sampleIdentifier || snapshot?.sampleIdentifier || "",
        authenticationMethod: livePlant.authenticationMethod || snapshot?.authenticationMethod || "Macro-morphological & Taxonomic Key",
        authenticatedBy: livePlant.authenticatedBy || snapshot?.authenticatedBy || "",
        selectionRationale: livePlant.selectionRationale || snapshot?.selectionRationale || "",
        materialType: livePlant.materialType || snapshot?.materialType || "Crude Extract",
        extractionMethod: livePlant.extractionMethod || snapshot?.extractionMethod || "Cold Maceration with Rotary Evaporation",
        extractionSolvent: livePlant.extractionSolvent || snapshot?.extractionSolvent || "80% Aqueous Ethanol",
        extractFractionName: livePlant.extractFractionName || snapshot?.extractFractionName || "",
        storageHandlingNotes: livePlant.storageHandlingNotes || snapshot?.storageHandlingNotes || "",
        authenticationStatus: livePlant.authenticationStatus || snapshot?.authenticationStatus || "VERIFIED",
        botanicalSynonyms: livePlant.plantSynonyms || snapshot?.botanicalSynonyms || "",
        sourceOrganization: livePlant.plantSourceOrg || snapshot?.sourceOrganization || "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
        sourceVerified: Boolean(livePlant.plantSourceVerified || snapshot?.sourceVerified),
        stage1Synthesis: liveSynth || snapshot?.stage1Synthesis || null,
        literature: (liveLitRows && liveLitRows.length > 0) ? liveLitRows : (snapshot?.literature || []),
      };
    } catch (overlayErr) {
      console.warn("Could not overlay live Stage 1 data:", overlayErr);
    }

    // Overlay live Stage 2 researcher data (compounds, insilico_results, research_insilico_syntheses)
    try {
      const [liveCompounds]: any = await pool.query(
        `SELECT rc.*, rc.smiles as compoundSmiles FROM research_compounds rc WHERE rc.projectId = ? ORDER BY rc.id ASC`,
        [projectId]
      );
      const [liveResults]: any = await pool.query(
        `SELECT ir.*, rc.molecularFormula, rc.molecularWeight, rc.smiles as compoundSmiles
         FROM insilico_results ir
         LEFT JOIN research_compounds rc ON ir.compoundId = rc.id
         WHERE ir.projectId = ?
         ORDER BY ir.id DESC`,
        [projectId]
      );
      const [liveSynthesisRows]: any = await pool.query(
        `SELECT * FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1`,
        [projectId]
      );

      if (liveCompounds && liveCompounds.length > 0) {
        snapshot.compounds = liveCompounds;
      }
      if (liveResults && liveResults.length > 0) {
        snapshot.insilicoResults = liveResults;
      }
      if (liveSynthesisRows && liveSynthesisRows.length > 0) {
        snapshot.insilicoSynthesis = liveSynthesisRows[0];
      }
    } catch (overlayErr2) {
      console.warn("Could not overlay live Stage 2 data:", overlayErr2);
    }

    // Overlay live Stage 3 researcher docking data (Single Source of Truth)
    try {
      const [liveRuns]: any = await pool.query(
        `SELECT dr.*, dr.bindingAffinity as affinity
         FROM docking_runs dr
         WHERE dr.projectId = ?
         ORDER BY CAST(dr.bindingAffinity AS DECIMAL(10,3)) ASC, dr.id DESC`,
        [projectId]
      );
      const [liveTargets]: any = await pool.query(
        `SELECT * FROM docking_targets WHERE projectId = ? ORDER BY id ASC`,
        [projectId]
      );
      const [livePreps]: any = await pool.query(
        `SELECT dlp.*, rc.compoundName, rc.molecularFormula, rc.molecularWeight, rc.pubchemId
         FROM docking_ligand_preps dlp
         JOIN research_compounds rc ON dlp.compoundId = rc.id
         WHERE dlp.projectId = ?`,
        [projectId]
      );
      const [liveDockSynthRows]: any = await pool.query(
        `SELECT * FROM research_docking_syntheses WHERE projectId = ? LIMIT 1`,
        [projectId]
      );
      const [liveSetupRows]: any = await pool.query(
        `SELECT * FROM docking_setups WHERE projectId = ? LIMIT 1`,
        [projectId]
      );

      if (liveRuns && liveRuns.length > 0) {
        snapshot.dockingRuns = liveRuns.map((r: any) => ({
          ...r,
          affinity: r.bindingAffinity ? Number(r.bindingAffinity) : null,
          poses: r.posesJson ? (typeof r.posesJson === "string" ? JSON.parse(r.posesJson) : r.posesJson) : [],
          config: r.configJson ? (typeof r.configJson === "string" ? JSON.parse(r.configJson) : r.configJson) : null,
          literature: r.literatureJson ? (typeof r.literatureJson === "string" ? JSON.parse(r.literatureJson) : r.literatureJson) : [],
        }));
      }
      if (liveTargets && liveTargets.length > 0) {
        snapshot.dockingTargets = liveTargets.map((t: any) => ({
          ...t,
          structureMeta: t.structureMeta ? (typeof t.structureMeta === "string" ? JSON.parse(t.structureMeta) : t.structureMeta) : {},
          gridConfig: t.gridConfigJson ? (typeof t.gridConfigJson === "string" ? JSON.parse(t.gridConfigJson) : t.gridConfigJson) : null,
          detectedSites: t.detectedSites ? (typeof t.detectedSites === "string" ? JSON.parse(t.detectedSites) : t.detectedSites) : [],
        }));
      }
      if (livePreps && livePreps.length > 0) {
        snapshot.dockingLigands = livePreps;
      }
      if (liveDockSynthRows && liveDockSynthRows.length > 0) {
        snapshot.dockingSynthesis = liveDockSynthRows[0];
      }
      if (liveSetupRows && liveSetupRows.length > 0) {
        snapshot.dockingSettings = liveSetupRows[0]?.gridConfigJson
          ? (typeof liveSetupRows[0].gridConfigJson === "string" ? JSON.parse(liveSetupRows[0].gridConfigJson) : liveSetupRows[0].gridConfigJson)
          : null;
      }
    } catch (overlayErr3) {
      console.warn("Could not overlay live Stage 3 data:", overlayErr3);
    }

    // Overlay live Stage 4 researcher formulation data (Single Source of Truth)
    try {
      const [rForm]: any = await pool.query(
        "SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1",
        [projectId]
      );
      if (rForm.length > 0) {
        const [vRows]: any = await pool.query(
          "SELECT * FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1",
          [rForm[0].id]
        );
        let components: any[] = [];
        let steps: any[] = [];
        if (vRows.length > 0) {
          const [cRows]: any = await pool.query(
            "SELECT * FROM formulation_components WHERE versionId = ? ORDER BY id ASC",
            [vRows[0].id]
          );
          components = cRows;
          const [sRows]: any = await pool.query(
            "SELECT * FROM formulation_steps WHERE versionId = ? ORDER BY stepNumber ASC",
            [vRows[0].id]
          );
          steps = sRows;
        }
        snapshot.formulation = {
          ...rForm[0],
          version: vRows[0] || null,
          components,
          steps,
        };
        snapshot.formulations = [snapshot.formulation];
      }
    } catch (overlayErr4) {
      console.warn("Could not overlay live Stage 4 data:", overlayErr4);
    }

    // Overlay live Stage 5 researcher safety data (Single Source of Truth)
    try {
      const [rSafety]: any = await pool.query(
        "SELECT * FROM research_safety_assessments WHERE projectId = ? ORDER BY id DESC LIMIT 1",
        [projectId]
      );
      if (rSafety.length > 0) {
        let parsedNotes: any = null;
        if (rSafety[0].additionalSafetyNotes) {
          try {
            const match = rSafety[0].additionalSafetyNotes.match(/\[NATUREAIDE_SAFETY_DATA\]([\s\S]*?)\[\/NATUREAIDE_SAFETY_DATA\]/);
            if (match) parsedNotes = JSON.parse(match[1]);
          } catch (e) {
            console.error(e);
          }
        }
        snapshot.safety = {
          ...rSafety[0],
          parsedNotes,
        };
      }
    } catch (overlayErr5) {
      console.warn("Could not overlay live Stage 5 data:", overlayErr5);
    }

    // Overlay live Stage 6 researcher synthesis data (Single Source of Truth)
    try {
      const [rComp]: any = await pool.query(
        "SELECT * FROM research_completions WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      if (rComp.length > 0) {
        let keyFindings: string[] = [];
        try {
          keyFindings = JSON.parse(rComp[0].keyFindings);
        } catch {
          keyFindings = [rComp[0].keyFindings];
        }
        snapshot.synthesis = {
          ...rComp[0],
          keyFindings,
        };
      }
    } catch (overlayErr6) {
      console.warn("Could not overlay live Stage 6 data:", overlayErr6);
    }

    // Attach botanical family
    if (!snapshot.botanicalFamily && !snapshot.plantFamily) {
      const sciName = activeAssignment.plantScientificName || snapshot.plantScientificName || "";
      snapshot.botanicalFamily = PLANT_FAMILY_MAP[sciName] || "Cucurbitaceae";
    }

    // Fetch review history across all cycles for this project & role
    const [historyRows]: any = await pool.query(
      `
      SELECT
        ra.id as assignmentId,
        ra.submissionId,
        ra.reviewRound,
        ra.status as assignmentStatus,
        ra.assignedAt,
        ra.completedAt,
        rs.versionTag,
        rs.submittedAt,
        pr.assessment,
        pr.comments as reviewComments
      FROM review_assignments ra
      JOIN review_submissions rs ON ra.submissionId = rs.id
      LEFT JOIN professional_reviews pr ON (
        pr.submissionId = ra.submissionId
        AND pr.areaKey = ?
      )
      WHERE ra.projectId = ?
        AND (ra.specialtyNeeded = ? OR ra.specialtyNeeded = 'EXPERT_REVIEW')
      ORDER BY ra.reviewRound DESC
      `,
      [roleKey, projectId, roleKey]
    );

    // Load current review draft/submission for this role
    const [reviewRows]: any = await pool.query(
      `SELECT * FROM professional_reviews WHERE submissionId = ? AND areaKey = ? LIMIT 1`,
      [submissionId, roleKey]
    );

    // Load findings for this role
    const [findings]: any = await pool.query(
      `
      SELECT rf.*, u.name as reviewerDisplayName
      FROM review_feedback rf
      LEFT JOIN users u ON rf.reviewerId = u.id
      WHERE rf.submissionId = ?
        AND (rf.areaKey = ? OR rf.areaKey IS NULL)
      ORDER BY
        CASE rf.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'MAJOR' THEN 2
          WHEN 'MINOR' THEN 3
          ELSE 4
        END ASC,
        rf.id ASC
      `,
      [submissionId, roleKey]
    );

    // Load findings from OTHER review areas for this submission (for cross-professional awareness)
    const [crossFindings]: any = await pool.query(
      `
      SELECT rf.id, rf.areaKey, rf.sectionName, rf.severity, rf.comment, rf.recommendation, rf.status, rf.createdAt
      FROM review_feedback rf
      WHERE rf.submissionId = ?
        AND rf.areaKey IS NOT NULL
        AND rf.areaKey != ?
        AND rf.status != 'RESOLVED'
      ORDER BY rf.id DESC
      `,
      [submissionId, roleKey]
    );

    return NextResponse.json({
      success: true,
      roleKey,
      areaDefinition: areaDef,
      checkingTitle: expertCheckingTitle(roleKey),
      assignments,
      activeAssignment: {
        ...activeAssignment,
        reviewArea: roleKey,
        reviewAreaLabel: areaDef.shortLabel,
      },
      canEdit,
      isAssignedToCurrentUser,
      assignedReviewerName: activeAssignment.assignedReviewerName,
      snapshot,
      reviewHistory: historyRows || [],
      review: reviewRows[0] || null,
      findings: findings || [],
      crossAreaFindings: crossFindings || [],
    });
  } catch (error) {
    console.error("GET /api/reviewer/checking/[role] error:", error);
    return NextResponse.json({ error: "Failed to load checking workspace" }, { status: 500 });
  }
}
