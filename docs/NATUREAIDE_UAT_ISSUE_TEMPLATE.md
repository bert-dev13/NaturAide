# NatureAide User Acceptance Testing (UAT) Defect / Issue Template

**Document ID**: NAT-UAT-TMPL-001  
**Version**: 1.0.0  
**Effective Date**: October 26, 2026  

---

## 1. Instructions for Testers

When a test step deviates from the **Expected Result** in [NATUREAIDE_UAT_TEST_CASES.md](file:///c:/projects/natureaide/docs/NATUREAIDE_UAT_TEST_CASES.md), follow these instructions:
1. **Reproduce the issue**: Verify that the behavior occurs consistently or note if it is intermittent.
2. **Assign Severity**: Adhere strictly to the defect definitions (CRITICAL, HIGH, MEDIUM, LOW) in [NATUREAIDE_UAT_PLAN.md](file:///c:/projects/natureaide/docs/NATUREAIDE_UAT_PLAN.md).
3. **Capture Evidence**: Take full-window screenshots or copy API console logs.
4. **Log the Issue**: Copy the blank issue template below and paste it into the issue tracking log (or file as a markdown record / issue ticket).
5. **Update Test Case**: In [NATUREAIDE_UAT_TEST_CASES.md](file:///c:/projects/natureaide/docs/NATUREAIDE_UAT_TEST_CASES.md) and [NATUREAIDE_UAT_TRACKER.csv](file:///c:/projects/natureaide/docs/NATUREAIDE_UAT_TRACKER.csv), set status to `FAIL` and reference your assigned `Issue ID`.

---

## 2. Blank Issue Submission Template

```markdown
# NatureAide UAT Issue Report

**Issue ID**: ISS-UAT-[ROLE]-[001]  
**Date**: YYYY-MM-DD  
**Tester**: [Tester Full Name]  
**Role**: [COMMUNITY | RESEARCHER | REVIEWER | ADMIN]  
**Module**: [Authentication | Community Catalog | Screening | Ask NatureAide | 12-Stage Research | Reviewer Workspace | Knowledge Integration | Knowledge Base | User Management | System Audit]  
**Test Case ID**: [e.g. AUTH-UAT-001, RES-S8-001, REV-UAT-010, ADM-KI-001]  

---

### Severity
<!-- Select exactly one -->
- [ ] CRITICAL (Security breach, cross-role bypass, private data leak, unintegrated research published, AI fabrication, provenance break)
- [ ] HIGH (Major workflow blocked, reviewer cannot render decision, researcher blocked from stage, admin action fails)
- [ ] MEDIUM (Feature functions partially, validation glitch, non-blocking navigation/filter issue, responsive clipping)
- [ ] LOW (Minor cosmetic issue, spacing/alignment, typographical error, tooltip phrasing)

---

### Title
[Concise summary of the defect]

---

### Environment Details
- **Environment**: [Local Development Server / Staging UAT]
- **Base URL**: http://localhost:3000
- **Browser & Version**: [e.g. Chrome 122.0, Firefox 124.0, Safari 17.2, Edge 122.0]
- **Device / Screen Size**: [e.g. Desktop 1920x1080 | Laptop 1440x900 | Tablet 768x1024 | Mobile 390x844 (iPhone 13)]

---

### Preconditions
- [State of the user session, database records, or pre-existing project required before starting]

---

### Steps to Reproduce
1. Log in as `[email]`
2. Navigate to `[URL or navigation link]`
3. Perform action: `[Click / Input / Submit]`
4. Observe response / UI state

---

### Expected Result
[Detailed description of what the system should do according to the UAT test case specification]

---

### Actual Result
[Detailed description of what the system actually did, including exact error messages, blank states, or unexpected behaviors]

---

### Screenshot / Evidence
- **Screenshot Link / Attachment**: `[Attach image or specify path, e.g. artifacts/screenshots/iss-001.png]`
- **Console / Network Error**:
```text
[Paste browser devtools console errors or network response payloads here if applicable]
```

---

### Related Record ID
- **Record Identifier**: [e.g. Project ID: 1, Dossier Version: 1, User ID: 3, Plant Slug: lagundi]

---

### Reproducibility
- [ ] YES (100% reproducible every attempt)
- [ ] NO (Occurred once, could not reproduce)
- [ ] INTERMITTENT (Occurs under specific timing or cache conditions)

---

### Status Lifecycle
- **Status**: [OPEN | IN PROGRESS | FIXED | RETEST | CLOSED]

---

### Developer Resolution
- **Developer Assigned**: [Developer Name]
- **Developer Notes**: [Root cause analysis and technical rationale]
- **Fix Applied**: [Commit hash, affected source files, description of architectural correction]
- **PR / Commit**: [git commit SHA or branch name]

---

### Retest & Verification
- **Retest Result**: [PASS | FAIL]
- **Retested By**: [Tester Full Name]
- **Retest Date**: YYYY-MM-DD
- **Retest Notes**: [Observations confirming defect resolution without regression]
```

---

## 3. Reference Example (Filled-Out Issue Ticket)

```markdown
# NatureAide UAT Issue Report

**Issue ID**: ISS-UAT-REV-001  
**Date**: 2026-10-26  
**Tester**: Dr. Elena Rostova  
**Role**: REVIEWER  
**Module**: Reviewer Workspace  
**Test Case ID**: REV-UAT-007  

---

### Severity
- [x] HIGH (Major workflow blocked)

---

### Title
Unable to attach evidence citation request modal when submitting EVIDENCE_NEEDED comment

---

### Environment Details
- **Environment**: Local Development Server (http://localhost:3000)
- **Browser & Version**: Google Chrome 122.0.6261.128
- **Device / Screen Size**: Desktop (1920x1080)

---

### Preconditions
- Logged in as `reviewer@natureaide.test`.
- Assigned review #1 for "Philippine Peperomia pellucida Evaluation" is open in `/reviewer/reviews/1`.
- Dossier version 1 displayed in review pane.

---

### Steps to Reproduce
1. Scroll to Section 4: In-Silico Pharmacokinetics.
2. Click "Add Comment" on line 42 (Lipinski rule violation note).
3. Select feedback category: "EVIDENCE_NEEDED".
4. Type feedback: "Please provide explicit binding affinity calculation details."
5. Click "Submit Comment".

---

### Expected Result
Comment saves and appears in the review thread; comment count for Section 4 increments by 1; decision buttons remain responsive.

---

### Actual Result
The submit button spins for 500ms, then a toast appears stating "Failed to save comment". Console reports HTTP 422: `missing field 'citationScope'`.

---

### Screenshot / Evidence
- **Console / Network Error**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["citationScope is required when feedbackType is EVIDENCE_NEEDED"]
}
```

---

### Related Record ID
- **Record Identifier**: Review ID: 1, Dossier ID: 1, Project ID: 1

---

### Reproducibility
- [x] YES (100% reproducible every attempt)

---

### Status Lifecycle
- **Status**: FIXED

---

### Developer Resolution
- **Developer Assigned**: NatureAide Engineering Team
- **Developer Notes**: Client UI form did not render the default `citationScope` dropdown when `EVIDENCE_NEEDED` was toggled.
- **Fix Applied**: Updated `src/app/reviewer/reviews/[id]/ReviewFeedbackForm.tsx` to automatically supply default scope and show optional citation selector.
- **PR / Commit**: `fix(reviewer): provide citationScope default on EVIDENCE_NEEDED feedback`

---

### Retest & Verification
- **Retest Result**: PASS
- **Retested By**: Dr. Elena Rostova
- **Retest Date**: 2026-10-26
- **Retest Notes**: Form submitted successfully, comment pinned to Section 4 thread with "EVIDENCE_NEEDED" badge. Workflow unblocked.
```
