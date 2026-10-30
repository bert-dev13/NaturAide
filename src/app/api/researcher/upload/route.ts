import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 400 });
    }

    // Allowed extensions
    const ext = path.extname(file.name).toLowerCase();
    const allowed = [".pdf", ".txt", ".csv", ".tsv", ".pdb", ".mol2", ".sdf", ".png", ".jpg", ".jpeg", ".docx", ".zip"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({
        error: `Invalid file type. Allowed: ${allowed.join(", ")}`,
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads", "research");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const baseName = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80) || "file";
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${baseName}${ext}`;
    const filePath = path.join(uploadDir, safeName);
    if (path.dirname(filePath) !== uploadDir) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }
    fs.writeFileSync(filePath, buffer);

    // Served only through the authenticated /uploads/research/* middleware gate.
    const publicUrl = `/uploads/research/${safeName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
