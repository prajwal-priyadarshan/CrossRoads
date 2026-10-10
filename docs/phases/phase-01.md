# Phase 01 — Database schema, search setup and base seed

| | |
|---|---|
| **Time box** | 0:40 (cumulative 1:30) |
| **Goal** | A hosted PostgreSQL database with the **complete** data model for every feature, search extensions and indexes, and base data (topics, badges, clubs, companies, This Week events, an admin account) |
| **Prerequisites** | Phase 00 complete; a Neon account (or Supabase project) |
| **PRD features** | Foundation for all features; seeds F11 topic communities |
| **Reference** | `TRD.md` §5 (schema), §6 (search), §16.1 (database deployment) |

> ⚠️ Prisma's recent releases changed how the client generator and configuration are set up. Run `npx prisma init` with the version you install, **keep the generator and datasource blocks it creates**, and add the models from `TRD.md` §5.2. Check the Prisma docs for Neon (pooled vs direct connection strings).


> **Implementation notes (verified build, Prisma 7.10).** Pin Prisma (`npm i -E prisma@7.10.0 @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 pg`); npm's `latest` tag can point at a release candidate.
> - `schema.prisma` has `generator client { provider = "prisma-client"; output = "../src/generated/prisma" }` and a datasource with only `provider = "postgresql"`. The connection URL lives in **`apps/api/prisma.config.ts`** (uses `DIRECT_URL` for the CLI). `src/generated` is gitignored; `npm run build` runs `prisma generate`.
> - The runtime client needs the pg driver adapter and the pooled URL (see the corrected `src/lib/prisma.ts` below), plus a raised interactive-transaction timeout: Neon is a network hop away and multi-query transactions exceed Prisma's 5 s default.
> - Neon URLs: use `sslmode=verify-full` and remove `channel_binding=require` (Prisma fails with P1001 when it is present).
> - Seeds read demo emails from `DEMO_EMAIL_SUFFIX` and the admin from `SEED_ADMIN_*`.

---

## 1. What you will have at the end of this phase

- A Neon Postgres database with all tables from `TRD.md` §5.2.
- `pg_trgm` and `unaccent` extensions plus full-text and trigram indexes.
- `apps/api/src/lib/prisma.ts` exporting a single Prisma client.
- Base seed data:
  - 6 topics (the communities from your notes),
  - 9 badges,
  - 10 clubs,
  - 8 companies with roles, rounds, skills tested and prep roadmaps,
  - 8 This Week events dated relative to today,
  - 1 admin account and an alumni invite allowlist.
- Prisma Studio shows all of it.

Building the **whole** schema now is deliberate: later phases only add API routes and UI, and you never stop mid-feature to write a migration.

---

## 2. Concepts in this phase

- **Pooled vs direct connection:** serverless Postgres providers give a pooled URL (many short connections, used by the running app) and a direct URL (used by migrations). Prisma needs the direct one to run migrations reliably.
- **Polymorphic votes and bookmarks:** `Vote` and `Bookmark` store `targetType` + `targetId` instead of foreign keys, so one table serves posts, comments, experiences, roadmaps and stories.
- **JSON columns** (`rounds`, `steps`, `projects`, `followUps`) keep nested, display-only structures simple. Anything you filter or join on is a real column.
- **Arrays** (`skills`, `tags`, `targetCompanies`) give fast overlap queries (`hasSome`) without join tables. Store values lowercase.

---

## 3. Files to create or change

| File | Purpose |
|---|---|
| `apps/api/prisma/schema.prisma` | Full data model (`TRD.md` §5.2) |
| `apps/api/prisma/sql/search.sql` | Extensions and search indexes (`TRD.md` §6.1) |
| `apps/api/scripts/apply-search-sql.ts` | Runs `search.sql` |
| `apps/api/prisma/seed.ts` | Base data |
| `apps/api/prisma/data/companies.ts` | Company seed data (kept separate for readability) |
| `apps/api/prisma/data/clubs.ts` | Club seed data |
| `apps/api/prisma/data/events.ts` | This Week event seed data |
| `apps/api/src/lib/prisma.ts` | Prisma client singleton |
| `apps/api/src/middleware/errorHandler.ts` | Re-add Prisma `P2002` → 409 handling |
| `apps/api/.env` | `DATABASE_URL`, `DIRECT_URL` |
| `packages/shared/src/types.ts` | Shared enum string unions used by the web app |

---

## 4. Step-by-step

### Step 1 — Create the database (5 min)

1. In Neon, create a project named `crossroads` (choose the region closest to India that is offered).
2. Open **Connection details**. Copy:
   - the **pooled** connection string → `DATABASE_URL`
   - the **direct** (non-pooled) connection string → `DIRECT_URL`
3. Add both to `apps/api/.env`. Use `sslmode=verify-full` and **delete `&channel_binding=require`** if Neon added it (Prisma cannot connect with it).

```
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=verify-full"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=verify-full"
```

> Using Supabase instead? Use its "Transaction pooler" string for `DATABASE_URL` and the direct database string for `DIRECT_URL`. Don't use Supabase Auth — authentication lives in your API.

### Step 2 — Install and initialise Prisma (5 min)

```bash
cd apps/api
npm i @prisma/client
npm i -D prisma
npx prisma init
```

- Keep the generator and datasource blocks `init` creates. If it doesn't add `directUrl`, add it as shown in `TRD.md` §5.2 **or** in `prisma.config.ts` if your version uses that file (⚠️ check the docs).
- If the generator writes the client to a custom `output` folder (newer `prisma-client` generator), note the import path — you'll import `PrismaClient` and `Prisma` from there instead of `@prisma/client` everywhere in these docs.

### Step 3 — Paste the schema and migrate (10 min)

1. Paste every `enum` and `model` from `TRD.md` §5.2 into `prisma/schema.prisma` below the generator/datasource.
2. Format and validate:

```bash
npx prisma format
npx prisma validate
```

Fix any relation errors it reports (the usual cause is a missing back-relation field; the error message names it).

3. Create and apply the first migration:

```bash
npx prisma migrate dev --name init
```

This creates `prisma/migrations/<timestamp>_init/migration.sql`, applies it and generates the client.

4. `src/lib/prisma.ts`:

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { env, isProd } from '../config/env';

// Prisma 7 connects through a driver adapter; the running app uses the pooled DATABASE_URL
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    transactionOptions: { maxWait: 10_000, timeout: 20_000 }, // Neon round trips add up inside transactions
  });

if (!isProd) globalForPrisma.prisma = prisma; // avoid many clients during tsx watch reloads
```

5. Re-add the `P2002` (unique violation) branch to `errorHandler.ts` from `TRD.md` §7.1.

### Step 4 — Search extensions and indexes (5 min)

1. Create `prisma/sql/search.sql` with the contents of `TRD.md` §6.1.
2. `scripts/apply-search-sql.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

const here = path.dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(path.join(here, '../prisma/sql/search.sql'), 'utf8');

// Split on semicolons at line ends; our file has no functions or $$ blocks.
const statements = sql
  .split(/;\s*$/m)
  .map((s) => s.replace(/--.*$/gm, '').trim())
  .filter(Boolean);

for (const stmt of statements) {
  await prisma.$executeRawUnsafe(stmt); // static SQL from our own file, no user input
  console.log('✓', stmt.split('\n')[0].slice(0, 80));
}
await prisma.$disconnect();
```

3. Run `npm run db:search`. Every statement prints a ✓.

> **From now on**, whenever you add a migration later, use `npx prisma migrate dev --create-only --name <name>`, open the generated SQL, and **delete any `DROP INDEX` lines for the search indexes** before running `npx prisma migrate dev` to apply it. If they disappear, re-run `npm run db:search`.

### Step 5 — Seed data files (10 min)

**Companies** — `prisma/data/companies.ts`. Use companies that genuinely visit your campus if you know the details are accurate; otherwise use clearly fictional names (for example "Northwind Labs") so nobody mistakes demo data for real information. Each company needs:

```ts
export const companies = [
  {
    slug: 'northwind-labs',
    name: 'Northwind Labs',
    description: 'Product company building developer tools. (Demo data)',
    website: null,
    visitMonth: 'August',
    roles: ['software engineer', 'ml engineer'],
    rounds: [
      { name: 'Online assessment', type: 'CODING', description: '2 coding problems + MCQs on CS fundamentals, 90 minutes' },
      { name: 'Technical interview 1', type: 'TECHNICAL', description: 'DSA problem solving + discussion of a project' },
      { name: 'Technical interview 2', type: 'TECHNICAL', description: 'System design basics, OOP, DBMS' },
      { name: 'HR interview', type: 'HR', description: 'Motivation, teamwork, relocation' },
    ],
    skillsTested: ['dsa', 'java', 'sql', 'system design', 'operating systems', 'dbms', 'oop'],
    prepRoadmap: [
      { title: 'Arrays, strings, hashing', detail: 'Finish 60 easy/medium problems on these patterns', category: 'OA' },
      { title: 'Aptitude basics', detail: 'Percentages, ratios, time and work — 2 short tests a week', category: 'APTITUDE' },
      { title: 'DBMS and OS revision', detail: 'Normalization, indexing, processes vs threads, deadlocks', category: 'TECHNICAL' },
      { title: 'Project storytelling', detail: 'Prepare a 2-minute explanation of your best project', category: 'HR' },
    ],
  },
  // …7 more: mix product, service, fintech/quant, analytics, core-engineering
];
```

> Note `skillsTested` includes entries (`operating systems`, `dbms`, `oop`) not in `SKILLS`. Add them to `SKILLS` in `packages/shared/src/constants.ts` so students can select them and readiness can match them.

Aim for variety across the 8 companies so readiness, the simulator and Path Twins have interesting data:

| Type | Example skills tested | Round types |
|---|---|---|
| Product (2) | dsa, system design, dbms, os | CODING, TECHNICAL ×2, HR |
| Service (2) | aptitude, java/python, sql, communication | APTITUDE, CODING, TECHNICAL, HR |
| Fintech / quant (1) | probability, statistics, python, dsa | APTITUDE, CODING, TECHNICAL |
| Analytics (1) | sql, excel, statistics, python | APTITUDE, TECHNICAL, HR |
| AI/ML (1) | machine learning, python, deep learning, statistics | CODING, TECHNICAL ×2 |
| Core engineering (1) | embedded systems, c, iot | APTITUDE, TECHNICAL, HR |

**Clubs** — `prisma/data/clubs.ts`: 10 clubs across categories, each with `slug, name, category, description, timeCommitment ("3–5 h/week"), skillsGained (lowercase), recruitmentMonth, joinUrl (null is fine)`. Use real club names only if the details are accurate.

**Events** — `prisma/data/events.ts`: build dates relative to now so the demo always has upcoming items.

```ts
const days = (n: number, hour = 17) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

export const events = [
  { title: 'Coding club recruitment closes', category: 'CLUB', startsAt: days(3, 23), audienceYears: [1, 2] },
  { title: 'Mid-semester exams begin', category: 'EXAM', startsAt: days(6, 9), audienceYears: [1, 2, 3, 4] },
  { title: 'Campus hackathon registrations close', category: 'HACKATHON', startsAt: days(2, 20), link: null },
  { title: 'Northwind Labs pre-placement talk', category: 'PLACEMENT', startsAt: days(4, 16), audienceYears: [3, 4] },
  { title: 'Internship form deadline (summer)', category: 'DEADLINE', startsAt: days(5, 23), audienceYears: [2, 3] },
  { title: 'Freshers meet-the-seniors evening', category: 'EVENT', startsAt: days(1, 18), audienceYears: [1] },
  { title: 'Alumni webinar: breaking into ML roles', category: 'WEBINAR', startsAt: days(9, 19) },
  { title: 'Robotics club demo day', category: 'CLUB', startsAt: days(12, 15) },
];
```

### Step 6 — Seed script (5 min)

`prisma/seed.ts`:

```ts
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { TOPICS, BADGES } from '@crossroads/shared';
import { companies } from './data/companies';
import { clubs } from './data/clubs';
import { events } from './data/events';

async function main() {
  for (const t of TOPICS) {
    await prisma.topic.upsert({ where: { slug: t.slug }, update: { name: t.name, description: t.description, icon: t.icon }, create: { ...t } });
  }
  for (const b of BADGES) {
    await prisma.badge.upsert({ where: { slug: b.slug }, update: { ...b }, create: { ...b } });
  }
  for (const c of companies) {
    await prisma.company.upsert({ where: { slug: c.slug }, update: c as any, create: c as any });
  }
  for (const c of clubs) {
    await prisma.club.upsert({ where: { slug: c.slug }, update: c as any, create: c as any });
  }
  // Events are time-relative: replace them on every seed
  await prisma.event.deleteMany({ where: { category: { in: ['CLUB', 'EXAM', 'HACKATHON', 'PLACEMENT', 'DEADLINE', 'EVENT', 'WEBINAR'] } } });
  await prisma.event.createMany({ data: events as any });

  // Admin account (password from env so it's never committed)
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@demo.crossroads';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      emailVerified: true,
      handle: 'admin',
      fullName: 'Student Council Admin',
      role: 'ADMIN',
      onboarded: true,
      isVerified: true,
    },
  });

  console.log('Seed complete');
}

main().finally(() => prisma.$disconnect());
```

Install bcryptjs now (`npm i bcryptjs -w apps/api` and `npm i -D @types/bcryptjs -w apps/api` if types aren't bundled ⚠️). Run:

```bash
npm run db:seed -w apps/api
npx prisma studio   # from apps/api; opens a browser tab
```

> The `@demo.crossroads` domain is a marker for demo accounts. It is allowed by the demo-login endpoint in Phase 02 only when `DEMO_MODE=true`.

### Step 7 — Shared types (2 min)

`packages/shared/src/types.ts` — string unions mirroring the Prisma enums, so the web app doesn't import Prisma:

```ts
export type Role = 'STUDENT' | 'SENIOR' | 'ALUMNI' | 'ADMIN';
export type GoalTrack = 'PRODUCT' | 'SERVICE' | 'QUANT_FINANCE' | 'RESEARCH' | 'STARTUP' | 'MS' | 'MBA' | 'UNDECIDED';
export type PostKind = 'DISCUSSION' | 'QUESTION' | 'OPPORTUNITY';
export type OpportunityType = 'INTERNSHIP' | 'HACKATHON' | 'RESEARCH' | 'EVENT' | 'REFERRAL' | 'STUDY_GROUP' | 'COLLABORATION' | 'CAREER_GUIDANCE';
export type ConnectionKind = 'CONNECT' | 'MENTORSHIP' | 'COLLAB' | 'PEER_GUIDANCE';
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
export type TeamKind = 'HACKATHON' | 'PROJECT' | 'STARTUP' | 'STUDY_CIRCLE';
export type PrepCategory = 'OA' | 'APTITUDE' | 'TECHNICAL' | 'HR';
export type SimRoundType = 'APTITUDE' | 'CODING' | 'CS_FUNDAMENTALS' | 'TECHNICAL' | 'HR';
export type EventCategory = 'DEADLINE' | 'CLUB' | 'EXAM' | 'HACKATHON' | 'PLACEMENT' | 'EVENT' | 'REUNION' | 'CHAPTER_MEET' | 'WEBINAR';

export type Me = {
  id: string; email: string; handle: string; fullName: string; avatarUrl: string | null; role: Role;
  department: string | null; batchYear: number | null; currentYear: number | null; company: string | null; jobTitle: string | null;
  bio: string; skills: string[]; interests: string[]; targetRoles: string[]; targetCompanies: string[]; goalTrack: GoalTrack | null;
  canHelpWith: string[]; lookingFor: string[]; linkedinUrl: string | null; githubUrl: string | null;
  showEmail: boolean; showLinkedin: boolean; showGithub: boolean; mentorAvailable: boolean; mentorTopics: string[]; mentorSlots: string;
  showOnMentorWall: boolean; isVerified: boolean; onboarded: boolean; points: number;
};

export type UserLite = { id: string; handle: string; fullName: string; avatarUrl: string | null; role: Role; currentYear: number | null; department: string | null; company: string | null; jobTitle: string | null; isVerified: boolean };
```

Export it from `packages/shared/src/index.ts`. More response types are added in later phases.

Commit:

```bash
git add -A && git commit -m "phase-01: schema, search, base seed" && git tag phase-01
```

---

## 5. Checkpoints

| After step | Check |
|---|---|
| 3 | `npx prisma studio` lists every model from `TRD.md` §5.2 (about 30) |
| 4 | In Neon's SQL editor: `select extname from pg_extension;` shows `pg_trgm`; `select indexname from pg_indexes where indexname like '%fts%';` shows the indexes |
| 6 | Studio shows 6 topics, 9 badges, 8 companies, 10 clubs, 8 events, 1 admin |

---

## 6. Completion criteria

- [ ] `npx prisma validate` passes; the `init` migration is committed.
- [ ] Search extensions and indexes exist.
- [ ] Seed runs twice without errors (it is idempotent) and doesn't duplicate rows.
- [ ] `similarity('hello', 'helo')` works in the Neon SQL editor (proves `pg_trgm`).
- [ ] The API still starts (`npm run dev -w apps/api`) with Prisma imported.

---

## 7. Manual tests

| # | Steps | Expected result |
|---|---|---|
| 1.1 | Run `npm run db:seed -w apps/api` twice | No errors; counts unchanged after the second run (except events, which are replaced) |
| 1.2 | In SQL editor: `select slug, name from "Topic" order by id;` | 6 topics in the order of your notes |
| 1.3 | `select name, array_length("skillsTested",1) from "Company";` | 8 companies, each with 4–8 skills |
| 1.4 | `select title, "startsAt" from "Event" order by "startsAt";` | All events in the next 2 weeks |
| 1.5 | `select similarity('which coding club', 'which coding club should I join');` | A value above 0.3 |
| 1.6 | Try inserting two `TopicFollow` rows with the same user and topic in Studio | Second insert fails (composite key) |
| 1.7 | `select email, role from "User";` | Admin row with role `ADMIN`; password is a bcrypt hash, never plain text |

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| `P1001: Can't reach database server` | Remove `channel_binding=require` from the URL, use `sslmode=verify-full`, and check the Neon project isn't suspended |
| Migration hangs or fails with prepared statement errors | You are migrating through the pooled URL; make sure `directUrl` is configured and used for migrations |
| `Error validating: The relation field … is missing an opposite relation field` | Add the back-relation on the other model (the error names the model and field) |
| `type "PostKind" does not exist` in raw SQL | Quote enum type names in casts: `${kind}::"PostKind"` |
| Seed fails on `skillsTested` arrays | Make sure every value is a string; Prisma arrays must not contain `undefined` |

---

## 9. If you're behind

Seed 4 companies and 6 clubs instead of 8 and 10; add the rest in Phase 10. Do **not** skip the full schema or the search SQL.
