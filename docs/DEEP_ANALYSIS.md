# Crossroads — Deep Analysis: Code, AI, University Value, and Incentive Design

**Date:** 2026-10-11
**Scope:** full codebase read (apps/api, apps/web, packages/shared, ~29k lines), running checks (typecheck, tests, lint, smoke), and the product/business question of who this serves and why it would actually get used.

This is a working document, not a phase guide. Treat the numbered findings as things to fix; treat the later sections as things to decide.

---

## 1. Code quality: what's actually good here

Before the findings, it's worth being honest about the baseline, because it changes how urgently each item should be treated.

- **Authorization is consistently correct.** Every mutation I checked (`respond`, `deletePost`, `toggleStep`, team updates, connection responses) verifies ownership or role before acting, and uses 404 instead of 403 where leaking existence would be a problem (e.g. `deletePost` returns "not found" to a non-owner instead of "forbidden", so you can't probe which posts exist).
- **No SQL injection surface.** Every `$queryRaw` call uses tagged templates or `Prisma.sql`, never `$queryRawUnsafe` or string concatenation. I checked all 11 raw-query sites.
- **No XSS surface.** User text never goes through `dangerouslySetInnerHTML`; `PlainText.tsx` renders user content as React nodes with auto-linked URLs, and link `href`s are validated with `isSafeUrl` (scheme-restricted to `http(s)://`) before rendering as `<a>` tags.
- **Rate limiting is layered correctly**: anonymous-IP limits on auth endpoints, per-user limits on writes and AI calls, with a documented fallback-to-IP behavior.
- **Idempotency is handled deliberately**, not accidentally: points are awarded via `PointsLedger` with a unique `(userId, action, refId)` constraint and `skipDuplicates`, so a double-click or retried request can't double-award. Chat message sends and the smoke suite both account for races.
- **125 routes, 93 async handlers with no manual try/catch** — this is correct, not a gap, because Express 5 auto-forwards rejected promises to the error handler. A naive scan flags this as risky; it isn't.

This is a better-than-typical hackathon codebase. The findings below are real, but they're refinements on a solid foundation, not symptoms of a shaky one.

---

## 2. Confirmed defects (ranked by impact)

### 2.1 — Account deletion silently destroys community knowledge (HIGH — contradicts the product's core promise)

**Where:** `apps/api/prisma/schema.prisma`, `Comment.author` relation (`onDelete: Cascade`); exercised by `apps/api/src/modules/users/account.service.ts::deleteMyAccount`.

**The bug:** the PRD's first line of value proposition is *"an alumni and senior Q&A ('Ask a Senior') where answers are stored and reused for every future batch."* But `Comment` cascades on `User` deletion. When any senior or alumnus deletes their account — including through the self-serve "Your data" page I built in Phase 12 — **every answer they ever wrote is permanently deleted**, not anonymized. A best answer that three batches of first-years have bookmarked, built roadmaps from, and cited disappears instantly. `Post.bestAnswerId` is `onDelete: SetNull`, so the question itself survives, but reverts to "unanswered" — the exact state the product exists to prevent.

This isn't a hypothetical: it's the default behavior of the delete-account button that's live right now.

**Fix (two parts):**
1. On deletion, reassign `Comment.authorId` to a sentinel "deleted user" account (or null it, with a schema change to make `authorId` optional, mirroring how `Post.author` and `Story.author` already use `onDelete: SetNull`) **before** deleting the `User` row, inside the same transaction.
2. Decide the retention question explicitly rather than by accident: does a deleted senior's helpful answer stay visible as "— a former student"? I think yes, given the product's premise, but this is a call for you and should be written down in the data-processing notice, not left implicit in a Prisma relation.

### 2.2 — Chat inbox does 1+N queries on every load (MEDIUM — will get slow, not urgent at current scale)

**Where:** `apps/api/src/modules/chat/chat.service.ts::listConversations`.

Loads up to 50 conversations, then runs a separate `prisma.message.count()` per conversation to compute the unread badge. At 50 conversations that's 51 round trips to Neon (which already has meaningful latency — see `src/lib/prisma.ts`'s comment about raising the interactive-transaction timeout for it). This runs on every poll (every 30s per open tab) and every SSE reconnect.

**Fix:** one `GROUP BY` query — count unread messages per conversation in a single `$queryRaw`, or compute it via Prisma's `_count` with a conditional relation filter. At current demo scale (a few dozen users) this is invisible; at real university scale (thousands of students, each with a handful of active threads) it's a genuine bottleneck, and it's cheap to fix now versus under production load later.

### 2.3 — The project guide's doc index depends on an undocumented deployment assumption (MEDIUM — silent failure mode)

**Where:** `apps/api/src/config/env.ts` (`PROJECT_DOCS_DIR` defaults to `'../../docs'`, resolved against `process.cwd()`), consumed by `apps/api/src/modules/guide/guide.service.ts`.

This resolves correctly when the process's working directory is `apps/api` (true for `npm run dev -w apps/api` and for a `tsup` build run from that directory) — `apps/api/../..` is the repo root, so `../../docs` finds `docs/`. But there is **no deploy config in this repo** (`render.yaml`, `vercel.json` — I checked, neither exists), and the chat earlier established the deployment target is Vercel (web) + Render (API). If Render's build only packages `apps/api` as the deploy artifact (a very common way to configure a monorepo API service) without the sibling `docs/` folder, the guide's `readdirSync` call throws on startup, or — if the directory read is wrapped more defensively than it currently is — the guide silently returns `no_match` for every question, with the chatbot panel visible and seemingly working but never actually finding anything.

**Fix:** when you write the actual Render/Vercel deploy config (which doesn't exist yet — see §2.5), make sure the API's build step either copies `docs/` into the deploy artifact or the service's root directory includes it. Add a startup log line reporting how many doc chunks were indexed (the code already logs this via `logger.info({ chunks: chunks.length }, ...)` — just make sure you check Render's boot logs for it once deployed, since a `0` there means the guide is silently non-functional).

### 2.4 — `AUTO_VERIFY_EMAIL` and `ALUMNI_OPEN_SIGNUP` are both still `true` in the local `.env` used for demos (LOW, but worth a conscious check before any real pilot)

Both are correctly refused at startup when `NODE_ENV=production` (good — I added that guard earlier in this session). But there's no equivalent guard or warning for a **staging** environment, which is exactly where a university pilot would likely run first. If staging is deployed with `NODE_ENV=production` this is fine; if it's deployed with `NODE_ENV` unset or `development` (common for a "soft launch" staging box), both flags stay on, meaning anyone with a Gmail address can self-register as a verified alumnus with no email confirmation. For a pilot where real students see real alumni badges, this is the kind of thing that erodes trust fast if discovered.

**Fix:** treat any deployed, internet-reachable environment as requiring both flags off, not just `NODE_ENV=production`. Simplest version: key the guard off `WEB_ORIGIN` not being `localhost`, or just always require an explicit opt-in flag (`ALLOW_DEMO_SHORTCUTS=true`) rather than inferring safety from `NODE_ENV`.

### 2.5 — No deployment configuration exists in the repository (gap, not a bug)

`render.yaml` and `vercel.json` do not exist. `docs/TRD.md` §16 presumably describes the intended deploy shape, but nothing in the repo enforces or automates it. This means every deploy is manual and undocumented-in-code, which is fine for a hackathon demo and a real risk for a pilot with a college's IT office, who will ask "how do we redeploy this if the person who built it graduates." This is worth doing before any pilot conversation, not urgently today.

### 2.6 — Test coverage is real but narrow

7 unit test files, 44 tests, covering: matching, feed ranking, text helpers, pagination, badge levels, opportunity alerts, auth domain validation, password hashing, path twins, quests. That's the algorithmically interesting 20%. **Zero unit tests exist for**: every service in `apps/api/src/services/` except `alerts`, `feedRank`, `matching`, `quests` (so `gamification.ts`, `notify.ts`, `questionBank.ts`, `readiness.ts`, `retrieval.ts`, `roadmapBuilder.ts`, `simulator.ts`, `twins.ts` → wait, `twins.ts` is tested — `chatHub.ts` is not), and zero for any of the 34 API modules' service layers directly (they're covered indirectly, and well, by the 71-check smoke suite against a live API, which is genuinely good integration coverage — but there's no fast, no-database layer testing business logic like `gamification.evaluateBadges`'s threshold math, `roadmapBuilder`'s gap-prioritization logic, or `simulator`'s difficulty-adaptation logic).

**This isn't urgent to fix wholesale.** It's worth flagging because the three AI/algorithmic services most likely to have subtle bugs — `roadmapBuilder`, `simulator`, `readiness` — are exactly the ones with no unit tests, only smoke coverage that exercises the happy path once.

---

## 3. Where AI is already used, and what's actually missing

### 3.1 What's built (accurate as of this session)

| Feature | File | AI role | Fallback without a key |
|---|---|---|---|
| Grounded answer to a question | `modules/ai/ai.service.ts::answer` | Groq writes a cited answer from BM25/trigram-retrieved past senior answers | Returns the raw matching answers with citations, no synthesis |
| Thread/experience summary | `modules/ai/ai.service.ts::summary` | Groq writes 3–5 bullet points from a thread or a company's interview experiences | A deterministic summary (topic frequency, average difficulty, round sequence) computed without AI |
| Roadmap generation | `services/roadmapBuilder.ts` | Groq turns alumni journeys + target companies into a structured, semester-by-semester plan with prioritized skill gaps | A rule-based roadmap built from the same inputs, no LLM |
| Interview simulator questions | `services/simulator.ts` | Groq generates MCQ/short-answer/coding-approach questions sourced from real alumni interview experiences, with adaptive difficulty | A static question bank (`services/questionBank.ts`, 298 lines, hand-authored) |
| Simulator grading | `services/simulator.ts` | Groq grades free-text answers against a rubric | Keyword/rubric-point matching without a model |
| **Project guide (new this session)** | `modules/guide/guide.service.ts` | Groq answers questions about the *project itself* (not the campus content) by retrieving from the project's own docs (BM25 over `docs/`) and citing sources | Returns the matching doc excerpts with no synthesis |

Every single AI feature has a working non-AI fallback — this was a design requirement from the start (`CLAUDE.md`: *"every feature has a non-AI fallback when `AI_API_KEY` is empty"*) and it's actually been honored throughout, which is unusual discipline for a feature list this size.

### 3.2 Where AI is *not* used yet, and whether it should be

Going through every module that doesn't touch `generateJSON`:

- **Moderation (`modules/reports`, `modules/admin`).** Reports are entirely human-reviewed right now — a student flags something, an admin reads it and clicks Remove/Dismiss. For a single pilot department this is fine. At university scale, an AI pre-classifier (spam vs. genuine complaint vs. ambiguous) that **sorts the admin queue by likely severity** — never auto-removes anything — would materially reduce the time-to-response that makes moderation credible. This is a good phase-13 candidate, not urgent now.
- **Search (`modules/search`)** is pure PostgreSQL full-text + trigram, no embeddings, no semantic search. This is explicitly a design decision (`CLAUDE.md`: *"No vector DB"*) and I'd keep it that way for now — trigram/FTS search is fast, free, debuggable, and good enough for a campus-scale corpus. Semantic search is worth revisiting only if students start searching with natural-language questions that keyword search misses often (you'd see this in search analytics as repeated zero-result queries).
- **Matching (`services/matching.ts`)** is a hand-weighted scoring function (skills overlap, interests overlap, goal track, help-with↔looking-for complementarity), not AI. This is the right call — it's explainable ("matched because: same goal track, overlapping skills in DSA"), which the product explicitly prizes (PRD: *"explanation for every suggestion; no trained ML model"*). An LLM-based matcher would be a regression here, not an improvement — it would be slower, costlier, and less explainable for marginal quality gain on a scoring problem that's naturally tabular.
- **Notifications (`services/notify.ts`)** are template strings, not AI-written. This is correct — a notification saying "3 new answers to your question" doesn't benefit from an LLM.
- **Onboarding** has no AI touch — profile fields are filled by the user directly. Could an LLM suggest skills/interests from a pasted résumé or LinkedIn summary to speed up onboarding? Possibly, but it adds a dependency to the critical first-five-minutes flow, which is risky; I'd test it as an optional "paste your résumé to pre-fill" button, never the default path.

### 3.3 Concrete, high-value AI additions worth building next (ranked)

1. **AI-assisted moderation triage** (described above) — directly reduces admin burden, which is the thing that makes "who maintains this" answerable to a college.
2. **Placement-cell verification assist**: when a student submits an interview experience, have the model flag likely-duplicate or likely-fabricated entries (e.g. implausible round counts, inconsistent company/role pairing) for the placement cell's review queue, rather than making every submission wait for manual verification before it's visible. This directly serves the placement-cell integration from phase-12.
3. **"Draft my mentorship request" assist**: juniors often don't know how to phrase a cold request to a senior. A small AI assist that turns "I want help with DSA" into a specific, answerable ask (grounded in the senior's stated `canHelpWith` and the junior's `lookingFor`) would raise response rates — this is a real UX failure mode (vague requests get ignored) that AI is well-suited to fix, because it's a rewriting task, not a factual one.
4. **Digest emails/notifications written from real activity**, not templates — e.g. a weekly "what you missed" for alumni who log in rarely, summarizing the 2-3 most relevant open questions in their stated help areas. This is the single highest-leverage lever for alumni retention (see §5) and is a natural extension of the `summary` AI feature you already have.

None of these need a new AI provider or architecture — they're all extensions of the existing `generateJSON` + Groq + zod-validated-schema + non-AI-fallback pattern already proven out four times.

---

## 4. How this becomes useful to the university, not just students

This expands on the Phase 12 planning already in `docs/phases/phase-12.md`, grounded in what's actually built versus what's still a plan.

### 4.1 What's already real, right now, for non-student stakeholders

- **Admin panel** (`/admin`) exists and works: a reports queue (spam/misleading/inappropriate/harassment with resolve/dismiss), user management, event/company/club/story CRUD, and — new this session — an **institution analytics overview** (`modules/admin/analytics.ts`) showing active users, questions/answers in the last 30 days, mentorship acceptance/completion counts, and a per-department breakdown. This is the thing a placement cell or dean's office would actually open on a Monday morning.
- **Official posts** (`officeName` field on `Post`, admin-only `/admin/official-posts` route) let a verified office (placement cell, student council) publish with a visible "Official · [office]" badge, distinct from peer content. This directly answers the "how do we trust what we read" question that WhatsApp groups can't answer.
- **Events with RSVP/capacity/ticket codes** and **giving campaigns with test-mode donations and receipts** are both built and wired into the UI (`/events`, `/give`). These are the two features a college's alumni-relations office would actually use to justify the platform's existence beyond student Q&A — a chapter meet with real RSVPs, a scholarship campaign with a real donor wall.
- **Data rights**: self-serve export (`GET /me/export`) and account deletion with password confirmation. This is the groundwork for being able to tell a college's IT/compliance office "yes, this is DPDP-Act-aligned in spirit" — though see §2.1, the deletion path currently has a content-integrity bug that undercuts this claim until fixed.

### 4.2 What's still missing to make the "university, not just students" pitch land

- **A faculty/staff role is not built.** Right now there are only `STUDENT | SENIOR | ALUMNI | ADMIN`. A placement-cell staff member or department head currently has no way to get scoped access (post officially, see department-level analytics) without being a full platform `ADMIN` with access to every user's suspension controls and every report. This is the single most important phase-12 item left — a college will not hand "admin" out to five different staff members with completely different jobs.
- **Safeguarding escalation is not built.** The admin reports queue treats a harassment report exactly like a spam report — same queue, same two buttons (Remove/Dismiss). There's no separate routing to a student-welfare contact, and no visibility rule for first-year mentor-mentee threads. This was flagged as P0 in the phase-12 plan and hasn't been built yet. Given that the product explicitly puts first-years in private conversation with upperclassmen they don't yet know, this is the one gap I'd treat as blocking a real pilot, not a nice-to-have.
- **Consent screen exists at signup (newly added) but the public data-processing notice page does not.** The register form now requires checking a box, but it links to nothing — there's no `/privacy` or `/data-notice` page explaining in plain language what's collected and why. This is a quick, high-value fix.

### 4.3 Reframing the pitch: lead with what's measurable today

Given what's actually built, the strongest pitch to a university right now is narrower and more credible than "a full institutional platform": **"We built a Q&A and mentorship network where every answer compounds across batches, and we can already show you — today — how many students are active, how many questions get answered, and how often mentorship actually completes."** That's the analytics panel, and it's real. Don't lead with events/giving (test-mode, not legally cleared) or the faculty role (not built) in a first conversation — lead with what a placement cell can see working in a five-minute screen share: the official-post badge, the analytics dashboard, and one real Ask-a-Senior thread with a cited AI-assisted answer.

---

## 5. Why would seniors and alumni actually help juniors? (the incentive question)

This is the question the whole product lives or dies on, and it's worth being skeptical about rather than assuming "gamification points" solves it, because the code tells a clearer story than the pitch does.

### 5.1 What incentive mechanics actually exist in the code today

- **Points** (`POINTS` in `services/gamification.ts`): Answer = 5, Helpful vote = 2, Best answer = 15, Experience shared = 20, Club review = 5, Roadmap authored = 20, Mentor session completed = 25.
- **Badges**, evaluated by count thresholds: first-answer (1), answer-machine (10), trusted-voice (3 best answers), experience-sharer (1), club-reviewer (1), roadmap-author (1), mentor (1 completed session), bridge-builder (10 accepted/completed connections).
- **Mentor Wall** (`/me`, `MentorWall.tsx`): an opt-in (`showOnMentorWall`), monthly "Thank you, mentors" leaderboard of top seniors/alumni by points — the only *public, visible-to-others* recognition mechanic that exists.
- **Alumni dashboard** (built this session): mentees, pending requests, open questions matching their stated expertise, their own answer history and vote counts — this is a *private*, personal view, not a public-recognition one.

### 5.2 Why this is a real but incomplete answer

Points-and-badges work for the small slice of people who are already motivated to help and want a light scoreboard on top of it — students genuinely do respond to visible status among peers, and "trusted-voice" badge next to your name on every answer is real social proof. But the actual research on why people help in these settings (campus mentorship, open-source, Stack Overflow-style Q&A) points to four distinct motivators, and the current build covers exactly one of them well:

1. **Reciprocity / "someone did this for me"** — covered weakly. Nothing in the product currently tells a senior "a mentor helped you in year 1; here's your chance to pay it forward," even though the data exists (`Milestone` with category `MENTOR` or similar, `Connection` history). This is the single easiest high-leverage addition: when a senior who was once mentored gets prompted to answer, frame it as continuing a chain, not starting cold.
2. **Status / visible expertise signal** — covered reasonably (Mentor Wall, role badges, verified badges), but only *after* someone has already contributed a lot. There's no early, cheap status signal for a senior's *first* answer beyond a private points bump. A public "X people found this helpful" count that shows up on their own profile (which does exist via `Contributions`) is good, but it's not visible to anyone browsing *for* a mentor until they're already deep into a search.
3. **Concrete self-interest / what's in it for me** — this is the weakest-covered motivator and arguably the most important one for *alumni specifically*, who have no academic stake left in the platform. Right now an alumnus gets: points (meaningless to them), a badge (meaningless), and a line on a monthly wall post (minor). What alumni actually want from staying connected to their college — and what the code doesn't yet give them — is: **visibility to recruiters/hiring managers at their own company for referral purposes**, **a professional reference they can point to** ("I mentor through my college's platform"), and **access to the thing juniors have that alumni don't** — fresh campus signal (what companies are visiting, what the new curriculum covers, who the promising juniors in their field are, for their own hiring pipeline). None of this is built. The engagement-record/certificate idea from phase-12 (F52) is a start, but a downloadable PDF is a weak reward compared to "LinkedIn-shareable" or "counts toward your company's referral bonus."
4. **Low friction / doesn't cost much time** — this is actually handled *well* by the product design, and it's worth naming as a genuine strength: alumni are never required to post (PRD explicitly states this), mentorship requests carry a specific question rather than an open-ended ask, and the new alumni dashboard surfaces exactly the 2-3 things that need a reply instead of a full feed to scroll. The product correctly treats senior/alumni time as the scarce resource. This is good and should not be diluted by adding more asks.

### 5.3 What I'd actually change, in priority order

1. **Make reciprocity visible and specific.** When a senior who has an accepted mentorship *in their own history as the junior* gets a notification about an unanswered question in their stated skills, change the copy from generic ("3 unanswered questions in your skills") to specific: *"A junior in [department] needs help with [topic] — like [mentor's name] helped you with [thing] in [year]."* This requires no new schema — `Milestone` and `Connection` history already have what's needed — just better notification copy generation (itself a good small AI use case: §3.3 item 4).
2. **Build the alumni-specific value the product currently doesn't offer**: a shareable, verifiable "I mentor at [college]" credential (not just a PDF — something like a public profile URL alumni can put in their LinkedIn "Volunteering" section), and surface to alumni *what they get* from browsing juniors' profiles — talent pipeline visibility for their own company's hiring, which is real self-interest and currently completely unaddressed in the UI even though the `canHelpWith`/`lookingFor`/company data already exists to support it.
3. **Lower the first-contribution barrier further.** Right now the lowest-effort contribution is a 5-point text answer. Consider a true one-tap action: "I agree with this answer" (distinct from upvote — upvote is anonymous-feeling, "I'd say the same" is a public co-sign with the senior's name attached, costs them one click, and still builds their visible track record). This matters because the hardest conversion in any mentorship platform is zero-to-one contributions, not one-to-many.
4. **Surface aggregate impact, not just individual points.** "Your answers have been read by 340 students this semester" is a far more motivating number for an alumnus than "+5 points," because it answers the self-interest question ("is this actually worth my time") directly. This is a cheap addition — the data already exists via post/comment view patterns, it just isn't computed or shown anywhere yet.

None of this requires new infrastructure. It's entirely about what data already in the schema gets *surfaced back* to the person being asked to give their time, which is a smaller lift than it sounds and the single highest-leverage set of changes available right now.

---

## 6. Prioritized action list

Ranked by (impact to the product's actual promise) × (effort), not by section order above.

| # | Item | Why now | Effort |
|---|---|---|---|
| 1 | Fix account-deletion cascade on `Comment.author` (§2.1) | Directly contradicts the core "answers compound forever" promise; live bug today | Small — one schema relation change + transaction reorder |
| 2 | Build the safeguarding escalation path for mentor-mentee threads (§4.2) | Blocking for any real pilot with real first-years | Medium — needs a decision from you on the visibility rule, then routine CRUD |
| 3 | Write the public data-processing notice page and link it from the consent checkbox (§4.2) | The consent checkbox currently points nowhere | Small |
| 4 | Reciprocity-framed notification copy for seniors (§5.3.1) | Cheapest, highest-leverage incentive fix; no schema change | Small |
| 5 | Fix chat inbox N+1 (§2.2) | Invisible now, real at scale; cheap to fix before it's a problem | Small |
| 6 | Build the faculty/staff role (§4.2) | Needed before any college staff member gets real access | Medium |
| 7 | Alumni self-interest surfacing: impact numbers + shareable mentor credential (§5.3.2, §5.3.4) | Addresses the weakest-covered incentive category | Medium |
| 8 | Deploy config (`render.yaml`/Vercel project settings) that correctly ships `docs/` (§2.3, §2.5) | Needed before any deploy, and the guide depends on it | Small once decided, but requires an actual deploy to verify |
| 9 | Environment-safety guard beyond `NODE_ENV` for demo shortcuts (§2.4) | Low current risk, cheap insurance before a pilot | Small |
| 10 | AI-assisted moderation triage (§3.3.1) and experience-verification assist (§3.3.2) | Real leverage for the placement-cell and admin pitch | Medium, needs AI budget consideration (rate limits already exist) |

Items 1–5 are small and I'd do them in the next working session regardless of what else you decide. Items 6–10 are real but each needs a decision from you first (the visibility rule for safeguarding, whether to pursue a faculty role now vs. after a pilot commits, how much AI spend you're comfortable with for triage).
