import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import InSilicoWorkspaceClient from "@/components/researcher/in-silico/InSilicoWorkspaceClient";

export const instant = false;

export default async function InSilicoStagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "RESEARCHER") {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) notFound();

  // Query project verifying ownership
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.id, rp.title, rp.currentStage, rp.status, rp.researchObjective, rp.researchQuestion,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.id = ? AND rp.researcherId = ?
    LIMIT 1
    `,
    [projectId, session.id]
  );

  if (projectRows.length === 0) {
    notFound();
  }

  const project = projectRows[0];

  // Fetch candidate compounds
  const [compounds]: any = await pool.query(
    `SELECT * FROM research_compounds WHERE projectId = ? ORDER BY id ASC`,
    [projectId]
  );

  // Fetch computational results
  const [results]: any = await pool.query(
    `
    SELECT ir.*, rc.molecularFormula, rc.molecularWeight, rc.smiles as compoundSmiles
    FROM insilico_results ir
    LEFT JOIN research_compounds rc ON ir.compoundId = rc.id
    WHERE ir.projectId = ?
    ORDER BY ir.id DESC
    `,
    [projectId]
  );

  // Fetch researcher interpretation
  const [synthesisRows]: any = await pool.query(
    `SELECT * FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1`,
    [projectId]
  );

  const synthesis = synthesisRows[0] || {
    projectId,
    keyFindings: "",
    potentialLimitations: "",
    selectionRationale: "",
    compoundsForDocking: "",
    engineLimitationNotes: "",
    additionalNotes: "",
    status: "IN_PROGRESS",
  };

  // Fetch supporting literature references
  const [literature]: any = await pool.query(
    `
    SELECT id, title, authors, year, journalSource, doiOrUrl, pubmedId,
           plantOrCompound, keyFindings, relevanceToCurrentResearch
    FROM literature_references
    WHERE projectId = ?
    ORDER BY id DESC
    `,
    [projectId]
  );

  return (
    <InSilicoWorkspaceClient
      projectId={projectId}
      project={project}
      initialCompounds={compounds}
      initialResults={results}
      initialSynthesis={synthesis}
      initialLiterature={literature}
    />
  );
}
