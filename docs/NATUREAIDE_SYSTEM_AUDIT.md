# NATURAIDE – Comprehensive System Analysis & Technical Audit

**Date:** 2026-11-11  
**Scope:** Read-only analysis of the existing codebase at `c:\projects\natureaide`  
**Constraint:** No code was modified during this audit. Findings are traced from actual implementation, not assumed from filenames.

**Parallel audits folded in:**
- Architecture & stack
- Modules / database / security
- UX / performance / code quality

---

## A. System Overview

NATURAIDE is a **Next.js App Router** application with a **MySQL** backend (**not** Firebase/Firestore — none found in the repository). It serves three role portals behind JWT cookie authentication (`natureaide_session`):

| Portal | Entry | Purpose |
|--------|--------|---------|
| **Community** | `/community` | Health screening gate → herbal education, plants/products/preparations, AI chat |
| **Researcher** | `/researcher` | Project-based research workflow ending in dossier submission |
| **Reviewer** | `/reviewer` | Multidisciplinary review, checking roles, revisions, AI assists |

There is **no dedicated `/admin` App Router surface**. Residual `ADMIN` checks appear only in limited API code and are not a first-class login role.

### Actual researcher product path (current disk truth)

Navigation and continue-routes converge on a **V2 section model**:

1. **Section 1 – Formulation R&D** → `/researcher/projects/[id]/formulation-rd` (6 internal steps)
2. **Section 2 – In-Silico** (screening + docking under in-silico routes)
3. **Section 3 – Submission**
4. **Section 4 – Professional review** (reviewer side)

Meanwhile, older **6-stage linear models** still exist in parallel:

- `src/lib/workflow-stages.ts`
- `src/components/researcher/stage/stageConstants.ts`
- Dashboard stage lists in `ResearcherDashboardClient.tsx`

Plus many **orphan or still-routed legacy pages/APIs** (`laboratory`, `knowledge-integration`, `expert-review`, `formulation-safety`, `plant-literature`, `docking`, etc.). That dual model is the system’s central architectural debt.

### Data flow

Server Components / Route Handlers → `mysql2` pool (`src/lib/db.ts`) → JSON to large `"use client"` workspaces that re-fetch via `/api/...`.

External services: Together AI, xAI/Grok, NCBI/PubChem-style evidence, RCSB PDB, AutoDock Vina via local Python/venv.

Approx scale: **~70** `page.tsx`, **~105** API `route.ts`, **~203** component files, **~55** lib modules.

---

## B. Technology Stack

Detected in `package.json` and source:

| Layer | Tech |
|--------|------|
| Framework | Next.js **16.4.3**, React **19.3**, TypeScript 5 |
| Styling | Tailwind CSS **4**, `clsx`, `tailwind-merge`, framer-motion, lucide-react |
| Auth | `jose` JWT (HS256, 7d), `bcryptjs`, cookie `natureaide_session` |
| DB | `mysql2` pool → MySQL (`natureaide_db`), migrations `001`–`017` (TypeScript) |
| Maps | Leaflet |
| AI | Together (`src/lib/ai/together-provider.ts`), xAI Grok (`grok-provider.ts`) |
| Docking | AutoDock Vina + `.docking-venv` / env (`VINA_BIN`, `DOCKING_*`), `services/docking/worker.py` |
| Tunnel | `@ngrok/ngrok` (dev share) |
| 3D (runtime CDN) | 3Dmol.js loaded by `Molecular3DViewer` (not an npm dep) |

**Not present:** Firebase, Firestore, MongoDB, Supabase, Prisma, NextAuth, Three.js/Mol\*/NGL as package deps.

### Key scripts

- App: `dev`, `build`, `start`, `lint`
- Setup: `setup`, `setup:docking`
- DB: `db:migrate`, `db:migrate:status`, `db:seed:phytochemicals`
- Tests: `test:chat`, `test:docking`, `test:screening`, `test:batch`, etc.

### Auth model

| Piece | Path |
|-------|------|
| Session helper | `src/lib/auth.ts` |
| Middleware | `src/middleware.ts` |
| Login / logout / me / register | `src/app/api/auth/*` |
| Users schema | `migrations/001_shared_core_users.ts` |

Roles: `COMMUNITY` | `RESEARCHER` | `REVIEWER`. Secondary cookie: `natureaide_screening` for community gate.

---

## C. Module-by-Module Assessment

### 1. Auth & middleware

**Files:** `src/lib/auth.ts`, `src/middleware.ts`, `/api/auth/*`

JWT create/verify; `getSession` re-loads user from MySQL and blocks `DISABLED`. Middleware enforces role routes + community screening redirects.

**Condition:** Solid baseline; screening cookie vs DB mismatch and edge DISABLED gap are real issues (see Critical Issues).

### 2. Community portal

**Pages:** `src/app/community/**`  
**APIs:** `src/app/api/community/**` (plants, products, preparations, screening, chat, saved, facilities, profile)

Screening → guidance/facilities or herbal flow; AI chat grounded in Together/Grok + DB.

**Condition:** Coherent product path; depends on MySQL + botanical/phytochemical catalog seed. Community APIs often check “any session,” not strictly `role === COMMUNITY`.

### 3. Researcher V2 Formulation R&D (primary active path)

**Page:** `src/app/researcher/projects/[id]/formulation-rd/page.tsx`  
**Client:** `FormulationRdWorkspaceClient.tsx` + step sections  
**Schema:** migration `015_researcher_v2_section1_tables.ts`

Steps: botanical → product → extraction → materials → formulation → batch.

**Condition:** Feature-rich and intentional; oversized sections (e.g. `FormulationStep5Section` ~1859+ lines).

### 4. In-silico & docking

**Active:** `InSilicoRdWorkspaceClient.tsx`, docking APIs, `docking-jobs.ts`, `docking-service.ts`  
**Legacy still routed:** `MolecularDockingWorkspaceClient.tsx` via `docking/page.tsx`  
**Orphaned giant:** `InSilicoWorkspaceClient.tsx` (~2931 lines) — no `app/` importer found

**Condition:** Core capability works when toolchain/MySQL are up; heaviest UI/CPU surface. Vina prep timeouts up to ~300s; Vina default ~180s.

### 5. Legacy stage pages (still mounted or redirected)

Still mounted by routes (examples):

- `plant-literature` → `PlantLiteratureClient`
- `docking` → `MolecularDockingWorkspaceClient`
- `formulation-safety` → `FormulationSafetyClient`
- `safety` → `SafetyClinicalClient`
- `knowledge-integration` → `KnowledgeIntegrationClient`

Redirect examples: `expert-review` → `knowledge-integration`; `formulation` → `formulation-safety`; etc.

Stub: `src/app/api/researcher/projects/[id]/laboratory/route.ts` returns “discontinued” **without auth**.

**Condition:** Confusing overlap with V2; maintenance hazard.

### 6. Submission / completion / revisions

Manuscript, submit-final, approval-status, revisions hubs, completed research list/detail.

**Condition:** Wired to V2 progress; schema-sensitive (`executiveSummary`); completed list has severe N+1 query pattern.

### 7. Reviewer portal

Dashboard, project review, role checking, AI summary/brief, revisions, specialty sections.

Specialty write enforcement via `assertReviewerPermissionForSpecialty` in `expert-review-assignment.ts`. **GET project detail does not always require assignment** (any REVIEWER can load any project id on some paths).

**Condition:** Mature relative to research complexity; large AI services.

### 8. Shared botanical / phytochemical data

`botanical-registry`, `phytochemical-catalog`, `plant_compounds` (migration `016` + seed script).

**Condition:** Empty catalog on fresh machines unless seed/auto-load runs — verified operational pain point.

### 9. Plants search API

`/api/plants/search` — public plant/phytochemical/literature lookup; optional `projectId` returns linked compound/literature names **without auth**.

---

## D. Performance Assessment

### Biggest bottlenecks

1. **Monolithic client workspaces**  
   Largest examples: orphaned `InSilicoWorkspaceClient` (~2931), live `FormulationStep5Section` (~1859), routed `MolecularDockingWorkspaceClient` (~1833), plus many 1000–1700 line clients.

2. **Repeated client fetches**  
   Mount → `useEffect` → multiple `fetch` calls. `ResearcherNavSections` refetches project + `v2-progress` + feedback on **every `pathname` change**.

3. **Heavy server page loads**  
   `formulation-rd/page.tsx` and `in-silico/page.tsx` join project + plant + phytochemical catalog (+ docking workspace data) before first paint; catalog auto-seed adds latency.

4. **Completed list N+1 (HIGH)**  
   `getCompletedResearchListForResearcher` runs per-project `getProjectProfessionalApprovalState` → many queries + full `calculateV2ProjectProgress` (~15–20 queries each). Path: `src/lib/research-approval-completion-service.ts`, `src/app/researcher/completed/page.tsx`.

5. **Workspace progress cost**  
   Opening a project runs `calculateV2ProjectProgress` (~15–20 sequential queries) plus additional queries (`v2-progress-service.ts`, workspace `page.tsx`).

6. **AI + docking latency**  
   Together/xAI and Vina are inherently slow; compounded by sequential UI refreshes. 3Dmol loaded from CDN without `next/dynamic`.

7. **Runtime DB self-heal**  
   `db.ts` patches on query failure (plants table rebuild, `executiveSummary` ALTER) add unpredictable latency and risk.

8. **Missing pagination**  
   Researcher projects list API returns full filtered set; `ResearchProjectsManager` has no pagination.

### Root cause theme

Feature accretion into single client files + fetch-per-mount + dual V1/V2 surfaces — not a missing infrastructure stack.

---

## E. UI/UX Assessment

### Strengths

- Role-separated portals
- Formulation R&D step model reduces stage sprawl when users stay on V2 paths
- Forest / research-section visual language is intentional
- Middleware screening protects community safety flow at the route level

### Practical problems

| Issue | Evidence | Impact |
|--------|-----------|--------|
| Competing navigational models | `WORKFLOW_STAGES` vs `OFFICIAL_STAGES` vs dashboard `OFFICIAL_WORKFLOW_STAGES` vs nav “Section 1–4” | Users/devs see different stage names/orders |
| Divergent `getStageUrl` implementations | `workflow-stages.ts` maps to V2; `stageConstants.ts` still builds old paths | Deep links disagree with sidebar |
| Orphan + still-routed legacy URLs | Many `projects/[id]/*` pages | Dead ends, wrong continue links |
| Oversized single-scroll stages | Formulation step 5 / docking / safety clients | Harder to find actions; long wait before interactivity |
| Progress duplication | Stage % + section approval % + project status enums | “Where am I?” ambiguity |
| Cross-laptop empty phytochemicals | Needs migrate + seed / auto-load | Looks like a product bug |
| Loading/empty/error inconsistency | Shared primitives barely used; each client invents its own | Uneven UX fidelity |
| Stage numbering drift | Copy still says Stage 4/5/6 while nav says Section 1–4; in-silico has steps 1–8 | Cognitive overload |

### Practical improvements (preserve architecture)

1. One canonical nav source of truth  
2. Soft-redirect legacy URLs to V2  
3. Lazy-load step sections and 3D viewer  
4. Keep first viewport focused on current step + CTA  
5. Archive/delete confirmed-orphan mega-clients  

---

## F. Database and Security Assessment

### Database

Migrations `001`–`017` cover users, plants/community, research projects/stages, compounds/docking, formulation/safety, dossiers, reviewer, V2 section-1 tables, `plant_compounds`, `executiveSummary`.

**Core relationships (simplified):**

```
users 1──* research_projects (researcherId)
plants 1──* research_projects (plantId, nullable)
research_projects 1──* research_compounds / stages / literature / materials / batch analyses
research_compounds 1──* insilico_results; docking_ligand_preps
research_projects 1──* docking_runs / targets / setups
research_projects 1──1 research_dossiers → versions / snapshots
research_projects 1──* review_submissions → assignments / reviews / feedback / decisions
plant_compounds (catalog; plantId loose string association)
```

**Integrity / drift risks:**

| Severity | Drift | Evidence |
|----------|-------|----------|
| High | `executiveSummary` added in `017` + runtime repair | `db.ts`, `v2-progress-service.ts` |
| High | `selectedForDocking` / related compound columns used heavily but not fully in `008` | in-silico API vs migrations |
| High | `docking_runs.jobStatus` (+ Vina columns) via runtime `ensureDockingSchema` | `docking-schema.ts` |
| High | Completion flags ensured at runtime | `research-approval-completion-service.ts` |
| Medium | `plant_compounds`: `016` creates empty table; seed is lazy | `phytochemical-catalog.ts` |
| Medium | Dual formulation table naming / runtime `formulation-schema.ts` | `009`, formulation libs |
| **Critical risk** | `ensurePlantsTableHealthy` can `DROP TABLE plants` then recreate | `src/lib/db.ts` |

Plant identity mixes registry IDs + DB `plants.id` + custom names → duplication risk.

**Growth:** Workable for single-team MySQL; indexes exist on key FKs; JSON/text-heavy fields will need pagination as projects scale.

### Security

| Area | Finding | Severity |
|------|---------|----------|
| Auth model | JWT + role middleware; most APIs call `getSession` | Good baseline |
| Prod secret | `AUTH_SECRET` required in production | OK if env set |
| Dev fallback secret | Hardcoded in `auth.ts` / `middleware.ts` | Acceptable for local only |
| Screening gate | Middleware trusts `natureaide_screening` cookie **or** JWT claim | **HIGH** — client-controllable bypass of guidance lockdown for pages |
| Disabled users | `getSession` blocks DISABLED; middleware does **not** re-check DB | **MEDIUM** |
| `/api/plants/search?projectId=` | No auth; returns project compound/literature linkage | **HIGH** |
| Materials / batch / product-selection | Role check only — **no ownership** | **CRITICAL** IDOR |
| `v2-progress` | Any RESEARCHER/REVIEWER can UPDATE any project’s `progressPercent` | **HIGH** |
| Dossier GET | `researcherId = ? OR status = 'COMPLETED'` | **HIGH** cross-read |
| Literature DELETE log | `` `…#${refId}…` `` interpolated into SQL string | **HIGH** SQLi vector |
| Laboratory stub | No `getSession` | **LOW–MEDIUM** |
| Uploads | Researcher-only, size/ext allowlist, sanitized names; middleware on `/uploads/research/` | Generally good; `.zip` allowed |
| API matcher | Middleware does **not** cover `/api/*`; security is per-route | Missed ownership = exposure |
| Community APIs | Session only, not always COMMUNITY role | **MEDIUM** |
| Secrets in repo | `.env.example` placeholders only | Good |
| Demo passwords | Seeded demo credentials in init scripts | **MEDIUM** (ops hygiene) |

**Note:** Firestore security rules are **N/A**. MySQL + app-layer auth is the control plane.

---

## G. Critical Issues

| Sev | File(s) | Problem | Root cause | Impact | Recommended solution | Complexity |
|-----|---------|---------|------------|--------|----------------------|------------|
| **CRITICAL** | `src/lib/db.ts` (`ensurePlantsTableHealthy`) | Auto-`DROP`/`CREATE` of `plants` on engine errors | Self-heal over fail-soft migrate | Data loss / FK disruption | Non-destructive migrate/repair only; never DROP in request path | Medium |
| **CRITICAL** | `…/materials/route.ts` | IDOR: any RESEARCHER read/write any project materials | Role check without `researcherId` ownership | Cross-project data tampering | Require ownership (or reviewer assignment) on every method | Low |
| **CRITICAL** | `…/batch-analyses/route.ts` | Same IDOR pattern | Same | Same | Same | Low |
| **CRITICAL** | `…/product-selection/route.ts` | Same IDOR; POST upserts by `projectId` only | Same | Same | Same | Low |
| **HIGH** | `…/v2-progress/route.ts` | Any RESEARCHER/REVIEWER can recompute and **UPDATE** any project progress | Missing ownership before UPDATE | Progress corruption / info leak | Ownership/assignment gate; avoid blind UPDATE | Low |
| **HIGH** | `…/dossier/route.ts` | Completed dossiers readable by other researchers | `OR status = 'COMPLETED'` | Confidential research leak | Restrict to owner or assigned reviewers | Low |
| **HIGH** | `…/literature/route.ts` ~517–521 | SQL string interpolation of `refId` in activity log | Template literal inside SQL | Injection risk | Fully parameterized description | Low |
| **HIGH** | `src/middleware.ts` + screening cookie | Community guidance restriction bypassable via cookie | Mutable cookie trusted at edge | At-risk users reach herbal UI | Trust DB screening only; cookie as cache | Medium |
| **HIGH** | `src/app/api/plants/search/route.ts` | Unauthenticated project-linked compounds/literature | `projectId` branch has no session/ownership | Research metadata leak | Require session + ownership for project fields | Low |
| **HIGH** | Workflow registries + nav | Three+ divergent stage models vs live V2 sections | Incremental redesign without deleting old model | Wrong links, progress bugs | Single source of truth + redirects | Medium–High |
| **HIGH** | Giant `*Client.tsx` / step sections | Main-thread & bundle cost; dual V1/V2 clients | Feature growth / incomplete deprecation | Slow navigation/hydration | Split by step; dynamic import; retire orphans | Medium |
| **HIGH** | Migrations vs runtime schema | Columns/tables ensured in code not migrations | Lazy schema evolution | Cross-laptop / migrate-only breakage | Promote runtime DDL into migrations; explicit seed | Medium |
| **HIGH** | Completed list service | Per-row approval + V2 progress | N+1 design | Slow completed page as N grows | Batch approval counts; cache progress | Medium |
| **MEDIUM** | Orphan / legacy pages | Dead/legacy workflows still reachable | Incomplete deprecation | Confusion | Soft redirects to V2 | Low |
| **MEDIUM** | Middleware vs DISABLED | Disabled accounts may pass page middleware | JWT-only edge gate | Privilege window | Status check or short TTL | Medium |
| **MEDIUM** | Nav dual fetching | Redundant network/DB on every route change | No shared cache | Slower project switching | Layout-level progress; debounce | Medium |
| **MEDIUM** | Upload allowlist includes `.zip` | Archive may hide payloads | Convenience over least privilege | Risk if zip later extracted | Restrict or sandbox unpack | Low |
| **MEDIUM** | Community APIs role check | Any authenticated role can call | Session-only auth | Privilege confusion | Require COMMUNITY where appropriate | Low |
| **LOW** | Naming inconsistency | `formulation` / `formulation-rd` / `formulation-safety` aliases | Compatibility layers | Dev errors | Canonicalize URLs | Low |
| **LOW** | `laboratory/route.ts` | Unauthenticated stub | Incomplete cleanup | Noise | Add auth or remove | Low |

---

## H. Optimization Recommendations

1. **Stop destructive DB self-heal** — migrate-only repairs; log and fail closed in production.  
2. **Fix IDOR ownership** on materials, batch-analyses, product-selection, and v2-progress.  
3. **Tighten dossier / reviewer GET** scopes (owner or assignment).  
4. **Parameterize** all SQL strings (literature activity log).  
5. **Unify workflow definition** — one module driving nav, progress, footer, dashboard; map aliases → redirects.  
6. **Harden public APIs** — auth + ownership on any `projectId` query; COMMUNITY role on community APIs.  
7. **Fix screening trust boundary** — middleware uses DB (or signed server-set cookie refreshed from DB).  
8. **Code-split research workspaces** — load Formulation steps and docking/3D UI on demand.  
9. **Cache project progress** — one fetch per project layout; do not refetch on every pathname change.  
10. **Batch completed-list approval queries** — eliminate per-row V2 progress storms.  
11. **Operationalize setup** — `db:migrate` + `db:seed:phytochemicals` required; promote runtime-only columns into migrations.  
12. **Deprecate cleanly** — redirect legacy stage URLs; archive orphaned mega-clients.  
13. **Paginate** projects, literature, compound lists, and activity logs.  
14. **Avoid new frameworks** — MySQL + Next API is fine; debt is consistency, authz, and size.

---

## I. Implementation Priority

### Priority 1 – Critical fixes (security & data integrity)

1. Add ownership (and reviewer assignment where needed) on **materials / batch-analyses / product-selection / v2-progress**.  
2. Tighten **dossier** COMPLETED cross-read.  
3. Parameterize literature activity-log description (remove `${refId}` interpolation).  
4. Remove/replace `DROP TABLE plants` path in `db.ts`.  
5. Auth-gate project data in `/api/plants/search`.  
6. Screening gate: DB-backed only in middleware.

### Priority 2 – Performance & workflow

1. Canonical workflow/V2 section map + redirects for legacy stage pages.  
2. Dynamic import / split largest live clients; lazy-load 3Dmol.  
3. Reduce duplicate `v2-progress` / project fetches (especially nav on pathname).  
4. Fix completed-list N+1.  
5. Promote runtime schema columns into migrations; keep phytochemical seed explicit.

### Priority 3 – UI/UX enhancements

1. Hide or redirect orphan stage pages in nav.  
2. Step-focused Formulation R&D chrome (current step first).  
3. Clear empty states when catalog not seeded.  
4. Shared loading / empty / error shells for researcher stages.

### Priority 4 – Code quality & long-term

1. Extract shared stage helpers; shrink 1600–3000 line files.  
2. Delete or archive confirmed-orphan mega-clients.  
3. Centralize duplicated helpers (`formatRelativeTime`, stage labels).  
4. Tighten `any` on docking/formulation payloads.  
5. Consistent ownership helpers for all project APIs.  
6. Tighten upload types; optional middleware coverage for `/api`.  
7. Expand focused tests around authz and redirects.

---

## J. Overall System Evaluation

NATURAIDE is a **substantial, production-shaped research platform**: real RBAC, MySQL schema with migrations, AI-assisted community + research flows, and a serious docking toolchain. The **active product direction (V2 Formulation R&D → in-silico → submission → review)** is clear in navigation and continue-routes.

### Strengths

- Role isolation across three portals  
- Ownership checks on many researcher APIs (in-silico, formulation, manuscript, submit-final, etc.)  
- Upload gating for research documents  
- Domain-rich modules and growing test scripts  
- Recovery work for phytochemicals / `executiveSummary`  
- No accidental Firebase dependency  

### Weaknesses

- Parallel workflow definitions and orphan/legacy routes  
- Mega-components (live and orphaned)  
- Runtime schema self-heal (including destructive plants repair)  
- Confirmed **IDOR** gaps on core V2 Section 1 APIs  
- Environment sensitivity (MySQL/XAMPP + seeds + Vina toolchain)  

### Technical debt

**High but localized** — mainly workflow consolidation, authz consistency, file size, and migrate-vs-runtime schema — **not** a need to rewrite the stack.

### Production readiness

**Conditional.** Suitable for controlled demos / academic pilots if `AUTH_SECRET`, migrations, seeds, and Vina toolchain are locked down.

**Not fully production-hardened** until Priority 1 security/data-integrity items and workflow canonicalization are done.

---

## Appendix: Conflicting workflow registries

| Source | Stage 4 | Stage 5 | Stage 6 |
|--------|---------|---------|---------|
| `src/lib/workflow-stages.ts` | `formulation-safety` “Formulation Development” | `safety` “Safety / Clinical” | `knowledge-integration` |
| `stageConstants.ts` (`OFFICIAL_STAGES`) | `formulation-safety` “Formulation & Safety” | `completion-integration` | `expert-review` |
| `ResearcherDashboardClient` (`OFFICIAL_WORKFLOW_STAGES`) | same as stageConstants | `completion-integration` | `expert-review` |
| **Live sidebar** (`ResearcherNavSections`) | Section model: `formulation-rd` / `in-silico` / `submission` / `completion` | — | — |

`getStageUrl` in `workflow-stages.ts` collapses many keys onto V2 routes; `getStageUrl` in `stageConstants.ts` still builds old stage paths.

---

## Appendix: Largest client components (approx. line counts)

### Still relevant / routed or V2-live

| File | ~Lines | Notes |
|------|--------|-------|
| `formulation-rd/FormulationStep5Section.tsx` | ~1859 | Live V2 |
| `docking/MolecularDockingWorkspaceClient.tsx` | ~1833 | Still routed |
| `knowledge-integration/KnowledgeIntegrationClient.tsx` | ~1691 | Still routed |
| `formulation-safety/FormulationSafetyClient.tsx` | ~1588 | Still routed |
| `formulation-rd/MaterialsStep4Section.tsx` | ~1506 | Live V2 |
| `plant-literature/PlantLiteratureClient.tsx` | ~1369 | Still routed |
| `formulation-rd/ExtractionStep3Section.tsx` | ~1338 | Live V2 |
| `safety/SafetyClinicalClient.tsx` | ~1306 | Still routed |

### Orphaned (no `app/` importer found at audit time)

| File | ~Lines |
|------|--------|
| `in-silico/InSilicoWorkspaceClient.tsx` | ~2931 |
| `safety/SafetyAssessmentClient.tsx` | ~1796 |
| `expert-review/ExpertReviewClient.tsx` | ~1618 |
| `formulation/FormulationBuilderClient.tsx` | ~1606 |
| `literature/LiteratureManagementClient.tsx` | ~1309 |
| `completion-integration/CompletionIntegrationClient.tsx` | ~1033 |
| `docking/SimpleMolecularDockingClient.tsx` | ~1025 |

---

## Appendix: External services

| Service | Evidence |
|---------|----------|
| Together AI | `src/lib/ai/together-provider.ts` |
| xAI / Grok | `src/lib/ai/grok-provider.ts`, `ai-assistant-service.ts` |
| NCBI PubMed | `src/lib/literature-service.ts` |
| PubChem | `phytochemical-discovery.ts`, docking/in-silico routes |
| RCSB PDB | `docking-rcsb.ts`, `docking-service.ts` |
| AutoDock Vina (local) | `docking-service.ts`, `services/docking/worker.py` |
| ngrok | `scripts/tunnel.mjs`, `@ngrok/ngrok` |
| PITAHC / botanical registry | `botanical-registry.ts` (reference data) |

---

*End of audit. Implementation should begin only when explicitly requested; Priority 1 items above are the recommended starting point.*
