import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { calculateV2ProjectProgress } from "@/lib/v2-progress-service";
import {
  ensureManuscriptUploadColumns,
  getManuscriptRecord,
  getSection3CompiledContext,
} from "@/lib/manuscript-upload-service";
import { isIncompleteResearchSummary } from "@/lib/research-summary-utils";
import { getProjectProfessionalApprovalState } from "@/lib/research-approval-completion-service";
import ResearchPaperSubmissionClient from "@/components/researcher/submission/ResearchPaperSubmissionClient";

export default async function ResearchPaperSubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ step?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) notFound();

  await ensureManuscriptUploadColumns();

  const sp = (await searchParams) || {};
  const requestedStep = sp.step ? Math.min(3, Math.max(1, parseInt(sp.step, 10))) : null;

  // Load project
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.*,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.id = ? ${session.role === "RESEARCHER" ? "AND rp.researcherId = ?" : ""}
    LIMIT 1
    `,
    session.role === "RESEARCHER" ? [projectId, session.id] : [projectId]
  );

  if (projectRows.length === 0) notFound();
  const project = projectRows[0];

  // Compile Section 1 & Section 2 overview + saved AI interpretations
  const compiledOverview = await getSection3CompiledContext(projectId);

  // 1. Dossier / Research Summary (automatically compile & seed if not yet saved)
  let [dossierRows]: any = await pool.query(
    "SELECT * FROM research_dossiers WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  let dossier = dossierRows[0] || null;

  // Seed or upgrade stub/placeholder summaries with the full Sections 1–2 compiled dossier
  const needsCompiledSeed =
    !dossier ||
    isIncompleteResearchSummary(
      dossier?.executiveSummary,
      compiledOverview.compiledSummaryText
    );

  if (needsCompiledSeed && compiledOverview.compiledSummaryText?.trim()) {
    const autoCompiled = compiledOverview.compiledSummaryText;
    if (dossier) {
      await pool.query(
        "UPDATE research_dossiers SET executiveSummary = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ?",
        [autoCompiled, projectId]
      );
      dossier.executiveSummary = autoCompiled;
    } else {
      await pool.query(
        `INSERT INTO research_dossiers (projectId, researcherId, currentVersionTag, status, executiveSummary, createdAt, updatedAt)
         VALUES (?, ?, 'v1.0', 'DRAFT', ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
        [projectId, project.researcherId || session.id, autoCompiled]
      );
      const [refetched]: any = await pool.query(
        "SELECT * FROM research_dossiers WHERE projectId = ? LIMIT 1",
        [projectId]
      );
      dossier = refetched[0] || { executiveSummary: autoCompiled };
    }
  }

  // 2. Uploaded Research Paper / Manuscript metadata
  const manuscript = await getManuscriptRecord(projectId);

  // 3. Submission History (preserve previous submissions)
  let submissionHistory: any[] = [];
  try {
    const [subRows]: any = await pool.query(
      `SELECT id, versionTag, reviewRound, status, submittedAt, reviewedAt
       FROM review_submissions
       WHERE projectId = ?
       ORDER BY reviewRound DESC, id DESC`,
      [projectId]
    );
    submissionHistory = subRows || [];
  } catch {
    submissionHistory = [];
  }

  // 4. Calculate V2 Progress Checklist & Professional Approval State
  const [v2Progress, approvalState] = await Promise.all([
    calculateV2ProjectProgress(projectId),
    getProjectProfessionalApprovalState(projectId),
  ]);

  const initialStep = requestedStep ? Math.min(3, Math.max(1, requestedStep)) : 1;

  return (
    <ResearchPaperSubmissionClient
      project={project}
      initialStep={initialStep}
      dossier={dossier}
      manuscript={manuscript}
      compiledOverview={compiledOverview}
      submissionHistory={submissionHistory}
      v2Progress={v2Progress}
      initialApprovalState={approvalState}
    />
  );
}
