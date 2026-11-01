export type ReviewCanonicalStatus =
  | "NOT_SUBMITTED"
  | "NEEDS_REVIEW"
  | "IN_REVIEW"
  | "REVISION_REQUIRED"
  | "REVISION_RESUBMITTED"
  | "APPROVED";

export interface ReviewerActionsState {
  canApprove: boolean;
  canRequestRevision: boolean;
  isReadOnly: boolean;
  statusBadge: string;
  helperText?: string;
}

/**
 * Centrally determines the UI state and action button availability
 * for the Professional Reviewer interface.
 */
export function getReviewerActions(
  status: ReviewCanonicalStatus | string | null | undefined
): ReviewerActionsState {
  const norm = (status || "").toUpperCase();
  if (norm === "APPROVED" || norm === "ACCEPTABLE" || norm === "COMPLETED") {
    return {
      canApprove: false,
      canRequestRevision: false,
      isReadOnly: true,
      statusBadge: "Approved",
      helperText: "Professional review completed.",
    };
  }
  if (norm === "REVISION_REQUIRED" || norm === "REVISIONS_REQUESTED") {
    return {
      canApprove: false,
      canRequestRevision: false,
      isReadOnly: true,
      statusBadge: "Revision Required",
      helperText: "Waiting for researcher corrections.",
    };
  }
  if (norm === "REVISION_RESUBMITTED" || norm === "RESUBMITTED") {
    return {
      canApprove: true,
      canRequestRevision: true,
      isReadOnly: false,
      statusBadge: "Revision Resubmitted",
      helperText: "Researcher corrections are ready for re-review.",
    };
  }
  if (norm === "NOT_SUBMITTED") {
    return {
      canApprove: false,
      canRequestRevision: false,
      isReadOnly: true,
      statusBadge: "Not Submitted",
      helperText: "Researcher has not submitted research data for this stage.",
    };
  }
  // NEEDS_REVIEW, IN_REVIEW, or default
  return {
    canApprove: true,
    canRequestRevision: true,
    isReadOnly: false,
    statusBadge: norm === "IN_REVIEW" ? "In Review" : "Needs Review",
    helperText: "Please evaluate the research evidence and record your decision.",
  };
}

