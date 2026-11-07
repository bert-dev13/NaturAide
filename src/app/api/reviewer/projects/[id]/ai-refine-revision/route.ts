import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { callTogetherChat } from "@/lib/ai/together-provider";

export async function POST(
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

    const body = await request.json();
    const {
      rawComment,
      rawRecommendation = "",
      sectionName = "Section 1 · Formulation R&D",
      areaKey = "formulation",
      mode = "polish", // 'polish' | 'structure' | 'monograph' | 'clarity'
    } = body;

    if (!rawComment || typeof rawComment !== "string" || !rawComment.trim()) {
      return NextResponse.json(
        { error: "Reviewer comment or observation is required for AI assistance." },
        { status: 400 }
      );
    }

    // Retrieve project context
    let plantName = "Botanical Subject";
    let projectTitle = "Natural Product Research Project";
    try {
      const [pRows]: any = await pool.query(
        `SELECT rp.title, COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName
         FROM research_projects rp
         LEFT JOIN plants p ON rp.plantId = p.id
         WHERE rp.id = ?`,
        [projectId]
      );
      if (pRows && pRows.length > 0) {
        plantName = pRows[0].plantName || plantName;
        projectTitle = pRows[0].title || projectTitle;
      }
    } catch (e) {
      // Non-fatal
    }

    // Attempt Together AI Completion
    const systemPrompt = `You are a Senior Peer Reviewer and Scientific Evaluation Editor for NatureAide, specializing in natural product pharmacognosy, in-silico bioinformatics (AutoDock Vina, ADMET), and pharmaceutical formulation quality control.
Your role is to help the Reviewer polish, organize, and elevate their review comments and revision recommendations for a submitted research dossier.
The subject is: "${plantName}" (${projectTitle}).
Target Section: "${sectionName}" (Discipline: ${areaKey}).

Instructions based on mode:
- Mode 'polish': Enhance the language into objective, professional peer-review prose.
- Mode 'structure': Break down observations into numbered, actionable revision requirements with clear acceptance criteria.
- Mode 'monograph': Align findings with standardized pharmacopeial / computational standards (e.g. ICH Q2/Q6A, USP/BP topical monographs, Lipinski Rule of 5, AutoDock Vina RMSD < 2.0 Å).
- Mode 'clarity': Make instructions concise, removing ambiguity so the researcher knows exactly what to fix.

Return a JSON object with:
{
  "refinedComment": "Polished scientific observation explaining the finding or deficit",
  "refinedRecommendation": "Numbered actionable steps the researcher must implement",
  "suggestedSeverity": "CRITICAL" | "MAJOR" | "MINOR" | "INFORMATIONAL",
  "acceptanceCriteria": ["Criterion 1", "Criterion 2"]
}`;

    const userPrompt = `Reviewer Draft Comment:\n"${rawComment.trim()}"\n\nReviewer Initial Recommendation (if any):\n"${(rawRecommendation || "").trim()}"\n\nAssist Mode: ${mode}. Refine and structure this scientific feedback.`;

    let aiOutput: any = null;

    try {
      const togetherRes = await callTogetherChat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        { temperature: 0.2, maxTokens: 800, json: true }
      );

      if (togetherRes.success && togetherRes.content) {
        try {
          aiOutput = JSON.parse(togetherRes.content);
        } catch {
          // If JSON parsing fails, extract fields or treat text as refinedComment
          aiOutput = {
            refinedComment: togetherRes.content,
            refinedRecommendation: "1. Address reviewer observations with empirical data or literature backing.\n2. Resubmit updated research snapshot.",
            suggestedSeverity: "MAJOR",
            acceptanceCriteria: ["Compliance with monograph specifications", "Complete documentation update"],
          };
        }
      }
    } catch (aiErr) {
      console.warn("Together AI request failed, utilizing smart scientific fallback refiner:", aiErr);
    }

    // Smart Rule-Based Fallback if Together AI returned nothing or was unconfigured
    if (!aiOutput || !aiOutput.refinedComment) {
      aiOutput = generateSmartFallbackRevision(rawComment, rawRecommendation, sectionName, areaKey, mode, plantName);
    }

    return NextResponse.json({
      success: true,
      ...aiOutput,
    });
  } catch (error: any) {
    console.error("POST /api/reviewer/projects/[id]/ai-refine-revision error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate AI revision assistance" },
      { status: 500 }
    );
  }
}

function generateSmartFallbackRevision(
  rawComment: string,
  rawRec: string,
  sectionName: string,
  areaKey: string,
  mode: string,
  plantName: string
) {
  const trimmed = rawComment.trim();
  const lower = trimmed.toLowerCase();

  let severity = "MAJOR";
  if (lower.includes("typo") || lower.includes("spelling") || lower.includes("format")) {
    severity = "MINOR";
  } else if (lower.includes("safety") || lower.includes("fail") || lower.includes("toxic") || lower.includes("critical")) {
    severity = "CRITICAL";
  } else if (lower.includes("note") || lower.includes("suggest") || lower.includes("optional")) {
    severity = "INFORMATIONAL";
  }

  let polished = trimmed;
  let actionRec = rawRec.trim();

  if (mode === "structure") {
    polished = `Upon multidisciplinary inspection of ${sectionName} for ${plantName}, the submitted dossier exhibits the following scientific observations: ${trimmed}`;
    actionRec = [
      `1. Document and resolve the identified parameter discrepancy: ${trimmed.slice(0, 80)}...`,
      `2. Validate empirical release parameters against target pharmacopeial or in-silico benchmarks.`,
      `3. Update the revision summary with cross-referenced laboratory or computational methodology notes.`,
    ].join("\n");
  } else if (mode === "monograph") {
    polished = `Technical evaluation indicates that the submitted ${sectionName} data requires alignment with standardized monograph quality criteria (ICH Q6A / USP Specifications). Observation: ${trimmed}`;
    actionRec = [
      `1. Verify critical quality attributes (CQA) including pH window (5.5 – 6.5), rheological viscosity, and microbial limits.`,
      `2. Supply empirical assay validation or peer-reviewed literature corroborating extract yield and bioavailability.`,
      `3. Resubmit updated specification matrix for formal sign-off.`,
    ].join("\n");
  } else if (mode === "clarity") {
    polished = `Clarification Required: ${trimmed}. The current submission lacks unambiguous documentation for this parameter in ${sectionName}.`;
    actionRec = actionRec || `Please explicitly state the testing protocol, replicate values, and scientific rationale for the observed deviation.`;
  } else {
    // Default 'polish'
    polished = `Scientific Evaluation (${sectionName}): ${trimmed.charAt(0).toUpperCase() + trimmed.slice(1)}. Peer review recommends revising these data points to satisfy reproducibility and monograph reporting rigor.`;
    actionRec = actionRec || `1. Refine the dataset in accordance with the specified observation.\n2. Submit updated batch documentation and literature justification.`;
  }

  return {
    refinedComment: polished,
    refinedRecommendation: actionRec,
    suggestedSeverity: severity,
    acceptanceCriteria: [
      `Complete resolution of "${trimmed.slice(0, 40)}..."`,
      `Monograph and protocol compliance verified`,
      `Submission revision notes documented`,
    ],
  };
}

