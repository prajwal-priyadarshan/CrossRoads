# Phase 13 — Harden

| | |
|---|---|
| **Goal** | Make Crossroads safe and dependable enough to put real students on it |
| **Source** | `docs/DEEP_ANALYSIS.md` §2 plus a code review on 20 Nov 2026 at commit `955d004` |
| **Gate** | CI green on `main`, every task below committed and pushed, the live API answering `GET /api/health`. Tag `phase-13` |

> **Codebase conventions.** `CLAUDE.md` is authoritative. Nothing hardcoded (`src/config/env.ts` + `apps/api/.env.example`, `src/config/constants.ts`, `GET /api/config`). Every new endpoint: shared zod schema → route with guard + `validate` → `req.valid` → row in `src/docs/openapi.ts` → smoke check in `apps/api/scripts/smoke.ts` (clean up what it creates). Prisma types from `../generated/prisma/client`. Migrations `--create-only`, review the SQL, remove any `DROP INDEX` lines for the search indexes, re-run `db:search` if needed. One task = one commit. Paths below are relative to `apps/api/` unless they start with `apps/`, `packages/` or `docs/`.

> **Order matters.** 13.3 (session versions) comes before 13.4 (password reset) because reset and change-password revoke sessions. 13.10 fixes the lint warnings that 13.2 first tolerates.

---

## 13.1 Unit tests run without a database

**Problem.** `test/unit/twins.test.ts` mocks `src/lib/prisma`, but `src/services/twins.ts` imports `src/config/env.ts` directly (for `aiEnabled`), and `env.ts` throws a `ZodError` at import time when `DATABASE_URL`, `JWT_SECRET` and `ALLOWED_EMAIL_DOMAINS` are unset. Locally the gitignored `apps/api/.env` hides this; on a fresh clone or in CI, that suite fails before any test runs. `auth.test.ts` already works around it by setting `process.env` itself.

**Do.**
1. Add `test/setup.ts` that sets dummy values for every required env var **only if unset** (`DATABASE_URL=postgresql://test:test@localhost:5432/test`, a 64-character `JWT_SECRET`, `ALLOWED_EMAIL_DOMAINS=amrita.edu`, `NODE_ENV=test`). It must not override values a test file sets for itself (`auth.test.ts` does).
2. Register it in `vitest.config.ts` as `setupFiles`.
3. Check every test that reaches Prisma mocks `src/lib/prisma` (`twins`, `quests` already do; `alerts` takes a stubbed transaction client).

**Done when.** On a fresh clone with no `apps/api/.env` (or with `DOTENV_CONFIG_PATH` pointing at a missing file): `npm ci`, `npx prisma generate` in `apps/api`, then `npm test` passes all 7 test files.

## 13.2 Continuous integration

**Problem.** There is no `.github/` folder; nothing enforces "typecheck and test before every commit".

**Do.** Add `.github/workflows/ci.yml`, on push and pull request to `main`, with `concurrency` set to cancel superseded runs:
1. Node 22, `npm ci` with the npm cache.
2. `npx prisma generate` in `apps/api` before typechecking (the generated client is gitignored and the typecheck needs it), with dummy `DATABASE_URL` / `DIRECT_URL` in the job env.
3. `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.
4. Do **not** run `smoke` or migrations (they need a live database).
5. Lint currently passes with about 30 warnings. Leave warnings non-fatal here; 13.10 fixes them and then switches CI to `oxlint --deny-warnings`.

**Done when.** A push shows a green run. Add a CI badge to the top of `README.md`.

## 13.3 Revocable sessions

**Problem.** `src/lib/jwt.ts` issues a 7-day stateless JWT whose payload has `ver: 1`, which nothing checks. `POST /auth/logout` only clears the cookie, so a copied cookie stays valid for 7 days, even after a password change. (Suspension is already handled: `authOptional` rejects `isSuspended` users on every request.)

**Do.**
1. Schema: `User.sessionVersion Int @default(0)`.
2. `signSession(userId, role, sessionVersion)` writes it into the payload as `ver`. Update the three callers in `src/modules/auth/auth.routes.ts` (`/verify`, `/login`, `/demo-login`) to pass the user's current value.
3. `authOptional` in `src/middleware/auth.ts` already loads the user on each request: add `sessionVersion` to its `select` and treat the request as signed out when `payload.ver !== user.sessionVersion`. Tokens issued before this change carry `ver: 1` and will be rejected once, which is acceptable (everyone signs in again).
4. `POST /auth/logout-all` (`requireAuth`): increment `sessionVersion`, clear the cookie. Add "Sign out of all devices" to the account page (`apps/web/src/features/account/`).
5. Unit test the version check with a mocked Prisma user.

**Done when.** After logout-all, a previously copied cookie gets `{ data: null }` from `GET /auth/me` and 401 `UNAUTHENTICATED` from any `requireAuth` route.

## 13.4 Forgot / reset / change password

**Problem.** No way to recover a forgotten password, and no way to change one while signed in. Password recovery is the first support request in any pilot.

**Do.** Reuse the hashed email-code machinery in `src/lib/codes.ts`.
1. Schema: add `RESET_PASSWORD` to `enum CodePurpose` (it has only `VERIFY_EMAIL`). Give `createVerificationCode` / `checkVerificationCode` a `purpose` argument defaulting to `VERIFY_EMAIL`, and use it in **every** query there: the `deleteMany`, the `findFirst`, and the `create` (which currently relies on the column default).
2. Shared: `forgotPasswordSchema` (`{ email }`), `resetPasswordSchema` (`{ email, code, password }`) and `changePasswordSchema` (`{ currentPassword, password }`), using the same password rules as `registerSchema`.
3. Routes in `src/modules/auth/auth.routes.ts`:
    - `POST /auth/forgot-password` (`authLimiter`) always returns `{ data: { ok: true } }`, whether or not the email exists (no account enumeration). Only if the account exists, is verified and is not suspended, email a 6-digit code via `src/lib/mailer.ts`.
    - `POST /auth/reset-password` (`authLimiter`) checks the code (the 5-attempt lock and 10-minute expiry already exist), sets the new hash, increments `sessionVersion` (13.3), and does not sign the user in.
    - `POST /auth/change-password` (`requireAuth`, `authLimiter`) checks the current password, sets the new hash, increments `sessionVersion`, and re-issues the cookie for this device so the user stays signed in here only.
4. Web: `ForgotPasswordPage` and `ResetPasswordPage` in `apps/web/src/features/auth/`, lazy routes `/forgot-password` and `/reset-password` in `apps/web/src/app/router.tsx`, hooks in `features/auth/api.ts`, a "Forgot password?" link on `LoginPage`, and a "Change password" form on the account page. Reuse `components/shared/CodeInput` and `FormField`.
5. OpenAPI rows. Smoke checks: forgot-password returns ok for a real and an unknown email; change-password with a wrong current password returns 401.

**Done when.** A full reset works locally with `EMAIL_MODE=console`, and sessions on other devices stop working after a reset or a change.

## 13.5 Chat inbox N+1 fix

**Problem.** `listConversations` in `src/modules/chat/chat.service.ts` runs one `prisma.message.count()` per conversation: up to `LIMITS.CHAT_LIST_MAX` (50) extra queries, on every 30 s poll per open tab (`apps/web/src/features/chat/api.ts`).

**Do.** Replace the per-row count with **one** parameterised `$queryRaw` returning `conversationId, unread` for all listed conversations: count messages where `senderId <> me` and `createdAt >` the viewer's `readAtA` or `readAtB` (depending on which side they are); a null read time means all messages from the other person are unread. Use `Prisma.sql` / `Prisma.join`, never string concatenation. Conversations with no row in the result have `unread = 0`. Keep the `ChatConversation` shape identical.

**Done when.** The number of queries no longer grows with the number of conversations (the `findMany` plus one count query), and the chat smoke checks pass.

## 13.6 Explicit demo-shortcut flag

**Problem.** `src/config/env.ts` refuses `AUTO_VERIFY_EMAIL` and `ALUMNI_OPEN_SIGNUP` only when `NODE_ENV=production`, and does not guard `DEMO_MODE` (one-click sign-in as seeded users via `/auth/demo-login`) at all. A staging box with `NODE_ENV=development` would let anyone register as a verified alumnus.

**Do.**
1. Add `ALLOW_DEMO_SHORTCUTS` (bool, default `false`) to `env.ts` and `.env.example`. Refuse to boot if `AUTO_VERIFY_EMAIL`, `ALUMNI_OPEN_SIGNUP` or `DEMO_MODE` is on while it is false, with an error naming the flag and the fix. Keep the existing production refusals for the first two.
2. In `.env.example`'s dev section set it `true`, with a comment that it must never be set on an internet-facing deployment. Log one loud `warn` at boot when it is true.
3. Tell the user to add `ALLOW_DEMO_SHORTCUTS=true` to their local `apps/api/.env` (it has demo flags on), or local dev will stop booting. Check whether the deployed Render service has `DEMO_MODE=true` (the public demo uses it) and ask the user before changing it there.

**Done when.** Booting with `AUTO_VERIFY_EMAIL=true` and no `ALLOW_DEMO_SHORTCUTS` fails with a clear message, and local dev still boots with the flag set.

## 13.7 Harden the AI wrapper

**Problem.** `generateJSON` in `src/lib/ai.ts` takes `any`, builds a new OpenAI client per call, never retries, logs nothing about latency or tokens, ignores `AI_MAX_TOKENS`, and falls back to a 20 s timeout although `AI_TIMEOUT_MS` defaults to 60 s.

**Do.**
1. Type it: `generateJSON<T>({ feature, system, user, schema, maxTokens }: { feature: string; system: string; user: string; schema: z.ZodType<T>; maxTokens?: number }): Promise<T>`. `feature` is a short label (`answer`, `summary`, `roadmap`, `sim-question`, `sim-grade`, `guide`, `twins`, `assistant`, …). Update the 10 call sites in `modules/ai/ai.service.ts`, `modules/assistant/assistant.service.ts`, `modules/guide/guide.service.ts`, `services/roadmapBuilder.ts`, `services/simulator.ts` and `services/twins.ts`.
2. Create the client once, lazily, and reuse it. Keep the `as any` only around the provider-specific `reasoning_effort` field, with a comment.
3. Use `env.AI_MAX_TOKENS` as the default and `env.AI_TIMEOUT_MS` as the timeout, with no second hardcoded fallback.
4. One retry on 429 / 5xx / timeout with short backoff (`AI_RETRIES` in `env.ts`, default 1). Never retry a schema mismatch.
5. After each call log `{ feature, model, ms, promptTokens, completionTokens, ok }` at `info`. Never log prompts or replies at `info`.
6. Unit tests (mock the `openai` module): a schema mismatch throws `AIError`; code-fenced JSON parses; a 429 is retried once.

**Done when.** No `any` in the wrapper's signature, and a local AI call prints one usage line.

## 13.8 Error monitoring and health check

**Do.**
1. Optional Sentry in the API (`SENTRY_DSN` in `env.ts`, init only when set, report 5xx from `errorHandler`, never send cookies, headers or bodies) and the web (`VITE_SENTRY_DSN`, init only when set).
2. `GET /api/health` already checks the database. Keep its shape and add `ai: 'enabled' | 'disabled'` and the deployed commit (`RENDER_GIT_COMMIT` when present, read through `env.ts`). Never expose secrets or the database host.
3. **Decision:** ask the user whether to move the Render API off the free tier or add an external keep-alive ping. Free-tier sleep makes the first request take 30–60 s, and a sleeping instance cannot run 15.1's scheduled jobs.

**Done when.** A test error reaches Sentry when a DSN is set, and `/api/health` shows DB and AI status.

## 13.9 Deployment config in the repo

**Problem.** `apps/web/vercel.json` exists (and hardcodes the Render API URL in its `/api` rewrite, because Vercel rewrites cannot read environment variables), but nothing describes the Render API service. `PROJECT_DOCS_DIR` (`../../docs`) resolves against the process's working directory, so `modules/guide` finds nothing if `docs/` isn't shipped with the API or the start command runs from the wrong folder.

**Do.**
1. `render.yaml` at the repo root for the API: root directory = repo root (so `docs/` ships), build `npm ci && npm run build -w apps/api`, start `npm run start -w apps/api` (npm runs it with `apps/api` as the working directory), health check `/api/health`, every var from `.env.example` listed (`sync: false` for secrets).
2. `guide.service.ts` already logs the chunk count at `info`; log a `warn` instead when it is 0, naming the resolved `PROJECT_DOCS_DIR`.
3. A "Deploying" section in `README.md`: Render via `render.yaml`, Vercel via `apps/web/vercel.json` (and where to change the API URL in its rewrite), running `db:deploy` and `db:search` against Neon, and which env vars must be off in production (13.6).

**Done when.** A new teammate could redeploy from the README alone.

## 13.10 Clean-ups

1. `README.md` advertises "Llama 3.3 70B" (badge and caption) as the default model, but `env.ts` and `.env.example` default to `openai/gpt-oss-120b`. Make the README match the code.
2. **Decision:** ask the user for the single public name ("Crossroads" or "Amrita Ascend"); use it in `APP_NAME`'s default, `apps/web/index.html` `<title>`, and the README. Don't rename the `bu_session` cookie (it would sign everyone out); add a comment instead.
3. Fix all oxlint warnings (about 30 at `955d004`, across API and web: setState in effects in `AlertSettingsDialog.tsx` and `OpportunitiesPage.tsx`, impure `Date` in render in `DeadlineBadge.tsx`, components and constants exported from the same file, unused variables). Then make CI fail on warnings (`oxlint --deny-warnings`).
4. `PATCH /admin/experiences/:id` in `src/modules/admin/admin.routes.ts` reads `req.body.isVerified` with no `validate`. Add a shared schema and read `req.valid.body`. Check the other admin routes for the same gap.
