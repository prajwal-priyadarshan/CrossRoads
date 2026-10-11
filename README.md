<div align="center">

<img src="apps/web/public/brand/crossroads-mark.png" alt="Crossroads logo" width="120" />

# Crossroads

**A college community and mentorship platform connecting juniors with seniors and alumni.**

Ask a Senior · Discover People · Path Twins · Career Roadmaps · Placement Prep · Interview Simulator

</div>

---

## About the Project

Crossroads is a full-stack mentorship and career-readiness platform built for a college community. Juniors get direct, searchable access to the experience of seniors and alumni — real interview breakdowns, honest club reviews, matched mentors, and a personalised roadmap toward their goals — instead of scattered WhatsApp groups and word of mouth.

The platform is built phase by phase against a written product spec (`docs/PRD.md`) and technical spec (`docs/TRD.md`), with each phase tagged in git history. It combines a traditional CRUD application (questions, profiles, teams, events, roadmaps) with a server-side AI layer that is fully optional — every AI-backed feature degrades gracefully to a deterministic, non-AI fallback when no API key is configured.

**Core feature areas:**

- **Ask a Senior** — question and answer threads with AI-assisted, citation-grounded answers drawn from real senior responses
- **Discover People** — matched mentor/mentee suggestions with an explained match score
- **Path Twins** — finds students who walked a similar path and explains the overlap
- **Companies & Placement Prep** — round-wise interview experiences, skills-gap analysis, and an adaptive practice simulator
- **Roadmaps** — AI-generated, year-by-year milestone plans tailored to a student's goals
- **Community** — clubs, teams, opportunities, events, stories, and a giving/campaign module
- **Crossroads Assistant** — an in-app chat concierge that can answer questions about the platform itself

**Design principles the codebase follows:**

- Code is the source of truth; the docs in `docs/phases/` are build guides, not the current state
- Every business rule that touches points, badges, or counters runs inside a Prisma transaction with a unique-constraint guard against double-processing
- Search is plain PostgreSQL full-text + trigram indexing — no vector database
- Every AI feature has a written, working fallback path for when `AI_API_KEY` is unset
- Nothing is hardcoded: deployment values live in `config/env.ts`, tuning numbers in `config/constants.ts`, and public settings are served from `GET /api/config`

---

## Tech Stack

### Frontend

| | Technology | Purpose |
|---|---|---|
| ![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB) | **React 19** | UI framework |
| ![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat&logo=vite&logoColor=white) | **Vite 8** (rolldown) | Dev server and bundler |
| ![TypeScript](https://img.shields.io/badge/TypeScript_6-3178C6?style=flat&logo=typescript&logoColor=white) | **TypeScript 6** | Type safety throughout |
| ![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white) | **Tailwind CSS v4** | Utility-first styling |
| ![Radix](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat&logo=shadcnui&logoColor=white) | **shadcn/ui** (Radix) | Accessible, unstyled components |
| ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat&logo=react-router&logoColor=white) | **React Router** | Client-side routing |
| ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat&logo=reactquery&logoColor=white) | **TanStack Query v5** | Server state and caching |
| ![Zustand](https://img.shields.io/badge/Zustand-443E38?style=flat&logo=zustand&logoColor=white) | **Zustand** | Minimal client-only state |
| ![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=flat&logo=chartdotjs&logoColor=white) | **Recharts** | Prep and readiness charts |
| ![Motion](https://img.shields.io/badge/Motion_(Framer)-0055FF?style=flat&logo=framer&logoColor=white) | **Motion** | Animations and transitions |

### Backend

| | Technology | Purpose |
|---|---|---|
| ![Node](https://img.shields.io/badge/Node.js_22-339933?style=flat&logo=nodedotjs&logoColor=white) | **Node.js 22 LTS** | Runtime |
| ![Express](https://img.shields.io/badge/Express_5-000000?style=flat&logo=express&logoColor=white) | **Express 5** | HTTP framework |
| ![Zod](https://img.shields.io/badge/Zod_3-3E67B1?style=flat&logo=zod&logoColor=white) | **zod v3** | Schema validation, shared with the frontend |
| ![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=flat&logo=prisma&logoColor=white) | **Prisma 7** | ORM and migrations |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white) | **jsonwebtoken** | httpOnly cookie auth |
| ![Pino](https://img.shields.io/badge/Pino-2B2B2B?style=flat) | **pino** | Structured request logging |
| ![Helmet](https://img.shields.io/badge/Helmet-2B2B2B?style=flat) | **helmet + cors** | Security headers |

### AI

| | Technology | Purpose |
|---|---|---|
| ![Groq](https://img.shields.io/badge/Groq-F55036?style=flat&logo=groq&logoColor=white) | **Groq** (free tier) | LLM inference provider |
| ![OpenAI SDK](https://img.shields.io/badge/OpenAI_SDK-412991?style=flat&logo=openai&logoColor=white) | **openai SDK** | OpenAI-compatible client, works with any compatible provider |
| | **Llama 3.3 70B** | Default model (`openai/gpt-oss-120b`) |
| | **PostgreSQL FTS** | Retrieval for grounded, citation-backed answers |
| | **In-memory cache** | 60-minute TTL per question key |

### Data and Infrastructure

| | Technology | Purpose |
|---|---|---|
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat&logo=postgresql&logoColor=white) | **PostgreSQL 16+** | Primary database |
| ![Neon](https://img.shields.io/badge/Neon-00E699?style=flat&logo=neon&logoColor=black) | **Neon** | Serverless Postgres, pooled + direct connection |
| ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) | **Vercel** | Web app hosting and `/api` rewrite |
| ![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=black) | **Render** | API hosting |

---

## How It Works

```mermaid
flowchart TD
    A(["First-Year Student"]) -->|visits| B[Landing Page]
    B -->|registers with college email| C[Email Verification]
    C -->|completes profile and interests| D[Onboarding]
    D --> E{Personalised Home Feed}

    E -->|ask a question| F[Ask a Senior]
    E -->|find people| G[Discover People]
    E -->|explore companies| H[Company Pages]
    E -->|start prep| I[Prep Dashboard]
    E -->|join a team| J[Teams and Opportunities]
    E -->|read stories| K[Success Stories]

    F -->|finds related answers| L[("PostgreSQL\nFull-text Index")]
    F -->|no good answer yet| M[AI Answer Panel]
    M -->|Groq LLM via OpenAI SDK| N["Grounded Response\n+ Citations"]

    G -->|explained match score| O[Send Mentorship Request]
    O -->|accepted| P[Active Mentorship]

    H -->|real interview experiences| Q[Round-wise Breakdown]
    H -->|AI company summary| R[Skills Gap Analysis]

    I -->|AI roadmap generator| S[Personalised Roadmap]
    S -->|tracks progress| T[Readiness Score]
    T -->|practice time| U[Adaptive Simulator]
    U -->|Groq LLM questions| V[Post-session Report]

    classDef default fill:#f4f4f5,stroke:#a1a1aa,color:#27272a;
    classDef accent fill:#e4e4e7,stroke:#71717a,color:#18181b;
    class A,E,M,N,S,U accent;
```

---

## System Architecture

```mermaid
graph TB
    subgraph Browser["Browser — Vercel"]
        FE["React 19 + Vite 8\nReact Router · TanStack Query\nshadcn/ui · Tailwind v4"]
    end

    subgraph Edge["Vercel Edge"]
        RW["/api/* rewrite\nkeeps cookie first-party"]
    end

    subgraph API["Express API — Render"]
        MW["helmet · cors · pino · rate-limit"]
        AUTH["authOptional to requireAuth\nJWT httpOnly cookie"]
        ROUTES["Module Routers\nvalidate(zod) to req.valid"]
        SVC["Service Layer\nprisma.$transaction"]
        GAME["Gamification\npoints · badges · quests"]
        NOTIF["Notifications"]
    end

    subgraph AI["AI Layer — Groq (free tier)"]
        SDK["openai SDK\n(OpenAI-compatible)"]
        ANS["Answer Panel\nRAG over real answers"]
        SUM["Thread / Company\nSummaries"]
        ROAD["Roadmap Generator\nJSON-mode + zod validation"]
        SIM["Simulator Questions\nadaptive difficulty"]
        CACHE["In-memory Cache\n60 min TTL"]
        FB["Non-AI Fallback\nwhen AI_API_KEY empty"]
    end

    subgraph DB["PostgreSQL — Neon"]
        PG["Prisma 7 ORM\n@prisma/adapter-pg"]
        FTS["Full-text Search\n+ trigram indexes"]
        SCHEMA["Users · Posts · Votes\nExperiences · Teams\nRoadmaps · Prep · Sim"]
    end

    Browser -->|fetch /api/...| Edge
    Edge --> API
    ROUTES --> SVC
    SVC --> GAME
    SVC --> NOTIF
    SVC -->|generateJSON| AI
    SVC --> DB
    AI --> CACHE
    AI -.->|no key| FB

    classDef default fill:#f4f4f5,stroke:#a1a1aa,color:#27272a;
```

---

## AI Layer Deep-Dive

Crossroads's AI features run **server-side only**, through any OpenAI-compatible provider (Groq free tier by default). Every feature has a graceful non-AI fallback so the app works even without an `AI_API_KEY`.

```mermaid
sequenceDiagram
    participant U as Student
    participant API as API
    participant R as Retrieval (Postgres FTS)
    participant C as Cache (60 min)
    participant LLM as Groq LLM

    U->>API: POST /ai/answer {questionId}
    API->>R: getRelatedAnswers(title, body)
    R-->>API: top-k answers with metadata
    API->>C: check cache key
    alt cache hit
        C-->>API: cached JSON
    else cache miss
        API->>LLM: system prompt + sources
        LLM-->>API: JSON { answer, citations[] }
        API->>C: store result
    end
    API-->>U: { status, answer, citations, sources }

    Note over API,LLM: JSON-mode output validated<br/>with zod schema (aiAnswerOut)
    Note over API,R: Fallback: return sources only<br/>if AI disabled or times out
```

| Feature | Prompt strategy | Model output | Fallback |
|---|---|---|---|
| **Answer Panel** | RAG over senior answers, citation format `[n]` | `{ answer, citations[] }` | Show raw matching answers |
| **Thread / Company Summary** | Summarise 3-5 bullets, cite specific items | `{ bullets[], citations[] }` | Hide summary card |
| **Roadmap Generator** | Skills gap to year-by-year milestones | `{ milestones[], gaps[] }` | Template-based roadmap |
| **Simulator Questions** | Role + topic + difficulty to MCQ/open | `{ question, options[], answer, explanation }` | Bank of pre-written questions |

---

## Repository Layout

```
apps/
  api/                     Express API
    src/
      modules/<domain>/    routes · service · serializers per feature
      services/            matching · feedRank · twins · quests · gamification · notify
      config/              env.ts (all process.env) · constants.ts (tuning numbers)
      lib/                 prisma · errors · ai · cache
      docs/                openapi.ts (Swagger built from zod schemas)
    prisma/                schema.prisma · migrations/ · sql/search.sql
    scripts/               seed-users.ts · seed-content.ts · smoke.ts
    test/unit/             Vitest tests (matching · feedRank · levels · helpers)

  web/                     React app
    src/
      app/                 router.tsx · providers · pages (404, MeRedirect)
      components/          ui/ · layout/ · guards/ · shared/
      features/<name>/     pages + api.ts (TanStack Query hooks) per feature

packages/
  shared/                  zod schemas · response types · constants (used by both apps)

docs/                      PRD.md · TRD.md · phases/phase-00..11.md
```

---

## Getting Started

**Requirements:** Node 22+, npm 10+, PostgreSQL (Neon recommended).

```bash
npm install
cp apps/api/.env.example apps/api/.env    # fill DATABASE_URL, DIRECT_URL, JWT_SECRET
cp apps/web/.env.example apps/web/.env

npm run db:deploy -w apps/api             # run migrations
npm run db:search -w apps/api             # apply FTS + trigram indexes
npm run db:seed:all                       # base data + 30 demo users + content (~3 min)

npm run dev                               # API :4000  web :5173
```

Open [http://localhost:5173](http://localhost:5173) and use a demo account (password `demo12345`). AI features need `AI_API_KEY` in `.env` — leave it empty and all AI panels gracefully fall back.

---

## Everyday Commands

| Command | What it does |
|---|---|
| `npm run dev` | API (tsx watch) + web (Vite) together |
| `npm run typecheck` | Types for shared, API and web |
| `npm test` | Vitest unit tests |
| `npm run smoke` | End-to-end API checks against a running API |
| `npm run lint` | oxlint across all packages |
| `npm run build` | Production builds (API via tsup, web via Vite) |

---

## Key Design Decisions

```mermaid
mindmap
  root((Crossroads))
    Auth
      College-domain email gate
      httpOnly JWT cookie
      Same-origin /api rewrite
    Data
      PostgreSQL everywhere
      FTS + trigram for search
      No vector DB needed
    AI
      Server-side only
      OpenAI-compatible interface
      Non-AI fallback always
      JSON-mode + zod validation
    Gamification
      Points ledger unique constraint
      Badges evaluated in transactions
      Quests progress server-side
    Frontend
      TanStack Query for all server state
      Zustand only for UI state
      Code-split lazy pages
      Skeleton loaders everywhere
```

---

## API Documentation

With the API running, open **Swagger UI at [http://localhost:4000/api/docs](http://localhost:4000/api/docs)**.
Sign in via `POST /auth/demo-login` from the docs page to try authenticated endpoints.
Disabled in production unless `API_DOCS_ENABLED=true`.

---

## Specification

| Document | Contents |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | What and why — features F01-F57, demo story, wellbeing |
| [`docs/TRD.md`](docs/TRD.md) | How — full stack, schema, algorithms, AI, deployment |
| [`docs/phases/`](docs/phases/) | Phase-by-phase build guides (Phase 00-11) |
