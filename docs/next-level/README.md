# Next level — start here

This folder is the work plan after the hackathon build (Phases 00–12). It turns Crossroads from a finished demo into something a real Amrita department can use for a semester. Claude Code: read this file first, then work through the phases **in order**.

## How to work through this folder

1. Read `CLAUDE.md` (repo root). Its rules apply to everything here and win if anything conflicts.
2. Open the **first phase below that is not marked done** in the progress checklist, and read that phase file in full before writing code.
3. Do its tasks **in the order written**, one at a time. For each task:
    - read the files it names before changing them; if the code no longer matches what the task says, the code wins: adapt the task and note the difference in the commit message;
    - make the change, plus the tests, OpenAPI rows and smoke checks the task asks for;
    - run `npm run typecheck && npm test` (and `npm run build` + `npm run smoke` when the task touches routes, schemas or the build);
    - commit it as its own commit, following the Git rules in `CLAUDE.md`, with the task number in the message (`feat: forgot / reset password (13.4)`);
    - tick its box in the checklist below in the same commit.
4. When a task says **Decision**, stop and ask the user. Those are product, permission or money choices. Do not guess, and do not sign up for any paid service. The open decisions are collected below so the user can answer them early.
5. Do not start a phase until the previous phase's **gate** is met. At a gate, summarise for the user what changed and what they need to check by hand.
6. If you find a bug or gap that is not in these files, fix it only if it is small and clearly in scope; otherwise add it to "Found along the way" at the bottom of this file and tell the user.

## Phases

| Phase | File | Goal | Gate to move on |
|---|---|---|---|
| 13 | [phase-13-harden.md](phase-13-harden.md) | Safe and dependable enough for real students | CI green, all tasks committed, live `/api/health` answering |
| 14 | [phase-14-pilot-setup.md](phase-14-pilot-setup.md) | Tools the placement cell and staff need to run a pilot, real content loaded before juniors arrive, and the measurements the pilot will be judged on | User confirms the placement cell and student welfare have signed off |
| 15 | [phase-15-engagement.md](phase-15-engagement.md) | Features that keep juniors coming back and get seniors/alumni answering during the pilot | Pilot scorecard live on the admin dashboard; user signs off |
| 16 | [phase-16-scale.md](phase-16-scale.md) | Multi-campus and multi-college readiness | Only start when the user asks |

## Progress checklist

Claude Code keeps this up to date. One box per task.

**Phase 13 — Harden**
- [x] 13.1 Unit tests run without a database
- [ ] 13.2 Continuous integration
- [ ] 13.3 Revocable sessions
- [ ] 13.4 Forgot / reset / change password
- [ ] 13.5 Chat inbox N+1 fix
- [ ] 13.6 Explicit demo-shortcut flag
- [ ] 13.7 Harden the AI wrapper
- [ ] 13.8 Error monitoring and health check
- [ ] 13.9 Deployment config in the repo
- [ ] 13.10 Clean-ups
- [ ] Gate met, tagged `phase-13`

**Phase 14 — Pilot setup**
- [ ] 14.1 Faculty/staff role
- [ ] 14.2 Verified experiences owned by the placement cell
- [ ] 14.3 Bulk import (alumni invites, companies, experiences)
- [ ] 14.4 Pilot instrumentation (activity days, search misses)
- [ ] 14.5 Pilot scorecard on the analytics dashboard
- [ ] 14.6 Analytics CSV export
- [ ] Gate met, tagged `phase-14`

**Phase 15 — Engagement**
- [ ] 15.1 Background job runner
- [ ] 15.2 View counts and impact numbers
- [ ] 15.3 Weekly digests with reciprocity prompts
- [ ] 15.4 AI moderation triage
- [ ] 15.5 Mentorship request draft assist
- [ ] 15.6 One-tap co-sign on answers
- [ ] 15.7 Installable web app and push notifications
- [ ] Gate met, tagged `phase-15`

**Phase 16 — Scale** (only when the user asks)
- [ ] 16.1 Shared state for more than one API instance
- [ ] 16.2 File uploads
- [ ] 16.3 Institution tenancy
- [ ] 16.4 Shareable mentor credential
- [ ] 16.5 Semantic search, only if search logs justify it

## Open decisions

Ask the user about these when you reach the task, or earlier if they are around. Record the answer in the task's commit message.

| Task | Question |
|---|---|
| 13.8 | Move the Render API off the free tier, or add an external keep-alive ping? (Also decides whether 15.1's scheduled jobs can run in-process.) |
| 13.10 | One public name: "Crossroads" or "Amrita Ascend"? |
| 14.1 | Approve the staff permission list. |
| 14.1 | The real department list for the pilot (replaces the placeholder `DEPARTMENTS` in `packages/shared/src/constants.ts`). |
| 14.2 | What "reject" does to an experience: keep it visible as self-reported (proposed) or hide it. |
| 15.3 | Is the email provider's free daily cap enough for the weekly digest, or should digests be in-app only at first? |
| 16.x | Redis provider, storage provider, alumni on several campuses. |

## Already built — reuse, don't rebuild

Checked against the code at `955d004`. These were raised in `docs/DEEP_ANALYSIS.md` and are already fixed or in place:

- Deleting an account keeps the person's answers and experiences (`Comment.author` and `Experience.author` are `onDelete: SetNull`).
- Public data-processing notice (`features/legal/DataNoticePage.tsx`), consent at sign-up, self-serve export and deletion (`modules/users/account.service.ts`).
- Safeguarding path: `HARASSMENT` report reason, `User.isSafeguardingCoordinator`, `SAFEGUARDING_CONTACT_EMAIL`.
- Official posts (`Post.officeName`), institution analytics (`modules/admin/analytics.ts`), single alumni invite (`AllowedEmail`), admin experience verification (`Experience.isVerified`).
- `GET /api/health` already runs `SELECT 1` and returns 503 when the database is down.
- Suspended users are already rejected on every request (`authOptional` checks `isSuspended`).

## Not planned

Do not start these unless the user asks: real payment processing for giving, a native mobile app, LinkedIn sign-in or API integration, a separate vector database.

## Background

- `docs/DEEP_ANALYSIS.md` (Oct 2026) explains the reasoning behind most of these tasks, especially §2 (defects), §3.3 (AI additions) and §5 (why seniors and alumni would help).
- The pilot scorecard these phases build towards, for one department of about 250 first- and second-years by April 2027: 60% of juniors ask or bookmark at least once; median time to first answer under 24 h; 25+ seniors/alumni answering weekly; 50% of mentorship requests accepted; 80+ placement-verified interview experiences; 40% of juniors still active in week 8.
- Positioning: Amrita already runs an official Alumni Mentoring Program. Crossroads should plug into it as the student-side knowledge layer (cited answers, verified interview experiences, prep), not compete with it as another alumni portal.
- State at the time of writing (20 Nov 2026, `955d004`): 7 unit test files, a smoke suite against a live API, no CI, about 30 oxlint warnings, deployed on Vercel (web) + Render free tier (API) + Neon.

## Found along the way

(Claude Code: add issues here that are out of scope for the current task.)

- Git tags stop at `phase-09`; Phases 10–12 are built but untagged, although `CLAUDE.md` says completed phases are tagged. Ask the user whether to tag the commits where they finished.
- `apps/web/src/features/chat/api.ts` hardcodes `POLL_MS = 30_000`; move it with the other web tuning values when that area is next touched.
