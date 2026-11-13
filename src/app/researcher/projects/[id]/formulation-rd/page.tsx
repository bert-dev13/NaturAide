import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loadFormulationRdWorkspaceData } from "@/lib/formulation-rd-workspace-data";
import FormulationRdWorkspaceClient from "@/components/researcher/formulation-rd/FormulationRdWorkspaceClient";

export default async function FormulationRdPage({
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

  const sp = (await searchParams) || {};
  const initialStep = sp.step ? Math.min(6, Math.max(1, parseInt(sp.step, 10))) : 1;

  const data = await loadFormulationRdWorkspaceData(projectId);
  if (!data) notFound();

  // Researchers may only open their own projects
  if (session.role === "RESEARCHER") {
    const { default: pool } = await import("@/lib/db");
    const [own]: any = await pool.query(
      "SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
      [projectId, session.id]
    );
    if (!own.length) notFound();
  }

  return (
    <FormulationRdWorkspaceClient
      project={data.project}
      initialStep={initialStep}
      plantData={data.plantData}
      allPlants={data.allPlants}
      verifiedPlantDetails={data.verifiedPlantDetails}
      verifiedPhytochemicals={data.verifiedPhytochemicals}
      initialStudyCompoundNames={data.initialStudyCompoundNames}
      scientificLiterature={data.scientificLiterature}
      linkedLiterature={data.linkedLiterature}
      initialLinkedLiteratureIds={data.initialLinkedLiteratureIds}
      productSelection={data.productSelection}
      materials={data.materials}
      formulation={data.formulation}
      formulationVersions={data.formulationVersions}
      components={data.components}
      batches={data.batches}
    />
  );
}
