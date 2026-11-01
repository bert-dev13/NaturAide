import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
} from "@/lib/expert-review-areas";

const STAGE_ORDER: Record<string, number> = {
  "plant-literature": 1,
  "in-silico": 2,
  docking: 3,
  "formulation-safety": 4,
  "expert-review": 5,
  "completion-integration": 6,
};

const AREA_REQUIRED_STAGE: Record<string, number> = {
  pharmacognosy: 1,
  bioinformatics: 2,
  pharmacology: 3,
  formulation: 4,
  clinical_safety: 5,
};

const AREA_CONFIG: Record<
  string,
  {
    profession: string;
    checkingArea: string;
    description: string;
  }
> = {
  pharmacognosy: {
    profession: "Pharmacist / Pharmacognosist",
    checkingArea: "Pharmacognosy",
    description: "Botanical identity, specimen provenance and supporting literature.",
  },
  bioinformatics: {
    profession: "Bioinformatician / Computational Scientist",
    checkingArea: "Bioinformatics",
    description: "Computational screening, molecular docking and related analysis.",
  },
  pharmacology: {
    profession: "Pharmacologist",
    checkingArea: "Pharmacology",
    description: "Pharmacological evidence and biological interpretation.",
  },
  formulation: {
    profession: "Pharmacist / Pharmaceutical Scientist",
    checkingArea: "Formulation",
    description: "Formulation and pharmaceutical assessment.",
  },
  clinical_safety: {
    profession: "Physician / Clinical Pharmacist",
    checkingArea: "Clinical Safety",
    description: "Clinical safety and risk assessment.",
  },
};

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const [projectRows]: any = await pool.query(
      `
      SELECT
        rp.id as projectId,
        rp.title,
        rp.shortDescription,
        rp.researchObjective,
        rp.currentStage,
        rp.status as projectStatus,
        rp.createdAt,
        rp.updatedAt,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Botanical Subject') as plantName,
        p.scientificName as plantScientificName,
        p.category as plantCategory,
        u.id as researcherId,
        u.name as researcherName,
        u.email as researcherEmail
      FROM research_projects rp
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ?
      `,
      [projectId]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectRows[0];

    const [subRows]: any = await pool.query(
      `
      SELECT
        id as submissionId,
        versionTag,
        reviewRound,
        messageToReviewers,
        status as submissionStatus,
        submittedAt
      FROM review_submissions
      WHERE projectId = ?
      ORDER BY reviewRound DESC, id DESC
      LIMIT 1
      `,
      [projectId]
    );

    const latestSubmission = subRows[0] || null;

    const [assignments]: any = await pool.query(
      `
      SELECT
        ra.id as assignmentId,
        ra.projectId,
        ra.submissionId,
        ra.reviewerId,
        ra.specialtyNeeded,
        ra.status as assignmentStatus,
        ra.reviewRound,
        ra.assignedAt,
        ra.completedAt,
        pr.id as reviewId,
        pr.assessment,
        pr.comments as reviewComments,
        pr.status as formStatus,
        pr.checklistData,
        pr.submittedAt as reviewSubmittedAt,
        u_rev.name as reviewerName
      FROM review_assignments ra
      LEFT JOIN users u_rev ON ra.reviewerId = u_rev.id
      LEFT JOIN professional_reviews pr ON (
        pr.submissionId = ra.submissionId AND pr.areaKey = ra.specialtyNeeded
      )
      WHERE ra.projectId = ?
        AND ra.id IN (
          SELECT MAX(id)
          FROM review_assignments
          WHERE projectId = ?
          GROUP BY specialtyNeeded
        )
      `,
      [projectId, projectId]
    );

    const projectStageLevel = STAGE_ORDER[project.currentStage] || 1;

    const areas = EXPERT_REVIEW_AREAS.map((def, idx) => {
      const key = def.key;
      const config = AREA_CONFIG[key] || {
        profession: def.professionTitle,
        checkingArea: def.label,
        description: def.detail,
      };
      const requiredLevel = AREA_REQUIRED_STAGE[key] || 1;

      const match = assignments.find((a: any) => {
        const norm = normalizeReviewAreaKey(a.specialtyNeeded);
        return norm === key;
      });

      let status = "Not Ready";
      let isReady = false;
      let isCompleted = false;
      let actionLabel = "";
      let assignmentId = match ? match.assignmentId : null;

      if (match) {
        const raw = match.assignmentStatus;
        if (raw === "COMPLETED" || raw === "APPROVED") {
          status = "Approved";
          isReady = true;
          isCompleted = true;
          actionLabel = `View ${config.checkingArea} Review →`;
        } else if (raw === "IN_REVIEW") {
          status = "In Review";
          isReady = true;
          actionLabel = `Continue ${config.checkingArea} Review →`;
        } else if (raw === "REVISION_REQUIRED") {
          status = "Revision Requested";
          isReady = true;
          actionLabel = `Review ${config.checkingArea} Revision →`;
        } else if (raw === "RESUBMITTED") {
          status = "Revision Submitted";
          isReady = true;
          actionLabel = `Review ${config.checkingArea} Revision →`;
        } else {
          status = "Needs Review";
          isReady = true;
          actionLabel = `Start ${config.checkingArea} Review →`;
        }
      } else if (projectStageLevel >= requiredLevel || project.projectStatus === "COMPLETED") {
        if (project.projectStatus === "COMPLETED") {
          status = "Approved";
          isReady = true;
          isCompleted = true;
          actionLabel = `View ${config.checkingArea} Review →`;
        } else {
          status = "Needs Review";
          isReady = true;
          actionLabel = `Start ${config.checkingArea} Review →`;
        }
      } else {
        status = "Not Ready";
        isReady = false;
        isCompleted = false;
        actionLabel = "";
      }

      return {
        number: `0${idx + 1}`,
        key,
        profession: config.profession,
        checkingArea: config.checkingArea,
        description: config.description,
        status,
        isReady,
        isCompleted,
        assignmentId,
        actionLabel,
        actionUrl: `/reviewer/checking/${key}?projectId=${projectId}${
          assignmentId ? `&assignmentId=${assignmentId}` : ""
        }`,
        assessment: match?.assessment || null,
        comments: match?.reviewComments || null,
        reviewerName: match?.reviewerName || (isCompleted ? "Scientific Review Board" : null),
        approvedAt: match?.completedAt || match?.reviewSubmittedAt || (isCompleted ? project.updatedAt : null),
      };
    });

    const stageFlowDefinitions = [
      {
        number: "01",
        stageNumber: 1,
        stageName: "Plant & Literature",
        professionalExpert: "Pharmacist / Pharmacognosist",
        expertise: "Pharmacognosy",
        areaKey: "pharmacognosy",
      },
      {
        number: "02",
        stageNumber: 2,
        stageName: "In-Silico Analysis",
        professionalExpert: "Bioinformatician / Computational Scientist",
        expertise: "Bioinformatics",
        areaKey: "bioinformatics",
      },
      {
        number: "03",
        stageNumber: 3,
        stageName: "Molecular Docking",
        professionalExpert: "Pharmacologist",
        expertise: "Pharmacology",
        areaKey: "pharmacology",
      },
      {
        number: "04",
        stageNumber: 4,
        stageName: "Formulation",
        professionalExpert: "Pharmacist / Pharmaceutical Scientist",
        expertise: "Formulation",
        areaKey: "formulation",
      },
      {
        number: "05",
        stageNumber: 5,
        stageName: "Safety / Clinical",
        professionalExpert: "Physician / Clinical Pharmacist",
        expertise: "Clinical Safety",
        areaKey: "clinical_safety",
      },
      {
        number: "06",
        stageNumber: 6,
        stageName: "Knowledge Integration",
        professionalExpert: "Pharmacist / Pharmacognosist",
        expertise: "Pharmacognosy",
        areaKey: "pharmacognosy",
      },
    ];

    const stages = stageFlowDefinitions.map((def) => {
      const match = assignments.find((a: any) => {
        const norm = normalizeReviewAreaKey(a.specialtyNeeded);
        return norm === def.areaKey;
      });

      let status: "APPROVED" | "IN_REVIEW" | "REVISION_REQUIRED" | "NOT_SUBMITTED" = "NOT_SUBMITTED";
      let statusLabel = "Not Submitted";
      let reviewerName: string | null = match?.reviewerName || null;
      let approvedAt: string | null = null;

      if (def.stageNumber === 6) {
        if (project.projectStatus === "COMPLETED") {
          status = "APPROVED";
          statusLabel = "Approved";
          approvedAt = project.updatedAt;
        } else if (areas.every((a) => a.isCompleted)) {
          status = "APPROVED";
          statusLabel = "Approved";
          approvedAt = project.updatedAt;
        } else if (latestSubmission) {
          status = "IN_REVIEW";
          statusLabel = "In Review";
        } else {
          status = "NOT_SUBMITTED";
          statusLabel = "Not Submitted";
        }
      } else if (match) {
        const raw = match.assignmentStatus;
        if (
          raw === "COMPLETED" ||
          raw === "APPROVED" ||
          match.assessment === "ACCEPTABLE" ||
          project.projectStatus === "COMPLETED"
        ) {
          status = "APPROVED";
          statusLabel = "Approved";
          approvedAt = match.completedAt || match.reviewSubmittedAt || project.updatedAt;
        } else if (raw === "REVISION_REQUIRED" || match.assessment === "REVISIONS_REQUIRED") {
          status = "REVISION_REQUIRED";
          statusLabel = "Revision Required";
        } else if (raw === "IN_REVIEW" || raw === "RESUBMITTED") {
          status = "IN_REVIEW";
          statusLabel = "In Review";
        } else if (latestSubmission) {
          status = "IN_REVIEW";
          statusLabel = "In Review";
        } else {
          status = "NOT_SUBMITTED";
          statusLabel = "Not Submitted";
        }
      } else if (project.projectStatus === "COMPLETED") {
        status = "APPROVED";
        statusLabel = "Approved";
        approvedAt = project.updatedAt;
      } else {
        status = "NOT_SUBMITTED";
        statusLabel = "Not Submitted";
      }

      return {
        number: def.number,
        stageNumber: def.stageNumber,
        stageName: def.stageName,
        professionalExpert: def.professionalExpert,
        expertise: def.expertise,
        areaKey: def.areaKey,
        status,
        statusLabel,
        actionUrl: `/reviewer/checking/${def.areaKey}?projectId=${projectId}`,
        reviewerName,
        approvedAt,
      };
    });

    const completedCount = areas.filter((a) => a.isCompleted).length;
    let overallStatus = "In Scientific Review";
    if (completedCount === 5 || project.projectStatus === "COMPLETED") {
      overallStatus = "Completed";
    } else if (areas.some((a) => a.status === "Revision Requested" || a.status === "Revision Submitted")) {
      overallStatus = "Revision Requested";
    } else if (areas.some((a) => a.status === "In Review")) {
      overallStatus = "In Scientific Review";
    } else if (areas.some((a) => a.status === "Needs Review")) {
      overallStatus = "Needs Review";
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.projectId,
        title: project.title,
        shortDescription: project.shortDescription,
        researchObjective: project.researchObjective,
        currentStage: project.currentStage,
        plantName: project.plantName,
        plantScientificName: project.plantScientificName,
        plantFamily: (project.plantScientificName && PLANT_FAMILY_MAP[project.plantScientificName]) || null,
        researcherName: project.researcherName,
        researcherEmail: project.researcherEmail,
        cycle: latestSubmission?.reviewRound || 1,
        versionTag: latestSubmission?.versionTag || "v1.0",
        submittedAt: latestSubmission?.submittedAt || project.createdAt,
        updatedAt: project.updatedAt,
        overallStatus,
        completedReviewsCount: completedCount,
        totalRequiredReviews: 5,
        areas,
        stages,
      },
    });
  } catch (error) {
    console.error(`GET /api/reviewer/projects/${params} error:`, error);
    return NextResponse.json({ error: "Failed to load project review data" }, { status: 500 });
  }
}

