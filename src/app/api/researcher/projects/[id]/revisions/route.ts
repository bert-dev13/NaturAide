import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  normalizeReviewAreaKeyOrNull,
  expertReviewAreaLabel,
  expertProfessionTitle,
} from "@/lib/expert-review-areas";

interface StageInfo {
  stageNumber: number;
  stageKey: string;
  stageTitle: string;
  discipline: string;
  route: string;
  defaultAnchor: string;
}

const STAGE_DISCIPLINE_MAP: Record<string, StageInfo> = {
  pharmacognosy: {
    stageNumber: 1,
    stageKey: "plant-literature",
    stageTitle: "Stage 01 · Plant & Literature Research",
    discipline: "Pharmacognosy",
    route: "plant-literature",
    defaultAnchor: "sec-identity",
  },
  bioinformatics: {
    stageNumber: 2,
    stageKey: "in-silico",
    stageTitle: "Stage 02 · In-Silico Analysis",
    discipline: "Bioinformatics",
    route: "in-silico",
    defaultAnchor: "sec-compounds",
  },
  pharmacology: {
    stageNumber: 3,
    stageKey: "docking",
    stageTitle: "Stage 03 · Molecular Docking",
    discipline: "Pharmacology",
    route: "docking",
    defaultAnchor: "sec-results",
  },
  formulation: {
    stageNumber: 4,
    stageKey: "formulation-safety",
    stageTitle: "Stage 04 · Formulation Development",
    discipline: "Formulation",
    route: "formulation-safety",
    defaultAnchor: "sec-formulation",
  },
  clinical_safety: {
    stageNumber: 5,
    stageKey: "safety",
    stageTitle: "Stage 05 · Safety / Clinical",
    discipline: "Clinical Safety",
    route: "safety",
    defaultAnchor: "sec-evidence",
  },
};

function getTargetAnchor(stageNumber: number, sectionName?: string, fieldName?: string): string {
  const combined = `${sectionName || ""} ${fieldName || ""}`.toLowerCase();

  if (stageNumber === 1) {
    if (combined.includes("identity") || combined.includes("botanical") || combined.includes("family") || combined.includes("voucher") || combined.includes("species")) {
      return "sec-identity";
    }
    if (combined.includes("material") || combined.includes("part") || combined.includes("collection") || combined.includes("provenance")) {
      return "sec-material";
    }
    if (combined.includes("extract") || combined.includes("solvent") || combined.includes("macerat")) {
      return "sec-extraction";
    }
    if (combined.includes("literat") || combined.includes("reference") || combined.includes("study") || combined.includes("citation")) {
      return "sec-literature";
    }
    return "sec-synthesis";
  }

  if (stageNumber === 2) {
    if (combined.includes("compound") || combined.includes("constituent") || combined.includes("smiles")) {
      return "sec-compounds";
    }
    if (combined.includes("screen") || combined.includes("admet") || combined.includes("lipinski") || combined.includes("bioavail")) {
      return "sec-screening";
    }
    if (combined.includes("target") || combined.includes("pdb") || combined.includes("protein")) {
      return "sec-targets";
    }
    if (combined.includes("prep") || combined.includes("grid") || combined.includes("box")) {
      return "sec-docking-prep";
    }
    return "sec-synthesis";
  }

  if (stageNumber === 3) {
    if (combined.includes("setup") || combined.includes("grid") || combined.includes("box")) {
      return "sec-setup";
    }
    if (combined.includes("result") || combined.includes("affinity") || combined.includes("energy") || combined.includes("pose")) {
      return "sec-results";
    }
    return "sec-interpretation";
  }

  if (stageNumber === 4) {
    if (combined.includes("prototype") || combined.includes("solvent") || combined.includes("type") || combined.includes("ratio")) {
      return "sec-formulation";
    }
    if (combined.includes("composit") || combined.includes("active") || combined.includes("amount") || combined.includes("concen")) {
      return "sec-composition";
    }
    return "sec-documentation";
  }

  if (stageNumber === 5) {
    if (combined.includes("evidence") || combined.includes("literature") || combined.includes("carried")) {
      return "sec-evidence";
    }
    if (combined.includes("assess") || combined.includes("toxic") || combined.includes("contraindicat") || combined.includes("interact") || combined.includes("dose")) {
      return "sec-assessment";
    }
    return "sec-summary";
  }

  return "sec-summary";
}

function normalizeRecommendationType(type?: string | null): string {
  const norm = (type || "").toUpperCase();
  if (norm.includes("CORRECTION")) return "Correction";
  if (norm.includes("CONCERN") || norm.includes("CRITICAL") || norm === "SAFETY_CONCERN") return "Scientific Concern";
  if (norm.includes("CLARIFICATION")) return "Clarification";
  return "Recommendation";
}

function matchFeedbackToAreaKey(f: any, targetAreaKey: string): boolean {
  // 1. Explicit canonical areaKey
  const normalizedArea = normalizeReviewAreaKeyOrNull(f.areaKey);
  if (normalizedArea) {
    return normalizedArea === targetAreaKey;
  }

  // 2. Affected stage
  if (f.affectedStage) {
    const aff = String(f.affectedStage).toLowerCase().trim();
    if (targetAreaKey === "pharmacognosy" && (aff.includes("plant") || aff.includes("stage 1") || aff.includes("stage_1") || aff.includes("stage-1") || aff.includes("pharmacognos"))) return true;
    if (targetAreaKey === "bioinformatics" && (aff.includes("silico") || aff.includes("stage 2") || aff.includes("stage_2") || aff.includes("stage-2") || aff.includes("bioinformat"))) return true;
    if (targetAreaKey === "pharmacology" && (aff.includes("docking") || aff.includes("stage 3") || aff.includes("stage_3") || aff.includes("stage-3") || aff.includes("pharmacolog"))) return true;
    if (targetAreaKey === "formulation" && (aff.includes("formulation") || aff.includes("stage 4") || aff.includes("stage_4") || aff.includes("stage-4"))) return true;
    if (targetAreaKey === "clinical_safety" && (aff.includes("safety") || aff.includes("clinical") || aff.includes("stage 5") || aff.includes("stage_5") || aff.includes("stage-5"))) return true;
    return false;
  }

  // 3. Strict section matching
  const sec = String(f.sectionName || "").toLowerCase().trim();
  if (targetAreaKey === "pharmacognosy") {
    return sec.includes("identity") || sec.includes("voucher") || sec.includes("extraction") || sec.includes("literature") || sec.includes("provenance") || sec.includes("macerat") || sec === "plant-literature";
  }
  if (targetAreaKey === "bioinformatics") {
    return sec.includes("compound") || sec.includes("screening") || sec.includes("physicochemical") || sec.includes("target") || sec.includes("admet") || sec.includes("lipinski") || sec === "in-silico";
  }
  if (targetAreaKey === "pharmacology") {
    return sec.includes("docking") || sec.includes("binding") || sec.includes("affinity") || sec.includes("pose") || sec.includes("grid") || sec === "docking";
  }
  if (targetAreaKey === "formulation") {
    return sec.includes("dosage") || sec.includes("formulation") || sec.includes("composition") || sec.includes("excipient") || sec.includes("stability") || sec === "formulation-safety";
  }
  if (targetAreaKey === "clinical_safety") {
    return sec.includes("clinical") || sec.includes("toxicity") || sec.includes("contraindicat") || sec.includes("adverse") || sec === "safety";
  }
  return false;
}

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

    // 1. Fetch Project with Plant Info
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.*,
             COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName,
             p.scientificName as plantScientificName
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      LIMIT 1
      `,
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    const project = projectRows[0];

    // 2. Fetch Review Coverage & Assignments
    const [coverageRows]: any = await pool.query(
      `
      SELECT rac.*, ra.status as assignmentStatus, ra.reviewRound, u.name as reviewerAccountName
      FROM review_area_coverage rac
      LEFT JOIN review_assignments ra ON rac.projectId = ra.projectId AND rac.areaKey = ra.specialtyNeeded
      LEFT JOIN users u ON ra.reviewerId = u.id
      WHERE rac.projectId = ?
      ORDER BY rac.id DESC
      `,
      [projectId]
    );
    const coverageMap: Record<string, any> = {};
    for (const c of coverageRows) {
      if (!coverageMap[c.areaKey]) {
        coverageMap[c.areaKey] = c;
      }
    }

    // 3. Fetch Professional Reviews
    const [profReviews]: any = await pool.query(
      `
      SELECT pr.*, u.name as reviewerAccountName
      FROM professional_reviews pr
      LEFT JOIN users u ON pr.reviewerId = u.id
      WHERE pr.projectId = ?
      ORDER BY pr.id DESC
      `,
      [projectId]
    );
    const reviewByArea: Record<string, any> = {};
    for (const pr of profReviews) {
      if (!reviewByArea[pr.areaKey]) {
        reviewByArea[pr.areaKey] = pr;
      }
    }

    // 4. Fetch All Review Feedback items
    const [feedbackRows]: any = await pool.query(
      `
      SELECT rf.*, u.name as reviewerDisplayName
      FROM review_feedback rf
      LEFT JOIN users u ON rf.reviewerId = u.id
      WHERE rf.projectId = ?
      ORDER BY rf.id ASC
      `,
      [projectId]
    );

    // 5. Structure stages
    const STAGE_ORDER = ["pharmacognosy", "bioinformatics", "pharmacology", "formulation", "clinical_safety"];
    const activeStages: any[] = [];
    const allStagesSummary: any[] = [];
    let totalOpenCount = 0;
    let totalAddressedCount = 0;

    for (const areaKey of STAGE_ORDER) {
      const stageInfo = STAGE_DISCIPLINE_MAP[areaKey];
      if (!stageInfo) continue;

      const coverage = coverageMap[areaKey];
      const profReview = reviewByArea[areaKey];

      // Match feedback strictly to avoid cross-stage leakage
      const feedbackItems = feedbackRows.filter((f: any) => matchFeedbackToAreaKey(f, areaKey));

      const openItems = feedbackItems.filter((f: any) => f.status === "OPEN" || f.status === "IN_REVIEW");
      const addressedItems = feedbackItems.filter((f: any) => f.status === "ADDRESSED");
      const resolvedItems = feedbackItems.filter((f: any) => f.status === "RESOLVED");

      // Reviewer Identity: use account name if present, otherwise professional role title. Never assume Dr.
      const assignedAccountName = profReview?.reviewerAccountName || feedbackItems[0]?.reviewerDisplayName || coverage?.reviewerAccountName || null;
      const defaultRoleTitle = expertProfessionTitle(areaKey);
      const reviewerDisplayName = assignedAccountName ? assignedAccountName.trim() : defaultRoleTitle;

      // Determine effective stage status
      let stageStatus = "PENDING";
      if (
        profReview?.assessment === "REVISION_RESUBMITTED" ||
        coverage?.assignmentStatus === "RESUBMITTED" ||
        coverage?.status === "RESUBMITTED" ||
        (addressedItems.length > 0 && openItems.length === 0)
      ) {
        stageStatus = "RESUBMITTED";
      } else if (
        profReview?.assessment === "REVISION_REQUIRED" ||
        coverage?.status === "REVISION_REQUIRED" ||
        coverage?.assignmentStatus === "REVISION_REQUIRED" ||
        openItems.length > 0
      ) {
        stageStatus = "REVISION_REQUIRED";
      } else if (profReview?.assessment === "ACCEPTABLE" || coverage?.status === "APPROVED") {
        stageStatus = "APPROVED";
      } else if (coverage?.status === "IN_REVIEW" || coverage?.assignmentStatus === "IN_REVIEW") {
        stageStatus = "IN_REVIEW";
      }

      // Map recommendations strictly with NO fake fallback data
      const recommendations = feedbackItems.map((f: any, idx: number) => {
        const itemType = normalizeRecommendationType(f.commentType);
        const sectionDisplay = f.sectionName?.trim() || "Section Overview";

        // Field naming: If missing or generic placeholder, treat as section-level recommendation
        const rawField = (f.title || f.fieldName || "").trim();
        const isGenericPlaceholder = !rawField || rawField.toLowerCase() === "field parameter" || rawField.toLowerCase() === sectionDisplay.toLowerCase();
        const fieldDisplay = isGenericPlaceholder ? null : rawField;

        const anchor = getTargetAnchor(stageInfo.stageNumber, f.sectionName, f.title);

        return {
          id: f.id,
          itemNum: String(idx + 1).padStart(2, "0"),
          type: itemType,
          sectionName: sectionDisplay,
          fieldName: fieldDisplay, // Null if section-level
          comment: (f.comment || "").trim(),
          recommendation: f.recommendation?.trim() || null,
          severity: f.severity ? String(f.severity).toUpperCase() : null, // Do NOT force MAJOR
          status: f.status || "OPEN",
          researcherReply: f.researcherReply?.trim() || null,
          researcherRepliedAt: f.researcherRepliedAt || null,
          targetAnchor: anchor,
          navigateTo: `/researcher/projects/${projectId}/${stageInfo.route}#${anchor}`,
        };
      });

      const activeRecommendations = recommendations.filter((r: any) => r.status === "OPEN" || r.status === "IN_REVIEW" || r.status === "ADDRESSED");

      const stageData = {
        stageNumber: stageInfo.stageNumber,
        stageKey: stageInfo.stageKey,
        stageTitle: stageInfo.stageTitle,
        discipline: stageInfo.discipline,
        route: stageInfo.route,
        status: stageStatus,
        reviewCycle: profReview?.reviewCycle || coverage?.reviewRound || 1,
        reviewerName: reviewerDisplayName,
        reviewerRole: defaultRoleTitle,
        overallAssessment: profReview?.comments || null,
        submittedAt: profReview?.submittedAt || null,
        openCount: openItems.length,
        addressedCount: addressedItems.length,
        resolvedCount: resolvedItems.length,
        totalCount: feedbackItems.length,
        recommendations: activeRecommendations,
      };

      allStagesSummary.push(stageData);

      // Only add to activeStages if action is genuinely required or awaiting re-review
      if (
        (stageStatus === "REVISION_REQUIRED" || stageStatus === "RESUBMITTED") &&
        (openItems.length > 0 || addressedItems.length > 0 || profReview?.assessment === "REVISION_REQUIRED")
      ) {
        totalOpenCount += openItems.length;
        totalAddressedCount += addressedItems.length;
        activeStages.push(stageData);
      }
    }

    // Build historical review records (approved reviews & resolved feedback)
    const reviewHistory = profReviews.map((pr: any) => {
      const stageInfo = STAGE_DISCIPLINE_MAP[pr.areaKey];
      const matchingFeedback = feedbackRows.filter((f: any) => matchFeedbackToAreaKey(f, pr.areaKey));

      const defaultRole = expertProfessionTitle(pr.areaKey);
      const reviewerName = pr.reviewerAccountName?.trim() || defaultRole;

      return {
        id: pr.id,
        areaKey: pr.areaKey,
        stageNumber: stageInfo?.stageNumber || 1,
        stageTitle: stageInfo?.stageTitle || "Research Stage",
        discipline: stageInfo?.discipline || expertReviewAreaLabel(pr.areaKey),
        reviewCycle: pr.reviewCycle || 1,
        assessment: pr.assessment || (pr.status === "SUBMITTED" ? "ACCEPTABLE" : "IN_PROGRESS"),
        status: pr.status,
        reviewerName,
        reviewerRole: defaultRole,
        comments: pr.comments?.trim() || null,
        submittedAt: pr.submittedAt,
        recommendations: matchingFeedback.map((f: any, idx: number) => {
          const rawField = (f.title || f.fieldName || "").trim();
          const isGeneric = !rawField || rawField.toLowerCase() === "field parameter";
          return {
            id: f.id,
            itemNum: String(idx + 1).padStart(2, "0"),
            type: normalizeRecommendationType(f.commentType),
            sectionName: f.sectionName?.trim() || "Section Overview",
            fieldName: isGeneric ? null : rawField,
            comment: (f.comment || "").trim(),
            recommendation: f.recommendation?.trim() || null,
            severity: f.severity ? String(f.severity).toUpperCase() : null,
            status: f.status || "RESOLVED",
            researcherReply: f.researcherReply?.trim() || null,
            researcherRepliedAt: f.researcherRepliedAt || null,
          };
        }),
      };
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        plantName: project.plantName,
        plantScientificName: project.plantScientificName,
        status: project.status,
      },
      openRecommendationsCount: totalOpenCount,
      stagesRequiringRevisionCount: activeStages.filter((s: any) => s.status === "REVISION_REQUIRED" && s.openCount > 0).length,
      addressedRecommendationsCount: totalAddressedCount,
      activeStages,
      reviewHistory,
      allStagesSummary,
    });
  } catch (error: any) {
    console.error("Researcher Revisions API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load project revisions" },
      { status: 500 }
    );
  }
}
