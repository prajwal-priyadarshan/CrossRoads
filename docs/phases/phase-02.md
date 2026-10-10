# Phase 02 — Authentication and onboarding

| | |
|---|---|
| **Time box** | 1:05 (cumulative 2:35) |
| **Goal** | Students register with a college email, verify it with a 6-digit code, log in, and complete a 4-step onboarding that fills their profile; every app route is protected; demo accounts can log in instantly |
| **Prerequisites** | Phase 01 complete (database + seed) |
| **PRD features** | F01 Verified sign-up, F02 Onboarding wizard (incl. alumni fields), part of F04 Alumni profiles |
| **Requirements** | FR-AUTH-1 … FR-AUTH-6, FR-ONB-1 … FR-ONB-3 |
| **Reference** | `TRD.md` §4 (env), §9 (auth), §14 (security) |


> **Implementation notes (verified build).**
> - Allowed domains for this college: `ALLOWED_EMAIL_DOMAINS=amrita.edu`; the check also accepts subdomains (`am.students.amrita.edu`) with a dot-boundary suffix match, so look-alikes such as `evilamrita.edu` are rejected.
> - Demo login and the email hint are driven by the API, not `VITE_` variables: `GET /api/config` returns `allowedEmailDomains`, `demoMode` and `demoAccounts` (handles from `DEMO_LOGIN_HANDLES`, emails ending in `DEMO_EMAIL_SUFFIX`).
> - `GET /topics` only needs a session (not onboarding) so the wizard can load real topic ids.
> - Rate-limit sizes come from env (`RATE_LIMIT_*`); per-user limiters set `validate: { keyGeneratorIpFallback: false }`.
> - The JSON-only guard treats a request as having a body only when `content-length > 0` or `transfer-encoding` is set; the earlier check rejected bodiless `DELETE`s with 415.
> - Express's body parser errors map to 400 (bad JSON) and 413 (too large) in `errorHandler`; logs redact cookies and passwords.

---

## 1. What you will have at the end of this phase

- API: `/auth/register`, `/auth/verify`, `/auth/resend-code`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/demo-login`, `/me/onboarding`.
- Session cookie `bu_session` (httpOnly JWT), rate limits on auth.
- Web: Register → Verify → Onboarding → Home flow; Login; route guards; user card and sign-out in the shell.
- A reusable `ChipPicker` used by every later form.

---

## 2. Concepts in this phase

- **The server decides who can join and what role they get.** The client never sends a role. Domain rules and the invite allowlist live in one service.
- **Verification codes are stored hashed** and expire in 10 minutes with at most 5 attempts.
- **`useMe` is the single source of truth** on the client. Guards read it; after login/logout you update or clear that one query.
- **Onboarding is one API call at the end.** The wizard keeps a draft in `sessionStorage`, so a refresh doesn't lose answers and the server receives one complete, validated payload.

---

## 3. Files to create or change

### API

| File | Purpose |
|---|---|
| `src/config/env.ts` | Full validated env (`TRD.md` §4.3; use the enum form for `DEMO_MODE`) |
| `src/lib/jwt.ts` | `signSession`, `verifySession` |
| `src/lib/password.ts` | `hashPassword`, `verifyPassword` |
| `src/lib/codes.ts` | `createVerificationCode`, `checkVerificationCode` |
| `src/lib/mailer.ts` | `sendVerificationEmail` (console or Resend) |
| `src/lib/cookies.ts` | `setSessionCookie`, `clearSessionCookie` |
| `src/middleware/auth.ts` | `authOptional`, `requireAuth`, `requireOnboarded`, `requireRole` (`TRD.md` §9.3) |
| `src/middleware/validate.ts` | `validate()` (`TRD.md` §7.1) |
| `src/middleware/rateLimits.ts` | `authLimiter`, `aiLimiter`, `writeLimiter` |
| `src/middleware/jsonOnly.ts` | Rejects non-JSON writes (CSRF hardening) |
| `src/modules/auth/auth.service.ts` | Register, verify, resend, login, demo login |
| `src/modules/auth/auth.routes.ts` | Routes |
| `src/modules/users/users.service.ts` | `toMe(user)`, `completeOnboarding` |
| `src/modules/users/users.routes.ts` | `PATCH /me/onboarding` |
| `src/routes.ts` | Mounts module routers |
| `src/app.ts` | Add `authOptional`, `jsonOnly`, `routes` |

### Shared

| File | Purpose |
|---|---|
| `src/schemas/auth.ts` | `registerSchema`, `verifySchema`, `loginSchema`, `emailOnlySchema` |
| `src/schemas/profile.ts` | `onboardingSchema` (step schemas + full schema) |

### Web

| File | Purpose |
|---|---|
| `src/hooks/useMe.ts` | `useMe()` query + `useLogout()` |
| `src/components/guards/*` | `RequireAuth`, `RequireOnboarded`, `PublicOnly`, `RequireAdmin` |
| `src/features/auth/api.ts` | `useRegister`, `useVerify`, `useResend`, `useLogin`, `useDemoLogin` |
| `src/features/auth/AuthLayout.tsx` | Centered card layout with gradient background |
| `src/features/auth/RegisterPage.tsx`, `VerifyPage.tsx`, `LoginPage.tsx` | Pages |
| `src/components/shared/CodeInput.tsx` | 6-box code input |
| `src/components/shared/ChipPicker.tsx` | Searchable multi-select chips with custom values |
| `src/stores/onboardingStore.ts` | Wizard draft |
| `src/features/onboarding/OnboardingPage.tsx` | Wizard container |
| `src/features/onboarding/steps/StepAbout.tsx`, `StepSkills.tsx`, `StepGoals.tsx`, `StepConnect.tsx` | Steps |
| `src/features/onboarding/api.ts` | `useCompleteOnboarding` |
| `src/router.tsx` | Guards + new routes |
| `src/components/layout/Sidebar.tsx`, `UserMenu.tsx` | Real user data, sign-out |

---

## 4. Step-by-step — API

### Step 1 — Environment and helpers (10 min)

Install:

```bash
npm i bcryptjs jsonwebtoken express-rate-limit -w apps/api
npm i -D @types/jsonwebtoken -w apps/api
npm i resend -w apps/api   # only needed if EMAIL_MODE=resend ⚠️ check package name and API
```

Add to `apps/api/.env`:

```
JWT_SECRET=<openssl rand -hex 32>
SESSION_DAYS=7
ALLOWED_EMAIL_DOMAINS=amrita.edu   # subdomains such as am.students.amrita.edu are accepted too
EMAIL_MODE=console
EMAIL_FROM=Crossroads <no-reply@example.com>
DEMO_MODE=true
```

`src/config/env.ts` — use `TRD.md` §4.3 with this `DEMO_MODE` line:

```ts
DEMO_MODE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
```

`src/lib/jwt.ts`:

```ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

type Payload = { sub: string; role: string; ver: 1 };

export const signSession = (userId: string, role: string) =>
  jwt.sign({ sub: userId, role, ver: 1 } satisfies Payload, env.JWT_SECRET, { expiresIn: `${env.SESSION_DAYS}d` });

export function verifySession(token: string): Payload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as Payload;
  } catch {
    return null;
  }
}
```

`src/lib/password.ts`:

```ts
import bcrypt from 'bcryptjs';
export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const verifyPassword = (p: string, hash: string) => bcrypt.compare(p, hash);
```

`src/lib/codes.ts`:

```ts
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { prisma } from './prisma';
import { env } from '../config/env';

const hash = (code: string) => createHash('sha256').update(`${code}:${env.JWT_SECRET}`).digest('hex');

export async function createVerificationCode(email: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.emailCode.deleteMany({ where: { email, purpose: 'VERIFY_EMAIL' } });
  await prisma.emailCode.create({
    data: { email, codeHash: hash(code), expiresAt: new Date(Date.now() + 10 * 60_000) },
  });
  return code;
}

/** Returns 'ok' | 'invalid' | 'expired' | 'locked' */
export async function checkVerificationCode(email: string, code: string) {
  const row = await prisma.emailCode.findFirst({ where: { email, purpose: 'VERIFY_EMAIL' }, orderBy: { createdAt: 'desc' } });
  if (!row || row.expiresAt < new Date()) return 'expired' as const;
  if (row.attempts >= 5) return 'locked' as const;
  const a = Buffer.from(row.codeHash, 'hex');
  const b = Buffer.from(hash(code), 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await prisma.emailCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return 'invalid' as const;
  }
  await prisma.emailCode.deleteMany({ where: { email, purpose: 'VERIFY_EMAIL' } });
  return 'ok' as const;
}
```

`src/lib/mailer.ts`:

```ts
import { env } from '../config/env';
import { logger } from './logger';

export async function sendVerificationEmail(to: string, code: string) {
  if (env.EMAIL_MODE === 'console' || !env.RESEND_API_KEY) {
    logger.info(`[DEV] Verification code for ${to}: ${code}`);
    return;
  }
  // ⚠️ Check the Resend SDK docs for the current API shape.
  const { Resend } = await import('resend');
  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `${code} is your Crossroads code`,
    text: `Your Crossroads verification code is ${code}. It expires in 10 minutes.`,
  });
}
```

`src/lib/cookies.ts`:

```ts
import type { Response } from 'express';
import { env, isProd } from '../config/env';

export function setSessionCookie(res: Response, token: string) {
  res.cookie('bu_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: env.SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}
export const clearSessionCookie = (res: Response) => res.clearCookie('bu_session', { path: '/' });
```

`src/middleware/rateLimits.ts`:

```ts
import { rateLimit } from 'express-rate-limit'; // ⚠️ check named vs default export for your version

export const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: env.RATE_LIMIT_AUTH_PER_15M, standardHeaders: true, legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait a few minutes.' } }) });

export const aiLimiter = rateLimit({ windowMs: 60 * 60_000, limit: env.RATE_LIMIT_AI_PER_HOUR, validate: { keyGeneratorIpFallback: false }, keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anon',
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'You have used the AI features a lot this hour. Try again later.' } }) });

export const writeLimiter = rateLimit({ windowMs: 60_000, limit: env.RATE_LIMIT_WRITE_PER_MIN, validate: { keyGeneratorIpFallback: false }, keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anon' });
```

> ⚠️ express-rate-limit's option is `limit` in recent versions (older versions used `max`). With `trust proxy` set in `app.ts`, `req.ip` is the real client IP behind Render/Vercel.

`src/middleware/jsonOnly.ts`:

```ts
import type { RequestHandler } from 'express';
export const jsonOnly: RequestHandler = (req, res, next) => {
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const hasBody = Number(req.headers['content-length'] ?? 0) > 0 || req.headers['transfer-encoding'] !== undefined;
  if (isWrite && hasBody && !req.is('application/json')) {
    return res.status(415).json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Send JSON' } });
  }
  next();
};
```

> The web `api()` helper always sends JSON on writes. For writes with no body (for example `POST /auth/logout`), send `json: {}` so the content type is set.

`src/middleware/auth.ts` and `src/middleware/validate.ts`: copy from `TRD.md` §9.3 and §7.1.

### Step 2 — Shared schemas (5 min)

`packages/shared/src/schemas/auth.ts`:

```ts
import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'At most 72 characters')
  .regex(/[A-Za-z]/, 'Include a letter')
  .regex(/[0-9]/, 'Include a number');

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(60),
  email: emailSchema,
  password: passwordSchema,
});
export const verifySchema = z.object({ email: emailSchema, code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') });
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Enter your password') });
export const emailOnlySchema = z.object({ email: emailSchema });
export const demoLoginSchema = z.object({ handle: z.string().min(1) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

`packages/shared/src/schemas/profile.ts`:

```ts
import { z } from 'zod';

const tag = z.string().trim().toLowerCase().min(1).max(40);
const url = z.string().trim().url('Enter a full URL starting with https://').regex(/^https?:\/\//).optional().or(z.literal(''));
const thisYear = new Date().getFullYear();

export const stepAboutSchema = z
  .object({
    status: z.enum(['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FINAL_YEAR', 'ALUMNI']),
    department: z.string().min(1, 'Choose your department'),
    batchYear: z.coerce.number().int().min(1990).max(thisYear + 6),
    company: z.string().trim().max(80).optional(),
    jobTitle: z.string().trim().max(80).optional(),
    bio: z.string().trim().max(280).optional(),
  })
  .refine((v) => v.status !== 'ALUMNI' || (v.company && v.jobTitle), {
    message: 'Alumni: add your current company and role',
    path: ['company'],
  });

export const stepSkillsSchema = z.object({
  skills: z.array(tag).min(2, 'Pick at least 2 skills').max(20),
  interests: z.array(tag).min(2, 'Pick at least 2 interests').max(12),
});

export const stepGoalsSchema = z.object({
  goalTrack: z.enum(['PRODUCT', 'SERVICE', 'QUANT_FINANCE', 'RESEARCH', 'STARTUP', 'MS', 'MBA', 'UNDECIDED']),
  targetRoles: z.array(tag).max(5).default([]),
  targetCompanies: z.array(z.string()).max(8).default([]),
  followTopicIds: z.array(z.number().int()).min(1, 'Follow at least one topic'),
});

export const stepConnectSchema = z.object({
  canHelpWith: z.array(tag).max(10).default([]),
  lookingFor: z.array(tag).max(10).default([]),
  linkedinUrl: url,
  githubUrl: url,
  showEmail: z.boolean().default(false),
  showLinkedin: z.boolean().default(true),
  showGithub: z.boolean().default(true),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please accept to continue' }) }), // ⚠️ zod v4 uses { error: '…' }
});

export const onboardingSchema = z.object({
  about: stepAboutSchema,
  skills: stepSkillsSchema,
  goals: stepGoalsSchema,
  connect: stepConnectSchema,
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
```

Export both files from `packages/shared/src/index.ts`.

### Step 3 — Auth service and routes (15 min)

`src/modules/users/users.service.ts` — the serializer used everywhere for the signed-in user:

```ts
import type { User } from '../../generated/prisma/client';

export function toMe(u: User) {
  const { passwordHash, emailVerified, consentAt, createdAt, updatedAt, ...rest } = u;
  return rest;
}
```

`src/modules/auth/auth.service.ts`:

```ts
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { hashPassword, verifyPassword } from '../../lib/password';
import { createVerificationCode, checkVerificationCode } from '../../lib/codes';
import { sendVerificationEmail } from '../../lib/mailer';
import { badRequest, conflict, unauthorized, forbidden, AppError } from '../../lib/errors';
import { slugify } from '../../lib/text';

async function uniqueHandle(fullName: string) {
  const base = slugify(fullName).slice(0, 20) || 'student';
  for (let i = 0; i < 20; i++) {
    const handle = i === 0 ? base : `${base}-${Math.floor(Math.random() * 9000 + 1000)}`;
    if (!(await prisma.user.findUnique({ where: { handle } }))) return handle;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function allowedRoleFor(email: string) {
  const invite = await prisma.allowedEmail.findUnique({ where: { email } });
  if (invite) return invite.role;
  const domain = email.split('@')[1] ?? '';
  if (env.ALLOWED_EMAIL_DOMAINS.includes(domain)) return 'STUDENT' as const;
  return null;
}

export async function register(input: { fullName: string; email: string; password: string }) {
  const role = await allowedRoleFor(input.email);
  if (!role) throw badRequest('Use your college email address. Alumni can ask an admin for an invite.', { email: 'Not a college email address' });

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing?.emailVerified) throw conflict('An account with this email already exists. Please log in.');

  const passwordHash = await hashPassword(input.password);
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { fullName: input.fullName, passwordHash } });
  } else {
    await prisma.user.create({
      data: { email: input.email, passwordHash, fullName: input.fullName, handle: await uniqueHandle(input.fullName), role },
    });
  }
  const code = await createVerificationCode(input.email);
  await sendVerificationEmail(input.email, code);
  return { email: input.email };
}

export async function verify(email: string, code: string) {
  const result = await checkVerificationCode(email, code);
  if (result === 'locked') throw new AppError(429, 'RATE_LIMITED', 'Too many wrong codes. Request a new code.');
  if (result === 'expired') throw badRequest('This code has expired. Request a new one.', { code: 'Expired' });
  if (result === 'invalid') throw badRequest('That code is not right. Check your email and try again.', { code: 'Incorrect code' });
  return prisma.user.update({ where: { email }, data: { emailVerified: true } });
}

export async function resend(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    const code = await createVerificationCode(email);
    await sendVerificationEmail(email, code);
  }
  // Always succeed so attackers can't learn which emails exist
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw unauthorized('Email or password is incorrect');
  if (!user.emailVerified) throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email first');
  return user;
}

export async function demoLogin(handle: string) {
  if (!env.DEMO_MODE) throw forbidden('Demo login is disabled');
  const user = await prisma.user.findUnique({ where: { handle } });
  if (!user || !user.email.endsWith('@demo.crossroads')) throw forbidden('Not a demo account');
  return user;
}
```

`src/modules/auth/auth.routes.ts`:

```ts
import { Router } from 'express';
import { registerSchema, verifySchema, loginSchema, emailOnlySchema, demoLoginSchema } from '@crossroads/shared';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimits';
import { requireAuth } from '../../middleware/auth';
import { signSession } from '../../lib/jwt';
import { setSessionCookie, clearSessionCookie } from '../../lib/cookies';
import { prisma } from '../../lib/prisma';
import { toMe } from '../users/users.service';
import * as auth from './auth.service';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), async (req, res) => {
  res.status(201).json({ data: await auth.register(req.valid.body) });
});

authRouter.post('/verify', authLimiter, validate({ body: verifySchema }), async (req, res) => {
  const user = await auth.verify(req.valid.body.email, req.valid.body.code);
  setSessionCookie(res, signSession(user.id, user.role));
  res.json({ data: toMe(user) });
});

authRouter.post('/resend-code', authLimiter, validate({ body: emailOnlySchema }), async (req, res) => {
  await auth.resend(req.valid.body.email);
  res.json({ data: { ok: true } });
});

authRouter.post('/login', authLimiter, validate({ body: loginSchema }), async (req, res) => {
  const user = await auth.login(req.valid.body.email, req.valid.body.password);
  setSessionCookie(res, signSession(user.id, user.role));
  res.json({ data: toMe(user) });
});

authRouter.post('/logout', requireAuth, (_req, res) => {
  clearSessionCookie(res);
  res.json({ data: { ok: true } });
});

authRouter.get('/me', async (req, res) => {
  if (!req.user) return res.json({ data: null });
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ data: user ? toMe(user) : null });
});

authRouter.post('/demo-login', validate({ body: demoLoginSchema }), async (req, res) => {
  const user = await auth.demoLogin(req.valid.body.handle);
  setSessionCookie(res, signSession(user.id, user.role));
  res.json({ data: toMe(user) });
});
```

Add `src/lib/text.ts` from `TRD.md` §11.1 now (it provides `slugify`, `normalizeTag`, `titleCase`, `jaccard`).

### Step 4 — Onboarding endpoint (10 min)

Add to `users.service.ts`:

```ts
import { prisma } from '../../lib/prisma';
import { normalizeTag } from '../../lib/text';
import { badRequest } from '../../lib/errors';
import type { OnboardingInput } from '@crossroads/shared';

const YEAR = { FIRST_YEAR: 1, SECOND_YEAR: 2, THIRD_YEAR: 3, FINAL_YEAR: 4, ALUMNI: null } as const;

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  const current = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const { about, skills, goals, connect } = input;

  // Role is decided here, never by the client
  const invited = await prisma.allowedEmail.findUnique({ where: { email: current.email } });
  let role: 'ADMIN' | 'ALUMNI' | 'SENIOR' | 'STUDENT';
  if (current.role === 'ADMIN') role = 'ADMIN';
  else if (about.status === 'ALUMNI') {
    if (invited?.role !== 'ALUMNI') throw badRequest('Alumni accounts need an invite from an admin.', { 'about.status': 'Ask an admin to invite you as alumni' });
    role = 'ALUMNI';
  } else role = about.status === 'FINAL_YEAR' ? 'SENIOR' : 'STUDENT';

  const uniq = (xs: string[]) => [...new Set(xs.map(normalizeTag).filter(Boolean))];

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        role,
        department: about.department,
        batchYear: about.batchYear,
        currentYear: YEAR[about.status],
        company: about.company || null,
        jobTitle: about.jobTitle || null,
        bio: about.bio ?? '',
        skills: uniq(skills.skills),
        interests: uniq(skills.interests),
        goalTrack: goals.goalTrack,
        targetRoles: uniq(goals.targetRoles),
        targetCompanies: goals.targetCompanies,
        canHelpWith: uniq(connect.canHelpWith),
        lookingFor: uniq(connect.lookingFor),
        linkedinUrl: connect.linkedinUrl || null,
        githubUrl: connect.githubUrl || null,
        showEmail: connect.showEmail,
        showLinkedin: connect.showLinkedin,
        showGithub: connect.showGithub,
        consentAt: new Date(),
        onboarded: true,
      },
    });
    await tx.topicFollow.deleteMany({ where: { userId } });
    await tx.topicFollow.createMany({ data: goals.followTopicIds.map((topicId) => ({ userId, topicId })), skipDuplicates: true });
    // Sensible default alerts: followed topics
    await tx.alertSubscription.upsert({
      where: { userId },
      update: { topicIds: goals.followTopicIds },
      create: { userId, topicIds: goals.followTopicIds, opportunityTypes: ['INTERNSHIP', 'HACKATHON'] },
    });
    return user;
  });
}
```

> The rule: **ADMIN stays ADMIN; invited alumni → ALUMNI; final year → SENIOR; everyone else → STUDENT.** If your college gives alumni permanent addresses on an allowed domain, you can relax the alumni check to accept that domain too.

`src/modules/users/users.routes.ts`:

```ts
import { Router } from 'express';
import { onboardingSchema } from '@crossroads/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { completeOnboarding, toMe } from './users.service';

export const usersRouter = Router();

usersRouter.patch('/me/onboarding', requireAuth, validate({ body: onboardingSchema }), async (req, res) => {
  const user = await completeOnboarding(req.user!.id, req.valid.body);
  res.json({ data: toMe(user) });
});
```

`src/routes.ts`:

```ts
import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';

export const routes = Router();
routes.use('/auth', authRouter);
routes.use('/', usersRouter);
// later phases: routes.use('/', peopleRouter); …
```

Update `app.ts`: after `cookieParser()` add `app.use(authOptional)` and `app.use(jsonOnly)`; replace the comment with `app.use('/api', routes)` (keep it **before** the `/api` not-found handler).

### Step 5 — Test the API with curl (5 min)

```bash
# register (domain must be in ALLOWED_EMAIL_DOMAINS)
curl -i -X POST localhost:4000/api/auth/register -H 'Content-Type: application/json' \
  -d '{"fullName":"Test Student","email":"test@am.students.amrita.edu","password":"secret123"}'
# read the code from the API log: [DEV] Verification code for … : 123456
curl -i -c jar.txt -X POST localhost:4000/api/auth/verify -H 'Content-Type: application/json' \
  -d '{"email":"test@am.students.amrita.edu","code":"123456"}'
curl -b jar.txt localhost:4000/api/auth/me
```

The `verify` response must include `Set-Cookie: bu_session=…; HttpOnly`.

---

## 5. Step-by-step — Web

### Step 6 — `useMe` and guards (8 min)

`src/hooks/useMe.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { Me } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: () => api<Me | null>('/auth/me'), staleTime: 60_000 });

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST', json: {} }),
    onSuccess: () => { qc.clear(); qc.setQueryData(qk.me, null); navigate('/'); },
  });
}
```

`src/components/guards/Guards.tsx`:

```tsx
import { Navigate, Outlet, useLocation } from 'react-router';
import { useMe } from '@/hooks/useMe';
import { FullPageSpinner } from '@/components/shared/FullPageSpinner';

export function RequireAuth() {
  const { data: me, isLoading } = useMe();
  const loc = useLocation();
  if (isLoading) return <FullPageSpinner />;
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <Outlet />;
}

export function RequireOnboarded() {
  const { data: me } = useMe();
  if (me && !me.onboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function PublicOnly() {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <FullPageSpinner />;
  if (me) return <Navigate to={me.onboarded ? '/home' : '/onboarding'} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { data: me } = useMe();
  if (me?.role !== 'ADMIN') return <Navigate to="/home" replace />;
  return <Outlet />;
}
```

`FullPageSpinner` — a centred logo with a subtle pulse (`animate-pulse`), not a generic spinner, so even loading looks branded.

`src/router.tsx` (structure for the whole build; pages from later phases are added as you build them):

```tsx
export const router = createBrowserRouter([
  { path: '/', element: <PublicOnlyLanding /> },          // landing; redirects signed-in users
  { element: <PublicOnly />, children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/verify', element: <VerifyPage /> },
  ]},
  { path: '/support', element: <SupportPage /> },        // Phase 10
  { path: '/stories', element: <StoriesPage /> },         // Phase 08
  { path: '/stories/:slug', element: <StoryPage /> },     // Phase 08
  { element: <RequireAuth />, children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      { element: <RequireOnboarded />, children: [
          { element: <AppShell />, children: [
              { path: '/home', element: <HomePage /> },
              // Phase 03+: /people, /u/:handle, /requests, …
              { element: <RequireAdmin />, children: [ /* Phase 08: /admin/* */ ] },
          ]},
      ]},
  ]},
  { path: '*', element: <NotFoundPage /> },
]);
```

> The landing page itself can stay public for signed-in users if you prefer; the stories and support pages should stay public so the landing page can link to them.

### Step 7 — Auth pages (12 min)

**`AuthLayout`**: full-height split layout. Left (hidden on mobile): indigo gradient panel with the logo, a quote card ("I wish I had this in my first year." — label it clearly as an example, not a real quote), and three small benefit lines. Right: centred card `max-w-sm w-full`, logo on mobile, title, subtitle, form, footer link.

**`RegisterPage`**

- Fields: Full name, College email (helper text: "Use your college email, e.g. name@<first allowed domain>", built from `GET /api/config`), Password (with a show/hide eye button and a small strength hint: "8+ characters, a letter and a number").
- `useForm({ resolver: zodResolver(registerSchema) })`.
- On submit → `useRegister` → on success `navigate('/verify?email=' + encodeURIComponent(email))` with toast "We sent a 6-digit code to your email".
- On `ApiError` with `fields`, call `setError(field, { message })` for each; otherwise toast the message.
- Link: "Already have an account? Log in".

**`VerifyPage`**

- Reads `email` from the query string; shows "Enter the code sent to **email**".
- `CodeInput`: 6 separate inputs (`inputMode="numeric"`, `autoComplete="one-time-code"` on the first), auto-advance on type, backspace moves back, paste fills all six, auto-submits when complete.
- Resend button with a 30-second cooldown counter ("Resend in 24s").
- On success: `qc.setQueryData(qk.me, me)` then `navigate('/onboarding')`.
- In `DEMO_MODE`, a muted hint under the input: "Demo mode: the code is printed in the API log."

**`LoginPage`**

- Email, password, "Log in" button; link to register.
- On 403 `EMAIL_NOT_VERIFIED`: call resend and navigate to `/verify?email=…` with a toast.
- On success: set `me` cache and navigate to `next` (from the query string, only if it starts with `/`) or `/home`.
- When `GET /api/config` returns `demoMode: true`: a "Demo accounts" section (buttons built from `config.demoAccounts`) below a divider with buttons **Ananya (first year)**, **Rahul (senior)**, **Meera (alumni)**, **Admin** calling `useDemoLogin({ handle })`. These accounts are created in Phase 03 (`seed-users.ts`); the admin exists already (handle `admin`, but its email must end with `@demo.crossroads` for demo login — it does if you kept the default seed email).

`src/features/auth/api.ts` (pattern used by every feature):

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Me, RegisterInput, LoginInput } from '@crossroads/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export const useRegister = () => useMutation({ mutationFn: (b: RegisterInput) => api<{ email: string }>('/auth/register', { method: 'POST', json: b }) });
export const useResend = () => useMutation({ mutationFn: (email: string) => api('/auth/resend-code', { method: 'POST', json: { email } }) });

export function useVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { email: string; code: string }) => api<Me>('/auth/verify', { method: 'POST', json: b }),
    onSuccess: (me) => qc.setQueryData(qk.me, me),
  });
}
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: LoginInput) => api<Me>('/auth/login', { method: 'POST', json: b }),
    onSuccess: (me) => qc.setQueryData(qk.me, me),
  });
}
export function useDemoLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (handle: string) => api<Me>('/auth/demo-login', { method: 'POST', json: { handle } }),
    onSuccess: (me) => { qc.clear(); qc.setQueryData(qk.me, me); },
  });
}
```

### Step 8 — ChipPicker (5 min)

`src/components/shared/ChipPicker.tsx` — used by onboarding, profile edit, filters, posts (tags), teams and more.

| Prop | Type | Notes |
|---|---|---|
| `value` | `string[]` | Selected values (lowercase) |
| `onChange` | `(v: string[]) => void` | |
| `options` | `readonly string[]` | Suggestions (e.g. `SKILLS`) |
| `placeholder` | `string` | "Search or add a skill" |
| `max` | `number?` | Disables adding beyond the limit with a hint |
| `allowCustom` | `boolean` (default true) | Shows "Add 'xyz'" when no exact match |
| `tone` | `'primary' \| 'warm' \| 'neutral'` | Chip colour (help-with = primary, looking-for = warm) |

Behaviour: an input inside a bordered box (`rounded-xl border bg-card px-2 py-1.5 focus-within:ring-2 ring-ring`); selected chips appear inside the box before the input with an × button; typing filters a popover list (max 8 suggestions, keyboard ↑/↓/Enter, Escape closes); Backspace on empty input removes the last chip; values are normalised with `trim().toLowerCase()`; chips display with `titleCase`. Also export a simpler `ChipToggleGroup` (all options shown as toggle chips) for short lists like interests and help vocabulary.

### Step 9 — Onboarding wizard (15 min)

`src/stores/onboardingStore.ts`: Zustand store with `step` (0–3) and `draft` (partial `OnboardingInput`), persisted to `sessionStorage` (wrap access in try/catch).

**Layout:** centred `max-w-2xl` card on a soft background; top: logo, "Step 2 of 4", a 4-segment progress bar (`bg-primary` filled segments, animated width), step title and one-line subtitle; body: the step form; bottom: Back (ghost) and Continue (primary) buttons; last step: "Finish" with spinner. Animate step changes with `motion` (`AnimatePresence`, slide 16px + fade, 180 ms).

Each step uses its own `useForm` with the step schema; Continue validates the step, saves to the store, and advances.

| Step | Title / subtitle | Fields and UI |
|---|---|---|
| 1 About you | "Tell us where you are" / "This helps us show the right people and advice" | **Status** as 5 large selectable cards (First year · Second year · Third year · Final year · Alumni) with icons; **Department** (`Select` from `DEPARTMENTS`); **Graduation year** (number input, prefilled from status); if Alumni: **Current company**, **Current role**; optional **Short bio** (280 chars with counter) |
| 2 Skills and interests | "What do you know and what excites you?" / "Pick a few — you can change these anytime" | `ChipPicker` for skills (suggest `SKILLS`, min 2); `ChipToggleGroup` for interests (`INTERESTS`, min 2) |
| 3 Goals | "Where are you heading?" / "No pressure — 'Still exploring' is a great answer" | **Goal track** as 8 cards from `GOAL_TRACKS` (icon, label, description); **Target roles** `ChipPicker` (`TARGET_ROLES`, max 5); **Target companies** multi-select from `GET /companies` (built in Phase 06; until then hide this field or seed a static list); **Topics to follow** — topic cards from `GET /topics` (real ids), preselected from each topic's `relatedInterests` in shared constants, falling back to `DEFAULT_TOPIC_SLUG` |
| 4 Connect | "How can people help you — and how can you help?" | "I'm looking for" `ChipToggleGroup` (`HELP_VOCAB`, warm tone); "I can help with" (`HELP_VOCAB`, primary tone) — for first years show a hint "Even first years can help with campus life!"; LinkedIn URL, GitHub URL; visibility switches (Show email / LinkedIn / GitHub); consent checkbox: "I agree to share my profile with students and alumni of my college. I can edit or delete it anytime." |

On Finish → `useCompleteOnboarding` → `PATCH /me/onboarding` with the full draft → on success: set `me` cache, clear the store, toast "Welcome to Crossroads, {firstName}! 🎉" (one emoji is fine here), navigate to `/home`.

Server field errors come back as paths like `skills.skills`; map the first segment to the step and jump back to it.

### Step 10 — Shell wiring (3 min)

- `Sidebar` user card: `UserAvatar`, name, `RoleBadge`; for SENIOR/ALUMNI show level from points (Phase 08 adds the progress bar). Clicking goes to `/me`.
- `UserMenu`: avatar trigger; items "My profile" (`/me`), "Edit profile" (`/settings/profile`), "Requests", "Bookmarks", separator, "Sign out" (`useLogout`).
- `/me` route: a tiny component that redirects to `/u/{me.handle}` (profile page built in Phase 03).

Commit:

```bash
git add -A && git commit -m "phase-02: auth and onboarding" && git tag phase-02
```

---

## 6. UI quality checklist

- [ ] Auth pages feel premium: split layout on desktop, single centred card on mobile, generous spacing, branded loading state.
- [ ] Errors appear inline under fields (red text + red border), never as browser alerts.
- [ ] Buttons disable and show a spinner while submitting; double-clicks don't double-submit.
- [ ] Code input supports paste, auto-advance and backspace navigation; works with the phone's one-time-code autofill.
- [ ] Onboarding progress bar animates; Back keeps entered values; refresh mid-wizard keeps the draft.
- [ ] Goal and status cards have clear selected states (indigo border + soft fill + check icon).
- [ ] Onboarding takes under 2 minutes for a new user.

---

## 7. Completion criteria

- [ ] A college-email user can register, verify, onboard and reach `/home`.
- [ ] Non-college emails are rejected with a friendly message (unless allowlisted).
- [ ] Unverified users cannot log in; they are sent to `/verify`.
- [ ] All app routes redirect to `/login` when signed out, and to `/onboarding` when not onboarded.
- [ ] Role is assigned by the server; `role`, `points`, `isVerified` cannot be set through any endpoint built so far.
- [ ] The cookie is `HttpOnly`; `document.cookie` in the browser console does **not** show `bu_session`.
- [ ] Logout clears the cookie and the cached user.

---

## 8. Manual tests

| # | Steps | Expected result |
|---|---|---|
| 2.1 | Visit `/home` signed out | Redirect to `/login?next=%2Fhome` |
| 2.2 | Register with `someone@gmail.com` | Inline error under email: not a college email; no code logged |
| 2.3 | Register with a college email and a 5-character password | Inline password errors |
| 2.4 | Register correctly | Redirect to `/verify`; code appears in the API log |
| 2.5 | Enter a wrong code 5 times | After the 5th, "Too many wrong codes. Request a new code." |
| 2.6 | Resend, then enter the new code | Signed in; redirected to `/onboarding` |
| 2.7 | Log out, log in before verifying a second new account | Redirected to `/verify` with a toast |
| 2.8 | Onboarding: Continue on step 2 with one skill | Inline error "Pick at least 2 skills" |
| 2.9 | Refresh on step 3 | Still on step 3 with earlier answers kept |
| 2.10 | Choose "Final year" and finish | DB: `role = SENIOR`, `currentYear = 4`, `onboarded = true`, topic follows exist, `AlertSubscription` exists |
| 2.11 | Choose "Alumni" with a non-invited student email | 400 "Alumni accounts need an invite"; wizard jumps back to step 1 |
| 2.12 | After onboarding, visit `/onboarding` | Redirect to `/home` (add this redirect inside `OnboardingPage` when `me.onboarded`) |
| 2.13 | `curl -X PATCH localhost:4000/api/me/onboarding -H 'Content-Type: application/json' -d '{}'` signed out | 401 |
| 2.14 | `curl -X POST localhost:4000/api/auth/login -H 'Content-Type: text/plain' -d 'x'` | 415 |
| 2.15 | 25 rapid login attempts | 429 "Too many attempts" |
| 2.16 | Mobile 375px: register, verify, onboarding | Usable, nothing cut off, keyboard doesn't hide the Continue button |

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Cookie not set in the browser | Make sure the web app calls `/api/...` through the Vite proxy (same origin), `credentials: 'include'` is set, and `secure` is false locally |
| `req.user` always undefined | `authOptional` must run after `cookieParser()` and before the routes |
| zod `literal(true)` error message option fails | zod v4 changed error customisation (`{ error: '…' }`); check your zod version |
| Demo login says "Not a demo account" | Demo users must have emails ending in `@demo.crossroads` and `DEMO_MODE=true` |
| Onboarding 400 with `about.company` | Alumni must fill company and role (refinement in `stepAboutSchema`) |

---

## 10. If you're behind

- Skip the 6-box `CodeInput` (use one input with `inputMode="numeric"`).
- Skip the split-screen auth layout (centred card only).
- Collapse onboarding into 3 steps (merge Goals and Connect).
- Keep: domain rule, verification, guards, server-side role assignment, demo login.
