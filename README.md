# BridgeUp

A college community and mentorship platform that connects juniors with seniors and alumni: Ask a Senior, people discovery with explained matches, mentorship requests, a personalised feed, company pages with real interview experiences, honest club reviews, Path Twins and career roadmaps.

Specification and build plan: [`docs/`](docs/README.md) (PRD, TRD and the phase guides).

## Stack

React 19 + Vite 8 + TypeScript, Tailwind v4, shadcn/ui (Radix), TanStack Query, React Router · Node 22 + Express 5, zod, Prisma 7 · PostgreSQL (Neon) · Claude API for AI features · Vercel (web) + Render (API).

## Repository layout

```
apps/api           Express API (modules/<domain>, services, config, docs, prisma, scripts, test)
apps/web           React app (app/, components/, features/<name>/, hooks/, lib/, stores/)
packages/shared    zod schemas, response types and constants shared by both apps
docs               PRD, TRD and phase-by-phase build guides
```

See `docs/TRD.md` §3 for the full tree and the rules that keep it organised.

## Getting started

Requirements: Node 22+, npm 10+, a PostgreSQL database (Neon recommended).

```bash
npm install
cp apps/api/.env.example apps/api/.env      # fill in DATABASE_URL, DIRECT_URL, JWT_SECRET (see comments)
cp apps/web/.env.example apps/web/.env

npm run db:deploy -w apps/api                # apply migrations
npm run db:search -w apps/api                # full-text and trigram indexes
npm run db:seed:all                          # base data, 30 demo users, demo content (~3 min on Neon)

npm run dev                                  # API on :4000, web on :5173
```

Open http://localhost:5173 and use a demo account on the login page (`DEMO_MODE=true`). Demo users share the password `demo12345` unless `SEED_USER_PASSWORD` is set.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | API (tsx watch) and web (Vite) together |
| `npm run typecheck` | Types for shared, API and web |
| `npm test` | Vitest unit tests (matching, feed ranking, levels, helpers) |
| `npm run smoke` | End-to-end checks of every API endpoint against a running API; cleans up after itself |
| `npm run lint` | oxlint across all packages |
| `npm run build` | Production builds of API and web |

## API documentation

With the API running: **Swagger UI at http://localhost:4000/api/docs** (also through the web dev server at http://localhost:5173/api/docs) and the OpenAPI document at `/api/openapi.json`. Sign in with `POST /auth/demo-login` from the docs page to try authenticated endpoints. In production the docs are off unless `API_DOCS_ENABLED=true`.

## Configuration

All API settings are environment variables validated at startup in `apps/api/src/config/env.ts`; `apps/api/.env.example` documents each one, including the optional keys (Anthropic, Resend, Razorpay). The web app has no runtime settings in its bundle: it reads public settings from `GET /api/config`.
