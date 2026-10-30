import pool from "./db";
import {
  REGULATORY_VERIFICATION_METHODS,
  type RegulatoryVerificationMethod,
  type RegulatoryVerificationStatus,
} from "./regulatory-verification";

export interface RegulatoryProductSummary {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  manufacturer: string;
  imageUrl?: string | null;
  imagePath?: string | null;
  imageType?: string | null;
  imageVerified?: boolean;
  regulatoryId: number | null;
  registrationNumber: string | null;
  regulatoryAgency: string | null;
  registrationStatus: string | null;
  classification: string | null;
  verificationStatus: RegulatoryVerificationStatus;
  verifiedAt: string | null;
  verifiedBy: number | null;
}

export interface RegulatoryVerificationHistoryItem {
  id: number;
  previousStatus: string | null;
  status: RegulatoryVerificationStatus;
  method: string;
  notes: string | null;
  registrationNumberMatches: boolean;
  productNameMatches: boolean;
  manufacturerMatches: boolean;
  regulatoryInformationMatches: boolean;
  verifiedByName: string;
  verifiedAt: string;
}

export interface RegulatoryProductDetail {
  id: string;
  slug: string;
  name: string;
  manufacturer: string;
  imageUrl?: string | null;
  imagePath?: string | null;
  imageType?: string | null;
  imageSource?: string | null;
  imageSourceUrl?: string | null;
  imageVerified?: boolean;
  imageVerifiedAt?: string | null;
  regulatoryId: number | null;
  registrationNumber: string | null;
  regulatoryAgency: string | null;
  registrationStatus: string | null;
  classification: string | null;
  verificationSource: string | null;
  verificationUrl: string | null;
  verificationStatus: RegulatoryVerificationStatus;
  verifiedAt: string | null;
  verifiedBy: number | null;
  verificationMethod: string | null;
  verificationNotes: string | null;
  history: RegulatoryVerificationHistoryItem[];
}

export interface VerificationSubmission {
  status: RegulatoryVerificationStatus;
  method: RegulatoryVerificationMethod;
  notes: string | null;
  registrationNumberMatches: boolean;
  productNameMatches: boolean;
  manufacturerMatches: boolean;
  regulatoryInformationMatches: boolean;
}

const STATUSES = new Set<RegulatoryVerificationStatus>(["UNVERIFIED", "VERIFIED", "NEEDS_REVERIFICATION"]);

export async function ensureRegulatoryVerificationSchema(): Promise<void> {
  const [columns]: any = await pool.query("SHOW COLUMNS FROM product_regulatory_records");
  const names = new Set(columns.map((column: { Field: string }) => column.Field));
  if (!names.has("verification_notes")) {
    await pool.query("ALTER TABLE product_regulatory_records ADD COLUMN verification_notes TEXT NULL");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_regulatory_verification_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      regulatory_record_id INT NOT NULL,
      product_id VARCHAR(191) NOT NULL,
      previous_status VARCHAR(50) NULL,
      previous_verified_at DATETIME(3) NULL,
      previous_verified_by INT NULL,
      previous_verification_method VARCHAR(100) NULL,
      previous_verification_notes TEXT NULL,
      verification_status ENUM('UNVERIFIED', 'VERIFIED', 'NEEDS_REVERIFICATION') NOT NULL,
      verification_method VARCHAR(100) NOT NULL,
      verification_notes TEXT NULL,
      registration_number_matches TINYINT(1) NOT NULL DEFAULT 0,
      product_name_matches TINYINT(1) NOT NULL DEFAULT 0,
      manufacturer_matches TINYINT(1) NOT NULL DEFAULT 0,
      regulatory_information_matches TINYINT(1) NOT NULL DEFAULT 0,
      verified_by INT NOT NULL,
      verified_at DATETIME(3) NOT NULL,
      KEY idx_reg_history_product (product_id),
      KEY idx_reg_history_record (regulatory_record_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function asStatus(value: unknown): RegulatoryVerificationStatus {
  const status = String(value || "").trim().toUpperCase();
  return status === "VERIFIED" || status === "NEEDS_REVERIFICATION" ? status : "UNVERIFIED";
}

function asIso(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function listRegulatoryProducts(): Promise<RegulatoryProductSummary[]> {
  await ensureRegulatoryVerificationSchema();
  const [rows]: any = await pool.query(`
    SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer,
           hp.imageUrl, hp.image_path AS imagePath, hp.image_type AS imageType, hp.image_verified AS imageVerified,
           prr.id AS regulatoryId, prr.registrationNumber, prr.regulatoryAgency,
           prr.registrationStatus, prr.classification, prr.verification_status, prr.verified_at, prr.verified_by
    FROM herbal_products hp
    LEFT JOIN product_regulatory_records prr ON prr.id = (
      SELECT pr2.id FROM product_regulatory_records pr2
      WHERE pr2.productId = hp.id
      ORDER BY pr2.id DESC
      LIMIT 1
    )
    ORDER BY hp.name ASC
  `);

  return rows.map((row: any) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandName: row.brandName,
    manufacturer: row.manufacturer,
    regulatoryId: row.regulatoryId ?? null,
    registrationNumber: row.registrationNumber ?? null,
    regulatoryAgency: row.regulatoryAgency ?? null,
    registrationStatus: row.registrationStatus ?? null,
    classification: row.classification ?? null,
    verificationStatus: asStatus(row.verification_status),
    verifiedAt: asIso(row.verified_at),
    verifiedBy: row.verified_by ?? null,
    imageUrl: row.imageUrl ?? null,
    imagePath: row.imagePath ?? null,
    imageType: row.imageType ?? null,
    imageVerified: Boolean(row.imageVerified),
  }));
}

export async function getRegulatoryProduct(slug: string): Promise<RegulatoryProductDetail | null> {
  await ensureRegulatoryVerificationSchema();
  const [rows]: any = await pool.query(
    `SELECT hp.id, hp.slug, hp.name, hp.manufacturer,
            hp.imageUrl, hp.image_path AS imagePath, hp.image_type AS imageType, hp.image_verified AS imageVerified,
            hp.image_source AS imageSource, hp.image_source_url AS imageSourceUrl, hp.image_verified_at AS imageVerifiedAt,
            prr.id AS regulatoryId, prr.registrationNumber, prr.regulatoryAgency,
            prr.registrationStatus, prr.classification, prr.verificationSource, prr.verificationUrl,
            prr.verification_status, prr.verified_at, prr.verified_by, prr.verification_method, prr.verification_notes
     FROM herbal_products hp
     LEFT JOIN product_regulatory_records prr ON prr.id = (
       SELECT pr2.id FROM product_regulatory_records pr2
       WHERE pr2.productId = hp.id
       ORDER BY pr2.id DESC
       LIMIT 1
     )
     WHERE hp.slug = ? OR hp.id = ?
     LIMIT 1`,
    [slug, slug]
  );
  if (!rows.length) return null;
  const row = rows[0];
  const [historyRows]: any = await pool.query(
    `SELECT h.id, h.previous_status, h.verification_status, h.verification_method, h.verification_notes,
            h.registration_number_matches, h.product_name_matches, h.manufacturer_matches,
            h.regulatory_information_matches, h.verified_at, u.name AS verifierName
     FROM product_regulatory_verification_history h
     LEFT JOIN users u ON u.id = h.verified_by
     WHERE h.product_id = ?
     ORDER BY h.verified_at DESC, h.id DESC`,
    [row.id]
  );

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    manufacturer: row.manufacturer,
    regulatoryId: row.regulatoryId ?? null,
    registrationNumber: row.registrationNumber ?? null,
    regulatoryAgency: row.regulatoryAgency ?? null,
    registrationStatus: row.registrationStatus ?? null,
    classification: row.classification ?? null,
    verificationSource: row.verificationSource ?? null,
    verificationUrl: row.verificationUrl ?? null,
    verificationStatus: asStatus(row.verification_status),
    verifiedAt: asIso(row.verified_at),
    verifiedBy: row.verified_by ?? null,
    verificationMethod: row.verification_method ?? null,
    verificationNotes: row.verification_notes ?? null,
    imageUrl: row.imageUrl ?? null,
    imagePath: row.imagePath ?? null,
    imageType: row.imageType ?? null,
    imageSource: row.imageSource ?? null,
    imageSourceUrl: row.imageSourceUrl ?? null,
    imageVerified: Boolean(row.imageVerified),
    imageVerifiedAt: asIso(row.imageVerifiedAt),
    history: historyRows.map((item: any) => ({
      id: item.id,
      previousStatus: item.previous_status ?? null,
      status: asStatus(item.verification_status),
      method: item.verification_method,
      notes: item.verification_notes ?? null,
      registrationNumberMatches: Boolean(item.registration_number_matches),
      productNameMatches: Boolean(item.product_name_matches),
      manufacturerMatches: Boolean(item.manufacturer_matches),
      regulatoryInformationMatches: Boolean(item.regulatory_information_matches),
      verifiedByName: item.verifierName || "Recorded reviewer",
      verifiedAt: asIso(item.verified_at) || new Date(0).toISOString(),
    })),
  };
}

export function parseVerificationSubmission(body: unknown): { submission: VerificationSubmission } | { error: string } {
  if (!body || typeof body !== "object") return { error: "The verification could not be read." };
  const input = body as Record<string, unknown>;
  const status = String(input.status || "").trim().toUpperCase() as RegulatoryVerificationStatus;
  const method = String(input.method || "").trim() as RegulatoryVerificationMethod;
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  const checks = {
    registrationNumberMatches: input.registrationNumberMatches === true,
    productNameMatches: input.productNameMatches === true,
    manufacturerMatches: input.manufacturerMatches === true,
    regulatoryInformationMatches: input.regulatoryInformationMatches === true,
  };

  if (!STATUSES.has(status)) return { error: "Choose a verification status." };
  if (!REGULATORY_VERIFICATION_METHODS.includes(method)) return { error: "Choose a verification method." };
  if (notes.length > 2000) return { error: "Reviewer notes must be 2000 characters or fewer." };
  if (
    status === "VERIFIED" &&
    (!checks.registrationNumberMatches || !checks.productNameMatches || !checks.manufacturerMatches || !checks.regulatoryInformationMatches)
  ) {
    return { error: "VERIFIED is available only after every required check is confirmed." };
  }

  return {
    submission: {
      status,
      method,
      notes: notes || null,
      ...checks,
    },
  };
}

export async function recordRegulatoryVerification(
  slug: string,
  reviewerId: number,
  submission: VerificationSubmission
): Promise<{ ok: true } | { error: string }> {
  await ensureRegulatoryVerificationSchema();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows]: any = await connection.query(
      `SELECT prr.id, prr.productId, prr.registrationNumber, prr.verification_status, prr.verified_at,
              prr.verified_by, prr.verification_method, prr.verification_notes
       FROM product_regulatory_records prr
       JOIN herbal_products hp ON hp.id = prr.productId
       WHERE hp.slug = ? OR hp.id = ?
       ORDER BY prr.id DESC
       LIMIT 1
       FOR UPDATE`,
      [slug, slug]
    );
    if (!rows.length) {
      await connection.rollback();
      return { error: "This product has no regulatory record to verify." };
    }

    const current = rows[0];
    if (submission.status === "VERIFIED" && !String(current.registrationNumber || "").trim()) {
      await connection.rollback();
      return { error: "A registration number must already be recorded before this product can be marked verified." };
    }

    await connection.query(
      `INSERT INTO product_regulatory_verification_history (
         regulatory_record_id, product_id, previous_status, previous_verified_at, previous_verified_by,
         previous_verification_method, previous_verification_notes, verification_status, verification_method,
         verification_notes, registration_number_matches, product_name_matches, manufacturer_matches,
         regulatory_information_matches, verified_by, verified_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
      [
        current.id,
        current.productId,
        current.verification_status || "UNVERIFIED",
        current.verified_at,
        current.verified_by,
        current.verification_method,
        current.verification_notes,
        submission.status,
        submission.method,
        submission.notes,
        submission.registrationNumberMatches ? 1 : 0,
        submission.productNameMatches ? 1 : 0,
        submission.manufacturerMatches ? 1 : 0,
        submission.regulatoryInformationMatches ? 1 : 0,
        reviewerId,
      ]
    );

    if (submission.status === "VERIFIED") {
      await connection.query(
        `UPDATE product_regulatory_records
         SET verification_status = 'VERIFIED',
             verified_at = CURRENT_TIMESTAMP(3),
             verified_by = ?,
             verification_method = ?,
             verification_notes = ?
         WHERE id = ?`,
        [reviewerId, submission.method, submission.notes, current.id]
      );
    } else {
      await connection.query(
        `UPDATE product_regulatory_records
         SET verification_status = ?,
             verified_at = NULL,
             verified_by = NULL,
             verification_method = ?,
             verification_notes = ?
         WHERE id = ?`,
        [submission.status, submission.method, submission.notes, current.id]
      );
    }

    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback();
    console.error("Regulatory verification failed:", error);
    return { error: "The verification could not be saved." };
  } finally {
    connection.release();
  }
}

export async function readRegulatoryAuditSnapshot(productId: string): Promise<{
  verification_status: RegulatoryVerificationStatus;
  verified_at: Date | string | null;
  verified_by: number | null;
  verification_method: string | null;
  verification_notes: string | null;
} | null> {
  await ensureRegulatoryVerificationSchema();
  const [rows]: any = await pool.query(
    `SELECT verification_status, verified_at, verified_by, verification_method, verification_notes
     FROM product_regulatory_records
     WHERE productId = ?
     ORDER BY id DESC
     LIMIT 1`,
    [productId]
  );
  if (!rows.length) return null;
  return {
    verification_status: asStatus(rows[0].verification_status),
    verified_at: rows[0].verified_at ?? null,
    verified_by: rows[0].verified_by ?? null,
    verification_method: rows[0].verification_method ?? null,
    verification_notes: rows[0].verification_notes ?? null,
  };
}
