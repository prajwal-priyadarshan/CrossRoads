# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## State of this repository

The repo root **is** the BridgeUp workspace (npm workspaces: `apps/web`, `apps/api`, `packages/shared`), built phase by phase from the docs. The spec docs (`PRD.md`, `TRD.md`, `phases/`) live at the repo root, not under `docs/` as Phase 00 suggests. Completed phases are tagged `phase-NN`; check `git tag` for progress.

BridgeUp is a college-community/mentorship platform (juniors <-> seniors/alumni: Ask a Senior, Discover People, Path Twins, placement readiness, etc.), designed for a ~12 hour hackathon build.

### Deviations from the docs (tool versions moved on)

- shadcn CLI now defaults to Base UI; it is initialised with `-b radix -p vega` so components use Radix (`asChild`). The CLI emits `from "cn"` imports; rewrite them to `@/lib/utils`. `sonner.tsx` uses our own `useTheme`.
- Vite 8 + TypeScript 6: no `baseUrl` (use `paths` only); `erasableSyntaxOnly` forbids constructor parameter properties (see `ApiError` in `apps/web/src/lib/api.ts`).
- zod is pinned to v3 everywhere.
- Prisma is pinned to **7.10.0** (npm `latest` is an 8.0 rc). Prisma 7 specifics: generator `prisma-client` writes to `apps/api/src/generated/prisma` (gitignored; import `PrismaClient`/`Prisma` from `../generated/prisma/client`, run `prisma generate` after install), the datasource URL lives in `apps/api/prisma.config.ts` (uses `DIRECT_URL`), and the app client needs the `@prisma/adapter-pg` driver adapter with the pooled `DATABASE_URL` (`src/lib/prisma.ts`).
- Database is Neon. Connection strings must not include `channel_binding=require` (Prisma P1001 otherwise). Secrets live only in the gitignored `apps/api/.env`.
- Only `amrita.edu` and its subdomains (e.g. `am.students.amrita.edu`) may register, via `ALLOWED_EMAIL_DOMAINS=amrita.edu` and the suffix match in `auth.service.ts` (`isAllowedDomain`). Alumni need an `AllowedEmail` invite.
- Write multi-file edits with the Write tool; large shell heredocs batches were unreliable here.

## Document map (read in this order)

- `README.md` — index, stack summary, phase table with time boxes.
- `PRD.md` — what/why: personas, feature catalogue (F-numbered, with priority + phase), requirements coverage check, flows/demo story, gamification rules, wellbeing/safety, UX requirements.
- `TRD.md` (~2.4k lines) — how: stack, architecture, folder structure (§3), env vars (§4), full Prisma schema (§5), search SQL (§6), API conventions (§7) and endpoint reference (§8), auth (§9), services (§10), algorithms (§11), AI layer (§12), frontend architecture + design tokens (§13), security (§14), cut list (§15), deployment (§16), testing (§17), things to verify (§18).
- `phases/phase-00.md … phase-11.md` — ordered build steps. Each has a time box, goal, files to create, step-by-step commands/code, manual test table, completion criteria, and an "If you're behind" fallback. Phase 11 is post-hackathon (events/ticketing, donations).

When editing docs, keep PRD feature IDs (F##), TRD section references, and phase cross-references consistent across files.

## Planned architecture (from TRD)

- **Monorepo (npm workspaces):** `apps/web` (React 19 + Vite + TS, Tailwind v4, shadcn/ui, TanStack Query, React Router, Zustand), `apps/api` (Node 22 + Express 5 + TS, zod, Prisma, pino), `packages/shared` (`@bridgeup/shared`: zod schemas + constants imported by both apps; bundled into the API by tsup).
- **Same-origin `/api`:** web always calls `/api/...`; Vite proxies to `:4000` locally, Vercel rewrites to Render in prod, so the `bu_session` httpOnly JWT cookie stays first-party (no CORS).
- **Request flow:** `authOptional` → guards (`requireAuth`, `requireOnboarded`, `requireRole`) → `validate({body,query,params})` → service → Prisma → `res.json({ data })`; errors via `AppError` + `errorHandler`.
- **Business logic lives in service functions inside Prisma transactions** (points, badges, counters, notifications) — not DB triggers. Unique constraints (e.g. `PointsLedger(userId, action, refId)`) prevent double awards.
- **Search:** PostgreSQL full-text + trigram via raw SQL in `apps/api/prisma/sql/search.sql`, applied with `npm run db:search`. No vector DB.
- **AI:** Claude via `@anthropic-ai/sdk`, server-side only, JSON output validated with zod. Email verification has an `EMAIL_MODE=console` fallback for demos.
- **Deploy:** Vercel (web) · Render (API) · Neon (Postgres).

## Conventions the docs enforce

- API success: `{ data }` / lists `{ data, nextCursor }`; errors `{ error: { code, message, fields? } }` with codes VALIDATION, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED, INTERNAL. UUID ids, ISO-8601 UTC dates, camelCase JSON, cursor pagination (limit default 20, max 50).
- **Express 5 gotcha:** `req.query` is a getter and can't be reassigned — parsed input is read from `req.valid.body|query|params`.
- **Prisma migrations:** always `--create-only`, review the SQL, and delete any `DROP INDEX` lines for the hand-written search indexes before applying; re-run `db:search` if they vanish.
- Prettier: single quotes, semicolons, printWidth 120, trailing commas `all`.
- Per-phase rule: build → run the phase's manual tests → meet completion criteria → commit and tag → next phase.

## Commands (once the workspace exists — defined in Phase 00 and later phases)

```bash
npm run dev                        # root: concurrently runs API (:4000, tsx watch) + web (:5173)
npm run build                      # builds api then web
npm run typecheck                  # api + web
npm run format                     # prettier --write .
npm run db:deploy -w apps/api      # prisma migrate deploy
npm run db:search -w apps/api      # apply search.sql (FTS + trigram indexes)
npm run db:seed -w apps/api        # base seed (topics, badges, companies, clubs, events, admin)
npm run seed:users -w apps/api     # 30 demo users (password demo12345); idempotent
npm run seed:content -w apps/api   # experiences, club reviews, roadmaps via the services (slow on Neon, ~3 min); idempotent
```

Tests: Vitest unit tests for algorithms (`scoreMatch`, `rankFeed`, `levelFor`, `adaptDifficulty`, `readiness`); API smoke via `apps/api/scripts/smoke.http`; otherwise manual per-phase test tables.

## Git rules

- **Never add Claude as a co-author or contributor.** No `Co-Authored-By: Claude ...` trailer, no "Generated with Claude Code" lines in commit messages or PR descriptions.
- Commit after each phase (and at sensible steps within it), then tag it, and push to the connected GitHub remote.

## Caveat

The docs state that library versions, CLI commands, and code snippets have **not been run** and are marked ⚠️ where likely to be stale (Prisma generator/config, Tailwind v4, shadcn CLI, React Router v7, model IDs). Verify against current package docs before relying on them (TRD §18).
