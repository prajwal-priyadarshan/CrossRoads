# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## State of this repository

BridgeUp is a college community/mentorship platform (juniors ↔ seniors/alumni: Ask a Senior, Discover People, Path Twins, placement readiness, etc.), built phase by phase from the guides in `docs/`. The repo root is the npm-workspaces root (`apps/api`, `apps/web`, `packages/shared`). Completed phases are tagged `phase-NN` (check `git tag`); phases 00–06 are built, 07–11 are next.

The **code is the source of truth**. Each phase guide starts with "Implementation notes" (built phases) or "Codebase conventions" (upcoming phases) that override older snippets in the guide body.

## Commands

```bash
npm run dev                        # API (:4000, tsx watch) + web (:5173) together
npm run typecheck                  # shared + api + web
npm test                           # Vitest unit tests (apps/api/test/unit)
npm run smoke                      # end-to-end API checks against a running API; cleans up after itself
                                   #   SMOKE_BASE_URL=http://localhost:5173/api npm run smoke   (through the Vite proxy)
npm run lint                       # oxlint
npm run build                      # api (prisma generate + tsup) then web
npm run db:deploy -w apps/api      # prisma migrate deploy
npm run db:search -w apps/api      # apply prisma/sql/search.sql (FTS + trigram indexes)
npm run db:seed:all                # base seed, 30 demo users (password demo12345), demo content (~3 min on Neon)
npx vitest run test/unit/feedRank.test.ts   # (from apps/api) a single test file
```

API docs: Swagger UI at `/api/docs`, OpenAPI JSON at `/api/openapi.json` (on by default outside production).

## Architecture

- **Same-origin `/api`:** the web app always calls `/api/...`; Vite proxies to `API_PROXY_TARGET` locally, Vercel rewrites to Render in production, so the `bu_session` httpOnly JWT cookie stays first-party.
- **API request flow:** `docs` → helmet → cors → json → cookies → pino-http (cookies redacted) → `authOptional` → `jsonOnly` → module router (guards `requireAuth` / `requireOnboarded` / `requireRole`, then `validate({ body, query, params })`, read input from `req.valid`) → service → Prisma → `res.json({ data })`; errors through `AppError` + `errorHandler`.
- **Layout:** `apps/api/src/modules/<domain>/{routes,service,serializers}.ts`; cross-cutting logic in `src/services/` (matching, feedRank, twins, quests, gamification, notify); `src/config/env.ts` is the only reader of `process.env`; `src/config/constants.ts` holds tuning `LIMITS`; `src/docs/openapi.ts` builds the OpenAPI document from the shared zod schemas. Web: `src/app/` (router with lazy pages, providers), `src/features/<name>/` (pages + `api.ts` TanStack hooks), `src/components/{ui,layout,guards,shared}`. Shared: `packages/shared/src/{constants.ts,schemas/,types/}`. Full tree: `docs/TRD.md` §3.
- **Business rules run in service functions inside `prisma.$transaction`** (points, badges, counters, notifications). Unique constraints (e.g. `PointsLedger(userId, action, refId)`) prevent double awards.
- **Search:** PostgreSQL full-text + trigram through parameterised `$queryRaw` (`Prisma.sql` / `Prisma.empty` for dynamic parts). No vector DB.
- **AI (Phase 09):** `openai` SDK pointed at an OpenAI-compatible free-tier provider (Groq by default, `AI_BASE_URL`), server-side only; JSON-mode replies validated with zod (TRD §12.2); every feature has a non-AI fallback when `AI_API_KEY` is empty.

## Rules

- **Nothing hardcoded.** Deployment values → `config/env.ts` + `apps/api/.env.example`; tuning numbers → `config/constants.ts`; public settings for the web (email domains, demo accounts, flags) → `GET /api/config`; topic ids come from `GET /topics`; localStorage keys from `lib/storageKeys.ts`.
- **Every new endpoint:** shared zod schema → route with guard + `validate` → row in `src/docs/openapi.ts` → smoke check where useful.
- **Responses:** `{ data }`; paginated lists `{ data: { items, nextCursor } }`; errors `{ error: { code, message, fields? } }` (VALIDATION, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED, INTERNAL).
- **Express 5:** `req.query` is a getter; parsed input lives on `req.valid`.
- **Prisma migrations:** always `--create-only`, review the SQL, delete any `DROP INDEX` lines for the search indexes, then apply; re-run `db:search` if they vanish.
- **Before committing:** `npm run typecheck && npm test` at minimum (every commit). Add `npm run build`, and `npm run smoke` with the API running, before pushing, before tagging a phase, and after any change to API routes, schemas or the build setup.
- Prettier: single quotes, semicolons, printWidth 120, trailing commas `all`.

## Tool-version specifics (verified)

- shadcn initialised with `-b radix -p vega` (Radix, `asChild`); generated files may import `from "cn"` → rewrite to `@/lib/utils`. `sonner.tsx` uses our `useTheme`.
- Vite 8 (rolldown: `manualChunks` must be a function) + TypeScript 6 (no `baseUrl`; `erasableSyntaxOnly` forbids constructor parameter properties).
- zod pinned to v3 (`@asteasolutions/zod-to-openapi@7` needs v3).
- Prisma pinned to **7.10.0**: generator `prisma-client` → `apps/api/src/generated/prisma` (gitignored; import from `../generated/prisma/client`), CLI URL in `apps/api/prisma.config.ts` (`DIRECT_URL`), runtime via `@prisma/adapter-pg` with pooled `DATABASE_URL`, interactive-transaction timeout raised in `src/lib/prisma.ts` (Neon latency).
- Neon URLs: `sslmode=verify-full`, no `channel_binding=require` (Prisma P1001). Secrets only in the gitignored `apps/api/.env`.
- Registration: `ALLOWED_EMAIL_DOMAINS=amrita.edu` with a dot-boundary subdomain match (`isAllowedDomain`); alumni need an `AllowedEmail` invite.
- lucide-react has no brand icons; use `components/shared/BrandIcons.tsx`.
- Write multi-file edits with the Write tool; large shell heredocs were unreliable in this environment.

## Documents

`docs/README.md` (index + phase table) → `docs/PRD.md` (what/why, feature IDs F##) → `docs/TRD.md` (how: structure §3, env §4, schema §5, search §6, API conventions §7–8, auth §9, services §10, algorithms §11, AI §12, frontend §13, security §14, deployment §16, testing §17) → `docs/phases/phase-00..11.md`. Keep PRD feature IDs, TRD section references and phase cross-references consistent when editing.

## Git rules

- **Never add Claude as a co-author or contributor.** No `Co-Authored-By: Claude ...` trailer and no "Generated with Claude Code" lines in commit messages or PR descriptions.
- **Commit every completed change, not just whole phases.** As soon as a change works and the checks pass, commit it — a new endpoint, a bug fix, a refactor, a doc edit, added tests, a dependency bump. Don't batch unrelated work into one commit and don't leave finished work uncommitted waiting for the phase to end.
- One logical change per commit, with a message in the imperative mood (`fix: …`, `feat: …`, `test: …`, `docs: …`, `chore: …`). If a change touches API + web + shared for one feature, that is still one commit.
- At the end of a phase, commit anything outstanding, tag `phase-NN`, and push to the connected GitHub remote. Push after ordinary commits too, so the remote is never far behind.
