# Phase 15 — Engagement

| | |
|---|---|
| **Goal** | Keep juniors coming back and give seniors and alumni a reason to keep answering during the pilot semester |
| **Prerequisite** | Phase 14 gate met |
| **Gate** | Every task committed with smoke checks; the pilot scorecard (14.5) is live; the user signs off. Tag `phase-15` |

> Same codebase conventions as Phase 13. Every AI feature here goes through `generateJSON` (typed in 13.7) with a feature label and a working non-AI fallback when `AI_API_KEY` is empty. AI only **sorts or drafts for humans**; it never removes content, sends messages or decides on its own. Read `docs/DEEP_ANALYSIS.md` §3.3 and §5 before starting: they explain why each of these exists.

---

## 15.1 Background job runner

**Problem.** Nothing in the API runs on a schedule, so reminders and digests cannot be sent.

**Do.**
1. Add `pg-boss` (runs on the existing Postgres; no new infrastructure). Give it the **direct** (non-pooled) Neon URL: add `DIRECT_URL` to `env.ts` (today only `prisma.config.ts` reads it). Start it from `src/index.ts`, put jobs in a new `src/jobs/` folder, and keep every schedule and on/off switch in `env.ts` (`JOBS_ENABLED`, default `false` in tests). Stop it cleanly on shutdown.
2. Jobs must be idempotent (safe to run twice) and must not run in unit tests.
3. A free-tier Render instance that has gone to sleep runs no jobs. Follow the 13.8 decision: if the API stays on the free tier, add a protected `POST /internal/jobs/:name` endpoint (shared secret in `env.ts`) and trigger it from a scheduled GitHub Actions workflow instead.
4. First jobs:
    - Opportunity deadline reminders (new; `services/alerts.ts` today only notifies on new opportunities): notify users who bookmarked an opportunity `Post` whose `deadline` is N days away (N in `constants.ts`), through `services/notify.ts`, once per user per post.
    - Nightly clean-up of expired `EmailCode` rows.
    - The weekly digest from 15.3 (wire it up when 15.3 lands).

## 15.2 View counts and impact numbers

**Do.**
1. Count views of question posts and experiences, at most once per viewer per day: a `ContentView` table with a unique key on `(viewerId, targetType, targetId, day)`, written with an insert that ignores duplicates. Do not count the author's own views.
2. On each senior/alumni profile and their alumni dashboard: "Your answers and experiences were viewed by N students this semester" (semester boundaries from `ACADEMIC_YEAR_START_MONTH`). Always shown to them; public only if they opt in (a new flag next to `showOnMentorWall`).

## 15.3 Weekly digests with reciprocity prompts

**Do.** A weekly email (via `lib/mailer.ts`) and an in-app digest card:
1. **Juniors:** new answers on topics they follow, deadlines in the next 7 days, one suggested mentor with the match reason.
2. **Seniors and alumni:** the 2–3 open questions matching their `canHelpWith`, plus their impact number from 15.2.
3. **Reciprocity:** if a senior was once helped on the platform (an accepted `Connection` where they were the requester), say so: "someone helped you with X; here's a junior asking about Y".
4. AI may write one short summary line (feature `digest`); fall back to a template.
5. Opt-out: add `User.digestEmails Boolean @default(true)`, a toggle in notification settings, and a one-click unsubscribe link in every email (a signed token, no sign-in needed). The job honours it; the in-app card stays.
6. **Decision:** the email provider's free tier has a daily sending cap (check the current Resend limits). A department of 250 plus alumni may exceed it in one day; ask whether to spread sends across the week or start with the in-app card only.
7. Skip empty digests: no email when there is nothing new for that person.

## 15.4 AI moderation triage

**Do.** Reports already carry a reporter-chosen `reason` (`SPAM | MISLEADING | INAPPROPRIATE | HARASSMENT | OTHER`). On each new report, the classifier (feature `report-triage`) suggests its own `aiReason` from the same enum and a `severity` 1–3; store both on the `Report`, keep the reporter's reason, and sort the admin queue by severity, then age. A report the reporter or the classifier marks `HARASSMENT` always follows the existing safeguarding path. Fallback: keyword rules in a config list in `constants.ts`. Admins can correct the label (`adminReason`); keep corrections for later evaluation of the classifier.

## 15.5 Mentorship request draft assist

**Problem.** Vague requests ("can you help me with DSA?") get ignored.

**Do.** In `apps/web/src/features/people/ConnectDialog.tsx`, a "Help me write this" button: turns the junior's rough note into a short, specific ask (feature `request-draft`), grounded in the senior's `canHelpWith` and the junior's `lookingFor`. The draft fills the text box; the junior always edits and sends it themselves. Fallback: a fill-in template built from the same fields. Rate-limit with `aiLimiter`.

## 15.6 One-tap co-sign on answers

**Do.** Seniors and alumni can add a public "I'd say the same" co-sign to an answer (their name shown, unlike votes).
1. `CoSign` table, unique on `(userId, commentId)`. No co-signing your own answer; juniors cannot co-sign; removing a co-sign is allowed.
2. The answer's author gets a small point award through `PointsLedger` with its usual unique key (action `ANSWER_COSIGNED`, `refId` = the co-sign), amount in `services/gamification.ts`. The co-signer gets no points, so co-signing can't be farmed; it shows in their profile contributions instead.
3. Show co-signers on the answer card (first few names plus a count).

## 15.7 Installable web app and push notifications

**Do.**
1. Make `apps/web` an installable PWA: manifest, icons from `public/brand/` (add the maskable sizes needed), a service worker that caches the app shell only (never `/api` responses).
2. Web Push: `PushSubscription` table, VAPID keys in `env.ts`, subscribe from notification settings, send from `services/notify.ts` for new chat messages, accepted mentorship requests and deadline reminders. In-app notifications remain the source of truth; push is an extra channel. When the push service says a subscription is gone (404 / 410), delete it silently.
3. Test on Android Chrome and desktop; note in the README that on iOS, push works only after the app is added to the home screen.
