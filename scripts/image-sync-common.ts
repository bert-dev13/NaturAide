import fs from "fs";
import path from "path";
import mysql, { Pool, RowDataPacket } from "mysql2/promise";

export const SYNC_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (NatureAide/1.0 Image Sync)";

const IMAGE_COLUMNS: Array<[string, string]> = [
  ["local_image_path", "VARCHAR(500) NULL"],
  ["image_path", "VARCHAR(500) NULL"],
  ["original_image_url", "VARCHAR(1000) NULL"],
  ["image_source", "VARCHAR(255) NULL"],
  ["image_source_url", "VARCHAR(1000) NULL"],
  ["image_author", "VARCHAR(500) NULL"],
  ["image_license", "VARCHAR(255) NULL"],
  ["image_attribution", "TEXT NULL"],
  ["image_verified", "TINYINT(1) NOT NULL DEFAULT 0"],
  ["image_verified_at", "DATETIME(3) NULL"],
];

export function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    if (!process.env[key]) process.env[key] = trimmed.slice(idx + 1).trim();
  }
}

export function createPool(): Pool {
  loadEnv();
  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "natureaide_db",
    connectTimeout: 10000,
  });
}

export async function ensureImageColumns(pool: Pool, table: "plants" | "herbal_products"): Promise<void> {
  const [columns] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM ${table}`);
  const names = new Set(columns.map((column) => String(column.Field)));
  for (const [name, definition] of IMAGE_COLUMNS) {
    if (!names.has(name)) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    }
  }
}

export type ImageRecord = {
  localPath: string;
  originalUrl: string | null;
  source: string;
  sourceUrl?: string | null;
  author: string | null;
  license: string | null;
  attribution: string;
  verified?: boolean;
  verifiedAt: Date | null;
};

export async function saveImageRecord(
  pool: Pool,
  table: "plants" | "herbal_products",
  id: string,
  image: ImageRecord
): Promise<void> {
  if (table === "herbal_products") {
    await pool.query(
      `UPDATE herbal_products
       SET imageUrl = ?,
           local_image_path = ?,
           image_path = ?,
           original_image_url = ?,
           image_source = ?,
           image_source_url = ?,
           image_author = ?,
           image_license = ?,
           image_attribution = ?,
           image_verified = ?,
           image_verified_at = ?
       WHERE id = ?`,
      [
        image.localPath,
        image.localPath,
        image.localPath,
        image.originalUrl,
        image.source,
        image.sourceUrl ?? null,
        image.author,
        image.license,
        image.attribution,
        (image.verified !== undefined ? image.verified : (image.verifiedAt !== null && !image.localPath.includes('placeholder'))) ? 1 : 0,
        image.verifiedAt,
        id,
      ]
    );
  } else {
    await pool.query(
      `UPDATE plants
       SET imageUrl = ?,
           local_image_path = ?,
           image_path = ?,
           original_image_url = ?,
           image_source = ?,
           image_source_url = ?,
           image_author = ?,
           image_license = ?,
           image_attribution = ?,
           image_verified = ?,
           image_verified_at = ?
       WHERE id = ?`,
      [
        image.localPath,
        image.localPath,
        image.localPath,
        image.originalUrl,
        image.source,
        image.sourceUrl ?? null,
        image.author,
        image.license,
        image.attribution,
        (image.verified !== undefined ? image.verified : (image.verifiedAt !== null && !image.localPath.includes('placeholder'))) ? 1 : 0,
        image.verifiedAt,
        id,
      ]
    );
  }
}

export function placeholderRecord(localPath: string, attribution: string): ImageRecord {
  return {
    localPath,
    originalUrl: null,
    source: localPath.includes("/products/") ? "NatureAide product placeholder" : "NatureAide botanical placeholder",
    sourceUrl: null,
    author: null,
    license: null,
    attribution,
    verified: false,
    verifiedAt: null,
  };
}

export function sniffImage(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }
  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}

export function imageSize(buffer: Buffer): { width: number; height: number } | null {
  const kind = sniffImage(buffer);
  if (kind === "png" && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (kind === "jpg") {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) return null;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  if (kind === "webp" && buffer.toString("ascii", 12, 16) === "VP8X" && buffer.length >= 30) {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  return null;
}

export async function downloadImage(url: string, referer?: string): Promise<Buffer | null> {
  const headers: Record<string, string> = {
    "User-Agent": SYNC_USER_AGENT,
    Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
  };
  if (referer) headers.Referer = referer;

  const response = await fetch(url, {
    headers,
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) return null;
  const type = response.headers.get("content-type") || "";
  if (type && !type.startsWith("image/") && !type.includes("octet-stream")) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!sniffImage(buffer) || buffer.length < 5000 || buffer.length > 12_000_000) return null;
  return buffer;
}

export function writeCachedImage(folder: "plants" | "products", slug: string, buffer: Buffer): string | null {
  const ext = sniffImage(buffer);
  if (!ext) return null;
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!safeSlug) return null;
  const directory = path.join(process.cwd(), "public", "images", folder);
  fs.mkdirSync(directory, { recursive: true });
  for (const oldExt of ["jpg", "jpeg", "png", "webp"]) {
    const oldPath = path.join(directory, `${safeSlug}.${oldExt}`);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  fs.writeFileSync(path.join(directory, `${safeSlug}.${ext}`), buffer);
  return `/images/${folder}/${safeSlug}.${ext}`;
}

export function clearCachedImage(folder: "plants" | "products", slug: string): void {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const directory = path.join(process.cwd(), "public", "images", folder);
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const filePath = path.join(directory, `${safeSlug}.${ext}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchText(url: string, referer?: string): Promise<{ url: string; html: string } | null> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const headers: Record<string, string> = {
      "User-Agent": SYNC_USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
    };
    if (referer) headers.Referer = referer;
    try {
      const response = await fetch(url, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
      });
      if (response.status === 429 || response.status === 503) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      if (!response.ok) return null;
      const type = response.headers.get("content-type") || "";
      if (type && !type.includes("html") && !type.includes("json") && !type.includes("text")) return null;
      return { url: response.url, html: await response.text() };
    } catch {
      await sleep(500 * (attempt + 1));
    }
  }
  return null;
}
