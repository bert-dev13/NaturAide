import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [notifications]: any = await pool.query(
      `SELECT * FROM review_notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 20`,
      [session.id]
    );

    const [unreadCount]: any = await pool.query(
      `SELECT COUNT(*) as count FROM review_notifications WHERE userId = ? AND isRead = 0`,
      [session.id]
    );

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: unreadCount[0]?.count || 0,
    });
  } catch (error) {
    console.error("Researcher notifications GET error:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await pool.query("UPDATE review_notifications SET isRead = 1 WHERE userId = ?", [session.id]);
    } else if (notificationId) {
      await pool.query("UPDATE review_notifications SET isRead = 1 WHERE id = ? AND userId = ?", [
        notificationId,
        session.id,
      ]);
    }

    return NextResponse.json({ success: true, message: "Notifications marked as read." });
  } catch (error) {
    console.error("Researcher notifications POST error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

