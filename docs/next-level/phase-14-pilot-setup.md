# Phase 14 — Pilot setup

| | |
|---|---|
| **Goal** | Give college staff (placement cell, department coordinator) the tools to run a one-department pilot, load real content before juniors arrive, and start measuring from day one |
| **Prerequisite** | Phase 13 gate met |
| **Gate** | Every task committed; the user confirms the placement cell and student welfare have signed off on the staff role, safeguarding contact and data notice. Tag `phase-14` |

> Same codebase conventions as Phase 13 (see the top of `phase-13-harden.md` and `CLAUDE.md`). Read `docs/phases/phase-12.md` first: features F49–F57 there are the spec this phase completes. Already built and to reuse, not rebuild: official posts (`Post.officeName`, `/admin/official-posts`), institution analytics (`modules/admin/analytics.ts`), safeguarding coordinator (`User.isSafeguardingCoordinator`), single alumni invite (`AllowedEmail` upsert in `admin.service.ts`), and admin experience verification (`Experience.isVerified`, `adminVerifyExperience`).

> **Why 14.4 matters early.** The week-8 activity metric (14.5) and 16.5's search-miss review can only be computed from data recorded while the pilot runs. Ship 14.4 before the first pilot student signs in, even if the rest of the phase slips.

---

## 14.1 Faculty/staff role (PRD F53)

**Problem.** Roles are only `STUDENT | SENIOR | ALUMNI | ADMIN`. A placement-cell staff member would need full admin, including user suspension and every report. Departments are a placeholder list (`DEPARTMENTS` in `packages/shared/src/constants.ts`, marked ⚠️), so per-department scoping would rest on made-up values.

**Decisions first.** Show the user this proposed permission list and wait for a yes or changes before writing the migration. Also ask for the real department list for the pilot.

| Can | Cannot |
|---|---|
| Post official posts for their own office | Suspend or edit users |
| See institution analytics filtered to their department | See reports or the safeguarding queue |
| Verify interview experiences (placement office only) | Read private messages |
| Run the bulk imports in 14.3 for their office | Change platform settings |

**Do (after approval).**
1. Replace `DEPARTMENTS` with the user's list.
2. Schema: `FACULTY_STAFF` in `enum Role`; `User.staffOffice String?`, `User.staffDepartment String?` (validated against `DEPARTMENTS`). The placement office's name comes from a new `PLACEMENT_OFFICE_NAME` in `env.ts`, exposed via `GET /api/config`.
3. The role list is written out by hand in three places: `SessionUser` in `src/middleware/auth.ts`, `Role` in `packages/shared/src/types/enums.ts`, and the Prisma enum. Derive the API one from the Prisma type so it can't drift, and update the shared type, `RoleBadge`, labels, and every `requireRole(...)` call that should include staff. Add a small `requireStaffOrAdmin` guard if it reads better.
4. Scope official posts: staff may only post with `officeName === user.staffOffice`.
5. Scope analytics: staff see only their `staffDepartment`; the department filter is fixed for them.
6. Admin user page: admins assign the role, office and department.
7. Staff must not be offered onboarding steps meant for students (current year, looking for), and do not appear in Discover People or matching.
8. Smoke checks: staff can post officially for their office, get 403 for another office, 403 on `/admin/reports`.

## 14.2 Verified experiences owned by the placement cell (PRD F50)

**Decision.** What "reject" does. Proposed: the experience stays visible as "Self-reported" with the reviewer's reason stored and the author notified; hiding content stays a moderation action (`isRemoved`). Ask before building.

**Do.**
1. Schema: `Experience.verifiedById String?` (relation to User, `onDelete: SetNull`), `verifiedAt DateTime?`, `reviewNote String?`. Set them whenever verification changes, inside the same transaction as any points or notifications.
2. Let placement-office staff (14.1) verify, not only admins. Add a staff "Verification queue" page listing unverified, unreviewed experiences, oldest first, with approve / reject-with-reason.
3. Show "Verified by placement cell" (existing `VerifiedBadge`) vs "Self-reported" (existing `SelfReportedBadge`) consistently on company pages and experience cards.
4. Reviewer flags (never auto-reject): likely duplicates (trigram similarity of `tips` on the same company and year above a threshold in `constants.ts`) and implausible entries (number of rounds far outside that company's other experiences). Optional AI check through `generateJSON` (feature `verify-experience`) with the usual non-AI fallback: no AI flag, the rule flags still show.

## 14.3 Bulk import

**Problem.** Cold start. Loading 80+ real experiences and inviting 100+ alumni one form at a time won't happen.

**Do.** An admin/staff "Import" page that accepts CSV paste or upload (parse in the browser, send JSON rows to the API, cap rows per request in `constants.ts`):
1. **Alumni invites** → `AllowedEmail` rows (email, role). Optionally email each an invite link (respect the provider's daily cap; see 15.3). Report created / already existing / invalid per row.
2. **Companies** → create or update by slug.
3. **Interview experiences** collected by the placement cell (for example a Google Form export). Columns map to the real `Experience` fields: `companySlug, role, year, difficulty (1–5), outcome, prepWeeks, rounds, resources, tips, authorEmail`. `rounds` is a `;`-separated list of `name:type` pairs (type from `SimRoundType`), and `resources` is `;`-separated; anything richer stays a manual edit. Imported rows are verified by the importing staff member (`verifiedById`). Set `authorId` to the user with `authorEmail` if one exists, otherwise null.
4. Add `Experience.source` (`SELF | PLACEMENT_IMPORT`, default `SELF`) so an imported experience with no author shows "Shared via placement cell", while one whose author deleted their account keeps today's "A deleted user" label (`ExperienceCard.tsx`).
5. Validate every row with shared zod schemas; import in one transaction per batch; return a per-row result table. Offer downloadable CSV templates with the exact headers.

## 14.4 Pilot instrumentation

**Problem.** Nothing records when someone uses the app (there is no last-seen or activity field), so "juniors active in week 8" cannot be computed, and nothing records searches that find nothing, which 16.5 needs.

**Do.**
1. `UserActivityDay` table: `(userId, day)` unique, written from `authOptional` at most once per user per day (keep an in-process "already written today" set so this is not a write per request; a duplicate insert is ignored). Delete with the user.
2. `SearchMiss` table: normalised query text, result count, timestamp; **no user id**. Write it when a search returns zero results. Purge rows older than a retention period in `constants.ts`.
3. Mention both in the data notice (`features/legal/DataNoticePage.tsx`).

## 14.5 Pilot scorecard (PRD F57)

**Do.** A "Pilot scorecard" card at the top of the admin/staff analytics page, filtered by department and a date range, showing six metrics against targets set in `constants.ts` (so the user can change them):

| Metric | Default target | Computed from |
|---|---|---|
| Juniors (year 1–2) who asked or bookmarked at least once | 60% | `User.currentYear`, `Post`, `Bookmark` |
| Median time to first answer on questions | under 24 h | first `Comment` per question `Post` |
| Distinct seniors/alumni who answered in the last 7 days | 25 | `Comment` authors by role |
| Mentorship requests accepted | 50% | `Connection.status` |
| Placement-verified interview experiences | 80 | `Experience.verifiedById` (14.2) |
| Juniors active in week 8 after their first active day | 40% | `UserActivityDay` (14.4) |

Compute in SQL in `analytics.ts`; show each as value, target and a simple on-track / behind state, with "not enough data yet" when a cohort is too young (for example nobody has reached week 8). Unit test the calculations with fixed data.

## 14.6 Analytics CSV export (PRD F51)

**Do.** "Export CSV" on the analytics page for the current filters: one row per department with every metric, plus the scorecard. Aggregates only; never message content or personal data beyond what admins already see. Staff export only their own department. CSV only; F51's PDF export is not planned.
