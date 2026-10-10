# BridgeUp — Build documentation

Read in this order:

| # | File | What it is |
|---|---|---|
| 1 | `PRD.md` | What you're building and why: users, every feature with priority and phase, a **requirements coverage check** against your notes, flows, gamification rules, wellbeing and UI requirements |
| 2 | `TRD.md` | How it's built: stack, architecture, folder structure, full Prisma schema, search SQL, API reference, auth, services, algorithms (matching, feed, twins, readiness, simulator), AI prompts, frontend architecture, security, deployment, cut list |
| 3 | `phases/phase-00.md` | Workspace, tooling, design system, app shell (0:50) |
| 4 | `phases/phase-01.md` | Database schema, search setup, base seed (0:40) |
| 5 | `phases/phase-02.md` | Authentication and onboarding (1:05) |
| 6 | `phases/phase-03.md` | Profiles, Discover People, matching, alumni mentor, requests (1:05) |
| 7 | `phases/phase-04.md` | Ask a Senior and community feed (1:15) |
| 8 | `phases/phase-05.md` | Personalized home, This Week, quests, bookmarks, search (0:55) |
| 9 | `phases/phase-06.md` | Companies, experiences, clubs, Path Twins, roadmaps (1:10) |
| 10 | `phases/phase-07.md` | Opportunities, alerts, teams, study circles, mentorship, notifications (1:05) |
| 11 | `phases/phase-08.md` | Gamification, trust, success stories, moderation, admin (0:55) |
| 12 | `phases/phase-09.md` | AI layer, placement dashboard, simulator (1:20) |
| 13 | `phases/phase-10.md` | Seed content, polish, deploy, demo (1:00) |
| — | Buffer | 0:40 → total 12:00 |
| 14 | `phases/phase-11.md` | Later features (after the hackathon): events and ticketing, donations |
| 15 | `phases/phase-12.md` | Institutional layer (after the hackathon, after every other phase): official channel, placement cell integration, analytics dashboard, safeguarding, consent/data rights, faculty role |

**Stack:** React (Vite, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, React Router) · Node.js (Express 5, TypeScript, zod) · PostgreSQL (Neon) with Prisma · Groq free-tier LLM API (OpenAI-compatible) for AI features · Vercel + Render.

**Rule for every phase:** build → run the phase's manual tests → meet its completion criteria → commit and tag → move on. If a phase runs more than 15 minutes over, use its "If you're behind" section.

**Before you start:** check the items marked ⚠️ and `TRD.md` §18 (things to verify). Library versions and commands change; the docs say where to double-check.
