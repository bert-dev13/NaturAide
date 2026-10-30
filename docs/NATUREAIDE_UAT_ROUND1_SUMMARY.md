# NatureAide User Acceptance Testing (UAT) — Round 1 Summary

**Document ID**: NAT-UAT-R1-SUM  
**Status**: UAT IN PROGRESS — NOT YET ELIGIBLE FOR PILOT DECISION  
**Effective Date**: October 26, 2026  
**Cycle**: Round 1 UAT Execution  

---

## 1. High-Level Execution Dashboard

| Metric | Target / Gate | Current Value | Notes |
|---|---|---|---|
| **Total Test Cases** | 66 Cases | **66** | Defined across Sections A through R |
| **Executed** | >= 95% (>= 63 cases) | **0** | (PASS + FAIL) |
| **Passed** | - | **0** | Verified by human tester |
| **Failed** | - | **0** | Defect logged and verified |
| **Blocked** | 0 at completion | **0** | Environmental or prerequisite blocker |
| **Not Tested** | 0 at completion | **66** | Pending human testing execution |
| **Pass Rate** | >= 95.0% | **N/A** | Formula: `PASS / (PASS + FAIL) * 100` |
| **P0 (Critical Governance) Progress** | 41 / 41 (100%) | **Executed: 0 / 41 &nbsp;\|&nbsp; Passed: 0 / 41** | Mandatory exit requirement |
| **P1 (Core Workflow) Progress** | 19 / 19 (100%) | **Executed: 0 / 19 &nbsp;\|&nbsp; Passed: 0 / 19** | Core operational workflows |
| **P2 (UX & Supporting) Progress** | 6 / 6 (100%) | **Executed: 0 / 6 &nbsp;\|&nbsp; Passed: 0 / 6** | Supporting usability & error states |

---

## 2. Defect Backlog Status

| Severity Level | Open Count | Resolved / Closed Count | Target at UAT Exit |
|---|---|---|---|
| **CRITICAL** | **0** | 0 | 0 permitted (Blocks Pilot) |
| **HIGH** | **0** | 0 | 0 permitted (Blocks Pilot) |
| **MEDIUM** | **0** | 0 | Documented workarounds allowed |
| **LOW** | **0** | 0 | Scheduled maintenance |

> [!WARNING]
> **Zero Defects Does Not Equal Pilot Readiness**:  
> In this preparation phase, recording **0 open defects** does **NOT** indicate that zero defects exist in the system. It solely indicates that **human testing has not yet been conducted**. Defect counts will populate dynamically as human testers exercise workflows and record tickets in [NATUREAIDE_UAT_DEFECT_REGISTER.csv](file:///c:/projects/natureaide/docs/NATUREAIDE_UAT_DEFECT_REGISTER.csv).

---

## 3. Human UAT vs. Automated Technical Verification

Automated test suites (e.g. Master E2E audit, TypeScript validation, database relational checks) have already verified system correctness at a code and API level. However, human User Acceptance Testing addresses an entirely different and vital dimension:

| Domain | Automated Technical Verification (E2E) | Human User Acceptance Testing (UAT) |
|---|---|---|
| **Reviewer Eligibility** | Verified that API route `/api/reviewer/reviews/1/decision` returns HTTP 403 when user is unverified. | Evaluates whether a human clinician clearly understands why they cannot submit a decision, whether the warning banner is respectful and actionable, and whether credential status is transparent. |
| **Knowledge Integration** | Verified that database rows in `plants` table only change after HTTP POST to `/integrate`. | Evaluates whether an institutional administrator intuitively understands the distinction between `APPROVED` and `INTEGRATED`, feels safe before committing changes to public guides, and can clearly trace research provenance. |
| **Traditional Preparation** | Verified that research formulation prototypes do not appear in SQL result payloads for community queries. | Evaluates whether a community citizen or patient finds the traditional preparation directions straightforward, safe, and free from confusing scientific jargon. |
| **Ask NatureAide AI** | Verified that retrieval engine returns fallback response when queried on unindexed plant strings. | Evaluates whether a human user feels the AI assistant is suitably cautious, empathetic, educational, non-prescriptive, and trustworthy. |

Both automated technical testing and human acceptance testing are required; neither replaces the other.

---

## 4. Pass Rate Calculation Methodology

When Round 1 execution starts:
- **Executed Cases** = `PASS + FAIL`
- **Blocked Cases** = Tracked separately (`BLOCKED`); excluded from the denominator of executed tests until unblocked.
- **Pass Rate Formula**:
  $$\text{Pass Rate} = \frac{\text{PASS}}{\text{PASS} + \text{FAIL}} \times 100\%$$
- **Note on Denominator**: `NOT TESTED` cases are never included in the pass rate denominator. However, Controlled Pilot sign-off strictly mandates that **100% of P0 cases** and **>= 95% of total cases** must transition out of `NOT TESTED` prior to governance review.

---

## 5. Controlled Pilot Decision Status

**Current Decision Gate**:
```text
[X] UAT IN PROGRESS — NOT YET ELIGIBLE FOR PILOT DECISION
```

Formal consideration of pilot approval gates:
- `APPROVED FOR CONTROLLED PILOT`
- `CONDITIONALLY APPROVED FOR CONTROLLED PILOT`
- `NOT APPROVED FOR CONTROLLED PILOT`

is deferred until all 12 Round 1 UAT sessions have completed execution, all P0 cases have verified passes, all reported defects have reached verified retest resolution, and the designated stakeholder representatives complete [NATUREAIDE_UAT_SIGNOFF.md](file:///c:/projects/natureaide/docs/NATUREAIDE_UAT_SIGNOFF.md).
