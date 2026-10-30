import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, id } = body; // type: 'plant' | 'guide', id: string | number

    if (!type || !id) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (type === "plant") {
      const plantId = String(id);
      // Check if already saved
      const [existing]: any = await pool.query(
        "SELECT id FROM saved_plants WHERE userId = ? AND plantId = ?",
        [session.id, plantId]
      );

      if (existing.length > 0) {
        // Remove from saved
        await pool.query("DELETE FROM saved_plants WHERE userId = ? AND plantId = ?", [
          session.id,
          plantId,
        ]);
        return NextResponse.json({ success: true, saved: false, message: "Removed from saved plants" });
      } else {
        // Save
        await pool.query("INSERT INTO saved_plants (userId, plantId) VALUES (?, ?)", [
          session.id,
          plantId,
        ]);
        return NextResponse.json({ success: true, saved: true, message: "Saved to My Herbal Guide" });
      }
    } else if (type === "guide") {
      const guideId = parseInt(String(id), 10);
      const [existing]: any = await pool.query(
        "SELECT id FROM saved_preparation_guides WHERE userId = ? AND guideId = ?",
        [session.id, guideId]
      );

      if (existing.length > 0) {
        await pool.query(
          "DELETE FROM saved_preparation_guides WHERE userId = ? AND guideId = ?",
          [session.id, guideId]
        );
        return NextResponse.json({ success: true, saved: false, message: "Removed from saved guides" });
      } else {
        await pool.query(
          "INSERT INTO saved_preparation_guides (userId, guideId) VALUES (?, ?)",
          [session.id, guideId]
        );
        return NextResponse.json({ success: true, saved: true, message: "Preparation guide saved" });
      }
    } else if (type === "product") {
      const productId = String(id);
      const [existing]: any = await pool.query(
        "SELECT id FROM saved_products WHERE userId = ? AND productId = ?",
        [session.id, productId]
      );

      if (existing.length > 0) {
        await pool.query(
          "DELETE FROM saved_products WHERE userId = ? AND productId = ?",
          [session.id, productId]
        );
        return NextResponse.json({ success: true, saved: false, message: "Removed from saved products" });
      } else {
        await pool.query(
          "INSERT INTO saved_products (userId, productId) VALUES (?, ?)",
          [session.id, productId]
        );
        return NextResponse.json({ success: true, saved: true, message: "Product saved to My Herbal Guide" });
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Save/unsave error:", error);
    return NextResponse.json({ error: "Failed to update saved status" }, { status: 500 });
  }
}
