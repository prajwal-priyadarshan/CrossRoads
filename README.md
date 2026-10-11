<div align="center">

## GENESIS'26 HACKATHON
### Team: **FAB4** &nbsp;|&nbsp; Team ID: `GEN26-A0H-H052`

<br />

<img src="apps/web/public/brand/crossroads-mark.png" alt="Crossroads logo" width="160" />

# Crossroads

### A college community and mentorship platform connecting juniors with seniors and alumni

<sub>Ask a Senior · Discover People · Path Twins · Career Roadmaps · Placement Prep · Interview Simulator</sub>

<br />

[![Hackathon](https://img.shields.io/badge/Hackathon-GENESIS'26-6366F1?style=for-the-badge)](https://github.com/prajwal-priyadarshan/Amrita_Ascend)
[![Team](https://img.shields.io/badge/Team-FAB4-F59E0B?style=for-the-badge)](https://github.com/prajwal-priyadarshan/Amrita_Ascend)
[![Team ID](https://img.shields.io/badge/Team%20ID-GEN26--A0H--H052-10B981?style=for-the-badge)](https://github.com/prajwal-priyadarshan/Amrita_Ascend)

<br /><br />

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)
</div>

---

<div align="center">

## Team: FAB4
**Hackathon:** GENESIS'26 &nbsp;|&nbsp; **Team Name:** FAB4 &nbsp;|&nbsp; **Team ID:** `GEN26-A0H-H052`

| Member | Roll No. |
| :--- | :--- |
| **G Prajwal Priyadarshan** | CB.SC.U4AIE24214 |
| **Rithan S** | CB.SC.U4AIE24348 |
| **Kabilan K** | CB.SC.U4AIE24224 |
| **Kishore B** | CB.SC.U4AIE24227 |

</div>

---

<div align="center">

## <img src="https://api.iconify.design/lucide/info.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;About the Project

</div>

Crossroads is a full-stack mentorship and career-readiness platform built for a college community. Juniors get direct, searchable access to the experience of seniors and alumni — real interview breakdowns, honest club reviews, matched mentors, and a personalised roadmap toward their goals — instead of scattered WhatsApp groups and word of mouth.

The platform is built phase by phase against a written product spec (`docs/PRD.md`) and technical spec (`docs/TRD.md`), with each phase tagged in git history. It combines a traditional CRUD application (questions, profiles, teams, events, roadmaps) with a server-side AI layer that is fully optional — every AI-backed feature degrades gracefully to a deterministic, non-AI fallback when no API key is configured.

<div align="center">

### Core Feature Areas

</div>

| | Feature | What it does |
|:---:|---|---|
| <img src="https://api.iconify.design/lucide/message-circle-question.svg?color=%2371717a" width="22" /> | **Ask a Senior** | Question and answer threads with AI-assisted, citation-grounded answers drawn from real senior responses |
| <img src="https://api.iconify.design/lucide/users.svg?color=%2371717a" width="22" /> | **Discover People** | Matched mentor/mentee suggestions with an explained match score |
| <img src="https://api.iconify.design/lucide/git-branch.svg?color=%2371717a" width="22" /> | **Path Twins** | Finds students who walked a similar path and explains the overlap |
| <img src="https://api.iconify.design/lucide/briefcase.svg?color=%2371717a" width="22" /> | **Companies & Placement Prep** | Round-wise interview experiences, skills-gap analysis, and an adaptive practice simulator |
| <img src="https://api.iconify.design/lucide/map.svg?color=%2371717a" width="22" /> | **Roadmaps** | AI-generated, year-by-year milestone plans tailored to a student's goals |
| <img src="https://api.iconify.design/lucide/layout-grid.svg?color=%2371717a" width="22" /> | **Community** | Clubs, teams, opportunities, events, stories, and a giving/campaign module |
| <img src="https://api.iconify.design/lucide/bot.svg?color=%2371717a" width="22" /> | **Crossroads Assistant** | An in-app chat concierge that can answer questions about the platform itself |

<div align="center">

### Design Principles

</div>

| | Principle |
|:---:|---|
| <img src="https://api.iconify.design/lucide/file-code-2.svg?color=%2371717a" width="20" /> | Code is the source of truth; the docs in `docs/phases/` are build guides, not the current state |
| <img src="https://api.iconify.design/lucide/shield-check.svg?color=%2371717a" width="20" /> | Every rule that touches points, badges, or counters runs inside a Prisma transaction with a unique-constraint guard against double-processing |
| <img src="https://api.iconify.design/lucide/search.svg?color=%2371717a" width="20" /> | Search is plain PostgreSQL full-text + trigram indexing — no vector database |
| <img src="https://api.iconify.design/lucide/git-fork.svg?color=%2371717a" width="20" /> | Every AI feature has a written, working fallback path for when `AI_API_KEY` is unset |
| <img src="https://api.iconify.design/lucide/settings-2.svg?color=%2371717a" width="20" /> | Nothing is hardcoded: deployment values live in `config/env.ts`, tuning numbers in `config/constants.ts`, public settings are served from `GET /api/config` |

---

<div align="center">

## <img src="https://api.iconify.design/lucide/layers.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;Tech Stack

### Frontend

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=zustand&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=chartdotjs&logoColor=white)
![Motion](https://img.shields.io/badge/Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

<sub>React 19 · Vite 8 (rolldown) · TypeScript 6 · Tailwind CSS v4 · shadcn/ui (Radix) · React Router · TanStack Query v5 · Zustand · Recharts · Motion</sub>

<br /><br />

### Backend

![Node.js](https://img.shields.io/badge/Node.js_22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)
![Zod](https://img.shields.io/badge/Zod_3-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Pino](https://img.shields.io/badge/Pino-2B2B2B?style=for-the-badge)
![Helmet](https://img.shields.io/badge/Helmet-2B2B2B?style=for-the-badge)

<sub>Node.js 22 LTS · Express 5 · zod v3 (shared validation) · Prisma 7 ORM · jsonwebtoken (httpOnly cookie) · pino logging · helmet + cors</sub>

<br /><br />

### AI

![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)
![OpenAI SDK](https://img.shields.io/badge/OpenAI_SDK-412991?style=for-the-badge&logo=openai&logoColor=white)
![Llama](https://img.shields.io/badge/Llama_3.3_70B-0668E1?style=for-the-badge&logo=meta&logoColor=white)

<sub>Groq (free-tier inference) · openai SDK (OpenAI-compatible client) · Llama 3.3 70B default model (`openai/gpt-oss-120b`) · PostgreSQL FTS retrieval · in-memory cache, 60-minute TTL</sub>

<br /><br />

### Data and Infrastructure

![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E699?style=for-the-badge&logo=neon&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

<sub>PostgreSQL 16+ primary database · Neon serverless Postgres (pooled + direct URL) · Vercel web hosting + `/api` rewrite · Render API hosting</sub>

</div>

---

## <img src="https://api.iconify.design/lucide/route.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;How It Works

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

## <img src="https://api.iconify.design/lucide/network.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;System Architecture

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

## <img src="https://api.iconify.design/lucide/brain-circuit.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;AI Layer Deep-Dive

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

## <img src="https://api.iconify.design/lucide/folder-tree.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;Repository Layout

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

## <img src="https://api.iconify.design/lucide/rocket.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;Getting Started

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

## <img src="https://api.iconify.design/lucide/terminal.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;Everyday Commands

| Command | What it does |
|---|---|
| `npm run dev` | API (tsx watch) + web (Vite) together |
| `npm run typecheck` | Types for shared, API and web |
| `npm test` | Vitest unit tests |
| `npm run smoke` | End-to-end API checks against a running API |
| `npm run lint` | oxlint across all packages |
| `npm run build` | Production builds (API via tsup, web via Vite) |

---

## <img src="https://api.iconify.design/lucide/lightbulb.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;Key Design Decisions

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

## <img src="https://api.iconify.design/lucide/book-open.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;API Documentation

With the API running, open **Swagger UI at [http://localhost:4000/api/docs](http://localhost:4000/api/docs)**.
Sign in via `POST /auth/demo-login` from the docs page to try authenticated endpoints.
Disabled in production unless `API_DOCS_ENABLED=true`.

---

<div align="center">

## <img src="https://api.iconify.design/lucide/image.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;Screenshots

</div>

### 1. Landing Page
*First touchpoint introducing Crossroads: hero banner, value proposition, core features, and college email authentication.*

<p align="center">
  <a href="docs/screenshots/landing-page.webp">
    <img src="docs/screenshots/landing-page.webp" alt="Landing page" width="100%" />
  </a>
</p>

<br />

### 2. Personalised Home Feed
*Dynamic student hub featuring daily quests, peer updates, recommended mentors, and career readiness tracking.*

<p align="center">
  <a href="docs/screenshots/home-feed.webp">
    <img src="docs/screenshots/home-feed.webp" alt="Home feed" width="100%" />
  </a>
</p>

<br />

### 3. Everything in One Place (Platform Directory)
*Interactive capability map organizing academic guidance, career roadmaps, placement prep, and campus communities.*

<p align="center">
  <a href="docs/screenshots/everything-in-one-place.webp">
    <img src="docs/screenshots/everything-in-one-place.webp" alt="Feature map" width="100%" />
  </a>
</p>

<br />

### 4. Ask a Senior (Q&A with Grounded AI Citations)
*Threaded community discussions with verified senior answers and AI-grounded citation panels.*

<p align="center">
  <a href="docs/screenshots/ask-a-senior.webp">
    <img src="docs/screenshots/ask-a-senior.webp" alt="Ask a Senior" width="100%" />
  </a>
</p>

<br />

### 5. Companies & Placement Preparation
*Round-wise interview debriefs, skill gap roadmaps, and adaptive practice questions.*

<p align="center">
  <a href="docs/screenshots/companies.webp">
    <img src="docs/screenshots/companies.webp" alt="Companies" width="100%" />
  </a>
</p>

<br />

### 6. Path Twins (Peer Trajectory Matching)
*Matching juniors with seniors who took similar paths, comparing coursework, electives, projects, and careers.*

<p align="center">
  <a href="docs/screenshots/path-twins.webp">
    <img src="docs/screenshots/path-twins.webp" alt="Path Twins" width="100%" />
  </a>
</p>

<br />

### 7. Community & Student Teams
*Project collaboration, club hubs, hackathon squad recruitment, and study circles.*

<p align="center">
  <a href="docs/screenshots/teams.webp">
    <img src="docs/screenshots/teams.webp" alt="Teams" width="100%" />
  </a>
</p>

---

## <img src="https://api.iconify.design/lucide/clipboard-list.svg?color=%2371717a" width="22" valign="middle" /> &nbsp;Specification

| Document | Contents |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | What and why — features F01-F57, demo story, wellbeing |
| [`docs/TRD.md`](docs/TRD.md) | How — full stack, schema, algorithms, AI, deployment |
| [`docs/phases/`](docs/phases/) | Phase-by-phase build guides (Phase 00-11) |
