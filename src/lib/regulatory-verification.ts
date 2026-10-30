export const FDA_VERIFICATION_PORTAL_URL = "https://verification.fda.gov.ph/";

export const REGULATORY_VERIFICATION_DISCLAIMER =
  "NaturAide verification means this regulatory information was checked against the official source. It does not mean NaturAide, the FDA, or the reviewer endorses the product’s effectiveness.";

export const REGULATORY_VERIFICATION_METHODS = [
  "FDA Philippines Verification Portal",
  "Official manufacturer record",
  "Official regulatory source",
] as const;

export type RegulatoryVerificationMethod = (typeof REGULATORY_VERIFICATION_METHODS)[number];

export type RegulatoryVerificationStatus = "UNVERIFIED" | "VERIFIED" | "NEEDS_REVERIFICATION";

export interface RegulatoryRecordFields {
  regulatoryAgency?: string | null;
  registrationNumber?: string | null;
  registrationStatus?: string | null;
  classification?: string | null;
  verification_status?: string | null;
  verified_at?: string | Date | null;
  verified_by?: number | string | null;
  verification_method?: string | null;
}

export interface RegulatoryAudit {
  status: RegulatoryVerificationStatus;
  isVerified: boolean;
  verifiedAt: Date | null;
}

export function getRegulatoryAudit(record: RegulatoryRecordFields | null | undefined): RegulatoryAudit {
  const raw = String(record?.verification_status || "").trim().toUpperCase();
  const status: RegulatoryVerificationStatus =
    raw === "VERIFIED" || raw === "NEEDS_REVERIFICATION" ? raw : "UNVERIFIED";

  const reviewer = record?.verified_by;
  const hasReviewer = reviewer !== null && reviewer !== undefined && String(reviewer).trim() !== "";
  const parsed = record?.verified_at ? new Date(record.verified_at) : null;
  const verifiedAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  const isVerified = status === "VERIFIED" && hasReviewer && Boolean(verifiedAt);

  return {
    status,
    isVerified,
    verifiedAt: isVerified ? verifiedAt : null,
  };
}

export function communityVerificationMessage(audit: RegulatoryAudit): { title: string; verifiedAt: Date | null } {
  if (audit.isVerified && audit.verifiedAt) {
    return { title: "Regulatory Record Verified", verifiedAt: audit.verifiedAt };
  }
  if (audit.status === "NEEDS_REVERIFICATION") {
    return { title: "Regulatory information requires re-verification", verifiedAt: null };
  }
  return { title: "Not yet checked by NaturAide", verifiedAt: null };
}
