# Crossroads — Technical Requirements Document (TRD)

> **Version:** 2.0 · **Date:** 2026-10-10 · Companion to `PRD.md` and `phases/`
>
> **Accuracy note.** Package names, versions, CLI commands and function signatures in this document reflect these tools as best known on the date above. Libraries change often. **Before you rely on a command or API here, check that package's current documentation.** Anything marked ⚠️ is especially likely to have changed or to need checking. Code in this document is a guide written to be correct, but it has **not** been run; expect small fixes.

---

## Table of contents

1. Technology stack and rationale
2. System architecture
3. Repository and folder structure
4. Environment variables
5. Database design (Prisma schema)
6. Search setup (PostgreSQL full-text and trigram)
7. API design conventions
8. API endpoint reference
9. Authentication and authorization
10. Cross-cutting backend services (gamification, notifications, audit)
11. Core algorithms (matching, feed, twins, quests, readiness, simulator)
12. AI layer design
13. Frontend architecture
14. Security, privacy and moderation
15. Time budget, cut list and fallbacks
16. Deployment
17. Testing strategy
18. Things to verify before and during the build

---

## 1. Technology stack and rationale

The stack is chosen for the best balance of **speed of development, polish, performance and ease of deployment** in a 10–12 hour build by one developer, with a **React frontend and a separate Node.js backend**.

### 1.1 Chosen stack

| Layer | Choice | Why this is the right choice here |
|---|---|---|
| Language | **TypeScript everywhere** | One language for frontend, backend and shared validation; type errors caught before the demo |
| Frontend build | **React 19 + Vite** ⚠️ (check current major versions) | Fastest dev server and builds; huge ecosystem; you asked for React |
| Routing | **React Router** (library mode: `createBrowserRouter`) ⚠️ | Standard, nested layouts, loaders optional; v7 imports from `react-router` |
| Server state | **TanStack Query v5** | Caching, refetching, optimistic updates and loading states with very little code |
| Client state | **Zustand** (tiny) | Only for UI state such as the command palette and onboarding draft |
| Styling | **Tailwind CSS v4** with the Vite plugin ⚠️ | Fast, consistent styling with design tokens as CSS variables |
| Components | **shadcn/ui** (Radix primitives) | Accessible, beautiful components that you own and can restyle |
| Icons | **lucide-react** | Consistent, clean icon set |
| Forms | **react-hook-form + zod** (`@hookform/resolvers`) | Same zod schemas validate on the client and the server |
| Toasts | **sonner** | Polished notifications |
| Motion | **motion** (formerly framer-motion) ⚠️ | Page and list transitions, badge celebration |
| Charts | **Recharts** | Readiness and prep progress charts on the dashboard |
| Fonts | `@fontsource-variable/inter`, `@fontsource-variable/plus-jakarta-sans` ⚠️ | Self-hosted fonts, no layout shift |
| Backend | **Node.js 22 LTS + Express 5** ⚠️ | Simple, well known, async errors handled natively in Express 5 |
| Validation | **zod** (shared package) | One schema for client forms and API input |
| ORM | **Prisma** ⚠️ (recent versions changed configuration; see §18) | Type-safe queries, migrations, Studio for inspecting data |
| Database | **PostgreSQL 16+** on **Neon** (or Supabase Postgres) | Free tier, branching, full-text search and trigram built in |
| Auth | Own email + password auth: **bcryptjs** + **jsonwebtoken** in an **httpOnly cookie** | No third-party auth lock-in; full control over the college-domain rule |
| Email | **Resend** (or any SMTP via nodemailer) for verification codes; **console fallback** in demo mode | Verification without blocking the demo if email fails |
| Security middleware | **helmet**, **cors**, **cookie-parser**, **express-rate-limit** | Sensible defaults in minutes |
| Logging | **pino** + **pino-http** | Fast structured logs with request IDs |
| AI | **OpenAI-compatible LLM API, Groq free tier by default** via `openai` SDK (server only) | Grounded answers, roadmaps, simulator questions; JSON output validated with zod |
| Monorepo | **npm workspaces** | No extra tooling; shared package imported by both apps |
| Dev runner | **tsx** (API dev), **concurrently** (run both apps) | Zero-config TypeScript execution |
| API bundling | **tsup** | Bundles the API (and the shared package) into one JS file for production |
| Hosting | **Vercel** (web) · **Render** (API) · **Neon** (database) | Free tiers, simple deploys; Vercel rewrites keep cookies first-party |
| Payments (Phase 11 only) | **Razorpay** in test mode ⚠️ | Common in India; test mode needs no real money |

### 1.2 Alternatives considered and rejected for this build

| Option | Why not now |
|---|---|
| Next.js full-stack | You asked for a React frontend with a separate backend |
| NestJS | Great structure but slower to set up in 10–12 hours |
| Supabase Auth + RLS | Fast, but splits auth logic between two systems when you already have your own backend |
| MongoDB | Relational data (users, posts, votes, teams) and full-text search are easier in Postgres |
| GraphQL | More setup than REST for no benefit at this size |
| Socket.IO real time | Polling every 30 seconds is enough for notifications; real time is a stretch goal |
| Vector database | PostgreSQL full-text + trigram is enough; pgvector is a future upgrade |

---

## 2. System architecture

```
┌────────────────────────────── Browser ──────────────────────────────┐
│ React app (Vite build on Vercel)                                    │
│  • React Router pages and layouts                                   │
│  • TanStack Query: caching, optimistic votes, polling notifications │
│  • shadcn/ui + Tailwind design system                               │
└───────────────┬─────────────────────────────────────────────────────┘
                │ fetch('/api/...')  (same origin; cookie sent automatically)
                ▼
┌────────────── Vercel edge ──────────────┐
│ vercel.json rewrite: /api/* → API host  │   ← keeps the auth cookie first-party
└───────────────┬─────────────────────────┘
                ▼
┌──────────────────────────── Express API (Render) ───────────────────────────┐
│ helmet · cors · cookie-parser · pino-http · rate limits                     │
│ auth middleware (JWT cookie → req.user)                                     │
│ routes → validate(zod) → services → Prisma                                  │
│ cross-cutting services: gamification, notifications, matching, feed, twins, │
│ quests, readiness, search (raw SQL), AI (LLM API), simulator             │
└───────────────┬───────────────────────────────────────┬─────────────────────┘
                ▼                                       ▼
┌──────── PostgreSQL (Neon) ────────┐        ┌──────── External ────────┐
│ tables via Prisma migrations      │        │ LLM API (AI features)     │
│ pg_trgm + full-text GIN indexes   │        │ Resend (email codes)      │
│ (prisma/sql/search.sql)           │        │ Razorpay test (Phase 11)  │
└───────────────────────────────────┘        └───────────────────────────┘
```

### 2.1 Request lifecycle

1. The browser calls `/api/...` on the same origin (Vite proxy locally, Vercel rewrite in production).
2. `pino-http` assigns a request ID and logs the request.
3. `authOptional` reads the `bu_session` cookie, verifies the JWT and attaches `req.user = { id, role, onboarded }`.
4. Route-level guards (`requireAuth`, `requireOnboarded`, `requireRole('ADMIN')`) run.
5. `validate({ body, query, params })` parses input with zod; invalid input → `400` with field errors.
6. The handler calls a **service function**. Services hold all business logic and use Prisma (inside a transaction when several writes must happen together, for example "create answer + award points + notify").
7. The handler returns `res.json({ data })`.
8. Any thrown `AppError` (or unexpected error) is turned into a consistent error response by `errorHandler`.

### 2.2 Why business rules live in services, not database triggers

Points, badges, counters and notifications are written by **service functions inside Prisma transactions**. This keeps logic in one language (TypeScript), visible and testable, and never trusts the client. Unique constraints in the database (for example on `PointsLedger(userId, action, refId)`) prevent double awards even if a request is retried.

---

## 3. Repository and folder structure

The repository root is the npm-workspaces root. This tree reflects the verified build; new modules follow the same shape.

```
.
├── package.json                  workspaces + scripts: dev, build, typecheck, test, smoke, lint, format, db:seed:all
├── CLAUDE.md · README.md
├── docs/                         PRD.md, TRD.md, README.md (doc index), phases/phase-00..11.md
├── packages/shared/src/          @crossroads/shared — imported by both apps
│   ├── constants.ts              topics (+ relatedInterests), skills, interests, goal tracks, badges, levels …
│   ├── schemas/                  zod request schemas, one file per domain + index.ts
│   └── types/                    response types: enums, users, posts, home, campus, config + index.ts
├── apps/api/
│   ├── prisma.config.ts          Prisma CLI config (schema path, migrations, DIRECT_URL)
│   ├── prisma/                   schema.prisma, migrations/, sql/search.sql, seed.ts, data/ (companies, clubs, events)
│   ├── scripts/                  seed-users.ts, seed-content.ts, apply-search-sql.ts, smoke.ts, data/
│   ├── test/unit/                Vitest unit tests (algorithms and helpers)
│   └── src/
│       ├── index.ts              starts the server, graceful shutdown
│       ├── app.ts                middleware order: docs → helmet → cors → json → cookies → logging → auth → jsonOnly → routes → errors
│       ├── routes.ts             mounts every module router
│       ├── config/               env.ts (validated env, the only place process.env is read), constants.ts (tuning LIMITS)
│       ├── docs/                 openapi.ts (OpenAPI document from shared zod schemas), docs.routes.ts (Swagger UI)
│       ├── generated/prisma/     generated client (gitignored; `prisma generate`)
│       ├── lib/                  prisma, logger, errors, jwt, password, codes, mailer, cookies, text, pagination, collections
│       ├── middleware/           auth, validate, rateLimits, jsonOnly, errorHandler
│       ├── services/             cross-cutting logic: matching, feedRank, twins, quests, gamification, notify
│       ├── types/                express.d.ts (req.user, req.valid)
│       └── modules/<domain>/     <domain>.routes.ts, <domain>.service.ts, <domain>.serializers.ts
│                                 system, auth, users, people, connections, topics, posts, votes, feed, home,
│                                 events, bookmarks, search, companies, experiences, clubs, twins, roadmaps
└── apps/web/
    ├── vite.config.ts            reads API_PROXY_TARGET / VITE_DEV_PORT; vendor chunking
    ├── components.json           shadcn (radix base)
    └── src/
        ├── main.tsx
        ├── app/                  router.tsx (lazy-loaded pages), providers/ (theme, query, toasts), pages/ (404, /me)
        ├── components/
        │   ├── ui/               shadcn primitives (generated)
        │   ├── layout/           AppShell, Sidebar, Topbar, MobileNav, CommandPalette, PageHeader, RightRail …
        │   ├── guards/           RequireAuth, RequireOnboarded, PublicOnly, RequireAdmin
        │   └── shared/           UserAvatar, MatchRing, ChipPicker, VoteButtons, BookmarkButton, PlainText …
        ├── features/<name>/      pages, components and api.ts (TanStack Query hooks) per feature
        ├── hooks/                useMe, useAppConfig, useDebounce, useHotkey
        ├── lib/                  api client, queryKeys, queryClient, storage, storageKeys, labels, people, utils
        ├── stores/               zustand UI state (palette, onboarding draft)
        └── styles/globals.css    Tailwind v4 + design tokens
```

**Rules that keep the structure clean**

- Business rules live in `services/` or a module's `*.service.ts`; route files only wire guards, validation and the service call.
- Shared request rules (zod) and response types live in `packages/shared`, never duplicated in an app.
- `process.env` is read only in `config/env.ts`; tuning numbers live in `config/constants.ts`; nothing environment-specific is hardcoded.
- Web pages never call `fetch` directly; each feature's `api.ts` exports hooks keyed by `lib/queryKeys.ts`.

---

## 4. Environment variables

### 4.1 API (`apps/api/.env`)

| Name | Example | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `production` on Render |
| `PORT` | `4000` | Render sets its own `PORT`; always read from env |
| `DATABASE_URL` | `postgresql://…?sslmode=require` | Neon **pooled** connection string for the app |
| `DIRECT_URL` | `postgresql://…?sslmode=require` | Neon **direct** connection for migrations ⚠️ (check Prisma + Neon docs) |
| `JWT_SECRET` | 64 random characters | `openssl rand -hex 32` |
| `SESSION_DAYS` | `7` | Cookie and token lifetime |
| `ALLOWED_EMAIL_DOMAINS` | `amrita.edu` | Comma-separated; subdomains (e.g. `am.students.amrita.edu`) are accepted |
| `DEMO_LOGIN_HANDLES` | `ananya,rahul,meera,admin` | Demo-login buttons, in order (DEMO_MODE only) |
| `DEMO_EMAIL_SUFFIX` | `@demo.crossroads` | Marks demo accounts |
| `APP_NAME`, `LOG_LEVEL` | `Crossroads`, (`info`/`debug`) | Display name; log verbosity |
| `RATE_LIMIT_AUTH_PER_15M`, `RATE_LIMIT_WRITE_PER_MIN`, `RATE_LIMIT_AI_PER_HOUR` | `20`, `60`, `20` | Rate-limit sizes |
| `ACADEMIC_YEAR_START_MONTH` | `7` | Month the odd semester starts (semester maths) |
| `API_DOCS_ENABLED` | (on outside production) | Swagger UI at `/api/docs` |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_USER_PASSWORD` | — | Local seeds only |
| `WEB_ORIGIN` | `http://localhost:5173` | Used for CORS in local dev |
| `EMAIL_MODE` | `console` | `console` prints codes to the log; `resend` sends email |
| `RESEND_API_KEY` | — | Only when `EMAIL_MODE=resend` |
| `EMAIL_FROM` | `Crossroads <onboarding@yourdomain>` | Must be a verified sender in Resend ⚠️ |
| `DEMO_MODE` | `true` | Enables the demo-login endpoint and console codes; **turn off for any real launch** |
| `AI_API_KEY` | — | Server only; AI features fall back gracefully if missing (free key: console.groq.com) |
| `AI_BASE_URL` | `https://api.groq.com/openai/v1` | Any OpenAI-compatible endpoint |
| `AI_MODEL` | `openai/gpt-oss-120b` | Any model id the provider offers; smaller models fit free-tier limits better |
| `AI_MAX_TOKENS` | `4000` | Per-call output ceiling |
| `AI_TIMEOUT_MS` | `20000` | Abort slow AI calls |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | test keys | Phase 11 only |

### 4.2 Web (`apps/web/.env`)

| Name | Example | Notes |
|---|---|---|
| `VITE_DEV_PORT` | `5173` | Dev server port |
| `API_PROXY_TARGET` | `http://localhost:4000` | Where the dev server forwards `/api` |

The web app never needs the API URL or runtime flags in its bundle: it calls the relative path `/api`, and reads public settings (email domains, demo mode and accounts, feature flags) from `GET /api/config`.

### 4.3 `config/env.ts` (validated at startup)

`apps/api/src/config/env.ts` is the only file that reads `process.env`. It validates every variable in §4.1 with zod at startup (the process exits with a readable error if one is missing or malformed), treats empty strings as "not set" so `.env` can hold blank placeholders, and exports `env`, `isProd`, `aiEnabled` and `docsEnabled`. Booleans use `z.enum(['true','false']).transform(...)` because `z.coerce.boolean()` turns `"false"` into `true`. `apps/api/.env.example` documents every key.

---

## 5. Database design (Prisma schema)

### 5.1 Entity overview

```
User ─┬─< Post ─┬─< Comment (self-relation for replies; one Comment can be Post.bestAnswer)
      │         └─< (Vote, Bookmark are polymorphic: targetType + targetId)
      ├─< TopicFollow >─ Topic
      ├─< Connection (as requester) / Connection (as recipient)
      ├─< Experience >─ Company ─< PrepItem, SimSession
      ├─< ClubReview >─ Club
      ├─< Milestone            (Path Twins journeys)
      ├─< Roadmap ─< RoadmapSave
      ├─< Team ─< TeamApplication
      ├─< Notification
      ├─< PointsLedger, UserBadge >─ Badge
      ├─< Report
      ├─── AlertSubscription (1:1)
      ├─< Story (as author / as featured person)
      ├─< PrepItem
      └─< SimSession ─< SimQuestion
Event (This Week; extended in Phase 11)   AllowedEmail   EmailCode
```

### 5.2 Complete `apps/api/prisma/schema.prisma`

> ⚠️ Recent Prisma releases changed the generator and configuration (for example a `prisma.config.ts` file and a required `output` path for the newer `prisma-client` generator). Run `npx prisma init` with the version you install and **keep the generator/datasource blocks it creates**, then paste the enums and models below.

```prisma
// ───────────── generator + datasource (adjust to what `prisma init` generates) ─────────────
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

// Prisma 7: the URL is configured in prisma.config.ts (CLI, DIRECT_URL) and in the
// runtime client through the @prisma/adapter-pg driver adapter (pooled DATABASE_URL).
datasource db {
  provider = "postgresql"
}

// ───────────── Enums ─────────────
enum Role {
  STUDENT
  SENIOR
  ALUMNI
  ADMIN
}

enum GoalTrack {
  PRODUCT
  SERVICE
  QUANT_FINANCE
  RESEARCH
  STARTUP
  MS
  MBA
  UNDECIDED
}

enum PostKind {
  DISCUSSION
  QUESTION
  OPPORTUNITY
}

enum OpportunityType {
  INTERNSHIP
  HACKATHON
  RESEARCH
  EVENT
  REFERRAL
  STUDY_GROUP
  COLLABORATION
  CAREER_GUIDANCE
}

enum VoteTarget {
  POST
  COMMENT
}

enum BookmarkTarget {
  POST
  EXPERIENCE
  ROADMAP
  STORY
}

enum ConnectionKind {
  CONNECT
  MENTORSHIP
  COLLAB
  PEER_GUIDANCE
}

enum ConnectionStatus {
  PENDING
  ACCEPTED
  DECLINED
  COMPLETED
}

enum Outcome {
  SELECTED
  NOT_SELECTED
  WITHHELD
}

enum MilestoneCategory {
  CLUB
  PROJECT
  INTERNSHIP
  COURSE
  ACHIEVEMENT
  JOB
  STARTUP
}

enum TeamKind {
  HACKATHON
  PROJECT
  STARTUP
  STUDY_CIRCLE
}

enum TeamStatus {
  OPEN
  CLOSED
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
}

enum EventCategory {
  DEADLINE
  CLUB
  EXAM
  HACKATHON
  PLACEMENT
  EVENT
  REUNION
  CHAPTER_MEET
  WEBINAR
}

enum ReportTarget {
  POST
  COMMENT
  EXPERIENCE
  PROFILE
  TEAM
  STORY
}

enum ReportReason {
  SPAM
  MISLEADING
  INAPPROPRIATE
  HARASSMENT
  OTHER
}

enum ReportStatus {
  OPEN
  RESOLVED
  DISMISSED
}

enum StoryStatus {
  DRAFT
  PUBLISHED
}

enum PrepCategory {
  OA
  APTITUDE
  TECHNICAL
  HR
}

enum SimRoundType {
  APTITUDE
  CODING
  CS_FUNDAMENTALS
  TECHNICAL
  HR
}

enum SimFormat {
  MCQ
  SHORT
  CODING_APPROACH
}

enum SimStatus {
  ACTIVE
  FINISHED
}

enum CodePurpose {
  VERIFY_EMAIL
}

// ───────────── Auth helpers ─────────────
model AllowedEmail {
  email     String   @id
  role      Role     @default(ALUMNI)
  createdAt DateTime @default(now())
}

model EmailCode {
  id        String      @id @default(uuid())
  email     String
  codeHash  String
  purpose   CodePurpose @default(VERIFY_EMAIL)
  attempts  Int         @default(0)
  expiresAt DateTime
  createdAt DateTime    @default(now())

  @@index([email, purpose])
}

// ───────────── Users ─────────────
model User {
  id               String     @id @default(uuid())
  email            String     @unique
  passwordHash     String
  emailVerified    Boolean    @default(false)
  handle           String     @unique
  fullName         String
  avatarUrl        String?
  role             Role       @default(STUDENT)
  department       String?
  batchYear        Int?       // graduation year
  currentYear      Int?       // 1–5; null for alumni
  company          String?    // current company (alumni, interns)
  jobTitle         String?
  bio              String     @default("")
  skills           String[]   @default([])
  interests        String[]   @default([])
  targetRoles      String[]   @default([])
  targetCompanies  String[]   @default([]) // company slugs
  goalTrack        GoalTrack?
  canHelpWith      String[]   @default([])
  lookingFor       String[]   @default([])
  projects         Json       @default("[]") // [{ title, description, url? }]
  achievements     String[]   @default([])
  linkedinUrl      String?
  githubUrl        String?
  showEmail        Boolean    @default(false)
  showLinkedin     Boolean    @default(true)
  showGithub       Boolean    @default(true)
  mentorAvailable  Boolean    @default(false)
  mentorTopics     String[]   @default([])
  mentorSlots      String     @default("") // e.g. "Sat 5–6 pm, Sun 11–12"
  showOnMentorWall Boolean    @default(true)
  isVerified       Boolean    @default(false)
  onboarded        Boolean    @default(false)
  consentAt        DateTime?
  points           Int        @default(0)
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  posts            Post[]
  comments         Comment[]
  votes            Vote[]
  bookmarks        Bookmark[]
  topicFollows     TopicFollow[]
  sentRequests     Connection[]      @relation("SentRequests")
  receivedRequests Connection[]      @relation("ReceivedRequests")
  experiences      Experience[]
  clubReviews      ClubReview[]
  milestones       Milestone[]
  roadmaps         Roadmap[]
  roadmapSaves     RoadmapSave[]
  teams            Team[]
  applications     TeamApplication[]
  notifications    Notification[]
  ledger           PointsLedger[]
  badges           UserBadge[]
  reports          Report[]
  alertSubscription AlertSubscription?
  storiesAuthored  Story[]           @relation("StoryAuthor")
  storiesFeatured  Story[]           @relation("StoryFeatured")
  prepItems        PrepItem[]
  simSessions      SimSession[]
  eventsCreated    Event[]

  @@index([role])
  @@index([department])
  @@index([batchYear])
}

// ───────────── Topics ─────────────
model Topic {
  id          Int           @id @default(autoincrement())
  slug        String        @unique
  name        String
  description String        @default("")
  icon        String        @default("hash") // lucide icon name
  posts       Post[]
  followers   TopicFollow[]
}

model TopicFollow {
  userId    String
  topicId   Int
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic     Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([userId, topicId])
}

// ───────────── Posts, comments, votes, bookmarks ─────────────
model Post {
  id              String           @id @default(uuid())
  authorId        String
  kind            PostKind
  title           String
  body            String           @default("")
  topicId         Int?
  tags            String[]         @default([])
  opportunityType OpportunityType?
  organization    String?
  deadline        DateTime?
  externalUrl     String?
  score           Int              @default(0)
  commentCount    Int              @default(0)
  bestAnswerId    String?          @unique
  isRemoved       Boolean          @default(false)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  author     User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  topic      Topic?    @relation(fields: [topicId], references: [id])
  comments   Comment[] @relation("PostComments")
  bestAnswer Comment?  @relation("BestAnswer", fields: [bestAnswerId], references: [id], onDelete: SetNull)

  @@index([kind, createdAt(sort: Desc)])
  @@index([topicId])
  @@index([authorId])
  @@index([deadline])
}

model Comment {
  id        String    @id @default(uuid())
  postId    String
  authorId  String
  parentId  String?
  body      String
  score     Int       @default(0)
  isRemoved Boolean   @default(false)
  createdAt DateTime  @default(now())

  post         Post      @relation("PostComments", fields: [postId], references: [id], onDelete: Cascade)
  author       User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent       Comment?  @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade)
  replies      Comment[] @relation("Replies")
  bestAnswerOf Post?     @relation("BestAnswer")

  @@index([postId, createdAt])
  @@index([authorId])
}

model Vote {
  userId     String
  targetType VoteTarget
  targetId   String
  value      Int        // -1 or 1 (validated in the API)
  createdAt  DateTime   @default(now())
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, targetType, targetId])
  @@index([targetType, targetId])
}

model Bookmark {
  userId     String
  targetType BookmarkTarget
  targetId   String
  createdAt  DateTime       @default(now())
  user       User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, targetType, targetId])
}

// ───────────── Connections and mentorship ─────────────
model Connection {
  id          String           @id @default(uuid())
  requesterId String
  recipientId String
  kind        ConnectionKind
  message     String
  topic       String?          // the specific question for mentorship / peer guidance
  status      ConnectionStatus @default(PENDING)
  followUps   Json             @default("[]") // [{ id, text, done, by }]
  sessionNote String?
  createdAt   DateTime         @default(now())
  respondedAt DateTime?
  completedAt DateTime?

  requester User @relation("SentRequests", fields: [requesterId], references: [id], onDelete: Cascade)
  recipient User @relation("ReceivedRequests", fields: [recipientId], references: [id], onDelete: Cascade)

  @@unique([requesterId, recipientId, kind])
  @@index([recipientId, status])
}

// ───────────── Companies and experiences ─────────────
model Company {
  id           String   @id @default(uuid())
  slug         String   @unique
  name         String
  description  String   @default("")
  website      String?
  roles        String[] @default([])
  rounds       Json     @default("[]") // [{ name, type, description }]
  skillsTested String[] @default([])
  prepRoadmap  Json     @default("[]") // [{ title, detail, category }]
  visitMonth   String?

  experiences Experience[]
  prepItems   PrepItem[]
  simSessions SimSession[]
}

model Experience {
  id         String   @id @default(uuid())
  authorId   String
  companyId  String
  role       String
  year       Int
  rounds     Json     @default("[]") // [{ name, type: SimRoundType, topics: string[], difficulty: 1-5, notes }]
  difficulty Int      @default(3)
  prepWeeks  Int?
  resources  String[] @default([])
  tips       String   @default("")
  outcome    Outcome  @default(WITHHELD)
  isVerified Boolean  @default(false)
  isRemoved  Boolean  @default(false)
  createdAt  DateTime @default(now())

  author  User    @relation(fields: [authorId], references: [id], onDelete: Cascade)
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId, year])
}

// ───────────── Clubs ─────────────
model Club {
  id               String       @id @default(uuid())
  slug             String       @unique
  name             String
  category         String       // TECH | CULTURAL | SPORTS | ENTREPRENEURSHIP | SOCIAL
  description      String       @default("")
  timeCommitment   String       @default("")
  skillsGained     String[]     @default([])
  recruitmentMonth String?
  joinUrl          String?
  reviews          ClubReview[]
}

model ClubReview {
  id         String   @id @default(uuid())
  clubId     String
  authorId   String
  usefulness Int      // 1–5
  timeCost   Int      // 1–5
  review     String   @default("")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  club   Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@unique([clubId, authorId])
}

// ───────────── Journeys (Path Twins) ─────────────
model Milestone {
  id          String            @id @default(uuid())
  userId      String
  yearOfStudy Int               // 1–4, 5 = after graduation
  category    MilestoneCategory
  title       String
  description String            @default("")
  createdAt   DateTime          @default(now())
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, yearOfStudy])
}

// ───────────── Roadmaps ─────────────
model Roadmap {
  id         String        @id @default(uuid())
  authorId   String?
  goalTrack  GoalTrack
  title      String
  summary    String        @default("")
  steps      Json          @default("[]") // [{ id, title, detail, semester, kind: SKILL|PROJECT|RESOURCE|PRACTICE, resources: string[] }]
  mistakes   String[]      @default([])
  gaps       Json          @default("[]") // AI/deterministic: [{ skill, why, priority }]
  sources    Json          @default("{}") // { roadmaps: n, experiences: n, journeys: n }
  isAi       Boolean       @default(false)
  isPublic   Boolean       @default(true)
  saveCount  Int           @default(0)
  createdAt  DateTime      @default(now())

  author User?         @relation(fields: [authorId], references: [id], onDelete: SetNull)
  saves  RoadmapSave[]

  @@index([goalTrack, isPublic])
}

model RoadmapSave {
  userId         String
  roadmapId      String
  completedSteps String[] @default([])
  createdAt      DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  roadmap Roadmap @relation(fields: [roadmapId], references: [id], onDelete: Cascade)

  @@id([userId, roadmapId])
}

// ───────────── Teams, founder track, study circles ─────────────
model Team {
  id             String     @id @default(uuid())
  ownerId        String
  kind           TeamKind
  title          String
  description    String     @default("")
  requiredSkills String[]   @default([])
  rolesNeeded    String[]   @default([])
  commitment     String     @default("")
  maxMembers     Int        @default(4)
  meetingDetails String     @default("")
  schedule       String     @default("")
  openJoin       Boolean    @default(false) // study circles: join instantly
  status         TeamStatus @default(OPEN)
  isRemoved      Boolean    @default(false)
  createdAt      DateTime   @default(now())

  owner        User              @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  applications TeamApplication[]

  @@index([kind, status])
}

model TeamApplication {
  id          String            @id @default(uuid())
  teamId      String
  applicantId String
  message     String            @default("")
  status      ApplicationStatus @default(PENDING)
  createdAt   DateTime          @default(now())

  team      Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  applicant User @relation(fields: [applicantId], references: [id], onDelete: Cascade)

  @@unique([teamId, applicantId])
}

// ───────────── Events (This Week; extended in Phase 11) ─────────────
model Event {
  id            String        @id @default(uuid())
  title         String
  description   String        @default("")
  category      EventCategory
  startsAt      DateTime
  endsAt        DateTime?
  link          String?
  location      String?
  audienceYears Int[]         @default([1, 2, 3, 4, 5])
  createdById   String?
  createdAt     DateTime      @default(now())

  createdBy User? @relation(fields: [createdById], references: [id], onDelete: SetNull)

  @@index([startsAt])
}

// ───────────── Notifications and alerts ─────────────
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // ANSWER | COMMENT | REQUEST | REQUEST_RESPONSE | APPLICATION | BADGE | OPPORTUNITY | MENTION | SYSTEM
  title     String
  body      String   @default("")
  link      String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead, createdAt(sort: Desc)])
}

model AlertSubscription {
  userId           String            @id
  enabled          Boolean           @default(true)
  opportunityTypes OpportunityType[] @default([])
  topicIds         Int[]             @default([])
  tags             String[]          @default([])
  updatedAt        DateTime          @updatedAt
  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ───────────── Gamification ─────────────
model PointsLedger {
  id        String   @id @default(uuid())
  userId    String
  action    String
  points    Int
  refId     String   // what earned it (comment id, experience id…); never null so the unique key works
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, action, refId])
  @@index([createdAt])
}

model Badge {
  slug        String      @id
  name        String
  description String
  icon        String      // lucide icon name
  howToEarn   String
  users       UserBadge[]
}

model UserBadge {
  userId    String
  badgeSlug String
  awardedAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge     Badge    @relation(fields: [badgeSlug], references: [slug], onDelete: Cascade)

  @@id([userId, badgeSlug])
}

// ───────────── Stories ─────────────
model Story {
  id             String      @id @default(uuid())
  slug           String      @unique
  title          String
  excerpt        String
  body           String
  coverUrl       String?
  tags           String[]    @default([])
  authorId       String?
  featuredUserId String?
  isSpotlight    Boolean     @default(false)
  status         StoryStatus @default(DRAFT)
  isRemoved      Boolean     @default(false)
  publishedAt    DateTime?
  createdAt      DateTime    @default(now())

  author       User? @relation("StoryAuthor", fields: [authorId], references: [id], onDelete: SetNull)
  featuredUser User? @relation("StoryFeatured", fields: [featuredUserId], references: [id], onDelete: SetNull)

  @@index([status, publishedAt(sort: Desc)])
}

// ───────────── Moderation ─────────────
model Report {
  id         String       @id @default(uuid())
  reporterId String
  targetType ReportTarget
  targetId   String
  reason     ReportReason
  details    String       @default("")
  status     ReportStatus @default(OPEN)
  resolvedAt DateTime?
  createdAt  DateTime     @default(now())
  reporter   User         @relation(fields: [reporterId], references: [id], onDelete: Cascade)

  @@index([status, createdAt])
}

// ───────────── Placement prep and simulator ─────────────
model PrepItem {
  id        String       @id @default(uuid())
  userId    String
  companyId String?
  category  PrepCategory
  title     String
  done      Boolean      @default(false)
  source    String       @default("custom") // custom | company | roadmap
  createdAt DateTime     @default(now())

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)

  @@index([userId, category])
}

model SimSession {
  id           String       @id @default(uuid())
  userId       String
  companyId    String
  roundType    SimRoundType
  difficulty   Int          @default(2) // 1–5
  correctStreak Int         @default(0)
  wrongStreak  Int          @default(0)
  score        Int          @default(0)
  total        Int          @default(0)
  maxQuestions Int          @default(5)
  status       SimStatus    @default(ACTIVE)
  summary      Json?        // { strengths: [], revise: [], experienceIds: [] }
  createdAt    DateTime     @default(now())

  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  company   Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  questions SimQuestion[]

  @@index([userId, createdAt(sort: Desc)])
}

model SimQuestion {
  id                 String    @id @default(uuid())
  sessionId          String
  order              Int
  format             SimFormat
  topic              String
  difficulty         Int
  prompt             String
  options            Json?     // MCQ: string[]
  correctAnswer      String?   // MCQ: option index as string
  explanation        String    @default("")
  rubric             Json?     // SHORT / CODING_APPROACH: [{ point, weight }]
  sourceExperienceId String?
  sourceYear         Int?
  sourceRole         String?
  userAnswer         String?
  isCorrect          Boolean?
  scorePct           Int?      // 0–100 for rubric-graded answers
  feedback           String?
  answeredAt         DateTime?

  session SimSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, order])
}
```

### 5.3 Data rules not expressed in the schema

| Rule | Where enforced |
|---|---|
| Skills, interests, tags stored lowercase and trimmed | `normalizeTag()` in services before every write |
| `Vote.value` is -1 or 1 | zod `voteSchema` |
| Ratings 1–5, difficulty 1–5 | zod schemas |
| Only the question author can mark best answer | `posts.service.markBestAnswer` |
| Only the recipient can accept/decline; only the mentor can complete | `connections.service` |
| `role` and `points` cannot be changed by users | profile update schema omits them; only services/admin write them |
| Removed content never returned | every list query includes `isRemoved: false` |

---

## 6. Search setup (PostgreSQL full-text and trigram)

Full-text search and "similar questions" use PostgreSQL features that Prisma does not model directly. Keep them in a separate SQL file applied **after** migrations.

### 6.1 `apps/api/prisma/sql/search.sql`

```sql
-- Extensions (available on Neon and Supabase Postgres)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Full-text expression indexes. Queries must use the SAME expressions to benefit.
CREATE INDEX IF NOT EXISTS post_fts_idx ON "Post"
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')));

CREATE INDEX IF NOT EXISTS post_title_trgm_idx ON "Post" USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS experience_fts_idx ON "Experience"
  USING GIN (to_tsvector('english', coalesce(role,'') || ' ' || coalesce(tips,'') || ' ' || rounds::text));

CREATE INDEX IF NOT EXISTS user_fts_idx ON "User"
  USING GIN (to_tsvector('simple', coalesce("fullName",'') || ' ' || coalesce(company,'') || ' ' || coalesce("jobTitle",'') || ' ' || coalesce(bio,'')));

CREATE INDEX IF NOT EXISTS team_fts_idx ON "Team"
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE INDEX IF NOT EXISTS story_fts_idx ON "Story"
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(body,'')));

CREATE INDEX IF NOT EXISTS company_name_trgm_idx ON "Company" USING GIN (name gin_trgm_ops);
```

Run it with `npm run db:search` (a tiny script that reads the file and executes it with `prisma.$executeRawUnsafe` statement by statement).

> ⚠️ **Prisma and extra indexes.** `prisma migrate dev` compares your schema with the database. Indexes it doesn't know about may appear as "drift" or be dropped in a generated migration. **Always create migrations with `--create-only`, read the SQL, delete any `DROP INDEX` lines for the indexes above, then apply.** If they ever disappear, re-run `npm run db:search`. With demo-sized data, search still works without the indexes — they only make it faster.

### 6.2 Query patterns (always parameterised)

Use Prisma's tagged template `prisma.$queryRaw` so values are parameterised (never build SQL with string concatenation).

```ts
// similar questions (trigram)
const rows = await prisma.$queryRaw<Array<{ id: string; title: string; commentCount: number; hasBest: boolean; sim: number }>>`
  SELECT id, title, "commentCount", ("bestAnswerId" IS NOT NULL) AS "hasBest", similarity(title, ${q}) AS sim
  FROM "Post"
  WHERE kind = 'QUESTION' AND "isRemoved" = false AND similarity(title, ${q}) > 0.15
  ORDER BY sim DESC
  LIMIT 5`;
```

```ts
// full-text over posts
const rows = await prisma.$queryRaw`
  SELECT id, kind, title, left(body, 160) AS snippet,
         ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')), websearch_to_tsquery('english', ${q})) AS rank
  FROM "Post"
  WHERE "isRemoved" = false
    AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')) @@ websearch_to_tsquery('english', ${q})
  ORDER BY rank DESC
  LIMIT ${limit}`;
```

> Postgres enum columns compared with a string literal (`kind = 'QUESTION'`) work because the literal is cast to the enum. When passing an enum value as a **parameter**, cast explicitly: `kind = ${kind}::"PostKind"`.

---

## 7. API design conventions

| Topic | Convention |
|---|---|
| Base path | `/api` |
| Format | JSON in, JSON out; `Content-Type: application/json` required on writes |
| Success | `200 { data }` or `201 { data }`; paginated lists: `{ data: { items: [...], nextCursor: string \| null } }`; small fixed lists: `{ data: [...] }` |
| Errors | `{ error: { code, message, fields? } }` with HTTP status: 400 `VALIDATION`, 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409 `CONFLICT`, 429 `RATE_LIMITED`, 500 `INTERNAL` |
| Validation | zod schemas from `@crossroads/shared`; `fields` maps field path → message |
| Pagination | Cursor = last item's `createdAt|id`; `limit` default 20, max 50 |
| IDs | UUID strings |
| Dates | ISO 8601 strings in UTC; the client formats them |
| Naming | camelCase JSON; plural nouns for collections; verbs only for actions (`/complete`, `/best-answer`) |
| Idempotency | Toggle endpoints (`PUT /votes`, `PUT /bookmarks`, `PUT /roadmaps/:id/save`) are safe to repeat |
| Auth | Cookie `bu_session`; endpoints marked 🔒 require auth, 🎓 also require onboarding, 🛡️ require ADMIN |

### 7.1 Core helpers

```ts
// apps/api/src/lib/errors.ts
export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}
export const badRequest = (m: string, fields?: Record<string, string>) => new AppError(400, 'VALIDATION', m, fields);
export const unauthorized = (m = 'Please sign in') => new AppError(401, 'UNAUTHENTICATED', m);
export const forbidden = (m = 'You do not have access to this') => new AppError(403, 'FORBIDDEN', m);
export const notFound = (m = 'Not found') => new AppError(404, 'NOT_FOUND', m);
export const conflict = (m: string) => new AppError(409, 'CONFLICT', m);
```

```ts
// apps/api/src/middleware/validate.ts
import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { badRequest } from '../lib/errors';

type Schemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

export const validate = (s: Schemas): RequestHandler => (req, _res, next) => {
  const out: Record<string, unknown> = {};
  for (const key of ['body', 'query', 'params'] as const) {
    const schema = s[key];
    if (!schema) continue;
    const result = schema.safeParse(req[key]);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) fields[issue.path.join('.') || key] = issue.message;
      return next(badRequest('Please check the highlighted fields', fields));
    }
    out[key] = result.data;
  }
  // Express 5 makes req.query a getter; store parsed values separately instead of reassigning.
  // Handlers read req.valid.body / req.valid.query / req.valid.params.
  req.valid = out;
  next();
};
```

> ⚠️ In Express 5, `req.query` is a getter and cannot be reassigned. That is why parsed input is stored on `req.valid`. Add a type declaration (`declare global { namespace Express { interface Request { valid: any; user?: SessionUser } } }`) in `src/types/express.d.ts`.

```ts
// apps/api/src/middleware/errorHandler.ts
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../lib/errors';
import { Prisma } from '@prisma/client';
import { isProd } from '../config/env';

export const notFoundHandler: RequestHandler = (_req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'This already exists' } });
  }
  req.log?.error({ err }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL', message: isProd ? 'Something went wrong' : String(err?.message ?? err) } });
};
```

> Import `Prisma` and `PrismaClient` from the generated client (`../generated/prisma/client`). The real handler also maps body-parser errors (bad JSON → 400, too large → 413) and Prisma `P2025` → 404.

---

## 8. API endpoint reference

Legend: 🔒 signed in · 🎓 signed in **and** onboarded · 🛡️ admin. All paths are under `/api`.

### 8.1 Auth (`modules/auth`)

| Method | Path | Guard | Body / Query | Returns |
|---|---|---|---|---|
| POST | `/auth/register` | public, rate-limited | `{ fullName, email, password }` | `{ data: { email } }`; sends code |
| POST | `/auth/verify` | public, rate-limited | `{ email, code }` | Sets cookie; `{ data: me }` |
| POST | `/auth/resend-code` | public, rate-limited | `{ email }` | `{ data: { ok: true } }` (always, to avoid account enumeration) |
| POST | `/auth/login` | public, rate-limited | `{ email, password }` | Sets cookie; `{ data: me }` |
| POST | `/auth/logout` | 🔒 | — | Clears cookie |
| GET | `/auth/me` | public | — | `{ data: me \| null }` |
| POST | `/auth/demo-login` | public, **DEMO_MODE only** | `{ handle }` | Sets cookie for a seeded demo user |

### 8.2 Users, people, topics (`modules/users`, `people`, `topics`)

| Method | Path | Guard | Body / Query | Returns |
|---|---|---|---|---|
| PATCH | `/me/onboarding` | 🔒 | `onboardingSchema` | Updated me; sets `onboarded`, role, follows, alert defaults |
| PATCH | `/me/profile` | 🎓 | `profileUpdateSchema` (no role/points) | Updated me |
| POST | `/me/milestones` | 🎓 | `milestoneSchema` | Milestone |
| DELETE | `/me/milestones/:id` | 🎓 | — | `{ ok }` |
| GET | `/users/:handle` | 🎓 | — | Public profile (visibility applied) + match vs viewer + badges + contributions summary |
| GET | `/users/:handle/contributions` | 🎓 | — | Counts + recent contributions |
| GET | `/people` | 🎓 | `q, department, role, year, batch, skills, interests, targetRole, company, mentorAvailable, mode=all\|mentor, sort, cursor` | `PersonCard[]` with `match { score, reasons }` |
| GET | `/people/suggested` | 🎓 | `limit` | Top matches |
| GET | `/topics` | 🎓 | — | Topics + `followed` flag + follower counts |
| POST | `/topics/:id/follow` | 🎓 | — | `{ followed: true }` |
| DELETE | `/topics/:id/follow` | 🎓 | — | `{ followed: false }` |

### 8.3 Connections and mentorship (`modules/connections`)

| Method | Path | Guard | Body / Query | Returns |
|---|---|---|---|---|
| POST | `/connections` | 🎓 | `{ recipientId, kind, message, topic? }` | Connection |
| GET | `/connections` | 🎓 | `box=incoming\|outgoing\|completed` | Connections with the other person |
| PATCH | `/connections/:id` | 🎓 (recipient) | `{ status: 'ACCEPTED' \| 'DECLINED' }` | Connection |
| POST | `/connections/:id/complete` | 🎓 (mentor = recipient) | `{ sessionNote? }` | Connection (`COMPLETED`) + points |
| PUT | `/connections/:id/follow-ups` | 🎓 (either side) | `{ followUps: [{ id, text, done }] }` | Connection |

### 8.4 Posts, questions, comments, votes, bookmarks

| Method | Path | Guard | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/posts` | 🎓 | `kind, topic, tag, sort=latest\|top\|top_all\|unanswered, cursor` | `PostCard[]` + viewer vote + bookmark |
| POST | `/posts` | 🎓 | `postCreateSchema` (kind, title, body, topicId, tags, opportunity fields) | Post; triggers opportunity alerts |
| GET | `/posts/:id` | 🎓 | — | Post + comments tree + viewer votes |
| DELETE | `/posts/:id` | 🎓 (author/admin) | — | `{ ok }` (soft delete: `isRemoved`) |
| POST | `/posts/:id/comments` | 🎓 | `{ body, parentId? }` | Comment; points/badges/notifications |
| POST | `/posts/:id/best-answer` | 🎓 (question author) | `{ commentId }` | Post |
| GET | `/questions/similar` | 🎓 | `q` | Up to 5 similar questions |
| PUT | `/votes` | 🎓 | `{ targetType, targetId, value: -1 \| 0 \| 1 }` (0 removes) | `{ score, myVote }` |
| PUT | `/bookmarks` | 🎓 | `{ targetType, targetId }` (toggle) | `{ bookmarked }` |
| GET | `/bookmarks` | 🎓 | `type` | Bookmarked items, hydrated |

### 8.5 Home, feed, events, search

| Method | Path | Guard | Query | Returns |
|---|---|---|---|---|
| GET | `/feed` | 🎓 | `tab=foryou\|latest\|top, topic, cursor` | `FeedItem[]` with `reason` |
| GET | `/home/rail` | 🎓 | — | `{ thisWeek, quests \| waysToHelp, suggested, pendingRequests, opportunities, trending, spotlight }` |
| GET | `/events/week` | 🎓 | — | Events in the next 7 days for the viewer's year |
| GET | `/search` | 🎓 | `q, type, topic, company, department, batch, limit` | Grouped results |

### 8.6 Campus intelligence

| Method | Path | Guard | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/companies` | 🎓 | `q` | Company tiles with counts |
| GET | `/companies/:slug` | 🎓 | — | Company + rounds + skills + "you have X of Y" + latest experiences + AI summary if cached |
| GET | `/companies/:slug/experiences` | 🎓 | `year, role, minDifficulty` | Experiences |
| GET | `/companies/:slug/alumni` | 🎓 | — | People currently at the company (with match) |
| POST | `/experiences` | 🎓 | `experienceCreateSchema` | Experience; points + badge |
| GET | `/clubs` | 🎓 | `category, sort` | Clubs with average ratings |
| GET | `/clubs/:slug` | 🎓 | — | Club + reviews + my review |
| PUT | `/clubs/:slug/review` | 🎓 (not first year) | `{ usefulness, timeCost, review }` | Review (upsert); points on first review |
| GET | `/path-twins` | 🎓 | — | Starting point + top 3 twins with milestones + year-1 summary |
| GET | `/roadmaps` | 🎓 | `goalTrack, mine` | Roadmaps |
| GET | `/roadmaps/:id` | 🎓 | — | Roadmap + my save/progress |
| POST | `/roadmaps` | 🎓 | `roadmapCreateSchema` | Roadmap; points + badge |
| PUT | `/roadmaps/:id/save` | 🎓 | — | `{ saved }` |
| PATCH | `/roadmaps/:id/steps/:stepId` | 🎓 | `{ done }` | `{ completedSteps }` |
| POST | `/roadmaps/generate` | 🎓, AI-limited | `{ goalTrack, targetRole?, targetCompanySlugs? }` | New private roadmap id |

### 8.7 Collaboration

| Method | Path | Guard | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/opportunities` | 🎓 | `type, sort=closing\|newest, showPast` | Opportunity posts + reason |
| GET | `/me/alerts` | 🎓 | — | Alert preferences |
| PUT | `/me/alerts` | 🎓 | `alertPrefsSchema` | Alert preferences |
| GET | `/teams` | 🎓 | `kind, matchesMe, role` | Team cards |
| POST | `/teams` | 🎓 | `teamCreateSchema` | Team |
| GET | `/teams/:id` | 🎓 | — | Team + members + my application + applicants (owner only) |
| POST | `/teams/:id/apply` | 🎓 | `{ message }` | Application (auto-accepted when `openJoin`) |
| PATCH | `/teams/:id/applications/:appId` | 🎓 (owner) | `{ status }` | Application |
| PATCH | `/teams/:id` | 🎓 (owner) | `{ status: 'CLOSED' }` | Team |
| GET | `/notifications` | 🎓 | `cursor` | Notifications |
| GET | `/notifications/unread-count` | 🎓 | — | `{ count }` |
| POST | `/notifications/read` | 🎓 | `{ ids?: string[], all?: true }` | `{ ok }` |

### 8.8 Gamification, stories, reports, admin

| Method | Path | Guard | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/mentor-wall` | 🎓 | — | Top 10 contributors this month (seniors/alumni, opted in) |
| GET | `/stories` | public | `tag, cursor` | Published stories |
| GET | `/stories/:slug` | public | — | Story |
| POST | `/reports` | 🎓 | `{ targetType, targetId, reason, details? }` | Report |
| GET | `/admin/reports` | 🛡️ | `status` | Reports + target previews |
| PATCH | `/admin/reports/:id` | 🛡️ | `{ action: 'REMOVE' \| 'DISMISS' }` | Report |
| GET | `/admin/users` | 🛡️ | `q, role` | Users |
| PATCH | `/admin/users/:id` | 🛡️ | `{ isVerified?, role? }` | User |
| POST | `/admin/allowlist` | 🛡️ | `{ email, role }` | AllowedEmail |
| GET/POST/PATCH/DELETE | `/admin/events[/:id]` | 🛡️ | `eventUpsertSchema` | Event(s) |
| GET/POST/PATCH | `/admin/companies[/:id]` | 🛡️ | company fields | Company |
| GET/POST/PATCH | `/admin/clubs[/:id]` | 🛡️ | club fields | Club |
| GET/POST/PATCH | `/admin/stories[/:id]` | 🛡️ | `storyUpsertSchema` | Story |
| PATCH | `/admin/experiences/:id` | 🛡️ | `{ isVerified }` | Experience |

### 8.9 AI, prep and simulator

| Method | Path | Guard | Body / Query | Returns |
|---|---|---|---|---|
| POST | `/ai/answer` | 🎓, AI-limited | `{ questionId }` or `{ title, body? }` | `{ status: 'ok' \| 'no_sources' \| 'fallback', answer?, citations?, sources }` |
| POST | `/ai/summary` | 🎓, AI-limited | `{ postId }` or `{ companySlug }` | `{ bullets, sources }` |
| GET | `/prep/dashboard` | 🎓 | — | Targets, readiness per company, tracks, deadlines, next actions, recent sim scores |
| PUT | `/me/targets` | 🎓 | `{ targetCompanies, targetRoles }` | Me |
| POST | `/prep/items` | 🎓 | `{ category, title, companyId? }` | PrepItem |
| PATCH | `/prep/items/:id` | 🎓 (owner) | `{ done?, title? }` | PrepItem |
| DELETE | `/prep/items/:id` | 🎓 (owner) | — | `{ ok }` |
| POST | `/prep/items/import` | 🎓 | `{ companyId }` | PrepItems created from the company's prep roadmap |
| POST | `/sim/sessions` | 🎓, AI-limited | `{ companySlug, roundType, maxQuestions? }` | Session + first question |
| GET | `/sim/sessions/:id` | 🎓 (owner) | — | Session + questions (answers hidden until answered) |
| POST | `/sim/sessions/:id/answer` | 🎓 (owner), AI-limited | `{ questionId, answer }` | Graded question + next question or `done` |
| POST | `/sim/sessions/:id/finish` | 🎓 (owner) | — | Session summary |

### 8.10 Phase 11 (later) endpoints

Documented in `phases/phase-11.md`: `/events/*` (public events, RSVP, tickets, check-in), `/payments/*` (create order, verify, webhook), `/campaigns/*` (list, detail, donate), `/admin/campaigns/*`.

---

## 9. Authentication and authorization

### 9.1 Registration and verification flow

```
Register form ──POST /auth/register──▶ API
   1. validate (zod)
   2. email domain ∈ ALLOWED_EMAIL_DOMAINS  OR  email ∈ AllowedEmail  → else 400 "Use your college email…"
   3. if a VERIFIED user exists → 409 "Account exists, please log in"
      if an UNVERIFIED user exists → update name/password (lets people retry)
   4. create User { emailVerified: false, role from AllowedEmail or STUDENT, handle }
   5. create EmailCode { codeHash = sha256(code + JWT_SECRET), expiresAt = now + 10 min }
   6. EMAIL_MODE=console → log "[DEV] Verification code for x@y: 123456"
      EMAIL_MODE=resend  → send email
Verify page ──POST /auth/verify──▶ API
   1. find latest unexpired code for email; attempts < 5 (else 429)
   2. compare hash (timing-safe); wrong → attempts++ → 400
   3. user.emailVerified = true; delete codes; issue session cookie
   4. return me → client routes to /onboarding
```

### 9.2 Session cookie

| Property | Value |
|---|---|
| Name | `bu_session` |
| Content | JWT `{ sub: userId, role, ver: 1 }`, signed HS256 with `JWT_SECRET`, expires in `SESSION_DAYS` |
| Flags | `httpOnly`, `sameSite: 'lax'`, `secure: isProd`, `path: '/'`, `maxAge` = session days |
| Why it works in production | The web app calls `/api` on its own domain; Vercel rewrites to Render, so the cookie is first-party |

> If you ever call the API on a different domain directly, you would need `sameSite: 'none'` + `secure: true` + CORS `credentials: true`, and some browsers restrict third-party cookies. The rewrite avoids all of that.

### 9.3 Middleware

```ts
// apps/api/src/middleware/auth.ts
import type { RequestHandler } from 'express';
import { verifySession } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { unauthorized, forbidden } from '../lib/errors';

export type SessionUser = { id: string; role: 'STUDENT' | 'SENIOR' | 'ALUMNI' | 'ADMIN'; onboarded: boolean; currentYear: number | null };

export const authOptional: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.bu_session;
  if (!token) return next();
  const payload = verifySession(token); // returns null if invalid/expired
  if (!payload) return next();
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, onboarded: true, currentYear: true, emailVerified: true },
  });
  if (user?.emailVerified) req.user = { id: user.id, role: user.role, onboarded: user.onboarded, currentYear: user.currentYear };
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => (req.user ? next() : next(unauthorized()));
export const requireOnboarded: RequestHandler = (req, _res, next) =>
  !req.user ? next(unauthorized()) : req.user.onboarded ? next() : next(forbidden('Please finish onboarding first'));
export const requireRole = (...roles: SessionUser['role'][]): RequestHandler => (req, _res, next) =>
  !req.user ? next(unauthorized()) : roles.includes(req.user.role) ? next() : next(forbidden());
```

Loading the user on every request costs one indexed query; it means role changes and verification take effect immediately, which is worth it at this scale.

### 9.4 Authorization matrix

| Action | STUDENT (yr 1) | STUDENT (yr 2–3) | SENIOR | ALUMNI | ADMIN |
|---|---|---|---|---|---|
| Ask, post, comment, vote | ✓ | ✓ | ✓ | ✓ | ✓ |
| Answer questions | ✓ | ✓ | ✓ (highlighted) | ✓ (highlighted) | ✓ |
| Review clubs | — | ✓ | ✓ | ✓ | ✓ |
| Share interview experiences | — (UI hint) | ✓ | ✓ | ✓ | ✓ |
| Publish roadmaps | ✓ (encouraged for seniors) | ✓ | ✓ | ✓ | ✓ |
| Appear on mentor wall | — | — | ✓ (opt-in) | ✓ (opt-in) | — |
| Points shown publicly | — | — | ✓ | ✓ | — |
| Admin panel | — | — | — | — | ✓ |

### 9.5 Demo login

When `DEMO_MODE=true`, `POST /auth/demo-login { handle }` signs in as a seeded user whose email ends with the demo marker (e.g. `@demo.crossroads`), so you can switch between Ananya, Rahul, Meera and the admin in seconds during the pitch. **Disable `DEMO_MODE` for any real use.**

---

## 10. Cross-cutting backend services

### 10.1 Gamification (`services/gamification.ts`)

```ts
import type { Prisma, PrismaClient } from '@prisma/client';
type Tx = Prisma.TransactionClient | PrismaClient;

export const POINTS = {
  ANSWER: 5,
  HELPFUL_VOTE: 2,
  BEST_ANSWER: 15,
  EXPERIENCE: 20,
  CLUB_REVIEW: 5,
  ROADMAP: 20,
  MENTOR_SESSION: 25,
} as const;

/** Awards points once per (user, action, refId). Returns true if points were added. */
export async function awardPoints(tx: Tx, userId: string, action: string, points: number, refId: string) {
  const created = await tx.pointsLedger.createMany({
    data: [{ userId, action, points, refId }],
    skipDuplicates: true, // relies on @@unique([userId, action, refId])
  });
  if (created.count === 0) return false;
  await tx.user.update({ where: { id: userId }, data: { points: { increment: points } } });
  return true;
}

/** Grants a badge once and notifies the user. */
export async function grantBadge(tx: Tx, userId: string, badgeSlug: string) {
  const res = await tx.userBadge.createMany({ data: [{ userId, badgeSlug }], skipDuplicates: true });
  if (res.count === 0) return false;
  const badge = await tx.badge.findUnique({ where: { slug: badgeSlug } });
  if (badge) {
    await tx.notification.create({
      data: { userId, type: 'BADGE', title: `Badge unlocked: ${badge.name}`, body: badge.description, link: '/me' },
    });
  }
  return true;
}

/** Re-checks count-based badges after a contribution. */
export async function evaluateBadges(tx: Tx, userId: string) {
  const [answers, bests, experiences, reviews, roadmaps, sessions, connections] = await Promise.all([
    tx.comment.count({ where: { authorId: userId, parentId: null, post: { kind: 'QUESTION' } } }),
    tx.post.count({ where: { bestAnswer: { authorId: userId } } }),
    tx.experience.count({ where: { authorId: userId } }),
    tx.clubReview.count({ where: { authorId: userId } }),
    tx.roadmap.count({ where: { authorId: userId, isAi: false } }),
    tx.connection.count({ where: { recipientId: userId, kind: 'MENTORSHIP', status: 'COMPLETED' } }),
    tx.connection.count({ where: { OR: [{ requesterId: userId }, { recipientId: userId }], status: { in: ['ACCEPTED', 'COMPLETED'] } } }),
  ]);
  const grants: string[] = [];
  if (answers >= 1) grants.push('first-answer');
  if (answers >= 10) grants.push('answer-machine');
  if (bests >= 3) grants.push('trusted-voice');
  if (experiences >= 1) grants.push('experience-sharer');
  if (reviews >= 1) grants.push('club-reviewer');
  if (roadmaps >= 1) grants.push('roadmap-author');
  if (sessions >= 1) grants.push('mentor');
  if (connections >= 10) grants.push('bridge-builder');
  for (const slug of grants) await grantBadge(tx, userId, slug);
}

export const LEVELS = [
  { name: 'Newcomer', min: 0 },
  { name: 'Helper', min: 50 },
  { name: 'Guide', min: 150 },
  { name: 'Mentor', min: 400 },
  { name: 'Legend', min: 1000 },
] as const;

export function levelFor(points: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) idx = i;
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const progress = next ? (points - current.min) / (next.min - current.min) : 1;
  return { name: current.name, min: current.min, next: next?.min ?? null, progress };
}
```

**Where each award happens (always inside the same transaction as the action):**

| Action (service) | Points | Then |
|---|---|---|
| `posts.createComment` on a QUESTION with `parentId = null` | ANSWER (refId = comment id) | `evaluateBadges` |
| `votes.cast` value 1 on an answer (not own) | HELPFUL_VOTE (action `helpful:${voterId}`, refId = comment id) | — |
| `posts.markBestAnswer` | BEST_ANSWER (refId = comment id) | `evaluateBadges` |
| `experiences.create` | EXPERIENCE | `evaluateBadges` |
| `clubs.review` (first time) | CLUB_REVIEW | `evaluateBadges` |
| `roadmaps.create` (human) | ROADMAP | `evaluateBadges` |
| `connections.complete` (mentorship) | MENTOR_SESSION (to mentor) | `evaluateBadges` |
| `connections.respond` ACCEPTED | — | `evaluateBadges` for both users |
| admin publishes story with `featuredUserId` | — | `grantBadge('spotlight')` |

### 10.2 Notifications (`services/notify.ts`)

```ts
export async function notify(tx: Tx, n: { userId: string; type: string; title: string; body?: string; link?: string }) {
  await tx.notification.create({ data: { ...n, body: n.body ?? '' } });
}

export async function notifyMany(tx: Tx, userIds: string[], n: Omit<Parameters<typeof notify>[1], 'userId'>) {
  if (!userIds.length) return;
  await tx.notification.createMany({ data: userIds.map((userId) => ({ userId, ...n, body: n.body ?? '' })) });
}
```

**Notification triggers:**

| Event | Recipient | Type | Link |
|---|---|---|---|
| New answer / comment | Post author (not self) | ANSWER / COMMENT | `/ask/:id` or `/post/:id` |
| Reply to comment | Parent comment author | COMMENT | same |
| Best answer chosen | Answer author | ANSWER | `/ask/:id` |
| Request received | Recipient | REQUEST | `/requests` |
| Request accepted/declined | Requester | REQUEST_RESPONSE | `/requests` |
| Session completed | Requester | REQUEST_RESPONSE | `/requests` |
| Team application | Owner | APPLICATION | `/teams/:id` |
| Application accepted/rejected | Applicant | APPLICATION | `/teams/:id` |
| Badge unlocked | User | BADGE | `/me` |
| Matching opportunity posted | Users whose alert preferences match | OPPORTUNITY | `/post/:id` |
| New question in a followed topic (seniors/alumni with matching skills, max 20) | Seniors/alumni | ANSWER | `/ask/:id` |

**Opportunity alert matching:** a user is notified if `enabled` and (`opportunityTypes` contains the post's type **or** `topicIds` contains the post's topic **or** `tags` overlaps the post's tags), excluding the author. Use one Prisma query with `OR` + `hasSome`, limited to 500 recipients.

---

## 11. Core algorithms

All scores are deterministic, explainable and cheap. Every function returns **reasons** used by the UI.

### 11.1 Smart People Matching (`services/matching.ts`)

```ts
import { jaccard, titleCase } from '../lib/text';

type P = {
  id: string; role: string; department: string | null; currentYear: number | null; company: string | null; jobTitle: string | null;
  skills: string[]; interests: string[]; targetRoles: string[]; targetCompanies: string[]; canHelpWith: string[]; lookingFor: string[];
  projects: { title: string; description: string }[]; mentorAvailable: boolean;
};
export type Reason = { label: string; weight: number };

const WEIGHTS = { skills: 25, interests: 15, help: 20, role: 12, company: 13, seniority: 10, department: 5 } as const;

export function scoreMatch(v: P, c: P) {
  const reasons: Reason[] = [];
  let score = 0;

  // 1. Skills: candidate's skills (+ words in their project text) vs what the viewer knows and cares about
  const projectText = c.projects.map((p) => `${p.title} ${p.description}`.toLowerCase()).join(' ');
  const viewerFocus = [...new Set([...v.skills, ...v.interests])];
  // whole-term match: a plain includes() lets the skill "c" match almost any project text
  const sharedSkills = viewerFocus.filter((s) => c.skills.includes(s) || mentions(projectText, s));
  const skillScore = viewerFocus.length ? Math.min(1, sharedSkills.length / Math.min(viewerFocus.length, 4)) : 0;
  if (skillScore) {
    score += WEIGHTS.skills * skillScore;
    const fromProjects = sharedSkills.filter((s) => !c.skills.includes(s));
    reasons.push({
      label: fromProjects.length ? `Built projects in ${titleCase(fromProjects[0])}` : `Shared skills: ${sharedSkills.slice(0, 2).map(titleCase).join(', ')}`,
      weight: WEIGHTS.skills * skillScore,
    });
  }

  // 2. Interests
  const interestScore = jaccard(v.interests, c.interests);
  if (interestScore) {
    score += WEIGHTS.interests * interestScore;
    const both = v.interests.filter((i) => c.interests.includes(i));
    reasons.push({ label: `Both interested in ${titleCase(both[0])}`, weight: WEIGHTS.interests * interestScore });
  }

  // 3. They can help with what I'm looking for
  const helps = v.lookingFor.filter((x) => c.canHelpWith.includes(x));
  if (helps.length) {
    const s = Math.min(1, helps.length / 2);
    score += WEIGHTS.help * s;
    reasons.push({ label: `Can help with ${helps.slice(0, 2).join(', ')}`, weight: WEIGHTS.help * s });
  }

  // 4. Target role
  const roleHit = v.targetRoles.find((r) => c.targetRoles.includes(r) || (c.jobTitle ?? '').toLowerCase().includes(r));
  if (roleHit) {
    score += WEIGHTS.role;
    reasons.push({ label: c.jobTitle ? `Works as ${c.jobTitle} — your target role` : `Same target role: ${titleCase(roleHit)}`, weight: WEIGHTS.role });
  }

  // 5. Target company (Find My Alumni Mentor)
  const companyHit = c.company && v.targetCompanies.some((slug) => c.company!.toLowerCase().includes(slug.replace(/-/g, ' ')));
  if (companyHit) {
    score += WEIGHTS.company;
    reasons.push({ label: `Works at ${c.company}, your target company`, weight: WEIGHTS.company });
  }

  // 6. Seniority (someone ahead of you)
  const ahead = c.role === 'ALUMNI' || c.role === 'SENIOR' || (c.currentYear ?? 0) > (v.currentYear ?? 0);
  if (ahead) {
    score += WEIGHTS.seniority;
    const yrs = c.currentYear && v.currentYear ? c.currentYear - v.currentYear : null;
    reasons.push({ label: c.role === 'ALUMNI' ? 'Alumni' : yrs && yrs > 0 ? `${yrs} year${yrs > 1 ? 's' : ''} ahead of you` : 'Senior', weight: WEIGHTS.seniority * 0.5 });
  }

  // 7. Same department
  if (v.department && v.department === c.department) {
    score += WEIGHTS.department;
    reasons.push({ label: 'Same department', weight: WEIGHTS.department * 0.5 });
  }

  // small boost for available mentors in mentor mode is applied by the caller
  reasons.sort((a, b) => b.weight - a.weight);
  return { score: Math.round(Math.min(100, score)), reasons: reasons.slice(0, 3).map((r) => r.label) };
}

export function rankPeople(viewer: P, candidates: P[], mentorMode = false) {
  return candidates
    .map((c) => {
      const m = scoreMatch(viewer, c);
      const boost = mentorMode && c.mentorAvailable ? 5 : 0;
      return { candidate: c, match: { ...m, score: Math.min(100, m.score + boost) } };
    })
    .sort((a, b) => b.match.score - a.match.score);
}
```

`lib/text.ts`:

```ts
export const normalizeTag = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
export const titleCase = (s = '') => s.replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\bAi\b/g, 'AI').replace(/\bMl\b/g, 'ML').replace(/\bDsa\b/g, 'DSA');
export function jaccard(a: string[], b: string[]) {
  if (!a.length && !b.length) return 0;
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / new Set([...A, ...B]).size;
}
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
```

**Filters run in SQL first** (department, role, year/batch, `skills hasSome`, `interests hasSome`, `targetRoles hasSome`, company contains, `mentorAvailable`, free text via full-text on name/company/title/bio), then the remaining rows (capped at 300) are scored in memory. Sort: Best match, Most helpful (`points` desc, but only for seniors/alumni), Newest.

### 11.2 Personalized feed ranking (`services/feedRank.ts`)

Candidates: posts (all kinds) from the last 30 days, not removed, max 300, with author `{ role, department, fullName, handle }` and topic.

```
relevance =
    3.0 × [topic followed]
  + 2.0 × min(1, |tags ∩ (interests ∪ skills)| / 2)
  + 1.5 × [kind = OPPORTUNITY and (type in alert types OR tags ∩ interests)]
  + 1.0 × [author is SENIOR/ALUMNI and viewer currentYear ≤ 2]
  + 1.0 × [kind = QUESTION and no answers and viewer is SENIOR/ALUMNI and tags ∩ viewer.skills]   (ways to help)
  + 0.5 baseline

quality = sign(score) × log10(1 + |score|) + 0.3 × min(commentCount, 10)/10 + 0.5 × [has best answer]

hot = (relevance + quality) / (ageHours + 2) ^ 1.25
```

**Reason chip** (largest relevance term): "Because you follow {Topic}" · "Matches your interest: {tag}" · "Opportunity for {interest/type}" · "From a senior in {department}" / "From an alumnus" · "You can help: matches {skill}" · otherwise "Popular this week" if score ≥ 5, else no chip.

**Diversity pass:** walk the sorted list; if the next item would make 3 in a row from the same topic, swap it with the next item from a different topic.

**Tabs:** For you (hot) · Latest (`createdAt desc`) · Top this week (`score desc`, last 7 days). Topic filter chip restricts to one topic.

```ts
export function rankFeed(viewer: Viewer, followedTopicIds: Set<number>, posts: FeedPost[]) {
  const mine = new Set([...viewer.interests, ...viewer.skills]);
  const now = Date.now();
  const scored = posts.map((p) => {
    const terms: Array<[number, string]> = [];
    if (p.topicId && followedTopicIds.has(p.topicId)) terms.push([3, `Because you follow ${p.topic?.name}`]);
    const tagHits = p.tags.filter((t) => mine.has(t));
    if (tagHits.length) terms.push([2 * Math.min(1, tagHits.length / 2), `Matches your interest: ${titleCase(tagHits[0])}`]);
    if (p.kind === 'OPPORTUNITY' && (viewer.alertTypes.includes(p.opportunityType!) || tagHits.length))
      terms.push([1.5, `Opportunity for ${titleCase(tagHits[0] ?? p.opportunityType!.toLowerCase())}`]);
    if ((p.author.role === 'SENIOR' || p.author.role === 'ALUMNI') && (viewer.currentYear ?? 9) <= 2)
      terms.push([1, p.author.role === 'ALUMNI' ? 'From an alumnus' : `From a senior in ${p.author.department ?? 'your college'}`]);
    if (p.kind === 'QUESTION' && p.commentCount === 0 && ['SENIOR', 'ALUMNI'].includes(viewer.role) && p.tags.some((t) => viewer.skills.includes(t)))
      terms.push([1, `You can help: ${titleCase(p.tags.find((t) => viewer.skills.includes(t))!)}`]);
    const relevance = 0.5 + terms.reduce((s, [w]) => s + w, 0);
    const quality = Math.sign(p.score) * Math.log10(1 + Math.abs(p.score)) + 0.3 * Math.min(p.commentCount, 10) / 10 + (p.bestAnswerId ? 0.5 : 0);
    const ageHours = (now - new Date(p.createdAt).getTime()) / 36e5;
    const hot = (relevance + quality) / Math.pow(ageHours + 2, 1.25);
    terms.sort((a, b) => b[0] - a[0]);
    const reason = terms[0]?.[1] ?? (p.score >= 5 ? 'Popular this week' : null);
    return { ...p, hot, reason };
  });
  scored.sort((a, b) => b.hot - a.hot);
  return diversify(scored);
}

function diversify<T extends { topicId: number | null }>(items: T[]) {
  const out = [...items];
  for (let i = 2; i < out.length; i++) {
    if (out[i].topicId != null && out[i].topicId === out[i - 1].topicId && out[i].topicId === out[i - 2].topicId) {
      const j = out.findIndex((x, k) => k > i && x.topicId !== out[i].topicId);
      if (j > -1) [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out;
}
```

### 11.3 Path Twins (`services/twins.ts`)

```
twinScore = 35 × [same department] + 35 × jaccard(viewer.interests, candidate.interests) + 20 × goalMatch + 10 × min(1, year1Milestones / 2)

goalMatch:
  PRODUCT        ↔ candidate has a JOB milestone or company and goalTrack PRODUCT
  STARTUP        ↔ candidate has a STARTUP milestone
  RESEARCH / MS  ↔ candidate goalTrack RESEARCH or MS, or milestone title contains "research"/"MS"
  otherwise      ↔ candidate.goalTrack == viewer.goalTrack
```

Candidates: SENIOR and ALUMNI users with ≥ 3 milestones. Return the top 3 with reasons and their milestones grouped by `yearOfStudy` (1, 2, 3, 4, 5 = "After college"). Also return **"What your twins did in Year 1"**: year-1 milestones of the top 5 twins, grouped by category, most common first.

### 11.4 Quests and ways to help (`services/quests.ts`)

| Quest (first years) | Done when |
|---|---|
| Complete your profile | `skills.length ≥ 3` and `bio.length ≥ 20` |
| Follow 3 topics | `topicFollows ≥ 3` |
| Ask your first question | ≥ 1 post of kind QUESTION |
| Explore 3 clubs | client sends visited club slugs (stored in `localStorage`) as `?visited=3` **or** server sees ≥ 1 club review |
| Send your first request | ≥ 1 connection sent |
| Save a roadmap | ≥ 1 roadmap save |

| Ways to help (seniors/alumni) | Source |
|---|---|
| Unanswered questions in your skills | count of QUESTION posts with `commentCount = 0` and tags overlapping skills |
| Clubs you can review | clubs where the user has a CLUB milestone or none reviewed yet |
| Pending requests | incoming PENDING connections |
| Share an interview experience | if user has a JOB/INTERNSHIP milestone and no experiences |

### 11.5 Placement readiness (`services/readiness.ts`)

```
skillReadiness(company) = |viewer.skills ∩ company.skillsTested| / |company.skillsTested|
trackProgress(category) = done PrepItems / total PrepItems in category (per company or overall)
readiness(company) = round(100 × (0.6 × skillReadiness + 0.4 × average(trackProgress over OA, APTITUDE, TECHNICAL, HR with items)))
simBoost = if the user has finished simulator sessions for this company in the last 14 days:
           +min(10, average score% / 10)  (capped at 100)
```

**Next actions** (max 5, in this order):
1. Missing skills tested by ≥ 2 target companies ("Learn SQL — tested by 2 of your targets").
2. First unticked step of the user's most recent saved roadmap.
3. Prep track with the lowest progress ("Your HR prep is at 0% — add 3 HR questions").
4. Upcoming deadline within 7 days.
5. "Take a 5-question {round} simulation for {company}" if no recent session.

**Year adaptation:** year 1 → copy says "Focus on foundations" and next actions prefer clubs/projects/DSA basics; year 2 → projects and internships; years 3–4 → company-specific prep and simulations.

### 11.6 Simulator difficulty and grading (`services/simulator.ts`)

- Difficulty starts at 2 (1–5).
- After each answer: correct (MCQ) or `scorePct ≥ 70` (written) → `correctStreak++`, `wrongStreak = 0`; else the reverse.
- If `correctStreak == 2` → difficulty = min(5, difficulty + 1), reset streak. If `wrongStreak == 2` → difficulty = max(1, difficulty − 1), reset streak.
- Next question is generated at the new difficulty from the company's experiences for that round type (topics drawn from `rounds[].topics` of experiences, most recent years first; the source experience and year are stored on the question).
- **MCQ** graded locally against `correctAnswer`. **SHORT / CODING_APPROACH** graded by AI against the stored rubric → `scorePct` + feedback; with no AI, the user self-assesses using the rubric checklist and the score is the share of rubric points they tick.
- **Summary:** score, accuracy by topic, "Revise these" topics (any topic with < 60%), links to the source experiences.

---

## 12. AI layer design

### 12.1 Principles

1. **Grounded:** the model only sees campus data we retrieved (answers, experiences, roadmaps, journeys) and must cite it.
2. **Labelled:** every AI output in the UI says "AI-generated from seniors' answers / alumni data — check the sources".
3. **Validated:** every response must be JSON that passes a zod schema; otherwise use the fallback.
4. **Fallback first:** each feature works without the API key (sources-only answer panel, deterministic roadmap, pre-written question bank + self-grading for the simulator).
5. **Safe and cheap:** server-only key, rate limit 20 calls/user/hour, 20-second timeout, max tokens per call, never send emails or contact details to the model.

### 12.2 Client wrapper (`lib/ai.ts`)

Use the `openai` SDK against any OpenAI-compatible endpoint (default: Groq's free tier). Ask for JSON mode, then validate the reply with zod; on any failure the caller uses its fallback. Timeouts and retries are per-request options (TypeScript timeouts are in **milliseconds**).

```ts
import OpenAI from 'openai';
import type { z } from 'zod';
import { env, aiEnabled } from '../config/env';

// Created only when AI is enabled so the app runs without a key
const client = aiEnabled
  ? new OpenAI({ apiKey: env.AI_API_KEY, baseURL: env.AI_BASE_URL, maxRetries: 2 })
  : null;

export class AIError extends Error {}

/** One JSON-mode call: the reply is parsed and validated against `schema`. */
export async function generateJSON<T extends z.ZodTypeAny>(opts: {
  system: string;
  user: string;
  schema: T;
  maxTokens?: number;
}): Promise<z.infer<T>> {
  if (!client) throw new AIError('AI disabled');
  try {
    const res = await client.chat.completions.create(
      {
        model: env.AI_MODEL,
        max_tokens: opts.maxTokens ?? env.AI_MAX_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${opts.system}\nRespond with a single JSON object only.` },
          { role: 'user', content: opts.user },
        ],
      },
      { timeout: env.AI_TIMEOUT_MS },
    );
    const choice = res.choices[0];
    if (choice?.finish_reason === 'length') throw new AIError('Output was cut off; raise maxTokens');
    const parsed = opts.schema.safeParse(JSON.parse(choice?.message?.content ?? ''));
    if (!parsed.success) throw new AIError('AI output failed validation');
    return parsed.data;
  } catch (e) {
    if (e instanceof AIError) throw e;
    if (e instanceof OpenAI.RateLimitError) throw new AIError('AI is busy, try again shortly');
    if (e instanceof OpenAI.APIError) throw new AIError(`AI error ${e.status}`);
    throw new AIError((e as Error).message);
  }
}
```

Environment (all validated in `config/env.ts`): `AI_API_KEY` (empty = AI off, every feature uses its fallback), `AI_BASE_URL` (default `https://api.groq.com/openai/v1`; any OpenAI-compatible endpoint works), `AI_MODEL` (default `openai/gpt-oss-120b`; use a smaller model such as `llama-3.1-8b-instant` if you hit free-tier limits), `AI_MAX_TOKENS` (default `4000`; don't set it low, a truncated reply fails validation), `AI_TIMEOUT_MS`.

Notes:
- JSON mode only guarantees syntactically valid JSON, so keep the exact field names and types in the prompt and always validate with zod.
- Never send emails, phone numbers or other contact details to the model. Treat user-written text inside prompts as data (say so in the system prompt).
- Free tiers are rate limited: keep the per-user hourly limit and the response cache, and let callers fall back on `AIError`.

### 12.3 Prompts

**Answer assistant**

```
SYSTEM: You help students at one college using answers written by their seniors and alumni.
Answer ONLY with information found in the numbered sources. If the sources don't answer the
question, say so in one sentence. Cite sources inline as [1], [2]. Max 120 words. Be warm,
practical and specific. Never invent names, companies, numbers, dates or links.
Return: {"answer": string, "citations": number[]}

USER:
Question: <title>
Details: <body or "none">
Sources:
[1] (Senior, CSE, answered 2026) <answer text, max 600 chars>
[2] ...
```

**Thread / company summary**

```
SYSTEM: Summarise the provided discussion (or interview experiences) for a student in at most
5 bullet points, each under 25 words. Use only the provided text. Mention patterns (most common
topics, difficulty, tips) and cite sources like [n]. Return: {"bullets": string[], "citations": number[]}
```

**Experience-to-Roadmap**

```
SYSTEM: You create a semester-by-semester preparation plan for one student at one college.
Use ONLY the provided context: alumni roadmaps, alumni journeys (milestones by year), company
requirements (skills tested, rounds, prep roadmap) and interview experience topics. Compare the
student's current skills with the target role and companies. Explain which gaps to address first
and why. Map each needed skill to concrete projects, resources and practice tasks taken from the
context. Never invent companies, numbers, people or links not in the context.
Return:
{"title": string, "summary": string,
 "gaps": [{"skill": string, "why": string, "priority": "high"|"medium"|"low"}],
 "steps": [{"title": string, "detail": string, "semester": number,
            "kind": "SKILL"|"PROJECT"|"RESOURCE"|"PRACTICE", "resources": string[]}]}
Only include semesters from <current semester> to 8. 8–14 steps total.
```

**Simulator question**

```
SYSTEM: You write one practice question for a campus placement simulation. Base it on the
provided interview-experience topics for this company and round. Difficulty 1 (easy) to 5 (hard).
Do NOT copy any confidential question verbatim; write an original question on the same topic.
For APTITUDE or CS_FUNDAMENTALS write a multiple-choice question with 4 options.
For TECHNICAL or HR write a short-answer question with a 3–5 point rubric.
For CODING write a problem statement and ask the student to explain their approach and complexity;
give a rubric.
Return: {"format": "MCQ"|"SHORT"|"CODING_APPROACH", "topic": string, "prompt": string,
         "options"?: string[], "correctIndex"?: number, "explanation": string,
         "rubric"?: [{"point": string, "weight": number}]}
```

**Simulator grading (written answers)**

```
SYSTEM: Grade the student's answer against the rubric. Be encouraging and specific.
Return: {"scorePct": number (0-100), "feedback": string (max 80 words), "missing": string[]}
```

### 12.4 Retrieval for the answer assistant (`services/retrieval.ts`)

1. `similar_questions` (trigram) on the title → up to 8 question ids.
2. Full-text search on title + body → up to 8 more.
3. Merge, keep questions that have a best answer or an answer with `score ≥ 1`.
4. For each, take the best answer (else the highest-scored answer); trim to 600 characters; include author role, department and year.
5. Number them 1..n (max 6). If n = 0 → `no_sources`.

### 12.5 Caching

Cache company summaries for 24 hours in memory (`Map<companyId, { at, value }>`), and cache AI answers per question id for 1 hour, so repeated demo clicks don't cost calls.

---

## 13. Frontend architecture

### 13.1 Routing (`src/router.tsx`)

```
/                         LandingPage                (PublicOnly redirects signed-in users to /home)
/login /register /verify  auth pages                 (PublicOnly)
/onboarding               OnboardingPage             (RequireAuth; redirect to /home if onboarded)
/stories /stories/:slug   public story pages
/support                  SupportPage                (public)
<RequireAuth><RequireOnboarded><AppShell>
  /home
  /ask  /ask/new  /ask/:id
  /community  /community/:topic  /community/tag/:tag  /post/:id
  /people
  /u/:handle  /me (redirect to own profile)  /settings/profile
  /requests
  /companies  /companies/:slug  /experiences/new
  /clubs  /clubs/:slug
  /path-twins
  /roadmaps  /roadmaps/new  /roadmaps/generate  /roadmaps/:id
  /opportunities  /opportunities/new
  /teams  /teams/new  /teams/:id
  /notifications  /bookmarks  /search
  /prep  /prep/simulator  /prep/simulator/:sessionId
  <RequireAdmin> /admin/* </RequireAdmin>
</AppShell>
*                         NotFoundPage
```

Pages are lazy-loaded (`lazy: () => import(...)` or `React.lazy`) so the first load stays small.

### 13.2 Data fetching

```ts
// src/lib/api.ts
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) { super(message); }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : init.body,
    ...rest,
  });
  if (res.status === 204) return undefined as T;
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = payload?.error ?? {};
    throw new ApiError(res.status, e.code ?? 'INTERNAL', e.message ?? 'Something went wrong', e.fields);
  }
  return payload.data as T;
}
```

```ts
// src/lib/queryKeys.ts — one place for every key so invalidation is predictable
export const qk = {
  me: ['me'] as const,
  feed: (tab: string, topic?: string) => ['feed', tab, topic ?? 'all'] as const,
  rail: ['home', 'rail'] as const,
  posts: (params: Record<string, unknown>) => ['posts', params] as const,
  post: (id: string) => ['post', id] as const,
  similar: (q: string) => ['similar', q] as const,
  people: (params: Record<string, unknown>) => ['people', params] as const,
  user: (handle: string) => ['user', handle] as const,
  connections: (box: string) => ['connections', box] as const,
  topics: ['topics'] as const,
  companies: ['companies'] as const,
  company: (slug: string) => ['company', slug] as const,
  clubs: (params: Record<string, unknown>) => ['clubs', params] as const,
  club: (slug: string) => ['club', slug] as const,
  twins: ['twins'] as const,
  roadmaps: (params: Record<string, unknown>) => ['roadmaps', params] as const,
  roadmap: (id: string) => ['roadmap', id] as const,
  opportunities: (params: Record<string, unknown>) => ['opportunities', params] as const,
  alerts: ['alerts'] as const,
  teams: (params: Record<string, unknown>) => ['teams', params] as const,
  team: (id: string) => ['team', id] as const,
  notifications: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  bookmarks: (type?: string) => ['bookmarks', type ?? 'all'] as const,
  search: (params: Record<string, unknown>) => ['search', params] as const,
  prep: ['prep'] as const,
  sim: (id: string) => ['sim', id] as const,
  stories: ['stories'] as const,
  story: (slug: string) => ['story', slug] as const,
  admin: (tab: string) => ['admin', tab] as const,
};
```

**Rules:**
- Every feature has `features/<name>/api.ts` exporting hooks (`useFeed`, `useCreatePost`, …). Pages never call `fetch` directly.
- Query defaults: `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false` (calmer demo).
- Mutations show toasts via a shared `onError` that reads `ApiError.message`; form mutations map `fields` to `react-hook-form` errors with `setError`.
- Optimistic updates for votes, bookmarks, follows, roadmap steps and prep items (update cache in `onMutate`, roll back in `onError`, invalidate in `onSettled`).
- Notifications unread count: `refetchInterval: 30_000`.

### 13.3 Forms

All forms use `useForm({ resolver: zodResolver(schemaFromShared) })`. The same zod schema validates the API input, so client and server rules never drift.

### 13.4 UI state

`stores/uiStore.ts` (Zustand): `paletteOpen`, `setPaletteOpen`, `sidebarCollapsed`. `stores/onboardingStore.ts`: wizard draft, persisted in `sessionStorage` (wrapped in try/catch) so a refresh doesn't lose answers.

### 13.5 Design tokens in CSS (Tailwind v4)

```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "tw-animate-css"; /* ⚠️ added by shadcn init for Tailwind v4; check */

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.875rem;
  --background: #FAFAFB;
  --foreground: #0F0F1A;
  --card: #FFFFFF;
  --card-foreground: #0F0F1A;
  --popover: #FFFFFF;
  --popover-foreground: #0F0F1A;
  --primary: #4F46E5;
  --primary-foreground: #FFFFFF;
  --primary-soft: #EEF2FF;
  --secondary: #F3F3F7;
  --secondary-foreground: #1F1F2E;
  --muted: #F3F3F7;
  --muted-foreground: #6B6B80;
  --accent: #FEF3C7;            /* shadcn "accent" = subtle hover bg; amber tint */
  --accent-foreground: #92400E;
  --warm: #F59E0B;               /* brand amber for points/badges */
  --success: #059669;
  --warning: #EA580C;
  --destructive: #E11D48;
  --border: #E7E7EE;
  --input: #E7E7EE;
  --ring: #6366F1;
}

.dark {
  --background: #0B0B12;
  --foreground: #EDEDF5;
  --card: #14141F;
  --card-foreground: #EDEDF5;
  --popover: #14141F;
  --popover-foreground: #EDEDF5;
  --primary: #818CF8;
  --primary-foreground: #0B0B12;
  --primary-soft: #1E1B4B;
  --secondary: #1C1C2A;
  --secondary-foreground: #EDEDF5;
  --muted: #1C1C2A;
  --muted-foreground: #A1A1B5;
  --accent: #2A2112;
  --accent-foreground: #FCD34D;
  --warm: #FBBF24;
  --success: #34D399;
  --warning: #FB923C;
  --destructive: #FB7185;
  --border: #262635;
  --input: #262635;
  --ring: #818CF8;
}

@theme inline {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Plus Jakarta Sans Variable", "Inter Variable", sans-serif;
  --radius-sm: calc(var(--radius) - 6px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-soft: var(--primary-soft);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-warm: var(--warm);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground font-sans antialiased; font-feature-settings: "cv11", "ss01"; }
  h1, h2, h3, .font-display { font-family: var(--font-display); letter-spacing: -0.015em; }
  .tabular { font-variant-numeric: tabular-nums; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

> ⚠️ `shadcn init` for Tailwind v4 writes its own token block (often in `oklch()`); replace its values with the ones above but keep its structure if it differs.

---

## 14. Security, privacy and moderation

| Concern | Control |
|---|---|
| Outsiders signing up | Domain allowlist + invite allowlist in `auth.register`; verification code required |
| Password storage | bcryptjs with cost 10 (enough for a demo; 12 for production) |
| Brute force | `express-rate-limit` on `/auth/*` (10 requests / 15 min / IP) and code attempts (max 5 per code) |
| Account enumeration | `resend-code` always returns OK; login errors say "Email or password is incorrect" |
| Session theft | httpOnly cookie, `sameSite=lax`, `secure` in production; JWT expiry |
| CSRF | SameSite=Lax cookie + all writes require `Content-Type: application/json` (simple cross-site forms can't send it); check with `req.is('application/json')` in a small middleware for non-GET requests |
| Privilege escalation | Role and points never accepted from clients; admin routes behind `requireRole('ADMIN')`; ownership checked in every service |
| Contact privacy | Profile serializer drops email/LinkedIn/GitHub unless the owner enabled them; connection "accepted" view still respects visibility |
| Input validation | zod on every route; Prisma parameterises queries; raw SQL only via tagged templates |
| XSS | All user text rendered as plain text (React escapes by default); never `dangerouslySetInnerHTML`; URLs validated (`http/https` only) before rendering as links with `rel="noopener noreferrer"` |
| Security headers | `helmet()`; `app.disable('x-powered-by')` (helmet does this) |
| CORS | Only `WEB_ORIGIN` in development; production is same-origin through the rewrite |
| Secrets | `.env` git-ignored; AI and payment keys server-only; never logged |
| Harmful content | Report button everywhere; admin queue; `isRemoved` filters in every query |
| AI safety | Grounded prompts, labels, rate limit, no personal data sent |
| Personal data law | Minimal data, consent at onboarding, delete-account option (P1); verify DPDP Act 2023 obligations before real launch |
| Payments (Phase 11) | Test mode only; server-side signature verification; webhook signature check; amounts computed on the server |

---

## 15. Time budget, cut list and fallbacks

### 15.1 Time budget

| Phase | Title | Time box | Cumulative |
|---|---|---|---|
| 00 | Workspace, tooling, design system, app shell | 0:50 | 0:50 |
| 01 | Database schema, search setup, base seed | 0:40 | 1:30 |
| 02 | Authentication and onboarding | 1:05 | 2:35 |
| 03 | Profiles, Discover People, matching, requests | 1:05 | 3:40 |
| 04 | Ask a Senior and community feed | 1:15 | 4:55 |
| 05 | Personalized home, This Week, quests, bookmarks, search | 0:55 | 5:50 |
| 06 | Companies, experiences, clubs, Path Twins, roadmaps | 1:10 | 7:00 |
| 07 | Opportunities, alerts, teams, study circles, mentorship, notifications | 1:05 | 8:05 |
| 08 | Gamification, trust, success stories, moderation, admin | 0:55 | 9:00 |
| 09 | AI layer, placement dashboard, simulator | 1:20 | 10:20 |
| 10 | Seed content, polish, deploy, demo | 1:00 | 11:20 |
| — | Buffer | 0:40 | 12:00 |
| 11 | Later features (events, ticketing, donations) | after the hackathon | — |

**Rule:** if a phase runs more than 15 minutes over, cut its P1/P2 items (listed at the end of each phase file) and move on.

### 15.2 Cut order (each cut item becomes a "Coming next" card, never a dead link)

1. Simulator written-answer AI grading → keep MCQ rounds only
2. AI summaries (threads and companies)
3. Mentor wall, trending topics
4. Study circles as a separate tab (keep as a team kind only)
5. Admin tabs for companies/clubs (edit via Prisma Studio instead)
6. Simulator entirely → keep placement dashboard
7. AI roadmap → keep the deterministic roadmap builder
8. AI answer assistant → keep similar questions
9. Path Twins → show journeys on profiles only
10. Follow-ups on mentorship sessions

**Never cut:** sign-up/verification, onboarding, matching with reasons, Ask a Senior with similar questions, community feed with votes, home feed with reasons, company pages with experiences, team finder, gamification points/badges, report button, polished UI.

---

## 16. Deployment

### 16.1 Database (Neon)

1. Create a Neon project (region closest to your users, e.g. Singapore or Mumbai if available ⚠️).
2. Copy the **pooled** connection string to `DATABASE_URL` and the **direct** one to `DIRECT_URL`.
3. From your machine: `npm run db:deploy -w apps/api` (runs `prisma migrate deploy`), then `npm run db:search -w apps/api`, then `npm run db:seed -w apps/api`.

### 16.2 API (Render)

| Setting | Value |
|---|---|
| Service type | Web Service, Node |
| Root directory | repository root |
| Build command | `npm ci && npm run build -w apps/api` (runs `prisma generate` + `tsup`) |
| Start command | `node apps/api/dist/index.js` |
| Health check path | `/api/health` |
| Environment | all variables from §4.1 with production values; `DEMO_MODE=true` only for the demo |

> ⚠️ Render free instances sleep when idle and take time to wake. Open the app a few minutes before the demo, or use a paid instance for the event.

### 16.3 Web (Vercel)

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Root directory | `apps/web` |
| Build command | `npm run build` (Vercel installs workspace deps; if it fails, set install command `cd ../.. && npm ci`) ⚠️ |
| Output directory | `dist` |

`apps/web/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://YOUR-API.onrender.com/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

The first rule proxies the API (cookies stay first-party); the second makes client-side routes work on refresh.

### 16.4 Local development

- `npm run dev` at the root starts both apps with `concurrently`: API on `:4000` (tsx watch), web on `:5173`.
- `vite.config.ts` proxies `/api` → `http://localhost:4000`.

---

## 17. Testing strategy

| Layer | What | How |
|---|---|---|
| Unit | `scoreMatch`, `rankPeople`, `rankFeed`, `diversify`, `levelFor`, cursor encoding, text helpers (later: `adaptDifficulty`, `readiness`) | Vitest in `apps/api/test/unit` — `npm test` |
| API smoke | Every endpoint group with demo accounts, guards (401/403/415), validation, a write flow with cleanup, logout | `npm run smoke` against a running API (`SMOKE_BASE_URL` overrides the target, e.g. through the Vite proxy) |
| API contract | OpenAPI document generated from the shared zod schemas | Swagger UI at `/api/docs`, raw document at `/api/openapi.json` |
| Static | Types across all three packages; lint | `npm run typecheck`, `npm run lint` |
| Manual | Every phase's manual test table | Run before marking the phase done |
| Production | Phase 10 smoke test on the deployed URLs | `SMOKE_BASE_URL=https://<web>/api npm run smoke` before the demo |

The smoke script removes everything it creates (posts, votes, bookmarks, notifications and the points those actions awarded), so it can run against the demo database repeatedly.

---

## 18. Things to verify before and during the build

- Current major versions and setup commands: Vite React template, React Router, TanStack Query, Tailwind v4 Vite plugin, shadcn/ui CLI for Vite, Express 5, Prisma (generator + config changes), `motion` package name.
- Prisma + Neon: pooled vs direct URLs, and whether `directUrl` is still configured in the schema or in `prisma.config.ts` for your Prisma version.
- Prisma behaviour with the extra search indexes (review `--create-only` migrations).
- `openai` SDK usage and the provider's current model id list and free-tier limits.
- Resend sender verification and free-tier limits (or keep `EMAIL_MODE=console` for the demo).
- Your college's real email domain(s).
- Render free-tier sleep behaviour and Vercel monorepo install settings.
- Razorpay test-mode APIs and webhook signature verification (Phase 11).
- DPDP Act 2023 obligations before any real launch.
