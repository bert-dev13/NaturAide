import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";


export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await pool.query(
      `SELECT c.id, c.title, c.projectId, c.createdAt, c.updatedAt,
              rp.title as projectTitle,
              COALESCE(p.commonName, rp.plantCustomName) as plantName
       FROM conversations c
       LEFT JOIN research_projects rp ON c.projectId = rp.id
       LEFT JOIN plants p ON rp.plantId = p.id
       WHERE c.userId = ? AND c.activeContextType = 'RESEARCH_PROJECT' AND c.isArchived = 0
       ORDER BY c.updatedAt DESC`,
      [session.id]
    );

    return NextResponse.json({
      success: true,
      conversations: rows || [],
    });
  } catch (error: any) {
    console.error("Error fetching researcher conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = (body.title || "New Research Chat").trim().slice(0, 100);
    const projectId = body.projectId ? parseInt(body.projectId, 10) : null;

    const [insertResult]: any = await pool.query(
      `INSERT INTO conversations (userId, title, projectId, activeContextType, isArchived)
       VALUES (?, ?, ?, 'RESEARCH_PROJECT', 0)`,
      [session.id, title, projectId]
    );

    return NextResponse.json({
      success: true,
      conversationId: insertResult.insertId,
      title,
      projectId,
    });
  } catch (error: any) {
    console.error("Error creating researcher conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
