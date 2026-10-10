# Phase 12 — Institutional layer: official channel, placement cell integration, analytics, safeguarding, faculty

| | |
|---|---|
| **When** | **After the hackathon, after Phases 00–11 are built, deployed and demoed.** This phase turns the hackathon build into something a college can actually run. Estimated 10–16 hours across several sessions, plus real conversations with college staff — this is not a pure coding phase |
| **Goal** | Give the college's own staff — placement cell, alumni relations, student welfare, department heads — a reason to adopt Crossroads as official infrastructure, not just a student side-project. Add an official/verified channel, placement-cell-owned data, an institution-facing analytics dashboard, safeguarding for mentor–mentee contact, a compliance layer (consent, export, deletion), and a lightweight faculty role |
| **Prerequisites** | The core product (Phases 00–10) deployed and stable; ideally Phase 11 (events/donations) too, since the institutional pitch leans on alumni engagement; a real conversation with at least one of: the placement cell, the alumni relations office, or a department — this phase should not be built speculatively against imagined requirements |
| **PRD features** | New features F49–F57 (this phase defines them; they do not exist yet in the F01–F48 catalogue in `PRD.md` §6). Builds on F01 (verified sign-up), F21 (interview experiences), F38/F39 (reporting/admin), F45 (support page) |
| **Requirements** | New: FR-INST-1…9 (this phase defines them; add them to `TRD.md` when you start building) |

> ⚠️ **Read before building.**
> - This phase is **institution-shaped, not feature-shaped**. Before writing any code, get the actual college stakeholders in a room (or an email thread) and confirm: who owns the "Official" badge, who in the placement cell will verify interview experiences, who in student welfare receives safeguarding escalations, and what the college's data-protection posture already is. Building this layer against assumptions instead of a real conversation is the most likely way to waste the 10–16 hours.
> - **Nothing here should be hardcoded to one college.** Follow the existing rule in `CLAUDE.md`: college name, domains, office names, escalation emails, and every other college-specific value belong in `config/env.ts` / `.env.example` / `GET /api/config`, never inline. This phase is explicitly meant to make Crossroads pitchable to *any* college, not just the one it was built for.
> - **Do not promise compliance you have not implemented.** If you tell a college this is DPDP-Act-ready, every item in §6 below must actually be true, not aspirational. Under-promise rather than over-claim when talking to administrators.
> - This phase has no payment flow, so it does not carry the legal weight Phase 11 does — but the safeguarding and data-protection parts (§5, §6) are still governance-sensitive. Get the same kind of written sign-off from the college that Phase 11 asks for before storing or exposing real student safeguarding data.

> **Codebase conventions (verified build).** Follow the same conventions as every other phase in this repo — read this before writing any code:
> - Import Prisma types from the generated client: `import type { Prisma } from '../../generated/prisma/client'` (not `@prisma/client`).
> - Paginated lists return `{ data: { items, nextCursor } }`; use `LIMITS.PAGE_SIZE` from `src/config/constants.ts`, never a literal.
> - No hardcoded settings: deployment values go in `src/config/env.ts` (+ `.env.example`); tuning numbers in `src/config/constants.ts`; public settings for the web app (including anything added in this phase: official-badge copy, escalation contact, data-retention period) go through `GET /api/config`.
> - Routes declare `requireAuth` / `requireOnboarded` / `requireRole(...)` and `validate({ body, query, params })` with schemas from `@crossroads/shared`; read input from `req.valid`.
> - Every new endpoint gets a shared zod schema, a row in `apps/api/src/docs/openapi.ts` (Swagger at `/api/docs`), and a smoke check where useful in `apps/api/scripts/smoke.ts`.
> - Transactions that touch counters, points or notifications run inside `prisma.$transaction` (timeout configured in `src/lib/prisma.ts`).
> - Prisma migrations: always `--create-only`, review the SQL, remove any `DROP INDEX` lines for the search indexes, then apply; re-run `db:search` if they vanish.
> - Before committing: `npm run typecheck && npm test` at minimum; add `npm run build` and `npm run smoke` before pushing or tagging.
> - Commit as you go, one logical change per commit, same as every other phase — do not batch this whole phase into one commit.

---

## 1. Why this phase exists

Phases 00–11 build a complete *student-facing* product: it works without any college involvement, and that is correct for a hackathon demo. But a college will not adopt a tool that is purely "something students built." They adopt tools that:

- give their own staff a reason to check it daily (an admin dashboard with real numbers),
- carry their institutional voice (an official channel that is visibly theirs),
- plug into a process they already own (placements, alumni relations),
- protect them legally (safeguarding, data protection, moderation ownership),
- and don't require them to staff something new from scratch (a lightweight faculty/staff role, not a parallel bureaucracy).

This phase adds exactly those things, as a separate layer on top of the existing product, so the core student experience built in Phases 00–11 does not need to change shape to support it.

---

## 2. New feature catalogue for this phase

Add this table to `PRD.md` §6 (Feature catalogue) when you start building, continuing the existing F01–F48 numbering. Keep the same columns (ID, name, description, priority, phase).

| ID | Name | Description | Priority | Phase |
|---|---|---|---|---|
| F49 | Official channel | Verified "Official" posts and badges for the registrar, placement cell, alumni relations office, departments and recognized clubs; visually distinct from student posts; appears in This Week (F15) and the personalized home feed (F14) with an "Official" marker | P0 | 12 |
| F50 | Placement cell data ownership | Placement-cell-owned company records, drive calendar and eligibility criteria; bulk import from spreadsheet/CSV; a "Verified by placement cell" state for interview experiences (F21), distinct from "Self-reported" | P0 | 12 |
| F51 | Institution analytics dashboard | Staff-facing dashboard: active users, questions asked/answered, mentorship sessions, alumni response rate, per-department and per-batch breakdowns, trend over time; CSV/PDF export for internal reporting and accreditation use | P0 | 12 |
| F52 | Alumni engagement record | Per-alumnus record of hours given, areas helped, students helped, answers given; auto-generated acknowledgement/certificate the alumnus can download; feeds into the Mentor Wall (F36) and into alumni-relations outreach | P1 | 12 |
| F53 | Faculty and staff role | A `FACULTY_STAFF` role (or equivalent permission set) distinct from `ADMIN`: can post as a department/office under the Official channel (F49), can see aggregate (not individual-message) analytics for their own department, cannot moderate platform-wide content unless also an admin | P1 | 12 |
| F54 | Safeguarding escalation path | A reporting category specifically for harassment, ragging-adjacent behaviour, or any safety concern arising from a mentor–mentee interaction; routes to a designated student-welfare contact (configured, not hardcoded) in addition to the normal admin report queue (F38); first-year mentor–mentee threads are visible to a designated staff coordinator by default, disclosed to both parties at request time | P0 | 12 |
| F55 | Consent and data rights | Explicit consent screen at sign-up covering what is collected and why; a self-serve "export my data" action; a self-serve "delete my account and data" action with a clear explanation of what is retained (e.g. anonymized contribution counts) and why; a public data-processing notice page | P0 | 12 |
| F56 | Vendor/landscape comparison note | A short, honestly-sourced comparison of Crossroads against existing institutional alumni platforms the college may already use or have evaluated, kept as an internal doc (not a public page) for the pitch conversation; must be re-verified before every pitch, not reused stale | P2 | 12 |
| F57 | Pilot scorecard | A fixed, agreed-in-advance set of pilot success metrics (e.g. % of first-years asking ≥1 question, number of alumni answers per week, mentorship session completion rate) tracked on the institution analytics dashboard (F51) from day one of the pilot, so the pilot's outcome is measurable rather than anecdotal | P1 | 12 |

---

## 3. Where this fits in the existing architecture

No new services or infrastructure. This phase extends what already exists:

- **New Prisma models, not a new database.** Add models for official posts/badges, placement-cell-verified flags, alumni engagement records, consent records, and safeguarding escalations to the existing schema in `apps/api/prisma/schema.prisma`, the same way every other phase has added to it. Keep the same `--create-only` migration discipline as every other phase.
- **New role, not a new auth system.** Extend the existing `Role` enum (`STUDENT`, `SENIOR`, `ALUMNI`, `ADMIN`) with `FACULTY_STAFF`, and extend `requireRole` usage accordingly — do not build a parallel permission system.
- **New routes under existing module layout.** Follow `apps/api/src/modules/<domain>/{routes,service,serializers}.ts`. Likely new domains: `institution` (analytics, official posts), `safeguarding` (escalation routing), `consent` (data rights). Keep cross-cutting logic (e.g. computing analytics aggregates) in `src/services/`, consistent with how matching/feedRank/twins/quests/gamification/notify already live there.
- **New web routes under the existing frontend layout.** `src/features/institution/` for the staff dashboard and official-post composer, `src/features/consent/` for the data-rights pages, following the same `pages + api.ts` pattern as every other feature folder.
- **Reuses the existing notification and reporting pipeline.** Safeguarding escalation (F54) should extend the existing report/moderation flow from Phase 08 (F38/F39), not duplicate it — add a category and an additional routing target, not a second reporting system.
- **Reuses `GET /api/config`.** Every college-specific value this phase introduces — college name, escalation contact, data-retention period, consent copy, official-channel office names — goes through the existing public-config mechanism, the same rule that already governs email domains and demo accounts.

---

## 4. Build order within this phase

Work through these roughly in order; each builds on the last and each should be its own commit (or small group of commits), per the repo's git rules.

1. **Official channel (F49).** Add the badge/flag to posts and to the author display; restrict who can set it (`ADMIN` and `FACULTY_STAFF` posting on behalf of a verified office); surface official posts distinctly in This Week and personalized home. This is the smallest, highest-visibility piece — do it first so there is something concrete to show a stakeholder early.
2. **Faculty/staff role (F53).** Needed before placement-cell and department-level features make sense. Extend the role enum, auth guards, and onboarding to recognize this role (likely via an allowlist similar to the existing alumni invite mechanism in F01, not open self-signup).
3. **Placement cell integration (F50).** Bulk import tooling for company/drive data; the "verified by placement cell" state on interview experiences; placement-cell staff (via F53) get edit rights scoped to this content only.
4. **Institution analytics dashboard (F51).** Aggregate, read-only views over existing data (users, questions, mentorship sessions, answers) — this phase should not need new event-tracking infrastructure if the existing models already capture the underlying actions; if they don't, add the minimal counters needed rather than a general analytics pipeline.
5. **Alumni engagement record (F52).** Derive from existing contribution data (answers, accepted mentorship sessions, points ledger) rather than tracking it separately; the "certificate" is a generated document, not a new workflow for alumni to fill in.
6. **Safeguarding escalation (F54).** Extend the existing report/moderation flow; this is a trust-and-safety feature, so write the manual test cases for it before building (see §7) and have someone outside the engineering work review the escalation wording and routing before it goes live with real students.
7. **Consent and data rights (F55).** Sign-up consent screen, export action, deletion action, public data-processing notice page. Do this before any real student data is collected under this phase, not after.
8. **Pilot scorecard (F57) and vendor comparison note (F56).** Last, because both depend on the dashboard (F51) existing and on an actual pilot conversation having happened.

---

## 5. Safeguarding — specific care points

This is the most sensitive part of the phase; build it carefully rather than quickly.

- The escalation contact (student welfare office, counsellor, or equivalent) must be a real, confirmed contact at the specific college — never a placeholder email left in production. Treat an unconfigured escalation contact as a deploy blocker for this feature, not a TODO.
- Decide and document, before building, what "visible to a designated staff coordinator" means precisely: which threads, which role sees them, whether the two parties are told. Vague visibility rules are worse than no visibility feature — they create a false sense of either privacy or oversight. Disclose the rule to users plainly (in the consent screen from F55, not buried in a settings page).
- Keep the safeguarding report category separate from general content moderation (spam, misinformation) in both the data model and the UI — a harassment report should never sit in the same queue, with the same urgency, as a flagged typo.
- Do not log or expose the content of flagged private mentor–mentee messages anywhere except the specific escalation-review surface built for this purpose, and restrict that surface to the designated coordinator role, not all `ADMIN`s by default.

---

## 6. Data protection and consent — specific care points

- Write the data-processing notice in plain language, listing exactly what is collected (profile fields, posts, messages, points/badges, analytics events) and why, and who can see what (student ↔ student, student ↔ alumni, staff dashboards are aggregate-only except for safeguarding escalations per §5).
- "Export my data" should produce a complete, human-readable export of the user's own profile, posts, answers, requests and points history — not a partial or developer-only JSON dump.
- "Delete my account" should actually delete personal data, while being explicit about what is retained in anonymized form (e.g. a deleted user's helpful answer can remain visible with "a deleted user" as the attribution, since removing it would break value for everyone who relied on it) — decide and document this trade-off rather than leaving it implicit.
- Treat this as aligned with India's Digital Personal Data Protection Act, 2023 in spirit (consent, purpose limitation, access and erasure rights) — but **verify current DPDP Act compliance requirements before claiming compliance to any college**; law and its rules may have moved since this guide was written, and a claim of compliance is a claim the college will rely on.
- If the college already has its own data-protection or IT-security policy, this phase's consent and retention rules must be reconciled with it before pilot launch, not after.

---

## 7. Manual tests for this phase

Write these as explicit test cases (reuse the style of manual tests in earlier phase guides) before considering the phase complete:

- An `ADMIN` and a `FACULTY_STAFF` user can both post to the Official channel when authorized for their office; a plain `STUDENT`, `SENIOR` or `ALUMNI` cannot, and the UI does not offer them the option.
- Official posts are visually distinguishable from student posts in This Week and the personalized home feed, and this is true for a user who has no official content in their feed at all (empty state still makes sense).
- A placement-cell `FACULTY_STAFF` user can bulk-import company/drive data and mark an interview experience as "verified by placement cell"; a user without that role cannot, even by calling the API directly with a crafted request.
- The institution analytics dashboard shows at least: total and active users, questions asked/answered in a period, mentorship sessions requested/completed, alumni response rate, broken down by department and batch; numbers match what a manual count against the database would show for a small seeded dataset.
- CSV/PDF export from the dashboard opens correctly and matches the on-screen numbers.
- An alumnus can see their own engagement record and download a certificate; the certificate's numbers match their actual contribution history.
- Filing a safeguarding-category report routes it to both the normal admin queue and the designated safeguarding contact, and the report is visually/categorically distinct from a spam/misinformation report in any queue it appears in.
- A first-year's mentor–mentee thread is visible to the designated staff coordinator exactly as documented in §5, and not visible to any other staff or admin account that isn't also the coordinator.
- A user can complete sign-up only after seeing and accepting the consent screen; the data-processing notice page is reachable without being logged in.
- "Export my data" produces a complete, readable export for a test account with realistic activity (posts, answers, requests, points).
- "Delete my account" removes the account and personal profile data, while any retained anonymized content (e.g. an answer attributed to "a deleted user") behaves as documented, not as a bug.
- Every new value this phase introduces that is specific to a college (names, emails, retention periods, office names) is confirmed to come from `config/env.ts` / `.env.example` / `GET /api/config` by grepping the new code for hardcoded strings before considering the phase done.

---

## 8. Completion criteria

- All of F49–F55 are built, migrated, documented in `apps/api/src/docs/openapi.ts`, and pass the manual tests in §7.
- F56 and F57 exist at least as a drafted internal document and a working dashboard view respectively, even if the actual pilot conversation that would populate them with real numbers hasn't happened yet.
- `npm run typecheck && npm test && npm run build` pass; `npm run smoke` passes against a running API with this phase's new endpoints included.
- `PRD.md` §6 (feature catalogue) and `TRD.md` are updated with F49–F57 and their requirement IDs (FR-INST-1…9), keeping the existing cross-reference discipline described in `CLAUDE.md` ("Keep PRD feature IDs, TRD section references and phase cross-references consistent when editing").
- `docs/README.md`'s phase table includes a row for Phase 12.
- Nothing from this phase is hardcoded to one specific college — confirmed by the grep check in §7.
- A real stakeholder (placement cell, alumni relations, or a department) has seen at least the Official channel (F49) and the analytics dashboard (F51) and given feedback, even informally — this phase is not complete on code alone.
- Commit history for this phase shows one logical change per commit, matching the rest of the repo's git history; tag `phase-12` once complete, and push.

---

## 9. How to integrate this after finishing all other phases

This section assumes Phases 00–11 are already built, deployed and demoed, and treats Phase 12 as a distinct, later undertaking — not something to rush in alongside the hackathon build.

1. **Don't start writing code first.** Before touching the schema, have the stakeholder conversation described in the prerequisites above. The feature list in §2 is a strong default, not a fixed spec — a real placement cell or alumni office may want something slightly different, and finding that out after building F50 is expensive.
2. **Branch from the tagged, deployed state.** Start this phase from the `phase-10` or `phase-11` tag (whichever is your current production state), on a new branch (per `CLAUDE.md`'s git rules — never commit this phase's work directly to `main` without a branch, since it changes who has access to what).
3. **Build in the order in §4**, committing each step separately, and keep the existing Phase 00–11 features working throughout — this phase must not be a rewrite. Run `npm run typecheck && npm test` after each step, not just at the end.
4. **Seed a realistic pilot dataset before the first stakeholder demo of this phase.** Reuse the existing seed scripts (`db:seed:all`) and extend them with a handful of official posts, a sample placement-cell import, and enough activity history that the analytics dashboard (F51) shows meaningful numbers rather than empty states.
5. **Run the manual tests in §7 end to end**, ideally with someone other than the person who built the feature, before giving any staff account real access.
6. **Pilot with one department or one batch first**, not the whole college at once — this mirrors the "pilot first" framing already used when pitching the product, and lets you validate the safeguarding and consent flows (§5, §6) with a small, known group before wider exposure.
7. **Set the F57 pilot scorecard metrics *before* the pilot starts**, in writing, agreed with the stakeholder — not derived afterward from whatever numbers happened to look good.
8. **After the pilot window**, review the scorecard with the stakeholder, fix what the pilot revealed, and only then propose a wider rollout. Treat a second pilot round as normal, not as failure.
9. **Keep this phase's documentation (this file, plus the `PRD.md`/`TRD.md` updates from §8) as the thing you hand to the next person** — whether that's a teammate, a future maintainer, or the college's own IT staff if they ever take over hosting — so the institutional layer doesn't live only in one person's head, which is the exact problem Crossroads exists to solve for everything else.

---

## 10. If you're behind

This phase has no fixed time budget the way Phases 00–11 do (it isn't part of the 12-hour hackathon window), so "behind" here means a stakeholder conversation is stalled or a sub-feature is taking much longer than expected. If that happens:

- Ship F49 (Official channel) and F51 (analytics dashboard) first and alone if nothing else — these two are the smallest and carry most of the pitch value on their own.
- Treat F54 (safeguarding) and F55 (consent/data rights) as non-optional before any real student uses the product under this phase, even if it means delaying F50/F52/F56/F57 further — the governance pieces matter more than the engagement pieces.
- F56 (vendor comparison) and F57 (pilot scorecard) can slip to "do this right before the actual pitch meeting" without any cost, since they're documents/views that depend on a live conversation anyway.
