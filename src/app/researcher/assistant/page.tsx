import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import ResearcherAssistantClient from "@/components/researcher/assistant/ResearcherAssistantClient";
import AssistantLoadingFallback from "@/components/researcher/assistant/AssistantLoadingFallback";

export const metadata = {
  title: "Ask NatureAide — AI Research Assistant | NaturAide Lab",
  description:
    "AI research assistant grounded in empirical plant literature, in-silico screening, molecular docking, formulation safety, and peer review dossiers.",
};

export const instant = false;

export default async function ResearcherAssistantPage() {
  const session = await getSession();
  if (!session || session.role !== "RESEARCHER") {
    redirect("/login?redirect=/researcher/assistant");
  }

  // Pre-fetch initial projects for immediate dropdown availability
  let initialProjects: Array<{
    id: number;
    title: string;
    status: string;
    currentStage: string;
    plantName: string;
    plantScientificName?: string | null;
    hasManuscript?: boolean;
    manuscriptFileName?: string | null;
  }> = [];

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT rp.id, rp.title, rp.status, rp.currentStage,
              COALESCE(p.commonName, rp.plantCustomName, 'Medicinal Plant') as plantName,
              p.scientificName as plantScientificName,
              (
                SELECT rm.fileName
                FROM research_manuscripts rm
                WHERE rm.projectId = rp.id
                ORDER BY rm.id DESC
                LIMIT 1
              ) as manuscriptFileName,
              (
                SELECT COUNT(*)
                FROM research_manuscripts rm
                WHERE rm.projectId = rp.id AND (rm.fileName IS NOT NULL OR rm.storagePath IS NOT NULL)
              ) > 0 as hasManuscript
       FROM research_projects rp
       LEFT JOIN plants p ON rp.plantId = p.id
       WHERE rp.researcherId = ?
       ORDER BY rp.updatedAt DESC`,
      [session.id]
    );

    initialProjects = (rows || []).map((r) => ({
      id: Number(r.id),
      title: String(r.title || "Untitled Project"),
      status: String(r.status || "DRAFT"),
      currentStage: String(r.currentStage || "plant-literature"),
      plantName: String(r.plantName || "Medicinal Plant"),
      plantScientificName: r.plantScientificName ? String(r.plantScientificName) : null,
      hasManuscript: Boolean(r.hasManuscript),
      manuscriptFileName: r.manuscriptFileName ? String(r.manuscriptFileName) : null,
    }));
  } catch (err) {
    console.error("[ResearcherAssistantPage] Failed to prefetch projects:", err);
  }

  return (
    <Suspense fallback={<AssistantLoadingFallback />}>
      <ResearcherAssistantClient initialProjects={initialProjects} />
    </Suspense>
  );
}
