import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import ResearcherAssistantClient from "@/components/researcher/assistant/ResearcherAssistantClient";
import { Loader2 } from "lucide-react";

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
  }> = [];

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT rp.id, rp.title, rp.status, rp.currentStage,
              COALESCE(p.commonName, rp.plantCustomName, 'Medicinal Plant') as plantName,
              p.scientificName as plantScientificName
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
    }));
  } catch (err) {
    console.error("[ResearcherAssistantPage] Failed to prefetch projects:", err);
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-[600px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-[#475550]">
            Initializing Ask NatureAide...
          </p>
        </div>
      }
    >
      <ResearcherAssistantClient initialProjects={initialProjects} />
    </Suspense>
  );
}
