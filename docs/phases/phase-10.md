# Phase 10 — Seed content, support page, polish, deploy and demo

| | |
|---|---|
| **Time box** | 1:00 (cumulative 11:20) + 0:40 buffer |
| **Goal** | Turn the working app into a refined, demo-ready product: rich and realistic content, a support page, a full UI polish pass (states, responsiveness, dark mode, accessibility, motion), production deploy on Vercel + Render + Neon, and a rehearsed 5-minute demo |
| **Prerequisites** | Phases 00–09 complete (or trimmed using the cut list in `TRD.md` §15) |
| **PRD features** | F45 Support page, F46 Polished UI (final pass), demo story (`PRD.md` §9.1) |
| **Reference** | `TRD.md` §16 (deployment), §17 (testing); `PRD.md` §11 (wellbeing), §12 (UI) |


> **Codebase conventions (verified build).** The repository is the source of truth; when this guide and the code differ, follow the code.
> - Import Prisma types from the generated client: `import type { Prisma } from '../../generated/prisma/client'` (not `@prisma/client`).
> - Paginated lists return `{ data: { items, nextCursor } }`; use `LIMITS.PAGE_SIZE` from `src/config/constants.ts`, never a literal.
> - No hardcoded settings: deployment values go in `src/config/env.ts` (+ `.env.example`); tuning numbers in `src/config/constants.ts`; topic ids come from `GET /topics` (never `index + 1`).
> - Routes declare `requireAuth` / `requireOnboarded` / `requireRole('ADMIN')` and `validate({ body, query })` with schemas from `@bridgeup/shared`; read input from `req.valid`.
> - Every new endpoint gets a row in `apps/api/src/docs/openapi.ts` (Swagger at `/api/docs`) and, where useful, a check in `apps/api/scripts/smoke.ts`.
> - Transactions that award points, evaluate badges and notify run inside `prisma.$transaction` (timeout configured in `src/lib/prisma.ts`).
> - Before committing: `npm run typecheck && npm test && npm run build`, then `npm run smoke` against a running API.

---

## 1. What you will have at the end of this phase

- `seed-content.ts` that fills every screen with believable demo data.
- `/support` page (public) with verified counselling contacts, wellbeing principles and community guidelines.
- `ComingNext` cards wherever a feature was cut — no dead links.
- Error boundary, 404 page, loading and empty states on every route.
- Production deployment with working cookies, the `/api` rewrite, migrations, search indexes and seeds.
- A rehearsed demo with a backup recording.

---

## 2. Step-by-step

### Step 1 — Seed content (15 min)

Extend `apps/api/scripts/seed-content.ts` (experiences, club reviews and roadmaps already exist from Phase 06). Insert through service functions where possible so counters, points, badges and notifications are consistent. Make the script **idempotent** (delete previous demo content authored by demo users (emails ending in `DEMO_EMAIL_SUFFIX`) first, in dependency order).

| Content | Amount | Notes |
|---|---|---|
| Questions | 18 | Real first-year worries across all 6 topics: "Which coding club should I join?", "Is CGPA important for placements?", "How do I start ML in first year?", "What should I do this summer?", "How did you prepare for the {company} OA?", "Hostel vs day scholar?", "Is it too late to start DSA in 2nd year?" |
| Answers | 40 | Mostly from seniors/alumni, specific and kind; 10 marked best; 2–3 replies |
| Helpful votes / upvotes | ~120 | Spread across answers and posts so Top sorts and quality scores vary |
| Discussions | 16 | Project showcases, contest recaps, campus tips, internship stories |
| Opportunities | 10 | All 8 types; deadlines spread over the next 3 weeks (2 closing within 2 days); organisations clearly fictional or real with accurate info |
| Teams | 7 | 2 hackathon (one cross-department needing a designer + business), 2 projects, 2 startups (founder track), 1 open study circle |
| Accepted / completed mentorship | 4 / 2 | With follow-ups |
| Stories | 4 | 1 spotlight; featured alumni and seniors; cover images from your own assets or royalty-free sources you're allowed to use (or leave empty to use gradient covers) |
| Prep items | For Ananya and Karthik | Karthik has a realistic prep state (≈ 40%); Ananya has a few year-1 items |
| Finished sim sessions | 3 for Karthik | So the dashboard chart has data |

**Prepare the demo accounts carefully:**

| Account | State before the demo |
|---|---|
| Ananya (first year) | Onboarded; follows AI/ML + Campus life; 2 of 6 quests done; **no** questions asked yet; 2 target companies; 1 visited club |
| Rahul (senior) | Guide level, 5–6 badges, several answers (one best), an incoming pending request from Karthik, one question he can answer |
| Meera (alumna) | Mentor available, at a target company of Ananya's, featured in the spotlight story |
| Karthik (3rd year) | Prep dashboard filled, 3 sim sessions, a team application pending |
| Admin | 2 open reports in the queue |

Run the full reset sequence and keep it in the README:

```bash
npm run db:seed -w apps/api        # base data (topics, badges, companies, clubs, events, admin)
npm run seed:users -w apps/api     # demo users + milestones + follows
npm run seed:content -w apps/api   # questions, answers, posts, experiences, reviews, roadmaps, teams, stories, prep, sims
```

> Present seeded content honestly as **demo data**. Don't show seeded numbers as real statistics in the pitch.

### Step 2 — Support page (5 min)

`/support` (public, also linked in the sidebar footer, landing footer, and from report dialogs):

1. Warm intro: "College is a lot. You don't have to figure it out alone."
2. **Talk to someone** card: the college's official counselling/wellbeing contacts — **only details you have verified with the college** (name of the service, how to reach it, hours). If you can't verify them before the demo, show "Contact your college's student wellbeing office" and a placeholder you fill in later. Add a line: "If you're in immediate danger, contact local emergency services." Don't list national helpline numbers unless you've verified they're current.
3. **What BridgeUp is (and isn't):** peer guidance from seniors and alumni — not counselling, medical or legal advice.
4. **Our promises:** no rankings of students, no pressure mechanics, your contact details stay private unless you choose to share them.
5. **Community guidelines:** be kind; no ragging or harassment; don't share confidential interview content; label opinions as opinions; report anything harmful.
6. **How to report:** "Use the ⋯ menu → Report on any post, answer, profile or listing. Admins review every report."
7. **Your data:** what is stored, how to edit or delete your profile (delete-account as P1: a button that anonymises the user — set name "Former member", clear profile fields, revoke sessions — if you have time).

### Step 3 — Polish pass (20 min)

Go through **every screen** with this checklist. Fix the demo path screens first: Landing → Login → Home → Ask (new + detail) → People → Profile → Company → Path Twins → Roadmap generate → Prep → Simulator → Teams → Requests → Stories → Support → Admin.

**Consistency**
- [ ] Every page uses `PageHeader` (same title size, description style, action alignment).
- [ ] One card style everywhere (radius 14px, border, `shadow-sm`, `p-5`).
- [ ] Icons: lucide only, 18px nav / 16px inline, same stroke.
- [ ] One primary button per view; secondary actions outline/ghost; destructive actions red with confirmation.
- [ ] Copy: sentence case, friendly, specific; no "Lorem ipsum", no "TODO", no developer jargon in errors.
- [ ] Numbers use `tabular-nums`; dates are relative with full date on hover.

**States**
- [ ] Every list has an empty state with an action.
- [ ] Every route has a skeleton (`Suspense` fallback or per-query skeletons).
- [ ] Every mutation shows success and failure toasts; points-earned toasts are consistent ("+5 helpfulness").
- [ ] Buttons disable with spinners while submitting.
- [ ] `ErrorBoundary` at the app shell level shows "Something went wrong — Try again" (button resets the boundary and refetches).
- [ ] `NotFoundPage` for unknown routes and for 404 API responses on detail pages.

**Responsive and themes**
- [ ] Every main page at 375px, 768px and 1440px; no horizontal scroll; tap targets ≥ 40px.
- [ ] Every main page in dark mode; fix low-contrast chips, borders and chart colours.
- [ ] Bottom nav never covers content; dialogs become full-height sheets on mobile.

**Accessibility**
- [ ] Tab through Home, Ask, People and the simulator: logical order, visible focus, dialogs trap focus and return it on close.
- [ ] Icon-only buttons have `aria-label`; images have `alt`; charts and rings have `aria-label`s.
- [ ] Colour is never the only signal (deadlines, priorities, correctness all have text).
- [ ] Motion respects `prefers-reduced-motion`.

**Delight (only if time)**
- [ ] List stagger (30 ms) on feed, people grid and stories.
- [ ] Hover lift on clickable cards; smooth tab underline transitions.
- [ ] Landing page shows a real screenshot of the home page inside a browser frame, plus the spotlight story.
- [ ] Favicon, page titles per route (`document.title = 'Ask a Senior · BridgeUp'`), and an OG image for link previews.

**Cut features**
- [ ] Any P2 or cut feature appears as a `ComingNext` card in its natural place (e.g. "Code execution for coding rounds" on the simulator, "Events & reunions" and "Give back" in the sidebar footer pointing to Phase 11 features) — never a dead link or an empty page.

### Step 4 — Production build checks (5 min)

```bash
npm run typecheck
npm run build
```

Fix every type error. Then run the production API locally once: `node apps/api/dist/index.js` (with your `.env`) and hit `/api/health`.

Also confirm:
- `apps/web/dist` contains no secrets: `grep -r "sk-ant" apps/web/dist` (or part of your key) returns nothing.
- `DEMO_MODE` is set intentionally (true only for the demo event).

### Step 5 — Deploy (10 min)

Follow `TRD.md` §16 exactly:

1. **Neon** — production branch or the same database. From your machine with production env vars:
   ```bash
   npm run db:deploy -w apps/api      # prisma migrate deploy
   npm run db:search -w apps/api
   npm run db:seed -w apps/api && npm run seed:users -w apps/api && npm run seed:content -w apps/api
   ```
2. **Render** — new Web Service from the GitHub repo; build `npm ci && npm run build -w apps/api`; start `node apps/api/dist/index.js`; health check `/api/health`; add all API env vars (every key in `apps/api/.env.example`; at minimum `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, a **new** `JWT_SECRET`, `ALLOWED_EMAIL_DOMAINS`, `WEB_ORIGIN`, `EMAIL_MODE`, `DEMO_MODE`, `ANTHROPIC_API_KEY`, `AI_MODEL`; set `API_DOCS_ENABLED=false` unless you want public API docs). Wait for "Live" and open `https://<api>.onrender.com/api/health`.
3. **Vercel** — import the repo; root directory `apps/web`; framework Vite; output `dist`; install command `cd ../.. && npm ci` (workspaces); no runtime env vars are needed because the app reads `GET /api/config`; commit `apps/web/vercel.json` with your Render URL in the rewrite. Deploy.
4. Open the Vercel URL → `/api/health` must return JSON **through Vercel** (proves the rewrite).
5. Register or demo-login → the `bu_session` cookie appears under the **Vercel domain** (DevTools → Application → Cookies) with `HttpOnly` and `Secure`.

> ⚠️ Render free instances sleep when idle. Open the site 5–10 minutes before presenting (and keep a tab open), or use a paid instance for the event.

### Step 6 — Production smoke test (5 min)

| # | Steps | Expected result |
|---|---|---|
| 10.1 | Demo-login as Ananya on production | Home loads: This Week, quests, ranked feed with reasons |
| 10.2 | Ask flow: similar questions + AI answer panel | Works within ~10 s; fallback works if AI fails |
| 10.3 | People → Find my alumni mentor → request | Toast; appears in Meera's Incoming |
| 10.4 | Company → Overview (skills you have, summary) → Experiences → Alumni | Data present; deep links scroll to cards |
| 10.5 | Path Twins and roadmap generator | Render and save |
| 10.6 | Prep dashboard → 3-question simulation | Questions show sources; summary renders |
| 10.7 | Teams apply → (as owner) accept | Notifications on both sides |
| 10.8 | Rahul answers → badge celebration | Points and badge update once |
| 10.9 | Report → admin remove | Content hidden everywhere |
| 10.10 | Real phone: 10.1–10.3 | Usable; no layout breaks; bottom nav works |
| 10.11 | Dark mode: home, ask, people, company, prep | Readable and consistent |
| 10.12 | Unknown URL and a refresh on a deep link (e.g. `/companies/x`) | Friendly 404 / page loads after refresh (SPA rewrite works) |

### Step 7 — Demo rehearsal (10 min + buffer)

Follow `PRD.md` §9.1. Target **under 5 minutes**:

| Time | Screen | What to show and say |
|---|---|---|
| 0:00 | Landing → demo login as Ananya | "A first year, week 6, feeling behind." |
| 0:20 | Home | This Week, quests, feed reason chips: "everything explains why it's here" |
| 0:50 | Ask a Senior | Similar questions + AI answer with citations: "answer once, help every batch" |
| 1:40 | People → Find my alumni mentor | Match ring + reasons → mentorship request with a specific question |
| 2:15 | Company page | Rounds, "you have 2 of 6 skills", round-wise experiences, alumni there, summary |
| 2:50 | Path Twins | Year-by-year journeys of someone who started like her |
| 3:15 | Roadmap generator → Prep dashboard | Gaps with reasons; four prep tracks; readiness |
| 3:45 | Simulator (2 questions) | Source year shown; adaptive difficulty |
| 4:10 | Switch to Rahul | Answer → "+5" → badge celebration; accept request; profile "Helped 12 students" |
| 4:40 | Stories + Support | Spotlight story; "no rankings, no pressure — wellbeing first" |

**Backups:**
- A second browser profile already logged in as Rahul.
- A screen recording of the full demo (in case the network fails).
- Screenshots of key screens in your slides.
- Pre-warm AI: open the Ask question page, company summary and generate one roadmap before the demo (answers and summaries are cached).

Commit and tag:

```bash
git add -A && git commit -m "phase-10: content, polish, deploy" && git tag v1.0-demo && git push --tags
```

---

## 3. Completion criteria

- [ ] Production smoke test passes end to end on the deployed URLs.
- [ ] No console errors on the demo path (check DevTools).
- [ ] Every main page has loading, empty and error states, and works at 375px and in dark mode.
- [ ] Support page has verified (or clearly placeholder) contact details — nothing invented.
- [ ] Cut features appear as "Coming next", never as broken pages.
- [ ] Demo rehearsed at least twice under 5 minutes; backup recording saved.

---

## 4. If you're behind

Priority order: **deploy → seed content → demo rehearsal → support page → polish**. A flawless demo path matters more than polishing every page; make the ~12 demo screens perfect first.
