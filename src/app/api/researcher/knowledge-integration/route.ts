import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [proposals]: any = await pool.query(
      `
      SELECT kp.*, rp.title as projectTitle, p.commonName as plantName
      FROM knowledge_proposals kp
      LEFT JOIN research_projects rp ON kp.projectId = rp.id
      LEFT JOIN plants p ON kp.plantId = p.id
      WHERE kp.researcherId = ?
      ORDER BY kp.createdAt DESC
      `,
      [session.id]
    );

    return NextResponse.json({ success: true, proposals });
  } catch (error) {
    console.error("Global knowledge proposals error:", error);
    return NextResponse.json({ error: "Failed to load knowledge proposals" }, { status: 500 });
  }
}
